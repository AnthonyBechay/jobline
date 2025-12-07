import { z } from 'zod';

export const paymentSchema = z.object({
  applicationId: z.string().uuid('Please select an application'),
  clientId: z.string().uuid('Please select a client'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('USD'),
  paymentDate: z.date(),
  paymentType: z.string().default('FEE'),
  notes: z.string().optional(),
  isRefundable: z.boolean().default(true),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
