"""
Apriori cho đề tài: tìm mối quan hệ giữa các món ăn trong set menu nhà hàng.

Nguồn giao dịch:
- backend/database/set_menu_transactions_clean.csv
- Mỗi dòng = 1 set menu = 1 transaction.
- Trường `items` đã loại các item hiển nhiên/quá phổ biến như Cơm niêu,
  Trái cây, Khăn lạnh, Trà đá để tránh luật tầm thường.
"""

from __future__ import annotations

import csv
import math
from collections import Counter, defaultdict
from itertools import combinations
from pathlib import Path


DEFAULT_DB_DIR = Path(__file__).resolve().parents[2] / "database"
TRANSACTIONS_FILE = "set_menu_transactions_clean.csv"

_cache: dict = {}


def _parse_items(items_raw: str) -> list[str]:
    return [item.strip() for item in str(items_raw or "").split("|") if item.strip()]


def _get_frequent_itemsets(transactions: list[list[str]], min_support: float) -> tuple[dict[frozenset[str], int], int, int]:
    n = len(transactions)
    if n == 0:
        return {}, 0, 0

    min_count = max(1, math.ceil(min_support * n))
    tx_sets = [frozenset(tx) for tx in transactions]

    item_counts = Counter(item for tx in tx_sets for item in tx)
    current = {
        frozenset([item]): count
        for item, count in item_counts.items()
        if count >= min_count
    }
    all_freq: dict[frozenset[str], int] = dict(current)

    k = 2
    while current:
        prev_itemsets = sorted(current.keys(), key=lambda s: tuple(sorted(s)))
        candidates: set[frozenset[str]] = set()
        for i in range(len(prev_itemsets)):
            for j in range(i + 1, len(prev_itemsets)):
                union = prev_itemsets[i] | prev_itemsets[j]
                if len(union) != k:
                    continue
                # Prune theo nguyên lý Apriori: mọi tập con (k-1) phải phổ biến.
                if all(frozenset(sub) in current for sub in combinations(union, k - 1)):
                    candidates.add(frozenset(union))

        if not candidates:
            break

        counts = defaultdict(int)
        for tx in tx_sets:
            for candidate in candidates:
                if candidate.issubset(tx):
                    counts[candidate] += 1

        current = {
            candidate: count
            for candidate, count in counts.items()
            if count >= min_count
        }
        all_freq.update(current)
        k += 1

        # Dữ liệu set menu nhỏ, nhưng giới hạn độ dài giúp dashboard gọn và chạy nhanh.
        if k > 4:
            break

    return all_freq, n, min_count


def _generate_rules(
    freq_itemsets: dict[frozenset[str], int],
    n_transactions: int,
    min_confidence: float,
    min_lift: float,
) -> list[dict]:
    rules: list[dict] = []
    if n_transactions == 0:
        return rules

    for itemset, union_count in freq_itemsets.items():
        if len(itemset) < 2:
            continue
        union_support = union_count / n_transactions
        ordered_items = sorted(itemset)

        for r in range(1, len(ordered_items)):
            for ant_tuple in combinations(ordered_items, r):
                antecedent = frozenset(ant_tuple)
                consequent = itemset - antecedent
                if not consequent:
                    continue

                ant_count = freq_itemsets.get(antecedent)
                con_count = freq_itemsets.get(consequent)
                if not ant_count or not con_count:
                    continue

                confidence = union_count / ant_count
                consequent_support = con_count / n_transactions
                lift = confidence / consequent_support if consequent_support else 0

                if confidence >= min_confidence and lift >= min_lift:
                    rules.append({
                        "antecedent": sorted(antecedent),
                        "consequent": sorted(consequent),
                        "support": round(union_support, 4),
                        "confidence": round(confidence, 4),
                        "lift": round(lift, 4),
                        "support_count": union_count,
                        "antecedent_count": ant_count,
                        "consequent_count": con_count,
                    })

    rules.sort(key=lambda rule: (-rule["lift"], -rule["confidence"], -rule["support"], rule["antecedent"]))
    return rules


class SetMenuAssociationMiner:
    def __init__(self, data_path: Path | None = None):
        self.data_path = Path(data_path) if data_path else DEFAULT_DB_DIR
        self.transaction_rows: list[dict] = []
        self.transactions: list[list[str]] = []
        self.item_to_transactions: dict[str, set[str]] = defaultdict(set)
        self._load()

    def _load(self) -> None:
        path = self.data_path / TRANSACTIONS_FILE
        if not path.exists():
            # Tạo dữ liệu sạch nếu chưa tồn tại.
            from app.services.data_preprocessor import run_preprocessing
            run_preprocessing(self.data_path)

        with path.open("r", encoding="utf-8-sig", newline="") as f:
            for row in csv.DictReader(f):
                items = _parse_items(row.get("items", ""))
                if len(items) < 2:
                    continue
                self.transaction_rows.append({
                    "transaction_id": row.get("transaction_id", ""),
                    "set_name": row.get("set_name", ""),
                    "price_vnd": int(float(row.get("price_vnd", "0") or 0)),
                    "source_url": row.get("source_url", ""),
                    "items": items,
                    "item_count": len(items),
                    "excluded_items": _parse_items(str(row.get("excluded_items", "")).replace(" | ", "|")),
                })
                self.transactions.append(items)
                tx_id = row.get("transaction_id", "")
                for item in items:
                    self.item_to_transactions[item].add(tx_id)

    def run(self, min_support: float = 0.15, min_confidence: float = 0.60, min_lift: float = 1.05) -> dict:
        freq_itemsets, n, min_count = _get_frequent_itemsets(self.transactions, min_support)
        rules = _generate_rules(freq_itemsets, n, min_confidence, min_lift)

        frequent_itemsets = []
        for itemset, count in freq_itemsets.items():
            if len(itemset) < 2:
                continue
            frequent_itemsets.append({
                "itemset": sorted(itemset),
                "support": round(count / n, 4) if n else 0,
                "count": count,
            })
        frequent_itemsets.sort(key=lambda row: (-row["support"], -len(row["itemset"]), row["itemset"]))

        single_supports = []
        for itemset, count in freq_itemsets.items():
            if len(itemset) == 1:
                item = next(iter(itemset))
                single_supports.append({
                    "item": item,
                    "support": round(count / n, 4) if n else 0,
                    "count": count,
                })
        single_supports.sort(key=lambda row: (-row["count"], row["item"]))

        return {
            "transactions_count": n,
            "transactions_preview": self.transaction_rows[:5],
            "single_item_supports": single_supports[:20],
            "frequent_itemsets": frequent_itemsets[:40],
            "rules": rules[:60],
            "stats": {
                "min_support": min_support,
                "min_support_count": min_count,
                "min_confidence": min_confidence,
                "min_lift": min_lift,
                "total_unique_items": len({item for tx in self.transactions for item in tx}),
                "total_freq_itemsets": len(freq_itemsets),
                "total_rules": len(rules),
                "mean_transaction_size": round(sum(len(tx) for tx in self.transactions) / n, 2) if n else 0,
            },
        }

    def get_recommendations(self, dish_name: str, top_n: int = 8) -> list[dict]:
        dish_name = str(dish_name or "").strip()
        if not dish_name:
            return []
        canonical = None
        for item in self.item_to_transactions:
            if item.casefold() == dish_name.casefold():
                canonical = item
                break
        if canonical is None:
            return []

        result = self.run(min_support=0.15, min_confidence=0.45, min_lift=1.0)
        recs: dict[str, dict] = {}
        for rule in result["rules"]:
            antecedent = rule.get("antecedent", [])
            consequent = rule.get("consequent", [])
            # Người dùng chỉ nhập một món, vì vậy chỉ dùng các luật có vế trái đúng bằng món đó.
            if len(antecedent) != 1 or antecedent[0] != canonical:
                continue
            for item in consequent:
                if item == canonical:
                    continue
                candidate = {
                    "dish": item,
                    "because": antecedent,
                    "confidence": rule["confidence"],
                    "lift": rule["lift"],
                    "support": rule["support"],
                    "support_count": rule["support_count"],
                }
                old = recs.get(item)
                if old is None or (candidate["lift"], candidate["confidence"], candidate["support"]) > (old["lift"], old["confidence"], old["support"]):
                    recs[item] = candidate

        return sorted(recs.values(), key=lambda row: (-row["lift"], -row["confidence"], -row["support"]))[:top_n]


class AprioriService:
    """Facade dùng cho API/dashboard."""

    def __init__(self, data_path: Path | None = None):
        self.data_path = Path(data_path) if data_path else DEFAULT_DB_DIR
        self.miner = SetMenuAssociationMiner(self.data_path)

    def run_full_analysis(self, force: bool = False) -> dict:
        global _cache
        if _cache and not force:
            return _cache

        association = self.miner.run()
        _cache = {
            "dish_association": association,
            "summary": {
                "source": "12 set menu công khai từ website Cơm Niêu Việt Nam",
                "transactions_count": association["transactions_count"],
                "total_unique_items": association["stats"]["total_unique_items"],
                "total_freq_itemsets": association["stats"]["total_freq_itemsets"],
                "total_rules": association["stats"]["total_rules"],
                "min_support": association["stats"]["min_support"],
                "min_support_count": association["stats"]["min_support_count"],
                "min_confidence": association["stats"]["min_confidence"],
                "min_lift": association["stats"]["min_lift"],
            },
        }
        return _cache

    def get_dish_recommendations(self, dish_name: str) -> list[dict]:
        return self.miner.get_recommendations(dish_name)
