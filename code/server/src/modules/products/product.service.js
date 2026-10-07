import mongoose from 'mongoose';
import { Product } from './product.model.js';
import { Category } from '../categories/category.model.js';
import { AppError } from '../../utils/appError.js';
import { slugify } from '../../utils/slugify.js';

export class ProductService {
  /**
   * Tạo sản phẩm mới kèm SKUs và Attributes
   */
  static async createProduct(productData) {
    const slug = productData.slug
      ? slugify(productData.slug)
      : slugify(productData.name);

    if (!slug) {
      throw new AppError('Không thể tạo slug từ tên sản phẩm.', 400, 'INVALID_PRODUCT_NAME');
    }

    // Kiểm tra trùng lặp slug
    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      throw new AppError(
        `Sản phẩm với slug '${slug}' đã tồn tại trong hệ thống.`,
        400,
        'PRODUCT_EXISTS'
      );
    }

    // Kiểm tra Category tồn tại
    const category = await Category.findOne({ _id: productData.categoryId, isActive: true });
    if (!category) {
      throw new AppError('Danh mục sản phẩm không tồn tại hoặc đã bị vô hiệu hóa.', 404, 'CATEGORY_NOT_FOUND');
    }

    // Chuẩn hóa và đối soát attributes với category.attributeKeys
    const normalizedAttributes = Array.isArray(productData.attributes)
      ? productData.attributes.map((attr) => ({
          key: attr.key.trim().toLowerCase(),
          value: attr.value.trim()
        }))
      : [];

    if (Array.isArray(category.attributeKeys) && category.attributeKeys.length > 0) {
      const allowedKeys = new Set(category.attributeKeys.map((k) => k.trim().toLowerCase()));
      const invalidKeys = normalizedAttributes
        .map((attr) => attr.key)
        .filter((key) => !allowedKeys.has(key));

      if (invalidKeys.length > 0) {
        throw new AppError(
          `Thuộc tính '${invalidKeys.join(', ')}' không hợp lệ đối với danh mục '${category.name}'.`,
          400,
          'INVALID_ATTRIBUTE_KEY'
        );
      }
    }

    // Chuẩn hóa và kiểm tra trùng lặp mã SKU trong cùng một sản phẩm
    const normalizedSkus = productData.skus.map((sku) => {
      const skuCode = sku.sku.trim().toUpperCase();
      const price = Number(sku.price);
      const salePrice = sku.salePrice !== undefined && sku.salePrice !== null ? Number(sku.salePrice) : price;

      return {
        ...sku,
        sku: skuCode,
        price,
        salePrice
      };
    });

    const skuCodes = normalizedSkus.map((s) => s.sku);
    if (new Set(skuCodes).size !== skuCodes.length) {
      throw new AppError('Mã SKU không được trùng lặp trong cùng một sản phẩm.', 400, 'DUPLICATE_SKU_CODE');
    }

    const product = await Product.create({
      ...productData,
      slug,
      attributes: normalizedAttributes,
      skus: normalizedSkus,
      isSerialManaged: productData.isSerialManaged !== undefined ? productData.isSerialManaged : true,
      isActive: productData.isActive !== undefined ? productData.isActive : true
    });

    return product;
  }

  /**
   * Lấy danh sách sản phẩm phân trang, tìm kiếm và bộ lọc động (Dynamic Filter Engine)
   */
  static async getAllProducts(queryParams = {}) {
    const reservedKeys = new Set([
      'page',
      'limit',
      'category',
      'brand',
      'minPrice',
      'maxPrice',
      'search',
      'sortBy'
    ]);

    const {
      page = 1,
      limit = 12,
      category,
      brand,
      minPrice,
      maxPrice,
      search,
      sortBy = 'newest'
    } = queryParams;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const filterConditions = { isActive: true };

    // 1. Lọc theo Category (hỗ trợ cả slug lẫn ObjectId)
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        filterConditions.categoryId = category;
      } else {
        const foundCategory = await Category.findOne({
          slug: category.toLowerCase().trim(),
          isActive: true
        }).lean();

        if (!foundCategory) {
          return {
            products: [],
            total: 0,
            page: pageNum,
            totalPages: 0,
            limit: limitNum,
            availableBrands: []
          };
        }
        filterConditions.categoryId = foundCategory._id;
      }
    }

    // 2. Lọc theo Brand (case-insensitive)
    if (brand && brand.trim()) {
      filterConditions.brand = { $regex: new RegExp(`^${brand.trim()}$`, 'i') };
    }

    // 3. Tìm kiếm từ khóa trên name hoặc brand
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filterConditions.$or = [
        { name: searchRegex },
        { brand: searchRegex }
      ];
    }

    // 4. Lọc theo khoảng giá biến thể SKU (skus.salePrice)
    const priceCondition = {};
    if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
      priceCondition.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
      priceCondition.$lte = Number(maxPrice);
    }
    if (Object.keys(priceCondition).length > 0) {
      filterConditions.skus = {
        $elemMatch: {
          salePrice: priceCondition,
          isActive: true
        }
      };
    }

    // 5. Dynamic Attributes Filter Engine: toán tử $all kết hợp $elemMatch
    const dynamicAttributesArray = [];
    for (const [key, value] of Object.entries(queryParams)) {
      if (!reservedKeys.has(key) && value !== undefined && value !== null && value !== '') {
        dynamicAttributesArray.push({
          key: key.toLowerCase().trim(),
          value: String(value).trim()
        });
      }
    }

    if (dynamicAttributesArray.length > 0) {
      filterConditions.attributes = {
        $all: dynamicAttributesArray.map(({ key, value }) => ({
          $elemMatch: { key, value }
        }))
      };
    }

    // 6. Sắp xếp kết quả
    let sortOptions = { createdAt: -1 };
    if (sortBy === 'price_asc') {
      sortOptions = { 'skus.salePrice': 1 };
    } else if (sortBy === 'price_desc') {
      sortOptions = { 'skus.salePrice': -1 };
    } else if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 };
    } else if (sortBy === 'popular') {
      // Sắp xếp theo số lượng đã bán (hoặc fallback về { createdAt: -1 } nếu chưa có trường thống kê lượt mua)
      sortOptions = { createdAt: -1 };
    }

    // 7. Thực thi truy vấn với .lean() tối ưu độ trễ T_avg < 200ms
    const skip = (pageNum - 1) * limitNum;

    // Lấy danh sách thương hiệu thực tế đang có sản phẩm active (theo danh mục nếu có lọc theo danh mục)
    const brandMatch = { isActive: true };
    if (filterConditions.categoryId) {
      brandMatch.categoryId = new mongoose.Types.ObjectId(filterConditions.categoryId);
    }

    const [total, products, brandFacets] = await Promise.all([
      Product.countDocuments(filterConditions),
      Product.find(filterConditions)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate('categoryId', 'name slug attributeKeys')
        .lean(),
      Product.aggregate([
        { $match: brandMatch },
        {
          $group: {
            _id: '$brand',
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            brand: '$_id',
            count: 1
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    const totalPages = Math.ceil(total / limitNum) || (total === 0 ? 0 : 1);

    return {
      products,
      total,
      page: pageNum,
      totalPages,
      limit: limitNum,
      availableBrands: brandFacets || []
    };
  }

  /**
   * Lấy chi tiết sản phẩm theo slug
   */
  static async getProductBySlug(slug) {
    const product = await Product.findOne({ slug: slug.toLowerCase().trim(), isActive: true })
      .populate('categoryId', 'name slug attributeKeys')
      .lean();

    if (!product) {
      throw new AppError('Không tìm thấy sản phẩm yêu cầu.', 404, 'PRODUCT_NOT_FOUND');
    }

    return product;
  }

  /**
   * Cập nhật thông tin sản phẩm
   */
  static async updateProduct(productId, updateData) {
    const existingProduct = await Product.findOne({ _id: productId, isActive: true });
    if (!existingProduct) {
      throw new AppError('Không tìm thấy sản phẩm cần cập nhật.', 404, 'PRODUCT_NOT_FOUND');
    }

    // Xử lý cập nhật slug
    if (updateData.slug || updateData.name) {
      const newSlug = updateData.slug ? slugify(updateData.slug) : slugify(updateData.name);
      if (newSlug) {
        const duplicate = await Product.findOne({
          slug: newSlug,
          _id: { $ne: productId }
        });
        if (duplicate) {
          throw new AppError(`Slug '${newSlug}' đã được sử dụng bởi sản phẩm khác.`, 400, 'PRODUCT_EXISTS');
        }
        updateData.slug = newSlug;
      }
    }

    // Xử lý danh mục và thuộc tính động
    const targetCategoryId = updateData.categoryId || existingProduct.categoryId;
    if (updateData.categoryId) {
      const cat = await Category.findOne({ _id: targetCategoryId, isActive: true });
      if (!cat) {
        throw new AppError('Danh mục sản phẩm không tồn tại hoặc đã bị vô hiệu hóa.', 404, 'CATEGORY_NOT_FOUND');
      }
    }

    if (updateData.attributes) {
      const cat = await Category.findOne({ _id: targetCategoryId, isActive: true });
      updateData.attributes = updateData.attributes.map((attr) => ({
        key: attr.key.trim().toLowerCase(),
        value: attr.value.trim()
      }));

      if (cat && Array.isArray(cat.attributeKeys) && cat.attributeKeys.length > 0) {
        const allowedKeys = new Set(cat.attributeKeys.map((k) => k.trim().toLowerCase()));
        const invalidKeys = updateData.attributes
          .map((attr) => attr.key)
          .filter((key) => !allowedKeys.has(key));

        if (invalidKeys.length > 0) {
          throw new AppError(
            `Thuộc tính '${invalidKeys.join(', ')}' không hợp lệ đối với danh mục '${cat.name}'.`,
            400,
            'INVALID_ATTRIBUTE_KEY'
          );
        }
      }
    }

    // Xử lý cập nhật SKUs
    if (updateData.skus) {
      updateData.skus = updateData.skus.map((sku) => {
        const price = Number(sku.price);
        const salePrice = sku.salePrice !== undefined && sku.salePrice !== null ? Number(sku.salePrice) : price;

        return {
          ...sku,
          sku: sku.sku.trim().toUpperCase(),
          price,
          salePrice
        };
      });

      const skuCodes = updateData.skus.map((s) => s.sku);
      if (new Set(skuCodes).size !== skuCodes.length) {
        throw new AppError('Mã SKU không được trùng lặp trong cùng một sản phẩm.', 400, 'DUPLICATE_SKU_CODE');
      }
    }

    const product = await Product.findOneAndUpdate(
      { _id: productId, isActive: true },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('categoryId', 'name slug');

    return product;
  }

  /**
   * Xóa mềm sản phẩm (isActive: false)
   */
  static async deleteProduct(productId) {
    const product = await Product.findOneAndUpdate(
      { _id: productId, isActive: true },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!product) {
      throw new AppError('Không tìm thấy sản phẩm cần xóa.', 404, 'PRODUCT_NOT_FOUND');
    }

    return product;
  }
}
