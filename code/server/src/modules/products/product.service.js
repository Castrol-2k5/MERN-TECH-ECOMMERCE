import mongoose from 'mongoose';
import { Product } from './product.model.js';
import { Category } from '../categories/category.model.js';
import { BranchInventory } from '../inventory/inventory.model.js';
import { USER_ROLES } from '../users/user.model.js';
import { AuditLogService } from '../audit/auditLog.service.js';
import { AUDIT_ACTIONS } from '../audit/auditLog.model.js';
import { AppError } from '../../utils/appError.js';
import { slugify } from '../../utils/slugify.js';

export class ProductService {
  static canViewCostPrice(currentUser = null) {
    return Boolean(
      currentUser && [USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER].includes(currentUser.role)
    );
  }

  static sanitizeProductCostPrice(product, currentUser = null) {
    if (!product || this.canViewCostPrice(currentUser)) return product;
    if (!Array.isArray(product.skus)) return product;
    return {
      ...product,
      skus: product.skus.map((sku) => {
        if (!sku || typeof sku !== 'object') return sku;
        const { costPrice: _hidden, ...rest } = sku;
        return rest;
      })
    };
  }
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
      const costPrice =
        sku.costPrice !== undefined && sku.costPrice !== null ? Math.max(0, Number(sku.costPrice)) : 0;

      return {
        ...sku,
        sku: skuCode,
        price,
        salePrice,
        costPrice
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
  static async getAllProducts(queryParams = {}, currentUser = null) {
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

    const sanitizedProducts = (products || []).map((p) =>
      this.sanitizeProductCostPrice(p, currentUser)
    );

    return {
      products: sanitizedProducts,
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
  static async getProductBySlug(slug, currentUser = null) {
    const product = await Product.findOne({ slug: slug.toLowerCase().trim(), isActive: true })
      .populate('categoryId', 'name slug attributeKeys')
      .lean();

    if (!product) {
      throw new AppError('Không tìm thấy sản phẩm yêu cầu.', 404, 'PRODUCT_NOT_FOUND');
    }

    return this.sanitizeProductCostPrice(product, currentUser);
  }

  /**
   * Cập nhật thông tin sản phẩm (cho phép Admin cập nhật và bật lại cả sản phẩm đang ẩn isActive: false)
   */
  static async updateProduct(productId, updateData, currentUser = null) {
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

    // Xử lý cập nhật SKUs (bảo toàn costPrice cũ nếu payload không gửi kèm)
    const oldSkuMap = new Map(
      (existingProduct.skus || []).map((s) => [String(s.sku || '').toUpperCase(), s])
    );

    if (updateData.skus) {
      updateData.skus = updateData.skus.map((sku) => {
        const skuCode = sku.sku.trim().toUpperCase();
        const prevSku = oldSkuMap.get(skuCode);
        const price = Number(sku.price);
        const salePrice =
          sku.salePrice !== undefined && sku.salePrice !== null ? Number(sku.salePrice) : price;
        const costPrice =
          sku.costPrice !== undefined && sku.costPrice !== null
            ? Math.max(0, Number(sku.costPrice))
            : Number(prevSku?.costPrice || 0);

        return {
          ...sku,
          sku: skuCode,
          price,
          salePrice,
          costPrice
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

    if (currentUser && updateData.skus) {
      const priceDiffs = [];
      for (const nextSku of product.skus || []) {
        const prevSku = oldSkuMap.get(String(nextSku.sku || '').toUpperCase());
        const beforeSnap = prevSku
          ? {
              price: Number(prevSku.price || 0),
              salePrice: Number(prevSku.salePrice || 0),
              costPrice: Number(prevSku.costPrice || 0)
            }
          : null;
        const afterSnap = {
          price: Number(nextSku.price || 0),
          salePrice: Number(nextSku.salePrice || 0),
          costPrice: Number(nextSku.costPrice || 0)
        };
        if (
          !beforeSnap ||
          beforeSnap.price !== afterSnap.price ||
          beforeSnap.salePrice !== afterSnap.salePrice ||
          beforeSnap.costPrice !== afterSnap.costPrice
        ) {
          priceDiffs.push({ sku: nextSku.sku, before: beforeSnap, after: afterSnap });
        }
      }

      if (priceDiffs.length > 0) {
        AuditLogService.record({
          actor: currentUser,
          action: AUDIT_ACTIONS.PRODUCT_PRICE_CHANGE,
          target: {
            model: 'Product',
            entityId: product._id,
            code: product.slug,
            name: product.name
          },
          changes: {
            before: priceDiffs.map((d) => ({ sku: d.sku, ...(d.before || {}) })),
            after: priceDiffs.map((d) => ({ sku: d.sku, ...d.after }))
          },
          context: {
            notes: `Cập nhật giá bán / giá vốn cho ${priceDiffs.length} biến thể SKU`
          }
        });
      }
    }

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

  /**
   * Gợi ý phụ kiện / thiết bị mua kèm phù hợp dựa trên sản phẩm đang xem hoặc trong giỏ hàng
   * Loại trừ sản phẩm đầu vào, ưu tiên danh mục phụ kiện/âm thanh còn hàng
   */
  static async getRecommendations(query = {}, currentUser = null) {
    const limit = Math.max(1, Math.min(20, parseInt(query.limit, 10) || 4));
    const rawIds = String(query.productIds || '')
      .split(',')
      .map((s) => s.trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id));
    const excludeIds = Array.from(new Set(rawIds)).map((id) => new mongoose.Types.ObjectId(id));

    const branchId =
      query.branchId && mongoose.Types.ObjectId.isValid(String(query.branchId))
        ? new mongoose.Types.ObjectId(String(query.branchId))
        : null;

    const ACCESSORY_SLUGS = ['phu-kien', 'am-thanh'];
    const seedProducts = excludeIds.length
      ? await Product.find({ _id: { $in: excludeIds } })
          .populate('categoryId', 'slug name')
          .lean()
      : [];

    const seedSlugs = seedProducts.map((p) => p.categoryId?.slug).filter(Boolean);
    const allSeedAreAccessories =
      seedSlugs.length > 0 && seedSlugs.every((slug) => ACCESSORY_SLUGS.includes(slug));

    const accessoryCategories = await Category.find({
      isActive: true,
      slug: { $in: ACCESSORY_SLUGS }
    })
      .select('_id slug')
      .lean();
    const accessoryRootIds = accessoryCategories.map((c) => c._id);

    const childCategories = accessoryRootIds.length
      ? await Category.find({
          isActive: true,
          parentId: { $in: accessoryRootIds }
        })
          .select('_id')
          .lean()
      : [];
    const targetCategoryIds = [...accessoryRootIds, ...childCategories.map((c) => c._id)];

    const baseFilter = {
      isActive: true,
      ...(excludeIds.length > 0 ? { _id: { $nin: excludeIds } } : {})
    };

    let candidates = targetCategoryIds.length
      ? await Product.find({ ...baseFilter, categoryId: { $in: targetCategoryIds } })
          .populate('categoryId', 'name slug')
          .sort({ createdAt: -1 })
          .limit(limit * 4)
          .lean()
      : [];

    // Bổ sung sản phẩm hoạt động khác nếu cửa hàng có ít phụ kiện
    if (candidates.length < limit) {
      const pickedIds = new Set([...excludeIds.map(String), ...candidates.map((p) => String(p._id))]);
      const extra = await Product.find({
        isActive: true,
        _id: { $nin: Array.from(pickedIds).map((id) => new mongoose.Types.ObjectId(id)) }
      })
        .populate('categoryId', 'name slug')
        .sort({ createdAt: -1 })
        .limit((limit - candidates.length) * 2)
        .lean();
      candidates = [...candidates, ...extra];
    }

    // Lọc các sản phẩm có ít nhất 1 SKU active & tính tồn kho khả dụng
    const skuIds = [];
    for (const prod of candidates) {
      for (const s of prod.skus || []) {
        if (s.isActive) skuIds.push(s._id);
      }
    }

    const invFilter = { productSkuId: { $in: skuIds } };
    if (branchId) {
      invFilter.branchId = branchId;
    }
    const inventories = skuIds.length
      ? await BranchInventory.find(invFilter).select('productSkuId quantity').lean()
      : [];

    const skuStockMap = new Map();
    for (const inv of inventories) {
      const key = String(inv.productSkuId);
      skuStockMap.set(key, (skuStockMap.get(key) || 0) + Math.max(0, Number(inv.quantity) || 0));
    }

    const targetCatSet = new Set(targetCategoryIds.map(String));
    const scored = candidates
      .filter((p) => Array.isArray(p.skus) && p.skus.some((s) => s.isActive))
      .map((p) => {
        const availableStock = p.skus.reduce(
          (sum, s) => (s.isActive ? sum + (skuStockMap.get(String(s._id)) || 0) : sum),
          0
        );
        const catIdStr = String(p.categoryId?._id || p.categoryId || '');
        const isAccessoryCategory = targetCatSet.has(catIdStr);
        const sanitized = this.sanitizeProductCostPrice(p, currentUser);
        return {
          ...sanitized,
          availableStock,
          _score: (isAccessoryCategory ? 10 : 0) + (availableStock > 0 ? 5 : 0)
        };
      })
      .sort((a, b) => b._score - a._score || b.availableStock - a.availableStock)
      .slice(0, limit)
      .map(({ _score, ...clean }) => clean);

    return {
      products: scored,
      strategy: allSeedAreAccessories ? 'COMPLEMENTARY_ACCESSORY' : 'ACCESSORY_CROSS_SELL'
    };
  }
}
