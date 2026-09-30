import { Router } from 'express';
import { SerialController } from './serial.controller.js';
import { importSerialsSchema } from './serial.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

// Public: e-Warranty lookup by Serial/IMEI
router.get('/verify/:serialNumber', SerialController.verifySerial);

// Protected: POS Barcode Scanner (STAFF, BRANCH_MANAGER, SUPER_ADMIN)
router.get(
  '/scan/:serialNumber',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER, USER_ROLES.STAFF),
  SerialController.scanSerial
);

// Protected: Batch Import Serials into inventory (SUPER_ADMIN, BRANCH_MANAGER)
router.post(
  '/import',
  protect,
  authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.BRANCH_MANAGER),
  validateDto(importSerialsSchema),
  SerialController.importSerials
);

export default router;
