# 🍜 Hướng dẫn cài đặt & chạy FoodRec v3
## Nhóm 10 — Đồ án Khai phá dữ liệu

---

## 📋 Yêu cầu hệ thống

- **Python** 3.10+ → https://python.org/downloads
- **Node.js** 18+ → https://nodejs.org
- **PostgreSQL** 15+ → https://postgresql.org/download
  - Hoặc dùng pgAdmin (có giao diện)
  - Hoặc bỏ qua PostgreSQL, dùng SQLite (không cần cài gì thêm)

---

## 🚀 CÁCH 1: Dùng SQLite (đơn giản nhất, không cần cài PostgreSQL)

### Bước 1: Giải nén project
```
Giải nén file Nhom10_DoAn_v3.zip ra thư mục bất kỳ
```

### Bước 2: Chạy Backend
```bash
# Mở Terminal/CMD, cd vào thư mục backend
cd project-v3/backend

# Sửa file .env → đổi DATABASE_URL thành SQLite
# Mở file .env bằng Notepad/VS Code, sửa thành:
# DATABASE_URL=sqlite:///./app.db
# (comment dòng postgresql, bỏ comment dòng sqlite)

# Cài thư viện Python
pip install -r requirements.txt

# Chạy server
python -m uvicorn app.main:app --reload --port 8000
```

Nếu thành công sẽ thấy:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
Loading data from CSV files...
  Loading dishes...
  Loading customers...
  Loading orders...
  Loading ratings...
Data loaded: 141 dishes, 50 customers, 425 orders, 586 ratings
```

Kiểm tra: mở trình duyệt → http://localhost:8000/docs → thấy Swagger UI

### Bước 3: Chạy Frontend
```bash
# Mở Terminal/CMD MỚI (giữ nguyên terminal backend)
cd project-v3/frontend

# Cài thư viện Node
npm install

# Chạy
npm run dev
```

Nếu thành công:
```
VITE v5.x.x ready in xxx ms
➜ Local: http://localhost:5173/
```

### Bước 4: Mở trình duyệt
- **Trang khách hàng:** http://localhost:5173
- **Dashboard KPDL:** http://localhost:5173/dashboard

---

## 🐘 CÁCH 2: Dùng PostgreSQL (đầy đủ, chuyên nghiệp hơn)

### Bước 1: Cài PostgreSQL
- Windows: Download tại https://postgresql.org/download/windows
  - Trong quá trình cài, nhớ mật khẩu cho user "postgres"
  - Port mặc định: 5432
- Mac: `brew install postgresql@15`
- Linux: `sudo apt install postgresql`

### Bước 2: Tạo database
```bash
# Cách 1: Dùng command line
psql -U postgres
# Nhập mật khẩu
CREATE DATABASE foodrec;
\q

# Cách 2: Dùng pgAdmin
# Mở pgAdmin → Click phải vào "Databases" → Create → Database
# Đặt tên: foodrec → Save
```

### Bước 3: Cấu hình .env
Mở file `project-v3/backend/.env`, sửa:
```
DATABASE_URL=postgresql://postgres:MẬT_KHẨU_CỦA_BẠN@localhost:5432/foodrec
```
Thay `MẬT_KHẨU_CỦA_BẠN` bằng mật khẩu PostgreSQL đã đặt khi cài.

### Bước 4-5-6: Giống Cách 1 (Bước 2, 3, 4)

---

## 🔍 Kiểm tra mọi thứ hoạt động

### Test Backend API:
Mở http://localhost:8000/docs và thử:
1. `GET /api/dishes` → Phải trả về danh sách 141 món
2. `GET /api/analytics/overview` → Phải trả về thống kê
3. `GET /api/analytics/clustering` → Phải trả về kết quả K-Means

### Test Frontend:
1. http://localhost:5173 → Trang chủ FoodRec
2. http://localhost:5173/menu → Thực đơn (load từ API)
3. http://localhost:5173/login → Đăng nhập (nhập SĐT bất kỳ)
4. http://localhost:5173/dashboard → Dashboard KPDL (sidebar riêng)
5. http://localhost:5173/dashboard/association → Luật kết hợp
6. http://localhost:5173/dashboard/clustering → Phân cụm K-Means

### Test đăng nhập:
- Nhập SĐT bất kỳ → Gửi OTP → Nhập mã OTP: `000000` (6 số 0) → Đăng nhập

### Test đặt hàng:
1. Vào Menu → Chọn món → Thêm giỏ hàng
2. Vào Giỏ hàng → Đặt hàng ngay
3. Điền địa chỉ → Chọn phương thức thanh toán → Xác nhận
4. Đơn hàng được lưu vào DB thật

---

## ❗ Xử lý lỗi thường gặp

### Lỗi: "pip install psycopg2-binary thất bại"
→ Nếu dùng SQLite thì không cần psycopg2. Xóa dòng `psycopg2-binary` trong requirements.txt

### Lỗi: "Module not found: app.xxx"
→ Đảm bảo đang cd đúng thư mục `project-v3/backend` trước khi chạy uvicorn

### Lỗi: "CORS error" trên frontend
→ Đảm bảo backend đang chạy trên port 8000

### Lỗi: "npm install thất bại"
→ Kiểm tra Node.js version: `node -v` (cần >= 18)

### Lỗi: "Cannot connect to PostgreSQL"
→ Kiểm tra PostgreSQL service đang chạy
→ Kiểm tra mật khẩu trong .env đúng chưa
→ Hoặc chuyển sang SQLite cho nhanh

### Lỗi: "sklearn not found"
```bash
pip install scikit-learn scipy mlxtend
```

---

## 📁 Cấu trúc thư mục

```
project-v3/
├── README.md
├── backend/
│   ├── .env                          ← Cấu hình DB
│   ├── requirements.txt              ← Thư viện Python
│   ├── database/                     ← 4 file CSV dữ liệu gốc
│   │   ├── menu_expanded.csv         (141 món)
│   │   ├── customers.csv             (50 khách)
│   │   ├── orders.csv                (425 đơn)
│   │   └── ratings.csv               (586 đánh giá)
│   └── app/
│       ├── main.py                   ← Entry point
│       ├── database.py               ← Kết nối DB
│       ├── models/models.py          ← 4 tables: Dish, Customer, Order, Rating
│       ├── routers/
│       │   ├── auth.py               ← Đăng ký/Đăng nhập OTP
│       │   ├── dishes.py             ← CRUD món ăn
│       │   ├── orders.py             ← Đặt hàng + Checkout
│       │   ├── recommendations.py    ← Gợi ý (Hybrid)
│       │   └── analytics.py          ← Dashboard API (4 KPDL)
│       ├── services/
│       │   ├── data_loader.py        ← Load CSV → DB
│       │   ├── recommendation_service.py ← Thuật toán gợi ý
│       │   └── analytics_service.py  ← 4 kiến thức KPDL
│       └── schemas/schemas.py        ← Pydantic models
│
└── frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── vite.config.js
    └── src/
        ├── App.jsx                   ← Routes (tách customer vs dashboard)
        ├── api/
        │   ├── axios.js
        │   ├── dishesApi.js
        │   ├── recommendationsApi.js
        │   └── analyticsApi.js       ← Gọi API analytics
        ├── layouts/
        │   └── DashboardLayout.jsx   ← Layout sidebar cho dashboard
        ├── components/               ← Header, Footer, DishCard, Loading...
        └── pages/
            ├── HomePage.jsx          ← Trang chủ
            ├── MenuPage.jsx          ← Thực đơn
            ├── DishDetailPage.jsx    ← Chi tiết món
            ├── CartPage.jsx          ← Giỏ hàng
            ├── CheckoutPage.jsx      ← Thanh toán
            ├── LoginPage.jsx         ← Đăng nhập OTP
            ├── RegisterPage.jsx      ← Đăng ký
            ├── DashboardOverview.jsx ← Tổng quan
            ├── DashboardAssociation.jsx  ← Luật kết hợp
            ├── DashboardClassification.jsx ← Phân lớp
            ├── DashboardClustering.jsx   ← Phân cụm
            └── DashboardCorrelation.jsx  ← Tương quan & Hồi quy
```
