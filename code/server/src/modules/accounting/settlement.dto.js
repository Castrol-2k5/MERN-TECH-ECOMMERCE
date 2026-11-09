import { z } from 'zod';

export const settlePaymentSchema = z.object({
  bankTransferRef: z.string().trim().optional().default(''),
  notes: z.string().trim().optional().default('')
});
