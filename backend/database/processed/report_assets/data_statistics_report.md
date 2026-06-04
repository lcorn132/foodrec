# Báo cáo thống kê dữ liệu FoodRec

## 1. Dữ liệu gốc
- Số file raw: **13**.
- Số dòng raw: **238**.

## 2. Dữ liệu sau tiền xử lý
- Số món sạch duy nhất: **119**.
- Số danh mục món: **12**.
- Số dòng set menu parse từ mô tả thật: **118**.

## 3. Gom cụm K-Means
- Số cụm: **5**.
- Thuộc tính gom cụm: giá, calories ước tính, cờ set menu, keyword one-hot.

## 4. Gợi ý content-based
- Số dòng gợi ý: **952**.
- Đặc trưng gợi ý: danh mục, cụm K-Means, keyword từ tên/mô tả, độ gần giá.
- Không dùng hóa đơn sinh giả vì nhà hàng không công khai dữ liệu giao dịch thật.