import { Router } from 'express';
import { PosShiftController } from './posShift.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

// Toàn bộ API ca thu ngân yêu cầu đăng nhập nhân sự (STAFF, BRANCH_MANAGER, SUPER_ADMIN)
router.use(protect);
router.use(authorize(USER_ROLES.STAFF, USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN));

router.post('/open', PosShiftController.openShift);
router.get('/current', PosShiftController.getCurrentShift);
router.get('/history', PosShiftController.getShiftHistory);
router.get(
  '/monitor',
  authorize(USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN),
  PosShiftController.getLiveCashMonitor
);

router.post('/:id/drop', PosShiftController.recordCashDrop);
router.post('/:id/vouchers', PosShiftController.recordCashVoucher);
router.post('/:id/close', PosShiftController.closeShift);
router.patch(
  '/:id/resolve-discrepancy',
  authorize(USER_ROLES.BRANCH_MANAGER, USER_ROLES.SUPER_ADMIN),
  PosShiftController.resolveDiscrepancy
);

export default router;
