import { AppError } from '../utils/appError.js';
import { USER_ROLES } from '../modules/users/user.model.js';

/**
 * RBAC authorization middleware: checks if current user has any of the allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('Không thể xác thực quyền truy cập.', 401, 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Bạn không có quyền thực hiện hành động này. Yêu cầu một trong các vai trò: [${roles.join(', ')}]`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
};

/**
 * Branch scoping middleware: enforces data isolation between branches
 * - SUPER_ADMIN: can view across branches or filter by requested branchId
 * - STAFF / BRANCH_MANAGER: strictly scoped to req.user.branchId
 */
export const scopeBranch = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Không tìm thấy ngữ cảnh người dùng.', 401, 'UNAUTHORIZED'));
  }

  const { role, branchId } = req.user;

  // SUPER_ADMIN has full omnichannel access
  if (role === USER_ROLES.SUPER_ADMIN) {
    // If super admin specified a branchId in query/body/params, use it; otherwise null (all branches)
    req.scopedBranchId = req.query?.branchId || req.body?.branchId || req.params?.branchId || null;
    return next();
  }

  // Branch-level personnel (STAFF, BRANCH_MANAGER)
  if (role === USER_ROLES.STAFF || role === USER_ROLES.BRANCH_MANAGER) {
    if (!branchId) {
      return next(
        new AppError('Tài khoản nhân sự chưa được gắn với chi nhánh nào. Vui lòng liên hệ Quản trị viên.', 403, 'BRANCH_NOT_ASSIGNED')
      );
    }

    // Forcefully scope to assigned branch and override any attempt to query/manipulate another branch
    req.scopedBranchId = branchId.toString();
    if (req.query) {
      req.query.branchId = branchId.toString();
    }
    if (req.body && typeof req.body === 'object') {
      req.body.branchId = branchId.toString();
    }
    if (req.params && typeof req.params === 'object' && req.params.branchId) {
      req.params.branchId = branchId.toString();
    }

    return next();
  }

  // CUSTOMER: no branch isolation restriction, or handled separately
  req.scopedBranchId = req.query?.branchId || req.body?.branchId || req.params?.branchId || null;
  next();
};
