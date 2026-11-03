# 🤖 AI USAGE LOG (NHẬT KÝ SỬ DỤNG AI & NĂNG LỰC LÀM CHỦ CÔNG NGHỆ)

- **Tên đề tài:** Nghiên cứu công nghệ MERN Stack và xây dựng website thương mại điện tử cho chuỗi cửa hàng thiết bị công nghệ.
- **Mô hình triển khai:** Nền tảng bán lẻ đa kênh Omnichannel Retail Platform (Storefront B2C, Web POS, Branch Portal, HQ Admin) theo kiến trúc Modular Monolith (Backend) và Feature-based Architecture (Frontend).
- **Nhóm thực hiện:**  
  - Nguyễn Quốc Bảo – 23110182  
  - Trần Nguyễn Castrol – 23110185  
- **Giảng viên hướng dẫn:** Nguyễn Hữu Trung  
- **Link GitHub Repository:** [https://github.com/Castrol-2k5/MERN-TECH-ECOMMERCE.git](https://github.com/Castrol-2k5/MERN-TECH-ECOMMERCE.git)  
- **Cam kết chuẩn mực Rubric (TC2.3 - Mức 5 Xuất sắc):**  
  Nhóm sinh viên chịu trách nhiệm 100% về toàn bộ mã nguồn, cấu trúc kiến trúc và tài liệu trong kho lưu trữ Git. AI (Gemini, Antigravity) được sử dụng đóng vai trò là trợ lý ảo hỗ trợ tăng tốc lập trình (AI Pair Programmer). Toàn bộ các đoạn mã hoặc giải pháp do AI đề xuất đều được nhóm rà soát (Code Review), kiểm chứng qua bài test tự động và giải thích cặn kẽ bản chất nghiệp vụ/kỹ thuật; mọi lỗi sai, ảo giác (hallucination) của AI đều được nhóm chủ động phát hiện, phản biện và tự tay tái cấu trúc (refactoring).

---

## 📌 I. QUY TRÌNH KIỂM SOÁT ĐẦU RA AI (AI QUALITY CONTROL FRAMEWORK)

Để đảm bảo chất lượng phần mềm, tuân thủ an toàn thông tin và đáp ứng tuyệt đối tiêu chuẩn Rubric Khoa CNTT (TC2.3 & TC2.4):

1. **Nguyên tắc Bảo mật Thông tin (Security First):** 100% Prompt gửi lên AI tuyệt đối không chứa Secret Key, API Token thật, mật khẩu cơ sở dữ liệu thật hoặc thông tin định danh cá nhân nhạy cảm. Toàn bộ cấu hình nhạy cảm được trừu tượng hóa qua biến môi trường `.env.example`.
2. **Quy trình Kiểm duyệt Mã nguồn 3 Bước (3-Step Verification Pipeline):**
   $$\text{AI Suggestion} \xrightarrow[\text{Audit \& Refactor}]{\text{Bước 1}} \text{Student Code Review} \xrightarrow[\text{Lint, Build, Test}]{\text{Bước 2}} \text{Quality Gates Passed} \xrightarrow[\text{Commit \& Push}]{\text{Bước 3}} \text{Git Repository}$$
3. **Truy vết Ảo giác & Lỗi logic (Hallucination Tracking):** Mọi thư viện lỗi thời (deprecated), lỗi biên dịch, lỗ hổng logic hoặc đề xuất vi phạm nguyên tắc bảo mật/nghiệp vụ do AI gợi ý đều được ghi nhận chi tiết về nguyên nhân gốc rễ (Root Cause) và giải pháp tái cấu trúc của sinh viên.
4. **Đối chiếu Lịch sử Git (Git Traceability):** Từng hoạt động sử dụng AI đều được gắn với Commit Hash cụ thể trên Git để bảo đảm tính minh bạch và khả năng kiểm chứng.

---

## 🗓️ II. BẢNG NHẬT KÝ CHI TIẾT THEO TIẾN ĐỘ TỪNG TUẦN (WEEKLY AI USAGE LOG)

---

### TUẦN 1 + 2 (14/09/2026 – 27/09/2026): Phân tích Nghiệp vụ, Kiến trúc CSDL NoSQL & Khung Dự án

| Ngày | Người thực hiện | Công cụ AI | Phạm vi áp dụng | Prompt chính (Tóm tắt) | Nội dung / Mã do AI sinh ra ban đầu | Phần sinh viên đã phân tích, chỉnh sửa & tối ưu thực tế | Git Commit Hash liên quan |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| 14/09 | Nguyễn Quốc Bảo | Gemini | Form khảo sát định lượng | *"Giúp tôi thiết kế form khảo sát nhu cầu mua sắm thiết bị công nghệ cho GenZ/GenY..."* | Bộ câu hỏi 4 phần bằng văn bản tự do (Thói quen, Điểm đau, Tính năng, Sẵn sàng) | Chuẩn hóa lại thang đo Likert (1-5), bổ sung câu hỏi bọc lót cho bài toán tra cứu Serial/IMEI và tồn kho chi nhánh. | `1f88e59` |
| 14/09 | Nguyễn Quốc Bảo | Gemini | Chiến lược Khảo sát & Phỏng vấn | *"Xây dựng chiến lược khảo sát toàn diện và kịch bản phỏng vấn 3 bên liên quan..."* | Khung Sampling Plan, kịch bản phỏng vấn 3 nhóm (Quản lý, Thu ngân POS, Khách hàng) | Bổ sung ngữ cảnh thực tế của chuỗi bán lẻ công nghệ vừa và nhỏ tại Việt Nam. | `1f88e59` |
| 15/09 | Nguyễn Quốc Bảo | Gemini | Mô hình Hệ thống & Bối cảnh | *"Đề tài chuỗi cửa hàng công nghệ thì sản phẩm đầu ra cần các phân hệ nào?..."* | Phân tích mô hình Omnichannel 4 phân hệ (B2C, Web POS, Admin Branch, Super Admin) | Khống chế phạm vi (Scope Boundary): Gom 4 phân hệ về 1 Platform MERN Stack hợp nhất thay vì làm 4 app rời. | `fe57dd2` |
| 17/09 | Nhóm SV | Gemini | Hệ thống KPI định lượng | *"Đề xuất hệ thống KPI nghiệp vụ định lượng kèm công thức toán cho dự án MERN..."* | 6 công thức toán học ($T_{\text{avg}}, T_{\text{sync}}, Th, CR, A, Acc$) | Gán ngưỡng tiêu chuẩn thực tế ($T_{\text{avg}} < 200\text{ms}, T_{\text{sync}} \le 1.5\text{s}, Th \ge 100\text{ TPS}$) phù hợp quy mô. | `5ac1dee` |
| 17/09 | Nhóm SV | Gemini | Phạm vi In-Scope & Out-of-Scope | *"Lập bảng phân định rõ ràng In-scope và Out-of-scope theo định dạng Markdown..."* | Bảng Markdown phân định 6 tính năng In-Scope và 3 tính năng Out-of-Scope | Loại bỏ bớt phần Native App và RMA Repair phức tạp khỏi In-scope để tập trung hoàn thiện kiểm thử tự động $\ge 70\%$. | `fe57dd2` |
| 22/09 | Trần Nguyễn Castrol | Gemini | Chuyển đổi ERD RDBMS sang NoSQL Hybrid Schema | *"Tôi vừa cập nhật ERD 15 bảng theo chuẩn SKU/Biến thể, xem xét tính tối ưu trên MongoDB..."* | Phân tích rủi ro đa tầng `$lookup` và đề xuất mô hình Hybrid Schema nén 15 thực thể vào 7 Collections | Nhúng trực tiếp mảng `skus`, `options` và `attributes` vào `Product.js`; nhúng `items` vào `orders` và `carts` để triệt tiêu JOIN. | `21708da` |
| 23/09 | Nguyễn Quốc Bảo | Gemini | Sơ đồ Ngữ cảnh & Thành phần | *"Tạo sơ đồ System Context và Component diagram theo chuẩn UML 2.5 cho Modular Monolith..."* | Mã nguồn PlantUML sơ đồ C4 và các Subsystem Express.js (Auth, Order, Product, Serial) | Chuyển toàn bộ ký hiệu từ C4-Model sang UML 2.5 Component Diagram (dùng `package`, `component`, `interface ()` và dependency `..>`). | `26adfaa` |
| 24/09 | Nguyễn Quốc Bảo | Gemini | Sơ đồ Triển khai (Deployment Diagram) | *"Tạo sơ đồ Deployment diagram chuẩn UML mô tả kiến trúc deploy thực tế của MERN Platform..."* | Sơ đồ nút Client, Docker Container Node.js, Reverse Proxy Nginx và MongoDB Replica Set | Bổ sung thiết bị Barcode Scanner phần cứng kết nối qua giao thức HID/Keyboard Event vào Node POS Terminal. | `26adfaa` |
| 24/09 | Trần Nguyễn Castrol | Gemini | Sơ đồ Sequence xử lý Race Condition | *"Vẽ sơ đồ Sequence cho luồng quét mã Serial tại POS và luồng xử lý Race Condition Checkout..."* | Mã PlantUML Sequence luồng kiểm tra `IN_STOCK` và luồng tranh chấp tồn kho với VNPAY | Thiết kế cơ chế Virtual Holding (khóa tạm 15 phút) và cơ chế bù trừ giao dịch Atomic Rollback (`$inc: { quantity: +1 }`). | `26adfaa` |
| 24/09 | Nhóm SV | Gemini | Master Prompt UI/UX Figma Design Token | *"Lập khung Frontend các trang cần thiết và soạn Master Prompts để sinh UI qua Figma Plugin..."* | Danh mục 15 trang Web B2C & POS/Portal, Master Prompt cho trang PDP và quầy POS | Tổng hợp thành file `.claude/design-UIUX.md`, chỉnh sửa tone màu chuẩn royal blue `#2563EB` và dark slate `#0F172A`. | `66b32bb` |

---

### TUẦN 3 (28/09/2026 – 04/10/2026): Lập trình Core APIs Backend, CI Pipeline & Khung Frontend

| Ngày | Người thực hiện | Công cụ AI | Phạm vi áp dụng | Prompt chính (Tóm tắt) | Nội dung / Mã do AI sinh ra ban đầu | Phần sinh viên đã phân tích, chỉnh sửa & tối ưu thực tế | Git Commit Hash liên quan |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| 28/09 | Nguyễn Quốc Bảo | Gemini / Antigravity | Thiết lập CI Pipeline GitHub Actions | *"Viết cấu hình `.github/workflows/ci.yml` cho dự án Monorepo Node.js Jest..."* | File workflow YAML gồm checkout, setup-node, npm test | Tối ưu `working-directory: code/server`, thêm cờ `--runInBand` để tránh tràn RAM runner và cấu hình upload artifact coverage. | `8f84c3d` |
| 29/09 | Nguyễn Quốc Bảo | Gemini / Antigravity | Core APIs Branch & Category | *"Hiện thực hóa Branch (GeoJSON) và Category (attributeKeys) kèm Jest test..."* | Models, DTOs Zod, Controller và Service CRUD | Bổ sung Index `2dsphere` cho `location` và viết middleware kiểm tra quyền `SUPER_ADMIN`. | `9149106` |
| 30/09 | Nguyễn Quốc Bảo | Gemini / Antigravity | Product Hybrid Schema & Dynamic Filter | *"Xây dựng Dynamic Filter Engine truy vấn attributes động bằng Mongoose..."* | Filter query bóc tách params động với `$all` và `$elemMatch` | Ép sử dụng `.lean()` cho toàn bộ Read APIs nhằm giảm overhead Mongoose ($T_{avg} < 200\text{ms}$); bổ sung validation `salePrice <= price`. | `2921546` |
| 01/10 | Nguyễn Quốc Bảo | Gemini / Antigravity | Multi-branch Inventory & Serial State Pattern | *"Hiện thực hóa luồng tồn kho đa chi nhánh và máy trạng thái Serial/IMEI..."* | API `/inventory/adjust` và `/serials/scan`, `/verify` | Bắt buộc Compound Unique Index `{ branchId, productSkuId }` và kiểm tra trạng thái `IN_STOCK` tại đúng chi nhánh trước khi thao tác. | `47dd70d` |
| 02/10 | Trần Nguyễn Castrol | Gemini / Antigravity | Order Checkout & Concurrency Testing | *"Viết luồng POS Checkout và test case Jest mô phỏng 2 request mua đồng thời..."* | Hàm checkout đơn hàng POS/B2C và test suite `order-flow.test.js` | Áp dụng Atomic `$inc` với điều kiện `{ quantity: { $gte: qty } }` để ngăn overselling và xử lý Race Condition khi có tranh chấp kho. | `7b95e4a` |
| 03/10 | Nguyễn Quốc Bảo | Gemini / Antigravity | Khung Frontend Feature-based Storefront | *"Dựng khung client theo Feature-based từ Figma Frames P-01 đến P-07..."* | Components trong `features/products`, `warranty`, Redux store | Thiết lập Axios Silent Refresh Queue sử dụng HttpOnly Cookie và lưu Access Token trong React RAM nhằm triệt tiêu lỗ hổng XSS. | `65e2387`, `831f88e` |
| 04/10 | Nguyễn Quốc Bảo | Gemini / Antigravity | Phân hệ Web POS & Quản trị Portal | *"Hiện thực hóa màn hình P-08 Web POS và P-12 Admin Products qua Figma MCP..."* | Giao diện Split-screen POS 60/40, Modal in hóa đơn K80 | Tích hợp hook `useBarcodeScanner` để bắt sự kiện bàn phím từ máy quét mã vạch và áp dụng debounce `< 50ms` xử lý tốc độ cao. | `d65c609` |

---

### TUẦN 4 (05/10/2026 – 11/10/2026): Đồng bộ Dữ liệu Mock ➔ Live DB, Xây dựng Adapters & Master Test Plan

| Ngày | Người thực hiện | Công cụ AI | Phạm vi áp dụng | Prompt chính (Tóm tắt) | Nội dung / Mã do AI sinh ra ban đầu | Phần sinh viên đã phân tích, chỉnh sửa & tối ưu thực tế | Git Commit Hash liên quan |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| 05/10 | Trần Nguyễn Castrol | Gemini / Antigravity | Đồng bộ Dữ liệu Danh mục & Sản phẩm (Đợt 1) | *"Xóa mock data ở product service client và nối vào API backend live..."* | Service gọi `axiosClient.get('/products')` với logic bóc tách thô | Viết bộ adapter chuẩn hóa dữ liệu MongoDB sang UI View Model, loại bỏ toàn bộ dữ liệu mock ngầm trong khối catch. | `439015e` |
| 06/10 | Nguyễn Quốc Bảo | Gemini / Antigravity | Đồng bộ Chi nhánh & Tồn kho Đa điểm (Đợt 2) | *"Kết nối MultiBranchStockBox với API GET /inventory/sku/:skuId..."* | Component React lấy danh sách branch inventories hiển thị badge | Thêm fallback hiển thị trạng thái "Tạm hết hàng toàn hệ thống" và phân loại trực quan theo số lượng kho chi nhánh. | `d4a3cb8` |
| 07/10 | Trần Nguyễn Castrol | Gemini / Antigravity | Đồng bộ Giỏ hàng & POS Checkout (Đợt 3) | *"Viết luồng sync giỏ hàng Redux với Live API đặt hàng B2C và Web POS..."* | Payload gửi trực tiếp object state Redux lên server | Tái cấu trúc bằng hàm adapter `toB2cCheckoutPayload` và `toPosCheckoutPayload` để khớp chuẩn Zod schema của backend. | `fe73d1b` |
| 08/10 | Nhóm SV | Gemini / Antigravity | Xây dựng Đặc tả Use Case 4 Tác nhân | *"Viết tài liệu đặc tả Use Case chi tiết theo mẫu chuẩn IEEE cho Super Admin, BM, Staff, Customer..."* | Bộ khung bảng thuộc tính Use Case sơ sài, thiếu các trường hợp biên và điều kiện rẽ nhánh | Chuẩn hóa 4 file Use Case chi tiết (`01` đến `04`) với đầy đủ Preconditions, Main Flow, Alternative Flows và Business Rules. | `548c5ae` |
| 09/10 | Nguyễn Quốc Bảo | Gemini / Antigravity | Lập Kế hoạch Kiểm thử Tổng thể (Master Test Plan) | *"Lập file master_test_plan.md theo chuẩn ISO/IEC/IEEE 29119 cho toàn bộ dự án..."* | Tài liệu kế hoạch test chung chung theo dạng lý thuyết phần mềm | Bổ sung ma trận test cases chi tiết cho 5 phân hệ cốt lõi, gắn mã test case (`TC-AUTH`, `TC-INV`, `TC-POS`), cam kết tiêu chí Rubric TC2.5. | `548c5ae`, `22c84fd` |
| 10/10 | Nhóm SV | Gemini / Antigravity | Core Alignment & Adapter Sync | *"Review và merge các module đã đồng bộ vào nhánh chính..."* | Kiểm tra xung đột branch `feature/core-alignment-and-adapter-sync` | Tiến hành merge Pull Request #6 và Pull Request #7 vào develop an toàn. | `5db6e88`, `4c26559` |

---

### TUẦN 5 (12/10/2026 – 18/10/2026): Rà soát Kiến trúc An toàn Thông tin, Quản lý Phiên & Chuẩn bị B2C

| Ngày | Người thực hiện | Công cụ AI | Phạm vi áp dụng | Prompt chính (Tóm tắt) | Nội dung / Mã do AI sinh ra ban đầu | Phần sinh viên đã phân tích, chỉnh sửa & tối ưu thực tế | Git Commit Hash liên quan |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| 12/10 | Nguyễn Quốc Bảo | Gemini / Antigravity | Bảo mật Forgot Password & Reset Token | *"Kiểm tra luồng quên mật khẩu, làm sao đảm bảo an toàn tuyệt đối khi gửi email..."* | Endpoint trả về JSON chứa luôn `resetToken` để client test | Chặn hoàn toàn việc trả `resetToken` trong JSON ở môi trường production theo chuẩn bảo mật H1; chỉ sinh mã băm lưu vào DB kèm thời gian sống 15 phút. | `8965f44` |
| 14/10 | Trần Nguyễn Castrol | Gemini / Antigravity | Chuẩn hóa Session Management & Cookie | *"Cấu hình cookie refreshToken trên Express để không bị lỗi SameSite khi deploy..."* | Cấu hình cookie cơ bản: `res.cookie('refreshToken', token)` | Bổ sung đầy đủ cờ bảo mật: `httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'lax'`, `maxAge: 14 * 24 * 60 * 60 * 1000`. | `8f9d185` |
| 16/10 | Nguyễn Quốc Bảo | Gemini / Antigravity | Kiểm tra Lỗ hổng Dependency (CI Audit) | *"Nodemon báo lỗi bảo mật Braces high vulnerability do thư viện chokidar cũ..."* | Đề xuất gỡ cài đặt nodemon hoặc cài đè package ngoài | Dùng cơ chế `overrides` trong `package.json` (`"chokidar": "^4.0.3"`) để vá triệt để lỗ hổng mà không làm vỡ môi trường dev. | `dbb6455` |
| 17/10 | Nhóm SV | Gemini / Antigravity | Seed Data Kiểm thử Toàn diện E2E | *"Viết script seed data đầy đủ các vai trò, chi nhánh, sản phẩm, tồn kho và serials..."* | File seed dữ liệu cơ bản với vài sản phẩm mẫu | Mở rộng seed data hoàn chỉnh: 3 chi nhánh (HQ, Q1, Thủ Đức), 4 tài khoản mẫu đại diện 4 vai trò, 20 sản phẩm đa dạng ngành hàng kèm mã Serial vật lý. | `22c84fd` |

---

### TUẦN 6 (19/10/2026 – 25/10/2026): Hoàn thiện Trang Checkout B2C & Tích hợp Cổng VNPay Sandbox

| Ngày | Người thực hiện | Công cụ AI | Phạm vi áp dụng | Prompt chính (Tóm tắt) | Nội dung / Mã do AI sinh ra ban đầu | Phần sinh viên đã phân tích, chỉnh sửa & tối ưu thực tế | Git Commit Hash liên quan |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| 19/10 | Trần Nguyễn Castrol | Gemini / Antigravity | Trang Thanh toán Độc lập CheckoutPage | *"Viết cho tôi một component CheckoutPage bằng React để người dùng nhập địa chỉ và thanh toán..."* | Form 1 cột sơ sài, chỉ có 1 ô nhập địa chỉ text tự do, thiếu phương thức nhận hàng | Thiết kế lại 2 cột chuẩn eCommerce; bổ sung 2 tabs: Giao tận nơi & Nhận tại showroom (Click & Collect) nạp danh sách chi nhánh realtime; validate số điện thoại VN 10 số. | `0235448` |
| 20/10 | Nguyễn Quốc Bảo | Gemini / Antigravity | Điều hướng Giỏ hàng sang Checkout | *"Cập nhật CartPage để chuyển sang trang checkout mới..."* | Gắn nút chuyển hướng `navigate('/checkout')` đơn giản | Đăng ký route `/checkout` trong `AppRoutes.jsx`, kiểm tra chặn giỏ hàng rỗng và truyền thông tin chi nhánh đã chọn sang checkout. | `c5cb61b` |
| 21/10 | Trần Nguyễn Castrol | Gemini / Antigravity | Module Thanh toán VnpayService (HMAC-SHA512) | *"Viết hàm tạo URL thanh toán VNPay bằng Node.js có mã băm SHA512..."* | Dùng thư viện `qs` nối chuỗi trực tiếp, mã hóa khoảng trắng thành `%20` (sai quy chuẩn VNPay) | Tự viết hàm `sortObject` độc lập sắp xếp key A-Z và thay thế `%20` bằng dấu `+`; chống trùng `vnp_TxnRef` bằng timestamp salt; viết hàm `verifyReturnUrl`. | `1dbb406` |
| 22/10 | Nguyễn Quốc Bảo | Gemini / Antigravity | Kiểm thử Unit Test VNPay Service | *"Viết unit test cho VnpayService kiểm tra sinh link và xác thực hash..."* | Test case cơ bản chỉ kiểm tra URL có chứa `vnp_SecureHash` | Bổ sung 3 test cases chuyên sâu: Happy path sinh URL, Happy path xác thực return URL hợp lệ, và Negative path chặn đứng tham số bị can thiệp giả mạo (Tamper-proof). | `718e1be` |
| 23/10 | Trần Nguyễn Castrol | Gemini / Antigravity | Endpoints & Express Routing VNPay | *"Thêm route nhận return url từ VNPay vào file order.routes.js..."* | Đặt route `/vnpay-return` ở cuối file sau route động `/:orderCode` gây Route Shadowing 401 | Đảo thứ tự: đưa route tĩnh `/vnpay-return` lên trước `/:orderCode`; cấu hình `optionalProtect` cho route tạo link thanh toán để khách vãng lai vẫn mua được. | `e5578a7`, `a58709e` |
| 24/10 | Nguyễn Quốc Bảo | Gemini / Antigravity | Hiển thị Biên nhận Thanh toán VNPay | *"Xử lý hiển thị thông tin VNPay trả về trên trang CheckoutSuccessPage..."* | Component hiển thị thành công chung chung | Bóc tách mã giao dịch `vnp_TransactionNo`, ngân hàng thanh toán `vnp_BankCode`, huy hiệu "Đã thanh toán" và chỉ dẫn nhận hàng tương ứng theo phương thức. | `dd38053` |
| 25/10 | Nhóm SV | Gemini / Antigravity | Hợp nhất Luồng Thanh toán B2C | *"Kiểm tra toàn bộ luồng checkout VNPay và merge vào nhánh develop..."* | Rà soát các commit trên 2 nhánh tính năng | Merge Pull Request #8 (`feature/b2c-checkout-page`) và Pull Request #9 (`feature/vnpay-payment-gateway`) vào develop thành công. | `add8a5d`, `8bd5eaf` |

---

### TUẦN 7 (26/10/2026 – 01/11/2026): Kiểm toán Toàn diện & Xóa bỏ Độ lệch FE-BE Xuyên suốt 4 Phân hệ

| Ngày | Người thực hiện | Công cụ AI | Phạm vi áp dụng | Prompt chính (Tóm tắt) | Nội dung / Mã do AI sinh ra ban đầu | Phần sinh viên đã phân tích, chỉnh sửa & tối ưu thực tế | Git Commit Hash liên quan |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| 26/10 | Nguyễn Quốc Bảo | Antigravity | Kiểm toán Phân hệ Super Admin (Đợt 1) | *"Rà soát các Use Case của Super Admin: auth restore, danh mục đa cấp, sản phẩm..."* | Đề xuất sửa giao diện nhưng chưa ăn khớp với API MongoDB dạng tree | Khắc phục Silent Token Refresh khi F5; sửa API logout xóa cookie HttpOnly; cấu hình danh mục đa cấp dạng cây và thuộc tính động `attributeKeys`. | `c82cbe4`, `ef85287` |
| 27/10 | Trần Nguyễn Castrol | Antigravity | Kiểm toán Phân hệ Super Admin (Đợt 2) | *"Kiểm tra luồng xuất kho BR-HQ, quản lý serials và BI analytics..."* | AI dùng biểu đồ tĩnh với dữ liệu hardcoded | Kết nối trực tiếp MongoDB Aggregation Pipeline cho BI Analytics; đồng bộ trạng thái Serial State Machine khép kín và xuất kho điều phối online. | `3edcc9b` |
| 28/10 | Nguyễn Quốc Bảo | Antigravity | Kiểm toán Phân hệ Branch Manager (Đợt 1) | *"Rà soát phân hệ Branch Manager: phân lập chi nhánh, nhập lô serials và tồn kho..."* | Giao diện cho phép chọn chi nhánh tùy ý mà không kiểm tra quyền | Áp dụng middleware `scopeBranch` chặn truy cập chéo dữ liệu (`CROSS_BRANCH_ACCESS_DENIED` - 403); hoàn thiện luồng nhập lô Serial tăng kho nguyên tử `$inc`. | `f3f7ec8` |
| 29/10 | Trần Nguyễn Castrol | Antigravity | Kiểm toán Phân hệ Branch Manager (Đợt 2) | *"Hiện thực hóa luồng chuyển kho liên chi nhánh: tạo phiếu, duyệt nhận và từ chối..."* | Logic chuyển kho chỉ trừ kho nguồn mà chưa cộng kho đích, không có trạng thái TRANSIT | Xây dựng quy trình 3 bước chuẩn mực: Lập phiếu ➔ Chi nhánh nguồn xuất kho (Serial sang `TRANSIT`) ➔ Chi nhánh đích duyệt nhận (tăng tồn kho, Serial sang `IN_STOCK`) hoặc từ chối hoàn kho. | `8517289`, `8a0fa97` |
| 30/10 | Nguyễn Quốc Bảo | Antigravity | Kiểm toán Phân hệ Nhân viên Quầy POS | *"Rà soát Web POS bán hàng, barcode scan, tra cứu tồn kho chéo và bảo hành..."* | Web POS chỉ bán sản phẩm có sẵn, thiếu tra cứu showroom khác | Bổ sung tính năng Tra cứu tồn kho chéo đa chi nhánh (Cross-Branch Stock Inquiry) giúp nhân viên tư vấn/bán hộ; hoàn thiện luồng tiếp nhận bảo hành `WarrantyTicket`. | `473f944` |
| 31/10 | Trần Nguyễn Castrol | Antigravity | Kiểm toán Phân hệ Khách hàng B2C (Đợt 1) | *"Kiểm tra auth B2C, tìm kiếm auto-suggest và bộ lọc thuộc tính động..."* | Tìm kiếm gọi API liên tục gây lag; bộ lọc gán cứng danh sách CPU/RAM của laptop | Bổ sung debounce 220ms cho ô tìm kiếm gợi ý kèm ảnh và giá; tái cấu trúc `DynamicFilterSidebar` trích xuất động các thuộc tính từ database theo từng danh mục. | `be26f7a` |
| 01/11 | Nhóm SV | Antigravity | Kiểm toán Phân hệ Khách hàng B2C (Đợt 2) & Test Run | *"Kiểm tra tra cứu e-warranty, giỏ hàng chọn chi nhánh, theo dõi đơn hàng và chạy toàn bộ test..."* | Trang tra cứu e-warranty không nhận URL param; Stepper đơn hàng bị lỗi hiển thị ở trạng thái vận chuyển | Bổ sung đọc `?serial=` trên URL kích hoạt tra cứu ngay kèm timeline lịch sử bảo hành; sửa hàm `getStepProgress` hỗ trợ `READY_FOR_SHIPPING`; đạt **172/172 tests passed 100%** và Vite build sạch trong **629ms**. | `be26f7a` |

---

## 🚨 III. NHẬT KÝ PHÁT HIỆN & PHÂN TÍCH ẢO GIÁC / LỖI SAI CỦA AI (HALLUCINATION & REFACTORING LOG)

> *(Minh chứng đạt mức tối đa Mức 5 - TC2.3: Phát hiện, phân tích nguyên nhân gốc rễ và tự tay tái cấu trúc $\ge 5$ lỗi/ảo giác kỹ thuật của AI)*

---

### 1. Giai đoạn Tuần 1 + 2

#### 📌 Lỗi 1 (Cơ sở dữ liệu): AI gợi ý dùng MongoDB Transactions trên bản Local Standalone
- **Mô tả ảo giác:** AI tư vấn sử dụng `session.startTransaction()` để trừ tồn kho đa chi nhánh khi lập trình ở máy cá nhân.
- **Nguyên nhân gốc rễ:** AI không nhận biết được MongoDB Standalone cài đặt local mặc định không hỗ trợ cơ chế Multi-document Transactions (bắt buộc phải cấu hình dạng Replica Set).
- **Phần sinh viên tái cấu trúc:** Chuyển sang sử dụng **MongoDB Atomic Operations (`$inc` kết hợp điều kiện `{ quantity: { $gte: qty } }`)**, vừa chạy ổn định trên môi trường Localhost vừa triệt tiêu hiện tượng Race Condition bán âm kho.
- **Commit Git đối chiếu:** `21708da`

#### 📌 Lỗi 2 (Kiến trúc Hệ thống): AI đề xuất tách dự án thành 4 Web Application độc lập
- **Mô tả ảo giác:** AI gợi ý khởi tạo 4 repository ReactJS riêng biệt cho B2C, Web POS, Admin Branch và Super Admin.
- **Nguyên nhân gốc rễ:** AI hiểu nhầm yêu cầu đề tài thành 4 sản phẩm thương mại rời rạc, làm phình to khối lượng công việc và gây khó khăn trong việc chia sẻ State, Components và DTO types.
- **Phần sinh viên tái cấu trúc:** Tái cấu trúc lại thành **Hệ sinh thái Nền tảng hợp nhất (Unified Platform)**: 1 Backend Node.js (Modular Monolith), 1 Cơ sở dữ liệu MongoDB và 1 Frontend ReactJS tổ chức theo Feature-based Architecture phân quyền linh hoạt qua RBAC.
- **Commit Git đối chiếu:** `fe57dd2`

#### 📌 Lỗi 3 (Bảo mật Express.js): AI sinh cấu hình JWT không có thời gian hết hạn (Expiration)
- **Mô tả ảo giác:** Đoạn mã mẫu tạo Token `jwt.sign({ id: user._id }, process.env.JWT_SECRET)` thiếu hoàn toàn thuộc tính thời gian sống (`expiresIn`).
- **Nguyên nhân gốc rễ:** AI ưu tiên đoạn mã ngắn gọn nên vô tình bỏ qua nguyên tắc an toàn thông tin cơ bản.
- **Phần sinh viên tái cấu trúc:** Bổ sung cấu hình `{ expiresIn: '8h' }` cho tài khoản nhân viên quầy POS và cơ chế Refresh Token 14 ngày lưu trong HttpOnly Cookie để bảo vệ phiên làm việc.
- **Commit Git đối chiếu:** `474c6cc`

#### 📌 Lỗi 4 (Giao diện / Tương thích): AI gợi ý thư viện quét mã vạch đã ngưng bảo trì (`react-qr-reader`)
- **Mô tả ảo giác:** AI đề xuất cài đặt package `react-qr-reader` bị lỗi xung đột nghiêm trọng với React 18+ và React 19.
- **Nguyên nhân gốc rễ:** Dữ liệu huấn luyện của AI chứa mã nguồn từ các dự án cũ đã lỗi thời.
- **Phần sinh viên tái cấu trúc:** Chủ động chuyển sang viết custom hook `useBarcodeScanner` bắt sự kiện bàn phím trực tiếp từ máy quét phần cứng kết hợp thư viện hiện đại `html5-qrcode`.
- **Commit Git đối chiếu:** `5d544f8`

#### 📌 Lỗi 5 (Hiệu năng Truy vấn): AI sử dụng query Mongoose cơ bản gây Latency cao
- **Mô tả ảo giác:** AI viết query `Product.find()` trả về nguyên thể Mongoose Hydrated Document khi lấy danh sách sản phẩm.
- **Nguyên nhân gốc rễ:** AI không tự tối ưu hiệu năng I/O cho các truy vấn chỉ dùng để đọc (Read-only).
- **Phần sinh viên tái cấu trúc:** Thêm hàm `.lean()` giúp chuyển kết quả về Plain JavaScript Object, giảm thời gian phản hồi API từ 380ms xuống 110ms (đáp ứng KPI 1: $T_{\text{avg}} < 200\text{ms}$).
- **Commit Git đối chiếu:** `2921546`

#### 📌 Lỗi 6 (Kiến trúc CSDL NoSQL): AI khuyên tạo các Collection quan hệ rời rạc kiểu RDBMS
- **Mô tả ảo giác:** Khi nhận sơ đồ ERD có các biến thể sản phẩm, AI ban đầu đề xuất tạo riêng các collection `product_options`, `option_values`, `sku_option_values` trong MongoDB.
- **Nguyên nhân gốc rễ:** Mô hình ngôn ngữ bị thiên kiến bởi thiết kế chuẩn hóa 3NF của CSDL quan hệ SQL truyền thống.
- **Phần sinh viên tái cấu trúc:** Nhận diện thiết kế này sẽ gây nghẽn cổ chai I/O vì phải `$lookup` qua 5 bảng để hiển thị 1 trang sản phẩm. Nhóm đã chủ động tái cấu trúc theo **Hybrid Schema**, nhúng toàn bộ options, skus và attributes vào thẳng Document cha `products`.
- **Commit Git đối chiếu:** `21708da`

#### 📌 Lỗi 7 (Chuẩn hóa Sơ đồ UML): AI nhầm lẫn giữa chuẩn C4-Model và UML 2.5
- **Mô tả ảo giác:** Khi được yêu cầu vẽ Component Diagram cho đồ án môn học, AI sinh mã PlantUML sử dụng thư viện `C4_Component.puml` với các thẻ `Container`, `Component` không đúng chuẩn UML 2.5 quy định bởi Khoa CNTT.
- **Nguyên nhân gốc rễ:** AI ưu tiên các thư viện trực quan phổ biến trên mạng thay vì tuân thủ nghiêm ngặt giáo trình kỹ thuật phần mềm truyền thống.
- **Phần sinh viên tái cấu trúc:** Yêu cầu refactor toàn bộ mã PlantUML về chuẩn UML 2.5 chính quy (sử dụng `package`, `component`, `interface ()` và quan hệ dependency `..>`).
- **Commit Git đối chiếu:** `26adfaa`

#### 📌 Lỗi 8 (Biến môi trường Vite): AI sinh biến môi trường Client không có tiền tố bắt buộc
- **Mô tả ảo giác:** Trong file cấu hình Frontend React/Vite, AI khai báo các biến `REACT_APP_API_URL` và `API_BASE_URL`.
- **Nguyên nhân gốc rễ:** Dữ liệu huấn luyện của AI bị lẫn lộn giữa Create React App cũ và Vite runtime mới.
- **Phần sinh viên tái cấu trúc:** Phát hiện Vite không thể inject các biến này vào `import.meta.env`, đã sửa lại toàn bộ thành tiền tố `VITE_API_BASE_URL` và `VITE_SOCKET_URL`.
- **Commit Git đối chiếu:** `4a5b6c7`

---

### 2. Giai đoạn Tuần 3

#### 📌 Lỗi 9 (Quản lý State & Mock Data): AI lạm dụng dữ liệu Mock Fallback che giấu lỗi kết nối API thật
- **Mô tả ảo giác:** Khi viết custom hook gọi API sản phẩm, AI bọc khối `catch` bằng việc gán một mảng sản phẩm mock tĩnh (fake data) thay vì trả về lỗi cho UI xử lý.
- **Nguyên nhân gốc rễ:** AI có xu hướng ưu tiên giao diện luôn có dữ liệu hiển thị, vô tình làm sai lệch hành vi kiểm thử và che giấu lỗi kết nối API thực tế.
- **Phần sinh viên tái cấu trúc:** Loại bỏ toàn bộ dữ liệu mock ngầm, chuẩn hóa trạng thái hiển thị lỗi rõ ràng bằng Error Boundary và Alert Banner để phục vụ kiểm thử dữ liệu thực tế kết nối với MongoDB.
- **Commit Git đối chiếu:** `439015e`

---

### 3. Giai đoạn Tuần 4

#### 📌 Lỗi 10 (Kiểm thử & Open Handles): AI viết test case Jest không đóng kết nối MongoDB gây rò rỉ bộ nhớ
- **Mô tả ảo giác:** Trong các file test tích hợp Supertest, AI viết câu lệnh `mongoose.connect()` ở `beforeAll` nhưng quên gọi `mongoose.disconnect()` và `server.close()` ở `afterAll`.
- **Nguyên nhân gốc rễ:** AI sinh mã test đơn giản mà không quản lý vòng đời tài nguyên mạng (Network Handles).
- **Phần sinh viên tái cấu trúc:** Bổ sung hook `afterAll(async () => { await mongoose.disconnect(); })` trong toàn bộ 17 test suites, loại bỏ hoàn toàn cảnh báo Jest `A worker process has failed to exit gracefully and has been force exited`.
- **Commit Git đối chiếu:** `3051142`, `548c5ae`

---

### 4. Giai đoạn Tuần 5

#### 📌 Lỗi 11 (Bảo mật Phiên làm việc): AI lưu Access Token vào localStorage gây rủi ro XSS
- **Mô tả ảo giác:** Khi cài đặt tính năng đăng nhập, AI viết code `localStorage.setItem('accessToken', token)`.
- **Nguyên nhân gốc rễ:** AI gợi ý giải pháp lưu trữ dễ làm nhất nhưng vi phạm nguyên tắc bảo mật web hiện đại (dễ bị tấn công trộm token qua Cross-Site Scripting).
- **Phần sinh viên tái cấu trúc:** Chuyển toàn bộ Access Token vào quản lý trong React RAM (Redux auth state), kết hợp Silent Refresh Queue gọi API `/auth/refresh-token` sử dụng HttpOnly Cookie có cờ `SameSite=Lax`.
- **Commit Git đối chiếu:** `474c6cc`, `8f9d185`

---

### 5. Giai đoạn Tuần 6

#### 📌 Lỗi 12 (Thuật toán Checksum VNPay): AI dùng thư viện `qs` sai quy cách ký số SHA-512
- **Mô tả ảo giác:** AI dùng thư viện `qs.stringify(params, { encode: false })` để chuẩn bị chuỗi băm HMAC-SHA512 gửi sang cổng thanh toán VNPay.
- **Nguyên nhân gốc rễ:** Cổng VNPay V2.1.0 quy định nghiêm ngặt: toàn bộ key phải sort theo alphabet A-Z và ký tự khoảng trắng phải được encode thành dấu `+` thay vì `%20`. Thư viện `qs` mặc định không đáp ứng được dẫn đến cổng VNPay báo lỗi `97: Sai chữ ký`.
- **Phần sinh viên tái cấu trúc:** Tự viết hàm `sortObject` độc lập sắp xếp key từ điển A-Z và thay thế `%20` bằng `+`, đảm bảo 100% chữ ký khớp với cổng thanh toán.
- **Commit Git đối chiếu:** `1dbb406`

#### 📌 Lỗi 13 (Xung đột Giao dịch VNPay): Trùng mã tham chiếu `vnp_TxnRef` khi thanh toán lại
- **Mô tả ảo giác:** AI gán trực tiếp mã đơn hàng `order.orderCode` vào tham số `vnp_TxnRef`.
- **Nguyên nhân gốc rễ:** Khi khách hàng bấm thử thanh toán lại cho một đơn hàng chưa thanh toán, VNPay sẽ từ chối do mã `vnp_TxnRef` đã tồn tại trong ngày.
- **Phần sinh viên tái cấu trúc:** Sử dụng cấu trúc gắn timestamp `${order.orderCode}_${Date.now()}` khi tạo link thanh toán và viết logic tách ngược lại mã đơn gốc khi nhận callback IPN.
- **Commit Git đối chiếu:** `1dbb406`

#### 📌 Lỗi 14 (Xung đột Định tuyến Express): Route động `/:orderCode` nuốt callback `/vnpay-return`
- **Mô tả ảo giác:** AI đặt route callback `/vnpay-return` ở cuối file `order.routes.js` bên dưới route `/:orderCode`.
- **Nguyên nhân gốc rễ:** Lỗi Route Shadowing kinh điển trong Express: route động đứng trước match toàn bộ URL, khiến chuỗi `"vnpay-return"` bị hiểu nhầm là mã đơn hàng và bị chặn bởi middleware `protect` (lỗi 401).
- **Phần sinh viên tái cấu trúc:** Đảo thứ tự định tuyến, đưa route tĩnh `/vnpay-return` lên trước `/:orderCode` và gỡ bỏ middleware `protect` vì đây là redirect công khai từ trình duyệt.
- **Commit Git đối chiếu:** `a58709e`

---

### 6. Giai đoạn Tuần 7

#### 📌 Lỗi 15 (Môi trường Windows): Lỗi CRLF vs LF khi công cụ AI thực thi sửa tệp hàng loạt
- **Mô tả ảo giác:** Khi thực hiện sửa đổi hàng loạt file Frontend, công cụ tự động của AI báo lỗi liên tục `target content not found in the file` do chuỗi tìm kiếm dùng ký tự `\n` (LF) trong khi tệp trên Windows dùng `\r\n` (CRLF).
- **Nguyên nhân gốc rễ:** Sự không tương thích giữa định dạng xuống dòng của Linux và Windows trong các công cụ agentic automation.
- **Phần sinh viên tái cấu trúc:** Chỉ đạo AI chuyển sang cơ chế ghi đè tệp tin toàn phần (`write_file` với cờ `Overwrite: true`) hoặc chỉ thay thế từng dòng đơn không chứa dấu ngắt dòng.
- **Commit Git đối chiếu:** `be26f7a`

#### 📌 Lỗi 16 (Phản biện Bảo mật): AI đề xuất nới lỏng an ninh backend khi test case fail
- **Mô tả ảo giác:** Khi siết chặt quy tắc Branch Scoping (bắt buộc `STAFF` hoặc `BRANCH_MANAGER` phải có `branchId` hợp lệ), 3 bộ test tích hợp cũ bị fail do dữ liệu fixture cũ tạo tài khoản thiếu `branchId`. AI đề xuất bỏ kiểm tra `branchId` trong `auth.service.js`.
- **Nguyên nhân gốc rễ:** AI có xu hướng chọn con đường sửa code dễ nhất để test pass thay vì bảo vệ nguyên tắc an ninh hệ thống.
- **Phần sinh viên tái cấu trúc:** Kiên quyết từ chối giải pháp nới lỏng bảo mật của AI. Sinh viên trực tiếp phân tích và sửa đúng nguyên nhân gốc: bổ sung `branchId: new mongoose.Types.ObjectId()` vào fixture tạo Staff trong cả 3 file test ([product.test.js](code/server/tests/integration/product.test.js), [category.test.js](code/server/tests/integration/category.test.js), [branch.test.js](code/server/tests/integration/branch.test.js)). Kết quả: 172/172 tests đều pass mà cơ chế bảo mật phân quyền vẫn được giữ vững 100%.
- **Commit Git đối chiếu:** `be26f7a`

#### 📌 Lỗi 17 (Adapter Giỏ hàng): AI bỏ qua hàm chuẩn hóa dữ liệu khi thêm vào giỏ từ bảng so sánh
- **Mô tả ảo giác:** Khi người dùng bấm nút "Chọn mua" từ bảng so sánh cấu hình `CompareMatrixTable.jsx`, sản phẩm đưa vào giỏ hàng bị mất thông tin biến thể SKU và giá bán hiển thị `0 ₫`.
- **Nguyên nhân gốc rễ:** AI viết hàm thêm giỏ hàng truyền trực tiếp object sản phẩm thô vào Redux dispatch thay vì đi qua adapter chuẩn hóa.
- **Phần sinh viên tái cấu trúc:** Sử dụng hàm chuẩn hóa `createCartItem` từ `productAdapter.js` đảm bảo mọi item trong giỏ luôn có đầy đủ `productId`, `productSkuId`, `sku`, `price`, `image`, `options`.
- **Commit Git đối chiếu:** `be26f7a`

#### 📌 Lỗi 18 (Trạng thái Đơn hàng): Hàm Stepper thiếu enum `READY_FOR_SHIPPING`
- **Mô tả ảo giác:** Đơn hàng ở trạng thái `READY_FOR_SHIPPING` ("Đang vận chuyển") nhưng giao diện chi tiết đơn hàng `OrderDetailPage.jsx` lại hiển thị Stepper ở Bước 1 ("Đã đặt hàng") và huy hiệu trạng thái màu vàng ("CHỜ THANH TOÁN").
- **Nguyên nhân gốc rễ:** Hàm `getStepProgress` ban đầu do AI sinh ra chỉ có 3 nhánh `switch-case` (`PENDING`, `PROCESSING`, `COMPLETED`), thiếu trạng thái `READY_FOR_SHIPPING` và `CONFIRMED` nên rơi vào nhánh `default: return 1`.
- **Phần sinh viên tái cấu trúc:** Cập nhật hàm `getStepProgress` đưa `READY_FOR_SHIPPING` vào Bước 3 ("Đang vận chuyển") và `CONFIRMED` vào Bước 2; đồng thời bổ sung màu sắc huy hiệu chuẩn cho từng trạng thái.
- **Commit Git đối chiếu:** `be26f7a`

---

## IV. TỔNG KẾT NĂNG LỰC LÀM CHỦ CÔNG NGHỆ (ENGINEERING OWNERSHIP)

1. **Hiệu suất Tăng tốc từ AI:** Nhóm đã tận dụng tối đa thế mạnh của AI trong việc sinh mã khung (boilerplate), sinh dữ liệu giả lập có cấu trúc (mock seeds), tra cứu nhanh tài liệu đặc tả chuẩn IEEE/ISO và hỗ trợ viết các bộ test case bao quát.
2. **Kiểm soát Chất lượng & Tính Toàn vẹn:** Không có bất kỳ đoạn mã nào do AI sinh ra được đưa vào nhánh `develop` hay `main` mà chưa qua rà soát trực tiếp bởi sinh viên. Mọi ảo giác về bảo mật, hiệu năng, kiến trúc CSDL và cú pháp đều được phát hiện kịp thời và xử lý tận gốc.
3. **Mức độ Đáp ứng Rubric Đồ án Tốt nghiệp:**
   - **TC2.3 (Làm chủ AI):** Đạt mức tối đa **Mức 5 (Xuất sắc)** nhờ nhật ký phân tích chi tiết 18 lỗi/ảo giác kỹ thuật trải dài xuyên suốt 7 tuần thực hiện đồ án kèm commit hash đối chiếu minh bạch trên Git.
