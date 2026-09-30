import { OrderService } from './order.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class OrderController {
  static createPosOrder = catchAsync(async (req, res) => {
    const order = await OrderService.createPosOrder(req.body, req.user);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Thanh toán đơn hàng tại quầy POS thành công',
      data: { order }
    });
  });

  static createB2cOrder = catchAsync(async (req, res) => {
    const order = await OrderService.createB2cOrder(req.body, req.user);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Đặt hàng trực tuyến thành công',
      data: { order }
    });
  });

  static getMyOrders = catchAsync(async (req, res) => {
    const result = await OrderService.getMyOrders(req.user.id, req.query);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy lịch sử đơn hàng cá nhân thành công',
      data: { orders: result.orders },
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  });

  static getBranchOrders = catchAsync(async (req, res) => {
    const targetBranchId = req.scopedBranchId || req.query.branchId;
    const result = await OrderService.getBranchOrders(targetBranchId, req.query);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách đơn hàng chi nhánh thành công',
      data: { orders: result.orders },
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  });

  static getOrderByCode = catchAsync(async (req, res) => {
    const { orderCode } = req.params;
    const order = await OrderService.getOrderByCode(orderCode, req.user);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy chi tiết đơn hàng thành công',
      data: { order }
    });
  });
}
