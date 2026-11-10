import { InventoryControlService } from './inventoryControl.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class InventoryControlController {
  // Stocktaking (UC-BM-05)
  static createStocktake = catchAsync(async (req, res) => {
    const stocktake = await InventoryControlService.createStocktake(req.body, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Khởi tạo phiên kiểm kho Serial thành công',
      data: { stocktake }
    });
  });

  static getStocktakes = catchAsync(async (req, res) => {
    const stocktakes = await InventoryControlService.getStocktakes(req.query, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách phiếu kiểm kho thành công',
      data: { stocktakes }
    });
  });

  static getStocktakeDetail = catchAsync(async (req, res) => {
    const stocktake = await InventoryControlService.getStocktakeDetail(req.params.id, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy chi tiết phiếu kiểm kho thành công',
      data: { stocktake }
    });
  });

  static scanStocktakeSerials = catchAsync(async (req, res) => {
    const result = await InventoryControlService.scanStocktakeSerials(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: `Đã ghi nhận ${result.newlyAddedCount} mã Serial kiểm kê`,
      data: result
    });
  });

  static completeStocktake = catchAsync(async (req, res) => {
    const stocktake = await InventoryControlService.completeStocktake(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Chốt biên bản kiểm kho định kỳ thành công',
      data: { stocktake }
    });
  });

  // Pull Transfer Requests (UC-BM-06)
  static createTransferRequest = catchAsync(async (req, res) => {
    const requestDoc = await InventoryControlService.createTransferRequest(req.body, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Đã gửi yêu cầu xin cấp hàng tới kho nguồn',
      data: { request: requestDoc }
    });
  });

  static getTransferRequests = catchAsync(async (req, res) => {
    const requests = await InventoryControlService.getTransferRequests(req.query, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách yêu cầu xin cấp hàng thành công',
      data: { requests }
    });
  });

  static approveTransferRequest = catchAsync(async (req, res) => {
    const result = await InventoryControlService.approveTransferRequest(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Đã duyệt yêu cầu cấp hàng thành công',
      data: result
    });
  });

  static rejectTransferRequest = catchAsync(async (req, res) => {
    const requestDoc = await InventoryControlService.rejectTransferRequest(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Đã từ chối yêu cầu cấp hàng',
      data: { request: requestDoc }
    });
  });

  // RMA Outbound (UC-BM-06)
  static getDefectiveSerials = catchAsync(async (req, res) => {
    const targetBranchId = req.scopedBranchId || req.query.branchId || req.user.branchId;
    const serials = await InventoryControlService.getDefectiveSerials(targetBranchId);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách máy lỗi (DEFECTIVE) tại chi nhánh thành công',
      data: { serials }
    });
  });

  static getRmaOutbounds = catchAsync(async (req, res) => {
    const rmaList = await InventoryControlService.getRmaOutbounds(req.query, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy lịch sử xuất trả hàng lỗi RMA thành công',
      data: { rmaOutbounds: rmaList }
    });
  });

  static createRmaOutbound = catchAsync(async (req, res) => {
    const rma = await InventoryControlService.createRmaOutbound(req.body, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Đã lập phiếu xuất lô hàng lỗi RMA thành công',
      data: { rmaOutbound: rma }
    });
  });
}
