# TÀI LIỆU ĐẶC TẢ USE CASE HỆ THỐNG MERN-TECH-ECOMMERCE
## PHÂN HỆ: NHÂN VIÊN QUẦY (COUNTER STAFF / THU NGÂN POS)

---

### Bảng 1. Đặc tả Use Case "Đăng nhập vào ca làm việc Web POS"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST01** |
| **Tên Use Case** | Đăng nhập vào ca làm việc Web POS |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy/thu ngân đăng nhập vào hệ thống khi bắt đầu ca làm việc tại cửa hàng, hệ thống xác thực danh tính, tự động liên kết với chi nhánh làm việc (`branchId`) và chuyển hướng trực tiếp vào màn hình bán hàng Web POS tối ưu thao tác nhanh. |
| **Điều kiện tiên quyết** | - Hệ thống đang chạy bình thường.<br>- Tài khoản nhân viên đã được kích hoạt trong hệ thống với vai trò `role: STAFF`, trạng thái `isActive: true` và được gán mã chi nhánh làm việc cố định (`branchId`).<br>- Nhân viên biết tài khoản (Email/SĐT) và mật khẩu được cấp. |
| **Yêu cầu** | - Đăng nhập qua giao diện `/login`.<br>- Hỗ trợ đăng nhập nhanh bằng Email hoặc Số điện thoại.<br>- Phiên làm việc có thời hạn tối đa 8 giờ (tương ứng với một ca làm việc tiêu chuẩn của nhân viên).<br>- Giới hạn phạm vi dữ liệu qua `scopeBranch` chỉ thuộc chi nhánh đang công tác. |
| **Kịch bản chính** | 1. Nhân viên quầy mở trình duyệt trên máy POS thu ngân và truy cập `/login`.<br>2. Hệ thống hiển thị biểu mẫu đăng nhập.<br>3. Nhân viên nhập Email hoặc Số điện thoại và Mật khẩu ca làm việc.<br>4. Nhân viên nhấn nút "Đăng nhập" (hoặc nhấn phím `Enter`).<br>5. Hệ thống gửi yêu cầu xác thực (`POST /api/v1/auth/login`).<br>6. Máy chủ kiểm tra mật khẩu qua `bcryptjs` và xác thực tài khoản.<br>7. Hệ thống xác nhận vai trò `STAFF`, lưu phiên làm việc 8 giờ, cấp JWT Token và tự động chuyển hướng thẳng đến màn hình bán hàng Web POS (`/portal/pos`).<br>8. Màn hình POS mở ra ở trạng thái sẵn sàng, tự động lấy nét (auto-focus) vào ô quét mã vạch Barcode. |
| **Kịch bản phụ** | 3.a. Nhân viên chọn hiển thị mật khẩu để kiểm tra ký tự gõ phím.<br>6.a. Nhập sai mật khẩu hoặc tài khoản không tồn tại:<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.1. Hệ thống báo lỗi "Email/Số điện thoại hoặc mật khẩu không chính xác".<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.2. Con trỏ chuột tự động quay về ô mật khẩu để nhân viên nhập lại.<br>6.b. Tài khoản nhân viên bị khóa do hết hạn hợp đồng hoặc kỷ luật (`isActive: false`):<br>&nbsp;&nbsp;&nbsp;&nbsp;6.b.1. Hệ thống từ chối truy cập và thông báo: "Tài khoản nhân viên đã bị vô hiệu hóa. Vui lòng liên hệ Quản lý chi nhánh". |

---

### Bảng 2. Đặc tả Use Case "Tra cứu danh mục và tìm kiếm sản phẩm tại quầy"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST02** |
| **Tên Use Case** | Tra cứu danh mục và tìm kiếm sản phẩm tại quầy bán hàng (POS Product Catalog) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy tìm kiếm nhanh sản phẩm trên màn hình POS thông qua thanh tìm kiếm từ khóa (tên sản phẩm, mã SKU) hoặc chọn lọc theo thanh tab danh mục nhanh (Tất cả, Laptop, Điện thoại, Phụ kiện...) để tư vấn và thêm hàng vào hóa đơn cho khách. |
| **Điều kiện tiên quyết** | - Nhân viên quầy đã đăng nhập vào màn hình Web POS (`/portal/pos`). |
| **Yêu cầu** | - Tốc độ tìm kiếm phản hồi tức thì ($T_{search} < 100ms$).<br>- Hiển thị dạng lưới thẻ sản phẩm trực quan: Ảnh đại diện, Tên sản phẩm, Mã SKU, Giá bán lẻ niêm yết và nhãn nhận biết hàng có quản lý Serial hay không. |
| **Kịch bản chính** | 1. Nhân viên quầy quan sát cột danh mục sản phẩm (chiếm 60% diện tích bên trái màn hình POS).<br>2. **Tìm theo từ khóa:**<br>&nbsp;&nbsp;&nbsp;&nbsp;2.1. Nhân viên gõ tên sản phẩm (ví dụ: "iPhone 16", "MacBook Air") vào ô tìm kiếm nhanh.<br>&nbsp;&nbsp;&nbsp;&nbsp;2.2. Hệ thống lọc danh sách sản phẩm tương ứng trong cơ sở dữ liệu và hiển thị ngay trên lưới.<br>3. **Lọc theo nhóm danh mục:**<br>&nbsp;&nbsp;&nbsp;&nbsp;3.1. Nhân viên bấm vào tab danh mục (ví dụ chọn tab "Laptop" hoặc "Phụ kiện").<br>&nbsp;&nbsp;&nbsp;&nbsp;3.2. Hệ thống tải lại danh mục sản phẩm thuộc nhóm ngành hàng đã chọn.<br>4. Nhân viên bấm vào thẻ sản phẩm hiển thị trên lưới để đưa sản phẩm vào giỏ hàng POS. |
| **Kịch bản phụ** | 2.a. Không tìm thấy sản phẩm nào khớp với từ khóa:<br>&nbsp;&nbsp;&nbsp;&nbsp;2.a.1. Hệ thống hiển thị khung thông báo "Không tìm thấy sản phẩm phù hợp". |

---

### Bảng 3. Đặc tả Use Case "Quét mã vạch Barcode sản phẩm bằng máy quét phần cứng"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST03** |
| **Tên Use Case** | Quét mã vạch Barcode sản phẩm bằng máy quét (Barcode Hardware Scanner) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy sử dụng máy quét mã vạch chuyên dụng cầm tay (kết nối USB/Bluetooth) hoặc camera điện thoại quét trực tiếp mã vạch (Barcode / UPC / SKU) trên bao bì sản phẩm; hệ thống tự động nhận diện phím bấm siêu tốc qua Keyboard Event Listener và tự động thêm sản phẩm vào giỏ hàng mà không cần click chuột. |
| **Điều kiện tiên quyết** | - Nhân viên quầy đang ở màn hình Web POS.<br>- Máy quét mã vạch đã kết nối với máy tính POS (hoạt động theo chế độ bàn phím ảo HID). |
| **Yêu cầu** | - Cơ chế lắng nghe sự kiện phím toàn cục qua custom hook `useBarcodeScanner`: Bắt chuỗi ký tự kết thúc bằng phím `Enter` trong khoảng thời gian siêu ngắn (debounce `< 50ms`), phân biệt chính xác giữa người gõ phím thông thường và máy quét quang học.<br>- Tích hợp phản hồi âm thanh (Audio Feedback): Phát tiếng bíp "Beep" thành công khi quét hợp lệ và tiếng bíp đôi cảnh báo khi quét sai/không tìm thấy.<br>- Phản hồi tức thì $T_{response} < 100ms$. |
| **Kịch bản chính** | 1. Khách hàng mang sản phẩm đến quầy thu ngân.<br>2. Nhân viên quầy cầm máy quét mã vạch hướng tia quét laser/LED vào mã vạch in trên vỏ hộp sản phẩm.<br>3. Máy quét đọc mã và giả lập gửi chuỗi ký tự mã vạch kèm mã phím `Enter` lên trình duyệt.<br>4. Hook `useBarcodeScanner` trên hệ thống lập tức bắt được sự kiện phím và trích xuất mã vạch.<br>5. Hệ thống truy vấn thông tin sản phẩm tương ứng với mã SKU/Barcode vừa đọc.<br>6. Hệ thống tìm thấy sản phẩm, phát âm thanh "Beep" thành công, hiển thị thông báo góc màn hình "Đã nhận diện: [Tên sản phẩm]" và tự động cộng thêm sản phẩm vào giỏ hàng bên phải.<br>7. Ô quét mã vạch tự động làm sạch và duy trì trạng thái lấy nét sẵn sàng cho lần quét tiếp theo. |
| **Kịch bản phụ** | 5.a. Mã vạch quét vào không tồn tại trong danh mục hệ thống:<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.1. Hệ thống phát âm thanh bíp lỗi trầm (Error Beep).<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.2. Hiển thị thông báo màu đỏ: "Không tìm thấy sản phẩm có mã vạch vừa quét". |

---

### Bảng 4. Đặc tả Use Case "Quét và gán mã Serial / IMEI cho thiết bị bán lẻ"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST04** |
| **Tên Use Case** | Quét và gán mã Serial / IMEI cho thiết bị bán lẻ (POS Serial Assignment) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Đối với các mặt hàng công nghệ giá trị cao có quản lý định danh Serial (`isSerialManaged: true`), hệ thống bắt buộc nhân viên quầy phải quét hoặc chọn mã Serial/IMEI thực tế của đúng thân máy lấy trên kệ; hệ thống kiểm tra 3 lớp (Tồn tại, Trạng thái `IN_STOCK`, Đúng chi nhánh) và gán mã máy vào dòng hóa đơn trước khi thanh toán. |
| **Điều kiện tiên quyết** | - Nhân viên đang ở màn hình Web POS.<br>- Giỏ hàng có ít nhất một sản phẩm yêu cầu quản lý Serial/IMEI (ví dụ: Điện thoại, Laptop, Tablet...). |
| **Yêu cầu** | - Kiểm tra 3 tầng bảo mật nghiệp vụ (Endpoint `GET /api/v1/serials/scan/:serialNumber`):<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Lớp 1: Mã Serial/IMEI có tồn tại trong CSDL không?<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Lớp 2: Thiết bị có đang ở trạng thái khả dụng bán `status: 'IN_STOCK'` không?<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Lớp 3: Thiết bị có thuộc sở hữu của chính chi nhánh hiện tại không (Chặn bán chéo chi nhánh qua mã lỗi `CROSS_BRANCH_ACCESS_DENIED`)?<br>- Quy tắc bắt buộc: Số lượng mã Serial gán phải bằng 100% số lượng mua (`SERIAL_COUNT_MISMATCH`). |
| **Kịch bản chính** | 1. Khi nhân viên thêm sản phẩm có quản lý Serial vào giỏ hàng, dòng mặt hàng hiển thị nhãn màu cam cảnh báo "Chưa gán Serial/IMEI".<br>2. Nhân viên quầy nhấn vào nút "Gán Serial/IMEI" tại dòng sản phẩm đó.<br>3. Hệ thống mở cửa sổ gán Serial (`SerialAssignmentModal`), hiển thị số lượng mã cần gán (ví dụ: Cần gán 1/1 mã).<br>4. Nhân viên cầm hộp máy thực tế, dùng máy quét quét mã Serial/IMEI in trên tem hộp.<br>5. Hệ thống gửi yêu cầu kiểm tra mã Serial lên máy chủ.<br>6. Máy chủ kiểm tra xác thực 3 lớp thành công: Mã tồn tại, đang `IN_STOCK` tại đúng chi nhánh hiện tại.<br>7. Hệ thống phát âm thanh bíp thành công, đưa mã Serial vào danh sách đã gán cho sản phẩm, cập nhật bộ đếm "Đã gán đủ 1/1 mã".<br>8. Nhân viên nhấn nút "Xác nhận gán Serial".<br>9. Hệ thống đóng modal, chuyển trạng thái dòng sản phẩm trong giỏ hàng sang màu xanh lá kèm mã Serial đã được gắn thành công. |
| **Kịch bản phụ** | 6.a. Quét mã Serial của thiết bị thuộc chi nhánh khác mang sang nhưng chưa làm thủ tục điều chuyển:<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.1. Hệ thống báo lỗi `CROSS_BRANCH_ACCESS_DENIED` (HTTP 403) và phát âm thanh cảnh báo: "Thiết bị này thuộc quản lý của chi nhánh khác. Không thể bán tại chi nhánh này".<br>6.b. Quét mã Serial của máy đã được bán từ trước (`status: 'SOLD'`):<br>&nbsp;&nbsp;&nbsp;&nbsp;6.b.1. Hệ thống báo lỗi "Mã máy này đã được bán vào ngày [dd/mm/yyyy]. Vui lòng kiểm tra lại thiết bị".<br>6.c. Quét mã Serial của máy đang trong trạng thái lỗi bảo hành (`status: 'WARRANTY'`):<br>&nbsp;&nbsp;&nbsp;&nbsp;6.c.1. Hệ thống báo lỗi "Thiết bị đang trong quy trình bảo hành, không được phép xuất bán". |

---

### Bảng 5. Đặc tả Use Case "Quản lý giỏ hàng bán hàng tại quầy"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST05** |
| **Tên Use Case** | Quản lý giỏ hàng bán hàng tại quầy (POS Cart Management) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy điều chỉnh các mặt hàng trong giỏ bán hàng: tăng giảm số lượng mua, xóa từng mặt hàng khỏi giỏ, hoặc làm sạch toàn bộ giỏ hàng để tiếp đón khách hàng tiếp theo; hệ thống tự động tính toán lại tạm tính, thuế và tổng tiền. |
| **Điều kiện tiên quyết** | - Nhân viên quầy đang ở màn hình Web POS. |
| **Yêu cầu** | - Thao tác phản hồi tức thì thông qua Redux Store cục bộ (`posCartSlice`).<br>- Nếu giảm số lượng sản phẩm có quản lý Serial, hệ thống phải tự động cảnh báo hoặc hủy bớt mã Serial thừa tương ứng. |
| **Kịch bản chính** | 1. Nhân viên quầy quan sát bảng giỏ hàng tại cột bên phải màn hình (chiếm 40% diện tích).<br>2. **Tăng/Giảm số lượng:**<br>&nbsp;&nbsp;&nbsp;&nbsp;2.1. Nhân viên nhấn nút cộng (+) hoặc trừ (-) tại dòng sản phẩm phụ kiện.<br>&nbsp;&nbsp;&nbsp;&nbsp;2.2. Hệ thống cập nhật số lượng và tự động nhân đơn giá tính ra thành tiền mới.<br>3. **Xóa một mặt hàng:**<br>&nbsp;&nbsp;&nbsp;&nbsp;3.1. Khách hàng đổi ý không mua một món đồ, nhân viên nhấn biểu tượng thùng rác màu đỏ tại dòng đó.<br>&nbsp;&nbsp;&nbsp;&nbsp;3.2. Hệ thống xóa mặt hàng cùng các mã Serial liên quan ra khỏi giỏ và tính toán lại tổng tiền.<br>4. **Xóa toàn bộ giỏ hàng:**<br>&nbsp;&nbsp;&nbsp;&nbsp;4.1. Khách hàng hủy giao dịch, nhân viên nhấn nút "Hủy đơn / Làm mới giỏ" (hoặc bấm phím tắt quy định).<br>&nbsp;&nbsp;&nbsp;&nbsp;4.2. Hệ thống làm sạch toàn bộ giỏ hàng và đưa tổng tiền về 0đ. |
| **Kịch bản phụ** | 2.a. Nhân viên giảm số lượng của sản phẩm có gắn Serial xuống thấp hơn số Serial đã quét:<br>&nbsp;&nbsp;&nbsp;&nbsp;2.a.1. Hệ thống thông báo nhắc nhở và tự động loại bỏ bớt mã Serial quét cuối cùng để đảm bảo số lượng Serial luôn bằng số lượng mua. |

---

### Bảng 6. Đặc tả Use Case "Nhập thông tin khách hàng và áp dụng chiết khấu tại quầy"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST06** |
| **Tên Use Case** | Nhập thông tin khách hàng và áp dụng chiết khấu tại quầy (Customer & Discount Handling) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy nhập thông tin người mua (Họ tên, Số điện thoại) để lưu trữ thông tin kích hoạt bảo hành điện tử và tích lũy điểm; hỗ trợ bán hàng cho khách vãng lai không bắt buộc cung cấp SĐT; cho phép áp dụng mức giảm giá/chiết khấu trực tiếp trên đơn hàng. |
| **Điều kiện tiên quyết** | - Nhân viên quầy đang ở màn hình Web POS.<br>- Giỏ hàng có sản phẩm. |
| **Yêu cầu** | - Hỗ trợ cả khách hàng thành viên và khách hàng vãng lai (không bắt buộc nhập số điện thoại nếu khách từ chối cung cấp).<br>- Số tiền giảm giá chiết khấu không được vượt quá tổng giá trị đơn hàng. |
| **Kịch bản chính** | 1. Tại bảng thanh toán POS, nhân viên quầy hỏi thông tin khách hàng.<br>2. Nhân viên nhập Số điện thoại của khách vào ô "Số điện thoại khách hàng" (hoặc nhấn phím tắt chuyển nhanh con trỏ).<br>3. Nếu khách hàng từng mua sắm, hệ thống tự động gợi ý tên khách hàng; nếu khách hàng mới, nhân viên nhập Họ và tên khách hàng.<br>4. **Áp dụng chiết khấu giảm giá (nếu có):**<br>&nbsp;&nbsp;&nbsp;&nbsp;4.1. Nhân viên nhập số tiền giảm giá trực tiếp (hoặc voucher khuyến mãi) vào ô "Giảm giá".<br>&nbsp;&nbsp;&nbsp;&nbsp;4.2. Hệ thống trừ số tiền giảm giá khỏi tổng tiền và hiển thị "Tổng thanh toán sau giảm". |
| **Kịch bản phụ** | 1.a. Khách hàng là khách vãng lai từ chối để lại thông tin cá nhân:<br>&nbsp;&nbsp;&nbsp;&nbsp;1.a.1. Nhân viên để trống ô thông tin khách hàng.<br>&nbsp;&nbsp;&nbsp;&nbsp;1.a.2. Hệ thống tự động ghi nhận là "Khách vãng lai tại quầy" và vẫn cho phép tiếp tục thanh toán bình thường.<br>4.a. Nhân viên nhập số tiền giảm giá lớn hơn tổng giá trị đơn hàng:<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Hệ thống cảnh báo "Số tiền giảm giá không được vượt quá tổng tiền đơn hàng" và tự động điều chỉnh về mức tối đa bằng tổng tiền. |

---

### Bảng 7. Đặc tả Use Case "Xử lý thanh toán đơn hàng tại quầy POS"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST07** |
| **Tên Use Case** | Xử lý thanh toán đơn hàng tại quầy POS (POS Order Checkout) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy xử lý thu tiền đơn hàng theo hai phương thức: Tiền mặt (tự động tính tiền thừa trả lại khách) hoặc Quét mã Chuyển khoản QR ngân hàng; hệ thống gửi yêu cầu thanh toán nguyên tử (Atomic POS Checkout), tự động trừ kho tức thời, chuyển Serial sang `SOLD` và kích hoạt gói bảo hành điện tử 12 tháng. |
| **Điều kiện tiên quyết** | - Nhân viên đang ở màn hình Web POS.<br>- Giỏ hàng có sản phẩm hợp lệ.<br>- Tất cả các sản phẩm yêu cầu Serial đã được gán đủ 100% mã máy hợp lệ. |
| **Yêu cầu** | - Cơ chế Zero Overselling: Thực hiện trừ kho trực tiếp qua toán tử Atomic `$inc` của MongoDB tại cấp độ Document Lock.<br>- Máy trạng thái Serial: Chuyển toàn bộ các mã Serial được gán từ `IN_STOCK` sang `SOLD`, gắn ngày bán `soldAt` là thời điểm hiện tại và tự động cộng thêm 12 tháng hạn bảo hành `warrantyEndDate`.<br>- Tạo bản ghi đơn hàng trong bảng `orders` với `orderType: 'POS_STORE'`, `orderStatus: 'COMPLETED'`, `paymentStatus: 'PAID'`. |
| **Kịch bản chính** | 1. Nhân viên kiểm tra lại các mặt hàng trong giỏ, đảm bảo không còn dòng sản phẩm nào báo thiếu Serial.<br>2. Nhân viên chọn hình thức thanh toán:<br>&nbsp;&nbsp;&nbsp;&nbsp;+ **Phương thức 1: Tiền mặt (`CASH`):** Nhân viên nhập số tiền mặt khách đưa vào ô "Tiền khách đưa"; hệ thống tự động tính và hiển thị "Tiền thừa trả khách".<br>&nbsp;&nbsp;&nbsp;&nbsp;+ **Phương thức 2: Chuyển khoản QR (`VNPAY`):** Hệ thống hiển thị mã VietQR/VNPAY động chứa số tiền chính xác để khách quét app ngân hàng thanh toán.<br>3. Nhân viên nhấn nút "Thanh toán & In hóa đơn" (hoặc nhấn phím tắt `F9`).<br>4. Hệ thống kiểm tra số Serial còn thiếu; nếu đủ, gửi payload rút gọn qua adapter `toPosCheckoutPayload` lên máy chủ (`POST /api/v1/orders/pos/checkout`).<br>5. Máy chủ thực hiện giao dịch trong một thao tác nguyên tử:<br>&nbsp;&nbsp;&nbsp;&nbsp;5.1. Trừ tồn kho tại chi nhánh qua MongoDB Atomic Operation.<br>&nbsp;&nbsp;&nbsp;&nbsp;5.2. Chuyển trạng thái các Serial sang `SOLD`, kích hoạt e-Warranty.<br>&nbsp;&nbsp;&nbsp;&nbsp;5.3. Tạo bản ghi đơn hàng mới có mã định danh duy nhất (dạng `#POS-XXXXX`).<br>6. Máy chủ phản hồi mã trạng thái HTTP 201 Created cùng dữ liệu đơn hàng hoàn tất.<br>7. Hệ thống phát âm thanh bíp thành công, mở modal hóa đơn K80 sẵn sàng in và tự động làm sạch giỏ hàng. |
| **Kịch bản phụ** | 1.a. Vẫn còn sản phẩm có quản lý Serial nhưng chưa được gán mã máy:<br>&nbsp;&nbsp;&nbsp;&nbsp;1.a.1. Hệ thống khóa nút thanh toán và báo lỗi: "Vui lòng gán đủ mã Serial/IMEI cho tất cả các thiết bị trước khi thanh toán".<br>2.a. Khi chọn tiền mặt, số tiền khách đưa nhỏ hơn tổng số tiền cần thanh toán:<br>&nbsp;&nbsp;&nbsp;&nbsp;2.a.1. Hệ thống cảnh báo "Số tiền khách đưa chưa đủ để thanh toán đơn hàng".<br>5.a. Xảy ra tranh chấp kho (sản phẩm vừa bị đơn khác trừ hết hàng cùng mili-giây):<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.1. Toán tử Atomic phát hiện tồn kho không đủ (`quantity < qty`), máy chủ phản hồi lỗi `PRODUCT_OUT_OF_STOCK` (HTTP 409).<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.2. Hệ thống hiển thị thông báo lỗi hết hàng để nhân viên xử lý đổi máy khác cho khách. |

---

### Bảng 8. Đặc tả Use Case "In hóa đơn nhiệt K80 cho khách hàng"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST08** |
| **Tên Use Case** | In hóa đơn nhiệt K80 cho khách hàng (K80 Receipt Printing) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy xem trước bản mẫu hóa đơn bán lẻ chuẩn khổ giấy in nhiệt K80 (80mm) và gửi lệnh in ra máy in hóa đơn quầy thu ngân; trên hóa đơn in rõ thông tin cửa hàng, danh sách sản phẩm, các mã Serial/IMEI tương ứng kèm thời hạn bảo hành điện tử để giao cho khách hàng. |
| **Điều kiện tiên quyết** | - Đơn hàng bán tại quầy POS vừa được tạo thành công.<br>- Máy in nhiệt K80 đã kết nối với máy tính thu ngân. |
| **Yêu cầu** | - Định dạng giao diện hóa đơn tối ưu vừa khít khổ in 80mm không bị tràn lề.<br>- Thể hiện đầy đủ: Logo/Tên cửa hàng, Địa chỉ chi nhánh, Hotline, Mã đơn hàng, Thu ngân thực hiện, Thời gian mua, Bảng mặt hàng, Mã Serial từng máy, Tổng tiền, Tiền khách đưa, Tiền thừa, Mã QR tra cứu bảo hành và lời cảm ơn. |
| **Kịch bản chính** | 1. Ngay khi thanh toán thành công, hệ thống tự động mở cửa sổ xem trước hóa đơn in nhiệt (`InvoiceK80Modal`).<br>2. Nhân viên quầy đối soát nhanh thông tin đơn hàng trên mẫu hóa đơn.<br>3. Nhân viên nhấn nút "In hóa đơn" (hoặc dùng phím tắt `Ctrl + P`).<br>4. Trình duyệt gọi lệnh in của hệ điều hành và gửi dữ liệu tới máy in nhiệt K80 tại quầy.<br>5. Máy in cắt giấy, nhân viên xé hóa đơn giao cho khách hàng cùng với thiết bị đã đóng gói.<br>6. Nhân viên nhấn nút "Hoàn tất / Đơn hàng mới" để đóng modal và tiếp tục phục vụ khách hàng tiếp theo. |
| **Kịch bản phụ** | 3.a. Khách hàng từ chối nhận hóa đơn giấy:<br>&nbsp;&nbsp;&nbsp;&nbsp;3.a.1. Nhân viên nhấn "Đóng" mà không cần bấm lệnh in, hệ thống bảo lưu hóa đơn điện tử trong CSDL. |

---

### Bảng 9. Đặc tả Use Case "Tra cứu tồn kho chi nhánh phục vụ tư vấn bán hàng"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST09** |
| **Tên Use Case** | Tra cứu tồn kho chi nhánh phục vụ tư vấn (Branch Stock Inquiry) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy nhanh chóng tra cứu số lượng tồn kho khả dụng của các mặt hàng trong kho cửa hàng mình để giải đáp thắc mắc của khách mua hàng trực tiếp tại quầy; kiểm tra xem màu sắc/cấu hình khách cần còn hàng trong kho hay không. |
| **Điều kiện tiên quyết** | - Nhân viên quầy đã đăng nhập vào hệ thống. |
| **Yêu cầu** | - Dữ liệu tự động giới hạn tại chi nhánh làm việc của nhân viên (`scopeBranch`).<br>- Tốc độ truy vấn siêu tốc ($T_{query} < 200ms$). |
| **Kịch bản chính** | 1. Khách hàng tại quầy hỏi về một dòng máy cụ thể.<br>2. Nhân viên quầy truy cập mục "Kho Chi Nhánh" (`/portal/inventory`) hoặc tra cứu trực tiếp qua thanh tìm kiếm trên màn hình POS.<br>3. Nhân viên gõ tên máy hoặc mã SKU cần hỏi.<br>4. Hệ thống hiển thị số lượng tồn kho thực tế của mặt hàng đó tại kho chi nhánh.<br>5. Nhân viên thông báo số lượng sẵn có cho khách hàng hoặc vào kho lấy sản phẩm ra tư vấn. |
| **Kịch bản phụ** | 4.a. Sản phẩm đã hết hàng tại chi nhánh hiện tại (`quantity === 0`):<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Nhân viên kiểm tra trên hệ thống xem các chi nhánh lân cận có còn hàng không để hướng dẫn khách hoặc hẹn điều chuyển. |

---

### Bảng 10. Đặc tả Use Case "Tra cứu bảo hành điện tử bằng Serial / IMEI tại quầy"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST10** |
| **Tên Use Case** | Tra cứu bảo hành điện tử bằng Serial / IMEI (e-Warranty Lookup) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy tra cứu tính hợp lệ và thời hạn bảo hành điện tử của thiết bị do khách hàng mang đến quầy dịch vụ; hệ thống xác minh mã máy có đúng do chuỗi bán ra không, ngày kích hoạt bán và ngày kết thúc bảo hành còn hiệu lực hay không. |
| **Điều kiện tiên quyết** | - Nhân viên quầy có mặt tại trang Tiếp nhận bảo hành (`/portal/warranty-reception`). |
| **Yêu cầu** | - Gọi API kiểm tra bảo hành (`GET /api/v1/serials/verify/:serialNumber`).<br>- Kiểm tra chính xác trạng thái máy (phải là máy đã bán `SOLD` hoặc đang bảo hành `WARRANTY`).<br>- Tính toán tự động cờ `isExpired` bằng cách so khớp thời gian hiện tại với `warrantyEndDate`. |
| **Kịch bản chính** | 1. Khách hàng mang thiết bị gặp sự cố đến quầy hỗ trợ kỹ thuật TechOne Care.<br>2. Nhân viên quầy mở trang "Tiếp Nhận Bảo Hành" (`/portal/warranty-reception`).<br>3. Nhân viên dùng máy quét quét mã Serial/IMEI trên thân máy (hoặc nhập tay mã máy vào ô tra cứu `RmaScanLookup`).<br>4. Nhân viên nhấn nút "Kiểm tra E-Warranty".<br>5. Hệ thống gửi yêu cầu kiểm tra lên máy chủ.<br>6. Máy chủ tìm kiếm trong bảng `serials` và trả về kết quả:<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Tên thiết bị, Hãng, Mã SKU.<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Ngày mua máy và kích hoạt đơn hàng (`soldAt`).<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Ngày hết hạn bảo hành (`warrantyEndDate`).<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Trạng thái: "Còn hạn bảo hành" (Huy hiệu xanh) hoặc "Đã hết hạn bảo hành" (Huy hiệu đỏ).<br>7. Hệ thống phát âm thanh bíp thành công và hiển thị thẻ kết quả thẩm định lên màn hình.<br>8. Nhân viên thông báo kết quả kiểm tra thời hạn cho khách hàng. |
| **Kịch bản phụ** | 6.a. Mã Serial không tồn tại trong hệ thống (thiết bị không mua tại chuỗi):<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.1. Hệ thống phát âm thanh bíp lỗi và thông báo: "Không tìm thấy thông tin thiết bị trong hệ thống. Thiết bị không thuộc chuỗi TechOne bán ra".<br>6.b. Thiết bị chưa từng được xuất bán (vẫn ở trạng thái `IN_STOCK`):<br>&nbsp;&nbsp;&nbsp;&nbsp;6.b.1. Hệ thống cảnh báo: "Thiết bị này chưa có lịch sử kích hoạt bán hàng". |

---

### Bảng 11. Đặc tả Use Case "Lập biên bản tiếp nhận thiết bị bảo hành tại quầy"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST11** |
| **Tên Use Case** | Lập biên bản tiếp nhận thiết bị bảo hành tại quầy (RMA Ticket Creation) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Sau khi xác thực thiết bị hợp lệ, cho phép Nhân viên quầy nhập biên bản ghi nhận tình trạng hỏng hóc thực tế của máy (mô tả lỗi phần cứng/phần mềm, tình trạng vết xước ngoại quan, phụ kiện đi kèm), nhập thông tin liên hệ khách hàng và tạo phiếu bảo hành RMA chính thức; hệ thống tự động sinh mã phiếu, chuyển Serial sang `WARRANTY` và in biên nhận hẹn trả máy cho khách. |
| **Điều kiện tiên quyết** | - Nhân viên đã tra cứu Serial thành công tại Use Case UC-ST10 và thiết bị hợp lệ. |
| **Yêu cầu** | - Mã phiếu bảo hành được sinh tự động theo quy chuẩn duy nhất: `RMA-YYYYMMDD-XXXX`.<br>- Tự động chuyển đổi trạng thái của mã Serial trong CSDL từ `SOLD` sang `WARRANTY`.<br>- Lưu thông tin chi nhánh tiếp nhận chính là chi nhánh hiện tại của nhân viên (`scopeBranch`).<br>- Hỗ trợ in mẫu phiếu tiếp nhận dịch vụ kỹ thuật bàn giao cho khách hàng giữ. |
| **Kịch bản chính** | 1. Sau khi kết quả thẩm định E-Warranty hiển thị, hệ thống tự động nạp thông tin máy sang biểu mẫu "Biên bản tiếp nhận kỹ thuật" (`RmaTicketForm`).<br>2. Nhân viên quầy nhập thông tin khách hàng mang máy đến (Họ tên, Số điện thoại liên hệ).<br>3. Nhân viên nhập mô tả chi tiết lỗi theo lời kể của khách và thẩm định ban đầu (ví dụ: "Màn hình bị sọc xanh, liệt cảm ứng góc dưới").<br>4. Nhân viên tích chọn hoặc ghi nhận tình trạng ngoại quan (ví dụ: "Thân máy cấn nhẹ góc phải, màn hình dán cường lực") và phụ kiện gửi kèm (sạc, cáp, hộp).<br>5. Nhân viên chọn ngày hẹn dự kiến trả máy.<br>6. Nhân viên nhấn nút "Tạo phiếu tiếp nhận & In biên nhận".<br>7. Hệ thống gửi yêu cầu (`POST /api/v1/warranty`), tạo bản ghi mới trong bảng `warrantytickets`, đồng thời cập nhật trạng thái của mã Serial sang `WARRANTY`.<br>8. Hệ thống phát âm thanh bíp thành công và hiển thị cửa sổ in phiếu biên nhận bảo hành (`RmaPrintReceiptModal`) chứa mã phiếu RMA và mã vạch tra cứu.<br>9. Nhân viên in phiếu hẹn ra giấy, ký tên và đưa khách hàng ký xác nhận biên bản. |
| **Kịch bản phụ** | 2.a. Để trống số điện thoại hoặc họ tên khách hàng:<br>&nbsp;&nbsp;&nbsp;&nbsp;2.a.1. Hệ thống yêu cầu bắt buộc nhập số điện thoại liên hệ để gửi thông báo khi sửa xong máy.<br>3.a. Để trống mô tả hiện trạng lỗi kỹ thuật:<br>&nbsp;&nbsp;&nbsp;&nbsp;3.a.1. Hệ thống nhắc nhở nhân viên phải ghi rõ mô tả lỗi trước khi tạo phiếu. |

---

### Bảng 12. Đặc tả Use Case "Quét mã vạch đối soát hàng điều chuyển nhập kho"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST12** |
| **Tên Use Case** | Quét mã vạch đối soát hàng điều chuyển nhập kho (Inbound Transfer Verification) |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy hỗ trợ Quản lý cửa hàng tiếp nhận kiện hàng điều chuyển từ chi nhánh khác gửi về; thực hiện cầm máy quét quét đối soát từng mã Serial trên các hộp máy của kiện hàng để hệ thống kiểm tra tính trùng khớp với phiếu điều chuyển. |
| **Điều kiện tiên quyết** | - Nhân viên quầy đã đăng nhập vào hệ thống.<br>- Có phiếu điều chuyển hàng gửi tới chi nhánh đang ở trạng thái vận chuyển. |
| **Yêu cầu** | - Dùng máy quét mã vạch để quét nhanh các mã Serial trên thân hộp máy.<br>- Hệ thống kiểm tra đối chiếu mã quét với danh sách mã trong phiếu điều chuyển. |
| **Kịch bản chính** | 1. Nhân viên quầy mở trang "Điều Chuyển Kho" (`/portal/branch/transfers`), chọn tab "Tiếp nhận hàng chuyển đến".<br>2. Nhân viên mở phiếu điều chuyển của kiện hàng vừa được người vận chuyển giao tới.<br>3. Nhân viên cầm máy quét mã vạch và quét lần lượt từng mã Serial trên các hộp máy.<br>4. Hệ thống kiểm tra từng mã quét; nếu đúng mã trong phiếu, hệ thống phát âm thanh "Beep" và tích xanh mã đó trên danh sách.<br>5. Nhân viên báo cáo với Quản lý chi nhánh sau khi đã quét đủ 100% số lượng máy để Quản lý nhấn xác nhận hoàn tất nhập kho. |
| **Kịch bản phụ** | 4.a. Quét phải mã máy không nằm trong danh sách kiện hàng:<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Hệ thống phát tiếng kêu cảnh báo lỗi và hiển thị thông báo mã không khớp để nhân viên tách máy ra kiểm tra riêng. |

---

### Bảng 13. Đặc tả Use Case "Đăng xuất khỏi ca làm việc Web POS"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-ST13** |
| **Tên Use Case** | Đăng xuất khỏi ca làm việc Web POS |
| **Tác nhân** | Nhân viên quầy (STAFF) |
| **Mô tả chức năng** | Cho phép Nhân viên quầy đăng xuất tài khoản khi kết thúc ca làm việc để bàn giao máy POS cho nhân viên ca tiếp theo; đảm bảo toàn bộ phiên làm việc cũ bị hủy bỏ và không để lộ thông tin bán hàng. |
| **Điều kiện tiên quyết** | - Nhân viên quầy đang trong ca làm việc trên hệ thống. |
| **Yêu cầu** | - Gửi request `POST /api/v1/auth/logout`, xóa phiên trong cơ sở dữ liệu và dọn sạch token trong bộ nhớ. |
| **Kịch bản chính** | 1. Nhân viên quầy hoàn tất việc thu ngân các đơn hàng hiện tại.<br>2. Nhân viên nhấn vào nút Đăng xuất trên thanh điều hướng hoặc góc thông tin tài khoản.<br>3. Hệ thống gửi yêu cầu hủy phiên làm việc lên máy chủ.<br>4. Máy chủ thu hồi token và xóa cookie xác thực.<br>5. Trình duyệt xóa toàn bộ thông tin đăng nhập trong Redux Store và đưa giỏ hàng POS về trạng thái rỗng ban đầu.<br>6. Màn hình tự động chuyển về trang đăng nhập (`/login`) sẵn sàng cho nhân viên ca sau đăng nhập. |
| **Kịch bản phụ** | 1.a. Trong giỏ hàng vẫn còn đơn dở dang chưa thanh toán:<br>&nbsp;&nbsp;&nbsp;&nbsp;1.a.1. Hệ thống hiển thị hộp thoại xác nhận: "Giỏ hàng hiện tại đang có sản phẩm. Bạn có chắc chắn muốn đăng xuất và hủy giỏ hàng này không?".<br>&nbsp;&nbsp;&nbsp;&nbsp;1.a.2. Nhân viên chọn xác nhận để tiếp tục đăng xuất. |
