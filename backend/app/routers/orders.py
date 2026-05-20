from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Dish, Order, Customer
from app.schemas.schemas import CheckoutRequest, OrderStatusUpdate

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.post("/checkout")
def checkout(req: CheckoutRequest, db: Session = Depends(get_db)):
    if not req.items:
        raise HTTPException(400, "Cart is empty")

    customer_id = None
    if req.customer_phone:
        cust = db.query(Customer).filter(Customer.phone == req.customer_phone).first()
        if cust: customer_id = cust.id

    dish_ids_flat = []
    total = 0
    for item in req.items:
        for _ in range(item.get("qty", 1)):
            dish_ids_flat.append(str(item["id"]))
        total += (item.get("price", 0) or 0) * item.get("qty", 1)

    order = Order(
        customer_id=customer_id, order_date=datetime.utcnow(),
        dish_ids=",".join(dish_ids_flat), total_amount=total, status="pending",
        payment_method=req.payment_method, address=req.address, note=req.note or "",
        customer_name=req.customer_name, customer_phone=req.customer_phone,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return {"message": "Order placed", "order_id": order.id, "total_amount": total, "status": "pending"}


@router.get("/")
def list_orders(status: str = None, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(Order)
    if status: query = query.filter(Order.status == status)
    orders = query.order_by(Order.order_date.desc()).limit(limit).all()
    result = []
    for o in orders:
        dish_ids = [int(x) for x in o.dish_ids.split(",") if x.strip()]
        dishes = db.query(Dish).filter(Dish.id.in_(dish_ids)).all()
        dish_names = [d.name for d in dishes]
        cust = db.query(Customer).filter(Customer.id == o.customer_id).first() if o.customer_id else None
        result.append({
            "id": o.id, "customer_id": o.customer_id,
            "customer_name": o.customer_name or (cust.name if cust else "Khách vãng lai"),
            "customer_phone": o.customer_phone or (cust.phone if cust else ""),
            "order_date": str(o.order_date), "dish_ids": dish_ids,
            "dish_names": dish_names, "total_amount": o.total_amount,
            "status": o.status, "payment_method": o.payment_method,
            "address": o.address, "note": o.note,
        })
    return {"orders": result, "total": len(result)}


@router.get("/customer/{customer_id}")
def customer_orders(customer_id: int, db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.customer_id == customer_id)\
        .order_by(Order.order_date.desc()).all()
    result = []
    for o in orders:
        dish_ids = [int(x) for x in o.dish_ids.split(",") if x.strip()]
        dishes = db.query(Dish).filter(Dish.id.in_(dish_ids)).all()
        result.append({
            "id": o.id, "order_date": str(o.order_date),
            "dishes": [{"id": d.id, "name": d.name, "price": d.price} for d in dishes],
            "total_amount": o.total_amount, "status": o.status,
            "payment_method": o.payment_method, "address": o.address,
        })
    return {"orders": result}


@router.get("/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o: raise HTTPException(404, "Order not found")
    dish_ids = [int(x) for x in o.dish_ids.split(",") if x.strip()]
    dishes = db.query(Dish).filter(Dish.id.in_(dish_ids)).all()
    return {"order": o, "dishes": [{"id": d.id, "name": d.name, "price": d.price} for d in dishes]}


@router.put("/{order_id}/status")
def update_order_status(order_id: int, req: OrderStatusUpdate, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o: raise HTTPException(404, "Order not found")
    o.status = req.status
    db.commit()
    return {"message": "Status updated", "order_id": o.id, "status": o.status}
