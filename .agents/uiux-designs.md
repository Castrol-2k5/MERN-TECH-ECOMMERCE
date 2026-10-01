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

---

## 🔐 4. PHÂN HỆ XÁC THỰC & TÀI KHOẢN (AUTHENTICATION & ACCOUNT)

### P-00: Đăng nhập Hệ thống (Unified Login - Route: `/login`)
- **Nhiệm vụ:** Điểm đăng nhập chung cho cả Khách hàng B2C và Nhân sự nội bộ (Staff, Branch Manager, Super Admin), phân luồng điều hướng tự động dựa trên `role` của JWT Token.
- **Layout:** Cấu trúc Card căn giữa màn hình (Split card hoặc Centered Card với Brand Hero background).
- **Components cốt lõi:**
  - `Brand Header`: Logo TechOne, tiêu đề chào mừng ("Đăng nhập tài khoản của bạn").
  - `Login Form`:
    - Ô nhập `identifier` (Email hoặc Số điện thoại).
    - Ô nhập `password` (Hỗ trợ nút Toggle ẩn/hiện mật khẩu).
    - Checkbox "Ghi nhớ đăng nhập" (Chỉ áp dụng tạo Persistent Cookie cho role CUSTOMER).
    - Link điều hướng "Quên mật khẩu?".
    - Nút CTA Primary Blue: `[ĐĂNG NHẬP]`.
  - `Role-based Redirect Handlers`:
    - Nếu `role === 'CUSTOMER'`: Chuyển hướng về Trang chủ `/` hoặc trang trước đó trong History.
    - Nếu `role === 'STAFF'` hoặc `'BRANCH_MANAGER'`: Chuyển hướng thẳng vào `/portal/pos`.
    - Nếu `role === 'SUPER_ADMIN'`: Chuyển hướng vào `/portal/admin/products` hoặc `/portal/admin/analytics`.
  - `Social Login Block` (Dành riêng cho B2C): Nút đăng nhập nhanh với Google.
  - `Bottom Link`: "Chưa có tài khoản? [Đăng ký ngay]".

---

### P-16: Đăng ký Tài khoản B2C (Customer Register - Route: `/register`)
- **Nhiệm vụ:** Cho phép khách hàng cá nhân tạo tài khoản thành viên để tích lũy đơn hàng và theo dõi bảo hành.
- **Layout:** Centered Card tối giản, tập trung vào tỷ lệ chuyển đổi form.
- **Components cốt lõi:**
  - `Registration Form`:
    - Ô nhập `fullName` (Họ và tên khách hàng).
    - Ô nhập `phone` (Validate chuẩn định dạng số điện thoại Việt Nam 10 chữ số).
    - Ô nhập `email` (Validate định dạng email chuẩn RFC).
    - Ô nhập `password` kèm thanh đo độ mạnh mật khẩu (Password Strength Indicator: độ dài >= 6 ký tự, bao gồm chữ và số).
    - Ô nhập `confirmPassword` (Xác thực trùng khớp mật khẩu).
    - Checkbox chấp thuận "Điều khoản dịch vụ & Chính sách bảo mật".
  - `Action CTA`: Nút `[TẠO TÀI KHOẢN]` (Gửi request `POST /api/v1/auth/register`, role mặc định luôn là `CUSTOMER`).
  - `Footer Link`: "Đã có tài khoản? [Đăng nhập]".

---

### P-17: Quên & Đặt lại Mật khẩu (Password Recovery - Route: `/forgot-password`, `/reset-password`)
- **Nhiệm vụ:** Khôi phục quyền truy cập tài khoản khi người dùng quên mật khẩu.
- **Layout:** 2 trạng thái màn hình (Hai View/Step dạng Card):
  - **View 1: Yêu cầu khôi phục (`/forgot-password`)**:
    - Ô nhập Email hoặc Số điện thoại đã đăng ký.
    - Nút `[GỬI LIÊN KẾT XÁC THỰC]`.
    - Alert Box: Thông báo gửi thành công và hướng dẫn người dùng kiểm tra hộp thư đến.
  - **View 2: Đặt lại mật khẩu mới (`/reset-password?token=...`)**:
    - Tự động kiểm tra tính hợp lệ của `token` xác thực trên URL.
    - Form nhập `newPassword` và `confirmNewPassword`.
    - Nút `[CẬP NHẬT MẬT KHẨU MỚI]`.
    - Modal thông báo thành công kèm nút điều hướng quay về `/login`.

---

## 📦 5. PHÂN HỆ TRẢI NGHIỆM ĐƠN HÀNG B2C & VẬN HÀNH NỘI BỘ

### P-18: Quản lý Đơn hàng & Chi tiết Đơn B2C (Customer Orders & Details - Route: `/account/orders`, `/account/orders/:id` - Role: `CUSTOMER`)
- **Nhiệm vụ:** Giúp khách hàng tra cứu lịch sử mua hàng, theo dõi tiến độ giao hàng/nhận hàng và lấy mã Serial/IMEI thiết bị đã mua.
- **Components cốt lõi:**
  - `Order Filter Tabs`: Tab lọc trạng thái đơn hàng (`Tất cả`, `Chờ thanh toán`, `Đang xử lý`, `Đang giao hàng`, `Đã hoàn tất`, `Đã hủy`).
  - `Order List Card Item`: Mỗi đơn hiển thị Mã đơn (`orderCode`), Ngày đặt, Tổng tiền, Huy hiệu phương thức thanh toán (`VNPAY`, `COD`), Trạng thái đơn hàng.
  - `Order Detail Drawer / Page View`:
    - **Timeline Tiến độ:** Stepper trực quan 4 bước (`Đã đặt hàng` -> `Đã xác nhận & Phân bổ chi nhánh` -> `Đang giao hàng` -> `Giao thành công`).
    - **Thông tin Chi nhánh xử lý:** Tên chi nhánh, Địa chỉ, Hotline hỗ trợ.
    - **Danh sách mặt hàng chi tiết:** Ảnh, Tên SKU, Đơn giá, Số lượng, và **Mã Serial/IMEI đã gán** cho máy (kèm nút bấm "Tra cứu bảo hành" chuyển nhanh sang `P-07`).
    - **Hóa đơn & Thanh toán:** Tạm tính, Phí vận chuyển, Giảm giá voucher, Tổng thanh toán.

---

### P-19: Xác nhận Đặt hàng Thành công (Checkout Success - Route: `/checkout/success` - Role: Public / `CUSTOMER`)
- **Nhiệm vụ:** Hiển thị biên nhận đặt hàng thành công sau khi hoàn tất quy trình checkout trực tuyến hoặc thanh toán qua cổng VNPAY/Stripe.
- **Layout:** Cấu trúc Hero Card trung tâm kèm biểu tượng trạng thái trực quan.
- **Components cốt lõi:**
  - `Status Indicator`: Icon Check xanh lá (`#16A34A`), Tiêu đề "Đặt hàng thành công!".
  - `Order Meta Summary`: Mã đơn hàng (`orderCode` - có nút Sao chép), Email nhận thông báo, Tổng tiền đã thanh toán.
  - `Fulfillment Instructions`:
    - *Nếu chọn Click & Collect (Nhận tại cửa hàng):* Hiển thị Địa chỉ chi nhánh nhận máy, Bản đồ mini/Chỉ đường, Mã PIN nhận hàng hoặc QR Code để nhân viên quầy quét nhanh.
    - *Nếu chọn Giao tận nơi:* Hiển thị Địa chỉ giao hàng dự kiến, Đơn vị vận chuyển và Thời gian nhận hàng ước tính (2h - 48h).
  - `Next Actions Block`: Nút CTA `[THEO DÕI ĐƠN HÀNG]` (Điều hướng sang `P-18`) và nút Secondary `[TIẾP TỤC MUA SẮM]` (Quay về `P-01`).

---

### P-20: Điều chuyển Tồn kho Liên Chi nhánh (Stock Transfer - Route: `/portal/branch/transfers` - Role: `BRANCH_MANAGER`, `SUPER_ADMIN`)
- **Nhiệm vụ:** Quản lý quy trình luân chuyển thiết bị giữa các chi nhánh khi có sự lệch tồn kho (cân bằng kho chuỗi), áp dụng máy trạng thái `TRANSIT` cho Serial/IMEI.
- **Layout:** High-density Dashboard chia 2 tab: `Yêu cầu chuyển hàng (Outbound)` và `Tiếp nhận hàng chuyển đến (Inbound)`.
- **Components cốt lõi:**
  - `Transfer Request Modal / Form`:
    - Chọn Chi nhánh gửi (`sourceBranchId`) và Chi nhánh nhận (`destinationBranchId`).
    - Chọn Sản phẩm & SKU cần điều chuyển.
    - Nhập danh sách mã Serial/IMEI cụ thể xuất đi (Bằng tay hoặc qua máy quét mã vạch).
    - Nút `[TẠO PHIẾU ĐIỀU CHUYỂN]`: Chuyển trạng thái các Serial được chọn từ `IN_STOCK` sang `TRANSIT`.
  - `Transfer Queue Table`:
    - Cột hiển thị: Mã phiếu điều chuyển (`TRF-XXXX`), Chi nhánh xuất, Chi nhánh nhận, Số lượng thiết bị, Người tạo, Ngày tạo, Trạng thái (`CHỜ VẬN CHUYỂN`, `ĐANG TRÊN ĐƯỜNG`, `ĐÃ NHẬP KHO`).
  - `Inbound Receiving Verification Drawer`:
    - Khi hàng đến chi nhánh đích, Quản lý chi nhánh mở drawer để quét kiểm tra đối chiếu từng Serial/IMEI thực tế trên kiện hàng.
    - Counter kiểm đếm trực tiếp: `Đã quét: X / Y máy`.
    - Nút `[XÁC NHẬN NHẬP KHO]`: Tự động chuyển trạng thái Serial từ `TRANSIT` sang `IN_STOCK` tại chi nhánh đích và cập nhật lại số lượng tồn kho `quantity` tương ứng trong bảng `branch_inventories`.