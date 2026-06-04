from __future__ import annotations

import csv
import json
import re
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.models.models import Dish, Order, Rating


DATABASE_DIR = Path(__file__).resolve().parents[2] / "database"
RAW_DIR = DATABASE_DIR / "raw"
PROCESSED_DIR = DATABASE_DIR / "processed"
REPORT_PATH = PROCESSED_DIR / "advanced_mining_report.json"
STATS_PATH = PROCESSED_DIR / "report_assets" / "data_statistics_report.json"
CHART_DIR = PROCESSED_DIR / "report_assets" / "charts"


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(float(str(value or "").strip()))
    except (TypeError, ValueError):
        return default


def _safe_text(value: Any) -> str:
    text = str(value or "").strip()
    return "" if text.casefold() in {"nan", "none"} else text


def _dish_id(value: str, fallback: int) -> int:
    match = re.search(r"(\d+)", str(value or ""))
    return int(match.group(1)) if match else fallback


def _read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def _read_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def _generated_csv_path(report: dict[str, Any], output_key: str, pattern: str, fallback: str) -> Path:
    name = report.get("outputs", {}).get(output_key)
    if name:
        return PROCESSED_DIR / name
    candidates = sorted(PROCESSED_DIR.glob(pattern))
    if not candidates:
        return PROCESSED_DIR / fallback

    def numeric_suffix(path: Path) -> int:
        digits = "".join(ch for ch in path.stem if ch.isdigit())
        return int(digits) if digits else 0

    return max(candidates, key=numeric_suffix)


def raw_files() -> list[dict[str, Any]]:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    return [
        {
            "name": path.name,
            "size": path.stat().st_size,
            "modified": path.stat().st_mtime,
        }
        for path in sorted(RAW_DIR.glob("*"))
        if path.is_file()
    ]


def chart_files() -> list[dict[str, Any]]:
    if not CHART_DIR.exists():
        return []
    return [
        {
            "name": path.name,
            "title": path.stem.replace("_", " ").title(),
            "size": path.stat().st_size,
            "modified": path.stat().st_mtime,
            "url": f"/api/data-pipeline/charts/{path.name}",
        }
        for path in sorted(CHART_DIR.glob("*.png"))
    ]


def processed_dishes() -> list[dict[str, Any]]:
    rows = _read_csv(PROCESSED_DIR / "dishes_clean.csv")
    dishes = []
    for index, row in enumerate(rows, start=1):
        source_dish_id = _safe_text(row.get("dish_id")) or str(index)
        dish_id = _dish_id(source_dish_id, index)
        dishes.append(
            {
                "id": dish_id,
                "dish_id": dish_id,
                "source_dish_id": source_dish_id,
                "name": _safe_text(row.get("name")),
                "category": _safe_text(row.get("category_label") or row.get("category")),
                "category_key": _safe_text(row.get("category")),
                "dish_type": _safe_text(row.get("cluster_label") or row.get("meal_role")),
                "price": _safe_int(row.get("price_vnd")),
                "price_range": _safe_text(row.get("price_range")),
                "ingredients": _safe_text(row.get("keywords")),
                "description": _safe_text(row.get("description")),
                "image_url": _safe_text(row.get("image_url")),
                "source_url": _safe_text(row.get("source_url")),
                "source_files": _safe_text(row.get("source_files")),
                "is_set_menu": _safe_int(row.get("is_set_menu")),
                "sort_order": index,
            }
        )
    return dishes


def pipeline_status() -> dict[str, Any]:
    report = _read_json(REPORT_PATH)
    stats = _read_json(STATS_PATH)
    dishes = _read_csv(PROCESSED_DIR / "dishes_clean.csv")
    similarity_rows = _read_csv(PROCESSED_DIR / "content_similarity_recommendations.csv")
    return {
        "raw_files": raw_files(),
        "processed_ready": REPORT_PATH.exists() and bool(dishes),
        "processed_dir": str(PROCESSED_DIR),
        "summary": {
            "raw_rows": report.get("raw_menu_preprocessing", {}).get("raw_rows", 0),
            "clean_dishes": len(dishes),
            "set_menu_items": len(_read_csv(PROCESSED_DIR / "set_menu_items_clean.csv")),
            "kmeans_clusters": len(report.get("kmeans", {}).get("clusters", [])),
            "content_similarity_rows": len(similarity_rows),
        },
        "report": report,
        "statistics": stats,
        "charts": chart_files(),
    }


def save_uploaded_files(files: list[tuple[str, bytes]], clear_existing: bool = False) -> dict[str, Any]:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    if clear_existing and RAW_DIR.exists():
        for old_file in RAW_DIR.glob("*"):
            if old_file.is_file():
                old_file.unlink()

    saved = []
    for original_name, content in files:
        suffix = Path(original_name).suffix.lower()
        if suffix not in {".xlsx", ".xlsm"}:
            raise ValueError(f"Chỉ hỗ trợ file Excel .xlsx/.xlsm: {original_name}")
        safe_name = re.sub(r"[^A-Za-z0-9_.-]+", "_", Path(original_name).name)
        target = RAW_DIR / safe_name
        target.write_bytes(content)
        saved.append({"name": safe_name, "size": len(content)})
    return {"saved": saved, "raw_files": raw_files()}


def run_processing_pipeline(load_to_db: bool = True, db: Session | None = None) -> dict[str, Any]:
    from scripts.generate_data_report_assets import main as generate_assets
    from scripts.run_advanced_pipeline import main as run_advanced_pipeline

    run_advanced_pipeline()
    generate_assets()
    loaded = None
    if load_to_db and db is not None:
        loaded = load_processed_dishes_to_db(db, replace=True)
    status = pipeline_status()
    status["db_load"] = loaded
    return status


def load_processed_dishes_to_db(db: Session, replace: bool = True) -> dict[str, Any]:
    dishes_path = PROCESSED_DIR / "dishes_clean.csv"
    rows = _read_csv(dishes_path)
    if not rows:
        return {"loaded": 0, "source": str(dishes_path), "status": "missing_or_empty"}

    if replace:
        db.query(Rating).delete()
        db.query(Order).delete()
        db.query(Dish).delete()
        db.commit()

    loaded = 0
    for idx, row in enumerate(rows, start=1):
        db.add(
            Dish(
                id=_dish_id(row.get("dish_id", ""), idx),
                name=_safe_text(row.get("name")),
                category=_safe_text(row.get("category_label") or row.get("category")),
                dish_type=_safe_text(row.get("cluster_label")),
                price=_safe_int(row.get("price_vnd")),
                price_range=_safe_text(row.get("price_range")),
                ingredients=_safe_text(row.get("keywords")),
                detailed_ingredients=_safe_text(row.get("keywords")),
                tags="",
                description=_safe_text(row.get("description")),
                image_url=_safe_text(row.get("image_url")),
                source_url=_safe_text(row.get("source_url")),
                is_active=1,
                is_available=1,
                sort_order=idx,
                prep_time=20,
            )
        )
        loaded += 1
    db.commit()
    return {"loaded": loaded, "source": str(dishes_path), "status": "ok"}


def resolve_chart_path(filename: str) -> Path:
    safe_name = Path(filename).name
    path = CHART_DIR / safe_name
    if not path.exists() or path.suffix.lower() != ".png":
        raise FileNotFoundError(safe_name)
    return path
