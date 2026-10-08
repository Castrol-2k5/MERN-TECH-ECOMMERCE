# Module Warranty (`/api/v1/warranty`)

| Method | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `POST` | `/warranty` | Tiếp nhận thiết bị bảo hành. Kiểm tra mã Serial tồn tại và đã bán (`SOLD`). Sinh mã phiếu `ticketCode` (dạng `RMA-YYYYMMDD-XXXX`), lưu thông tin khách hàng, chuyển Serial sang `WARRANTY`. | `STAFF`, `BRANCH_MANAGER`, `SUPER_ADMIN` |
| `GET` | `/warranty` | Tra cứu danh sách phiếu bảo hành kèm bộ lọc (`branchId`, `status`, `serialNumber`, `ticketCode`) và phân trang. Tự động áp dụng `scopeBranch` cho nhân viên chi nhánh. | `STAFF`, `BRANCH_MANAGER`, `SUPER_ADMIN` |

#### Request Body mẫu: `POST /api/v1/warranty`
```json
{
  "serialNumber": "IP15-SOLD-SN-001",
  "issueDescription": "Màn hình không lên nguồn sau va chạm nhẹ, sạc không nhận tín hiệu",
  "customerInfo": {
    "fullName": "Nguyễn Văn Khách",
    "phone": "0912345678"
  },
  "notes": "Máy có vết xước nhẹ ở viền góc dưới bên phải"
}
```

#### Response thành công mẫu (HTTP 201):
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Tiếp nhận thiết bị bảo hành thành công",
  "data": {
    "_id": "670c1f2e1234567890abc999",
    "ticketCode": "RMA-20261003-ABCD",
    "serialNumber": "IP15-SOLD-SN-001",
    "productId": "650c1f2e1234567890abc001",
    "customerId": "650c1f2e1234567890abc111",
    "customerInfo": {
      "fullName": "Nguyễn Văn Khách",
      "phone": "0912345678"
    },
    "branchId": "650c1f2e1234567890abcdef",
    "staffId": "650c1f2e1234567890abc222",
    "issueDescription": "Màn hình không lên nguồn sau va chạm nhẹ, sạc không nhận tín hiệu",
    "status": "RECEIVED",
    "notes": "Máy có vết xước nhẹ ở viền góc dưới bên phải",
    "createdAt": "2026-10-03T11:15:00.000Z",
    "updatedAt": "2026-10-03T11:15:00.000Z"
  }
}
```
