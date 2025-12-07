import { z } from 'zod';

export const candidateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  photoUrl: z.string().url().optional().or(z.literal('')),
  facePhotoUrl: z.string().url().optional().or(z.literal('')),
  fullBodyPhotoUrl: z.string().url().optional().or(z.literal('')),
  dateOfBirth: z.date().optional(),
  nationality: z.string().min(1, 'Nationality is required'),
  education: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experienceSummary: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  status: z.enum([
    'AVAILABLE_ABROAD',
    'AVAILABLE_IN_LEBANON',
    'RESERVED',
    'IN_PROCESS',
    'PLACED',
  ]),
  agentId: z.string().uuid().optional().or(z.literal('')),
});

export type CandidateInput = z.infer<typeof candidateSchema>;
