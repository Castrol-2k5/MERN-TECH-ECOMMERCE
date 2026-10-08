# Module Web POS & Orders (`/api/v1/orders`)

| Method | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `POST` | `/orders/pos/checkout` | Thanh toán đơn hàng tại quầy POS. Server tự tính tiền (không bắt buộc client gửi subtotal). Hỗ trợ khách vãng lai (customerInfo optional). Kiểm tra bắt buộc gán đủ Serial nếu SKU có `isSerialManaged` (ném `SERIAL_COUNT_MISMATCH` 400 nếu thiếu). Trừ kho Atomic `$inc`, chuyển Serial `IN_STOCK` ➔ `SOLD`, tự động kích hoạt bảo hành 12 tháng. | `STAFF`, `BRANCH_MANAGER`, `SUPER_ADMIN` |
| `POST` | `/orders/b2c/checkout` | Khách hàng thực hiện đặt hàng trực tuyến B2C (hỗ trợ tài khoản `CUSTOMER` và Khách vãng lai). Hỗ trợ phương thức `CASH` (COD), `VNPAY`, `STRIPE`. Trừ kho trước (Atomic Virtual Holding) với điều kiện `{ quantity: { $gte: qty } }`, khởi tạo đơn `PENDING`. | Public / Authenticated |
| `GET` | `/orders/my-orders` | Khách hàng xem lịch sử đơn hàng của mình (phân trang `page`, `limit`). | `CUSTOMER`, `SUPER_ADMIN` |
| `GET` | `/orders/branch` | Quản lý/Thu ngân xem danh sách đơn hàng của chi nhánh mình (áp dụng `scopeBranch`). `SUPER_ADMIN` xem xuyên chuỗi hoặc lọc theo `?branchId=...`. | `STAFF`, `BRANCH_MANAGER`, `SUPER_ADMIN` |
| `PATCH` | `/orders/:id/allocate` | Điều phối đơn hàng B2C sang chi nhánh xử lý. Cập nhật `branchId` và chuyển trạng thái đơn sang `PROCESSING`. | `SUPER_ADMIN`, `BRANCH_MANAGER` |
| `PATCH` | `/orders/:id/dispatch` | Đóng gói đơn hàng và gán danh sách Serial/IMEI. Cập nhật trạng thái Serial sang `SOLD` và kích hoạt bảo hành điện tử e-Warranty. | `STAFF`, `BRANCH_MANAGER`, `SUPER_ADMIN` |
| `GET` | `/orders/:orderCode` | Xem chi tiết đơn hàng theo mã đơn (kèm danh sách Serial và bảo hành). Bảo mật theo vai trò (Khách xem đơn mình, Nhân sự xem đơn chi nhánh mình, Admin xem toàn bộ). | Authenticated |


#### Request Body mẫu: `POST /api/v1/orders/pos/checkout`
```json
{
  "branchId": "650c1f2e1234567890abcdef",
  "items": [
    {
      "productId": "650c1f2e1234567890abc001",
      "productSkuId": "650c1f2e1234567890abc002",
      "quantity": 1,
      "serialsAssigned": ["IPAD-SER-001"]
    }
  ],
  "paymentMethod": "CASH",
  "customerInfo": {
    "fullName": "Nguyen Van Khach",
    "phone": "0988111222"
  }
}
```

#### Request Body mẫu: `POST /api/v1/orders/b2c/checkout`
```json
{
  "branchId": "650c1f2e1234567890abcdef",
  "items": [
    {
      "productId": "650c1f2e1234567890abc001",
      "productSkuId": "650c1f2e1234567890abc002",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "fullName": "Tran Thi B",
    "phone": "0987654321",
    "address": "123 Nguyen Hue, Quan 1, TP.HCM"
  },
  "paymentMethod": "VNPAY"
}
```
