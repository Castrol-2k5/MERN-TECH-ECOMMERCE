import { CartService } from './cart.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class CartController {
  static getMyCart = catchAsync(async (req, res) => {
    const cart = await CartService.getMyCart(req.user.id, req.query.branchId || null);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy giỏ hàng đồng bộ thành công',
      data: { cart }
    });
  });

  static mergeCart = catchAsync(async (req, res) => {
    const { items, branchId } = req.body;
    const cart = await CartService.mergeCart(req.user.id, items, branchId);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Đồng bộ và hợp nhất giỏ hàng thành công',
      data: { cart }
    });
  });

  static syncCart = catchAsync(async (req, res) => {
    const { items, branchId } = req.body;
    const cart = await CartService.syncCart(req.user.id, items, branchId);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cập nhật giỏ hàng thành công',
      data: { cart }
    });
  });

  static previewCart = catchAsync(async (req, res) => {
    const { items, branchId } = req.body;
    const cart = await CartService.previewCart(items, branchId || null);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Kiểm tra giá và tồn kho giỏ hàng thành công',
      data: { cart }
    });
  });
}
