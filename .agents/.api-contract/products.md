# Module Products (`/api/v1/products`) - Hybrid Dynamic Schema

| Method | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | Lấy danh sách sản phẩm phân trang (`page`, `limit`), tìm kiếm (`search`), khoảng giá (`minPrice`, `maxPrice`), sắp xếp (`sortBy`), và bộ lọc thông số động (`?ram=16GB&cpu=Intel i7`). | Public |
| `GET` | `/products/:slug` | Lấy chi tiết sản phẩm theo slug (kèm danh mục và cấu hình `attributeKeys`). | Public |
| `POST` | `/products` | Tạo sản phẩm mới kèm mảng `attributes`, `options` và `skus` (đối soát `INVALID_ATTRIBUTE_KEY`). | `SUPER_ADMIN` |
| `PUT` | `/products/:id` | Cập nhật thông tin sản phẩm, thuộc tính kỹ thuật hoặc biến thể SKUs. | `SUPER_ADMIN` |
| `DELETE` | `/products/:id` | Xóa mềm sản phẩm (`isActive: false`). | `SUPER_ADMIN` |
| `GET` | `/products/compare?ids=id1,id2` | So sánh thuộc tính kỹ thuật giữa 2 hoặc nhiều sản phẩm. | Public |
