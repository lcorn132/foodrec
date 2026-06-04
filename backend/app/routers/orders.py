from datetime import datetime
from collections import Counter
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Dish, Order, Customer, Voucher
from app.schemas.schemas import CheckoutRequest, OrderStatusUpdate

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def _normalize_code(code: str) -> str:
    return "".join(str(code or "").upper().split())


def _voucher_discount(voucher: Voucher, subtotal: int) -> int:
    if not voucher or not int(voucher.is_active or 0):
        return 0
    if subtotal < int(voucher.min_order_amount or 0):
        return 0
    if voucher.usage_limit is not None and int(voucher.used_count or 0) >= int(voucher.usage_limit):
        return 0
    if (voucher.discount_type or "percent") == "fixed":
        discount = int(voucher.discount_value or 0)
    else:
        discount = round(subtotal * max(min(int(voucher.discount_value or 0), 100), 0) / 100)
    if voucher.max_discount_amount:
        discount = min(discount, int(voucher.max_discount_amount))
    return max(0, min(discount, subtotal))


def _order_dishes(db: Session, dish_ids):
    counts = Counter(dish_ids)
    dishes = db.query(Dish).filter(Dish.id.in_(counts.keys())).all() if counts else []
    dish_map = {d.id: d for d in dishes}
    result = []
    for dish_id, qty in counts.items():
        dish = dish_map.get(dish_id)
        if dish:
            result.append({"id": dish.id, "name": dish.name, "price": dish.price, "qty": qty})
    return result


@router.post("/checkout")
def checkout(req: CheckoutRequest, db: Session = Depends(get_db)):
    if not req.items:
        raise HTTPException(400, "Cart is empty")

    customer_id = req.customer_id
    if customer_id and not db.query(Customer).filter(Customer.id == customer_id).first():
        customer_id = None
    if not customer_id and req.customer_phone:
        cust = db.query(Customer).filter(Customer.phone == req.customer_phone).first()
        if cust: customer_id = cust.id

    dish_ids_flat = []
    total = 0
    for item in req.items:
        for _ in range(item.get("qty", 1)):
            dish_ids_flat.append(str(item["id"]))
        total += (item.get("price", 0) or 0) * item.get("qty", 1)

    voucher_code = _normalize_code(req.voucher_code)
    discount_amount = 0
    if voucher_code:
        voucher = db.query(Voucher).filter(Voucher.code == voucher_code).first()
        discount_amount = _voucher_discount(voucher, total)
        if discount_amount <= 0:
            voucher_code = None
        elif voucher:
            voucher.used_count = int(voucher.used_count or 0) + 1

    order = Order(
        customer_id=customer_id, order_date=datetime.utcnow(),
        dish_ids=",".join(dish_ids_flat), total_amount=max(total - discount_amount, 0), status="pending",
        payment_method=req.payment_method, address=req.address, note=req.note or "",
        customer_name=req.customer_name, customer_phone=req.customer_phone,
        voucher_code=voucher_code, discount_amount=discount_amount,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return {"message": "Order placed", "order_id": order.id, "total_amount": order.total_amount, "discount_amount": discount_amount, "status": "pending"}


@router.get("/")
def list_orders(status: str = None, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(Order)
    if status: query = query.filter(Order.status == status)
    orders = query.order_by(Order.order_date.desc()).limit(limit).all()
    result = []
    for o in orders:
        dish_ids = [int(x) for x in o.dish_ids.split(",") if x.strip()]
        dishes = _order_dishes(db, dish_ids)
        dish_names = [d["name"] for d in dishes]
        cust = db.query(Customer).filter(Customer.id == o.customer_id).first() if o.customer_id else None
        result.append({
            "id": o.id, "customer_id": o.customer_id,
            "customer_name": o.customer_name or (cust.name if cust else "Khách vãng lai"),
            "customer_phone": o.customer_phone or (cust.phone if cust else ""),
            "order_date": str(o.order_date), "dish_ids": dish_ids,
            "dish_names": dish_names, "total_amount": o.total_amount,
            "status": o.status, "payment_method": o.payment_method,
            "address": o.address, "note": o.note,
            "voucher_code": o.voucher_code, "discount_amount": o.discount_amount or 0,
        })
    return {"orders": result, "total": len(result)}


@router.get("/customer/{customer_id}")
def customer_orders(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    query = db.query(Order).filter(Order.customer_id == customer_id)
    if customer and customer.phone:
        query = db.query(Order).filter(
            (Order.customer_id == customer_id) | (Order.customer_phone == customer.phone)
        )
    orders = query\
        .order_by(Order.order_date.desc()).all()
    result = []
    for o in orders:
        dish_ids = [int(x) for x in o.dish_ids.split(",") if x.strip()]
        result.append({
            "id": o.id, "order_date": str(o.order_date),
            "dishes": _order_dishes(db, dish_ids),
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
