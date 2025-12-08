import { z } from 'zod';

export const clientDocumentSchema = z.object({
  clientId: z.string().uuid('Please select a client'),
  documentName: z.string().min(1, 'Document name is required'),
  fileName: z.string().min(1, 'File name is required'),
  url: z.string().url('Invalid URL'),
  mimeType: z.string().min(1, 'MIME type is required'),
  size: z.number().positive('File size must be positive'),
});

export const documentChecklistItemSchema = z.object({
  applicationId: z.string().uuid('Please select an application'),
  documentName: z.string().min(1, 'Document name is required'),
  status: z.enum(['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED']),
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
  requiredFrom: z.string().default('office'),
  order: z.number().int().default(0),
});

export const documentTemplateSchema = z.object({
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
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  required: z.boolean().default(true),
  requiredFrom: z.string().default('office'),
  order: z.number().int().default(0),
});

export type ClientDocumentInput = z.infer<typeof clientDocumentSchema>;
export type DocumentChecklistItemInput = z.infer<typeof documentChecklistItemSchema>;
export type DocumentTemplateInput = z.infer<typeof documentTemplateSchema>;
