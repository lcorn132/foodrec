"""
Augment set-menu transactions for Apriori.

The source data remains the public Com Nieu Viet Nam set menus. This script
creates additional derived transactions by resampling dishes from the same
menu position and nearby price tier. Augmented rows are marked explicitly and
must not be described as real historical orders.
"""

from __future__ import annotations

import csv
import json
import random
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
DB_DIR = BASE_DIR / "database"
CLEAN_ITEMS_FILE = DB_DIR / "set_menu_items_clean.csv"
TRANSACTIONS_FILE = DB_DIR / "set_menu_transactions_clean.csv"
AUGMENTED_TRANSACTIONS_FILE = DB_DIR / "set_menu_transactions_augmented.csv"
AUGMENTATION_REPORT_FILE = DB_DIR / "set_menu_augmentation_report.json"

TARGET_AUGMENTED_ROWS = 9800
RANDOM_SEED = 20260529


def _parse_items(raw: str) -> list[str]:
    return [item.strip() for item in str(raw or "").split("|") if item.strip()]


def _price_tier(price_vnd: int) -> str:
    if price_vnd <= 200000:
        return "budget"
    if price_vnd <= 300000:
        return "standard"
    if price_vnd <= 350000:
        return "premium"
    return "vip"


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def _write_csv(path: Path, rows: list[dict], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def _load_source() -> tuple[list[dict], dict[str, list[dict]], dict[int, list[str]], dict[tuple[int, str], list[str]]]:
    transactions = _read_csv(TRANSACTIONS_FILE)
    clean_items = [
        row for row in _read_csv(CLEAN_ITEMS_FILE)
        if str(row.get("included_in_mining", "")).strip() in {"1", "true", "True"}
    ]

    by_set: dict[str, list[dict]] = defaultdict(list)
    by_slot: dict[int, list[str]] = defaultdict(list)
    by_slot_tier: dict[tuple[int, str], list[str]] = defaultdict(list)

    for row in clean_items:
        set_id = row.get("set_id", "")
        by_set[set_id].append(row)
        try:
            slot = int(float(row.get("item_order", "0") or 0))
            price = int(float(row.get("price_vnd", "0") or 0))
        except ValueError:
            continue
        item = row.get("item_name_clean", "").strip()
        if not item:
            continue
        tier = _price_tier(price)
        if item not in by_slot[slot]:
            by_slot[slot].append(item)
        if item not in by_slot_tier[(slot, tier)]:
            by_slot_tier[(slot, tier)].append(item)

    for rows in by_set.values():
        rows.sort(key=lambda row: int(float(row.get("item_order", "0") or 0)))
    return transactions, by_set, by_slot, by_slot_tier


def _original_rows(transactions: list[dict]) -> list[dict]:
    rows = []
    for row in transactions:
        items = _parse_items(row.get("items", ""))
        rows.append({
            "transaction_id": row.get("transaction_id", ""),
            "origin_transaction_id": row.get("transaction_id", ""),
            "set_name": row.get("set_name", ""),
            "price_vnd": row.get("price_vnd", "0"),
            "price_tier": _price_tier(int(float(row.get("price_vnd", "0") or 0))),
            "source_url": row.get("source_url", ""),
            "item_count": len(items),
            "items": " | ".join(items),
            "is_augmented": 0,
            "augmentation_method": "original_public_set_menu",
            "replacement_count": 0,
            "replaced_slots": "",
        })
    return rows


def build_augmented_transactions(target_rows: int = TARGET_AUGMENTED_ROWS, seed: int = RANDOM_SEED) -> dict:
    rng = random.Random(seed)
    transactions, by_set, by_slot, by_slot_tier = _load_source()
    originals = _original_rows(transactions)
    augmented: list[dict] = []
    seen = {row["items"] for row in originals}
    source_cycle = list(transactions)
    attempts = 0
    max_attempts = target_rows * 80

    while len(augmented) < target_rows and attempts < max_attempts:
        attempts += 1
        base = source_cycle[attempts % len(source_cycle)]
        base_id = base.get("transaction_id", "")
        base_price = int(float(base.get("price_vnd", "0") or 0))
        tier = _price_tier(base_price)
        base_slots = [
            (int(float(row.get("item_order", "0") or 0)), row.get("item_name_clean", "").strip())
            for row in by_set.get(base_id, [])
            if row.get("item_name_clean", "").strip()
        ]
        if len(base_slots) < 3:
            continue

        new_items = [item for _, item in base_slots]
        slot_indexes = list(range(len(base_slots)))
        replace_count = rng.choice([1, 1, 2, 2, 3])
        replaced_slots: list[int] = []

        for idx in rng.sample(slot_indexes, min(replace_count, len(slot_indexes))):
            slot, old_item = base_slots[idx]
            candidates = list(by_slot_tier.get((slot, tier), [])) or list(by_slot.get(slot, []))
            candidates = [item for item in candidates if item != old_item and item not in new_items]
            if not candidates:
                continue
            new_items[idx] = rng.choice(candidates)
            replaced_slots.append(slot)

        if not replaced_slots:
            continue

        if len(set(new_items)) != len(new_items):
            continue
        signature = " | ".join(new_items)
        if signature in seen:
            continue
        seen.add(signature)

        tx_id = f"AUG{len(augmented) + 1:04d}"
        augmented.append({
            "transaction_id": tx_id,
            "origin_transaction_id": base_id,
            "set_name": f"Augmented from {base.get('set_name', base_id)}",
            "price_vnd": base_price,
            "price_tier": tier,
            "source_url": base.get("source_url", ""),
            "item_count": len(new_items),
            "items": signature,
            "is_augmented": 1,
            "augmentation_method": "slot_price_tier_resampling",
            "replacement_count": len(replaced_slots),
            "replaced_slots": " | ".join(str(slot) for slot in sorted(replaced_slots)),
        })

    all_rows = originals + augmented
    fieldnames = [
        "transaction_id", "origin_transaction_id", "set_name", "price_vnd",
        "price_tier", "source_url", "item_count", "items", "is_augmented",
        "augmentation_method", "replacement_count", "replaced_slots",
    ]
    _write_csv(AUGMENTED_TRANSACTIONS_FILE, all_rows, fieldnames)

    item_counts = Counter()
    for row in all_rows:
        item_counts.update(_parse_items(row["items"]))

    report = {
        "generated_on": date.today().isoformat(),
        "source": {
            "original_transactions_file": TRANSACTIONS_FILE.name,
            "clean_items_file": CLEAN_ITEMS_FILE.name,
            "augmented_transactions_file": AUGMENTED_TRANSACTIONS_FILE.name,
            "note": "Augmented rows are derived from public Com Nieu Viet Nam set menus. They are not real historical orders.",
        },
        "method": {
            "name": "slot_price_tier_resampling",
            "description": "For each public set menu, replace 1-3 dishes with dishes from the same menu position and the same price tier when possible.",
            "constraints": [
                "Only dishes appearing in the real Com Nieu Viet Nam set menu source are used.",
                "Dish count per transaction follows the original set menu.",
                "No duplicate dish within one augmented transaction.",
                "Original public set menus are preserved and marked is_augmented = 0.",
                "Derived rows are marked is_augmented = 1 and keep origin_transaction_id.",
            ],
            "seed": seed,
            "target_augmented_rows": target_rows,
        },
        "summary": {
            "original_transactions": len(originals),
            "augmented_transactions": len(augmented),
            "total_transactions": len(all_rows),
            "unique_items": len(item_counts),
            "avg_items_per_transaction": round(sum(int(row["item_count"]) for row in all_rows) / len(all_rows), 2) if all_rows else 0,
            "attempts": attempts,
        },
        "top_items": [
            {"item": item, "transaction_count": count}
            for item, count in item_counts.most_common(20)
        ],
        "preview": all_rows[:3] + augmented[:3],
    }
    with AUGMENTATION_REPORT_FILE.open("w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    return report


if __name__ == "__main__":
    result = build_augmented_transactions()
    print(json.dumps(result["summary"], ensure_ascii=False, indent=2))
    print(f"Wrote: {AUGMENTED_TRANSACTIONS_FILE}")
    print(f"Wrote: {AUGMENTATION_REPORT_FILE}")
