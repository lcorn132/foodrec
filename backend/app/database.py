import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import inspect, text

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# Neon và một số PostgreSQL provider dùng "postgres://" (cũ)
# SQLAlchemy cần "postgresql://" → tự fix
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Tạo engine phù hợp với từng loại DB
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL / Neon — cần pool_pre_ping để tránh connection timeout
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        connect_args={"sslmode": "require"} if "neon.tech" in DATABASE_URL else {},
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_database_schema():
    """Add columns introduced after the first deploy.

    SQLAlchemy create_all() creates missing tables, but it does not alter
    existing tables. Render/PostgreSQL deployments that already had the old
    schema need these additive columns before startup queries run.
    """
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    if not existing_tables:
        return

    migrations = {
        "dishes": {
            "source_url": "VARCHAR(500)",
            "is_available": "INTEGER DEFAULT 1",
            "sort_order": "INTEGER DEFAULT 0",
            "prep_time": "INTEGER DEFAULT 20",
        },
        "customers": {
            "password_hash": "VARCHAR(255)",
        },
        "orders": {
            "payment_method": "VARCHAR(50)",
            "address": "TEXT",
            "note": "TEXT",
            "customer_name": "VARCHAR(100)",
            "customer_phone": "VARCHAR(20)",
            "voucher_code": "VARCHAR(40)",
            "discount_amount": "INTEGER DEFAULT 0",
        },
        "ratings": {
            "admin_reply": "TEXT",
            "reply_date": "TIMESTAMP",
        },
        "vouchers": {
            "description": "TEXT",
            "discount_type": "VARCHAR(20) DEFAULT 'percent'",
            "discount_value": "INTEGER DEFAULT 0",
            "min_order_amount": "INTEGER DEFAULT 0",
            "max_discount_amount": "INTEGER",
            "applies_to": "VARCHAR(50) DEFAULT 'all'",
            "usage_limit": "INTEGER",
            "used_count": "INTEGER DEFAULT 0",
            "is_active": "INTEGER DEFAULT 1",
            "starts_at": "TIMESTAMP",
            "ends_at": "TIMESTAMP",
            "created_at": "TIMESTAMP",
        },
    }

    with engine.begin() as conn:
        for table_name, columns in migrations.items():
            if table_name not in existing_tables:
                continue
            existing_columns = {
                column["name"] for column in inspector.get_columns(table_name)
            }
            for column_name, ddl in columns.items():
                if column_name not in existing_columns:
                    conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {ddl}"))
