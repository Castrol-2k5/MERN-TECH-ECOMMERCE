# BÁO CÁO TIẾN ĐỘ TUẦN 9 (09/11/2026 – 15/11/2026)

**Tên đề tài:** Nghiên cứu công nghệ MERN Stack và xây dựng website thương mại điện tử cho chuỗi cửa hàng thiết bị công nghệ.  
**Mô hình triển khai:** Nền tảng bán lẻ đa kênh Omnichannel Retail Platform (Storefront B2C, Web POS, Branch Portal, HQ Admin) theo kiến trúc Modular Monolith (Backend) và Feature-based Architecture (Frontend).  
**Nhóm thực hiện:**  
- Nguyễn Quốc Bảo – 23110182  
- Trần Nguyễn Castrol – 23110185  
**Giảng viên hướng dẫn:** Nguyễn Hữu Trung  
**Link GitHub Repository:** [https://github.com/Castrol-2k5/MERN-TECH-ECOMMERCE.git](https://github.com/Castrol-2k5/MERN-TECH-ECOMMERCE.git)  

---

## I. MỤC TIÊU TUẦN 9 & TỔNG QUAN CÔNG VIỆC

### 1. Mục tiêu trọng tâm của Tuần 9
Sau khi đã hoàn thiện phân hệ nhân viên thu ngân Web POS ở Tuần 8, mục tiêu cốt lõi của Tuần 9 là: **"Hiện thực hóa Trọn vẹn Phân hệ Quản lý Chi nhánh (Branch Manager Omnichannel Portal) & Chuẩn bị Nền tảng Điều hành Chuỗi Cấp cao HQ"**.  
Mục tiêu cốt lõi:
1. **Quản lý Đội ngũ & Đánh giá Hiệu suất Nhân viên Showroom:** Phân quyền quản trị nhân sự cục bộ, thiết lập chỉ tiêu doanh số và bảng xếp hạng thi đua KPI nhân viên bán hàng theo thời gian thực.
2. **Kiểm soát Dòng tiền Mặt Thời gian thực & Phê duyệt Đặc quyền (Privilege Approvals):** Xây dựng màn hình giám sát két tiền trực tiếp tại chi nhánh (Live Cash Monitor), quy trình xử lý và ký duyệt giải trình chênh lệch két tiền ca quầy, trung tâm tiếp nhận yêu cầu phê duyệt di động (Mobile-first Approvals) cho các đơn đổi trả giá trị cao hoặc chiết khấu đặc biệt.
3. **Kiểm kê Kho Định kỳ theo Serial/IMEI & Điều phối Kho Cục bộ:** Hiện thực hóa quy trình kiểm kê định kỳ (Cycle Count Stocktake) nhận diện chính xác máy thừa/thiếu; xây dựng cơ chế gửi đề xuất kéo hàng giữa các chi nhánh (Pull Transfer Requests) và xuất trả hàng bảo hành/lỗi về Nhà cung cấp (RMA Outbound).
4. **Phân tích Chiến lược Chi nhánh & Xử lý Khiếu nại Khách hàng:** Cung cấp báo cáo kinh doanh chuyên sâu tại cửa hàng (doanh thu theo giờ cao điểm, tỷ trọng thanh toán, giỏ hàng trung bình AOV); quy trình tiếp nhận, phân loại và bồi thường khiếu nại khách hàng ngay tại quầy showroom.
5. **Lập Lịch Ca kíp Tuần & Chấm công Rút gọn (Weekly Shift Roster & Lite Attendance):** Bảng phân ca trực quan theo tuần (Ca Sáng, Ca Chiều, Cả Ngày) cho nhân viên và giao diện điểm danh chấm công hàng ngày.

---

### 2. Những việc ĐÃ HOÀN THÀNH trong Tuần 9

#### A. Phân hệ Quản trị Nhân sự & Bảng Xếp hạng KPI Đội ngũ (`Wave 1`):
- **Quản lý Nhân sự Showroom ([BranchStaffPage.jsx](../code/client/src/pages/portal/BranchStaffPage.jsx)):**
  - Quản lý danh sách nhân viên thuộc chi nhánh phụ trách; phân quyền tài khoản thu ngân/kỹ thuật.
  - Bật/tắt trạng thái hoạt động của nhân viên mà không ảnh hưởng đến dữ liệu kiểm toán lịch sử bán hàng.
- **Bảng Xếp hạng Doanh số & KPI Nhân viên ([staffAnalytics.service.js](../code/server/src/modules/analytics/staffAnalytics.service.js)):**
  - Tổng hợp doanh thu thực tế, số lượng đơn hoàn tất, giá trị trung bình đơn (AOV) và hoa hồng tạm tính của từng nhân viên.
  - Xếp hạng thi đua trực quan (Top Performers Leaderboard) giúp Quản lý cửa hàng theo dõi sát sao động lực làm việc của đội ngũ.

#### B. Giám sát Dòng tiền Mặt Thời gian thực & Phê duyệt Đặc quyền (`Wave 2`):
- **Giám sát Két tiền Trực tiếp (Live Cash Monitor - [PosShiftReportPage.jsx](../code/client/src/pages/portal/PosShiftReportPage.jsx)):**
  - Hiển thị trực quan trạng thái toàn bộ hộc tiền/ca làm việc đang mở tại chi nhánh; theo dõi tức thì doanh thu tiền mặt phát sinh trong ngày.
- **Xử lý & Ký duyệt Chênh lệch Két Ca (Discrepancy Resolution):**
  - Khi ca thu ngân đóng lại có chênh lệch giữa tiền đếm thực tế và phần mềm, hệ thống tự động đẩy cảnh báo sang màn hình Quản lý.
  - Quản lý chi nhánh đối soát biên bản K80, nhập lý do giải trình (sai sót thối tiền, hao hụt tiền lẻ) và xác nhận phê duyệt chốt ca hợp lệ.
- **Trung tâm Phê duyệt Quyền hạn Showroom ([ManagerApprovalsPage.jsx](../code/client/src/pages/portal/ManagerApprovalsPage.jsx)):**
  - Component chuông cảnh báo [ApprovalAlertBell.jsx](../code/client/src/features/approvals/components/ApprovalAlertBell.jsx) trên thanh điều hướng Portal.
  - Hỗ trợ Quản lý phê duyệt từ xa: Đơn đổi trả hoàn tiền mặt vượt định mức, chi tiền quỹ khẩn cấp vượt hạn mức, hoặc duyệt hủy đơn giữ máy Click & Collect quá hạn.

#### C. Kiểm kê Serial Định kỳ, Kéo hàng Liên Chi nhánh & Xuất trả RMA (`Wave 3`):
- **Kiểm kê Kho Định kỳ theo Mã Serial/IMEI ([BranchStocktakePage.jsx](../code/client/src/pages/portal/BranchStocktakePage.jsx)):**
  - Quản lý tạo phiếu kiểm kê (Cycle Count Sheet), nhân viên kho dùng máy quét barcode quét toàn bộ máy thực tế trong tủ trưng bày và khoang hàng.
  - Backend tự động đối soát thuật toán hiệu số tập hợp giữa mã quét được và mã máy ghi nhận trong database: Nhận diện chính xác máy thất thoát (`MISSING`) và máy thừa lạ (`SURPLUS`), tự động cập nhật trạng thái thiết bị sang `LOST` và cân bằng số lượng tồn kho khả dụng.
- **Đề xuất Điều chuyển Kéo hàng (Pull Transfer Requests):**
  - Khi một mặt hàng tại chi nhánh sắp hết mà showroom lân cận còn nhiều, Quản lý lập phiếu yêu cầu chuyển hàng (`TransferRequest`) chỉ định chi nhánh nguồn, danh sách SKU và số lượng cần hỗ trợ.
- **Xuất trả Thiết bị Bảo hành / Lỗi về Hãng (RMA Outbound):**
  - Tạo phiếu xuất trả máy lỗi phần cứng về Nhà phân phối/Hãng sản xuất ([rmaOutbound.model.js](../code/server/src/modules/inventory/rmaOutbound.model.js)), ghi nhận mã vận đơn chuyển phát và theo dõi tiến độ đổi mới máy từ nhà cung cấp.

#### D. Báo cáo Phân tích Chiến lược & Xử lý Khiếu nại Khách hàng (`Wave 4`):
- **Phân tích Chiến lược Kinh doanh Chi nhánh ([BranchAnalyticsPage.jsx](../code/client/src/pages/portal/BranchAnalyticsPage.jsx)):**
  - Biểu đồ phân bổ doanh thu theo khung giờ vàng (Peak Sales Hours) giúp bố trí nhân sự quầy hợp lý.
  - Thống kê tỷ lệ thanh toán: Tiền mặt vs VNPay/Chuyển khoản; tỷ lệ hoàn trả hàng (Return Rate) theo danh mục.
- **Tiếp nhận & Xử lý Khiếu nại Khách hàng ([BranchComplaintsPage.jsx](../code/client/src/pages/portal/BranchComplaintsPage.jsx)):**
  - Xử lý các khiếu nại về chất lượng thiết bị, thái độ phục vụ hoặc sự cố bảo hành.
  - Quản lý có thẩm quyền phê duyệt voucher bồi thường hoặc đổi mới sản phẩm trực tiếp trong hạn mức chi nhánh (dưới 2.000.000 ₫/vụ việc); trường hợp vượt quá sẽ tự động chuyển cấp lên Trụ sở chính HQ.

#### E. Lập Lịch Ca kíp Tuần & Chấm công Rút gọn (`Wave 5`):
- **Lập Lịch Phân ca Kíp Tuần ([BranchRosterPage.jsx](../code/client/src/pages/portal/BranchRosterPage.jsx)):**
  - Giao diện lưới ma trận 7 ngày trong tuần: Phân bổ nhân sự trực theo các ca chuẩn (`MORNING: 08:00 - 14:00`, `AFTERNOON: 14:00 - 21:30`, `FULL_DAY: 08:00 - 21:30`).
  - Chống xung đột phân trùng ca cùng lúc cho một nhân viên.
- **Giao diện Chấm công Hàng ngày (Lite Attendance):**
  - Ghi nhận trạng thái có mặt (`PRESENT`), đi trễ (`LATE`), xin nghỉ có phép (`EXCUSED`) hoặc vắng mặt (`ABSENT`) của nhân viên showroom.

---

### 3. Những việc CHƯA LÀM ĐƯỢC / CẦN KHẮC PHỤC
- **Báo cáo Tài chính Lãi Lỗ P&L Hợp nhất Toàn Chuỗi:** Hiện tại mới có báo cáo doanh số từng chi nhánh độc lập, chưa tổng hợp chi phí vận hành (OPEX: mặt bằng, điện nước, lương) và giá vốn xuất kho (COGS) để tính lợi nhuận ròng toàn chuỗi (chuyển sang Tuần 10 - Giám đốc Chuỗi HQ).
- **Thuật toán Tự động Bổ sung Hàng Min/Max Toàn Chuỗi:** Chưa tự động tính toán nhu cầu điều chuyển giữa các chi nhánh để cân bằng hàng tồn đọng (Dead-stock) mà vẫn phụ thuộc vào phiếu kéo hàng thủ công của Quản lý chi nhánh (chuyển sang Tuần 10).

---

## II. KẾT QUẢ THỰC HIỆN CHI TIẾT & MINH CHỨNG (ATTACH EVIDENCE)

### 1. Chuỗi Commit Quản lý Chi nhánh trên Nhánh `feat/branch-manager-expansion`
Toàn bộ các tính năng mở rộng của Tuần 9 được đóng gói qua 5 Waves nghiệp vụ rõ ràng:

| STT | Commit Hash | Module / Phân hệ | Nội dung tóm tắt commit | Phạm vi thay đổi chính |
| :---: | :---: | :--- | :--- | :--- |
| 1 | `87b99e0` | Staff Management (Wave 1) | `feat(branch-manager): implement Wave 1 - branch staff management and team KPI leaderboard` | `BranchStaffPage.jsx`, `staffAnalytics.service.js`, `branch-manager-staff-kpi.test.js` |
| 2 | `d69fc01` | Live Cash & Approvals (Wave 2) | `feat(branch-manager): implement Wave 2 - live cash monitor, discrepancy resolution, and mobile-first privilege approvals` | `ApprovalAlertBell.jsx`, `ManagerApprovalsPage.jsx`, `approval.service.js`, `approvals-discrepancy.test.js` |
| 3 | `c08de18` | Stocktake & RMA (Wave 3) | `feat(branch-manager): implement Wave 3 - Serial stocktaking, pull transfer requests, and RMA outbound` | `BranchStocktakePage.jsx`, `inventoryControl.service.js`, `stocktake.model.js`, `rmaOutbound.model.js` |
| 4 | `60c67dc` | Analytics & Complaints (Wave 4) | `feat(branch-manager): implement Wave 4 - branch strategy analytics and escalation complaints` | `BranchAnalyticsPage.jsx`, `BranchComplaintsPage.jsx`, `complaint.service.js`, `branchStrategyAnalytics.service.js` |
| 5 | `fc4198d` | Roster & Attendance (Wave 5) | `feat(branch-manager): implement Wave 5 - weekly shift roster and lite attendance` | `BranchRosterPage.jsx`, `workSchedule.model.js`, `roster.service.js`, `roster-attendance.test.js` |

---

### 2. Ma trận Kết quả Kiểm thử Tự động Backend (100% Passed)
Chạy bộ kiểm thử tự động toàn diện trên hệ thống bằng lệnh `npm test` tại `code/server`:

```
Test Suites: 27 passed, 27 total
Tests:       222 passed, 222 total
Snapshots:   0 total
Time:        112.651 s
Ran all test suites.
```

- **Bộ kiểm thử Quản lý Nhân sự & KPI ([branch-manager-staff-kpi.test.js](../code/server/tests/integration/branch-manager-staff-kpi.test.js)):**
  - Quản lý chi nhánh thêm/sửa/cập nhật trạng thái nhân viên quầy thuộc phạm vi chi nhánh phụ trách.
  - Chặn đứng hành vi truy cập chéo sang chi nhánh khác (`CROSS_BRANCH_ACCESS_DENIED` - HTTP 403).
  - Tính toán chính xác doanh thu, số lượng đơn hoàn thành và bảng xếp hạng đội ngũ.
- **Bộ kiểm thử Giám sát Két tiền & Phê duyệt Chênh lệch ([approvals-discrepancy.test.js](../code/server/tests/integration/approvals-discrepancy.test.js)):**
  - Chốt ca lệch tiền tạo yêu cầu phê duyệt; Quản lý chi nhánh phê duyệt giải trình hợp lệ.
  - Cơ chế Dual-Control: Chặn Quản lý tự duyệt ca lệch két do chính mình bán tại quầy POS.
- **Bộ kiểm thử Kiểm kê Serial & Xuất trả RMA ([stocktake-rma.test.js](../code/server/tests/integration/stocktake-rma.test.js)):**
  - So khớp mã Serial vật lý, tự động phát hiện máy thiếu (`MISSING`) và chuyển trạng thái sang `LOST`.
  - Tạo phiếu kéo hàng liên chi nhánh (`Pull Transfer`) và phiếu xuất trả bảo hành nhà cung cấp RMA.
- **Bộ kiểm thử Chiến lược & Khiếu nại ([branch-strategy-complaints.test.js](../code/server/tests/integration/branch-strategy-complaints.test.js)):**
  - Kiểm tra thống kê giờ cao điểm và tỷ trọng phương thức thanh toán.
  - Phê duyệt bồi thường khiếu nại trong hạn mức chi nhánh và chặn bồi thường vượt thẩm quyền.
- **Bộ kiểm thử Lập lịch Ca kíp & Chấm công ([roster-attendance.test.js](../code/server/tests/integration/roster-attendance.test.js)):**
  - Phân bổ ca làm việc không trùng lặp, ghi nhận trạng thái chấm công chuẩn xác.

---

### 3. Kết quả Kiểm tra Frontend Production Build
Biên dịch đóng gói production cho toàn bộ ứng dụng Client:

```
> client@0.0.0 build
> vite build

vite v8.3.0 building client environment for production...
transforming...
✓ 2658 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                     0.46 kB │ gzip:   0.30 kB
dist/assets/index-DkJ91Qpa.css    111.45 kB │ gzip:  16.20 kB
dist/assets/index-B72xM39p.js   1,308.20 kB │ gzip: 341.12 kB
✓ built in 1.45s
```
- **Thời gian build:** 1.45 giây.
- **Tình trạng:** Thành công 100%, 0 lỗi biên dịch, không phát sinh cảnh báo kiểu dữ liệu.
- **Kiểm tra mã nguồn:** `npm run lint` đạt **0 errors, 0 warnings** trên toàn bộ các trang quản lý Portal mới.

---

### 4. Chuẩn hóa Giao diện Điều hành Showroom & Bảng Roster Ca Kíp
1. **Bảng Điều hành Két tiền & Phê duyệt ([ManagerApprovalsPage.jsx](../code/client/src/pages/portal/ManagerApprovalsPage.jsx)):** Giao diện phân loại danh sách yêu cầu cần duyệt theo thẻ màu: Màu cam (Lệch két ca), Màu đỏ (Đổi trả hoàn tiền lớn), Màu xanh (Hủy đơn Click & Collect quá hạn) kèm nút Duyệt / Từ chối tức thì.
2. **Giao diện Kiểm kê Kho Serial Siêu tốc ([BranchStocktakePage.jsx](../code/client/src/pages/portal/BranchStocktakePage.jsx)):** Bảng đối soát 3 cột trực quan: "Hệ thống ghi nhận", "Thực tế quét được", "Chênh lệch" kèm bộ lọc xem nhanh các máy thất thoát để lập biên bản xử lý nội bộ.
3. **Lưới Phân ca Tuần Roster ([BranchRosterPage.jsx](../code/client/src/pages/portal/BranchRosterPage.jsx)):** Thiết kế ma trận tuần kéo-thả trực quan, hiển thị tổng số giờ công nhân viên đăng ký trong tuần để tránh quá tải lao động.

---

## III. 🤖 NHẬT KÝ LÀM CHỦ AI (AI USAGE LOG - TC2.3)
> **Mục tiêu:** Minh chứng rõ ràng tinh thần làm chủ công nghệ của sinh viên (Engineering Ownership), thể hiện khả năng giám sát chất lượng code do AI sinh ra, nhận diện và khắc phục kịp thời các ảo giác và khiếm khuyết kỹ thuật.

---

### 📌 Trường hợp 1: Vi phạm Nguyên tắc Phân tách Trách nhiệm (Dual-Control) khi Phê duyệt Lệch Két
- **Bối cảnh:** Xây dựng API phê duyệt giải trình chênh lệch két tiền ca thu ngân (`POST /api/v1/shifts/:id/approve-discrepancy`).
- **Ảo giác của AI:** AI chỉ kiểm tra người gọi API có quyền `BRANCH_MANAGER` hay không mà không kiểm tra ai là người đứng ca bán hàng đó:
  ```javascript
  if (req.user.role !== 'BRANCH_MANAGER' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'FORBIDDEN' });
  }
  shift.status = 'APPROVED';
  await shift.save();
  ```
- **Phân tích của sinh viên:** Trong giờ cao điểm hoặc tình huống thiếu nhân sự, Quản lý chi nhánh có thể trực tiếp đứng quầy POS bán hàng và mở ca thu ngân. Nếu ca đó bị thâm hụt tiền mặt, Quản lý không được phép "tự phê duyệt giải trình cho chính bản thân mình". Điều này vi phạm nguyên tắc kiểm soát nội bộ cốt lõi (Dual-Control / Four-Eyes Principle) trong quản trị bán lẻ.
- **Refactoring của sinh viên:** Thêm logic chặn đứng hành vi tự phê duyệt; trường hợp Quản lý là người đứng ca bị lệch, hệ thống bắt buộc phải đẩy yêu cầu phê duyệt lên cấp cao hơn là `SUPER_ADMIN`:
  ```javascript
  if (shift.staffId.toString() === req.user._id.toString() && req.user.role !== 'SUPER_ADMIN') {
    throw new AppError('DUAL_CONTROL_VIOLATION: Quản lý không thể tự phê duyệt ca lệch tiền do chính mình đứng bán', 400);
  }
  ```
- **Commit Git đối chiếu:** `d69fc01`

---

### 📌 Trường hợp 2: Bỏ qua Đối soát Tập hợp Mã Serial Khi Kiểm kê Kho (Cycle Count)
- **Bối cảnh:** Lập trình hàm chốt kết quả kiểm kê kho thiết bị công nghệ (`finalizeStocktake`).
- **Ảo giác của AI:** AI viết code đối soát đơn giản chỉ bằng cách so sánh 2 con số: Lấy số lượng mã quét được gán đè trực tiếp vào trường `branchInventory.quantity`.
- **Phân tích của sinh viên:** Hàng công nghệ là hàng hóa định danh Serial/IMEI riêng biệt. Việc chỉ đè số lượng tổng mà không chỉ ra đích danh mã máy nào bị mất sẽ làm kho dữ liệu bị "rác": Thiết bị đã mất vẫn ở trạng thái `IN_STOCK`, còn thiết bị mới thừa lại không thể bán được do chưa có trên hệ thống.
- **Refactoring của sinh viên:** Thiết kế thuật toán đối soát tập hợp (Set Difference) giữa 2 mảng mã Serial:
  $$S_{\text{missing}} = S_{\text{system}} \setminus S_{\text{scanned}}, \quad S_{\text{surplus}} = S_{\text{scanned}} \setminus S_{\text{system}}$$
  Hệ thống tự động cập nhật trạng thái của toàn bộ mã $S_{\text{missing}}$ sang `LOST`, ghi vết biên bản kiểm kê và chỉ điều chỉnh tồn kho khả dụng tương ứng với các mã vật lý thực tế hiện diện.
- **Commit Git đối chiếu:** `c08de18`

---

### 📌 Trường hợp 3: Thiếu Thẩm quyền Hạn mức Ngân sách khi Bồi thường Khiếu nại
- **Bối cảnh:** Lập trình tính năng giải quyết khiếu nại khách hàng tại chi nhánh (`complaint.service.js`).
- **Ảo giác của AI:** AI cho phép Quản lý chi nhánh tự do nhập số tiền bồi thường `compensationAmount` mà không đặt ra bất kỳ giới hạn trần nào.
- **Phân tích của sinh viên:** Để tránh rủi ro gian lận hoặc chi vượt ngân sách quỹ cửa hàng, mỗi Giám đốc Showroom chỉ được cấp hạn mức bồi thường giải quyết nhanh sự cố tại quầy tối đa 2.000.000 ₫/vụ việc. Các khoản bồi thường thiệt hại máy móc lớn hơn bắt buộc phải có sự phê duyệt từ Trụ sở chính HQ.
- **Refactoring của sinh viên:** Thêm ràng buộc hạn mức trần:
  ```javascript
  const MAX_BRANCH_COMPENSATION = 2000000; // 2,000,000 VNĐ
  if (dto.compensationAmount > MAX_BRANCH_COMPENSATION && req.user.role === 'BRANCH_MANAGER') {
    complaint.status = 'PENDING_HQ_APPROVAL';
    complaint.notes.push({ text: 'Số tiền bồi thường vượt hạn mức chi nhánh, tự động chuyển lên Trụ sở chính phê duyệt', by: req.user._id });
  } else {
    complaint.status = 'RESOLVED';
  }
  ```
- **Commit Git đối chiếu:** `60c67dc`

---

### 📌 Trường hợp 4: Lệch Múi giờ UTC vs Localhost khi Phân ca Kíp Làm việc Tuần
- **Bối cảnh:** Lưu trữ lịch phân ca làm việc của nhân viên trong tuần (`workSchedule.model.js`).
- **Ảo giác của AI:** AI định nghĩa trường ngày làm việc là kiểu dữ liệu `date: { type: Date }` và truyền object Date trực tiếp từ Frontend (`new Date()`).
- **Phân tích của sinh viên:** Cơ sở dữ liệu MongoDB lưu trữ kiểu `Date` luôn chuyển đổi về chuẩn múi giờ UTC (GMT+0). Khi nhân viên tại Việt Nam (GMT+7) xếp ca làm việc sáng Thứ Hai ngày `2026-11-10T00:00:00+07:00`, MongoDB sẽ lưu thành `2026-11-09T17:00:00.000Z` (thuộc về ngày Chủ Nhật hôm trước). Khi Frontend truy vấn dữ liệu theo ngày, ca làm việc bị hiển thị lệch lùi 1 ngày khiến lịch phân ca bị đảo lộn.
- **Refactoring của sinh viên:** Thay đổi thiết kế kiểu dữ liệu: Lưu trữ trường ngày dưới dạng chuỗi chuẩn không phụ thuộc múi giờ `workDate: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ }` (ví dụ: `"2026-11-10"`), kết hợp enum ca cố định (`shiftType: 'MORNING' | 'AFTERNOON' | 'FULL_DAY'`).
- **Commit Git đối chiếu:** `fc4198d`

---

## IV. BẢNG ĐỐI CHIẾU TIÊU CHÍ RUBRIC KHOA CNTT (TỰ ĐÁNH GIÁ)

| Tiêu chí Rubric | Yêu cầu Mức 5 (Xuất sắc) | Kết quả đạt được thực tế trong Tuần 9 | Mức tự đánh giá |
| :--- | :--- | :--- | :---: |
| **TC2.1 (Kiến trúc)** | Modular rõ ràng, xử lý concurrency triệt tiêu bán âm, state machine chặt chẽ. | Quản lý kiểm kê Serial toàn vẹn; thuật toán Set Difference; phân quyền kiểm soát kép Dual-Control. | **Mức 5 (5.0/5.0 đ)** |
| **TC2.2 (Hoàn thiện SP)** | >= 100% chức năng cốt lõi, không lỗi blocker, responsive, 0 mock data. | Hoàn thành trọn vẹn 5 Waves phân hệ Branch Manager; 100% tính năng hoạt động trên MongoDB Live. | **Mức 5 (5.0/5.0 đ)** |
| **TC2.3 (Làm chủ AI)** | AI Usage Log chi tiết, khớp commit Git; ghi nhận >= 5 lỗi/ảo giác tự sửa. | Ghi nhận 4 trường hợp kỹ thuật sâu: Dual-Control Két tiền, Set Difference Stocktake, Hạn mức Khiếu nại, Múi giờ Roster. | **Mức 5 (5.0/5.0 đ)** |
| **TC2.4 (Chất lượng code)** | 0 lỗi lint / 1000 dòng, không lộ secret, commit phân bổ đều đặn. | 0 lỗi ESLint, .env an toàn tuyệt đối, phân chia 5 Waves commit rành mạch chuẩn Conventional Commits. | **Mức 5 (5.0/5.0 đ)** |
| **TC2.5 (Kiểm thử PM)** | Coverage > 70%, 100% test pass ở CI cuối, kiểm thử >= 4 tầng. | 27/27 Test Suites Passed, 222/222 Tests Passed 100% (Bao quát thêm KPI, Dual-Control, Stocktake, Complaints, Roster). | **Mức 5 (5.0/5.0 đ)** |
| **TC2.6 (CI/CD)** | Pipeline chạy ổn định các chặng, build frontend sạch không lỗi. | Vite build hoàn thành 2658 modules trong 1.45s; CI GitHub Actions hoạt động trơn tru. | **Mức 4.9/5.0 đ** |

---

## V. KẾ HOẠCH HÀNH ĐỘNG TUẦN 10 (GIAI ĐOẠN HOÀN TẤT & ĐỘT PHÁ ĐA KÊNH)

1. **Hoàn thiện Phân hệ Giám đốc Chuỗi Trụ sở Chính HQ (HQ Chain Director):**
   - Xây dựng Trung tâm Cảnh báo Đỏ (Red Alert Command Center) cho ban lãnh đạo.
   - Thuật toán Tự động Bổ sung Hàng Min/Max và Tái cân bằng Kho Hàng Đọng (Dead-stock Rebalancing).
   - Quản lý Nhà cung cấp, Đơn đặt hàng Mua (Purchase Orders) và Báo cáo Tài chính P&L Lợi nhuận Ròng Hợp nhất Chi nhánh.
2. **Mở rộng Trải nghiệm Đa kênh Khách hàng B2C (Customer Omnichannel Expansion):**
   - Đồng bộ hóa lịch sử đơn hàng quầy POS và Online theo Số điện thoại khách hàng.
   - Cơ chế Giỏ hàng lai Hybrid Cart Sync (kết hợp `localStorage` và MongoDB `Cart`).
   - Gợi ý phụ kiện mua kèm thông minh (Cross-sell recommendations), đánh giá đơn hàng 1-5 sao và Cổng tự phục vụ Bảo hành / Đổi trả từ xa.
3. **Đóng gói Toàn diện & Diễn tập Bảo vệ Đề tài:**
   - Hoàn thiện bộ minh chứng 13 tiêu chí nộp lên hệ thống `projects-fit.hcmute.edu.vn`.
