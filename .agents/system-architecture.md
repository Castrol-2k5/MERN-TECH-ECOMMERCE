# 🏛️ SYSTEM ARCHITECTURE & TECH STACK

- **Đề tài:** Nghiên cứu công nghệ MERN Stack và xây dựng website thương mại điện tử cho chuỗi cửa hàng thiết bị công nghệ.
- **Mô hình kiến trúc tổng thể:** Modular Monolith (Hệ thống hợp nhất Unified Platform).
- **Mô hình vận hành:** Omnichannel Retail (B2C Web, Web POS, Branch Admin, HQ Super Admin).

---

## 1. TECH STACK CHUẨN HOÁ

### 1.1. Backend
- **Runtime:** Node.js (v20+ LTS)
- **Framework:** Express.js
- **Database:** MongoDB (v7.0+)
- **ODM:** Mongoose (v8+)
- **Authentication & Authorization:** JWT (JSON Web Tokens) + BcryptJS
- **Real-time Engine:** WebSockets (`socket.io`) kết hợp MongoDB Change Streams.
- **Validation:** `joi` / `zod`

### 1.2. Frontend
- **Library:** React.js (v18+) với Vite
- **State Management:** Redux Toolkit / React Query (TanStack Query)
- **Routing:** React Router DOM (v6+)
- **UI Framework / Styling:** Tailwind CSS / Ant Design / Shadcn UI
- **Hardware Integration:** Custom Keyboard Event Listener (Tương thích Barcode Scanner 1D/2D) & `html5-qrcode`

### 1.3. DevOps & Testing
- **Linter & Formatter:** ESLint + Prettier
- **Testing:** Jest / Supertest (Backend), Vitest / React Testing Library (Frontend)
- **CI/CD:** GitHub Actions (Pipeline 6 chặng)
- **Deployment:** Render / Vercel / AWS / Docker Container

---

## 2. KIẾN TRÚC MÔ-ĐUN (MODULAR MONOLITH)

Hệ thống Backend Node.js được phân chia thành các Module độc lập về nghiệp vụ. Mỗi Module tự quản lý Controller, Service, Model/Schema và Routes riêng:

```text
server/src/modules/
├── auth/          # Quản lý Đăng nhập, JWT Token, Phân quyền RBAC
├── users/         # Quản lý Khách hàng, Nhân viên POS, Quản lý chi nhánh
├── branches/      # Quản lý Danh mục cửa hàng & Kho chi nhánh
├── products/      # Quản lý Sản phẩm & Dynamic Schema Attributes
├── serials/       # Quản lý Mã Serial/IMEI & Máy trạng thái (State Pattern)
├── orders/        # Quản lý Đơn hàng B2C, POS & Xử lý Race Condition (OCC)
├── warranty/      # Quản lý Phiếu tiếp nhận & Lịch sử bảo hành điện tử
└── analytics/     # Quản lý Báo cáo doanh thu toàn chuỗi & Chi nhánh
```

---

## 3. CÁC MÔ HÌNH THIẾT KẾ PHẦN MỀM CỐT LÕI (DESIGN PATTERNS)

### Service-Repository Pattern
Tách biệt rõ ràng giữa các tầng:
- **Controller:** Xử lý HTTP Request/Response.
- **Service:** Xử lý Business Logic.
- **Repository:** Thực hiện truy xuất và thao tác dữ liệu MongoDB.

### Dynamic Schema Pattern
Sử dụng cấu trúc **Key-Value linh hoạt** trong MongoDB để lưu trữ các thông số kỹ thuật của thiết bị công nghệ như **CPU, RAM, VGA, Dung lượng,...** mà không yêu cầu Schema cố định.

### State Pattern (Serial Lifecycle)
Quản lý vòng đời khép kín của mã **Serial/IMEI** thông qua các trạng thái:

`IN_STOCK ➔ RESERVED ➔ SOLD ➔ WARRANTY ➔ TRANSIT`

### Optimistic Concurrency Control (OCC) & Atomic Operations
Sử dụng toán tử **`$inc` có điều kiện** hoặc trường **`__v` của Mongoose** để kiểm soát đồng thời, ngăn chặn tình trạng **Overselling** khi B2C Web và Web POS cùng thực hiện checkout sản phẩm cuối cùng.

### RBAC (Role-Based Access Control)
Sử dụng **Middleware** để kiểm tra Token và phân quyền truy cập theo 4 vai trò:

- `CUSTOMER`
- `STAFF`
- `BRANCH_MANAGER`
- `SUPER_ADMIN`