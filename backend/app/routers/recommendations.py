from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Dish
from app.schemas.schemas import RecommendationRequest
from app.services.culinary_knowledge import CULINARY_KNOWLEDGE_SOURCES, MEAL_ROLE_LABELS
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.get("/knowledge-sources")
def knowledge_sources():
    return {
        "engine": "hybrid: K-Means + content-based similarity + domain-knowledge cross-cluster mapping",
        "meal_roles": MEAL_ROLE_LABELS,
        "sources": CULINARY_KNOWLEDGE_SOURCES,
        "scope_note": "Các luật là cách triển khai của nhóm dựa trên tài liệu; không phải trích dẫn nguyên văn hoặc tư vấn dinh dưỡng.",
    }


def _display_score(score: float, strategy: str = "") -> float:
    raw = max(float(score or 0), 0.0)
    if strategy == "cross_cluster_mapping":
        normalized = 0.72 + min(raw / 3.0, 1.0) * 0.23
    else:
        normalized = 0.68 + min(raw / 1.35, 1.0) * 0.27
    return round(min(normalized, 0.97), 3)


@router.post("/for-dish/{dish_id}")
def get_recommendations_for_dish(dish_id: int, top_n: int = 10, db: Session = Depends(get_db)):
    dish = db.query(Dish).filter(Dish.id == dish_id).first()
    if not dish:
        return {"error": "Dish not found", "recommendations": []}

    service = RecommendationService(db)
    recommendations = service.get_recommendations_for_dish(dish_id, top_n)

    result = []
    for rec in recommendations:
        recommended = db.query(Dish).filter(Dish.id == rec["dish_id"]).first()
        if recommended:
            strategy = rec.get("strategy", "intra_cluster_knn")
            result.append(
                {
                    "dish": recommended,
                    "score": _display_score(rec["score"], strategy),
                    "reason": "Hợp khẩu vị với món bạn đang xem, dễ gọi thêm để bữa ăn tròn vị hơn.",
                    "strategy": strategy,
                }
            )
    return {"recommendations": result}


@router.post("/for-cart")
def get_recommendations_for_cart(request: RecommendationRequest, db: Session = Depends(get_db)):
    if not request.dish_ids:
        return {"recommendations": []}

    service = RecommendationService(db)
    recommendations = service.get_recommendations_for_cart(request.dish_ids, request.top_n)

    result = []
    for rec in recommendations:
        dish = db.query(Dish).filter(Dish.id == rec["dish_id"]).first()
        if dish:
            strategy = rec.get("strategy", "cross_cluster_mapping")
            result.append(
                {
                    "dish": dish,
                    "score": _display_score(rec["score"], strategy),
                    "reason": "Món đi kèm giúp giỏ hàng cân bằng vị và hấp dẫn hơn.",
                    "strategy": strategy,
                }
            )
    return {"recommendations": result}


@router.get("/trending")
def get_trending(top_n: int = 10, db: Session = Depends(get_db)):
    service = RecommendationService(db)
    trending = service.get_trending_dishes(top_n)

    result = []
    for item in trending:
        dish = db.query(Dish).filter(Dish.id == item["dish_id"]).first()
        if dish:
            result.append({"dish": dish, "avg_rating": item["avg_rating"], "total_ratings": item["total_ratings"]})
    return {"trending": result}
