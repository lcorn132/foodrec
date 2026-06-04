from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Dish
from app.schemas.schemas import RecommendationRequest
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


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
            result.append(
                {
                    "dish": recommended,
                    "score": round(rec["score"], 3),
                    "reason": "Dựa trên độ tương đồng nội dung, cụm K-Means, danh mục và mức giá",
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
            result.append(
                {
                    "dish": dish,
                    "score": round(rec["score"], 3),
                    "reason": "Phù hợp với các món hiện có trong giỏ theo content-based filtering",
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
