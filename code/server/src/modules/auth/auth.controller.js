import { AuthService } from './auth.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class AuthController {
  static register = catchAsync(async (req, res) => {
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.connection?.remoteAddress || '';

    const { user, accessToken, refreshToken, cookieOptions } = await AuthService.register(
      req.body,
      { deviceInfo, ipAddress }
    );

    // Set HttpOnly refresh token cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Đăng ký tài khoản thành công',
      data: {
        user,
        accessToken
      }
    });
  });

  static login = catchAsync(async (req, res) => {
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.connection?.remoteAddress || '';

    const { user, accessToken, refreshToken, cookieOptions } = await AuthService.login(
      req.body,
      { deviceInfo, ipAddress }
    );

    // Set HttpOnly refresh token cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Đăng nhập thành công',
      data: {
        user,
        accessToken
      }
    });
  });

  static refreshToken = catchAsync(async (req, res) => {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.connection?.remoteAddress || '';

    const { accessToken, refreshToken, cookieOptions } = await AuthService.refreshToken(
      rawRefreshToken,
      { deviceInfo, ipAddress }
    );

    // Update HttpOnly cookie with rotated token
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Làm mới token thành công',
      data: {
        accessToken
      }
    });
  });

  static logout = catchAsync(async (req, res) => {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    await AuthService.logout(rawRefreshToken);

    // Clear HttpOnly cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Đăng xuất thành công',
      data: {}
    });
  });

  static logoutAll = catchAsync(async (req, res) => {
    await AuthService.logoutAll(req.user.id);

    // Clear HttpOnly cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Đăng xuất khỏi toàn bộ thiết bị thành công',
      data: {}
    });
  });

  static getMe = catchAsync(async (req, res) => {
    const user = await AuthService.getMe(req.user.id);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy thông tin tài khoản thành công',
      data: {
        user
      }
    });
  });
}
