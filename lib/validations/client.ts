import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(6, 'Phone number is required'),
  address: z.string().optional(),
  notes: z.string().optional(),
  referredByClient: z.string().uuid().optional().or(z.literal('')),
  // Document fields
  identityDocumentUrl: z.string().optional(),
  identityDocumentTag: z.string().optional(),
  document1Url: z.string().optional(),
  document1Tag: z.string().optional(),
  document2Url: z.string().optional(),
  document2Tag: z.string().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
