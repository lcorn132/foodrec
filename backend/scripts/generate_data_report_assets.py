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

CHART_SIZE = (1600, 940)
PLOT = (150, 170, 1450, 760)
COLORS = ["#2563EB", "#D97706", "#059669", "#7C3AED", "#DC2626", "#0F766E", "#CA8A04"]
PRICE_LABELS = {
    "budget": "Bình dân",
    "affordable": "Vừa phải",
    "moderate": "Trung bình",
    "premium": "Cao cấp",
    "unknown": "Chưa rõ",
}
ROLE_ORDER = {"foundation": 0, "savory": 1, "fresh": 2, "feast": 3}
ROLE_NAMES = {
    "foundation": "Cụm 1: Món nền tảng",
    "savory": "Cụm 2: Món mặn",
    "fresh": "Cụm 3: Rau/canh",
    "feast": "Cụm 4: Tiệc/lẩu",
}
CHART_TITLES = {
    "01_kmeans_convergence.png": "Mức giảm WCSS qua các bước cập nhật tâm cụm",
    "02_kmeans_price_calories.png": "Hình chiếu cụm K-Means theo giá bán và calories",
    "03_kmeans_cluster_sizes.png": "Số lượng món ăn trong từng cụm K-Means",
    "04_similarity_score_histogram.png": "Phân bố điểm tương đồng giữa các cặp món ăn",
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


def vi_num(value: int | float, digits: int = 0) -> str:
    if isinstance(value, float) and digits:
        return f"{value:,.{digits}f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{int(round(float(value))):,}".replace(",", ".")


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def text_width(draw: ImageDraw.ImageDraw, text: str, text_font: ImageFont.ImageFont) -> int:
    box = draw.textbbox((0, 0), text, font=text_font)
    return box[2] - box[0]


def wrap_label(label: str, max_chars: int = 18) -> list[str]:
    words = label.split()
    lines: list[str] = []
    current = ""
    for word in words:
        next_line = f"{current} {word}".strip()
        if len(next_line) <= max_chars:
            current = next_line
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines[:2]


def canvas(title: str, subtitle: str = "") -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGB", CHART_SIZE, "#FFFFFF")
    draw = ImageDraw.Draw(image)
    draw.rectangle((0, 0, CHART_SIZE[0] - 1, CHART_SIZE[1] - 1), outline="#E2E8F0", width=2)
    draw.text((70, 42), title, fill="#0F172A", font=font(38, True))
    if subtitle:
        draw.text((70, 88), subtitle, fill="#475569", font=font(23))
    return image, draw


def draw_axes(draw: ImageDraw.ImageDraw, x_label: str, y_label: str) -> tuple[int, int, int, int]:
    left, top, right, bottom = PLOT
    draw.line((left, bottom, right, bottom), fill="#64748B", width=3)
    draw.line((left, top, left, bottom), fill="#64748B", width=3)
    draw.text((left, bottom + 96), x_label, fill="#334155", font=font(24, True))
    draw.text((left, top - 44), y_label, fill="#334155", font=font(24, True))
    return left, top, right, bottom


def draw_y_ticks(draw: ImageDraw.ImageDraw, maximum: float, formatter=lambda value: vi_num(value)) -> None:
    left, top, right, bottom = PLOT
    for tick in range(6):
        value = maximum * tick / 5
        y = bottom - (bottom - top) * tick / 5
        draw.line((left, y, right, y), fill="#E2E8F0", width=1)
        label = formatter(value)
        draw.text((left - text_width(draw, label, font(20)) - 18, y - 12), label, fill="#64748B", font=font(20))


def cleanup_chart_files() -> None:
    CHART_DIR.mkdir(parents=True, exist_ok=True)
    for old_chart in CHART_DIR.glob("*.png"):
        old_chart.unlink()


def save_convergence_chart(report: dict[str, Any]) -> None:
    history = [float(value) for value in report.get("kmeans", {}).get("convergence_history", [])]
    if not history:
        return
    image, draw = canvas(
        CHART_TITLES["01_kmeans_convergence.png"],
        "Sinh trực tiếp từ lịch sử hội tụ của K-Means trong lần xử lý dữ liệu hiện tại.",
    )
    left, top, right, bottom = draw_axes(draw, "Bước lặp", "WCSS")
    low, high = min(history), max(history)
    span = max(high - low, 1.0)
    for tick in range(6):
        value = low + span * tick / 5
        y = bottom - (bottom - top) * tick / 5
        draw.line((left, y, right, y), fill="#E2E8F0", width=1)
        label = vi_num(value, 2)
        draw.text((left - text_width(draw, label, font(20)) - 18, y - 12), label, fill="#64748B", font=font(20))

    points = []
    for index, value in enumerate(history):
        x = left if len(history) == 1 else left + (right - left) * index / (len(history) - 1)
        y = bottom - (bottom - top) * (value - low) / span
        points.append((x, y))
    if len(points) > 1:
        draw.line(points, fill=COLORS[0], width=6)
    for index, (x, y) in enumerate(points):
        draw.ellipse((x - 9, y - 9, x + 9, y + 9), fill=COLORS[0], outline="white", width=2)
        draw.text((x - 7, bottom + 18), str(index), fill="#64748B", font=font(18))

    start, end = history[0], history[-1]
    note = f"WCSS giảm từ {vi_num(start, 2)} xuống {vi_num(end, 2)}"
    draw.rounded_rectangle((1040, 800, 1450, 870), radius=18, fill="#EFF6FF")
    draw.text((1070, 820), note, fill="#1D4ED8", font=font(25, True))
    image.save(CHART_DIR / "01_kmeans_convergence.png", quality=95)


def save_scatter_chart(report: dict[str, Any], dishes: list[dict[str, str]]) -> None:
    rows = []
    for row in dishes:
        try:
            role = row.get("meal_role") or ""
            cluster = ROLE_ORDER.get(role, int(row.get("cluster_id") or 0))
            rows.append((float(row.get("price_vnd") or 0), float(row.get("estimated_calories") or 0), cluster, role))
        except ValueError:
            continue
    if not rows:
        return
    image, draw = canvas(
        CHART_TITLES["02_kmeans_price_calories.png"],
        f"{len(rows)} món ăn sau làm sạch, màu sắc thể hiện cụm được K-Means tạo ra.",
    )
    left, top, right, bottom = draw_axes(draw, "Giá bán (nghìn đồng)", "Calories ước tính")
    max_price = max(price for price, *_ in rows) or 1
    min_cal = min(cal for _, cal, *_ in rows)
    max_cal = max(cal for _, cal, *_ in rows)
    cal_span = max(max_cal - min_cal, 1)
    for tick in range(6):
        x = left + (right - left) * tick / 5
        y = bottom - (bottom - top) * tick / 5
        draw.line((x, top, x, bottom), fill="#F1F5F9", width=1)
        draw.line((left, y, right, y), fill="#F1F5F9", width=1)
        draw.text((x - 24, bottom + 18), f"{max_price * tick / 5000:.0f}", fill="#64748B", font=font(19))
        cal_label = f"{min_cal + cal_span * tick / 5:.0f}"
        draw.text((left - text_width(draw, cal_label, font(19)) - 18, y - 11), cal_label, fill="#64748B", font=font(19))

    for price, calories, cluster, _ in rows:
        x = left + (right - left) * price / max_price
        y = bottom - (bottom - top) * (calories - min_cal) / cal_span
        color = COLORS[cluster % len(COLORS)]
        draw.ellipse((x - 9, y - 9, x + 9, y + 9), fill=color, outline="white", width=2)

    clusters = sorted({cluster for _, _, cluster, _ in rows})
    legend_y = 815
    legend_x = 70
    for cluster in clusters:
        role = next((role for _, _, c, role in rows if c == cluster), "")
        label = ROLE_NAMES.get(role, f"Cụm {cluster + 1}")
        color = COLORS[cluster % len(COLORS)]
        draw.rounded_rectangle((legend_x, legend_y, legend_x + 30, legend_y + 30), radius=7, fill=color)
        draw.text((legend_x + 42, legend_y - 1), label, fill="#334155", font=font(22, True))
        legend_x += 345

    silhouette = report.get("kmeans", {}).get("silhouette_score")
    if silhouette is not None:
        draw.text((1100, 42), f"Silhouette: {float(silhouette):.4f}".replace(".", ","), fill="#059669", font=font(26, True))
    image.save(CHART_DIR / "02_kmeans_price_calories.png", quality=95)


def save_cluster_size_chart(report: dict[str, Any], dishes: list[dict[str, str]]) -> None:
    clusters = report.get("kmeans", {}).get("clusters", [])
    if clusters:
        rows = sorted(clusters, key=lambda row: ROLE_ORDER.get(row.get("role") or "", int(row.get("cluster_id", 0))))
        labels = [ROLE_NAMES.get(row.get("role"), row.get("label", f"Cụm {idx + 1}")) for idx, row in enumerate(rows)]
        values = [float(row.get("size", 0)) for row in rows]
    else:
        counter = Counter(row.get("cluster_label", "Chưa rõ") for row in dishes)
        labels = list(counter)
        values = [float(counter[label]) for label in labels]
    if not labels:
        return
    image, draw = canvas(
        CHART_TITLES["03_kmeans_cluster_sizes.png"],
        "Tên cụm được gán sau khi K-Means hội tụ, dựa trên đặc trưng chiếm ưu thế.",
    )
    left, top, right, bottom = draw_axes(draw, "Cụm món ăn", "Số món")
    maximum = max(values) or 1
    draw_y_ticks(draw, maximum)
    slot = (right - left) / len(labels)
    bar_width = min(slot * 0.48, 170)
    for index, (label, value) in enumerate(zip(labels, values)):
        center = left + slot * (index + 0.5)
        height = (bottom - top) * value / maximum
        color = COLORS[index % len(COLORS)]
        draw.rounded_rectangle((center - bar_width / 2, bottom - height, center + bar_width / 2, bottom), radius=12, fill=color)
        value_label = vi_num(value)
        draw.text((center - text_width(draw, value_label, font(26, True)) / 2, bottom - height - 42), value_label, fill="#0F172A", font=font(26, True))
        for line_index, line in enumerate(wrap_label(label, 20)):
            width = text_width(draw, line, font(20, True))
            draw.text((center - width / 2, bottom + 18 + line_index * 27), line, fill="#334155", font=font(20, True))
    image.save(CHART_DIR / "03_kmeans_cluster_sizes.png", quality=95)


def save_similarity_histogram(similarity_rows: list[dict[str, str]]) -> None:
    scores = []
    for row in similarity_rows:
        try:
            scores.append(float(row.get("score") or 0))
        except ValueError:
            continue
    if not scores:
        return
    buckets = [
        ("0,50-0,60", 0.50, 0.60),
        ("0,60-0,70", 0.60, 0.70),
        ("0,70-0,80", 0.70, 0.80),
        ("0,80-0,90", 0.80, 0.90),
        ("0,90-1,00", 0.90, 1.01),
    ]
    counts = [sum(1 for score in scores if low <= score < high) for _, low, high in buckets]
    labels = [label for label, _, _ in buckets]

    image, draw = canvas(
        CHART_TITLES["04_similarity_score_histogram.png"],
        "Điểm được tính từ keyword Jaccard, danh mục, mức giá và cụm K-Means.",
    )
    left, top, right, bottom = draw_axes(draw, "Khoảng điểm tương đồng", "Số cặp món")
    maximum = max(counts) or 1
    draw_y_ticks(draw, maximum)
    slot = (right - left) / len(labels)
    bar_width = min(slot * 0.58, 190)
    for index, (label, value) in enumerate(zip(labels, counts)):
        center = left + slot * (index + 0.5)
        height = (bottom - top) * value / maximum
        color = COLORS[index % len(COLORS)]
        draw.rounded_rectangle((center - bar_width / 2, bottom - height, center + bar_width / 2, bottom), radius=12, fill=color)
        value_label = vi_num(value)
        draw.text((center - text_width(draw, value_label, font(26, True)) / 2, bottom - height - 42), value_label, fill="#0F172A", font=font(26, True))
        width = text_width(draw, label, font(21, True))
        draw.text((center - width / 2, bottom + 18), label, fill="#334155", font=font(21, True))

    total_label = f"Tổng số quan hệ đạt ngưỡng: {vi_num(len(scores))}"
    draw.rounded_rectangle((980, 800, 1450, 870), radius=18, fill="#ECFDF5")
    draw.text((1010, 820), total_label, fill="#047857", font=font(24, True))
    image.save(CHART_DIR / "04_similarity_score_histogram.png", quality=95)


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
            "title": "Phân bố món theo danh mục",
            "data": [{"label": label, "value": value} for label, value in category_counts.most_common()],
        },
        {
            "id": "price_range_distribution",
            "type": "donut",
            "title": "Phân bổ món theo mức giá",
            "data": [
                {"label": PRICE_LABELS[label], "value": price_counts.get(label, 0)}
                for label in ["budget", "affordable", "moderate", "premium", "unknown"]
                if price_counts.get(label, 0)
            ],
        },
        {
            "id": "kmeans_cluster_distribution",
            "type": "horizontal_bar",
            "title": "Phân bố cụm K-Means",
            "data": [{"label": label, "value": value} for label, value in cluster_counts.most_common()],
        },
        {
            "id": "similarity_score_distribution",
            "type": "donut",
            "title": "Phân bổ điểm tương đồng",
            "data": [{"label": label, "value": value} for label, value in score_buckets.most_common()],
        },
    ]


def generate_png_charts(report: dict[str, Any], dishes: list[dict[str, str]], similarity_rows: list[dict[str, str]]) -> list[dict[str, str]]:
    save_convergence_chart(report)
    save_scatter_chart(report, dishes)
    save_cluster_size_chart(report, dishes)
    save_similarity_histogram(similarity_rows)
    return [
        {"filename": filename, "title": title}
        for filename, title in CHART_TITLES.items()
        if (CHART_DIR / filename).exists()
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
    raw_file_rows = [(f"File {index}", int(item.get("rows", 0))) for index, item in enumerate(raw_files, start=1)]
    category_counts = Counter(row.get("category_label") or row.get("category") or "Chưa rõ" for row in dishes)
    price_counts = Counter(row.get("price_range") or "unknown" for row in dishes)
    cluster_counts = Counter(row.get("cluster_label") or "Chưa rõ" for row in dishes)
    score_buckets: Counter[str] = Counter()
    for row in similarity_rows:
        try:
            score = float(row.get("score") or 0)
        except ValueError:
            continue
        if score >= 0.85:
            score_buckets["Rất cao"] += 1
        elif score >= 0.7:
            score_buckets["Cao"] += 1
        elif score >= 0.5:
            score_buckets["Đạt ngưỡng"] += 1
        else:
            score_buckets["Thấp"] += 1

    png_charts = generate_png_charts(report, dishes, similarity_rows)
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

    kmeans = report.get("kmeans", {})
    summary = {
        "raw": {"files": len(raw_files), "rows": raw_rows, "file_rows": raw_file_rows},
        "preprocessing": {
            "clean_dishes": len(dishes),
            "unique_categories": len(category_counts),
            "set_menu_items": len(set_items),
            "category_counts": dict(category_counts),
            "price_range_counts": {PRICE_LABELS.get(label, label): count for label, count in price_counts.items()},
        },
        "kmeans": {
            "clusters": dict(cluster_counts),
            "cluster_count": len(cluster_counts),
            "silhouette_score": kmeans.get("silhouette_score"),
            "convergence_start": (kmeans.get("convergence_history") or [None])[0],
            "convergence_end": (kmeans.get("convergence_history") or [None])[-1],
            "method": kmeans,
        },
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
                f"- Silhouette Score: **{float(kmeans.get('silhouette_score') or 0):.4f}**.",
                "- Thuộc tính gom cụm: giá và calories đã chuẩn hóa, cờ set menu, nhóm danh mục one-hot và keyword one-hot.",
                "- Khởi tạo K-Means++, chạy 20 lần và chọn kết quả có WCSS thấp nhất.",
                "",
                "## 4. Gợi ý món ăn",
                f"- Số quan hệ tương đồng đạt ngưỡng: **{vi_num(len(similarity_rows))}**.",
                "- Điểm tương đồng kết hợp keyword Jaccard, danh mục, mức giá và cụm K-Means.",
            ]
        ),
        encoding="utf-8",
    )

    print(
        json.dumps(
            {
                "charts": len(png_charts),
                "chart_data": len(chart_data),
                "summary_md": str(SUMMARY_MD),
                "summary_json": str(SUMMARY_JSON),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
