import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import { Category } from '../../src/modules/categories/category.model.js';
import { Product } from '../../src/modules/products/product.model.js';
import {
  Order,
  ORDER_TYPES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS
} from '../../src/modules/orders/order.model.js';

setupTestDB();

describe('Customer Omnichannel Wave 3: Order Reviews & Staff KPI Sync', () => {
  let branch;
  let staffUser;
  let managerUser;
  let customerUser;
  let otherCustomer;
  let staffToken;
  let managerToken;
  let customerToken;
  let otherCustomerToken;
  let completedOnlineOrder;
  let completedPosOrder;
  let pendingOrder;

  beforeEach(async () => {
    branch = await Branch.create({
      branchCode: 'BR-REV-01',
      name: 'Showroom Q1 Review Test',
      address: '10 Lê Lợi, Q1',
      phone: '0901555666',
      location: { type: 'Point', coordinates: [106.7, 10.77] },
      isActive: true
    });

    const cat = await Category.create({ name: 'Phone Test', slug: 'phone-test', isActive: true });
    const prod = await Product.create({
      name: 'iPhone 16 Pro Test',
      slug: 'iphone-16-pro-test',
      categoryId: cat._id,
      brand: 'Apple',
      isActive: true,
      skus: [{ sku: 'IP16P-TEST', price: 28990000, isActive: true }]
    });

    [staffUser, managerUser, customerUser, otherCustomer] = await User.create([
      {
        fullName: 'Thu Ngân A',
        email: 'staff.rev@techstore.com',
        phone: '0902000111',
        passwordHash: 'Pass@123',
        role: USER_ROLES.STAFF,
        branchId: branch._id,
        isActive: true
      },
      {
        fullName: 'Quản Lý A',
        email: 'manager.rev@techstore.com',
        phone: '0902000222',
        passwordHash: 'Pass@123',
        role: USER_ROLES.BRANCH_MANAGER,
        branchId: branch._id,
        isActive: true
      },
      {
        fullName: 'Khách Đánh Giá',
        email: 'cus.rev@test.com',
        phone: '0909888777',
        passwordHash: 'Pass@123',
        role: USER_ROLES.CUSTOMER,
        isActive: true
      },
      {
        fullName: 'Khách Khác',
        email: 'other.rev@test.com',
        phone: '0901111222',
        passwordHash: 'Pass@123',
        role: USER_ROLES.CUSTOMER,
        isActive: true
      }
    ]);

    const [sRes, mRes, cRes, oRes] = await Promise.all([
      request(app).post('/api/v1/auth/login').send({ identifier: 'staff.rev@techstore.com', password: 'Pass@123' }),
      request(app).post('/api/v1/auth/login').send({ identifier: 'manager.rev@techstore.com', password: 'Pass@123' }),
      request(app).post('/api/v1/auth/login').send({ identifier: 'cus.rev@test.com', password: 'Pass@123' }),
      request(app).post('/api/v1/auth/login').send({ identifier: 'other.rev@test.com', password: 'Pass@123' })
    ]);

    staffToken = sRes.body.data.accessToken;
    managerToken = mRes.body.data.accessToken;
    customerToken = cRes.body.data.accessToken;
    otherCustomerToken = oRes.body.data.accessToken;

    [completedOnlineOrder, completedPosOrder, pendingOrder] = await Order.create([
      {
        orderCode: 'ORD-REV-001',
        orderType: ORDER_TYPES.B2C_ONLINE,
        branchId: branch._id,
        staffId: staffUser._id,
        customerId: customerUser._id,
        customerInfo: { fullName: 'Khách Đánh Giá', phone: '0909888777' },
        items: [
          {
            productId: prod._id,
            productSkuId: prod.skus[0]._id,
            productName: prod.name,
            sku: 'IP16P-TEST',
            quantity: 1,
            unitPrice: 28990000,
            subtotal: 28990000
          }
        ],
        totalAmount: 28990000,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.COMPLETED
      },
      {
        orderCode: 'ORD-REV-POS',
        orderType: ORDER_TYPES.POS_STORE,
        branchId: branch._id,
        staffId: staffUser._id,
        customerId: null,
        customerInfo: { fullName: 'Khách Quầy', phone: '+84909888777' },
        items: [
          {
            productId: prod._id,
            productSkuId: prod.skus[0]._id,
            productName: prod.name,
            sku: 'IP16P-TEST',
            quantity: 1,
            unitPrice: 28990000,
            subtotal: 28990000
          }
        ],
        totalAmount: 28990000,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUS.PAID,
        orderStatus: ORDER_STATUS.COMPLETED
      },
      {
        orderCode: 'ORD-REV-PENDING',
        orderType: ORDER_TYPES.B2C_ONLINE,
        branchId: branch._id,
        staffId: staffUser._id,
        customerId: customerUser._id,
        customerInfo: { fullName: 'Khách Đánh Giá', phone: '0909888777' },
        items: [
          {
            productId: prod._id,
            productSkuId: prod.skus[0]._id,
            productName: prod.name,
            sku: 'IP16P-TEST',
            quantity: 1,
            unitPrice: 28990000,
            subtotal: 28990000
          }
        ],
        totalAmount: 28990000,
        paymentMethod: PAYMENT_METHODS.CASH,
        paymentStatus: PAYMENT_STATUS.PENDING,
        orderStatus: ORDER_STATUS.PENDING
      }
    ]);
  });

  it('allows reviewing COMPLETED online & POS orders (phone match), prevents duplicates & unauthorized reviews, and feeds Staff KPI', async () => {
    // 1. Review completed online order (5 stars)
    const rev1 = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: String(completedOnlineOrder._id),
        rating: 5,
        tags: ['Tư vấn nhiệt tình', 'Máy nguyên seal'],
        comment: 'Nhân viên hỗ trợ rất chu đáo!'
      });

    expect(rev1.statusCode).toBe(201);
    expect(rev1.body.data.review.rating).toBe(5);

    // 2. Duplicate review rejected with 409
    const dupRes = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: String(completedOnlineOrder._id),
        rating: 4
      });
    expect(dupRes.statusCode).toBe(409);

    // 3. Review completed POS order matched by phone (+84 -> 0) with 4 stars
    const rev2 = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: String(completedPosOrder._id),
        rating: 4,
        tags: ['Thanh toán nhanh gọn']
      });
    expect(rev2.statusCode).toBe(201);

    // 4. Other customer blocked with 403
    const forbiddenRes = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${otherCustomerToken}`)
      .send({
        orderId: String(completedPosOrder._id),
        rating: 1
      });
    expect(forbiddenRes.statusCode).toBe(403);

    // 5. Pending order rejected with 400
    const pendingRes = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        orderId: String(pendingOrder._id),
        rating: 5
      });
    expect(pendingRes.statusCode).toBe(400);

    // 6. My reviews returns 2 reviews
    const myReviewsRes = await request(app)
      .get('/api/v1/reviews/my-reviews')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(myReviewsRes.statusCode).toBe(200);
    expect(myReviewsRes.body.data.reviews).toHaveLength(2);

    // 7. Customer blocked from branch reviews, Manager allowed
    const cusBranchRes = await request(app)
      .get('/api/v1/reviews/branch')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(cusBranchRes.statusCode).toBe(403);

    const mgrBranchRes = await request(app)
      .get('/api/v1/reviews/branch')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(mgrBranchRes.statusCode).toBe(200);
    expect(mgrBranchRes.body.data.summary.totalReviews).toBe(2);
    expect(mgrBranchRes.body.data.summary.fiveStarCount).toBe(1);
    expect(mgrBranchRes.body.data.summary.avgRating).toBe(4.5);

    // 8. Branch Staff KPI reflects fiveStarReviewsCount=1, totalReviewsCount=2, avgCustomerRating=4.5
    const kpiRes = await request(app)
      .get('/api/v1/analytics/branch-staff-kpi?range=7d')
      .set('Authorization', `Bearer ${managerToken}`);
    expect(kpiRes.statusCode).toBe(200);
    const staffRow = kpiRes.body.data.ranking.find((r) => String(r.staffId) === String(staffUser._id));
    expect(staffRow).toBeDefined();
    expect(staffRow.fiveStarReviewsCount).toBe(1);
    expect(staffRow.totalReviewsCount).toBe(2);
    expect(staffRow.avgCustomerRating).toBe(4.5);

    // 9. Staff My Performance also includes customer review KPIs
    const myPerfRes = await request(app)
      .get('/api/v1/analytics/my-performance?range=7d')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(myPerfRes.statusCode).toBe(200);
    expect(myPerfRes.body.data.kpis.fiveStarReviewsCount).toBe(1);
    expect(myPerfRes.body.data.kpis.totalReviewsCount).toBe(2);
    expect(myPerfRes.body.data.kpis.avgCustomerRating).toBe(4.5);
  });
});
