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
import { Order, ORDER_TYPES, ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS } from '../../src/modules/orders/order.model.js';

setupTestDB();

describe('Order & POS Checkout Module Integration Tests', () => {
  let superAdminToken;
  let staffAToken;
  let staffBToken;
  let customerToken;
  let customerUser;

  let branchA;
  let branchB;
  let productIpad;
  let skuIpad;

  beforeEach(async () => {
    // 1. Khởi tạo Chi nhánh
    branchA = await Branch.create({
      branchCode: 'BR-ORD-Q1',
      name: 'TechStore Chi Nhánh Quận 1 Flagship',
      address: '123 Lê Lợi, Q1, TP.HCM',
      phone: '0901234567',
      location: { type: 'Point', coordinates: [106.6983, 10.7719] },
      isActive: true
    });

    branchB = await Branch.create({
      branchCode: 'BR-ORD-Q7',
      name: 'TechStore Chi Nhánh Quận 7',
      address: '456 Nguyễn Thị Thập, Q7, TP.HCM',
      phone: '0907654321',
      location: { type: 'Point', coordinates: [106.7218, 10.7324] },
      isActive: true
    });

    // 2. Khởi tạo Danh mục & Sản phẩm
    const category = await Category.create({
      name: 'Tablets',
      slug: 'tablets',
      attributeKeys: ['screen_size', 'storage'],
      isActive: true
    });

    skuIpad = {
      _id: new mongoose.Types.ObjectId(),
      sku: 'IPAD-M2-128-GRY',
      price: 19990000,
      salePrice: 18490000,
      images: ['https://cdn.techstore.vn/ipad-air-m2.jpg'],
      optionValues: [
        { optionName: 'storage', value: '128GB' },
        { optionName: 'color', value: 'Space Gray' }
      ],
      isActive: true
    };

    productIpad = await Product.create({
      name: 'iPad Air 11 M2 2024',
      slug: 'ipad-air-11-m2-2024',
      categoryId: category._id,
      brand: 'Apple',
      description: 'iPad Air chip M2 hiệu năng mạnh mẽ',
      images: ['https://cdn.techstore.vn/ipad-cover.jpg'],
      attributes: [
        { key: 'screen_size', value: '11 inch' },
        { key: 'storage', value: '128GB' }
      ],
      options: [
        { name: 'storage', displayType: 'button', values: ['128GB'] },
        { name: 'color', displayType: 'color_picker', values: ['Space Gray'] }
      ],
      skus: [skuIpad],
      isActive: true
    });

    // 3. Khởi tạo Users
    // 3.1 Super Admin
    await User.create({
      fullName: 'Super Admin',
      email: 'admin.order@techstore.com',
      phone: '0911000999',
      passwordHash: 'Pass@123',
      role: USER_ROLES.SUPER_ADMIN,
      isActive: true
    });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'admin.order@techstore.com',
      password: 'Pass@123'
    });
    superAdminToken = adminLogin.body.data.accessToken;

    // 3.2 Staff at Branch A
    await User.create({
      fullName: 'Staff Branch A',
      email: 'staff.order.a@techstore.com',
      phone: '0922000999',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchA._id,
      isActive: true
    });
    const staffALogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'staff.order.a@techstore.com',
      password: 'Pass@123'
    });
    staffAToken = staffALogin.body.data.accessToken;

    // 3.3 Staff at Branch B
    await User.create({
      fullName: 'Staff Branch B',
      email: 'staff.order.b@techstore.com',
      phone: '0933000999',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchB._id,
      isActive: true
    });
    const staffBLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'staff.order.b@techstore.com',
      password: 'Pass@123'
    });
    staffBToken = staffBLogin.body.data.accessToken;

    // 3.4 Customer
    customerUser = await User.create({
      fullName: 'Customer Buyer',
      email: 'customer.order@techstore.com',
      phone: '0944000999',
      passwordHash: 'Pass@123',
      role: USER_ROLES.CUSTOMER,
      isActive: true
    });
    const customerLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'customer.order@techstore.com',
      password: 'Pass@123'
    });
    customerToken = customerLogin.body.data.accessToken;
  });

  describe('POST /api/v1/orders/pos/checkout (Web POS Checkout)', () => {
    let validSerial1;
    let validSerial2;
    let branchBSerial;
    let soldSerial;

    beforeEach(async () => {
      // Tồn kho chi nhánh A: 5 chiếc
      await BranchInventory.create({
        branchId: branchA._id,
        productId: productIpad._id,
        productSkuId: skuIpad._id,
        quantity: 5
      });

      // Tạo các Serial tại Chi nhánh A
      validSerial1 = await Serial.create({
        serialNumber: 'IPAD-SER-001',
        productId: productIpad._id,
        productSkuId: skuIpad._id,
        branchId: branchA._id,
        status: SERIAL_STATUS.IN_STOCK
      });

      validSerial2 = await Serial.create({
        serialNumber: 'IPAD-SER-002',
        productId: productIpad._id,
        productSkuId: skuIpad._id,
        branchId: branchA._id,
        status: SERIAL_STATUS.IN_STOCK
      });

      // Serial tại Chi nhánh B
      branchBSerial = await Serial.create({
        serialNumber: 'IPAD-SER-BRANCH-B',
        productId: productIpad._id,
        productSkuId: skuIpad._id,
        branchId: branchB._id,
        status: SERIAL_STATUS.IN_STOCK
      });

      // Serial đã bán
      soldSerial = await Serial.create({
        serialNumber: 'IPAD-SER-ALREADY-SOLD',
        productId: productIpad._id,
        productSkuId: skuIpad._id,
        branchId: branchA._id,
        status: SERIAL_STATUS.SOLD,
        soldAt: new Date()
      });
    });

    test('Happy Path: Thu ngân quầy bán 2 máy kèm 2 Serial hợp lệ -> HTTP 201, trừ kho, kích hoạt bảo hành', async () => {
      const payload = {
        items: [
          {
            productId: productIpad._id.toString(),
            productSkuId: skuIpad._id.toString(),
            quantity: 2,
            serialsAssigned: [validSerial1.serialNumber, validSerial2.serialNumber]
          }
        ],
        paymentMethod: PAYMENT_METHODS.CASH,
        customerInfo: {
          fullName: 'Nguyen Van Khach',
          phone: '0988111222'
        }
      };

      const res = await request(app)
        .post('/api/v1/orders/pos/checkout')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.orderType).toBe(ORDER_TYPES.POS_STORE);
      expect(res.body.data.order.orderStatus).toBe(ORDER_STATUS.COMPLETED);
      expect(res.body.data.order.paymentStatus).toBe(PAYMENT_STATUS.PAID);
      expect(res.body.data.order.totalAmount).toBe(skuIpad.salePrice * 2);
      expect(res.body.data.order.orderCode).toMatch(/^ORD-\d{8}-[A-F0-9]{4}$/);

      // Xác nhận tồn kho Branch A bị trừ từ 5 xuống 3
      const updatedInv = await BranchInventory.findOne({
        branchId: branchA._id,
        productSkuId: skuIpad._id
      });
      expect(updatedInv.quantity).toBe(3);

      // Xác nhận cả 2 serial chuyển sang SOLD và có hạn bảo hành 1 năm
      const serial1InDb = await Serial.findOne({ serialNumber: validSerial1.serialNumber });
      expect(serial1InDb.status).toBe(SERIAL_STATUS.SOLD);
      expect(serial1InDb.soldAt).toBeDefined();
      expect(serial1InDb.warrantyEndDate).toBeDefined();
      expect(serial1InDb.orderId.toString()).toBe(res.body.data.order._id.toString());
    });

    test('Negative Path - Serial Sai Chi Nhánh: Quét mã Serial thuộc chi nhánh B tại quầy chi nhánh A -> Bị từ chối với HTTP 400', async () => {
      const payload = {
        items: [
          {
            productId: productIpad._id.toString(),
            productSkuId: skuIpad._id.toString(),
            quantity: 1,
            serialsAssigned: [branchBSerial.serialNumber]
          }
        ],
        paymentMethod: PAYMENT_METHODS.CASH
      };

      const res = await request(app)
        .post('/api/v1/orders/pos/checkout')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('CROSS_BRANCH_ACCESS_DENIED');

      // Tồn kho không bị trừ
      const inv = await BranchInventory.findOne({ branchId: branchA._id, productSkuId: skuIpad._id });
      expect(inv.quantity).toBe(5);
    });

    test('Negative Path - Serial Đã Bán: Quét mã Serial có trạng thái SOLD -> Bị chặn với HTTP 400', async () => {
      const payload = {
        items: [
          {
            productId: productIpad._id.toString(),
            productSkuId: skuIpad._id.toString(),
            quantity: 1,
            serialsAssigned: [soldSerial.serialNumber]
          }
        ],
        paymentMethod: PAYMENT_METHODS.CASH
      };

      const res = await request(app)
        .post('/api/v1/orders/pos/checkout')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('INVALID_SERIAL_STATUS');
    });

    test('Security / RBAC: Khách hàng CUSTOMER không thể gọi endpoint quầy POS', async () => {
      const res = await request(app)
        .post('/api/v1/orders/pos/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: productIpad._id.toString(), productSkuId: skuIpad._id.toString(), quantity: 1 }]
        });

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN');
    });
  });

  describe('POST /api/v1/orders/b2c/checkout (B2C Online Checkout)', () => {
    beforeEach(async () => {
      await BranchInventory.create({
        branchId: branchA._id,
        productId: productIpad._id,
        productSkuId: skuIpad._id,
        quantity: 3
      });
    });

    test('Happy Path: Khách hàng đặt mua B2C thành công -> Trừ kho trước (Virtual Holding), Order PENDING', async () => {
      const payload = {
        branchId: branchA._id.toString(),
        items: [
          {
            productId: productIpad._id.toString(),
            productSkuId: skuIpad._id.toString(),
            quantity: 2
          }
        ],
        shippingAddress: {
          fullName: 'Khach Hang B2C',
          phone: '0977888999',
          address: '99 Tran Hung Dao, Q1'
        },
        paymentMethod: PAYMENT_METHODS.VNPAY
      };

      const res = await request(app)
        .post('/api/v1/orders/b2c/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.orderType).toBe(ORDER_TYPES.B2C_ONLINE);
      expect(res.body.data.order.orderStatus).toBe(ORDER_STATUS.PENDING);
      expect(res.body.data.order.paymentStatus).toBe(PAYMENT_STATUS.PENDING);
      expect(res.body.data.order.customerId.toString()).toBe(customerUser._id.toString());

      // Tồn kho giảm từ 3 xuống 1
      const inv = await BranchInventory.findOne({ branchId: branchA._id, productSkuId: skuIpad._id });
      expect(inv.quantity).toBe(1);
    });

    test('Negative Path: Đặt số lượng vượt quá tồn kho chi nhánh -> HTTP 409 Conflict', async () => {
      const payload = {
        branchId: branchA._id.toString(),
        items: [
          {
            productId: productIpad._id.toString(),
            productSkuId: skuIpad._id.toString(),
            quantity: 10 // Chỉ còn 3
          }
        ],
        shippingAddress: {
          fullName: 'Khach Hang B2C',
          phone: '0977888999',
          address: '99 Tran Hung Dao'
        },
        paymentMethod: PAYMENT_METHODS.STRIPE
      };

      const res = await request(app)
        .post('/api/v1/orders/b2c/checkout')
        .send(payload);

      expect(res.status).toBe(409);
      expect(res.body.errorCode).toBe('PRODUCT_OUT_OF_STOCK');

      // Tồn kho giữ nguyên 3
      const inv = await BranchInventory.findOne({ branchId: branchA._id, productSkuId: skuIpad._id });
      expect(inv.quantity).toBe(3);
    });
  });

  describe('RACE CONDITION SIMULATION TEST (Core TC2.1 & TC2.2 Zero Overselling)', () => {
    test('Simultaneous Checkout Race Condition: 2 đơn hàng tranh chấp 1 sản phẩm cuối cùng -> Chính xác 1 đơn thành công, 1 đơn 409, kho = 0', async () => {
      // 1. Chuẩn bị kho: Chỉ còn duy nhất 1 sản phẩm
      await BranchInventory.create({
        branchId: branchA._id,
        productId: productIpad._id,
        productSkuId: skuIpad._id,
        quantity: 1
      });

      const serialSingle = await Serial.create({
        serialNumber: 'IPAD-LAST-UNIT',
        productId: productIpad._id,
        productSkuId: skuIpad._id,
        branchId: branchA._id,
        status: SERIAL_STATUS.IN_STOCK
      });

      // 2. Chuẩn bị 2 request đồng thời:
      // Request 1: POS Checkout
      const posReq = request(app)
        .post('/api/v1/orders/pos/checkout')
        .set('Authorization', `Bearer ${staffAToken}`)
        .send({
          items: [
            {
              productId: productIpad._id.toString(),
              productSkuId: skuIpad._id.toString(),
              quantity: 1,
              serialsAssigned: [serialSingle.serialNumber]
            }
          ],
          paymentMethod: PAYMENT_METHODS.CASH
        });

      // Request 2: B2C Checkout
      const b2cReq = request(app)
        .post('/api/v1/orders/b2c/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          branchId: branchA._id.toString(),
          items: [
            {
              productId: productIpad._id.toString(),
              productSkuId: skuIpad._id.toString(),
              quantity: 1
            }
          ],
          shippingAddress: {
            fullName: 'Khach Tranh Chap',
            phone: '0912345678',
            address: 'Dia chi test'
          },
          paymentMethod: PAYMENT_METHODS.VNPAY
        });

      // 3. Kích hoạt đồng thời bằng Promise.all
      const [res1, res2] = await Promise.all([posReq, b2cReq]);

      const statuses = [res1.status, res2.status].sort();

      // Assertions
      // Một request phải thành công (201) và một request bị từ chối do hết hàng (409)
      expect(statuses).toEqual([201, 409]);

      // Tồn kho cuối cùng trong Database bằng đúng 0, tuyệt đối không bị âm
      const finalInv = await BranchInventory.findOne({
        branchId: branchA._id,
        productSkuId: skuIpad._id
      });
      expect(finalInv.quantity).toBe(0);

      // Tổng số đơn hàng được tạo thành công là 1
      const totalOrdersCreated = await Order.countDocuments();
      expect(totalOrdersCreated).toBe(1);
    });
  });

  describe('Order Management & Queries (Security & Scoping)', () => {
    let orderBranchA;

    beforeEach(async () => {
      orderBranchA = await Order.create({
        orderCode: 'ORD-20260930-AAAA',
        orderType: ORDER_TYPES.POS_STORE,
        branchId: branchA._id,
        staffId: new mongoose.Types.ObjectId(),
        items: [
          {
            productId: productIpad._id,
            productSkuId: skuIpad._id,
            productName: productIpad.name,
            sku: skuIpad.sku,
            quantity: 1,
            unitPrice: 18490000,
            subtotal: 18490000,
            serialsAssigned: ['SER-A']
          }
        ],
        totalAmount: 18490000,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.COMPLETED
      });

      await Order.create({
        orderCode: 'ORD-20260930-BBBB',
        orderType: ORDER_TYPES.POS_STORE,
        branchId: branchB._id,
        staffId: new mongoose.Types.ObjectId(),
        items: [
          {
            productId: productIpad._id,
            productSkuId: skuIpad._id,
            productName: productIpad.name,
            sku: skuIpad.sku,
            quantity: 1,
            unitPrice: 18490000,
            subtotal: 18490000,
            serialsAssigned: ['SER-B']
          }
        ],
        totalAmount: 18490000,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.COMPLETED
      });
    });

    test('Data Scoping: Staff Chi nhánh A gọi GET /orders/branch chỉ thấy đơn hàng của Chi nhánh A', async () => {
      const res = await request(app)
        .get('/api/v1/orders/branch')
        .set('Authorization', `Bearer ${staffAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orders.length).toBe(1);
      expect(res.body.data.orders[0].orderCode).toBe('ORD-20260930-AAAA');

      // Staff Chi nhánh B chỉ thấy đơn hàng của Chi nhánh B
      const resB = await request(app)
        .get('/api/v1/orders/branch')
        .set('Authorization', `Bearer ${staffBToken}`);

      expect(resB.status).toBe(200);
      expect(resB.body.data.orders.length).toBe(1);
      expect(resB.body.data.orders[0].orderCode).toBe('ORD-20260930-BBBB');
    });

    test('Super Admin: Xem toàn bộ đơn hàng của tất cả chi nhánh', async () => {
      const res = await request(app)
        .get('/api/v1/orders/branch')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.orders.length).toBe(2);
    });

    test('Happy Path: Tra cứu chi tiết đơn hàng qua mã orderCode', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${orderBranchA.orderCode}`)
        .set('Authorization', `Bearer ${staffAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.orderCode).toBe('ORD-20260930-AAAA');
      expect(res.body.data.order.items.length).toBe(1);
    });

    test('Negative Path: Tra cứu orderCode không tồn tại -> HTTP 404', async () => {
      const res = await request(app)
        .get('/api/v1/orders/ORD-NON-EXISTENT')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.errorCode).toBe('ORDER_NOT_FOUND');
    });

    test('Customer Order History: Khách hàng gọi GET /my-orders chỉ thấy đơn của chính mình', async () => {
      // Gán customerId cho 1 đơn B2C
      await Order.create({
        orderCode: 'ORD-20260930-MY01',
        orderType: ORDER_TYPES.B2C_ONLINE,
        branchId: branchA._id,
        customerId: customerUser._id,
        items: [
          {
            productId: productIpad._id,
            productSkuId: skuIpad._id,
            productName: productIpad.name,
            sku: skuIpad.sku,
            quantity: 1,
            unitPrice: 18490000,
            subtotal: 18490000,
            serialsAssigned: []
          }
        ],
        totalAmount: 18490000,
        paymentMethod: PAYMENT_METHODS.VNPAY,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.PROCESSING
      });

      const res = await request(app)
        .get('/api/v1/orders/my-orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orders.length).toBe(1);
      expect(res.body.data.orders[0].orderCode).toBe('ORD-20260930-MY01');
    });
  });
});
