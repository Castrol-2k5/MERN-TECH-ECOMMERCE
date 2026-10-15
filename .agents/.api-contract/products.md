# Module Products (`/api/v1/products`) - Hybrid Dynamic Schema

| Method | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | Lấy danh sách sản phẩm phân trang (`page`, `limit`), tìm kiếm (`search`), khoảng giá (`minPrice`, `maxPrice`), sắp xếp (`sortBy`: `'price_asc' \| 'price_desc' \| 'newest' \| 'oldest' \| 'popular'`), và bộ lọc thông số động (`?ram=16GB&cpu=Intel i7`). Metadata trả về kèm `availableBrands: [{ brand, count }]` truy vấn động qua MongoDB Aggregation. | Public |
| `GET` | `/products/:slug` | Lấy chi tiết sản phẩm theo slug (kèm danh mục và cấu hình `attributeKeys`). | Public |
| `POST` | `/products` | Tạo sản phẩm mới kèm mảng `attributes`, `options` và `skus` (đối soát `INVALID_ATTRIBUTE_KEY`). | `SUPER_ADMIN` |
| `PUT` | `/products/:id` | Cập nhật thông tin sản phẩm, thuộc tính kỹ thuật hoặc biến thể SKUs. | `SUPER_ADMIN` |
| `DELETE` | `/products/:id` | Xóa mềm sản phẩm (`isActive: false`). | `SUPER_ADMIN` |
| `GET` | `/products/compare?ids=id1,id2` | So sánh thuộc tính kỹ thuật giữa 2 hoặc nhiều sản phẩm. | Public |

### Chi tiết tham số `GET /api/v1/products`:
- **Query Parameters:**
  - `page`: Số trang (mặc định: `1`).
  - `limit`: Số lượng sản phẩm mỗi trang (mặc định: `12`).
  - `category`: Lọc theo Danh mục (ObjectId hoặc Slug).
  - `brand`: Lọc theo Thương hiệu (case-insensitive).
  - `minPrice`, `maxPrice`: Lọc theo khoảng giá khuyến mãi SKU (`skus.salePrice`).
  - `search`: Tìm kiếm từ khóa trên tên sản phẩm (`name`) hoặc thương hiệu (`brand`).
  - `sortBy`: Enum `['price_asc', 'price_desc', 'newest', 'oldest', 'popular']` (mặc định: `'newest'`). Giá trị `'popular'` sắp xếp theo độ phổ biến / sản phẩm bán chạy (fallback `{ createdAt: -1 }`).
  - Dynamic Attributes: Các tham số tự do như `?ram=16GB&cpu=Intel i7` lọc trực tiếp mảng `attributes` theo cặp `{ key, value }`.
- **Category Hierarchy Filter (Cascading Query):**
  - Khi truyền `category` (slug hoặc ObjectId), backend tự động duyệt đệ quy toàn bộ cây phân cấp danh mục con (`descendantCategoryIds`) để lọc sản phẩm bằng `$in: [targetCategory._id, ...childIds]`. Nhờ đó danh mục cha (VD: Laptop) luôn bao gồm sản phẩm của danh mục con (VD: Laptop Gaming) và facets `availableBrands` tính gộp chính xác.
- **Response Data & Meta:**
  - `data.products`: Danh sách sản phẩm thỏa mãn điều kiện.
  - `data.availableBrands` & `meta.availableBrands`: Danh sách mảng facets thương hiệu thực tế đang có sản phẩm `isActive: true` trong danh mục kèm số đếm:
    ```json
    [
      { "brand": "Apple", "count": 12 },
      { "brand": "ASUS", "count": 8 },
      { "brand": "Lenovo", "count": 5 }
    ]
    ```
