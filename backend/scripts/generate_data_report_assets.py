from __future__ import annotations

import csv
import json
from collections import Counter
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont


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

CHART_TITLES = {
    "01_kmeans_convergence.png": "Mức giảm WCSS qua các bước cập nhật tâm cụm",
    "02_kmeans_price_calories.png": "Hình chiếu cụm K-Means theo giá và calories",
    "03_kmeans_cluster_sizes.png": "Số lượng món trong từng cụm",
    "04_similarity_score_histogram.png": "Phân bố điểm tương đồng",
}

CHART_COLORS = ["#2563EB", "#D97706", "#059669", "#7C3AED", "#DC2626"]


def chart_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = []
    if bold:
        candidates.extend(
            [
                Path("C:/Windows/Fonts/arialbd.ttf"),
                Path("C:/Windows/Fonts/segoeuib.ttf"),
            ]
        )
    candidates.extend(
        [
            Path("C:/Windows/Fonts/arial.ttf"),
            Path("C:/Windows/Fonts/segoeui.ttf"),
            Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        ]
    )
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def chart_canvas() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGB", (1400, 820), "white")
    return image, ImageDraw.Draw(image)


def draw_axes(
    draw: ImageDraw.ImageDraw,
    x_label: str,
    y_label: str,
) -> tuple[int, int, int, int]:
    left, top, right, bottom = 135, 70, 1330, 700
    draw.line((left, bottom, right, bottom), fill="#64748B", width=3)
    draw.line((left, top, left, bottom), fill="#64748B", width=3)
    draw.text((650, 750), x_label, fill="#334155", font=chart_font(25, True))
    draw.text((left, 20), y_label, fill="#334155", font=chart_font(25, True))
    return left, top, right, bottom


def save_convergence_chart(history: list[float]) -> None:
    if not history:
        return
    image, draw = chart_canvas()
    left, top, right, bottom = draw_axes(draw, "Bước cập nhật tâm cụm", "WCSS")
    values = [float(value) for value in history]
    low, high = min(values), max(values)
    span = max(high - low, 1)
    points = []
    for index, value in enumerate(values):
        x = left if len(values) == 1 else left + (right - left) * index / (len(values) - 1)
        y = bottom - (bottom - top) * (value - low) / span
        points.append((x, y))
    for tick in range(6):
        value = low + span * tick / 5
        y = bottom - (bottom - top) * tick / 5
        draw.line((left, y, right, y), fill="#E2E8F0", width=1)
        draw.text((35, y - 12), f"{value:.1f}", fill="#64748B", font=chart_font(20))
    if len(points) > 1:
        draw.line(points, fill=CHART_COLORS[0], width=5, joint="curve")
    for index, (x, y) in enumerate(points):
        draw.ellipse((x - 7, y - 7, x + 7, y + 7), fill=CHART_COLORS[0])
        draw.text((x - 5, bottom + 15), str(index), fill="#64748B", font=chart_font(18))
    image.save(CHART_DIR / "01_kmeans_convergence.png")


def save_cluster_scatter(dishes: list[dict[str, str]]) -> None:
    rows = []
    for row in dishes:
        try:
            rows.append(
                (
                    float(row.get("price_vnd") or 0),
                    float(row.get("estimated_calories") or 0),
                    int(row.get("cluster_id") or 0),
                )
            )
        except ValueError:
            continue
    if not rows:
        return
    image, draw = chart_canvas()
    left, top, right, bottom = draw_axes(draw, "Giá bán (đồng)", "Calories ước tính")
    max_price = max(value[0] for value in rows) or 1
    min_cal = min(value[1] for value in rows)
    max_cal = max(value[1] for value in rows)
    cal_span = max(max_cal - min_cal, 1)
    for tick in range(6):
        x = left + (right - left) * tick / 5
        price = max_price * tick / 5
        draw.line((x, top, x, bottom), fill="#F1F5F9", width=1)
        draw.text((x - 30, bottom + 15), f"{price / 1000:.0f}k", fill="#64748B", font=chart_font(18))
        y = bottom - (bottom - top) * tick / 5
        cal = min_cal + cal_span * tick / 5
        draw.line((left, y, right, y), fill="#F1F5F9", width=1)
        draw.text((55, y - 10), f"{cal:.0f}", fill="#64748B", font=chart_font(18))
    for price, calories, cluster in rows:
        x = left + (right - left) * price / max_price
        y = bottom - (bottom - top) * (calories - min_cal) / cal_span
        color = CHART_COLORS[cluster % len(CHART_COLORS)]
        draw.ellipse((x - 7, y - 7, x + 7, y + 7), fill=color, outline="white", width=1)
    legend_x = 970
    for cluster in sorted({row[2] for row in rows}):
        color = CHART_COLORS[cluster % len(CHART_COLORS)]
        draw.ellipse((legend_x, 25, legend_x + 16, 41), fill=color)
        draw.text((legend_x + 24, 20), f"Cụm {cluster + 1}", fill="#334155", font=chart_font(19))
        legend_x += 115
    image.save(CHART_DIR / "02_kmeans_price_calories.png")


def save_bar_chart(
    filename: str,
    labels: list[str],
    values: list[float],
    x_label: str,
    y_label: str,
) -> None:
    if not labels or not values:
        return
    image, draw = chart_canvas()
    left, top, right, bottom = draw_axes(draw, x_label, y_label)
    maximum = max(values) or 1
    slot = (right - left) / len(labels)
    bar_width = min(slot * 0.58, 150)
    for tick in range(6):
        value = maximum * tick / 5
        y = bottom - (bottom - top) * tick / 5
        draw.line((left, y, right, y), fill="#E2E8F0", width=1)
        draw.text((55, y - 10), f"{value:.0f}", fill="#64748B", font=chart_font(18))
    for index, (label, value) in enumerate(zip(labels, values)):
        center = left + slot * (index + 0.5)
        height = (bottom - top) * value / maximum
        color = CHART_COLORS[index % len(CHART_COLORS)]
        draw.rounded_rectangle(
            (center - bar_width / 2, bottom - height, center + bar_width / 2, bottom),
            radius=8,
            fill=color,
        )
        draw.text((center - 18, bottom - height - 35), f"{value:.0f}", fill="#0F172A", font=chart_font(21, True))
        short_label = label[:18]
        width = draw.textbbox((0, 0), short_label, font=chart_font(19))[2]
        draw.text((center - width / 2, bottom + 15), short_label, fill="#475569", font=chart_font(19))
    image.save(CHART_DIR / filename)


def save_similarity_histogram(similarity_rows: list[dict[str, str]]) -> None:
    scores = []
    for row in similarity_rows:
        try:
            scores.append(float(row.get("score") or 0))
        except ValueError:
            continue
    if not scores:
        return
    labels = ["0-0,2", "0,2-0,4", "0,4-0,6", "0,6-0,8", "0,8-1,0"]
    counts = [0, 0, 0, 0, 0]
    for score in scores:
        counts[min(int(max(score, 0) * 5), 4)] += 1
    save_bar_chart(
        "04_similarity_score_histogram.png",
        labels,
        counts,
        "Khoảng điểm tương đồng",
        "Số cặp gợi ý",
    )


def generate_png_charts(
    report: dict[str, Any],
    dishes: list[dict[str, str]],
    similarity_rows: list[dict[str, str]],
    cluster_counts: Counter[str],
) -> list[dict[str, str]]:
    save_convergence_chart(report.get("kmeans", {}).get("convergence_history", []))
    save_cluster_scatter(dishes)
    cluster_rows = sorted(
        report.get("kmeans", {}).get("clusters", []),
        key=lambda row: int(row.get("cluster_id", 0)),
    )
    cluster_labels = [f"Cụm {int(row.get('cluster_id', 0)) + 1}" for row in cluster_rows]
    cluster_sizes = [float(row.get("size", 0)) for row in cluster_rows]
    if not cluster_rows:
        cluster_labels = [label.split(" - ", 1)[0] for label in cluster_counts]
        cluster_sizes = [float(cluster_counts[label]) for label in cluster_counts]
    save_bar_chart(
        "03_kmeans_cluster_sizes.png",
        cluster_labels,
        cluster_sizes,
        "Cụm K-Means",
        "Số món",
    )
    save_similarity_histogram(similarity_rows)
    return [
        {"filename": filename, "title": title}
        for filename, title in CHART_TITLES.items()
        if (CHART_DIR / filename).exists()
    ]


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
    png_charts = generate_png_charts(report, dishes, similarity_rows, cluster_counts)

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
        "charts": png_charts,
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
            {"charts": len(png_charts), "chart_data": len(chart_data), "summary_md": str(SUMMARY_MD), "summary_json": str(SUMMARY_JSON)},
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
