from __future__ import annotations

import re
import unicodedata
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List

from sqlalchemy.orm import Session

from app.models.models import Dish, Rating


class RecommendationService:
    def __init__(self, db: Session):
        self.db = db

    def get_recommendations_for_dish(self, dish_id: int, top_n: int = 10) -> List[Dict]:
        """Intra-cluster KNN/Cosine-style recommendations for "Có thể bạn cũng thích"."""
        scores = self._intra_cluster_scores(dish_id)
        sorted_dishes = sorted(scores.items(), key=lambda item: item[1], reverse=True)[:top_n]
        return [{"dish_id": rec_id, "score": score, "strategy": "intra_cluster_knn"} for rec_id, score in sorted_dishes]

    def get_recommendations_for_cart(self, dish_ids: List[int], top_n: int = 10) -> List[Dict]:
        """Cross-cluster mapping to complete a Vietnamese meal from the current cart."""
        cart_dishes = self.db.query(Dish).filter(Dish.id.in_(dish_ids), Dish.is_active == 1).all()
        if not cart_dishes:
            return []

        target_roles, target_categories = self._target_rules_for_cart(cart_dishes)
        cart_ids = {dish.id for dish in cart_dishes}
        cart_roles = {self._meal_role(dish) for dish in cart_dishes}
        cart_categories = {self._category_slug(dish) for dish in cart_dishes}
        cart_text = " ".join(self._text(dish) for dish in cart_dishes)
        recommendations: defaultdict[int, float] = defaultdict(float)

        for candidate in self.db.query(Dish).filter(Dish.is_active == 1).all():
            if candidate.id in cart_ids:
                continue

            role = self._meal_role(candidate)
            category = self._category_slug(candidate)
            score = 0.0

            if self._is_set_menu(candidate):
                continue
            if self._is_noodle_extra(candidate) and not self._cart_supports_noodle_extra(cart_text):
                continue

            # Do not keep recommending a meal role that is already covered in
            # the cart. Example: once a soup/vegetable dish is present, avoid
            # more "fresh" items and focus on the missing rice/savory side.
            if role in cart_roles and role not in target_roles:
                continue

            if role in target_roles:
                score += 1.25
            if any(target in category for target in target_categories):
                score += 1.0
            if "appetizer_drink" in target_categories and self._is_appetizer_or_drink(candidate):
                score += 1.15

            # Cross-cluster suggestions should not be drowned out by more of the same.
            if category in cart_categories:
                score -= 0.25

            if score <= 0:
                continue

            similarity = max((self._similarity_score(cart_dish, candidate) for cart_dish in cart_dishes), default=0)
            price_bonus = 0.12 if 0 < int(candidate.price or 0) <= 180000 else 0.0
            recommendations[candidate.id] = score + similarity * 0.35 + price_bonus

        sorted_recs = sorted(recommendations.items(), key=lambda item: item[1], reverse=True)[:top_n]
        return [{"dish_id": rec_id, "score": score, "strategy": "cross_cluster_mapping"} for rec_id, score in sorted_recs]

    def get_trending_dishes(self, top_n: int = 10) -> List[Dict]:
        """Trending with contextual fallback by real-time Vietnam meal period."""
        from sqlalchemy import func

        trending = (
            self.db.query(
                Rating.dish_id,
                func.avg(Rating.rating).label("avg_rating"),
                func.count(Rating.id).label("count"),
            )
            .group_by(Rating.dish_id)
            .having(func.count(Rating.id) >= 3)
            .order_by(func.avg(Rating.rating).desc(), func.count(Rating.id).desc())
            .limit(top_n)
            .all()
        )

        hour = (datetime.utcnow() + timedelta(hours=7)).hour
        rating_map = {
            row.dish_id: {"avg_rating": float(row.avg_rating), "total_ratings": row.count}
            for row in trending
        }
        dishes = self.db.query(Dish).filter(Dish.is_active == 1).all()

        def sort_key(dish: Dish) -> tuple[float, int, int]:
            priority, sort_order, dish_id = self._contextual_sort_key(dish, hour)
            rating = rating_map.get(dish.id, {})
            rating_boost = min(float(rating.get("avg_rating", 0)) / 5, 1) * 0.25
            count_boost = min(int(rating.get("total_ratings", 0)), 10) * 0.01
            return (priority - rating_boost - count_boost, sort_order, dish_id)

        selected = sorted(dishes, key=sort_key)[:top_n]
        return [
            {
                "dish_id": dish.id,
                "avg_rating": rating_map.get(dish.id, {}).get("avg_rating", 0),
                "total_ratings": rating_map.get(dish.id, {}).get("total_ratings", 0),
            }
            for dish in selected
        ]

    def _slug(self, value: str | None) -> str:
        text = unicodedata.normalize("NFD", str(value or "").casefold())
        text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
        text = re.sub(r"[^a-z0-9]+", " ", text)
        return re.sub(r"\s+", " ", text).strip()

    def _tokens(self, value: str | None) -> set[str]:
        return {self._slug(item) for item in re.split(r"[,|]", str(value or "")) if item.strip()}

    def _text(self, dish: Dish) -> str:
        return self._slug(
            " ".join(
                str(value or "")
                for value in (dish.name, dish.category, dish.dish_type, dish.ingredients, dish.detailed_ingredients, dish.tags)
            )
        )

    def _category_slug(self, dish: Dish) -> str:
        return self._slug(dish.category)

    def _meal_role(self, dish: Dish) -> str:
        text = self._text(dish)
        if any(term in text for term in ("cum 1", "nen tang", "mon com nieu", "com nieu", "com dap", "com chien", "com trang")):
            return "foundation"
        if any(term in text for term in ("cum 3", "thanh mat", "rau", "canh")):
            return "fresh"
        if any(term in text for term in ("cum 4", "tiec", "lau", "set menu", "khai vi")):
            return "feast"
        if any(term in text for term in ("cum 2", "man", "heo", "ca", "ga", "bo", "thit", "hai san")):
            return "savory"
        return "savory"

    def _is_appetizer_or_drink(self, dish: Dish) -> bool:
        text = self._text(dish)
        category = self._category_slug(dish)
        if self._is_noodle_extra(dish):
            return False
        return any(term in text or term in category for term in ("khai vi", "do uong", "nuoc", "tra", "trang mieng"))

    def _is_noodle_extra(self, dish: Dish) -> bool:
        text = self._text(dish)
        category = self._category_slug(dish)
        return ("mon them" in category or "mon them" in text) and any(term in text for term in ("mi", "bun"))

    def _is_set_menu(self, dish: Dish) -> bool:
        text = self._text(dish)
        category = self._category_slug(dish)
        return "set menu" in text or "set menu" in category

    def _cart_supports_noodle_extra(self, cart_text: str) -> bool:
        return any(term in cart_text for term in ("lau", "bun", "mi", "nuoc leo", "nuoc dung"))

    def _similarity_score(self, source: Dish, target: Dish) -> float:
        source_tokens = self._tokens(source.ingredients) | self._tokens(source.detailed_ingredients) | self._tokens(source.tags)
        target_tokens = self._tokens(target.ingredients) | self._tokens(target.detailed_ingredients) | self._tokens(target.tags)
        union = source_tokens | target_tokens
        keyword_score = len(source_tokens & target_tokens) / len(union) if union else 0
        same_category = 1.0 if source.category and source.category == target.category else 0.0
        source_price = max(int(source.price or 0), 1)
        target_price = max(int(target.price or 0), 1)
        price_score = 1 - min(abs(source_price - target_price) / max(source_price, target_price), 1)
        return keyword_score * 0.5 + same_category * 0.25 + price_score * 0.25

    def _intra_cluster_scores(self, dish_id: int) -> Dict[int, float]:
        dish = self.db.query(Dish).filter(Dish.id == dish_id).first()
        if not dish:
            return {}

        source_role = self._meal_role(dish)
        scores: Dict[int, float] = {}
        for other in self.db.query(Dish).filter(Dish.id != dish_id, Dish.is_active == 1).all():
            same_cluster = bool(dish.dish_type and other.dish_type and dish.dish_type == other.dish_type)
            same_role = source_role == self._meal_role(other)
            if not same_cluster and not same_role:
                continue
            cluster_bonus = 0.35 if same_cluster else 0.18
            scores[other.id] = self._similarity_score(dish, other) + cluster_bonus
        return scores

    def _target_rules_for_cart(self, dishes: list[Dish]) -> tuple[set[str], set[str]]:
        roles = {self._meal_role(dish) for dish in dishes}
        text = " ".join(self._text(dish) for dish in dishes)

        if "feast" in roles or "lau" in text:
            return set(), {"khai vi", "mon them", "trang mieng", "appetizer_drink"}
        if {"foundation", "savory", "fresh"}.issubset(roles):
            return set(), {"khai vi", "trang mieng", "appetizer_drink"}
        if {"foundation", "savory"}.issubset(roles):
            return {"fresh"}, {"rau", "canh"}
        if {"savory", "fresh"}.issubset(roles):
            return {"foundation"}, {"com"}
        if {"foundation", "fresh"}.issubset(roles):
            return {"savory"}, {"heo", "ga", "bo", "ca", "hai san"}
        if "foundation" in roles:
            return {"savory", "fresh"}, {"heo", "ga", "bo", "ca", "hai san", "rau", "canh"}
        if "savory" in roles:
            return {"foundation", "fresh"}, {"com", "rau", "canh"}
        if "fresh" in roles:
            return {"foundation", "savory"}, {"com", "heo", "ga", "bo", "ca", "hai san"}
        return {"savory", "fresh"}, {"rau", "canh"}

    def _contextual_sort_key(self, dish: Dish, hour: int) -> tuple[float, int, int]:
        role = self._meal_role(dish)
        text = self._text(dish)
        price = int(dish.price or 0)

        if 10 <= hour < 14:
            priority = {"foundation": 0, "savory": 1, "fresh": 2, "feast": 4}.get(role, 5)
            if "com" in text or 0 < price <= 180000:
                priority -= 0.4
        elif 17 <= hour < 22:
            priority = {"feast": 0, "savory": 1, "fresh": 2, "foundation": 3}.get(role, 4)
            if "lau" in text or "set menu" in text or "tiec" in text:
                priority -= 0.5
        else:
            priority = {"savory": 0, "fresh": 1, "foundation": 2, "feast": 3}.get(role, 4)

        return (priority, int(dish.sort_order or 0), int(dish.id or 0))
