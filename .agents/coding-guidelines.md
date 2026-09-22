# 📏 CODING GUIDELINES & GIT CONVENTIONS

* **Mục tiêu:** Đáp ứng Mức 5 (Xuất sắc) tiêu chí **TC2.4 (Chất lượng mã nguồn)**.
* **Tiêu chuẩn:** 0 lỗi ESLint, 0 issue Critical/Blocker, 0 Secret lộ trên Repository.

---

## 1. QUY TẮC ĐẶT TÊN (NAMING CONVENTIONS)

### 1.1. Variables & Functions

Sử dụng `camelCase`.

```javascript
const productPrice = 15000000;

function calculateDiscount() {
  // ...
}
```

### 1.2. Components & Models

Sử dụng `PascalCase`.

```text
ProductCard.jsx
User.js
ProductService.js
```

### 1.3. Files & Folders

Sử dụng `kebab-case` hoặc `camelCase`, nhưng phải nhất quán trong toàn bộ project.

```text
use-barcode-scanner.js
```

hoặc:

```text
useBarcodeScanner.js
```

### 1.4. Environment Variables

Sử dụng `UPPER_SNAKE_CASE`.

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tech-store
JWT_SECRET=your-secret-key
```

---

## 2. QUY TẮC VIẾT CODE BACKEND (NODE.JS / EXPRESS)

### 2.1. Async Handling

100% Async Controller phải được xử lý lỗi thông qua `catchAsyncError` hoặc `try-catch` để tránh lỗi không được bắt và làm ảnh hưởng đến ứng dụng.

**Ví dụ sử dụng `catchAsyncError`:**

```javascript
const getProducts = catchAsyncError(async (req, res) => {
  const products = await productService.getProducts();

  res.status(200).json({
    success: true,
    data: products
  });
});
```

---

### 2.2. Lean Queries

Đối với các API chỉ đọc (**Read-only**), ưu tiên sử dụng `.lean()` trong Mongoose Query để giảm overhead khi hydrate Document.

Mục tiêu hỗ trợ KPI:

`T_avg < 200ms`

**Ví dụ:**

```javascript
const products = await Product
  .find({ isActive: true })
  .lean();
```

---

### 2.3. Atomic Operations

Khi cập nhật tồn kho, **không được đọc dữ liệu về JavaScript rồi mới thực hiện phép cộng/trừ**.

Bắt buộc sử dụng các phép toán Atomic của MongoDB như `$inc` và điều kiện `$gte` để hạn chế Race Condition và Overselling.

**Ví dụ:**

```javascript
await Product.updateOne(
  {
    _id: productId,
    "inventory.branchId": branchId,
    "inventory.quantity": { $gte: qty }
  },
  {
    $inc: {
      "inventory.$.quantity": -qty
    }
  }
);
```

Sau khi thực hiện update, phải kiểm tra kết quả thao tác để xác định việc trừ tồn kho có thành công hay không.

```javascript
const result = await Product.updateOne(
  {
    _id: productId,
    "inventory.branchId": branchId,
    "inventory.quantity": { $gte: qty }
  },
  {
    $inc: {
      "inventory.$.quantity": -qty
    }
  }
);

if (result.modifiedCount === 0) {
  throw new Error("PRODUCT_OUT_OF_STOCK");
}
```

---

## 3. QUY TẮC QUẢN LÝ GIT & PULL REQUESTS

### 3.1. Quy tắc đặt tên Branch

Sử dụng cấu trúc:

```text
<type>/<short-description>
```

Các loại Branch chính:

* `feature/` — Phát triển tính năng mới.
* `fix/` — Sửa lỗi.
* `docs/` — Cập nhật tài liệu.
* `refactor/` — Refactor code mà không thay đổi behavior.
* `test/` — Bổ sung hoặc chỉnh sửa test.
* `chore/` — Công việc bảo trì hoặc cấu hình.

**Ví dụ:**

```text
feature/pos-barcode-scanner
fix/race-condition-checkout
docs/update-sdd
refactor/product-service
test/order-checkout
chore/update-dependencies
```

---

### 3.2. Quy tắc Commit Message

Áp dụng chuẩn **Conventional Commits**.

Cấu trúc:

```text
<type>(<scope>): <description>
```

**Ví dụ:**

```text
feat(pos): add keyboard listener for barcode scanner

fix(inventory): fix race condition using atomic mongo operation

docs(ai-log): update AI Usage Log for week 2
```

Các `type` chính:

| Type       | Mục đích                   |
| ---------- | -------------------------- |
| `feat`     | Thêm tính năng mới         |
| `fix`      | Sửa lỗi                    |
| `docs`     | Cập nhật tài liệu          |
| `refactor` | Refactor code              |
| `test`     | Thêm hoặc sửa test         |
| `chore`    | Công việc bảo trì/cấu hình |
| `perf`     | Cải thiện hiệu năng        |
| `ci`       | Thay đổi CI/CD             |

---

### 3.3. Pull Request

Mỗi Pull Request nên bao gồm:

1. **Mô tả ngắn gọn** về thay đổi.
2. **Danh sách các tính năng hoặc file chính đã thay đổi.**
3. **Kết quả kiểm thử.**
4. **Ảnh chụp màn hình** nếu thay đổi liên quan đến UI.
5. **Thông tin về Breaking Change** nếu có.

Trước khi tạo Pull Request cần đảm bảo:

```text
✓ ESLint không có lỗi
✓ Unit/Integration Test đạt
✓ Không còn Secret trong source code
✓ Không commit file .env
✓ Code đã được format
✓ Commit message đúng Conventional Commits
```

---

## 4. QUY TẮC BẢO MẬT SECRET (TC2.4)

### 4.1. Không Commit File `.env`

Không được commit các file chứa thông tin nhạy cảm:

```text
.env
.env.local
.env.production
.env.development
```

Các file này phải được khai báo trong `.gitignore`.

```gitignore
.env
.env.*
!.env.example
```

---

### 4.2. Sử dụng Environment Variables

Mọi cấu hình nhạy cảm phải được đọc từ `process.env`.

```javascript
const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
```

Không được hard-code:

```javascript
// ❌ Không được phép
const JWT_SECRET = "my-super-secret-key";
```

Thay vào đó:

```javascript
// ✅ Đúng
const JWT_SECRET = process.env.JWT_SECRET;
```

---

### 4.3. Kiểm tra Secret bằng Gitleaks

Sử dụng **Gitleaks** để quét Secret trước khi Push/PR.

```bash
gitleaks detect
```

Hoặc quét Repository:

```bash
gitleaks detect --source .
```

Nếu phát hiện Secret:

```text
❌ Không được Push code
❌ Không được đưa Secret lên Pull Request
❌ Không được bỏ qua cảnh báo
```

Secret phải được loại bỏ khỏi source code và thay thế bằng Environment Variable.

---

## 5. CODE QUALITY CHECKLIST

Trước khi Merge Pull Request, Developer phải kiểm tra:

```text
[ ] ESLint: 0 errors
[ ] ESLint: 0 warnings quan trọng
[ ] Test: Passed
[ ] Build: Passed
[ ] Gitleaks: No secrets detected
[ ] Không commit .env
[ ] Không hard-code credentials
[ ] API tuân thủ API Contracts
[ ] Database Query tuân thủ Repository/Service Pattern
[ ] Inventory Update sử dụng Atomic Operation
[ ] Commit Message đúng Conventional Commits
[ ] Pull Request có mô tả đầy đủ
```

---

## 6. MỤC TIÊU CHẤT LƯỢNG MÃ NGUỒN

| Tiêu chí                                  | Mục tiêu |
| ----------------------------------------- | -------- |
| ESLint Errors                             | `0`      |
| Critical/Blocker Issues                   | `0`      |
| Secret trên Repository                    | `0`      |
| Commit theo Conventional Commits          | `100%`   |
| API tuân thủ API Contract                 | `100%`   |
| Inventory Update sử dụng Atomic Operation | `100%`   |
| Pull Request có Review                    | `100%`   |
