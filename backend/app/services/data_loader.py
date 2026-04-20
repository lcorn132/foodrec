"""
data_loader.py — Python thuần, không cần pandas
Dùng module csv có sẵn trong stdlib
"""
import csv
from pathlib import Path
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import Dish, Customer, Order, Rating


def _parse_dt(val):
    """Parse datetime string an toàn"""
    if not val or str(val).lower() in ("nan", "none", ""):
        return datetime.utcnow()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S"):
        try:
            return datetime.strptime(str(val).strip(), fmt)
        except ValueError:
            continue
    return datetime.utcnow()


def _safe_int(val, default=0):
    try:
        return int(float(str(val).strip()))
    except (ValueError, TypeError):
        return default


def _safe_str(val):
    s = str(val).strip()
    return "" if s.lower() in ("nan", "none") else s


def load_csv_to_db(db: Session):
    """Load CSV files vào DB nếu bảng còn trống"""
    if db.query(Dish).count() > 0:
        print("Data already loaded, skipping.")
        return

    print("Loading data from CSV files...")
    data_path = Path(__file__).parent.parent.parent / "database"

    if not data_path.exists():
        print(f"WARNING: Missing data folder: {data_path}")
        return

    required = ["menu_expanded.csv", "customers.csv", "orders.csv", "ratings.csv"]
    missing = [f for f in required if not (data_path / f).exists()]
    if missing:
        print(f"WARNING: Missing CSV files: {', '.join(missing)}")
        return

    # ===== DISHES =====
    print("  Loading dishes...")
    with open(data_path / "menu_expanded.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            try:
                db.add(Dish(
                    id=_safe_int(row.get("id")),
                    name=_safe_str(row.get("name", "")),
                    category=_safe_str(row.get("category", "")),
                    dish_type=_safe_str(row.get("dish_type", "")),
                    price=_safe_int(row.get("price")),
                    price_range=_safe_str(row.get("price_range", "")),
                    ingredients=_safe_str(row.get("ingredients", "")),
                    detailed_ingredients=_safe_str(row.get("detailed_ingredients", "")),
                    tags=_safe_str(row.get("tags", "")),
                    description=_safe_str(row.get("description", "")),
                    image_url=_safe_str(row.get("image_url", "")),
                ))
            except Exception as e:
                print(f"  Skip dish row: {e}")
    db.commit()

    # ===== CUSTOMERS =====
    print("  Loading customers...")
    with open(data_path / "customers.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            try:
                db.add(Customer(
                    id=_safe_int(row.get("customer_id")),
                    name=_safe_str(row.get("name", "")),
                    email=_safe_str(row.get("email", "")),
                    phone=_safe_str(row.get("phone", "")),
                    preferred_categories=_safe_str(row.get("preferred_categories", "")),
                    preferred_price_range=_safe_str(row.get("preferred_price_range", "")),
                    created_date=_parse_dt(row.get("created_date")),
                ))
            except Exception as e:
                print(f"  Skip customer row: {e}")
    db.commit()

    # ===== ORDERS =====
    print("  Loading orders...")
    with open(data_path / "orders.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            try:
                db.add(Order(
                    id=_safe_int(row.get("order_id")),
                    customer_id=_safe_int(row.get("customer_id")),
                    order_date=_parse_dt(row.get("order_date")),
                    dish_ids=_safe_str(row.get("dish_ids", "")),
                    total_amount=_safe_int(row.get("total_amount")),
                    status=_safe_str(row.get("status", "completed")),
                ))
            except Exception as e:
                print(f"  Skip order row: {e}")
    db.commit()

    # ===== RATINGS =====
    print("  Loading ratings...")
    with open(data_path / "ratings.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            try:
                db.add(Rating(
                    id=_safe_int(row.get("rating_id")),
                    customer_id=_safe_int(row.get("customer_id")),
                    dish_id=_safe_int(row.get("dish_id")),
                    rating=_safe_int(row.get("rating", 5)),
                    comment=_safe_str(row.get("comment", "")),
                    rating_date=_parse_dt(row.get("rating_date")),
                ))
            except Exception as e:
                print(f"  Skip rating row: {e}")
    db.commit()

    print(
        f"✅ Loaded: {db.query(Dish).count()} dishes, "
        f"{db.query(Customer).count()} customers, "
        f"{db.query(Order).count()} orders, "
        f"{db.query(Rating).count()} ratings"
    )
