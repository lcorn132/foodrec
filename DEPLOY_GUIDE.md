# 🚀 Hướng Dẫn Deploy FoodRec V6
## Frontend → Vercel | Backend → Render

---

## 📋 CHUẨN BỊ

Bạn cần:
- Tài khoản **GitHub** (miễn phí)
- Tài khoản **Vercel** (miễn phí) → https://vercel.com
- Tài khoản **Render** (miễn phí) → https://render.com

---

## BƯỚC 1: Đưa code lên GitHub

### 1a. Tải Git nếu chưa có
- Windows: https://git-scm.com/download/win → Cài đặt, chọn mặc định

### 1b. Tạo repository mới trên GitHub
1. Vào https://github.com → **New repository**
2. Tên repo: `foodrec-v6`
3. Chọn **Public**
4. **KHÔNG** tick "Add README"
5. Bấm **Create repository**

### 1c. Push code lên GitHub
Mở terminal trong thư mục `project-v6/`, chạy lần lượt:
```bash
git init
git add .
git commit -m "Initial commit - FoodRec V6"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/foodrec-v6.git
git push -u origin main
```
*(Thay `YOUR_USERNAME` bằng username GitHub của bạn)*

---

## BƯỚC 2: Deploy Backend lên Render

> Render.com deploy Python FastAPI miễn phí, phù hợp hơn Vercel cho backend.

### 2a. Tạo Web Service trên Render
1. Vào https://render.com → Đăng nhập/Đăng ký
2. Bấm **New** → **Web Service**
3. Chọn **Connect a repository** → Connect GitHub → Chọn repo `foodrec-v6`
4. Điền thông tin:
   - **Name**: `foodrec-backend`
   - **Root Directory**: `backend` ← quan trọng!
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`

### 2b. Thêm Environment Variables trên Render
Scroll xuống phần **Environment Variables**, thêm:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `sqlite:///./app.db` |
| `SECRET_KEY` | (nhập chuỗi bất kỳ, VD: `foodrec-secret-2024`) |

5. Bấm **Create Web Service**
6. Chờ 3-5 phút deploy xong
7. Copy URL backend → có dạng: `https://foodrec-backend-xxxx.onrender.com`

### 2c. Kiểm tra backend hoạt động
Mở trình duyệt: `https://foodrec-backend-xxxx.onrender.com/health`
→ Phải thấy: `{"status":"healthy"}`

> ⚠️ Render free tier sẽ **sleep sau 15 phút không dùng** → lần đầu mở có thể chờ 30-60 giây

---

## BƯỚC 3: Cập nhật URL Backend vào Frontend

Mở file `frontend/.env.production`, thay URL:
```
VITE_API_BASE_URL=https://foodrec-backend-xxxx.onrender.com/api
```
*(Thay `foodrec-backend-xxxx` bằng URL thật từ Render)*

Sau đó commit và push:
```bash
git add frontend/.env.production
git commit -m "Update backend URL for production"
git push
```

---

## BƯỚC 4: Deploy Frontend lên Vercel

### 4a. Import project
1. Vào https://vercel.com → Đăng nhập/Đăng ký
2. Bấm **Add New** → **Project**
3. Import repo `foodrec-v6` từ GitHub
4. Điền cấu hình:
   - **Root Directory**: `frontend` ← quan trọng!
   - **Framework Preset**: Vite (tự phát hiện)
   - **Build Command**: `npm run build` (mặc định)
   - **Output Directory**: `dist` (mặc định)

### 4b. Thêm Environment Variable trên Vercel
Mở mục **Environment Variables**:

| Name | Value |
|------|-------|
| `VITE_API_BASE_URL` | `https://foodrec-backend-xxxx.onrender.com/api` |

5. Bấm **Deploy**
6. Chờ 2-3 phút
7. Vercel cấp cho bạn URL: `https://foodrec-v6.vercel.app`

---

## BƯỚC 5: Cập nhật CORS Backend

Vào Render dashboard → Service `foodrec-backend` → **Environment**

Thêm biến:

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://foodrec-v6.vercel.app` |

Sau đó **Manual Deploy** lại (hoặc push commit mới) để áp dụng.

---

## ✅ KẾT QUẢ

| Thành phần | URL |
|---|---|
| Frontend | `https://foodrec-v6.vercel.app` |
| Backend API | `https://foodrec-backend-xxxx.onrender.com` |
| API Docs | `https://foodrec-backend-xxxx.onrender.com/docs` |

---

## 🔧 XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi: "Application error" trên Vercel
- Kiểm tra **Root Directory** đã đặt là `frontend` chưa
- Xem **Build Logs** trên Vercel dashboard

### Lỗi: "Network Error" khi gọi API
- Backend đang sleep (Render free tier) → đợi 30-60s rồi thử lại
- Kiểm tra `VITE_API_BASE_URL` đúng chưa trên Vercel Environment Variables
- Kiểm tra `FRONTEND_URL` đúng chưa trên Render Environment Variables

### Lỗi: CORS
- Đảm bảo `FRONTEND_URL` trên Render khớp chính xác URL Vercel
- Sau khi thêm env var → phải **Redeploy** backend

### Lỗi: Trang trắng / không load
- Mở F12 → Console xem lỗi
- Thường do thiếu `VITE_API_BASE_URL` → thêm vào Vercel Environment Variables

---

## 📝 GHI CHÚ

- **Render free tier**: Server sleep sau 15 phút không hoạt động → lần đầu vào chờ 30-60s
- **Database**: Mặc định dùng SQLite trong file `.db` → data reset khi Render redeploy
- Để data bền vững hơn → nâng cấp lên Render PostgreSQL (có plan free)
- **Vercel** tự động redeploy mỗi khi bạn push code mới lên GitHub
