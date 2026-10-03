# Module Auth (`/api/v1/auth`)

| Method | Endpoint | Mô tả | Quyền |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Đăng ký tài khoản Khách hàng B2C (mặc định role `CUSTOMER`). Cấp Access Token (15 phút) & Set-Cookie `refreshToken` (14 ngày). | Public (Rate limit 5/15m) |
| `POST` | `/auth/login` | Đăng nhập bằng Email/SĐT + Password. Phân hóa thời hạn Refresh Token: B2C (14 ngày) vs Nhân sự POS/Quản lý (8 giờ). | Public (Rate limit 5/15m) |
| `POST` | `/auth/refresh-token` | Đọc Refresh Token từ HttpOnly Cookie hoặc body, xoay vòng token (Token Rotation) và cấp Access Token mới. | Public |
| `POST` | `/auth/logout` | Đăng xuất phiên làm việc hiện tại, xóa bản ghi trong `user_sessions` và clear HttpOnly cookie. | Public |
| `POST` | `/auth/logout-all` | Thu hồi toàn bộ phiên làm việc của người dùng trên tất cả thiết bị (Global Revoke). | `CUSTOMER`, `STAFF`, `BRANCH_MANAGER`, `SUPER_ADMIN` |
| `GET` | `/auth/me` | Lấy thông tin cá nhân và chi nhánh làm việc của tài khoản hiện tại. | Authenticated |
| `POST` | `/auth/forgot-password` | Yêu cầu khôi phục mật khẩu qua Email/SĐT (tuyệt đối KHÔNG trả token trong JSON response). | Public |
| `POST` | `/auth/reset-password` | Đặt lại mật khẩu mới bằng token hợp lệ (thời hạn 15 phút), thu hồi tất cả phiên cũ. | Public |

