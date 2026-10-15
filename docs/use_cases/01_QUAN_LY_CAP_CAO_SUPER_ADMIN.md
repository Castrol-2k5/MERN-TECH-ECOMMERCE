# TÀI LIỆU ĐẶC TẢ USE CASE HỆ THỐNG MERN-TECH-ECOMMERCE
## PHÂN HỆ: QUẢN LÝ CẤP CAO (SUPER ADMIN / TRỤ SỞ HEADQUARTER)

---

### Bảng 1. Đặc tả Use Case "Đăng nhập vào hệ thống quản trị trụ sở"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-AD01** |
| **Tên Use Case** | Đăng nhập vào hệ thống quản trị trụ sở |
| **Tác nhân** | Quản lý cấp cao (SUPER_ADMIN) |
| **Mô tả chức năng** | Cho phép Quản lý cấp cao đăng nhập vào hệ thống TechOne Portal bằng tài khoản đặc quyền, xác thực danh tính qua JWT Token, khởi tạo phiên làm việc bảo mật (8 giờ) và điều hướng đến không gian quản trị trụ sở toàn chuỗi. |
| **Điều kiện tiên quyết** | - Hệ thống máy chủ Backend và MongoDB đang vận hành bình thường.<br>- Tài khoản Quản lý cấp cao đã được khởi tạo trong cơ sở dữ liệu với vai trò `role: SUPER_ADMIN` và cờ trạng thái `isActive: true`.<br>- Quản lý cấp cao đã có thông tin định danh (Email hoặc Số điện thoại) và mật khẩu chính xác. |
| **Yêu cầu** | - Quản lý truy cập vào đường dẫn trang đăng nhập `/login` hoặc `/portal`.<br>- Thiết bị có kết nối mạng Internet ổn định.<br>- Hệ thống hỗ trợ đăng nhập linh hoạt bằng Email hoặc Số điện thoại.<br>- Mật khẩu được mã hóa và đối soát bằng thuật toán `bcryptjs`.<br>- Tự động kích hoạt cơ chế chống tấn công dò mật khẩu (Rate limiting tối đa 5 lần thử/15 phút). |
| **Kịch bản chính** | 1. Quản lý cấp cao truy cập vào trang đăng nhập của hệ thống (`/login`).<br>2. Hệ thống hiển thị biểu mẫu đăng nhập với các trường: Định danh tài khoản (Email/SĐT) và Mật khẩu.<br>3. Quản lý cấp cao nhập Email/Số điện thoại và Mật khẩu quản trị.<br>4. Quản lý cấp cao nhấn nút "Đăng nhập".<br>5. Hệ thống gửi yêu cầu xác thực (`POST /api/v1/auth/login`) đến máy chủ.<br>6. Máy chủ kiểm tra định danh và so khớp mã băm mật khẩu trong cơ sở dữ liệu.<br>7. Hệ thống xác định vai trò tài khoản là `SUPER_ADMIN`, thiết lập phiên làm việc 8 giờ trong bảng `user_sessions`, ghi nhận Access Token và cấp HttpOnly Cookie chứa Refresh Token.<br>8. Hệ thống điều hướng Quản lý cấp cao vào không gian quản trị trụ sở (`/portal/admin/products` hoặc `/portal/admin/analytics`). |
| **Kịch bản phụ** | 3.a. Quản lý cấp cao chọn biểu tượng con mắt để ẩn/hiện mật khẩu trong quá trình nhập liệu.<br>6.a. Tài khoản không tồn tại hoặc mật khẩu không chính xác:<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.1. Hệ thống ghi nhận số lần đăng nhập thất bại.<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.2. Hệ thống hiển thị thông báo lỗi "Email/Số điện thoại hoặc mật khẩu không chính xác".<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.3. Hệ thống giữ lại định danh đã nhập và yêu cầu người dùng nhập lại mật khẩu.<br>6.b. Tài khoản đang trong trạng thái bị khóa (`isActive: false`):<br>&nbsp;&nbsp;&nbsp;&nbsp;6.b.1. Hệ thống từ chối truy cập và hiển thị thông báo "Tài khoản quản trị đã bị vô hiệu hóa. Vui lòng liên hệ ban kỹ thuật".<br>6.c. Người dùng nhập sai quá 5 lần liên tiếp trong vòng 15 phút:<br>&nbsp;&nbsp;&nbsp;&nbsp;6.c.1. Hệ thống chặn tạm thời IP của người dùng qua `authRateLimiter` và hiển thị thông báo "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 15 phút".<br>6.d. Quản lý cấp cao quên mật khẩu:<br>&nbsp;&nbsp;&nbsp;&nbsp;6.d.1. Quản lý nhấn vào liên kết "Quên mật khẩu?" để chuyển sang luồng khôi phục mật khẩu. |

---

### Bảng 2. Đặc tả Use Case "Quản lý sản phẩm toàn chuỗi"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-AD02** |
| **Tên Use Case** | Quản lý sản phẩm toàn chuỗi (CRUD Product) |
| **Tác nhân** | Quản lý cấp cao (SUPER_ADMIN) |
| **Mô tả chức năng** | Cho phép Quản lý cấp cao tra cứu danh sách sản phẩm, tạo mới sản phẩm, cập nhật thông tin chi tiết (tên, hãng sản xuất, giá niêm yết, ảnh đại diện, mô tả, slug chuẩn SEO) và thực hiện xóa mềm (soft-delete) sản phẩm trên toàn hệ thống chuỗi cửa hàng. |
| **Điều kiện tiên quyết** | - Quản lý cấp cao đã đăng nhập thành công vào hệ thống với vai trò `SUPER_ADMIN`.<br>- Đã có ít nhất một danh mục sản phẩm (Category) được định nghĩa trên hệ thống. |
| **Yêu cầu** | - Quyền truy cập được kiểm soát nghiêm ngặt bởi middleware `authorize('SUPER_ADMIN')`.<br>- Tên sản phẩm, thương hiệu, danh mục và giá bán không được để trống.<br>- Quy tắc ràng buộc giá: Giá bán khuyến mãi phải nhỏ hơn hoặc bằng giá niêm yết (`salePrice <= price`).<br>- Dữ liệu cập nhật phải phản ánh đồng bộ ngay lập tức đến cả Storefront B2C và quầy Web POS. |
| **Kịch bản chính** | 1. Quản lý cấp cao truy cập vào menu "Quản Trị Sản Phẩm" (`/portal/admin/products`).<br>2. Hệ thống hiển thị bảng danh sách sản phẩm với các thông tin: Tên máy, Thương hiệu, Phân loại, Giá gốc, Giá bán, Trạng thái kích hoạt.<br>3. **Xem và tìm kiếm sản phẩm:** Quản lý cấp cao nhập từ khóa tìm kiếm hoặc lọc theo ngành hàng, hệ thống lọc và hiển thị kết quả tương ứng.<br>4. **Tạo mới sản phẩm:**<br>&nbsp;&nbsp;&nbsp;&nbsp;4.1. Quản lý cấp cao nhấn nút "Thêm sản phẩm mới".<br>&nbsp;&nbsp;&nbsp;&nbsp;4.2. Hệ thống hiển thị form nhập liệu thông tin cơ bản: Tên sản phẩm, Hãng, Danh mục liên kết, Giá niêm yết, Giá bán, Mô tả tóm tắt, Slug.<br>&nbsp;&nbsp;&nbsp;&nbsp;4.3. Quản lý cấp cao điền đầy đủ dữ liệu hợp lệ và nhấn nút "Lưu sản phẩm".<br>&nbsp;&nbsp;&nbsp;&nbsp;4.4. Hệ thống kiểm tra dữ liệu qua schema Zod, tạo bản ghi mới trong bảng `products` với cờ `isActive: true` và thông báo "Tạo sản phẩm thành công".<br>&nbsp;&nbsp;&nbsp;&nbsp;4.5. Hệ thống làm mới danh sách sản phẩm hiển thị trên bảng.<br>5. **Cập nhật sản phẩm:**<br>&nbsp;&nbsp;&nbsp;&nbsp;5.1. Quản lý cấp cao chọn một sản phẩm từ danh sách.<br>&nbsp;&nbsp;&nbsp;&nbsp;5.2. Hệ thống tải dữ liệu hiện tại lên biểu mẫu chỉnh sửa.<br>&nbsp;&nbsp;&nbsp;&nbsp;5.3. Quản lý cấp cao chỉnh sửa các trường cần thay đổi và nhấn "Cập nhật".<br>&nbsp;&nbsp;&nbsp;&nbsp;5.4. Hệ thống ghi đè thông tin mới vào CSDL và hiển thị thông báo thành công.<br>6. **Xóa mềm sản phẩm:**<br>&nbsp;&nbsp;&nbsp;&nbsp;6.1. Quản lý cấp cao nhấn nút "Xóa" hoặc chuyển cờ vô hiệu hóa tại dòng sản phẩm tương ứng.<br>&nbsp;&nbsp;&nbsp;&nbsp;6.2. Hệ thống hiển thị hộp thoại xác nhận cảnh báo.<br>&nbsp;&nbsp;&nbsp;&nbsp;6.3. Quản lý cấp cao xác nhận đồng ý xóa.<br>&nbsp;&nbsp;&nbsp;&nbsp;6.4. Hệ thống cập nhật trường `isActive: false` cho sản phẩm, ẩn sản phẩm khỏi giao diện mua sắm B2C mà vẫn bảo lưu dữ liệu lịch sử đơn hàng. |
| **Kịch bản phụ** | 4.a. Dữ liệu nhập vào thiếu trường bắt buộc hoặc sai định dạng (ví dụ giá bán âm, slug chứa ký tự đặc biệt):<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Hệ thống chặn gửi form và hiển thị cảnh báo vi phạm trực tiếp dưới ô nhập liệu.<br>4.b. Giá bán khuyến mãi lớn hơn giá niêm yết gốc (`salePrice > price`):<br>&nbsp;&nbsp;&nbsp;&nbsp;4.b.1. Hệ thống báo lỗi "Giá khuyến mãi không được lớn hơn giá niêm yết" và yêu cầu chỉnh sửa lại.<br>6.a. Quản lý cấp cao hủy bỏ thao tác xóa tại hộp thoại xác nhận:<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.1. Hệ thống đóng hộp thoại, trạng thái sản phẩm giữ nguyên vẹn. |

---

### Bảng 3. Đặc tả Use Case "Quản lý thuộc tính động và biến thể SKU"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-AD03** |
| **Tên Use Case** | Quản lý thuộc tính động & biến thể SKU (Dynamic Attributes & SKUs) |
| **Tác nhân** | Quản lý cấp cao (SUPER_ADMIN) |
| **Mô tả chức năng** | Cho phép Quản lý cấp cao cấu hình ma trận thuộc tính động biến đổi theo ngành hàng (như CPU, RAM, VGA cho Laptop; Cảm biến cho Chuột máy tính) và tạo lập, quản lý danh sách biến thể SKU nhúng (Embedded SKUs) phục vụ bộ lọc tìm kiếm và bán hàng. |
| **Điều kiện tiên quyết** | - Quản lý cấp cao đã đăng nhập vào hệ thống với quyền `SUPER_ADMIN`.<br>- Sản phẩm và danh mục tương ứng đã được khởi tạo. |
| **Yêu cầu** | - Áp dụng kiến trúc MongoDB Hybrid Schema: nhúng trực tiếp mảng `attributes: [{ key, value }]` và mảng `skus: [{ sku, price, salePrice, optionValues }]` vào trong Document của sản phẩm.<br>- Đảm bảo tính toàn vẹn thuộc tính (Integrity Rule): Các trường `key` nhập vào phải hợp lệ và khớp với mảng `attributeKeys` đã định nghĩa tại danh mục cha. |
| **Kịch bản chính** | 1. Quản lý cấp cao tại trang Quản trị sản phẩm, chọn một sản phẩm và chuyển sang tab "Thuộc tính động & Cấu hình kỹ thuật" (`ATTRIBUTES`).<br>2. Hệ thống tải danh sách các trường thuộc tính quy định bởi danh mục cha của sản phẩm.<br>3. Quản lý cấp cao bổ sung hoặc chỉnh sửa các cặp giá trị (ví dụ: `cpu: Apple M4`, `ram: 16GB`, `storage: 512GB`).<br>4. Quản lý chuyển sang tab "Biến thể & Mã SKU" (`SKUs`).<br>5. Hệ thống hiển thị bảng danh sách các SKU hiện có kèm mã SKU, tên biến thể (Màu sắc, Dung lượng), giá bán lẻ, giá khuyến mãi và trạng thái quản lý theo Serial (`isSerialManaged`).<br>6. Quản lý cấp cao nhấn "Thêm SKU biến thể", nhập mã SKU duy nhất, chọn tổ hợp giá trị tùy chọn (Option Values), thiết lập giá bán và chỉ định cờ quản lý Serial.<br>7. Quản lý cấp cao nhấn "Lưu toàn bộ cấu hình".<br>8. Hệ thống xác thực tính hợp lệ của mã SKU (không trùng lặp trong sản phẩm) và kiểm tra bộ khóa `attributeKeys`.<br>9. Hệ thống cập nhật nguyên khối Document sản phẩm vào MongoDB và phản hồi thông báo thành công. |
| **Kịch bản phụ** | 3.a. Quản lý cấp cao nhập thuộc tính không nằm trong danh sách `attributeKeys` được phép của danh mục:<br>&nbsp;&nbsp;&nbsp;&nbsp;3.a.1. Hệ thống báo lỗi mã `INVALID_ATTRIBUTE_KEY` (HTTP 400) và từ chối cập nhật.<br>6.a. Quản lý cấp cao nhập trùng mã SKU đã tồn tại:<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.1. Hệ thống cảnh báo "Mã SKU này đã tồn tại trong hệ thống, vui lòng nhập mã SKU khác". |

---

### Bảng 4. Đặc tả Use Case "Quản lý danh mục sản phẩm đa cấp"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-AD04** |
| **Tên Use Case** | Quản lý danh mục sản phẩm đa cấp (Category Management) |
| **Tác nhân** | Quản lý cấp cao (SUPER_ADMIN) |
| **Mô tả chức năng** | Cho phép Quản lý cấp cao xây dựng cây danh mục sản phẩm phân cấp lồng nhau (cha - con), tự động tạo slug tiếng Việt không dấu chuẩn SEO, định nghĩa danh sách thuộc tính động cho phép (`attributeKeys`) và thực hiện chỉnh sửa, xóa danh mục. |
| **Điều kiện tiên quyết** | - Quản lý cấp cao đã đăng nhập với vai trò `SUPER_ADMIN`. |
| **Yêu cầu** | - Ngăn chặn triệt để lỗi logic vòng lặp phả hệ (danh mục không thể chọn chính mình hoặc con của mình làm danh mục cha: `INVALID_PARENT_CATEGORY`).<br>- Hỗ trợ hiển thị cấu trúc phân cấp dạng cây (`?tree=true`).<br>- Cấu hình mảng `attributeKeys` chuẩn xác để làm cơ sở cho bộ lọc tìm kiếm động. |
| **Kịch bản chính** | 1. Quản lý cấp cao mở mục quản trị danh mục sản phẩm.<br>2. Hệ thống hiển thị cây danh mục phân cấp hiện tại (ví dụ: Laptop -> Laptop Gaming, Smartphone -> iPhone).<br>3. **Tạo mới danh mục:**<br>&nbsp;&nbsp;&nbsp;&nbsp;3.1. Quản lý nhấn "Tạo danh mục mới".<br>&nbsp;&nbsp;&nbsp;&nbsp;3.2. Quản lý nhập tên danh mục (ví dụ: "Máy tính xách tay"), chọn danh mục cha (nếu là danh mục con, để trống nếu là gốc), tải biểu tượng và nhập danh sách các khóa thông số kỹ thuật `attributeKeys` (ví dụ: `cpu, ram, vga, storage, screen_size`).<br>&nbsp;&nbsp;&nbsp;&nbsp;3.3. Quản lý nhấn "Lưu danh mục".<br>&nbsp;&nbsp;&nbsp;&nbsp;3.4. Hệ thống tự động chuyển đổi tên thành slug chuẩn SEO (ví dụ: `may-tinh-xach-tay`), lưu vào bảng `categories` và hiển thị thông báo thành công.<br>4. **Cập nhật danh mục:**<br>&nbsp;&nbsp;&nbsp;&nbsp;4.1. Quản lý chọn danh mục cần sửa, cập nhật lại tên, đường dẫn cha hoặc danh sách `attributeKeys`.<br>&nbsp;&nbsp;&nbsp;&nbsp;4.2. Hệ thống xác thực tính hợp lệ của mối quan hệ cha con và ghi đè dữ liệu mới.<br>5. **Xóa danh mục:**<br>&nbsp;&nbsp;&nbsp;&nbsp;5.1. Quản lý chọn xóa danh mục.<br>&nbsp;&nbsp;&nbsp;&nbsp;5.2. Hệ thống kiểm tra xem có sản phẩm nào đang thuộc danh mục này hay không.<br>&nbsp;&nbsp;&nbsp;&nbsp;5.3. Nếu an toàn, hệ thống thực hiện xóa mềm (`isActive: false`). |
| **Kịch bản phụ** | 4.a. Quản lý chọn danh mục cha chính là danh mục hiện tại đang chỉnh sửa:<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Hệ thống phát hiện lỗi và báo lỗi `INVALID_PARENT_CATEGORY` (HTTP 400).<br>5.a. Danh mục vẫn đang chứa sản phẩm hoặc có danh mục con trực thuộc:<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.1. Hệ thống cảnh báo "Không thể xóa danh mục đang có sản phẩm hoặc danh mục con liên kết. Vui lòng chuyển các sản phẩm liên quan trước". |

---

### Bảng 5. Đặc tả Use Case "Quản lý mạng lưới chi nhánh chuỗi cửa hàng"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-AD05** |
| **Tên Use Case** | Quản lý mạng lưới chi nhánh chuỗi cửa hàng (Branch Management) |
| **Tác nhân** | Quản lý cấp cao (SUPER_ADMIN) |
| **Mô tả chức năng** | Cho phép Quản lý cấp cao quản trị toàn bộ danh mục các chi nhánh vật lý trong chuỗi cửa hàng TechOne: thêm chi nhánh mới, cập nhật địa chỉ, số hotline, định vị GPS chuẩn GeoJSON Point (phục vụ tính năng tìm cửa hàng gần nhất bằng chỉ mục `2dsphere`), chỉ định quản lý phụ trách và kích hoạt/ngưng hoạt động chi nhánh. |
| **Điều kiện tiên quyết** | - Quản lý cấp cao đã đăng nhập với vai trò `SUPER_ADMIN`. |
| **Yêu cầu** | - Mã chi nhánh (`code`) phải là duy nhất trên toàn hệ thống (ví dụ: `BR-Q1-TQK`, `BR-TD-VVN`).<br>- Tọa độ địa lý bắt buộc phải tuân thủ chuẩn GeoJSON Point: kinh độ `longitude` trong khoảng `[-180, 180]` và vĩ độ `latitude` trong khoảng `[-90, 90]`.<br>- Hỗ trợ truy vấn không gian địa lý `$near`. |
| **Kịch bản chính** | 1. Quản lý cấp cao truy cập trang "Chi Nhánh & RBAC" (`/portal/admin/branches-rbac`), chọn tab "Mạng lưới chi nhánh".<br>2. Hệ thống hiển thị dạng thẻ lưới (Card Grid) danh sách các cửa hàng kèm thông tin: Mã chi nhánh, Tên cửa hàng, Địa chỉ, Số điện thoại, Quản lý chi nhánh phụ trách, Tồn kho hiện có và Tọa độ GPS.<br>3. **Thêm chi nhánh mới:**<br>&nbsp;&nbsp;&nbsp;&nbsp;3.1. Quản lý nhấn nút "Thêm chi nhánh mới".<br>&nbsp;&nbsp;&nbsp;&nbsp;3.2. Hệ thống hiển thị modal biểu mẫu nhập liệu.<br>&nbsp;&nbsp;&nbsp;&nbsp;3.3. Quản lý nhập: Mã chi nhánh, Tên cửa hàng, Địa chỉ đầy đủ, Hotline liên hệ, Tọa độ Kinh độ (Lng) và Vĩ độ (Lat).<br>&nbsp;&nbsp;&nbsp;&nbsp;3.4. Quản lý nhấn "Lưu chi nhánh".<br>&nbsp;&nbsp;&nbsp;&nbsp;3.5. Hệ thống xác thực qua Zod schema, lưu vào bảng `branches` và khởi tạo bản đồ số.<br>4. **Chỉnh sửa chi nhánh:**<br>&nbsp;&nbsp;&nbsp;&nbsp;4.1. Quản lý chọn biểu tượng chỉnh sửa tại thẻ chi nhánh tương ứng.<br>&nbsp;&nbsp;&nbsp;&nbsp;4.2. Quản lý thay đổi thông tin liên hệ hoặc cập nhật lại tọa độ vị trí.<br>&nbsp;&nbsp;&nbsp;&nbsp;4.3. Quản lý nhấn "Lưu thay đổi", hệ thống cập nhật vào CSDL.<br>5. **Ngưng hoạt động / Xóa chi nhánh:**<br>&nbsp;&nbsp;&nbsp;&nbsp;5.1. Quản lý chọn chuyển trạng thái chi nhánh sang ngừng hoạt động.<br>&nbsp;&nbsp;&nbsp;&nbsp;5.2. Hệ thống xác nhận và cập nhật `isActive: false`, tạm ẩn chi nhánh khỏi danh sách chọn cửa hàng tại giao diện Storefront B2C. |
| **Kịch bản phụ** | 3.a. Nhập tọa độ GPS vượt ngoài giới hạn cho phép (ví dụ kinh độ > 180 hoặc vĩ độ > 90):<br>&nbsp;&nbsp;&nbsp;&nbsp;3.a.1. Hệ thống báo lỗi "Tọa độ không hợp lệ. Kinh độ phải nằm trong [-180, 180] và vĩ độ nằm trong [-90, 90]".<br>3.b. Mã chi nhánh bị trùng lặp:<br>&nbsp;&nbsp;&nbsp;&nbsp;3.b.1. Hệ thống báo lỗi trùng lặp mã chi nhánh và yêu cầu nhập mã khác. |

---

### Bảng 6. Đặc tả Use Case "Quản lý người dùng và phân quyền RBAC toàn hệ thống"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-AD06** |
| **Tên Use Case** | Quản lý người dùng và phân quyền RBAC (RBAC & User Management) |
| **Tác nhân** | Quản lý cấp cao (SUPER_ADMIN) |
| **Mô tả chức năng** | Cho phép Quản lý cấp cao quản trị danh sách người dùng trong hệ thống; tạo tài khoản nhân sự mới; phân chia vai trò 4 cấp (`SUPER_ADMIN`, `BRANCH_MANAGER`, `STAFF`, `CUSTOMER`); gán nhân viên vào chi nhánh làm việc cụ thể (`branchId`); khóa hoặc mở khóa tài khoản người dùng. |
| **Điều kiện tiên quyết** | - Quản lý cấp cao đã đăng nhập với vai trò `SUPER_ADMIN`.<br>- Danh sách các chi nhánh đã tồn tại trong hệ thống để gán cho nhân sự. |
| **Yêu cầu** | - Quy tắc nghiệp vụ bắt buộc: Nếu tài khoản có vai trò là `STAFF` hoặc `BRANCH_MANAGER`, trường `branchId` bắt buộc phải có giá trị hợp lệ tham chiếu đến một chi nhánh đang hoạt động.<br>- Mật khẩu tạo mới phải được băm an toàn qua `bcryptjs`.<br>- Email và Số điện thoại phải là duy nhất trên toàn hệ thống bảng `users`. |
| **Kịch bản chính** | 1. Quản lý cấp cao truy cập trang "Chi Nhánh & RBAC", chuyển sang tab "Phân quyền & Tài khoản" (`UserRbacTable`).<br>2. Hệ thống hiển thị bảng danh sách tài khoản: Họ tên, Email, Số điện thoại, Vai trò hiện tại, Chi nhánh trực thuộc, Trạng thái hoạt động.<br>3. **Tạo tài khoản nhân sự mới:**<br>&nbsp;&nbsp;&nbsp;&nbsp;3.1. Quản lý nhấn nút "Thêm tài khoản nhân sự".<br>&nbsp;&nbsp;&nbsp;&nbsp;3.2. Quản lý nhập thông tin: Họ tên, Email, SĐT, Mật khẩu khởi tạo.<br>&nbsp;&nbsp;&nbsp;&nbsp;3.3. Quản lý chọn vai trò (`BRANCH_MANAGER` hoặc `STAFF`).<br>&nbsp;&nbsp;&nbsp;&nbsp;3.4. Hệ thống yêu cầu bắt buộc chọn Chi nhánh làm việc từ danh sách dropdown chi nhánh.<br>&nbsp;&nbsp;&nbsp;&nbsp;3.5. Quản lý nhấn "Khởi tạo tài khoản".<br>&nbsp;&nbsp;&nbsp;&nbsp;3.6. Hệ thống kiểm tra tính duy nhất của Email/SĐT, mã hóa mật khẩu, lưu vào cơ sở dữ liệu và hiển thị thông báo thành công.<br>4. **Điều chỉnh vai trò hoặc chi nhánh công tác:**<br>&nbsp;&nbsp;&nbsp;&nbsp;4.1. Quản lý chọn tài khoản cần thay đổi, cập nhật lại quyền hạn hoặc chuyển đổi chi nhánh công tác.<br>&nbsp;&nbsp;&nbsp;&nbsp;4.2. Hệ thống kiểm tra ràng buộc logic và ghi nhận sự thay đổi.<br>5. **Khóa / Mở khóa tài khoản:**<br>&nbsp;&nbsp;&nbsp;&nbsp;5.1. Quản lý gạt nút chuyển đổi trạng thái `isActive` của một tài khoản.<br>&nbsp;&nbsp;&nbsp;&nbsp;5.2. Hệ thống cập nhật trạng thái ngay lập tức. Nếu tài khoản bị khóa, các phiên đăng nhập đang mở của tài khoản đó sẽ bị từ chối truy cập ở các yêu cầu tiếp theo. |
| **Kịch bản phụ** | 3.a. Quản lý chọn vai trò là `STAFF` hoặc `BRANCH_MANAGER` nhưng quên không chọn chi nhánh công tác:<br>&nbsp;&nbsp;&nbsp;&nbsp;3.a.1. Hệ thống chặn gửi dữ liệu và hiển thị lỗi: "Chi nhánh là bắt buộc đối với nhân viên (STAFF) và quản lý chi nhánh (BRANCH_MANAGER)".<br>3.b. Email hoặc Số điện thoại đã được đăng ký bởi người dùng khác trong hệ thống:<br>&nbsp;&nbsp;&nbsp;&nbsp;3.b.1. Hệ thống báo lỗi trùng lặp thông tin định danh và yêu cầu nhập lại. |

---

### Bảng 7. Đặc tả Use Case "Nhập lô Serial / IMEI tập trung vào kho chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-AD07** |
| **Tên Use Case** | Nhập lô Serial / IMEI tập trung (Batch Import Serials) |
| **Tác nhân** | Quản lý cấp cao (SUPER_ADMIN) |
| **Mô tả chức năng** | Cho phép Quản lý cấp cao nhập một danh sách lớn các mã Serial/IMEI thiết bị mới nhập kho từ nhà sản xuất, phân bổ trực tiếp vào chi nhánh chỉ định, tự động tăng số lượng tồn kho `quantity` trong bảng `branch_inventories` qua cơ chế toán tử Atomic `$inc` và thiết lập trạng thái máy ban đầu là `IN_STOCK`. |
| **Điều kiện tiên quyết** | - Quản lý cấp cao đã đăng nhập với vai trò `SUPER_ADMIN`.<br>- Sản phẩm và biến thể SKU cần nhập đã tồn tại trong danh mục hệ thống.<br>- Chi nhánh tiếp nhận đã được kích hoạt. |
| **Yêu cầu** | - Định dạng Serial/IMEI tuân thủ chuẩn quy định (chuỗi ký tự chữ và số, không chứa ký tự đặc biệt).<br>- Tự động bóc tách phân tích dữ liệu dán vào từ bảng tính (Excel/CSV/Textarea).<br>- Áp dụng Unique Index trên mã `serialNumber` để ngăn chặn tuyệt đối tình trạng nhập trùng mã máy.<br>- Thực hiện đồng bộ tăng tồn kho tức thì qua toán tử Atomic của MongoDB, đảm bảo không có độ trễ giữa tồn kho tổng và số lượng Serial. |
| **Kịch bản chính** | 1. Quản lý cấp cao mở trang "Nhập Lô Serial / IMEI" (`/portal/admin/import-serials`).<br>2. Hệ thống hiển thị giao diện nhập lô gồm: Chọn chi nhánh tiếp nhận, Chọn sản phẩm, Chọn biến thể SKU và khung nhập danh sách mã máy.<br>3. Quản lý chọn Chi nhánh tiếp nhận (được quyền chọn bất kỳ chi nhánh nào trong toàn chuỗi).<br>4. Quản lý tìm và chọn Sản phẩm cùng SKU tương ứng.<br>5. Quản lý dán danh sách mã Serial/IMEI (mỗi dòng một mã hoặc phân cách bởi dấu phẩy) vào khung văn bản `SerialParserTextarea`.<br>6. Hệ thống tự động phân tích (parse) danh sách, loại bỏ khoảng trắng thừa, đếm tổng số lượng hợp lệ, phát hiện các mã trùng lặp trong danh sách nhập.<br>7. Quản lý nhấn "Kiểm tra và Xem tóm tắt nhập lô".<br>8. Hệ thống hiển thị modal tóm tắt báo cáo: Số mã hợp lệ, số mã lỗi/trùng.<br>9. Quản lý nhấn "Xác nhận nhập kho".<br>10. Hệ thống gửi yêu cầu (`POST /api/v1/serials/import`), khởi tạo hàng loạt các Document trong bảng `serials` với `status: 'IN_STOCK'`, đồng thời chạy toán tử Atomic `$inc: { quantity: validCount }` trên bản ghi tồn kho của chi nhánh.<br>11. Hệ thống hiển thị thông báo thành công và xóa trắng form sẵn sàng cho đợt nhập tiếp theo. |
| **Kịch bản phụ** | 6.a. Trong danh sách dán vào có chứa các mã trùng lặp lẫn nhau:<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.1. Hệ thống tự động lọc các mã trùng, chỉ giữ lại một mã đại diện và hiển thị số lượng mã trùng bị loại trừ.<br>10.a. Tồn tại ít nhất một mã Serial đã có sẵn trong cơ sở dữ liệu hệ thống từ trước:<br>&nbsp;&nbsp;&nbsp;&nbsp;10.a.1. Cơ sở dữ liệu kích hoạt lỗi vi phạm ràng buộc Unique Index.<br>&nbsp;&nbsp;&nbsp;&nbsp;10.a.2. Hệ thống rollback giao dịch và báo lỗi chi tiết mã Serial bị xung đột dữ liệu để người dùng kiểm tra lại phiếu nhập hàng của nhà sản xuất. |

---

### Bảng 8. Đặc tả Use Case "Giám sát và điều phối đơn hàng B2C toàn chuỗi"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-AD08** |
| **Tên Use Case** | Giám sát và điều phối đơn hàng B2C toàn chuỗi (Order Dispatching & Allocation) |
| **Tác nhân** | Quản lý cấp cao (SUPER_ADMIN) |
| **Mô tả chức năng** | Cho phép Quản lý cấp cao theo dõi dòng đơn hàng đặt mua trực tuyến từ Storefront B2C trên phạm vi toàn chuỗi; giám sát đồng hồ đếm ngược thời hạn cam kết dịch vụ (SLA Counter: 2 giờ hoặc tiêu chuẩn); điều phối phân bổ đơn hàng về chi nhánh tối ưu có sẵn hàng; chỉ định gán Serial cho các đơn hàng chuẩn bị xuất kho giao cho đơn vị vận chuyển. |
| **Điều kiện tiên quyết** | - Quản lý cấp cao đã đăng nhập với vai trò `SUPER_ADMIN`.<br>- Có đơn hàng B2C trực tuyến phát sinh trong hệ thống. |
| **Yêu cầu** | - Hiển thị trực quan trạng thái đơn hàng (`PENDING`, `PROCESSING`, `READY_FOR_SHIPPING`, `COMPLETED`, `CANCELLED`).<br>- Cảnh báo trực quan các đơn hàng sắp hết hạn thời gian cam kết giao hàng (SLA Warning).<br>- Chỉ cho phép gán các mã Serial đang có trạng thái `IN_STOCK` tại chính chi nhánh được phân bổ xử lý đơn hàng. |
| **Kịch bản chính** | 1. Quản lý cấp cao truy cập vào menu "Điều Phối Đơn B2C" (`/portal/admin/orders-dispatch`).<br>2. Hệ thống hiển thị bảng các đơn hàng B2C đang chờ xử lý kèm thông tin: Mã đơn hàng, Tên khách hàng, SĐT, Địa chỉ giao nhận, Thời gian SLA còn lại, Hình thức giao nhận, Chi nhánh phụ trách và Trạng thái xử lý.<br>3. **Điều phối / Phân bổ chi nhánh xử lý:**<br>&nbsp;&nbsp;&nbsp;&nbsp;3.1. Đối với các đơn hàng chưa phân bổ hoặc chi nhánh chỉ định hết hàng, Quản lý nhấn "Phân bổ chi nhánh".<br>&nbsp;&nbsp;&nbsp;&nbsp;3.2. Hệ thống hiển thị modal gợi ý danh sách các chi nhánh có sẵn tồn kho cho các sản phẩm trong đơn.<br>&nbsp;&nbsp;&nbsp;&nbsp;3.3. Quản lý chọn chi nhánh phù hợp nhất và nhấn "Xác nhận phân bổ".<br>&nbsp;&nbsp;&nbsp;&nbsp;3.4. Hệ thống cập nhật đơn hàng sang trạng thái `PROCESSING` và gán mã chi nhánh phụ trách.<br>4. **Chỉ định Serial xuất kho:**<br>&nbsp;&nbsp;&nbsp;&nbsp;4.1. Quản lý mở thanh điều hướng gán Serial (`OrderSerialAssignDrawer`) cho đơn hàng đã sẵn sàng đóng gói.<br>&nbsp;&nbsp;&nbsp;&nbsp;4.2. Hệ thống tải danh sách các Serial `IN_STOCK` của chi nhánh tương ứng.<br>&nbsp;&nbsp;&nbsp;&nbsp;4.3. Quản lý chọn đủ số lượng Serial tương ứng với số lượng máy trong đơn hàng.<br>&nbsp;&nbsp;&nbsp;&nbsp;4.4. Quản lý nhấn "Xác nhận gán Serial & Chuyển giao vận chuyển".<br>&nbsp;&nbsp;&nbsp;&nbsp;4.5. Hệ thống chuyển đổi trạng thái Serial sang `RESERVED` / `SOLD`, cập nhật đơn hàng thành `READY_FOR_SHIPPING` và gửi thông báo sẵn sàng bàn giao shipper. |
| **Kịch bản phụ** | 3.a. Chi nhánh được chọn không còn đủ số lượng tồn kho khả dụng cho sản phẩm:<br>&nbsp;&nbsp;&nbsp;&nbsp;3.a.1. Hệ thống cảnh báo chi nhánh không đủ tồn kho và ngăn chặn việc phân bổ sai sót.<br>4.a. Gán thiếu hoặc thừa số lượng Serial so với số lượng đặt mua trong đơn:<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Hệ thống báo lỗi số lượng Serial không khớp và yêu cầu chọn chính xác 100% số lượng máy. |

---

### Bảng 9. Đặc tả Use Case "Khởi tạo và phê duyệt điều chuyển kho liên chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-AD09** |
| **Tên Use Case** | Khởi tạo và phê duyệt điều chuyển kho liên chi nhánh (Stock Transfer Management) |
| **Tác nhân** | Quản lý cấp cao (SUPER_ADMIN) |
| **Mô tả chức năng** | Cho phép Quản lý cấp cao khởi tạo lệnh điều chuyển thiết bị giữa hai chi nhánh bất kỳ trong chuỗi để cân đối tồn kho (cân bằng cung cầu); theo dõi trạng thái các lô hàng đang trên đường luân chuyển (`TRANSIT`); phê duyệt hoặc can thiệp xử lý các phiếu điều chuyển trên toàn quốc. |
| **Điều kiện tiên quyết** | - Quản lý cấp cao đã đăng nhập với vai trò `SUPER_ADMIN`.<br>- Tồn tại ít nhất 2 chi nhánh đang hoạt động trong hệ thống. |
| **Yêu cầu** | - Quản lý cấp cao có quyền toàn quyền (không bị giới hạn bởi middleware `scopeBranch`).<br>- Quá trình điều chuyển áp dụng nghiêm ngặt máy trạng thái thiết bị: Chuyển Serial từ `IN_STOCK` tại kho xuất sang trạng thái `TRANSIT`.<br>- Tồn kho của kho xuất bị trừ ngay lập tức khi lệnh xuất kho được tạo, đảm bảo không thể bán lặp lại thiết bị đang di chuyển trên đường. |
| **Kịch bản chính** | 1. Quản lý cấp cao truy cập vào trang "Điều Chuyển Kho" (`/portal/branch/transfers`).<br>2. Hệ thống hiển thị danh sách toàn bộ các phiếu điều chuyển kho trong chuỗi với hai tab: "Phiếu xuất kho chuyển đi" (Outbound) và "Phiếu tiếp nhận chuyển đến" (Inbound).<br>3. Quản lý cấp cao nhấn nút "Tạo phiếu điều chuyển mới".<br>4. Hệ thống mở modal tạo phiếu điều chuyển.<br>5. Quản lý cấp cao chọn Chi nhánh nguồn (Xuất hàng) và Chi nhánh đích (Nhận hàng).<br>6. Quản lý chọn Sản phẩm, SKU và nhập số lượng cần điều chuyển.<br>7. Hệ thống tự động lọc và hiển thị danh sách các mã Serial đang có trạng thái `IN_STOCK` tại chi nhánh nguồn.<br>8. Quản lý chọn các mã Serial cụ thể sẽ được đưa lên xe vận chuyển và nhập ghi chú lý do điều chuyển.<br>9. Quản lý nhấn "Tạo phiếu điều chuyển".<br>10. Hệ thống tạo phiếu điều chuyển mới trong bảng `stock_transfers` với trạng thái `IN_TRANSIT`, cập nhật trạng thái các Serial được chọn thành `TRANSIT`, và trừ số lượng tồn kho tương ứng tại chi nhánh nguồn qua toán tử Atomic `$inc: { quantity: -qty }`.<br>11. Hệ thống làm mới danh sách và hiển thị mã phiếu mới (dạng `TRF-XXXXXXXX`). |
| **Kịch bản phụ** | 5.a. Chi nhánh nguồn và Chi nhánh đích được chọn trùng nhau:<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.1. Hệ thống báo lỗi: "Chi nhánh nhận hàng phải khác chi nhánh gửi hàng".<br>8.a. Số lượng Serial được chọn không khớp với số lượng nhập ở ô số lượng điều chuyển:<br>&nbsp;&nbsp;&nbsp;&nbsp;8.a.1. Hệ thống thông báo lỗi: "Vui lòng chọn chính xác số lượng mã Serial tương ứng với số lượng điều chuyển". |

---

### Bảng 10. Đặc tả Use Case "Kiểm kê và điều chỉnh tồn kho thủ công đa chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-AD10** |
| **Tên Use Case** | Kiểm kê và điều chỉnh tồn kho thủ công đa chi nhánh (Manual Stock Adjustment) |
| **Tác nhân** | Quản lý cấp cao (SUPER_ADMIN) |
| **Mô tả chức năng** | Cho phép Quản lý cấp cao tra cứu tồn kho chi tiết của bất kỳ chi nhánh nào trong hệ thống và thực hiện điều chỉnh tăng/giảm số lượng tồn kho thủ công khi có biên bản kiểm kê định kỳ, hao hụt thực tế hoặc bù trừ chênh lệch số liệu. |
| **Điều kiện tiên quyết** | - Quản lý cấp cao đã đăng nhập với vai trò `SUPER_ADMIN`. |
| **Yêu cầu** | - Kiểm soát phân quyền chặt chẽ (`SUPER_ADMIN` hoặc `BRANCH_MANAGER`).<br>- Sử dụng toán tử Atomic Update của MongoDB để cập nhật trường `quantity` trong bảng `branch_inventories`.<br>- Bắt buộc phải ghi nhận lý do điều chỉnh để phục vụ hậu kiểm đối soát tài chính. |
| **Kịch bản chính** | 1. Quản lý cấp cao truy cập vào trang "Kho Chi Nhánh" (`/portal/inventory`).<br>2. Hệ thống hiển thị bộ chọn chi nhánh; Quản lý cấp cao chọn chi nhánh cần kiểm tra.<br>3. Hệ thống tải toàn bộ dữ liệu tồn kho của chi nhánh đó và hiển thị các chỉ số KPI: Tổng số lượng SKU, Tổng tồn kho thực tế, Cảnh báo SKU sắp hết hàng và Giá trị tồn kho ước tính.<br>4. Quản lý cấp cao tìm kiếm sản phẩm cần điều chỉnh tồn kho trong bảng dữ liệu.<br>5. Quản lý nhấn vào nút "Điều chỉnh tồn" tại dòng SKU tương ứng.<br>6. Hệ thống hiển thị modal điều chỉnh tồn kho (`StockAdjustModal`) hiển thị số lượng tồn hiện tại.<br>7. Quản lý nhập số lượng chênh lệch thay đổi (Delta: số dương để tăng kho, số âm để giảm kho) và nhập lý do điều chỉnh (ví dụ: "Kiểm kê thực tế định kỳ quý 3").<br>8. Quản lý nhấn "Lưu điều chỉnh".<br>9. Hệ thống gửi yêu cầu (`POST /api/v1/inventory/adjust`), thực thi cập nhật nguyên tử vào MongoDB và ghi nhận log điều chỉnh.<br>10. Hệ thống hiển thị thông báo thành công và cập nhật lại số liệu trên bảng tồn kho tức thì. |
| **Kịch bản phụ** | 7.a. Quản lý nhập số lượng giảm vượt quá số lượng tồn kho hiện tại (dẫn đến tồn kho âm):<br>&nbsp;&nbsp;&nbsp;&nbsp;7.a.1. Hệ thống chặn thao tác và thông báo lỗi: "Số lượng giảm vượt quá tồn kho khả dụng hiện tại".<br>7.b. Quản lý để trống lý do điều chỉnh:<br>&nbsp;&nbsp;&nbsp;&nbsp;7.b.1. Hệ thống yêu cầu bắt buộc nhập lý do điều chỉnh trước khi cho phép xác nhận. |

---

### Bảng 11. Đặc tả Use Case "Báo cáo phân tích doanh thu đa kênh và hiệu quả chuỗi"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-AD11** |
| **Tên Use Case** | Báo cáo phân tích doanh thu đa kênh và hiệu quả chuỗi (Omnichannel BI Analytics) |
| **Tác nhân** | Quản lý cấp cao (SUPER_ADMIN) |
| **Mô tả chức năng** | Cung cấp cho Quản lý cấp cao bảng điều khiển trực quan (Business Intelligence Dashboard) tổng hợp toàn diện các chỉ số kinh doanh toàn chuỗi: Doanh thu tổng, Số lượng đơn hàng, Giá trị trung bình đơn hàng (AOV), Biểu đồ doanh thu theo thời gian, Tỷ trọng doanh thu đa kênh (Web POS tại quầy vs Storefront B2C trực tuyến), Bảng xếp hạng doanh thu giữa các chi nhánh và Top sản phẩm bán chạy nhất. |
| **Điều kiện tiên quyết** | - Quản lý cấp cao đã đăng nhập với vai trò `SUPER_ADMIN`. |
| **Yêu cầu** | - Dữ liệu thống kê được tổng hợp thời gian thực từ cơ sở dữ liệu đơn hàng.<br>- Hỗ trợ bộ lọc thời gian linh hoạt (theo ngày, tuần, tháng, quý) và bộ lọc theo chi nhánh cụ thể hoặc toàn chuỗi.<br>- Hiển thị biểu đồ trực quan, rõ ràng, hỗ trợ việc ra quyết định kinh doanh. |
| **Kịch bản chính** | 1. Quản lý cấp cao chọn mục "Báo Cáo Doanh Thu" (`/portal/admin/analytics`).<br>2. Hệ thống tải dữ liệu phân tích và hiển thị giao diện báo cáo tổng hợp.<br>3. Hệ thống hiển thị lưới thẻ chỉ số KPI kinh doanh: Doanh thu thuần, Số đơn hàng thành công, Giá trị trung bình một đơn (AOV) và Tỷ lệ hoàn đơn/đổi trả.<br>4. Quản lý cấp cao có thể tùy chọn thay đổi khoảng thời gian đối soát hoặc chọn lọc xem dữ liệu riêng của một chi nhánh cụ thể thông qua thanh công cụ lọc.<br>5. Hệ thống vẽ biểu đồ đường xu hướng doanh thu theo các mốc thời gian (`RevenueChart`).<br>6. Hệ thống hiển thị biểu đồ tròn phân tích tỷ trọng kênh bán hàng (`ChannelBreakdownPie`): Tỷ lệ phần trăm doanh thu đến từ POS cửa hàng và Online B2C.<br>7. Hệ thống hiển thị bảng xếp hạng hiệu quả hoạt động của từng chi nhánh (`BranchSalesBreakdown`) xếp theo thứ tự doanh thu từ cao xuống thấp kèm tỷ lệ tăng trưởng.<br>8. Hệ thống hiển thị bảng thống kê danh mục các sản phẩm đóng góp doanh số cao nhất toàn chuỗi (`TopProductsTable`). |
| **Kịch bản phụ** | 4.a. Khoảng thời gian được chọn không phát sinh đơn hàng nào:<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Hệ thống hiển thị các chỉ số bằng 0 và biểu đồ ở trạng thái rỗng kèm thông báo trực quan "Không có dữ liệu phát sinh trong khoảng thời gian này". |

---

### Bảng 12. Đặc tả Use Case "Đăng xuất khỏi hệ thống quản trị"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-AD12** |
| **Tên Use Case** | Đăng xuất khỏi hệ thống quản trị (Logout & Global Revoke) |
| **Tác nhân** | Quản lý cấp cao (SUPER_ADMIN) |
| **Mô tả chức năng** | Cho phép Quản lý cấp cao chấm dứt phiên làm việc trên thiết bị hiện tại hoặc hủy bỏ toàn bộ tất cả các phiên đăng nhập đang hoạt động trên mọi thiết bị khác (Global Logout), xóa Refresh Token trong cơ sở dữ liệu và chuyển hướng an toàn về trang đăng nhập. |
| **Điều kiện tiên quyết** | - Quản lý cấp cao đang trong trạng thái đăng nhập vào hệ thống. |
| **Yêu cầu** | - Thu hồi và xóa bỏ bản ghi phiên trong collection `user_sessions` tương ứng với Refresh Token của máy hiện tại.<br>- Xóa bỏ HttpOnly Cookie trên trình duyệt của người dùng.<br>- Ngăn chặn hoàn toàn việc tái sử dụng Access Token cũ bằng cách xóa sạch token trong bộ nhớ RAM của ứng dụng React. |
| **Kịch bản chính** | 1. Quản lý cấp cao nhấn vào biểu tượng Đăng xuất tại góc dưới thanh điều hướng (Sidebar Footer).<br>2. Hệ thống gửi yêu cầu đăng xuất (`POST /api/v1/auth/logout`) tới máy chủ Backend.<br>3. Máy chủ tìm và xóa bản ghi phiên tương ứng trong bảng `user_sessions` và gửi lệnh xóa HttpOnly Cookie.<br>4. Client xóa thông tin người dùng và token trong Redux Store (`dispatch(logout())`).<br>5. Hệ thống chuyển hướng người dùng về màn hình đăng nhập (`/login`).<br>6. Quản lý cấp cao không thể dùng nút "Back" của trình duyệt để quay lại các trang quản trị được bảo vệ. |
| **Kịch bản phụ** | 1.a. Quản lý cấp cao nghi ngờ lộ mật khẩu và chọn tính năng "Đăng xuất trên tất cả các thiết bị" (`POST /api/v1/auth/logout-all`):<br>&nbsp;&nbsp;&nbsp;&nbsp;1.a.1. Máy chủ xóa sạch toàn bộ các bản ghi phiên thuộc về tài khoản này trong bảng `user_sessions`.<br>&nbsp;&nbsp;&nbsp;&nbsp;1.a.2. Tất cả các thiết bị/trình duyệt khác đang đăng nhập tài khoản này sẽ lập tức bị thu hồi quyền truy cập. |
