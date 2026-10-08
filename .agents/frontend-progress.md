# 🚀 FRONTEND PROGRESS TRACKER

* **Dự án:** Omnichannel Tech E-Commerce (TechOne)
* **Kiến trúc:** Feature-based Architecture (React 18+, Vite, Tailwind CSS v4, Redux Toolkit, Lucide Icons)
* **Cập nhật gần nhất:** 30/09/2026

---

## 📌 Phase 1: Core Storefront (B2C Public Client) — [HOÀN THÀNH 100%]

### 1. Hạ tầng kỹ thuật dùng chung (Shared Infrastructure)
- [x] **Tailwind CSS v4 & Figma Tokens:** Cấu hình `@theme` với các mã màu chuẩn thiết kế Figma: `#2563EB` (Primary), `#0F172A` (Secondary/Dark), `#F8FAFC` (Background), `#16A34A` (Stock Green), `#EA580C` (Warning), `#DC2626` (Danger).
- [x] **Axios Client (`services/axiosClient.js`):** Cấu hình `baseURL`, `withCredentials: true`, đính kèm Access Token in-memory, tích hợp **Silent Refresh Queue** tự động bắt lỗi 401 xoay vòng token `/auth/refresh-token` và phát lại request đang chờ.
- [x] **Redux Store (`store/index.js`):** Kết hợp các slices `authSlice`, `cartSlice`, `compareSlice` kết nối hai chiều với `axiosClient`.
- [x] **Shared Components (`components/common/`):** `Button.jsx`, `Badge.jsx`, `Input.jsx`, `Spinner.jsx`.
- [x] **Storefront Layout (`layouts/StorefrontLayout.jsx`):**
  - Utility Bar: Hotline 1800 6868, hệ thống 48 cửa hàng, freeship từ 500k, đổi trả 30 ngày.
  - Header: Logo TechOne, Thanh tìm kiếm auto-suggest (⌘K), Dropdown chọn chi nhánh gần nhất (`/api/v1/branches`), Tra cứu e-Warranty, Badge giỏ hàng thời gian thực, Menu tài khoản.
  - Navigation: Danh mục sản phẩm đa cấp.
  - Footer: 4 cột đối tác, chính sách bảo hành, tổng đài và giấy phép bán lẻ.

### 2. Các Features & Màn hình hoàn thành (Chuẩn Figma Frames)
- [x] **P-01: Trang Chủ (TechOne Storefront - Node `#11:1090`)**
  - `HeroBannerCarousel.jsx`: Banner Tech Fest 2026, nút CTA "Mua ngay" & "Xem ưu đãi".
  - `FlashSaleSection.jsx`: Đồng hồ đếm ngược thời gian thực, grid sản phẩm flash sale.
  - `CategoryHighlights.jsx`: Grid 4 danh mục chính (Laptop, Smartphone, Linh kiện, Phụ kiện).
  - `ClickAndCollectBanner.jsx`: Banner cam kết giao hàng 2h / nhận tại shop sau 30 phút.
  - Best sellers & Đối tác công nghệ hàng đầu (Apple, Samsung, ASUS, Lenovo, Dell, Sony).
  - Route: `/` ➔ `HomePage.jsx`.

- [x] **P-02: Danh mục & Bộ lọc Động (PLP - Node `#21:26828`)**
  - `DynamicFilterSidebar.jsx`: Trích xuất bộ lọc động (Hãng, Khoảng giá, CPU, RAM, VGA, Màn hình, Tình trạng kho).
  - `SortBar.jsx`: Sắp xếp giá tăng/giảm, bán chạy, mới nhất kèm toggle Grid / List view.
  - `ProductCard.jsx`: Card sản phẩm chuẩn Figma, badge sale (-13%), tóm tắt cấu hình, giá gốc & giá sale, trạng thái kho, nút thêm giỏ nhanh và so sánh.
  - `Pagination.jsx`: Phân trang chuẩn.
  - Route: `/category/:slug` ➔ `CategoryPage.jsx`.

- [x] **P-03: Chi tiết Sản phẩm & Tồn kho Chi nhánh (PDP - Node `#21:27168`)**
  - `ProductImageGallery.jsx`: Thumbnail slider bên trái + Main zoom image bên phải kèm badge ưu đãi.
  - `SkuVariantSelector.jsx`: Chọn biến thể RAM, màu sắc trực quan với color dots.
  - `MultiBranchStockBox.jsx`: Hiển thị danh sách tồn kho thời gian thực tại các chi nhánh (Q.1, Thủ Đức, Q.5).
  - CTA Buttons: `[MUA NGAY - Giao tận nơi]` và `[ĐẶT GIỮ HÀNG - Click & Collect]`.
  - `SpecsTable.jsx`: Ma trận thông số kỹ thuật động (`product.attributes`).
  - Route: `/product/:slug` ➔ `ProductDetailPage.jsx`.

- [x] **P-04: So sánh Cấu hình (Compare Specs - Node `#21:27440`)**
  - `CompareMatrixTable.jsx`: Bảng so sánh 2-4 sản phẩm theo cột ngang.
  - Switch `Highlight Differences`: Tự động tô màu các ô thông số có sự khác biệt giữa các dòng máy.
  - Route: `/compare` ➔ `ComparePage.jsx`.

- [x] **P-07: Tra cứu Bảo hành Điện tử (e-Warranty - Node `#21:28062`)**
  - `WarrantySearchBar.jsx`: Khung hero màu tối, ô tìm kiếm Serial/IMEI hoặc SĐT.
  - `WarrantyResultCard.jsx`: Hiển thị Badge "Còn hạn bảo hành", ngày kích hoạt, chi nhánh mua, thời hạn còn lại và Timeline lịch sử sửa chữa/bảo hành.
  - Route: `/warranty-check` ➔ `WarrantyCheckPage.jsx`.

- [x] **P-05 (Mini): Giỏ hàng B2C**
  - `CartPage.jsx`: Quản lý danh sách sản phẩm, tăng giảm số lượng, tóm tắt thanh toán.
  - Route: `/cart` ➔ `CartPage.jsx`.

### 3. Tiêu chuẩn chất lượng (TC2.4)
- **ESLint:** Đạt 0 lỗi, 0 cảnh báo (`eslint .` exit code 0).
- **Vite Build:** Build production thành công 100% trong ~467ms.

---

## 📌 Phase 2: Phân Hệ Web POS, Kho Chi Nhánh & Tiếp Nhận Bảo Hành — [HOÀN THÀNH 100%]

### 1. Hạ tầng kỹ thuật chuyên dụng quầy thu ngân & chi nhánh
- [x] **Redux POS Cart Slice (`store/slices/posCartSlice.js`):** Quản lý giỏ hàng thu ngân, gán mã Serial/IMEI bắt buộc cho thiết bị, thông tin khách hàng tích điểm, chiết khấu/giảm giá, tiền khách đưa, tính tiền thừa, phương thức CASH / VNPAY. Đã đăng ký tại `store/index.js`.
- [x] **Web Audio API Native (`features/pos/hooks/usePosAudio.js`):** Bộ phát âm thanh beep chuyên dụng (1200Hz 80ms khi quét thành công / 280Hz double beep 120ms khi gặp lỗi) không cần file mp3 ngoài.
- [x] **Hardware Barcode Scanner & POS Hotkeys (`features/pos/hooks/useBarcodeScanner.js`):** Nhận diện máy quét mã vạch cứng (tốc độ gõ < 50ms + Enter) và hỗ trợ phím tắt thu ngân: `[F2]` Quét mã, `[F4]` Khách hàng, `[F8]` Giảm giá, `[F9]` Thanh toán, `[ESC]` Đóng modal/hủy.
- [x] **Portal Layout & Role Guard:** `PortalLayout.jsx` giao diện Dark Slate (`#0F172A`) chuẩn màn hình làm việc nội bộ, kèm `RoleProtectedRoute.jsx` kiểm soát quyền STAFF, BRANCH_MANAGER, SUPER_ADMIN.

### 2. Các Features & Màn hình hoàn thành (Chuẩn Figma Frames)
- [x] **P-08: Web POS Bán Hàng Tại Quầy (Node `#21:28224`)**
  - `PosHeader.jsx`: Thông tin quầy `#01`, Chi nhánh Q1, Thu ngân, Đồng hồ ca trực, Badge trạng thái kết nối máy in nhiệt K80 và nút Toàn màn hình (Fullscreen).
  - `PosBarcodeBar.jsx`: Thanh quét Barcode/Serial/SKU [F2], tìm kiếm nhanh, dải tag danh mục lọc tức thì.
  - `PosProductCatalog.jsx`: Grid sản phẩm cảm ứng POS, hiển thị tồn kho chi nhánh, badge phân loại Standard / Serial.
  - `PosCartTable.jsx`: Bảng giỏ hàng POS, tăng/giảm số lượng, kiểm tra bắt buộc Serial, cảnh báo nhấp nháy khi chưa gán đủ Serial/IMEI.
  - `SerialAssignmentModal.jsx`: Modal quét barcode gán Serial trực tiếp hoặc chọn nhanh từ tồn kho chi nhánh.
  - `PosCheckoutPanel.jsx`: Tóm tắt tiền hàng, chiết khấu [F8], VAT 10%, Tổng thanh toán, Tiền mặt/VNPAY QR, nút tiền nhanh (500k, 1Tr, 2Tr, Vừa đủ), tính tiền thối lại, nút Thanh toán [F9].
  - `InvoiceK80Modal.jsx`: Xem trước & In hóa đơn nhiệt K80 (80mm) theo chuẩn siêu thị, liệt kê rõ số Serial/IMEI được kích hoạt bảo hành điện tử chính hãng và QR tra cứu.
  - Route: `/portal/pos` ➔ `PosPage.jsx`.

- [x] **P-09: Quản Lý Tồn Kho Chi Nhánh & Định Vị Quầy Kệ (Node `#21:28379`)**
  - `BranchStockKpiCards.jsx`: 4 thẻ chỉ số thời gian thực (Tổng SKU, Tồn khả dụng, Cảnh báo sắp hết, Đã hết hàng).
  - `BranchStockTable.jsx`: Bảng danh mục tồn kho chi nhánh hiển thị vị trí quầy kệ (`A-01-03`, `B-02-01`), Tồn thực tế, Tồn tạm giữ, Tồn khả dụng, Badge trạng thái và bộ lọc danh mục/trạng thái.
  - `SerialListDrawer.jsx`: Drawer trượt từ cạnh phải hiển thị danh sách Serial/IMEI chi tiết kèm trạng thái `IN_STOCK`, `SOLD`, `WARRANTY`, ngày nhập và hạn bảo hành.
  - `StockAdjustModal.jsx`: Modal điều chỉnh tồn kho kiểm kê (tăng/giảm số lượng delta, lý do kiểm toán, ghi chú biên bản).
  - Route: `/portal/inventory` ➔ `BranchInventoryPage.jsx`.

- [x] **P-11: Tiếp Nhận & Thẩm Định Thiết Bị Bảo Hành Tại Quầy (Node `#21:28815`)**
  - `RmaScanLookup.jsx`: Quét mã vạch Serial/IMEI tra cứu trạng thái E-Warranty thời gian thực, hiển thị Banner "ĐỦ ĐIỀU KIỆN TIẾP NHẬN", thông tin khách hàng, thiết bị và hạn bảo hành.
  - `RmaTicketForm.jsx`: Biên bản tiếp nhận kỹ thuật ghi nhận lỗi mô tả của khách, thẩm định ngoại quan thiết bị, phụ kiện gửi kèm (thân máy, sạc, hộp...), đính kèm ảnh hiện trạng và ngày hẹn trả dự kiến.
  - `RmaPrintReceiptModal.jsx`: Xem trước và in phiếu tiếp nhận bảo hành K80/A5 có mã vạch/QR `BH-Q1-260930-018` để khách hàng và kỹ thuật viên ký nhận.
  - Route: `/portal/warranty-reception` ➔ `WarrantyReceptionPage.jsx`.

### 3. Tiêu chuẩn chất lượng (TC2.2 & TC2.4)
- **ESLint:** Đạt **0 lỗi, 0 cảnh báo** (`eslint .` exit code 0).
- **Vite Build:** Build production thành công 100% trong 1.08s.

---

## 📌 Phase 3: Phân Hệ Quản Trị Trụ Sở & Điều Phối Vận Hành (HQ Admin) — [HOÀN THÀNH 100%]

### 1. Hạ tầng kỹ thuật chuyên dụng & Layout mở rộng
- [x] **Recharts Integration:** Cài đặt và tích hợp thư viện `recharts` biểu đồ trực quan hóa dữ liệu (Stacked BarChart, Donut PieChart, ResponsiveContainer).
- [x] **Portal Navigation 2 tầng (`layouts/PortalLayout.jsx`):** Tái cấu trúc thanh Sidebar thành 2 nhóm chuyên biệt:
  - Nhóm 1: **VẬN HÀNH QUẦY & KHO** (Web POS, Tồn kho chi nhánh, Tiếp nhận bảo hành).
  - Nhóm 2: **QUẢN TRỊ TRỤ SỞ (HQ ADMIN)** (Dashboard Báo cáo, Quản lý sản phẩm, Nhập lô Serial, Điều phối đơn hàng, Chi nhánh & Phân quyền).
- [x] **Dynamic Routing (`routes/AppRoutes.jsx`):** Đăng ký 5 routes mới chuẩn RESTful bọc trong `RoleProtectedRoute` với quyền `SUPER_ADMIN` và `BRANCH_MANAGER`.

### 2. Các Features & Màn hình hoàn thành (Chuẩn Figma Frames)
- [x] **P-12: Quản Trị Danh Mục & Sản Phẩm Dynamic Schema (Node `#21:28966`)**
  - `ProductManagementTable.jsx`: Bảng sản phẩm toàn diện, tìm kiếm, lọc danh mục/trạng thái, hiển thị SKU count, toggle kích hoạt nhanh, nút hành động Sửa/Xóa.
  - `DynamicAttributesForm.jsx`: Trình tạo Dynamic Schema Form tự động render các trường thông số kỹ thuật (CPU, RAM, VGA, Màn hình, Ổ cứng, Cổng kết nối...) theo Category được chọn.
  - `SkuVariantBuilder.jsx`: Trình tạo biến thể SKU động, quản lý mã SKU, mã Barcode EAN-13, giá niêm yết, giá khuyến mãi, tồn kho ban đầu và thuộc tính riêng của SKU.
  - `AdminProductsPage.jsx`: Giao diện Split-screen (35% Bảng danh sách - 65% Panel Form cấu hình đa tab Thông tin chung, Dynamic Specs, SKU Manager, SEO).
  - Route: `/portal/products` ➔ `AdminProductsPage.jsx`.

- [x] **P-13: Nhập Lô Serial / IMEI & Cập Nhật Tồn Kho (Node `#21:29200`)**
  - `SerialBatchImportCard.jsx`: Thẻ cấu hình nhập kho: chọn Chi nhánh nhập, chọn SKU sản phẩm, hạn bảo hành nhà sản xuất (tháng), Drag & Drop Dropzone tải tệp CSV/TXT.
  - `SerialParserTextarea.jsx`: Vùng paste danh sách Serial/IMEI thô với bộ đếm Live Counter 4 chỉ số (Tổng mã, Hợp lệ, Trùng lặp nội bộ, Sai định dạng alphanumeric).
  - `ImportSummaryModal.jsx`: Modal tổng hợp & xác thực trước khi ghi vào CSDL, cảnh báo số lượng tồn kho chi nhánh tăng tương ứng, tải danh sách lỗi CSV.
  - `SerialImportPage.jsx`: Trang điều phối nhập lô serial với lịch sử các lô nhập gần nhất.
  - Route: `/portal/serials/import` ➔ `SerialImportPage.jsx`.

- [x] **P-10: Điều Phối & Đóng Gói Đơn Hàng B2C Phân Bổ (Node `#21:28606`)**
  - `B2COrderDispatchTable.jsx`: 3 KPI cards trạng thái điều phối (Chờ phân bổ, Đang gom hàng, Giao trễ SLA), tabs trạng thái, danh sách đơn hàng B2C kèm đồng hồ đếm ngược SLA giao 2h (nhấp nháy đỏ khi còn dưới 20 phút).
  - `BranchAllocationModal.jsx`: Modal thông minh tính toán khoảng cách km từ địa chỉ giao của khách đến các chi nhánh, kiểm tra tồn kho khả dụng tại từng kho, gợi ý chi nhánh tối ưu nhất.
  - `OrderSerialAssignDrawer.jsx`: Drawer quét mã vạch Serial/IMEI vật lý thực tế gán vào đơn hàng trước khi in phiếu giao hàng và niêm phong kiện hàng.
  - `OrderDispatchPage.jsx`: Trang điều phối đơn hàng trung tâm.
  - Route: `/portal/orders/dispatch` ➔ `OrderDispatchPage.jsx`.

- [x] **P-14: Quản Lý Mạng Lưới Chi Nhánh & Phân Quyền RBAC (Node `#21:29370`)**
  - `BranchListCardGrid.jsx`: Grid 48 chi nhánh chuỗi cửa hàng, hiển thị địa chỉ, hotline, quản lý chi nhánh, tổng SKU tồn kho, doanh thu tháng và nút chỉnh sửa tọa độ GPS.
  - `BranchFormModal.jsx`: Modal thêm mới/chỉnh sửa chi nhánh với trường kinh độ / vĩ độ GeoJSON `2dsphere` phục vụ định vị khoảng cách giao hàng tự động.
  - `UserRbacTable.jsx`: Quản lý danh sách nhân sự nội bộ, phân quyền vai trò (SUPER_ADMIN, BRANCH_MANAGER, STAFF), gán chi nhánh công tác, kích hoạt/vô hiệu hóa tài khoản.
  - `AdminBranchesUsersPage.jsx`: Trang kết hợp 2 tab Mạng lưới chi nhánh & Quản trị nhân sự RBAC.
  - Route: `/portal/branches-users` ➔ `AdminBranchesUsersPage.jsx`.

- [x] **P-15: Dashboard Báo Cáo Doanh Thu & Analytics Toàn Hệ Thống (Node `#21:29580`)**
  - `KpiMetricsGrid.jsx`: 4 thẻ chỉ số kinh doanh chính (Doanh thu thuần, Tổng đơn hàng, Giá trị trung bình đơn AOV, Tốc độ tăng trưởng MoM).
  - `RevenueChart.jsx`: Biểu đồ cột chồng Recharts BarChart so sánh đa kênh Doanh thu Online B2C vs Web POS tại quầy theo từng tháng trong năm.
  - `BranchSalesBreakdown.jsx`: Thanh progress phân tích tỷ trọng đóng góp doanh thu của các chi nhánh kèm badge tăng trưởng.
  - `ChannelBreakdownPie.jsx`: Biểu đồ tròn Recharts PieChart (Donut) trực quan hóa tỷ lệ doanh thu Online (62%) vs Offline POS (38%).
  - `TopProductsTable.jsx`: Bảng xếp hạng top 5 sản phẩm công nghệ bán chạy nhất (iPhone 16 Pro Max, MacBook Pro M3, Asus ROG...).
  - `AdminAnalyticsPage.jsx`: Bộ lọc thời gian (Hôm nay, 7 ngày, Tháng này, Năm nay), chọn chi nhánh báo cáo và bảng đối soát chi tiết.
  - Route: `/portal/analytics` ➔ `AdminAnalyticsPage.jsx`.

### 3. Tiêu chuẩn chất lượng (TC2.2 & TC2.4)
- **ESLint:** Đạt **0 lỗi, 0 cảnh báo** (`eslint .` exit code 0).
- **Vite Build:** Build production thành công 100% trong 2.50s (bundle assets sinh ra chuẩn xác).

