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

## 4. QUY CHUẨN KIỂM THỬ TỰ ĐỘNG (AUTOMATED TESTING CONVENTIONS - TC2.5)

Mọi tính năng (Feature) mới sau khi hoàn thành bắt buộc phải có bộ kiểm thử tự động đi kèm trước khi mở Pull Request vào nhánh chính:

1. **Quy định tỷ lệ độ phủ (Code Coverage Mandate):**
   - Độ phủ dòng lệnh (Line/Statement Coverage) cho các mô-đun nghiệp vụ cốt lõi (Auth, Products, Orders/POS, Inventory) bắt buộc đạt **≥ 70%** (Đáp ứng tiêu chí Mức 5 của TC2.5).
   - Bộ test phải được cấu hình chạy tự động trong script npm: `"test:coverage": "jest --coverage"`.

2. **Cấu trúc thư mục & Quy ước đặt tên file Test:**
   - File test đặt trong thư mục `server/tests/` hoặc nằm cùng thư mục module theo định dạng: `*.test.js` hoặc `*.spec.js`.
   - Phân định rõ tầng kiểm thử:
     - `tests/unit/`: Kiểm thử hàm đơn lẻ, Service Logic, Helpers, Token generators (Mock database).
     - `tests/integration/`: Kiểm thử toàn bộ luồng API từ Routes -> Controller -> DB thông qua `supertest` kết hợp `mongodb-memory-server`.

3. **Cấu trúc chuẩn một kịch bản Test (AAA Pattern - Arrange, Act, Assert):**
   - Mỗi test case phải thể hiện rõ:
     - **Arrange:** Chuẩn bị dữ liệu mẫu và môi trường giả lập.
     - **Act:** Thực thi endpoint API hoặc hàm cần kiểm tra.
     - **Assert:** Khẳng định mã HTTP trả về, cấu trúc JSON contract và dữ liệu trong CSDL.

4. **Yêu cầu bao phủ ca kiểm thử (Test Case Matrix):**
   - **Happy Path (Ca thuận lợi):** Đảm bảo tính năng hoạt động chính xác với dữ liệu hợp lệ.
   - **Negative Path (Ca âm):** Kiểm tra mã lỗi trả về (400, 401, 403, 404) khi dữ liệu sai định dạng, thiếu trường bắt buộc, tài khoản bị khóa hoặc token hết hạn.
   - **Edge / Boundary Cases (Ca biên & Bảo mật):** Thử nghiệm truyền chuỗi rỗng, vượt quá độ dài ký tự tối đa, giả mạo role, thao túng branchId của chi nhánh khác.
   - **100% Test Case phải truy vết được tới Acceptance Criteria (AC)** đã đặc tả trong SRS/SDD.

---

## 5. QUY TẮC BẢO MẬT SECRET (TC2.4)

### 5.1. Không Commit File `.env`

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

### 5.2. Sử dụng Environment Variables

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

### 5.3. Kiểm tra Secret bằng Gitleaks

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

## 6. CODE QUALITY CHECKLIST

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

## 7. MỤC TIÊU CHẤT LƯỢNG MÃ NGUỒN

| Tiêu chí                                  | Mục tiêu |
| ----------------------------------------- | -------- |
| ESLint Errors                             | `0`      |
| Critical/Blocker Issues                   | `0`      |
| Secret trên Repository                    | `0`      |
| Commit theo Conventional Commits          | `100%`   |
| API tuân thủ API Contract                 | `100%`   |
| Inventory Update sử dụng Atomic Operation | `100%`   |
| Pull Request có Review                    | `100%`   |
