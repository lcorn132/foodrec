from __future__ import annotations

import csv
import json
import random
import re
import statistics
import unicodedata
import zipfile
from collections import Counter
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "backend" / "database" / "raw"
OUT_DIR = ROOT / "backend" / "database" / "processed"

SEED = 20260604
K_CLUSTERS = 4

SERVICE_ITEMS = {
    "com nieu",
    "trai cay",
    "khan lanh",
    "tra da",
    "trai cay khan lanh tra da",
}

CATEGORY_LABELS = {
    "mon-khai-vi": "Món khai vị",
    "mon-com-nieu": "Cơm niêu",
    "mon-dau-hu-trung": "Món đậu hũ/trứng",
    "mon-canh": "Món canh",
    "mon-rau": "Món rau",
    "mon-heo": "Món heo",
    "mon-ca": "Món cá",
    "mon-lau": "Món lẩu",
    "mon-hai-san": "Món hải sản",
    "mon-ga-bo": "Món gà/bò",
    "mon-them": "Món thêm",
    "menu-com-doan-du-lich": "Set menu đoàn",
    "all": "Tất cả sản phẩm",
}

MEAL_ROLES = {
    "foundation": "Cụm 1: Món nền tảng (cơm)",
    "savory": "Cụm 2: Món mặn đưa cơm",
    "fresh": "Cụm 3: Món thanh mát (rau/canh)",
    "feast": "Cụm 4: Món tiệc/lẩu/ăn chơi",
}

ROLE_CLUSTER_CODES = {
    "foundation": "C1",
    "savory": "C2",
    "fresh": "C3",
    "feast": "C4",
}


def strip_accents(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in text if unicodedata.category(ch) != "Mn")


def slug_text(text: str) -> str:
    text = strip_accents(str(text or "")).casefold()
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def clean_text(text: Any) -> str:
    if text is None:
        return ""
    text = str(text).replace("\xa0", " ")
    text = re.sub(r"\s+", " ", text).strip()
    replacements = {
        " XẢ ": " SẢ ",
        "xả": "sả",
        "ĐD": "ĐẠI DƯƠNG",
        "ĐAI DƯƠNG": "ĐẠI DƯƠNG",
        "PHÚ QUÔC": "PHÚ QUỐC",
        "Phú Quôc": "Phú Quốc",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def title_name(text: str) -> str:
    text = clean_text(text)
    if text.isupper():
        return text.lower().title()
    return text


def parse_price(value: Any) -> int:
    raw = clean_text(value)
    if not raw or "theo thời giá" in raw.casefold():
        return 0
    digits = re.sub(r"[^\d]", "", raw)
    return int(digits) if digits else 0


def category_from_url(url: Any) -> str:
    url = clean_text(url)
    if not url:
        return "unknown"
    return url.rstrip("/").split("/")[-1] or "unknown"


def read_workbook_rows(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for sheet_name, sheet_rows in read_xlsx_sheets(path).items():
        nonempty_rows = [row for row in sheet_rows if any(v not in (None, "") for v in row)]
        if not nonempty_rows:
            continue
        headers = [clean_text(cell) for cell in nonempty_rows[0]]
        for raw in nonempty_rows[1:]:
            row = {headers[i]: raw[i] if i < len(raw) else None for i in range(len(headers)) if headers[i]}
            row["_source_file"] = path.name
            row["_sheet"] = sheet_name
            rows.append(row)
    return rows


def read_xlsx_sheets(path: Path) -> dict[str, list[list[Any]]]:
    ns = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    rel_ns = {"rel": "http://schemas.openxmlformats.org/package/2006/relationships"}
    with zipfile.ZipFile(path) as zf:
        shared_strings = read_shared_strings(zf, ns)
        sheets = {}
        for sheet_name, sheet_path in workbook_sheet_paths(zf, ns, rel_ns):
            if sheet_path not in zf.namelist():
                continue
            root = ET.fromstring(zf.read(sheet_path))
            parsed_rows: list[list[Any]] = []
            for row_el in root.findall(".//main:sheetData/main:row", ns):
                values: list[Any] = []
                for cell in row_el.findall("main:c", ns):
                    col_idx = column_index(cell.attrib.get("r", ""))
                    while len(values) <= col_idx:
                        values.append("")
                    values[col_idx] = cell_value(cell, shared_strings, ns)
                parsed_rows.append(values)
            sheets[sheet_name] = parsed_rows
        return sheets


def read_shared_strings(zf: zipfile.ZipFile, ns: dict[str, str]) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    strings = []
    for item in root.findall("main:si", ns):
        strings.append("".join(node.text or "" for node in item.findall(".//main:t", ns)))
    return strings


def workbook_sheet_paths(zf: zipfile.ZipFile, ns: dict[str, str], rel_ns: dict[str, str]) -> list[tuple[str, str]]:
    if "xl/workbook.xml" not in zf.namelist():
        return [("Sheet1", name) for name in sorted(zf.namelist()) if name.startswith("xl/worksheets/sheet")]
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rel_targets = {}
    for rel in rels.findall("rel:Relationship", rel_ns):
        target = rel.attrib.get("Target", "")
        rel_targets[rel.attrib.get("Id", "")] = target if target.startswith("xl/") else f"xl/{target.lstrip('/')}"
    paths = []
    for idx, sheet in enumerate(workbook.findall(".//main:sheets/main:sheet", ns), start=1):
        name = sheet.attrib.get("name", f"Sheet{idx}")
        rel_id = sheet.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
        paths.append((name, rel_targets.get(rel_id, f"xl/worksheets/sheet{idx}.xml")))
    return paths


def column_index(cell_ref: str) -> int:
    letters = re.sub(r"[^A-Z]", "", cell_ref.upper())
    idx = 0
    for char in letters:
        idx = idx * 26 + (ord(char) - ord("A") + 1)
    return max(0, idx - 1)


def cell_value(cell: ET.Element, shared_strings: list[str], ns: dict[str, str]) -> Any:
    cell_type = cell.attrib.get("t", "")
    if cell_type == "inlineStr":
        return "".join(node.text or "" for node in cell.findall(".//main:t", ns))
    value_el = cell.find("main:v", ns)
    if value_el is None:
        return ""
    raw = value_el.text or ""
    if cell_type == "s":
        try:
            return shared_strings[int(raw)]
        except (ValueError, IndexError):
            return raw
    return raw


def first_present(row: dict[str, Any], keys: list[str]) -> str:
    for key in keys:
        value = clean_text(row.get(key))
        if value:
            return value
    return ""


def is_placeholder_image(value: str) -> bool:
    return value.startswith("data:image")


def image_from_row(row: dict[str, Any]) -> str:
    for key in ("image", "image2", "image_1", "image_2", "image_3", "image_4"):
        value = clean_text(row.get(key))
        if value and not is_placeholder_image(value):
            return value
    return ""


def estimate_calories(name: str, category: str, price: int, description: str) -> int:
    text = slug_text(f"{name} {category} {description}")
    calories = 280
    rules = [
        (["lau"], 420),
        (["com nieu", "com dap", "com chien", "com trang"], 360),
        (["chien", "rang", "xao", "nuong", "quay"], 520),
        (["hap", "luoc", "canh", "salad", "rau"], 240),
        (["tom", "muc", "ca", "hai san"], 390),
        (["bo", "ga", "heo", "suon", "thit"], 450),
        (["set menu"], 800),
        (["nuoc", "tra", "dasani"], 60),
    ]
    for tokens, value in rules:
        if any(has_term(text, token) for token in tokens):
            calories = max(calories, value)
    if price >= 300000:
        calories += 160
    elif price >= 150000:
        calories += 70
    return calories


def has_term(text: str, term: str) -> bool:
    term = slug_text(term)
    if not term:
        return False
    if " " in term:
        return term in text
    return re.search(rf"(?:^|\s){re.escape(term)}(?:\s|$)", text) is not None


def dish_keywords(name: str, description: str) -> list[str]:
    text = slug_text(f"{name} {description}")
    keyword_groups = {
        "lau": ["lau"],
        "com": ["com nieu", "com dap", "com chien", "com trang"],
        "canh": ["canh", "sup"],
        "rau": ["rau", "salad"],
        "hai_san": ["tom", "muc", "oc", "hau", "ca", "hai san"],
        "thit": ["bo", "ga", "heo", "suon", "thit", "vit"],
        "chien_xao": ["chien", "xao", "rang", "nuong", "quay"],
        "thanh_dam": ["hap", "luoc", "canh", "rau", "salad"],
        "do_uong_them": ["nuoc", "tra", "bun", "mi", "them"],
    }
    found = []
    for label, tokens in keyword_groups.items():
        if any(has_term(text, token) for token in tokens):
            found.append(label)
    return found


def price_range(price: int) -> str:
    if price <= 0:
        return "unknown"
    if price < 80000:
        return "budget"
    if price < 150000:
        return "affordable"
    if price < 300000:
        return "moderate"
    return "premium"


def price_tier(price: int) -> str:
    if price <= 0:
        return "unknown"
    if price < 250000:
        return "low"
    if price < 400000:
        return "mid"
    return "high"


def build_dishes(raw_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_key: dict[str, dict[str, Any]] = {}
    for row in raw_rows:
        name = first_present(row, ["data", "item_page_title"])
        if not name:
            continue
        name = title_name(name)
        link = first_present(row, ["item_page_link", "item_page_title-href"])
        key = link or slug_text(name)
        category = category_from_url(row.get("web_scraper_start_url"))
        price = parse_price(row.get("data2"))
        description = first_present(row, [
            "product_description",
            "Product_Description",
            "description",
            "Description",
            "Product_Description",
        ])
        if key in by_key:
            old = by_key[key]
            if old["category"] == "all" and category != "all":
                old["category"] = category
                old["category_label"] = CATEGORY_LABELS.get(category, category)
            if not old["description"] and description:
                old["description"] = clean_text(description)
            if not old["image_url"]:
                old["image_url"] = image_from_row(row)
            old["source_files"] = sorted(set(old["source_files"].split("|") + [row["_source_file"]]))
            old["source_files"] = "|".join(old["source_files"])
            continue
        by_key[key] = {
            "dish_id": f"D{len(by_key) + 1:04d}",
            "name": name,
            "name_key": slug_text(name),
            "category": category,
            "category_label": CATEGORY_LABELS.get(category, category),
            "price_vnd": price,
            "price_range": price_range(price),
            "source_url": link,
            "image_url": image_from_row(row),
            "description": clean_text(description),
            "estimated_calories": estimate_calories(name, category, price, description),
            "keywords": "|".join(dish_keywords(name, description)),
            "is_set_menu": int("set menu" in slug_text(name) or category == "menu-com-doan-du-lich"),
            "source_files": row["_source_file"],
        }
    return sorted(by_key.values(), key=lambda d: (d["category"], d["name_key"]))


def extract_set_menu_items(row: dict[str, Any]) -> list[str]:
    items = []
    for key, value in row.items():
        if key.startswith("product_description_item") and value:
            item = title_name(clean_text(value))
            if item:
                items.append(item)
    if not items:
        desc = first_present(row, ["Description", "Product_Description"])
        parts = [title_name(part) for part in re.split(r"[\n\r]+", desc) if clean_text(part)]
        items.extend(parts)
    return items


def split_service_bundle(item: str) -> list[str]:
    if "+" not in item:
        return [item]
    return [title_name(part) for part in item.split("+") if clean_text(part)]


def is_service_item(item: str) -> bool:
    key = slug_text(item)
    if key in SERVICE_ITEMS:
        return True
    return any(token in key for token in ("khan lanh", "tra da", "trai cay", "com nieu"))


def build_set_transactions(raw_rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    transactions = []
    item_rows = []
    seen_links = set()
    for row in raw_rows:
        name = title_name(first_present(row, ["data", "item_page_title"]))
        link = first_present(row, ["item_page_link", "item_page_title-href"])
        category = category_from_url(row.get("web_scraper_start_url"))
        if "set menu" not in slug_text(name) and category != "menu-com-doan-du-lich":
            continue
        if link in seen_links:
            continue
        seen_links.add(link)
        raw_items = []
        for item in extract_set_menu_items(row):
            raw_items.extend(split_service_bundle(item))
        clean_items = [item for item in raw_items if item and not is_service_item(item)]
        tx_id = f"SM{len(transactions) + 1:03d}"
        transaction = {
            "transaction_id": tx_id,
            "set_name": name,
            "price_vnd": parse_price(row.get("data2")),
            "price_tier": price_tier(parse_price(row.get("data2"))),
            "source_url": link,
            "raw_item_count": len(raw_items),
            "mining_item_count": len(clean_items),
            "items": "|".join(clean_items),
            "excluded_items": "|".join([item for item in raw_items if is_service_item(item)]),
            "source_file": row["_source_file"],
        }
        transactions.append(transaction)
        for idx, item in enumerate(raw_items, start=1):
            item_rows.append({
                "transaction_id": tx_id,
                "set_name": name,
                "slot_index": idx,
                "item_name": item,
                "item_key": slug_text(item),
                "is_service_item": int(is_service_item(item)),
                "source_url": link,
            })
    return transactions, item_rows


def zscore(values: list[float]) -> list[float]:
    if not values:
        return []
    mean = statistics.mean(values)
    stdev = statistics.pstdev(values) or 1.0
    return [(value - mean) / stdev for value in values]


def one_hot_keywords(dishes: list[dict[str, Any]], labels: list[str]) -> dict[str, list[int]]:
    result = {}
    for dish in dishes:
        kws = set(str(dish["keywords"]).split("|")) if dish.get("keywords") else set()
        result[dish["dish_id"]] = [1 if label in kws else 0 for label in labels]
    return result


def kmeans_cluster(
    dishes: list[dict[str, Any]],
    k: int = K_CLUSTERS,
    iterations: int = 80,
) -> tuple[list[dict[str, Any]], list[float]]:
    random.seed(SEED)
    keyword_labels = ["lau", "com", "canh", "rau", "hai_san", "thit", "chien_xao", "thanh_dam", "do_uong_them"]
    prices = zscore([float(d["price_vnd"]) for d in dishes])
    calories = zscore([float(d["estimated_calories"]) for d in dishes])
    set_flags = [float(d["is_set_menu"]) for d in dishes]
    kw_matrix = one_hot_keywords(dishes, keyword_labels)
    vectors = []
    role_scores_by_dish = {}
    for idx, dish in enumerate(dishes):
        role_scores = score_meal_roles([dish])
        role_scores_by_dish[dish["dish_id"]] = role_scores
        role_features = [role_scores["foundation"] * 2.5, role_scores["savory"] * 2.5, role_scores["fresh"] * 2.5, role_scores["feast"] * 2.5]
        vectors.append([prices[idx], calories[idx], set_flags[idx] * 1.5] + kw_matrix[dish["dish_id"]] + role_features)
    selected: list[int] = []
    for role in ["foundation", "savory", "fresh", "feast"][: min(k, len(vectors))]:
        candidate = max(
            (idx for idx in range(len(dishes)) if idx not in selected),
            key=lambda idx: role_scores_by_dish[dishes[idx]["dish_id"]][role],
        )
        selected.append(candidate)
    while len(selected) < min(k, len(vectors)):
        candidate = random.choice([idx for idx in range(len(vectors)) if idx not in selected])
        selected.append(candidate)
    centroids = [vectors[i] for i in selected]
    assignments = [-1] * len(vectors)
    initial_wcss = sum(
        min(sum((a - b) ** 2 for a, b in zip(vector, centroid)) for centroid in centroids)
        for vector in vectors
    )
    convergence_history: list[float] = [round(initial_wcss, 6)]
    for _ in range(iterations):
        changed = False
        for idx, vector in enumerate(vectors):
            distances = [sum((a - b) ** 2 for a, b in zip(vector, centroid)) for centroid in centroids]
            cluster = distances.index(min(distances))
            if cluster != assignments[idx]:
                assignments[idx] = cluster
                changed = True
        used_clusters = set(assignments)
        for cluster in range(len(centroids)):
            if cluster in used_clusters:
                continue
            farthest_idx = max(
                range(len(vectors)),
                key=lambda i: sum((a - b) ** 2 for a, b in zip(vectors[i], centroids[assignments[i]])),
            )
            assignments[farthest_idx] = cluster
            changed = True
        for cluster in range(len(centroids)):
            members = [vectors[i] for i, a in enumerate(assignments) if a == cluster]
            if members:
                centroids[cluster] = [sum(values) / len(values) for values in zip(*members)]
        wcss = sum(
            sum((a - b) ** 2 for a, b in zip(vector, centroids[assignments[idx]]))
            for idx, vector in enumerate(vectors)
        )
        convergence_history.append(round(wcss, 6))
        if not changed:
            break
    summaries = summarize_clusters(dishes, assignments)
    clustered = []
    for dish, cluster in zip(dishes, assignments):
        row = dict(dish)
        row["cluster_id"] = cluster
        row["meal_role"] = summaries[cluster]["role"]
        row["cluster_label"] = f"{ROLE_CLUSTER_CODES[row['meal_role']]} - {summaries[cluster]['label']}"
        clustered.append(row)
    return clustered, convergence_history


def score_meal_roles(members: list[dict[str, Any]]) -> dict[str, float]:
    scores = {role: 0.0 for role in MEAL_ROLES}
    for dish in members:
        category = str(dish.get("category", ""))
        name_key = str(dish.get("name_key", ""))
        keywords = dish_keyword_set(dish)
        price = int(dish.get("price_vnd") or 0)
        is_set = int(dish.get("is_set_menu") or 0)

        is_rice = category == "mon-com-nieu" or any(
            has_term(name_key, term)
            for term in ("com nieu", "com dap", "com chien", "com trang")
        )
        if is_rice:
            scores["foundation"] += 3.5
        if category in {"mon-heo", "mon-ca", "mon-ga-bo", "mon-dau-hu-trung"}:
            scores["savory"] += 2.6
        if {"thit", "hai_san", "chien_xao"} & keywords:
            scores["savory"] += 1.5
        if category in {"mon-canh", "mon-rau"}:
            scores["fresh"] += 3.2
        if {"canh", "rau", "thanh_dam"} & keywords:
            scores["fresh"] += 1.7
        if category in {"mon-lau", "mon-hai-san", "menu-com-doan-du-lich", "mon-khai-vi", "mon-them"}:
            scores["feast"] += 2.6
        if "lau" in keywords or is_set:
            scores["feast"] += 2.5
        if price >= 250000:
            scores["feast"] += 1.1
        if price < 80000 and category == "mon-them":
            scores["feast"] += 0.7
    return scores


def assign_cluster_roles(cluster_members: dict[int, list[dict[str, Any]]]) -> dict[int, str]:
    scored_pairs: list[tuple[float, int, str]] = []
    role_scores = {cluster: score_meal_roles(members) for cluster, members in cluster_members.items()}
    for cluster, scores in role_scores.items():
        for role, score in scores.items():
            scored_pairs.append((score, cluster, role))

    assignments: dict[int, str] = {}
    used_roles: set[str] = set()
    for _, cluster, role in sorted(scored_pairs, reverse=True):
        if cluster in assignments or role in used_roles:
            continue
        assignments[cluster] = role
        used_roles.add(role)

    remaining_roles = [role for role in MEAL_ROLES if role not in used_roles]
    for cluster in sorted(cluster_members):
        if cluster not in assignments:
            assignments[cluster] = remaining_roles.pop(0) if remaining_roles else "savory"
    return assignments


def summarize_clusters(dishes: list[dict[str, Any]], assignments: list[int]) -> dict[int, dict[str, Any]]:
    summaries: dict[int, dict[str, Any]] = {}
    cluster_members = {
        cluster: [dish for dish, assn in zip(dishes, assignments) if assn == cluster]
        for cluster in sorted(set(assignments))
    }
    role_assignments = assign_cluster_roles(cluster_members)
    for cluster in sorted(set(assignments)):
        members = cluster_members[cluster]
        keyword_counts = Counter(keyword for dish in members for keyword in str(dish.get("keywords", "")).split("|") if keyword)
        category_counts = Counter(dish.get("category_label") or dish.get("category") for dish in members)
        avg_price = sum(int(d["price_vnd"]) for d in members) / max(1, len(members))
        role = role_assignments[cluster]
        label = MEAL_ROLES[role]
        summaries[cluster] = {
            "cluster_id": cluster,
            "role": role,
            "label": label,
            "size": len(members),
            "avg_price": round(avg_price),
            "top_categories": "|".join(category for category, _ in category_counts.most_common(5)),
            "top_keywords": "|".join(keyword for keyword, _ in keyword_counts.most_common(5)),
        }
    return summaries


def dish_keyword_set(dish: dict[str, Any]) -> set[str]:
    return {item for item in str(dish.get("keywords", "")).split("|") if item}


def content_similarity_recommendations(dishes: list[dict[str, Any]], top_n: int = 8) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for source in dishes:
        source_keywords = dish_keyword_set(source)
        source_price = max(1, int(source.get("price_vnd") or 0))
        scored: list[tuple[float, dict[str, Any], list[str]]] = []
        for target in dishes:
            if source["dish_id"] == target["dish_id"]:
                continue
            target_keywords = dish_keyword_set(target)
            union = source_keywords | target_keywords
            keyword_score = len(source_keywords & target_keywords) / len(union) if union else 0
            same_cluster = 1.0 if source.get("cluster_id") == target.get("cluster_id") else 0.0
            same_category = 1.0 if source.get("category") == target.get("category") else 0.0
            target_price = max(1, int(target.get("price_vnd") or 0))
            price_score = 1 - min(abs(source_price - target_price) / max(source_price, target_price), 1)
            score = keyword_score * 0.35 + same_cluster * 0.25 + same_category * 0.2 + price_score * 0.2
            reasons = []
            if same_cluster:
                reasons.append("cùng cụm K-Means")
            if same_category:
                reasons.append("cùng danh mục")
            if keyword_score > 0:
                reasons.append("trùng từ khóa món")
            if price_score >= 0.75:
                reasons.append("mức giá gần nhau")
            scored.append((score, target, reasons or ["tương đồng nội dung"]))
        for rank, (score, target, reasons) in enumerate(sorted(scored, key=lambda item: item[0], reverse=True)[:top_n], start=1):
            rows.append(
                {
                    "source_dish_id": source["dish_id"],
                    "source_name": source["name"],
                    "recommended_dish_id": target["dish_id"],
                    "recommended_name": target["name"],
                    "score": round(score, 4),
                    "rank": rank,
                    "reason": "; ".join(reasons),
                    "source_cluster": source.get("cluster_label", ""),
                    "recommended_cluster": target.get("cluster_label", ""),
                }
            )
    return rows


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    fields = list(rows[0].keys())
    with path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    raw_rows = []
    raw_file_stats = []
    for path in sorted(RAW_DIR.glob("*.xlsx")):
        rows = read_workbook_rows(path)
        raw_rows.extend(rows)
        raw_file_stats.append({"file": path.name, "rows": len(rows), "size_bytes": path.stat().st_size})

    dishes = build_dishes(raw_rows)
    set_transactions, set_item_rows = build_set_transactions(raw_rows)
    clustered_dishes, convergence_history = kmeans_cluster(dishes)
    cluster_summary = summarize_clusters(clustered_dishes, [int(d["cluster_id"]) for d in clustered_dishes])
    similarity_rows = content_similarity_recommendations(clustered_dishes)

    write_csv(OUT_DIR / "dishes_clean.csv", clustered_dishes)
    write_csv(OUT_DIR / "set_menu_items_clean.csv", set_item_rows)
    write_csv(OUT_DIR / "content_similarity_recommendations.csv", similarity_rows)

    report = {
        "raw_menu_preprocessing": {
            "raw_files": raw_file_stats,
            "raw_rows": len(raw_rows),
            "unique_dishes": len(dishes),
            "set_menu_rows": len(set_transactions),
            "techniques": [
                "Data Transformation: chuẩn hóa data2 từ chuỗi tiền tệ sang int",
                "Feature Extraction: trích category từ web_scraper_start_url",
                "Text Cleaning: strip khoảng trắng, chuẩn hóa lỗi chính tả/tên món",
                "Feature Engineering: ước tính calories và keyword từ mô tả/tên món",
            ],
        },
        "kmeans": {
            "algorithm": "K-Means tự cài đặt bằng Python thuần",
            "k": K_CLUSTERS,
            "features": ["price_vnd", "estimated_calories", "is_set_menu", "keyword one-hot"],
            "interpretation": "Diễn giải 4 cụm theo cấu trúc bữa ăn Việt: cơm - món mặn - rau/canh - tiệc/lẩu.",
            "convergence_history": convergence_history,
            "clusters": list(cluster_summary.values()),
        },
        "content_based_recommendation": {
            "algorithm": "Content-Based Filtering",
            "features": ["category", "cluster_label", "meal_role", "keywords", "price_vnd"],
            "similarity": "weighted score: keyword Jaccard + same cluster + same category + price proximity",
            "recommendation_rows": len(similarity_rows),
            "top_n_per_dish": 8,
            "note": "Không dùng hóa đơn sinh giả; hệ thống gợi ý từ thuộc tính thật của món ăn và tri thức phối mâm cơm Việt.",
        },
        "outputs": {
            "processed_dir": str(OUT_DIR),
            "dishes_clean": "dishes_clean.csv",
            "set_menu_items": "set_menu_items_clean.csv",
            "content_similarity": "content_similarity_recommendations.csv",
        },
    }
    write_json(OUT_DIR / "advanced_mining_report.json", report)
    print(json.dumps({
        "raw_rows": len(raw_rows),
        "dishes": len(dishes),
        "set_menu_rows": len(set_transactions),
        "content_similarity_rows": len(similarity_rows),
        "output": str(OUT_DIR),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
