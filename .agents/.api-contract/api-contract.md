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

## 2. DANH SÁCH MODULE & ENDPOINTS

Chi tiết endpoint của từng module nằm trong file riêng (bảng `| Method | Endpoint | Mô tả | Quyền |`):

| Module | Prefix | File chi tiết |
| :--- | :--- | :--- |
| Auth | `/api/v1/auth` | [auth.md](./auth.md) |
| Branches | `/api/v1/branches` | [branches.md](./branches.md) |
| Categories | `/api/v1/categories` | [categories.md](./categories.md) |
| Products | `/api/v1/products` | [products.md](./products.md) |
| Inventory | `/api/v1/inventory` | [inventory.md](./inventory.md) |
| Serials & e-Warranty | `/api/v1/serials` | [serials.md](./serials.md) |
| Web POS & Orders | `/api/v1/orders` | [orders.md](./orders.md) |
| Warranty Tickets | `/api/v1/warranty` | [warranty.md](./warranty.md) |


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
