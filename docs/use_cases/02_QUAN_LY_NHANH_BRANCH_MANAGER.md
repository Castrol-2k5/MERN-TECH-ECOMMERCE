# TÀI LIỆU ĐẶC TẢ USE CASE HỆ THỐNG MERN-TECH-ECOMMERCE
## PHÂN HỆ: QUẢN LÝ CHI NHÁNH (BRANCH MANAGER / STORE MANAGER)

---

### Bảng 1. Đặc tả Use Case "Đăng nhập vào cổng quản lý chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM01** |
| **Tên Use Case** | Đăng nhập vào cổng quản lý chi nhánh |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh đăng nhập vào cổng TechOne Portal bằng tài khoản được cấp, hệ thống tự động nhận diện chi nhánh công tác gắn liền với tài khoản (`branchId`), cấp quyền truy cập các tính năng vận hành kho và quầy tại chi nhánh tương ứng. |
| **Điều kiện tiên quyết** | - Hệ thống đang hoạt động bình thường.<br>- Tài khoản người dùng đã được Quản lý cấp cao tạo sẵn trong hệ thống với vai trò `role: BRANCH_MANAGER`, trạng thái `isActive: true` và được gán chính xác một mã chi nhánh trực thuộc (`branchId`).<br>- Quản lý chi nhánh biết thông tin đăng nhập (Email hoặc SĐT và Mật khẩu). |
| **Yêu cầu** | - Quản lý truy cập trang đăng nhập `/login`.<br>- Hỗ trợ đăng nhập bằng Email hoặc Số điện thoại.<br>- Mật khẩu được mã hóa an toàn qua thuật toán `bcryptjs`.<br>- Thời hạn phiên làm việc được cấu hình tự động là 8 giờ ca làm việc.<br>- Kích hoạt middleware `scopeBranch` để giới hạn phạm vi truy xuất dữ liệu chỉ trong chi nhánh được phân công. |
| **Kịch bản chính** | 1. Quản lý chi nhánh truy cập vào ứng dụng tại trang đăng nhập (`/login`).<br>2. Hệ thống hiển thị biểu mẫu đăng nhập.<br>3. Quản lý chi nhánh nhập Email hoặc Số điện thoại và Mật khẩu cá nhân.<br>4. Quản lý chi nhánh nhấn nút "Đăng nhập".<br>5. Hệ thống gửi yêu cầu xác thực (`POST /api/v1/auth/login`).<br>6. Máy chủ kiểm tra định danh, mật khẩu và lấy thông tin tài khoản.<br>7. Hệ thống xác định vai trò là `BRANCH_MANAGER`, lưu phiên làm việc 8 giờ vào `user_sessions`, trả về Access Token trong RAM và cấp Refresh Token qua HttpOnly Cookie.<br>8. Hệ thống tự động chuyển hướng Quản lý chi nhánh vào giao diện vận hành chi nhánh (mặc định vào trang Web POS `/portal/pos` hoặc Kho chi nhánh `/portal/inventory`). |
| **Kịch bản phụ** | 3.a. Quản lý chi nhánh chọn biểu tượng con mắt để kiểm tra mật khẩu vừa nhập.<br>6.a. Thông tin đăng nhập không chính xác:<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.1. Hệ thống hiển thị thông báo lỗi "Email/Số điện thoại hoặc mật khẩu không chính xác".<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.2. Yêu cầu người dùng kiểm tra và nhập lại.<br>6.b. Tài khoản bị vô hiệu hóa (`isActive: false`):<br>&nbsp;&nbsp;&nbsp;&nbsp;6.b.1. Hệ thống từ chối đăng nhập và thông báo: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản lý cấp cao".<br>6.c. Tài khoản chưa được gán chi nhánh công tác (`branchId` rỗng):<br>&nbsp;&nbsp;&nbsp;&nbsp;6.c.1. Hệ thống báo lỗi dữ liệu tài khoản không hợp lệ và yêu cầu liên hệ Super Admin gán chi nhánh. |

---

### Bảng 2. Đặc tả Use Case "Quản lý và kiểm kê tồn kho chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM02** |
| **Tên Use Case** | Quản lý và kiểm kê tồn kho chi nhánh (Branch Inventory Overview) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh theo dõi toàn diện số lượng hàng tồn kho của từng mặt hàng/SKU tại cửa hàng mình phụ trách; xem các chỉ số cảnh báo tồn kho thấp; mở ngăn kéo tra cứu danh sách chi tiết từng mã Serial/IMEI cụ thể đang có mặt tại kho chi nhánh. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập thành công với vai trò `BRANCH_MANAGER`. |
| **Yêu cầu** | - Hệ thống tự động khóa phạm vi dữ liệu chi nhánh qua middleware `scopeBranch` (`req.scopedBranchId = req.user.branchId`), không thể xem lấn sang dữ liệu tồn kho nội bộ của chi nhánh khác.<br>- Tốc độ truy vấn API nhanh chóng ($T_{avg} < 200ms$) nhờ chỉ mục kết hợp `{ branchId: 1, productSkuId: 1 }` và tối ưu `.lean()`.<br>- Hỗ trợ lọc theo ngành hàng, trạng thái tồn kho (Còn hàng / Tồn kho thấp / Hết hàng) và tìm kiếm theo tên hoặc mã SKU. |
| **Kịch bản chính** | 1. Quản lý chi nhánh truy cập vào menu "Kho Chi Nhánh" (`/portal/inventory`).<br>2. Hệ thống tự động nhận diện `branchId` của người quản lý và hiển thị danh sách tồn kho của đúng chi nhánh đó.<br>3. Hệ thống hiển thị các thẻ KPI tồn kho của cửa hàng: Tổng số lượng SKU kinh doanh, Tổng tồn kho thực tế, Số SKU báo động sắp hết hàng và Giá trị tồn kho quy đổi.<br>4. Quản lý chi nhánh có thể lọc sản phẩm theo thanh tìm kiếm hoặc theo danh mục (Laptop, Smartphone, Linh kiện...).<br>5. Bảng hiển thị thông tin từng dòng SKU: Hình ảnh, Tên sản phẩm, Mã SKU, Giá niêm yết, Số lượng tồn thực tế (`quantity`) và Trạng thái (Còn hàng / Sắp hết hàng).<br>6. **Xem danh sách Serial/IMEI thực tế trong kho:**<br>&nbsp;&nbsp;&nbsp;&nbsp;6.1. Tại dòng sản phẩm có quản lý theo số Serial, Quản lý nhấn vào biểu tượng xem danh sách mã máy ("Xem Serials").<br>&nbsp;&nbsp;&nbsp;&nbsp;6.2. Hệ thống mở ngăn kéo chi tiết (`SerialListDrawer`) hiển thị toàn bộ các mã Serial/IMEI của SKU này đang có trạng thái `IN_STOCK` tại kho chi nhánh.<br>&nbsp;&nbsp;&nbsp;&nbsp;6.3. Quản lý đối soát các mã máy trên màn hình với các hộp máy vật lý trên kệ kho. |
| **Kịch bản phụ** | 4.a. Không tìm thấy sản phẩm nào khớp với từ khóa tìm kiếm:<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Hệ thống hiển thị thông báo "Không tìm thấy mặt hàng nào trong kho phù hợp với điều kiện tìm kiếm".<br>6.a. SKU được chọn là phụ kiện không quản lý theo mã định danh Serial (`isSerialManaged === false`):<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.1. Hệ thống ẩn nút xem danh sách Serial và chỉ hiển thị quản lý theo số lượng tổng. |

---

### Bảng 3. Đặc tả Use Case "Điều chỉnh tồn kho thủ công tại chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM03** |
| **Tên Use Case** | Điều chỉnh tồn kho thủ công tại chi nhánh (Stock Adjustment) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh thực hiện cân đối và điều chỉnh tăng hoặc giảm số lượng tồn kho của một SKU tại chi nhánh khi phát hiện sai lệch số liệu sau các đợt kiểm kê thực tế định kỳ hoặc phát sinh hàng hỏng hóc, hao hụt tại cửa hàng. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập với vai trò `BRANCH_MANAGER`.<br>- Mặt hàng cần điều chỉnh đã tồn tại trong danh mục tồn kho của chi nhánh. |
| **Yêu cầu** | - Chỉ được phép điều chỉnh tồn kho tại đúng chi nhánh mình đang quản lý.<br>- Thực thi cập nhật an toàn bằng toán tử Atomic `$inc` của MongoDB, bảo đảm không gây xung đột dữ liệu với các giao dịch bán hàng POS đang diễn ra đồng thời.<br>- Bắt buộc phải nhập lý do điều chỉnh để lưu vết kiểm toán (Audit Trail). |
| **Kịch bản chính** | 1. Quản lý chi nhánh tại trang "Kho Chi Nhánh" tìm đến mặt hàng có số lượng thực tế lệch so với hệ thống.<br>2. Quản lý nhấn nút "Điều chỉnh tồn" tương ứng với dòng SKU đó.<br>3. Hệ thống mở hộp thoại điều chỉnh tồn kho (`StockAdjustModal`), hiển thị Tên sản phẩm, Mã SKU và Số lượng tồn kho hiện tại trên hệ thống.<br>4. Quản lý chi nhánh nhập Số lượng chênh lệch thay đổi (nhập số dương nếu kiểm kê thừa cần tăng kho, số âm nếu kiểm kê thiếu cần giảm kho).<br>5. Quản lý chi nhánh nhập lý do điều chỉnh (ví dụ: "Bù trừ kiểm kê cuối ngày", "Hàng mẫu trưng bày bị trầy xước hao hụt").<br>6. Quản lý nhấn nút "Lưu điều chỉnh".<br>7. Hệ thống gửi yêu cầu (`POST /api/v1/inventory/adjust`), kiểm tra tính hợp lệ và thực hiện cập nhật số lượng tồn mới trong bảng `branch_inventories`.<br>8. Hệ thống đóng hộp thoại, hiển thị thông báo thành công màu xanh và tự động làm mới số lượng tồn trên giao diện. |
| **Kịch bản phụ** | 4.a. Quản lý nhập số lượng giảm lớn hơn tổng số tồn kho đang có (khiến tồn kho bị âm):<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Hệ thống báo lỗi "Số lượng giảm vượt quá tồn kho khả dụng hiện tại" và từ chối lưu.<br>5.a. Quản lý để trống ô nhập lý do điều chỉnh:<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.1. Hệ thống cảnh báo "Vui lòng nhập lý do điều chỉnh tồn kho" và làm nổi bật ô nhập liệu. |

---

### Bảng 4. Đặc tả Use Case "Nhập lô Serial / IMEI cho kho chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM04** |
| **Tên Use Case** | Nhập lô Serial / IMEI cho kho chi nhánh (Branch Serial Batch Import) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh nhập danh sách hàng loạt các mã Serial/IMEI của các lô hàng thiết bị mới được nhập trực tiếp về kho của chi nhánh, hệ thống tự động ghi nhận máy ở trạng thái `IN_STOCK` và tăng tồn kho tương ứng cho chi nhánh. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập với vai trò `BRANCH_MANAGER`.<br>- Sản phẩm và SKU cần nhập đã có trên hệ thống danh mục. |
| **Yêu cầu** | - Hệ thống tự động khóa cố định chi nhánh đích là chi nhánh mà Quản lý đang phụ trách (`authUser.branchId`).<br>- Hỗ trợ bóc tách danh sách mã máy từ dữ liệu copy từ file Excel của nhà cung cấp.<br>- Ngăn chặn triệt để mã trùng lặp bằng chỉ mục Unique Index trên trường `serialNumber`.<br>- Thực hiện đồng bộ số lượng tồn kho tự động bằng toán tử Atomic `$inc`. |
| **Kịch bản chính** | 1. Quản lý chi nhánh truy cập vào trang "Nhập Lô Serial / IMEI" (`/portal/admin/import-serials`).<br>2. Hệ thống tự động chọn sẵn chi nhánh công tác của Quản lý và không cho phép thay đổi sang chi nhánh khác.<br>3. Quản lý chọn Sản phẩm và biến thể SKU cần nhập mã máy.<br>4. Quản lý dán danh sách mã Serial/IMEI vào khung văn bản bóc tách.<br>5. Bộ phân tích cú pháp tự động chuẩn hóa chuỗi, loại trừ khoảng trắng và đếm tổng số mã hợp lệ.<br>6. Quản lý nhấn "Kiểm tra và Xem tóm tắt".<br>7. Hệ thống hiển thị modal báo cáo tóm tắt số lượng mã hợp lệ sẽ được tạo mới.<br>8. Quản lý nhấn "Xác nhận nhập kho".<br>9. Hệ thống gửi yêu cầu (`POST /api/v1/serials/import`), khởi tạo các Document Serial mới với trạng thái `IN_STOCK` gắn với `branchId` của chi nhánh, đồng thời cộng dồn số lượng tồn kho trong `branch_inventories`.<br>10. Hệ thống hiển thị thông báo nhập kho thành công. |
| **Kịch bản phụ** | 4.a. Dán nhầm danh sách có chứa ký tự đặc biệt hoặc mã không hợp lệ:<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Bộ parser cảnh báo danh sách chứa mã không hợp lệ và hiển thị danh sách lỗi cho quản lý kiểm tra.<br>9.a. Phát hiện mã Serial đã từng được nhập vào hệ thống trước đó:<br>&nbsp;&nbsp;&nbsp;&nbsp;9.a.1. Hệ thống báo lỗi trùng lặp mã Serial trong CSDL và hoàn tác đợt nhập để bảo đảm tính duy nhất của mã máy. |

---

### Bảng 5. Đặc tả Use Case "Tạo yêu cầu điều chuyển hàng đi chi nhánh khác"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM05** |
| **Tên Use Case** | Tạo yêu cầu điều chuyển hàng đi chi nhánh khác (Outbound Stock Transfer) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh lập phiếu xuất điều chuyển thiết bị từ chi nhánh mình sang một chi nhánh khác trong cùng chuỗi để hỗ trợ hàng hóa, quét hoặc chọn các mã Serial/IMEI cụ thể xuất đi, chuyển trạng thái Serial sang `TRANSIT` và tự động trừ kho chi nhánh gửi. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập với vai trò `BRANCH_MANAGER`.<br>- Kho chi nhánh hiện tại có sẵn hàng (`IN_STOCK`) cho mặt hàng cần chuyển. |
| **Yêu cầu** | - Chi nhánh gửi (`sourceBranchId`) được mặc định cố định là chi nhánh của Quản lý.<br>- Chi nhánh nhận (`destinationBranchId`) phải là một chi nhánh khác trong hệ thống.<br>- Bắt buộc phải chọn đích danh các mã Serial/IMEI xuất kho (nếu sản phẩm quản lý theo Serial).<br>- Trừ tồn kho chi nhánh gửi ngay khi tạo lệnh xuất kho để tránh bán lặp lại. |
| **Kịch bản chính** | 1. Quản lý chi nhánh truy cập trang "Điều Chuyển Kho" (`/portal/branch/transfers`), chọn tab "Phiếu xuất kho chuyển đi" (Outbound).<br>2. Hệ thống hiển thị danh sách các phiếu xuất điều chuyển đã tạo trước đó kèm trạng thái (`CHỜ VẬN CHUYỂN`, `ĐANG TRÊN ĐƯỜNG`, `ĐÃ HOÀN TẤT`).<br>3. Quản lý nhấn nút "Tạo phiếu điều chuyển mới".<br>4. Hệ thống mở modal tạo phiếu điều chuyển, trường chi nhánh gửi được cố định là chi nhánh hiện tại.<br>5. Quản lý chọn Chi nhánh nhận hàng từ danh mục dropdown các chi nhánh khác.<br>6. Quản lý chọn Sản phẩm, SKU và nhập số lượng cần chuyển.<br>7. Hệ thống truy vấn các mã Serial/IMEI đang `IN_STOCK` tại kho của chi nhánh và hiển thị danh sách lựa chọn.<br>8. Quản lý tích chọn các mã Serial thực tế sẽ đóng gói gửi đi và nhập ghi chú lý do.<br>9. Quản lý nhấn "Tạo phiếu điều chuyển".<br>10. Hệ thống tạo phiếu mới trong bảng `stock_transfers`, cập nhật trạng thái các Serial sang `TRANSIT`, và trừ số lượng tồn kho tương ứng của chi nhánh gửi qua toán tử Atomic `$inc: { quantity: -qty }`.<br>11. Hệ thống cấp mã phiếu chuyển (dạng `TRF-XXXXXXXX`) và làm mới danh sách. |
| **Kịch bản phụ** | 5.a. Chọn chi nhánh nhận trùng với chi nhánh hiện tại:<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.1. Hệ thống báo lỗi yêu cầu chọn chi nhánh nhận khác chi nhánh gửi.<br>8.a. Số lượng Serial được chọn không khớp với số lượng cần chuyển:<br>&nbsp;&nbsp;&nbsp;&nbsp;8.a.1. Hệ thống cảnh báo và yêu cầu tích chọn đủ số lượng mã máy. |

---

### Bảng 6. Đặc tả Use Case "Tiếp nhận và xác nhận nhập kho hàng điều chuyển đến"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM06** |
| **Tên Use Case** | Tiếp nhận và xác nhận nhập kho hàng điều chuyển đến (Inbound Stock Transfer Verification) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh theo dõi các kiện hàng đang được chuyển từ chi nhánh khác về cửa hàng mình; mở giao diện kiểm tra thực tế, quét đối soát từng mã Serial/IMEI trên kiện hàng và xác nhận nhập kho, tự động chuyển trạng thái Serial sang `IN_STOCK` tại chi nhánh đích và tăng tồn kho chi nhánh. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập với vai trò `BRANCH_MANAGER`.<br>- Có phiếu điều chuyển đang ở trạng thái trên đường vận chuyển hướng về chi nhánh mình. |
| **Yêu cầu** | - Chỉ được tiếp nhận các phiếu điều chuyển có `destinationBranchId` khớp với chi nhánh của Quản lý.<br>- Cơ chế đối soát nghiêm ngặt: Phải quét kiểm tra khớp toàn bộ danh sách mã Serial trước khi cho phép xác nhận nhập kho.<br>- Cập nhật tồn kho an toàn và chuyển trạng thái Serial sang `IN_STOCK` và cập nhật `branchId` mới cho Serial. |
| **Kịch bản chính** | 1. Quản lý chi nhánh truy cập trang "Điều Chuyển Kho", chuyển sang tab "Phiếu tiếp nhận chuyển đến" (Inbound).<br>2. Hệ thống lọc và hiển thị danh sách các phiếu điều chuyển đang gửi tới chi nhánh này.<br>3. Khi kiện hàng vật lý được giao tới cửa hàng, Quản lý tìm đến mã phiếu tương ứng và nhấn "Kiểm nhận & Nhập kho".<br>4. Hệ thống mở modal đối soát kiểm nhận hàng (`Receive Verification Modal`), hiển thị danh sách các mã Serial cần nhận và bộ đếm tiến độ (ví dụ: "Đã quét 0/5 máy").<br>5. Quản lý sử dụng máy quét mã vạch hoặc nhập tay từng mã Serial trên thân hộp máy vào ô quét.<br>6. Với mỗi mã quét hợp lệ nằm trong danh sách của phiếu, hệ thống phát âm thanh bíp thành công và đánh dấu tích xanh trên danh sách.<br>7. Sau khi toàn bộ các mã Serial đã được quét đối soát đầy đủ (đạt 100%), nút "Xác nhận nhập kho" được kích hoạt.<br>8. Quản lý nhấn "Xác nhận nhập kho".<br>9. Hệ thống gửi yêu cầu (`PATCH /api/v1/inventory/transfers/:id/receive`), chuyển trạng thái phiếu sang `COMPLETED`, chuyển các mã Serial sang `IN_STOCK` gắn với `branchId` của chi nhánh này, và cộng tăng số lượng tồn kho `quantity` tương ứng trong `branch_inventories`.<br>10. Hệ thống hiển thị thông báo hoàn tất tiếp nhận và cập nhật lại kho hàng. |
| **Kịch bản phụ** | 5.a. Quản lý quét một mã Serial không có trong danh sách của phiếu điều chuyển:<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.1. Hệ thống phát âm thanh cảnh báo lỗi và hiển thị thông báo "Mã Serial này không thuộc kiện hàng điều chuyển hiện tại".<br>5.b. Quản lý quét lặp lại một mã Serial đã được quét trước đó:<br>&nbsp;&nbsp;&nbsp;&nbsp;5.b.1. Hệ thống thông báo "Mã Serial này đã được kiểm đếm". |

---

### Bảng 7. Đặc tả Use Case "Tiếp nhận và xử lý đơn hàng B2C phân bổ về chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM07** |
| **Tên Use Case** | Tiếp nhận và xử lý đơn hàng B2C phân bổ về chi nhánh (B2C Order Fulfillment) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh tiếp nhận các đơn hàng mua sắm trực tuyến từ khách hàng B2C được hệ thống phân bổ về cửa hàng (đơn lấy tại cửa hàng Click & Collect hoặc đơn giao hỏa tốc 2 giờ); thực hiện lấy hàng trên kệ, quét gán mã Serial/IMEI, đóng gói và xác nhận sẵn sàng bàn giao cho khách hoặc shipper. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập với vai trò `BRANCH_MANAGER`.<br>- Có đơn hàng B2C được phân bổ về chi nhánh đang ở trạng thái `PROCESSING`. |
| **Yêu cầu** | - Đơn hàng phải thuộc đúng phạm vi quản lý của chi nhánh (`scopeBranch`).<br>- Giám sát thời gian cam kết dịch vụ (SLA Counter) để tránh giao hàng trễ hạn.<br>- Bắt buộc phải gán chính xác mã Serial/IMEI đang `IN_STOCK` tại kho cửa hàng cho từng máy trong đơn hàng trước khi xuất giao. |
| **Kịch bản chính** | 1. Quản lý chi nhánh mở danh sách đơn hàng cần điều phối xử lý của chi nhánh.<br>2. Hệ thống hiển thị các đơn hàng B2C được phân bổ về chi nhánh kèm đồng hồ đếm ngược thời gian SLA giao hàng.<br>3. Quản lý chọn một đơn hàng cần xử lý đóng gói và nhấn "Gán Serial & Đóng gói".<br>4. Hệ thống mở giao diện gán Serial cho đơn hàng (`OrderSerialAssignDrawer`).<br>5. Quản lý lấy thiết bị từ kệ kho và dùng máy quét quét mã Serial/IMEI của máy.<br>6. Hệ thống đối soát mã máy: kiểm tra mã có tồn tại, có đang ở trạng thái `IN_STOCK` tại chi nhánh này hay không.<br>7. Nếu hợp lệ, hệ thống gán mã Serial vào đơn hàng và cập nhật trạng thái Serial sang `RESERVED` / `SOLD`.<br>8. Quản lý nhấn "Hoàn tất đóng gói & Sẵn sàng giao".<br>9. Hệ thống cập nhật trạng thái đơn hàng sang `READY_FOR_SHIPPING` và gửi thông báo sẵn sàng bàn giao cho shipper hoặc thông báo khách hàng tới nhận máy. |
| **Kịch bản phụ** | 6.a. Quét mã Serial thuộc chi nhánh khác hoặc mã máy không ở trạng thái `IN_STOCK`:<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.1. Hệ thống báo lỗi mã máy không khả dụng tại chi nhánh và từ chối gán vào đơn. |

---

### Bảng 8. Đặc tả Use Case "Giám sát và tra cứu danh sách đơn hàng tại chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM08** |
| **Tên Use Case** | Giám sát và tra cứu danh sách đơn hàng tại chi nhánh (Branch Orders Monitoring) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh xem lịch sử toàn bộ các giao dịch phát sinh tại cửa hàng mình phụ trách (bao gồm các đơn bán hàng trực tiếp tại quầy Web POS và các đơn trực tuyến B2C); tra cứu chi tiết đơn hàng, doanh số, thông tin khách hàng và danh sách Serial đã xuất bán. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập với vai trò `BRANCH_MANAGER`. |
| **Yêu cầu** | - Middleware `scopeBranch` tự động giới hạn chỉ cho phép xem các đơn hàng có `branchId` trùng với chi nhánh của người quản lý.<br>- Hỗ trợ phân trang, tìm kiếm theo mã đơn hàng (`orderCode`) hoặc số điện thoại khách hàng. |
| **Kịch bản chính** | 1. Quản lý chi nhánh truy cập vào menu tra cứu đơn hàng chi nhánh.<br>2. Hệ thống gọi API (`GET /api/v1/orders/branch`) và tự động nạp danh sách đơn hàng thuộc chi nhánh phụ trách.<br>3. Bảng hiển thị thông tin tổng hợp: Mã đơn hàng, Thời gian tạo, Loại đơn hàng (Bán tại quầy `POS_STORE` hay Trực tuyến `B2C_ONLINE`), Tên khách hàng, Tổng tiền thanh toán, Phương thức thanh toán và Trạng thái đơn.<br>4. Quản lý chi nhánh có thể lọc theo trạng thái đơn hàng hoặc nhập mã đơn để tra cứu nhanh.<br>5. Quản lý nhấn vào một đơn hàng để xem thông tin chi tiết.<br>6. Hệ thống hiển thị chi tiết mặt hàng, số lượng, đơn giá, số tiền giảm giá, nhân viên thu ngân thực hiện ca bán và danh sách các mã Serial/IMEI kèm hạn bảo hành điện tử đã kích hoạt cho đơn hàng đó. |
| **Kịch bản phụ** | 4.a. Nhập mã đơn hàng không tồn tại hoặc thuộc chi nhánh khác:<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Hệ thống hiển thị kết quả rỗng và thông báo "Không tìm thấy đơn hàng nào phù hợp trong phạm vi chi nhánh". |

---

### Bảng 9. Đặc tả Use Case "Giám sát tiếp nhận và xử lý bảo hành tại chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM09** |
| **Tên Use Case** | Giám sát tiếp nhận và xử lý bảo hành tại chi nhánh (Warranty Tickets Oversight) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh theo dõi toàn bộ danh sách các biên bản tiếp nhận bảo hành thiết bị (phiếu RMA) do nhân viên quầy tiếp nhận tại cửa hàng; kiểm tra tình trạng lỗi của máy tiếp nhận và theo dõi tiến độ xử lý bảo hành cho khách hàng. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập với vai trò `BRANCH_MANAGER`. |
| **Yêu cầu** | - Dữ liệu được giới hạn trong chi nhánh phụ trách thông qua middleware `scopeBranch`.<br>- Hỗ trợ lọc theo trạng thái phiếu (`RECEIVED`, `PROCESSING`, `COMPLETED`, `RETURNED`) hoặc tìm kiếm theo số Serial/IMEI của thiết bị. |
| **Kịch bản chính** | 1. Quản lý chi nhánh mở mục quản lý dịch vụ bảo hành chi nhánh.<br>2. Hệ thống gọi API (`GET /api/v1/warranty`) nạp danh sách các phiếu bảo hành đã tiếp nhận tại chi nhánh.<br>3. Bảng hiển thị thông tin: Mã phiếu bảo hành (dạng `RMA-YYYYMMDD-XXXX`), Mã SerialNumber thiết bị, Tên thiết bị, Tên khách hàng, Ngày tiếp nhận, Mô tả lỗi kỹ thuật và Trạng thái xử lý.<br>4. Quản lý chi nhánh kiểm tra chi tiết các trường hợp bảo hành đặc biệt hoặc khiếu nại của khách hàng.<br>5. Quản lý có thể cập nhật tiến độ xử lý của phiếu bảo hành khi thiết bị đã được trung tâm bảo hành sửa xong hoặc sẵn sàng trả lại khách hàng. |
| **Kịch bản phụ** | 3.a. Không có phiếu bảo hành nào đang tồn đọng:<br>&nbsp;&nbsp;&nbsp;&nbsp;3.a.1. Hệ thống hiển thị trạng thái rỗng "Hiện không có phiếu bảo hành nào tại chi nhánh". |

---

### Bảng 10. Đặc tả Use Case "Bán hàng tại quầy Web POS (Hỗ trợ thu ngân)"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM10** |
| **Tên Use Case** | Bán hàng tại quầy Web POS (Hỗ trợ thu ngân giờ cao điểm) |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh trực tiếp truy cập vào màn hình Web POS bán hàng tại quầy khi cửa hàng bước vào khung giờ cao điểm hoặc thiếu nhân sự thu ngân; thực hiện quét mã vạch, gán Serial, thanh toán và in hóa đơn K80 tương tự như nhân viên bán hàng. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đã đăng nhập với vai trò `BRANCH_MANAGER`.<br>- Ca làm việc tại quầy sẵn sàng hoạt động. |
| **Yêu cầu** | - Quản lý chi nhánh có đầy đủ quyền thao tác trên màn hình Web POS (`RoleProtectedRoute` cho phép `STAFF`, `BRANCH_MANAGER`, `SUPER_ADMIN`).<br>- Giao diện chia 2 cột tối ưu thao tác nhanh (Split-Screen 60/40), hỗ trợ máy quét mã vạch và phím tắt thao tác nhanh. |
| **Kịch bản chính** | 1. Quản lý chi nhánh truy cập vào menu "Web POS Thu Ngân" (`/portal/pos`).<br>2. Hệ thống mở giao diện bán hàng chuyên dụng toàn màn hình.<br>3. Quản lý thực hiện tìm kiếm mặt hàng hoặc quét mã vạch sản phẩm để thêm vào giỏ.<br>4. Quản lý quét mã Serial/IMEI của thiết bị trên kệ và gán vào giỏ hàng.<br>5. Quản lý nhập thông tin khách hàng, số tiền khách đưa và chọn phương thức thanh toán.<br>6. Quản lý nhấn "Thanh toán & In hóa đơn".<br>7. Hệ thống tạo đơn hàng POS thành công, trừ tồn kho tức thì, kích hoạt bảo hành điện tử và hiển thị modal hóa đơn K80 để in. |
| **Kịch bản phụ** | 4.a. Quản lý thực hiện các thao tác xử lý lỗi tương tự như kịch bản của nhân viên quầy (chi tiết tại phân hệ Nhân viên quầy). |

---

### Bảng 11. Đặc tả Use Case "Đăng xuất khỏi cổng quản lý chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-BM11** |
| **Tên Use Case** | Đăng xuất khỏi cổng quản lý chi nhánh |
| **Tác nhân** | Quản lý chi nhánh (BRANCH_MANAGER) |
| **Mô tả chức năng** | Cho phép Quản lý chi nhánh kết thúc ca làm việc, hủy bỏ phiên làm việc trên trình duyệt, thu hồi token và đảm bảo an toàn thông tin dữ liệu của cửa hàng. |
| **Điều kiện tiên quyết** | - Quản lý chi nhánh đang đăng nhập trong hệ thống. |
| **Yêu cầu** | - Xóa bản ghi phiên trong collection `user_sessions`.<br>- Hủy bỏ HttpOnly Cookie và dọn sạch dữ liệu người dùng khỏi Redux Store. |
| **Kịch bản chính** | 1. Quản lý chi nhánh nhấn vào nút "Đăng xuất" ở góc dưới thanh điều hướng bên trái.<br>2. Hệ thống gửi yêu cầu `POST /api/v1/auth/logout`.<br>3. Máy chủ thu hồi Refresh Token và xóa cookie xác thực.<br>4. Ứng dụng xóa trạng thái phiên đăng nhập trong bộ nhớ.<br>5. Hệ thống điều hướng Quản lý chi nhánh quay trở lại trang đăng nhập (`/login`). |
| **Kịch bản phụ** | 2.a. Xảy ra lỗi mất kết nối mạng khi gửi request đăng xuất:<br>&nbsp;&nbsp;&nbsp;&nbsp;2.a.1. Ứng dụng client vẫn chủ động xóa toàn bộ token trong bộ nhớ nội bộ và điều hướng về trang đăng nhập để đảm bảo an toàn cục bộ. |
