# Báo cáo thống kê dữ liệu FoodRec

## 1. Dữ liệu gốc
- Số file raw: **13**.
- Số dòng raw: **238**.

## 2. Dữ liệu sau tiền xử lý
- Số món sạch duy nhất: **119**.
- Số danh mục món: **12**.
- Số dòng set menu parse từ mô tả thật: **118**.

## 3. Gom cụm K-Means
- Số cụm: **4**.
- Silhouette Score: **0.6543**.
- Thuộc tính gom cụm: giá và calories đã chuẩn hóa, cờ set menu, nhóm danh mục one-hot và keyword one-hot.
- Khởi tạo K-Means++, chạy 20 lần và chọn kết quả có WCSS thấp nhất.
- Nhóm danh mục được trích từ loại món theo tri thức cấu trúc bữa ăn Việt; tên cụm chỉ được gán sau khi K-Means hội tụ.

## 4. Gợi ý món ăn
- Số dòng gợi ý tương đồng: **892**.
- Gợi ý chi tiết món dùng content-based filtering theo danh mục, cụm, keyword và độ gần giá.
- Gợi ý giỏ hàng dùng ma trận phối cụm để hoàn thiện mâm cơm Việt.