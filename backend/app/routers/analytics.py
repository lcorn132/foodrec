from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Order, Rating
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
def assoc_rules(min_support: float = 0.02, min_confidence: float = 0.25, db: Session = Depends(get_db)):
    """Luật kết hợp từ giao dịch set menu thật của Cơm Niêu Việt Nam."""
    svc = AnalyticsService(db)
    return svc.get_association_rules(min_support, min_confidence)


@router.get("/recommendation-rate")
def recommendation_rate():
    """Tỷ lệ set menu có chứa ít nhất một cặp món phổ biến dùng để sinh gợi ý."""
    from pathlib import Path
    from app.services.apriori_service import SetMenuAssociationMiner

    data_path = Path(__file__).parent.parent.parent / "database"
    miner = SetMenuAssociationMiner(data_path)
    result = miner.run(min_support=0.02, min_confidence=0.25, min_lift=1.0)
    itemsets = [set(row.get("itemset", [])) for row in result.get("frequent_itemsets", []) if len(row.get("itemset", [])) >= 2]
    transactions = [set(row.get("items", [])) for row in result.get("transactions_preview", [])]

    # Dùng toàn bộ transaction thực trong miner để tránh preview chỉ 5 dòng.
    all_transactions = [set(tx) for tx in miner.transactions]
    total = len(all_transactions)
    covered = 0
    for tx in all_transactions:
        if any(itemset.issubset(tx) for itemset in itemsets):
            covered += 1

    return {
        "rate": round(covered / total * 100, 1) if total else 0,
        "total_orders": total,
        "orders_with_recs": covered,
        "metric_label": "Tỷ lệ giao dịch có cặp món phổ biến",
        "source": "set_menu_transactions_augmented.csv",
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


# ===== PREPROCESSING PIPELINE API =====
from app.services.data_preprocessor import run_preprocessing
from pathlib import Path

_preprocessing_cache = None

@router.get("/preprocessing-report")
def preprocessing_report():
    """
    Trả về báo cáo tiền xử lý dữ liệu:
    Làm sạch, Tích hợp, Biến đổi, Thu giảm
    """
    global _preprocessing_cache
    if _preprocessing_cache is None:
        data_path = Path(__file__).parent.parent.parent / "database"
        _preprocessing_cache = run_preprocessing(data_path)
    return _preprocessing_cache

@router.post("/preprocessing-report/refresh")
def preprocessing_report_refresh():
    """Chạy lại pipeline và xóa cache"""
    global _preprocessing_cache
    data_path = Path(__file__).parent.parent.parent / "database"
    _preprocessing_cache = run_preprocessing(data_path, force=True)
    return _preprocessing_cache


# ===== APRIORI ASSOCIATION RULES API =====
from app.services.apriori_service import AprioriService

_apriori_cache = None

def _get_apriori():
    global _apriori_cache
    if _apriori_cache is None:
        from pathlib import Path
        data_path = Path(__file__).parent.parent.parent / "database"
        svc = AprioriService(data_path)
        _apriori_cache = svc
    return _apriori_cache

@router.get("/apriori/full")
def apriori_full():
    """Chạy Apriori trên dữ liệu giao dịch set menu đã làm sạch."""
    return _get_apriori().run_full_analysis()

@router.post("/apriori/refresh")
def apriori_refresh():
    """Chạy lại Apriori, xóa cache"""
    from app.services import apriori_service as _m
    _m._cache = {}
    return _get_apriori().run_full_analysis(force=True)

@router.get("/apriori/dish-recommendations")
def apriori_dish_recs(dish_name: str):
    """Gợi ý món ăn dựa trên tên món"""
    return {"dish": dish_name, "recommendations": _get_apriori().get_dish_recommendations(dish_name)}
