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
      throw new AppError(
        'Danh mục sản phẩm không tồn tại hoặc đã bị vô hiệu hóa.',
        404,
        'CATEGORY_NOT_FOUND'
      );
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
          `Thuộc tính '${invalidKeys.join(', ')}' không hợp lệ đối với danh mục '${category.name}'. Các khóa cho phép: ${category.attributeKeys.join(', ')}`,
          400,
          'INVALID_ATTRIBUTE_KEY'
        );
      }
    }

    // Chuẩn hóa và kiểm tra trùng lặp mã SKU trong cùng một sản phẩm
    const normalizedSkus = productData.skus.map((sku) => {
      const skuCode = sku.sku.trim().toUpperCase();
      const price = Number(sku.price);
      const salePrice =
        sku.salePrice !== undefined && sku.salePrice !== null ? Number(sku.salePrice) : price;

      return {
        ...sku,
        sku: skuCode,
        price,
        salePrice
      };
    });

    const skuCodes = normalizedSkus.map((s) => s.sku);
    if (new Set(skuCodes).size !== skuCodes.length) {
      throw new AppError(
        'Mã SKU không được trùng lặp trong cùng một sản phẩm.',
        400,
        'DUPLICATE_SKU_CODE'
      );
    }

    const created = await Product.create({
      ...productData,
      slug,
      attributes: normalizedAttributes,
      skus: normalizedSkus,
      isSerialManaged:
        productData.isSerialManaged !== undefined ? productData.isSerialManaged : true,
      isActive: productData.isActive !== undefined ? productData.isActive : true
    });

    const populated = await Product.findById(created._id)
      .populate('categoryId', 'name slug parentId attributeKeys')
      .lean();

    return populated || created;
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
      'sortBy',
      'includeInactive',
      'isActive',
      'isactive',
      'status'
    ]);

    const {
      page = 1,
      limit = 12,
      category,
      brand,
      minPrice,
      maxPrice,
      search,
      sortBy = 'newest',
      includeInactive
    } = queryParams;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const filterConditions = {};
    if (includeInactive !== 'true' && includeInactive !== true) {
      if (queryParams.isActive === 'false' || queryParams.isActive === false) {
        filterConditions.isActive = false;
      } else {
        filterConditions.isActive = true;
      }
    }

    let targetCategory = null;

    // 1. Lọc theo Category (hỗ trợ cả slug lẫn ObjectId, bao gồm toàn bộ danh mục con trong cây phân cấp)
    if (category && String(category).trim().toLowerCase() !== 'all') {
      targetCategory = mongoose.Types.ObjectId.isValid(category)
        ? await Category.findOne({ _id: category, isActive: true }).lean()
        : await Category.findOne({
            slug: category.toLowerCase().trim(),
            isActive: true
          }).lean();

      if (!targetCategory) {
        return {
          products: [],
          total: 0,
          page: pageNum,
          totalPages: 0,
          limit: limitNum,
          availableBrands: [],
          availableAttributes: [],
          categoryInfo: null
        };
      }

      // Đệ quy lấy danh mục con
      const getDescendantCategoryIds = async (parentId) => {
        const children = await Category.find({ parentId, isActive: true }).select('_id').lean();
        if (!children || children.length === 0) return [];
        const childIds = children.map((c) => c._id);
        const grandChildIds = await Promise.all(childIds.map((id) => getDescendantCategoryIds(id)));
        return [...childIds, ...grandChildIds.flat()];
      };

      const descendantIds = await getDescendantCategoryIds(targetCategory._id);
      const matchedCategoryIds = [targetCategory._id, ...descendantIds];
      filterConditions.categoryId =
        matchedCategoryIds.length > 1 ? { $in: matchedCategoryIds } : targetCategory._id;
    }

    // 2. Lọc theo Brand (hỗ trợ 1 hoặc nhiều thương hiệu cách nhau dấu phẩy, case-insensitive)
    if (brand && String(brand).trim()) {
      const brandList = String(brand)
        .split(',')
        .map((b) => b.trim())
        .filter(Boolean);
      if (brandList.length === 1) {
        filterConditions.brand = {
          $regex: new RegExp(`^${brandList[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
        };
      } else if (brandList.length > 1) {
        filterConditions.brand = {
          $in: brandList.map((b) => new RegExp(`^${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'))
        };
      }
    }

    // 3. Tìm kiếm từ khóa trên name hoặc brand
    if (search && search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      filterConditions.$or = [{ name: searchRegex }, { brand: searchRegex }];
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
        $all: dynamicAttributesArray.map(({ key, value }) => {
          const vals = value
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);
          const valueMatcher =
            vals.length > 1
              ? { $in: vals.map((v) => new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')) }
              : new RegExp(vals[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

          return {
            $elemMatch: { key, value: valueMatcher }
          };
        })
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
      sortOptions = { createdAt: -1 };
    }

    // 7. Thực thi truy vấn với .lean() tối ưu độ trễ T_avg < 200ms
    const skip = (pageNum - 1) * limitNum;

    const brandMatch = {};
    if (filterConditions.isActive !== undefined) {
      brandMatch.isActive = filterConditions.isActive;
    }
    if (filterConditions.categoryId) {
      if (filterConditions.categoryId.$in) {
        brandMatch.categoryId = {
          $in: filterConditions.categoryId.$in.map((id) => new mongoose.Types.ObjectId(id))
        };
      } else {
        brandMatch.categoryId = new mongoose.Types.ObjectId(filterConditions.categoryId);
      }
    }

    const [total, products, brandFacets, attributeFacetsRaw] = await Promise.all([
      Product.countDocuments(filterConditions),
      Product.find(filterConditions)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate('categoryId', 'name slug parentId attributeKeys')
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
      ]),
      Product.aggregate([
        { $match: brandMatch },
        { $unwind: '$attributes' },
        {
          $group: {
            _id: {
              key: '$attributes.key',
              value: '$attributes.value'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.key',
            options: {
              $push: {
                value: '$_id.value',
                count: '$count'
              }
            }
          }
        },
        {
          $project: {
            _id: 0,
            key: '$_id',
            options: 1
          }
        }
      ])
    ]);

    // Sắp xếp availableAttributes theo thứ tự attributeKeys của Category (nếu có)
    const allowedAttrKeys = Array.isArray(targetCategory?.attributeKeys)
      ? targetCategory.attributeKeys.map((k) => k.trim().toLowerCase())
      : null;

    let availableAttributes = (attributeFacetsRaw || []).map((grp) => ({
      key: grp.key,
      options: (grp.options || [])
        .filter((o) => o && o.value)
        .sort((a, b) => String(a.value).localeCompare(String(b.value), 'vi'))
    }));

    if (allowedAttrKeys && allowedAttrKeys.length > 0) {
      const orderMap = new Map(allowedAttrKeys.map((k, idx) => [k, idx]));
      availableAttributes = availableAttributes
        .filter((g) => orderMap.has(g.key))
        .sort((a, b) => (orderMap.get(a.key) ?? 99) - (orderMap.get(b.key) ?? 99));
    }

    const totalPages = Math.ceil(total / limitNum) || (total === 0 ? 0 : 1);

    return {
      products,
      total,
      page: pageNum,
      totalPages,
      limit: limitNum,
      availableBrands: brandFacets || [],
      availableAttributes,
      categoryInfo: targetCategory
        ? {
            _id: targetCategory._id,
            name: targetCategory.name,
            slug: targetCategory.slug,
            attributeKeys: targetCategory.attributeKeys || []
          }
        : null
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
   * Cập nhật thông tin sản phẩm (cho phép Admin cập nhật và bật lại cả sản phẩm đang ẩn isActive: false)
   */
  static async updateProduct(productId, updateData) {
    const existingProduct = await Product.findById(productId);
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
          throw new AppError(
            `Slug '${newSlug}' đã được sử dụng bởi sản phẩm khác.`,
            400,
            'PRODUCT_EXISTS'
          );
        }
        updateData.slug = newSlug;
      }
    }

    // Xử lý danh mục và thuộc tính động
    const targetCategoryId = updateData.categoryId || existingProduct.categoryId;
    if (updateData.categoryId) {
      const cat = await Category.findOne({ _id: targetCategoryId, isActive: true });
      if (!cat) {
        throw new AppError(
          'Danh mục sản phẩm không tồn tại hoặc đã bị vô hiệu hóa.',
          404,
          'CATEGORY_NOT_FOUND'
        );
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
            `Thuộc tính '${invalidKeys.join(', ')}' không hợp lệ đối với danh mục '${cat.name}'. Các khóa cho phép: ${cat.attributeKeys.join(', ')}`,
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
        const salePrice =
          sku.salePrice !== undefined && sku.salePrice !== null ? Number(sku.salePrice) : price;

        return {
          ...sku,
          sku: sku.sku.trim().toUpperCase(),
          price,
          salePrice
        };
      });

      const skuCodes = updateData.skus.map((s) => s.sku);
      if (new Set(skuCodes).size !== skuCodes.length) {
        throw new AppError(
          'Mã SKU không được trùng lặp trong cùng một sản phẩm.',
          400,
          'DUPLICATE_SKU_CODE'
        );
      }
    }

    const product = await Product.findOneAndUpdate(
      { _id: productId },
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('categoryId', 'name slug parentId attributeKeys')
      .lean();

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
