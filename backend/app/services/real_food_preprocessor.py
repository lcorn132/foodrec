from __future__ import annotations

import csv
import json
import re
import statistics
import unicodedata
from collections import Counter
from datetime import date
from pathlib import Path


DEFAULT_DB_DIR = Path(__file__).resolve().parents[2] / "database"
RAW_FILE = "openfoodfacts_products_raw.csv"
CLEAN_PRODUCTS_FILE = "openfoodfacts_products_clean.csv"
TRANSACTIONS_FILE = "openfoodfacts_ingredient_transactions_clean.csv"
REPORT_FILE = "openfoodfacts_preprocessing_report.json"

GENERIC_INGREDIENTS = {
    "water", "salt", "sugar", "sugars", "oil", "vegetable oil", "natural flavouring",
    "flavouring", "flavourings", "acid", "acidity regulator", "antioxidant",
    "preservative", "stabiliser", "stabilizer", "colour", "color", "emulsifier",
    "thickener", "spice", "spices", "herb", "herbs",
    "oil and fat", "added sugar", "disaccharide", "cereal", "vegetable oil and fat",
    "ingredient", "ingredients", "natural flavor", "natural flavors", "flavor",
    "flavors", "and", "or",
    "eau", "sel", "sucre", "huile", "arome", "aromes", "conservateur",
    "colorant", "emulsifiant", "acidifiant", "stabilisant", "espesante",
    "agua", "sal", "azucar", "azúcar", "aceite", "açúcar",
}


def _load_jsonish(value: str):
    value = str(value or "").strip()
    if not value:
        return []
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return [x.strip() for x in value.split(",") if x.strip()]


def _normalize_tag(tag: str) -> str:
    text = str(tag or "").strip()
    if ":" in text:
        text = text.split(":", 1)[1]
    text = urllib_unquote(text)
    text = unicodedata.normalize("NFC", text)
    text = text.replace("_", " ").replace("-", " ")
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text


def _normalize_ingredient_text(value: str) -> str:
    text = unicodedata.normalize("NFC", str(value or "")).lower()
    text = re.sub(r"\([^)]*\)", " ", text)
    text = re.sub(r"\[[^\]]*\]", " ", text)
    text = re.sub(r"\d+([.,]\d+)?\s*%", " ", text)
    text = re.sub(r"[*•]", " ", text)
    text = text.replace("_", " ").replace("-", " ")
    text = re.sub(r"\s+", " ", text).strip(" .,:;()")
    return text


def _parse_ingredients(row: dict) -> list[str]:
    text = row.get("ingredients_text") or ""
    pieces = re.split(r"[,;。\n\r]+", text)
    ingredients: list[str] = []
    for piece in pieces:
        ingredient = _normalize_ingredient_text(piece)
        if not ingredient or len(ingredient) < 2 or len(ingredient) > 55:
            continue
        if ingredient in GENERIC_INGREDIENTS:
            continue
        if any(prefix in ingredient for prefix in ["contains ", "may contain", "traces of"]):
            continue
        if ingredient not in ingredients:
            ingredients.append(ingredient)

    if len(ingredients) >= 3:
        return ingredients

    ingredients_raw = _load_jsonish(row.get("ingredients_tags"))
    fallback = []
    for tag in ingredients_raw:
        ingredient = _normalize_tag(tag)
        if not ingredient or len(ingredient) < 2:
            continue
        if ingredient in GENERIC_INGREDIENTS:
            continue
        if ingredient not in fallback:
            fallback.append(ingredient)
    return fallback


def urllib_unquote(text: str) -> str:
    try:
        from urllib.parse import unquote
        return unquote(text)
    except Exception:
        return text


def _clean_name(value: str) -> str:
    text = unicodedata.normalize("NFC", str(value or ""))
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _category_from_tags(tags: list[str]) -> str:
    cleaned = [_normalize_tag(tag) for tag in tags]
    for tag in reversed(cleaned):
        if tag and tag not in {"plant based foods and beverages", "plant based foods", "foods", "beverages"}:
            return tag
    return cleaned[-1] if cleaned else ""


def _parse_nutriments(value: str) -> dict:
    try:
        data = json.loads(value or "{}")
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def _num(data: dict, key: str) -> float | None:
    value = data.get(key)
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def run_real_food_preprocessing(data_path: Path | None = None) -> dict:
    data_path = Path(data_path) if data_path else DEFAULT_DB_DIR
    raw_path = data_path / RAW_FILE
    if not raw_path.exists():
        raise FileNotFoundError(
            f"Missing {RAW_FILE}. Run backend/scripts/collect_openfoodfacts_dataset.py first."
        )

    with raw_path.open("r", encoding="utf-8-sig", newline="") as f:
        raw_rows = list(csv.DictReader(f))

    clean_rows: list[dict] = []
    tx_rows: list[dict] = []
    counters = Counter(raw_rows=len(raw_rows))
    correction_examples: list[dict] = []
    seen_codes: set[str] = set()
    ingredient_frequency = Counter()
    category_frequency = Counter()
    country_frequency = Counter()
    ingredient_counts: list[int] = []

    for row in raw_rows:
        code = str(row.get("code") or "").strip()
        name = _clean_name(row.get("product_name"))
        if not code or code in seen_codes:
            counters["duplicate_or_missing_code"] += 1
            continue
        seen_codes.add(code)
        if not name:
            counters["missing_name"] += 1
            continue

        ingredients = _parse_ingredients(row)

        if len(ingredients) < 3:
            counters["too_few_ingredients"] += 1
            continue

        categories_tags = _load_jsonish(row.get("categories_tags"))
        countries_tags = _load_jsonish(row.get("countries_tags"))
        category = _category_from_tags(categories_tags)
        countries = [_normalize_tag(tag) for tag in countries_tags if _normalize_tag(tag)]
        nutriments = _parse_nutriments(row.get("nutriments_json"))
        energy = _num(nutriments, "energy-kcal_100g")
        fat = _num(nutriments, "fat_100g")
        carbs = _num(nutriments, "carbohydrates_100g")
        proteins = _num(nutriments, "proteins_100g")

        ingredient_frequency.update(ingredients)
        if category:
            category_frequency[category] += 1
        for country in countries[:5]:
            country_frequency[country] += 1
        ingredient_counts.append(len(ingredients))

        if name != row.get("product_name"):
            correction_examples.append({"raw": row.get("product_name", ""), "clean": name})

        clean_rows.append({
            "product_id": code,
            "product_name": name,
            "brand": _clean_name(row.get("brands")),
            "main_category": category,
            "countries": " | ".join(countries[:8]),
            "ingredient_count": len(ingredients),
            "ingredients": " | ".join(ingredients),
            "nutriscore_grade": str(row.get("nutriscore_grade") or "").lower(),
            "ecoscore_grade": str(row.get("ecoscore_grade") or "").lower(),
            "energy_kcal_100g": "" if energy is None else round(energy, 2),
            "fat_100g": "" if fat is None else round(fat, 2),
            "carbohydrates_100g": "" if carbs is None else round(carbs, 2),
            "proteins_100g": "" if proteins is None else round(proteins, 2),
            "source": "Open Food Facts",
        })
        tx_rows.append({
            "transaction_id": code,
            "product_name": name,
            "main_category": category,
            "item_count": len(ingredients),
            "items": " | ".join(ingredients),
            "source": "Open Food Facts",
        })

    clean_fields = [
        "product_id", "product_name", "brand", "main_category", "countries",
        "ingredient_count", "ingredients", "nutriscore_grade", "ecoscore_grade",
        "energy_kcal_100g", "fat_100g", "carbohydrates_100g", "proteins_100g",
        "source",
    ]
    with (data_path / CLEAN_PRODUCTS_FILE).open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=clean_fields)
        writer.writeheader()
        writer.writerows(clean_rows)

    tx_fields = ["transaction_id", "product_name", "main_category", "item_count", "items", "source"]
    with (data_path / TRANSACTIONS_FILE).open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=tx_fields)
        writer.writeheader()
        writer.writerows(tx_rows)

    report = {
        "generated_on": date.today().isoformat(),
        "data_source": {
            "name": "Open Food Facts",
            "url": "https://world.openfoodfacts.org/",
            "raw_file": RAW_FILE,
            "clean_products_file": CLEAN_PRODUCTS_FILE,
            "transactions_file": TRANSACTIONS_FILE,
            "note": "Dữ liệu sản phẩm thực phẩm thật từ Open Food Facts. Mỗi sản phẩm được xem như một giao dịch gồm các nguyên liệu được công bố trên nhãn.",
        },
        "summary": {
            "raw_rows": counters["raw_rows"],
            "clean_product_rows": len(clean_rows),
            "transactions_count": len(tx_rows),
            "unique_ingredients": len(ingredient_frequency),
            "unique_categories": len(category_frequency),
            "unique_countries": len(country_frequency),
            "duplicate_or_missing_code": counters["duplicate_or_missing_code"],
            "missing_name": counters["missing_name"],
            "too_few_ingredients": counters["too_few_ingredients"],
            "avg_ingredients_per_product": round(statistics.mean(ingredient_counts), 2) if ingredient_counts else 0,
            "min_ingredients_per_product": min(ingredient_counts) if ingredient_counts else 0,
            "max_ingredients_per_product": max(ingredient_counts) if ingredient_counts else 0,
        },
        "cleaning": {
            "steps": [
                {
                    "name": "Kiểm tra mã sản phẩm",
                    "detail": "Loại bản ghi thiếu barcode hoặc bị trùng barcode.",
                    "count": counters["duplicate_or_missing_code"],
                },
                {
                    "name": "Kiểm tra tên sản phẩm",
                    "detail": "Loại sản phẩm thiếu tên vì không thể trình bày hoặc đối chiếu.",
                    "count": counters["missing_name"],
                },
                {
                    "name": "Chuẩn hóa nguyên liệu",
                    "detail": "Chuyển ingredients_tags về chữ thường, bỏ tiền tố ngôn ngữ, thay gạch nối bằng khoảng trắng, loại từ quá tổng quát.",
                    "count": len(ingredient_frequency),
                },
                {
                    "name": "Thu giảm giao dịch quá ngắn",
                    "detail": "Loại sản phẩm có dưới 3 nguyên liệu sau chuẩn hóa vì không phù hợp khai phá luật kết hợp.",
                    "count": counters["too_few_ingredients"],
                },
                {
                    "name": "Tăng cường đặc trưng",
                    "detail": "Bổ sung nhóm sản phẩm, quốc gia, Nutri-Score, Eco-Score và chỉ số dinh dưỡng trên 100g.",
                    "count": len(clean_rows),
                },
            ],
            "correction_examples": correction_examples[:10],
        },
        "transformation": {
            "description": "Biến đổi mỗi sản phẩm thành giao dịch TID -> tập nguyên liệu để khai phá Apriori.",
            "transactions": {
                "count": len(tx_rows),
                "min_item_count": min(ingredient_counts) if ingredient_counts else 0,
                "max_item_count": max(ingredient_counts) if ingredient_counts else 0,
                "avg_item_count": round(statistics.mean(ingredient_counts), 2) if ingredient_counts else 0,
                "preview": tx_rows[:5],
            },
        },
        "reduction": {
            "description": "Loại nguyên liệu quá tổng quát và sản phẩm có quá ít nguyên liệu để giảm luật tầm thường.",
            "excluded_item_groups": [
                {
                    "group": "Nguyên liệu/từ khóa quá tổng quát",
                    "items": sorted(GENERIC_INGREDIENTS),
                    "rows": None,
                },
            ],
            "top_repeated_items": [
                {"item": item, "transaction_count": count}
                for item, count in ingredient_frequency.most_common(20)
            ],
            "top_categories": [
                {"category": item, "count": count}
                for item, count in category_frequency.most_common(20)
            ],
            "top_countries": [
                {"country": item, "count": count}
                for item, count in country_frequency.most_common(20)
            ],
        },
        "method_notes": [
            "Áp dụng tiền xử lý dữ liệu theo quy trình đã học: làm sạch, tích hợp, biến đổi, thu giảm và tăng cường đặc trưng.",
            "Áp dụng khai phá luật kết hợp: mỗi sản phẩm là một transaction, mỗi nguyên liệu là một item.",
            "Dữ liệu không được sinh ngẫu nhiên; các trường gốc lấy từ Open Food Facts, các trường tăng cường được dẫn xuất bằng code.",
        ],
    }
    with (data_path / REPORT_FILE).open("w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    return report
