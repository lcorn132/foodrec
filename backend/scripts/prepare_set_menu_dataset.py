"""
prepare_set_menu_dataset.py

Chuyển dữ liệu set menu thu thập từ website Cơm Niêu Việt Nam thành:
1) Bảng item sạch theo từng set menu.
2) Bảng giao dịch món ăn phục vụ khai phá luật kết hợp Apriori.

Dữ liệu đầu vào: backend/database/set_menu_items_raw.csv
Dữ liệu đầu ra:
- backend/database/set_menu_items_clean.csv
- backend/database/set_menu_transactions_clean.csv
- backend/database/set_menu_preprocessing_report.json
"""

from __future__ import annotations

import csv
import json
import re
import unicodedata
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Iterable


BASE_DIR = Path(__file__).resolve().parents[1]
DB_DIR = BASE_DIR / "database"
RAW_FILE = DB_DIR / "set_menu_items_raw.csv"
CLEAN_ITEMS_FILE = DB_DIR / "set_menu_items_clean.csv"
TRANSACTIONS_FILE = DB_DIR / "set_menu_transactions_clean.csv"
REPORT_FILE = DB_DIR / "set_menu_preprocessing_report.json"

SERVICE_ITEMS = {"Trái cây", "Khăn lạnh", "Trà đá"}
COMMON_ITEMS_EXCLUDED_FROM_MINING = SERVICE_ITEMS | {"Cơm niêu"}

REPLACEMENTS = {
    "ĐD": "ĐẠI DƯƠNG",
    "XẢ": "SẢ",
    "PHÚ QUÔC": "PHÚ QUỐC",
    "ĐAI DƯƠNG": "ĐẠI DƯƠNG",
    "  ": " ",
}


@dataclass(frozen=True)
class CleanItem:
    set_id: str
    set_name: str
    price_vnd: int
    source_url: str
    item_order: int
    raw_item_text: str
    item_name_clean: str
    item_role: str  # core | service | common
    included_in_mining: bool


def _normalize_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip())


def _sentence_case_vietnamese(text: str) -> str:
    """Giữ chữ cái đầu mỗi thành phần đẹp hơn so với .title() trong tiếng Việt."""
    text = text.lower()
    if not text:
        return text
    return text[0].upper() + text[1:]


def normalize_item_name(raw: str) -> str:
    text = unicodedata.normalize("NFC", raw or "")
    text = text.replace(" ", " ")
    text = _normalize_spaces(text.upper())
    for old, new in REPLACEMENTS.items():
        text = text.replace(old, new)
    text = _normalize_spaces(text)
    return _sentence_case_vietnamese(text)


def split_bundle(raw: str) -> list[str]:
    """Tách item dạng 'TRÁI CÂY + KHĂN LẠNH + TRÀ ĐÁ'."""
    if "+" not in raw:
        return [raw]
    return [piece.strip() for piece in raw.split("+") if piece.strip()]


def classify_item(item_name: str) -> tuple[str, bool]:
    if item_name in SERVICE_ITEMS:
        return "service", False
    if item_name == "Cơm niêu":
        return "common", False
    return "core", True


def read_raw_rows(path: Path = RAW_FILE) -> list[dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(f"Không tìm thấy dữ liệu thô: {path}")
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def prepare_rows(raw_rows: Iterable[dict[str, str]]) -> tuple[list[CleanItem], dict]:
    clean_items: list[CleanItem] = []
    counters = Counter()
    correction_examples: list[dict[str, str]] = []
    seen_clean_keys: set[tuple[str, str]] = set()
    duplicate_items_removed = 0

    raw_rows = list(raw_rows)
    counters["raw_rows"] = len(raw_rows)
    counters["set_menu_count"] = len({row.get("set_id", "") for row in raw_rows})

    for row in raw_rows:
        set_id = _normalize_spaces(row.get("set_id", ""))
        set_name = _normalize_spaces(row.get("set_name", ""))
        source_url = _normalize_spaces(row.get("source_url", ""))
        raw_text = _normalize_spaces(row.get("raw_item_text", ""))

        try:
            price_vnd = int(float(row.get("price_vnd", "0")))
        except (TypeError, ValueError):
            price_vnd = 0
            counters["invalid_prices"] += 1

        try:
            item_order = int(float(row.get("item_order", "0")))
        except (TypeError, ValueError):
            item_order = 0
            counters["invalid_item_orders"] += 1

        if not set_id or not set_name or not raw_text:
            counters["missing_critical_fields"] += 1
            continue

        split_items = split_bundle(raw_text)
        if len(split_items) > 1:
            counters["bundle_rows_split"] += 1
            counters["bundle_items_created"] += len(split_items)

        for split_piece in split_items:
            clean_name = normalize_item_name(split_piece)
            role, include = classify_item(clean_name)
            clean_key = (set_id, clean_name)
            if clean_key in seen_clean_keys:
                duplicate_items_removed += 1
                continue
            seen_clean_keys.add(clean_key)

            if clean_name != _sentence_case_vietnamese(_normalize_spaces(split_piece.upper())):
                correction_examples.append({
                    "raw": split_piece,
                    "clean": clean_name,
                })

            clean_items.append(CleanItem(
                set_id=set_id,
                set_name=set_name,
                price_vnd=price_vnd,
                source_url=source_url,
                item_order=item_order,
                raw_item_text=raw_text,
                item_name_clean=clean_name,
                item_role=role,
                included_in_mining=include,
            ))

    counters["clean_item_rows"] = len(clean_items)
    counters["duplicate_items_removed"] = duplicate_items_removed
    counters["service_items_rows"] = sum(1 for item in clean_items if item.item_role == "service")
    counters["common_items_rows"] = sum(1 for item in clean_items if item.item_role == "common")
    counters["mining_item_rows"] = sum(1 for item in clean_items if item.included_in_mining)
    counters["unique_clean_items"] = len({item.item_name_clean for item in clean_items})
    counters["unique_mining_items"] = len({item.item_name_clean for item in clean_items if item.included_in_mining})

    report = {
        "generated_on": date.today().isoformat(),
        "summary": dict(counters),
        "correction_examples": correction_examples[:10],
    }
    return clean_items, report


def write_clean_items(items: list[CleanItem], path: Path = CLEAN_ITEMS_FILE) -> None:
    fieldnames = [
        "set_id", "set_name", "price_vnd", "source_url", "item_order",
        "raw_item_text", "item_name_clean", "item_role", "included_in_mining",
    ]
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for item in items:
            writer.writerow({
                "set_id": item.set_id,
                "set_name": item.set_name,
                "price_vnd": item.price_vnd,
                "source_url": item.source_url,
                "item_order": item.item_order,
                "raw_item_text": item.raw_item_text,
                "item_name_clean": item.item_name_clean,
                "item_role": item.item_role,
                "included_in_mining": int(item.included_in_mining),
            })


def build_transactions(items: list[CleanItem]) -> list[dict[str, str | int]]:
    groups: dict[str, dict[str, object]] = defaultdict(lambda: {
        "set_name": "",
        "price_vnd": 0,
        "source_url": "",
        "items": [],
        "all_items": [],
        "service_items": [],
    })

    for item in sorted(items, key=lambda x: (x.set_id, x.item_order, x.item_name_clean)):
        group = groups[item.set_id]
        group["set_name"] = item.set_name
        group["price_vnd"] = item.price_vnd
        group["source_url"] = item.source_url
        group["all_items"].append(item.item_name_clean)
        if item.item_role == "service":
            group["service_items"].append(item.item_name_clean)
        if item.included_in_mining:
            group["items"].append(item.item_name_clean)

    transactions: list[dict[str, str | int]] = []
    for set_id, group in groups.items():
        mining_items = list(dict.fromkeys(group["items"]))
        transactions.append({
            "transaction_id": set_id,
            "set_name": str(group["set_name"]),
            "price_vnd": int(group["price_vnd"]),
            "source_url": str(group["source_url"]),
            "item_count": len(mining_items),
            "items": " | ".join(mining_items),
            "all_clean_items": " | ".join(list(dict.fromkeys(group["all_items"]))),
            "excluded_items": " | ".join(sorted(COMMON_ITEMS_EXCLUDED_FROM_MINING & set(group["all_items"]))),
        })
    return transactions


def write_transactions(transactions: list[dict[str, str | int]], path: Path = TRANSACTIONS_FILE) -> None:
    fieldnames = [
        "transaction_id", "set_name", "price_vnd", "source_url", "item_count",
        "items", "all_clean_items", "excluded_items",
    ]
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(transactions)


def enrich_report(report: dict, transactions: list[dict[str, str | int]]) -> dict:
    item_counts = Counter()
    for tx in transactions:
        item_counts.update([x.strip() for x in str(tx["items"]).split("|") if x.strip()])
    report["transactions"] = {
        "count": len(transactions),
        "min_item_count": min((int(tx["item_count"]) for tx in transactions), default=0),
        "max_item_count": max((int(tx["item_count"]) for tx in transactions), default=0),
        "avg_item_count": round(sum(int(tx["item_count"]) for tx in transactions) / len(transactions), 2) if transactions else 0,
        "top_repeated_items": [
            {"item": name, "transaction_count": count}
            for name, count in item_counts.most_common(10)
        ],
        "preview": transactions[:4],
    }
    report["method_notes"] = [
        "Tách dòng gộp 'Trái cây + Khăn lạnh + Trà đá' thành các item riêng để xử lý nhất quán.",
        "Chuẩn hóa biểu diễn tên món: khoảng trắng, chữ hoa/thường, 'ĐD' → 'Đại dương', 'Xả' → 'Sả', 'Phú Quôc' → 'Phú Quốc'.",
        "Loại 'Trái cây', 'Khăn lạnh', 'Trà đá' và 'Cơm niêu' khỏi tập dùng khai phá để tránh luật hiển nhiên xuất hiện gần như mọi set menu.",
        "Mỗi set menu được xem như một giao dịch phục vụ Apriori.",
    ]
    return report


def write_report(report: dict, path: Path = REPORT_FILE) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)


def run() -> dict:
    raw_rows = read_raw_rows()
    clean_items, report = prepare_rows(raw_rows)
    transactions = build_transactions(clean_items)
    report = enrich_report(report, transactions)
    write_clean_items(clean_items)
    write_transactions(transactions)
    write_report(report)
    import importlib.util
    import sys
    augment_path = Path(__file__).with_name("augment_set_menu_transactions.py")
    spec = importlib.util.spec_from_file_location("augment_set_menu_transactions", augment_path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Không thể nạp script augment_set_menu_transactions.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    report["augmentation"] = module.build_augmented_transactions()
    return report


if __name__ == "__main__":
    result = run()
    print(json.dumps(result["summary"], ensure_ascii=False, indent=2))
    print(f"Đã ghi: {CLEAN_ITEMS_FILE}")
    print(f"Đã ghi: {TRANSACTIONS_FILE}")
    print(f"Đã ghi: {REPORT_FILE}")
