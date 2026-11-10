import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import { BranchInventory } from '../../src/modules/inventory/inventory.model.js';
import { Serial, SERIAL_STATUS } from '../../src/modules/serials/serial.model.js';
import { TRANSFER_REQUEST_STATUS } from '../../src/modules/inventory/transferRequest.model.js';

setupTestDB();

describe('Branch Manager Wave 3: Stocktake, Pull Transfer Request & RMA Outbound (UC-BM-05 & UC-BM-06)', () => {
  let branchHQ;
  let branchQ1;
  let adminToken;
  let managerQ1Token;
  let staffQ1Token;
  let testProduct;
  let testSkuId;

  beforeEach(async () => {
    branchHQ = await Branch.create({
      branchCode: 'BR-HQ-W3',
      name: 'Kho Tổng HQ',
      address: '01 Lê Duẩn, Q1',
      phone: '02838226868',
      isHeadquarter: true,
      location: { type: 'Point', coordinates: [106.7, 10.78] },
      isActive: true
    });

    branchQ1 = await Branch.create({
      branchCode: 'BR-Q1-W3',
      name: 'Showroom Q1',
      address: '123 NTMK, Q1',
      phone: '02839250001',
      isHeadquarter: false,
      location: { type: 'Point', coordinates: [106.69, 10.77] },
      isActive: true
    });

    await User.create({
      fullName: 'HQ Admin W3',
      email: 'admin.w3@techstore.com',
      phone: '0909500001',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });
    adminToken = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'admin.w3@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    await User.create({
      fullName: 'Quản Lý Q1 W3',
      email: 'mgr.w3@techstore.com',
      phone: '0909500002',
      passwordHash: 'Pass@123',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: branchQ1._id,
      isActive: true
    });
    managerQ1Token = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'mgr.w3@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    await User.create({
      fullName: 'Thu Ngân Q1 W3',
      email: 'staff.w3@techstore.com',
      phone: '0909500003',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchQ1._id,
      isActive: true
    });
    staffQ1Token = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'staff.w3@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    const cat = await Category.create({ name: 'Smartphone W3', slug: 'smartphone-w3', isActive: true });
    testProduct = await Product.create({
      name: 'iPhone 16 Pro W3',
      slug: 'iphone-16-pro-w3',
      brand: 'Apple',
      categoryId: cat._id,
      basePrice: 30000000,
      isSerialManaged: true,
      skus: [{ sku: 'IP16P-W3-256', price: 30000000, variantName: '256GB' }]
    });
    testSkuId = testProduct.skus[0]._id;

    // Tồn Q1: 2 máy IN_STOCK + 1 máy DEFECTIVE; HQ: 2 máy IN_STOCK
    await BranchInventory.create([
      { branchId: branchQ1._id, productId: testProduct._id, productSkuId: testSkuId, quantity: 2 },
      { branchId: branchHQ._id, productId: testProduct._id, productSkuId: testSkuId, quantity: 2 }
    ]);

    await Serial.create([
      {
        serialNumber: 'SN-Q1-STOCK-01',
        productId: testProduct._id,
        productSkuId: testSkuId,
        branchId: branchQ1._id,
        status: SERIAL_STATUS.IN_STOCK
      },
      {
        serialNumber: 'SN-Q1-STOCK-02',
        productId: testProduct._id,
        productSkuId: testSkuId,
        branchId: branchQ1._id,
        status: SERIAL_STATUS.IN_STOCK
      },
      {
        serialNumber: 'SN-Q1-DEFECT-01',
        productId: testProduct._id,
        productSkuId: testSkuId,
        branchId: branchQ1._id,
        status: SERIAL_STATUS.DEFECTIVE
      },
      {
        serialNumber: 'SN-HQ-STOCK-01',
        productId: testProduct._id,
        productSkuId: testSkuId,
        branchId: branchHQ._id,
        status: SERIAL_STATUS.IN_STOCK
      }
    ]);
  });

  it('UC-BM-05: Tạo phiên kiểm kho -> Quét Serial khớp & thừa -> Chốt biên bản phát hiện chính xác Khớp/Thiếu/Thừa', async () => {
    const createRes = await request(app)
      .post('/api/v1/inventory/stocktakes')
      .set('Authorization', `Bearer ${managerQ1Token}`)
      .send({ note: 'Kiểm kê tuần 2 tháng 11' });

    expect(createRes.status).toBe(201);
    const stk = createRes.body.data.stocktake;
    expect(stk.summary.expectedCount).toBe(2);

    // STAFF được phép quét Serial (quét SN-Q1-STOCK-01 khớp + SN-STRANGE-999 lạ, thiếu SN-Q1-STOCK-02)
    const scanRes = await request(app)
      .post(`/api/v1/inventory/stocktakes/${stk._id}/scan`)
      .set('Authorization', `Bearer ${staffQ1Token}`)
      .send({ serialNumbers: ['SN-Q1-STOCK-01', 'SN-STRANGE-999'] });

    expect(scanRes.status).toBe(200);
    expect(scanRes.body.data.stocktake.summary.matchedCount).toBe(1);
    expect(scanRes.body.data.stocktake.summary.missingCount).toBe(1);
    expect(scanRes.body.data.stocktake.summary.surplusCount).toBe(1);

    // Chặn STAFF tự chốt biên bản kiểm kho
    const staffComplete = await request(app)
      .patch(`/api/v1/inventory/stocktakes/${stk._id}/complete`)
      .set('Authorization', `Bearer ${staffQ1Token}`)
      .send({ note: 'STAFF thử chốt' });
    expect(staffComplete.status).toBe(403);

    // Manager chốt kiểm kho
    const completeRes = await request(app)
      .patch(`/api/v1/inventory/stocktakes/${stk._id}/complete`)
      .set('Authorization', `Bearer ${managerQ1Token}`)
      .send({ note: 'Thiếu 1 máy đang tìm lại ở tủ trưng bày' });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.stocktake.status).toBe('COMPLETED');
    expect(completeRes.body.data.stocktake.missingSerials).toEqual(['SN-Q1-STOCK-02']);
    expect(completeRes.body.data.stocktake.surplusSerials).toEqual(['SN-STRANGE-999']);
  });

  it('UC-BM-06 (Pull Transfer): Q1 xin cấp hàng HQ -> Admin duyệt & tạo phiếu chuyển kho tự động', async () => {
    const reqRes = await request(app)
      .post('/api/v1/inventory/transfer-requests')
      .set('Authorization', `Bearer ${managerQ1Token}`)
      .send({
        sourceBranchId: branchHQ._id.toString(),
        items: [
          {
            productId: testProduct._id.toString(),
            productSkuId: testSkuId.toString(),
            quantity: 1
          }
        ],
        reason: 'Chi nhánh Q1 sắp hết iPhone 16 Pro'
      });

    expect(reqRes.status).toBe(201);
    const reqId = reqRes.body.data.request._id;

    // Chặn Q1 tự duyệt yêu cầu của mình vì không phải chi nhánh nguồn
    const selfApprove = await request(app)
      .patch(`/api/v1/inventory/transfer-requests/${reqId}/approve`)
      .set('Authorization', `Bearer ${managerQ1Token}`)
      .send({});
    expect(selfApprove.status).toBe(403);

    // HQ Admin duyệt và xuất chuyển kho luôn với SN-HQ-STOCK-01
    const approveRes = await request(app)
      .patch(`/api/v1/inventory/transfer-requests/${reqId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reviewNote: 'Đồng ý cấp hàng bổ sung cho Q1',
        dispatchTransfer: true,
        serialsMap: {
          [testSkuId.toString()]: ['SN-HQ-STOCK-01']
        }
      });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.request.status).toBe(TRANSFER_REQUEST_STATUS.APPROVED);
    expect(approveRes.body.data.transfer).toBeDefined();

    const snHq = await Serial.findOne({ serialNumber: 'SN-HQ-STOCK-01' }).lean();
    expect(snHq.status).toBe(SERIAL_STATUS.TRANSIT);
  });

  it('UC-BM-06 (RMA Outbound): Gom Serial DEFECTIVE xuất trả Trung tâm Bảo hành / HQ', async () => {
    const listRes = await request(app)
      .get('/api/v1/inventory/rma-outbound/defective-serials')
      .set('Authorization', `Bearer ${managerQ1Token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.serials.length).toBe(1);
    expect(listRes.body.data.serials[0].serialNumber).toBe('SN-Q1-DEFECT-01');

    const rmaRes = await request(app)
      .post('/api/v1/inventory/rma-outbound')
      .set('Authorization', `Bearer ${managerQ1Token}`)
      .send({
        destinationType: 'BRAND_SERVICE',
        destinationName: 'TTBH Apple Authorized Service Q1',
        trackingNumber: 'GHN-RMA-8899',
        reason: 'Xuất bảo hành máy lỗi màn hình khách trả lại',
        serialNumbers: ['SN-Q1-DEFECT-01']
      });

    expect(rmaRes.status).toBe(201);
    expect(rmaRes.body.data.rmaOutbound.items.length).toBe(1);

    const snDef = await Serial.findOne({ serialNumber: 'SN-Q1-DEFECT-01' }).lean();
    expect(snDef.status).toBe(SERIAL_STATUS.WARRANTY);
  });
});
