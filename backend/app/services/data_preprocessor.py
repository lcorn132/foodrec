from __future__ import annotations

from pathlib import Path

from app.services.real_food_preprocessor import run_real_food_preprocessing


DEFAULT_DB_DIR = Path(__file__).resolve().parents[2] / "database"


def run_preprocessing(data_path: Path | None = None) -> dict:
    """Return the preprocessing report used by the dashboard."""
    data_path = Path(data_path) if data_path else DEFAULT_DB_DIR
    return run_real_food_preprocessing(data_path)
