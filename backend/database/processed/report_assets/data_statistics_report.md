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
- Thuộc tính gom cụm: giá, calories ước tính, cờ set menu, keyword one-hot.
- Diễn giải cụm theo cấu trúc mâm cơm Việt: món nền tảng, món mặn đưa cơm, món thanh mát và món tiệc/lẩu/ăn chơi.

## 4. Gợi ý món ăn
- Số dòng gợi ý tương đồng: **952**.
- Gợi ý chi tiết món dùng content-based filtering theo danh mục, cụm, keyword và độ gần giá.
- Gợi ý giỏ hàng dùng ma trận phối cụm để hoàn thiện mâm cơm Việt.