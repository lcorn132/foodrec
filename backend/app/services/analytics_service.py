from __future__ import annotations

from typing import Dict, List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.models import Customer, Dish, Order, Rating


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_overview(self) -> Dict:
        return {
            "total_dishes": self.db.query(Dish).count(),
            "total_customers": self.db.query(Customer).count(),
            "total_orders": self.db.query(Order).count(),
            "total_ratings": self.db.query(Rating).count(),
            "avg_rating": round(float(self.db.query(func.avg(Rating.rating)).scalar() or 0), 2),
            "avg_price": round(float(self.db.query(func.avg(Dish.price)).scalar() or 0)),
        }

    def get_category_distribution(self) -> List[Dict]:
        rows = (
            self.db.query(Dish.category, func.count(Dish.id))
            .group_by(Dish.category)
            .order_by(func.count(Dish.id).desc())
            .all()
        )
        return [{"name": category or "Khác", "count": count} for category, count in rows]

    def get_price_distribution(self) -> List[Dict]:
        rows = self.db.query(Dish.price_range, func.count(Dish.id)).group_by(Dish.price_range).all()
        labels = {
            "budget": "Bình dân",
            "affordable": "Vừa phải",
            "moderate": "Trung bình",
            "premium": "Cao cấp",
            "unknown": "Chưa rõ",
        }
        return [{"range": labels.get(price_range, price_range), "key": price_range, "count": count} for price_range, count in rows if price_range]

    def get_rating_distribution(self) -> List[Dict]:
        rows = (
            self.db.query(Rating.rating, func.count(Rating.id))
            .group_by(Rating.rating)
            .order_by(Rating.rating.desc())
            .all()
        )
        return [{"stars": f"{rating} sao", "rating": rating, "count": count} for rating, count in rows]

    def get_order_status_distribution(self) -> List[Dict]:
        rows = self.db.query(Order.status, func.count(Order.id)).group_by(Order.status).all()
        return [{"status": status, "count": count} for status, count in rows]

    def get_top_dishes(self, top_n: int = 10) -> List[Dict]:
        rows = (
            self.db.query(Rating.dish_id, func.avg(Rating.rating).label("avg_rating"), func.count(Rating.id).label("count"))
            .group_by(Rating.dish_id)
            .having(func.count(Rating.id) >= 2)
            .order_by(func.avg(Rating.rating).desc(), func.count(Rating.id).desc())
            .limit(top_n)
            .all()
        )

        if not rows:
            dishes = (
                self.db.query(Dish)
                .filter(Dish.is_active == 1)
                .order_by(Dish.sort_order.asc(), Dish.id.asc())
                .limit(top_n)
                .all()
            )
            return [
                {
                    "rank": index + 1,
                    "dish_id": dish.id,
                    "name": dish.name,
                    "category": dish.category,
                    "avg_rating": 0,
                    "total_ratings": 0,
                }
                for index, dish in enumerate(dishes)
            ]

        result = []
        for index, row in enumerate(rows):
            dish = self.db.query(Dish).filter(Dish.id == row.dish_id).first()
            result.append(
                {
                    "rank": index + 1,
                    "dish_id": row.dish_id,
                    "name": dish.name if dish else f"#{row.dish_id}",
                    "category": dish.category if dish else "",
                    "avg_rating": round(float(row.avg_rating), 1),
                    "total_ratings": row.count,
                }
            )
        return result
