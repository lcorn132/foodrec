from collections import defaultdict
from typing import Dict, List

from sqlalchemy.orm import Session

from app.models.models import Dish
from app.models.models import Order
from app.models.models import Rating


class RecommendationService:
    def __init__(self, db: Session):
        self.db = db

    def get_recommendations_for_dish(self, dish_id: int, top_n: int = 10) -> List[Dict]:
        """Gợi ý món dựa chủ yếu trên luật kết hợp từ set menu đã làm sạch."""

        # 1. Mức độ tương tự nội dung, dùng như tín hiệu phụ.
        content_scores = self._content_based(dish_id)

        # 2. Luật kết hợp Apriori từ set menu công khai, là tín hiệu chính của đề tài.
        association_scores = self._association_based(dish_id)

        all_dish_ids = set(list(content_scores.keys()) + list(association_scores.keys()))

        final_scores = {}
        for did in all_dish_ids:
            if did != dish_id:
                score = content_scores.get(did, 0) * 0.3 + association_scores.get(did, 0) * 0.7
                final_scores[did] = score

        # Sort and return top N
        sorted_dishes = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)[
            :top_n
        ]

        return [{"dish_id": d[0], "score": d[1]} for d in sorted_dishes]

    def _content_based(self, dish_id: int) -> Dict[int, float]:
        """Tính similarity dựa trên ingredients và tags (Jaccard similarity)"""

        dish = self.db.query(Dish).filter(Dish.id == dish_id).first()
        if not dish:
            return {}

        # Parse ingredients and tags
        dish_ingredients = set(
            [
                ing.strip()
                for ing in str(dish.detailed_ingredients).split(",")
                if ing.strip()
            ]
        )
        dish_tags = set(
            [tag.strip() for tag in str(dish.tags).split(",") if tag.strip()]
        )

        # Calculate similarity with all other dishes
        all_dishes = self.db.query(Dish).filter(Dish.id != dish_id).all()
        scores = {}

        for other in all_dishes:
            other_ingredients = set(
                [
                    ing.strip()
                    for ing in str(other.detailed_ingredients).split(",")
                    if ing.strip()
                ]
            )
            other_tags = set(
                [tag.strip() for tag in str(other.tags).split(",") if tag.strip()]
            )

            # Jaccard similarity for ingredients
            if dish_ingredients and other_ingredients:
                ingredient_sim = len(dish_ingredients & other_ingredients) / len(
                    dish_ingredients | other_ingredients
                )
            else:
                ingredient_sim = 0

            # Jaccard similarity for tags
            if dish_tags and other_tags:
                tag_sim = len(dish_tags & other_tags) / len(dish_tags | other_tags)
            else:
                tag_sim = 0

            # Combined score (ingredients more important)
            scores[other.id] = ingredient_sim * 0.7 + tag_sim * 0.3

        return scores

    def _association_based(self, dish_id: int) -> Dict[int, float]:
        """Dựa trên luật kết hợp Apriori từ các set menu công khai."""
        from pathlib import Path
        from app.services.apriori_service import AprioriService

        dish = self.db.query(Dish).filter(Dish.id == dish_id).first()
        if not dish:
            return {}

        data_path = Path(__file__).resolve().parents[2] / "database"
        recommendations = AprioriService(data_path).get_dish_recommendations(dish.name)
        if not recommendations:
            return {}

        dishes = self.db.query(Dish).all()
        name_to_id = {str(d.name).casefold(): d.id for d in dishes}
        scores: Dict[int, float] = {}
        for rec in recommendations:
            target_id = name_to_id.get(str(rec.get("dish", "")).casefold())
            if not target_id or target_id == dish_id:
                continue
            confidence = float(rec.get("confidence", 0) or 0)
            lift = float(rec.get("lift", 0) or 0)
            # Lift được nén để điểm số không phình quá lớn.
            scores[target_id] = max(scores.get(target_id, 0), confidence * min(lift / 2, 1.0))
        return scores

    def _collaborative_filtering(self, dish_id: int) -> Dict[int, float]:
        """Dựa trên ratings - users thích món này cũng thích món nào?"""

        # Users who rated this dish highly (>= 4 stars)
        high_raters = (
            self.db.query(Rating)
            .filter(Rating.dish_id == dish_id, Rating.rating >= 4)
            .all()
        )

        if not high_raters:
            return {}

        # What else did they rate highly?
        scores = defaultdict(int)
        for rating in high_raters:
            other_ratings = (
                self.db.query(Rating)
                .filter(
                    Rating.customer_id == rating.customer_id,
                    Rating.dish_id != dish_id,
                    Rating.rating >= 4,
                )
                .all()
            )

            for r in other_ratings:
                scores[r.dish_id] += 1

        # Normalize by total count
        total = sum(scores.values())
        if total > 0:
            return {k: v / total for k, v in scores.items()}
        return {}

    def get_recommendations_for_cart(
        self, dish_ids: List[int], top_n: int = 10
    ) -> List[Dict]:
        """Gợi ý món cho giỏ hàng"""

        all_recommendations = defaultdict(float)

        # Get recommendations for each dish in cart
        for dish_id in dish_ids:
            recs = self.get_recommendations_for_dish(dish_id, top_n=20)
            for rec in recs:
                rid = rec["dish_id"]
                # Don't recommend what's already in cart
                if rid not in dish_ids:
                    all_recommendations[rid] += rec["score"]

        # Sort and return top N
        sorted_recs = sorted(all_recommendations.items(), key=lambda x: x[1], reverse=True)[
            :top_n
        ]

        return [{"dish_id": d[0], "score": d[1]} for d in sorted_recs]

    def get_trending_dishes(self, top_n: int = 10) -> List[Dict]:
        """Top món phổ biến dựa trên ratings"""

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

        return [
            {
                "dish_id": t.dish_id,
                "avg_rating": float(t.avg_rating),
                "total_ratings": t.count,
            }
            for t in trending
        ]
