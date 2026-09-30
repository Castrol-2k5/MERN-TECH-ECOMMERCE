# 🔗 API CONTRACTS (FRONTEND & BACKEND CONTRACT)

* **Base URL:** `/api/v1`
* **Data Format:** Standard JSON Format
* **Auth Header:** `Authorization: Bearer <JWT_TOKEN>`

---

## 1. CẤU TRÚC PHẢN HỒI CHUẨN (STANDARD RESPONSE FORMAT)

### 1.1. Phản hồi Thành công (Success)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Thao tác thành công",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

### 1.2. Phản hồi Lỗi (Error)

```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "INVALID_SERIAL_STATUS",
  "message": "Mã Serial/IMEI này đã được bán hoặc không khả dụng tại chi nhánh.",
  "errors": []
}
```

---

## 2. DANH SÁCH API ENDPOINTS CHI TIẾT

### 2.1. Module Auth (`/api/v1/auth`)

| Method | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Đăng ký tài khoản Khách hàng B2C (mặc định role `CUSTOMER`). Cấp Access Token (15 phút) & Set-Cookie `refreshToken` (14 ngày). | Public (Rate limit 5/15m) |
| `POST` | `/auth/login` | Đăng nhập bằng Email/SĐT + Password. Phân hóa thời hạn Refresh Token: B2C (14 ngày) vs Nhân sự POS/Quản lý (8 giờ). | Public (Rate limit 5/15m) |
| `POST` | `/auth/refresh-token` | Đọc Refresh Token từ HttpOnly Cookie hoặc body, xoay vòng token (Token Rotation) và cấp Access Token mới. | Public |
| `POST` | `/auth/logout` | Đăng xuất phiên làm việc hiện tại, xóa bản ghi trong `user_sessions` và clear HttpOnly cookie. | Public |
| `POST` | `/auth/logout-all` | Thu hồi toàn bộ phiên làm việc của người dùng trên tất cả thiết bị (Global Revoke). | `CUSTOMER`, `STAFF`, `BRANCH_MANAGER`, `SUPER_ADMIN` |
| `GET` | `/auth/me` | Lấy thông tin cá nhân và chi nhánh làm việc của tài khoản hiện tại. | Authenticated |

---

### 2.2. Module Branches (`/api/v1/branches`)

| Method | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/branches/nearby?lng=...&lat=...&distance=...` | Tìm kiếm các chi nhánh gần nhất theo tọa độ GPS bằng toán tử `$near` của MongoDB (mặc định bán kính 10,000m). | Public |
| `GET` | `/branches` | Lấy danh sách tất cả các chi nhánh đang hoạt động (`isActive: true`). Hỗ trợ query `?search=...`. | Public |
| `GET` | `/branches/:id` | Xem chi tiết thông tin 1 chi nhánh theo ID. | Public |
| `POST` | `/branches` | Khởi tạo chi nhánh mới kèm tọa độ địa lý GeoJSON Point `[lng, lat]`. | `SUPER_ADMIN` |
| `PUT` | `/branches/:id` | Cập nhật thông tin chi nhánh (tên, địa chỉ, hotline, tọa độ GPS). | `SUPER_ADMIN` |
| `DELETE` | `/branches/:id` | Xóa mềm chi nhánh (`isActive: false`). | `SUPER_ADMIN` |

#### Request Body mẫu: `POST /api/v1/branches`
```json
{
  "branchCode": "BR-Q1-FLAGSHIP",
  "name": "TechStore Chi Nhánh Quận 1 Flagship",
  "address": "123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM",
  "phone": "0912345678",
  "location": {
    "type": "Point",
    "coordinates": [106.6983, 10.7719]
  }
}
```

---

### 2.3. Module Categories (`/api/v1/categories`)

| Method | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | Lấy danh sách phẳng tất cả danh mục active. | Public |
| `GET` | `/categories?tree=true` | Lấy toàn bộ cây danh mục phân cấp đa tầng (Hierarchical Categories lồng trong mảng `children`). | Public |
| `GET` | `/categories/:slug` | Lấy chi tiết danh mục theo slug (kèm danh sách `attributeKeys` để UI render bộ lọc động). | Public |
| `POST` | `/categories` | Tạo danh mục mới (hỗ trợ `parentId` tạo danh mục con, tự động sinh `slug` chuẩn SEO và lưu trữ `attributeKeys`). | `SUPER_ADMIN` |
| `PUT` | `/categories/:id` | Cập nhật tên, danh mục cha hoặc cấu hình lại `attributeKeys`. | `SUPER_ADMIN` |
| `DELETE` | `/categories/:id` | Xóa mềm danh mục (`isActive: false`). | `SUPER_ADMIN` |

#### Request Body mẫu: `POST /api/v1/categories`
```json
{
  "name": "Laptop Gaming",
  "parentId": "650c1f2e1234567890abcdef",
  "attributeKeys": ["cpu", "ram", "vga", "refresh_rate", "storage"]
}
```

---

### 2.4. Module Products (`/api/v1/products`) - Hybrid Dynamic Schema

| Method | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | Lấy danh sách sản phẩm phân trang (`page`, `limit`), tìm kiếm (`search`), khoảng giá (`minPrice`, `maxPrice`), sắp xếp (`sortBy`), và bộ lọc thông số động (`?ram=16GB&cpu=Intel i7`). | Public |
| `GET` | `/products/:slug` | Lấy chi tiết sản phẩm theo slug (kèm danh mục và cấu hình `attributeKeys`). | Public |
| `POST` | `/products` | Tạo sản phẩm mới kèm mảng `attributes`, `options` và `skus` (đối soát `INVALID_ATTRIBUTE_KEY`). | `SUPER_ADMIN` |
| `PUT` | `/products/:id` | Cập nhật thông tin sản phẩm, thuộc tính kỹ thuật hoặc biến thể SKUs. | `SUPER_ADMIN` |
| `DELETE` | `/products/:id` | Xóa mềm sản phẩm (`isActive: false`). | `SUPER_ADMIN` |
| `GET` | `/products/compare?ids=id1,id2` | So sánh thuộc tính kỹ thuật giữa 2 hoặc nhiều sản phẩm. | Public |

---

### 2.5. Module Inventory (`/api/v1/inventory`)

| Method | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/inventory/branch/:branchId` | Xem tồn kho theo chi nhánh (sử dụng `.lean()` và populate `productId`, `skus`). Tự động áp dụng `scopeBranch` (nhân sự chỉ xem chi nhánh mình; `SUPER_ADMIN` xem xuyên chuỗi). | `STAFF`, `BRANCH_MANAGER`, `SUPER_ADMIN` |
| `GET` | `/inventory/sku/:productSkuId` | Lấy danh sách các chi nhánh còn hàng của 1 SKU cụ thể (phục vụ tính năng Storefront B2C "Tìm chi nhánh còn hàng"). | Public |
| `POST` | `/inventory/adjust` | Điều chỉnh tồn kho thủ công (kiểm kê kho). Áp dụng toán tử Atomic `$inc` kèm điều kiện `{ quantity: { $gte: qty } }` chống Race Condition (Zero Overselling). | `SUPER_ADMIN`, `BRANCH_MANAGER` (tại chi nhánh mình) |

#### Request Body mẫu: `POST /api/v1/inventory/adjust`
```json
{
  "branchId": "650c1f2e1234567890abcdef",
  "productId": "650c1f2e1234567890abc001",
  "productSkuId": "650c1f2e1234567890abc002",
  "quantityDelta": -2,
  "reason": "Xuất điều chuyển kho hoặc hao hụt kiểm kê"
}
```

---

### 2.6. Module Serials & e-Warranty (`/api/v1/serials`)

| Method | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `POST` | `/serials/import` | Nhập lô hàng Serial/IMEI mới vào kho. Atomic insert bản ghi Serial (`IN_STOCK`) và `$inc` số lượng tương ứng trong `branch_inventories`. Báo lỗi nếu trùng mã. | `SUPER_ADMIN`, `BRANCH_MANAGER` (tại chi nhánh mình) |
| `GET` | `/serials/scan/:serialNumber` | Quét mã vạch/QR Serial tại quầy POS. Xác thực Serial tồn tại, ở trạng thái `IN_STOCK`, và thuộc đúng chi nhánh của nhân sự POS. Trả về thông tin sản phẩm và giá SKU ($T_{response} < 100ms$). | `STAFF`, `BRANCH_MANAGER`, `SUPER_ADMIN` |
| `GET` | `/serials/verify/:serialNumber` | Tra cứu bảo hành điện tử công khai (e-Warranty). Trả về tên sản phẩm, SKU, ngày bán, hạn bảo hành và cờ `isExpired`. | Public |

#### Request Body mẫu: `POST /api/v1/serials/import`
```json
{
  "branchId": "650c1f2e1234567890abcdef",
  "productId": "650c1f2e1234567890abc001",
  "productSkuId": "650c1f2e1234567890abc002",
  "serials": ["C02G1234MD6R", "C02G1235MD6R", "C02G1236MD6R"]
}
```

---

### 2.7. Module Web POS & Orders (`/api/v1/orders`)

| Method | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `POST` | `/orders/pos/checkout` | Thanh toán đơn hàng tại quầy POS. Xác thực tính khả dụng và chi nhánh của Serial, trừ kho Atomic `$inc`, chuyển trạng thái Serial `IN_STOCK` ➔ `SOLD`, tự động kích hoạt bảo hành 12 tháng (`warrantyEndDate`). | `STAFF`, `BRANCH_MANAGER`, `SUPER_ADMIN` |
| `POST` | `/orders/b2c/checkout` | Khách hàng thực hiện đặt hàng trực tuyến B2C (hỗ trợ cả tài khoản `CUSTOMER` và Khách vãng lai). Trừ kho trước (Atomic Virtual Holding) với điều kiện `{ quantity: { $gte: qty } }`, khởi tạo đơn `PENDING`. | Public / Authenticated |
| `GET` | `/orders/my-orders` | Khách hàng xem lịch sử đơn hàng của mình (phân trang `page`, `limit`). | `CUSTOMER`, `SUPER_ADMIN` |
| `GET` | `/orders/branch` | Quản lý/Thu ngân xem danh sách đơn hàng của chi nhánh mình (áp dụng `scopeBranch`). `SUPER_ADMIN` xem xuyên chuỗi hoặc lọc theo `?branchId=...`. | `STAFF`, `BRANCH_MANAGER`, `SUPER_ADMIN` |
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

---

## 3. QUY ƯỚC API

### 3.1. Authentication
Các API yêu cầu xác thực phải gửi JWT Token thông qua HTTP Header:
```http
Authorization: Bearer <JWT_TOKEN>
```

### 3.2. HTTP Status Code

| Status Code | Ý nghĩa |
| :---: | :--- |
| `200` | Request thành công (OK) |
| `201` | Tạo resource thành công (Created) |
| `400` | Request không hợp lệ / Lỗi nghiệp vụ / Lỗi DTO (Bad Request) |
| `401` | Chưa xác thực hoặc JWT không hợp lệ / Hết hạn (Unauthorized) |
| `403` | Không có quyền truy cập / Tài khoản bị khóa (Forbidden) |
| `404` | Không tìm thấy resource (Not Found) |
| `409` | Xung đột dữ liệu / Trùng mã khóa duy nhất (Conflict) |
| `429` | Quá nhiều yêu cầu trong thời gian ngắn (Too Many Requests) |
| `500` | Lỗi máy chủ nội bộ (Internal Server Error) |

### 3.3. Bảng Error Code Chuẩn Hóa

| Error Code | Mô tả nghiệp vụ |
| :--- | :--- |
| `VALIDATION_ERROR` | Dữ liệu đầu vào sai định dạng hoặc không vượt qua kiểm tra Zod DTO |
| `USER_EXISTS` | Email hoặc Số điện thoại đã được đăng ký trong hệ thống |
| `INVALID_CREDENTIALS` | Tài khoản hoặc mật khẩu không chính xác |
| `ACCOUNT_LOCKED` | Tài khoản người dùng đã bị khóa (`isActive: false`) |
| `UNAUTHORIZED` | Không có token truy cập hoặc token không hợp lệ |
| `TOKEN_EXPIRED` | Access Token đã hết hạn |
| `FORBIDDEN` | Người dùng không đủ quyền hạn thực hiện thao tác |
| `BRANCH_EXISTS` | Mã chi nhánh (`branchCode`) đã tồn tại trong hệ thống |
| `BRANCH_NOT_FOUND` | Không tìm thấy chi nhánh yêu cầu |
| `BRANCH_NOT_ASSIGNED` | Tài khoản nhân sự chưa được gắn với chi nhánh nào |
| `CROSS_BRANCH_ACCESS_DENIED` | Nhân viên cố tình thao tác chéo chi nhánh |
| `CATEGORY_EXISTS` | Tên hoặc slug danh mục đã được sử dụng |
| `CATEGORY_NOT_FOUND` | Không tìm thấy danh mục yêu cầu |
| `PARENT_CATEGORY_NOT_FOUND` | Danh mục cha không tồn tại |
| `INVALID_PARENT_CATEGORY` | Danh mục không thể tự chọn chính mình làm danh mục cha |
| `INVALID_SERIAL_STATUS` | Mã Serial/IMEI không ở trạng thái khả dụng để bán |
| `SERIAL_NOT_FOUND` | Không tìm thấy mã Serial/IMEI trong hệ thống |
| `PRODUCT_EXISTS` | Tên hoặc slug sản phẩm đã tồn tại trong hệ thống |
| `PRODUCT_NOT_FOUND` | Không tìm thấy sản phẩm yêu cầu |
| `INVALID_ATTRIBUTE_KEY` | Thuộc tính kỹ thuật không thuộc danh sách attributeKeys chuẩn của danh mục |
| `DUPLICATE_SKU_CODE` | Trùng lặp mã SKU trong cùng một sản phẩm |
| `PRODUCT_OUT_OF_STOCK` | Biến thể SKU đã hết hàng tại chi nhánh chỉ định |
| `TOO_MANY_REQUESTS` | Vượt ngưỡng giới hạn tần suất yêu cầu (Rate Limit) |
