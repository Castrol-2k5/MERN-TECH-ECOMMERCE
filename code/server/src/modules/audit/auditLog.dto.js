import { z } from 'zod';
import { AUDIT_ACTIONS, AUDIT_SEVERITY } from './auditLog.model.js';

export const getAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  action: z.enum(Object.values(AUDIT_ACTIONS)).optional(),
  severity: z.enum(Object.values(AUDIT_SEVERITY)).optional(),
  branchId: z.string().trim().optional(),
  userId: z.string().trim().optional(),
  targetModel: z.string().trim().optional(),
  search: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional()
});
