# FoodRec - Đồ án Khai phá dữ liệu

## Bài toán

Đề tài tập trung vào khai phá dữ liệu thực đơn nhà hàng:

> Thu thập dữ liệu món ăn/set menu thật từ Nhà hàng Cơm Niêu Việt Nam, làm sạch dữ liệu, biến đổi thành dữ liệu giao dịch, sau đó dùng Apriori để tìm các món thường xuất hiện cùng nhau trong set menu.

Phần web FoodRec dùng để minh họa kết quả và quản lý nghiệp vụ nhà hàng. Phần Apriori của đồ án dùng dữ liệu set menu thật, không dùng dữ liệu nước ngoài.

## Nguồn dữ liệu gốc

Dữ liệu gốc được thu thập từ các trang set menu công khai của Nhà hàng Cơm Niêu Việt Nam:

- Trang tổng: `https://comnieuvietnam.vn/pages/order`
- Ví dụ trang sản phẩm: `https://comnieuvietnam.vn/products/set-menu-200-000d-nguoi-1`

File dữ liệu thô:

- `backend/database/set_menu_items_raw.csv`

Cấu trúc file thô:

- `set_id`: mã set menu, ví dụ `SM200_01`, `SM250_02`.
- `set_name`: tên set menu theo mức giá/người.
- `price_vnd`: giá set menu.
- `source_url`: URL nguồn trên website Cơm Niêu Việt Nam.
- `item_order`: thứ tự món trong set.
- `raw_item_text`: tên món thô như thu thập.

Quy mô dữ liệu thật hiện có:

- 98 dòng món thô từ website.
- 12 set menu công khai.
- 122 dòng sau tách item gộp.
- 74 dòng món dùng cho khai phá sau khi loại món/phần phục vụ hiển nhiên.
- 61 món unique dùng cho Apriori.
- 12 giao dịch Apriori, mỗi giao dịch là một set menu thật.

## Tăng cường dữ liệu

Vì website công khai cho ta **set menu và món ăn**, nhưng không công bố lịch sử hóa đơn/POS của khách hàng, repo tách rõ hai lớp dữ liệu:

- Giao dịch gốc: 12 set menu thật từ website Cơm Niêu Việt Nam.
- Giao dịch tăng cường: dữ liệu dẫn xuất từ 12 set menu thật để tăng số lượng giao dịch cho Apriori.

File tăng cường:

- `backend/database/set_menu_transactions_augmented.csv`
- `backend/database/set_menu_augmentation_report.json`
- Script: `backend/scripts/augment_set_menu_transactions.py`

Phương pháp tăng cường:

1. Chỉ dùng các món đã xuất hiện trong set menu thật của Cơm Niêu Việt Nam.
2. Giữ số món theo cấu trúc set gốc.
3. Hoán đổi 1-3 món trong cùng vị trí món và cùng nhóm giá khi có thể.
4. Không cho trùng món trong cùng một giao dịch.
5. Giữ `origin_transaction_id` để biết giao dịch tăng cường dẫn xuất từ set nào.
6. Đánh dấu `is_augmented = 0` cho giao dịch gốc, `is_augmented = 1` cho giao dịch tăng cường.

Quy mô sau tăng cường:

- 12 giao dịch gốc.
- 9.800 giao dịch tăng cường.
- 9.812 giao dịch dùng cho Apriori.

Dữ liệu tăng cường **không được mô tả là hóa đơn thật**; nó là dữ liệu dẫn xuất có kiểm soát từ nguồn thật để phục vụ khai phá dữ liệu.

## Pipeline tiền xử lý

Script:

```bash
python backend/scripts/prepare_set_menu_dataset.py
```

File đầu ra:

- `backend/database/set_menu_items_clean.csv`
- `backend/database/set_menu_transactions_clean.csv`
- `backend/database/set_menu_preprocessing_report.json`
- `backend/database/set_menu_transactions_augmented.csv`
- `backend/database/set_menu_augmentation_report.json`

Các bước xử lý:

1. Kiểm tra trường bắt buộc: `set_id`, `set_name`, `raw_item_text`.
2. Chuẩn hóa tên món: khoảng trắng, chữ hoa/thường, một số cách viết tắt như `ĐD` thành `Đại dương`.
3. Tách dòng gộp như `Trái cây + Khăn lạnh + Trà đá` thành các item riêng.
4. Chống trùng lặp trong cùng set menu theo khóa `(set_id, item_name_clean)`.
5. Loại khỏi tập khai phá các item hiển nhiên: `Cơm niêu`, `Trái cây`, `Khăn lạnh`, `Trà đá`.
6. Chuyển mỗi set menu thành một giao dịch `TID -> Items` để chạy Apriori.

Ví dụ giao dịch:

```text
TID = SM300_02
Items = Gỏi thái hải sản | Gà hấp mắm nhĩ | Cá kho làng vũ đại | ...
```

## Apriori

Service chính:

- `backend/app/services/apriori_service.py`
- `backend/app/services/data_preprocessor.py`

Thiết lập hiện tại:

- `min_support = 0.02`
- `min_confidence = 0.25`
- `min_lift = 1.0`

Kết quả hiện tại trên dữ liệu tăng cường:

- 9.812 giao dịch.
- 559 tập phổ biến.
- 161 luật kết hợp trước khi giới hạn số dòng trả về dashboard.

API:

- `GET /api/analytics/preprocessing-report`
- `POST /api/analytics/preprocessing-report/refresh`
- `GET /api/analytics/apriori/full`
- `POST /api/analytics/apriori/refresh`
- `GET /api/analytics/apriori/dish-recommendations?dish_name=...`
- `GET /api/analytics/association-rules`
- `GET /api/analytics/recommendation-rate`

Dashboard:

- `/dashboard/preprocessing`: nguồn dữ liệu, tiền xử lý, biến đổi giao dịch.
- `/dashboard/apriori`: tập phổ biến, luật kết hợp, giao dịch set menu, gợi ý món đi kèm.
- `/dashboard/combo-analysis`: phân tích cặp món trong các set menu.

## Cài đặt

Backend:

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Truy cập:

- Frontend: `http://localhost:5173`
- API docs: `http://localhost:8000/docs`
