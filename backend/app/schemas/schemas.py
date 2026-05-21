from typing import Optional, List
from pydantic import BaseModel


class DishBase(BaseModel):
    name: str
    category: str
    dish_type: Optional[str] = None
    price: int
    price_range: Optional[str] = None
    ingredients: Optional[str] = None
    detailed_ingredients: Optional[str] = None
    tags: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

class DishCreate(DishBase):
    pass

class DishUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[int] = None
    price_range: Optional[str] = None
    ingredients: Optional[str] = None
    detailed_ingredients: Optional[str] = None
    tags: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[int] = None

class DishResponse(DishBase):
    id: int
    is_active: Optional[int] = 1
    class Config:
        from_attributes = True


class RegisterRequest(BaseModel):
    name: str
    phone: str

class LoginRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    preferred_categories: Optional[str] = None
    preferred_price_range: Optional[str] = None


class CheckoutRequest(BaseModel):
    customer_id: Optional[int] = None
    items: List[dict]
    payment_method: str
    address: str
    note: Optional[str] = ""
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str  # pending, confirmed, cooking, delivering, completed, cancelled


class RatingCreate(BaseModel):
    dish_id: int
    rating: int  # 1-5
    comment: Optional[str] = ""
    customer_id: Optional[int] = None

class AdminReply(BaseModel):
    reply: str


class RecommendationRequest(BaseModel):
    dish_ids: List[int]
    top_n: int = 10
