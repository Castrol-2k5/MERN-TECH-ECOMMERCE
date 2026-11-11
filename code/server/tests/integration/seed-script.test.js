import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { seedDatabase } from '../../src/scripts/seed.js';

setupTestDB();

describe('Seed Script Smoke Test: Full 3-Tier Expansion Data', () => {
  test('seedDatabase() chạy không lỗi và đổ đủ dữ liệu test cho POS, Branch Manager & HQ Hub', async () => {
    await seedDatabase({ connect: false, disconnect: false });

    const [adminLogin, mgrLogin, staffLogin] = await Promise.all([
      request(app).post('/api/v1/auth/login').send({
        identifier: 'admin@techstore.com',
        password: '123456'
      }),
      request(app).post('/api/v1/auth/login').send({
        identifier: 'manager.q1@techstore.com',
        password: '123456'
      }),
      request(app).post('/api/v1/auth/login').send({
        identifier: 'staff.q1@techstore.com',
        password: '123456'
      })
    ]);

    expect(adminLogin.status).toBe(200);
    expect(mgrLogin.status).toBe(200);
    expect(staffLogin.status).toBe(200);

    const adminToken = adminLogin.body.data.accessToken;
    const mgrToken = mgrLogin.body.data.accessToken;
    const staffToken = staffLogin.body.data.accessToken;

    const [
      cmdRes,
      vendorsRes,
      replenishRes,
      deadStockRes,
      pnlRes,
      forecastRes,
      overviewRes,
      approvalsRes,
      stocktakeRes,
      complaintsRes,
      rosterRes,
      myShiftRes
    ] = await Promise.all([
      request(app).get('/api/v1/hq/command-center').set('Authorization', `Bearer ${adminToken}`),
      request(app).get('/api/v1/procurement/vendors').set('Authorization', `Bearer ${adminToken}`),
      request(app).get('/api/v1/hq/supply-chain/replenishment-suggestions').set('Authorization', `Bearer ${adminToken}`),
      request(app).get('/api/v1/hq/supply-chain/dead-stock-suggestions').set('Authorization', `Bearer ${adminToken}`),
      request(app).get('/api/v1/hq/finance/pnl').set('Authorization', `Bearer ${adminToken}`),
      request(app).get('/api/v1/hq/bi/demand-forecast').set('Authorization', `Bearer ${adminToken}`),
      request(app).get('/api/v1/analytics/overview').set('Authorization', `Bearer ${adminToken}`),
      request(app).get('/api/v1/approvals?status=PENDING').set('Authorization', `Bearer ${mgrToken}`),
      request(app).get('/api/v1/inventory/stocktakes').set('Authorization', `Bearer ${mgrToken}`),
      request(app).get('/api/v1/complaints').set('Authorization', `Bearer ${mgrToken}`),
      request(app).get('/api/v1/roster').set('Authorization', `Bearer ${staffToken}`),
      request(app).get('/api/v1/shifts/current').set('Authorization', `Bearer ${staffToken}`)
    ]);

    expect(cmdRes.status).toBe(200);
    expect(cmdRes.body.data.alerts.length).toBeGreaterThanOrEqual(4);

    expect(vendorsRes.status).toBe(200);
    expect(vendorsRes.body.data.vendors.length).toBe(2);
    expect(vendorsRes.body.data.totalOutstandingDebt).toBe(100000000);

    expect(replenishRes.status).toBe(200);
    expect(replenishRes.body.data.suggestions.length).toBeGreaterThanOrEqual(1);

    expect(deadStockRes.status).toBe(200);
    expect(deadStockRes.body.data.suggestions.length).toBeGreaterThanOrEqual(1);

    expect(pnlRes.status).toBe(200);
    expect(pnlRes.body.data.totals.netRevenue).toBeGreaterThan(0);
    expect(pnlRes.body.data.totals.cogs).toBeGreaterThan(0);
    expect(pnlRes.body.data.totals.totalOpex).toBeGreaterThan(0);

    expect(forecastRes.status).toBe(200);
    expect(forecastRes.body.data.items.length).toBeGreaterThanOrEqual(1);

    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.data.branchPerformance.length).toBeGreaterThanOrEqual(2);

    expect(approvalsRes.status).toBe(200);
    expect(approvalsRes.body.data.requests.length).toBeGreaterThanOrEqual(1);

    expect(stocktakeRes.status).toBe(200);
    expect(stocktakeRes.body.data.stocktakes.length).toBeGreaterThanOrEqual(1);

    expect(complaintsRes.status).toBe(200);
    expect(complaintsRes.body.data.complaints.length).toBeGreaterThanOrEqual(2);

    expect(rosterRes.status).toBe(200);
    expect(rosterRes.body.data.schedules.length).toBeGreaterThanOrEqual(3);

    expect(myShiftRes.status).toBe(200);
    expect(myShiftRes.body.data.shift.shiftCode).toBe('SHF-TODAY-Q1-OPEN');
  }, 30000);
});
