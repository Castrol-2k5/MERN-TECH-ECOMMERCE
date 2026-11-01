# TÀI LIỆU ĐẶC TẢ USE CASE HỆ THỐNG MERN-TECH-ECOMMERCE
## PHÂN HỆ: QUẢN LÝ CHI NHÁNH (BRANCH MANAGER / STORE MANAGER)

---

### Bảng 1. Đặc tả Use Case "Đăng nhập vào cổng quản lý chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM01** |
| **Tên Use Case** | Đăng nhập vào cổng quản lý chi nhánh |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh đăng nhập vào cổng TechOne Portal bằng tài khoản được cấp, hệ thống tự động nhận diện và chuẩn hóa chi nhánh công tác gắn liền với tài khoản (`branchId` & `branch`), cấp quyền truy cập các tính năng vận hành kho và quầy tại chi nhánh tương ứng. |
| **Điều kiện tiên quyết** | - Hệ thống đang hoạt động bình thường.<br>- Tài khoản người dùng đã được Quản lý cấp cao tạo sẵn trong hệ thống với vai trò `role: BRANCH_MANAGER`, trạng thái `isActive: true` và được gán chính xác một mã chi nhánh trực thuộc (`branchId`).<br>- Quản lý chi nhánh biết thông tin đăng nhập (Email hoặc SĐT và Mật khẩu). |
| **Yêu cầu** | - Quản lý truy cập trang đăng nhập `/login`.<br>- Hỗ trợ đăng nhập bằng Email hoặc Số điện thoại.<br>- Mật khẩu được mã hóa an toàn qua thuật toán `bcryptjs`.<br>- Thời hạn phiên làm việc được cấu hình tự động là 8 giờ ca làm việc.<br>- Kiểm tra bắt buộc `branchId` khi đăng nhập: từ chối đăng nhập (`403 BRANCH_NOT_ASSIGNED`) nếu tài khoản `BRANCH_MANAGER` hoặc `STAFF` chưa được gán chi nhánh.<br>- Kích hoạt middleware `scopeBranch` để giới hạn phạm vi truy xuất dữ liệu chỉ trong chi nhánh được phân công, đồng thời chuẩn hóa `authUser.branchId` (chuỗi ID) và `authUser.branch` (thông tin chi nhánh) trong Redux Store kể cả khi khôi phục phiên qua `/api/v1/auth/me`. |
| **Kịch bản chính** | 1. Quản lý chi nhánh truy cập vào ứng dụng tại trang đăng nhập (`/login`).<br>2. Hệ thống hiển thị biểu mẫu đăng nhập.<br>3. Quản lý chi nhánh nhập Email hoặc Số điện thoại và Mật khẩu cá nhân.<br>4. Quản lý chi nhánh nhấn nút "Đăng nhập".<br>5. Hệ thống gửi yêu cầu xác thực (`POST /api/v1/auth/login`).<br>6. Máy chủ kiểm tra định danh, mật khẩu, trạng thái hoạt động (`isActive: true`) và kiểm tra tài khoản đã được gán `branchId` hợp lệ.<br>7. Hệ thống xác định vai trò là `BRANCH_MANAGER`, lưu phiên làm việc 8 giờ vào `user_sessions`, trả về Access Token trong RAM và cấp Refresh Token qua HttpOnly Cookie.<br>8. Hệ thống tự động chuyển hướng Quản lý chi nhánh vào giao diện vận hành chi nhánh (mặc định vào trang Web POS `/portal/pos` hoặc Kho chi nhánh `/portal/inventory`). |
| **Kịch bản phụ** | 3.a. Quản lý chi nhánh chọn biểu tượng con mắt để kiểm tra mật khẩu vừa nhập.<br>6.a. Thông tin đăng nhập không chính xác:<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.1. Hệ thống hiển thị thông báo lỗi "Thông tin đăng nhập không chính xác." (`401 INVALID_CREDENTIALS`).<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.2. Yêu cầu người dùng kiểm tra và nhập lại.<br>6.b. Tài khoản bị vô hiệu hóa (`isActive: false`):<br>&nbsp;&nbsp;&nbsp;&nbsp;6.b.1. Hệ thống từ chối đăng nhập (`403 ACCOUNT_LOCKED`) và thông báo: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên.".<br>6.c. Tài khoản chưa được gán chi nhánh công tác (`branchId` rỗng):<br>&nbsp;&nbsp;&nbsp;&nbsp;6.c.1. Hệ thống từ chối đăng nhập (`403 BRANCH_NOT_ASSIGNED`) và thông báo: "Tài khoản nhân sự chưa được phân công chi nhánh làm việc. Vui lòng liên hệ Super Admin.". |

---

### Bảng 2. Đặc tả Use Case "Quản lý và kiểm kê tồn kho chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM02** |
| **Tên Use Case** | Quản lý và kiểm kê tồn kho chi nhánh (Branch Inventory Overview) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh theo dõi toàn diện số lượng hàng tồn kho của từng mặt hàng/SKU tại cửa hàng mình phụ trách; xem các chỉ số cảnh báo tồn kho thấp; mở ngăn kéo tra cứu danh sách chi tiết từng mã Serial/IMEI cụ thể đang có mặt tại kho chi nhánh. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập thành công với vai trò `BRANCH_MANAGER`. |
| **Yêu cầu** | - Hệ thống tự động khóa phạm vi dữ liệu chi nhánh qua middleware `scopeBranch` (`req.scopedBranchId = req.user.branchId`) và khóa cố định hiển thị tên chi nhánh trên giao diện (`BranchInventoryPage`), không cho phép chuyển sang xem tồn kho nội bộ của chi nhánh khác.<br>- Tốc độ truy vấn API nhanh chóng ($T_{avg} < 200ms$) nhờ chỉ mục kết hợp `{ branchId: 1, productSkuId: 1 }` và tối ưu `.lean()`.<br>- Hỗ trợ lọc theo ngành hàng, trạng thái tồn kho (Còn hàng / Tồn kho thấp / Hết hàng) và tìm kiếm theo tên hoặc mã SKU. |
| **Kịch bản chính** | 1. Quản lý chi nhánh truy cập vào menu "Kho Chi Nhánh" (`/portal/inventory`).<br>2. Hệ thống tự động nhận diện `branchId` của người quản lý, hiển thị huy hiệu khóa cố định chi nhánh công tác và tải danh sách tồn kho (`GET /api/v1/inventory/branch/:branchId`).<br>3. Hệ thống hiển thị các thẻ KPI tồn kho của cửa hàng: Tổng số lượng SKU kinh doanh, Tổng tồn kho thực tế, Số SKU báo động sắp hết hàng và Giá trị tồn kho quy đổi.<br>4. Quản lý chi nhánh có thể lọc sản phẩm theo thanh tìm kiếm hoặc theo danh mục (Laptop, Smartphone, Linh kiện...).<br>5. Bảng hiển thị thông tin từng dòng SKU: Hình ảnh, Tên sản phẩm, Mã SKU, Giá niêm yết, Số lượng tồn thực tế (`quantity`) và Trạng thái (Còn hàng / Sắp hết hàng).<br>6. **Xem danh sách Serial/IMEI thực tế trong kho:**<br>&nbsp;&nbsp;&nbsp;&nbsp;6.1. Tại dòng sản phẩm có quản lý theo số Serial, Quản lý nhấn vào biểu tượng xem danh sách mã máy ("Xem Serials").<br>&nbsp;&nbsp;&nbsp;&nbsp;6.2. Hệ thống mở ngăn kéo chi tiết (`SerialListDrawer`) hiển thị toàn bộ các mã Serial/IMEI của SKU này tại kho chi nhánh kèm trạng thái (`IN_STOCK`, `SOLD`, `WARRANTY`, `TRANSIT`).<br>&nbsp;&nbsp;&nbsp;&nbsp;6.3. Quản lý đối soát các mã máy trên màn hình với các hộp máy vật lý trên kệ kho. |
| **Kịch bản phụ** | 4.a. Không tìm thấy sản phẩm nào khớp với từ khóa tìm kiếm:<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Hệ thống hiển thị thông báo "Không tìm thấy mặt hàng nào trong kho phù hợp với điều kiện tìm kiếm".<br>6.a. SKU được chọn là phụ kiện không quản lý theo mã định danh Serial (`isSerialManaged === false`):<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.1. Hệ thống chỉ hiển thị quản lý theo số lượng tổng. |

---

### Bảng 3. Đặc tả Use Case "Điều chỉnh tồn kho thủ công tại chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM03** |
| **Tên Use Case** | Điều chỉnh tồn kho thủ công tại chi nhánh (Stock Adjustment) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh thực hiện cân đối và điều chỉnh tăng hoặc giảm số lượng tồn kho của một SKU tại chi nhánh khi phát hiện sai lệch số liệu sau các đợt kiểm kê thực tế định kỳ hoặc phát sinh hàng hỏng hóc, hao hụt tại cửa hàng. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập với vai trò `BRANCH_MANAGER`.<br>- Mặt hàng cần điều chỉnh đã tồn tại trong danh mục tồn kho của chi nhánh. |
| **Yêu cầu** | - Chỉ được phép điều chỉnh tồn kho tại đúng chi nhánh mình đang quản lý.<br>- Thực thi cập nhật an toàn bằng toán tử Atomic `$inc` của MongoDB, bảo đảm không gây xung đột dữ liệu với các giao dịch bán hàng POS đang diễn ra đồng thời.<br>- Bắt buộc phải nhập lý do điều chỉnh để lưu vết kiểm toán (Audit Trail) vào `inventory_adjustment_logs`.<br>- Đối với các sản phẩm có quản lý theo mã Serial/IMEI (`hasSerial: true`), giao diện hiển thị cảnh báo nhắc Quản lý sử dụng chức năng **Nhập Lô Serial / IMEI (`UC-BM04`)** nếu muốn nhập thêm lô máy mới kèm mã định danh. |
| **Kịch bản chính** | 1. Quản lý chi nhánh tại trang "Kho Chi Nhánh" (`/portal/inventory`) tìm đến mặt hàng có số lượng thực tế lệch so với hệ thống.<br>2. Quản lý nhấn nút "Điều chỉnh tồn" tương ứng với dòng SKU đó.<br>3. Hệ thống mở hộp thoại điều chỉnh tồn kho (`StockAdjustModal`), hiển thị Tên sản phẩm, Mã SKU, Số lượng tồn kho hiện tại và cảnh báo lưu ý nếu mặt hàng có quản lý Serial.<br>4. Quản lý chi nhánh chọn loại điều chỉnh (Cộng kho / Trừ kho) và nhập số lượng chênh lệch thay đổi (`quantityDelta`).<br>5. Quản lý chi nhánh chọn hoặc nhập lý do điều chỉnh cụ thể (ví dụ: "Kiểm kê định kỳ", "Hàng lỗi / Vỡ hỏng (RMA)").<br>6. Quản lý nhấn nút "Xác Nhận Điều Chỉnh".<br>7. Hệ thống gửi yêu cầu (`POST /api/v1/inventory/adjust`), kiểm tra tính hợp lệ, thực hiện cập nhật số lượng tồn mới trong bảng `branch_inventories` và ghi nhật ký kiểm toán.<br>8. Hệ thống đóng hộp thoại, hiển thị thông báo thành công và tự động làm mới số lượng tồn trên giao diện. |
| **Kịch bản phụ** | 4.a. Quản lý nhập số lượng giảm lớn hơn tổng số tồn kho đang có (khiến tồn kho bị âm):<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Hệ thống báo lỗi "Số lượng điều chỉnh giảm vượt quá tồn kho hiện tại" (`409 INSUFFICIENT_STOCK_FOR_ADJUSTMENT`) và từ chối lưu.<br>5.a. Quản lý để trống ô nhập lý do điều chỉnh:<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.1. Hệ thống cảnh báo "Lý do điều chỉnh tồn kho là bắt buộc" và làm nổi bật ô nhập liệu. |

---

### Bảng 4. Đặc tả Use Case "Nhập lô Serial / IMEI cho kho chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM04** |
| **Tên Use Case** | Nhập lô Serial / IMEI cho kho chi nhánh (Branch Serial Batch Import) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh nhập danh sách hàng loạt các mã Serial/IMEI của các lô hàng thiết bị được nhà cung cấp giao trực tiếp về kho của chi nhánh hoặc nhập tồn đầu kỳ, hệ thống tự động ghi nhận máy ở trạng thái `IN_STOCK` và tăng tồn kho tương ứng cho chi nhánh. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập với vai trò `BRANCH_MANAGER`.<br>- Sản phẩm và SKU cần nhập đã có trên hệ thống danh mục. |
| **Yêu cầu** | - Giao diện (`/portal/admin/import-serials`) và Backend (`POST /api/v1/serials/import` qua `scopeBranch`) tự động khóa cố định chi nhánh đích là chi nhánh mà Quản lý đang phụ trách (`authUser.branchId`), không cho phép chọn chi nhánh khác.<br>- Hỗ trợ bóc tách danh sách mã máy từ dữ liệu copy từ file Excel hoặc súng quét mã vạch.<br>- Ngăn chặn triệt để mã trùng lặp bằng chỉ mục Unique Index trên trường `serialNumber`.<br>- Thực hiện đồng bộ số lượng tồn kho tự động bằng toán tử Atomic `$inc`. |
| **Kịch bản chính** | 1. Quản lý chi nhánh truy cập vào menu "Nhập Lô Serial / IMEI" (`/portal/admin/import-serials`).<br>2. Hệ thống tự động khóa cố định chi nhánh công tác của Quản lý (`isBranchLocked: true`) kèm nhãn "Đã khóa theo phân quyền Quản lý Chi nhánh".<br>3. Quản lý chọn Sản phẩm và biến thể SKU cần nhập mã máy.<br>4. Quản lý dán danh sách mã Serial/IMEI hoặc quét liên tiếp vào khung văn bản bóc tách.<br>5. Bộ phân tích cú pháp tự động chuẩn hóa chuỗi (in hoa, cắt khoảng trắng), lọc mã trùng lặp nội bộ và đếm tổng số mã hợp lệ.<br>6. Quản lý nhấn "Xác nhận nhập kho".<br>7. Hệ thống gửi yêu cầu (`POST /api/v1/serials/import`), khởi tạo các Document Serial mới với trạng thái `IN_STOCK` gắn với `branchId` của chi nhánh, đồng thời cộng dồn số lượng tồn kho trong `branch_inventories`.<br>8. Hệ thống mở modal kết quả nhập lô (`ImportResultModal`) hiển thị tổng số Serial đã nhập và tồn kho mới sau khi cộng dồn. |
| **Kịch bản phụ** | 4.a. Dán danh sách có chứa mã trùng nhau trong cùng 1 lần nhập:<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Bộ parser tự động cảnh báo số lượng mã trùng lặp trong lô và cho phép lọc bỏ trước khi gửi.<br>7.a. Phát hiện mã Serial đã từng được nhập vào hệ thống trước đó:<br>&nbsp;&nbsp;&nbsp;&nbsp;7.a.1. Hệ thống báo lỗi trùng lặp mã Serial trong CSDL (`400 DUPLICATE_SERIAL`) kèm danh sách các mã bị trùng để quản lý kiểm tra. |

---

### Bảng 5. Đặc tả Use Case "Tạo yêu cầu điều chuyển hàng đi chi nhánh khác"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM05** |
| **Tên Use Case** | Tạo yêu cầu điều chuyển hàng đi chi nhánh khác (Outbound Stock Transfer) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh lập phiếu xuất điều chuyển thiết bị từ chi nhánh mình sang một chi nhánh khác trong cùng chuỗi để hỗ trợ hàng hóa, quét hoặc chọn các mã Serial/IMEI cụ thể xuất đi, chuyển trạng thái Serial sang `TRANSIT` và tự động trừ kho chi nhánh gửi. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập với vai trò `BRANCH_MANAGER`.<br>- Kho chi nhánh hiện tại có sẵn hàng (`IN_STOCK`) cho mặt hàng cần chuyển. |
| **Yêu cầu** | - Chi nhánh gửi (`fromBranchId`) được khóa cố định là chi nhánh của Quản lý (`authUser.branchId`).<br>- Danh sách Chi nhánh nhận (`toBranchId`) tự động loại trừ chi nhánh gửi để tránh chọn trùng.<br>- Bắt buộc phải chọn đích danh các mã Serial/IMEI xuất kho (nếu sản phẩm quản lý theo Serial).<br>- Trừ tồn kho chi nhánh gửi ngay khi tạo lệnh xuất kho để tránh bán lặp lại. |
| **Kịch bản chính** | 1. Quản lý chi nhánh truy cập trang "Điều Chuyển Kho" (`/portal/branch/transfers`), xem danh sách các phiếu xuất kho chuyển đi (Outbound).<br>2. Hệ thống hiển thị danh sách các phiếu điều chuyển liên quan đến chi nhánh kèm trạng thái (`IN_TRANSIT`, `COMPLETED`, `CANCELLED`).<br>3. Quản lý nhấn nút "Tạo phiếu điều chuyển".<br>4. Hệ thống mở modal tạo phiếu điều chuyển, trường Chi nhánh xuất hàng được khóa cố định là chi nhánh hiện tại của Quản lý.<br>5. Quản lý chọn Chi nhánh nhận hàng từ danh mục dropdown các chi nhánh khác.<br>6. Quản lý chọn Sản phẩm, biến thể SKU và nhập số lượng cần chuyển.<br>7. Hệ thống truy vấn các mã Serial/IMEI đang `IN_STOCK` tại kho của chi nhánh (`GET /api/v1/serials?branchId=...&productSkuId=...&status=IN_STOCK`) và hiển thị danh sách lựa chọn.<br>8. Quản lý tích chọn đúng số lượng các mã Serial thực tế sẽ đóng gói gửi đi và nhập lý do điều chuyển.<br>9. Quản lý nhấn "Xác nhận xuất kho".<br>10. Hệ thống gọi API (`POST /api/v1/inventory/transfers`), tạo phiếu mới trong bảng `stock_transfers` (trạng thái `IN_TRANSIT`), cập nhật trạng thái các Serial sang `TRANSIT`, và trừ số lượng tồn kho tương ứng của chi nhánh gửi qua toán tử Atomic `$inc: { quantity: -qty }`.<br>11. Hệ thống cấp mã phiếu chuyển (dạng `TRF-YYYYMMDD-XXXX`) và làm mới danh sách. |
| **Kịch bản phụ** | 5.a. Gửi API có chi nhánh nhận trùng với chi nhánh gửi:<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.1. Hệ thống báo lỗi yêu cầu chọn chi nhánh nhận khác chi nhánh gửi (`400 SAME_BRANCH_TRANSFER`).<br>8.a. Số lượng Serial được chọn không khớp với số lượng cần chuyển:<br>&nbsp;&nbsp;&nbsp;&nbsp;8.a.1. Hệ thống cảnh báo và vô hiệu hóa nút xác nhận cho đến khi chọn đủ số lượng mã máy. |

---

### Bảng 6. Đặc tả Use Case "Tiếp nhận và xác nhận nhập kho hàng điều chuyển đến"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM06** |
| **Tên Use Case** | Tiếp nhận và xác nhận nhập kho hàng điều chuyển đến (Inbound Stock Transfer Verification) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh theo dõi các kiện hàng đang được chuyển từ Kho Trung Tâm hoặc chi nhánh khác về cửa hàng mình; mở giao diện kiểm tra thực tế, quét đối soát từng mã Serial/IMEI trên kiện hàng và xác nhận nhập kho, tự động chuyển trạng thái Serial sang `IN_STOCK` tại chi nhánh đích và tăng tồn kho chi nhánh. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập với vai trò `BRANCH_MANAGER`.<br>- Có phiếu điều chuyển đang ở trạng thái `IN_TRANSIT` hướng về chi nhánh mình (`toBranchId`). |
| **Yêu cầu** | - Chỉ cho phép Quản lý của chi nhánh đích (`toBranchId`) hoặc `SUPER_ADMIN` xác nhận tiếp nhận phiếu điều chuyển.<br>- Cơ chế đối soát nghiêm ngặt: Phải quét kiểm tra khớp 100% danh sách mã Serial trên phiếu trước khi cho phép xác nhận nhập kho.<br>- Tích hợp phản hồi âm thanh (`usePosAudio`) khi quét mã đúng hoặc sai.<br>- Cập nhật tồn kho an toàn (`$inc`) và chuyển trạng thái Serial sang `IN_STOCK` kèm `branchId` mới cho Serial. |
| **Kịch bản chính** | 1. Quản lý chi nhánh truy cập trang "Điều Chuyển Kho" (`/portal/branch/transfers`), lọc xem các phiếu chuyển đến (Inbound).<br>2. Hệ thống hiển thị danh sách các phiếu điều chuyển đang gửi tới chi nhánh này.<br>3. Khi kiện hàng vật lý được giao tới cửa hàng, Quản lý tìm đến mã phiếu tương ứng và nhấn "Kiểm nhận & Nhập kho".<br>4. Hệ thống mở modal đối soát kiểm nhận hàng, hiển thị danh sách các mã Serial cần nhận và thanh tiến độ kiểm đếm.<br>5. Quản lý sử dụng máy quét mã vạch hoặc nhập tay từng mã Serial trên thân hộp máy vào ô quét.<br>6. Với mỗi mã quét hợp lệ nằm trong danh sách của phiếu, hệ thống phát âm thanh bíp thành công (`playSuccessBeep`) và đánh dấu tích xanh trên danh sách.<br>7. Sau khi toàn bộ các mã Serial đã được quét đối soát đầy đủ (đạt 100%), nút "Hoàn tất nhập kho" được kích hoạt.<br>8. Quản lý nhấn "Hoàn tất nhập kho".<br>9. Hệ thống gửi yêu cầu (`PATCH /api/v1/inventory/transfers/:id/receive`), chuyển trạng thái phiếu sang `COMPLETED`, chuyển các mã Serial sang `IN_STOCK` gắn với `branchId` của chi nhánh nhận, và cộng tăng số lượng tồn kho `quantity` tương ứng trong `branch_inventories`.<br>10. Hệ thống hiển thị thông báo hoàn tất tiếp nhận và cập nhật lại kho hàng. |
| **Kịch bản phụ** | 5.a. Quản lý quét một mã Serial không có trong danh sách của phiếu điều chuyển:<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.1. Hệ thống phát âm thanh cảnh báo lỗi (`playErrorBeep`) và hiển thị thông báo "Mã Serial không nằm trong danh sách của phiếu điều chuyển này".<br>5.b. Quản lý quét lặp lại một mã Serial đã được quét trước đó:<br>&nbsp;&nbsp;&nbsp;&nbsp;5.b.1. Hệ thống phát âm báo lỗi và thông báo "Mã Serial này đã được quét kiểm nhận trước đó". |

---

### Bảng 7. Đặc tả Use Case "Tiếp nhận và xử lý đơn hàng B2C phân bổ về chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM07** |
| **Tên Use Case** | Tiếp nhận và xử lý đơn hàng B2C phân bổ về chi nhánh (B2C Order Fulfillment) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh tiếp nhận các đơn hàng mua sắm trực tuyến từ khách hàng B2C được hệ thống phân bổ về cửa hàng; thực hiện lấy hàng trên kệ, quét gán mã Serial/IMEI cho từng mặt hàng trong đơn (`order.items`), đóng gói và xác nhận sẵn sàng bàn giao cho khách hoặc đơn vị vận chuyển. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập với vai trò `BRANCH_MANAGER`.<br>- Có đơn hàng B2C được phân bổ về chi nhánh đang ở trạng thái `PROCESSING`. |
| **Yêu cầu** | - Đơn hàng phải thuộc đúng phạm vi quản lý của chi nhánh (`scopeBranch`).<br>- Giám sát thời gian cam kết dịch vụ (SLA Counter) để tránh giao hàng trễ hạn.<br>- Hỗ trợ đơn hàng có một hoặc nhiều dòng sản phẩm (`order.items`): bắt buộc gán đủ tổng số lượng mã Serial/IMEI đang `IN_STOCK` tại kho cửa hàng cho các mặt hàng trong đơn trước khi xuất giao. |
| **Kịch bản chính** | 1. Quản lý chi nhánh truy cập menu "Xử Lý Đơn B2C Chi Nhánh" (`/portal/admin/orders-dispatch`).<br>2. Hệ thống hiển thị các đơn hàng B2C thuộc chi nhánh kèm đồng hồ đếm ngược thời gian SLA giao hàng và danh sách sản phẩm trong đơn.<br>3. Quản lý chọn một đơn hàng ở trạng thái `PROCESSING` và nhấn "Quét Gán Serial".<br>4. Hệ thống mở ngăn kéo gán Serial (`OrderSerialAssignDrawer`), tự động tải danh sách các mã Serial `IN_STOCK` tại chi nhánh cho toàn bộ SKU có trong đơn.<br>5. Quản lý lấy thiết bị từ kệ kho và dùng máy quét mã vạch quét mã Serial/IMEI của máy (hoặc chọn nhanh từ danh sách gợi ý).<br>6. Hệ thống đối soát mã máy: kiểm tra mã có tồn tại, có đang ở trạng thái `IN_STOCK` tại chi nhánh này hay không.<br>7. Quản lý nhấn "Xác nhận Gán Serial & Đóng Gói".<br>8. Hệ thống gọi API (`PATCH /api/v1/orders/:id/dispatch`), phân bổ các mã Serial vào từng dòng `order.items`, chuyển trạng thái các Serial sang `SOLD` kèm kích hoạt hạn bảo hành điện tử (`warrantyEndDate`), và cập nhật trạng thái đơn hàng sang `READY_FOR_SHIPPING`. |
| **Kịch bản phụ** | 6.a. Quét mã Serial thuộc chi nhánh khác hoặc mã máy không ở trạng thái `IN_STOCK`:<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.1. Hệ thống báo lỗi mã máy không khả dụng tại chi nhánh và từ chối gán vào đơn. |

---

### Bảng 8. Đặc tả Use Case "Giám sát và tra cứu danh sách đơn hàng tại chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM08** |
| **Tên Use Case** | Giám sát và tra cứu danh sách đơn hàng tại chi nhánh (Branch Orders Monitoring) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER), Nhân viên tại quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh xem lịch sử toàn bộ các giao dịch phát sinh tại cửa hàng mình phụ trách (bao gồm các đơn bán hàng trực tiếp tại quầy `POS_STORE` và các đơn trực tuyến `B2C_ONLINE`); tra cứu chi tiết đơn hàng, doanh số, nhân viên thu ngân, thông tin khách hàng và kiểm tra bảo hành điện tử của từng mã Serial đã xuất bán. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập với vai trò `BRANCH_MANAGER` (hoặc `STAFF`). |
| **Yêu cầu** | - Middleware `scopeBranch` tự động giới hạn chỉ cho phép xem các đơn hàng có `branchId` trùng với chi nhánh của người quản lý.<br>- Hỗ trợ lọc theo kênh bán (`ALL`, `POS_STORE`, `B2C_ONLINE`), lọc theo trạng thái đơn hàng và tìm kiếm theo mã đơn hàng (`orderCode`), tên khách hàng hoặc số điện thoại (`search`). |
| **Kịch bản chính** | 1. Quản lý chi nhánh truy cập vào menu "Đơn Hàng Chi Nhánh" (`/portal/branch/orders`).<br>2. Hệ thống gọi API (`GET /api/v1/orders/branch`) và nạp danh sách đơn hàng thuộc chi nhánh phụ trách kèm 4 thẻ KPI (Tổng số đơn, Đơn POS tại quầy, Đơn B2C Online, Tổng doanh thu hợp lệ).<br>3. Bảng hiển thị thông tin tổng hợp: Mã đơn hàng, Thời gian tạo, Kênh bán (`POS Tại Quầy` hay `B2C Online`), Khách hàng, Nhân viên thu ngân (`staffId`), Sản phẩm & số lượng Serial đã gán, Tổng tiền thanh toán và Trạng thái đơn.<br>4. Quản lý chi nhánh có thể lọc theo kênh bán, trạng thái đơn hàng hoặc nhập từ khóa vào ô tìm kiếm.<br>5. Quản lý nhấn nút "Chi tiết" tại một dòng đơn hàng.<br>6. Hệ thống mở Modal Chi tiết đơn hàng hiển thị thông tin khách hàng, nhân viên thu ngân thực hiện ca bán, danh sách mặt hàng và các huy hiệu mã Serial/IMEI đã xuất.<br>7. Quản lý nhấn vào một mã Serial bất kỳ trong Modal để kiểm tra tức thì trạng thái kích hoạt và thời hạn bảo hành điện tử (`GET /api/v1/serials/verify/:serialNumber`). |
| **Kịch bản phụ** | 4.a. Nhập mã đơn hàng không tồn tại hoặc thuộc chi nhánh khác:<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Hệ thống hiển thị kết quả rỗng và thông báo "Không tìm thấy đơn hàng nào khớp với bộ lọc hiện tại". |

---

### Bảng 9. Đặc tả Use Case "Giám sát tiếp nhận và xử lý bảo hành tại chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM09** |
| **Tên Use Case** | Giám sát tiếp nhận và xử lý bảo hành tại chi nhánh (Warranty Tickets Oversight) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER), Nhân viên kỹ thuật/quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh và nhân viên tiếp nhận thẩm định bảo hành theo mã Serial/IMEI, lập phiếu tiếp nhận RMA có đầy đủ tình trạng ngoại quan/phụ kiện/ngày hẹn trả, theo dõi danh sách phiếu RMA tại cửa hàng và cập nhật tiến độ xử lý (`RECEIVED` → `PROCESSING` → `COMPLETED` → `RETURNED`). |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập với vai trò `BRANCH_MANAGER`. |
| **Yêu cầu** | - Dữ liệu được giới hạn trong chi nhánh phụ trách thông qua middleware `scopeBranch`.<br>- API tra cứu Serial (`GET /api/v1/serials/verify/:serialNumber`) trả về đầy đủ tên sản phẩm, SKU, ảnh, chi nhánh mua hàng, thông tin khách hàng từ đơn hàng gốc và thời hạn bảo hành.<br>- Hỗ trợ lọc danh sách phiếu theo trạng thái (`RECEIVED`, `PROCESSING`, `COMPLETED`, `RETURNED`), tìm kiếm theo mã phiếu hoặc Serial, và cập nhật trạng thái phiếu qua `PATCH /api/v1/warranty/:id/status`.<br>- Khi phiếu bảo hành được chuyển sang trạng thái `RETURNED` (Đã bàn giao máy cho khách), hệ thống tự động khôi phục trạng thái Serial từ `WARRANTY` về `SOLD`. |
| **Kịch bản chính** | 1. Quản lý chi nhánh mở menu "Tiếp Nhận Bảo Hành" (`/portal/warranty-reception`).<br>2. **Tab Tiếp nhận & Thẩm định mới:**<br>&nbsp;&nbsp;&nbsp;&nbsp;2.1. Quét hoặc nhập mã Serial/IMEI để kiểm tra hạn bảo hành điện tử và thông tin chủ sở hữu.<br>&nbsp;&nbsp;&nbsp;&nbsp;2.2. Nhập mô tả lỗi, tình trạng ngoại quan, tích chọn phụ kiện đi kèm, ngày hẹn trả dự kiến và nhấn "Xuất Phiếu Tiếp Nhận Bảo Hành" (`POST /api/v1/warranty`).<br>&nbsp;&nbsp;&nbsp;&nbsp;2.3. Hệ thống tạo phiếu `RMA-YYYYMMDD-XXXX`, chuyển trạng thái Serial sang `WARRANTY` và mở modal in phiếu biên nhận K80/A5.<br>3. **Tab Danh sách phiếu bảo hành RMA:**<br>&nbsp;&nbsp;&nbsp;&nbsp;3.1. Hệ thống gọi API (`GET /api/v1/warranty`) nạp danh sách các phiếu bảo hành tại chi nhánh.<br>&nbsp;&nbsp;&nbsp;&nbsp;3.2. Bảng hiển thị: Mã phiếu, Mã Serial/IMEI, Tên sản phẩm, Khách hàng, Mô tả lỗi & Ngày hẹn trả, Dropdown cập nhật trạng thái và nút In lại phiếu.<br>&nbsp;&nbsp;&nbsp;&nbsp;3.3. Khi thiết bị được sửa chữa hoặc bàn giao lại cho khách, Quản lý chọn trạng thái mới (`PROCESSING`, `COMPLETED`, hoặc `RETURNED`).<br>&nbsp;&nbsp;&nbsp;&nbsp;3.4. Hệ thống gọi `PATCH /api/v1/warranty/:id/status`, cập nhật tiến độ phiếu và tự động hoàn trả trạng thái Serial về `SOLD` nếu chọn `RETURNED`. |
| **Kịch bản phụ** | 2.a. Quét mã Serial chưa từng xuất bán (`IN_STOCK`):<br>&nbsp;&nbsp;&nbsp;&nbsp;2.a.1. Hệ thống cảnh báo thiết bị chưa xuất bán và từ chối tạo phiếu bảo hành (`400 SERIAL_NOT_SOLD`). |

---

### Bảng 10. Đặc tả Use Case "Bán hàng tại quầy Web POS (Hỗ trợ thu ngân)"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM10** |
| **Tên Use Case** | Bán hàng tại quầy Web POS (Hỗ trợ thu ngân giờ cao điểm) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh trực tiếp truy cập vào màn hình Web POS bán hàng tại quầy khi cửa hàng bước vào khung giờ cao điểm hoặc thiếu nhân sự thu ngân; thực hiện quét mã vạch (Serial hoặc SKU), gán Serial từ tồn kho thực tế của chi nhánh, thanh toán và in hóa đơn K80. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập với vai trò `BRANCH_MANAGER`.<br>- Ca làm việc tại quầy sẵn sàng hoạt động. |
| **Yêu cầu** | - Quản lý chi nhánh có đầy đủ quyền thao tác trên màn hình Web POS (`/portal/pos`).<br>- Thanh tiêu đề `PosHeader` hiển thị đúng tên chi nhánh thực tế, họ tên người dùng đang đăng nhập và có nút **"Về Cổng Quản Lý"** (`/portal/inventory`) để thoát nhanh khỏi giao diện POS toàn màn hình.<br>- Danh mục sản phẩm trên POS tự động đồng bộ từ tồn kho thực tế của chi nhánh (`GET /api/v1/inventory/branch/:branchId`), hiển thị đúng số lượng tồn (`stock`) và danh sách các mã Serial `IN_STOCK` khả dụng tại quầy. |
| **Kịch bản chính** | 1. Quản lý chi nhánh truy cập vào menu "Web POS Thu Ngân" (`/portal/pos`).<br>2. Hệ thống mở giao diện bán hàng chuyên dụng toàn màn hình và tải danh mục tồn kho thực tế của chi nhánh.<br>3. Quản lý thực hiện tìm kiếm mặt hàng, chọn trên lưới sản phẩm hoặc quét mã vạch (hỗ trợ quét trực tiếp mã Serial/IMEI qua `/api/v1/serials/scan/:serialNumber` hoặc quét mã SKU sản phẩm).<br>4. Nếu chọn sản phẩm quản lý Serial từ danh mục, Quản lý mở modal gán Serial (`SerialAssignmentModal`) để chọn hoặc quét đủ số lượng mã Serial `IN_STOCK` tại chi nhánh.<br>5. Quản lý nhập thông tin khách hàng, số tiền khách đưa và chọn phương thức thanh toán (`CASH` hoặc `VNPAY`).<br>6. Quản lý nhấn "Thanh toán" (`F9`).<br>7. Hệ thống gọi `POST /api/v1/orders/pos/checkout`, tạo đơn hàng `POS_STORE` (`COMPLETED`), trừ tồn kho tức thì, chuyển Serial sang `SOLD` kèm kích hoạt bảo hành điện tử, làm mới lại danh mục tồn kho trên màn hình POS và hiển thị modal hóa đơn nhiệt K80 để in. |
| **Kịch bản phụ** | 3.a. Quét mã Serial thuộc chi nhánh khác hoặc đã bán:<br>&nbsp;&nbsp;&nbsp;&nbsp;3.a.1. Hệ thống phát âm thanh báo lỗi và hiển thị thông báo từ chối thao tác chéo chi nhánh hoặc mã không khả dụng. |

---

### Bảng 11. Đặc tả Use Case "Đăng xuất khỏi cổng quản lý chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM11** |
| **Tên Use Case** | Đăng xuất khỏi cổng quản lý chi nhánh |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh kết thúc ca làm việc, hủy bỏ phiên làm việc trên trình duyệt (hoặc đăng xuất khỏi toàn bộ thiết bị), thu hồi token và đảm bảo an toàn thông tin dữ liệu của cửa hàng. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đang đăng nhập trong hệ thống. |
| **Yêu cầu** | - Xóa bản ghi phiên trong collection `user_sessions` (`POST /api/v1/auth/logout` hoặc `POST /api/v1/auth/logout-all`).<br>- Hủy bỏ HttpOnly Cookie và dọn sạch dữ liệu người dùng khỏi Redux Store + `localStorage`. |
| **Kịch bản chính** | 1. Quản lý chi nhánh nhấn vào nút "Đăng xuất" (hoặc nút thu hồi toàn bộ phiên đăng nhập) ở góc dưới thanh điều hướng bên trái (`PortalLayout`).<br>2. Hệ thống gửi yêu cầu `POST /api/v1/auth/logout` (hoặc `/api/v1/auth/logout-all`).<br>3. Máy chủ thu hồi Refresh Token trong `user_sessions` và xóa cookie xác thực.<br>4. Ứng dụng xóa trạng thái phiên đăng nhập trong Redux Store.<br>5. Hệ thống điều hướng Quản lý chi nhánh quay trở lại trang đăng nhập (`/login`). |
| **Kịch bản phụ** | 2.a. Xảy ra lỗi mất kết nối mạng khi gửi request đăng xuất:<br>&nbsp;&nbsp;&nbsp;&nbsp;2.a.1. Ứng dụng client vẫn chủ động xóa toàn bộ token trong bộ nhớ nội bộ và điều hướng về trang đăng nhập để đảm bảo an toàn cục bộ. |
