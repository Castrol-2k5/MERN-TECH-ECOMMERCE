import { InventoryService } from './inventory.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class InventoryController {
  static getInventoryByBranch = catchAsync(async (req, res) => {
    const branchId = req.scopedBranchId || req.params.branchId;
    const inventories = await InventoryService.getInventoryByBranch(branchId);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách tồn kho theo chi nhánh thành công',
      data: { inventories }
    });
  });

  static getInventoryBySku = catchAsync(async (req, res) => {
    const { productSkuId } = req.params;
    const availableBranches = await InventoryService.getInventoryBySku(productSkuId);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách chi nhánh còn hàng thành công',
      data: { availableBranches }
    });
  });

  static adjustStock = catchAsync(async (req, res) => {
    const result = await InventoryService.adjustStock(req.body, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Điều chỉnh tồn kho thành công',
      data: result
    });
  });
}
