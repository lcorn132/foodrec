from __future__ import annotations

import csv
import json
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "backend" / "database" / "processed"
OUT_DIR = DATA_DIR / "report_assets"
CHART_DIR = OUT_DIR / "charts"
SUMMARY_MD = OUT_DIR / "data_statistics_report.md"
SUMMARY_JSON = OUT_DIR / "data_statistics_report.json"


PRICE_LABELS = {
    "budget": "Bình dân",
    "affordable": "Vừa phải",
    "moderate": "Trung bình",
    "premium": "Cao cấp",
    "unknown": "Chưa rõ",
}


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def vi_num(value: int | float) -> str:
    if isinstance(value, float) and not value.is_integer():
        return f"{value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{int(value):,}".replace(",", ".")


def cleanup_chart_files() -> None:
    CHART_DIR.mkdir(parents=True, exist_ok=True)
    for old_chart in CHART_DIR.glob("*"):
        if old_chart.is_file():
            old_chart.unlink()


def make_chart_data(
    raw_file_rows: list[tuple[str, int]],
    raw_rows: int,
    clean_count: int,
    set_items_count: int,
    similarity_count: int,
    category_counts: Counter[str],
    price_counts: Counter[str],
    cluster_counts: Counter[str],
    score_buckets: Counter[str],
) -> list[dict[str, Any]]:
    return [
        {
            "id": "raw_rows_by_file",
            "type": "bar",
            "title": "Dữ liệu gốc theo file Excel",
            "data": [{"label": label, "value": value} for label, value in raw_file_rows],
        },
        {
            "id": "preprocessing_funnel",
            "type": "bar",
            "title": "Từ dữ liệu thô đến dữ liệu sạch",
            "data": [
                {"label": "Dòng raw", "value": raw_rows},
                {"label": "Món sạch", "value": clean_count},
                {"label": "Dòng set menu", "value": set_items_count},
                {"label": "Dòng gợi ý", "value": similarity_count},
            ],
        },
        {
            "id": "category_distribution",
            "type": "horizontal_bar",
            "title": "Phân bổ món theo danh mục",
            "data": [{"label": label, "value": value} for label, value in category_counts.most_common()],
        },
        {
            "id": "price_range_distribution",
            "type": "donut",
            "title": "Phân bổ món theo mức giá",
            "data": [
                {"label": PRICE_LABELS[label], "value": price_counts.get(label, 0)}
                for label in ["budget", "affordable", "moderate", "premium", "unknown"]
            ],
        },
        {
            "id": "kmeans_cluster_distribution",
            "type": "horizontal_bar",
            "title": "Phân bổ cụm món ăn",
            "data": [{"label": label, "value": value} for label, value in cluster_counts.most_common()],
        },
        {
            "id": "similarity_score_distribution",
            "type": "donut",
            "title": "Độ phù hợp của gợi ý",
            "data": [{"label": label, "value": value} for label, value in score_buckets.most_common()],
        },
    ]


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    cleanup_chart_files()

    report = read_json(DATA_DIR / "advanced_mining_report.json")
    dishes = read_csv(DATA_DIR / "dishes_clean.csv")
    set_items = read_csv(DATA_DIR / "set_menu_items_clean.csv")
    similarity_rows = read_csv(DATA_DIR / "content_similarity_recommendations.csv")

    raw_files = report.get("raw_menu_preprocessing", {}).get("raw_files", [])
    raw_rows = int(report.get("raw_menu_preprocessing", {}).get("raw_rows", 0))
    raw_file_rows = [
        (item["file"].replace("comnieuvietnam-vn-2026-06-04", "raw"), int(item["rows"]))
        for item in raw_files
    ]
    category_counts = Counter(row["category_label"] for row in dishes)
    price_counts = Counter(row["price_range"] for row in dishes)
    cluster_counts = Counter(row["cluster_label"] for row in dishes)
    score_buckets: Counter[str] = Counter()
    for row in similarity_rows:
        score = float(row.get("score") or 0)
        if score >= 0.8:
            score_buckets["Rất cao"] += 1
        elif score >= 0.6:
            score_buckets["Cao"] += 1
        elif score >= 0.4:
            score_buckets["Trung bình"] += 1
        else:
            score_buckets["Thấp"] += 1

    chart_data = make_chart_data(
        raw_file_rows=raw_file_rows,
        raw_rows=raw_rows,
        clean_count=len(dishes),
        set_items_count=len(set_items),
        similarity_count=len(similarity_rows),
        category_counts=category_counts,
        price_counts=price_counts,
        cluster_counts=cluster_counts,
        score_buckets=score_buckets,
    )

    summary = {
        "raw": {"files": len(raw_files), "rows": raw_rows, "file_rows": raw_file_rows},
        "preprocessing": {
            "clean_dishes": len(dishes),
            "unique_categories": len(category_counts),
            "set_menu_items": len(set_items),
            "category_counts": dict(category_counts),
            "price_range_counts": {PRICE_LABELS.get(label, label): count for label, count in price_counts.items()},
        },
        "kmeans": {"clusters": dict(cluster_counts), "cluster_count": len(cluster_counts)},
        "content_based_recommendation": {
            "rows": len(similarity_rows),
            "score_buckets": dict(score_buckets),
            "method": report.get("content_based_recommendation", {}),
        },
        "transactions": {
            "status": "removed",
            "reason": "Không có hóa đơn công khai thật nên không dùng dữ liệu giao dịch sinh giả.",
        },
        "charts": [],
        "chart_data": chart_data,
    }

    SUMMARY_JSON.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    SUMMARY_MD.write_text(
        "\n".join(
            [
                "# Báo cáo thống kê dữ liệu FoodRec",
                "",
                "## 1. Dữ liệu gốc",
                f"- Số file raw: **{vi_num(len(raw_files))}**.",
                f"- Số dòng raw: **{vi_num(raw_rows)}**.",
                "",
                "## 2. Dữ liệu sau tiền xử lý",
                f"- Số món sạch duy nhất: **{vi_num(len(dishes))}**.",
                f"- Số danh mục món: **{vi_num(len(category_counts))}**.",
                f"- Số dòng set menu parse từ mô tả thật: **{vi_num(len(set_items))}**.",
                "",
                "## 3. Gom cụm K-Means",
                f"- Số cụm: **{vi_num(len(cluster_counts))}**.",
                "- Thuộc tính gom cụm: giá, calories ước tính, cờ set menu, keyword one-hot.",
                "- Diễn giải cụm theo cấu trúc mâm cơm Việt: món nền tảng, món mặn đưa cơm, món thanh mát và món tiệc/lẩu/ăn chơi.",
                "",
                "## 4. Gợi ý món ăn",
                f"- Số dòng gợi ý tương đồng: **{vi_num(len(similarity_rows))}**.",
                "- Gợi ý chi tiết món dùng content-based filtering theo danh mục, cụm, keyword và độ gần giá.",
                "- Gợi ý giỏ hàng dùng ma trận phối cụm để hoàn thiện mâm cơm Việt.",
            ]
        ),
        encoding="utf-8",
    )

    print(
        json.dumps(
            {"charts": 0, "chart_data": len(chart_data), "summary_md": str(SUMMARY_MD), "summary_json": str(SUMMARY_JSON)},
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
