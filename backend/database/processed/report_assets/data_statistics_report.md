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

## 4. Gợi ý món ăn
- Số quan hệ tương đồng đạt ngưỡng: **892**.
- Điểm tương đồng kết hợp keyword Jaccard, danh mục, mức giá và cụm K-Means.