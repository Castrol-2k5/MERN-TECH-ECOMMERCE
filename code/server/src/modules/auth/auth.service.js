import { User, USER_ROLES } from '../users/user.model.js';
import { Session } from './session.model.js';
import { AppError } from '../../utils/appError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getCookieOptions
} from '../../utils/token.js';

// Durations in milliseconds
const REFRESH_TOKEN_DURATION_CUSTOMER_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const REFRESH_TOKEN_DURATION_STAFF_MS = 8 * 60 * 60 * 1000; // 8 hours (work shift)

/**
 * Determine session duration based on user role
 */
const getSessionDuration = (role) => {
  if (role === USER_ROLES.CUSTOMER) {
    return REFRESH_TOKEN_DURATION_CUSTOMER_MS;
  }
  return REFRESH_TOKEN_DURATION_STAFF_MS;
};

export class AuthService {
  /**
   * Register a new B2C Customer account
   */
  static async register({ fullName, email, phone, password }, { deviceInfo, ipAddress }) {
    // Check for existing email or phone
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { phone }]
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        throw new AppError('Email này đã được sử dụng. Vui lòng chọn email khác.', 400, 'USER_EXISTS');
      }
      throw new AppError('Số điện thoại này đã được sử dụng. Vui lòng chọn số khác.', 400, 'USER_EXISTS');
    }

    // Role is strictly hardcoded to CUSTOMER
    const newUser = await User.create({
      fullName,
      email: email.toLowerCase(),
      phone,
      passwordHash: password, // Will be hashed by pre-save hook
      role: USER_ROLES.CUSTOMER,
      branchId: null,
      isActive: true
    });

    // Create session
    const rawRefreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(rawRefreshToken);
    const durationMs = getSessionDuration(newUser.role);
    const expiresAt = new Date(Date.now() + durationMs);

    await Session.create({
      userId: newUser._id,
      refreshTokenHash,
      deviceInfo: deviceInfo || 'Unknown Device',
      ipAddress: ipAddress || '',
      expiresAt
    });

    const accessToken = generateAccessToken({
      id: newUser._id.toString(),
      role: newUser.role,
      branchId: null
    });

    return {
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      },
      accessToken,
      refreshToken: rawRefreshToken,
      cookieOptions: getCookieOptions(durationMs)
    };
  }

  /**
   * Authenticate user with identifier (email or phone) and password
   */
  static async login({ identifier, password }, { deviceInfo, ipAddress }) {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);

    const query = isEmail
      ? { email: identifier.toLowerCase().trim() }
      : { phone: identifier.trim() };

    const user = await User.findOne(query).select('+passwordHash +isActive');

    if (!user) {
      throw new AppError('Tài khoản hoặc mật khẩu không chính xác.', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Tài khoản hoặc mật khẩu không chính xác.', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.', 403, 'ACCOUNT_LOCKED');
    }

    // Role-differentiated session duration: B2C (14 days) vs POS Staff / Admin (8 hours)
    const durationMs = getSessionDuration(user.role);
    const rawRefreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + durationMs);

    await Session.create({
      userId: user._id,
      refreshTokenHash,
      deviceInfo: deviceInfo || 'Unknown Device',
      ipAddress: ipAddress || '',
      expiresAt
    });

    const accessToken = generateAccessToken({
      id: user._id.toString(),
      role: user.role,
      branchId: user.branchId ? user.branchId.toString() : null
    });

    return {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        branchId: user.branchId || null
      },
      accessToken,
      refreshToken: rawRefreshToken,
      cookieOptions: getCookieOptions(durationMs)
    };
  }

  /**
   * Refresh Access Token using Refresh Token from cookie or body
   */
  static async refreshToken(rawRefreshToken, { deviceInfo, ipAddress }) {
    if (!rawRefreshToken) {
      throw new AppError('Refresh token là bắt buộc.', 401, 'REFRESH_TOKEN_REQUIRED');
    }

    const hashedToken = hashToken(rawRefreshToken);
    const session = await Session.findOne({ refreshTokenHash: hashedToken });

    if (!session) {
      throw new AppError('Phiên đăng nhập không hợp lệ hoặc đã bị hủy.', 401, 'INVALID_SESSION');
    }

    if (new Date() > session.expiresAt) {
      await Session.findByIdAndDelete(session._id);
      throw new AppError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 401, 'SESSION_EXPIRED');
    }

    const user = await User.findById(session.userId);
    if (!user || !user.isActive) {
      await Session.findByIdAndDelete(session._id);
      throw new AppError('Tài khoản người dùng không tồn tại hoặc đã bị khóa.', 401, 'UNAUTHORIZED');
    }

    // Token Rotation for security
    const newRawRefreshToken = generateRefreshToken();
    const newRefreshTokenHash = hashToken(newRawRefreshToken);
    const durationMs = getSessionDuration(user.role);
    const newExpiresAt = new Date(Date.now() + durationMs);

    session.refreshTokenHash = newRefreshTokenHash;
    session.expiresAt = newExpiresAt;
    if (deviceInfo) session.deviceInfo = deviceInfo;
    if (ipAddress) session.ipAddress = ipAddress;
    await session.save();

    const newAccessToken = generateAccessToken({
      id: user._id.toString(),
      role: user.role,
      branchId: user.branchId ? user.branchId.toString() : null
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
      cookieOptions: getCookieOptions(durationMs)
    };
  }

  /**
   * Logout single session
   */
  static async logout(rawRefreshToken) {
    if (rawRefreshToken) {
      const hashedToken = hashToken(rawRefreshToken);
      await Session.findOneAndDelete({ refreshTokenHash: hashedToken });
    }
  }

  /**
   * Logout all sessions of a user (Global Revocation)
   */
  static async logoutAll(userId) {
    await Session.deleteMany({ userId });
  }

  /**
   * Get current user profile
   */
  static async getMe(userId) {
    const user = await User.findById(userId)
      .populate('branchId', 'branchCode name address phone')
      .lean();

    if (!user) {
      throw new AppError('Không tìm thấy thông tin người dùng.', 404, 'USER_NOT_FOUND');
    }

    return user;
  }
}
