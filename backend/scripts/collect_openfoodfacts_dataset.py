"""
Collect real food product data from Open Food Facts.

The script intentionally stores raw records before cleaning so the project can
show a clear data-mining pipeline: collect -> clean -> transform -> mine.
Open Food Facts is an open, collaborative food product database.
"""

from __future__ import annotations

import csv
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
DB_DIR = BASE_DIR / "database"
RAW_FILE = DB_DIR / "openfoodfacts_products_raw.csv"

API_URL = "https://world.openfoodfacts.org/cgi/search.pl"
FIELDS = [
    "code",
    "product_name",
    "brands",
    "quantity",
    "categories",
    "categories_tags",
    "countries",
    "countries_tags",
    "ingredients_text",
    "ingredients_tags",
    "nutriscore_grade",
    "ecoscore_grade",
    "nutriments",
]


def _request_json(params: dict, retries: int = 4) -> dict:
    query = urllib.parse.urlencode(params, doseq=True)
    req = urllib.request.Request(
        f"{API_URL}?{query}",
        headers={
            "User-Agent": "FoodRecDataMiningProject/1.0 (educational use)",
            "Accept": "application/json",
        },
    )
    last_error = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                return json.loads(response.read().decode("utf-8"))
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
            last_error = exc
            time.sleep(1.5 * (attempt + 1))
    raise last_error


def _as_json_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def collect(
    target_rows: int = 8000,
    page_size: int = 100,
    categories: list[str] | None = None,
    sleep_seconds: float = 0.5,
    max_pages_per_category: int = 6,
) -> dict:
    categories = categories or [
        "sauces",
        "breakfast-cereals",
        "chocolates",
        "pasta-dishes",
        "frozen-foods",
        "instant-noodles",
        "snacks",
    ]
    DB_DIR.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "source",
        "code",
        "product_name",
        "brands",
        "quantity",
        "categories",
        "categories_tags",
        "countries",
        "countries_tags",
        "ingredients_text",
        "ingredients_tags",
        "nutriscore_grade",
        "ecoscore_grade",
        "nutriments_json",
    ]

    rows: list[dict] = []
    seen_codes: set[str] = set()
    total_available = None
    source_counts: dict[str, int] = {}

    for category in categories:
        page = 1
        consecutive_errors = 0
        before = len(rows)
        while len(rows) < target_rows and page <= max_pages_per_category:
            params = {
                "search_simple": 1,
                "action": "process",
                "json": 1,
                "page_size": page_size,
                "page": page,
                "fields": ",".join(FIELDS),
                "sort_by": "unique_scans_n",
                "tagtype_0": "categories",
                "tag_contains_0": "contains",
                "tag_0": category,
            }
            try:
                data = _request_json(params)
            except Exception:
                consecutive_errors += 1
                if consecutive_errors >= 2:
                    break
                page += 1
                continue
            consecutive_errors = 0
            total_available = data.get("count", total_available)
            products = data.get("products") or []
            if not products:
                break

            for product in products:
                code = str(product.get("code") or "").strip()
                if not code or code in seen_codes:
                    continue
                seen_codes.add(code)
                rows.append({
                    "source": "Open Food Facts",
                    "code": code,
                    "product_name": product.get("product_name") or "",
                    "brands": product.get("brands") or "",
                    "quantity": product.get("quantity") or "",
                    "categories": product.get("categories") or "",
                    "categories_tags": _as_json_text(product.get("categories_tags")),
                    "countries": product.get("countries") or "",
                    "countries_tags": _as_json_text(product.get("countries_tags")),
                    "ingredients_text": product.get("ingredients_text") or "",
                    "ingredients_tags": _as_json_text(product.get("ingredients_tags")),
                    "nutriscore_grade": product.get("nutriscore_grade") or "",
                    "ecoscore_grade": product.get("ecoscore_grade") or "",
                    "nutriments_json": _as_json_text(product.get("nutriments")),
                })
                if len(rows) >= target_rows:
                    break

            page += 1
            time.sleep(sleep_seconds)
        source_counts[category] = len(rows) - before
        _write_raw_rows(rows, fieldnames)
        if len(rows) >= target_rows:
            break

    _write_raw_rows(rows, fieldnames)

    return {
        "raw_file": str(RAW_FILE),
        "rows": len(rows),
        "categories": categories,
        "source_counts": source_counts,
        "total_available": total_available,
    }


def _write_raw_rows(rows: list[dict], fieldnames: list[str]) -> None:
    with RAW_FILE.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    print(json.dumps(collect(), ensure_ascii=False, indent=2))
