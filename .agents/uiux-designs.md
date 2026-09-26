# 🎨 DESIGN UI/UX SPECIFICATIONS & PAGE MAP

- **Đề tài:** Nghiên cứu công nghệ MERN Stack và xây dựng website thương mại điện tử cho chuỗi cửa hàng thiết bị công nghệ.
- **Mục đích:** Hướng dẫn cấu trúc Frontend React.js, sơ đồ trang (Page Mapping), Layout wireframe và quy chuẩn thiết kế UI/UX cho Agent AI và Developer.
- **Phân hệ ứng dụng:**
  1. `Storefront`: Dành cho Khách hàng cá nhân (B2C Web).
  2. `Internal Portal`: Dành cho Nhân viên POS, Quản lý chi nhánh và Super Admin (RBAC).

---

## 🎨 1. DESIGN SYSTEM & UI RULES

### 1.1. Color Palette (Bảng màu chuẩn)

- **Primary Color:** `#2563EB` (Royal Blue) - Dùng cho CTA, Brand, Active state.
- **Secondary Color:** `#0F172A` (Dark Slate) - Dùng cho Navigation, Heading text.
- **Background Color:** `#F8FAFC` (Light Gray) - Nền ứng dụng B2C.
- **Portal Background:** `#1E293B` / `#0F172A` (Dark Mode Layout cho POS / Dashboard).
- **Status Colors:**
  - `Success / In-Stock`: `#16A34A` (Green)
  - `Warning / Low-Stock`: `#EA580C` (Orange)
  - `Danger / Out-of-Stock`: `#DC2626` (Red)

### 1.2. Typography & Density

- **Font Family:** Inter / Roboto (Sans-serif).
- **Storefront B2C:** Bố cục thoáng, khoảng trắng rộng, tối ưu tỷ lệ chuyển đổi (Conversion-rate focused).
- **Internal Portal & Web POS:** Bố cục cô đọng (High-density information), tối ưu thao tác bàn phím, split-screen layout.

---

## 🌐 2. PHÂN HỆ STOREFRONT (B2C WEB CLIENT)

### P-01: Trang Chủ (Home Page - Route: `/`)

- **Nhiệm vụ:** Giới thiệu thương hiệu, khuyến mãi flash sale và phân loại danh mục.
- **Components cốt lõi:**
  - `Header`: Logo, Thanh tìm kiếm Auto-suggest, Dropdown "Chọn chi nhánh gần bạn", Giỏ hàng badge, Tra cứu bảo hành.
  - `Hero Banner Carousel`: Khuyến mãi nổi bật.
  - `Flash Sale Bar`: Đếm ngược thời gian kèm mảng sản phẩm giảm giá.
  - `Category Grid`: Laptop, Smartphone, Linh kiện, Phụ kiện.

### P-02: Danh mục & Bộ lọc Động (Category Page - Route: `/category/:slug`)

- **Nhiệm vụ:** Hiển thị sản phẩm theo danh mục kèm bộ lọc cấu hình động trích xuất từ MongoDB Dynamic Schema.
- **Components cốt lõi:**
  - `Dynamic Filter Sidebar`: Bộ lọc tự thay đổi theo danh mục (VD: Chọn Laptop hiển thị checkbox CPU, RAM, VGA; chọn Màn hình hiển thị Tần số quét, Kích thước).
  - `Product Card Grid`: Ảnh, Giá gốc, Giá sale, Badge cấu hình vắt tắt, Trạng thái tồn kho.
  - `Sort Controls`: Lọc theo giá, xếp theo bán chạy, mới nhất.

### P-03: Chi tiết Sản phẩm (Product Detail Page - Route: `/product/:slug`)

- **Nhiệm vụ:** Hiển thị chi tiết cấu hình, chọn biến thể SKU và kiểm tra tồn kho đa chi nhánh.
- **Components cốt lõi:**
  - `Image Gallery`: Ảnh đại diện lớn + Thumbnail slider.
  - `SKU Variant Selector`: Nút chọn cấu hình biến thể (RAM 16GB / 32GB, Màu sắc).
  - `Multi-Branch Inventory Box`: Hiển thị danh sách cửa hàng vật lý kèm trạng thái kho thực tế:
    - _Chi nhánh Q1:_ Còn 3 máy (Xanh) -> `[MUA NGAY]`
    - _Chi nhánh Thủ Đức:_ Còn 1 máy (Cam)
    - _Chi nhánh Q5:_ Hết hàng (Xám)
  - `Primary CTAs`: `[MUA NGAY - Giao tận nơi]` và `[ĐẶT GIỮ HÀNG - Click & Collect]`.
  - `Specs Matrix Table`: Bảng thông số kỹ thuật đầy đủ.

### P-04: So sánh Cấu hình (Compare Specs - Route: `/compare?ids=id1,id2`)

- **Nhiệm vụ:** So sánh ma trận thông số kỹ thuật giữa 2-4 sản phẩm.
- **Components cốt lõi:**
  - `Comparison Matrix Table`: Cột là sản phẩm, hàng là thuộc tính (`attributes`).
  - `Highlight Differences Switch`: Bật/Tắt chế độ tự động tô màu các thông số khác biệt.

### P-05: Giỏ hàng (Cart Page - Route: `/cart`)

- **Nhiệm vụ:** Quản lý danh sách sản phẩm chờ checkout.
- **Components cốt lõi:**
  - `Cart Table`: Danh sách SKU, giá, nút tăng/giảm số lượng.
  - `Coupon Input`: Ô nhập voucher giảm giá.
  - `Branch Pickup Selector`: Chọn chi nhánh để đến lấy hoặc giao từ kho gần nhất.

### P-06: Thanh toán Checkout (Checkout Page - Route: `/checkout`)

- **Nhiệm vụ:** Nhập thông tin nhận hàng và thanh toán.
- **Components cốt lõi:**
  - `Customer Info Form`: Họ tên, SĐT, Địa chỉ giao hàng.
  - `Fulfillment Method`: Radio chọn _Giao hàng tận nơi_ hoặc _Nhận tại cửa hàng (Click & Collect)_.
  - `Payment Gateway Options`: COD, VNPAY QR, Stripe.

### P-07: Tra cứu e-Warranty (Warranty Lookup - Route: `/warranty-check`)

- **Nhiệm vụ:** Tra cứu thông tin bảo hành công khai bằng Serial/IMEI hoặc SĐT.
- **Components cốt lõi:**
  - `Search Bar`: Ô nhập mã Serial/IMEI hoặc SĐT.
  - `Warranty Status Card`: Hiển thị Badge _"Còn hạn bảo hành"_ / _"Đã hết hạn"_, Ngày bán, Ngày hết hạn e-Warranty, Lịch sử các lần bảo hành.

---

## 💼 3. PHÂN HỆ INTERNAL PORTAL & WEB POS (INTERNAL WORKSPACE)

### P-08: Web POS - Bán hàng tại Quầy (Route: `/portal/pos` - Role: `STAFF`, `BRANCH_MANAGER`)

- **Nhiệm vụ:** Giao diện tối ưu cho thu ngân, quét mã Serial/IMEI và in hóa đơn tại quầy.
- **Layout Split-Screen (60/40):**
  - **Trái (60%):** Ô tìm kiếm / Auto-focus Barcode Input (Lắng nghe Keyboard Events từ máy quét vạch), Grid danh mục sản phẩm nhanh.
  - **Phải (40%):** Bảng giỏ hàng POS, ô nhập mã Serial/IMEI thực tế gán cho item, Tổng tiền, Chọn phương thức (Tiền mặt / VNPAY QR), Nút `[THANH TOÁN & IN HÓA ĐƠN]`.

### P-09: Quản lý Kho Chi nhánh (Route: `/portal/branch/inventory` - Role: `BRANCH_MANAGER`)

- **Nhiệm vụ:** Quản lý số lượng SKU và Serial/IMEI đang `IN_STOCK` tại chi nhánh local.
- **Components cốt lõi:**
  - `Stock Status Table`: Danh sách SKU, Tồn kho hiện tại.
  - `Serial List Modal`: Xem chi tiết danh sách mã Serial/IMEI cụ thể đang có trong kho.

### P-10: Xử lý Đơn B2C Phân bổ (Route: `/portal/branch/orders` - Role: `BRANCH_MANAGER`)

- **Nhiệm vụ:** Tiếp nhận đơn hàng B2C do hệ thống phân bổ về cửa hàng.
- **Components cốt lõi:**
  - `Order Queue`: Danh sách đơn B2C online.
  - `Serial Scan Packing Modal`: Quét mã Serial/IMEI để đóng gói trước khi chuyển shipper.

### P-11: Quản lý Tiếp nhận Bảo hành (Route: `/portal/branch/warranty` - Role: `STAFF`, `BRANCH_MANAGER`)

- **Nhiệm vụ:** Lập phiếu tiếp nhận bảo hành thiết bị.
- **Components cốt lõi:**
  - `Serial Lookup`: Quét mã Serial/IMEI kiểm tra tính hợp lệ.
  - `Warranty Ticket Form`: Tạo phiếu `warrantytickets`, mô tả tình trạng lỗi/vết xước, in phiếu hẹn cho khách.

### P-12: Quản trị Sản phẩm & Dynamic Attributes (Route: `/portal/admin/products` - Role: `SUPER_ADMIN`)

- **Nhiệm vụ:** Quản lý sản phẩm, biến thể SKUs và định nghĩa thuộc tính động.
- **Components cốt lõi:**
  - `Dynamic Attributes Form Builder`: Thêm/sửa tập key-value cấu hình kỹ thuật theo danh mục (CPU, RAM, VGA...).
  - `SKU Manager`: Quản lý danh sách SKU, giá bán, giá sale.

### P-13: Nhập lô Serial/IMEI (Route: `/portal/admin/serials` - Role: `SUPER_ADMIN`, `BRANCH_MANAGER`)

- **Nhiệm vụ:** Nhập Serial/IMEI mới vào kho.
- **Components cốt lõi:**
  - `Bulk Serial Import`: Form nhập danh sách Serial/IMEI (hoặc Import file Excel/CSV), gán chi nhánh khởi tạo.

### P-14: Quản lý Chi nhánh & RBAC (Route: `/portal/admin/branches` - Role: `SUPER_ADMIN`)

- **Nhiệm vụ:** Quản lý cửa hàng và phân quyền nhân sự.
- **Components cốt lõi:**
  - `Branch CRUD`: Thêm/sửa địa chỉ, SĐT, tọa độ GPS chi nhánh.
  - `User RBAC Manager`: Quản lý tài khoản, gán Role (`STAFF`, `BRANCH_MANAGER`), gán `branchId`.

### P-15: Báo cáo Doanh thu toàn Chuỗi (Route: `/portal/admin/analytics` - Role: `SUPER_ADMIN`)

- **Nhiệm vụ:** Báo cáo doanh thu và phân tích hiệu quả kinh doanh.
- **Components cốt lõi:**
  - `Revenue Chart`: Biểu đồ so sánh doanh thu các chi nhánh.
  - `Channel Breakdown`: Tỷ lệ doanh thu giữa B2C Web Online vs Web POS tại quầy.
