import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch, BRANCH_REGIONS } from '../../src/modules/branches/branch.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import { BranchInventory } from '../../src/modules/inventory/inventory.model.js';
import { Serial, SERIAL_STATUS } from '../../src/modules/serials/serial.model.js';
import { PO_STATUS, PO_PAYMENT_STATUS } from '../../src/modules/procurement/purchaseOrder.model.js';
import { AuditLog, AUDIT_ACTIONS } from '../../src/modules/audit/auditLog.model.js';

setupTestDB();

describe('HQ Chain Director Wave 2: Vendor, Purchase Order Intake & AP Debt Settlement', () => {
  let hqBranch;
  let product;
  let skuId;
  let adminToken;
  let managerToken;

  beforeEach(async () => {
    hqBranch = await Branch.create({
      branchCode: 'BR-HQ',
      name: 'Kho Tổng HQ Test W2',
      address: '01 Lê Duẩn, Q1',
      phone: '02838226868',
      location: { type: 'Point', coordinates: [106.7, 10.78] },
      isHeadquarter: true,
      isWarehouse: true,
      region: BRANCH_REGIONS.HCM,
      isActive: true
    });

    const cat = await Category.create({
      name: 'Laptop HQ W2',
      slug: 'laptop-hq-w2',
      attributeKeys: ['ram'],
      isActive: true
    });

    await User.create({
      fullName: 'CEO W2',
      email: 'ceo.w2@techstore.com',
      phone: '0909810001',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });
    adminToken = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'ceo.w2@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    await User.create({
      fullName: 'Manager W2',
      email: 'mgr.w2@techstore.com',
      phone: '0909810002',
      passwordHash: 'Pass@123',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: hqBranch._id,
      isActive: true
    });
    managerToken = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'mgr.w2@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    const prodRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'MacBook Pro M4 HQ W2',
        categoryId: cat._id.toString(),
        brand: 'Apple',
        isSerialManaged: true,
        skus: [
          {
            sku: 'MBP-M4-HQ-W2',
            price: 45000000,
            salePrice: 43000000,
            costPrice: 30000000
          }
        ]
      });
    product = prodRes.body.data.product;
    skuId = product.skus[0]._id;

    // Đã có sẵn 2 máy tồn với costPrice = 30.000.000 ₫ -> nhập thêm 3 máy giá 35.000.000 ₫ => BQ = 33.000.000 ₫
    await BranchInventory.create({
      branchId: hqBranch._id,
      productId: product._id,
      productSkuId: skuId,
      quantity: 2
    });
  });

  test('UC-HQ-04 & UC-HQ-05: RBAC, CRUD Vendor, PO Receive (Serial + Weighted Avg Cost) & Thanh toán công nợ NCC', async () => {
    // 1. RBAC chặn BRANCH_MANAGER
    const mgrDenied = await request(app)
      .get('/api/v1/procurement/vendors')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(mgrDenied.status).toBe(403);

    // 2. Tạo Vendor & chặn trùng vendorCode
    const vendorRes = await request(app)
      .post('/api/v1/procurement/vendors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vendorCode: 'NPP-FPT-W2',
        name: 'Công ty Synnex FPT Phân Phối',
        phone: '02873008888',
        contactName: 'Anh Nam KD',
        paymentTermDays: 30
      });
    expect(vendorRes.status).toBe(201);
    const vendor = vendorRes.body.data.vendor;

    const dupVendor = await request(app)
      .post('/api/v1/procurement/vendors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vendorCode: 'NPP-FPT-W2',
        name: 'Duplicate Vendor',
        phone: '02873009999'
      });
    expect(dupVendor.status).toBe(400);

    // 3. Tạo Phiếu Nhập Mua PO (3 máy @ 35.000.000 ₫ = 105.000.000 ₫)
    const poRes = await request(app)
      .post('/api/v1/procurement/purchase-orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vendorId: vendor._id.toString(),
        notes: 'Nhập lô MacBook M4 đợt 1',
        items: [
          {
            productId: product._id.toString(),
            productSkuId: skuId.toString(),
            orderedQty: 3,
            unitCost: 35000000
          }
        ]
      });
    expect(poRes.status).toBe(201);
    const po = poRes.body.data.purchaseOrder;
    expect(po.totalAmount).toBe(105000000);
    expect(po.status).toBe(PO_STATUS.ORDERED);

    // 4. Negative check: Nhận thiếu Serial -> 400 SERIAL_COUNT_MISMATCH
    const mismatchRes = await request(app)
      .post(`/api/v1/procurement/purchase-orders/${po._id}/receive`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        items: [
          {
            productSkuId: skuId.toString(),
            receivedQty: 3,
            serials: ['SN-W2-001', 'SN-W2-002']
          }
        ]
      });
    expect(mismatchRes.status).toBe(400);
    expect(mismatchRes.body.errorCode).toBe('SERIAL_COUNT_MISMATCH');

    // 5. Happy path: Nhận đủ 3 Serial -> tạo Serial, tăng tồn HQ = 5, giá vốn BQ = 33.000.000, nợ NCC = 105.000.000
    const receiveRes = await request(app)
      .post(`/api/v1/procurement/purchase-orders/${po._id}/receive`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        notes: 'Đã kiểm đủ seal',
        items: [
          {
            productSkuId: skuId.toString(),
            receivedQty: 3,
            serials: ['SN-W2-001', 'SN-W2-002', 'SN-W2-003']
          }
        ]
      });
    expect(receiveRes.status).toBe(200);
    expect(receiveRes.body.data.purchaseOrder.status).toBe(PO_STATUS.RECEIVED);
    expect(receiveRes.body.data.weightedCostUpdates[0].oldCostPrice).toBe(30000000);
    expect(receiveRes.body.data.weightedCostUpdates[0].newCostPrice).toBe(33000000);
    expect(receiveRes.body.data.vendor.outstandingDebt).toBe(105000000);

    const updatedProd = await Product.findById(product._id).lean();
    expect(updatedProd.skus[0].costPrice).toBe(33000000);

    const hqInv = await BranchInventory.findOne({ branchId: hqBranch._id, productSkuId: skuId }).lean();
    expect(hqInv.quantity).toBe(5);

    const serialDocs = await Serial.find({ serialNumber: { $in: ['SN-W2-001', 'SN-W2-002', 'SN-W2-003'] } }).lean();
    expect(serialDocs).toHaveLength(3);
    expect(serialDocs.every((s) => s.status === SERIAL_STATUS.IN_STOCK && String(s.branchId) === String(hqBranch._id))).toBe(true);

    // 6. Thanh toán công nợ từng phần (45tr) -> PARTIAL, chặn trả vượt (70tr), trả nốt (60tr) -> PAID & debt = 0
    const pay1 = await request(app)
      .post(`/api/v1/procurement/vendors/${vendor._id}/payments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 45000000,
        purchaseOrderId: po._id.toString(),
        note: 'Thanh toán đợt 1'
      });
    expect(pay1.status).toBe(200);
    expect(pay1.body.data.purchaseOrder.paymentStatus).toBe(PO_PAYMENT_STATUS.PARTIAL);
    expect(pay1.body.data.vendor.outstandingDebt).toBe(60000000);

    const overPay = await request(app)
      .post(`/api/v1/procurement/vendors/${vendor._id}/payments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 70000000,
        purchaseOrderId: po._id.toString()
      });
    expect(overPay.status).toBe(400);

    const pay2 = await request(app)
      .post(`/api/v1/procurement/vendors/${vendor._id}/payments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 60000000,
        purchaseOrderId: po._id.toString(),
        note: 'Tất toán PO'
      });
    expect(pay2.status).toBe(200);
    expect(pay2.body.data.purchaseOrder.paymentStatus).toBe(PO_PAYMENT_STATUS.PAID);
    expect(pay2.body.data.vendor.outstandingDebt).toBe(0);

    await new Promise((r) => setTimeout(r, 50));
    const logs = await AuditLog.find({
      action: { $in: [AUDIT_ACTIONS.VENDOR_UPSERT, AUDIT_ACTIONS.PO_CREATE, AUDIT_ACTIONS.PO_RECEIVE, AUDIT_ACTIONS.VENDOR_PAYMENT] }
    }).lean();
    expect(logs.length).toBeGreaterThanOrEqual(4);
  });
});
