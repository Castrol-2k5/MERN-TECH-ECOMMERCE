# Module Branches (`/api/v1/branches`)

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
