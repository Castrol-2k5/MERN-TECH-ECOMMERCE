import { User, USER_ROLES } from './user.model.js';
import { Branch } from '../branches/branch.model.js';
import { AppError } from '../../utils/appError.js';

export class UserService {
  static async getUsers(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    if (query.role) {
      filter.role = query.role;
    }

    if (query.branchId) {
      filter.branchId = query.branchId;
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true' || query.isActive === true;
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .populate('branchId', 'name code address phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

    return {
      users,
      total,
      page,
      totalPages,
      limit
    };
  }

  static async getUserById(id) {
    const user = await User.findById(id)
      .populate('branchId', 'name code address phone')
      .lean();

    if (!user) {
      throw new AppError('Không tìm thấy tài khoản người dùng', 404, 'USER_NOT_FOUND');
    }

    return user;
  }

  static async createUser(payload, currentUser) {
    const { fullName, email, phone, password, role, branchId, isActive } = payload;

    // 0. Kiểm tra quyền của người thực hiện
    if (currentUser && currentUser.role === USER_ROLES.BRANCH_MANAGER) {
      if (role !== USER_ROLES.STAFF) {
        throw new AppError('Quản lý chi nhánh chỉ được phép khởi tạo tài khoản nhân viên (STAFF)', 403, 'FORBIDDEN');
      }
      const managerBranchId = currentUser.branchId?._id?.toString() || currentUser.branchId?.toString();
      if (branchId && branchId.toString() !== managerBranchId) {
        throw new AppError('Bạn chỉ có quyền tạo nhân viên cho chính chi nhánh của mình', 403, 'CROSS_BRANCH_FORBIDDEN');
      }
    }

    // 1. Kiểm tra trùng lặp email và số điện thoại
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      throw new AppError('Địa chỉ email đã được đăng ký bởi tài khoản khác', 409, 'EMAIL_ALREADY_EXISTS');
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      throw new AppError('Số điện thoại đã được đăng ký bởi tài khoản khác', 409, 'PHONE_ALREADY_EXISTS');
    }

    // 2. Kiểm tra ràng buộc chi nhánh nếu là nhân sự
    if (role === USER_ROLES.STAFF || role === USER_ROLES.BRANCH_MANAGER) {
      if (!branchId) {
        throw new AppError('Chi nhánh là bắt buộc đối với nhân viên (STAFF) và quản lý chi nhánh (BRANCH_MANAGER)', 400, 'BRANCH_REQUIRED');
      }

      const branch = await Branch.findById(branchId);
      if (!branch) {
        throw new AppError('Chi nhánh được chỉ định không tồn tại', 404, 'BRANCH_NOT_FOUND');
      }
    }

    // 3. Khởi tạo User (passwordHash sẽ được pre-save hook mã hóa tự động)
    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      phone,
      passwordHash: password,
      role: role || USER_ROLES.CUSTOMER,
      branchId: branchId || null,
      isActive: isActive !== undefined ? isActive : true
    });

    await newUser.save();

    const createdUser = await User.findById(newUser._id)
      .populate('branchId', 'name code address phone')
      .lean();

    return createdUser;
  }

  static async updateUser(id, payload) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('Không tìm thấy tài khoản người dùng', 404, 'USER_NOT_FOUND');
    }

    // 1. Kiểm tra trùng lặp email / phone nếu có cập nhật
    if (payload.email && payload.email.toLowerCase() !== user.email) {
      const existingEmail = await User.findOne({ email: payload.email.toLowerCase(), _id: { $ne: id } });
      if (existingEmail) {
        throw new AppError('Địa chỉ email đã được sử dụng bởi tài khoản khác', 409, 'EMAIL_ALREADY_EXISTS');
      }
      user.email = payload.email.toLowerCase();
    }

    if (payload.phone && payload.phone !== user.phone) {
      const existingPhone = await User.findOne({ phone: payload.phone, _id: { $ne: id } });
      if (existingPhone) {
        throw new AppError('Số điện thoại đã được sử dụng bởi tài khoản khác', 409, 'PHONE_ALREADY_EXISTS');
      }
      user.phone = payload.phone;
    }

    if (payload.fullName) {
      user.fullName = payload.fullName;
    }

    if (payload.role) {
      user.role = payload.role;
    }

    if (payload.branchId !== undefined) {
      if (payload.branchId) {
        const branch = await Branch.findById(payload.branchId);
        if (!branch) {
          throw new AppError('Chi nhánh chỉ định không tồn tại', 404, 'BRANCH_NOT_FOUND');
        }
        user.branchId = payload.branchId;
      } else {
        user.branchId = null;
      }
    }

    // Kiểm tra ràng buộc chi nhánh nếu role là nhân sự
    if ((user.role === USER_ROLES.STAFF || user.role === USER_ROLES.BRANCH_MANAGER) && !user.branchId) {
      throw new AppError('Chi nhánh là bắt buộc đối với nhân viên (STAFF) và quản lý chi nhánh (BRANCH_MANAGER)', 400, 'BRANCH_REQUIRED');
    }

    if (payload.isActive !== undefined) {
      user.isActive = payload.isActive;
    }

    if (payload.password) {
      user.passwordHash = payload.password; // pre-save hook sẽ hash lại vì isModified('passwordHash') === true
    }

    await user.save();

    const updatedUser = await User.findById(id)
      .populate('branchId', 'name code address phone')
      .lean();

    return updatedUser;
  }

  static async toggleUserStatus(id, isActive) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('Không tìm thấy tài khoản người dùng', 404, 'USER_NOT_FOUND');
    }

    user.isActive = isActive;
    await user.save();

    return {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive
    };
  }

  static async deleteUser(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('Không tìm thấy tài khoản người dùng', 404, 'USER_NOT_FOUND');
    }

    // Xóa mềm: đánh dấu isActive = false
    user.isActive = false;
    await user.save();

    return { success: true, message: 'Đã vô hiệu hóa tài khoản người dùng thành công' };
  }
}
