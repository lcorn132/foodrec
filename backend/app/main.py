import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, SessionLocal, engine
from app.models.models import Dish, Customer, Order, Rating
from app.routers import dishes, orders, recommendations, auth, analytics, ratings
from app.services.data_loader import load_csv_to_db

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FoodRec API",
    description="Hệ thống gợi ý thực đơn — Đồ án KPDL",
    version="3.0.0"
)

# Đọc ALLOWED_ORIGINS từ env (để thêm domain Vercel linh hoạt)
FRONTEND_URL = os.getenv("FRONTEND_URL", "")

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Thêm Vercel domain nếu có
if FRONTEND_URL:
    origins.append(FRONTEND_URL)

# Cho phép tất cả *.vercel.app (để preview deployments cũng hoạt động)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dishes.router)
app.include_router(orders.router)
app.include_router(ratings.router)
app.include_router(recommendations.router)
app.include_router(analytics.router)


@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        load_csv_to_db(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "FoodRec API v3.0", "docs": "/docs", "status": "running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
