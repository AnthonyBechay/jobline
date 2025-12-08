import { z } from 'zod';

export const paymentSchema = z.object({
  applicationId: z.string().uuid('Please select an application'),
  clientId: z.string().uuid('Please select a client'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  paymentDate: z.date(),
  paymentType: z.string().default('FEE'),
  notes: z.string().optional(),
  isRefundable: z.boolean().default(true),
});

export const costSchema = z.object({
  applicationId: z.string().uuid('Please select an application'),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string().default('USD'),
  costDate: z.date(),
  costType: z.string().default('OTHER'),
  description: z.string().optional(),
});

export const feeTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  defaultPrice: z.string().min(1, 'Default price is required'),
  minPrice: z.string().min(1, 'Min price is required'),
  maxPrice: z.string().min(1, 'Max price is required'),
  currency: z.string().default('USD'),
  nationality: z.string().optional(),
  serviceType: z.string().optional(),
  description: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
export type CostInput = z.infer<typeof costSchema>;
export type FeeTemplateInput = z.infer<typeof feeTemplateSchema>;
