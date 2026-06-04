from __future__ import annotations

import re
from collections import defaultdict
from typing import Dict, List

from sqlalchemy.orm import Session

from app.models.models import Dish, Rating


class RecommendationService:
    def __init__(self, db: Session):
        self.db = db

    def get_recommendations_for_dish(self, dish_id: int, top_n: int = 10) -> List[Dict]:
        """Gợi ý món bằng content-based filtering từ dữ liệu thực đơn thật."""
        scores = self._content_based(dish_id)
        sorted_dishes = sorted(scores.items(), key=lambda item: item[1], reverse=True)[:top_n]
        return [{"dish_id": dish_id, "score": score} for dish_id, score in sorted_dishes]

    def _tokens(self, value: str | None) -> set[str]:
        return {item.strip().casefold() for item in re.split(r"[,|]", str(value or "")) if item.strip()}

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
            scores[other.id] = keyword_score * 0.35 + same_cluster * 0.25 + same_category * 0.2 + price_score * 0.2

        return scores

    def get_recommendations_for_cart(self, dish_ids: List[int], top_n: int = 10) -> List[Dict]:
        all_recommendations = defaultdict(float)
        for dish_id in dish_ids:
            for rec in self.get_recommendations_for_dish(dish_id, top_n=20):
                rec_id = rec["dish_id"]
                if rec_id not in dish_ids:
                    all_recommendations[rec_id] += rec["score"]

        sorted_recs = sorted(all_recommendations.items(), key=lambda item: item[1], reverse=True)[:top_n]
        return [{"dish_id": dish_id, "score": score} for dish_id, score in sorted_recs]

    def get_trending_dishes(self, top_n: int = 10) -> List[Dict]:
        """Top món nổi bật. Nếu chưa có rating, lấy theo thực đơn đã xử lý."""
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

        fallback = (
            self.db.query(Dish)
            .filter(Dish.is_active == 1)
            .order_by(Dish.sort_order.asc(), Dish.id.asc())
            .limit(top_n)
            .all()
        )
        return [{"dish_id": dish.id, "avg_rating": 0, "total_ratings": 0} for dish in fallback]
