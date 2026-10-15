# TÀI LIỆU ĐẶC TẢ USE CASE HỆ THỐNG MERN-TECH-ECOMMERCE
## PHÂN HỆ: NGƯỜI DÙNG / KHÁCH HÀNG (CUSTOMER / STOREFRONT B2C)

---

### Bảng 1. Đặc tả Use Case "Đăng ký tài khoản khách hàng mới"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-CU01** |
| **Tên Use Case** | Đăng ký tài khoản khách hàng mới (Customer Registration) |
| **Tác nhân** | Người dùng (CUSTOMER / Khách vãng lai) |
| **Mô tả chức năng** | Cho phép khách hàng cá nhân tạo tài khoản thành viên mới trên website TechOne Storefront để lưu trữ lịch sử mua sắm, nhận thông báo tiến độ đơn hàng và theo dõi thông tin bảo hành điện tử. |
| **Điều kiện tiên quyết** | - Khách hàng chưa có tài khoản trên hệ thống hoặc sử dụng thông tin định danh mới chưa từng đăng ký.<br>- Người dùng có thiết bị truy cập internet. |
| **Yêu cầu** | - Người dùng truy cập trang đăng ký (`/register`).<br>- Họ và tên, Email, Số điện thoại và Mật khẩu là các trường bắt buộc.<br>- Validate số điện thoại chuẩn Việt Nam (10 chữ số).<br>- Validate định dạng email chuẩn RFC.<br>- Kiểm tra mật khẩu (tối thiểu 6 ký tự, bao gồm chữ và số) kèm thanh đo độ mạnh mật khẩu (Password Strength Indicator).<br>- Kiểm tra xác nhận mật khẩu trùng khớp (`confirmPassword`).<br>- Chặn hành vi tiêm quyền hạn (Role Injection): Hệ thống ép buộc gán cứng vai trò `role: CUSTOMER` qua Zod `.strict()`. |
| **Kịch bản chính** | 1. Người dùng truy cập vào website và bấm vào nút "Đăng ký" trên thanh điều hướng hoặc truy cập trực tiếp đường dẫn `/register`.<br>2. Hệ thống hiển thị biểu mẫu đăng ký tài khoản.<br>3. Người dùng nhập: Họ và tên, Số điện thoại, Email, Mật khẩu và Nhập lại mật khẩu.<br>4. Hệ thống hiển thị thanh trực quan đánh giá độ mạnh của mật khẩu theo thời gian thực.<br>5. Người dùng tích chọn đồng ý "Điều khoản dịch vụ và Chính sách bảo mật".<br>6. Người dùng nhấn nút "Tạo tài khoản".<br>7. Hệ thống gửi yêu cầu (`POST /api/v1/auth/register`) tới máy chủ.<br>8. Máy chủ xác thực tính hợp lệ của dữ liệu, kiểm tra Email và SĐT không bị trùng lặp, mã hóa mật khẩu qua `bcryptjs` và lưu bản ghi vào bảng `users` với vai trò `CUSTOMER`.<br>9. Hệ thống tự động thiết lập phiên làm việc dài hạn (14 ngày), cấp mã token và trả về thông tin người dùng.<br>10. Hệ thống hiển thị thông báo "Đăng ký tài khoản thành công" và tự động điều hướng người dùng về Trang chủ (`/`) ở trạng thái đã đăng nhập. |
| **Kịch bản phụ** | 3.a. Người dùng nhập mật khẩu xác nhận không khớp với mật khẩu ban đầu:<br>&nbsp;&nbsp;&nbsp;&nbsp;3.a.1. Hệ thống báo lỗi "Mật khẩu xác nhận không trùng khớp" ngay dưới trường nhập liệu.<br>8.a. Email hoặc Số điện thoại đã được đăng ký bởi tài khoản khác trong hệ thống:<br>&nbsp;&nbsp;&nbsp;&nbsp;8.a.1. Hệ thống phản hồi mã lỗi `EMAIL_ALREADY_EXISTS` hoặc `PHONE_ALREADY_EXISTS` (HTTP 409).<br>&nbsp;&nbsp;&nbsp;&nbsp;8.a.2. Hệ thống hiển thị thông báo "Email hoặc Số điện thoại này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng thông tin khác".<br>8.b. Người dùng cố tình gửi kèm tham số `role: 'SUPER_ADMIN'` trong payload HTTP:<br>&nbsp;&nbsp;&nbsp;&nbsp;8.b.1. Middleware xác thực Zod chặn đứng và từ chối xử lý, bảo đảm an ninh hệ thống. |

---

### Bảng 2. Đặc tả Use Case "Đăng nhập tài khoản khách hàng"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-CU02** |
| **Tên Use Case** | Đăng nhập tài khoản khách hàng (Customer Login) |
| **Tác nhân** | Người dùng (CUSTOMER) |
| **Mô tả chức năng** | Cho phép khách hàng đã có tài khoản thực hiện đăng nhập vào hệ thống để tiếp tục giỏ hàng, xem đơn hàng cá nhân và thanh toán thuận tiện. |
| **Điều kiện tiên quyết** | - Tài khoản khách hàng đã được đăng ký thành công trong hệ thống.<br>- Tài khoản đang ở trạng thái hoạt động (`isActive: true`). |
| **Yêu cầu** | - Truy cập trang đăng nhập `/login`.<br>- Hỗ trợ đăng nhập linh hoạt bằng Email hoặc Số điện thoại đã đăng ký.<br>- Thời hạn phiên làm việc dành cho khách hàng là 14 ngày (kèm Refresh Token dài hạn lưu trong HttpOnly Cookie).<br>- Tự động kích hoạt cơ chế bảo vệ chống vét cạn mật khẩu (`authRateLimiter`). |
| **Kịch bản chính** | 1. Người dùng bấm vào biểu tượng hoặc nút "Đăng nhập" tại Header trang web.<br>2. Hệ thống chuyển sang màn hình đăng nhập (`/login`).<br>3. Người dùng nhập Email hoặc Số điện thoại và Mật khẩu.<br>4. Người dùng có thể tích chọn "Ghi nhớ đăng nhập".<br>5. Người dùng nhấn nút "Đăng nhập".<br>6. Hệ thống gửi yêu cầu xác thực (`POST /api/v1/auth/login`).<br>7. Máy chủ kiểm tra định danh và mật khẩu trong bảng `users`.<br>8. Thông tin chính xác, máy chủ tạo bản ghi phiên 14 ngày trong `user_sessions`, cấp Access Token trong Redux RAM và thiết lập HttpOnly Cookie chứa Refresh Token.<br>9. Hệ thống nhận diện vai trò `CUSTOMER` và điều hướng người dùng về Trang chủ hoặc trang mà người dùng đang truy cập dở trước đó.<br>10. Header cập nhật hiển thị tên khách hàng và menu tài khoản cá nhân. |
| **Kịch bản phụ** | 3.a. Người dùng bấm vào nút hiển thị để kiểm tra mật khẩu đã gõ.<br>7.a. Nhập sai định danh hoặc mật khẩu:<br>&nbsp;&nbsp;&nbsp;&nbsp;7.a.1. Hệ thống báo lỗi "Email/Số điện thoại hoặc mật khẩu không chính xác".<br>&nbsp;&nbsp;&nbsp;&nbsp;7.a.2. Yêu cầu người dùng kiểm tra lại thông tin.<br>7.b. Người dùng nhập sai quá 5 lần liên tiếp trong 15 phút:<br>&nbsp;&nbsp;&nbsp;&nbsp;7.b.1. Hệ thống tạm khóa quyền thử đăng nhập và yêu cầu chờ 15 phút.<br>7.c. Người dùng quên mật khẩu:<br>&nbsp;&nbsp;&nbsp;&nbsp;7.c.1. Người dùng bấm vào liên kết "Quên mật khẩu?" để chuyển sang màn hình khôi phục mật khẩu. |

---

### Bảng 3. Đặc tả Use Case "Khôi phục và đặt lại mật khẩu"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-CU03** |
| **Tên Use Case** | Khôi phục và đặt lại mật khẩu (Password Recovery & Reset) |
| **Tác nhân** | Người dùng (CUSTOMER) |
| **Mô tả chức năng** | Cho phép người dùng lấy lại quyền truy cập tài khoản khi bị quên mật khẩu thông qua việc yêu cầu mã đặt lại mật khẩu gửi về email và tiến hành tạo mật khẩu mới. |
| **Điều kiện tiên quyết** | - Tài khoản người dùng có tồn tại trong hệ thống và có địa chỉ email hợp lệ. |
| **Yêu cầu** | - Màn hình yêu cầu khôi phục (`/forgot-password`) và màn hình đổi mật khẩu mới (`/reset-password?token=...`).<br>- Tuân thủ chuẩn an toàn thông tin: Không trả về mã `resetToken` trong phản hồi JSON response của API (ngăn ngừa lộ token qua network inspect).<br>- Token khôi phục mật khẩu có thời hạn hết hạn ngắn (15-30 phút). |
| **Kịch bản chính** | 1. Người dùng tại trang đăng nhập bấm vào liên kết "Quên mật khẩu?".<br>2. Hệ thống chuyển sang trang Quên mật khẩu (`/forgot-password`).<br>3. Người dùng nhập địa chỉ Email hoặc Số điện thoại đã dùng để đăng ký tài khoản.<br>4. Người dùng nhấn nút "Gửi liên kết xác thực".<br>5. Hệ thống gửi yêu cầu (`POST /api/v1/auth/forgot-password`).<br>6. Máy chủ tạo mã xác thực băm an toàn, lưu thời gian hết hạn vào trường `passwordResetExpires` và gửi email chứa đường dẫn đặt lại mật khẩu tới hộp thư người dùng.<br>7. Hệ thống hiển thị hộp thông báo hướng dẫn: "Nếu thông tin khớp với hệ thống, một hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư đến".<br>8. Người dùng mở email và nhấn vào đường link xác thực (chuyển hướng đến `/reset-password?token=XYZ`).<br>9. Giao diện Đặt lại mật khẩu tự động kiểm tra token trên URL.<br>10. Người dùng nhập Mật khẩu mới và Nhập lại mật khẩu mới.<br>11. Người dùng nhấn "Cập nhật mật khẩu mới".<br>12. Máy chủ kiểm tra token hợp lệ và còn hạn, tiến hành băm mật khẩu mới bằng `bcryptjs`, cập nhật vào tài khoản và xóa token khôi phục.<br>13. Hệ thống hiển thị thông báo "Mật khẩu đã được thay đổi thành công" và tự động chuyển về trang đăng nhập. |
| **Kịch bản phụ** | 8.a. Người dùng truy cập đường dẫn khi mã token đã hết hạn hoặc không hợp lệ:<br>&nbsp;&nbsp;&nbsp;&nbsp;8.a.1. Hệ thống báo lỗi: "Đường dẫn đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu lại".<br>10.a. Mật khẩu mới nhập không đủ độ dài hoặc xác nhận mật khẩu không khớp:<br>&nbsp;&nbsp;&nbsp;&nbsp;10.a.1. Hệ thống hiển thị cảnh báo lỗi và yêu cầu chỉnh sửa lại. |

---

### Bảng 4. Đặc tả Use Case "Xem trang chủ và tìm kiếm sản phẩm theo từ khóa"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-CU04** |
| **Tên Use Case** | Xem trang chủ và tìm kiếm sản phẩm (Storefront Homepage & Search) |
| **Tác nhân** | Người dùng (CUSTOMER / Khách vãng lai) |
| **Mô tả chức năng** | Cho phép người dùng truy cập vào trang chủ website TechOne để khám phá các sản phẩm công nghệ mới nhất, các chương trình ưu đãi, chọn nhanh chi nhánh gần nhất và tìm kiếm sản phẩm tức thì qua thanh tìm kiếm thông minh có cơ chế gợi ý tự động (Auto-suggest). |
| **Điều kiện tiên quyết** | - Người dùng có trình duyệt web và kết nối Internet. |
| **Yêu cầu** | - Tốc độ tải trang nhanh ($T_{load} < 1.5s$) đáp ứng các tiêu chuẩn Core Web Vitals.<br>- Giao diện chuẩn Responsive tối ưu mượt mà trên cả máy tính để bàn và điện thoại di động.<br>- Tìm kiếm không phân biệt chữ hoa, chữ thường và hỗ trợ tiếng Việt có dấu/không dấu. |
| **Kịch bản chính** | 1. Người dùng mở trình duyệt và truy cập vào địa chỉ website (`/`).<br>2. Hệ thống hiển thị trang chủ gồm các phân vùng:<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Thanh Header: Logo thương hiệu, Thanh tìm kiếm, Dropdown chọn chi nhánh gần bạn, Tra cứu bảo hành và Nút Giỏ hàng.<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Hero Banner Carousel: Giới thiệu các chương trình và sản phẩm công nghệ tâm điểm.<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Lưới danh mục sản phẩm nổi bật (Laptop, Điện thoại, Màn hình, Phụ kiện).<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Danh sách sản phẩm mới về và bán chạy nhất.<br>3. **Chọn chi nhánh mua hàng:** Người dùng bấm vào dropdown chi nhánh tại Header để chọn cửa hàng mình dự định ghé thăm hoặc cho phép định vị GPS tìm chi nhánh gần nhất.<br>4. **Tìm kiếm sản phẩm:**<br>&nbsp;&nbsp;&nbsp;&nbsp;4.1. Người dùng gõ từ khóa vào thanh tìm kiếm (ví dụ: "MacBook", "RTX 4060").<br>&nbsp;&nbsp;&nbsp;&nbsp;4.2. Hệ thống gọi API tìm kiếm và hiển thị danh sách kết quả phù hợp kèm hình ảnh và giá bán.<br>&nbsp;&nbsp;&nbsp;&nbsp;4.3. Người dùng nhấn phím `Enter` hoặc bấm vào một sản phẩm gợi ý.<br>&nbsp;&nbsp;&nbsp;&nbsp;4.4. Hệ thống chuyển hướng người dùng đến trang kết quả tìm kiếm hoặc trang chi tiết sản phẩm. |
| **Kịch bản phụ** | 4.a. Từ khóa tìm kiếm không trả về kết quả nào:<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Hệ thống hiển thị thông báo "Không tìm thấy sản phẩm phù hợp với từ khóa '[từ khóa]'" kèm gợi ý các dòng sản phẩm liên quan khác. |

---

### Bảng 5. Đặc tả Use Case "Duyệt danh mục và lọc sản phẩm theo thuộc tính kỹ thuật động"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-CU05** |
| **Tên Use Case** | Duyệt danh mục và lọc sản phẩm theo thuộc tính động (Category & Dynamic Specs Filter) |
| **Tác nhân** | Người dùng (CUSTOMER / Khách vãng lai) |
| **Mô tả chức năng** | Cho phép người dùng duyệt sản phẩm theo từng nhóm ngành hàng và sử dụng bộ lọc thông số kỹ thuật động (Dynamic Attributes Filter) được sinh tự động theo đặc thù ngành hàng (ví dụ: chọn Laptop lọc theo CPU, RAM, VGA; chọn Màn hình lọc theo Tần số quét, Kích thước) để nhanh chóng tìm thấy thiết bị khớp nhu cầu. |
| **Điều kiện tiên quyết** | - Người dùng truy cập trang danh mục sản phẩm (`/category/:slug`). |
| **Yêu cầu** | - Bộ lọc tự động render dựa trên danh sách `attributeKeys` của danh mục từ MongoDB.<br>- Thực thi lọc dữ liệu từ phía máy chủ (Server-side Filtering) thông qua toán tử `$all` và `$elemMatch` trên chỉ mục đa khóa (Multikey Index), bảo đảm thời gian phản hồi $T_{avg} < 200ms$.<br>- Hỗ trợ kết hợp nhiều tiêu chí: Thương hiệu (Brand), Khoảng giá, Sắp xếp (Giá tăng/giảm, Mới nhất) và Phân trang chuẩn. |
| **Kịch bản chính** | 1. Người dùng chọn một ngành hàng từ menu (ví dụ: "Laptop" tại `/category/laptop`).<br>2. Hệ thống hiển thị trang danh mục gồm thanh Sidebar bộ lọc bên trái và lưới danh sách sản phẩm bên phải.<br>3. Hệ thống tự động phân tích thuộc tính của danh mục và hiển thị các hộp kiểm lọc tương ứng:<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Lọc Thương hiệu: Apple, Dell, Asus, Lenovo...<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Lọc Cấu hình kỹ thuật: CPU (M4, Core i7...), RAM (16GB, 32GB...), Card đồ họa, Dung lượng ổ cứng.<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Lọc Khoảng giá: Dưới 15 triệu, 15 - 25 triệu, Trên 25 triệu.<br>4. Người dùng tích chọn một hoặc nhiều tiêu chí (ví dụ: Chọn Hãng "Apple" và RAM "16GB").<br>5. Hệ thống gửi query tham số động (`GET /api/v1/products?category=laptop&brand=Apple&ram=16GB`).<br>6. Máy chủ thực thi truy vấn tối ưu và trả về danh sách sản phẩm thỏa mãn tất cả các điều kiện.<br>7. Giao diện cập nhật lại lưới thẻ sản phẩm và cập nhật tổng số lượng kết quả tìm thấy.<br>8. Người dùng có thể thay đổi cách sắp xếp (ví dụ xếp theo giá từ thấp đến cao) hoặc chuyển trang nếu có nhiều trang kết quả. |
| **Kịch bản phụ** | 4.a. Kết hợp các bộ lọc quá hẹp dẫn đến không có sản phẩm nào thỏa mãn:<br>&nbsp;&nbsp;&nbsp;&nbsp;4.a.1. Hệ thống hiển thị thông báo "Không có sản phẩm nào khớp với bộ lọc bạn đã chọn" kèm nút "Xóa tất cả bộ lọc" để người dùng thiết lập lại từ đầu. |

---

### Bảng 6. Đặc tả Use Case "Xem chi tiết sản phẩm và kiểm tra tồn kho đa chi nhánh"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-CU06** |
| **Tên Use Case** | Xem chi tiết sản phẩm và kiểm tra tồn kho đa chi nhánh (PDP & Multi-branch Stock) |
| **Tác nhân** | Người dùng (CUSTOMER / Khách vãng lai) |
| **Mô tả chức năng** | Cho phép người dùng xem thông tin toàn diện về thiết bị: bộ sưu tập ảnh, bảng thông số kỹ thuật chi tiết; linh hoạt chọn các tùy chọn cấu hình biến thể SKU (màu sắc, bộ nhớ) để xem giá bán thay đổi tương ứng; đặc biệt là hộp tra cứu tồn kho thực tế đa chi nhánh (Multi-Branch Inventory Box) hiển thị trực quan trạng thái còn hàng/hết hàng tại từng cửa hàng cụ thể để hỗ trợ trải nghiệm mua sắm Click & Collect. |
| **Điều kiện tiên quyết** | - Người dùng truy cập trang chi tiết một sản phẩm (`/product/:slug`). |
| **Yêu cầu** | - Hiển thị giá niêm yết, giá khuyến mãi và số tiền tiết kiệm được.<br>- Cơ chế so khớp biến thể SKU chính xác 100% qua `productAdapter`.<br>- Tra cứu tồn kho đa chi nhánh theo thời gian thực (API `GET /api/v1/inventory/sku/:productSkuId`).<br>- Phân biệt 3 trạng thái tồn kho bằng màu sắc trực quan: Còn hàng (Xanh lá), Sắp hết hàng (Cam), Hết hàng (Xám). |
| **Kịch bản chính** | 1. Người dùng bấm vào một sản phẩm từ trang chủ hoặc trang danh mục.<br>2. Hệ thống tải dữ liệu và mở trang Chi tiết sản phẩm (Product Detail Page - PDP).<br>3. Người dùng xem hình ảnh sản phẩm chất lượng cao qua bộ trình chiếu ảnh (Image Gallery).<br>4. Người dùng xem bảng ma trận thông số kỹ thuật đầy đủ của thiết bị.<br>5. **Chọn biến thể cấu hình:**<br>&nbsp;&nbsp;&nbsp;&nbsp;5.1. Người dùng chọn các tùy chọn biến thể (ví dụ chọn Màu sắc: "Sa mạc tự nhiên", Dung lượng: "256GB").<br>&nbsp;&nbsp;&nbsp;&nbsp;5.2. Hệ thống so khớp và xác định mã SKU tương ứng, cập nhật giá bán mới nhất của biến thể.<br>6. **Kiểm tra tình trạng hàng tại các cửa hàng vật lý:**<br>&nbsp;&nbsp;&nbsp;&nbsp;6.1. Hộp thông tin tồn kho đa chi nhánh (`Multi-Branch Inventory Box`) tự động nạp dữ liệu tồn kho của mã SKU vừa chọn.<br>&nbsp;&nbsp;&nbsp;&nbsp;6.2. Hệ thống liệt kê danh sách toàn bộ các cửa hàng kèm trạng thái kho thực tế:<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;* Chi nhánh Q1: Còn 3 máy (Xanh) -> Có nút `[ĐẶT GIỮ TẠI CỬA HÀNG]`.<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;* Chi nhánh Thủ Đức: Còn 1 máy (Cam).<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;* Chi nhánh Q5: Tạm hết hàng (Xám).<br>7. **Thực hiện hành động mua:**<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Lựa chọn 1: Bấm nút "THÊM VÀO GIỎ HÀNG" để tiếp tục xem các sản phẩm khác.<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Lựa chọn 2: Bấm nút "MUA NGAY - GIAO TẬN NƠI" để chuyển thẳng đến màn hình thanh toán.<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Lựa chọn 3: Bấm nút "ĐẶT GIỮ HÀNG (Click & Collect)" để chọn cửa hàng gần nhất ghé nhận máy. |
| **Kịch bản phụ** | 5.a. Biến thể SKU được chọn đã hết hàng trên toàn hệ thống tất cả các chi nhánh:<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.1. Hộp tồn kho hiển thị "Tạm thời hết hàng trên toàn hệ thống".<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.2. Nút "Mua ngay" chuyển sang trạng thái bị vô hiệu hóa kèm nhãn "Hết hàng". |

---

### Bảng 7. Đặc tả Use Case "So sánh thông số kỹ thuật giữa các sản phẩm"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-CU07** |
| **Tên Use Case** | So sánh thông số kỹ thuật giữa các sản phẩm (Specs Comparison Matrix) |
| **Tác nhân** | Người dùng (CUSTOMER / Khách vãng lai) |
| **Mô tả chức năng** | Cho phép người dùng chọn từ 2 đến 4 sản phẩm công nghệ cùng ngành hàng để đặt lên bảng so sánh đối đầu trực quan; hệ thống hiển thị ma trận thuộc tính đối chiếu từng dòng thông số (CPU, RAM, Pin, Màn hình...) và hỗ trợ nút gạt tự động tô màu làm nổi bật các điểm khác biệt giữa các dòng máy. |
| **Điều kiện tiên quyết** | - Người dùng truy cập trang so sánh (`/compare`) hoặc nhấn nút so sánh từ trang danh mục/chi tiết. |
| **Yêu cầu** | - Bảng so sánh đa chiều: Cột là sản phẩm, hàng là các thuộc tính kỹ thuật trích xuất từ MongoDB Dynamic Schema.<br>- Tích hợp công tắc "Làm nổi bật điểm khác biệt" (Highlight Differences Switch). |
| **Kịch bản chính** | 1. Người dùng bấm biểu tượng "So sánh" tại các sản phẩm quan tâm (hoặc chọn 2 sản phẩm từ thanh tìm kiếm trang so sánh).<br>2. Hệ thống chuyển sang màn hình "So sánh cấu hình" (`/compare?ids=prod1,prod2`).<br>3. Bảng ma trận so sánh hiển thị trực quan các cột đại diện cho từng sản phẩm: Ảnh sản phẩm, Tên máy, Giá bán, Nút mua ngay.<br>4. Dưới mỗi cột là danh sách đối chiếu từng thuộc tính kỹ thuật tương ứng theo từng dòng.<br>5. Người dùng gạt công tắc "Chỉ xem điểm khác biệt".<br>6. Hệ thống tự động so khớp giá trị của từng dòng thuộc tính; các hàng có giá trị khác nhau giữa các máy sẽ được tô màu nền nổi bật để người dùng dễ dàng nhận biết.<br>7. Sau khi cân nhắc xong, người dùng có thể bấm trực tiếp nút "Chọn mua" tại sản phẩm ưng ý nhất để đưa vào giỏ hàng. |
| **Kịch bản phụ** | 1.a. Người dùng chỉ chọn 1 sản phẩm vào trang so sánh:<br>&nbsp;&nbsp;&nbsp;&nbsp;1.a.1. Hệ thống hiển thị sản phẩm đã chọn ở cột 1 và hiển thị khung chọn trống ở cột 2 kèm thanh tìm kiếm "Thêm sản phẩm để so sánh". |

---

### Bảng 8. Đặc tả Use Case "Tra cứu thông tin bảo hành điện tử công khai"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-CU08** |
| **Tên Use Case** | Tra cứu thông tin bảo hành điện tử công khai (Public e-Warranty Lookup) |
| **Tác nhân** | Người dùng (CUSTOMER / Khách vãng lai) |
| **Mô tả chức năng** | Cho phép bất kỳ khách hàng nào đã từng mua sản phẩm tại TechOne có thể tự do tra cứu thời hạn và tình trạng bảo hành điện tử của thiết bị bằng cách nhập mã Serial/IMEI in trên thân máy mà không cần phải mang giấy tờ bảo hành vật lý. |
| **Điều kiện tiên quyết** | - Khách hàng có mã Serial hoặc số IMEI của thiết bị cần tra cứu. |
| **Yêu cầu** | - Endpoint công khai không yêu cầu đăng nhập (`GET /api/v1/serials/verify/:serialNumber`).<br>- Tốc độ phản hồi cực nhanh ($T_{query} < 300ms$), sử dụng `.lean()`.<br>- Đảm bảo quyền riêng tư người dùng: Tuyệt đối không hiển thị công khai thông tin cá nhân (SĐT, tên khách hàng), chỉ hiển thị thông tin máy và thời hạn bảo hành. |
| **Kịch bản chính** | 1. Người dùng truy cập vào trang "Tra Cứu Bảo Hành" (`/warranty-check`) từ menu trên Header.<br>2. Hệ thống hiển thị thanh tra cứu bảo hành trung tâm.<br>3. Người dùng nhập mã SerialNumber hoặc số IMEI của thiết bị vào ô tìm kiếm.<br>4. Người dùng nhấn nút "Kiểm tra bảo hành".<br>5. Hệ thống gửi yêu cầu kiểm tra lên máy chủ.<br>6. Máy chủ truy vấn bảng `serials`, tìm kiếm mã máy đã bán.<br>7. Máy chủ đối soát thời gian hiện tại với ngày hết hạn `warrantyEndDate` để xác định cờ `isExpired`.<br>8. Hệ thống hiển thị thẻ kết quả tra cứu bảo hành (`WarrantyResultCard`) gồm:<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Tên thiết bị công nghệ và biến thể SKU.<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Huy hiệu trạng thái: "Còn hạn bảo hành" (Màu xanh lá) hoặc "Hết hạn bảo hành" (Màu xám/đỏ).<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Ngày kích hoạt mua hàng.<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Ngày hết hạn bảo hành chính hãng.<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Lịch sử tiếp nhận bảo hành của thiết bị (nếu từng có phiếu sửa chữa). |
| **Kịch bản phụ** | 3.a. Người dùng để trống ô nhập liệu và nhấn kiểm tra:<br>&nbsp;&nbsp;&nbsp;&nbsp;3.a.1. Hệ thống nhắc nhở "Vui lòng nhập mã Serial hoặc số IMEI của máy".<br>6.a. Mã Serial nhập vào không có trong hệ thống:<br>&nbsp;&nbsp;&nbsp;&nbsp;6.a.1. Hệ thống hiển thị thông báo "Không tìm thấy thông tin bảo hành cho mã thiết bị này. Vui lòng kiểm tra lại mã in trên thân máy hoặc liên hệ hotline hỗ trợ". |

---

### Bảng 9. Đặc tả Use Case "Quản lý giỏ hàng mua sắm trực tuyến"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-CU09** |
| **Tên Use Case** | Quản lý giỏ hàng mua sắm trực tuyến (Online Cart Management) |
| **Tác nhân** | Người dùng (CUSTOMER / Khách vãng lai) |
| **Mô tả chức năng** | Cho phép người dùng theo dõi và điều chỉnh các mặt hàng đã chọn mua trong giỏ hàng: xem danh sách SKU, tăng giảm số lượng mua, xóa từng món hoặc xóa toàn bộ giỏ hàng, chọn chi nhánh phục vụ và xem tổng tiền thanh toán dự kiến. |
| **Điều kiện tiên quyết** | - Người dùng truy cập trang Giỏ hàng (`/cart`). |
| **Yêu cầu** | - Dữ liệu giỏ hàng được đồng bộ và quản lý trạng thái an toàn qua Redux Store (`cartSlice`).<br>- Mỗi mặt hàng lưu trữ đầy đủ: `productId`, `productSkuId`, `sku`, `price`, `image`, `quantity`, `options`.<br>- Tự động tính toán lại thành tiền và tổng thanh toán khi thay đổi số lượng. |
| **Kịch bản chính** | 1. Người dùng bấm vào biểu tượng Giỏ hàng tại góc phải Header.<br>2. Hệ thống chuyển hướng đến trang Giỏ hàng (`/cart`).<br>3. Bảng hiển thị danh sách các thiết bị đã chọn: Hình ảnh, Tên sản phẩm, Biến thể cấu hình đã chọn, Đơn giá, Bộ nút điều chỉnh số lượng và Thành tiền.<br>4. **Điều chỉnh số lượng:** Người dùng bấm nút (+) hoặc (-) tại từng dòng; hệ thống cập nhật số lượng và tính lại tổng tiền ngay lập tức.<br>5. **Xóa sản phẩm:** Người dùng nhấn vào biểu tượng thùng rác tại món hàng không muốn mua; hệ thống loại bỏ sản phẩm khỏi giỏ hàng.<br>6. **Chọn chi nhánh nhận/xử lý hàng:** Người dùng chọn chi nhánh gần nhất từ danh sách dropdown chi nhánh.<br>7. Khung tổng kết đơn hàng bên phải hiển thị: Tạm tính, Phí vận chuyển (Miễn phí), Tổng thanh toán cuối cùng.<br>8. Người dùng nhấn nút "TIẾN HÀNH ĐẶT HÀNG" để mở luồng thanh toán. |
| **Kịch bản phụ** | 3.a. Giỏ hàng chưa có sản phẩm nào (giỏ hàng rỗng):<br>&nbsp;&nbsp;&nbsp;&nbsp;3.a.1. Hệ thống hiển thị giao diện Giỏ hàng trống với biểu tượng túi mua sắm và nút "Tiếp tục mua sắm" dẫn về trang chủ.<br>5.a. Người dùng bấm "Xóa tất cả":<br>&nbsp;&nbsp;&nbsp;&nbsp;5.a.1. Hệ thống hiển thị hộp thoại xác nhận; người dùng đồng ý, giỏ hàng được làm sạch hoàn toàn. |

---

### Bảng 10. Đặc tả Use Case "Đặt hàng trực tuyến và thanh toán đơn hàng B2C"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-CU10** |
| **Tên Use Case** | Đặt hàng trực tuyến và thanh toán đơn hàng B2C (Online Checkout & Payment) |
| **Tác nhân** | Người dùng (CUSTOMER / Khách vãng lai) |
| **Mô tả chức năng** | Cho phép người dùng nhập thông tin giao nhận hàng; lựa chọn hình thức nhận hàng (Giao hàng tận nơi hoặc Đến lấy tại cửa hàng Click & Collect); lựa chọn phương thức thanh toán (Trả tiền mặt khi nhận hàng COD, Thanh toán qua cổng VNPAY Sandbox hoặc Thẻ quốc tế Stripe Sandbox); hệ thống thực thi trừ giữ kho nguyên tử (Atomic Deduction) chống hiện tượng bán vượt tồn kho (Zero Overselling) và tạo đơn hàng chính thức. |
| **Điều kiện tiên quyết** | - Giỏ hàng của người dùng có ít nhất một sản phẩm hợp lệ.<br>- Đã chọn chi nhánh xử lý đơn hàng. |
| **Yêu cầu** | - Cơ chế phòng chống Race Condition: Hệ thống áp dụng toán tử Atomic Update của MongoDB kết hợp điều kiện `{ quantity: { $gte: qty } }` để giữ hàng tạm thời ngay khi khởi tạo đơn hàng.<br>- Hỗ trợ cả khách hàng đã đăng nhập và khách hàng mua nhanh vãng lai.<br>- Hỗ trợ 3 phương thức thanh toán: Tiền mặt khi giao hàng (`CASH` / COD), Cổng thanh toán VNPAY QR Sandbox, và Thẻ thanh toán quốc tế Stripe Sandbox. |
| **Kịch bản chính** | 1. Người dùng tại trang Giỏ hàng nhấn nút "Tiến hành đặt hàng".<br>2. Hệ thống hiển thị modal biểu mẫu thanh toán checkout.<br>3. Nếu người dùng đã đăng nhập, hệ thống tự động điền sẵn Họ tên và Số điện thoại; nếu chưa đăng nhập, người dùng nhập Họ tên và SĐT liên hệ.<br>4. Người dùng nhập Địa chỉ giao nhận hàng cụ thể.<br>5. Người dùng chọn Chi nhánh xuất kho/nhận hàng.<br>6. Người dùng chọn Phương thức thanh toán:<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Lựa chọn A: Thanh toán tiền mặt khi nhận hàng (`CASH` - COD).<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Lựa chọn B: Thanh toán quét mã QR qua Cổng VNPAY Sandbox.<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Lựa chọn C: Thanh toán bằng thẻ tín dụng/ghi nợ qua Cổng Stripe Sandbox.<br>7. Người dùng kiểm tra lại thông tin và nhấn "Xác nhận đặt hàng".<br>8. Hệ thống chuẩn hóa payload qua adapter `toB2cCheckoutPayload` và gửi yêu cầu (`POST /api/v1/orders/b2c/checkout`).<br>9. Máy chủ thực thi kiểm tra và trừ tồn kho Atomic tại chi nhánh được chọn:<br>&nbsp;&nbsp;&nbsp;&nbsp;9.1. Đảm bảo số lượng tồn kho đáp ứng đủ số lượng mua.<br>&nbsp;&nbsp;&nbsp;&nbsp;9.2. Tạo bản ghi đơn hàng mới với `orderType: 'B2C_ONLINE'`, `orderStatus: 'PENDING'` và mã đơn duy nhất (ví dụ: `#T1-94821`).<br>10. **Xử lý theo phương thức thanh toán:**<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Với COD: Đơn hàng hoàn tất bước đặt, hệ thống xóa giỏ hàng và chuyển hướng sang trang thành công.<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Với VNPAY / Stripe: Hệ thống chuyển hướng người dùng sang giao diện thanh toán Sandbox của cổng; sau khi khách thanh toán thành công, cổng thanh toán gọi Webhook cập nhật đơn sang `PAID` và chuyển hướng về website.<br>11. Người dùng được chuyển đến màn hình Đặt hàng thành công (`/checkout/success`). |
| **Kịch bản phụ** | 3.a. Người dùng để trống thông tin Họ tên hoặc Số điện thoại giao hàng:<br>&nbsp;&nbsp;&nbsp;&nbsp;3.a.1. Hệ thống báo lỗi và yêu cầu nhập đủ thông tin nhận hàng.<br>9.a. Sản phẩm bị khách hàng khác mua hết trong cùng thời điểm (xảy ra Race Condition hết hàng):<br>&nbsp;&nbsp;&nbsp;&nbsp;9.a.1. Toán tử Atomic phát hiện tồn kho không đủ, máy chủ trả về mã lỗi `PRODUCT_OUT_OF_STOCK` (HTTP 409 Conflict).<br>&nbsp;&nbsp;&nbsp;&nbsp;9.a.2. Hệ thống hiển thị thông báo lỗi "Sản phẩm [Tên sản phẩm] tại chi nhánh đã chọn vừa hết hàng. Vui lòng chọn chi nhánh khác hoặc sản phẩm thay thế".<br>10.a. Người dùng hủy thanh toán tại cổng VNPAY/Stripe hoặc thanh toán thất bại:<br>&nbsp;&nbsp;&nbsp;&nbsp;10.a.1. Cổng thanh toán chuyển hướng người dùng về trang thông báo lỗi.<br>&nbsp;&nbsp;&nbsp;&nbsp;10.a.2. Hệ thống kích hoạt cơ chế hoàn trả tồn kho tự động (Atomic Rollback: `$inc: { quantity: +qty }`) để trả lại số lượng cho chi nhánh. |

---

### Bảng 11. Đặc tả Use Case "Xem biên nhận xác nhận đơn hàng thành công"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-CU11** |
| **Tên Use Case** | Xem biên nhận xác nhận đơn hàng thành công (Checkout Success Receipt) |
| **Tác nhân** | Người dùng (CUSTOMER / Khách vãng lai) |
| **Mô tả chức năng** | Hiển thị thông báo và biên nhận điện tử xác nhận đơn hàng đã được hệ thống ghi nhận thành công sau khi đặt hàng trực tuyến; cung cấp mã đơn hàng, hướng dẫn nhận hàng cụ thể và các nút điều hướng tiếp theo. |
| **Điều kiện tiên quyết** | - Người dùng vừa hoàn tất quy trình đặt hàng thành công tại Use Case UC-CU10. |
| **Yêu cầu** | - Giao diện hiển thị tại đường dẫn `/checkout/success`.<br>- Tự động xóa sạch sản phẩm trong giỏ hàng Redux (`clearCart`).<br>- Phân hóa chỉ dẫn nhận hàng rõ ràng: Giao tận nơi (hiển thị thời gian ước tính 2h - 48h) hoặc Nhận tại cửa hàng Click & Collect (hiển thị địa chỉ chi nhánh và mã nhận máy). |
| **Kịch bản chính** | 1. Hệ thống chuyển hướng người dùng đến trang Xác nhận đặt hàng thành công (`/checkout/success`).<br>2. Hệ thống hiển thị biểu tượng dấu tích xanh thành công và tiêu đề "Đặt hàng thành công!".<br>3. Màn hình hiển thị bản tóm tắt biên nhận:<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Mã đơn hàng duy nhất (kèm nút "Sao chép mã đơn").<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Tổng tiền thanh toán và phương thức thanh toán đã chọn.<br>&nbsp;&nbsp;&nbsp;&nbsp;+ Khung hướng dẫn nhận hàng chi tiết theo phương thức khách đã chọn.<br>4. Người dùng có thể nhấn nút "Theo dõi đơn hàng" để chuyển sang trang xem tiến độ đơn hàng cá nhân (nếu đã đăng nhập) hoặc nhấn nút "Tiếp tục mua sắm" để quay trở về trang chủ. |
| **Kịch bản phụ** | 1.a. Người dùng truy cập trực tiếp vào URL `/checkout/success` mà không qua bước đặt hàng:<br>&nbsp;&nbsp;&nbsp;&nbsp;1.a.1. Hệ thống hiển thị giao diện mặc định thông báo hoặc hướng dẫn người dùng quay lại trang chủ mua sắm. |

---

### Bảng 12. Đặc tả Use Case "Tra cứu danh sách lịch sử đơn hàng cá nhân"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-CU12** |
| **Tên Use Case** | Tra cứu danh sách lịch sử đơn hàng cá nhân (Customer Order History) |
| **Tác nhân** | Người dùng (CUSTOMER đã đăng nhập) |
| **Mô tả chức năng** | Cho phép khách hàng đã đăng nhập tra cứu toàn bộ danh sách các đơn hàng mình đã từng đặt mua trên hệ thống; phân loại theo trạng thái xử lý để tiện theo dõi các đơn hàng đang giao hoặc đã hoàn tất. |
| **Điều kiện tiên quyết** | - Khách hàng đã đăng nhập thành công vào tài khoản cá nhân. |
| **Yêu cầu** | - Endpoint được bảo vệ bởi middleware `protect` (`GET /api/v1/orders/my-orders`).<br>- Chỉ trả về các đơn hàng thuộc sở hữu của chính tài khoản đang đăng nhập (`customerId: req.user._id`).<br>- Hỗ trợ các tab lọc trạng thái: Tất cả, Chờ thanh toán, Đang xử lý, Đang giao hàng, Hoàn tất, Đã hủy. |
| **Kịch bản chính** | 1. Người dùng bấm vào menu tài khoản trên Header và chọn "Đơn hàng của tôi" (hoặc truy cập `/account/orders`).<br>2. Hệ thống kiểm tra quyền hạn và gửi yêu cầu lấy danh sách đơn hàng của người dùng.<br>3. Hệ thống hiển thị danh sách các thẻ đơn hàng (Order List Cards).<br>4. Mỗi thẻ đơn hàng hiển thị: Mã đơn hàng, Ngày đặt hàng, Danh sách hình ảnh thu nhỏ của các sản phẩm trong đơn, Tổng tiền thanh toán, Huy hiệu trạng thái đơn hàng và Phương thức thanh toán.<br>5. Người dùng có thể bấm vào các tab trạng thái để lọc nhanh các đơn hàng cần theo dõi.<br>6. Người dùng nhấn nút "Xem chi tiết" tại một thẻ đơn hàng để xem thông tin chuyên sâu. |
| **Kịch bản phụ** | 2.a. Người dùng chưa từng đặt đơn hàng nào trên hệ thống:<br>&nbsp;&nbsp;&nbsp;&nbsp;2.a.1. Hệ thống hiển thị thông báo "Bạn chưa có đơn hàng nào" kèm nút "Khám phá sản phẩm ngay" dẫn về trang chủ. |

---

### Bảng 13. Đặc tả Use Case "Xem chi tiết tiến độ đơn hàng và mã Serial / IMEI"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-CU13** |
| **Tên Use Case** | Xem chi tiết tiến độ đơn hàng và Serial/IMEI (Order Detail & Serial Tracking) |
| **Tác nhân** | Người dùng (CUSTOMER đã đăng nhập) |
| **Mô tả chức năng** | Cho phép khách hàng xem chi tiết từng bước tiến độ thực hiện của đơn hàng theo dòng thời gian trực quan (Stepper Timeline); xem thông tin chi nhánh xử lý đơn; đặc biệt là xem danh sách các mã Serial/IMEI cụ thể đã được gán cho thiết bị trong đơn hàng kèm nút chuyển nhanh sang tra cứu bảo hành điện tử. |
| **Điều kiện tiên quyết** | - Khách hàng đã đăng nhập và đang mở chi tiết một đơn hàng cụ thể (`/account/orders/:id`). |
| **Yêu cầu** | - Gọi API chi tiết đơn hàng (`GET /api/v1/orders/my-orders/:id`).<br>- Đảm bảo tính bảo mật: Người dùng không thể xem trộm chi tiết đơn hàng của tài khoản khác bằng cách sửa ID trên URL.<br>- Hiển thị tiến trình trực quan 4 bước: Đã đặt hàng -> Đã xác nhận & Đang đóng gói -> Đang giao hàng -> Giao thành công. |
| **Kịch bản chính** | 1. Người dùng chọn xem một đơn hàng từ danh sách đơn hàng cá nhân.<br>2. Hệ thống tải dữ liệu chi tiết và hiển thị trang Chi tiết đơn hàng (`OrderDetailPage`).<br>3. Người dùng theo dõi Dòng thời gian tiến độ (Timeline Stepper) hiển thị trạng thái hiện tại của gói hàng.<br>4. Người dùng xem thông tin Chi nhánh chịu trách nhiệm đóng gói (Tên cửa hàng, Địa chỉ, Số điện thoại hỗ trợ).<br>5. Người dùng xem bảng danh sách các mặt hàng chi tiết trong đơn: Tên sản phẩm, Tên biến thể cấu hình, Số lượng, Đơn giá.<br>6. **Xem mã Serial/IMEI của thiết bị:**<br>&nbsp;&nbsp;&nbsp;&nbsp;6.1. Đối với các đơn hàng đã được nhân viên chi nhánh đóng gói và gán mã máy, hệ thống hiển thị rõ ràng mã Serial/IMEI của từng chiếc máy.<br>&nbsp;&nbsp;&nbsp;&nbsp;6.2. Cạnh mỗi mã Serial có nút "Kiểm tra bảo hành"; người dùng bấm vào nút này sẽ được chuyển nhanh sang trang Tra cứu E-Warranty để xem thời hạn bảo hành 12 tháng của máy.<br>7. Người dùng xem bảng đối soát thanh toán: Tạm tính, Phí ship, Giảm giá và Tổng tiền đã thanh toán. |
| **Kịch bản phụ** | 2.a. Người dùng cố tình nhập ID đơn hàng của người khác trên URL trình duyệt:<br>&nbsp;&nbsp;&nbsp;&nbsp;2.a.1. Máy chủ kiểm tra quyền sở hữu (`customerId !== req.user._id`), trả về mã lỗi 403 Forbidden hoặc 404 Not Found.<br>&nbsp;&nbsp;&nbsp;&nbsp;2.a.2. Hệ thống báo lỗi "Bạn không có quyền xem đơn hàng này" và chuyển hướng về danh sách đơn hàng cá nhân. |

---

### Bảng 14. Đặc tả Use Case "Đăng xuất tài khoản khách hàng"

| Thuộc tính | Nội dung chi tiết |
| :--- | :--- |
| **Use Case ID** | **UC-CU14** |
| **Tên Use Case** | Đăng xuất tài khoản khách hàng (Customer Logout) |
| **Tác nhân** | Người dùng (CUSTOMER) |
| **Mô tả chức năng** | Cho phép khách hàng kết thúc phiên làm việc trên trình duyệt, hủy bỏ cookie xác thực và đưa giao diện về trạng thái khách vãng lai. |
| **Điều kiện tiên quyết** | - Khách hàng đang trong trạng thái đăng nhập tài khoản. |
| **Yêu cầu** | - Gửi yêu cầu `POST /api/v1/auth/logout`.<br>- Xóa phiên trong cơ sở dữ liệu và dọn sạch dữ liệu người dùng khỏi Redux Store. |
| **Kịch bản chính** | 1. Người dùng bấm vào menu hồ sơ cá nhân trên Header.<br>2. Người dùng chọn mục "Đăng xuất".<br>3. Hệ thống gửi yêu cầu đăng xuất tới máy chủ Backend.<br>4. Máy chủ thu hồi Refresh Token và xóa bỏ HttpOnly Cookie.<br>5. Hệ thống xóa thông tin tài khoản khỏi Redux Store (`dispatch(logout())`).<br>6. Giao diện Header chuyển đổi từ hiển thị tên người dùng sang nút "Đăng nhập / Đăng ký".<br>7. Hệ thống chuyển hướng người dùng về Trang chủ an toàn. |
| **Kịch bản phụ** | 1.a. Người dùng tiếp tục lướt web với tư cách khách vãng lai bình thường mà không bị gián đoạn trải nghiệm xem sản phẩm. |
