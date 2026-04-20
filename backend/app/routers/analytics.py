from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Order, Rating, Dish
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview")
def overview(db: Session = Depends(get_db)):
    svc = AnalyticsService(db)
    data = svc.get_overview()
    # Thêm tổng doanh thu
    total_rev = db.query(func.sum(Order.total_amount)).filter(Order.status != "cancelled").scalar() or 0
    completed_orders = db.query(func.count(Order.id)).filter(Order.status == "completed").scalar() or 0
    data["total_revenue"] = int(total_rev)
    data["completed_orders"] = completed_orders
    return data


@router.get("/category-distribution")
def cat_dist(db: Session = Depends(get_db)):
    return {"data": AnalyticsService(db).get_category_distribution()}

@router.get("/price-distribution")
def price_dist(db: Session = Depends(get_db)):
    return {"data": AnalyticsService(db).get_price_distribution()}

@router.get("/rating-distribution")
def rating_dist(db: Session = Depends(get_db)):
    return {"data": AnalyticsService(db).get_rating_distribution()}

@router.get("/order-status")
def order_status(db: Session = Depends(get_db)):
    return {"data": AnalyticsService(db).get_order_status_distribution()}

@router.get("/top-dishes")
def top_dishes(top_n: int = 10, db: Session = Depends(get_db)):
    return {"data": AnalyticsService(db).get_top_dishes(top_n)}


@router.get("/association-rules")
def assoc_rules(min_support: float = 0.03, min_confidence: float = 0.2,
                dish_type: str = None, db: Session = Depends(get_db)):
    """Luật kết hợp — có thể filter theo chay/mặn"""
    svc = AnalyticsService(db)
    result = svc.get_association_rules(min_support, min_confidence)

    # Filter theo dish_type nếu có
    if dish_type and dish_type in ("chay", "man") and result.get("rules"):
        dishes = {d.id: d for d in db.query(Dish).all()}
        # Map tên -> dish
        name_to_dish = {d.name: d for d in dishes.values()}

        def match_type(rule):
            d_a = name_to_dish.get(rule.get("antecedent"))
            d_b = name_to_dish.get(rule.get("consequent"))
            if not d_a or not d_b:
                return True  # Giữ lại nếu không map được
            tags_a = str(d_a.tags or "").lower()
            tags_b = str(d_b.tags or "").lower()
            if dish_type == "chay":
                return "chay" in tags_a or "chay" in tags_b or "chay_duoc" in tags_a or "chay_duoc" in tags_b
            else:
                return "chay" not in tags_a and "chay_duoc" not in tags_a

        result["rules"] = [r for r in result["rules"] if match_type(r)]
        result["filtered_by"] = dish_type

    return result


@router.get("/recommendation-rate")
def recommendation_rate(db: Session = Depends(get_db)):
    """Tỷ lệ đơn hàng có chứa món được gợi ý"""
    svc = AnalyticsService(db)
    total = db.query(func.count(Order.id)).scalar() or 0
    if total == 0:
        return {"rate": 0, "total_orders": 0, "orders_with_recs": 0}

    # Tính: đơn hàng có >= 2 món từ cùng category (proxy cho recommendation)
    orders = db.query(Order).all()
    dishes = {d.id: d for d in db.query(Dish).all()}
    orders_with_recs = 0

    for o in orders:
        try:
            ids = [int(x.strip()) for x in o.dish_ids.split(",") if x.strip()]
            if len(ids) >= 2:
                cats = [dishes[i].category for i in ids if i in dishes]
                # Nếu có >= 2 món cùng category hoặc complementary -> gợi ý hiệu quả
                if len(cats) != len(set(cats)) or len(set(cats)) >= 3:
                    orders_with_recs += 1
        except:
            pass

    return {
        "rate": round(orders_with_recs / total * 100, 1) if total > 0 else 0,
        "total_orders": total,
        "orders_with_recs": orders_with_recs,
    }


@router.get("/classification")
def classification(db: Session = Depends(get_db)):
    return AnalyticsService(db).get_classification()

@router.get("/clustering")
def clustering(n_clusters: int = 4, db: Session = Depends(get_db)):
    return AnalyticsService(db).get_clustering(n_clusters)

@router.get("/correlation-regression")
def corr_reg(db: Session = Depends(get_db)):
    return AnalyticsService(db).get_correlation_regression()
