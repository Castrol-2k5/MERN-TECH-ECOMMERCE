import request from 'supertest';

import app from '../../src/app.js';
import { setupTestDB } from '../setup.js';
import { User, USER_ROLES } from '../../src/modules/users/user.model.js';
import { Branch } from '../../src/modules/branches/branch.model.js';
import {
  SHIFT_TYPES,
  ATTENDANCE_STATUS,
  SWAP_STATUS
} from '../../src/modules/roster/workSchedule.model.js';

setupTestDB();

describe('Branch Manager Wave 5: Lite Shift Roster & Attendance (UC-BM-09)', () => {
  let branchA;
  let branchB;
  let staffA1;
  let staffA2;
  let staffB1;
  let managerAToken;
  let staffA1Token;
  let staffA2Token;

  beforeEach(async () => {
    branchA = await Branch.create({
      branchCode: 'BR-W5-A',
      name: 'Showroom Q1 Roster',
      address: '123 Lê Lợi',
      phone: '0901111111',
      location: { type: 'Point', coordinates: [106.7, 10.77] },
      isActive: true
    });

    branchB = await Branch.create({
      branchCode: 'BR-W5-B',
      name: 'Showroom Q7 Roster',
      address: '456 Nguyễn Thị Thập',
      phone: '0902222222',
      location: { type: 'Point', coordinates: [106.72, 10.73] },
      isActive: true
    });

    await User.create({
      fullName: 'Manager Q1 W5',
      email: 'mgr.w5@techstore.com',
      phone: '0909700001',
      passwordHash: 'Pass@123',
      role: USER_ROLES.BRANCH_MANAGER,
      branchId: branchA._id,
      isActive: true
    });
    managerAToken = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'mgr.w5@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    staffA1 = await User.create({
      fullName: 'Thu Ngân A1',
      email: 'staff.a1.w5@techstore.com',
      phone: '0909700002',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchA._id,
      isActive: true
    });
    staffA1Token = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'staff.a1.w5@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    staffA2 = await User.create({
      fullName: 'Thu Ngân A2',
      email: 'staff.a2.w5@techstore.com',
      phone: '0909700003',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchA._id,
      isActive: true
    });
    staffA2Token = (
      await request(app).post('/api/v1/auth/login').send({
        identifier: 'staff.a2.w5@techstore.com',
        password: 'Pass@123'
      })
    ).body.data.accessToken;

    staffB1 = await User.create({
      fullName: 'Thu Ngân B1',
      email: 'staff.b1.w5@techstore.com',
      phone: '0909700004',
      passwordHash: 'Pass@123',
      role: USER_ROLES.STAFF,
      branchId: branchB._id,
      isActive: true
    });
  });

  it('Quản lý xếp ca cho nhân viên cùng chi nhánh, Check-in/Check-out & Duyệt đổi ca', async () => {
    const todayStr = new Date().toISOString().slice(0, 10);

    // Chặn xếp nhân viên chi nhánh khác -> 403
    const crossAssign = await request(app)
      .post('/api/v1/roster')
      .set('Authorization', `Bearer ${managerAToken}`)
      .send({
        staffId: staffB1._id.toString(),
        dateStr: todayStr,
        shiftType: SHIFT_TYPES.MORNING
      });
    expect(crossAssign.status).toBe(403);

    // Xếp ca sáng cho A1
    const assignRes = await request(app)
      .post('/api/v1/roster')
      .set('Authorization', `Bearer ${managerAToken}`)
      .send({
        staffId: staffA1._id.toString(),
        dateStr: todayStr,
        shiftType: SHIFT_TYPES.MORNING
      });
    expect(assignRes.status).toBe(201);
    const shift1Id = assignRes.body.data.schedule._id;

    // Chặn trùng ca -> 409
    const dupRes = await request(app)
      .post('/api/v1/roster')
      .set('Authorization', `Bearer ${managerAToken}`)
      .send({
        staffId: staffA1._id.toString(),
        dateStr: todayStr,
        shiftType: SHIFT_TYPES.MORNING
      });
    expect(dupRes.status).toBe(409);

    // A2 không thể check-in hộ A1 -> 403
    const cheatCheckIn = await request(app)
      .post(`/api/v1/roster/${shift1Id}/check-in`)
      .set('Authorization', `Bearer ${staffA2Token}`);
    expect(cheatCheckIn.status).toBe(403);

    // A1 Check-in -> Check-out
    const inRes = await request(app)
      .post(`/api/v1/roster/${shift1Id}/check-in`)
      .set('Authorization', `Bearer ${staffA1Token}`);
    expect(inRes.status).toBe(200);
    expect([ATTENDANCE_STATUS.CHECKED_IN, ATTENDANCE_STATUS.LATE]).toContain(
      inRes.body.data.schedule.attendanceStatus
    );

    const outRes = await request(app)
      .post(`/api/v1/roster/${shift1Id}/check-out`)
      .set('Authorization', `Bearer ${staffA1Token}`);
    expect(outRes.status).toBe(200);
    expect(outRes.body.data.schedule.attendanceStatus).toBe(ATTENDANCE_STATUS.COMPLETED);

    // Xếp thêm ca chiều ngày mai cho A1 -> A1 xin đổi cho A2 -> Manager duyệt đổi sang A2
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const assign2Res = await request(app)
      .post('/api/v1/roster')
      .set('Authorization', `Bearer ${managerAToken}`)
      .send({
        staffId: staffA1._id.toString(),
        dateStr: tomorrowStr,
        shiftType: SHIFT_TYPES.AFTERNOON
      });
    const shift2Id = assign2Res.body.data.schedule._id;

    const swapReq = await request(app)
      .post(`/api/v1/roster/${shift2Id}/swap-request`)
      .set('Authorization', `Bearer ${staffA1Token}`)
      .send({
        requestedNote: 'Xin đổi ca chiều mai cho A2 do bận việc gia đình',
        targetStaffId: staffA2._id.toString()
      });
    expect(swapReq.status).toBe(200);
    expect(swapReq.body.data.schedule.swapRequest.status).toBe(SWAP_STATUS.PENDING);

    const reviewRes = await request(app)
      .patch(`/api/v1/roster/${shift2Id}/swap-review`)
      .set('Authorization', `Bearer ${managerAToken}`)
      .send({
        decision: 'APPROVED',
        reviewNote: 'Đồng ý chuyển ca cho A2'
      });
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.schedule.swapRequest.status).toBe(SWAP_STATUS.APPROVED);
    expect(String(reviewRes.body.data.schedule.staffId._id)).toBe(String(staffA2._id));
  });
});
