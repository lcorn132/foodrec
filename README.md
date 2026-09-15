# PHÂN TÍCH MỐI QUAN HỆ DỮ LIỆU MÓN ĂN VÀ XÂY DỰNG HỆ THỐNG GỢI Ý THỰC ĐƠN

FoodRec là sản phẩm web minh họa cho đề tài khai thác dữ liệu sử dụng dữ liệu thực đơn thật từ website Cơm Niêu Việt Nam. Do nhà hàng không công khai hóa đơn/giao dịch thật, hệ thống không sinh hóa đơn giả mà chuyển hướng sang bài toán phân tích mối quan hệ dữ liệu món ăn và gợi ý thực đơn dựa trên nội dung món ăn, gom cụm K-Means và tri thức cấu trúc bữa ăn truyền thống của người Việt.

## Bài Toán

Xây dựng ứng dụng web gợi ý món ăn dựa trên dữ liệu thực đơn thật của nhà hàng.

Các bước chính:

1. Thu thập/xây dựng bộ dữ liệu thực đơn Cơm Niêu Việt Nam.
2. Làm sạch dữ liệu món ăn.
3. Phân tích mối quan hệ giữa các món ăn trong thực đơn thông qua đặc trưng nội dung và vai trò trong mâm cơm Việt.
4. Gom cụm món ăn bằng K-Means thành 4 nhóm: món nền tảng, món mặn đưa cơm, món thanh mát, món tiệc/lẩu/ăn chơi.
5. Gợi ý món bằng content-based filtering, phối cụm liên nhóm và ngữ cảnh thời gian.
6. Xây dựng ứng dụng web để hiển thị thực đơn, chi tiết món, giỏ hàng, đặt hàng và trang quản lý dữ liệu.

## Dữ Liệu

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
- 952 dòng gợi ý tương đồng nội dung.

## Kỹ Thuật

- Data Transformation: chuẩn hóa giá tiền từ chuỗi sang số nguyên.
- Feature Extraction: trích danh mục từ URL.
- Text Cleaning: làm sạch tên món, mô tả và khoảng trắng.
- Feature Engineering: trích keyword hương vị/nhóm món, ước tính calories, phân mức giá.
- K-Means: gom cụm món ăn theo giá, calories, cờ set menu và keyword one-hot.
- Content-Based Filtering: tính điểm tương đồng dựa trên keyword, danh mục, cụm K-Means, vai trò mâm cơm và độ gần giá.
- Cross-cluster Mapping: gợi ý hoàn thiện mâm cơm, ví dụ có cơm + món mặn thì ưu tiên rau/canh.
- Contextual Filtering: 10h-14h ưu tiên cơm/món mặn/rau canh; 17h-22h ưu tiên lẩu, set menu và món tiệc.

## Cơ Sở Học Thuật

Hướng gom cụm và phối món dựa trên ba nhóm tài liệu. Đây là cách nhóm chuyển hóa tri thức tài liệu thành đặc trưng và luật phần mềm, không phải trích dẫn nguyên văn:

- Văn hóa học: cấu trúc bữa ăn được diễn giải thành món nền tảng, món đạm đưa cơm và rau/canh cân bằng.
- Triết lý ẩm thực: ưu tiên phối món đậm, kho/chiên với món thanh, rau hoặc canh; không xem đây là chẩn đoán tính âm/dương của thực phẩm.
- Dinh dưỡng học: kiểm tra độ phủ bốn nhóm bột đường, chất đạm, chất béo, vitamin và muối khoáng. Dữ liệu hiện tại chưa đủ thành phần dinh dưỡng định lượng để khẳng định K-Means được huấn luyện trực tiếp bằng đủ bốn nhóm này.
- Ma trận luật dùng thực tế nằm tại `backend/app/services/culinary_knowledge.py` và được `recommendation_service.py` sử dụng trực tiếp.

Tài liệu tham khảo APA:

- Trần, N. T. (1999). *Cơ sở văn hóa Việt Nam*. Nhà xuất bản Giáo dục.
- Nguyễn, N. (2009). *Bản sắc ẩm thực Việt Nam*. Nhà xuất bản Thông Tấn.
- Viện Dinh dưỡng Quốc gia. (2019). *Ăn đa dạng nhiều loại thực phẩm và đảm bảo đủ 4 nhóm: chất bột, chất đạm, chất béo, vitamin và muối khoáng*. Bộ Y tế. https://chuyentrang.viendinhduong.vn/vi/10-loi-khuyen-dinh-duong-hop-ly/loi-khuyen-so-1-an-da-dang-nhieu-loai-thuc-pham-va-dam-bao-du-4-nhom-chat-bot-chat-dam-chat-beo-vitamin-va-muoi-khoang.html

## Ứng Dụng

- Frontend: React + Vite.
- Backend: FastAPI + SQLAlchemy.
- Database: SQLite local hoặc PostgreSQL/Neon khi deploy.
- Deploy: Vercel frontend, Render backend.

## Chạy Local

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

## Xác Nhận Hướng Đồ Án

Đề tài đáp ứng các nhóm tiêu chí:

- Thu thập/xây dựng, phân tích dữ liệu.
- Làm sạch dữ liệu và tăng cường đặc trưng dữ liệu.
- Mô hình/thuật toán xử lý bài toán: K-Means, content-based filtering, phối cụm liên nhóm và lọc theo ngữ cảnh.
- Xây dựng ứng dụng web.
