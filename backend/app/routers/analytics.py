from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Order
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview")
def overview(db: Session = Depends(get_db)):
    service = AnalyticsService(db)
    data = service.get_overview()
    total_revenue = db.query(func.sum(Order.total_amount)).filter(Order.status == "completed").scalar() or 0
    completed_orders = db.query(func.count(Order.id)).filter(Order.status == "completed").scalar() or 0
    data["total_revenue"] = int(total_revenue)
    data["completed_orders"] = completed_orders
    return data


@router.get("/category-distribution")
def category_distribution(db: Session = Depends(get_db)):
    return {"data": AnalyticsService(db).get_category_distribution()}


@router.get("/price-distribution")
def price_distribution(db: Session = Depends(get_db)):
    return {"data": AnalyticsService(db).get_price_distribution()}


@router.get("/rating-distribution")
def rating_distribution(db: Session = Depends(get_db)):
    return {"data": AnalyticsService(db).get_rating_distribution()}


@router.get("/order-status")
def order_status(db: Session = Depends(get_db)):
    return {"data": AnalyticsService(db).get_order_status_distribution()}


@router.get("/top-dishes")
def top_dishes(top_n: int = 10, db: Session = Depends(get_db)):
    return {"data": AnalyticsService(db).get_top_dishes(top_n)}
