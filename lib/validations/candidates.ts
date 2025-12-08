import { z } from 'zod';
import { candidateStatusEnum } from '@/lib/db/schema';

export const candidateSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    dateOfBirth: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
    nationality: z.string().min(1, 'Nationality is required'),
    education: z.string().optional(),
    skills: z.string().optional(), // Will be parsed from JSON string or handled as array in UI
    experienceSummary: z.string().optional(),
    height: z.string().optional(),
    weight: z.string().optional(),
    status: z.enum(candidateStatusEnum.enumValues).default('AVAILABLE_ABROAD'),
    agentId: z.string().optional(),
    // File fields are handled separately in FormData but we can validate them here if needed
    // or just keep them out of the main data schema
});

export type CandidateInput = z.infer<typeof candidateSchema>;
