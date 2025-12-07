import { z } from 'zod';

export const applicationSchema = z.object({
  clientId: z.string().uuid('Please select a client'),
  fromClientId: z.string().uuid().optional().or(z.literal('')),
  candidateId: z.string().uuid('Please select a candidate'),
  status: z.enum([
    'PENDING_MOL',
    'MOL_AUTH_RECEIVED',
    'VISA_PROCESSING',
    'VISA_RECEIVED',
    'WORKER_ARRIVED',
    'LABOUR_PERMIT_PROCESSING',
    'RESIDENCY_PERMIT_PROCESSING',
    'ACTIVE_EMPLOYMENT',
    'CONTRACT_ENDED',
    'RENEWAL_PENDING',
    'CANCELLED_PRE_ARRIVAL',
    'CANCELLED_POST_ARRIVAL',
    'CANCELLED_CANDIDATE',
  ]),
  type: z.enum(['NEW_CANDIDATE', 'GUARANTOR_CHANGE']),
  brokerId: z.string().uuid().optional().or(z.literal('')),
  permitExpiryDate: z.date().optional(),
  exactArrivalDate: z.date().optional(),
  laborPermitDate: z.date().optional(),
  residencyPermitDate: z.date().optional(),
  feeTemplateId: z.string().uuid().optional().or(z.literal('')),
  finalFeeAmount: z.number().optional(),
  lawyerServiceRequested: z.boolean().default(false),
  lawyerFeeCost: z.number().optional(),
  lawyerFeeCharge: z.number().optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
