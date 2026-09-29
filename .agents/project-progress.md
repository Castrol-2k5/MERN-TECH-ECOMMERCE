# 📊 BÁO CÁO TIẾN ĐỘ DỰ ÁN (PROJECT PROGRESS REPORT)

* **Dự án:** Hệ thống Thương mại điện tử Đa kênh MERN Stack cho chuỗi bán lẻ thiết bị công nghệ (Storefront B2C, Web POS, Branch Admin, HQ Super Admin).
* **Kiến trúc:** Modular Monolith trên Node.js/Express (v20+ LTS), Mongoose ODM (v8+), MongoDB (v7.0+).
* **Tiêu chuẩn chất lượng:** Tuân thủ Clean Architecture, 0 lỗi ESLint, 0 bí mật lộ lọt, độ phủ kiểm thử tự động ≥ 70% (Đáp ứng Mức 5 Rubric Đồ án).
* **Thời điểm cập nhật:** 29/09/2026.

---

## 1. TỔNG QUAN TIẾN ĐỘ THỰC HIỆN (EXECUTIVE SUMMARY)

| Phân hệ / Hạng mục | Trạng thái | Độ phủ Test / Kiểm thử | Tiêu chuẩn Rubric đạt được |
| :--- | :---: | :---: | :---: |
| **1. Database Schemas & Indexing (9 Models)** | Hoàn thành | 100% Pass (9/9 Models) | **TC2.2, TC2.4** |
| **2. Auth & RBAC 3 Tầng (JWT, Session, Scoping)** | Hoàn thành | 93.16% Line Coverage (17 ACs) | **TC2.2, TC2.4, TC2.5** |
| **3. Branch Module & GeoSpatial GPS ($near)** | Hoàn thành | 90.14% Line Coverage (11 Cases) | **TC2.2, TC2.4, TC2.5** |
| **4. Category Module (Hierarchy & Dynamic Specs)** | Hoàn thành | 91.76% Line Coverage (11 Cases) | **TC2.2, TC2.4, TC2.5** |
| **5. Product Module (Dynamic Filter & Hybrid Schema)** | Hoàn thành | 87.82% Line Coverage (19 Cases) | **TC2.2, TC2.4, TC2.5** |
| **6. Pipeline CI/CD GitHub Actions** | Hoàn thành | 100% Green Build Pipeline | **TC2.4, TC2.5, TC2.6** |
| **Tổng thể Hệ thống (Toàn bộ Backend)** | **Hoàn thành Giai đoạn 1** | **88.37% Line Coverage (88/88 Tests)** | **Mức 5 Xuất sắc** |

---

## 2. CHI TIẾT CÁC MÔ-ĐUN ĐÃ HIỆN THỰC HÓA

### 2.1. Thiết Kế 9 Mongoose Models & Đánh Index Chiến Lược
Đã xây dựng toàn diện 9 Collections cốt lõi kèm theo các chiến lược đánh Index tối ưu truy vấn để triệt tiêu độ trễ ($T_{avg} < 200ms$):
1. **`User` (`users`):** Lưu trữ định danh, phân quyền RBAC 4 vai trò (`CUSTOMER`, `STAFF`, `BRANCH_MANAGER`, `SUPER_ADMIN`). Tự động mã hóa mật khẩu qua pre-save hook bằng `bcryptjs` (salt = 10). Index duy nhất trên `email` và `phone`.
2. **`Session` (`user_sessions`):** Quản lý phiên làm việc đa thiết bị. Tích hợp **TTL Index** trên `expiresAt` (`expireAfterSeconds: 0`) giúp MongoDB tự động thu gom phiên hết hạn.
3. **`Branch` (`branches`):** Quản lý chuỗi cửa hàng vật lý, tích hợp **GeoJSON Point** và **2dsphere Index** trên trường `location` hỗ trợ tìm kiếm theo khoảng cách thực tế.
4. **`Category` (`categories`):** Cây danh mục đa cấp, tự động sinh slug chuẩn SEO và lưu trữ mảng thuộc tính động `attributeKeys`.
5. **`Product` (`products`):** **Hybrid Schema** kết hợp Dynamic Attributes (`attributes.key`/`attributes.value` với Multikey Compound Index) và biến thể SKUs nhúng để triệt tiêu phép JOIN ($lookup).
6. **`BranchInventory` (`branch_inventories`):** Quản lý tồn kho SKU theo từng chi nhánh với **Compound Unique Index** `{ branchId: 1, productSkuId: 1 }` ngăn ngừa trùng lặp bản ghi.
7. **`Serial` (`serials`):** Quản lý độc bản thiết bị theo **State Pattern** (`IN_STOCK`, `RESERVED`, `SOLD`, `WARRANTY`, `TRANSIT`). Compound Index phục vụ máy quét POS siêu tốc.
8. **`Order` (`orders`):** Đơn hàng B2C và POS tại quầy, nhúng danh sách mặt hàng và Serial được gán. Compound Index `{ branchId: 1, createdAt: -1 }`.
9. **`WarrantyTicket` (`warrantytickets`):** Tiếp nhận và quản lý quy trình bảo hành điện tử theo SerialNumber.

---

### 2.2. Phân Hệ Xác Thực & Phân Quyền RBAC 3 Tầng (`/api/v1/auth`)
* **Đăng ký tài khoản (`POST /register`):** Bắt buộc role `CUSTOMER`, chặn triệt để hành vi Role Injection qua Zod `.strict()`.
* **Đăng nhập & Phiên (`POST /login`):** Nhận diện linh hoạt Email hoặc Số điện thoại Việt Nam. **Phân hóa thời hạn phiên:** Khách hàng B2C (14 ngày) vs Nhân sự POS/Quản lý (8 giờ ca làm việc). Lưu hash SHA-256 vào MongoDB và gắn HttpOnly Cookie (`SameSite=Strict`).
* **Làm mới phiên (`POST /refresh-token`):** Áp dụng cơ chế **Token Rotation** thu hồi Refresh Token cũ và cấp mới Access Token tự động.
* **Đăng xuất (`POST /logout` & `/logout-all`):** Hỗ trợ đăng xuất từng thiết bị hoặc xóa sạch toàn bộ phiên làm việc trên toàn hệ thống (Global Revoke).
* **Phân quyền 3 Tầng:**
  - *Tầng 1 (Authentication):* Middleware `protect` giải mã Bearer Token và kiểm tra trạng thái hoạt động tài khoản (`isActive`).
  - *Tầng 2 (Role Authorization):* Middleware `authorize(...roles)` bảo vệ các endpoint quản trị.
  - *Tầng 3 (Data Scoping):* Middleware `scopeBranch` ép buộc phạm vi dữ liệu chi nhánh (`req.scopedBranchId = req.user.branchId`) cho nhân viên POS và Quản lý cửa hàng, ngăn chặn truy vấn chéo chi nhánh. `SUPER_ADMIN` được cấp quyền xem xuyên chuỗi.
* **Bảo vệ Brute-Force:** Tích hợp `authRateLimiter` tối đa 5 lần thử/15 phút.

---

### 2.3. Phân Hệ Quản Lý Chi Nhánh (`/api/v1/branches`)
* **API Tìm kiếm Không gian Địa lý (`GET /nearby`):** Sử dụng toán tử `$near` của MongoDB trên chỉ mục `2dsphere` để tìm kiếm và sắp xếp các chi nhánh gần tọa độ GPS người dùng nhất trong bán kính tùy chọn (mặc định 10,000m).
* **Đầy đủ CRUD RESTful:**
  - `GET /branches`: Lấy danh sách chi nhánh hoạt động (hỗ trợ tìm kiếm theo tên, mã hoặc địa chỉ, sử dụng `.lean()`).
  - `GET /branches/:id`: Xem chi tiết thông tin chi nhánh.
  - `POST /branches`: Tạo mới chi nhánh (chỉ `SUPER_ADMIN`, validate tọa độ `[-180, 180]` và `[-90, 90]`).
  - `PUT /branches/:id`: Cập nhật chi nhánh (chỉ `SUPER_ADMIN`).
  - `DELETE /branches/:id`: Xóa mềm chi nhánh (`isActive: false`, chỉ `SUPER_ADMIN`).

---

### 2.4. Phân Hệ Quản Lý Danh Mục (`/api/v1/categories`)
* **Cây danh mục phân cấp (`GET /categories?tree=true`):** Tự động chuyển đổi danh sách danh mục phẳng thành cây phân cấp lồng nhau trong mảng `children` phục vụ thanh điều hướng/menu website.
* **Bộ lọc thuộc tính động (`GET /categories/:slug`):** Trả về danh sách `attributeKeys` chuẩn hóa (VD: `['cpu', 'ram', 'vga']` cho Laptop) phục vụ render bộ lọc động tức thì tại giao diện Storefront.
* **Đầy đủ CRUD RESTful:**
  - `POST /categories`: Tạo danh mục gốc hoặc danh mục con (`parentId`), tự động tạo slug tiếng Việt không dấu chuẩn SEO.
  - `PUT /categories/:id`: Cập nhật tên danh mục, di chuyển nhánh cha, ngăn chặn lỗi logic tự gán chính mình làm cha (`INVALID_PARENT_CATEGORY`).
  - `DELETE /categories/:id`: Xóa mềm danh mục.

---

### 2.5. Phân Hệ Quản Lý Sản Phẩm (`/api/v1/products`) - Hybrid Dynamic Schema
* **Mô hình Hybrid Schema:** Kết hợp thông tin sản phẩm chuẩn, mảng thuộc tính động `attributes` (`{ key, value }`), `options` và mảng biến thể `skus` nhúng (triệt tiêu phép `$lookup`).
* **Đảm bảo tính toàn vẹn thuộc tính (Integrity Rule):** So khớp `attributes.key` gửi lên với `Category.attributeKeys`. Báo lỗi `HTTP 400 Bad Request` với mã `INVALID_ATTRIBUTE_KEY` nếu xuất hiện thông số sai lệch.
* **Dynamic Filter Engine:** Tự động trích xuất các tham số query động (VD: `?ram=16GB&cpu=Intel i7`) và thực thi lọc tối ưu bằng toán tử `$all` kết hợp `$elemMatch` trên **Multikey Compound Index** `{ "attributes.key": 1, "attributes.value": 1 }`, cam kết $T_{avg} < 200ms$ cùng `.lean()`.
* **Đầy đủ CRUD & RBAC:**
  - `GET /products`: Tìm kiếm từ khóa, lọc theo danh mục, thương hiệu, khoảng giá SKU (`skus.salePrice`) và bộ lọc thuộc tính động.
  - `GET /products/:slug`: Xem chi tiết sản phẩm và populate danh mục kèm `attributeKeys`.
  - `POST /products`: Tạo mới sản phẩm (Quyền `SUPER_ADMIN`, validate `salePrice <= price`).
  - `PUT /products/:id`: Cập nhật sản phẩm & thông số kỹ thuật (Quyền `SUPER_ADMIN`).
  - `DELETE /products/:id`: Xóa mềm sản phẩm (`isActive: false`, Quyền `SUPER_ADMIN`).

---

## 3. THỐNG KÊ CHẤT LƯỢNG MÃ NGUỒN & KIỂM THỬ (RUBRIC METRICS)

### 3.1. Phân Tích Tĩnh Mã Nguồn (TC2.4)
* **ESLint:** Cấu hình chuẩn Flat Config `eslint.config.js` cho Node.js ES Modules.
* **Kết quả quét linter:** **0 Errors, 0 Warnings** trên toàn bộ codebase.
* **Bảo mật bí mật:** 100% Secret (JWT Secret, MongoDB URI, Port) được nạp từ biến môi trường qua `environment.js`. File `.env` và `prompt.md` đã được loại trừ khỏi Git qua `.gitignore`.

### 3.2. Kiểm Thử Tự Động & Độ Phủ Dòng Lệnh (TC2.5)
Hệ thống sử dụng **Jest**, **Supertest** kết hợp **`mongodb-memory-server`** chạy độc lập siêu tốc không phụ thuộc database ngoài:

```text
Test Suites: 7 passed, 7 total
Tests:       88 passed, 88 total (100% Pass Rate)
Snapshots:   0 total
Time:        ~32s
```

#### Bảng Thống Kê Độ Phủ Mã Nguồn (`npm run test:coverage`):
```text
----------------------------|---------|----------|---------|---------|
File                        | % Stmts | % Branch | % Funcs | % Lines |
----------------------------|---------|----------|---------|---------|
All files                   |   88.08 |    65.10 |   95.91 |   88.37 |
 middlewares                |   73.25 |    55.12 |   81.81 |   73.49 |
  auth.middleware.js        |   70.58 |    71.42 |     100 |   70.58 |
  rbac.middleware.js        |   88.00 |    62.06 |     100 |   88.00 |
  validate.middleware.js    |   91.66 |    60.00 |     100 |   90.00 |
 modules/auth               |   93.27 |    65.67 |     100 |   93.16 |
  auth.controller.js        |  100.00 |    57.89 |     100 |  100.00 |
  auth.dto.js               |  100.00 |   100.00 |     100 |  100.00 |
  auth.routes.js            |  100.00 |   100.00 |     100 |  100.00 |
  auth.service.js           |   88.57 |    67.39 |     100 |   88.23 |
  session.model.js          |  100.00 |   100.00 |     100 |  100.00 |
 modules/branches           |   90.14 |    73.33 |     100 |   90.14 |
  branch.controller.js      |  100.00 |   100.00 |     100 |  100.00 |
  branch.dto.js             |  100.00 |   100.00 |     100 |  100.00 |
  branch.model.js           |  100.00 |   100.00 |     100 |  100.00 |
  branch.routes.js          |  100.00 |   100.00 |     100 |  100.00 |
  branch.service.js         |   75.86 |    50.00 |     100 |   75.86 |
 modules/categories         |   91.76 |    74.13 |     100 |   91.76 |
  category.controller.js    |  100.00 |   100.00 |     100 |  100.00 |
  category.dto.js           |  100.00 |   100.00 |     100 |  100.00 |
  category.model.js         |  100.00 |   100.00 |     100 |  100.00 |
  category.routes.js        |  100.00 |   100.00 |     100 |  100.00 |
  category.service.js       |   87.27 |    71.15 |     100 |   87.27 |
 modules/products           |   87.57 |    70.43 |    92.30 |   87.82 |
  product.controller.js     |  100.00 |   100.00 |     100 |  100.00 |
  product.dto.js            |  100.00 |   100.00 |     100 |  100.00 |
  product.model.js          |  100.00 |   100.00 |     100 |  100.00 |
  product.routes.js         |  100.00 |   100.00 |     100 |  100.00 |
  product.service.js        |   83.05 |    69.91 |   88.88 |   83.18 |
 utils                      |   96.87 |    25.00 |     100 |  100.00 |
----------------------------|---------|----------|---------|---------|
```
* **Nhận xét:** Toàn bộ các mô-đun nghiệp vụ cốt lõi đều đạt **Line Coverage từ 87% - 93%**, vượt xa yêu cầu tối thiểu 70% của rubric Mức 5.

### 3.3. Pipeline Tự Động Hóa CI/CD (TC2.6)
* Đã thiết lập workflow `.github/workflows/ci.yml` chạy trên `ubuntu-latest` với `Node.js 20.x`.
* Pipeline bao gồm 7 bước tự động: Checkout -> Setup Node.js (với Cache npm) -> Clean Install (`npm ci`) -> Lint Check -> Security Audit (`npm audit --audit-level=high`) -> Automated Tests & Coverage -> Lưu trữ báo cáo Artifacts (`backend-coverage-report`) trong 14 ngày.

---

## 4. KẾ HOẠCH BƯỚC TIẾP THEO (NEXT STEPS)

1. **Phân hệ Tồn kho Đa Chi nhánh (`Branch Inventory Module`):**
   - Hiện thực hóa API phân bổ tồn kho đa chi nhánh (`branch_inventories`) kết hợp kỹ thuật Atomic Updates (`$inc`, `$gte`).
2. **Phân hệ Quản lý Serial/IMEI & Máy quét POS (`Serial Module`):**
   - Hiện thực hóa API quét mã vạch kiểm tra trạng thái `IN_STOCK`.
   - Vận hành State Machine khép kín (`IN_STOCK` ➔ `RESERVED` ➔ `SOLD` ➔ `WARRANTY`).
3. **Phân hệ Đơn hàng & Thanh toán (`Order & Checkout Modules`):**
   - Triển khai POS Checkout tại quầy và B2C Online Checkout giải quyết bài toán chống Overselling / Concurrency Control.
