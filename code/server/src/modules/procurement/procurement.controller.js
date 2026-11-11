import { ProcurementService } from './procurement.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class ProcurementController {
  static getVendors = catchAsync(async (req, res) => {
    const result = await ProcurementService.getVendors(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách nhà cung cấp thành công',
      data: result
    });
  });

  static createVendor = catchAsync(async (req, res) => {
    const vendor = await ProcurementService.createVendor(req.body, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Tạo nhà cung cấp mới thành công',
      data: { vendor }
    });
  });

  static updateVendor = catchAsync(async (req, res) => {
    const vendor = await ProcurementService.updateVendor(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cập nhật nhà cung cấp thành công',
      data: { vendor }
    });
  });

  static recordVendorPayment = catchAsync(async (req, res) => {
    const result = await ProcurementService.recordVendorPayment(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Ghi nhận thanh toán công nợ nhà cung cấp thành công',
      data: result
    });
  });

  static getPurchaseOrders = catchAsync(async (req, res) => {
    const result = await ProcurementService.getPurchaseOrders(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách phiếu nhập kho HQ thành công',
      data: result
    });
  });

  static createPurchaseOrder = catchAsync(async (req, res) => {
    const purchaseOrder = await ProcurementService.createPurchaseOrder(req.body, req.user);
    return sendSuccess(res, {
      statusCode: 201,
      message: 'Tạo phiếu nhập mua kho tổng thành công',
      data: { purchaseOrder }
    });
  });

  static updatePurchaseOrderStatus = catchAsync(async (req, res) => {
    const purchaseOrder = await ProcurementService.updatePurchaseOrderStatus(
      req.params.id,
      req.body.status
    );
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cập nhật trạng thái phiếu nhập thành công',
      data: { purchaseOrder }
    });
  });

  static receivePurchaseOrder = catchAsync(async (req, res) => {
    const result = await ProcurementService.receivePurchaseOrder(req.params.id, req.body, req.user);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Xác nhận nhập hàng vào Kho Tổng & cập nhật giá vốn thành công',
      data: result
    });
  });
}
