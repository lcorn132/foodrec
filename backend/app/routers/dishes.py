from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.models import Dish, Rating, Customer
from app.schemas.schemas import DishResponse, DishCreate, DishUpdate

router = APIRouter(prefix="/api/dishes", tags=["Dishes"])


@router.get("/", response_model=List[DishResponse])
def get_dishes(
    q: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    page: int = 1, 
    limit: int = 12,
    db: Session = Depends(get_db)
):
    query = db.query(Dish)
    
    # 1. Lọc theo Danh mục
    if category: 
        query = query.filter(Dish.category == category)
        
    # 2. Lọc theo Tìm kiếm tên món
    if q: 
        query = query.filter(Dish.name.ilike(f"%{q}%"))
        
    # 3. Lọc theo Khoảng giá 
    if min_price is not None:
        query = query.filter(Dish.price >= min_price)
    if max_price is not None:
        query = query.filter(Dish.price < max_price)

    # 4. Xử lý phân trang tự động
    skip = (page - 1) * limit
    return query.offset(skip).limit(limit).all()


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Dish.category).distinct().all()
    return {"categories": [c[0] for c in cats if c[0]]}


@router.get("/{dish_id}", response_model=DishResponse)
def get_dish(dish_id: int, db: Session = Depends(get_db)):
    dish = db.query(Dish).filter(Dish.id == dish_id).first()
    if not dish: raise HTTPException(404, "Dish not found")
    return dish


@router.post("/", response_model=DishResponse)
def create_dish(req: DishCreate, db: Session = Depends(get_db)):
    dish = Dish(**req.dict())
    db.add(dish)
    db.commit()
    db.refresh(dish)
    return dish


@router.put("/{dish_id}", response_model=DishResponse)
def update_dish(dish_id: int, req: DishUpdate, db: Session = Depends(get_db)):
    dish = db.query(Dish).filter(Dish.id == dish_id).first()
    if not dish: raise HTTPException(404, "Dish not found")
    for k, v in req.dict(exclude_unset=True).items():
        setattr(dish, k, v)
    db.commit()
    db.refresh(dish)
    return dish


@router.delete("/{dish_id}")
def delete_dish(dish_id: int, db: Session = Depends(get_db)):
    dish = db.query(Dish).filter(Dish.id == dish_id).first()
    if not dish: raise HTTPException(404, "Dish not found")
    db.delete(dish)
    db.commit()
    return {"message": "Deleted"}


# ===== RATINGS PER DISH =====
@router.get("/{dish_id}/ratings")
def get_dish_ratings(dish_id: int, db: Session = Depends(get_db)):
    ratings = db.query(Rating).filter(Rating.dish_id == dish_id)\
        .order_by(Rating.rating_date.desc()).limit(50).all()
    result = []
    for r in ratings:
        cust = db.query(Customer).filter(Customer.id == r.customer_id).first()
        result.append({
            "id": r.id, "rating": r.rating, "comment": r.comment,
            "customer_name": cust.name if cust else "Ẩn danh",
            "rating_date": str(r.rating_date),
            "admin_reply": r.admin_reply, "reply_date": str(r.reply_date) if r.reply_date else None,
        })
    # Stats
    avg = db.query(func.avg(Rating.rating)).filter(Rating.dish_id == dish_id).scalar()
    count = db.query(func.count(Rating.id)).filter(Rating.dish_id == dish_id).scalar()
    return {"ratings": result, "avg_rating": round(float(avg), 1) if avg else 0, "total": count}
