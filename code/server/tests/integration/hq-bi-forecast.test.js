import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch, BRANCH_REGIONS } from '../../src/modules/branches/branch.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { BranchInventory } from '../../src/modules/inventory/inventory.model.js';
import { Vendor } from '../../src/modules/procurement/vendor.model.js';
import { PurchaseOrder, PO_STATUS } from '../../src/modules/procurement/purchaseOrder.model.js';
import { Order, ORDER_STATUS, ORDER_TYPES, PAYMENT_METHODS, PAYMENT_STATUS } from '../../src/modules/orders/order.model.js';

setupTestDB();

describe('HQ Chain Director Wave 5: Real Store Ranking Metrics & Demand Forecasting BI', () => {
  let branchA;
  let product;
  let skuId;
  let adminUser;
  let adminToken;
  let managerToken;

  beforeEach(async () => {
    branchA = await Branch.create({
      branchCode: 'BR-Q1-W5',
      name: 'Showroom Q1 W5',
      address: '128 Nguyễn Thị Minh Khai',
      phone: '02839250001',
      location: { type: 'Point', coordinates: [106.69, 10.77] },
      region: BRANCH_REGIONS.HCM,
      monthlyRevenueTarget: 100000000,
      isActive: true
    });

    const cat = await Category.create({
      name: 'Laptop W5',
      slug: 'laptop-w5',
      attributeKeys: ['ram'],
      isActive: true
    });

    adminUser = await User.create({
      fullName: 'CEO W5',
      email: 'ceo.w5@techstore.com',
      phone: '0909840001',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });
    adminToken = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'ceo.w5@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    await User.create({
      fullName: 'Manager Q1 W5',
      email: 'mgr.w5@techstore.com',
      phone: '0909840002',
      passwordHash: 'Pass@123',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: branchA._id,
      isActive: true
    });
    managerToken = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'mgr.w5@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    const prodRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'MacBook Air M4 W5',
        categoryId: cat._id.toString(),
        brand: 'Apple',
        isSerialManaged: false,
        skus: [
          {
            sku: 'MBA-M4-W5',
            price: 32000000,
            salePrice: 30000000,
            costPrice: 24000000
          }
        ]
      });
    product = prodRes.body.data.product;
    skuId = product.skus[0]._id;
  });

  test('UC-HQ-11: Analytics Overview tính Growth kỳ trước thật, Tỷ lệ hoàn thật, Biên LN & % Đạt Target', async () => {
    const now = new Date();
    const prevDate = new Date(now);
    prevDate.setDate(prevDate.getDate() - 40); // Kỳ trước 30 ngày trước

    // Đơn kỳ trước: 15.000.000 ₫ (COMPLETED)
    await Order.collection.insertOne({
      orderCode: 'ORD-W5-PREV',
      orderType: ORDER_TYPES.POS_STORE,
      branchId: branchA._id,
      orderStatus: ORDER_STATUS.COMPLETED,
      paymentMethod: PAYMENT_METHODS.CASH,
      paymentStatus: PAYMENT_STATUS.PAID,
      totalAmount: 15000000,
      refundedAmount: 0,
      items: [
        {
          productId: product._id,
          productSkuId: skuId,
          productName: product.name,
          sku: 'MBA-M4-W5',
          quantity: 1,
          unitPrice: 15000000,
          costPrice: 12000000,
          subtotal: 15000000
        }
      ],
      createdAt: prevDate,
      updatedAt: prevDate
    });

    // Kỳ hiện tại: 1 đơn COMPLETED 30tr (COGS 24tr -> GP 20%) + 1 đơn RETURNED 30tr => returnRate = 50,0%, growth = +100,0%
    await Order.create([
      {
        orderCode: 'ORD-W5-CURR-OK',
        orderType: ORDER_TYPES.POS_STORE,
        branchId: branchA._id,
        orderStatus: ORDER_STATUS.COMPLETED,
        paymentMethod: PAYMENT_METHODS.VNPAY,
        paymentStatus: PAYMENT_STATUS.PAID,
        totalAmount: 30000000,
        items: [
          {
            productId: product._id,
            productSkuId: skuId,
            productName: product.name,
            sku: 'MBA-M4-W5',
            quantity: 1,
            unitPrice: 30000000,
            costPrice: 24000000,
            subtotal: 30000000
          }
        ]
      },
      {
        orderCode: 'ORD-W5-CURR-RET',
        orderType: ORDER_TYPES.POS_STORE,
        branchId: branchA._id,
        orderStatus: ORDER_STATUS.RETURNED,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUS.REFUNDED,
        totalAmount: 30000000,
        refundedAmount: 30000000,
        items: [
          {
            productId: product._id,
            productSkuId: skuId,
            productName: product.name,
            sku: 'MBA-M4-W5',
            quantity: 1,
            unitPrice: 30000000,
            costPrice: 24000000,
            subtotal: 30000000
          }
        ]
      }
    ]);

    const startStr = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const endStr = now.toISOString().slice(0, 10);

    const res = await request(app)
      .get(`/api/v1/analytics/overview?startDate=${startStr}&endDate=${endStr}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const { kpis, branchPerformance } = res.body.data;
    expect(kpis.growth).toBe('+100,0%');
    expect(branchPerformance).toHaveLength(1);
    expect(branchPerformance[0].returnRate).toBe('50,0%');
    expect(branchPerformance[0].grossMarginPct).toBe('20,0%');
    expect(branchPerformance[0].targetAchievementPct).toBe('30,0%');
  });

  test('UC-HQ-12: Demand Forecasting tính Run-rate, Days of Cover & Trừ PO đang đặt về', async () => {
    const denied = await request(app)
      .get('/api/v1/hq/bi/demand-forecast')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(denied.status).toBe(403);

    // Đã bán 30 máy trong 30 ngày -> dailyRunRate = 1.00 máy/ngày
    await Order.create({
      orderCode: 'ORD-W5-VEL-30',
      orderType: ORDER_TYPES.POS_STORE,
      branchId: branchA._id,
      orderStatus: ORDER_STATUS.COMPLETED,
      paymentMethod: PAYMENT_METHODS.CASH,
      paymentStatus: PAYMENT_STATUS.PAID,
      totalAmount: 30 * 30000000,
      items: [
        {
          productId: product._id,
          productSkuId: skuId,
          productName: product.name,
          sku: 'MBA-M4-W5',
          quantity: 30,
          unitPrice: 30000000,
          costPrice: 24000000,
          subtotal: 30 * 30000000
        }
      ]
    });

    // Tồn kho toàn chuỗi hiện còn 5 máy (daysOfCover = 5 < 7 -> CRITICAL)
    await BranchInventory.create({
      branchId: branchA._id,
      productId: product._id,
      productSkuId: skuId,
      quantity: 5
    });

    // Đang có PO trạng thái ORDERED đặt 4 máy
    const vendor = await Vendor.create({
      vendorCode: 'NPP-W5',
      name: 'NPP Apple W5',
      phone: '0909840099'
    });
    await PurchaseOrder.create({
      poCode: 'PO-W5-001',
      vendorId: vendor._id,
      warehouseBranchId: branchA._id,
      status: PO_STATUS.ORDERED,
      totalAmount: 4 * 24000000,
      createdBy: { userId: adminUser._id, fullName: 'CEO W5' },
      items: [
        {
          productId: product._id,
          productSkuId: skuId,
          sku: 'MBA-M4-W5',
          productName: product.name,
          isSerialManaged: false,
          orderedQty: 4,
          receivedQty: 0,
          unitCost: 24000000,
          subtotal: 4 * 24000000
        }
      ]
    });

    const forecastRes = await request(app)
      .get('/api/v1/hq/bi/demand-forecast?daysWindow=30&targetCoverDays=21')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(forecastRes.status).toBe(200);
    const { summary, items } = forecastRes.body.data;
    expect(summary.criticalCount).toBe(1);
    expect(items).toHaveLength(1);
    expect(items[0].dailyRunRate).toBe(1);
    expect(items[0].availableStock).toBe(5);
    expect(items[0].incomingPoQty).toBe(4);
    expect(items[0].daysOfCover).toBe(5);
    // Desired 21 - Stock 5 - Incoming PO 4 = 12
    expect(items[0].recommendedOrderQty).toBe(12);
    expect(items[0].urgency).toBe('CRITICAL');
  });
});
