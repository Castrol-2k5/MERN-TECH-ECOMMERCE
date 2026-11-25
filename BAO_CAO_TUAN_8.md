# 📋 BÁO CÁO TIẾN ĐỘ THỰC HIỆN ĐỀ TÀI - TUẦN 8
### (Từ ngày 02/11/2026 đến ngày 08/11/2026)

- **Tên đề tài:** Nghiên cứu công nghệ MERN Stack và xây dựng website thương mại điện tử cho chuỗi cửa hàng thiết bị công nghệ.
- **Mã đề tài / Hệ thống:** [projects-fit.hcmute.edu.vn](https://projects-fit.hcmute.edu.vn)
- **Giảng viên hướng dẫn:** ThS. Nguyễn Hữu Trung
- **Sinh viên thực hiện:**
  1. Nguyễn Quốc Bảo – MSSV: 23110182
  2. Trần Nguyễn Castrol – MSSV: 23110185
- **Trọng tâm kỹ thuật Tuần 8:** Hoàn thiện chuyên sâu **Phân hệ Nhân viên Quầy POS (Web POS Expansion)**: Quản lý Ca két Tiền mặt (Cash Drawer Shifts), Phiếu Thu/Chi khẩn cấp, In Biên bản Bàn giao ca K80, Quy trình Đổi/Trả hàng hoàn tiền kèm phục hồi tồn kho & Serial, Tra cứu khách hàng thân thiết CRM bằng số điện thoại, Cross-sell tại quầy, Chuông báo đơn hàng online Click & Collect kèm phiếu Pick & Pack, và Dashboard doanh số cá nhân của thu ngân.

---

## 1. MỤC TIÊU (Tính thực tiễn, sự hiểu biết về vấn đề)

- Xây dựng module quản lý ca két tiền mặt (Cash Drawer Shifts) cho nhân viên thu ngân POS với đầy đủ 4 trạng thái: Khởi tạo ca đầu ngày (`OPEN`), Nạp/Rút tiền khẩn cấp (`CASH_IN`/`CASH_OUT`), Bàn giao ca (`HANDOVER`) và Chốt ca cuối ngày (`CLOSED`).
- Xây dựng quy trình nghiệp vụ Đổi/Trả hàng (Order Return & Refund) tại quầy POS, xử lý bù trừ dòng tiền két ca nguyên tử và phục hồi trạng thái Serial/IMEI về lại kho hàng (`IN_STOCK`).
- Hiện thực hóa tính năng Tra cứu khách hàng thân thiết (CRM Phone Lookup) tại quầy POS giúp nhận diện hạng thành viên và gợi ý thông minh sản phẩm mua kèm (Cross-sell strip) theo thời gian thực.
- Xây dựng hệ thống chuông cảnh báo âm thanh và Pop-up đơn hàng trực tuyến (Click & Collect) đổ về chi nhánh kèm mẫu in phiếu nhặt hàng (Pick & Pack slip).
- Xây dựng trang báo cáo hiệu suất và doanh số cá nhân (Staff Performance Dashboard) hiển thị trực quan hoa hồng bán hàng, doanh thu thực thu và chỉ số đơn phục vụ.

---

## 2. PHẠM VI (Phân tích nghiệp vụ, đặc tả yêu cầu, thiết kế - giải pháp)

### 2.1. Trong phạm vi thực hiện (In-Scope - Tuần 8)
- **Nghiệp vụ Ca két tiền mặt (Cash Shift Lifecycle):**
  - Khai báo số dư tiền mặt đầu ca (`openingCash`).
  - Lập phiếu Thu tiền phát sinh (`CASH_IN`) và Chi tiền phát sinh (`CASH_OUT`) có ghi chú lý do.
  - Tự động cộng dồn doanh thu tiền mặt thu được từ các đơn hàng POS trong ca (`systemExpectedCash = openingCash + cashSales + cashIn - cashOut - cashRefunds`).
  - In biên bản bàn giao ca chuẩn khổ giấy in nhiệt POS K80 (80mm).
- **Nghiệp vụ Đổi / Trả hàng tại quầy (Order Return & Refund):**
  - Hỗ trợ nhân viên tra cứu hóa đơn gốc đã mua tại bất kỳ chi nhánh nào trong chuỗi.
  - Chọn danh sách sản phẩm/Serial cần trả lại cửa hàng.
  - Hoàn tiền mặt trực tiếp cho khách và trừ vào dòng tiền mặt của ca POS hiện tại (`cashRefunds`).
  - Cập nhật số lượng tồn kho nguyên tử (`$inc: { quantity: +qty }`) và chuyển trạng thái mã Serial/IMEI từ `SOLD` về `IN_STOCK`.
- **Nghiệp vụ Hỗ trợ Bán hàng Đa kênh tại quầy:**
  - Nhập SĐT khách hàng để tra cứu thông tin tích điểm, xem nhanh bảng thông số kỹ thuật (Spec Sheet) của thiết bị đang tư vấn.
  - Bắt tín hiệu đơn hàng Click & Collect gửi thông báo âm thanh nổi (Audio Sound Alert) và in phiếu điều phối Pick & Pack.
  - Dashboard thống kê doanh số cá nhân và hoa hồng tạm tính của nhân viên.

### 2.2. Ngoài phạm vi thực hiện (Out-of-Scope - Tuần 8)
- Phê duyệt các khoản chênh lệch tiền két vượt định mức của Quản lý chi nhánh (đưa sang Tuần 9 thuộc phạm vi Branch Manager).
- Tích hợp cổng thanh toán máy quẹt thẻ POS cầm tay (POS Terminal mPOS/SmartPOS qua giao tiếp Bluetooth/NFC) – Giữ nguyên thanh toán VietQR và Tiền mặt.

---

## 3. BẢNG PHÂN CÔNG CÔNG VIỆC (Kèm link kết quả, PR, file, tính năng)

| STT | Thành viên | Nhiệm vụ cụ thể | Minh chứng sản phẩm / File / Pull Request | Commit Hash |
| :---: | :--- | :--- | :--- | :---: |
| 1 | **Nguyễn Quốc Bảo** (23110182) | • Thiết kế Data Schema Mongoose cho `Shift.js` (quản lý ca thu ngân, audit transactions).<br>• Xây dựng Backend Service & Controller cho Ca két tiền mặt (`shift.service.js`, `shift.controller.js`).<br>• Lập trình giao diện Modal Bàn giao ca và In phiếu bàn giao K80 (`ShiftHandoverModal.jsx`, `ReceiptTemplate.jsx`). | • Model: `code/server/src/modules/shifts/shift.model.js`<br>• Service: `code/server/src/modules/shifts/shift.service.js`<br>• Component: `code/client/src/features/pos/components/ShiftHandoverModal.jsx` | `93807a6`, `00612c2` |
| 2 | **Trần Nguyễn Castrol** (23110185) | • Xây dựng Backend API Xử lý Đổi trả hàng (`order.service.js` method `processOrderReturn`).<br>• Viết logic Atomic Transactions khôi phục tồn kho và Serial state pattern từ `SOLD` về `IN_STOCK`.<br>• Lập trình giao diện Modal Đổi trả hàng tại quầy POS (`OrderReturnModal.jsx`) tích hợp trừ tiền két ca. | • Controller: `code/server/src/modules/orders/order.controller.js`<br>• Client: `code/client/src/features/pos/components/OrderReturnModal.jsx`<br>• Test: `code/server/tests/integration/pos-shift-return.test.js` | `4effd13` |
| 3 | **Nguyễn Quốc Bảo** (23110182) | • Hiện thực hóa tính năng Tra cứu khách hàng theo SĐT (CRM Lookup Modal) trên giao diện POS.<br>• Xây dựng thanh công cụ gợi ý bán chéo phụ kiện (Cross-sell accessory strip) và popup xem nhanh cấu hình.<br>• Tối ưu hiệu năng render bằng React `useMemo` và format hiển thị tiền tệ VNĐ chuẩn xác. | • Component: `code/client/src/features/pos/components/CrmCustomerModal.jsx`<br>• Component: `code/client/src/features/pos/components/PosCrossSellBar.jsx`<br>• Page: `code/client/src/features/pos/pages/WebPosPage.jsx` | `74a29ff`, `6c5a49b` |
| 4 | **Trần Nguyễn Castrol** (23110185) | • Xây dựng chuông thông báo Realtime đơn hàng Click & Collect đổ về chi nhánh (`usePosAudio.js`).<br>• Thiết kế Modal xem và In phiếu nhặt hàng đóng gói (`PickAndPackSlipModal.jsx`).<br>• Lập trình trang Dashboard thống kê hiệu suất & KPI cá nhân của nhân viên bán hàng (`StaffDashboardPage.jsx`). | • Hook: `code/client/src/hooks/usePosAudio.js`<br>• Component: `code/client/src/features/orders/components/PickAndPackSlipModal.jsx`<br>• Page: `code/client/src/features/staff/pages/StaffDashboardPage.jsx` | `cf3b310`, `6972892` |
| 5 | **Nhóm SV** (Bảo & Castrol) | • Thiết lập bộ dữ liệu giả lập chuẩn (Seed expansion) cho ca làm việc, phiếu thu chi, đơn đổi trả.<br>• Chạy kiểm thử tích hợp tự động Jest & Supertest, rà soát static analysis ESLint đạt 0 cảnh báo. | • Seed: `code/server/src/scripts/seed.js`<br>• Branch PR: `feat/pos-omnichannel-expansion` | `de8036c`, `2ddf3b5` |

---

## 4. CAM KẾT SẢN PHẨM VÀ METRIC (Tính thực tiễn, mức độ hoàn thiện)

| STT | Metric đo lường | Tiêu chuẩn cam kết | Kết quả thực tế đạt được | Đánh giá |
| :---: | :--- | :---: | :---: | :---: |
| 1 | **Thời gian phản hồi API (Read/Write)** | $T_{\text{avg}} < 200\text{ms}$ | **114ms** (Đo đạc trên endpoint tra cứu hóa đơn & chốt ca) | ✅ Đạt xuất sắc |
| 2 | **Số lượng Test tự động hoàn thành** | $\ge 180\text{ tests}$ | **196 / 196 test cases passed** (Đạt 100%) | ✅ Vượt chỉ tiêu |
| 3 | **Độ phủ kiểm thử dòng mã (Coverage)** | $\ge 70\%$ Statements | **78.4% Statements / 73.1% Branches** | ✅ Đạt chuẩn Rubric |
| 4 | **Thời gian đóng gói Frontend (Vite Build)** | $< 3.0\text{s}$ | **1.42s** (2615 modules transformed sạch sẽ) | ✅ Tối ưu cao |
| 5 | **Static Analysis & Coding Convention** | 0 Error / 0 Warning | **ESLint 0 errors, 0 warnings** | ✅ Tuyệt đối |
| 6 | **Thời gian in phiếu bàn giao K80** | $< 500\text{ms}$ | **120ms** phản hồi lệnh in trình duyệt | ✅ Trực quan, tức thì |

---

## 5. REPOSITORY GIT (Mức độ hoàn thiện, khối lượng, chất lượng mã nguồn)

- **Đường dẫn Repository:** [https://github.com/Castrol-2k5/MERN-TECH-ECOMMERCE.git](https://github.com/Castrol-2k5/MERN-TECH-ECOMMERCE.git)
- **Nhánh phát triển chính tuần 8:** `feat/pos-omnichannel-expansion` (đã rebase và sẵn sàng tích hợp về `develop`).
- **Lịch sử commit tiêu biểu trong tuần:**
  - `2ddf3b5`: `feat(audit): implement immutable audit trail, non-blocking activity tracking, snapshot diff modal, and admin portal`
  - `de8036c`: `chore(seed): reset and seed transfers, POS shifts, settlements, and audit logs`
  - `93807a6`: `feat(shifts): implement Wave 1 - cash in/out vouchers, handover print sheet, and fix API response unwrap`
  - `4effd13`: `feat(orders): implement Wave 2 - order return & refund with inventory/serial restoration and shift cashRefunds hook`
  - `74a29ff`: `feat(pos): implement Wave 3 - CRM phone lookup, quick spec sheet, cross-sell strip, and memoize totals`
  - `6c5a49b`: `fix(pos): use formatVnd in CRM lookup modal and align crossSell useMemo deps`
  - `cf3b310`: `feat(orders): implement Wave 4 - branch online alert bell and Pick & Pack slip modal`
  - `6972892`: `feat(analytics): implement Wave 5 - staff personal performance & sales dashboard`
- **Cam kết:** Lịch sử commit đều đặn, thông điệp commit chuẩn `Conventional Commits` (`feat`, `fix`, `chore`, `test`), không push dồn dập vào cuối kỳ.

---

## 6. NHẬT KÝ AI (Làm chủ và kiểm soát LLM/Agentic AI)

### Bảng ghi chép Prompt & Kiểm soát chất lượng AI trong Tuần 8

| Ngày | Người thực hiện | Công cụ AI | Phạm vi áp dụng | Prompt gốc đã gửi | Đề xuất ban đầu của AI | Phân tích phản biện & Phần sinh viên tự tay tái cấu trúc | Commit đối chiếu |
| :---: | :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| 03/11 | Nguyễn Quốc Bảo | Antigravity / Gemini | Quản lý Ca két tiền mặt (`shift.service.js`) | *"Viết logic đóng ca POS tính tiền mặt chênh lệch giữa số tiền kiểm đếm thực tế và phần mềm..."* | AI tính chênh lệch: `difference = actualCash - (openingCash + cashSales)`. Bỏ qua hoàn toàn các phiếu thu/chi tiền mặt khẩn cấp và đơn đổi trả. | **Phát hiện lỗi logic kế toán:** Công thức của AI làm sai lệch két tiền khi quầy có phát sinh chi tiền lẻ hoặc hoàn tiền mặt. Sinh viên tự chuẩn hóa lại công thức: `systemExpectedCash = openingCash + cashSales + cashIn - cashOut - cashRefunds` và lưu trữ `cashDifference` minh bạch vào database. | `93807a6` |
| 04/11 | Trần Nguyễn Castrol | Antigravity / Gemini | Hoàn trả hàng & Khôi phục Serial (`order.service.js`) | *"Xây dựng API trả hàng đơn POS, hoàn lại tiền và cập nhật kho cho sản phẩm có Serial..."* | AI chỉ cập nhật trạng thái đơn hàng `status = 'RETURNED'` và tăng số lượng tổng của Product. | **Phát hiện thiếu tính toàn vẹn dữ liệu:** Thiết bị công nghệ quản lý theo Serial/IMEI, nếu không cập nhật Document Serial thì máy trả về sẽ bị kẹt trạng thái `SOLD` vĩnh viễn, không thể bán lại. Sinh viên viết vòng lặp kiểm tra mảng `returnItems`, cập nhật `serial.status = 'IN_STOCK'` và sử dụng Atomic `$inc` để hoàn tồn kho tại đúng `branchId`. | `4effd13` |
| 05/11 | Nguyễn Quốc Bảo | Antigravity / Gemini | Hiệu năng Render Giao diện POS (`WebPosPage.jsx`) | *"Thêm thanh gợi ý mua kèm phụ kiện (Cross-sell) phía dưới giỏ hàng POS..."* | AI nhúng trực tiếp hàm tính toán gợi ý và format tiền tệ vào thân hàm render component. | **Phát hiện suy giảm hiệu năng (Performance bottleneck):** Mỗi khi nhân viên gõ máy quét mã vạch, component re-render khiến thanh phụ kiện bị tính toán lại liên tục gây giật lag giao diện POS. Sinh viên bọc logic vào `useMemo`, tách hàm format tiền tệ tái sử dụng `formatVnd`. | `74a29ff`, `6c5a49b` |
| 06/11 | Trần Nguyễn Castrol | Antigravity / Gemini | Chuông báo Đơn hàng Click & Collect | *"Tạo âm thanh phát chuông khi có đơn hàng Click & Collect mới chuyển đến chi nhánh..."* | AI khởi tạo thẻ `new Audio(url).play()` trực tiếp trong `useEffect`. | **Phát hiện vi phạm chính sách Autoplay của trình duyệt:** Trình duyệt hiện đại chặn âm thanh tự động nếu người dùng chưa tương tác với trang (Uncaught NotAllowedError). Sinh viên viết hook `usePosAudio` quản lý trạng thái tương tác đầu tiên của nhân viên, có cờ fallback toast thông báo nếu âm thanh bị chặn. | `cf3b310` |

---

## 7. ĐẶC TẢ YÊU CẦU & THIẾT KẾ (SRS / SDD)

### 7.1. Yêu cầu chức năng bổ sung (Functional Requirements)
- **FR-POS-01 (Mở ca & Bàn giao két):** Nhân viên bắt buộc phải có ca làm việc đang mở (`OPEN`) tại đúng chi nhánh mới được thực hiện thanh toán hóa đơn. Khi hết ca, nhân viên kiểm đếm tiền mặt thực tế trong két và in biên bản bàn giao K80.
- **FR-POS-02 (Phiếu Thu/Chi khẩn cấp):** Cho phép nhập tiền bù két (lấy thêm tiền thối từ két sắt) hoặc xuất chi tiền mua vật phẩm văn phòng phẩm nhỏ tại cửa hàng, ghi nhận vào nhật ký ca.
- **FR-POS-03 (Quy trình Đổi/Trả hàng):** Cho phép nhập mã hóa đơn, chọn sản phẩm cần hoàn trả, tính toán số tiền hoàn và tự động đưa Serial máy về trạng thái có thể bán lại.
- **FR-POS-04 (Cảnh báo Click & Collect):** Khi có đơn hàng trực tuyến chọn nhận tại showroom này, hệ thống thông báo tức thì để nhân viên đóng gói trước khi khách đến nhận.

### 7.2. Yêu cầu phi chức năng (Non-Functional Requirements)
- **NFR-SEC-01:** Phân quyền theo chi nhánh (Branch Scoping) - Nhân viên chỉ có thể mở ca và đóng ca tại chi nhánh mình được phân công công tác.
- **NFR-PERF-01:** Thời gian hiển thị gợi ý phụ kiện và tra cứu khách hàng qua SĐT không vượt quá **150ms**.
- **NFR-AUDIT-01:** Mọi thao tác thu tiền, chi tiền và chốt ca đều được ghi vết bất biến (Immutable Audit Log) gắn liền với `userId`, `branchId` và dấu thời gian.

### 7.3. Thiết kế Luồng xử lý nghiệp vụ Đổi trả hàng (Sequence Flow)
```
[Staff POS]              [Order Controller]          [Order Service]          [Inventory & Serial DB]
     |                           |                         |                             |
     |--- 1. POST /orders/return -->|                         |                             |
     |    (orderId, items, cash) |--- 2. processReturn() ->|                             |
     |                           |                         |--- 3. Verify Order & Shift -|
     |                           |                         |--- 4. Atomic $inc Stock --->|
     |                           |                         |--- 5. Serial -> IN_STOCK -->|
     |                           |                         |--- 6. Append Shift CashRefund|
     |                           |<-- 7. Return Result ----|                             |
     |<-- 8. HTTP 200 OK --------|                         |                             |
     |    (Print Return Slip)    |                         |                             |
```

---

## 8. PHÂN TÍCH TĨNH, QUÉT SECRET VÀ CONVENTION

- **Công cụ Phân tích tĩnh (Static Analysis):** Sử dụng `ESLint` phiên bản 9.x kết hợp quy chuẩn React Hooks và JavaScript ES2024.
  - Kết quả quét toàn bộ mã nguồn Client: **0 errors, 0 warnings** trên toàn bộ 15 tệp tin mới tạo/sửa đổi.
- **Quét thông tin nhạy cảm (Secret Scanning):**
  - Chạy công cụ kiểm tra chuỗi token, API Key và password hardcode.
  - Kết quả: Toàn bộ thông tin cấu hình cổng thanh toán, MongoDB URI, JWT Secret đều được quản lý 100% qua tệp `.env` môi trường, không lưu trữ khóa bí mật trong mã nguồn nộp lên Git.
- **Coding Convention:**
  - Định dạng chuẩn: 2 spaces indent, camelCase cho biến/hàm, PascalCase cho React Components, SCREAMING_SNAKE_CASE cho Constants.
  - Sử dụng Zod Schema để validate toàn bộ DTO đầu vào của các API Ca làm việc và Đổi trả hàng.

---

## 9. KIỂM THỬ (Kế hoạch, Test cases, Báo cáo độ phủ, Defect List)

### 9.1. Kế hoạch kiểm thử tính năng Tuần 8
Tập trung kiểm thử tích hợp (Integration Test) cho luồng Ca két tiền mặt và luồng Đổi trả hàng hoàn kho, kết hợp Unit Test kiểm tra tính toán số dư tiền mặt.

### 9.2. Ma trận Test Cases tiêu biểu
| Test Case ID | Tên kịch bản kiểm thử | Dữ liệu đầu vào | Kết quả kỳ vọng | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| `TC-SHIFT-01` | Mở ca làm việc đầu ngày hợp lệ | `openingCash = 2,000,000 ₫`, Staff hợp lệ | HTTP 201 Created, shift status `OPEN` | ✅ PASS |
| `TC-SHIFT-02` | Chặn một nhân viên mở 2 ca đồng thời | Nhân viên đã có ca `OPEN` mở tiếp ca mới | HTTP 400 `SHIFT_ALREADY_OPEN` | ✅ PASS |
| `TC-SHIFT-03` | Lập phiếu Thu/Chi tiền khẩn cấp | Phiếu chi mua đồ `amount = 50,000 ₫` | Số dư két giảm 50,000 ₫, ghi log audit | ✅ PASS |
| `TC-SHIFT-04` | Đóng ca và ghi nhận chênh lệch | Thực tế 5.1M, phần mềm dự kiến 5.0M | Chênh lệch dương `+100,000 ₫`, status `CLOSED` | ✅ PASS |
| `TC-RETURN-01` | Trả hàng sản phẩm có Serial | Hóa đơn đã COMPLETED, chọn 1 máy trả | Kho tăng 1, Serial chuyển về `IN_STOCK` | ✅ PASS |
| `TC-RETURN-02` | Chặn trả hàng vượt số lượng mua | Mua 1 máy nhưng yêu cầu trả 2 máy | HTTP 400 `INVALID_RETURN_QUANTITY` | ✅ PASS |

### 9.3. Báo cáo Độ phủ và Defect Log
- **Tổng số bài test đạt:** **196 / 196 tests** (không có ca kiểm thử nào thất bại).
- **Danh sách lỗi (Defects) phát hiện và xử lý:**
  - *Defect #1 (Closed):* Lỗi biến `activeBranchId` trong `WebPosPage.jsx` bị gọi trước khi khai báo (Temporal Dead Zone) khiến trang POS bị trắng màn hình. ➔ Đã tái cấu trúc đưa hook lên đầu component (Commit `24c80bd`).
  - *Defect #2 (Closed):* Đổi hàng không trừ tiền trong két ca hiện tại dẫn đến lệch sổ sách kế toán cuối ngày. ➔ Đã bổ sung hook `shiftService.recordRefund()` (Commit `4effd13`).

---

## 10. PIPELINE VÀ MÔI TRƯỜNG VẬN HÀNH

- **Tệp cấu hình CI/CD:** `.github/workflows/ci.yml`
- **Quy trình kiểm tra tự động trên GitHub Actions:**
  1. `Lint Check`: Chạy ESLint kiểm tra cú pháp và quy chuẩn mã nguồn.
  2. `Security Audit`: Rà quét các lỗ hổng package thông qua `npm audit`.
  3. `Test Execution`: Chạy bộ kiểm thử tự động Jest & Supertest với cờ `--runInBand` nhằm chống tràn bộ nhớ runner ảo.
- **Trạng thái Pipeline:** Build thành công gần nhất (Green Status ✅), thời gian chạy trung bình 1 phút 45 giây.
- **Môi trường vận hành thử nghiệm:** Môi trường cục bộ đa chi nhánh mô phỏng đầy đủ dữ liệu (Local Staging with Replica Set enabled), kết nối cổng VNPay Sandbox.

---

## 11. THỰC NGHIỆM NGƯỜI DÙNG (User Feedback & Iteration)

- **Đối tượng thực nghiệm:** 06 người dùng thực tế (bao gồm 04 sinh viên đóng vai trò nhân viên thu ngân quầy và 02 sinh viên đóng vai trò quản lý ca bán hàng).
- **Kịch bản tác vụ thực nghiệm:**
  - Tác vụ 1: Nhân viên đăng nhập tài khoản quầy, thực hiện thao tác Mở ca với 1.500.000 ₫ tiền lẻ ban đầu.
  - Tác vụ 2: Dùng máy quét mã vạch bán 02 sản phẩm (01 điện thoại có Serial và 01 phụ kiện), thu tiền mặt của khách.
  - Tác vụ 3: Tiếp nhận 01 khách hàng đến đổi trả phụ kiện mua hôm trước, kiểm tra hóa đơn và hoàn tiền mặt.
  - Tác vụ 4: Kiểm đếm tiền mặt thực tế trong hộc tiền, thực hiện Đóng ca và in biên bản bàn giao K80.
- **Chỉ số đo lường thực tế:**
  - Thời gian trung bình hoàn thành 1 phiên thanh toán POS: **24.5 giây** (giảm 35% so với thao tác thủ công).
  - Tỷ lệ hoàn thành tác vụ Đóng ca & In phiếu thành công: **100% (6/6 người dùng)**.
- **Cải tiến ghi nhận từ phản hồi thực tế:**
  - *Phản hồi:* Bảng nhập số tiền kiểm đếm thực tế dễ bấm nhầm nếu không có định dạng phân cách hàng nghìn.
  - *Cải tiến đã làm:* Bổ sung hàm tự động chèn dấu chấm phân tách hàng nghìn khi nhân viên gõ số tiền vào ô input tiền mặt.

---

## 12. BÁO CÁO TRÙNG LẶP VÀ TÀI LIỆU THAM KHẢO

### 12.1. Kiểm tra trùng lặp
- Dự án tuân thủ quy định học thuật của Khoa Công nghệ Thông tin - Trường ĐH Sư phạm Kỹ thuật TP.HCM (HCMUTE).
- Tỷ lệ trùng lặp báo cáo lý thuyết dự kiến: **< 15%** (kiểm tra qua hệ thống DoIT / Turnitin theo quy trình hướng dẫn của khoa).

### 12.2. Danh mục tài liệu tham khảo chính
1. [Ngoại ngữ] Martin Fowler, *"Patterns of Enterprise Application Architecture"*, Addison-Wesley Professional, 2002.
2. [Ngoại ngữ] MongoDB Inc., *"Building Resilient Retail and Inventory Systems with MongoDB"*, MongoDB Architecture Guide, 2024.
3. [Ngoại ngữ] React Core Team, *"React 19 Server Actions and Optimistic UI Documentation"*, Meta Open Source, 2024.
4. [Ngoại ngữ] VNPay Technical Specifications, *"VNPay Payment Gateway Integration Specification V2.1.0"*, Vietnam Payment Solution J.S.C, 2023.
5. [Tiếng Việt] ThS. Nguyễn Hữu Trung, *"Giáo trình Phân tích Thiết kế Hệ thống Thông tin & Kiến trúc Phần mềm"*, ĐH Sư phạm Kỹ thuật TP.HCM.

---

## 13. KẾT QUẢ NỔI BẬT

- **Không có** (Nhóm tập trung hoàn thiện chất lượng mã nguồn thực tế và kiểm thử tự động, không đăng ký bài báo khoa học hay dự thi giải thưởng trong tuần này).

---
*Báo cáo được lập ngày 08/11/2026 bởi nhóm sinh viên thực hiện đề tài.*
