import mongoose from 'mongoose';
import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch, BRANCH_REGIONS } from '../../src/modules/branches/branch.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { BranchInventory } from '../../src/modules/inventory/inventory.model.js';
import { Serial, SERIAL_STATUS } from '../../src/modules/serials/serial.model.js';
import { TRANSFER_STATUS } from '../../src/modules/inventory/stockTransfer.model.js';
import { AuditLog, AUDIT_ACTIONS } from '../../src/modules/audit/auditLog.model.js';

setupTestDB();

describe('HQ Chain Director Wave 3: Min/Max Auto-Replenishment & Dead Stock Rebalancing', () => {
  let hqBranch;
  let branchA;
  let branchB;
  let product;
  let skuId;
  let adminToken;
  let managerToken;

  beforeEach(async () => {
    hqBranch = await Branch.create({
      branchCode: 'BR-HQ',
      name: 'Kho Tổng HQ W3',
      address: '01 Lê Duẩn',
      phone: '02838226868',
      location: { type: 'Point', coordinates: [106.7, 10.78] },
      isHeadquarter: true,
      isWarehouse: true,
      region: BRANCH_REGIONS.HCM,
      isActive: true
    });

    branchA = await Branch.create({
      branchCode: 'BR-W3-A',
      name: 'Chi nhánh Q1 W3',
      address: '100 Nguyễn Huệ',
      phone: '02838220001',
      location: { type: 'Point', coordinates: [106.7, 10.77] },
      region: BRANCH_REGIONS.HCM,
      isActive: true
    });

    branchB = await Branch.create({
      branchCode: 'BR-W3-B',
      name: 'Chi nhánh Thủ Đức W3',
      address: '200 Võ Văn Ngân',
      phone: '02838220002',
      location: { type: 'Point', coordinates: [106.76, 10.85] },
      region: BRANCH_REGIONS.HCM,
      isActive: true
    });

    const cat = await Category.create({
      name: 'Smartphone W3',
      slug: 'smartphone-w3',
      attributeKeys: ['ram'],
      isActive: true
    });

    await User.create({
      fullName: 'CEO W3',
      email: 'ceo.w3@techstore.com',
      phone: '0909820001',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });
    adminToken = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'ceo.w3@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    await User.create({
      fullName: 'Manager W3',
      email: 'mgr.w3@techstore.com',
      phone: '0909820002',
      passwordHash: 'Pass@123',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: branchA._id,
      isActive: true
    });
    managerToken = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'mgr.w3@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    const prodRes = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Samsung Galaxy S26 Ultra W3',
        categoryId: cat._id.toString(),
        brand: 'Samsung',
        isSerialManaged: true,
        skus: [
          {
            sku: 'S26U-512-W3',
            price: 31990000,
            salePrice: 29990000,
            costPrice: 24000000
          }
        ]
      });
    product = prodRes.body.data.product;
    skuId = product.skus[0]._id;
  });

  test('UC-HQ-06: Cấu hình Min/Max, sinh đề xuất cấp hàng & 1-Click Xuất Chuyển Kho HQ -> Chi nhánh', async () => {
    // RBAC
    const denied = await request(app)
      .get('/api/v1/hq/supply-chain/replenishment-suggestions')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(denied.status).toBe(403);

    // Seed HQ có 5 máy, Branch A có 1 máy
    await BranchInventory.create([
      { branchId: hqBranch._id, productId: product._id, productSkuId: skuId, quantity: 5 },
      { branchId: branchA._id, productId: product._id, productSkuId: skuId, quantity: 1 }
    ]);
    await Serial.create(
      [1, 2, 3, 4, 5].map((i) => ({
        serialNumber: `SN-HQ-W3-0${i}`,
        productId: product._id,
        productSkuId: skuId,
        branchId: hqBranch._id,
        status: SERIAL_STATUS.IN_STOCK
      }))
    );

    // Negative validation: maxStock < minStock -> 400
    const badThreshold = await request(app)
      .patch('/api/v1/hq/supply-chain/thresholds')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        items: [
          {
            branchId: branchA._id.toString(),
            productId: product._id.toString(),
            productSkuId: skuId.toString(),
            minStock: 5,
            maxStock: 3
          }
        ]
      });
    expect(badThreshold.status).toBe(400);

    // Cập nhật minStock: 4, maxStock: 8 cho Branch A
    const setRes = await request(app)
      .patch('/api/v1/hq/supply-chain/thresholds')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        items: [
          {
            branchId: branchA._id.toString(),
            productId: product._id.toString(),
            productSkuId: skuId.toString(),
            minStock: 4,
            maxStock: 8
          }
        ]
      });
    expect(setRes.status).toBe(200);

    // Gợi ý Auto-Replenishment: neededQty = 8 - 1 = 7, hqAvailable = 5 => recommendedQty = 5
    const sugRes = await request(app)
      .get('/api/v1/hq/supply-chain/replenishment-suggestions')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(sugRes.status).toBe(200);
    expect(sugRes.body.data.suggestions).toHaveLength(1);
    const sug = sugRes.body.data.suggestions[0];
    expect(sug.neededQty).toBe(7);
    expect(sug.hqAvailable).toBe(5);
    expect(sug.recommendedQty).toBe(5);
    expect(sug.canFulfillFromHq).toBe(true);

    // 1-Click Xuất điều chuyển 5 máy từ HQ -> Branch A
    const execRes = await request(app)
      .post('/api/v1/hq/supply-chain/replenish')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        destinationBranchId: branchA._id.toString(),
        productId: product._id.toString(),
        productSkuId: skuId.toString(),
        quantity: 5
      });
    expect(execRes.status).toBe(201);
    expect(execRes.body.data.transfer.status).toBe(TRANSFER_STATUS.IN_TRANSIT);
    expect(execRes.body.data.transfer.items[0].serialNumbers).toHaveLength(5);

    const hqAfter = await BranchInventory.findOne({ branchId: hqBranch._id, productSkuId: skuId }).lean();
    expect(hqAfter.quantity).toBe(0);

    const transitSerials = await Serial.countDocuments({
      productSkuId: skuId,
      status: SERIAL_STATUS.TRANSIT
    });
    expect(transitSerials).toBe(5);
  });

  test('UC-HQ-07: Phát hiện Dead Stock > 30 ngày ở CN A & Luân chuyển chéo sang CN B thiếu hàng', async () => {
    await BranchInventory.create([
      { branchId: branchA._id, productId: product._id, productSkuId: skuId, quantity: 2, minStock: 1, maxStock: 3 },
      { branchId: branchB._id, productId: product._id, productSkuId: skuId, quantity: 0, minStock: 3, maxStock: 5 }
    ]);

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 40);
    await Serial.collection.insertMany([
      {
        serialNumber: 'SN-DEAD-A1',
        productId: new mongoose.Types.ObjectId(product._id),
        productSkuId: new mongoose.Types.ObjectId(skuId),
        branchId: branchA._id,
        status: SERIAL_STATUS.IN_STOCK,
        createdAt: oldDate,
        updatedAt: oldDate
      },
      {
        serialNumber: 'SN-DEAD-A2',
        productId: new mongoose.Types.ObjectId(product._id),
        productSkuId: new mongoose.Types.ObjectId(skuId),
        branchId: branchA._id,
        status: SERIAL_STATUS.IN_STOCK,
        createdAt: oldDate,
        updatedAt: oldDate
      }
    ]);

    const deadRes = await request(app)
      .get('/api/v1/hq/supply-chain/dead-stock-suggestions?agedDays=30')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deadRes.status).toBe(200);
    expect(deadRes.body.data.suggestions).toHaveLength(1);
    const pair = deadRes.body.data.suggestions[0];
    expect(pair.sourceBranchCode).toBe('BR-W3-A');
    expect(pair.destinationBranchCode).toBe('BR-W3-B');
    expect(pair.agedCount).toBe(2);
    expect(pair.recommendedQty).toBe(2);

    // Thực thi luân chuyển chéo A -> B
    const rebalanceRes = await request(app)
      .post('/api/v1/hq/supply-chain/rebalance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sourceBranchId: branchA._id.toString(),
        destinationBranchId: branchB._id.toString(),
        productId: product._id.toString(),
        productSkuId: skuId.toString(),
        quantity: 2
      });
    expect(rebalanceRes.status).toBe(201);
    expect(rebalanceRes.body.data.transfer.status).toBe(TRANSFER_STATUS.IN_TRANSIT);

    const aInvAfter = await BranchInventory.findOne({ branchId: branchA._id, productSkuId: skuId }).lean();
    expect(aInvAfter.quantity).toBe(0);

    await new Promise((r) => setTimeout(r, 50));
    const auditLog = await AuditLog.findOne({ action: AUDIT_ACTIONS.DEAD_STOCK_REBALANCE }).lean();
    expect(auditLog).toBeTruthy();
  });
});
