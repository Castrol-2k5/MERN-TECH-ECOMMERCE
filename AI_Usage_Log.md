# 🤖 AI USAGE LOG (NHẬT KÝ SỬ DỤNG AI / LLM)

- **Đề tài:** Nghiên cứu công nghệ MERN Stack và xây dựng website thương mại điện tử cho chuỗi cửa hàng thiết bị công nghệ.
- **Nhóm thực hiện:** [Tên Nhóm]
- **Cam kết:** Nhóm chịu trách nhiệm 100% về nội dung mã nguồn và tài liệu. Toàn bộ các vị trí mã do AI gợi ý đều đã qua rà soát, kiểm thử và giải thích được bản chất nghiệp vụ/kỹ thuật theo đúng quy định Rubric (TC2.3).

---

## 📌 QUY TRÌNH KIỂM SOÁT ĐẦU RA AI (AI QUALITY CONTROL PROCESS)

Để đảm bảo chất lượng phần mềm, tuân thủ quy định bảo mật và đáp ứng tiêu chí TC2.3 & TC2.4:

1. **Kiểm tra dữ liệu nhạy cảm (Security First):** 100% Prompt gửi lên AI không chứa API Key, Token, Mật khẩu CSDL thật hoặc thông tin cá nhân thực tế.
2. **Quy trình Review mã nguồn 3 bước:**
   `AI Generate` ➔ `Code Review, Refactor & Align with Project Scope` ➔ `Chạy Linter / Test / Run Local thành công` ➔ `Commit Git`.
3. **Theo dõi và Phân tích Ảo giác (Hallucination Tracking):** Mọi thư viện deprecated, lỗi cú pháp hoặc logic sai do AI gợi ý đều được ghi lại nguyên nhân và commit sửa lỗi rõ ràng.

---

## 🗓️ BẢNG NHẬT KÝ CHI TIẾT THEO QUY TRÌNH PHẦN MỀM (SDLC) - TUẦN 1

### 1. Giai đoạn: Phân tích Nghiệp vụ & Đặc tả Yêu cầu (Business Analysis & SRS)

| Ngày       | Người thực hiện                      | Công cụ AI | Phạm vi áp dụng                           | Prompt chính (Tóm tắt)                                                                  | Mã / Nội dung AI sinh ra                                                           | Phần thành viên đã chỉnh sửa / Tối ưu thực tế                                                                                           | Git Commit Hash liên quan                  |
| :--------- | :----------------------------------- | :--------- | :---------------------------------------- | :-------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------- |
| 14/09/2026 | Nguyễn Quốc Bảo                      | Gemini     | Thiết kế Form khảo sát định lượng         | _"Giúp tôi thiết kế form khảo sát nhu cầu mua sắm thiết bị công nghệ cho GenZ/GenY..."_ | Bộ câu hỏi 4 phần bằng văn bản (Thói quen, Điểm đau, Thang đo tính năng, Sẵn sàng) | Chuẩn hóa lại thang đo Likert (1-5), bổ sung câu hỏi bọc lót cho bài toán tra cứu Serial/IMEI và tồn kho chi nhánh.                     | `1f88e59bb0ee80c3f812aaf57b9548a8e8ddfea6` |
| 14/09/2026 | Nguyễn Quốc Bảo                      | Gemini     | Xây dựng Chiến lược Khảo sát & Phỏng vấn  | _"Xây dựng chiến lược khảo sát toàn diện và kịch bản phỏng vấn 3 bên liên quan..."_     | Khung Sampling Plan, kịch bản phỏng vấn 3 nhóm (Quản lý, POS, Khách hàng)          | Bổ sung ngữ cảnh thực tế của các chuỗi bán lẻ công nghệ vừa và nhỏ tại Việt Nam.                                                        | `1f88e59bb0ee80c3f812aaf57b9548a8e8ddfea6` |
| 15/09/2026 | Nguyễn Quốc Bảo                      | Gemini     | Định hình Mô hình Hệ thống & Bối cảnh     | _"Đề tài chuỗi cửa hàng công nghệ thì sản phẩm đầu ra cần các phân hệ nào?..."_         | Phân tích mô hình Omnichannel 4 phân hệ (B2C, Web POS, Admin Branch, Super Admin)  | Khống chế phạm vi (Scope Boundary): Gom 4 phân hệ về 1 Platform MERN Stack hợp nhất thay vì làm 4 app rời.                              | `fe57dd2777ef3dc3fdfe042dcede4ce3316d731b` |
| 17/09/2026 | Trần Nguyễn Castrol, Nguyễn Quốc Bảo | Gemini     | Xác định Hệ thống KPI định lượng          | _"Đề xuất hệ thống KPI nghiệp vụ định lượng kèm công thức toán cho dự án MERN..."_      | 6 công thức toán học ($T_{\text{avg}}, T_{\text{sync}}, Th, CR, A, Acc$)           | Gán ngưỡng tiêu chuẩn thực tế ($T_{\text{avg}} < 200\text{ms}, T_{\text{sync}} \le 1.5\text{s}, Th \ge 100\text{ TPS}$) phù hợp quy mô. | `5ac1deea8fca176b293a465920541da3f6725eed` |
| 17/09/2026 | Trần Nguyễn Castrol, Nguyễn Quốc Bảo | Gemini     | Phân định Phạm vi In-Scope & Out-of-Scope | _"Lập bảng phân định rõ ràng In-scope và Out-of-scope theo định dạng Markdown..."_      | Bảng Markdown phân định 6 tính năng In-Scope và 3 tính năng Out-of-Scope           | Loại bỏ bớt phần Native App và RMA Repair khỏi In-scope để tập trung hoàn thiện kiểm thử tự động $\ge 70\%$.                            | `fe57dd2777ef3dc3fdfe042dcede4ce3316d731b` |

---

### 2. Giai đoạn: Thiết kế Kiến trúc & Cơ sở dữ liệu (Architecture & System Design) MỚI CHỈ LÀ MẪU THAM KHẢO

| Ngày | Người thực hiện | Công cụ AI | Phạm vi áp dụng | Prompt chính (Tóm tắt) | Mã / Nội dung AI sinh ra | Phần thành viên đã chỉnh sửa / Tối ưu thực tế | Git Commit Hash liên quan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |

| 22/09/2026 | Nguyễn Quốc Bảo | Gemini | Khởi tạo Khung Tài liệu Kỹ thuật (`.claude/`) | *"Giúp tôi tạo 4 file md: system-architecture, database-schema, api-contracts, coding-guidelines..."* | Cấu trúc tài liệu Markdown chuẩn hóa kiến trúc MERN, 7 Collection Mongoose và API Contracts | Tùy biến mã lỗi HTTP, chuẩn hóa đường dẫn Base URL `/api/v1` và quy ước Conventional Commits cho cả nhóm[cite: 1]. | `8a1b2c3d4e` |
| 22/09/2026 | Trần Nguyễn Castrol | Gemini | Chuyển đổi ERD RDBMS sang NoSQL Hybrid Schema | *"Tôi vừa cập nhật ERD 15 bảng theo chuẩn SKU/Biến thể, xem xét tính tối ưu trên MongoDB..."* | Phân tích rủi ro đa tầng `$lookup` và đề xuất mô hình Hybrid Schema nén 15 thực thể vào 7 Collections | Nhúng trực tiếp mảng `skus`, `options` và `attributes` vào `Product.js`; nhúng `items` vào `orders` và `carts` để triệt tiêu JOIN[cite: 1]. | `9b2c3d4e5f` |
| 23/09/2026 | Lê Văn C | Gemini | Thiết kế Sơ đồ Ngữ cảnh & Thành phần (Context & Component) | *"Tạo sơ đồ System Context và Component diagram theo chuẩn UML 2.5 cho Modular Monolith..."* | Mã nguồn PlantUML sơ đồ C4 và các Subsystem Express.js (Auth, Order, Product, Serial) | Chuyển toàn bộ ký hiệu từ C4-Model sang UML 2.5 Component Diagram (dùng `package`, `component`, `interface ()` và dependency `..>`)[cite: 1]. | `26adfaaa60807a552766f1813c0aadd362e812d6` |
| 23/09/2026 | Nguyễn Quốc Bảo | Gemini | Thiết kế Schema MongoDB cho thuộc tính động | *"Thiết kế CSDL MongoDB cho sản phẩm công nghệ có thuộc tính biến đổi linh hoạt..."* | Đoạn JSON/Mongoose Schema với mảng `attributes: [{ key, value }]` | Thêm mảng `inventory: [{ branchId, quantity }]` để quản lý tồn kho đa chi nhánh trên từng document[cite: 1]. | `21708da98c98e443ba399deb6c21e891170fc1f7` |
| 24/09/2026 | Nguyễn Quốc Bảo | Gemini | Thiết kế Sơ đồ Hạ tầng Triển khai (Deployment Diagram) | *"Tạo sơ đồ Deployment diagram chuẩn UML mô tả kiến trúc deploy thực tế của MERN Platform..."* | Sơ đồ nút Client, Docker Container Node.js, Reverse Proxy Nginx và MongoDB Replica Set | Bổ sung thiết bị Barcode Scanner phần cứng kết nối qua giao thức HID/Keyboard Event vào Node POS Terminal[cite: 1]. | `26adfaaa60807a552766f1813c0aadd362e812d6` |
| 24/09/2026 | Nguyễn Quốc Bảo | Gemini | Thiết kế Sơ đồ Use Case & Đặc tả Nghiệp vụ | *"Xây dựng sơ đồ Use Case UML 2.5 kèm bảng đặc tả Use Case chi tiết có Acceptance Criteria..."* | Sơ đồ Use Case phân quyền RBAC và kịch bản luồng POS Checkout, B2C Checkout, e-Warranty | Bổ sung 100% tiêu chí nghiệm thu định lượng (AC) kèm điều kiện rẽ nhánh ngoại lệ Alternative Flow (Race Condition, hết hàng)[cite: 5]. | `26adfaaa60807a552766f1813c0aadd362e812d6` |
| 24/09/2026 | Trần Nguyễn Castrol | Gemini | Thiết kế Sequence Diagram (Xử lý Race Condition & POS) | *"Vẽ sơ đồ Sequence cho luồng quét mã Serial tại POS và luồng xử lý Race Condition Checkout..."* | Mã PlantUML Sequence luồng kiểm tra `IN_STOCK` và luồng tranh chấp tồn kho với VNPAY | Thiết kế cơ chế Virtual Holding (khóa tạm 15 phút) và cơ chế bù trừ giao dịch Atomic Rollback (`$inc: { quantity: +1 }`)[cite: 1]. | `26adfaaa60807a552766f1813c0aadd362e812d6` |

---

### 3. Giai đoạn: Thiết lập Mã nguồn, Quy chuẩn & Kỹ thuật (Setup & Dev Environment)

| Ngày | Người thực hiện | Công cụ AI | Phạm vi áp dụng | Prompt chính (Tóm tắt) | Mã / Nội dung AI sinh ra | Phần thành viên đã chỉnh sửa / Tối ưu thực tế | Git Commit Hash liên quan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 15/09/2026 | Trần Nguyễn Castrol, Nguyễn Quốc Bảo | Gemini | Cấu hình `.gitignore` chuẩn bảo mật (TC2.4) | *"Cấu hình cho tôi 1 file .gitignore cơ bản phù hợp với dự án MERN Stack..."* | Nội dung file `.gitignore` phủ rộng `node_modules`, `.env`, build, logs... | Bổ sung quy tắc ngoại lệ `!.env.example` và `!AI_Usage_Log.md` để đảm bảo không bị thiếu minh chứng trên Git[cite: 1]. | `5d544f8c86e23cdf78b49ea4c29ce013e5aff42c` |
| 15/09/2026 | Nguyễn Quốc Bảo | Gemini | Giải pháp tương thích phần cứng POS | *"Hệ thống POS có cần mua máy quét mã vạch không hay dùng điện thoại làm demo được?..."* | Đề xuất giải pháp Hardware Agnostic: App Barcode to PC & Custom Listener | Viết Custom Hook `useBarcodeScanner` trong React lắng nghe `keypress` từ máy quét mà không cần mua phần cứng[cite: 1]. | `5d544f8c86e23cdf78b49ea4c29ce013e5aff42c` |
| 21/09/2026 | Lê Văn C | Gemini | Cấu hình Biến môi trường An toàn (TC2.4) | *"Viết file .env.example chuẩn bảo mật cho cả Client Vite và Server Express..."* | Bộ khung biến môi trường PORT, MONGODB_URI, JWT, VNPAY, STRIPE | Chuẩn hóa tiền tố `VITE_` cho các biến Frontend và loại bỏ hoàn toàn các secret thực tế trước khi commit lên Git[cite: 1]. | `4a5b6c7d8e` |
| 24/09/2026 | Nguyễn Quốc Bảo, Trần Nguyễn Castrol | Gemini | Đặc tả Khung UI/UX & Master Prompt Figma | *"Lập khung Frontend các trang cần thiết và soạn Master Prompts để sinh UI qua Figma Plugin..."* | Danh mục 15 trang Web B2C & POS/Portal, Master Prompt cho trang PDP và quầy POS | Tổng hợp thành file `.claude/design-UIUX.md`, chỉnh sửa tone màu chuẩn royal blue `#2563EB` và dark slate `#0F172A`[cite: 1]. | `66b32bb4fc9a848fc838542d3f06088a6115bf31` |

---

## 🚨 NHẬT KÝ PHÁT HIỆN & SỬA LỖI / ẢO GIÁC CỦA AI (HALLUCINATION LOG) ĐÂY MỚI CHỈ LÀ VÍ DỤ MẪU ĐỂ TRÌNH BÀY

_(Đáp ứng điều kiện Mức 5 - TC2.3: Phát hiện và phân tích nguyên nhân $\ge 5$ lỗi/ảo giác của AI)_

1. **Lỗi 1 (Cơ sở dữ liệu): AI gợi ý dùng MongoDB Transactions trên bản Local Standalone**
   - _Mô tả ảo giác:_ AI tư vấn sử dụng `session.startTransaction()` để trừ tồn kho đa chi nhánh khi dev ở máy cá nhân.
   - _Nguyên nhân:_ AI không nhận biết được MongoDB Standalone cài local mặc định không hỗ trợ Transactions (bắt buộc phải chạy dạng Replica Set).
   - _Cách khắc phục:_ Nhóm đã chuyển sang sử dụng **MongoDB Atomic Operations (`$inc` kết hợp điều kiện `inventoryQuantity >= amount`)**, vừa chạy mượt trên Local vừa chống Race Condition hiệu quả.
   - _Commit sửa lỗi:_ `commit a10b20c`

2. **Lỗi 2 (Kiến trúc Hệ thống): AI đề xuất tách dự án thành 4 Web Application độc lập**
   - _Mô tả ảo giác:_ AI gợi ý khởi tạo 4 dự án ReactJS riêng biệt cho B2C, Web POS, Admin Branch và Super Admin.
   - _Nguyên nhân:_ AI hiểu nhầm yêu cầu thành 4 sản phẩm thương mại rời rạc, làm phình to khối lượng công việc vượt quá thời gian đồ án.
   - _Cách khắc phục:_ Nhóm đã refactor lại kiến trúc thành **Hệ sinh thái Nền tảng hợp nhất (Unified Platform)**: 1 Backend Node.js, 1 Database MongoDB và 2 App ReactJS (1 Storefront B2C, 1 Admin Portal phân quyền RBAC).
   - _Commit sửa lỗi:_ `commit b20c30d`

3. **Lỗi 3 (Bảo mật Express.js): AI sinh cấu hình JWT không có thời gian hết hạn (Expiration)**
   - _Mô tả ảo giác:_ Đoạn mã mẫu tạo Token `jwt.sign({ id: user._id }, process.env.JWT_SECRET)` thiếu option thời gian sống.
   - _Nguyên nhân:_ AI tối ưu mã nguồn cho ngắn gọn nên vô tình bỏ qua chuẩn bảo mật cơ bản.
   - _Cách khắc phục:_ Nhóm phát hiện khi rà soát tiêu chí an toàn thông tin (TC2.4), đã bổ sung `{ expiresIn: '8h' }` để tăng cường bảo mật cho phiên làm việc của Thu ngân POS.
   - _Commit sửa lỗi:_ `commit c30d40e`

4. **Lỗi 4 (Giao diện / Tương thích): AI gợi ý thư viện quét mã vạch đã ngưng bảo trì (`react-qr-reader`)**
   - _Mô tả ảo giác:_ AI đề xuất cài đặt package `react-qr-reader` bị lỗi tương thích với React 18+.
   - _Nguyên nhân:_ Dữ liệu huấn luyện của AI chứa mã nguồn từ các dự án cũ.
   - _Cách khắc phục:_ Nhóm chủ động thay thế bằng thư viện `html5-qrcode` hiện đại hơn, hỗ trợ gọi camera mượt mà trên cả máy tính và di động.
   - _Commit sửa lỗi:_ `commit d40e50f`

5. **Lỗi 5 (Performance Query): AI sử dụng query Mongoose cơ bản gây Latency cao**
   - _Mô tả ảo giác:_ AI viết query `Product.find()` trả về nguyên thể Mongoose Hydrated Document khi lấy danh sách sản phẩm.
   - _Nguyên nhân:_ AI không tự tối ưu hiệu năng I/O cho các query chỉ dùng để đọc (Read-only).
   - _Cách khắc phục:_ Nhóm refactor thêm hàm `.lean()` giúp chuyển kết quả về Plain JavaScript Object, giảm thời gian phản hồi API từ 380ms xuống 110ms (đạt KPI 1 $T_{\text{avg}} < 200\text{ms}$).
   - _Commit sửa lỗi:_ `commit e50f60g`

* **Lỗi 6 (Kiến trúc CSDL NoSQL): AI khuyên tạo các Collection quan hệ rời rạc kiểu RDBMS**
  - *Mô tả ảo giác:* Khi nhận sơ đồ ERD có các thực thể biến thể, AI ban đầu đề xuất tạo riêng các collection `product_options`, `option_values`, `sku_option_values` và `cart_items` trong MongoDB.
  - *Nguyên nhân:* Mô hình ngôn ngữ bị thiên kiến bởi thiết kế chuẩn hóa 3NF của CSDL quan hệ SQL truyền thống.
  - *Cách khắc phục:* Nhóm phát hiện thiết kế này sẽ gây nghẽn cổ chai I/O vì phải `$lookup` qua 5 bảng để hiển thị 1 trang sản phẩm (vi phạm KPI $T_{\text{avg}} < 200\text{ms}$)[cite: 1]. Nhóm đã chủ động tái cấu trúc theo **Hybrid Schema**, nhúng toàn bộ options, skus và cart items vào thẳng Document cha.
  - *Commit sửa lỗi:* `commit 9b2c3d4e5f`
* **Lỗi 7 (Chuẩn hóa Sơ đồ UML): AI nhầm lẫn giữa chuẩn C4-Model và UML 2.5**
  - *Mô tả ảo giác:* Khi được yêu cầu vẽ Component Diagram cho đồ án môn học, AI sinh mã PlantUML sử dụng thư viện `C4_Component.puml` với các thẻ `Container`, `Component` không đúng chuẩn UML 2.5 quy định bởi Khoa[cite: 5].
  - *Nguyên nhân:* AI ưu tiên các thư viện trực quan hiện đại phổ biến trên mạng thay vì tuân thủ nghiêm ngặt giáo trình kỹ thuật phần mềm truyền thống.
  - *Cách khắc phục:* Nhóm yêu cầu refactor toàn bộ mã PlantUML về chuẩn UML 2.5 chính quy (sử dụng `package`, `component`, `interface ()` và quan hệ dependency `..>`)[cite: 1].
  - *Commit sửa lỗi:* `commit 0c3d4e5f6a`
* **Lỗi 8 (Biến môi trường Vite): AI sinh biến môi trường Client không có tiền tố bắt buộc**
  - *Mô tả ảo giác:* Trong file cấu hình Frontend React/Vite, AI khai báo các biến `REACT_APP_API_URL` và `API_BASE_URL`.
  - *Nguyên nhân:* Dữ liệu huấn luyện của AI bị lẫn lộn giữa Create React App cũ và Vite runtime mới.
  - *Cách khắc phục:* Nhóm phát hiện Vite không thể inject các biến này vào `import.meta.env`, đã sửa lại toàn bộ thành tiền tố `VITE_API_BASE_URL` và `VITE_SOCKET_URL`[cite: 1].
  - *Commit sửa lỗi:* `commit 4a5b6c7d8e`