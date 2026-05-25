import { z } from 'zod';

export const checkoutSchema = z.object({
  eventId: z.string().uuid(),
  couponIds: z.array(z.string().uuid()).min(1).max(50),
  sessionId: z.string().min(8).max(80),
  paymentMethod: z.enum(['BANK_TRANSFER', 'BANCARD']).default('BANK_TRANSFER'),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
