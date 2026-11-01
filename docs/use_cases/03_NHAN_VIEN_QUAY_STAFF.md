# TÀI LIỆU ĐẶC TẢ USE CASE HỆ THỐNG MERN-TECH-ECOMMERCE
## PHÂN HỆ: NHÂN VIÊN QUẦY (COUNTER STAFF / THU NGÂN POS)

---

### Bảng 1. Đặc tả Use Case "Đăng nhập vào ca làm việc Web POS"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST01** |
| **Tên Use Case** | Đăng nhập vào ca làm việc Web POS |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy/thu ngân đăng nhập vào hệ thống khi bắt đầu ca làm việc tại cửa hàng, hệ thống xác thực danh tính, tự động liên kết với chi nhánh làm việc (`branchId` & `branch`) và chuyển hướng trực tiếp vào màn hình bán hàng Web POS tối ưu thao tác nhanh. |
| **Điều kiện tiên quyết** | - Hệ thống đang chạy bình thường.<br>- Tài khoản nhân viên đã được kích hoạt trong hệ thống với vai trò `role: STAFF`, trạng thái `isActive: true` và được gán mã chi nhánh làm việc cố định (`branchId`).<br>- Nhân viên biết tài khoản (Email/SĐT) và mật khẩu được cấp. |
| **Yêu cầu** | - Đăng nhập qua giao diện `/login`.<br>- Hỗ trợ đăng nhập nhanh bằng Email hoặc Số điện thoại.<br>- Kiểm tra bắt buộc `branchId` khi đăng nhập: từ chối đăng nhập (`403 BRANCH_NOT_ASSIGNED`) nếu tài khoản `STAFF` chưa được gán chi nhánh.<br>- Phiên làm việc có thời hạn tối đa 8 giờ (tương ứng với một ca làm việc tiêu chuẩn của nhân viên).<br>- Giới hạn phạm vi dữ liệu qua `scopeBranch` chỉ thuộc chi nhánh đang công tác. |
| **Kịch bản chính** | 1. Nhân viên quầy mở trình duyệt trên máy POS thu ngân và truy cập `/login`.<br>2. Hệ thống hiển thị biểu mẫu đăng nhập.<br>3. Nhân viên nhập Email hoặc Số điện thoại và Mật khẩu ca làm việc.<br>4. Nhân viên nhấn nút "Đăng nhập" (hoặc nhấn phím `Enter`).<br>5. Hệ thống gửi yêu cầu xác thực (`POST /api/v1/auth/login`).<br>6. Máy chủ kiểm tra mật khẩu qua `bcryptjs`, trạng thái `isActive: true` và xác nhận tài khoản đã có `branchId`.<br>7. Hệ thống xác nhận vai trò `STAFF`, lưu phiên làm việc 8 giờ, cấp JWT Token, chuẩn hóa thông tin chi nhánh (`authUser.branch`) và tự động chuyển hướng thẳng đến màn hình bán hàng Web POS (`/portal/pos`).<br>8. Màn hình POS mở ra ở trạng thái sẵn sàng, thanh tiêu đề `PosHeader` hiển thị tên chi nhánh & tên thu ngân, đồng thời tự động lấy nét (`autoFocus`) vào ô quét mã vạch Barcode (`PosBarcodeBar`). |
| **Kịch bản phụ** | 3.a. Nhân viên chọn hiển thị mật khẩu để kiểm tra ký tự gõ phím.<br>6.a. Nhập sai mật khẩu hoặc tài khoản không tồn tại:<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.1. Hệ thống báo lỗi "Thông tin đăng nhập không chính xác." (`401 INVALID_CREDENTIALS`).<br>6.b. Tài khoản nhân viên bị khóa (`isActive: false`):<br>&nbsp;&nbsp;&nbsp;&nbsp;6.b.1. Hệ thống từ chối truy cập (`403 ACCOUNT_LOCKED`) và thông báo: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên.".<br>6.c. Tài khoản nhân viên chưa được gán chi nhánh (`branchId` rỗng):<br>&nbsp;&nbsp;&nbsp;&nbsp;6.c.1. Hệ thống từ chối truy cập (`403 BRANCH_NOT_ASSIGNED`) và thông báo liên hệ Super Admin để gán chi nhánh. |

---

### Bảng 2. Đặc tả Use Case "Tra cứu danh mục và tìm kiếm sản phẩm tại quầy"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST02** |
| **Tên Use Case** | Tra cứu danh mục và tìm kiếm sản phẩm tại quầy bán hàng (POS Product Catalog) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy tìm kiếm nhanh sản phẩm trên màn hình POS thông qua thanh tìm kiếm từ khóa (tên sản phẩm, mã SKU, hoặc mã Serial) hoặc chọn lọc theo thanh tab danh mục nhanh (Tất cả, Điện thoại, Laptop, Phụ kiện, Máy tính bảng) dựa trên dữ liệu tồn kho thực tế của chi nhánh. |
| **Điều kiện tiên quyết** | - Nhân viên quầy đã đăng nhập vào màn hình Web POS (`/portal/pos`). |
| **Yêu cầu** | - Danh mục sản phẩm trên POS tự động đồng bộ trực tiếp từ tồn kho thực tế của chi nhánh (`GET /api/v1/inventory/branch/:branchId`), hiển thị chính xác số lượng tồn (`Kho: X`) và danh sách Serial `IN_STOCK` khả dụng của từng biến thể SKU (`skuId`).<br>- Hiển thị dạng lưới thẻ sản phẩm trực quan: Ảnh đại diện, Tên sản phẩm kèm cấu hình biến thể, Mã SKU, Giá bán lẻ, số lượng tồn kho và nhãn nhận biết hàng có quản lý Serial (`SERIAL` / `STANDARD`). |
| **Kịch bản chính** | 1. Nhân viên quầy quan sát cột danh mục sản phẩm (chiếm 60% diện tích bên trái màn hình POS).<br>2. **Tìm theo từ khóa:**<br>&nbsp;&nbsp;&nbsp;&nbsp;2.1. Nhân viên gõ tên sản phẩm hoặc mã SKU vào ô tìm kiếm nhanh (`PosBarcodeBar`).<br>&nbsp;&nbsp;&nbsp;&nbsp;2.2. Hệ thống lọc danh sách các biến thể SKU đang có tại kho chi nhánh và hiển thị ngay trên lưới.<br>3. **Lọc theo nhóm danh mục:**<br>&nbsp;&nbsp;&nbsp;&nbsp;3.1. Nhân viên bấm vào tab danh mục (ví dụ chọn tab "Laptop" hoặc "Phụ kiện").<br>&nbsp;&nbsp;&nbsp;&nbsp;3.2. Hệ thống lọc danh mục sản phẩm thuộc nhóm ngành hàng đã chọn.<br>4. Nhân viên bấm vào thẻ sản phẩm còn tồn kho (`stock > 0`) trên lưới để đưa sản phẩm vào giỏ hàng POS. |
| **Kịch bản phụ** | 2.a. Không tìm thấy sản phẩm nào khớp với từ khóa:<br>&nbsp;&nbsp;&nbsp;&nbsp;2.a.1. Hệ thống hiển thị khung thông báo "Không tìm thấy sản phẩm phù hợp".<br>4.a. Sản phẩm trên lưới đã hết hàng tại chi nhánh (`stock <= 0`):<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Thẻ sản phẩm hiển thị nhãn đỏ `Kho: 0` và bị khóa thao tác chọn để ngăn bán vượt tồn kho. |

---

### Bảng 3. Đặc tả Use Case "Quét mã vạch Barcode sản phẩm bằng máy quét phần cứng"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST03** |
| **Tên Use Case** | Quét mã vạch Barcode sản phẩm bằng máy quét (Barcode Hardware Scanner) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy sử dụng máy quét mã vạch chuyên dụng cầm tay (kết nối USB/Bluetooth HID) quét trực tiếp mã Serial/IMEI hoặc mã SKU trên bao bì sản phẩm; hệ thống tự động nhận diện qua Keyboard Event Listener (`useBarcodeScanner`) và thêm sản phẩm (kèm gán luôn Serial nếu mã quét là Serial) vào giỏ hàng mà không cần click chuột. |
| **Điều kiện tiên quyết** | - Nhân viên quầy đang ở màn hình Web POS (`/portal/pos`).<br>- Máy quét mã vạch đã kết nối với máy tính POS. |
| **Yêu cầu** | - Cơ chế lắng nghe sự kiện phím toàn cục qua custom hook `useBarcodeScanner`: Bắt chuỗi ký tự kết thúc bằng phím `Enter` trong khoảng thời gian ngắn, phân biệt chính xác giữa người gõ phím thông thường và máy quét quang học.<br>- Hỗ trợ quét kép (`posService.scanBarcode`): Ưu tiên kiểm tra mã Serial/IMEI qua `GET /api/v1/serials/scan/:barcode`; nếu không phải Serial (`404`), tự động đối chiếu mã SKU trong danh mục tồn kho của chi nhánh.<br>- Tích hợp phản hồi âm thanh (`usePosAudio`): Phát tiếng bíp thành công (`playSuccessBeep`) khi quét hợp lệ và tiếng bíp cảnh báo (`playErrorBeep`) khi quét sai/không tìm thấy. |
| **Kịch bản chính** | 1. Khách hàng mang sản phẩm đến quầy thu ngân.<br>2. Nhân viên quầy cầm máy quét mã vạch hướng tia quét vào mã vạch in trên vỏ hộp sản phẩm.<br>3. Máy quét đọc mã và gửi chuỗi ký tự kèm phím `Enter` lên trình duyệt.<br>4. Hook `useBarcodeScanner` hoặc ô quét `PosBarcodeBar` bắt được sự kiện và gọi `posService.scanBarcode(barcode, branchId)`.<br>5. Nếu mã quét là Serial/IMEI hợp lệ tại chi nhánh, hệ thống tự động thêm sản phẩm vào giỏ và gán luôn mã Serial đó vào dòng sản phẩm; nếu mã quét là mã SKU, hệ thống thêm sản phẩm vào giỏ hàng.<br>6. Hệ thống phát âm thanh "Beep" thành công và hiển thị thông báo xanh trên màn hình.<br>7. Ô quét mã vạch tự động làm sạch và duy trì trạng thái lấy nét sẵn sàng cho lần quét tiếp theo. |
| **Kịch bản phụ** | 5.a. Mã vạch quét vào không tồn tại hoặc Serial thuộc chi nhánh khác / đã bán:<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.1. Hệ thống phát âm thanh bíp lỗi trầm (`playErrorBeep`).<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.2. Hiển thị thông báo màu đỏ nêu rõ nguyên nhân từ chối. |

---

### Bảng 4. Đặc tả Use Case "Quét và gán mã Serial / IMEI cho thiết bị bán lẻ"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST04** |
| **Tên Use Case** | Quét và gán mã Serial / IMEI cho thiết bị bán lẻ (POS Serial Assignment) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Đối với các mặt hàng công nghệ giá trị cao có quản lý định danh Serial (`hasSerial: true`), hệ thống bắt buộc nhân viên quầy phải quét hoặc chọn mã Serial/IMEI thực tế của đúng thân máy lấy trên kệ; hệ thống kiểm tra 3 lớp (Tồn tại, Trạng thái `IN_STOCK`, Đúng chi nhánh & Đúng SKU) ngay trong modal trước khi gán vào dòng hóa đơn. |
| **Điều kiện tiên quyết** | - Nhân viên đang ở màn hình Web POS.<br>- Giỏ hàng có ít nhất một sản phẩm yêu cầu quản lý Serial/IMEI. |
| **Yêu cầu** | - Kiểm tra 3 tầng bảo mật nghiệp vụ ngay khi quét/thêm mã trong `SerialAssignmentModal` (Endpoint `GET /api/v1/serials/scan/:serialNumber`):<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Lớp 1: Mã Serial/IMEI có tồn tại trong CSDL không (`SERIAL_NOT_FOUND`)?<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Lớp 2: Thiết bị có đang ở trạng thái khả dụng bán `status: 'IN_STOCK'` không (`INVALID_SERIAL_STATUS`)?<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Lớp 3: Thiết bị có thuộc sở hữu của chính chi nhánh hiện tại không (`CROSS_BRANCH_ACCESS_DENIED`) và có đúng biến thể SKU (`productSkuId`) của dòng giỏ hàng đang chọn không?<br>- Quy tắc bắt buộc: Số lượng mã Serial gán phải bằng 100% số lượng mua (`SERIAL_COUNT_MISMATCH`). |
| **Kịch bản chính** | 1. Khi nhân viên thêm sản phẩm có quản lý Serial vào giỏ hàng từ lưới danh mục, dòng mặt hàng hiển thị nút cảnh báo màu cam "Gán Serial (0/X)".<br>2. Nhân viên quầy nhấn vào nút "Gán Serial" tại dòng sản phẩm đó.<br>3. Hệ thống mở cửa sổ gán Serial (`SerialAssignmentModal`), đồng bộ danh sách Serial đã gán của dòng hàng và hiển thị các mã Serial `IN_STOCK` khả dụng tại chi nhánh để gợi ý.<br>4. Nhân viên cầm hộp máy thực tế, dùng máy quét quét mã Serial/IMEI in trên tem hộp (hoặc chọn từ danh sách gợi ý của kho chi nhánh).<br>5. Hệ thống gọi `GET /api/v1/serials/scan/:serialNumber` để kiểm tra xác thực 3 lớp và đối chiếu `productSkuId`.<br>6. Khi hợp lệ, hệ thống phát âm thanh bíp thành công (`playSuccessBeep`), đưa mã Serial vào danh sách đã gán và cập nhật bộ đếm tiến độ (`X / X SERIAL`).<br>7. Nhân viên nhấn nút "Lưu danh sách Serial".<br>8. Hệ thống đóng modal, chuyển trạng thái dòng sản phẩm trong giỏ hàng sang màu xanh lá kèm các chip mã Serial đã gắn. |
| **Kịch bản phụ** | 5.a. Quét mã Serial của thiết bị thuộc chi nhánh khác:<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.1. Hệ thống báo lỗi `CROSS_BRANCH_ACCESS_DENIED` (HTTP 403) và phát âm báo lỗi: "Thiết bị thuộc chi nhánh khác, không được phép thao tác tại quầy này.".<br>5.b. Quét mã Serial của máy đã bán (`SOLD`) hoặc đang bảo hành (`WARRANTY`):<br>&nbsp;&nbsp;&nbsp;&nbsp;5.b.1. Hệ thống phát âm báo lỗi và hiển thị trạng thái hiện tại của thiết bị.<br>5.c. Quét mã Serial hợp lệ nhưng thuộc một sản phẩm/SKU khác với dòng hàng đang mở modal:<br>&nbsp;&nbsp;&nbsp;&nbsp;5.c.1. Hệ thống phát âm báo lỗi và cảnh báo mã Serial không khớp với biến thể sản phẩm đang chọn. |

---

### Bảng 5. Đặc tả Use Case "Quản lý giỏ hàng bán hàng tại quầy"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST05** |
| **Tên Use Case** | Quản lý giỏ hàng bán hàng tại quầy (POS Cart Management) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy điều chỉnh các mặt hàng trong giỏ bán hàng: tăng giảm số lượng mua, xóa từng mặt hàng khỏi giỏ, xóa từng mã Serial đã gán, hoặc làm sạch toàn bộ giỏ hàng để tiếp đón khách hàng tiếp theo; hệ thống tự động tính toán lại tạm tính, chiết khấu, thuế và tổng tiền. |
| **Điều kiện tiên quyết** | - Nhân viên quầy đang ở màn hình Web POS. |
| **Yêu cầu** | - Thao tác phản hồi tức thì thông qua Redux Store cục bộ (`posCartSlice`).<br>- Nếu giảm số lượng sản phẩm có quản lý Serial xuống thấp hơn số lượng Serial đã gán, hệ thống tự động cắt giảm mã Serial thừa tương ứng (`item.serialsAssigned.slice(0, quantity)`). |
| **Kịch bản chính** | 1. Nhân viên quầy quan sát bảng giỏ hàng (`PosCartTable`) tại cột bên phải màn hình.<br>2. **Tăng/Giảm số lượng:**<br>&nbsp;&nbsp;&nbsp;&nbsp;2.1. Nhân viên nhấn nút cộng (`+`), trừ (`-`) hoặc nhập trực tiếp số lượng tại dòng sản phẩm.<br>&nbsp;&nbsp;&nbsp;&nbsp;2.2. Hệ thống cập nhật số lượng và tự động nhân đơn giá tính ra thành tiền mới.<br>3. **Xóa một mặt hàng:**<br>&nbsp;&nbsp;&nbsp;&nbsp;3.1. Khách hàng đổi ý không mua một món đồ, nhân viên nhấn biểu tượng thùng rác tại dòng đó.<br>&nbsp;&nbsp;&nbsp;&nbsp;3.2. Hệ thống xóa mặt hàng cùng các mã Serial liên quan ra khỏi giỏ và tính toán lại tổng tiền.<br>4. **Xóa toàn bộ giỏ hàng:**<br>&nbsp;&nbsp;&nbsp;&nbsp;4.1. Khách hàng hủy giao dịch, nhân viên nhấn nút "Xóa giỏ".<br>&nbsp;&nbsp;&nbsp;&nbsp;4.2. Hệ thống làm sạch toàn bộ giỏ hàng và đưa tổng tiền về 0đ. |
| **Kịch bản phụ** | 2.a. Nhân viên giảm số lượng của sản phẩm có gắn Serial xuống thấp hơn số Serial đã quét:<br>&nbsp;&nbsp;&nbsp;&nbsp;2.a.1. Hệ thống tự động loại bỏ bớt mã Serial cuối cùng để đảm bảo số lượng Serial không vượt quá số lượng mua. |

---

### Bảng 6. Đặc tả Use Case "Nhập thông tin khách hàng và áp dụng chiết khấu tại quầy"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST06** |
| **Tên Use Case** | Nhập thông tin khách hàng và áp dụng chiết khấu tại quầy (Customer & Discount Handling) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy nhập thông tin người mua (Họ tên, Số điện thoại) để lưu trữ thông tin kích hoạt bảo hành điện tử; hỗ trợ bán hàng cho khách vãng lai không bắt buộc cung cấp SĐT; cho phép áp dụng mức giảm giá/chiết khấu trực tiếp trên đơn hàng. |
| **Điều kiện tiên quyết** | - Nhân viên quầy đang ở màn hình Web POS.<br>- Giỏ hàng có sản phẩm. |
| **Yêu cầu** | - Hỗ trợ cả khách hàng cung cấp thông tin và khách hàng vãng lai (nếu để trống SĐT, hệ thống lưu `phone: ''` và không gửi SĐT giả; nếu có nhập SĐT thì kiểm tra đúng định dạng di động Việt Nam `/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/`).<br>- Số tiền giảm giá chiết khấu (`discount`) tự động được giới hạn tối đa bằng tổng tiền hàng (`subtotal`). |
| **Kịch bản chính** | 1. Tại bảng thanh toán POS (`PosCheckoutPanel`), nhân viên nhấn nút "Đổi" (hoặc phím tắt `F4`) để mở hộp thoại thông tin khách hàng.<br>2. Nhân viên nhập Số điện thoại và Họ tên của khách hàng rồi nhấn "Xác nhận".<br>3. Hệ thống kiểm tra định dạng SĐT hợp lệ và hiển thị thông tin khách hàng trên bảng thanh toán.<br>4. **Áp dụng chiết khấu giảm giá (nếu có):**<br>&nbsp;&nbsp;&nbsp;&nbsp;4.1. Nhân viên nhấn phím `F8` hoặc nhập số tiền giảm giá trực tiếp vào ô "Chiết khấu / Giảm giá".<br>&nbsp;&nbsp;&nbsp;&nbsp;4.2. Hệ thống trừ số tiền giảm giá khỏi tạm tính, tính lại thuế GTGT (10%) và hiển thị "Khách phải thanh toán". |
| **Kịch bản phụ** | 1.a. Khách hàng là khách vãng lai từ chối để lại số điện thoại:<br>&nbsp;&nbsp;&nbsp;&nbsp;1.a.1. Nhân viên để trống ô Số điện thoại.<br>&nbsp;&nbsp;&nbsp;&nbsp;1.a.2. Hệ thống tự động ghi nhận là "Khách vãng lai (Không lưu SĐT)" và cho phép tiếp tục thanh toán bình thường.<br>4.a. Nhân viên nhập số tiền giảm giá lớn hơn tổng giá trị tiền hàng (`subtotal`):<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Hệ thống tự động giới hạn mức giảm giá tối đa bằng đúng `subtotal`. |

---

### Bảng 7. Đặc tả Use Case "Xử lý thanh toán đơn hàng tại quầy POS"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST07** |
| **Tên Use Case** | Xử lý thanh toán đơn hàng tại quầy POS (POS Order Checkout) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy xử lý thu tiền đơn hàng theo hai phương thức: Tiền mặt (`CASH`, tự động tính tiền thừa trả lại khách) hoặc Quét mã Chuyển khoản QR (`VNPAY`); hệ thống gửi yêu cầu thanh toán nguyên tử (Atomic POS Checkout), tự động trừ kho tức thời, chuyển Serial sang `SOLD` và kích hoạt gói bảo hành điện tử 12 tháng. |
| **Điều kiện tiên quyết** | - Nhân viên đang ở màn hình Web POS.<br>- Giỏ hàng có sản phẩm hợp lệ.<br>- Tất cả các sản phẩm yêu cầu Serial đã được gán đủ 100% mã máy hợp lệ (`missingSerialCount === 0`). |
| **Yêu cầu** | - Cơ chế Zero Overselling: Thực hiện trừ kho trực tiếp qua toán tử Atomic `$inc` của MongoDB kèm điều kiện `quantity: { $gte: item.quantity }`.<br>- Máy trạng thái Serial: Chuyển toàn bộ các mã Serial được gán từ `IN_STOCK` sang `SOLD`, gắn `orderId`, `soldAt` là thời điểm hiện tại và tự động cộng thêm 12 tháng hạn bảo hành `warrantyEndDate`.<br>- Tạo bản ghi đơn hàng trong bảng `orders` với `orderType: 'POS_STORE'`, `orderStatus: 'COMPLETED'`, `paymentStatus: 'PAID'` và lưu `staffId` là nhân viên thu ngân hiện tại. |
| **Kịch bản chính** | 1. Nhân viên kiểm tra lại các mặt hàng trong giỏ, đảm bảo không còn dòng sản phẩm nào báo thiếu Serial.<br>2. Nhân viên chọn hình thức thanh toán:<br>&nbsp;&nbsp;&nbsp;&nbsp;+ **Phương thức 1: Tiền mặt (`CASH`):** Nhân viên nhập số tiền mặt khách đưa vào ô "Khách đưa" (hoặc bấm các nút mệnh giá nhanh / "Vừa đủ"); hệ thống tự động tính và hiển thị "Tiền thối lại".<br>&nbsp;&nbsp;&nbsp;&nbsp;+ **Phương thức 2: Chuyển khoản QR (`VNPAY`):** Hệ thống hiển thị mã VNPAY QR để khách quét thanh toán.<br>3. Nhân viên nhấn nút "THANH TOÁN & IN HÓA ĐƠN" (hoặc nhấn phím tắt `F9`).<br>4. Hệ thống chuẩn hóa payload qua adapter `toPosCheckoutPayload` và gửi lên máy chủ (`POST /api/v1/orders/pos/checkout`).<br>5. Máy chủ thực hiện giao dịch nguyên tử:<br>&nbsp;&nbsp;&nbsp;&nbsp;5.1. Kiểm tra lại toàn bộ Serial và trừ tồn kho tại chi nhánh qua MongoDB Atomic Operation.<br>&nbsp;&nbsp;&nbsp;&nbsp;5.2. Tạo bản ghi đơn hàng mới có mã định danh duy nhất (dạng `ORD-YYYYMMDD-XXXX`).<br>&nbsp;&nbsp;&nbsp;&nbsp;5.3. Chuyển trạng thái các Serial sang `SOLD` và kích hoạt e-Warranty.<br>6. Máy chủ phản hồi HTTP 201 Created cùng dữ liệu đơn hàng hoàn tất.<br>7. Hệ thống phát âm thanh bíp thành công, tự động tải lại danh mục tồn kho POS và mở modal hóa đơn nhiệt K80 (`InvoiceK80Modal`). |
| **Kịch bản phụ** | 1.a. Vẫn còn sản phẩm có quản lý Serial nhưng chưa được gán đủ mã máy:<br>&nbsp;&nbsp;&nbsp;&nbsp;1.a.1. Hệ thống khóa nút thanh toán và hiển thị cảnh báo số lượng sản phẩm còn thiếu Serial.<br>2.a. Khi chọn tiền mặt, nhân viên nhập số tiền khách đưa nhỏ hơn tổng số tiền cần thanh toán (`customerPaid > 0 && customerPaid < total`):<br>&nbsp;&nbsp;&nbsp;&nbsp;2.a.1. Hệ thống hiển thị số tiền còn thiếu màu đỏ, cảnh báo "Số tiền khách đưa chưa đủ để thanh toán đơn hàng" và khóa nút thanh toán.<br>5.a. Xảy ra tranh chấp kho (sản phẩm vừa bị đơn khác trừ hết hàng cùng thời điểm):<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.1. Toán tử Atomic phát hiện tồn kho không đủ, hoàn tác các mặt hàng trước đó và phản hồi lỗi `PRODUCT_OUT_OF_STOCK` (HTTP 409). |

---

### Bảng 8. Đặc tả Use Case "In hóa đơn nhiệt K80 cho khách hàng"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST08** |
| **Tên Use Case** | In hóa đơn nhiệt K80 cho khách hàng (K80 Receipt Printing) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy xem trước bản mẫu hóa đơn bán lẻ chuẩn khổ giấy in nhiệt K80 (80mm) và gửi lệnh in ra máy in hóa đơn quầy thu ngân; trên hóa đơn in rõ tên & địa chỉ chi nhánh thực tế, họ tên nhân viên thu ngân, danh sách sản phẩm, các mã Serial/IMEI tương ứng kèm thời hạn bảo hành điện tử 12 tháng. |
| **Điều kiện tiên quyết** | - Đơn hàng bán tại quầy POS vừa được tạo thành công.<br>- Máy in nhiệt K80 đã kết nối với máy tính thu ngân. |
| **Yêu cầu** | - Định dạng giao diện hóa đơn tối ưu vừa khít khổ in 80mm (`max-w-[80mm]`).<br>- Tự động lấy thông tin chi nhánh (`authUser.branch.name`, `authUser.branch.address`) và họ tên nhân viên thu ngân (`authUser.fullName`) đang đăng nhập để hiển thị chính xác trên hóa đơn. |
| **Kịch bản chính** | 1. Ngay khi thanh toán thành công, hệ thống tự động mở cửa sổ xem trước hóa đơn in nhiệt (`InvoiceK80Modal`).<br>2. Nhân viên quầy đối soát nhanh thông tin đơn hàng, danh sách Serial/IMEI và tổng tiền trên mẫu hóa đơn.<br>3. Nhân viên nhấn nút "In K80" (`window.print()`).<br>4. Trình duyệt gọi lệnh in của hệ điều hành và gửi dữ liệu tới máy in nhiệt K80 tại quầy.<br>5. Nhân viên nhấn nút "Tạo đơn hàng mới [Esc]" để đóng modal, tự động làm sạch giỏ hàng (`clearCart()`) và tiếp tục phục vụ khách hàng tiếp theo. |
| **Kịch bản phụ** | 3.a. Khách hàng không lấy hóa đơn giấy:<br>&nbsp;&nbsp;&nbsp;&nbsp;3.a.1. Nhân viên nhấn "Tạo đơn hàng mới [Esc]" hoặc nút đóng mà không cần bấm lệnh in, hóa đơn điện tử vẫn được lưu trữ đầy đủ trong mục "Đơn Hàng Chi Nhánh" (`/portal/branch/orders`). |

---

### Bảng 9. Đặc tả Use Case "Tra cứu tồn kho chi nhánh phục vụ tư vấn bán hàng"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST09** |
| **Tên Use Case** | Tra cứu tồn kho chi nhánh phục vụ tư vấn (Branch Stock Inquiry) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy nhanh chóng tra cứu số lượng tồn kho khả dụng và vị trí kệ của các mặt hàng trong kho cửa hàng mình; đồng thời hỗ trợ tra cứu tồn kho liên chi nhánh (`Tồn chuỗi`) khi cửa hàng hiện tại hết hàng để hướng dẫn khách qua chi nhánh lân cận hoặc báo Quản lý lập lệnh điều chuyển. |
| **Điều kiện tiên quyết** | - Nhân viên quầy đã đăng nhập vào hệ thống. |
| **Yêu cầu** | - Dữ liệu tồn kho nội bộ tự động giới hạn tại chi nhánh làm việc của nhân viên (`scopeBranch`), ẩn nút "Điều chỉnh tồn" đối với vai trò `STAFF`.<br>- Tích hợp nút **"Tồn chuỗi"** trên từng dòng SKU (`BranchStockTable`) gọi API `GET /api/v1/inventory/sku/:productSkuId` để kiểm tra danh sách các chi nhánh đang còn hàng trên toàn hệ thống. |
| **Kịch bản chính** | 1. Khách hàng tại quầy hỏi về một dòng máy cụ thể.<br>2. Nhân viên quầy truy cập mục "Kho Chi Nhánh" (`/portal/inventory`) hoặc tra cứu trực tiếp trên màn hình POS.<br>3. Nhân viên gõ tên máy hoặc mã SKU cần hỏi.<br>4. Hệ thống hiển thị số lượng tồn kho thực tế, vị trí quầy kệ và danh sách mã Serial (`Xem Serials`) của mặt hàng đó tại kho chi nhánh.<br>5. Nhân viên thông báo số lượng sẵn có cho khách hàng hoặc vào kho lấy sản phẩm ra tư vấn. |
| **Kịch bản phụ** | 4.a. Sản phẩm đã hết hàng hoặc sắp hết tại chi nhánh hiện tại:<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Nhân viên nhấn nút **"Tồn chuỗi"** tại dòng sản phẩm đó.<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.2. Hệ thống mở hộp thoại "Tra Cứu Tồn Kho Liên Chi Nhánh", hiển thị tên, địa chỉ, số điện thoại và số lượng tồn khả dụng của tất cả các chi nhánh khác đang còn hàng để nhân viên tư vấn cho khách. |

---

### Bảng 10. Đặc tả Use Case "Tra cứu bảo hành điện tử bằng Serial / IMEI tại quầy"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST10** |
| **Tên Use Case** | Tra cứu bảo hành điện tử bằng Serial / IMEI (e-Warranty Lookup) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy tra cứu tính hợp lệ và thời hạn bảo hành điện tử của thiết bị do khách hàng mang đến quầy dịch vụ; hệ thống xác minh mã máy có đúng do chuỗi bán ra không, chi nhánh xuất bán, thông tin khách hàng mua ban đầu, ngày kích hoạt bán và số ngày bảo hành còn lại. |
| **Điều kiện tiên quyết** | - Nhân viên quầy có mặt tại trang Tiếp nhận bảo hành (`/portal/warranty-reception`). |
| **Yêu cầu** | - Gọi API kiểm tra bảo hành (`GET /api/v1/serials/verify/:serialNumber`).<br>- Kiểm tra chính xác trạng thái máy (phải là máy đã bán `SOLD` hoặc đang bảo hành `WARRANTY`).<br>- Tính toán tự động cờ `isExpired` và số ngày bảo hành còn lại (`daysRemaining`). |
| **Kịch bản chính** | 1. Khách hàng mang thiết bị gặp sự cố đến quầy hỗ trợ kỹ thuật TechOne Care.<br>2. Nhân viên quầy mở trang "Tiếp Nhận Bảo Hành" (`/portal/warranty-reception`).<br>3. Nhân viên dùng máy quét quét mã Serial/IMEI trên thân máy (hoặc nhập tay mã máy vào ô tra cứu `RmaScanLookup`).<br>4. Nhân viên nhấn nút "Tra cứu".<br>5. Hệ thống gửi yêu cầu kiểm tra lên máy chủ (`GET /api/v1/serials/verify/:serialNumber`).<br>6. Máy chủ tìm kiếm trong bảng `serials` (populate `productId`, `branchId`, `orderId`) và trả về kết quả:<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Tên thiết bị, Hình ảnh, Mã SKU, Chi nhánh mua hàng.<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Thông tin chủ sở hữu thiết bị từ đơn hàng gốc (Họ tên, SĐT, Địa chỉ).<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Ngày mua máy (`soldAt`) và ngày hết hạn bảo hành (`warrantyEndDate`).<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Huy hiệu trạng thái đủ điều kiện bảo hành và số ngày còn lại.<br>7. Hệ thống phát âm thanh bíp thành công, hiển thị thẻ kết quả thẩm định và tự động điền thông tin khách hàng sang biểu mẫu tiếp nhận bên phải. |
| **Kịch bản phụ** | 6.a. Mã Serial không tồn tại trong hệ thống:<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.1. Hệ thống phát âm thanh bíp lỗi và hiển thị cảnh báo "Không tìm thấy mã Serial/IMEI trong hệ thống.".<br>6.b. Thiết bị chưa từng được xuất bán (vẫn ở trạng thái `IN_STOCK`):<br>&nbsp;&nbsp;&nbsp;&nbsp;6.b.1. Hệ thống cảnh báo: "THIẾT BỊ CHƯA XUẤT BÁN (Trạng thái: IN_STOCK)". |

---

### Bảng 11. Đặc tả Use Case "Lập biên bản tiếp nhận thiết bị bảo hành tại quầy"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST11** |
| **Tên Use Case** | Lập biên bản tiếp nhận thiết bị bảo hành tại quầy (RMA Ticket Creation) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Sau khi xác thực thiết bị hợp lệ, cho phép Nhân viên quầy nhập biên bản ghi nhận tình trạng hỏng hóc thực tế của máy (mô tả lỗi, tình trạng ngoại quan, phụ kiện đi kèm, ngày hẹn trả), cập nhật thông tin liên hệ khách hàng và tạo phiếu bảo hành RMA chính thức; hệ thống tự động sinh mã phiếu, chuyển Serial sang `WARRANTY` và in biên nhận hẹn trả máy cho khách. |
| **Điều kiện tiên quyết** | - Nhân viên đã tra cứu Serial thành công tại Use Case UC-ST10 và thiết bị đã xuất bán (`SOLD` hoặc `WARRANTY`). |
| **Yêu cầu** | - Mã phiếu bảo hành được sinh tự động theo quy chuẩn duy nhất: `RMA-YYYYMMDD-XXXX`.<br>- Tự động chuyển đổi trạng thái của mã Serial trong CSDL từ `SOLD` sang `WARRANTY`.<br>- Lưu thông tin chi nhánh tiếp nhận chính là chi nhánh hiện tại của nhân viên (`scopeBranch`).<br>- Hỗ trợ in mẫu phiếu tiếp nhận dịch vụ kỹ thuật (`RmaPrintReceiptModal`) và cập nhật trạng thái phiếu trên tab "Danh Sách Phiếu Bảo Hành RMA". |
| **Kịch bản chính** | 1. Sau khi kết quả thẩm định E-Warranty hiển thị, hệ thống tự động nạp thông tin máy và khách hàng sang biểu mẫu "Biên bản tiếp nhận kỹ thuật & sửa chữa" (`RmaTicketForm`).<br>2. Nhân viên quầy kiểm tra hoặc bổ sung Họ tên và Số điện thoại liên hệ của khách hàng gửi máy.<br>3. Nhân viên nhập mô tả chi tiết lỗi theo phản ánh của khách hàng (`issueDescription`).<br>4. Nhân viên ghi nhận tình trạng ngoại quan (`appearanceCondition`), tích chọn phụ kiện gửi kèm (`accessories`) và chọn ngày hẹn bàn giao dự kiến (`estimatedReturnDate`).<br>5. Nhân viên nhấn nút "XUẤT PHIẾU TIẾP NHẬN BẢO HÀNH".<br>6. Hệ thống gửi yêu cầu (`POST /api/v1/warranty`), tạo bản ghi mới trong bảng `warrantytickets`, đồng thời cập nhật trạng thái của mã Serial sang `WARRANTY`.<br>7. Hệ thống phát âm thanh bíp thành công và hiển thị cửa sổ in phiếu biên nhận bảo hành (`RmaPrintReceiptModal`).<br>8. Nhân viên nhấn "In Phiếu (K80/A5)" để in biên nhận giao cho khách hàng ký xác nhận. |
| **Kịch bản phụ** | 3.a. Để trống mô tả hiện trạng lỗi kỹ thuật:<br>&nbsp;&nbsp;&nbsp;&nbsp;3.a.1. Hệ thống vô hiệu hóa nút xuất phiếu cho đến khi nhân viên ghi rõ mô tả lỗi.<br>6.a. Cố tình gửi yêu cầu tạo phiếu cho máy chưa xuất bán (`IN_STOCK`):<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.1. Máy chủ từ chối với lỗi `400 SERIAL_NOT_SOLD` và hiển thị thông báo lỗi trên màn hình. |

---

### Bảng 12. Đặc tả Use Case "Quét mã vạch đối soát hàng điều chuyển nhập kho"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST12** |
| **Tên Use Case** | Quét mã vạch đối soát hàng điều chuyển nhập kho (Inbound Transfer Verification) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy hỗ trợ Quản lý cửa hàng tiếp nhận kiện hàng điều chuyển từ Kho Trung Tâm hoặc chi nhánh khác gửi về; thực hiện cầm máy quét quét đối soát từng mã Serial trên các hộp máy của kiện hàng và xác nhận hoàn tất nhập kho khi khớp đủ 100% số lượng. |
| **Điều kiện tiên quyết** | - Nhân viên quầy đã đăng nhập vào hệ thống.<br>- Có phiếu điều chuyển hàng gửi tới chi nhánh đang ở trạng thái vận chuyển (`IN_TRANSIT`). |
| **Yêu cầu** | - Cho phép vai trò `STAFF` truy cập trang `/portal/branch/transfers` (mặc định mở sẵn tab "Yêu cầu nhận hàng (Inbound)" và ẩn nút "Tạo phiếu điều chuyển" vốn chỉ dành cho Quản lý chi nhánh / Super Admin).<br>- Dùng máy quét mã vạch để quét nhanh các mã Serial trên thân hộp máy kèm phản hồi âm thanh (`usePosAudio`).<br>- Hệ thống kiểm tra đối chiếu 100% mã quét với danh sách mã trong phiếu điều chuyển trước khi cho phép xác nhận nhập kho (`PATCH /api/v1/inventory/transfers/:id/receive`). |
| **Kịch bản chính** | 1. Nhân viên quầy mở menu "Kiểm Nhận Điều Chuyển" (`/portal/branch/transfers`), hệ thống tự động mở tab "Yêu cầu nhận hàng (Inbound)".<br>2. Nhân viên tìm đến phiếu điều chuyển của kiện hàng vừa được giao tới chi nhánh và nhấn "Kiểm nhận & Nhập kho".<br>3. Nhân viên cầm máy quét mã vạch và quét lần lượt từng mã Serial trên các hộp máy vào ô đối soát.<br>4. Hệ thống kiểm tra từng mã quét; nếu đúng mã trong phiếu, hệ thống phát âm thanh "Beep" (`playSuccessBeep`) và tích xanh mã đó trên danh sách.<br>5. Sau khi đã quét đủ 100% số lượng máy trên phiếu, nút "Hoàn tất nhập kho" được mở khóa; nhân viên (hoặc Quản lý chi nhánh) nhấn xác nhận để chuyển các Serial sang `IN_STOCK` tại chi nhánh và cộng tồn kho. |
| **Kịch bản phụ** | 4.a. Quét phải mã máy không nằm trong danh sách kiện hàng:<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Hệ thống phát tiếng kêu cảnh báo lỗi (`playErrorBeep`) và hiển thị thông báo mã không thuộc phiếu điều chuyển hiện tại. |

---

### Bảng 13. Đặc tả Use Case "Đăng xuất khỏi ca làm việc Web POS"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST13** |
| **Tên Use Case** | Đăng xuất khỏi ca làm việc Web POS |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy đăng xuất tài khoản ngay từ thanh tiêu đề màn hình POS (`PosHeader`) hoặc thanh điều hướng (`PortalLayout`) khi kết thúc ca làm việc để bàn giao máy POS cho nhân viên ca tiếp theo; cảnh báo nếu giỏ hàng đang còn sản phẩm dở dang và xóa sạch phiên làm việc. |
| **Điều kiện tiên quyết** | - Nhân viên quầy đang trong ca làm việc trên hệ thống. |
| **Yêu cầu** | - Có nút **"Kết thúc ca"** trực tiếp ngay góc phải thanh `PosHeader` (do màn hình POS hoạt động ở chế độ toàn màn hình) cũng như nút "Đăng xuất" trên `PortalLayout`.<br>- Nếu giỏ hàng POS đang có sản phẩm chưa thanh toán (`activeCartCount > 0`), hệ thống hiển thị hộp thoại xác nhận trước khi hủy giỏ và đăng xuất.<br>- Gửi request `POST /api/v1/auth/logout`, xóa phiên trong cơ sở dữ liệu, làm sạch giỏ hàng (`clearCart()`) và dọn sạch token trong bộ nhớ (`logout()`). |
| **Kịch bản chính** | 1. Nhân viên quầy hoàn tất việc thu ngân các đơn hàng hiện tại.<br>2. Nhân viên nhấn vào nút **"Kết thúc ca"** ở góc phải thanh `PosHeader` (hoặc nút "Đăng xuất" trên thanh điều hướng).<br>3. Hệ thống gửi yêu cầu hủy phiên làm việc lên máy chủ (`POST /api/v1/auth/logout`).<br>4. Máy chủ thu hồi Refresh Token trong `user_sessions` và xóa cookie xác thực.<br>5. Trình duyệt xóa toàn bộ thông tin đăng nhập trong Redux Store (`logout()`) và đưa giỏ hàng POS về trạng thái rỗng ban đầu (`clearCart()`).<br>6. Màn hình tự động chuyển về trang đăng nhập (`/login`) sẵn sàng cho nhân viên ca sau đăng nhập. |
| **Kịch bản phụ** | 1.a. Trong giỏ hàng vẫn còn đơn dở dang chưa thanh toán (`activeCartCount > 0`):<br>&nbsp;&nbsp;&nbsp;&nbsp;1.a.1. Hệ thống hiển thị hộp thoại xác nhận: "Giỏ hàng hiện tại đang có sản phẩm. Bạn có chắc chắn muốn đăng xuất và hủy giỏ hàng này không?".<br>&nbsp;&nbsp;&nbsp;&nbsp;1.a.2. Nhân viên chọn xác nhận để tiếp tục đăng xuất, hoặc chọn Hủy để ở lại hoàn tất đơn hàng. |
