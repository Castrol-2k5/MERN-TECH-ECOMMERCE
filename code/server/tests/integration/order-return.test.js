import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import { BranchInventory } from '../../src/modules/inventory/inventory.model.js';
import { Serial, SERIAL_STATUS } from '../../src/modules/serials/serial.model.js';
import { Order, ORDER_TYPES, PAYMENT_METHODS, PAYMENT_STATUS, ORDER_STATUS } from '../../src/modules/orders/order.model.js';
import { PosShift } from '../../src/modules/shifts/posShift.model.js';
import { AuditLog, AUDIT_ACTIONS } from '../../src/modules/audit/auditLog.model.js';
import { generateAccessToken } from '../../src/utils/token.js';

setupTestDB();

describe('Order Return & Refund Integration Tests (Gói 2 - UC-ORD-12)', () => {
  let staffQ1Token;
  let staffTdToken;
  let branchQ1;
  let branchTD;
  let staffQ1;
  let testProduct;
  let testSkuId;
  let completedOrder;
  let openShift;

  beforeEach(async () => {
    branchQ1 = await Branch.create({
      branchCode: 'BR-RTN-Q1',
      name: 'Chi nhánh Trả Hàng Q1',
      address: '123 NTMK, Q1, TP.HCM',
      phone: '02839250001',
      location: { type: 'Point', coordinates: [106.69, 10.77] },
      isActive: true
    });

    branchTD = await Branch.create({
      branchCode: 'BR-RTN-TD',
      name: 'Chi nhánh Thủ Đức',
      address: '45 Võ Văn Ngân, Thủ Đức',
      phone: '02838960002',
      location: { type: 'Point', coordinates: [106.76, 10.85] },
      isActive: true
    });

    staffQ1 = await User.create({
      fullName: 'Thu Ngân Q1 Return',
      email: 'staff.rtn.q1@techone.vn',
      phone: '0909111222',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchQ1._id,
      isActive: true
    });
    staffQ1Token = generateAccessToken({
      id: staffQ1._id.toString(),
      role: staffQ1.role,
      branchId: branchQ1._id.toString()
    });

    const staffTD = await User.create({
      fullName: 'Thu Ngân TD Return',
      email: 'staff.rtn.td@techone.vn',
      phone: '0909333444',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchTD._id,
      isActive: true
    });
    staffTdToken = generateAccessToken({
      id: staffTD._id.toString(),
      role: staffTD.role,
      branchId: branchTD._id.toString()
    });

    const cat = await Category.create({
      name: 'Smartphone Return Test',
      slug: 'smartphone-return-test',
      isActive: true
    });

    testSkuId = new mongoose.Types.ObjectId();
    testProduct = await Product.create({
      name: 'iPhone 16 Pro Max Return Test',
      slug: 'iphone-16-pm-return-test',
      brand: 'Apple',
      categoryId: cat._id,
      isSerialManaged: true,
      isActive: true,
      skus: [
        {
          _id: testSkuId,
          sku: 'IP16PM-RTN-256',
          price: 30000000,
          salePrice: 30000000,
          isActive: true
        }
      ]
    });

    await BranchInventory.create({
      branchId: branchQ1._id,
      productId: testProduct._id,
      productSkuId: testSkuId,
      quantity: 3
    });

    // Mở ca thu ngân Q1 với 2.000.000đ đầu ca + 60.000.000đ bán tiền mặt
    openShift = await PosShift.create({
      shiftCode: 'SHF-RTN-001',
      branchId: branchQ1._id,
      cashierId: staffQ1._id,
      status: 'OPEN',
      openingBalance: 2000000,
      cashSales: 60000000,
      expectedEndingBalance: 62000000
    });

    // Tạo đơn POS đã hoàn tất với 2 máy & 2 Serial SOLD
    const orderItemId = new mongoose.Types.ObjectId();
    completedOrder = await Order.create({
      orderCode: 'ORD-RTN-261110-001',
      orderType: ORDER_TYPES.POS_STORE,
      branchId: branchQ1._id,
      staffId: staffQ1._id,
      customerInfo: { fullName: 'Nguyễn Văn Khách', phone: '0912345678' },
      items: [
        {
          _id: orderItemId,
          productId: testProduct._id,
          productSkuId: testSkuId,
          productName: testProduct.name,
          sku: 'IP16PM-RTN-256',
          quantity: 2,
          unitPrice: 30000000,
          subtotal: 60000000,
          serialsAssigned: ['SN-RTN-001', 'SN-RTN-002']
        }
      ],
      totalAmount: 60000000,
      paymentMethod: PAYMENT_METHODS.CASH,
      paymentStatus: PAYMENT_STATUS.PAID,
      orderStatus: ORDER_STATUS.COMPLETED
    });

    await Serial.create([
      {
        serialNumber: 'SN-RTN-001',
        productId: testProduct._id,
        productSkuId: testSkuId,
        branchId: branchQ1._id,
        status: SERIAL_STATUS.SOLD,
        orderId: completedOrder._id,
        orderItemId,
        soldAt: new Date()
      },
      {
        serialNumber: 'SN-RTN-002',
        productId: testProduct._id,
        productSkuId: testSkuId,
        branchId: branchQ1._id,
        status: SERIAL_STATUS.SOLD,
        orderId: completedOrder._id,
        orderItemId,
        soldAt: new Date()
      }
    ]);
  });

  it('Trả hàng 1 phần (GOOD) -> Hoàn kho, Serial về IN_STOCK, trừ quỹ ca PosShift và ghi AuditLog', async () => {
    const res = await request(app)
      .post(`/api/v1/orders/${completedOrder._id}/return`)
      .set('Authorization', `Bearer ${staffQ1Token}`)
      .send({
        items: [
          {
            productSkuId: testSkuId.toString(),
            quantity: 1,
            condition: 'GOOD',
            serialsReturned: ['SN-RTN-001']
          }
        ],
        refundMethod: 'CASH',
        reason: 'Khách trả bớt 1 máy nguyên seal'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.order.orderStatus).toBe(ORDER_STATUS.PARTIALLY_RETURNED);
    expect(res.body.data.order.refundedAmount).toBe(30000000);
    expect(res.body.data.shiftAdjusted).toBe(true);

    // 1. Tồn kho Q1 tăng từ 3 -> 4
    const inv = await BranchInventory.findOne({ branchId: branchQ1._id, productSkuId: testSkuId }).lean();
    expect(inv.quantity).toBe(4);

    // 2. SN-RTN-001 quay về IN_STOCK; SN-RTN-002 vẫn là SOLD
    const sn1 = await Serial.findOne({ serialNumber: 'SN-RTN-001' }).lean();
    const sn2 = await Serial.findOne({ serialNumber: 'SN-RTN-002' }).lean();
    expect(sn1.status).toBe(SERIAL_STATUS.IN_STOCK);
    expect(sn1.orderId).toBeNull();
    expect(sn2.status).toBe(SERIAL_STATUS.SOLD);

    // 3. Ca POS cập nhật cashRefunds = 30.000.000, expected = 32.000.000
    const updatedShift = await PosShift.findById(openShift._id).lean();
    expect(updatedShift.cashRefunds).toBe(30000000);
    expect(updatedShift.expectedEndingBalance).toBe(32000000);

    // 4. AuditLog ORDER_RETURN được ghi nhận
    await new Promise((r) => setTimeout(r, 100));
    const log = await AuditLog.findOne({ action: AUDIT_ACTIONS.ORDER_RETURN }).lean();
    expect(log).toBeDefined();
    expect(log.target.code).toBe('ORD-RTN-261110-001');
  });

  it('Trả hàng phần còn lại (DEFECTIVE) -> Order sang RETURNED/REFUNDED, Serial sang DEFECTIVE và KHÔNG cộng tồn bán', async () => {
    // Trả máy 1 GOOD trước
    await request(app)
      .post(`/api/v1/orders/${completedOrder._id}/return`)
      .set('Authorization', `Bearer ${staffQ1Token}`)
      .send({
        items: [{ productSkuId: testSkuId.toString(), quantity: 1, condition: 'GOOD', serialsReturned: ['SN-RTN-001'] }],
        refundMethod: 'CASH',
        reason: 'Trả máy 1'
      });

    // Trả máy 2 DEFECTIVE bằng TRANSFER
    const res2 = await request(app)
      .post(`/api/v1/orders/${completedOrder._id}/return`)
      .set('Authorization', `Bearer ${staffQ1Token}`)
      .send({
        items: [{ productSkuId: testSkuId.toString(), quantity: 1, condition: 'DEFECTIVE', serialsReturned: ['SN-RTN-002'] }],
        refundMethod: 'TRANSFER',
        reason: 'Máy bị sọc màn hình ngay khi bóc hộp'
      });

    expect(res2.status).toBe(200);
    expect(res2.body.data.order.orderStatus).toBe(ORDER_STATUS.RETURNED);
    expect(res2.body.data.order.paymentStatus).toBe(PAYMENT_STATUS.REFUNDED);
    expect(res2.body.data.order.refundedAmount).toBe(60000000);

    // Tồn kho giữ nguyên 4 (chỉ tăng từ máy 1 GOOD, máy 2 DEFECTIVE không cộng vào tồn bán)
    const inv = await BranchInventory.findOne({ branchId: branchQ1._id, productSkuId: testSkuId }).lean();
    expect(inv.quantity).toBe(4);

    // SN-RTN-002 chuyển sang DEFECTIVE
    const sn2 = await Serial.findOne({ serialNumber: 'SN-RTN-002' }).lean();
    expect(sn2.status).toBe(SERIAL_STATUS.DEFECTIVE);
  });

  it('Bảo mật & Validation: Chặn chéo chi nhánh, sai Serial và trả quá số lượng', async () => {
    // 1. Chặn nhân viên chi nhánh Thủ Đức trả đơn của Q1 -> 403
    const crossRes = await request(app)
      .post(`/api/v1/orders/${completedOrder._id}/return`)
      .set('Authorization', `Bearer ${staffTdToken}`)
      .send({
        items: [{ productSkuId: testSkuId.toString(), quantity: 1, condition: 'GOOD', serialsReturned: ['SN-RTN-001'] }],
        refundMethod: 'CASH',
        reason: 'Thử trả chéo chi nhánh'
      });
    expect(crossRes.status).toBe(403);

    // 2. Chặn trả quá số lượng (> 2) -> 400
    const qtyRes = await request(app)
      .post(`/api/v1/orders/${completedOrder._id}/return`)
      .set('Authorization', `Bearer ${staffQ1Token}`)
      .send({
        items: [{ productSkuId: testSkuId.toString(), quantity: 3, condition: 'GOOD', serialsReturned: ['SN-RTN-001', 'SN-RTN-002', 'SN-FAKE'] }],
        refundMethod: 'CASH',
        reason: 'Trả vượt SL'
      });
    expect(qtyRes.status).toBe(400);
    expect(qtyRes.body.errorCode).toBe('RETURN_QUANTITY_EXCEEDED');

    // 3. Chặn trả sai mã Serial không thuộc đơn -> 400
    const badSnRes = await request(app)
      .post(`/api/v1/orders/${completedOrder._id}/return`)
      .set('Authorization', `Bearer ${staffQ1Token}`)
      .send({
        items: [{ productSkuId: testSkuId.toString(), quantity: 1, condition: 'GOOD', serialsReturned: ['SN-UNKNOWN-999'] }],
        refundMethod: 'CASH',
        reason: 'Sai serial'
      });
    expect(badSnRes.status).toBe(400);
    expect(badSnRes.body.errorCode).toBe('INVALID_RETURN_SERIAL');
  });
});
