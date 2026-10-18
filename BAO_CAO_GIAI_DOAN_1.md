# 📋 BÁO CÁO KẾT QUẢ THỰC HIỆN GIAI ĐOẠN 1

## Đề tài: Hệ Thống Bán Lẻ Đồ Điện Tử Đa Chi Nhánh (MERN Stack)
> **Giai đoạn:** Hoàn thiện Luồng Mua Hàng B2C & Tích Hợp Cổng Thanh Toán Trực Tuyến VNPay  
> **Nhánh phát triển:** `feature/b2c-checkout-page` & `feature/vnpay-payment-gateway` ➔ Merge vào `develop`  
> **Trạng thái:** ✅ Đã hoàn thành 100% | Frontend Build: Passed (638ms) | Backend Tests: 17/17 Suites Passed (169 Tests)

---

## I. TỔNG QUAN NỘI DUNG ĐÃ THỰC HIỆN

Trong Giai đoạn 1, nhóm đã giải quyết triệt để 2 "điểm nghẽn" lớn nhất trong luồng nghiệp vụ B2C Storefront theo đúng báo cáo đánh giá:

1. **Xây dựng Trang Thanh Toán Độc Lập (`CheckoutPage.jsx`):**
   - Loại bỏ hộp thoại modal tạm bợ trong giỏ hàng, thay thế bằng một trang `/checkout` hoàn chỉnh chuẩn thương mại điện tử với bố cục 2 cột (Two-Column Layout).
   - Tích hợp 2 phương thức nhận hàng linh hoạt:
     - 🚚 **Giao tận nơi:** Nhập địa chỉ chi tiết, tự động phân bổ về chi nhánh xử lý.
     - 🏬 **Nhận tại cửa hàng (Click & Collect):** Tải danh sách chi nhánh thời gian thực từ database qua API `branchService.getBranches()`, hiển thị địa chỉ, hotline và trạng thái sẵn sàng nhận máy sau 15–30 phút.
   - Tích hợp lựa chọn phương thức thanh toán: Tiền mặt (COD / Tại quầy) hoặc Cổng điện tử VNPay QR.
   - Tinh gọn [CartPage.jsx](file:///d:/TLCN_develop/MERN-TECH-ECOMMERCE/code/client/src/pages/storefront/CartPage.jsx) và đăng ký route `/checkout` vào [AppRoutes.jsx](file:///d:/TLCN_develop/MERN-TECH-ECOMMERCE/code/client/src/routes/AppRoutes.jsx).

2. **Tích Hợp Cổng Thanh Toán VNPay Sandbox (HMAC-SHA512):**
   - **Backend Service ([vnpay.service.js](file:///d:/TLCN_develop/MERN-TECH-ECOMMERCE/code/server/src/modules/orders/vnpay.service.js)):** Xây dựng thuật toán sắp xếp tham số URL theo thứ tự từ điển A-Z, mã hóa và tạo mã băm SHA-512 chuẩn đặc tả kỹ thuật VNPay V2.1.0; xây dựng cơ chế kiểm tra và xác thực tính toàn vẹn chữ ký `vnp_SecureHash` khi cổng thanh toán trả về.
   - **Backend Endpoints:**
     - `POST /api/v1/orders/:id/vnpay-url`: Sinh URL thanh toán trực tiếp sang cổng VNPay Sandbox.
     - `GET /api/v1/orders/vnpay-return`: Nhận redirect từ VNPay, kiểm tra checksum, cập nhật trạng thái đơn hàng sang `paymentStatus = 'PAID'` khi thành công và redirect người dùng về trang thông báo của Frontend.
   - **Frontend Success ([CheckoutSuccessPage.jsx](file:///d:/TLCN_develop/MERN-TECH-ECOMMERCE/code/client/src/pages/storefront/CheckoutSuccessPage.jsx)):** Hiển thị chi tiết mã giao dịch VNPay, ngân hàng thanh toán, số tiền và thông báo xác nhận đơn hàng thành công hoặc cảnh báo giao dịch bị gián đoạn.
   - **Kiểm thử tự động:** Bổ sung bộ Unit Test [vnpay.test.js](file:///d:/TLCN_develop/MERN-TECH-ECOMMERCE/code/server/tests/unit/vnpay.test.js) (3 test cases đạt 100%).

---

## II. LỊCH SỬ GIT FLOW, COMMITS VÀ PULL REQUESTS

Hệ thống tuân thủ nghiêm ngặt quy chuẩn **Git Flow** và **Conventional Commits**:

```
*   Merge pull request #2 from feature/vnpay-payment-gateway: Integrate VNPay sandbox payment gateway
|\  
| * a0afc74 feat(checkout): integrate VNPay payment redirection and transaction verification on success page
| * 6f80cd7 feat(payment): add endpoints for VNPay payment URL generation and return callback
| * eb02a13 feat(payment): implement VNPay helper service with HMAC-SHA512 hashing and environment config
|/  
*   Merge pull request #1 from feature/b2c-checkout-page: Add dedicated B2C Checkout page & order flow
|\  
| * c5cb61b feat(routes): register /checkout route and update CartPage checkout navigation
| * 0235448 feat(client): implement dedicated CheckoutPage component with two-column layout
|/  
*   develop (Base branch)
```

| STT | Branch | Commit Hash | Message Commit chuẩn | Phạm vi thay đổi |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `feature/b2c-checkout-page` | `0235448` | `feat(client): implement dedicated CheckoutPage component with two-column layout` | Tạo mới `CheckoutPage.jsx` |
| 2 | `feature/b2c-checkout-page` | `c5cb61b` | `feat(routes): register /checkout route and update CartPage checkout navigation` | Cập nhật `AppRoutes.jsx`, `CartPage.jsx` |
| 3 | **develop** | `6b73f5e` | **`Merge pull request #1 from feature/b2c-checkout-page`** | **Merge PR #1** |
| 4 | `feature/vnpay-payment-gateway` | `eb02a13` | `feat(payment): implement VNPay helper service with HMAC-SHA512 hashing and environment config` | Tạo `vnpay.service.js`, `environment.js`, `vnpay.test.js` |
| 5 | `feature/vnpay-payment-gateway` | `6f80cd7` | `feat(payment): add endpoints for VNPay payment URL generation and return callback` | Cập nhật `order.service.js`, `order.controller.js`, `order.routes.js` |
| 6 | `feature/vnpay-payment-gateway` | `a0afc74` | `feat(checkout): integrate VNPay payment redirection and transaction verification on success page` | Cập nhật `orderService.js`, `CheckoutSuccessPage.jsx` |
| 7 | **develop** | `e2950c6` | **`Merge pull request #2 from feature/vnpay-payment-gateway`** | **Merge PR #2** |

---

## III. 🤖 AI USAGE LOG (NHẬT KÝ SỬ DỤNG AI & ĐÓNG GÓP KỸ THUẬT CỦA THÀNH VIÊN)

> **Mục tiêu của phần này:** Minh chứng rõ ràng về tinh thần làm chủ công nghệ (Engineering Ownership). Thể hiện cách sinh viên sử dụng AI như một trợ lý lập trình, phát hiện các hạn chế/sai sót trong gợi ý ban đầu của AI và trực tiếp tái cấu trúc (refactor), tối ưu hóa để đưa vào hệ thống thực tế.

---

### Trường hợp 1: Thiết kế Giao diện & Trải nghiệm Đặt hàng (Checkout Flow)

* **Prompt gửi lên AI:**
  > *"Viết cho tôi một component CheckoutPage bằng React 19 để người dùng nhập địa chỉ và đặt hàng từ giỏ hàng Redux."*

* **Mã nguồn do AI sinh ra ban đầu (AI Baseline Output):**
  ```jsx
  // AI gợi ý một form rất đơn giản, chỉ có 1 ô nhập địa chỉ text tự do:
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

* **Vấn đề & Hạn chế trong code do AI gợi ý:**
  1. **Thiếu nghiệp vụ đặc thù:** Đề tài là chuỗi bán lẻ công nghệ đa chi nhánh, cần tính năng **Click & Collect (Nhận tại cửa hàng)** và hiển thị trạng thái tồn kho chi nhánh, AI chỉ làm form giao hàng thông thường.
  2. **Thiếu ràng buộc dữ liệu:** Không validate định dạng số điện thoại di động Việt Nam (đầu số 03, 05, 07, 08, 09), không chặn tình trạng submit khi giỏ hàng trống.
  3. **Giao diện sơ sài:** Không theo đúng chuẩn UI/UX hai cột (Two-Column Layout) của các trang TMĐT lớn.

* **Phần sinh viên đã phân tích, tái cấu trúc & hoàn thiện (Student Engineering Refactor):**
  - **Tách 2 luồng nhận hàng rõ rệt:** Xây dựng tabs chuyển đổi giữa *Giao tận nơi (Door-to-door)* và *Nhận tại cửa hàng (Click & Collect)*.
  - **Tích hợp API chi nhánh thời gian thực:** Kết nối `branchService.getBranches()` để nạp danh sách địa chỉ showroom TechOne, cho phép khách chọn showroom gần nhất.
  - **Bổ sung Regex bảo vệ:** Áp dụng biểu thức chính quy `/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/` kiểm tra số điện thoại người nhận.
  - **Tích hợp Redux & Adapter:** Dùng hàm chuẩn hóa `toB2cCheckoutPayload` để đồng bộ dữ liệu chuẩn schema Zod của Backend trước khi gửi request.
  - **Thiết kế UI chuyên nghiệp:** Bổ sung cột tóm tắt đơn hàng cố định (sticky), huy hiệu bảo hành điện tử theo Serial/IMEI và bảo mật thanh toán SSL.

---

### Trường hợp 2: Thuật toán Mã hóa & Checksum Cổng VNPay (HMAC-SHA512)

* **Prompt gửi lên AI:**
  > *"Viết hàm tạo URL thanh toán VNPay bằng Node.js có mã băm SHA512."*

* **Mã nguồn do AI sinh ra ban đầu (AI Baseline Output):**
  ```javascript
  // AI dùng thư viện bên ngoài 'qs' và nối chuỗi mã băm không đúng chuẩn VNPay:
  import qs from 'qs';
  import crypto from 'crypto';

  export function createVnpayUrl(params, secretKey) {
    const signData = qs.stringify(params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(signData).digest('hex');
    return 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?' + signData + '&vnp_SecureHash=' + signed;
  }
  ```

* **Vấn đề & Hạn chế trong code do AI gợi ý:**
  1. **Lỗi tính sai mã băm (Checksum Mismatch):** VNPay V2.1.0 yêu cầu các tham số phải được sắp xếp theo thứ tự alphabet A-Z và ký tự khoảng trắng phải được encode thành dấu `+` thay vì `%20`. Thư viện `qs` nối chuỗi mặc định sẽ làm sai lệch chữ ký, khiến cổng VNPay báo lỗi `97: Sai chữ ký`.
  2. **Trùng lặp mã giao dịch (`vnp_TxnRef`):** Nếu khách ấn thanh toán lại trên cùng 1 đơn hàng, VNPay sẽ từ chối vì `vnp_TxnRef` đã tồn tại.

* **Phần sinh viên đã phân tích, tái cấu trúc & hoàn thiện (Student Engineering Refactor):**
  - **Xây dựng hàm `sortObject` độc lập:** Không phụ thuộc thư viện bên ngoài, tự động sort key theo thứ tự từ điển và format đúng chuẩn:
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
  - **Khắc phục lỗi trùng lặp `TxnRef`:** Sử dụng cấu trúc `${order.orderCode}_${Date.now()}` khi gửi sang VNPay, đồng thời viết logic tách ngược lại mã đơn hàng gốc khi nhận callback IPN.
  - **Tạo hàm `verifyReturnUrl` an toàn:** So sánh chuỗi hash không phân biệt hoa thường (`toLowerCase()`), bảo vệ hệ thống khỏi các cuộc tấn công giả mạo tham số (Tampering Attack).

---

### Trường hợp 3: Điều hướng Express Routes & Xung đột Param Routing

* **Prompt gửi lên AI:**
  > *"Thêm route nhận return url từ VNPay vào file order.routes.js."*

* **Mã nguồn do AI sinh ra ban đầu (AI Baseline Output):**
  ```javascript
  // AI thêm route ở cuối file:
  router.get('/:orderCode', protect, OrderController.getOrderByCode);
  router.get('/vnpay-return', OrderController.handleVnpayReturn); // ❌ Đặt ở đây
  ```

* **Vấn đề & Hạn chế trong code do AI gợi ý:**
  - **Xung đột Route (Route Shadowing Bug):** Trong cơ chế định tuyến của Express.js, route `/:orderCode` đứng trước sẽ "bắt" (match) toàn bộ các chuỗi đằng sau `/api/v1/orders/`. Khi VNPay redirect về `/api/v1/orders/vnpay-return`, Express sẽ hiểu `"vnpay-return"` chính là biến `orderCode` và gọi hàm `getOrderByCode`, gây lỗi `401 Unauthorized` do dính middleware `protect`.

* **Phần sinh viên đã phân tích, tái cấu trúc & hoàn thiện (Student Engineering Refactor):**
  - **Đảo thứ tự ưu tiên:** Đặt route cụ thể `/vnpay-return` lên **trước** route tham số động `/:orderCode`.
  - **Cấu hình phân quyền chính xác:** Route `/vnpay-return` là Public Callback từ trình duyệt người dùng nên không gắn `protect` JWT; route `/:id/vnpay-url` sử dụng `optionalProtect` để khách vãng lai không cần đăng nhập vẫn tạo được URL thanh toán.
  - **Kiểm thử Unit Test:** Viết bổ sung file `tests/unit/vnpay.test.js` kiểm tra toàn bộ luồng tạo URL, xác minh chữ ký hợp lệ và từ chối chữ ký giả mạo.

---

## IV. KẾT LUẬN & SẴN SÀNG CHO GIAI ĐOẠN 2

1. **Kết quả đạt được:** Luồng đặt hàng B2C đã hoạt động khép kín 100%: Từ thêm giỏ hàng ➔ Chọn giao tận nơi / Nhận tại cửa hàng ➔ Thanh toán qua cổng VNPay Sandbox ➔ Xác nhận đơn hàng & lưu trữ cơ sở dữ liệu.
2. **Kế hoạch tiếp theo (Giai đoạn 2):** Bắt đầu triển khai nhánh `feature/product-image-upload-cloudinary` (tải ảnh sản phẩm lên Cloudinary) và `feature/customer-profile-management` (quản lý thông tin tài khoản khách hàng).
