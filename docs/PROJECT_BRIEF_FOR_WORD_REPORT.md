# Tài liệu dự án: PHÂN TÍCH MỐI QUAN HỆ DỮ LIỆU MÓN ĂN VÀ XÂY DỰNG HỆ THỐNG GỢI Ý THỰC ĐƠN

Tài liệu này dùng làm bản nền cho AI hoặc người viết báo cáo. Nội dung ưu tiên đúng với hệ thống hiện tại, tránh phóng đại thành mô hình học hành vi người dùng khi dự án chưa có dữ liệu giao dịch thật.

## 1. Thông tin tổng quan

Tên đề tài: PHÂN TÍCH MỐI QUAN HỆ DỮ LIỆU MÓN ĂN VÀ XÂY DỰNG HỆ THỐNG GỢI Ý THỰC ĐƠN.

Tên sản phẩm minh họa: FoodRec.

Mục tiêu: phân tích mối quan hệ giữa các món ăn trong dữ liệu thực đơn thật, sau đó xây dựng website đặt món và gợi ý phối món cho thực đơn nhà hàng Cơm Niêu Việt Nam. Hệ thống hỗ trợ hai nhóm người dùng:

- Khách hàng: xem trang chủ, duyệt món, xem chi tiết món, chọn kiểu chế biến, thêm vào giỏ hàng, chọn voucher, đặt hàng và nhận gợi ý món ăn.
- Quản trị: quản lý món ăn, đơn hàng, voucher, dữ liệu upload, pipeline tiền xử lý và dashboard thống kê.

Định hướng khai thác dữ liệu: không sinh hóa đơn/giao dịch giả. Vì nhà hàng không công khai lịch sử đơn hàng thật, hệ thống chuyển trọng tâm sang bài toán gợi ý dựa trên nội dung món ăn, gom cụm K-Means và tri thức phối mâm cơm Việt.

## 2. Bài toán và phạm vi

Bài toán chính:

- Làm sạch dữ liệu thực đơn thật từ nhiều file Excel.
- Chuẩn hóa tên món, giá, danh mục, mô tả, ảnh, nguồn URL.
- Gom cụm món ăn thành các nhóm vai trò trong bữa ăn.
- Gợi ý món tương đồng khi khách xem chi tiết món.
- Gợi ý món bổ sung khi khách đã có giỏ hàng.
- Ưu tiên món theo ngữ cảnh thời gian.
- Đồng bộ dữ liệu upload lên dashboard và trang khách hàng.

Không nằm trong phạm vi hiện tại:

- Không huấn luyện collaborative filtering từ lịch sử mua hàng thật.
- Không dùng đơn hàng giả để tạo doanh thu hoặc hành vi người dùng.
- Không khẳng định hệ thống là AI học sâu end-to-end.
- Không đưa ra tư vấn dinh dưỡng/y khoa cá nhân hóa.

## 3. Dữ liệu sử dụng

Nguồn dữ liệu: các file Excel raw thu thập từ website Cơm Niêu Việt Nam. Dữ liệu sau tiền xử lý nằm tại `backend/database/processed`.

Các file quan trọng:

- `dishes_clean.csv`: dữ liệu món ăn sạch, gồm tên, giá, danh mục, mô tả, ảnh, nguồn URL, keyword, vai trò món và cụm K-Means.
- `set_menu_items_clean.csv`: các món con parse được từ mô tả set menu thật.
- `content_similarity_recommendations.csv`: bảng gợi ý tương đồng nội dung cho từng món.
- `advanced_mining_report.json`: báo cáo kỹ thuật của pipeline.
- `report_assets/data_statistics_report.json`: thống kê và dữ liệu biểu đồ để dashboard render.

Quy mô dữ liệu hiện tại:

- 13 file Excel raw.
- 238 dòng raw.
- 119 món sạch duy nhất.
- 118 dòng set menu parse.
- 952 dòng gợi ý tương đồng nội dung.
- 4 cụm K-Means.

## 4. Pipeline xử lý dữ liệu

Pipeline được chạy sau mỗi lần upload dữ liệu mới ở dashboard. Khi pipeline chạy xong, dữ liệu sạch được nạp lại vào bảng `dishes`, đồng thời xóa dữ liệu đơn hàng/rating cũ để tránh khóa ngoại và tránh hiển thị dữ liệu không còn khớp với menu mới.

Các bước chính:

1. Đọc file Excel raw.
2. Chuẩn hóa giá tiền từ chuỗi sang số nguyên VND.
3. Trích danh mục từ URL nguồn.
4. Làm sạch tên món, mô tả, ảnh và nguồn URL.
5. Trích keyword từ tên/mô tả món.
6. Ước tính calories thô để hỗ trợ feature engineering.
7. Gán vai trò món ban đầu.
8. Chạy K-Means để gom món.
9. Diễn giải cụm thành nhãn có ý nghĩa ẩm thực.
10. Sinh bảng gợi ý content-based.
11. Sinh thống kê dashboard dạng JSON.
12. Nạp `dishes_clean.csv` lên database cho trang khách hàng.

## 5. Thuật toán và mô hình gợi ý

Hệ thống dùng mô hình gợi ý lai, gồm K-Means, content-based filtering, rule/scoring liên cụm và contextual filtering.

### 5.1. K-Means Clustering

Mục đích: gom món ăn thành các nhóm có đặc trưng gần nhau và hỗ trợ diễn giải vai trò món trong bữa ăn.

Đặc trưng đầu vào:

- `price_vnd`: giá món.
- `estimated_calories`: calories ước tính.
- `is_set_menu`: cờ set menu.
- keyword one-hot từ tên/mô tả món.

Kết quả diễn giải thành 4 cụm:

- C1 - Món nền tảng: cơm, món nền.
- C2 - Món mặn đưa cơm: cá, heo, bò, gà, món kho/chiên/rim.
- C3 - Món thanh mát: rau, canh.
- C4 - Món tiệc/lẩu/ăn chơi: lẩu, khai vị, set menu, món thêm.

Lưu ý khi viết báo cáo: K-Means hiện dùng đặc trưng giá, calories ước tính, set menu và keyword; chưa có dữ liệu dinh dưỡng định lượng đầy đủ để khẳng định mô hình được huấn luyện trực tiếp bằng đủ bốn nhóm chất.

### 5.2. Content-Based Filtering cho chi tiết món

Dùng ở mục "Có thể bạn cũng thích" khi khách đang xem chi tiết một món.

Nguyên tắc:

- So món hiện tại với các món khác.
- Ưu tiên món cùng cụm K-Means hoặc cùng vai trò món.
- Tính điểm tương đồng dựa trên keyword, danh mục và độ gần giá.

Công thức khái quát:

```text
similarity =
  keyword_jaccard * 0.5
+ same_category * 0.25
+ price_proximity * 0.25
+ cluster_or_role_bonus
```

Ý nghĩa:

- `keyword_jaccard`: độ trùng keyword giữa hai món.
- `same_category`: cùng danh mục thì cộng điểm.
- `price_proximity`: giá càng gần thì điểm càng cao.
- `cluster_or_role_bonus`: món cùng cụm/vai trò được ưu tiên hơn.

### 5.3. Cross-Cluster Mapping cho giỏ hàng

Dùng ở mục "Gợi ý phối món đi kèm" trong giỏ hàng. Mục tiêu không phải tìm món giống nhau, mà là tìm món bổ sung còn thiếu trong mâm.

Mỗi món được ánh xạ sang vai trò:

- `foundation`: cơm/món nền.
- `savory`: món mặn/đạm đưa cơm.
- `fresh`: rau/canh.
- `feast`: khai vị, lẩu, món tiệc hoặc món bổ sung.

Luật phối chính:

```text
Nếu giỏ có foundation + savory
→ ưu tiên fresh: rau/canh.

Nếu giỏ có savory + fresh
→ ưu tiên foundation: cơm.

Nếu giỏ có foundation + fresh
→ ưu tiên savory: món mặn.

Nếu giỏ đã có foundation + savory + fresh
→ ưu tiên khai vị, nước, tráng miệng.

Nếu giỏ có lẩu
→ cho phép gợi ý món thêm phù hợp như mì/bún, khai vị, nước.
```

Các chặn ngữ cảnh:

- Không gợi ý lại món đã có trong giỏ.
- Không gợi ý tiếp vai trò món đã đủ trong giỏ, ví dụ đã có canh/rau thì không đẩy thêm canh/rau.
- Không gợi ý `Mì/Bún thêm` nếu giỏ không có lẩu, bún, mì hoặc món nước dùng phù hợp.
- Không gợi ý set menu khi khách đang chọn món lẻ.
- Nếu giỏ đã đủ các nhóm chính và cả khai vị, engine có thể trả về rỗng thay vì cố gợi ý bừa.

### 5.4. Contextual Filtering theo thời gian

Dùng ở trang chủ để ưu tiên món theo thời điểm truy cập:

- 10:00-14:00: ưu tiên cơm, món mặn, rau/canh, món nhanh, giá vừa phải.
- 17:00-22:00: ưu tiên lẩu, set menu, món tiệc/gia đình.
- Ngoài khung trên: ưu tiên món mặn, rau/canh và cơm theo thứ tự nhẹ hơn.

## 6. Tri thức miền và nguồn tham khảo

Tri thức ẩm thực được triển khai trong `backend/app/services/culinary_knowledge.py`. Đây là cách nhóm chuyển hóa tài liệu thành đặc trưng và luật phần mềm; không phải trích dẫn nguyên văn hoặc tư vấn dinh dưỡng.

Nguồn 1 - Văn hóa học:

- Tài liệu: Trần Ngọc Thêm. (1999). *Cơ sở văn hóa Việt Nam*. Nhà xuất bản Giáo dục.
- Cách áp dụng: diễn giải cấu trúc bữa ăn Việt thành món nền tảng, món đạm đưa cơm và rau/canh cân bằng.
- Ánh xạ trong hệ thống: `foundation`, `savory`, `fresh`.

Nguồn 2 - Triết lý ẩm thực:

- Tài liệu: Nguyễn Nhã. (2009). *Bản sắc ẩm thực Việt Nam*. Nhà xuất bản Thông Tấn.
- Cách áp dụng: ưu tiên phối món đậm/kho/chiên với món thanh, rau hoặc canh để tạo sự hài hòa trong bữa ăn.
- Ánh xạ trong hệ thống: rule chuyển từ món mặn sang rau/canh và chặn gợi ý quá nhiều món cùng tính chất.

Nguồn 3 - Dinh dưỡng:

- Tài liệu: Viện Dinh dưỡng Quốc gia. (2019). *Ăn đa dạng nhiều loại thực phẩm và đảm bảo đủ 4 nhóm: chất bột, chất đạm, chất béo, vitamin và muối khoáng*. Bộ Y tế.
- URL: https://chuyentrang.viendinhduong.vn/vi/10-loi-khuyen-dinh-duong-hop-ly/loi-khuyen-so-1-an-da-dang-nhieu-loai-thuc-pham-va-dam-bao-du-4-nhom-chat-bot-chat-dam-chat-beo-vitamin-va-muoi-khoang.html
- Cách áp dụng: kiểm tra độ phủ nhóm bột đường, chất đạm, chất béo, vitamin và khoáng chất ở mức định hướng.
- Giới hạn: dữ liệu menu hiện chưa có định lượng đủ các chất, nên không nên viết rằng hệ thống phân tích chính xác dinh dưỡng.

## 7. Kiến trúc hệ thống

Backend:

- FastAPI.
- SQLAlchemy ORM.
- SQLite local hoặc PostgreSQL/Neon khi deploy.
- Các router chính: dishes, orders, recommendations, analytics, data_pipeline, vouchers, ratings, auth.

Frontend:

- React + Vite.
- Tailwind CSS.
- Giao diện khách hàng: trang chủ, menu, chi tiết món, giỏ hàng, checkout, tài khoản.
- Giao diện quản trị: tổng quan, quản lý món ăn, quản lý đơn hàng, quản lý voucher, quản lý dữ liệu/pipeline.

Database chính:

- `dishes`: món ăn.
- `orders`: đơn hàng.
- `customers`: khách hàng.
- `ratings`: đánh giá.
- `vouchers`: mã/ưu đãi giảm giá.

## 8. Các chức năng chính

Trang khách hàng:

- Xem món theo dữ liệu upload mới nhất.
- Xem chi tiết món.
- Chọn kiểu chế biến nếu tên món có dạng `Kho tộ/Chiên/Sốt cà`.
- Thêm món vào giỏ hàng.
- Đổi kiểu chế biến ngay trong giỏ hàng.
- Nhận gợi ý phối món.
- Chọn voucher đang bật thay vì nhập mã thủ công.
- Checkout và lưu đơn hàng.

Dashboard:

- Theo dõi tổng quan.
- Doanh thu chỉ tính đơn đã hoàn thành.
- Quản lý đơn hàng.
- Quản lý món ăn.
- Quản lý voucher: thêm, sửa, bật/tắt, mức giảm, điều kiện áp dụng.
- Upload Excel raw.
- Chạy pipeline và nạp dữ liệu sạch lên web.
- Xem thống kê, cụm K-Means và biểu đồ HTML/CSS.

## 9. Voucher và doanh thu

Voucher:

- Có thể giảm theo phần trăm hoặc số tiền cố định.
- Có điều kiện đơn tối thiểu.
- Có mức giảm tối đa.
- Có trạng thái bật/tắt.
- Khách không cần nhập mã; hệ thống hiển thị các ưu đãi đang bật, giống trải nghiệm chọn ưu đãi trên app giao đồ ăn.

Doanh thu:

- Dashboard chỉ ghi nhận doanh thu từ đơn `completed`.
- Đơn pending, confirmed, cooking, delivering chưa tính doanh thu.
- Đơn cancelled không tính doanh thu.

## 10. Kiểm thử đã thực hiện

Các nhóm kiểm thử chính:

- Build frontend bằng `npm run build`.
- Import backend bằng `from app.main import app`.
- Test pipeline nạp lại 119 món sạch.
- Test xóa orders/ratings cũ trước khi replace dishes để tránh lỗi khóa ngoại.
- Test recommendation case:
  - Có cá + rau + canh thì không gợi ý thêm canh.
  - Có cá + rau + canh + cơm thì gợi ý khai vị/nước, không gợi ý mì/bún thêm.
  - Có đủ cơm + món mặn + rau/canh + khai vị thì engine có thể không gợi ý thêm.
- Test voucher seed và tính giảm giá.

## 11. Hạn chế hiện tại

- Chưa có lịch sử mua hàng thật nên chưa triển khai collaborative filtering.
- Chưa có dữ liệu dinh dưỡng định lượng đầy đủ cho từng món.
- Calories là ước tính sơ bộ từ keyword, không phải dữ liệu chuyên gia.
- K-Means cần diễn giải bằng tri thức miền, không tự hiểu ý nghĩa ẩm thực.
- Rule phối món dựa trên tài liệu và thiết kế của nhóm, cần kiểm chứng thêm với chuyên gia ẩm thực nếu báo cáo yêu cầu độ tin cậy cao.
- Recommendation engine là hybrid heuristic + content-based, chưa phải mô hình AI học sâu.

## 12. Gợi ý bố cục báo cáo Word

Chương 1 - Giới thiệu:

- Lý do chọn đề tài.
- Mục tiêu nghiên cứu.
- Đối tượng và phạm vi.
- Phương pháp thực hiện.

Chương 2 - Cơ sở lý thuyết:

- Khai thác dữ liệu.
- Tiền xử lý dữ liệu.
- K-Means clustering.
- Content-based filtering.
- Hệ gợi ý lai.
- Tri thức ẩm thực và cấu trúc bữa ăn Việt.

Chương 3 - Phân tích và thiết kế hệ thống:

- Yêu cầu chức năng.
- Kiến trúc frontend/backend/database.
- Thiết kế dữ liệu.
- Quy trình upload và pipeline.
- Thiết kế recommendation engine.

Chương 4 - Cài đặt và thực nghiệm:

- Công nghệ sử dụng.
- Mô tả các màn hình.
- Kết quả tiền xử lý dữ liệu.
- Kết quả gom cụm K-Means.
- Kết quả gợi ý món.
- Kiểm thử các case quan trọng.

Chương 5 - Kết luận và hướng phát triển:

- Kết quả đạt được.
- Hạn chế.
- Hướng phát triển: bổ sung dữ liệu giao dịch thật, collaborative filtering, đánh giá precision/recall, thêm dữ liệu dinh dưỡng định lượng, thêm giải thích gợi ý.

## 13. Prompt gợi ý cho AI viết báo cáo Word

Có thể đưa đoạn sau cho AI khác:

```text
Hãy viết báo cáo Word cho đề tài "PHÂN TÍCH MỐI QUAN HỆ DỮ LIỆU MÓN ĂN VÀ XÂY DỰNG HỆ THỐNG GỢI Ý THỰC ĐƠN" dựa trên tài liệu dự án sau. Sản phẩm minh họa của đề tài có tên FoodRec.
Yêu cầu:
- Viết bằng tiếng Việt học thuật, mạch lạc.
- Không phóng đại thành mô hình học sâu hoặc collaborative filtering.
- Nhấn mạnh hệ thống dùng mô hình gợi ý lai: K-Means, content-based filtering, cross-cluster mapping dựa trên tri thức ẩm thực và contextual filtering.
- Ghi rõ dữ liệu là thực đơn thật, không dùng hóa đơn/giao dịch giả.
- Ghi rõ nguồn tri thức miền: Trần Ngọc Thêm, Nguyễn Nhã, Viện Dinh dưỡng Quốc gia.
- Có phần hạn chế và hướng phát triển.
- Có thể viết theo 5 chương: Giới thiệu, Cơ sở lý thuyết, Phân tích thiết kế, Cài đặt thực nghiệm, Kết luận.
```

## 14. Cách diễn đạt nên dùng và nên tránh

Nên dùng:

- "Hệ thống gợi ý lai".
- "Gợi ý dựa trên nội dung món ăn và tri thức miền".
- "K-Means hỗ trợ gom cụm và diễn giải vai trò món".
- "Cross-cluster mapping giúp gợi ý món bổ sung còn thiếu trong mâm".
- "Không sử dụng dữ liệu giao dịch giả".

Nên tránh:

- "Hệ thống học hành vi người dùng từ đơn hàng" nếu không có dữ liệu thật.
- "Mô hình AI tự học khẩu vị khách hàng" nếu chưa triển khai.
- "Phân tích dinh dưỡng chính xác" vì dữ liệu hiện chưa đủ.
- "Tri thức chuyên gia" nếu chưa có xác nhận từ chuyên gia/đầu bếp.
