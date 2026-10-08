# 🧠 PHÂN TÍCH LOGIC XỬ LÝ TRÊN CLIENT (FRONTEND)

> Phạm vi: `code/client/src`. Mục tiêu: xác định client có xử lý logic nghiệp vụ hay chỉ hiển thị, để dồn về backend khi cần.
> Kết luận chung: **Client KHÔNG thuần hiển thị.** Có logic nghiệp vụ nằm ở client (tính tiền POS, lọc/sắp xếp sản phẩm, chuẩn hóa dữ liệu, kiểm tra serial, mock data...). Chi tiết bên dưới.

> [!NOTE]
> Đã đọc kỹ: services, store slices, hooks, axiosClient, `PosPage`, `CartPage`, `CategoryPage`, `StockTransferPage`, `OrderDispatchPage`, `SerialImportPage`, `AdminBranchesUsersPage`, `AdminProductsPage` (phần đầu), `LoginForm`, `RegisterForm`, `SerialParserTextarea` (phần đầu).
> Chưa đọc hết: `PosCheckoutPanel`, `ProductDetailPage`, `DynamicAttributesForm`, `SkuVariantBuilder`, `CompareMatrixTable`, các modal RMA/Invoice, `analytics/*`. Nên rà lại nếu cần độ phủ 100%.

---

## 1. Tóm tắt mức độ rủi ro

| # | Logic ở client | Mức độ | Nên chuyển về backend? |
| :-: | :--- | :---: | :--- |
| 1 | Tính tổng tiền POS (subtotal, VAT 10%, discount, tiền thối) | 🔴 Cao | Có – server phải tính lại và đối soát |
| 2 | Giá `unitPrice` do client gửi lên khi checkout B2C | 🔴 Cao | Có – server lấy giá từ DB, bỏ qua giá client |
| 3 | `branchId` POS hard-code | 🔴 Cao | Có – lấy từ `req.user.branchId` |
| 4 | Lọc + sắp xếp sản phẩm ở `CategoryPage` | 🟠 Trung bình | Có – dùng query param của `GET /products` |
| 5 | Chuẩn hóa dữ liệu (`normalizeProduct`...) kèm giá trị mặc định bịa | 🟠 Trung bình | Một phần – chuẩn hóa response ở server |
| 6 | Tính tồn kho/trạng thái/low-stock ở client | 🟠 Trung bình | Có – server trả sẵn `status` |
| 7 | Hiển thị bảo hành: `isExpired`, `daysRemaining`, nhãn | 🟡 Thấp | Nên – server trả sẵn |
| 8 | Validate form (login/register/serial/transfer) | 🟢 Hợp lý | Giữ ở client (UX), server vẫn phải validate |
| 9 | Phân quyền route/điều hướng theo role | 🟢 Hợp lý | Giữ (UX), quyền thật do backend |
| 10 | Giỏ hàng B2C lưu `localStorage` | 🟢 Hợp lý | Giữ |
| 11 | Mock data / fallback khi API lỗi | 🟠 Trung bình | Nên loại khỏi production |

---

## 2. Chi tiết logic nghiệp vụ nằm ở client

### 2.1. Tính tiền Web POS (🔴)
- **File:** `store/slices/posCartSlice.js` → `selectPosCartTotals`.
- **Logic:**
  - `subtotal = Σ price × quantity`
  - `tax = round((subtotal − discount) × 0.1)` (VAT 10% hard-code)
  - `total = max(0, subtotal − discount + tax)`
  - `change = max(0, customerPaid − total)`
- **Vấn đề:** `PosPage.handleCheckout` gửi `subtotal`, `discount`, `tax`, `totalAmount`, `finalAmount`, `customerPaid`, `change` lên `POST /orders/pos/checkout`. Nếu server tin các giá trị này thì có thể bị giả mạo.
- **Đề xuất:** server tự tính từ giá SKU trong DB; client chỉ gửi `items`, `discount`, `customerPaid`, `paymentMethod`.

### 2.2. Giá do client gửi khi đặt hàng B2C (🔴)
- **File:** `pages/storefront/CartPage.jsx` → `handleCheckoutSubmit`.
- Payload `items[].unitPrice = it.price` lấy từ giỏ (localStorage) → có thể bị sửa.
- `cartSlice` cũng tự tính `totalQuantity`, `totalAmount` từ giá lưu ở localStorage.
- **Đề xuất:** server bỏ qua `unitPrice`, tự tra giá/khuyến mãi theo `productSkuId`.

### 2.3. Dữ liệu hard-code ảnh hưởng nghiệp vụ (🔴)
- `PosPage`: `branchId: '65f0a1000000000000000001'` hard-code khi checkout POS.
- `inventoryService.getBranchInventory`: `branchId` mặc định `'65f0a1000000000000000001'`.
- `CartPage`: thông tin khách mặc định (`'Hoàng Khách Hàng'`, `0909000005`, địa chỉ cố định).
- `normalizeBranchInventoryItem`: `shelfLocation = 'Kệ A-01'`, `quantityReserved = 0`, `lowStockThreshold = 3`.
- `posService.searchProducts`: `stock: 10`, `costPrice = price × 0.85`, `barcode` mặc định `'8938500000000'`.
- `OrderDispatchPage`: `slaRemaining: '01:30:00'` và `assignedBranchName` mặc định.

### 2.4. Lọc & sắp xếp sản phẩm phía client (🟠)
- **File:** `pages/storefront/CategoryPage.jsx` (`useMemo filteredProducts`).
- Lọc theo `brand`, `cpu`, `ram` bằng `includes` trên mảng đã tải về; sắp xếp `price_asc`, `price_desc`, `newest`.
- `newest` đang sắp xếp theo `discountPercentage` → **sai nghĩa**.
- Phân trang và tổng số hiển thị (`248 sản phẩm`) là text cứng.
- **Đề xuất:** truyền filter/sort/page vào `GET /products` (contract đã hỗ trợ `sortBy`, `minPrice`, `maxPrice`, thuộc tính động).

### 2.5. Chuẩn hóa dữ liệu & giá trị mặc định bịa (🟠)
- **File:** `features/products/services/productService.js` → `normalizeProduct`.
  - Tự suy ra `price`, `originalPrice`, `discountPercentage` từ SKU.
  - Đổi `attributes` từ `[{key,value}]` sang object.
  - Gán mặc định: `rating = 5.0`, `reviewsCount = 0`, `stock = 10`, `stockStatus = 'IN_STOCK'`, danh sách `branchInventories` và `promotions` **giả** khi API không trả.
- **Rủi ro:** người dùng thấy tồn kho/khuyến mãi không có thật.
- Tương tự: `branchService.normalizeBranch`, `categoryService.normalizeCategory`, `warrantyService.normalizeWarrantyResult` (mặc định tên khách, ngày bán `2026-08-15`...).

### 2.6. Tồn kho & trạng thái (🟠)
- `inventoryService.normalizeBranchStock`: quy ước `qty ≤ 0` hết hàng, `qty ≤ 2` sắp hết, nhãn "Còn N máy".
- `inventoryService.getBranchInventory`: lọc `search/category/status` ở client; trạng thái `LOW_STOCK` dựa `lowStockThreshold` (hiện cố định 3).
- `getBranchesWithSkuStock`: nếu `skuId` không phải ObjectId 24 hex hoặc API lỗi/rỗng → trả dữ liệu mẫu.
- **Đề xuất:** server trả `status`, `lowStockThreshold`, `reserved` thật.

### 2.7. Bảo hành / e-Warranty (🟡)
- `warrantyService.normalizeWarrantyResult`: tự tính `isExpired`, `daysRemaining`, `statusLabel`, định dạng ngày.
- Hợp lý để hiển thị, nhưng nên để server trả `isExpired` + số ngày còn lại (đồng nhất múi giờ).
- `createWarrantyTicket`: gọi `POST /warranty`; **nếu lỗi vẫn sinh `ticketCode` giả ở client** (`BH-Q1-<yyMMdd>-<rand>`) → phiếu không tồn tại trên server.

### 2.8. Xử lý Serial/IMEI ở client
- `posCartSlice`: ràng buộc số serial ≤ số lượng; cắt serial khi giảm số lượng; `selectMissingSerialsCount` chặn thanh toán khi thiếu serial.
- `SerialParserTextarea`: tách chuỗi theo `[\r\n,;]`, viết hoa, kiểm tra độ dài `< 6` là sai định dạng, trùng trong danh sách, trùng với `existingSerials`.
- `StockTransferPage`: kiểm tra chi nhánh xuất ≠ nhận, số serial chọn = số lượng; khi nhận hàng phải quét đủ serial và serial phải thuộc phiếu.
- `SerialImportPage`: chọn `productId` bằng cách tìm SKU trong danh sách sản phẩm; fallback `products[0]._id` nếu không tìm thấy (có thể nhập nhầm sản phẩm).
- **Đánh giá:** kiểm tra để UX nhanh thì ổn, nhưng server **bắt buộc** kiểm tra lại (trùng mã, trạng thái `IN_STOCK`, đúng chi nhánh).

### 2.9. Điều phối đơn B2C ở client (🟠)
- `OrderDispatchPage.handleConfirmAllocation` và `handleCompletePacking` chỉ `setOrders` cục bộ + toast → **chưa gọi API**, đổi trạng thái `PROCESSING`/`READY_FOR_SHIPPING` không được lưu.
- Chỉ lấy `items[0]` của đơn để hiển thị (đơn nhiều sản phẩm bị cắt).
- Ánh xạ `orderType === 'POS_STORE'` → "Tại quầy".

### 2.10. Quản trị (Admin)
- `AdminBranchesUsersPage`: đổi role, đổi chi nhánh, khóa tài khoản **chỉ `setUsers` cục bộ** (không có API); `handleSaveBranch` cũng chỉ cập nhật state.
- `AdminProductsPage`: `attributes` mẫu hard-code (CPU/RAM/VGA...) thay vì lấy từ `attributeKeys` của danh mục; kiểm tra token trước khi lưu.
- `AdminAnalyticsPage`: `BRANCH_PERFORMANCE` là số liệu cứng; nút xuất báo cáo chỉ `alert(...)`; khoảng ngày là text tự nhập.

### 2.11. Xác thực & phiên
- `services/axiosClient.js`:
  - Gắn `Authorization: Bearer` từ Redux.
  - Khi gặp 401: gọi `/auth/refresh-token`, **xếp hàng các request đang chờ** (`isRefreshing`, `failedQueue`), retry; refresh lỗi → `logout()`.
  - Trả `response.data` (bỏ lớp axios) và reject bằng `error.response.data`.
- `authSlice`: lưu `user`, `accessToken` trong bộ nhớ (không persist) → F5 mất đăng nhập, chưa có bước khôi phục phiên (vd. gọi `/auth/me`/refresh khi khởi động) trong các file đã đọc.
- `LoginForm`: điều hướng theo role (`SUPER_ADMIN` → `/portal/admin/products`, `BRANCH_MANAGER`/`STAFF` → `/portal/pos`, `CUSTOMER` → trang trước đó). Có nút điền nhanh mật khẩu demo `123456`.
- `RegisterForm`: kiểm tra bắt buộc, mật khẩu ≥ 6, xác nhận khớp, đồng ý điều khoản; tính độ mạnh mật khẩu bằng regex.
- `RoleProtectedRoute`: chặn route theo `user.role` (chỉ là UX, quyền thật ở backend).

### 2.12. Trạng thái/Tiện ích khác
| Thành phần | Logic |
| :--- | :--- |
| `cartSlice` | Gộp SKU trùng, cập nhật số lượng, xóa khi ≤ 0, đồng bộ `localStorage` (`techone_cart`) |
| `compareSlice` | Tối đa 4 sản phẩm so sánh, chặn trùng, bật/tắt tô khác biệt |
| `posCartSlice` | Gộp SKU, gán serial, chọn phương thức `CASH`/`VNPAY`, reset giỏ |
| `useBarcodeScanner` | Nhận diện máy quét (ký tự < 80ms, kết thúc Enter, độ dài ≥ 3); phím tắt F2/F4/F8/F9/Esc |
| `useProducts` | Fetch + cờ `isMounted`, `refetch` |
| `PosHeader` | Đồng hồ cập nhật mỗi giây |
| `config/dataMode.js` | Bật/tắt mock qua `localStorage` hoặc `VITE_ENABLE_MOCK_DATA` |

---

## 3. Cơ chế Mock/Fallback (cần kiểm soát trước khi release)

- Mọi service đều có nhánh `isMockEnabled()` trả dữ liệu cứng (`fallbackProducts`, `fallbackOrders`, `fallbackBranches`, `fallbackCategories`, `DEMO_POS_PRODUCTS`, `DEMO_BRANCH_INVENTORY`, `DEMO_WARRANTY_ITEMS`...).
- **Nhiều service nuốt lỗi và trả dữ liệu mẫu** khi API lỗi/rỗng (kể cả khi không bật mock): `branchService.getBranches`, `inventoryService.*`, `posService.searchProducts`, `OrderDispatchPage`. Khi đó UI hiển thị dữ liệu giả mà không báo lỗi.
- `warrantyService.verifySerial` ở chế độ mock trả kết quả "hợp lệ" cho **mọi** serial.
- `posService.checkoutPos` ở chế độ mock sinh `orderCode` giả → dễ nhầm là đã thanh toán thật.
- `productService.getProducts` trong dev ném lỗi, nhưng ở production trả danh sách rỗng và chỉ gắn `error`.

---

## 4. Endpoint client đang gọi nhưng CHƯA có trong `.api-contract`

| Method | Endpoint | Nơi gọi | Ghi chú |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/forgot-password` | `ForgotPasswordPage` | Chưa có trong contract |
| `POST` | `/auth/reset-password` | `ResetPasswordPage` | Chưa có trong contract |
| `GET` | `/orders/my-orders/:id` | `orderService.getMyOrderDetail` | Contract chỉ có `/orders/:orderCode` |
| `GET` | `/inventory/transfers?type=...` | `StockTransferPage` | Chưa có trong contract |
| `POST` | `/inventory/transfers` | `StockTransferPage` | Chưa có trong contract |
| `PATCH` | `/inventory/transfers/:id/receive` | `StockTransferPage` | Chưa có trong contract |
| `GET` | `/serials?branchId=&status=&productSkuId=` | `StockTransferPage` | Chưa có trong contract |
| `POST` | `/warranty` | `warrantyService.createWarrantyTicket` | Chưa có trong contract |
| `POST` | `/auth/login` | `LoginForm` | Body dùng `identifier` + `password` – cần ghi rõ trong `auth.md` |

Ngoài ra các tính năng sau **chưa có API** (chỉ xử lý state cục bộ): đổi role/chi nhánh/khóa nhân sự, lưu chi nhánh từ modal admin, điều phối/đóng gói đơn B2C, báo cáo analytics.

---

## 5. Khuyến nghị ưu tiên

1. **Bảo mật giá:** bỏ `unitPrice`, `subtotal`, `tax`, `totalAmount`, `change` khỏi payload; server tính toán.
2. **Bỏ `branchId` hard-code:** POS lấy từ `req.user.branchId`; client dùng `user.branchId` làm gợi ý hiển thị.
3. **Chuyển lọc/sắp xếp/phân trang sang server** (`CategoryPage`, tồn kho chi nhánh).
4. **Gỡ fallback dữ liệu giả khỏi nhánh production**; hiển thị lỗi thay vì dữ liệu mẫu; không tự sinh `ticketCode`.
5. **Nối API thật** cho quản lý nhân sự, chi nhánh, điều phối đơn.
6. **Bổ sung các endpoint còn thiếu** vào `.api-contract` (mục 4) hoặc bỏ tính năng tương ứng.
7. **Khôi phục phiên khi F5** (gọi refresh-token + `/auth/me` lúc khởi động app).
8. Giữ ở client: validate UX, phím tắt POS, giỏ hàng `localStorage`, so sánh sản phẩm, định dạng tiền/ngày.
