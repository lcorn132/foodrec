from __future__ import annotations

import csv
import json
import math
from collections import Counter
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "backend" / "database" / "processed"
OUT_DIR = DATA_DIR / "report_assets"
CHART_DIR = OUT_DIR / "charts"
SUMMARY_MD = OUT_DIR / "data_statistics_report.md"
SUMMARY_JSON = OUT_DIR / "data_statistics_report.json"

PALETTE = ["#8B4513", "#D89A00", "#2F855A", "#2563EB", "#7C3AED", "#DC2626", "#0F766E", "#EA580C"]


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as file:
        return list(csv.DictReader(file))


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def esc(value: Any) -> str:
    return str(value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def vi_num(value: int | float) -> str:
    if isinstance(value, float) and not value.is_integer():
        return f"{value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{int(value):,}".replace(",", ".")


def svg_base(width: int, height: int, title: str, body: str) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <rect width="{width}" height="{height}" fill="#fffaf3"/>
  <text x="{width / 2}" y="34" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#3b231c">{esc(title)}</text>
  {body}
</svg>
"""


def wrap_label(text: str, max_chars: int = 18) -> list[str]:
    words = str(text).split()
    lines: list[str] = []
    current = ""
    for word in words:
        if len(current) + len(word) + 1 <= max_chars:
            current = f"{current} {word}".strip()
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines[:3]


def bar_chart(path: Path, title: str, data: list[tuple[str, float]], width: int = 1050, height: int = 650, rotate: bool = False) -> None:
    if not data:
        path.write_text(svg_base(width, height, title, ""), encoding="utf-8")
        return
    margin = {"l": 110, "r": 50, "t": 70, "b": 130}
    plot_w = width - margin["l"] - margin["r"]
    plot_h = height - margin["t"] - margin["b"]
    max_y = (max(value for _, value in data) or 1) * 1.15
    body = [
        f'<line x1="{margin["l"]}" y1="{height - margin["b"]}" x2="{width - margin["r"]}" y2="{height - margin["b"]}" stroke="#8f7a69"/>',
        f'<line x1="{margin["l"]}" y1="{margin["t"]}" x2="{margin["l"]}" y2="{height - margin["b"]}" stroke="#8f7a69"/>',
    ]
    for i in range(6):
        y = margin["t"] + plot_h - plot_h * i / 5
        val = max_y * i / 5
        body.append(f'<line x1="{margin["l"]}" y1="{y}" x2="{width - margin["r"]}" y2="{y}" stroke="#eadfd3"/>')
        body.append(f'<text x="{margin["l"] - 12}" y="{y + 4}" text-anchor="end" font-family="Arial" font-size="13" fill="#6b554a">{vi_num(val)}</text>')
    bar_w = plot_w / len(data) * 0.62
    for idx, (label, value) in enumerate(data):
        cx = margin["l"] + plot_w * (idx + 0.5) / len(data)
        bar_h = plot_h * value / max_y
        x = cx - bar_w / 2
        y = margin["t"] + plot_h - bar_h
        body.append(f'<rect x="{x}" y="{y}" width="{bar_w}" height="{bar_h}" rx="6" fill="{PALETTE[idx % len(PALETTE)]}" opacity="0.9"/>')
        body.append(f'<text x="{cx}" y="{y - 8}" text-anchor="middle" font-family="Arial" font-size="13" font-weight="700" fill="#2d1b16">{vi_num(value)}</text>')
        if rotate:
            body.append(f'<text transform="translate({cx - 6},{height - margin["b"] + 20}) rotate(35)" text-anchor="start" font-family="Arial" font-size="12" fill="#3b231c">{esc(label)}</text>')
        else:
            for line_idx, line in enumerate(wrap_label(label)):
                body.append(f'<text x="{cx}" y="{height - margin["b"] + 22 + line_idx * 15}" text-anchor="middle" font-family="Arial" font-size="12" fill="#3b231c">{esc(line)}</text>')
    path.write_text(svg_base(width, height, title, "\n  ".join(body)), encoding="utf-8")


def hbar_chart(path: Path, title: str, data: list[tuple[str, float]], width: int = 1150, height: int = 720) -> None:
    if not data:
        path.write_text(svg_base(width, height, title, ""), encoding="utf-8")
        return
    margin = {"l": 360, "r": 90, "t": 70, "b": 45}
    plot_w = width - margin["l"] - margin["r"]
    plot_h = height - margin["t"] - margin["b"]
    max_value = max(value for _, value in data) or 1
    row_h = plot_h / len(data)
    body = []
    for idx, (label, value) in enumerate(data):
        y = margin["t"] + idx * row_h + row_h * 0.18
        bar_h = row_h * 0.55
        bar_w = plot_w * value / (max_value * 1.08)
        body.append(f'<text x="{margin["l"] - 14}" y="{y + bar_h / 2 + 5}" text-anchor="end" font-family="Arial" font-size="14" fill="#3b231c">{esc(label)}</text>')
        body.append(f'<rect x="{margin["l"]}" y="{y}" width="{bar_w}" height="{bar_h}" rx="5" fill="{PALETTE[idx % len(PALETTE)]}" opacity="0.9"/>')
        body.append(f'<text x="{margin["l"] + bar_w + 10}" y="{y + bar_h / 2 + 5}" font-family="Arial" font-size="13" font-weight="700" fill="#2d1b16">{vi_num(value)}</text>')
    path.write_text(svg_base(width, height, title, "\n  ".join(body)), encoding="utf-8")


def donut_chart(path: Path, title: str, data: list[tuple[str, float]], width: int = 900, height: int = 560) -> None:
    total = sum(value for _, value in data) or 1
    cx, cy, radius, stroke = 320, 300, 150, 58
    start = -math.pi / 2
    body = []
    for idx, (_, value) in enumerate(data):
        end = start + 2 * math.pi * value / total
        x0, y0 = cx + radius * math.cos(start), cy + radius * math.sin(start)
        x1, y1 = cx + radius * math.cos(end), cy + radius * math.sin(end)
        large = 1 if end - start > math.pi else 0
        body.append(f'<path d="M {x0} {y0} A {radius} {radius} 0 {large} 1 {x1} {y1}" fill="none" stroke="{PALETTE[idx % len(PALETTE)]}" stroke-width="{stroke}"/>')
        start = end
    body.append(f'<text x="{cx}" y="{cy - 8}" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="#3b231c">{vi_num(total)}</text>')
    body.append(f'<text x="{cx}" y="{cy + 25}" text-anchor="middle" font-family="Arial" font-size="15" fill="#6b554a">tổng số</text>')
    for idx, (label, value) in enumerate(data):
        y = 190 + idx * 58
        body.append(f'<rect x="575" y="{y - 18}" width="24" height="24" rx="4" fill="{PALETTE[idx % len(PALETTE)]}"/>')
        body.append(f'<text x="612" y="{y}" font-family="Arial" font-size="16" font-weight="700" fill="#3b231c">{esc(label)}: {vi_num(value)}</text>')
        body.append(f'<text x="612" y="{y + 22}" font-family="Arial" font-size="13" fill="#6b554a">{value / total * 100:.1f}%</text>')
    path.write_text(svg_base(width, height, title, "\n  ".join(body)), encoding="utf-8")


def main() -> None:
    CHART_DIR.mkdir(parents=True, exist_ok=True)
    for old_chart in CHART_DIR.glob("*.svg"):
        old_chart.unlink()

    report = read_json(DATA_DIR / "advanced_mining_report.json")
    dishes = read_csv(DATA_DIR / "dishes_clean.csv")
    set_items = read_csv(DATA_DIR / "set_menu_items_clean.csv")
    similarity_rows = read_csv(DATA_DIR / "content_similarity_recommendations.csv")

    raw_files = report.get("raw_menu_preprocessing", {}).get("raw_files", [])
    raw_rows = int(report.get("raw_menu_preprocessing", {}).get("raw_rows", 0))
    raw_file_rows = [(item["file"].replace("comnieuvietnam-vn-2026-06-04", "raw"), int(item["rows"])) for item in raw_files]
    category_counts = Counter(row["category_label"] for row in dishes)
    price_counts = Counter(row["price_range"] for row in dishes)
    cluster_counts = Counter(row["cluster_label"] for row in dishes)
    score_buckets = Counter()
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

    bar_chart(CHART_DIR / "01_raw_rows_by_file.svg", "Dữ liệu gốc: số dòng theo file Excel", raw_file_rows, rotate=True)
    bar_chart(CHART_DIR / "02_preprocessing_funnel.svg", "Từ dữ liệu thô đến dữ liệu sạch", [("Dòng raw", raw_rows), ("Món sạch", len(dishes)), ("Dòng set menu parse", len(set_items)), ("Dòng gợi ý", len(similarity_rows))])
    hbar_chart(CHART_DIR / "03_category_distribution.svg", "Phân bố món sạch theo danh mục", category_counts.most_common())
    donut_chart(CHART_DIR / "04_price_range_distribution.svg", "Phân bố món theo mức giá", [(label, price_counts.get(label, 0)) for label in ["budget", "affordable", "moderate", "premium", "unknown"]])
    hbar_chart(CHART_DIR / "05_kmeans_cluster_distribution.svg", "K-Means: 4 cụm cấu trúc mâm cơm Việt", cluster_counts.most_common())
    donut_chart(CHART_DIR / "06_similarity_score_distribution.svg", "Phân bố điểm gợi ý content-based", score_buckets.most_common())

    summary = {
        "raw": {"files": len(raw_files), "rows": raw_rows, "file_rows": raw_file_rows},
        "preprocessing": {
            "clean_dishes": len(dishes),
            "unique_categories": len(category_counts),
            "set_menu_items": len(set_items),
            "category_counts": dict(category_counts),
            "price_range_counts": dict(price_counts),
        },
        "kmeans": {"clusters": dict(cluster_counts), "cluster_count": len(cluster_counts)},
        "content_based_recommendation": {
            "rows": len(similarity_rows),
            "score_buckets": dict(score_buckets),
            "method": report.get("content_based_recommendation", {}),
        },
        "transactions": {"status": "removed", "reason": "Không có hóa đơn công khai thật nên không dùng dữ liệu giao dịch sinh giả."},
        "charts": sorted(path.name for path in CHART_DIR.glob("*.svg")),
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
                "- Gợi ý chi tiết món: dùng content-based filtering theo danh mục, cụm K-Means, keyword từ tên/mô tả và độ gần giá.",
                "- Gợi ý giỏ hàng: dùng ma trận logic phối cụm để hoàn thiện mâm cơm Việt.",
                "- Không dùng hóa đơn sinh giả vì nhà hàng không công khai dữ liệu giao dịch thật.",
            ]
        ),
        encoding="utf-8",
    )

    print(json.dumps({"charts": len(summary["charts"]), "summary_md": str(SUMMARY_MD), "summary_json": str(SUMMARY_JSON)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
