# Hướng dẫn cài đặt FoodRec

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API mặc định:

- `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend mặc định:

- `http://localhost:5173`

## Pipeline dữ liệu

Chạy bằng script:

```bash
python backend/scripts/run_advanced_pipeline.py
python backend/scripts/generate_data_report_assets.py
```

Hoặc chạy trực tiếp trên web:

- `http://localhost:5173/dashboard/preprocessing`

## Cấu trúc dữ liệu

- Raw Excel: `backend/database/raw/`
- Processed data: `backend/database/processed/`
- Biểu đồ: `backend/database/processed/report_assets/charts/`

## Hướng thuật toán

- Làm sạch dữ liệu thực đơn thật.
- Trích đặc trưng từ tên món, mô tả, giá, danh mục.
- Gom cụm món ăn bằng K-Means.
- Gợi ý món bằng content-based filtering.

Không dùng hóa đơn/giao dịch sinh giả.
