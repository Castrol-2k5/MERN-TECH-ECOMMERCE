import { verifyAccessToken } from '../utils/token.js';
import { User } from '../modules/users/user.model.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';

export const protect = catchAsync(async (req, res, next) => {
  let token;

  // 1. Extract Bearer token from Authorization Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Vui lòng đăng nhập để truy cập tài nguyên này.', 401, 'UNAUTHORIZED');
  }

  // 2. Verify token
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Token truy cập đã hết hạn. Vui lòng làm mới token hoặc đăng nhập lại.', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Token truy cập không hợp lệ. Vui lòng đăng nhập lại.', 401, 'UNAUTHORIZED');
  }

  // 3. Check if user still exists and is active
  const currentUser = await User.findById(decoded.id).select('+isActive');
  if (!currentUser) {
    throw new AppError('Tài khoản liên kết với token này không còn tồn tại.', 401, 'USER_NOT_FOUND');
  }

  if (!currentUser.isActive) {
    throw new AppError('Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.', 403, 'ACCOUNT_LOCKED');
  }

  // 4. Attach user context to request
  req.user = {
    id: currentUser._id.toString(),
    email: currentUser.email,
    fullName: currentUser.fullName,
    role: currentUser.role,
    branchId: currentUser.branchId ? currentUser.branchId.toString() : null
  };

  next();
});

export const optionalProtect = catchAsync(async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return protect(req, res, next);
  }
  next();
});
