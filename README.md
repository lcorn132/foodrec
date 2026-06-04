# FoodRec - Hệ thống gợi ý món ăn từ thực đơn thật

FoodRec là đồ án khai thác dữ liệu sử dụng dữ liệu thực đơn thật từ website Cơm Niêu Việt Nam. Hệ thống không dùng hóa đơn/giao dịch sinh giả; bài toán được chuyển sang gợi ý món ăn dựa trên nội dung thực đơn.

## Bài toán

Xây dựng ứng dụng web gợi ý món ăn dựa trên dữ liệu thực đơn thật của nhà hàng.

Các bước chính:

1. Thu thập/xây dựng bộ dữ liệu thực đơn.
2. Làm sạch dữ liệu món ăn.
3. Phân tích mối quan hệ giữa các món ăn trong thực đơn thông qua đặc trưng nội dung.
4. Gom cụm món ăn bằng K-Means.
5. Gợi ý món bằng content-based filtering.
6. Xây dựng ứng dụng web để hiển thị thực đơn, chi tiết món, giỏ hàng, đặt hàng và trang quản lý dữ liệu.

## Dữ liệu

Dữ liệu raw nằm tại:

- `backend/database/raw/`

Dữ liệu sau tiền xử lý nằm tại:

- `backend/database/processed/dishes_clean.csv`
- `backend/database/processed/set_menu_items_clean.csv`
- `backend/database/processed/content_similarity_recommendations.csv`
- `backend/database/processed/advanced_mining_report.json`
- `backend/database/processed/report_assets/`

Quy mô hiện tại:

- 13 file Excel raw.
- 238 dòng raw.
- 119 món ăn sạch duy nhất.
- 118 dòng món con parse từ mô tả set menu thật.
- 952 dòng gợi ý content-based.

## Kỹ thuật

- Data Transformation: chuẩn hóa giá tiền từ chuỗi sang số nguyên.
- Feature Extraction: trích danh mục từ URL.
- Text Cleaning: làm sạch tên món, mô tả và khoảng trắng.
- Feature Engineering: trích keyword, ước tính calories, phân mức giá.
- K-Means: gom cụm món ăn theo giá, calories, set menu flag và keyword.
- Content-Based Filtering: tính điểm tương đồng dựa trên keyword, danh mục, cụm K-Means và độ gần giá.

## Ứng dụng

- Frontend: React + Vite.
- Backend: FastAPI + SQLAlchemy.
- Database: SQLite local hoặc PostgreSQL/Neon khi deploy.
- Deploy: Vercel frontend, Render backend.

## Chạy local

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Pipeline dữ liệu:

```bash
python backend/scripts/run_advanced_pipeline.py
python backend/scripts/generate_data_report_assets.py
```

Hoặc chạy trên web admin tại:

- `/dashboard/preprocessing`

## Xác nhận hướng đồ án

Đề tài đáp ứng các nhóm tiêu chí:

- Thu thập/xây dựng, phân tích dữ liệu.
- Làm sạch dữ liệu và tăng cường đặc trưng dữ liệu.
- Mô hình/thuật toán xử lý bài toán: K-Means và content-based filtering.
- Xây dựng ứng dụng web.
