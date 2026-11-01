import { Category } from './category.model.js';
import { Product } from '../products/product.model.js';
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
        throw new AppError(
          'Danh mục cha không tồn tại hoặc đã bị vô hiệu hóa.',
          404,
          'PARENT_CATEGORY_NOT_FOUND'
        );
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
   * Get all active categories (flat list or nested tree) with productCount
   */
  static async getAllCategories({ tree = false } = {}) {
    const [categories, productCounts] = await Promise.all([
      Category.find({ isActive: true }).sort({ createdAt: 1 }).lean(),
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } }
      ])
    ]);

    const countMap = new Map();
    for (const item of productCounts) {
      if (item._id) {
        countMap.set(item._id.toString(), item.count || 0);
      }
    }

    const nameMap = new Map();
    for (const cat of categories) {
      nameMap.set(cat._id.toString(), cat.name);
    }

    const enrichedCategories = categories.map((cat) => ({
      ...cat,
      parentName: cat.parentId ? nameMap.get(cat.parentId.toString()) || null : null,
      productCount: countMap.get(cat._id.toString()) || 0
    }));

    if (tree === true || tree === 'true') {
      const categoryMap = new Map();
      enrichedCategories.forEach((cat) => {
        categoryMap.set(cat._id.toString(), { ...cat, children: [] });
      });

      const rootCategories = [];
      enrichedCategories.forEach((cat) => {
        const catNode = categoryMap.get(cat._id.toString());
        if (cat.parentId && categoryMap.has(cat.parentId.toString())) {
          categoryMap.get(cat.parentId.toString()).children.push(catNode);
        } else {
          rootCategories.push(catNode);
        }
      });

      return rootCategories;
    }

    return enrichedCategories;
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
   * Update category (with circular hierarchy protection)
   */
  static async updateCategory(categoryId, updateData) {
    // Prevent setting self as parent
    if (updateData.parentId && updateData.parentId.toString() === categoryId.toString()) {
      throw new AppError(
        'Danh mục không thể chọn chính mình làm danh mục cha.',
        400,
        'INVALID_PARENT_CATEGORY'
      );
    }

    // Check parent if provided and prevent circular descendant loop
    if (updateData.parentId) {
      const parent = await Category.findOne({ _id: updateData.parentId, isActive: true }).lean();
      if (!parent) {
        throw new AppError(
          'Danh mục cha không tồn tại hoặc đã bị vô hiệu hóa.',
          404,
          'PARENT_CATEGORY_NOT_FOUND'
        );
      }

      let cursorParentId = parent.parentId;
      while (cursorParentId) {
        if (cursorParentId.toString() === categoryId.toString()) {
          throw new AppError(
            'Không thể chọn danh mục con trực thuộc làm danh mục cha (vòng lặp phân cấp).',
            400,
            'INVALID_PARENT_CATEGORY'
          );
        }
        const ancestor = await Category.findById(cursorParentId).select('parentId').lean();
        cursorParentId = ancestor?.parentId || null;
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
          throw new AppError(
            `Slug '${newSlug}' đã được sử dụng bởi danh mục khác.`,
            400,
            'CATEGORY_EXISTS'
          );
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
   * Soft delete category (UC-AD04 5.2 & 5.a: Block deletion if active products or child categories exist)
   */
  static async deleteCategory(categoryId) {
    const existing = await Category.findOne({ _id: categoryId, isActive: true }).lean();
    if (!existing) {
      throw new AppError('Không tìm thấy danh mục cần xóa.', 404, 'CATEGORY_NOT_FOUND');
    }

    const [childCount, productCount] = await Promise.all([
      Category.countDocuments({ parentId: categoryId, isActive: true }),
      Product.countDocuments({ categoryId, isActive: true })
    ]);

    if (childCount > 0 || productCount > 0) {
      throw new AppError(
        'Không thể xóa danh mục đang có sản phẩm hoặc danh mục con liên kết. Vui lòng chuyển các sản phẩm liên quan trước.',
        400,
        'CATEGORY_IN_USE'
      );
    }

    const category = await Category.findOneAndUpdate(
      { _id: categoryId, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );

    return category;
  }
}
