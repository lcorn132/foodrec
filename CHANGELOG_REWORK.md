# Changelog Rework

## Hướng mới

- Loại bỏ hướng dữ liệu hóa đơn/giao dịch sinh giả.
- Loại bỏ hướng khai phá luật từ giao dịch khỏi luồng chính.
- Chuyển trọng tâm sang dữ liệu thực đơn thật và gợi ý content-based.

## Dữ liệu

- Giữ dữ liệu raw trong `backend/database/raw/`.
- Dữ liệu processed chỉ còn:
  - `dishes_clean.csv`
  - `set_menu_items_clean.csv`
  - `content_similarity_recommendations.csv`
  - report và biểu đồ trong `report_assets/`

## Ứng dụng

- Trang admin dữ liệu hỗ trợ upload Excel raw.
- Pipeline xử lý: clean menu, K-Means, content-based recommendations, charts.
- Web hiển thị ảnh món thật từ `image_url`.
- Gợi ý món dựa trên độ tương đồng nội dung, cụm K-Means, danh mục và mức giá.
