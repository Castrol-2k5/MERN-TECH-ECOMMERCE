import { Order, ORDER_STATUS } from '../orders/order.model.js';
import { BranchInventory } from '../inventory/inventory.model.js';
import { PurchaseOrder, PO_STATUS } from '../procurement/purchaseOrder.model.js';
import { Product } from '../products/product.model.js';

const URGENCY_WEIGHT = {
  CRITICAL: 0,
  WARNING: 1,
  HEALTHY: 2
};

export class HqBiService {
  /**
   * Dự báo nhu cầu nhập hàng (Demand Forecasting - UC-HQ-12)
   * Tính tốc độ bán trung bình ngày (dailyRunRate), số ngày đủ bán còn lại (daysOfCover)
   * và số lượng cần đặt thêm từ NCC (trừ tồn hiện có + hàng đang đặt PO ORDERED/DRAFT).
   */
  static async getDemandForecast({ daysWindow = 30, targetCoverDays = 21 } = {}) {
    const windowDays = Math.max(7, Math.min(90, Number(daysWindow) || 30));
    const coverDays = Math.max(7, Math.min(90, Number(targetCoverDays) || 21));

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (windowDays - 1));
    startDate.setHours(0, 0, 0, 0);

    const [salesAgg, stockAgg, incomingPoAgg, products] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: now },
            orderStatus: { $in: [ORDER_STATUS.COMPLETED, ORDER_STATUS.PARTIALLY_RETURNED] }
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productSkuId',
            soldQty: {
              $sum: {
                $max: [
                  0,
                  { $subtract: ['$items.quantity', { $ifNull: ['$items.returnedQuantity', 0] }] }
                ]
              }
            }
          }
        }
      ]),
      BranchInventory.aggregate([
        {
          $group: {
            _id: '$productSkuId',
            availableStock: { $sum: '$quantity' }
          }
        }
      ]),
      PurchaseOrder.aggregate([
        {
          $match: {
            status: { $in: [PO_STATUS.ORDERED, PO_STATUS.DRAFT] }
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productSkuId',
            incomingQty: {
              $sum: {
                $max: [
                  0,
                  { $subtract: ['$items.orderedQty', { $ifNull: ['$items.receivedQty', 0] }] }
                ]
              }
            }
          }
        }
      ]),
      Product.find({ isActive: true }).select('name brand skus').lean()
    ]);

    const salesMap = new Map(salesAgg.map((s) => [String(s._id), Number(s.soldQty || 0)]));
    const stockMap = new Map(stockAgg.map((s) => [String(s._id), Number(s.availableStock || 0)]));
    const incomingMap = new Map(
      incomingPoAgg.map((s) => [String(s._id), Number(s.incomingQty || 0)])
    );

    const items = [];
    for (const prod of products) {
      for (const sku of prod.skus || []) {
        if (sku?.isActive === false) continue;
        const skuKey = String(sku._id);
        const soldQty = salesMap.get(skuKey) || 0;
        const availableStock = stockMap.get(skuKey) || 0;
        const incomingPoQty = incomingMap.get(skuKey) || 0;

        if (soldQty === 0 && availableStock === 0 && incomingPoQty === 0) continue;

        const dailyRunRate = Number((soldQty / windowDays).toFixed(2));
        const daysOfCover =
          dailyRunRate > 0 ? Math.round(availableStock / dailyRunRate) : availableStock > 0 ? 999 : 0;

        const desiredStock = Math.ceil(dailyRunRate * coverDays);
        const recommendedOrderQty = Math.max(0, desiredStock - availableStock - incomingPoQty);

        let urgency = 'HEALTHY';
        if (dailyRunRate > 0 && daysOfCover < 7) {
          urgency = 'CRITICAL';
        } else if (dailyRunRate > 0 && daysOfCover < 14) {
          urgency = 'WARNING';
        }

        items.push({
          productId: prod._id,
          productName: prod.name,
          brand: prod.brand,
          productSkuId: sku._id,
          sku: sku.sku,
          costPrice: Number(sku.costPrice || 0),
          soldQtyWindow: soldQty,
          dailyRunRate,
          availableStock,
          incomingPoQty,
          daysOfCover,
          recommendedOrderQty,
          urgency
        });
      }
    }

    items.sort(
      (a, b) =>
        (URGENCY_WEIGHT[a.urgency] ?? 9) - (URGENCY_WEIGHT[b.urgency] ?? 9) ||
        b.recommendedOrderQty - a.recommendedOrderQty
    );

    return {
      params: { daysWindow: windowDays, targetCoverDays: coverDays },
      summary: {
        totalSkusAnalyzed: items.length,
        criticalCount: items.filter((i) => i.urgency === 'CRITICAL').length,
        warningCount: items.filter((i) => i.urgency === 'WARNING').length,
        skusNeedingRestock: items.filter((i) => i.recommendedOrderQty > 0).length
      },
      items
    };
  }
}
