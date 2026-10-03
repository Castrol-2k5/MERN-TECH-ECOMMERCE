# Module Inventory (`/api/v1/inventory`)

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
