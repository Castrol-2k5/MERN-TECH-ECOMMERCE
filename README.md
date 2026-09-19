# MERN-TECH-ECOMMERCE

E-commerce website for a chain of technology stores, built with MERN Stack.

Form khảo sát nhu cầu và trải nghiệm mua sắm các thiết bị công nghệ trực tuyến
https://docs.google.com/forms/d/e/1FAIpQLSfmQ0mdVcos8phe0_KOve9C-nEW-wFnnB1b37VPLrJ5widahQ/viewform?usp=sharing&ouid=118214712236023267065

## KẾT QUẢ KHẢO SÁT

## CHÂN DUNG NGƯỜI DÙNG (PERSONAS)

- Khách hàng cá nhân: Mua sắm thiết bị công nghệ đại diện cho nhóm người dùng đô thị, hiểu biết về kỹ thuật, có thói quen nghiên cứu kỹ lưỡng trước khi mua. Họ ưu tiên các website có bộ lọc sản phẩm thông minh theo cấu hình, bảng so sánh trực quan và hỗ trợ thanh toán không dùng tiền mặt an toàn. Điểm đau lớn nhất của nhóm này là rủi ro mua phải hàng dựng, hàng không rõ nguồn gốc trên các sàn giao dịch trôi nổi, cùng quy trình bảo hành phức tạp khi gặp sự cố. Mục tiêu của họ trên hệ thống là tìm đúng sản phẩm phù hợp nhu cầu công việc/giải trí, kiểm tra trạng thái còn hàng tại cửa hàng gần nhất và tra cứu bảo hành điện tử nhanh chóng.

- Nhân viên bán hàng và vận hành kho: Đại diện cho người dùng nội bộ, thao tác trực tiếp với hệ thống quản trị hàng ngày. Họ chịu áp lực về tốc độ xử lý đơn hàng, tính chính xác trong việc kiểm tồn kho và quản lý Serial/IMEI. Điểm đau của họ là giao diện quản trị rườm rà, phản hồi chậm và việc sai lệch số liệu giữa kho online và kho cửa hàng vật lý. Mục tiêu của họ là một giao diện Admin tối ưu, thao tác cập nhật trạng thái đơn hàng, tra cứu Serial/IMEI và kiểm kê tồn kho diễn ra tức thì.

- Quản lý kinh doanh chuỗi: Đại diện cho cấp điều hành, cần cái nhìn toàn cảnh về hiệu quả kinh doanh, doanh thu, tốc độ lưu thông hàng hóa và chi phí vận hành. Điểm đau của quản lý là sự phụ thuộc vào dữ liệu của các sàn thương mại điện tử, chi phí cắt chiết khấu cao và thiếu các công cụ phân tích báo cáo thời gian thực. Mục tiêu của họ là nắm bắt báo cáo doanh thu theo chi nhánh, quản lý danh mục sản phẩm linh hoạt và sở hữu hoàn toàn dữ liệu khách hàng để tối ưu hóa chiến lược kinh doanh lâu dài.

## BÀI TOÁN NGHIỆP VỤ CỐT LÕI

_Đề tài tập trung giải quyết ba bài toán nghiệp vụ công nghệ trọng tâm._

- Bài toán thứ nhất là lưu trữ và truy vấn cấu hình sản phẩm công nghệ có thuộc tính biến đổi linh hoạt. Mỗi ngành hàng công nghệ có tập thuộc tính hoàn toàn khác nhau (ví dụ: Laptop cần lưu CPU, RAM, Card đồ họa, Tần số quét; trong khi Thẻ nhớ cần lưu Chuẩn kết nối, Tốc độ đọc/ghi). Cơ sở dữ liệu quan hệ truyền thống sẽ gặp khó khăn khi số lượng bảng và phép Join tăng quá nhiều. Cơ sở dữ liệu NoSQL như MongoDB cung cấp cấu trúc Document linh hoạt, cho phép định nghĩa các Schema động (Dynamic Schema) để lưu trữ các thông số kỹ thuật đa dạng mà vẫn đảm bảo tốc độ truy vấn tối ưu.

- Bài toán thứ hai là kiểm soát tồn kho đa chi nhánh và xử lý bất đồng bộ giao dịch. Hệ thống phải đảm bảo khi khách hàng đặt mua một sản phẩm tại một chi nhánh cụ thể, số lượng tồn kho của chi nhánh đó phải được trừ chính xác. Trong trường hợp nhiều người dùng cùng nhấn đặt hàng một sản phẩm có số lượng tồn kho hạn chế tại cùng một thời điểm, hệ thống phải xử lý triệt để bài toán tranh chấp dữ liệu (Race Conditions) để tránh tình trạng bán quá số lượng tồn kho thực tế (Overselling).

- Bài toán thứ ba là quản lý vòng đời sản phẩm qua mã Serial/IMEI và hệ thống bảo hành điện tử. Mỗi thiết bị bán ra phải được gắn với một mã Serial/IMEI duy nhất trong cơ sở dữ liệu. Hệ thống cần tự động liên kết mã này với thông tin khách hàng, ngày kích hoạt đơn hàng và thời hạn bảo hành. Khi khách hàng mang thiết bị tới bất kỳ chi nhánh nào, nhân viên chỉ cần quét mã Serial/IMEI để truy xuất toàn bộ lịch sử giao dịch và trạng thái bảo hành.

## PHẠM VI TRIỂN KHAI ĐỀ TÀI

_Để đảm bảo tính khả thi và tập trung nguồn lực hoàn thiện hệ thống chất lượng cao trong khuôn khổ tiểu luận chuyên ngành, phạm vi công việc được phân định rõ ràng giữa các phần thực hiện (In-Scope) và không thực hiện (Out-of-Scope)._

### 1. Danh Mục Các Phân Hệ & Tính Năng Thuộc Phạm Vi Thực Hiện (IN-SCOPE)

Hệ thống được phát triển theo mô hình **Hệ sinh thái Nền tảng hợp nhất (Unified Commerce / Omnichannel Platform)** dựa trên kiến trúc MERN Stack, kết nối chung một CSDL MongoDB và Server Backend Node.js:

| Phân hệ / Mô-đun                             | Các tính năng cốt lõi thuộc phạm vi triển khai (In-Scope)                                                                                                                                                                                                                                                                                                                                                                                                  | Mục tiêu nghiệp vụ & Kỹ thuật                                                                                  |
| :------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| **1. Customer Storefront (B2C Web)**         | • Tìm kiếm & Lọc sản phẩm theo thuộc tính cấu hình động (CPU, RAM, VGA, Dung lượng...).<br>• Module so sánh chi tiết thông số kỹ thuật giữa 2 hay nhiều sản phẩm.<br>• Hiển thị trạng thái còn/hết hàng chi tiết theo **từng chi nhánh cụ thể** (Multi-branch visibility).<br>• Luồng giỏ hàng, đặt hàng trực tuyến & Tích hợp thanh toán Sandbox (VNPAY/Stripe).<br>• Tra cứu thời hạn và lịch sử bảo hành điện tử theo mã Serial/IMEI hoặc SĐT.          | Phục vụ khách hàng cá nhân mua sắm online, minh bạch thông tin cấu hình và hỗ trợ trải nghiệm Click & Collect. |
| **2. Web-based POS (Bán hàng tại Quầy)**     | • Giao diện tối ưu thao tác siêu tốc cho thu ngân (hỗ trợ phím tắt, tìm sản phẩm nhanh).<br>• Tương thích thiết bị quét mã vạch qua cơ chế _Keyboard Event Listener_ (hỗ trợ máy quét chuyên dụng hoặc điện thoại).<br>• Quét/nhập mã Serial/IMEI thiết bị để gán trực tiếp vào đơn hàng tại quầy.<br>• Kích hoạt bảo hành điện tử ngay khi hoàn tất hóa đơn.<br>• **Trừ tồn kho thời gian thực (Real-time Inventory Deduction)** của chính chi nhánh bán. | Phục vụ thu ngân/nhân viên cửa hàng vật lý, đảm bảo 100% thiết bị bán ra được quản lý theo đúng Serial/IMEI.   |
| **3. Branch Management (Quản lý Chi nhánh)** | • Quản lý số lượng tồn kho và danh mục Serial/IMEI thực tế tại chi nhánh.<br>• Tiếp nhận, xác nhận và đóng gói các đơn hàng B2C phân bổ về chi nhánh.<br>• Tiếp nhận thiết bị bảo hành tại cửa hàng (kiểm tra Serial/IMEI và tạo phiếu tiếp nhận).<br>• Xem báo cáo doanh thu, số lượng đơn hàng và lịch sử bán hàng riêng của chi nhánh.                                                                                                                  | Phục vụ Quản lý cửa hàng (Branch Manager) kiểm soát vận hành nội bộ tại từng địa điểm kinh doanh.              |
| **4. Headquarter Portal (Super Admin)**      | • Quản lý sản phẩm & Định nghĩa cấu hình thuộc tính động (Dynamic Schema Pattern).<br>• Quản lý danh mục Chi nhánh toàn hệ thống (Thêm/Sửa/Xóa chi nhánh).<br>• Điều phối luân chuyển hàng hóa giữa các chi nhánh (Stock Transfer Workflow).<br>• Phân quyền người dùng chi tiết (RBAC: Super Admin, Branch Manager, Staff POS, Customer).<br>• Báo cáo tổng hợp doanh thu toàn chuỗi & so sánh hiệu quả kinh doanh giữa các chi nhánh.                    | Phục vụ Ban quản trị chuỗi (Headquarter) điều hành toàn bộ tài nguyên, phân quyền và chiến lược kinh doanh.    |
| **5. Quản lý Vòng đời Serial/IMEI**          | • Xây dựng máy trạng thái (**State Pattern**) kiểm soát khép kín quy trình chuyển đổi mã Serial/IMEI:<br>`IN_STOCK` ➔ `RESERVED` ➔ `SOLD` ➔ `WARRANTY` ➔ `TRANSIT`.                                                                                                                                                                                                                                                                                        | Giải quyết bài toán nghiệp vụ đặc thù của ngành bán lẻ đồ điện tử/công nghệ.                                   |
| **6. Quản lý Tồn kho Đa chi nhánh**          | • Phân bổ tồn kho theo mảng chi nhánh `[branchId, quantity]`.<br>• Xử lý tranh chấp dữ liệu tồn kho (Race Conditions) giữa Web B2C và Web POS bằng **MongoDB Atomic Operations / Transactions**.                                                                                                                                                                                                                                                           | Chống lỗi bán lố tồn kho (Overselling) khi nhiều kênh cùng truy xuất kho tại cùng một thời điểm.               |

---

### 2. Danh Mục Các Phân Hệ & Tính Năng Nằm Ngoài Phạm Vi Thực Hiện (OUT-OF-SCOPE)

Nhằm đảm bảo tính khả thi, tập trung tối đa nguồn lực vào việc hoàn thiện chất lượng mã nguồn, kiểm thử tự động (≥ 70%), và triển khai CI/CD theo đúng bộ tiêu chí chấm điểm, nhóm tuyên bố không thực hiện các hạng mục sau:

| Hạng mục nghiệp vụ                                                 | Các nội dung không triển khai (Out-of-Scope)                                                                                                           | Lý do loại trừ khỏi phạm vi đề tài                                                                                                                                                                                                        |
| :----------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Ứng dụng Di động Bản địa (Native Mobile App)**                | Không xây dựng ứng dụng di động độc lập dành cho iOS (Swift) hay Android (Kotlin).                                                                     | Dự án tập trung tối ưu ứng dụng Web (Single Page Application - React.js) hiển thị chuẩn Responsive mượt mà trên trình duyệt di động (Mobile Web) để tránh phân tán kiến trúc mã nguồn.                                                    |
| **2. Nghiệp vụ Trả góp Ngân hàng / Công ty Tài chính**             | Không xây dựng luồng tự động định danh eKYC, thẩm định hồ sơ tín dụng và phê duyệt trả góp trực tuyến.                                                 | Luồng trả góp đòi hỏi tích hợp API định danh bảo mật và thẩm định từ hệ thống Ngân hàng/Công ty tài chính bên thứ ba. Hệ thống chỉ tập trung xử lý các phương thức thanh toán trực tiếp (Tiền mặt POS, Chuyển khoản, Ví điện tử Sandbox). |
| **3. Quy trình Sửa chữa Kỹ thuật tại Xưởng (RMA Repair Workflow)** | Không làm quy trình quản lý bóc tách linh kiện, gửi về trung tâm bảo hành hãng (Apple/Asus), theo dõi mã linh kiện thay thế tại xưởng kỹ thuật nội bộ. | Hệ thống dừng lại ở mức **Tiếp nhận thiết bị bảo hành tại cửa hàng, tra cứu lịch sử mua qua Serial/IMEI và xuất phiếu tiếp nhận**. Việc sửa chữa chuyên sâu thuộc về phần mềm RMA chuyên biệt.                                            |

# SO SÁNH CÁC GIẢI PHÁP HIỆN CÓ VÀ PHÂN TÍCH ĐIỂM YẾU

## I. Bảng so sánh toàn diện các giải pháp hệ thống

| Tiêu chí so sánh               | Sàn TMĐT tập trung (Shopee, TikTok Shop,...)                              | WordPress + WooCommerce                                               | Shopify (SaaS Platform)                                                  | MERN Stack Platform (Đề xuất)                                                              |
| ------------------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 💰 **Chi phí vận hành**        | Rất cao dài hạn (Phí sàn, phí dịch vụ từ 5% - 15% doanh thu).             | Thấp ban đầu, tăng dần do chi phí mua plugin và nâng cấp hosting.     | Khá cao (Phí thuê bao tháng + phí giao dịch + phí app bên thứ 3).        | **Tối ưu nhất.** Chỉ tốn chi phí hạ tầng (VPS/Cloud). Làm chủ mã nguồn.                    |
| 🆔 **Quản lý Serial/IMEI**     | Không hỗ trợ. Chỉ quản lý theo SKU tổng, không định danh từng máy cụ thể. | Cần cài thêm plugin bên thứ 3 (nặng hệ thống, dễ xung đột data).      | Phụ thuộc vào các app ERP tích hợp, tốn phí bản quyền cao.               | **Tùy biến tuyệt đối.** Thiết kế Schema định danh chính xác từng Serial/IMEI trong DB.     |
| 🏢 **Tồn kho đa chi nhánh**    | Hỗ trợ cơ bản (chia kho theo khu vực lớn), khó đồng bộ POS tại quầy.      | Khó khăn. Truy vấn SQL bị nghẽn khi đồng bộ real-time nhiều kho.      | Có hỗ trợ (gói cao cấp) nhưng giới hạn số lượng chi nhánh theo gói tiền. | **Xử lý hoàn hảo.** Node.js kết hợp Redis/MongoDB giúp trừ kho real-time đa chi nhánh.     |
| 🎨 **Tùy biến giao diện (UX)** | Bị giới hạn tuyệt đối. Phải tuân theo khung chuẩn và UI/UX chung của sàn. | Phụ thuộc vào Theme có sẵn. Sửa sâu vào mã nguồn rất dễ lỗi layout.   | Dễ tùy biến kéo thả nhưng khó can thiệp sâu vào luồng Checkout.          | **Linh hoạt 100%.** ReactJS cho phép thiết kế giao diện độc quyền, tùy biến Single Page.   |
| 🔒 **Quyền sở hữu dữ liệu**    | Không sở hữu. Sàn nắm giữ toàn bộ data khách hàng và hành vi mua sắm.     | Sở hữu 100% dữ liệu nằm trên Server riêng của doanh nghiệp.           | Thuê dữ liệu. Nếu đóng tài khoản hoặc vi phạm chính sách sẽ mất data.    | **Sở hữu tuyệt đối.** Doanh nghiệp toàn quyền lưu trữ, khai thác và bảo mật database.      |
| ⚡ **Tốc độ phản hồi**         | Nhanh nhờ hạ tầng khổng lồ của sàn nhưng bị ảnh hưởng bởi mạng chung.     | Chậm dần theo thời gian khi DB phình to và gánh nhiều Plugin.         | Nhanh, ổn định nhờ hạ tầng Cloud Global của Shopify.                     | **Cực nhanh (<2s).** Kiến trúc Single Page Application và API Node.js tối ưu.              |
| 📐 **Lưu thuộc tính động**     | Giới hạn số lượng phân loại (thường tối đa 2 cấp thuộc tính).             | Dùng EAV Model trong SQL gây chậm hệ thống khi query cấu hình.        | Giới hạn 3 lựa chọn thuộc tính (Options) và 100 biến thể (Variants).     | **Flexible Schema.** MongoDB lưu trữ không giới hạn thuộc tính động cho từng linh kiện.    |
| 📈 **Chịu tải Mega-Sale**      | Tự động xử lý nhờ hạ tầng của sàn.                                        | Rất kém. Thường bị sập web, lỗi cổng thanh toán khi traffic đột biến. | Tốt, tự động co giãn (Auto-scaling) theo hạ tầng của Shopify.            | **Rất tốt.** Node.js xử lý bất đồng bộ (Asynchronous) chịu tải hàng vạn request đồng thời. |
| 🛠 **Bảo hành & Trả góp**      | Phụ thuộc vào chính sách chung của sàn. Không có tra cứu IMEI.            | Cần code thêm hoặc mua nhiều plugin rời rạc, khó đồng bộ.             | Tích hợp app trả góp quốc tế tốt, nhưng khó tối ưu cổng trả góp VN.      | **Thiết kế chuyên biệt.** Tích hợp cổng trả góp và tra cứu e-Warranty mượt mà qua API.     |

---

## II. Phân tích chuyên sâu các giải pháp hiện có (Khoảng trống công nghệ)

Để làm bật lên giá trị của MERN Stack, cần phân tích các điểm hạn chế kỹ thuật của ba giải pháp hiện có khi áp dụng vào ngành thiết bị công nghệ.

### 1. Sàn thương mại điện tử tập trung (Shopee, Lazada, TikTok Shop)

**Bản chất kiến trúc:**  
Mô hình Marketplace đa người bán (Multi-vendor).

**Điểm hạn chế đối với ngành công nghệ:**

Đồ công nghệ đòi hỏi quản lý chính xác số Serial/IMEI để kích hoạt bảo hành điện tử. Các sàn thường quản lý sản phẩm chủ yếu ở cấp SKU, trong khi doanh nghiệp cần định danh từng thiết bị cụ thể.

Ví dụ, hệ thống có thể biết trong kho còn 10 chiếc iPhone 15 Pro Max nhưng không nhất thiết quản lý trực tiếp 10 số IMEI tương ứng trong cùng một quy trình quản lý kho.

Điều này gây khó khăn trong các trường hợp:

- Đối soát thiết bị khi khách hàng đổi trả.
- Kiểm tra nguồn gốc thiết bị.
- Xác minh thiết bị có thuộc lô hàng do doanh nghiệp bán ra hay không.
- Quản lý và kích hoạt bảo hành điện tử theo từng thiết bị.
- Theo dõi lịch sử bán hàng của từng Serial/IMEI.

Ngoài ra, việc cạnh tranh về giá giữa nhiều nhà bán hàng trên sàn có thể gây khó khăn cho doanh nghiệp trong việc duy trì định vị thương hiệu và kiểm soát trải nghiệm khách hàng.

---

### 2. Nền tảng mã nguồn mở WordPress + WooCommerce

**Bản chất kiến trúc:**  
Hệ thống monolithic sử dụng PHP và cơ sở dữ liệu quan hệ MySQL.

**Điểm hạn chế đối với ngành công nghệ:**

Các sản phẩm công nghệ có hệ thống thuộc tính rất đa dạng tùy theo từng danh mục:

- **Laptop:** CPU, RAM, VGA, màn hình, dung lượng SSD,...
- **Chuột máy tính:** DPI, Polling Rate, loại cảm biến,...
- **Ổ cứng:** Dung lượng, chuẩn kết nối, tốc độ đọc/ghi, TBW,...
- **Màn hình:** Kích thước, độ phân giải, tần số quét, thời gian phản hồi,...

Trong WooCommerce, việc mở rộng các thuộc tính động thường phải dựa vào metadata, plugin hoặc các mô hình dữ liệu bổ sung.

Khi số lượng sản phẩm và thuộc tính tăng lên, việc truy vấn dữ liệu theo nhiều tiêu chí có thể trở nên phức tạp. Đặc biệt, nếu sử dụng nhiều plugin để mở rộng chức năng, hệ thống có thể phát sinh:

- Nhiều truy vấn cơ sở dữ liệu.
- Truy vấn JOIN phức tạp.
- Xung đột giữa các plugin.
- Khó kiểm soát cấu trúc dữ liệu.
- Khó tối ưu hiệu năng khi quy mô hệ thống tăng.

Đây là một trong những vấn đề cần cân nhắc khi xây dựng hệ thống thương mại điện tử chuyên biệt cho thiết bị công nghệ.

---

### 3. Nền tảng SaaS Shopify

**Bản chất kiến trúc:**  
Software as a Service (SaaS), trong đó doanh nghiệp sử dụng nền tảng và hạ tầng do Shopify cung cấp.

**Điểm hạn chế đối với ngành công nghệ:**

Một vấn đề cần cân nhắc là **Vendor Lock-in**, tức doanh nghiệp phụ thuộc vào nền tảng và các giới hạn kỹ thuật của nhà cung cấp.

Đối với các hệ thống bán thiết bị công nghệ, sản phẩm có thể có nhiều tổ hợp cấu hình khác nhau. Ví dụ:

> 4 tùy chọn CPU × 3 tùy chọn RAM × 3 tùy chọn ổ cứng × 4 tùy chọn màu sắc = 144 tổ hợp.

Khi mô hình sản phẩm vượt quá giới hạn biến thể hoặc cần một logic quản lý cấu hình đặc thù, doanh nghiệp có thể phải:

- Sử dụng thêm ứng dụng bên thứ ba.
- Phát triển giải pháp tích hợp riêng.
- Phụ thuộc vào API và giới hạn của nền tảng.
- Phát sinh thêm chi phí vận hành.

Ngoài ra, do Shopify là nền tảng SaaS, doanh nghiệp không trực tiếp kiểm soát toàn bộ hạ tầng và mã nguồn nền tảng. Điều này có thể hạn chế khả năng tùy biến sâu các nghiệp vụ đặc thù như:

- Quản lý Serial/IMEI.
- Quản lý kho đa chi nhánh.
- Quy trình bảo hành điện tử.
- Tích hợp ERP nội bộ.
- Quy trình trả góp đặc thù tại Việt Nam.
- Hệ thống phân tích dữ liệu và nghiệp vụ riêng của doanh nghiệp.

---

# III. Tại sao MERN Stack Platform là giải pháp phù hợp?

Từ những hạn chế của các giải pháp hiện có, hệ thống MERN Stack được đề xuất theo hướng xây dựng một nền tảng thương mại điện tử chuyên biệt cho ngành thiết bị công nghệ.

Kiến trúc MERN bao gồm:

- **MongoDB:** Cơ sở dữ liệu NoSQL.
- **Express.js:** Framework backend cho Node.js.
- **React.js:** Thư viện phát triển giao diện người dùng.
- **Node.js:** Runtime JavaScript phía server.

Mỗi thành phần giải quyết một nhóm vấn đề cụ thể.

---

## 1. MongoDB - Hóa giải bài toán thuộc tính động

MongoDB sử dụng mô hình Document Database với cấu trúc dữ liệu linh hoạt (Flexible Schema).

Thay vì bắt buộc tất cả sản phẩm phải có cùng một tập thuộc tính, mỗi sản phẩm có thể lưu trữ các trường dữ liệu phù hợp với danh mục của mình.

Ví dụ:

```json
{
  "name": "Laptop Gaming A",
  "category": "Laptop",
  "specifications": {
    "cpu": "Intel Core i7",
    "ram": "16GB",
    "gpu": "RTX 4060",
    "storage": "1TB SSD"
  }
}

{
  "name": "Gaming Mouse B",
  "category": "Mouse",
  "specifications": {
    "dpi": 26000,
    "pollingRate": "4000Hz",
    "sensor": "PAW3395"
  }
}
```

## 2. Express.js & Node.js - Tối ưu xử lý đơn hàng và I/O

Node.js sử dụng mô hình **Event Loop** và cơ chế **Non-blocking I/O**, phù hợp với các hệ thống có nhiều thao tác I/O như:

- Xử lý API.
- Quản lý đơn hàng.
- Kiểm tra tồn kho.
- Giao tiếp với cơ sở dữ liệu.
- Gửi thông báo.
- Tích hợp cổng thanh toán.
- Tích hợp dịch vụ vận chuyển.

Đối với hệ thống bán thiết bị công nghệ, kiến trúc này cho phép xây dựng các API xử lý nghiệp vụ theo hướng **bất đồng bộ (Asynchronous)**.

Đặc biệt, dữ liệu **Serial/IMEI** có thể được liên kết trực tiếp với:

```text
Product
    ↓
Serial / IMEI
    ↓
Order
    ↓
Customer
    ↓
Warranty
```

Nhờ đó, hệ thống có thể xây dựng quy trình truy xuất nguồn gốc thiết bị từ lúc nhập kho, bán hàng cho đến bảo hành.

> **Lưu ý:** Khả năng chịu tải thực tế không chỉ phụ thuộc vào Node.js mà còn phụ thuộc vào kiến trúc tổng thể, database, caching, load balancing, network, giới hạn phần cứng và cách tối ưu code.

---

## 3. React.js - Nâng tầm trải nghiệm người dùng (UX)

React.js cho phép xây dựng giao diện theo mô hình **Single Page Application (SPA)**.

Thay vì tải lại toàn bộ trang khi người dùng thay đổi cấu hình sản phẩm, giao diện có thể cập nhật từng thành phần cần thiết.

Ví dụ:

```text
Laptop
│
├── CPU: Intel Core i7
├── RAM: 8GB → 16GB
├── SSD: 512GB → 1TB
└── Màu sắc: Đen
        ↓
   Cập nhật giá
        ↓
   Kiểm tra tồn kho
        ↓
   Cập nhật giao diện
```

Khi khách hàng thay đổi RAM từ **8GB lên 16GB**, hệ thống có thể:

1. Gửi request đến API.
2. Kiểm tra biến thể tương ứng.
3. Kiểm tra tồn kho.
4. Tính toán lại giá.
5. Cập nhật giao diện mà không cần tải lại toàn bộ trang.

Điều này giúp tạo ra trải nghiệm tương tác nhanh và phù hợp với các sản phẩm có nhiều cấu hình như laptop, PC, màn hình và linh kiện máy tính.

# Hệ Thống Chỉ Số KPI Nghiệp Vụ Định Lượng

Để bảo đảm quá trình nghiên cứu và triển khai phần mềm đạt hiệu quả cao, hệ thống **6 chỉ số KPI định lượng** được chốt ngay từ giai đoạn lập kế hoạch nghiên cứu và duy trì đánh giá nhất quán đến khi hoàn thành bảo vệ.

---

## KPI 1: Thời Gian Phản Hồi API Trung Bình (API Latency - $KPI_1$)

Chỉ số này đo lường hiệu năng của hệ thống Backend Express.js/MongoDB trong việc xử lý và trả về dữ liệu cho các truy vấn xem danh mục, lọc thuộc tính sản phẩm và kiểm tra tồn kho.

- **Chỉ số mục tiêu:** $T_{\text{avg}} < 200\text{ ms}$ trong điều kiện tải thông thường và $T_{\text{max}} < 500\text{ ms}$ tại ngưỡng 100 truy vấn đồng thời.
- **Công thức xác định:**

$$
T_{\text{avg}} = \frac{1}{m} \sum_{i=1}^{m} (t_{\text{res},i} - t_{\text{req},i})
$$

Trong đó:

- $m$: Tổng số yêu cầu API ghi nhận trong khoảng thời gian kiểm thử.
- $t_{\text{req},i}$: Thời điểm client phát yêu cầu $i$.
- $t_{\text{res},i}$: Thời điểm client nhận hoàn tất phản hồi $i$.

---

## KPI 2: Độ Trễ Đồng Bộ Tồn Kho Đa Kho (Inventory Sync Latency - $KPI_2$)

Chỉ số này đo lường khoảng thời gian tính từ khi một giao dịch thanh toán đơn hàng hoàn tất cho đến khi số lượng tồn kho của chi nhánh tương ứng được cập nhật chính xác trên toàn bộ hệ thống.

- **Chỉ số mục tiêu:** $T_{\text{sync}} \le 1.5\text{ giây}$.
- **Công thức xác định:**

$$
T_{\text{sync}} = t_{\text{updated\_db}} - t_{\text{payment\_success}}
$$

Trong đó:

- $t_{\text{payment_success}}$: Mốc thời gian nhận Webhook xác nhận thanh toán thành công.
- $t_{\text{updated_db}}$: Mốc thời gian hệ thống hoàn tất ghi nhận trừ tồn kho trong MongoDB.

---

## KPI 3: Năng Suất Xử Lý Đơn Hàng Đồng Thời (Order Concurrency Throughput - $KPI_3$)

Chỉ số này đo lường khả năng xử lý an toàn các yêu cầu tạo đơn hàng đồng thời tại các thời điểm cao điểm mua sắm mà không gây ra lỗi tranh chấp dữ liệu (Race Conditions) hoặc làm sập máy chủ.

- **Chỉ số mục tiêu:** Tốc độ xử lý tối thiểu $Th \ge 100\text{ đơn hàng/giây}$ (Transactions Per Second - TPS) với tỷ lệ giao dịch lỗi $ER \le 0.1%$.
- **Công thức xác định:**

$$
Th = \frac{N_{\text{successful\_orders}}}{\Delta t}
$$

$$
ER = \left( \frac{N_{\text{failed\_orders}}}{N_{\text{total\_attempts}}} \right) \times 100\%
$$

Trong đó:

- $N_{\text{successful_orders}}$: Số đơn hàng ghi nhận thành công vào CSDL trong khoảng thời gian $\Delta t$.
- $N_{\text{failed_orders}}$: Số đơn gặp lỗi hệ thống.
- $N_{\text{total_attempts}}$: Tổng số yêu cầu tạo đơn gửi tới.

---

## KPI 4: Tỷ Lệ Hoàn Thành Luồng Mua Hàng (Checkout Completion Rate - $KPI_4$)

Chỉ số này đánh giá mức độ tối ưu hóa về mặt giao diện (UI) và trải nghiệm người dùng (UX) của ứng dụng React.js, đo lường tỷ lệ chuyển đổi từ bước thêm sản phẩm vào giỏ hàng đến khi tạo đơn thành công.

- **Chỉ số mục tiêu:** $CR \ge 55%$.
- **Công thức xác định:**

$$
CR = \left( \frac{N_{\text{completed\_orders}}}{N_{\text{cart\_creations}}} \right) \times 100\%
$$

Trong đó:

- $N_{\text{completed_orders}}$: Tổng số lượt đặt hàng thành công.
- $N_{\text{cart_creations}}$: Tổng số lượt người dùng thêm sản phẩm vào giỏ hàng.

---

## KPI 5: Mức Độ Sẵn Sàng Của Hệ Thống (System Availability / Uptime - $KPI_5$)

Chỉ số này đo lường độ ổn định vận hành liên tục của hạ tầng máy chủ ứng dụng web và cơ sở dữ liệu.

- **Chỉ số mục tiêu:** $A \ge 99.5%$.
- **Công thức xác định:**

$$
A = \left( \frac{T_{\text{total}} - T_{\text{downtime}}}{T_{\text{total}}} \right) \times 100\%
$$

Trong đó:

- $T_{\text{total}}$: Tổng thời gian theo dõi hệ thống.
- $T_{\text{downtime}}$: Tổng thời gian hệ thống ngừng hoạt động do lỗi kỹ thuật.

---

## KPI 6: Độ Chính Xác Tra Cứu Bảo Hành (Warranty Query Accuracy Rate - $KPI_6$)

Chỉ số này đo lường tính chính xác của module quản lý Serial/IMEI trong việc xuất thông tin bảo hành cho người dùng và nhân viên.

- **Chỉ số mục tiêu:** $Acc_{\text{warranty}} = 100%$ với thời gian phản hồi truy vấn $T_{\text{query}} < 300\text{ ms}$.
- **Công thức xác định:**

$$
Acc_{\text{warranty}} =
\left(
\frac{N_{\text{correct\_warranty\_results}}}
{N_{\text{total\_warranty\_queries}}}
\right)
\times 100\%
$$

Trong đó:

- $N_{\text{correct_warranty_results}}$: Số lượt truy vấn trả về thông tin bảo hành chính xác.
- $N_{\text{total_warranty_queries}}$: Tổng số lượt truy vấn bảo hành được thực hiện.

---

## Bảng Tổng Hợp KPI

| **Mã KPI** | **Tên chỉ số**                | **Phương pháp đo lường & Công cụ**                            | **Tiêu chuẩn đạt**                 |
| ---------- | ----------------------------- | ------------------------------------------------------------- | ---------------------------------- |
| $KPI_1$    | Thời gian phản hồi API        | Kiểm thử hiệu năng tự động bằng Apache JMeter / Postman       | $T_{\text{avg}} < 200\text{ ms}$   |
| $KPI_2$    | Độ trễ đồng bộ tồn kho        | Đo chênh lệch Timestamp từ Log Webhook đến CSDL MongoDB       | $T_{\text{sync}} \le 1.5\text{ s}$ |
| $KPI_3$    | Năng suất xử lý đồng thời     | Giả lập Load Testing giao dịch tạo đơn đồng thời              | $\ge 100\text{ TPS}, ER \le 0.1%$  |
| $KPI_4$    | Tỷ lệ hoàn thành mua hàng     | Phân tích luồng sự kiện người dùng (Event Tracking Analytics) | $CR \ge 55%$                       |
| $KPI_5$    | Mức độ sẵn sàng hệ thống      | Theo dõi trạng thái hoạt động bằng công cụ Uptime Monitor     | $A \ge 99.5%$                      |
| $KPI_6$    | Độ chính xác tra cứu bảo hành | Chạy kịch bản Integration Test kiểm tra dữ liệu Serial/IMEI   | $Acc = 100%, T < 300\text{ ms}$    |
