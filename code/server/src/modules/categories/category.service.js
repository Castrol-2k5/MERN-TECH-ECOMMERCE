import { Category } from './category.model.js';
import { AppError } from '../../utils/appError.js';
import { slugify } from '../../utils/slugify.js';

export class CategoryService {
  /**
   * Create a new category
   */
  static async createCategory(categoryData) {
    const slug = categoryData.slug
      ? slugify(categoryData.slug)
      : slugify(categoryData.name);

    if (!slug) {
      throw new AppError('Không thể tạo slug từ tên danh mục.', 400, 'INVALID_CATEGORY_NAME');
    }

    // Check duplicate slug
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      throw new AppError(
        `Danh mục với slug '${slug}' đã tồn tại trong hệ thống.`,
        400,
        'CATEGORY_EXISTS'
      );
    }

    // Check parentId if provided
    if (categoryData.parentId) {
      const parent = await Category.findOne({ _id: categoryData.parentId, isActive: true });
      if (!parent) {
        throw new AppError('Danh mục cha không tồn tại hoặc đã bị vô hiệu hóa.', 404, 'PARENT_CATEGORY_NOT_FOUND');
      }
    }

    // Clean attributeKeys
    const attributeKeys = Array.isArray(categoryData.attributeKeys)
      ? [...new Set(categoryData.attributeKeys.map((k) => k.trim().toLowerCase()).filter(Boolean))]
      : [];

    const category = await Category.create({
      name: categoryData.name,
      slug,
      parentId: categoryData.parentId || null,
      attributeKeys,
      isActive: categoryData.isActive !== undefined ? categoryData.isActive : true
    });

    return category;
  }

  /**
   * Get all active categories (flat list or nested tree)
   */
  static async getAllCategories({ tree = false } = {}) {
    const categories = await Category.find({ isActive: true })
      .sort({ createdAt: 1 })
      .lean();

    if (tree === true || tree === 'true') {
      const categoryMap = new Map();
      categories.forEach((cat) => {
        categoryMap.set(cat._id.toString(), { ...cat, children: [] });
      });

      const rootCategories = [];
      categories.forEach((cat) => {
        const catNode = categoryMap.get(cat._id.toString());
        if (cat.parentId && categoryMap.has(cat.parentId.toString())) {
          categoryMap.get(cat.parentId.toString()).children.push(catNode);
        } else {
          rootCategories.push(catNode);
        }
      });

      return rootCategories;
    }

    return categories;
  }

  /**
   * Get category detail by slug (including attributeKeys for dynamic filters)
   */
  static async getCategoryBySlug(slug) {
    const category = await Category.findOne({ slug: slug.toLowerCase(), isActive: true })
      .populate('parentId', 'name slug')
      .lean();

    if (!category) {
      throw new AppError('Không tìm thấy danh mục yêu cầu.', 404, 'CATEGORY_NOT_FOUND');
    }

    return category;
  }

  /**
   * Update category
   */
  static async updateCategory(categoryId, updateData) {
    // Prevent setting self as parent
    if (updateData.parentId && updateData.parentId.toString() === categoryId.toString()) {
      throw new AppError('Danh mục không thể chọn chính mình làm danh mục cha.', 400, 'INVALID_PARENT_CATEGORY');
    }

    // Check parent if provided
    if (updateData.parentId) {
      const parent = await Category.findOne({ _id: updateData.parentId, isActive: true });
      if (!parent) {
        throw new AppError('Danh mục cha không tồn tại hoặc đã bị vô hiệu hóa.', 404, 'PARENT_CATEGORY_NOT_FOUND');
      }
    }

    // Handle slug update
    if (updateData.slug || updateData.name) {
      const newSlug = updateData.slug ? slugify(updateData.slug) : slugify(updateData.name);
      if (newSlug) {
        const existingCategory = await Category.findOne({
          slug: newSlug,
          _id: { $ne: categoryId }
        });
        if (existingCategory) {
          throw new AppError(`Slug '${newSlug}' đã được sử dụng bởi danh mục khác.`, 400, 'CATEGORY_EXISTS');
        }
        updateData.slug = newSlug;
      }
    }

    // Clean attributeKeys
    if (Array.isArray(updateData.attributeKeys)) {
      updateData.attributeKeys = [
        ...new Set(updateData.attributeKeys.map((k) => k.trim().toLowerCase()).filter(Boolean))
      ];
    }

    const category = await Category.findOneAndUpdate(
      { _id: categoryId, isActive: true },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!category) {
      throw new AppError('Không tìm thấy danh mục cần cập nhật.', 404, 'CATEGORY_NOT_FOUND');
    }

    return category;
  }

  /**
   * Soft delete category
   */
  static async deleteCategory(categoryId) {
    const category = await Category.findOneAndUpdate(
      { _id: categoryId, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!category) {
      throw new AppError('Không tìm thấy danh mục cần xóa.', 404, 'CATEGORY_NOT_FOUND');
    }

    return category;
  }
}
