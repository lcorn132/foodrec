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
        """Gợi ý món tương tự dựa trên 3 phương pháp kết hợp"""

        # 1. Content-based filtering (50% weight)
        content_scores = self._content_based(dish_id)

        # 2. Association rules (30% weight)
        association_scores = self._association_based(dish_id)

        # 3. Collaborative filtering (20% weight)
        collab_scores = self._collaborative_filtering(dish_id)

        # Combine scores
        all_dish_ids = set(
            list(content_scores.keys())
            + list(association_scores.keys())
            + list(collab_scores.keys())
        )

        final_scores = {}
        for did in all_dish_ids:
            if did != dish_id:  # Don't recommend the same dish
                score = (
                    content_scores.get(did, 0) * 0.5
                    + association_scores.get(did, 0) * 0.3
                    + collab_scores.get(did, 0) * 0.2
                )
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
        """Dựa trên luật kết hợp - món thường được đặt cùng nhau"""

        # Get all orders containing this dish
        orders = self.db.query(Order).filter(Order.dish_ids.like(f"%{dish_id}%")).all()

        if not orders:
            return {}

        # Count co-occurrence
        co_occurrence = defaultdict(int)
        for order in orders:
            try:
                dish_ids = [int(x.strip()) for x in order.dish_ids.split(",")]
                for did in dish_ids:
                    if did != dish_id:
                        co_occurrence[did] += 1
            except Exception:
                continue

        # Normalize scores by total occurrences
        total = sum(co_occurrence.values())
        if total > 0:
            return {k: v / total for k, v in co_occurrence.items()}
        return {}

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
