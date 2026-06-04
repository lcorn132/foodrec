from __future__ import annotations

import re
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, List

from sqlalchemy.orm import Session

from app.models.models import Dish, Rating


class RecommendationService:
    def __init__(self, db: Session):
        self.db = db

    def get_recommendations_for_dish(self, dish_id: int, top_n: int = 10) -> List[Dict]:
        """Gợi ý món tương đồng bằng content-based filtering từ thực đơn thật."""
        scores = self._content_based(dish_id)
        sorted_dishes = sorted(scores.items(), key=lambda item: item[1], reverse=True)[:top_n]
        return [{"dish_id": dish_id, "score": score} for dish_id, score in sorted_dishes]

    def _tokens(self, value: str | None) -> set[str]:
        return {item.strip().casefold() for item in re.split(r"[,|]", str(value or "")) if item.strip()}

    def _text(self, dish: Dish) -> str:
        return " ".join(
            str(value or "").casefold()
            for value in (dish.name, dish.category, dish.dish_type, dish.ingredients, dish.detailed_ingredients, dish.tags)
        )

    def _meal_role(self, dish: Dish) -> str:
        text = self._text(dish)
        rice_terms = ("nền tảng", "mon-com-nieu", "cơm niêu", "cơm đập", "cơm chiên", "cơm trắng")
        if any(term in text for term in rice_terms):
            return "foundation"
        if "thanh mát" in text or "rau" in text or "canh" in text:
            return "fresh"
        if "tiệc" in text or "lẩu" in text or "lau" in text or "set menu" in text or "hải sản" in text or "khai vị" in text:
            return "feast"
        if "mặn" in text or "heo" in text or "cá" in text or "gà" in text or "bò" in text or "thịt" in text:
            return "savory"
        return "savory"

    def _content_based(self, dish_id: int) -> Dict[int, float]:
        dish = self.db.query(Dish).filter(Dish.id == dish_id).first()
        if not dish:
            return {}

        dish_tokens = self._tokens(dish.ingredients) | self._tokens(dish.detailed_ingredients) | self._tokens(dish.tags)
        dish_price = max(int(dish.price or 0), 1)
        scores: Dict[int, float] = {}

        for other in self.db.query(Dish).filter(Dish.id != dish_id, Dish.is_active == 1).all():
            other_tokens = self._tokens(other.ingredients) | self._tokens(other.detailed_ingredients) | self._tokens(other.tags)
            union = dish_tokens | other_tokens
            keyword_score = len(dish_tokens & other_tokens) / len(union) if union else 0
            same_cluster = 1.0 if dish.dish_type and dish.dish_type == other.dish_type else 0.0
            same_category = 1.0 if dish.category and dish.category == other.category else 0.0
            other_price = max(int(other.price or 0), 1)
            price_score = 1 - min(abs(dish_price - other_price) / max(dish_price, other_price), 1)
            role_score = 1.0 if self._meal_role(dish) == self._meal_role(other) else 0.0
            scores[other.id] = (
                keyword_score * 0.3
                + same_cluster * 0.22
                + same_category * 0.18
                + price_score * 0.2
                + role_score * 0.1
            )

        return scores

    def get_recommendations_for_cart(self, dish_ids: List[int], top_n: int = 10) -> List[Dict]:
        cart_dishes = self.db.query(Dish).filter(Dish.id.in_(dish_ids), Dish.is_active == 1).all()
        if not cart_dishes:
            return []

        cart_roles = {self._meal_role(dish) for dish in cart_dishes}
        target_roles = self._target_roles_for_cart(cart_roles)
        all_recommendations: defaultdict[int, float] = defaultdict(float)

        for dish_id in [dish.id for dish in cart_dishes]:
            for rec in self.get_recommendations_for_dish(dish_id, top_n=20):
                rec_id = rec["dish_id"]
                if rec_id not in dish_ids:
                    all_recommendations[rec_id] += rec["score"]

        for candidate in self.db.query(Dish).filter(Dish.is_active == 1).all():
            if candidate.id in dish_ids:
                continue
            role = self._meal_role(candidate)
            if role in target_roles:
                all_recommendations[candidate.id] += 0.85
            if role == "fresh" and {"foundation", "savory"}.issubset(cart_roles):
                all_recommendations[candidate.id] += 0.35
            if role == "feast" and "feast" in cart_roles:
                all_recommendations[candidate.id] += 0.2

        sorted_recs = sorted(all_recommendations.items(), key=lambda item: item[1], reverse=True)[:top_n]
        return [{"dish_id": dish_id, "score": score} for dish_id, score in sorted_recs]

    def _target_roles_for_cart(self, roles: set[str]) -> set[str]:
        if "feast" in roles:
            return {"fresh", "feast"}
        if {"foundation", "savory"}.issubset(roles):
            return {"fresh"}
        if "foundation" in roles:
            return {"savory", "fresh"}
        if "savory" in roles:
            return {"foundation", "fresh"}
        if "fresh" in roles:
            return {"foundation", "savory"}
        return {"savory", "fresh"}

    def get_trending_dishes(self, top_n: int = 10) -> List[Dict]:
        """Top món nổi bật. Nếu chưa có rating, ưu tiên theo ngữ cảnh thời gian Việt Nam."""
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

        if trending:
            return [
                {"dish_id": row.dish_id, "avg_rating": float(row.avg_rating), "total_ratings": row.count}
                for row in trending
            ]

        dishes = self.db.query(Dish).filter(Dish.is_active == 1).all()
        hour = (datetime.utcnow() + timedelta(hours=7)).hour

        def contextual_score(dish: Dish) -> tuple[int, int, int]:
            role = self._meal_role(dish)
            if 10 <= hour < 14:
                priority = {"foundation": 0, "savory": 1, "fresh": 2, "feast": 3}.get(role, 4)
            elif 17 <= hour < 22:
                priority = {"feast": 0, "savory": 1, "fresh": 2, "foundation": 3}.get(role, 4)
            else:
                priority = {"savory": 0, "fresh": 1, "foundation": 2, "feast": 3}.get(role, 4)
            return (priority, int(dish.sort_order or 0), int(dish.id or 0))

        fallback = sorted(dishes, key=contextual_score)[:top_n]
        return [{"dish_id": dish.id, "avg_rating": 0, "total_ratings": 0} for dish in fallback]
