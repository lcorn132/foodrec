from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.models import Rating, Dish, Customer
from app.schemas.schemas import RatingCreate, AdminReply

router = APIRouter(prefix="/api/ratings", tags=["Ratings"])


@router.post("/")
def create_rating(req: RatingCreate, db: Session = Depends(get_db)):
    dish = db.query(Dish).filter(Dish.id == req.dish_id).first()
    if not dish: raise HTTPException(404, "Dish not found")
    rating = Rating(
        dish_id=req.dish_id, customer_id=req.customer_id,
        rating=max(1, min(5, req.rating)), comment=req.comment or "",
        rating_date=datetime.utcnow(),
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return {"message": "Rating submitted", "id": rating.id}


@router.get("/")
def list_all_ratings(limit: int = 100, db: Session = Depends(get_db)):
    ratings = db.query(Rating).order_by(Rating.rating_date.desc()).limit(limit).all()
    result = []
    for r in ratings:
        dish = db.query(Dish).filter(Dish.id == r.dish_id).first()
        cust = db.query(Customer).filter(Customer.id == r.customer_id).first() if r.customer_id else None
        result.append({
            "id": r.id, "dish_id": r.dish_id,
            "dish_name": dish.name if dish else f"Dish #{r.dish_id}",
            "customer_id": r.customer_id,
            "customer_name": cust.name if cust else "Ẩn danh",
            "rating": r.rating, "comment": r.comment,
            "rating_date": str(r.rating_date),
            "admin_reply": r.admin_reply,
            "reply_date": str(r.reply_date) if r.reply_date else None,
        })
    return {"ratings": result, "total": len(result)}


@router.put("/{rating_id}/reply")
def admin_reply(rating_id: int, req: AdminReply, db: Session = Depends(get_db)):
    r = db.query(Rating).filter(Rating.id == rating_id).first()
    if not r: raise HTTPException(404, "Rating not found")
    r.admin_reply = req.reply
    r.reply_date = datetime.utcnow()
    db.commit()
    return {"message": "Reply saved", "rating_id": r.id}


@router.delete("/{rating_id}")
def delete_rating(rating_id: int, db: Session = Depends(get_db)):
    r = db.query(Rating).filter(Rating.id == rating_id).first()
    if not r: raise HTTPException(404, "Rating not found")
    db.delete(r)
    db.commit()
    return {"message": "Deleted"}
