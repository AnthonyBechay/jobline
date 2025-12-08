import { z } from 'zod';

export const feeTemplateSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    defaultPrice: z.coerce.number().min(0, 'Price must be positive'),
    minPrice: z.coerce.number().min(0, 'Min price must be positive'),
    maxPrice: z.coerce.number().min(0, 'Max price must be positive'),
    currency: z.string().default('USD'),
    nationality: z.string().optional(),
    serviceType: z.string().optional(),
    description: z.string().optional(),
}).refine((data) => data.maxPrice >= data.minPrice, {
    message: "Max price must be greater than or equal to min price",
    path: ["maxPrice"],
});

export type FeeTemplateInput = z.infer<typeof feeTemplateSchema>;

export const documentTemplateSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    stage: z.enum([
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
    required: z.boolean().default(true),
    requiredFrom: z.enum(['office', 'client']).default('office'),
});

export type DocumentTemplateInput = z.infer<typeof documentTemplateSchema>;

export const nationalitySchema = z.object({
    code: z.string().min(2, 'Code must be at least 2 characters').max(10, 'Code too long'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    active: z.boolean().default(true),
});

export type NationalityInput = z.infer<typeof nationalitySchema>;

export const lawyerFeeSchema = z.object({
    lawyerFeeCost: z.coerce.number().min(0, 'Cost must be positive'),
    lawyerFeeCharge: z.coerce.number().min(0, 'Charge must be positive'),
    description: z.string().optional(),
    active: z.boolean().default(true),
});

export type LawyerFeeInput = z.infer<typeof lawyerFeeSchema>;
