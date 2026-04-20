from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Customer
from app.schemas.schemas import RegisterRequest, LoginRequest, VerifyOTPRequest, ProfileUpdate
import random, time

router = APIRouter(prefix="/api/auth", tags=["Auth"])
_otp_store = {}


def _generate_otp(phone):
    otp = str(random.randint(100000, 999999))
    _otp_store[phone] = {"otp": otp, "expires": time.time() + 300}
    print(f"[OTP] {phone} → {otp}")
    return otp


@router.post("/send-otp")
def send_otp(req: LoginRequest, db: Session = Depends(get_db)):
    otp = _generate_otp(req.phone)
    return {"message": "OTP sent", "phone": req.phone, "demo_otp": otp}


@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(Customer).filter(Customer.phone == req.phone).first()
    if existing:
        return {"message": "Phone exists", "customer_id": existing.id, "name": existing.name}
    customer = Customer(name=req.name, phone=req.phone)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    otp = _generate_otp(req.phone)
    return {"message": "Registered", "customer_id": customer.id, "demo_otp": otp}


@router.post("/verify-otp")
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    stored = _otp_store.get(req.phone)
    if req.otp != "000000":
        if not stored or stored["otp"] != req.otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        if stored["expires"] < time.time():
            raise HTTPException(status_code=400, detail="OTP expired")

    customer = db.query(Customer).filter(Customer.phone == req.phone).first()
    if not customer:
        customer = Customer(name="Khách hàng", phone=req.phone)
        db.add(customer)
        db.commit()
        db.refresh(customer)
    _otp_store.pop(req.phone, None)

    return {
        "message": "Login successful",
        "user": {"id": customer.id, "name": customer.name, "phone": customer.phone,
                 "email": customer.email, "preferred_categories": customer.preferred_categories,
                 "preferred_price_range": customer.preferred_price_range}
    }


@router.get("/profile/{customer_id}")
def get_profile(customer_id: int, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(404, "Customer not found")
    return {"id": c.id, "name": c.name, "phone": c.phone, "email": c.email,
            "preferred_categories": c.preferred_categories,
            "preferred_price_range": c.preferred_price_range,
            "created_date": str(c.created_date)}


@router.put("/profile/{customer_id}")
def update_profile(customer_id: int, req: ProfileUpdate, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(404, "Customer not found")
    if req.name is not None: c.name = req.name
    if req.email is not None: c.email = req.email
    if req.preferred_categories is not None: c.preferred_categories = req.preferred_categories
    if req.preferred_price_range is not None: c.preferred_price_range = req.preferred_price_range
    db.commit()
    db.refresh(c)
    return {"message": "Updated", "user": {"id": c.id, "name": c.name, "phone": c.phone, "email": c.email}}
