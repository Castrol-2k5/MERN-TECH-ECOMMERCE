import mongoose from 'mongoose';
import { Cart } from './cart.model.js';
import { Product } from '../products/product.model.js';
import { BranchInventory } from '../inventory/inventory.model.js';
import { Branch } from '../branches/branch.model.js';

const MAX_ITEM_QTY = 50;

export class CartService {
  /**
   * Chuẩn hóa và gộp các dòng trùng (cùng productId + productSkuId)
   */
  static normalizeRawItems(rawItems = []) {
    const map = new Map();

    for (const raw of rawItems) {
      if (!raw?.productId || !raw?.productSkuId) continue;
      const productId = String(raw.productId);
      const productSkuId = String(raw.productSkuId);
      if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(productSkuId)) {
        continue;
      }

      const key = `${productId}_${productSkuId}`;
      const qty = Math.max(1, parseInt(raw.quantity, 10) || 1);
      const prev = map.get(key);
      if (prev) {
        prev.quantity = Math.min(MAX_ITEM_QTY, prev.quantity + qty);
      } else {
        map.set(key, {
          productId,
          productSkuId,
          quantity: Math.min(MAX_ITEM_QTY, qty),
          addedAt: raw.addedAt ? new Date(raw.addedAt) : new Date()
        });
      }
    }

    return Array.from(map.values());
  }

  /**
   * Đối chiếu giá bán hiện tại và tồn kho thời gian thực (per branch hoặc toàn chuỗi)
   * Tuyệt đối KHÔNG trả về costPrice cho khách hàng
   */
  static async hydrateCartItems(rawItems = [], branchId = null) {
    const normalized = CartService.normalizeRawItems(rawItems);
    const selectedBranchId = branchId && mongoose.Types.ObjectId.isValid(String(branchId))
      ? String(branchId)
      : null;

    if (normalized.length === 0) {
      return {
        items: [],
        totalQuantity: 0,
        totalAmount: 0,
        hasStockIssue: false,
        selectedBranchId
      };
    }

    const productIds = Array.from(new Set(normalized.map((i) => i.productId)))
      .map((id) => new mongoose.Types.ObjectId(id));
    const skuIds = Array.from(new Set(normalized.map((i) => i.productSkuId)))
      .map((id) => new mongoose.Types.ObjectId(id));

    const [products, activeBranches, inventories] = await Promise.all([
      Product.find({ _id: { $in: productIds } })
        .select('name slug brand images isActive skus')
        .lean(),
      Branch.find({ isActive: true }).select('_id').lean(),
      BranchInventory.find({ productSkuId: { $in: skuIds } })
        .select('branchId productSkuId quantity')
        .lean()
    ]);

    const productMap = new Map(products.map((p) => [String(p._id), p]));
    const activeBranchSet = new Set(activeBranches.map((b) => String(b._id)));

    // Map skuId -> { totalNetworkStock, byBranch: Map<branchId, qty> }
    const stockMap = new Map();
    for (const inv of inventories) {
      const bId = String(inv.branchId);
      if (!activeBranchSet.has(bId)) continue;
      const sId = String(inv.productSkuId);
      if (!stockMap.has(sId)) {
        stockMap.set(sId, { totalNetworkStock: 0, byBranch: new Map() });
      }
      const entry = stockMap.get(sId);
      const qty = Math.max(0, Number(inv.quantity) || 0);
      entry.totalNetworkStock += qty;
      entry.byBranch.set(bId, (entry.byBranch.get(bId) || 0) + qty);
    }

    const items = [];
    let totalQuantity = 0;
    let totalAmount = 0;
    let hasStockIssue = false;

    for (const entry of normalized) {
      const product = productMap.get(entry.productId);
      const skuObj = product?.skus?.find((s) => String(s._id) === entry.productSkuId);

      const isActive = Boolean(product?.isActive && skuObj?.isActive);
      const listPrice = Number(skuObj?.price || 0);
      const salePrice = Number(skuObj?.salePrice || 0);
      const unitPrice = salePrice > 0 && salePrice < listPrice ? salePrice : listPrice;

      const stockInfo = stockMap.get(entry.productSkuId);
      const totalNetworkStock = stockInfo ? stockInfo.totalNetworkStock : 0;
      const availableStock = selectedBranchId
        ? (stockInfo?.byBranch.get(selectedBranchId) || 0)
        : totalNetworkStock;

      const isExceedingStock = !isActive || availableStock <= 0 || entry.quantity > availableStock;

      let stockStatus = 'IN_STOCK';
      if (!isActive) {
        stockStatus = 'INACTIVE';
      } else if (availableStock <= 0) {
        stockStatus = 'OUT_OF_STOCK';
      } else if (entry.quantity > availableStock) {
        stockStatus = 'EXCEEDS_STOCK';
      } else if (availableStock <= 3) {
        stockStatus = 'LOW_STOCK';
      }

      if (isExceedingStock) {
        hasStockIssue = true;
      }

      totalQuantity += entry.quantity;
      totalAmount += unitPrice * entry.quantity;

      items.push({
        productId: entry.productId,
        productSkuId: entry.productSkuId,
        productName: product?.name || 'Sản phẩm không còn kinh doanh',
        brand: product?.brand || '',
        slug: product?.slug || '',
        sku: skuObj?.sku || 'N/A',
        optionValues: Array.isArray(skuObj?.optionValues) ? skuObj.optionValues : [],
        image: skuObj?.images?.[0] || product?.images?.[0] || '',
        price: unitPrice,
        listPrice,
        salePrice,
        unitPrice,
        quantity: entry.quantity,
        availableStock,
        totalNetworkStock,
        isActive,
        isExceedingStock,
        stockStatus
      });
    }

    return {
      items,
      totalQuantity,
      totalAmount,
      hasStockIssue,
      selectedBranchId
    };
  }

  /**
   * Lấy giỏ hàng đã đồng bộ của khách hàng đang đăng nhập
   */
  static async getMyCart(customerId, branchId = null) {
    const cart = await Cart.findOne({ customerId }).lean();
    const effectiveBranchId = branchId || cart?.selectedBranchId || null;
    return CartService.hydrateCartItems(cart?.items || [], effectiveBranchId);
  }

  /**
   * Hợp nhất giỏ hàng localStorage (Guest) với giỏ hàng DB khi đăng nhập/đăng ký
   */
  static async mergeCart(customerId, localItems = [], branchId = undefined) {
    const existingCart = await Cart.findOne({ customerId }).lean();
    const combinedRaw = [
      ...(existingCart?.items || []),
      ...(Array.isArray(localItems) ? localItems : [])
    ];
    const mergedItems = CartService.normalizeRawItems(combinedRaw);

    const updateDoc = {
      items: mergedItems.map((i) => ({
        productId: new mongoose.Types.ObjectId(i.productId),
        productSkuId: new mongoose.Types.ObjectId(i.productSkuId),
        quantity: i.quantity,
        addedAt: i.addedAt
      }))
    };

    if (branchId !== undefined) {
      updateDoc.selectedBranchId = branchId ? new mongoose.Types.ObjectId(branchId) : null;
    }

    const updatedCart = await Cart.findOneAndUpdate(
      { customerId },
      { $set: updateDoc },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    const effectiveBranchId =
      branchId !== undefined ? branchId : updatedCart?.selectedBranchId || null;
    return CartService.hydrateCartItems(updatedCart?.items || [], effectiveBranchId);
  }

  /**
   * Ghi đè toàn bộ giỏ hàng hiện tại của khách hàng đang đăng nhập lên DB
   */
  static async syncCart(customerId, items = [], branchId = undefined) {
    const normalized = CartService.normalizeRawItems(items);
    const updateDoc = {
      items: normalized.map((i) => ({
        productId: new mongoose.Types.ObjectId(i.productId),
        productSkuId: new mongoose.Types.ObjectId(i.productSkuId),
        quantity: i.quantity,
        addedAt: i.addedAt
      }))
    };

    if (branchId !== undefined) {
      updateDoc.selectedBranchId = branchId ? new mongoose.Types.ObjectId(branchId) : null;
    }

    const updatedCart = await Cart.findOneAndUpdate(
      { customerId },
      { $set: updateDoc },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    const effectiveBranchId =
      branchId !== undefined ? branchId : updatedCart?.selectedBranchId || null;
    return CartService.hydrateCartItems(updatedCart?.items || [], effectiveBranchId);
  }

  /**
   * Kiểm tra tồn kho & đơn giá thời gian thực cho giỏ hàng (cả Guest lẫn Customer)
   */
  static async previewCart(items = [], branchId = null) {
    return CartService.hydrateCartItems(items, branchId);
  }
}
