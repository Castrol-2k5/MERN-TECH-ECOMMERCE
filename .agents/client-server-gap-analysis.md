# 🔀 PHÂN TÍCH ĐỘ LỆCH CLIENT ↔ SERVER (CÓ PHÂN LOẠI)

> Đối chiếu `code/client/src` với `code/server/src` (routes, DTO zod, service, model) tại thời điểm phân tích.
> Bổ sung cho [client-logic-analysis.md](./client-logic-analysis.md) (phân tích logic nằm ở client).
> Khi bật **Live mode** (tắt Mock), các mục nhóm 🔴 sẽ lỗi thật.

> [!NOTE]
> Đã đọc: toàn bộ service/slice/hook/layout/route của client, các trang storefront + portal chính, các component auth/pos/warranty/branch chính; phía server đọc đủ routes, DTO, service orders/inventory/serials/products/auth và model order/user/category/warranty.
> Chưa đọc từng dòng: các component trình bày thuần UI (`Badge`, `Button`, `Input`, `Spinner`, `HeroBannerCarousel`, `FlashSaleSection`, `CompareMatrixTable`, `DynamicAttributesForm`, `InvoiceK80Modal`, `RmaPrintReceiptModal`, `analytics/*`…). Các file analytics đã xác nhận dùng mảng hằng số cứng.

---

## 0. Bảng tổng quan phân loại

| Mã | Nhóm | Ý nghĩa | Số mục |
| :-: | :--- | :--- | :-: |
| 🔴 **A** | Request bị server từ chối / không chạy | Client gọi sai payload, sai route, thiếu endpoint → lỗi ở Live mode | 7 |
| 🟠 **B** | Lệch cấu trúc dữ liệu (response/model) | Server trả field khác tên/khác kiểu so với client đọc | 11 |
| 🟡 **C** | Client có tính năng, server chưa có API | UI chạy bằng state cục bộ hoặc dữ liệu giả | 10 |
| 🔵 **D** | Server có API, client chưa dùng | Phần hỗ trợ đã sẵn nhưng UI chưa nối | 7 |
| 🟣 **E** | Lệch nghiệp vụ / quy tắc | Hai bên hiểu quy tắc khác nhau | 9 |
| ⚪ **F** | Dữ liệu cứng / mock lẫn vào luồng thật | Hard-code, fallback giả | 8 |
| 📄 **G** | Tài liệu `.api-contract` lệch server | Contract thiếu/thừa so với code thật | 6 |
| 🛡️ **H** | Bảo mật (cả hai phía) | Rủi ro cần xử lý sớm | 4 |

---

## 🔴 A. Request bị server từ chối / không chạy (Blocker ở Live mode)

> Server dùng `zod .strict()` → **mọi field thừa đều bị 400 `VALIDATION_ERROR`**.

| # | Luồng | Client gửi | Server yêu cầu | Hậu quả | Vị trí |
| :-: | :--- | :--- | :--- | :--- | :--- |
| A1 | **POS checkout** | `branchId, items, paymentMethod, customerInfo` **+** `subtotal, discount, tax, totalAmount, finalAmount, customerPaid, change` | Chỉ `branchId?, items, paymentMethod?, customerInfo?` (strict) | Thanh toán POS **luôn 400** | `PosPage.jsx` L154-171 ↔ `order.dto.js` L45-72 |
| A1b | POS checkout | `customerInfo.phone` có thể là `''` (sau `clearCart`) hoặc `0901234567` giả; `fullName` mặc định "Khách vãng lai" | `phone` bắt buộc đúng regex VN nếu có `customerInfo` | Khách vãng lai không nhập SĐT → 400 | `posCartSlice.js` L126-133, `PosCheckoutPanel.jsx` L45-52 |
| A2 | **B2C checkout** | `items[].unitPrice` **+** `customerInfo` ở cấp ngoài **+** `shippingAddress` | `items[]` chỉ `productId, productSkuId, quantity`; không có `customerInfo` (strict) | Đặt hàng online **luôn 400** | `CartPage.jsx` L90-109 ↔ `order.dto.js` L74-114 |
| A2b | B2C checkout | `paymentMethod` có lựa chọn **`CASH`** (COD) | Chỉ `VNPAY` hoặc `STRIPE` | Chọn "Tiền mặt khi nhận" → 400 | `CartPage.jsx` L427-443 ↔ `order.dto.js` L110 |
| A3 | **Cập nhật sản phẩm** (Admin) | `formData`: `category, price, originalPrice, specsSummary, attributes[{name,key,type,values,isFilter}], skus[{code,options,stock,originalPrice…}]` | `updateProductSchema` strict: `categoryId`, `attributes[{key,value}]`, `skus[{sku,price,salePrice,optionValues…}]` | Lưu sản phẩm **luôn 400** | `AdminProductsPage.jsx` L28-45,128-158 ↔ `product.dto.js` |
| A4 | **Điều chuyển kho** – chọn Serial | `GET /serials?branchId&status&productSkuId` | **Không tồn tại** (chỉ có `/serials/import`, `/scan/:sn`, `/verify/:sn`) | `availableSerials` luôn rỗng → với sản phẩm quản lý Serial, không chọn được serial → server từ chối `SERIAL_COUNT_MISMATCH` | `StockTransferPage.jsx` L126-134 |
| A5 | **Tiếp nhận bảo hành** | `POST /warranty` | **Không có route** (chỉ có model `warrantytickets`) | Lỗi bị nuốt, client **tự sinh mã phiếu giả** | `warrantyService.js` L150-176 |
| A6 | **Điều phối đơn B2C** | Trạng thái `READY_FOR_SHIPPING` + gán serial/đổi chi nhánh | `ORDER_STATUS`: `PENDING, PROCESSING, COMPLETED, CANCELLED`; không có API cập nhật đơn | Không lưu được; trạng thái chỉ tồn tại trong state | `OrderDispatchPage.jsx` L115-145 ↔ `order.model.js` L23-28 |

---

## 🟠 B. Lệch cấu trúc dữ liệu (client đọc sai/thiếu field)

| # | Đối tượng | Server trả | Client mong đợi | Hệ quả |
| :-: | :--- | :--- | :--- | :--- |
| B1 | **SKU biến thể** | `skus[].optionValues: [{optionName, value}]`, `sku` (mã) | `skus[].options: {RAM:'16GB',…}`, `code`, `stock` | `ProductDetailPage` tìm `activeSku` bằng `s.options` → luôn rơi về `skus[0]`; chọn biến thể **không đổi giá/SKU**. `SkuVariantBuilder` hiển thị `sku.options` (trống) |
| B2 | **Product** | Chỉ: `name, slug, categoryId(populate), brand, description, images, isSerialManaged, isActive, attributes[{key,value}], options[{name,displayType,values}], skus[]` | Thêm `price, originalPrice, discountPercentage, rating, reviewsCount, stockStatus, stockLabel, specsSummary, branchInventories, promotions` | `normalizeProduct` **bịa** các field thiếu (rating 5.0, tồn kho, khuyến mãi…) |
| B3 | **SKU tồn kho** | Không có `stock` trên SKU (tồn nằm ở `branch_inventories`) | `sku.stock` (mặc định 10) | Badge "còn hàng"/số lượng sai |
| B4 | **Category** | `name, slug, parentId, attributeKeys, isActive` | Thêm `icon, productCount, description` | Mặc định `icon:'laptop'`, `productCount:0` |
| B5 | **Branch (ghi)** | `branchCode, name, address, phone, location, isActive` | Form dùng `code`, `managerName`, `stockCount`, `revenueText` | Form chi nhánh dùng field không tồn tại; `_id: 'branch-'+Date.now()` giả |
| B6 | **Warranty verify** | `serialNumber, productName, sku, status, soldAt, warrantyEndDate, isExpired(null nếu chưa bán)` | Thêm `customer{…}, branchPurchased, image, productId, saleDate, daysRemaining, isEligible` | Live mode hiển thị **tên/SĐT/email khách và chi nhánh bịa**; serial `IN_STOCK` chưa bán (`isExpired = null`) bị coi là "đủ điều kiện BH" với ngày mặc định `2027-08-14` |
| B7 | **Tồn kho theo chi nhánh** | `[{_id, branchId, productId(populate), productSkuId, quantity}]` | Thêm `shelfLocation, quantityReserved, lowStockThreshold, serials[], barcode` | Cột kệ/đã giữ/ngưỡng/serial đều là giá trị giả (`'Kệ A-01'`, `0`, `3`, `[]`) |
| B8 | **Order** | `customerInfo{fullName,phone,address}`, `items[]`, `totalAmount`, `orderType`, `paymentStatus`, `orderStatus` | Mock dùng thêm `shippingAddress`, `subtotal/discount/tax`, `finalAmount` | `CheckoutSuccessPage`: `isClickAndCollect = !orderState.shippingAddress…` → **luôn true** vì server không trả `shippingAddress` |
| B9 | **User** | login/register: `user.id`; `getMe`: `_id` + `branchId` populate thành object; register **không có** `branchId` | `user.branchId` là chuỗi id | 3 shape khác nhau; hiện chỉ `login` được dùng nên chưa lỗi |
| B10 | **Lỗi API** | `{success:false, statusCode, errorCode, message, errors[]}` | `err.response?.data?.message` (không tồn tại vì interceptor đã reject `response.data`) | Vẫn hiển thị được nhờ `err.message`, nhưng `errorCode` và `errors[]` (lỗi từng field) **không được dùng** |
| B11 | **Cart item** (nội bộ client) | — | `ProductDetailPage` lưu `{name, price, image}` (không có `sku`); `CartPage` đọc `item.productName`, `item.sku` | Giỏ hàng hiển thị trống tên và SKU |

### Lệch bộ lọc / sắp xếp / phân trang sản phẩm

| # | Nội dung | Server | Client |
| :-: | :--- | :--- | :--- |
| B12 | Filter thuộc tính | `?key=value` khớp **chính xác** (`$elemMatch`), key theo `category.attributeKeys` | Lọc client bằng `includes` trên `cpu`, `ram`, `brand`; sidebar dùng key `vga, screenSize, priceRange, stockStatus` **không map** sang query server (`screen_size`, `minPrice/maxPrice`) |
| B13 | Phân trang | `page, limit(≤100), meta.totalPages` | `CategoryPage` có state `currentPage` nhưng không truyền lên API; `useProducts` mặc định `limit 12` → **chỉ thấy 12 sản phẩm đầu** |
| B14 | Sắp xếp | `newest, oldest, price_asc, price_desc` (sort trên mảng `skus.salePrice`) | Không gửi `sortBy`; tự sort client; "newest" đang sort theo `discountPercentage` |
| B15 | Bộ lọc động | Từ `category.attributeKeys` | Danh sách option **hard-code** trong `DynamicFilterSidebar` |

---

## 🟡 C. Client có tính năng nhưng server chưa có API

| # | Tính năng (client) | Hiện trạng ở client | Thiếu ở server |
| :-: | :--- | :--- | :--- |
| C1 | **Quản lý nhân sự / RBAC** (đổi role, đổi chi nhánh, khóa tài khoản) | `AdminBranchesUsersPage` dùng `INITIAL_USERS`, chỉ `setUsers` | Không có module `users` (chỉ có model) |
| C2 | **Điều phối đơn B2C** (chọn chi nhánh xuất, gán serial, đóng gói) | Chỉ đổi state cục bộ + toast | API đổi trạng thái đơn, phân bổ chi nhánh, gán serial |
| C3 | **Tiếp nhận bảo hành (RMA)** | Sinh mã phiếu giả khi lỗi | `POST /warranty`, danh sách/cập nhật phiếu |
| C4 | **Báo cáo doanh thu / analytics** | 5 component dùng mảng hằng số (`CHART_DATA`, `BRANCH_SALES`, `TOP_PRODUCTS`…); nút xuất báo cáo chỉ `alert` | Toàn bộ API thống kê/xuất file |
| C5 | **Thanh toán VNPAY/Stripe** | Chỉ chọn phương thức; hiển thị "Thanh toán hoàn tất" dù đơn `PENDING` | Tạo link thanh toán, callback/IPN, cập nhật `paymentStatus` |
| C6 | **POS VNPAY QR "tự nhận thanh toán qua WebSocket"** | Chỉ là icon QR + text | WebSocket/IPN; hiện server đặt `PAID` ngay khi checkout |
| C7 | **Click & Collect (giữ máy)** | `fulfillmentType`, `pickupBranch` lưu trong giỏ; toast "Đã giữ máy" | Không có trường/ API giữ hàng; server không nhận 2 field này |
| C8 | **Khôi phục phiên sau F5** | `authSlice` chỉ lưu RAM | Server đã có `refresh-token`, `me` nhưng client không gọi lúc khởi động |
| C9 | **Hủy đơn, đánh giá, banner/flash-sale/khuyến mãi** | UI/ mock tĩnh (`FlashSaleSection`, `HeroBannerCarousel`, `promotions`) | Không có API |
| C10 | **Tìm cửa hàng gần nhất** (`ClickAndCollectBanner`) | Chỉ hiện chuỗi "tìm thấy 3 cửa hàng" cố định | (Server đã có `/branches/nearby` – xem D) |

---

## 🔵 D. Server đã có API, client chưa dùng / dùng chưa đủ

| # | Endpoint server | Hiện trạng ở client |
| :-: | :--- | :--- |
| D1 | `POST/PUT/DELETE /branches` | `BranchFormModal` + `handleSaveBranch` chỉ cập nhật state, **không gọi API** |
| D2 | `POST/PUT/DELETE /categories` | Không có UI quản trị danh mục |
| D3 | `POST/DELETE /products` | `productService.createProduct/deleteProduct` có sẵn nhưng chưa thấy nơi gọi; "Thêm sản phẩm mới" chỉ xử lý cục bộ |
| D4 | `GET /branches/nearby` | Chưa dùng (Click & Collect có thể dùng) |
| D5 | `GET /categories?tree=true`, `GET /categories/:slug` | Chỉ dùng `GET /categories` ở `StorefrontLayout`; menu/filter chưa dùng `attributeKeys` |
| D6 | `GET /auth/me`, `POST /auth/logout-all` | Chưa dùng |
| D7 | `GET /orders/:orderCode` | Client dùng `/orders/my-orders/:id` thay thế (hợp lệ nhưng không đồng nhất) |

---

## 🟣 E. Lệch nghiệp vụ / quy tắc

| # | Quy tắc | Client | Server | Rủi ro |
| :-: | :--- | :--- | :--- | :--- |
| E1 | **Tổng tiền POS** | `total = subtotal − discount + VAT 10%`; hóa đơn in theo số này | `totalAmount = Σ unitPrice × qty` (không VAT, không giảm giá) | **Hóa đơn ≠ dữ liệu lưu DB** (kể cả khi sửa A1) |
| E2 | **Serial bắt buộc** | POS chặn thanh toán nếu thiếu serial với hàng `hasSerial` | `serialsAssigned` **tùy chọn** | Có thể bán hàng quản lý serial mà không gán serial → tồn kho và serial lệch nhau |
| E3 | **Giữ tồn B2C** | Hiển thị "giữ 30 phút" | Trừ kho ngay khi tạo đơn; **không có job hoàn kho** khi quá hạn/hủy | Hàng bị "kẹt" nếu khách không thanh toán |
| E4 | **Phạm vi chi nhánh** | `BranchInventoryPage` cho chọn **mọi chi nhánh** | `scopeBranch` ép `STAFF/BRANCH_MANAGER` về **chi nhánh của mình** (ghi đè `params.branchId`) | UI ghi tên chi nhánh khác nhưng dữ liệu thực là của chi nhánh mình |
| E5 | **Phân quyền trang** | Mọi trang `/portal/admin/*` mở cho `STAFF/BRANCH_MANAGER`; menu admin hiển thị cho mọi vai trò | Các API tạo/sửa chỉ `SUPER_ADMIN`/`BRANCH_MANAGER` | Nhân viên vào được trang admin rồi gặp 403 |
| E6 | **Nhận hàng điều chuyển** | Bắt buộc quét đủ serial mới cho xác nhận | Nếu `scannedSerials` rỗng thì **bỏ qua** đối chiếu | Có thể gọi API trực tiếp để nhận hàng không kiểm serial |
| E7 | **Thanh toán POS** | Chọn `CASH`/`VNPAY` | Đơn POS luôn `PAID` + `COMPLETED` | VNPAY POS được ghi "đã thanh toán" khi chưa xác nhận |
| E8 | **Bảo hành** | Mô tả sản phẩm ghi 12–24 tháng theo hãng | Server cố định **12 tháng** khi bán | Hiển thị bảo hành không khớp |
| E9 | **Giá hiển thị** | `price = salePrice > 0 ? salePrice : price` (cùng quy tắc server) nhưng lấy từ giỏ localStorage | Server tự tính lại theo DB | Tổng giỏ có thể khác tổng đơn thật (giá đổi sau khi thêm giỏ) |

---

## ⚪ F. Dữ liệu cứng / mock lẫn vào luồng thật

| # | Nội dung cứng | Vị trí | Ảnh hưởng |
| :-: | :--- | :--- | :--- |
| F1 | `branchId: '65f0a1000000000000000001'` | `PosPage` (checkout), `inventoryService.getBranchInventory`, `StockAdjustModal`, `RmaTicketForm` | Sai chi nhánh nếu không phải nhân viên (SUPER_ADMIN gửi id không tồn tại → `BRANCH_NOT_FOUND`) |
| F2 | `productId/customerId/staffId` giả + tên "Trần Kỹ Thuật (KTV-02)" | `RmaTicketForm` | Phiếu bảo hành gắn sai người/sản phẩm |
| F3 | Thông tin khách mặc định "Hoàng Khách Hàng / 0909000005 / địa chỉ cố định"; POS mặc định "Trần Minh Khang" kèm giỏ có sẵn iPhone | `CartPage`, `posCartSlice.initialState` | Có thể đặt/thanh toán nhầm dữ liệu mẫu |
| F4 | `CheckoutSuccessPage`: mã đơn `ORD-20261001-0002`, tổng `990000` khi không có state | `CheckoutSuccessPage` L21-23 | Vào thẳng URL vẫn thấy "đặt hàng thành công" |
| F5 | Fallback demo khi API lỗi/rỗng: `getBranches`, `getBranchInventory`, `getBranchesWithSkuStock`, `searchProducts`, `OrderDispatchPage` | các service/trang | Người dùng thấy dữ liệu giả mà không biết API lỗi |
| F6 | Khởi tạo state bằng mock: `AdminProductsPage(fallbackProducts)`, `SerialImportPage(DEMO_*, rawText mẫu)`, `AdminBranchesUsersPage(INITIAL_*)`, `WarrantyCheckPage(fallbackWarrantyData, initialValue 'C02ZQ0ABQ6L7')` | các trang portal/storefront | Màn hình mở lên là dữ liệu mẫu |
| F7 | Badge "48 CN", khoảng cách `distanceKm: 1.2/3.8/12.5`, `slaRemaining '01:30:00'` | `PortalLayout`, `BranchAllocationModal`, `OrderDispatchPage` | Số liệu không có nguồn |
| F8 | `DataModeToggle` hiển thị ở **mọi** trang (cả production) | `App.jsx` | Người dùng cuối có thể bật mock |

---

## 📄 G. Tài liệu `.api-contract` lệch server

| # | Mục | Chi tiết |
| :-: | :--- | :--- |
| G1 | **Thiếu endpoint đã có ở server** | `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /orders/my-orders/:id`, `POST /inventory/transfers`, `GET /inventory/transfers`, `PATCH /inventory/transfers/:id/receive` |
| G2 | **Có trong contract nhưng server không có** | `GET /products/compare?ids=…` — không có route; vì khai báo `/:slug` nên sẽ bị bắt thành slug `compare` → 404 `PRODUCT_NOT_FOUND` |
| G3 | **Thiếu mô tả body** | Cấu trúc `skus[].optionValues`, `attributes[{key,value}]`, `options[]`, `salePrice` của `POST/PUT /products` chưa ghi → dễ gây lệch như A3/B1 |
| G4 | **Thiếu ràng buộc phương thức thanh toán** | POS: `CASH`/`VNPAY`; B2C: `VNPAY`/`STRIPE` (không có `CASH`) |
| G5 | **Thiếu ghi chú `.strict()`** | Các endpoint POS/B2C/inventory/serials từ chối field thừa |
| G6 | **Thiếu error code** | `DUPLICATE_SERIAL`, `SKU_NOT_FOUND`, `ORDER_NOT_FOUND`, `INVALID_OR_EXPIRED_TOKEN`, `REFRESH_TOKEN_REQUIRED`, `INVALID_SESSION`, `SESSION_EXPIRED`, `ROUTE_NOT_FOUND`, `SERIAL_COUNT_MISMATCH`, `INSUFFICIENT_STOCK`, `INVALID_SERIALS`, `SERIAL_VERIFICATION_FAILED`, `TRANSFER_NOT_FOUND`, `INVALID_TRANSFER_STATUS` |

---

## 🛡️ H. Bảo mật cần xử lý sớm

| # | Vấn đề | Phía | Mức |
| :-: | :--- | :-: | :-: |
| H1 | `POST /auth/forgot-password` **trả `resetToken` trong response ở mọi môi trường** → ai biết email/SĐT nạn nhân đều đặt lại được mật khẩu (chiếm tài khoản). Client còn hiển thị link reset | Server | 🔴 Nghiêm trọng |
| H2 | Server `PUT /products/:id` nhận cả `isActive`... hợp lệ, nhưng client `toggleProductActive` và `updateProduct` dựa vào mock khi lỗi; cần kiểm soát lỗi 403 | Cả hai | 🟡 |
| H3 | Tin giá/tổng tiền từ client (đã xử lý đúng phía server cho B2C/POS: server tự tính giá) — nhưng client vẫn gửi `unitPrice`, `totalAmount` → nên bỏ để tránh hiểu nhầm | Client | 🟡 |
| H4 | `DataModeToggle` + `TECHONE_USE_MOCK_DATA` trong localStorage có thể bật mock ở production; nút "điền nhanh" mật khẩu `123456` trong `LoginForm` | Client | 🟠 |

---

## ✅ Thứ tự xử lý đề xuất

1. **H1** (khóa lỗ hổng reset mật khẩu) — chỉ gửi token qua email/SMS, không trả về response.
2. **A1, A1b, A2, A2b** — sửa payload POS/B2C cho khớp DTO (bỏ field thừa, bỏ lựa chọn `CASH` B2C hoặc thêm vào server nếu muốn COD).
3. **A3 + B1 + B2** — thống nhất mô hình `skus/attributes` giữa client và server (nên đổi client theo server: `optionValues`, `attributes[{key,value}]`, `salePrice`).
4. **A4, A5, A6, C1–C3** — quyết định: bổ sung API (`GET /serials`, `/warranty`, `/users`, cập nhật đơn) hoặc ẩn tính năng khỏi UI.
5. **E1, E2, E3, E4** — chốt quy tắc nghiệp vụ POS (VAT/giảm giá, serial bắt buộc), hoàn kho đơn B2C, giới hạn chi nhánh theo vai trò.
6. **B12–B15** — chuyển lọc/sắp xếp/phân trang sang query server.
7. **F1–F8** — gỡ mock/hard-code khỏi build production, bỏ fallback giả.
8. **G1–G6** — cập nhật `.api-contract` theo server thực tế.
