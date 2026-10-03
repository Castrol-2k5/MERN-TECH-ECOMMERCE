# Module Categories (`/api/v1/categories`)

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
