# FoodRec Processed Data

Thư mục này chứa dữ liệu sau tiền xử lý theo hướng mới: chỉ sử dụng dữ liệu thực đơn thật từ website Cơm Niêu Việt Nam, không dùng hóa đơn/giao dịch sinh giả.

## File chính

- `dishes_clean.csv`: 119 món ăn đã làm sạch, chuẩn hóa giá, trích danh mục từ URL, giữ mô tả, hình ảnh, nguồn URL, keyword và cụm K-Means.
- `set_menu_items_clean.csv`: các món con parse được từ mô tả set menu thật. File này dùng để phân tích nội dung set menu, không xem là hóa đơn khách hàng.
- `content_similarity_recommendations.csv`: bảng gợi ý content-based. Mỗi món có các món tương đồng dựa trên keyword, danh mục, cụm K-Means và độ gần giá.
- `advanced_mining_report.json`: báo cáo kỹ thuật dạng JSON cho pipeline.
- `report_assets/data_statistics_report.md`: nội dung thống kê ngắn cho báo cáo.
- `report_assets/data_statistics_report.json`: thống kê dạng JSON cho web admin.
- `report_assets/charts/*.svg`: biểu đồ dữ liệu gốc, dữ liệu sạch, phân bố danh mục, mức giá, cụm K-Means và điểm gợi ý.

## Hướng kỹ thuật

1. Tiền xử lý dữ liệu thực đơn thô:
   - Chuẩn hóa giá tiền từ chuỗi sang số nguyên.
   - Trích danh mục từ `web_scraper_start_url`.
   - Làm sạch tên món, mô tả và URL hình ảnh.
   - Trích keyword từ tên/mô tả món.

2. Gom cụm K-Means:
   - Thuộc tính: giá tiền, calories ước tính, cờ set menu, keyword one-hot.
   - Kết quả cụm được lưu trong `cluster_id` và `cluster_label`.

3. Gợi ý content-based:
   - Không dùng hóa đơn sinh giả.
   - Điểm gợi ý dựa trên keyword Jaccard, cùng cụm K-Means, cùng danh mục và độ gần giá.
