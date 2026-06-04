import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, SessionLocal, engine, ensure_database_schema
from app.models.models import Dish, Customer, Order, Rating
from app.routers import dishes, orders, recommendations, auth, analytics, ratings, data_pipeline
from app.services.data_loader import load_csv_to_db

Base.metadata.create_all(bind=engine)
ensure_database_schema()

app = FastAPI(
    title="FoodRec API",
    description="Hệ thống gợi ý thực đơn — Đồ án KPDL",
    version="3.0.0"
)

# Cho phép tất cả origins — phù hợp cho demo/đồ án
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dishes.router)
app.include_router(orders.router)
app.include_router(ratings.router)
app.include_router(recommendations.router)
app.include_router(analytics.router)
app.include_router(data_pipeline.router)


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
