# 🗄️ DATABASE SCHEMA MAP (MONGODB / MONGOOSE)

* **Database Engine:** MongoDB 7.0+
* **ODM:** Mongoose v8+
* **Nguyên tắc:** 1 Database duy nhất chứa 7 Collection cốt lõi.
* **Design:** Áp dụng **Dynamic Schema** cho thuộc tính sản phẩm và **State Machine** cho Serial/IMEI.

---

## 1. DANH SÁCH 7 COLLECTION CỐT LÕI

### 1.1. Collection: `users`

**Mục đích:** Lưu tài khoản người dùng toàn hệ thống (B2C, Staff, Manager, Admin).

```typescript
interface IUser {
  _id: ObjectId;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'CUSTOMER' | 'STAFF' | 'BRANCH_MANAGER' | 'SUPER_ADMIN';
  branchId?: ObjectId; // Bắt buộc nếu role = STAFF hoặc BRANCH_MANAGER
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 1.2. Collection: `branches`

**Mục đích:** Lưu danh sách các chi nhánh cửa hàng vật lý.

```typescript
interface IBranch {
  _id: ObjectId;
  branchCode: string; // VD: "BR-Q1", "BR-TDUC"
  name: string;
  address: string;
  phone: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 1.3. Collection: `categories`

**Mục đích:** Lưu danh mục sản phẩm đa cấp.

```typescript
interface ICategory {
  _id: ObjectId;
  name: string; // VD: "Laptop", "Điện thoại", "Linh kiện"
  slug: string;
  parentId?: ObjectId;
  attributeKeys: string[]; // VD: ["CPU", "RAM", "VGA", "Storage"]
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 1.4. Collection: `products` — Dynamic Schema Pattern

**Mục đích:** Lưu thông tin sản phẩm và tồn kho được phân bổ theo nhiều chi nhánh.

```typescript
interface IProduct {
  _id: ObjectId;
  sku: string;
  name: string;
  slug: string;
  categoryId: ObjectId;
  brand: string;
  basePrice: number;
  salePrice: number;
  images: string[];

  // Dynamic Schema attributes
  attributes: Array<{
    key: string;   // VD: "CPU"
    value: string; // VD: "Intel Core i7-13700H"
  }>;

  // Inventory phân bổ đa chi nhánh
  inventory: Array<{
    branchId: ObjectId;
    quantity: number;
  }>;

  isSerialManaged: boolean; // true với ĐTDĐ/Laptop, false với phụ kiện nhỏ
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 1.5. Collection: `serials` — State Pattern

**Mục đích:** Quản lý vòng đời độc bản của từng thiết bị thông qua mã Serial/IMEI.

```typescript
interface ISerial {
  _id: ObjectId;
  serialNumber: string; // Duy nhất (Unique Index)
  productId: ObjectId;
  branchId: ObjectId;   // Vị trí kho chi nhánh hiện tại
  status: 'IN_STOCK' | 'RESERVED' | 'SOLD' | 'WARRANTY' | 'TRANSIT';
  orderId?: ObjectId;   // Đơn hàng đã bán/đặt giữ
  soldAt?: Date;
  warrantyEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 1.6. Collection: `orders`

**Mục đích:** Lưu đơn hàng B2C Online và đơn hàng xuất tại quầy Web POS.

```typescript
interface IOrder {
  _id: ObjectId;
  orderCode: string; // VD: "ORD-20260921-001"
  orderType: 'B2C_ONLINE' | 'POS_STORE';

  customerId?: ObjectId;
  branchId: ObjectId; // Chi nhánh xử lý/bán xuất
  staffId?: ObjectId; // Thu ngân POS (nếu bán tại quầy)

  items: Array<{
    productId: ObjectId;
    productName: string;
    quantity: number;
    price: number;
    serialsAssigned: string[]; // Danh sách Serial/IMEI gắn cho item này
  }>;

  totalAmount: number;

  paymentMethod:
    | 'CASH'
    | 'VNPAY'
    | 'STRIPE'
    | 'BANK_TRANSFER';

  paymentStatus:
    | 'PENDING'
    | 'PAID'
    | 'FAILED'
    | 'REFUNDED';

  orderStatus:
    | 'PENDING'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'CANCELLED';

  createdAt: Date;
  updatedAt: Date;
}
```

---

### 1.7. Collection: `warrantytickets`

**Mục đích:** Lưu phiếu tiếp nhận và xử lý bảo hành điện tử.

```typescript
interface IWarrantyTicket {
  _id: ObjectId;
  ticketCode: string;
  serialNumber: string;
  productId: ObjectId;
  customerId: ObjectId;
  branchId: ObjectId;
  staffId: ObjectId;
  issueDescription: string;

  status:
    | 'RECEIVED'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'RETURNED';

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 2. TÓM TẮT THIẾT KẾ

| Collection        | Vai trò chính                   | Design áp dụng        |
| ----------------- | ------------------------------- | --------------------- |
| `users`           | Quản lý tài khoản và phân quyền | RBAC                  |
| `branches`        | Quản lý chi nhánh               | Multi-Branch          |
| `categories`      | Quản lý danh mục sản phẩm       | Hierarchical Category |
| `products`        | Quản lý sản phẩm và tồn kho     | Dynamic Schema        |
| `serials`         | Quản lý Serial/IMEI             | State Machine         |
| `orders`          | Quản lý đơn hàng B2C/POS        | Transaction & OCC     |
| `warrantytickets` | Quản lý bảo hành                | Workflow/State        |

---

## 3. QUAN HỆ TỔNG QUAN

```text
users
  │
  ├── branchId ──────────────► branches
  │
  ├── customerId ────────────► orders
  │
  └── staffId ───────────────► orders
                                  │
                                  ├── productId ───────► products
                                  │
                                  └── serialsAssigned ─► serials
                                                           │
                                                           └── productId ──► products
                                                           │
                                                           └── orderId ────► orders
                                                                                 │
                                                                                 └── warrantytickets

categories
  │
  └── categoryId ────────────► products
```

---

## 4. SERIAL / IMEI STATE MACHINE

```text
              ┌─────────────┐
              │  IN_STOCK   │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │  RESERVED   │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │    SOLD     │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │  WARRANTY   │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │   TRANSIT   │
              └─────────────┘
```

> **Lưu ý:** Trong triển khai thực tế, `TRANSIT` có thể được sử dụng như trạng thái trung gian khi thiết bị đang được điều chuyển giữa các chi nhánh. Vì vậy, luồng chuyển trạng thái cụ thể cần được quy định bằng business rule của hệ thống.
