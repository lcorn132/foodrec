from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import math
import random

OUT = Path("docs/report_figures")
OUT.mkdir(parents=True, exist_ok=True)
W, H = 1800, 1050

FONT_CANDIDATES = [
    "C:/Windows/Fonts/arial.ttf",
    "C:/Windows/Fonts/segoeui.ttf",
    "C:/Windows/Fonts/tahoma.ttf",
]


def font(size, bold=False):
    candidates = []
    if bold:
        candidates += [
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/tahomabd.ttf",
        ]
    candidates += FONT_CANDIDATES
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    return ImageFont.load_default()


FT_TITLE = font(42, True)
FT_H = font(28, True)
FT = font(23)
FT_SMALL = font(19)

COL = {
    "text": "#251814",
    "muted": "#6e5a52",
    "line": "#8a7269",
    "brown": "#4b2d24",
    "gold_light": "#fff3c7",
    "cream": "#fffaf2",
    "blue": "#eef5ff",
    "green": "#eef8ef",
    "rose": "#fff1ef",
    "gray": "#f7f6f4",
    "border": "#dccdc2",
}


def canvas(title):
    img = Image.new("RGB", (W, H), "#ffffff")
    d = ImageDraw.Draw(img)
    return img, d


def wrap_text(d, text, fnt, max_w):
    words = text.split()
    lines, cur = [], ""
    for word in words:
        test = (cur + " " + word).strip()
        if d.textbbox((0, 0), test, font=fnt)[2] <= max_w or not cur:
            cur = test
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def box(d, x, y, w, h, title, lines=None, fill=None, outline=None):
    fill = fill or COL["cream"]
    outline = outline or COL["border"]
    d.rounded_rectangle((x, y, x + w, y + h), radius=22, fill=fill, outline=outline, width=3)
    d.text((x + 26, y + 22), title, fill=COL["brown"], font=FT_H)
    yy = y + 64
    if lines:
        for line in lines:
            for wrapped in wrap_text(d, line, FT, w - 52):
                d.text((x + 28, yy), wrapped, fill=COL["text"], font=FT)
                yy += 32
            yy += 2


def pill(d, x, y, text, fill):
    tw = d.textbbox((0, 0), text, font=FT_SMALL)[2]
    d.rounded_rectangle((x, y, x + tw + 34, y + 36), radius=18, fill=fill, outline="#e1c89d")
    d.text((x + 17, y + 8), text, fill=COL["brown"], font=FT_SMALL)
    return tw + 34


def arrow(d, x1, y1, x2, y2, label=None):
    d.line((x1, y1, x2, y2), fill=COL["line"], width=4)
    ang = math.atan2(y2 - y1, x2 - x1)
    ah, aw = 18, 10
    p1 = (x2 - ah * math.cos(ang) + aw * math.sin(ang), y2 - ah * math.sin(ang) - aw * math.cos(ang))
    p2 = (x2 - ah * math.cos(ang) - aw * math.sin(ang), y2 - ah * math.sin(ang) + aw * math.cos(ang))
    d.polygon([(x2, y2), p1, p2], fill=COL["line"])
    if label:
        bx, by = (x1 + x2) / 2, (y1 + y2) / 2 - 28
        tw = d.textbbox((0, 0), label, font=FT_SMALL)[2]
        d.rounded_rectangle((bx - tw / 2 - 12, by - 6, bx + tw / 2 + 12, by + 28), radius=10, fill="white", outline="#eaded4")
        d.text((bx - tw / 2, by), label, fill=COL["muted"], font=FT_SMALL)


def caption(d, text):
    return


def figure_2_1():
    img, d = canvas("Hình 2.1. Minh họa quá trình phân cụm K-Means")
    x0, y0, x1, y1 = 180, 100, 1620, 920
    d.rounded_rectangle((x0, y0, x1, y1), radius=18, fill="#fbfaf8", outline=COL["border"], width=3)
    d.line((x0 + 70, y1 - 70, x1 - 55, y1 - 70), fill="#bcaea5", width=3)
    d.line((x0 + 70, y1 - 70, x0 + 70, y0 + 60), fill="#bcaea5", width=3)
    d.text((x0 + 500, y1 - 42), "Đặc trưng món ăn", fill=COL["muted"], font=FT_SMALL)
    d.text((x0 + 15, y0 + 25), "Mức giá", fill=COL["muted"], font=FT_SMALL)
    clusters = [((520, 650), "#d99a00"), ((850, 400), "#3b82f6"), ((1240, 680), "#40916c"), ((1300, 300), "#8b5cf6")]
    random.seed(4)
    for (cx, cy), color in clusters:
        for _ in range(28):
            px = int(random.gauss(cx, 55))
            py = int(random.gauss(cy, 42))
            d.ellipse((px - 7, py - 7, px + 7, py + 7), fill=color, outline="white", width=2)
        d.rectangle((cx - 14, cy - 14, cx + 14, cy + 14), fill="white", outline=color, width=5)
        d.line((cx - 17, cy, cx + 17, cy), fill=color, width=4)
        d.line((cx, cy - 17, cx, cy + 17), fill=color, width=4)
    for idx in range(1, 5):
        pill(d, x0 + 150 + (idx - 1) * 270, y0 + 25, f"Cụm {idx}", "#fff3c7")
    caption(d, "Nguồn: Nhóm thực hiện minh họa theo thuật toán K-Means sử dụng trong đề tài")
    img.save(OUT / "hinh_2_1_kmeans.png")


def figure_2_2():
    img, d = canvas("Hình 2.2. Các hướng tiếp cận trong hệ thống gợi ý")
    box(d, 130, 350, 430, 190, "Theo nội dung", ["Đặc trưng món"], COL["blue"])
    box(d, 685, 350, 430, 190, "Theo hành vi", ["Lịch sử người dùng"], COL["rose"])
    box(d, 1240, 350, 430, 190, "Gợi ý lai", ["Kết hợp phương pháp"], COL["green"])
    arrow(d, 560, 445, 685, 445)
    arrow(d, 1115, 445, 1240, 445)
    pill(d, 780, 620, "Giải pháp của đề tài", COL["gold_light"])
    caption(d, "Nguồn: Nhóm thực hiện tổng hợp từ cơ sở lý thuyết hệ thống gợi ý")
    img.save(OUT / "hinh_2_2_huong_tiep_can_goi_y.png")


def figure_2_3():
    img, d = canvas("Hình 2.3. Cấu trúc bữa ăn Việt Nam ứng dụng trong đề tài")
    items = [
        ("Món nền tảng", "Cơm", COL["gold_light"]),
        ("Món mặn", "Đạm", COL["rose"]),
        ("Rau / Canh", "Cân bằng", COL["green"]),
        ("Món bổ sung", "Ăn kèm", COL["blue"]),
    ]
    x = 130
    for i, (title, line, color) in enumerate(items):
        box(d, x + i * 405, 270, 320, 160, title, [line], color)
        if i < 3:
            arrow(d, x + i * 405 + 320, 350, x + (i + 1) * 405, 350)
        center_x = x + i * 405 + 160
        d.line((center_x, 430, center_x, 535), fill=COL["line"], width=3)
    d.line((290, 535, 1505, 535), fill=COL["line"], width=3)
    arrow(d, 900, 535, 900, 650)
    box(d, 590, 650, 620, 120, "Mâm cơm hài hòa", None, COL["cream"])
    caption(d, "Nguồn: Nhóm thực hiện diễn giải từ tri thức cấu trúc bữa ăn Việt Nam")
    img.save(OUT / "hinh_2_3_cau_truc_bua_an_viet.png")


def figure_3_2():
    img, d = canvas("Hình 3.2. Quy trình xử lý dữ liệu món ăn")
    steps = [
        ("Excel", "Dữ liệu thô", COL["gray"]),
        ("Làm sạch", "Loại nhiễu", COL["blue"]),
        ("Chuẩn hóa", "Đồng nhất", COL["green"]),
        ("Đặc trưng", "Từ khóa", COL["gold_light"]),
        ("Dữ liệu sạch", "Sẵn sàng", COL["cream"]),
    ]
    for i, (title, line, color) in enumerate(steps):
        bx = 95 + i * 340
        box(d, bx, 380, 270, 150, title, [line], color)
        if i < 4:
            arrow(d, bx + 270, 455, bx + 340, 455)
    caption(d, "Nguồn: Nhóm thực hiện mô tả quy trình xử lý dữ liệu trong đề tài")
    img.save(OUT / "hinh_3_2_quy_trinh_xu_ly_du_lieu.png")


def figure_4_1():
    img, d = canvas("Hình 4.1. Mô hình gợi ý lai được đề xuất")
    box(d, 100, 410, 330, 180, "Dữ liệu món", None, COL["gray"])
    box(d, 560, 185, 330, 180, "K-Means", ["Phân cụm"], COL["blue"])
    box(d, 560, 410, 330, 180, "Nội dung", ["Tương đồng"], COL["green"])
    box(d, 560, 635, 330, 180, "Tri thức", ["Phối món"], COL["gold_light"])
    box(d, 1020, 330, 350, 260, "Bộ máy gợi ý", ["Chấm điểm", "Xếp hạng"], COL["cream"])
    box(d, 1500, 410, 220, 180, "Kết quả", ["Đề xuất"], COL["rose"])
    arrow(d, 430, 500, 560, 275)
    arrow(d, 430, 500, 560, 500)
    arrow(d, 430, 500, 560, 725)
    arrow(d, 890, 275, 1020, 420)
    arrow(d, 890, 500, 1020, 460)
    arrow(d, 890, 725, 1020, 540)
    arrow(d, 1370, 460, 1500, 500)
    pill(d, 1050, 650, "Thời gian", COL["gold_light"])
    arrow(d, 1120, 650, 1170, 590)
    caption(d, "Nguồn: Nhóm thực hiện thiết kế mô hình gợi ý lai cho đề tài")
    img.save(OUT / "hinh_4_1_mo_hinh_goi_y_lai.png")


def figure_4_2():
    img, d = canvas("Hình 4.2. Luồng gợi ý món tương đồng")
    steps = [
        ("Món đang xem", None, COL["blue"]),
        ("Đặc trưng", None, COL["green"]),
        ("Tính điểm", None, COL["gold_light"]),
        ("Xếp hạng", None, COL["cream"]),
        ("Gợi ý", None, COL["rose"]),
    ]
    for i, (title, line, color) in enumerate(steps):
        bx = 80 + i * 345
        box(d, bx, 390, 275, 150, title, [line] if line else None, color)
        if i < 4:
            arrow(d, bx + 275, 465, bx + 345, 465)
    caption(d, "Nguồn: Nhóm thực hiện mô tả luồng gợi ý món tương đồng")
    img.save(OUT / "hinh_4_2_luong_goi_y_tuong_dong.png")


def figure_4_3():
    img, d = canvas("Hình 4.3. Luồng gợi ý phối món theo giỏ hàng")
    box(d, 100, 340, 320, 140, "Giỏ hàng", None, COL["blue"])
    box(d, 560, 340, 330, 140, "Vai trò món", None, COL["green"])
    box(d, 1020, 340, 330, 140, "Nhóm còn thiếu", None, COL["gold_light"])
    box(d, 1480, 340, 240, 140, "Gợi ý", None, COL["rose"])
    arrow(d, 420, 410, 560, 410)
    arrow(d, 890, 410, 1020, 410)
    arrow(d, 1350, 410, 1480, 410)
    box(d, 300, 620, 1200, 110, "Cơm + món mặn  →  Rau / Canh", None, COL["cream"])
    caption(d, "Nguồn: Nhóm thực hiện mô tả luồng gợi ý phối món theo giỏ hàng")
    img.save(OUT / "hinh_4_3_luong_goi_y_gio_hang.png")


def figure_5_1():
    img, d = canvas("Hình 5.1. Sơ đồ tổng quan công nghệ sử dụng trong hệ thống")
    box(d, 90, 240, 330, 150, "Người dùng", None, COL["green"])
    box(d, 90, 520, 330, 150, "Quản trị viên", None, COL["green"])
    box(d, 570, 340, 380, 190, "ReactJS", ["Giao diện web"], COL["blue"])
    box(d, 1120, 320, 430, 230, "FastAPI", ["Phía máy chủ"], COL["gold_light"])
    box(d, 1120, 735, 430, 160, "Cơ sở dữ liệu", None, COL["cream"])
    box(d, 570, 735, 380, 160, "Xử lý dữ liệu", None, COL["cream"])
    box(d, 90, 780, 330, 115, "File Excel", None, "#f8fbff")
    arrow(d, 420, 315, 570, 390, "Truy cập")
    arrow(d, 420, 595, 570, 485, "Quản trị")
    arrow(d, 950, 435, 1120, 435, "Gọi API")
    arrow(d, 1285, 550, 1285, 735, "Lưu / đọc")
    arrow(d, 420, 835, 570, 815, "Tải lên")
    arrow(d, 760, 735, 760, 530, "Dữ liệu sạch")
    arrow(d, 950, 815, 1120, 815, "Nạp dữ liệu")
    caption(d, "Nguồn: Nhóm thực hiện xây dựng từ kiến trúc ứng dụng FoodRec")
    img.save(OUT / "hinh_5_1_so_do_cong_nghe.png")


def main():
    figure_2_2()
    figure_2_3()
    figure_3_2()
    figure_4_1()
    figure_4_2()
    figure_4_3()
    figure_5_1()
    for path in sorted(OUT.glob("*.png")):
        print(path.resolve())


if __name__ == "__main__":
    main()
