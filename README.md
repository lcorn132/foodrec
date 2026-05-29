# FoodRec - Đồ án Khai phá dữ liệu

## Bài toán

FoodRec là web gợi ý thực đơn/ẩm thực cho nhà hàng, trong đó phần khai phá dữ liệu tập trung vào:

> Thu thập dữ liệu thực phẩm thật, làm sạch và tăng cường dữ liệu, chuyển dữ liệu thành giao dịch nguyên liệu, sau đó dùng Apriori để tìm mối quan hệ giữa các nguyên liệu thường xuất hiện cùng nhau.

Phần đơn hàng, khách hàng và thực đơn trong web vẫn phục vụ demo nghiệp vụ nhà hàng. Riêng phần dữ liệu khai phá chính không dùng đơn hàng mô phỏng.

## Nguồn dữ liệu thật

Dữ liệu gốc được lấy từ **Open Food Facts**, một cơ sở dữ liệu mở về sản phẩm thực phẩm thật trên toàn cầu.

File gốc trong repo:

- `backend/database/openfoodfacts_products_raw.csv`

Cấu trúc chính:

- `source`: nhóm danh mục lúc thu thập, ví dụ `sauces`, `breakfast-cereals`, `instant-noodles`.
- `code`: mã sản phẩm thật trên Open Food Facts.
- `product_name`: tên sản phẩm.
- `brands`, `quantity`: thương hiệu và khối lượng.
- `categories`, `categories_tags`: danh mục sản phẩm.
- `countries`, `countries_tags`: thị trường/quốc gia xuất hiện.
- `ingredients_text`, `ingredients_tags`: danh sách nguyên liệu công bố trên nhãn.
- `nutriscore_grade`, `ecoscore_grade`: điểm dinh dưỡng/môi trường nếu có.
- `nutriments_json`: thông tin dinh dưỡng dạng JSON.

Quy mô hiện tại:

- 3.316 dòng dữ liệu thô.
- 3.104 sản phẩm sạch sau tiền xử lý.
- 3.104 giao dịch nguyên liệu dùng cho Apriori.
- 15.383 nguyên liệu khác nhau sau chuẩn hóa.
- 94 quốc gia và 959 nhóm danh mục được ghi nhận trong dữ liệu.

## Pipeline dữ liệu

Script thu thập:

```bash
python backend/scripts/collect_openfoodfacts_dataset.py
```

Script tiền xử lý:

```bash
cd backend
python -c "from app.services.real_food_preprocessor import run_real_food_preprocessing; run_real_food_preprocessing()"
```

Các file sau xử lý:

- `backend/database/openfoodfacts_products_clean.csv`: bảng sản phẩm sạch, đã chuẩn hóa tên, danh mục, quốc gia, điểm dinh dưỡng và số lượng nguyên liệu.
- `backend/database/openfoodfacts_ingredient_transactions_clean.csv`: dữ liệu giao dịch Apriori, mỗi sản phẩm là một giao dịch, mỗi nguyên liệu là một item.
- `backend/database/openfoodfacts_preprocessing_report.json`: báo cáo làm sạch, biến đổi, thu giảm, thống kê top nguyên liệu.

Các bước đã làm bằng code:

1. Loại dòng thiếu mã sản phẩm hoặc thiếu tên sản phẩm.
2. Tách nguyên liệu từ `ingredients_text`; nếu thiếu thì dùng `ingredients_tags`.
3. Chuẩn hóa chữ thường, khoảng trắng, dấu ngoặc, phần trăm, ký tự thừa.
4. Loại token quá ngắn, số, ký hiệu, và các thành phần quá chung như nước, muối, đường, dầu.
5. Loại sản phẩm còn dưới 3 nguyên liệu sau làm sạch.
6. Tăng cường đặc trưng: danh mục chính, quốc gia chính, số nguyên liệu, điểm Nutri-Score, Eco-Score.
7. Chuyển mỗi sản phẩm thành một giao dịch `transaction_id -> items` cho Apriori.

## Apriori

Service chính:

- `backend/app/services/apriori_service.py`
- `backend/app/services/real_food_preprocessor.py`

Thông số mặc định:

- `min_support = 0.03`
- `min_confidence = 0.25`
- `min_lift = 1.05`

Kết quả hiện tại:

- 51 tập phổ biến.
- 9 luật kết hợp hợp lệ.
- Ví dụ luật:
  - `pâte de cacao -> beurre de cacao`
  - `poivre -> ail`

API:

- `GET /api/analytics/preprocessing-report`
- `POST /api/analytics/preprocessing-report/refresh`
- `GET /api/analytics/apriori/full`
- `POST /api/analytics/apriori/refresh`
- `GET /api/analytics/apriori/ingredient-suggestions?ingredients=poivre`
- `GET /api/analytics/association-rules`
- `GET /api/analytics/recommendation-rate`

## Web thay đổi theo dữ liệu

Dashboard đã được chỉnh để phản ánh dữ liệu mới:

- `/dashboard`: tổng quan web và top luật nguyên liệu.
- `/dashboard/preprocessing`: nguồn dữ liệu, file thô/sạch/giao dịch, thống kê làm sạch.
- `/dashboard/apriori`: tập phổ biến, luật kết hợp, giao dịch nguyên liệu, gợi ý nguyên liệu đi kèm.
- `/dashboard/combo-analysis`: đổi thành phân tích quan hệ nguyên liệu.

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

## Ghi chú nộp đồ án

Khi trình bày báo cáo, nên nhấn mạnh:

- Dữ liệu khai phá chính là dữ liệu thật từ Open Food Facts, không phải dữ liệu tự sinh ngẫu nhiên.
- Dữ liệu được biến đổi thành dạng giao dịch để phù hợp với Apriori.
- Web nhà hàng là lớp ứng dụng minh họa kết quả phân tích và quản lý thực đơn/đơn hàng.
