# 🤖 AI USAGE LOG (NHẬT KÝ SỬ DỤNG AI / LLM)

- **Đề tài:** Nghiên cứu công nghệ MERN Stack và xây dựng website thương mại điện tử cho chuỗi cửa hàng thiết bị công nghệ.
- **Nhóm thực hiện:** [Tên Nhóm]
- **Cam kết:** Nhóm chịu trách nhiệm 100% về nội dung mã nguồn và tài liệu. Toàn bộ các vị trí mã do AI gợi ý đều đã qua rà soát, kiểm thử và giải thích được bản chất nghiệp vụ/kỹ thuật theo quy định.

---

## 📌 QUY TRÌNH KIỂM SOÁT ĐẦU RA AI (AI QUALITY CONTROL PROCESS)

Để đảm bảo chất lượng phần mềm và không lộ bí mật dữ liệu (TC2.3 & TC2.4):

1. **Kiểm tra dữ liệu nhạy cảm:** 100% Prompt không chứa API Key, Token, Mật khẩu CSDL thật hoặc dữ liệu cá nhân thực tế.
2. **Quy trình Review mã nguồn:** Mã do AI sinh ra bắt buộc qua 3 bước:
   `AI Generate` ➔ `Code Review & Refactor` ➔ `Chạy Unit Test / Integration Test thành công` ➔ `Commit Git`.
3. **Phân tích ảo giác (Hallucination Tracking):** Mọi thư viện không tồn tại hoặc logic sai do AI tạo ra đều phải được ghi nhận lý do sửa lỗi.

---

## 🗓️ BẢNG NHẬT KÝ CHI TIẾT THEO QUY TRÌNH PHẦN MỀM (SDLC)

### 1. Giai đoạn: Phân tích Nghiệp vụ & Đặc tả Yêu cầu (Business Analysis & SRS)

| Ngày       | Người thực hiện | Công cụ AI | Phạm vi áp dụng         | Prompt chính (Tóm tắt)                                                               | Mã/Nội dung AI sinh                                             | Phần thành viên đã chỉnh sửa/Tối ưu                                                                              | Git Commit Hash liên quan |
| :--------- | :-------------- | :--------- | :---------------------- | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------- | :------------------------ |
| 14/09/2026 | Nguyễn Văn A    | Gemini     | Thiết kế Form khảo sát  | _"Tạo 11 câu hỏi khảo sát thói quen mua sắm đồ công nghệ cho GenZ/GenY..."_          | Bộ câu hỏi 4 phần bằng văn bản                                  | Chuẩn hóa lại thang đo Likert (1-5), bổ sung câu hỏi bọc lót cho bài toán Serial/IMEI.                           | `a1b2c3d`                 |
| 17/09/2026 | Trần Thị B      | ChatGPT    | Xác định KPI định lượng | _"Đề xuất 6 chỉ số KPI định lượng kỹ thuật kèm công thức toán cho Web TMĐT MERN..."_ | 6 công thức toán học ($T_{\text{avg}}, T_{\text{sync}}, Th...$) | Gắn ngưỡng tham chiếu thực tế ($T_{\text{avg}} < 200\text{ms}, Th \ge 100\text{ TPS}$) phù hợp quy mô tiểu luận. | `e4f5g6h`                 |

---

### 2. Giai đoạn: Thiết kế Kiến trúc & Cơ sở dữ liệu (Architecture & DB Design)

| Ngày       | Người thực hiện | Công cụ AI | Phạm vi áp dụng | Prompt chính (Tóm tắt)                                                                         | Mã/Nội dung AI sinh                                        | Phần thành viên đã chỉnh sửa/Tối ưu                                                         | Git Commit Hash liên quan |
| :--------- | :-------------- | :--------- | :-------------- | :--------------------------------------------------------------------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------------------------------------------ | :------------------------ |
| 18/09/2026 | Nguyễn Văn A    | Claude 3.5 | Schema MongoDB  | _"Thiết kế Schema Mongoose cho Product lưu thuộc tính động (Dynamic Schema) & Serial/IMEI..."_ | Đoạn mã Schema Mongoose với mảng `attributes` và `serials` | Thêm trường `branchId` bắt buộc vào Schema Serial để phục vụ bài toán tồn kho đa chi nhánh. | `i7j8k9l`                 |

---

### 3. Giai đoạn: Lập trình Backend (Node.js / Express.js API)

| Ngày       | Người thực hiện | Công cụ AI     | Phạm vi áp dụng                       | Prompt chính (Tóm tắt)                                                            | Mã/Nội dung AI sinh                                       | Phần thành viên đã chỉnh sửa/Tối ưu                                              | Git Commit Hash liên quan |
| :--------- | :-------------- | :------------- | :------------------------------------ | :-------------------------------------------------------------------------------- | :-------------------------------------------------------- | :------------------------------------------------------------------------------- | :------------------------ |
| 22/09/2026 | Lê Văn C        | GitHub Copilot | Xử lý Tranh chấp Kho (Race Condition) | _"Viết hàm checkout đơn hàng POS đảm bảo Atomic update tồn kho trong MongoDB..."_ | Dùng `findOneAndUpdate` với điều kiện `stock >= quantity` | Bổ sung Middleware kiểm tra token JWT phân quyền `STAFF` và ghi log transaction. | `m1n2o3p`                 |

---

### 4. Giai đoạn: Lập trình Frontend (React.js UI/UX)

| Ngày       | Người thực hiện | Công cụ AI | Phạm vi áp dụng           | Prompt chính (Tóm tắt)                                                      | Mã/Nội dung AI sinh                                               | Prompt & Code xử lý tương thích Barcode Scanner                                             | Git Commit Hash liên quan |
| :--------- | :-------------- | :--------- | :------------------------ | :-------------------------------------------------------------------------- | :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------ | :------------------------ |
| 25/09/2026 | Trần Thị B      | ChatGPT    | Web POS Keyboard Listener | _"Viết React Custom Hook lắng nghe sự kiện gõ phím từ máy quét mã vạch..."_ | Hook `useBarcodeScanner.js` sử dụng `addEventListener('keydown')` | Thêm cơ chế `debounce` 50ms để loại bỏ nhiễu khi thu ngân gõ phím thủ công thay vì quét mã. | `q4r5s6t`                 |

---

### 5. Giai đoạn: Kiểm thử & CI/CD (Testing & DevOps)

| Ngày       | Người thực hiện | Công cụ AI | Phạm vi áp dụng | Prompt chính (Tóm tắt)                                                 | Mã/Nội dung AI sinh                             | Phần thành viên bổ sung test case âm (Negative Cases)                                                 | Git Commit Hash liên quan |
| :--------- | :-------------- | :--------- | :-------------- | :--------------------------------------------------------------------- | :---------------------------------------------- | :---------------------------------------------------------------------------------------------------- | :------------------------ |
| 30/09/2026 | Nguyễn Văn A    | Gemini     | Unit Test Jest  | _"Viết test case Jest cho API tra cứu bảo hành qua mã Serial/IMEI..."_ | 3 test cases cho luồng thuận lợi (Success Path) | Bổ sung thêm 4 test cases âm: Mã Serial không tồn tại, Serial đã hết hạn, Serial đang ở kho chưa bán. | `u7v8w9x`                 |

---

## 🚨 NHẬT KÝ PHÁT HIỆN & SỬA LỖI / ẢO GIÁC CỦA AI (HALLUCINATION LOG)

_(Yêu cầu bắt buộc của Mức 5 - TC2.3: Nêu được ≥ 5 lỗi/ảo giác của AI đã tự phát hiện và sửa kèm phân tích nguyên nhân)_

1. **Lỗi 1 (Cơ sở dữ liệu): AI sử dụng sai cú pháp MongoDB Transaction**
   - _Mô tả ảo giác:_ AI gợi ý dùng `session.startTransaction()` trên bản MongoDB Standalone chạy ở máy Local.
   - _Nguyên nhân:_ AI không nhận biết được MongoDB Standalone không hỗ trợ ACID Transactions (bắt buộc phải là Replica Set).
   - _Cách khắc phục:_ Nhóm đã chuyển sang sử dụng **Atomic Operation (`$inc` có điều kiện)** giúp ứng dụng chạy mượt mà trên cả môi trường Local lẫn Cloud.
   - _Commit sửa lỗi:_ `commit 8a9b1c2`

2. **Lỗi 2 (Thư viện Frontend): AI gợi ý thư viện quét mã vạch bị vỡ tương thích (Deprecated)**
   - _Mô tả ảo giác:_ AI đề xuất cài đặt thư viện `react-qr-reader` đã ngừng bảo trì 4 năm.
   - _Nguyên nhân:_ Dữ liệu huấn luyện của AI chứa mã nguồn cũ.
   - _Cách khắc phục:_ Nhóm tự nghiên cứu và thay thế bằng thư viện `html5-qrcode` hiện đại, hoạt động mượt trên cả camera điện thoại và máy tính.
   - _Commit sửa lỗi:_ `commit 3d4e5f6`

3. **Lỗi 3 (Bảo mật Express.js): AI sinh mã JWT không có thời hạn hết hạn (Expiration Time)**
   - _Mô tả ảo giác:_ Hàm `jwt.sign({ id: user._id }, process.env.JWT_SECRET)` thiếu option `{ expiresIn: '1d' }`.
   - _Nguyên nhân:_ AI tối ưu hóa mã cho ngắn gọn nên bỏ qua cấu hình bảo mật.
   - _Cách khắc phục:_ Nhóm phát hiện khi kiểm tra an toàn thông tin, đã bổ sung `expiresIn: '8h'` để tăng cường bảo mật cho phân hệ Web POS.
   - _Commit sửa lỗi:_ `commit 7g8h9i0`

4. **Lỗi 4 (Hiệu năng Query): AI sử dụng `.find()` nguyên bản thay vì `.lean()` trong Mongoose**
   - _Mô tả ảo giác:_ API lấy danh sách 1000 sản phẩm trả về Mongoose Document đầy đủ gây độ trễ API lên tới 650ms (vi phạm KPI 1 < 200ms).
   - _Nguyên nhân:_ AI mặc định viết query Mongoose cơ bản.
   - _Cách khắc phục:_ Nhóm refactor thêm `.lean()` để chỉ lấy Plain JavaScript Objects, giảm Latency xuống còn 120ms.
   - _Commit sửa lỗi:_ `commit 1j2k3l4`

5. **Lỗi 5 (Linter React): AI sinh Component vi phạm quy tắc `react-hooks/exhaustive-deps`**
   - _Mô tả ảo giác:_ AI viết `useEffect` thiếu dependency `branchId` gây ra lỗi cảnh báo ESLint khi chạy phân tích tĩnh.
   - _Nguyên nhân:_ AI không tự chạy linter tĩnh trước khi xuất kết quả.
   - _Cách khắc phục:_ Nhóm dùng ESLint phát hiện, bổ sung dependency và bọc callback bằng `useCallback`.
   - _Commit sửa lỗi:_ `commit 5m6n7o8`
