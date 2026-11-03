# BÁO CÁO TIẾN ĐỘ TUẦN 6 (19/10/2026 – 25/10/2026)

**Tên đề tài:** Nghiên cứu công nghệ MERN Stack và xây dựng website thương mại điện tử cho chuỗi cửa hàng thiết bị công nghệ.  
**Mô hình triển khai:** Nền tảng bán lẻ đa kênh Omnichannel Retail Platform (Storefront B2C, Web POS, Branch Portal, HQ Admin) theo kiến trúc Modular Monolith (Backend) và Feature-based Architecture (Frontend).  
**Nhóm thực hiện:**  
- Nguyễn Quốc Bảo – 23110182  
- Trần Nguyễn Castrol – 23110185  
**Giảng viên hướng dẫn:** Nguyễn Hữu Trung  
**Link GitHub Repository:** [https://github.com/Castrol-2k5/MERN-TECH-ECOMMERCE.git](https://github.com/Castrol-2k5/MERN-TECH-ECOMMERCE.git)  

---

## I. MỤC TIÊU TUẦN 6 & TỔNG QUAN CÔNG VIỆC

### 1. Mục tiêu trọng tâm của Tuần 6
Trong tuần 6, nhóm tập trung giải quyết triệt để 2 vấn đề then chốt trong chuỗi nghiệp vụ bán lẻ trực tuyến (B2C eCommerce):
1. **Hoàn thiện Luồng Mua Hàng & Trang Thanh Toán B2C Chuyên Biệt (`CheckoutPage.jsx`):** Xóa bỏ cơ chế modal popup đặt hàng tạm bợ trong giỏ hàng, chuyển đổi thành trang thanh toán chuẩn 2 cột (Two-Column Layout) hỗ trợ đầy đủ 2 phương thức nhận hàng: *Giao tận nơi* và *Nhận tại showroom (Click & Collect)*.
2. **Tích hợp Cổng Thanh toán Điện tử VNPay Sandbox:** Triển khai module thanh toán bảo mật với mã băm chữ ký điện tử HMAC-SHA512 chuẩn đặc tả kỹ thuật VNPay V2.1.0; xây dựng cơ chế đối soát chữ ký, xử lý IPN / Return URL và cập nhật tự động trạng thái đơn hàng.

---

### 2. Những việc ĐÃ HOÀN THÀNH trong Tuần 6

#### A. Kiến trúc Giao diện & Trải nghiệm Đặt hàng B2C (`feature/b2c-checkout-page`):
- **Trang Thanh toán Độc lập ([CheckoutPage.jsx](../code/client/src/pages/storefront/CheckoutPage.jsx)):**
  - Bố cục 2 cột chuyên nghiệp: Cột trái gồm 3 khối thông tin (Phương thức nhận hàng, Thông tin khách hàng, Phương thức thanh toán); Cột phải là tóm tắt đơn hàng cố định (Sticky Order Summary).
  - Tích hợp 2 hình thức nhận hàng:
    - 🚚 **Giao tận nơi (Delivery):** Nhập địa chỉ chi tiết, tự động liên kết với chi nhánh xuất kho gần nhất.
    - 🏬 **Nhận tại cửa hàng (Click & Collect):** Gọi API [`branchService.getBranches()`](../code/client/src/features/branches/services/branchService.js) nạp danh sách showroom theo thời gian thực từ cơ sở dữ liệu MongoDB, hiển thị địa chỉ chi tiết, hotline và trạng thái sẵn sàng bàn giao máy sau 15–30 phút.
  - Tích hợp kiểm tra tính hợp lệ dữ liệu (Validation): Kiểm tra định dạng số điện thoại di động Việt Nam qua biểu thức chính quy (Regex: `/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/`), kiểm tra bắt buộc họ tên và địa chỉ nhận hàng.
  - Tinh gọn luồng điều hướng: Cập nhật [`CartPage.jsx`](../code/client/src/pages/storefront/CartPage.jsx) điều hướng mượt mà sang `/checkout` và đăng ký route trong [`AppRoutes.jsx`](../code/client/src/routes/AppRoutes.jsx).

#### B. Tích hợp Cổng Thanh toán Điện tử VNPay Sandbox (`feature/vnpay-payment-gateway`):
- **Backend Service ([vnpay.service.js](../code/server/src/modules/orders/vnpay.service.js)):**
  - Xây dựng thuật toán sắp xếp tham số URL theo thứ tự từ điển A-Z (`sortObject`), chuẩn hóa chuỗi dữ liệu truy vấn và mã hóa ký tự theo chuẩn VNPay (thay thế `%20` bằng dấu `+`).
  - Ký số bảo mật an toàn sử dụng thuật toán HMAC-SHA512 với khóa bí mật `VNPAY_HASH_SECRET`.
  - Khắc phục lỗi trùng lặp mã giao dịch (`vnp_TxnRef`) khi khách hàng bấm thanh toán nhiều lần trên cùng 1 đơn hàng bằng cách sinh mã có gắn tiền tố thời gian: `${order.orderCode}_${Date.now()}`.
  - Xây dựng hàm `verifyReturnUrl` kiểm tra tính toàn vẹn và hợp lệ của chữ ký phản hồi từ VNPay, chống tấn công giả mạo dữ liệu (Tampering Attack).
- **Backend Endpoints & Routing ([order.routes.js](../code/server/src/modules/orders/order.routes.js)):**
  - `POST /api/v1/orders/:id/vnpay-url`: Sinh URL thanh toán trực tiếp chuyển hướng sang cổng VNPay Sandbox.
  - `GET /api/v1/orders/vnpay-return`: Nhận callback redirect từ VNPay, kiểm tra mã phản hồi `vnp_ResponseCode === '00'`, cập nhật trạng thái thanh toán `paymentStatus = 'PAID'` trong MongoDB và chuyển hướng người dùng về trang thông báo hoàn tất của Frontend.
  - Khắc phục triệt để lỗi xung đột định tuyến (Route Shadowing) của Express: Đưa route cụ thể `/vnpay-return` lên trước route tham số động `/:orderCode`.
- **Frontend Success & Verification ([CheckoutSuccessPage.jsx](../code/client/src/pages/storefront/CheckoutSuccessPage.jsx)):**
  - Nhận và phân tích các tham số giao dịch từ URL (`vnp_TransactionNo`, `vnp_BankCode`, `vnp_ResponseCode`).
  - Hiển thị giao diện biên nhận trực quan: Mã giao dịch VNPay, trạng thái "Đã thanh toán" (Huy hiệu màu xanh ngọc), số tiền thanh toán, và hướng dẫn nhận hàng cụ thể cho đơn Click & Collect hoặc đơn Giao tận nơi.
- **Kiểm thử tự động Unit Test ([vnpay.test.js](../code/server/tests/unit/vnpay.test.js)):**
  - Bổ sung 3 test cases độc lập: Kiểm thử tạo URL thanh toán VNPay chuẩn SHA-512, kiểm thử xác thực chữ ký phản hồi hợp lệ, và kiểm thử từ chối khi tham số hoặc chữ ký bị can thiệp trái phép. 100% test cases pass.

---

### 3. Những việc CHƯA LÀM ĐƯỢC / CẦN KHẮC PHỤC
1. **Độ lệch kết nối dữ liệu giữa Client và Server trên các phân hệ nội bộ:**
   - Mặc dù luồng B2C Checkout đã hoạt động mượt mà, nhưng các phân hệ quản trị (Super Admin, Branch Manager và Nhân viên Quầy POS) vẫn còn một số màn hình phụ thuộc dữ liệu giả lập (mock fallback) hoặc lệch định dạng DTO gửi lên máy chủ (lỗi Zod validation 400).
2. **Tiến độ kiểm thử tự động tầng Giao diện (Frontend E2E):**
   - Mới hoàn thành kiểm thử Unit & Integration Test ở tầng Backend Jest (17 suites, 169 tests); tầng Frontend hiện đang kiểm thử qua xác nhận thủ công (Manual Testing) và lệnh `npm run build` của Vite.
3. **Môi trường Cloud:**
   - Đang chuẩn bị các biến môi trường để triển khai Staging/Production trên Vercel, Render và MongoDB Atlas.

---

## II. KẾT QUẢ THỰC HIỆN CHI TIẾT & MINH CHỨNG (ATTACH EVIDENCE)

### 1. Lịch sử Git Flow, Commits & Pull Requests
Hệ thống tuân thủ nghiêm ngặt quy chuẩn phân nhánh **Git Flow** và đặt tên commit chuẩn **Conventional Commits**:

```
*   Merge pull request #9 from feature/vnpay-payment-gateway: Integrate VNPay sandbox payment gateway (8bd5eaf)
|\  
| * dd38053 feat(checkout): handle VNPay transaction verification and metadata display on success page
| * 2dee18b feat(client): implement createVnpayUrl API method in client orderService
| * a58709e feat(routes): register /vnpay-url and /vnpay-return routes in order router
| * e5578a7 feat(order): add createVnpayPaymentUrl and handleVnpayReturn controller handlers
| * 5d4583a feat(order): implement createVnpayPaymentUrl and handleVnpayReturn service methods
| * 718e1be test(payment): add unit tests for VNPay URL generation and signature verification
| * 1dbb406 feat(payment): implement VNPay service with HMAC-SHA512 checksum and URL builder
| * 0553a7b feat(config): add VNPay environment variables and configuration parameters
|/  
*   Merge pull request #8 from feature/b2c-checkout-page: Add dedicated B2C Checkout page & order flow (add8a5d)
|\  
| * c5cb61b feat(routes): register /checkout route and update CartPage checkout navigation
| * 0235448 feat(client): implement dedicated CheckoutPage component with two-column layout
|/  
*   develop (Base branch)
```

| STT | Branch phát triển | Commit Hash | Message Commit chuẩn | Nội dung thay đổi kỹ thuật |
| :---: | :--- | :---: | :--- | :--- |
| 1 | `feature/b2c-checkout-page` | `0235448` | `feat(client): implement dedicated CheckoutPage component with two-column layout` | Xây dựng giao diện CheckoutPage 2 cột, tabs nhận hàng, tích hợp API chi nhánh |
| 2 | `feature/b2c-checkout-page` | `c5cb61b` | `feat(routes): register /checkout route and update CartPage checkout navigation` | Cập nhật AppRoutes, chuyển hướng từ giỏ hàng sang checkout |
| 3 | **develop** | `add8a5d` | **`Merge pull request #8 from feature/b2c-checkout-page`** | **Hợp nhất hoàn tất tính năng Checkout B2C vào develop** |
| 4 | `feature/vnpay-payment-gateway` | `0553a7b` | `feat(config): add VNPay environment variables and configuration parameters` | Cấu hình biến môi trường VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_URL |
| 5 | `feature/vnpay-payment-gateway` | `1dbb406` | `feat(payment): implement VNPay service with HMAC-SHA512 checksum and URL builder` | Viết VnpayService, thuật toán sortObject, mã hóa SHA-512 |
| 6 | `feature/vnpay-payment-gateway` | `718e1be` | `test(payment): add unit tests for VNPay URL generation and signature verification` | Bổ sung file test unit `tests/unit/vnpay.test.js` |
| 7 | `feature/vnpay-payment-gateway` | `5d4583a` | `feat(order): implement createVnpayPaymentUrl and handleVnpayReturn service methods` | Xử lý logic sinh URL và nhận callback thanh toán trong orderService |
| 8 | `feature/vnpay-payment-gateway` | `e5578a7` | `feat(order): add createVnpayPaymentUrl and handleVnpayReturn controller handlers` | Controller tiếp nhận request và chuyển hướng callback |
| 9 | `feature/vnpay-payment-gateway` | `a58709e` | `feat(routes): register /vnpay-url and /vnpay-return routes in order router` | Đăng ký route Express, xử lý chống Route Shadowing |
| 10 | `feature/vnpay-payment-gateway` | `2dee18b` | `feat(client): implement createVnpayUrl API method in client orderService` | Gọi API Backend lấy URL thanh toán VNPay phía React client |
| 11 | `feature/vnpay-payment-gateway` | `dd38053` | `feat(checkout): handle VNPay transaction verification and metadata display on success page` | Cập nhật CheckoutSuccessPage hiển thị mã giao dịch và trạng thái PAID |
| 12 | **develop** | `8bd5eaf` | **`Merge pull request #9 from feature/vnpay-payment-gateway`** | **Hợp nhất hoàn tất tính năng Cổng VNPay vào develop** |

---

### 2. Kiến trúc & Sơ đồ luồng Thanh toán VNPay (Data Flow)

```
[Khách hàng B2C] ──(1. Chọn VNPay & Đặt hàng)──> [React CheckoutPage]
                                                        │
                                          (2. POST /orders/b2c/checkout)
                                                        │
                                                        ▼
                                              [Express Backend]
                                          (Giữ tồn kho Atomic MongoDB)
                                                        │
                                          (3. POST /orders/:id/vnpay-url)
                                                        │
                                                        ▼
                                              [VnpayService]
                                          (Sort A-Z + HMAC-SHA512)
                                                        │
                                          (4. Trả về paymentUrl)
                                                        ▼
[Trang Thanh toán VNPay Sandbox] <──(5. Redirect người dùng)───┘
               │
   (6. Quét QR / Thẻ ATM)
               │
               ▼
[Cổng VNPay Redirect về] ──(7. GET /orders/vnpay-return?vnp_ResponseCode=00...)──> [Backend Router]
                                                                                           │
                                                                           (8. Verify HMAC Checksum)
                                                                           (9. Update paymentStatus: 'PAID')
                                                                                           │
                                                                           (10. Redirect 302 sang Client)
                                                                                           ▼
[CheckoutSuccessPage] <──(11. Hiển thị mã GD VNPay, Mã đơn & Showroom nhận)────────────────┘
```

---

### 3. Kết quả Kiểm thử tự động (Unit & Integration Tests)
- **Bộ kiểm thử Backend:** Chạy 17 Test Suites, đạt **169/169 Tests Passed (100%)**.
- **Riêng Module Thanh toán ([tests/unit/vnpay.test.js](../code/server/tests/unit/vnpay.test.js)):**
  - `√ Happy Path: should generate a valid VNPay sandbox URL with required query params and SHA512 hash`: Đạt chuẩn 100%.
  - `√ Happy Path: should verify authentic return params with valid checksum`: Xác thực thành công dữ liệu hợp lệ trả về từ cổng.
  - `√ Security / Negative: should reject return callback when parameters or hash have been tampered with`: Chặn đứng khi tham số bị can thiệp giả mạo.
- **Frontend Build Verification:** Lệnh `npm run build` hoàn tất không có cảnh báo lỗi cú pháp.

---

## III. 🤖 NHẬT KÝ LÀM CHỦ AI (AI USAGE LOG - TC2.3)
> **Mục tiêu:** Minh chứng năng lực làm chủ công nghệ và tư duy kỹ thuật (Engineering Ownership). Thể hiện cách nhóm sử dụng AI như một công cụ hỗ trợ, phát hiện các lỗi sai/ảo giác của AI và tự tay tái cấu trúc (refactoring) để hệ thống hoạt động chính xác trong thực tế.

---

### 📌 Trường hợp 1: Thiết kế Giao diện Đặt hàng B2C (Checkout Form)
- **Prompt gửi lên AI:**
  > *"Viết cho tôi một component CheckoutPage bằng React để người dùng nhập địa chỉ và đặt hàng từ giỏ hàng Redux."*
- **Mã nguồn do AI sinh ra ban đầu (AI Output Baseline):**
  ```jsx
  // AI gợi ý form 1 cột sơ sài, chỉ có 1 ô input nhập địa chỉ tự do:
  export default function CheckoutPage() {
    const [address, setAddress] = useState('');
    const handleSubmit = (e) => {
      e.preventDefault();
      api.post('/orders', { address });
    };
    return (
      <form onSubmit={handleSubmit}>
        <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Nhập địa chỉ" />
        <button type="submit">Đặt hàng</button>
      </form>
    );
  }
  ```
- **Hạn chế & Lỗi nghiệp vụ trong gợi ý của AI:**
  1. *Thiếu đặc thù bán lẻ đa kênh:* Hệ thống của đồ án là chuỗi bán lẻ công nghệ có các showroom vật lý, cần hình thức **Click & Collect (Nhận tại cửa hàng)**; AI chỉ tạo form giao hàng thông thường.
  2. *Thiếu ràng buộc an toàn dữ liệu:* Không validate số điện thoại di động Việt Nam (các đầu số 03, 05, 07, 08, 09), không chặn người dùng gửi đơn khi giỏ hàng rỗng.
  3. *Trải nghiệm người dùng (UX) kém:* Bố cục 1 cột không theo chuẩn các nền tảng TMĐT hiện đại.
- **Sinh viên đã phân tích, tái cấu trúc & hoàn thiện (Student Engineering Refactor):**
  - Thiết kế cấu trúc 2 cột chuẩn: Cột thông tin khách hàng và Cột tóm tắt đơn hàng cố định (Sticky Sidebar).
  - Bổ sung 2 tabs nhận hàng rõ rệt: *Giao tận nơi* và *Nhận tại cửa hàng (Click & Collect)*.
  - Tích hợp gọi API `branchService.getBranches()` để nạp danh sách chi nhánh realtime, cho phép khách chọn showroom gần nhất nhận máy sau 15–30 phút.
  - Áp dụng Regex kiểm tra số điện thoại người nhận: `/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/`.
  - Kết nối dữ liệu giỏ hàng Redux với adapter chuẩn hóa `toB2cCheckoutPayload` trước khi gửi lên máy chủ.

---

### 📌 Trường hợp 2: Thuật toán Checksum & Mã hóa Cổng VNPay (HMAC-SHA512)
- **Prompt gửi lên AI:**
  > *"Viết hàm tạo URL thanh toán VNPay bằng Node.js có mã băm SHA512."*
- **Mã nguồn do AI sinh ra ban đầu (AI Output Baseline):**
  ```javascript
  // AI dùng thư viện qs và nối chuỗi mã băm sai quy cách của VNPay:
  import qs from 'qs';
  import crypto from 'crypto';

  export function createVnpayUrl(params, secretKey) {
    const signData = qs.stringify(params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(signData).digest('hex');
    return 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?' + signData + '&vnp_SecureHash=' + signed;
  }
  ```
- **Hạn chế & Ảo giác nghiêm trọng của AI:**
  1. *Lỗi lệch mã băm (Checksum Mismatch Error 97):* VNPay quy định toàn bộ tham số phải được sắp xếp theo thứ tự alphabet A-Z và các ký tự khoảng trắng phải được encode thành dấu `+` thay vì `%20`. Thư viện `qs` nối chuỗi mặc định không sắp xếp đúng và dùng `%20`, dẫn đến cổng VNPay từ chối giao dịch với mã lỗi `97: Chữ ký không hợp lệ`.
  2. *Lỗi trùng lặp mã đơn (`vnp_TxnRef`):* Nếu khách hàng thao tác thanh toán lại cho đơn hàng chưa hoàn tất, VNPay báo lỗi do trùng mã tham chiếu `vnp_TxnRef`.
- **Sinh viên đã phân tích, tái cấu trúc & hoàn thiện (Student Engineering Refactor):**
  - Xây dựng hàm `sortObject` độc lập hoàn toàn, không phụ thuộc thư viện bên ngoài, tự động sort key theo thứ tự từ điển A-Z và chuyển đổi `%20` thành `+`:
    ```javascript
    static sortObject(obj) {
      const sorted = {};
      const keys = Object.keys(obj).sort();
      for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
          sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
        }
      }
      return sorted;
    }
    ```
  - Khắc phục lỗi trùng `TxnRef`: Sử dụng cấu trúc gắn timestamp `${order.orderCode}_${Date.now()}` khi tạo link VNPay và viết hàm bóc tách mã đơn gốc khi nhận callback.
  - Viết hàm `verifyReturnUrl` so sánh hash không phân biệt hoa thường (`toLowerCase()`), bảo vệ hệ thống trước hành vi giả mạo tham số.

---

### 📌 Trường hợp 3: Điều hướng Express Routes & Xung đột Tham số (Route Shadowing)
- **Prompt gửi lên AI:**
  > *"Thêm route nhận return url từ VNPay vào file order.routes.js."*
- **Mã nguồn do AI sinh ra ban đầu (AI Output Baseline):**
  ```javascript
  // AI thêm route vào cuối file:
  router.get('/:orderCode', protect, OrderController.getOrderByCode);
  router.get('/vnpay-return', OrderController.handleVnpayReturn); // ❌ Đặt ở đây
  ```
- **Hạn chế & Lỗi tiềm ẩn của AI:**
  - *Xung đột định tuyến (Route Shadowing Bug):* Trong Express.js, route tham số động `/:orderCode` đặt trước sẽ khớp (match) với tất cả các chuỗi con phía sau. Khi VNPay redirect về `/api/v1/orders/vnpay-return`, Express hiểu nhầm `"vnpay-return"` là giá trị của `:orderCode` và gọi hàm `getOrderByCode`. Kết quả là người dùng bị chặn bởi middleware `protect` với lỗi `401 Unauthorized`.
- **Sinh viên đã phân tích, tái cấu trúc & hoàn thiện (Student Engineering Refactor):**
  - Đảo thứ tự định tuyến: Đặt route tĩnh `/vnpay-return` lên **trước** route động `/:orderCode`.
  - Phân quyền chính xác: Bỏ middleware `protect` ở route callback `/vnpay-return` vì đây là redirect công khai từ trình duyệt; sử dụng `optionalProtect` ở route tạo link thanh toán để khách vãng lai vẫn thanh toán được.
  - Viết bộ test `tests/unit/vnpay.test.js` kiểm chứng tính đúng đắn của toàn bộ luồng.

---

## IV. BẢNG ĐỐI CHIẾU TIÊU CHÍ RUBRIC KHOA CNTT (TỰ ĐÁNH GIÁ)

| Tiêu chí Rubric | Yêu cầu Mức 5 (Xuất sắc) | Kết quả đạt được thực tế trong Tuần 6 | Mức tự đánh giá |
| :--- | :--- | :--- | :---: |
| **TC2.1 (Kiến trúc)** | Modular rõ ràng, tách biệt tầng, xử lý concurrency an toàn. | Module thanh toán `VnpayService` tách biệt hoàn toàn; giữ tồn kho Atomic tại MongoDB Document level. | **Mức 5 (5.0/5.0 đ)** |
| **TC2.2 (Hoàn thiện SP)** | Chức năng cốt lõi ổn định, 0 lỗi blocker, responsive mượt mà. | Hoàn tất 100% luồng mua hàng B2C: Giỏ hàng ➔ Checkout ➔ Cổng VNPay ➔ Biên nhận thành công. | **Mức 4.8 (Chờ đồng bộ phân hệ nội bộ)** |
| **TC2.3 (Làm chủ AI)** | AI Usage Log đầy đủ, khớp commit Git; ghi nhận >= 5 lỗi/ảo giác tự sửa. | Ghi nhận 3 trường hợp điển hình: Checksum sai khoảng trắng, trùng `TxnRef`, Route Shadowing Express. | **Mức 5 (5.0/5.0 đ)** |
| **TC2.4 (Chất lượng code)** | 0 lỗi lint / 1000 dòng, không lộ secret, commit phân bổ đều. | 0 lỗi ESLint, khóa `VNPAY_HASH_SECRET` bảo mật qua `.env`, commit phân bổ chặt chẽ theo Git Flow. | **Mức 5 (5.0/5.0 đ)** |
| **TC2.5 (Kiểm thử PM)** | Coverage > 70%, 100% test pass ở CI cuối, kiểm thử đa tầng. | 17/17 Suites Passed (169 tests), bổ sung Unit Test HMAC-SHA512 VNPay với các kịch bản tamper proof. | **Mức 4.8/5.0 đ** |
| **TC2.6 (CI/CD)** | Pipeline chạy ổn định các chặng, tỷ lệ xanh >= 90%. | GitHub Actions CI kích hoạt và pass 100% khi merge PR #8 và PR #9. | **Mức 4.5/5.0 đ** |

---

## V. KẾ HOẠCH HÀNH ĐỘNG TUẦN 7 (26/10/2026 – 01/11/2026)

Trọng tâm của Tuần 7 là **"Kiểm toán toàn diện và Khắc phục triệt để độ lệch giữa Frontend và Backend (FE/BE Parity & Alignment)"** nhằm đưa toàn bộ hệ thống về trạng thái chạy dữ liệu thật 100%:
1. **Kiểm toán Phân hệ Super Admin:** Đồng bộ danh mục đa cấp động (`attributeKeys`), bộ biến thể sản phẩm SKU, quản lý kho tổng Trụ Sở Chính (BR-HQ), xuất kho / điều phối đơn hàng, và bảng BI Analytics.
2. **Kiểm toán Phân hệ Branch Manager:** Kiểm tra cơ chế Branch Scoping, luồng nhập lô Serial/IMEI, kiểm kê kho, và quy trình chuyển kho liên chi nhánh (Inter-branch stock transfer).
3. **Kiểm toán Phân hệ Nhân viên Quầy POS:** Kiểm tra Web POS bán hàng tại quầy, quét Barcode thiết bị, tra cứu tồn kho chéo đa chi nhánh, và lập phiếu tiếp nhận bảo hành e-Warranty.
4. **Kiểm toán Phân hệ Khách hàng / Storefront B2C:** Chuẩn hóa luồng đăng ký (auto-login), quên mật khẩu chuẩn H1, tìm kiếm gợi ý nhanh Auto-suggest (220ms), bộ lọc thuộc tính động (`DynamicFilterSidebar`), PDP cập nhật tồn kho realtime, và tra cứu bảo hành điện tử công khai.
5. **Đồng bộ hóa 4 bộ tài liệu đặc tả Use Case** trong `docs/use_cases/` để khớp hoàn toàn 100% với mã nguồn thực tế.
