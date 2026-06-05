# YÊU CẦU CẬP NHẬT BÁO CÁO FOODREC

Tệp này dùng kèm với `Nhom10_BaoCao.docx` để chỉnh báo cáo cho đúng với phiên bản hệ thống hiện tại.

## 1. Nguyên tắc chỉnh sửa

- Giữ nguyên bố cục, định dạng, văn phong và hệ thống đánh số hiện có của báo cáo.
- Viết khoảng 85% dưới dạng văn xuôi học thuật; chỉ dùng danh sách khi thật sự cần liệt kê.
- Không dùng từ "pipeline". Có thể thay bằng "quy trình xử lý dữ liệu".
- Không biến báo cáo thành tài liệu giới thiệu mã nguồn.
- Không khẳng định hệ thống sử dụng dữ liệu giao dịch hoặc lịch sử mua hàng để huấn luyện.
- Không gọi điểm gợi ý là "độ chính xác" hoặc "độ tin cậy".
- Không mô tả biểu đồ WCSS như biểu đồ loss/validation loss.
- Không tự tạo thêm số liệu ngoài các số liệu được cung cấp trong tệp này.
- Phân biệt rõ:
  - K-Means dùng để phân tích và tổ chức dữ liệu món ăn.
  - Quan hệ tương đồng dùng để gợi ý món gần giống.
  - Luật phối món dùng để đề xuất món bổ sung theo giỏ hàng.

## 2. Tên đề tài

Tên đề tài thống nhất trong toàn bộ tài liệu:

**PHÂN TÍCH MỐI QUAN HỆ DỮ LIỆU MÓN ĂN VÀ XÂY DỰNG HỆ THỐNG GỢI Ý THỰC ĐƠN**

Xóa hoặc thay tên cũ:

**XÂY DỰNG ỨNG DỤNG WEB GỢI Ý THỰC ĐƠN CHO NHÀ HÀNG**

Hiện tài liệu có hai trang bìa mang hai tên khác nhau. Cần thống nhất tên mới trên cả hai trang hoặc loại bỏ trang bìa trùng nếu đó là lỗi sao chép.

## 3. Cách K-Means thực sự hoạt động

### 3.1 Bản chất thuật toán

Hệ thống sử dụng K-Means theo hướng học không giám sát. Thuật toán không nhận trước nhãn "món nền tảng", "món mặn", "rau/canh" hoặc "món tiệc/lẩu" để ép món ăn vào cụm.

Quá trình thực hiện:

1. Chuyển mỗi món thành vector đặc trưng số.
2. Khởi tạo tâm cụm bằng K-Means++.
3. Gán món vào tâm cụm gần nhất theo khoảng cách Euclidean.
4. Tính lại tâm cụm bằng trung bình các vector trong cụm.
5. Lặp đến khi kết quả không còn thay đổi hoặc đạt giới hạn số vòng lặp.
6. Thực hiện 20 lần khởi tạo khác nhau.
7. Chọn lần chạy có WCSS cuối cùng thấp nhất.
8. Chỉ sau khi K-Means hoàn tất, các cụm mới được diễn giải và đặt tên theo đặc trưng chiếm ưu thế.

### 3.2 Đặc trưng đầu vào

Vector dùng cho K-Means gồm:

- Giá bán được chuẩn hóa Z-score.
- Calories ước tính được chuẩn hóa Z-score.
- Dấu hiệu món thuộc set menu.
- Nhóm danh mục được mã hóa one-hot.
- Từ khóa món ăn được mã hóa one-hot.

Nhóm danh mục được xây dựng từ danh mục có trong dữ liệu thực đơn:

- Nhóm món nền tảng: cơm niêu.
- Nhóm món đạm/món mặn: cá, heo, gà/bò, đậu hũ/trứng và hải sản.
- Nhóm thanh mát: rau và canh.
- Nhóm dùng chung hoặc bổ sung: lẩu, set menu, khai vị và món thêm.

Đây là bước thiết kế đặc trưng dựa trên dữ liệu và tri thức miền. Nhóm danh mục là thuộc tính đầu vào, nhưng tên cụm kết quả không được gán trước cho K-Means.

### 3.3 Điểm cần sửa trong Word

Các đoạn hiện viết rằng "vai trò món trong bữa ăn" được dùng trực tiếp làm đặc trưng dẫn hướng K-Means cần sửa lại. Cách diễn đạt đúng:

> Tri thức về cấu trúc bữa ăn Việt Nam được dùng để xây dựng nhóm đặc trưng danh mục và diễn giải kết quả sau phân cụm. Thuật toán K-Means không nhận trước nhãn cụm đích. Sau khi quá trình phân cụm hoàn tất, nhóm nghiên cứu mới khảo sát đặc trưng nổi bật của từng cụm để đặt tên theo vai trò phù hợp trong bữa ăn.

Không được viết rằng K-Means "biết trước" bốn nhóm cần tạo ra.

## 4. Kết quả K-Means hiện tại

Dữ liệu sau làm sạch có **119 món ăn duy nhất**.

Kết quả phân cụm:

- Cụm 1 - Món nền tảng (cơm): **3 món**.
- Cụm 2 - Món mặn đưa cơm: **50 món**.
- Cụm 3 - Món thanh mát (rau/canh): **27 món**.
- Cụm 4 - Món tiệc/lẩu/ăn kèm: **39 món**.

Chỉ số đánh giá:

- Silhouette Score: **0,6543**.
- WCSS từ trạng thái khởi tạo đến khi hội tụ: khoảng **279,60 xuống 118,21**.
- WCSS ổn định sau bước cập nhật tiếp theo, cho thấy tâm cụm đã hội tụ.

Cách diễn giải Silhouette Score:

> Silhouette Score đạt 0,6543, nằm trong miền giá trị từ -1 đến 1. Kết quả dương và tương đối cao cho thấy phần lớn món ăn gần với các món trong cụm của mình hơn so với các cụm khác. Chỉ số này không chứng minh cách phân nhóm là tuyệt đối đúng về mặt ẩm thực, nhưng cho thấy cấu trúc cụm thu được có mức độ tách biệt phù hợp để phục vụ phân tích và hỗ trợ gợi ý.

Cách diễn giải WCSS:

> WCSS giảm từ khoảng 279,60 ở trạng thái khởi tạo xuống khoảng 118,21 sau khi cập nhật tâm cụm. Giá trị sau đó không còn thay đổi đáng kể, thể hiện thuật toán đã hội tụ. WCSS là tổng bình phương khoảng cách trong cụm, không phải độ chính xác và không phải hàm mất mát của mô hình học sâu.

## 5. Ý nghĩa biểu đồ K-Means

### Biểu đồ WCSS

Chú thích đề xuất:

**Hình X.X. Mức giảm WCSS qua các bước cập nhật tâm cụm**

Nội dung mô tả:

> Biểu đồ thể hiện sự thay đổi của tổng bình phương khoảng cách trong cụm qua các bước cập nhật tâm. Bước 0 tương ứng với trạng thái khởi tạo bằng K-Means++, còn các bước tiếp theo là kết quả sau khi gán lại điểm dữ liệu và cập nhật tâm cụm.

### Biểu đồ phân bố theo giá và calories

Chú thích đề xuất:

**Hình X.X. Hình chiếu kết quả K-Means theo giá bán và calories ước tính**

Phải ghi rõ đây chỉ là hình chiếu hai chiều:

> Mỗi điểm biểu diễn một món ăn và màu sắc thể hiện cụm được K-Means xác định. Biểu đồ chỉ trình bày kết quả theo hai trục giá bán và calories ước tính để hỗ trợ quan sát. Thuật toán thực tế còn sử dụng dấu hiệu set menu, nhóm danh mục và từ khóa; vì vậy không thể đánh giá toàn bộ chất lượng phân cụm chỉ dựa trên khoảng cách giữa các điểm trong hình hai chiều này.

### Biểu đồ số lượng món theo cụm

Chú thích đề xuất:

**Hình X.X. Số lượng món ăn trong từng cụm K-Means**

Số liệu đúng phải là: **3 - 50 - 27 - 39**.

## 6. Quan hệ tương đồng giữa các món

Sau mỗi lần xử lý dữ liệu, hệ thống xây dựng ma trận quan hệ tương đồng giữa các món.

Điểm quan hệ trong dữ liệu phân tích gồm:

- Jaccard từ khóa: 45%.
- Cùng danh mục: 25%.
- Độ gần về giá: 20%.
- Cùng cụm K-Means: 10%.

Công thức trình bày:

**S(i,j) = 0,45J(i,j) + 0,25C(i,j) + 0,20P(i,j) + 0,10K(i,j)**

Trong đó:

- `J(i,j)` là hệ số Jaccard giữa hai tập từ khóa.
- `C(i,j)` bằng 1 nếu hai món cùng danh mục, ngược lại bằng 0.
- `P(i,j)` thể hiện độ gần nhau về giá bán.
- `K(i,j)` bằng 1 nếu hai món cùng cụm K-Means, ngược lại bằng 0.

Chỉ giữ các quan hệ có điểm từ **0,50** trở lên. Mỗi món có tối đa tám quan hệ được xếp hạng cao nhất. Sau khi lọc, dữ liệu hiện tại có **892 cặp gợi ý tương đồng**.

Phải nhấn mạnh:

- Con số phần trăm hiển thị là điểm phù hợp quy đổi từ công thức, không phải xác suất người dùng sẽ chọn món.
- Cùng cụm chỉ chiếm 10%, tránh việc mọi món cùng cụm đều tự động nhận điểm cao.
- Hệ thống không cố điền đủ tám món nếu những món còn lại không đạt ngưỡng.

Ví dụ kết quả hợp lý:

- "Cơm niêu" chỉ có quan hệ đủ ngưỡng với "Cơm niêu đập" và "Cơm niêu cháy".
- "Canh cá nấu riêu" ưu tiên các món canh khác có danh mục và từ khóa liên quan.
- "Lẩu gà lá giang" ưu tiên các món lẩu khác thay vì món bún/mì không có căn cứ.

## 7. Thuật toán gợi ý trên ứng dụng

### 7.1 Gợi ý tại trang chi tiết món

Ứng dụng ưu tiên ứng viên cùng cụm hoặc cùng vai trò món, sau đó tính mức tương đồng từ:

- Từ khóa/nguyên liệu.
- Danh mục.
- Độ gần về giá.
- Điểm cộng khi cùng cụm hoặc cùng vai trò.

Không nên gọi đây là KNN đã được huấn luyện trên hành vi người dùng. Cách diễn đạt phù hợp:

> Hệ thống thực hiện tìm kiếm láng giềng gần trên tập món ăn dựa trên đặc trưng nội dung và phạm vi cụm đã xác định. Các món được chấm điểm và sắp xếp giảm dần để tạo danh sách đề xuất.

### 7.2 Gợi ý phối món trong giỏ hàng

Đây là quan hệ bổ sung liên cụm, không phải quan hệ tương đồng.

- Có cơm và món mặn thì ưu tiên rau/canh.
- Có món mặn và rau/canh nhưng thiếu cơm thì ưu tiên món nền tảng.
- Có cơm và rau/canh nhưng thiếu món mặn thì ưu tiên món đạm.
- Có lẩu thì ưu tiên khai vị, món ăn kèm hoặc đồ uống.
- Món đã có trong giỏ hàng phải bị loại khỏi danh sách gợi ý.
- Nếu giỏ đã có rau/canh thì không tiếp tục ưu tiên thêm nhiều món cùng vai trò.
- Bún/mì thêm chỉ được đề xuất nếu giỏ có lẩu hoặc món phù hợp với bún/mì.

### 7.3 Lọc theo thời gian

- Từ 10 giờ đến trước 14 giờ: ưu tiên cơm, món mặn và rau/canh.
- Từ 17 giờ đến trước 22 giờ: ưu tiên lẩu, món tiệc và món dùng chung.

Yếu tố thời gian chỉ điều chỉnh thứ tự ưu tiên, không tự biến một món không liên quan thành gợi ý phù hợp.

## 8. Những vị trí cần cập nhật trong báo cáo

### Chương 2 - Cơ sở lý thuyết

Bổ sung ngắn gọn:

- Khởi tạo K-Means++.
- Khái niệm WCSS.
- Silhouette Score và miền giá trị từ -1 đến 1.

Không đưa số liệu thực nghiệm vào phần lý thuyết; số liệu để ở Chương 3.

### Chương 3 - Phân tích dữ liệu

Sửa phần đặc trưng đầu vào K-Means cho đúng.

Bổ sung:

- 119 món sau làm sạch.
- Kết quả 3 - 50 - 27 - 39.
- Silhouette Score 0,6543.
- WCSS 279,60 xuống 118,21.
- Nhận xét sự phân bố cụm.
- 892 quan hệ tương đồng đạt ngưỡng 0,50.

Nên chèn ba hình từ dashboard:

1. Mức giảm WCSS.
2. Hình chiếu cụm theo giá và calories.
3. Số lượng món trong từng cụm.

### Chương 4 - Thiết kế hệ thống gợi ý

Thay công thức điểm tổng quát bằng công thức trọng số thực tế của ma trận quan hệ:

**S(i,j) = 0,45J(i,j) + 0,25C(i,j) + 0,20P(i,j) + 0,10K(i,j)**

Bổ sung ngưỡng `S(i,j) >= 0,50` và quy tắc tối đa tám món.

Phân biệt:

- Gợi ý tương đồng tại chi tiết món.
- Gợi ý bổ sung liên cụm trong giỏ hàng.
- Điều chỉnh ưu tiên theo thời gian.

### Chương 5 - Xây dựng ứng dụng

Giữ nội dung đồng bộ dữ liệu khi upload. Bổ sung rằng biểu đồ PNG được tái tạo từ kết quả mới sau mỗi lần xử lý dữ liệu.

Thay toàn bộ dòng giữ chỗ như:

- "Gợi ý chèn hình:"
- `[Hình 5.1: ...]`
- `[Hình 5.2: ...]`

bằng hình thật và chú thích Word nằm bên dưới hình.

### Kết luận

Bổ sung kết quả định lượng:

- 119 món sạch.
- 4 cụm có Silhouette Score 0,6543.
- 892 quan hệ món đạt ngưỡng.

Không khẳng định hệ thống đã chứng minh hiệu quả thương mại hoặc độ chính xác hành vi vì chưa có dữ liệu người dùng thật.

## 9. Kiểm tra hình thức

- Xóa trang bìa trùng hoặc tên đề tài cũ.
- Cập nhật mục lục sau khi chỉnh sửa.
- Giữ hình và chú thích trên cùng trang nếu có thể.
- Không viết tên hình trực tiếp bên trong ảnh.
- Xóa các dòng giữ chỗ.
- Kiểm tra công thức không bị mất ký hiệu khi mở bằng Word.
- Kiểm tra tài liệu tham khảo không bị giãn ký tự.
- Dùng cùng một cách viết: K-Means, K-Means++, WCSS, Silhouette Score và Jaccard.

---

# PROMPT DÙNG CHO CLAUDE

Tôi gửi kèm hai tệp:

1. `Nhom10_BaoCao.docx`: báo cáo hiện tại cần chỉnh sửa.
2. `YEU_CAU_CAP_NHAT_BAO_CAO_CHO_CLAUDE.md`: nguồn sự thật kỹ thuật của phiên bản hệ thống mới nhất.

Hãy chỉnh sửa trực tiếp tệp Word và trả lại một tệp `.docx` hoàn chỉnh.

Yêu cầu thực hiện:

1. Đọc toàn bộ báo cáo trước khi sửa để tránh lặp nội dung giữa các chương.
2. Đối chiếu mọi nội dung kỹ thuật với tệp yêu cầu cập nhật. Khi hai tệp mâu thuẫn, ưu tiên tệp yêu cầu cập nhật.
3. Giữ nguyên cấu trúc tổng thể, văn phong học thuật, định dạng trang, kiểu tiêu đề, đánh số mục và tài liệu tham khảo của báo cáo.
4. Viết khoảng 85% dưới dạng văn xuôi; hạn chế danh sách và không viết theo kiểu giáo án.
5. Sửa tên đề tài cũ và xử lý hai trang bìa đang không thống nhất.
6. Sửa phần K-Means để phản ánh đúng:
   - học không giám sát;
   - K-Means++;
   - chạy 20 lần và chọn WCSS thấp nhất;
   - đặc trưng đầu vào đúng;
   - nhãn vai trò chỉ được gán sau khi phân cụm;
   - Silhouette Score 0,6543;
   - kết quả cụm 3, 50, 27 và 39 món.
7. Bổ sung kết quả WCSS, ý nghĩa biểu đồ và lưu ý rằng biểu đồ giá-calories chỉ là hình chiếu hai chiều.
8. Sửa phần phân tích quan hệ món và công thức điểm thành:

   S(i,j) = 0,45J(i,j) + 0,25C(i,j) + 0,20P(i,j) + 0,10K(i,j)

   Chỉ giữ quan hệ có điểm từ 0,50 và tối đa tám quan hệ cho mỗi món. Dữ liệu hiện tại có 892 cặp quan hệ.
9. Không gọi điểm gợi ý là độ chính xác, xác suất hay độ tin cậy.
10. Phân biệt rõ gợi ý tương đồng tại trang chi tiết với gợi ý phối món theo giỏ hàng.
11. Giữ phần lọc theo thời gian nhưng mô tả đây chỉ là yếu tố điều chỉnh thứ tự ưu tiên.
12. Xóa mọi dòng "Gợi ý chèn hình" và các dòng giữ chỗ dạng `[Hình ...]`. Nếu chưa có ảnh tương ứng thì để một dòng chú thích rõ ràng bằng văn bản màu nổi bật để tôi chèn ảnh sau, không giả tạo hình.
13. Bổ sung các vị trí đề xuất chèn biểu đồ thật lấy từ dashboard:
    - mức giảm WCSS;
    - hình chiếu cụm theo giá và calories;
    - số lượng món theo cụm;
    - phân bố điểm tương đồng nếu cần.
14. Không tự tạo số liệu, nguồn tham khảo, thuật toán hoặc chức năng chưa có trong tệp yêu cầu.
15. Không sử dụng từ "pipeline"; thay bằng "quy trình xử lý dữ liệu".
16. Cập nhật mục lục và kiểm tra công thức, dấu tiếng Việt, giãn chữ, ngắt trang, chú thích hình.

Trước khi trả tệp:

- Kiểm tra toàn bộ tài liệu không còn tên đề tài cũ.
- Kiểm tra không còn nội dung nói vai trò món được dùng làm nhãn đầu vào để ép K-Means.
- Kiểm tra các số liệu 119 món, 892 quan hệ, Silhouette 0,6543 và phân bố 3-50-27-39 thống nhất ở mọi chương.
- Kiểm tra không còn dòng giữ chỗ chưa xử lý.
- Kiểm tra tệp Word mở được, không lỗi font, không mất công thức và không vỡ bố cục.

Ngoài tệp Word đã sửa, hãy gửi kèm một danh sách ngắn những đoạn đã thay đổi và những vị trí vẫn cần tôi tự chèn ảnh chụp từ ứng dụng.
