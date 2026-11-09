import { Router } from 'express';
import { AuditLogController } from './auditLog.controller.js';
import { getAuditLogsQuerySchema } from './auditLog.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authorize } from '../../middlewares/rbac.middleware.js';
import { USER_ROLES } from '../users/user.model.js';

const router = Router();

// Toàn bộ API kiểm toán chỉ mở cho SUPER_ADMIN
router.use(protect);
router.use(authorize(USER_ROLES.SUPER_ADMIN));

router.get('/stats', AuditLogController.getStats);
router.get('/entity/:model/:entityId', AuditLogController.getEntityTimeline);
router.get('/:id', AuditLogController.getLogById);
router.get('/', validateDto(getAuditLogsQuerySchema, 'query'), AuditLogController.getLogs);

export default router;
