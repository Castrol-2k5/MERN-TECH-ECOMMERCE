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

## 2. DANH SÁCH API ENDPOINTS CHÍNH

### 2.1. Module Auth (`/api/v1/auth`)

| Method | Endpoint         | Mô tả                                                | Quyền         |
| ------ | ---------------- | ---------------------------------------------------- | ------------- |
| `POST` | `/auth/login`    | Đăng nhập, trả về JWT Token và thông tin Role/Branch | Public        |
| `POST` | `/auth/register` | Đăng ký tài khoản Khách hàng B2C                     | Public        |
| `GET`  | `/auth/me`       | Lấy thông tin phiên làm việc hiện tại                | Authenticated |

---

### 2.2. Module Products (`/api/v1/products`)

| Method | Endpoint                        | Mô tả                                                                                            | Quyền         |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------------------ | ------------- |
| `GET`  | `/products`                     | Lấy danh sách sản phẩm, hỗ trợ lọc theo `categoryId`, `branchId` và thuộc tính động `attributes` | Public        |
| `GET`  | `/products/:slug`               | Lấy chi tiết sản phẩm kèm thông tin tồn kho theo từng chi nhánh                                  | Public        |
| `POST` | `/products`                     | Tạo sản phẩm mới kèm thuộc tính động                                                             | `SUPER_ADMIN` |
| `GET`  | `/products/compare?ids=id1,id2` | So sánh thuộc tính kỹ thuật giữa 2 hoặc nhiều sản phẩm                                           | Public        |

---

### 2.3. Module Web POS & Orders (`/api/v1/orders`)

#### POS Checkout

**Endpoint:**

```http
POST /orders/pos/checkout
```

**Quyền:** `STAFF`, `BRANCH_MANAGER`

**Mô tả:** Thanh toán đơn hàng tại quầy POS.

**Request Body:**

```json
{
  "branchId": "650c1f2e...",
  "items": [
    {
      "productId": "650c2a1b...",
      "quantity": 1,
      "serials": [
        "SN-LAPTOP-001"
      ]
    }
  ],
  "paymentMethod": "CASH"
}
```

#### B2C Checkout

**Endpoint:**

```http
POST /orders/b2c/checkout
```

**Quyền:** `CUSTOMER`

**Mô tả:** Khách hàng thực hiện đặt hàng thông qua B2C Web.

---

### 2.4. Module Serials & e-Warranty (`/api/v1/serials`)

| Method | Endpoint                                   | Mô tả                                                                | Quyền                           |
| ------ | ------------------------------------------ | -------------------------------------------------------------------- | ------------------------------- |
| `GET`  | `/serials/verify/:serialNumber`            | Tra cứu hạn và lịch sử bảo hành điện tử công khai qua mã Serial/IMEI | Public                          |
| `GET`  | `/serials/scan/:serialNumber?branchId=xxx` | Quét mã Serial/IMEI tại quầy POS để kiểm tra trạng thái `IN_STOCK`   | `STAFF`                         |
| `POST` | `/serials/import`                          | Nhập danh sách Serial/IMEI mới vào kho                               | `SUPER_ADMIN`, `BRANCH_MANAGER` |

---

## 3. QUY ƯỚC API

### 3.1. Authentication

Các API yêu cầu xác thực phải gửi JWT Token thông qua HTTP Header:

```http
Authorization: Bearer <JWT_TOKEN>
```

### 3.2. HTTP Status Code

| Status Code | Ý nghĩa                                          |
| ----------: | ------------------------------------------------ |
|       `200` | Request thành công                               |
|       `201` | Tạo resource thành công                          |
|       `400` | Request không hợp lệ                             |
|       `401` | Chưa xác thực hoặc JWT không hợp lệ              |
|       `403` | Không có quyền truy cập                          |
|       `404` | Không tìm thấy resource                          |
|       `409` | Xung đột dữ liệu, ví dụ Serial/IMEI hoặc tồn kho |
|       `500` | Lỗi máy chủ                                      |

### 3.3. Error Code

API sử dụng trường `errorCode` để Frontend có thể xác định chính xác loại lỗi nghiệp vụ.

Ví dụ:

```json
{
  "success": false,
  "statusCode": 409,
  "errorCode": "INVALID_SERIAL_STATUS",
  "message": "Mã Serial/IMEI này đã được bán hoặc không khả dụng tại chi nhánh.",
  "errors": []
}
```

Một số `errorCode` dự kiến:

* `INVALID_SERIAL_STATUS`
* `SERIAL_NOT_FOUND`
* `PRODUCT_OUT_OF_STOCK`
* `BRANCH_NOT_FOUND`
* `UNAUTHORIZED`
* `FORBIDDEN`
* `INVALID_REQUEST`
* `ORDER_NOT_FOUND`
* `PAYMENT_FAILED`
