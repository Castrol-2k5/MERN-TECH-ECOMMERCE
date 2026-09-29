import { BranchService } from './branch.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class BranchController {
  static createBranch = catchAsync(async (req, res) => {
    const branch = await BranchService.createBranch(req.body);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Tạo chi nhánh mới thành công',
      data: { branch }
    });
  });

  static getAllBranches = catchAsync(async (req, res) => {
    const branches = await BranchService.getAllBranches(req.query);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách chi nhánh thành công',
      data: {
        branches,
        total: branches.length
      }
    });
  });

  static getNearbyBranches = catchAsync(async (req, res) => {
    const { lng, lat, distance } = req.query;
    const branches = await BranchService.getNearbyBranches({ lng, lat, distance });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Tìm kiếm chi nhánh gần nhất thành công',
      data: {
        branches,
        total: branches.length
      }
    });
  });

  static getBranchById = catchAsync(async (req, res) => {
    const branch = await BranchService.getBranchById(req.params.id);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy thông tin chi nhánh thành công',
      data: { branch }
    });
  });

  static updateBranch = catchAsync(async (req, res) => {
    const branch = await BranchService.updateBranch(req.params.id, req.body);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cập nhật thông tin chi nhánh thành công',
      data: { branch }
    });
  });

  static deleteBranch = catchAsync(async (req, res) => {
    await BranchService.deleteBranch(req.params.id);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Xóa chi nhánh thành công',
      data: {}
    });
  });
}
