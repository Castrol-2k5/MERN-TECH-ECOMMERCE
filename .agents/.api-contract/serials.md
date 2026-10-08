# Module Serials & e-Warranty (`/api/v1/serials`)

| Method | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/serials` | Truy vấn danh sách Serial/IMEI kèm bộ lọc (`branchId`, `productSkuId`, `productId`, `status`) và phân trang. Tự động áp dụng `scopeBranch` cho nhân viên chi nhánh. | `STAFF`, `BRANCH_MANAGER`, `SUPER_ADMIN` |
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
