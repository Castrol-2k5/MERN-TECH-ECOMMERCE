import { UserService } from './user.service.js';
import { CustomerLookupService } from './customerLookup.service.js';
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
    const user = await UserService.updateUser(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cập nhật thông tin tài khoản thành công',
      data: { user }
    });
  });

  static toggleUserStatus = catchAsync(async (req, res) => {
    const user = await UserService.toggleUserStatus(req.params.id, req.body.isActive, req.user);
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

  static getMyProfile = catchAsync(async (req, res) => {
    const user = await UserService.getMyProfile(req.user.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy thông tin hồ sơ thành công',
      data: { user }
    });
  });

  static updateMyProfile = catchAsync(async (req, res) => {
    const user = await UserService.updateMyProfile(req.user.id, req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cập nhật hồ sơ thành công',
      data: { user }
    });
  });

  static changeMyPassword = catchAsync(async (req, res) => {
    const result = await UserService.changeMyPassword(req.user.id, req.body);
    return sendSuccess(res, {
      statusCode: 200,
      message: result.message,
      data: result
    });
  });

  static lookupCustomerByPhone = catchAsync(async (req, res) => {
    const result = await CustomerLookupService.lookupByPhone(req.query.phone);
    return sendSuccess(res, {
      statusCode: 200,
      message: result.found ? 'Tìm thấy hồ sơ khách hàng' : 'Chưa có lịch sử khách hàng với SĐT này',
      data: result
    });
  });
}
