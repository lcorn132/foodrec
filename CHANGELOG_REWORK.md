# Changelog — Bản làm lại theo đúng đề tài Khai phá dữ liệu

## Mục tiêu chỉnh sửa
Chuyển trọng tâm dự án từ phân tích dựa trên đơn hàng mô phỏng sang:

> Khai phá mối quan hệ giữa các món ăn trong set menu công khai của nhà hàng.

## Những phần đã làm lại

### 1. Dữ liệu
Thêm các file:
- `backend/database/set_menu_items_raw.csv`
- `backend/database/set_menu_items_clean.csv`
- `backend/database/set_menu_transactions_clean.csv`
- `backend/database/set_menu_preprocessing_report.json`

### 2. Pipeline làm sạch dữ liệu bằng code
Thêm script:
- `backend/scripts/prepare_set_menu_dataset.py`

Các bước:
- Kiểm tra trường bắt buộc.
- Chuẩn hóa tên món.
- Tách dòng gộp `Trái cây + Khăn lạnh + Trà đá`.
- Chống trùng lặp theo `(set_id, item_name_clean)`.
- Thu giảm dữ liệu bằng cách loại các item quá hiển nhiên khỏi Apriori.

### 3. Apriori
Làm lại:
- `backend/app/services/apriori_service.py`

Nguồn khai phá mới:
- `set_menu_transactions_clean.csv`

Chức năng:
- Tập phổ biến.
- Luật kết hợp.
- Support / Confidence / Lift.
- Gợi ý món đi kèm.

### 4. Dashboard tiền xử lý
Làm lại:
- `frontend/src/pages/admin/DashboardPreprocessing.jsx`

Hiển thị:
- Số dòng thô.
- Số set menu.
- Các bước làm sạch.
- Ví dụ chuẩn hóa tên món.
- Giao dịch sau biến đổi.
- Thu giảm dữ liệu trước Apriori.

### 5. Dashboard Apriori
Làm lại:
- `frontend/src/pages/admin/DashboardApriori.jsx`

Hiển thị:
- Số giao dịch.
- Số item unique.
- Tập phổ biến.
- Luật kết hợp.
- Preview transaction.
- Demo gợi ý món từ luật kết hợp.

### 6. API liên quan
Cập nhật:
- `backend/app/routers/analytics.py`
- `backend/app/services/analytics_service.py`
- `backend/app/services/recommendation_service.py`
- `backend/app/routers/recommendations.py`

### 7. Tài liệu
Cập nhật:
- `README.md`
- `HUONG_DAN_CAI_DAT.md`

## Kết quả chạy thử pipeline
- 98 dòng dữ liệu thô.
- 12 set menu.
- 12 dòng gộp được tách.
- 122 item sau làm sạch.
- 74 item được giữ cho khai phá.
- 12 giao dịch sạch.
- Apriori mặc định sinh được 14 luật hợp lệ với ngưỡng hiện tại.
