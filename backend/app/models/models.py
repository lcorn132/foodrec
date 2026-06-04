from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from app.database import Base


class Dish(Base):
    __tablename__ = "dishes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(100))
    dish_type = Column(String(50))
    price = Column(Integer)
    price_range = Column(String(50))
    ingredients = Column(Text)
    detailed_ingredients = Column(Text)
    tags = Column(Text)
    description = Column(Text)
    image_url = Column(String(500))
    source_url = Column(String(500))
    is_active = Column(Integer, default=1)
    # [V6] Cột mới
    is_available = Column(Integer, default=1)   # 1=có sẵn, 0=hết
    sort_order = Column(Integer, default=0)     # thứ tự hiển thị
    prep_time = Column(Integer, default=20)     # thời gian chuẩn bị (phút)


class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100), nullable=True)
    phone = Column(String(20), index=True)
    password_hash = Column(String(255), nullable=True)
    preferred_categories = Column(Text, nullable=True)
    preferred_price_range = Column(String(50), nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow)


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    order_date = Column(DateTime, default=datetime.utcnow)
    dish_ids = Column(Text)
    total_amount = Column(Integer)
    status = Column(String(50), default="pending")
    payment_method = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    note = Column(Text, nullable=True)
    customer_name = Column(String(100), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    voucher_code = Column(String(40), nullable=True)
    discount_amount = Column(Integer, default=0)


class Rating(Base):
    __tablename__ = "ratings"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    dish_id = Column(Integer, ForeignKey("dishes.id"))
    rating = Column(Integer)
    comment = Column(Text)
    rating_date = Column(DateTime, default=datetime.utcnow)
    admin_reply = Column(Text, nullable=True)
    reply_date = Column(DateTime, nullable=True)


class Voucher(Base):
    __tablename__ = "vouchers"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(40), nullable=False, unique=True, index=True)
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    discount_type = Column(String(20), default="percent")  # percent, fixed
    discount_value = Column(Integer, default=0)
    min_order_amount = Column(Integer, default=0)
    max_discount_amount = Column(Integer, nullable=True)
    applies_to = Column(String(50), default="all")
    usage_limit = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0)
    is_active = Column(Integer, default=1)
    starts_at = Column(DateTime, nullable=True)
    ends_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
