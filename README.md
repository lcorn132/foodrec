# FoodRec — Xây dựng thực đơn nhà hàng bằng khai phá dữ liệu
## Nhóm 10 — Đồ án Khai phá dữ liệu

Dự án được chỉnh lại theo đúng bài toán:

> **Thu thập/xây dựng bộ dữ liệu, làm sạch dữ liệu, sau đó khai phá mối quan hệ giữa các món ăn trong thực đơn nhà hàng bằng Apriori.**

Nguồn dữ liệu thực tế dùng cho phần trọng tâm là **các set menu công khai của Nhà hàng Cơm Niêu Việt Nam**. Mỗi set menu được xem như **một giao dịch** chứa nhiều món ăn.

---

## 1. Quy trình dữ liệu đã triển khai

### 1.1. Dữ liệu thu thập
Các file mới trong `backend/database/`:

- `set_menu_items_raw.csv` — dữ liệu thô của từng dòng món trong 12 set menu.
- `set_menu_items_clean.csv` — dữ liệu sau làm sạch và gán cờ phục vụ khai phá.
- `set_menu_transactions_clean.csv` — dữ liệu giao dịch TID → Items dùng cho Apriori.
- `set_menu_preprocessing_report.json` — báo cáo thống kê tiền xử lý.

### 1.2. Làm sạch dữ liệu bằng code
Script:

```bash
python backend/scripts/prepare_set_menu_dataset.py
```

Các bước xử lý:

1. Kiểm tra trường bắt buộc.
2. Chuẩn hóa chuỗi tên món: khoảng trắng, chữ hoa/thường, sửa một số cách viết không đồng nhất.
3. Tách dòng gộp như `Trái cây + Khăn lạnh + Trà đá` thành từng item riêng.
4. Chống trùng lặp trong cùng set menu theo khóa `(set_id, item_name_clean)`.
5. Thu giảm dữ liệu trước khai phá: loại `Trái cây`, `Khăn lạnh`, `Trà đá`, `Cơm niêu` khỏi tập Apriori để tránh luật hiển nhiên.

### 1.3. Biến đổi dữ liệu cho Apriori
Mỗi set menu sạch được chuyển thành một giao dịch:

```text
TID = SM300_02
Items = Gỏi Thái Hải Sản | Gà Hấp Mắm Nhĩ | Cá Kho Làng Vũ Đại | ...
```

---

## 2. Phân tích Apriori

Service chính:

```text
backend/app/services/apriori_service.py
```

Chức năng:

- Tìm tập phổ biến.
- Sinh luật kết hợp `X → Y`.
- Tính `support`, `confidence`, `lift`.
- Gợi ý món đi kèm dựa trên luật kết hợp từ set menu.

API:

- `GET /api/analytics/apriori/full`
- `POST /api/analytics/apriori/refresh`
- `GET /api/analytics/apriori/dish-recommendations?dish_name=...`
- `GET /api/analytics/preprocessing-report`

---

## 3. Cài đặt

### 3.1. PostgreSQL
```bash
createdb foodrec
```

Cấu hình trong `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/foodrec
```

Có thể dùng SQLite để chạy nhanh khi demo:

```env
DATABASE_URL=sqlite:///./app.db
```

### 3.2. Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

API docs:

```text
http://localhost:8000/docs
```

### 3.3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Truy cập:

```text
http://localhost:5173
```

---

## 4. Cấu trúc web

### Backend — FastAPI
- `/api/auth` — đăng ký/đăng nhập.
- `/api/dishes` — danh mục món.
- `/api/orders` — chức năng mô phỏng đặt món.
- `/api/recommendations` — gợi ý món, ưu tiên luật kết hợp từ set menu.
- `/api/analytics` — dashboard phân tích.

### Frontend — React + Vite
**Trang khách hàng**:
- `/`
- `/menu`
- `/dish/:id`
- `/cart`
- `/checkout`
- `/login`, `/register`

**Dashboard**:
- `/dashboard/preprocessing` — báo cáo thu thập/làm sạch/chuyển đổi dữ liệu.
- `/dashboard/apriori` — tập phổ biến, luật kết hợp, giao dịch set menu, gợi ý món.
- Các màn hình phân tích khác được giữ phục vụ phần mở rộng/demo hệ thống.

---

## 5. Lưu ý về phạm vi dữ liệu

- **Dữ liệu set menu** là dữ liệu trọng tâm cho phần khai phá luật kết hợp của đề tài.
- Các file `orders.csv`, `ratings.csv`, `customers.csv` trong dự án ban đầu được giữ cho chức năng web/demo mở rộng; chúng **không được dùng làm nguồn chính cho phần Apriori của đề tài**.
- Khi viết báo cáo, nên tách rõ:
  - **Dữ liệu thu thập thật**: set menu từ website.
  - **Dữ liệu mô phỏng/phụ trợ**: đơn hàng, đánh giá, khách hàng nếu nhóm vẫn dùng để minh họa chức năng web.
