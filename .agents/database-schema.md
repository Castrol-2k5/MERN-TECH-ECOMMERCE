# 🗄️ DATABASE SCHEMA MAP (MONGODB / MONGOOSE)

- **Database Engine:** MongoDB 7.0+
- **ODM:** Mongoose v8+
- **Nguyên tắc:** 1 Database duy nhất chứa 7 Collection cốt lõi.
- **Design:** Áp dụng **Dynamic Schema** cho thuộc tính sản phẩm và **State Machine** cho Serial/IMEI.

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
  role: "CUSTOMER" | "STAFF" | "BRANCH_MANAGER" | "SUPER_ADMIN";
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
    type: "Point";
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
  name: string; // VD: Laptop ASUS ROG Strix G16
  slug: string;
  categoryId: ObjectId; // Reference -> categories
  brand: string;
  description: string;
  images: string[];
  isSerialManaged: boolean; // true với Laptop/Phone, false với phụ kiện
  isActive: boolean;

  // 1. Nhúng Product Options (VD: Màu sắc, Dung lượng RAM)
  options: Array<{
    _id: ObjectId;
    name: string; // VD: "Màu sắc", "RAM"
    displayType: string; // VD: "color_picker", "button"
    values: string[]; // VD: ["Xám", "Đen"] hoặc ["16GB", "32GB"]
  }>;

  // 2. Nhúng danh sách SKUs thực tế bán (Product SKUs)
  skus: Array<{
    _id: ObjectId; // SKU ID dùng để reference ở Orders/Serials/Inventory
    sku: string; // Unique Code: "ROG-G16-RAM16-BLK"
    price: number;
    salePrice: number;
    images: string[];
    // Key-value của biến thể này (thay thế cho bảng sku_option_values)
    optionValues: Array<{
      optionName: string; // VD: "RAM"
      value: string; // VD: "16GB"
    }>;
    isActive: boolean;
  }>;

  // Dynamic Schema attributes (Thuộc tính kỹ thuật chung phục vụ Bộ lọc & So sánh)
  attributes: Array<{
    key: string; // VD: "CPU", "VGA", "Màn hình"
    value: string; // VD: "Intel Core i7-13700H", "RTX 4060"
  }>;

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
  serialNumber: string; // Unique Index
  productId: ObjectId;
  productSkuId: ObjectId; // Reference -> SKU
  branchId: ObjectId; // Vị trí kho chi nhánh hiện tại
  status: "IN_STOCK" | "RESERVED" | "SOLD" | "WARRANTY" | "TRANSIT";
  orderId?: ObjectId;
  orderItemId?: ObjectId;
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
  orderCode: string; // Unique
  orderType: "B2C_ONLINE" | "POS_STORE";
  customerId?: ObjectId;
  branchId: ObjectId;
  staffId?: ObjectId; // Thu ngân POS

  // Nhúng danh sách Order Items
  items: Array<{
    _id: ObjectId; // orderItemId
    productId: ObjectId;
    productSkuId: ObjectId;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    serialsAssigned: string[]; // Mã Serial/IMEI thực tế đã gán khi xuất kho/bán
  }>;

  totalAmount: number;
  paymentMethod: "CASH" | "VNPAY" | "STRIPE";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  orderStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";
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

  status: "RECEIVED" | "PROCESSING" | "COMPLETED" | "RETURNED";

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### 1.8. Collection: `branch_inventories`

**Mục đích:** Quản lý tồn kho theo từng SKU tại từng chi nhánh.

```typescript
interface IBranchInventory {
  _id: ObjectId;
  branchId: ObjectId; // Reference -> branches
  productId: ObjectId; // Reference -> products
  productSkuId: ObjectId; // Reference -> SKU cụ thể nằm trong products.skus._id
  quantity: number;
}
```

---

### 1.9. Collection: `carts`

**Mục đích:** Lưu thông tin giỏ hàng.

```typescript
interface ICart {
  _id: ObjectId;
  userId: ObjectId;
  items: Array<{
    productId: ObjectId;
    productSkuId: ObjectId; // SKU được chọn
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 2. TÓM TẮT THIẾT KẾ

| Collection           | Vai trò chính                   | Design áp dụng        |
| -------------------- | ------------------------------- | --------------------- |
| `users`              | Quản lý tài khoản và phân quyền | RBAC                  |
| `branches`           | Quản lý chi nhánh               | Multi-Branch          |
| `categories`         | Quản lý danh mục sản phẩm       | Hierarchical Category |
| `products`           | Quản lý sản phẩm và tồn kho     | Dynamic Schema        |
| `serials`            | Quản lý Serial/IMEI             | State Machine         |
| `orders`             | Quản lý đơn hàng B2C/POS        | Transaction & OCC     |
| `warrantytickets`    | Quản lý bảo hành                | Workflow/State        |
| `branch_inventories` | Quản lý tồn kho chi nhánh       | Transaction & OCC     |
| `carts`              | Quản lý giỏ hàng                | Workflow/State        |

---

## 3. QUAN HỆ TỔNG QUAN

```text
users
  │
  ├── branchId ──────────────► branches
  │                              │
  ├── customerId ────────────► orders ◄───────── branchId
  │                              │
  └── staffId ───────────────► orders
                                 │
                                 ├── productId ──────────────► products
                                 │                              │
                                 ├── productSkuId ───────────► products.skus
                                 │                              │
                                 └── serialsAssigned ────────► serials
                                                                │
                                                                ├── productId ────────► products
                                                                │
                                                                ├── productSkuId ──────► products.skus
                                                                │
                                                                ├── branchId ─────────► branches
                                                                │
                                                                └── orderId / ────────► orders
                                                                    orderItemId          │
                                                                                         └── warrantytickets

categories
  │
  └── parentId ──────────────► categories (Hierarchy parent / child)
  │
  └── categoryId ────────────► products
                                 │
                                 ├── options [Embed] ───────── (Màu sắc, RAM, dung lượng...)
                                 ├── attributes [Embed] ────── (CPU, VGA, Màn hình... Specs)
                                 │
                                 └── skus [Embed] ────────────► branch_inventories ◄── branchId ── branches
                                       │
                                       └──────────────────────► carts.items
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
