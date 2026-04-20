# FoodRec — Hệ thống gợi ý thực đơn thông minh
## Nhóm 10 — Đồ án Khai phá dữ liệu

---

## Cài đặt

### 1. PostgreSQL
```bash
# Tạo database
createdb foodrec
# Hoặc dùng pgAdmin tạo database tên "foodrec"

# Cấu hình trong backend/.env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/foodrec
```

> **Lưu ý:** Nếu chưa cài PostgreSQL, có thể dùng SQLite bằng cách đổi trong `.env`:
> `DATABASE_URL=sqlite:///./app.db`

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
API docs: http://localhost:8000/docs

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Mở: http://localhost:5173

---

## Cấu trúc

### Backend (FastAPI + PostgreSQL)
- `/api/auth` — Đăng ký/Đăng nhập (SĐT + OTP)
- `/api/dishes` — CRUD món ăn
- `/api/orders` — Đặt hàng + Checkout
- `/api/recommendations` — Gợi ý (Hybrid 3 phương pháp)
- `/api/analytics` — Dashboard analytics (4 kiến thức KPDL)

### Frontend (React + Vite)
**Trang khách hàng** (Header + Footer):
- `/` — Trang chủ
- `/menu` — Thực đơn
- `/dish/:id` — Chi tiết món
- `/cart` — Giỏ hàng
- `/checkout` — Thanh toán (COD, chuyển khoản, MoMo, ZaloPay)
- `/login`, `/register` — Đăng nhập/Đăng ký

**Dashboard** (layout riêng với sidebar):
- `/dashboard` — Tổng quan
- `/dashboard/association` — Luật kết hợp (Apriori)
- `/dashboard/classification` — Phân lớp (Decision Tree)
- `/dashboard/clustering` — Phân cụm (K-Means)
- `/dashboard/correlation` — Tương quan & Hồi quy

---

## 4 Kiến thức Khai phá dữ liệu

| # | Kiến thức | Thuật toán | Dữ liệu |
|---|-----------|-----------|----------|
| 1 | Tập phổ biến & Luật kết hợp | Apriori (co-occurrence) | 425 orders |
| 2 | Phân lớp dữ liệu | Decision Tree (CART) | 141 dishes |
| 3 | Phân cụm dữ liệu | K-Means | 50 customers |
| 4 | Tương quan & Hồi quy | Pearson + Linear Regression | dishes + ratings |

Tất cả đều **load dữ liệu thật từ database**, không dùng data tĩnh.
