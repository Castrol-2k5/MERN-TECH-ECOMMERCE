import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch, BRANCH_REGIONS } from '../../src/modules/branches/branch.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import { BranchInventory } from '../../src/modules/inventory/inventory.model.js';
import { Serial, SERIAL_STATUS } from '../../src/modules/serials/serial.model.js';
import { PosShift, SHIFT_STATUS } from '../../src/modules/shifts/posShift.model.js';
import { Order, ORDER_STATUS, ORDER_TYPES, PAYMENT_METHODS, PAYMENT_STATUS } from '../../src/modules/orders/order.model.js';
import { AuditLog, AUDIT_ACTIONS } from '../../src/modules/audit/auditLog.model.js';

setupTestDB();

describe('HQ Chain Director Wave 1: Scalability, SKU Cost Price Security & Command Center', () => {
  let hqBranch;
  let branchQ1;
  let category;
  let product;
  let skuId;
  let adminToken;
  let managerToken;
  let staffToken;
  let staffUser;

  beforeEach(async () => {
    hqBranch = await Branch.create({
      branchCode: 'BR-HQ',
      name: 'Kho Tổng Trung Tâm HQ',
      address: '01 Lê Duẩn, Quận 1, TP.HCM',
      phone: '02838226868',
      location: { type: 'Point', coordinates: [106.7, 10.78] },
      isHeadquarter: true,
      isWarehouse: true,
      region: BRANCH_REGIONS.HCM,
      isActive: true
    });

    branchQ1 = await Branch.create({
      branchCode: 'BR-Q1-HQ1',
      name: 'Showroom Q1 HQ Test',
      address: '128 Nguyễn Thị Minh Khai, Quận 1',
      phone: '02839250001',
      location: { type: 'Point', coordinates: [106.69, 10.77] },
      region: BRANCH_REGIONS.HCM,
      monthlyRevenueTarget: 1000000000,
      isActive: true
    });

    category = await Category.create({
      name: 'Smartphone HQ1',
      slug: 'smartphone-hq1',
      attributeKeys: ['ram', 'storage'],
      isActive: true
    });

    await User.create({
      fullName: 'CEO TechOne',
      email: 'ceo.hq1@techstore.com',
      phone: '0909800001',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });
    adminToken = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'ceo.hq1@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    await User.create({
      fullName: 'Manager Q1 HQ1',
      email: 'mgr.hq1@techstore.com',
      phone: '0909800002',
      passwordHash: 'Pass@123',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: branchQ1._id,
      isActive: true
    });
    managerToken = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'mgr.hq1@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    staffUser = await User.create({
      fullName: 'Staff Q1 HQ1',
      email: 'staff.hq1@techstore.com',
      phone: '0909800003',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchQ1._id,
      isActive: true
    });
    staffToken = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'staff.hq1@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    const createProdRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'iPhone 16 Pro Max 256GB HQ',
        categoryId: category._id.toString(),
        brand: 'Apple',
        isSerialManaged: true,
        skus: [
          {
            sku: 'IP16PM-256-TI',
            price: 34990000,
            salePrice: 32990000,
            costPrice: 28000000
          }
        ]
      });
    expect(createProdRes.status).toBe(201);
    product = createProdRes.body.data.product;
    skuId = product.skus[0]._id;

    await BranchInventory.create({
      branchId: branchQ1._id,
      productId: product._id,
      productSkuId: skuId,
      quantity: 2
    });
  });

  test('UC-HQ-01: Auto-bootstrap inventory khi mở chi nhánh mới & ghi AuditLog', async () => {
    const res = await request(app)
      .post('/api/v1/branches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        branchCode: 'BR-D7-NEW',
        name: 'Chi nhánh Quận 7 Mới',
        address: '88 Nguyễn Văn Linh, Quận 7, TP.HCM',
        phone: '02837778888',
        location: { type: 'Point', coordinates: [106.72, 10.73] },
        region: BRANCH_REGIONS.HCM,
        monthlyRevenueTarget: 500000000,
        bootstrapInventory: true,
        bootstrapFromBranchId: branchQ1._id.toString()
      });

    expect(res.status).toBe(201);
    const createdBranch = res.body.data.branch;
    expect(createdBranch.region).toBe(BRANCH_REGIONS.HCM);
    expect(createdBranch.monthlyRevenueTarget).toBe(500000000);
    expect(createdBranch.bootstrappedCount).toBe(1);

    const inv = await BranchInventory.findOne({
      branchId: createdBranch._id,
      productSkuId: skuId
    }).lean();
    expect(inv).toBeTruthy();
    expect(inv.quantity).toBe(0);

    await new Promise((r) => setTimeout(r, 50));
    const log = await AuditLog.findOne({ action: AUDIT_ACTIONS.BRANCH_CREATE }).lean();
    expect(log).toBeTruthy();
    expect(log.target.code).toBe('BR-D7-NEW');
  });

  test('UC-HQ-02: Ẩn costPrice khỏi Public Storefront, AuditLog khi sửa giá & snapshot costPrice lúc POS Checkout', async () => {
    // 1. Public API không lộ costPrice (kể cả khi gửi token hết hạn/rác hoặc khách anonymous)
    const anonList = await request(app).get('/api/v1/products');
    expect(anonList.status).toBe(200);
    expect(anonList.body.data.products[0].skus[0].costPrice).toBeUndefined();

    const staleTokenDetail = await request(app)
      .get(`/api/v1/products/${product.slug}`)
      .set('Authorization', 'Bearer invalid-stale-token');
    expect(staleTokenDetail.status).toBe(200);
    expect(staleTokenDetail.body.data.product.skus[0].costPrice).toBeUndefined();

    // 2. SUPER_ADMIN đọc được costPrice
    const adminDetail = await request(app)
      .get(`/api/v1/products/${product.slug}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminDetail.status).toBe(200);
    expect(adminDetail.body.data.product.skus[0].costPrice).toBe(28000000);

    // 3. Sửa giá vốn/giá bán ghi AuditLog PRODUCT_PRICE_CHANGE
    const updateRes = await request(app)
      .put(`/api/v1/products/${product._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        skus: [
          {
            _id: skuId.toString(),
            sku: 'IP16PM-256-TI',
            price: 34990000,
            salePrice: 31990000,
            costPrice: 27500000
          }
        ]
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.product.skus[0].costPrice).toBe(27500000);

    await new Promise((r) => setTimeout(r, 50));
    const priceLog = await AuditLog.findOne({ action: AUDIT_ACTIONS.PRODUCT_PRICE_CHANGE }).lean();
    expect(priceLog).toBeTruthy();

    // 4. POS Checkout snapshot costPrice vào order.items[0].costPrice
    await Serial.create({
      serialNumber: 'IMEI-HQ1-TEST-0001',
      productId: product._id,
      productSkuId: skuId,
      branchId: branchQ1._id,
      status: SERIAL_STATUS.IN_STOCK
    });

    const checkoutRes = await request(app)
      .post('/api/v1/orders/pos/checkout')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        paymentMethod: PAYMENT_METHODS.CASH,
        items: [
          {
            productId: product._id.toString(),
            productSkuId: skuId.toString(),
            quantity: 1,
            serialsAssigned: ['IMEI-HQ1-TEST-0001']
          }
        ]
      });
    expect(checkoutRes.status).toBe(201);
    const createdOrder = await Order.findById(checkoutRes.body.data.order._id).lean();
    expect(createdOrder.items[0].costPrice).toBe(27500000);
    expect(createdOrder.items[0].unitPrice).toBe(31990000);
  });

  test('UC-HQ-03: RBAC Command Center & phát hiện đúng các Báo động đỏ bất thường', async () => {
    // STAFF & BRANCH_MANAGER bị chặn (403)
    const staffDenied = await request(app)
      .get('/api/v1/hq/command-center')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(staffDenied.status).toBe(403);

    const mgrDenied = await request(app)
      .get('/api/v1/hq/command-center')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(mgrDenied.status).toBe(403);

    // Tạo dữ liệu bất thường:
    // a) Ca lệch két 700k chưa xử lý -> CRITICAL CASH_DISCREPANCY
    await PosShift.create({
      shiftCode: 'SH-HQ1-ERR',
      branchId: branchQ1._id,
      cashierId: staffUser._id,
      openingBalance: 1000000,
      expectedEndingBalance: 2000000,
      actualEndingBalance: 1300000,
      discrepancy: -700000,
      status: SHIFT_STATUS.CLOSED,
      closedAt: new Date(),
      discrepancyResolution: { status: 'UNRESOLVED' }
    });

    // b) Serial nằm kho > 35 ngày -> DEAD_STOCK
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 35);
    await Serial.collection.insertOne({
      serialNumber: 'IMEI-OLD-DEAD-01',
      productId: product._id,
      productSkuId: skuId,
      branchId: branchQ1._id,
      status: SERIAL_STATUS.IN_STOCK,
      createdAt: oldDate,
      updatedAt: oldDate
    });

    // c) 1 đơn COMPLETED trong 14 ngày (để trigger hot low stock vì BranchInventory quantity = 2)
    // + 2 đơn CANCELLED -> tỷ lệ hủy/hoàn 2/3 = 67% -> CRITICAL FRAUD_RETURN
    await Order.create([
      {
        orderCode: 'ORD-HQ1-OK',
        orderType: ORDER_TYPES.POS_STORE,
        branchId: branchQ1._id,
        staffId: staffUser._id,
        orderStatus: ORDER_STATUS.COMPLETED,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUS.PAID,
        totalAmount: 31990000,
        items: [
          {
            productId: product._id,
            productSkuId: skuId,
            productName: product.name,
            sku: 'IP16PM-256-TI',
            quantity: 1,
            unitPrice: 31990000,
            costPrice: 28000000,
            subtotal: 31990000
          }
        ]
      },
      {
        orderCode: 'ORD-HQ1-CAN1',
        orderType: ORDER_TYPES.POS_STORE,
        branchId: branchQ1._id,
        staffId: staffUser._id,
        orderStatus: ORDER_STATUS.CANCELLED,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUS.FAILED,
        totalAmount: 31990000,
        items: [
          {
            productId: product._id,
            productSkuId: skuId,
            productName: product.name,
            sku: 'IP16PM-256-TI',
            quantity: 1,
            unitPrice: 31990000,
            costPrice: 28000000,
            subtotal: 31990000
          }
        ]
      },
      {
        orderCode: 'ORD-HQ1-CAN2',
        orderType: ORDER_TYPES.POS_STORE,
        branchId: branchQ1._id,
        staffId: staffUser._id,
        orderStatus: ORDER_STATUS.RETURNED,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUS.REFUNDED,
        totalAmount: 31990000,
        refundedAmount: 31990000,
        items: [
          {
            productId: product._id,
            productSkuId: skuId,
            productName: product.name,
            sku: 'IP16PM-256-TI',
            quantity: 1,
            unitPrice: 31990000,
            costPrice: 28000000,
            subtotal: 31990000
          }
        ]
      }
    ]);

    const res = await request(app)
      .get('/api/v1/hq/command-center')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    expect(data.summary.criticalCount).toBeGreaterThanOrEqual(2);
    expect(data.pendingQueues.unresolvedDiscrepancies).toBe(1);

    const categories = new Set(data.alerts.map((a) => a.category));
    expect(categories.has('CASH_DISCREPANCY')).toBe(true);
    expect(categories.has('FRAUD_RETURN')).toBe(true);
    expect(categories.has('DEAD_STOCK')).toBe(true);
    expect(categories.has('LOW_STOCK')).toBe(true);
  });
});
