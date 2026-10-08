import { ProductService } from './product.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class ProductController {
  static createProduct = catchAsync(async (req, res) => {
    const product = await ProductService.createProduct(req.body);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Tạo sản phẩm mới thành công',
      data: { product }
    });
  });

  static getAllProducts = catchAsync(async (req, res) => {
    const result = await ProductService.getAllProducts(req.query);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách sản phẩm thành công',
      data: { products: result.products },
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  });

  static getProductBySlug = catchAsync(async (req, res) => {
    const product = await ProductService.getProductBySlug(req.params.slug);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy chi tiết sản phẩm thành công',
      data: { product }
    });
  });

  static updateProduct = catchAsync(async (req, res) => {
    const product = await ProductService.updateProduct(req.params.id, req.body);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cập nhật sản phẩm thành công',
      data: { product }
    });
  });

  static deleteProduct = catchAsync(async (req, res) => {
    await ProductService.deleteProduct(req.params.id);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Xóa sản phẩm thành công',
      data: {}
    });
  });
}
