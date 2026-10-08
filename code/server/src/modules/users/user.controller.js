import { UserService } from './user.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class UserController {
  static getAllUsers = catchAsync(async (req, res) => {
    const result = await UserService.getUsers(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách người dùng thành công',
      data: { users: result.users },
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  });

  static getUserById = catchAsync(async (req, res) => {
    const user = await UserService.getUserById(req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy thông tin người dùng thành công',
      data: { user }
    });
  });

  static createUser = catchAsync(async (req, res) => {
    const user = await UserService.createUser(req.body, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Khởi tạo tài khoản nhân sự thành công',
      data: { user }
    });
  });

  static updateUser = catchAsync(async (req, res) => {
    const user = await UserService.updateUser(req.params.id, req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cập nhật thông tin tài khoản thành công',
      data: { user }
    });
  });

  static toggleUserStatus = catchAsync(async (req, res) => {
    const user = await UserService.toggleUserStatus(req.params.id, req.body.isActive);
    return sendSuccess(res, {
      statusCode: 200,
      message: `Đã ${req.body.isActive ? 'kích hoạt' : 'tạm khóa'} tài khoản thành công`,
      data: { user }
    });
  });

  static deleteUser = catchAsync(async (req, res) => {
    const result = await UserService.deleteUser(req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result
    });
  });
}
