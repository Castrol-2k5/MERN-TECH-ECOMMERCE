import { CategoryService } from './category.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendSuccess } from '../../utils/response.js';

export class CategoryController {
  static createCategory = catchAsync(async (req, res) => {
    const category = await CategoryService.createCategory(req.body);

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Tạo danh mục mới thành công',
      data: { category }
    });
  });

  static getAllCategories = catchAsync(async (req, res) => {
    const categories = await CategoryService.getAllCategories({ tree: req.query.tree });

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy danh sách danh mục thành công',
      data: {
        categories,
        total: categories.length
      }
    });
  });

  static getCategoryBySlug = catchAsync(async (req, res) => {
    const category = await CategoryService.getCategoryBySlug(req.params.slug);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Lấy chi tiết danh mục thành công',
      data: { category }
    });
  });

  static updateCategory = catchAsync(async (req, res) => {
    const category = await CategoryService.updateCategory(req.params.id, req.body);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Cập nhật danh mục thành công',
      data: { category }
    });
  });

  static deleteCategory = catchAsync(async (req, res) => {
    await CategoryService.deleteCategory(req.params.id);

    return sendSuccess(res, {
      statusCode: 200,
      message: 'Xóa danh mục thành công',
      data: {}
    });
  });
}
