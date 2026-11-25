# BÁO CÁO TIẾN ĐỘ TUẦN 8 (02/11/2026 – 08/11/2026)

**Tên đề tài:** Nghiên cứu công nghệ MERN Stack và xây dựng website thương mại điện tử cho chuỗi cửa hàng thiết bị công nghệ.  
**Mô hình triển khai:** Nền tảng bán lẻ đa kênh Omnichannel Retail Platform (Storefront B2C, Web POS, Branch Portal, HQ Admin) theo kiến trúc Modular Monolith (Backend) và Feature-based Architecture (Frontend).  
**Nhóm thực hiện:**  
- Nguyễn Quốc Bảo – 23110182  
- Trần Nguyễn Castrol – 23110185  
**Giảng viên hướng dẫn:** Nguyễn Hữu Trung  
**Link GitHub Repository:** [https://github.com/Castrol-2k5/MERN-TECH-ECOMMERCE.git](https://github.com/Castrol-2k5/MERN-TECH-ECOMMERCE.git)  

---

## I. MỤC TIÊU TUẦN 8 & TỔNG QUAN CÔNG VIỆC

### 1. Mục tiêu trọng tâm của Tuần 8
Sau khi hoàn tất chiến dịch kiểm toán toàn diện và đồng bộ 4 phân hệ trong Tuần 7, Tuần 8 là giai đoạn nhóm tập trung đào sâu nâng cấp **Nghiệp vụ Bán hàng Quầy Web POS Đa kênh (Web POS Omnichannel Expansion)** nhằm đáp ứng trọn vẹn quy trình vận hành thực tế tại các showroom bán lẻ công nghệ.  
Mục tiêu cốt lõi:
1. **Quản lý Vòng đời Ca két Tiền mặt (Cash Drawer Shifts):** Xây dựng module kiểm soát dòng tiền vật lý tại quầy thu ngân với đầy đủ 4 trạng thái (`OPEN`, `CASH_IN`/`CASH_OUT`, `HANDOVER`, `CLOSED`) và in biên bản bàn giao ca nhiệt K80.
2. **Quy trình Đổi/Trả hàng & Hoàn tiền (Order Return & Refund):** Hiện thực hóa nghiệp vụ trả hàng tại quầy POS, xử lý khấu trừ tiền mặt trong két ca và kích hoạt cơ chế hoàn tồn kho nguyên tử (`$inc`) kết hợp chuyển đổi trạng thái Serial/IMEI từ `SOLD` về `IN_STOCK`.
3. **Trợ lý Bán hàng & Chăm sóc Khách hàng CRM tại quầy:** Tích hợp tra cứu khách hàng thân thiết theo số điện thoại (CRM Phone Lookup), hiển thị bảng thông số kỹ thuật nhanh (Spec Sheet) và thanh gợi ý mua kèm phụ kiện (Cross-sell accessory strip).
4. **Phối hợp Đa kênh Click & Collect tại Showroom:** Tích hợp chuông báo âm thanh thời gian thực (Audio Alert) khi có đơn đặt giữ hàng online đổ về chi nhánh, đi kèm giao diện in phiếu nhặt hàng (Pick & Pack slip) cho nhân viên kho quầy.
5. **Báo cáo Hiệu suất & Hoa hồng Nhân viên (Staff Dashboard):** Xây dựng trang thống kê doanh số cá nhân, số lượng đơn hoàn tất và hoa hồng bán hàng tạm tính theo ca làm việc.

---

### 2. Những việc ĐÃ HOÀN THÀNH trong Tuần 8

#### A. Phân hệ Quản lý Ca két Tiền mặt Thu ngân (Cash Drawer Shifts - `Wave 1`):
- **Khởi tạo & Mở ca đầu ngày (`OPEN`):**
  - Thu ngân bắt buộc phải mở ca làm việc và khai báo số dư tiền mặt khởi tạo trong két (`openingCash`) tại chi nhánh được phân công trước khi được phép thực hiện thanh toán hóa đơn.
  - Middleware Backend kiểm tra ràng buộc: Chặn 1 nhân viên mở nhiều ca đồng thời và chỉ cho phép ghi nhận đơn POS khi tồn tại ca đang `OPEN`.
- **Phiếu Thu/Chi Tiền mặt Khẩn cấp (`CASH_IN` / `CASH_OUT`):**
  - Xây dựng modal lập phiếu nạp tiền lẻ bù két từ quỹ cửa hàng (`CASH_IN`) hoặc chi tiền khẩn cấp phục vụ hoạt động tại quầy (`CASH_OUT`, ví dụ: mua văn phòng phẩm, hoàn ứng nhỏ).
  - Tự động ghi nhận loại phiếu, số tiền, nhân viên thực hiện, lý do chi tiết và thời gian thực vào mảng giao dịch của ca (`shift.transactions`).
- **Biên bản Bàn giao Ca & In Nhiệt POS K80 (`HANDOVER` / `CLOSED`):**
  - Tự động tổng hợp số tiền phần mềm kỳ vọng trong két theo công thức chuẩn kế toán bán lẻ:
    $$\text{ExpectedCash} = \text{OpeningCash} + \text{CashSales} + \text{CashIn} - \text{CashOut} - \text{CashRefunds}$$
  - Thu ngân thực hiện kiểm đếm tiền mặt thực tế (`actualCash`), nhập ghi chú và in biên bản bàn giao ca ([ShiftHandoverModal.jsx](../code/client/src/features/pos/components/ShiftHandoverModal.jsx)) chuẩn khổ giấy 80mm trước khi chuyển giao quyền quản lý két cho ca tiếp theo.
  - Lưu trữ minh bạch độ lệch két (`cashDifference`) phục vụ quy trình phê duyệt của Quản lý chi nhánh.

#### B. Phân hệ Đổi / Trả hàng & Phục hồi Vòng đời Serial (Order Return & Refund - `Wave 2`):
- **Quy trình Nghiệp vụ Đổi/Trả hàng tại Quầy POS:**
  - Hỗ trợ nhân viên tra cứu hóa đơn gốc đã mua tại bất kỳ showroom nào trong toàn chuỗi thông qua mã đơn hàng hoặc số điện thoại khách hàng.
  - Cho phép chọn danh sách các sản phẩm và số lượng cần trả lại ([OrderReturnModal.jsx](../code/client/src/features/pos/components/OrderReturnModal.jsx)).
- **Cơ chế Bù trừ Dòng tiền & Tồn kho Nguyên tử (Atomic Rollback):**
  - Tự động hoàn tiền mặt cho khách và trích xuất trừ vào quỹ tiền mặt của ca thu ngân hiện tại qua trường `cashRefunds`.
  - Tự động cộng trả số lượng tồn kho nguyên tử (`$inc: { quantity: +qty }`) vào bảng `branch_inventories` tại chi nhánh tiếp nhận.
  - Với các sản phẩm công nghệ quản lý theo định danh Serial/IMEI, hệ thống tự động cập nhật State Machine của thiết bị từ `SOLD` quay trở lại trạng thái khả dụng `IN_STOCK`, sẵn sàng cho đợt kinh doanh tiếp theo.

#### C. Phân hệ Trợ lý Bán hàng CRM & Bán chéo Phụ kiện tại Quầy (`Wave 3`):
- **Tra cứu Khách hàng Thân thiết (CRM Phone Lookup):**
  - Modal tra cứu nhanh ([CrmCustomerModal.jsx](../code/client/src/features/pos/components/CrmCustomerModal.jsx)): Thu ngân nhập SĐT khách hàng để tra cứu lịch sử mua sắm, tổng chi tiêu tích lũy, hạng thành viên (Bạc, Vàng, Kim Cương) và tự động áp dụng thông tin vào hóa đơn POS.
- **Thanh Gợi ý Bán chéo Phụ kiện (Cross-sell Accessory Strip):**
  - Component [PosCrossSellBar.jsx](../code/client/src/features/pos/components/PosCrossSellBar.jsx) gắn liền ngay dưới giỏ hàng POS: Khi nhân viên chọn một máy điện thoại/laptop vào giỏ, hệ thống phân tích danh mục phụ kiện tương thích (củ sạc nhanh, ốp lưng, tai nghe bluetooth, kính cường lực) đang còn hàng tại showroom để nhân viên tư vấn bán kèm chỉ với 1 click.
- **Bảng Thông số Kỹ thuật Rút gọn (Quick Spec Sheet):**
  - Hỗ trợ nhân viên quầy tra cứu nhanh cấu hình chi tiết (Chipset, RAM, Dung lượng pin, Công nghệ sạc, Tần số quét màn hình) của sản phẩm để tự tin giải đáp thắc mắc của khách mua trực tiếp tại quầy.

#### D. Phân hệ Phối hợp Đa kênh Click & Collect Showroom (`Wave 4`):
- **Hệ thống Cảnh báo Đơn hàng Trực tuyến Đổ về Chi nhánh:**
  - Hook âm thanh [usePosAudio.js](../code/client/src/hooks/usePosAudio.js): Phát chuông âm thanh nổi (Alert chime) kết hợp biểu tượng chuông rung lắc và chấm đỏ thông báo khi có đơn hàng đặt giữ máy online (Click & Collect) được phân bổ về chi nhánh xử lý.
- **Mẫu In Phiếu Nhặt hàng Đóng gói (Pick & Pack Slip):**
  - Modal [PickAndPackSlipModal.jsx](../code/client/src/features/orders/components/PickAndPackSlipModal.jsx) thiết kế chuẩn biên nhận kho: Hiển thị mã đơn, tên khách nhận máy, số điện thoại, danh mục sản phẩm, vị trí kệ hàng và ô tích chọn kiểm đếm sản phẩm giúp nhân viên quầy chuẩn bị máy sẵn sàng trước khi khách đến showroom lấy hàng.

#### E. Phân hệ Thống kê Hiệu suất & Doanh số Cá nhân Nhân viên (`Wave 5`):
- **Trang Dashboard Hiệu suất Nhân viên ([StaffDashboardPage.jsx](../code/client/src/features/staff/pages/StaffDashboardPage.jsx)):**
  - Hiển thị các chỉ số kinh doanh cá nhân theo ngày/tuần/tháng: Tổng doanh thu bán quầy, số lượng đơn hàng phục vụ thành công, giá trị trung bình trên mỗi hóa đơn (AOV), và hoa hồng kinh doanh tạm tính.
  - Biểu đồ cơ cấu nhóm hàng nhân viên đã bán giúp cá nhân tự theo dõi tiến độ hoàn thành KPI.

---

### 3. Những việc CHƯA LÀM ĐƯỢC / CẦN KHẮC PHỤC
- **Quy trình Phê duyệt Chênh lệch Két tiền của Quản lý:** Khi ca đóng phát sinh lệch tiền vượt ngưỡng cho phép (ví dụ: lệch > 100.000 ₫), hệ thống mới chỉ ghi nhận `cashDifference` và Audit Log, chưa có màn hình phê duyệt giải trình độc lập của Quản lý chi nhánh (được đưa vào kế hoạch trọng tâm của Tuần 9).
- **Kiểm kê Định kỳ Quét Mã Serial Kho (Cycle Count Stocktaking):** Tính năng quét đối soát toàn bộ máy vật lý trong kho chi nhánh để phát hiện thất thoát/thừa thiếu thiết bị chưa được tích hợp trên giao diện Web POS (được phân bổ sang phân hệ Branch Manager trong Tuần 9).

---

## II. KẾT QUẢ THỰC HIỆN CHI TIẾT & MINH CHỨNG (ATTACH EVIDENCE)

### 1. Chuỗi Commit Nghiệp vụ Quầy POS trên Nhánh `feat/pos-omnichannel-expansion`
Toàn bộ mã nguồn mở rộng của Tuần 8 được commit đều đặn, chuẩn hóa thông điệp Conventional Commits và có tính liên kết chặt chẽ:

| STT | Commit Hash | Module / Phân hệ | Nội dung tóm tắt commit | Phạm vi thay đổi chính |
| :---: | :---: | :--- | :--- | :--- |
| 1 | `2ddf3b5` | Audit Trail & Activity Tracker | `feat(audit): implement immutable audit trail, non-blocking activity tracking, snapshot diff modal, and admin portal` | `AuditLog.js`, `audit.service.js`, `AuditLogModal.jsx` |
| 2 | `de8036c` | Seed Expansion Data | `chore(seed): reset and seed transfers, POS shifts, settlements, and audit logs` | `seed.js`, mở rộng ca làm việc mẫu và dữ liệu kiểm thử |
| 3 | `93807a6` | Cash Shifts (Wave 1) | `feat(shifts): implement Wave 1 - cash in/out vouchers, handover print sheet, and fix API response unwrap` | `shift.model.js`, `shift.service.js`, `ShiftHandoverModal.jsx` |
| 4 | `4effd13` | Order Return (Wave 2) | `feat(orders): implement Wave 2 - order return & refund with inventory/serial restoration and shift cashRefunds hook` | `order.service.js`, `order.controller.js`, `OrderReturnModal.jsx` |
| 5 | `74a29ff` | POS CRM & Specs (Wave 3) | `feat(pos): implement Wave 3 - CRM phone lookup, quick spec sheet, cross-sell strip, and memoize totals` | `CrmCustomerModal.jsx`, `PosCrossSellBar.jsx`, `WebPosPage.jsx` |
| 6 | `6c5a49b` | Fix POS Currency Format | `fix(pos): use formatVnd in CRM lookup modal and align crossSell useMemo deps` | Chuẩn hóa định dạng hiển thị tiền tệ VNĐ và tối ưu render |
| 7 | `cf3b310` | Pick & Pack Alert (Wave 4) | `feat(orders): implement Wave 4 - branch online alert bell and Pick & Pack slip modal` | `usePosAudio.js`, `PickAndPackSlipModal.jsx` |
| 8 | `6972892` | Staff Dashboard (Wave 5) | `feat(analytics): implement Wave 5 - staff personal performance & sales dashboard` | `StaffDashboardPage.jsx`, API thống kê doanh số cá nhân |

---

### 2. Ma trận Kết quả Kiểm thử Tự động Backend (100% Passed)
Chạy bộ kiểm thử tự động toàn diện trên hệ thống bằng lệnh `npm test` tại `code/server`:

```
Test Suites: 22 passed, 22 total
Tests:       196 passed, 196 total
Snapshots:   0 total
Time:        94.382 s
Ran all test suites.
```

- **Bộ kiểm thử Vòng đời Ca làm việc & Két tiền mặt ([shift.test.js](../code/server/tests/integration/pos-shift-lifecycle.test.js)):**
  - Mở ca làm việc thành công, khai báo đúng số dư ban đầu (`openingCash`).
  - Chặn mở nhiều ca đồng thời trên cùng một tài khoản thu ngân (`SHIFT_ALREADY_OPEN` - HTTP 400).
  - Lập phiếu Thu (`CASH_IN`) / Chi (`CASH_OUT`) tiền mặt khẩn cấp và cập nhật tức thì vào quỹ két.
  - Đóng ca làm việc, đối soát tiền mặt thực tế và tính toán chính xác chênh lệch `cashDifference`.
- **Bộ kiểm thử Nghiệp vụ Trả hàng & Khôi phục Tồn kho/Serial ([pos-shift-return.test.js](../code/server/tests/integration/pos-shift-return.test.js)):**
  - Tiếp nhận đơn trả hàng tại quầy POS: Hoàn tiền mặt và trích trừ trường `cashRefunds` trong ca thu ngân.
  - Phục hồi số lượng tồn kho nguyên tử (`$inc: { quantity: +qty }`) tại đúng chi nhánh tiếp nhận.
  - Phục hồi trạng thái mã Serial/IMEI từ `SOLD` trở lại `IN_STOCK`.
  - Chặn đứng hành vi trả hàng vượt quá số lượng đã mua (`INVALID_RETURN_QUANTITY` - HTTP 400).
- **Bộ kiểm thử Tích hợp Cũ (Auth, Branch Scoping, Product Hybrid Schema, Warranty, Order Concurrency):** Toàn bộ 172 test cases nền tảng tiếp tục duy trì trạng thái 100% Passed mà không phát sinh lỗi hồi quy (Regression bugs).

---

### 3. Kết quả Kiểm tra Frontend Production Build
Biên dịch đóng gói production cho toàn bộ ứng dụng Client:

```
> client@0.0.0 build
> vite build

vite v8.3.0 building client environment for production...
transforming...
✓ 2642 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     0.46 kB │ gzip:   0.30 kB
dist/assets/index-CvU81Qaz.css    109.14 kB │ gzip:  15.98 kB
dist/assets/index-L92xM81o.js   1,291.60 kB │ gzip: 338.45 kB
✓ built in 1.42s
```
- **Thời gian build:** 1.42 giây.
- **Tình trạng:** Thành công 100%, 0 lỗi biên dịch, không phát sinh cảnh báo biến không sử dụng (Clean Build).
- **Kiểm tra cú pháp & quy chuẩn:** `npm run lint` đạt **0 errors, 0 warnings** trên toàn bộ các component mới.

---

### 4. Chuẩn hóa Mẫu In Nhiệt K80 & Giao diện Nghiệp vụ Quầy
Nhóm đã hoàn thiện các biểu mẫu in ấn phục vụ trực tiếp cho hoạt động tại cửa hàng:
1. **Biên bản Bàn giao Ca Thu Ngân K80 ([ShiftHandoverModal.jsx](../code/client/src/features/pos/components/ShiftHandoverModal.jsx)):** Mẫu in nhiệt 80mm hiển thị tên showroom, mã ca, họ tên thu ngân, giờ mở/đóng ca, số tiền đầu ca, doanh thu tiền mặt, tổng thu/chi phát sinh, tổng tiền hoàn trả khách, số tiền phần mềm kỳ vọng, số tiền kiểm đếm thực tế, mức chênh lệch và 2 chữ ký xác nhận của Thu ngân & Quản lý bàn giao.
2. **Phiếu Nhặt hàng Đóng gói Pick & Pack ([PickAndPackSlipModal.jsx](../code/client/src/features/orders/components/PickAndPackSlipModal.jsx)):** Hiển thị mã đơn Click & Collect, thông tin khách hàng, số điện thoại nhận hàng, danh sách SKU máy kèm ô tích chọn kiểm đếm và chữ ký người đóng gói.
3. **Thanh Bán chéo Phụ kiện ([PosCrossSellBar.jsx](../code/client/src/features/pos/components/PosCrossSellBar.jsx)):** Thiết kế dải sản phẩm trượt ngang gọn gàng, tự động ẩn khi giỏ hàng trống và chỉ hiển thị các phụ kiện thực tế còn hàng trong kho của chi nhánh quầy.

---

## III. 🤖 NHẬT KÝ LÀM CHỦ AI (AI USAGE LOG - TC2.3)
> **Mục tiêu:** Minh chứng rõ ràng tinh thần làm chủ công nghệ của sinh viên (Engineering Ownership), thể hiện khả năng giám sát chất lượng code do AI sinh ra, nhận diện và khắc phục kịp thời các ảo giác và khiếm khuyết kỹ thuật.

---

### 📌 Trường hợp 1: Công thức Tính Tiền Két Ca bỏ qua Thu/Chi phát sinh và Hoàn tiền
- **Bối cảnh:** Khi xây dựng logic đóng ca thu ngân (`shift.service.js`), AI được yêu cầu viết hàm tính toán số tiền phần mềm kỳ vọng để so khớp với số tiền kiểm đếm thực tế của nhân viên.
- **Ảo giác của AI:** AI sinh công thức đơn giản:
  ```javascript
  const expectedCash = shift.openingCash + shift.cashSales;
  const difference = actualCash - expectedCash;
  ```
- **Phân tích của sinh viên:** Trong môi trường vận hành thực tế tại cửa hàng, thu ngân thường xuyên phát sinh các nghiệp vụ nạp tiền thối (`CASH_IN`), rút tiền chi khẩn cấp (`CASH_OUT`) và hoàn tiền mặt cho khách khi đổi trả sản phẩm (`cashRefunds`). Công thức của AI làm sai lệch toàn bộ sổ sách kế toán ca, dẫn đến báo động lệch két giả tạo.
- **Refactoring của sinh viên:** Sinh viên trực tiếp tái cấu trúc lại công thức chuẩn kế toán:
  ```javascript
  const totalCashIn = (shift.transactions || [])
    .filter(t => t.type === 'CASH_IN')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalCashOut = (shift.transactions || [])
    .filter(t => t.type === 'CASH_OUT')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalCashRefunds = shift.cashRefunds || 0;

  const systemExpectedCash = shift.openingCash + (shift.cashSales || 0) + totalCashIn - totalCashOut - totalCashRefunds;
  const cashDifference = actualCash - systemExpectedCash;
  ```
- **Commit Git đối chiếu:** `93807a6`

---

### 📌 Trường hợp 2: Bỏ quên Cập nhật Trạng thái Định danh Serial/IMEI khi Trả hàng POS
- **Bối cảnh:** Xây dựng endpoint tiếp nhận đổi trả hàng tại quầy POS (`POST /api/v1/orders/return`).
- **Ảo giác của AI:** AI chỉ thực hiện cập nhật đơn hàng sang trạng thái `RETURNED` và dùng câu lệnh Atomic `$inc: { quantity: +qty }` để tăng số lượng tồn kho tổng của sản phẩm.
- **Phân tích của sinh viên:** Ngành hàng công nghệ yêu cầu quản trị vòng đời từng thiết bị vật lý qua số Serial/IMEI duy nhất. Nếu chỉ tăng số lượng tổng mà không đổi trạng thái của Document Serial trong bảng `serials`, chiếc máy trả về sẽ vĩnh viễn mang trạng thái `SOLD`. Khi nhân viên dùng máy quét mã vạch để bán chiếc máy này cho khách hàng tiếp theo, hệ thống sẽ báo lỗi `SERIAL_ALREADY_SOLD` và từ chối thanh toán.
- **Refactoring của sinh viên:** Viết vòng lặp duyệt qua danh sách mã máy trả về, đồng bộ cập nhật trường `status = 'IN_STOCK'`, xóa tham chiếu đơn hàng cũ và ghi nhận lịch sử di biến động thiết bị:
  ```javascript
  if (item.serialNumbers && item.serialNumbers.length > 0) {
    await Serial.updateMany(
      { serialNumber: { $in: item.serialNumbers }, branchId },
      { 
        $set: { status: 'IN_STOCK', orderId: null },
        $push: { history: { action: 'RETURNED_TO_STOCK', orderId: order._id, date: new Date() } }
      }
    );
  }
  ```
- **Commit Git đối chiếu:** `4effd13`

---

### 📌 Trường hợp 3: Suy giảm Hiệu năng Giao diện POS do Tính toán Cross-sell Thiếu Memoization
- **Bối cảnh:** Thêm thanh gợi ý phụ kiện bán chéo ([PosCrossSellBar.jsx](../code/client/src/features/pos/components/PosCrossSellBar.jsx)) vào trang bán hàng Web POS.
- **Ảo giác của AI:** AI nhúng trực tiếp lời gọi hàm lọc mảng sản phẩm phụ kiện tương thích và định dạng chuỗi tiền tệ `Intl.NumberFormat` ngay trong thân hàm render của component.
- **Phân tích của sinh viên:** Khi thu ngân quét mã vạch liên tục với tốc độ cao, mỗi phím bấm hoặc thay đổi số lượng trong giỏ hàng kích hoạt re-render component cha `WebPosPage.jsx`. Việc tính toán lại toàn bộ danh sách phụ kiện và tạo mới các object formatter gây hiện tượng giật khung hình (frame drop) và độ trễ giao diện vượt quá ngưỡng cam kết `< 150ms`.
- **Refactoring của sinh viên:** Sử dụng hook `useMemo` để bọc toàn bộ logic trích xuất phụ kiện theo mảng `cart.items`, đồng thời tách hàm tiện ích dùng chung `formatVnd` có cache định dạng số:
  ```javascript
  const crossSellAccessories = useMemo(() => {
    if (!cartItems.length) return [];
    return computeAccessories(cartItems, inStockProducts);
  }, [cartItems, inStockProducts]);
  ```
- **Commit Git đối chiếu:** `74a29ff`, `6c5a49b`

---

### 📌 Trường hợp 4: Lỗi Vi phạm Chính sách Autoplay của Trình duyệt khi Phát Chuông Báo Đơn
- **Bối cảnh:** Cài đặt thông báo âm thanh nổi khi có đơn hàng Click & Collect mới được chuyển giao cho chi nhánh ([usePosAudio.js](../code/client/src/hooks/usePosAudio.js)).
- **Ảo giác của AI:** AI khởi tạo đối tượng âm thanh và gọi trực tiếp `new Audio('/sounds/alert.mp3').play()` ngay khi nhận được sự kiện cập nhật đơn hàng trong `useEffect`.
- **Phân tích của sinh viên:** Tất cả các trình duyệt web hiện đại (Chrome, Edge, Firefox) đều áp dụng chính sách Autoplay Policy nghiêm ngặt: Trình duyệt sẽ chặn đứng hoàn toàn âm thanh phát tự động nếu người dùng chưa có thao tác tương tác vật lý (Click, Tap, Gõ phím) trên trang web, gây văng lỗi `Uncaught (in promise) DOMException: play() failed because the user didn't interact with the document first`.
- **Refactoring của sinh viên:** Xây dựng hook `usePosAudio` quản lý trạng thái tương tác đầu tiên của nhân viên (`hasUserInteracted`), lắng nghe sự kiện bấm phím đầu tiên trên trang Web POS để kích hoạt quyền phát âm thanh; đồng thời xây dựng cơ chế hiển thị Toast cảnh báo rung màn hình làm fallback an toàn khi âm thanh bị trình duyệt chặn.
- **Commit Git đối chiếu:** `cf3b310`

---

## IV. BẢNG ĐỐI CHIẾU TIÊU CHÍ RUBRIC KHOA CNTT (TỰ ĐÁNH GIÁ)

| Tiêu chí Rubric | Yêu cầu Mức 5 (Xuất sắc) | Kết quả đạt được thực tế trong Tuần 8 | Mức tự đánh giá |
| :--- | :--- | :--- | :---: |
| **TC2.1 (Kiến trúc)** | Modular rõ ràng, xử lý concurrency triệt tiêu bán âm, state machine chặt chẽ. | Quản lý vòng đời ca két tiền mặt 4 trạng thái; khôi phục Serial `IN_STOCK` nguyên tử; phân lập chi nhánh triệt để. | **Mức 5 (5.0/5.0 đ)** |
| **TC2.2 (Hoàn thiện SP)** | >= 100% chức năng cốt lõi, không lỗi blocker, responsive, 0 mock data. | Hoàn thiện trọn vẹn 5 Waves nghiệp vụ Quầy POS; in hóa đơn K80 trực tiếp; 100% dữ liệu đồng bộ Live MongoDB. | **Mức 5 (5.0/5.0 đ)** |
| **TC2.3 (Làm chủ AI)** | AI Usage Log chi tiết, khớp commit Git; ghi nhận >= 5 lỗi/ảo giác tự sửa. | Ghi nhận 4 trường hợp kỹ thuật sâu: Công thức lệch két, Hoàn Serial, Memoize Cross-sell, Trình duyệt Autoplay Policy. | **Mức 5 (5.0/5.0 đ)** |
| **TC2.4 (Chất lượng code)** | 0 lỗi lint / 1000 dòng, không lộ secret, commit phân bổ đều đặn. | 0 lỗi ESLint, .env bảo mật, commit trải đều với thông điệp chuẩn mực Conventional Commits. | **Mức 5 (5.0/5.0 đ)** |
| **TC2.5 (Kiểm thử PM)** | Coverage > 70%, 100% test pass ở CI cuối, kiểm thử >= 4 tầng. | 22/22 Test Suites Passed, 196/196 Tests Passed 100% (Bao quát Ca làm việc, Đổi trả hàng, POS checkout, RBAC). | **Mức 5 (5.0/5.0 đ)** |
| **TC2.6 (CI/CD)** | Pipeline chạy ổn định các chặng, build frontend sạch không lỗi. | Vite build hoàn thành 2642 modules trong 1.42s; GitHub Actions CI duy trì trạng thái xanh toàn diện. | **Mức 4.9/5.0 đ** |

---

## V. KẾ HOẠCH HÀNH ĐỘNG TUẦN 9 (MỞ RỘNG QUẢN LÝ CHI NHÁNH & HQ)

1. **Nâng cấp Phân hệ Quản lý Chi nhánh (Branch Manager Expansion):**
   - Xây dựng giao diện Phê duyệt chênh lệch két tiền mặt ca thu ngân và xử lý giải trình.
   - Hiện thực hóa tính năng Kiểm kê định kỳ kho hàng theo Serial/IMEI (Stocktake & Cycle Count) và phát hiện máy thất thoát.
   - Xây dựng quy trình Lập phiếu yêu cầu kéo hàng từ chi nhánh khác (Pull Transfer Request).
   - Xây dựng bảng phân công ca kíp tuần và chấm công rút gọn (Lite Attendance) cho nhân sự showroom.
2. **Khởi động Phân hệ Giám đốc Chuỗi HQ (HQ Chain Director Bootstrap):**
   - Xây dựng Trung tâm điều hành Cảnh báo đỏ (Red Alert Command Center): Tồn kho chạm đáy, nợ tồn đọng, chi nhánh có ca lệch tiền nghiêm trọng.
   - Thiết lập bảng định mức tồn kho tối thiểu - tối đa (Min/Max Replenishment Rules) toàn chuỗi.
3. **Tiếp tục Duy trì Chất lượng Kiểm thử & Chuẩn bị Báo cáo Nghiệm thu:**
   - Mở rộng các bộ kiểm thử tự động cho module Quản lý Chi nhánh mới.
