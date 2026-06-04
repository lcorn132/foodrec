from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Voucher


router = APIRouter(prefix="/api/vouchers", tags=["Vouchers"])


class VoucherPayload(BaseModel):
    code: str = Field(..., min_length=2, max_length=40)
    name: str = Field(..., min_length=2, max_length=120)
    description: Optional[str] = ""
    discount_type: str = "percent"
    discount_value: int = 0
    min_order_amount: int = 0
    max_discount_amount: Optional[int] = None
    applies_to: str = "all"
    usage_limit: Optional[int] = None
    is_active: int = 1


class VoucherValidateRequest(BaseModel):
    code: str
    subtotal: int
    items: list[dict] = []


def _normalize_code(code: str) -> str:
    return "".join(str(code or "").upper().split())


def _serialize(voucher: Voucher) -> dict:
    return {
        "id": voucher.id,
        "code": voucher.code,
        "name": voucher.name,
        "description": voucher.description or "",
        "discount_type": voucher.discount_type or "percent",
        "discount_value": int(voucher.discount_value or 0),
        "min_order_amount": int(voucher.min_order_amount or 0),
        "max_discount_amount": voucher.max_discount_amount,
        "applies_to": voucher.applies_to or "all",
        "usage_limit": voucher.usage_limit,
        "used_count": int(voucher.used_count or 0),
        "is_active": int(voucher.is_active or 0),
    }


def _seed_defaults(db: Session) -> None:
    if db.query(Voucher).count():
        return
    defaults = [
        Voucher(
            code="COMNIEU10",
            name="Giảm 10% cho bữa cơm Việt",
            description="Áp dụng cho đơn từ 200.000 đ, giảm tối đa 50.000 đ.",
            discount_type="percent",
            discount_value=10,
            min_order_amount=200000,
            max_discount_amount=50000,
            applies_to="all",
            is_active=1,
        ),
        Voucher(
            code="FAMILY50",
            name="Giảm 50.000 đ cho bữa gia đình",
            description="Áp dụng cho đơn từ 500.000 đ.",
            discount_type="fixed",
            discount_value=50000,
            min_order_amount=500000,
            applies_to="all",
            is_active=1,
        ),
    ]
    db.add_all(defaults)
    db.commit()


def _discount_amount(voucher: Voucher, subtotal: int) -> int:
    subtotal = max(int(subtotal or 0), 0)
    if (voucher.discount_type or "percent") == "fixed":
        discount = int(voucher.discount_value or 0)
    else:
        percent = max(min(int(voucher.discount_value or 0), 100), 0)
        discount = round(subtotal * percent / 100)
    if voucher.max_discount_amount:
        discount = min(discount, int(voucher.max_discount_amount))
    return max(0, min(discount, subtotal))


def _validate(voucher: Voucher, subtotal: int) -> tuple[bool, str]:
    now = datetime.utcnow()
    if not voucher or not int(voucher.is_active or 0):
        return False, "Mã giảm giá chưa được bật hoặc không tồn tại."
    if voucher.starts_at and voucher.starts_at > now:
        return False, "Mã giảm giá chưa đến thời gian áp dụng."
    if voucher.ends_at and voucher.ends_at < now:
        return False, "Mã giảm giá đã hết hạn."
    if voucher.usage_limit is not None and int(voucher.used_count or 0) >= int(voucher.usage_limit):
        return False, "Mã giảm giá đã hết lượt sử dụng."
    if int(subtotal or 0) < int(voucher.min_order_amount or 0):
        return False, f"Đơn hàng cần đạt tối thiểu {int(voucher.min_order_amount or 0):,} đ để dùng mã này."
    return True, "Áp dụng mã giảm giá thành công."


@router.get("/active")
def active_vouchers(subtotal: int = 0, db: Session = Depends(get_db)):
    _seed_defaults(db)
    vouchers = db.query(Voucher).filter(Voucher.is_active == 1).order_by(Voucher.id.desc()).all()
    items = []
    for voucher in vouchers:
        ok, message = _validate(voucher, subtotal)
        discount = _discount_amount(voucher, subtotal) if ok else 0
        data = _serialize(voucher)
        data.update(
            {
                "eligible": ok,
                "message": message,
                "discount_amount": discount,
                "short_hint": f"Đơn này giảm {discount:,} đ" if ok and discount else f"Cần đơn từ {int(voucher.min_order_amount or 0):,} đ",
            }
        )
        items.append(data)
    return {"items": items}


@router.post("/validate")
def validate_voucher(req: VoucherValidateRequest, db: Session = Depends(get_db)):
    _seed_defaults(db)
    code = _normalize_code(req.code)
    voucher = db.query(Voucher).filter(Voucher.code == code).first()
    ok, message = _validate(voucher, req.subtotal)
    if not ok:
        raise HTTPException(status_code=400, detail=message)
    discount = _discount_amount(voucher, req.subtotal)
    return {
        "voucher": _serialize(voucher),
        "discount_amount": discount,
        "payable_amount": max(int(req.subtotal or 0) - discount, 0),
        "message": message,
    }


@router.get("/admin")
def list_vouchers(db: Session = Depends(get_db)):
    _seed_defaults(db)
    vouchers = db.query(Voucher).order_by(Voucher.id.desc()).all()
    return {"items": [_serialize(voucher) for voucher in vouchers]}


@router.post("/admin")
def create_voucher(payload: VoucherPayload, db: Session = Depends(get_db)):
    code = _normalize_code(payload.code)
    if db.query(Voucher).filter(Voucher.code == code).first():
        raise HTTPException(status_code=400, detail="Mã voucher đã tồn tại.")
    voucher = Voucher(**payload.dict(exclude={"code"}), code=code)
    db.add(voucher)
    db.commit()
    db.refresh(voucher)
    return _serialize(voucher)


@router.put("/admin/{voucher_id}")
def update_voucher(voucher_id: int, payload: VoucherPayload, db: Session = Depends(get_db)):
    voucher = db.query(Voucher).filter(Voucher.id == voucher_id).first()
    if not voucher:
        raise HTTPException(status_code=404, detail="Không tìm thấy voucher.")
    code = _normalize_code(payload.code)
    duplicate = db.query(Voucher).filter(Voucher.code == code, Voucher.id != voucher_id).first()
    if duplicate:
        raise HTTPException(status_code=400, detail="Mã voucher đã tồn tại.")
    for key, value in payload.dict().items():
        setattr(voucher, key, _normalize_code(value) if key == "code" else value)
    db.commit()
    db.refresh(voucher)
    return _serialize(voucher)


@router.patch("/admin/{voucher_id}/toggle")
def toggle_voucher(voucher_id: int, db: Session = Depends(get_db)):
    voucher = db.query(Voucher).filter(Voucher.id == voucher_id).first()
    if not voucher:
        raise HTTPException(status_code=404, detail="Không tìm thấy voucher.")
    voucher.is_active = 0 if int(voucher.is_active or 0) else 1
    db.commit()
    db.refresh(voucher)
    return _serialize(voucher)
