import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  timestamp,
  text,
  json,
  boolean,
  integer,
  decimal,
  bigint,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('UserRole', ['SUPER_ADMIN', 'ADMIN']);

export const candidateStatusEnum = pgEnum('CandidateStatus', [
  'AVAILABLE_ABROAD',
  'AVAILABLE_IN_LEBANON',
  'RESERVED',
  'IN_PROCESS',
  'PLACED',
]);

export const applicationStatusEnum = pgEnum('ApplicationStatus', [
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
]);

export const applicationTypeEnum = pgEnum('ApplicationType', [
  'NEW_CANDIDATE',
  'GUARANTOR_CHANGE',
]);

export const documentStatusEnum = pgEnum('DocumentStatus', [
  'PENDING',
  'RECEIVED',
  'SUBMITTED',
]);

// Tables
export const companies = pgTable('companies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  taxId: varchar('tax_id', { length: 100 }),
  molRegistrationNumber: varchar('mol_registration_number', { length: 100 }),
  bankName: varchar('bank_name', { length: 255 }),
  bankAccountNumber: varchar('bank_account_number', { length: 100 }),
  bankIBAN: varchar('bank_iban', { length: 100 }),
  bankSwiftCode: varchar('bank_swift_code', { length: 50 }),
  licenseNumber: varchar('license_number', { length: 100 }),
  establishedDate: timestamp('established_date'),
  numberOfEmployees: integer('number_of_employees'),
  contactPersonName: varchar('contact_person_name', { length: 255 }),
  contactPersonPhone: varchar('contact_person_phone', { length: 50 }),
  contactPersonEmail: varchar('contact_person_email', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    displayEmail: varchar('display_email', { length: 255 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: userRoleEnum('role').notNull(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    companyIdIdx: index('users_company_id_idx').on(table.companyId),
    emailCompanyUnique: unique('users_email_company_unique').on(table.email, table.companyId),
  })
);

export const agents = pgTable(
  'agents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    contactDetails: json('contact_details').notNull(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    companyIdIdx: index('agents_company_id_idx').on(table.companyId),
  })
);

export const brokers = pgTable(
  'brokers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    contactDetails: json('contact_details').notNull(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    companyIdIdx: index('brokers_company_id_idx').on(table.companyId),
  })
);

export const candidates = pgTable(
  'candidates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    firstName: varchar('first_name', { length: 255 }).notNull(),
    lastName: varchar('last_name', { length: 255 }).notNull(),
    photoUrl: varchar('photo_url', { length: 500 }),
    facePhotoUrl: varchar('face_photo_url', { length: 500 }),
    fullBodyPhotoUrl: varchar('full_body_photo_url', { length: 500 }),
    dateOfBirth: timestamp('date_of_birth'),
    nationality: varchar('nationality', { length: 100 }).notNull(),
    education: varchar('education', { length: 255 }),
    skills: json('skills'),
    experienceSummary: text('experience_summary'),
    height: varchar('height', { length: 50 }),
    weight: varchar('weight', { length: 50 }),
    status: candidateStatusEnum('status').notNull(),
    agentId: uuid('agent_id').references(() => agents.id),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index('candidates_status_idx').on(table.status),
    nationalityIdx: index('candidates_nationality_idx').on(table.nationality),
    companyIdIdx: index('candidates_company_id_idx').on(table.companyId),
  })
);

export const clients = pgTable(
  'clients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }).notNull(),
    address: text('address'),
    notes: text('notes'),
    referredByClient: uuid('referred_by_client_id').references((): any => clients.id),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    companyIdIdx: index('clients_company_id_idx').on(table.companyId),
  })
);

export const feeTemplates = pgTable(
  'fee_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    defaultPrice: decimal('default_price', { precision: 10, scale: 2 }).notNull(),
    minPrice: decimal('min_price', { precision: 10, scale: 2 }).notNull(),
    maxPrice: decimal('max_price', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    nationality: varchar('nationality', { length: 100 }),
    serviceType: varchar('service_type', { length: 255 }),
    description: text('description'),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    companyNameUnique: unique('fee_templates_company_name_unique').on(
      table.companyId,
      table.name
    ),
    companyIdIdx: index('fee_templates_company_id_idx').on(table.companyId),
    nationalityIdx: index('fee_templates_nationality_idx').on(table.nationality),
  })
);

export const applications = pgTable(
  'applications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id),
    fromClientId: uuid('from_client_id').references(() => clients.id),
    candidateId: uuid('candidate_id')
      .notNull()
      .references(() => candidates.id),
    status: applicationStatusEnum('status').notNull(),
    type: applicationTypeEnum('type').notNull(),
    brokerId: uuid('broker_id').references(() => brokers.id),
    permitExpiryDate: timestamp('permit_expiry_date'),
    exactArrivalDate: timestamp('exact_arrival_date'),
    laborPermitDate: timestamp('labor_permit_date'),
    residencyPermitDate: timestamp('residency_permit_date'),
    shareableLink: varchar('shareable_link', { length: 255 }).notNull().unique(),
    feeTemplateId: uuid('fee_template_id').references(() => feeTemplates.id),
    finalFeeAmount: decimal('final_fee_amount', { precision: 10, scale: 2 }),
    lawyerServiceRequested: boolean('lawyer_service_requested').notNull().default(false),
    lawyerFeeCost: decimal('lawyer_fee_cost', { precision: 10, scale: 2 }),
    lawyerFeeCharge: decimal('lawyer_fee_charge', { precision: 10, scale: 2 }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index('applications_status_idx').on(table.status),
    clientIdIdx: index('applications_client_id_idx').on(table.clientId),
    fromClientIdIdx: index('applications_from_client_id_idx').on(table.fromClientId),
    candidateIdIdx: index('applications_candidate_id_idx').on(table.candidateId),
    companyIdIdx: index('applications_company_id_idx').on(table.companyId),
  })
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    paymentDate: timestamp('payment_date').defaultNow().notNull(),
    paymentType: varchar('payment_type', { length: 50 }).notNull().default('FEE'),
    notes: text('notes'),
    isRefundable: boolean('is_refundable').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    applicationIdIdx: index('payments_application_id_idx').on(table.applicationId),
    clientIdIdx: index('payments_client_id_idx').on(table.clientId),
  })
);

export const costs = pgTable(
  'costs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id')
      .references(() => applications.id),
    candidateId: uuid('candidate_id')
      .references(() => candidates.id),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    costDate: timestamp('cost_date').defaultNow().notNull(),
    costType: varchar('cost_type', { length: 100 }).notNull().default('OTHER'),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    applicationIdIdx: index('costs_application_id_idx').on(table.applicationId),
    candidateIdIdx: index('costs_candidate_id_idx').on(table.candidateId),
  })
);

export const documentChecklistItems = pgTable(
  'document_checklist_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id),
    documentName: varchar('document_name', { length: 255 }).notNull(),
    status: documentStatusEnum('status').notNull(),
    stage: applicationStatusEnum('stage').notNull(),
    required: boolean('required').notNull().default(true),
    requiredFrom: varchar('required_from', { length: 50 }).notNull().default('office'),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    applicationIdIdx: index('document_checklist_items_application_id_idx').on(
      table.applicationId
    ),
  })
);

export const settings = pgTable(
  'settings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    key: varchar('key', { length: 255 }).notNull(),
    value: json('value').notNull(),
    description: text('description'),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    companyKeyUnique: unique('settings_company_key_unique').on(table.companyId, table.key),
    companyIdIdx: index('settings_company_id_idx').on(table.companyId),
  })
);

export const documentTemplates = pgTable(
  'document_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    stage: applicationStatusEnum('stage').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    required: boolean('required').notNull().default(true),
    requiredFrom: varchar('required_from', { length: 50 }).notNull().default('office'),
    order: integer('order').notNull().default(0),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    companyStageNameUnique: unique('document_templates_company_stage_name_unique').on(
      table.companyId,
      table.stage,
      table.name
    ),
    companyIdIdx: index('document_templates_company_id_idx').on(table.companyId),
  })
);

export const feeComponents = pgTable(
  'fee_components',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    feeTemplateId: uuid('fee_template_id')
      .notNull()
      .references(() => feeTemplates.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    isRefundable: boolean('is_refundable').notNull().default(true),
    refundableAfterArrival: boolean('refundable_after_arrival').notNull().default(false),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    feeTemplateIdIdx: index('fee_components_fee_template_id_idx').on(table.feeTemplateId),
  })
);

export const files = pgTable(
  'files',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    originalName: varchar('original_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    size: bigint('size', { mode: 'number' }).notNull(),
    url: varchar('url', { length: 500 }).notNull(),
    cloudinaryId: varchar('cloudinary_id', { length: 255 }),
    uploadedBy: uuid('uploaded_by')
      .notNull()
      .references(() => users.id),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    entityTypeIdIdx: index('files_entity_type_id_idx').on(table.entityType, table.entityId),
    companyIdIdx: index('files_company_id_idx').on(table.companyId),
  })
);

export const clientDocuments = pgTable(
  'client_documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id),
    documentName: varchar('document_name', { length: 255 }).notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    url: varchar('url', { length: 500 }).notNull(),
    mimeType: varchar('mime_type', { length: 100 }).notNull(),
    size: bigint('size', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    clientIdIdx: index('client_documents_client_id_idx').on(table.clientId),
  })
);

export const nationalities = pgTable(
  'nationalities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: varchar('code', { length: 10 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    active: boolean('active').notNull().default(true),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    companyCodeUnique: unique('nationalities_company_code_unique').on(
      table.companyId,
      table.code
    ),
    companyIdIdx: index('nationalities_company_id_idx').on(table.companyId),
  })
);

export const serviceTypes = pgTable(
  'service_types',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    companyNameUnique: unique('service_types_company_name_unique').on(
      table.companyId,
      table.name
    ),
    companyIdIdx: index('service_types_company_id_idx').on(table.companyId),
  })
);

export const costTypes = pgTable(
  'cost_types',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    companyNameUnique: unique('cost_types_company_name_unique').on(table.companyId, table.name),
    companyIdIdx: index('cost_types_company_id_idx').on(table.companyId),
  })
);

export const guarantorChanges = pgTable(
  'guarantor_changes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    originalApplicationId: uuid('original_application_id')
      .notNull()
      .references(() => applications.id),
    newApplicationId: uuid('new_application_id').references(() => applications.id),
    fromClientId: uuid('from_client_id')
      .notNull()
      .references(() => clients.id),
    toClientId: uuid('to_client_id')
      .notNull()
      .references(() => clients.id),
    candidateId: uuid('candidate_id')
      .notNull()
      .references(() => candidates.id),
    changeDate: timestamp('change_date').defaultNow().notNull(),
    reason: text('reason'),
    refundAmount: decimal('refund_amount', { precision: 10, scale: 2 }),
    refundCurrency: varchar('refund_currency', { length: 10 }).notNull().default('USD'),
    refundProcessed: boolean('refund_processed').notNull().default(false),
    refundProcessedDate: timestamp('refund_processed_date'),
    candidateStatusBefore: varchar('candidate_status_before', { length: 100 }).notNull(),
    candidateStatusAfter: varchar('candidate_status_after', { length: 100 }).notNull(),
    notes: text('notes'),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    originalApplicationIdIdx: index('guarantor_changes_original_application_id_idx').on(
      table.originalApplicationId
    ),
    newApplicationIdIdx: index('guarantor_changes_new_application_id_idx').on(
      table.newApplicationId
    ),
    fromClientIdIdx: index('guarantor_changes_from_client_id_idx').on(table.fromClientId),
    toClientIdIdx: index('guarantor_changes_to_client_id_idx').on(table.toClientId),
    candidateIdIdx: index('guarantor_changes_candidate_id_idx').on(table.candidateId),
    companyIdIdx: index('guarantor_changes_company_id_idx').on(table.companyId),
  })
);

export const applicationLifecycleHistory = pgTable(
  'application_lifecycle_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id),
    action: varchar('action', { length: 100 }).notNull(),
    fromStatus: varchar('from_status', { length: 100 }),
    toStatus: varchar('to_status', { length: 100 }),
    fromClientId: uuid('from_client_id'),
    toClientId: uuid('to_client_id'),
    candidateStatusBefore: varchar('candidate_status_before', { length: 100 }),
    candidateStatusAfter: varchar('candidate_status_after', { length: 100 }),
    financialImpact: json('financial_impact'),
    notes: text('notes'),
    performedBy: uuid('performed_by')
      .notNull()
      .references(() => users.id),
    performedAt: timestamp('performed_at').defaultNow().notNull(),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
  },
  (table) => ({
    applicationIdIdx: index('application_lifecycle_history_application_id_idx').on(
      table.applicationId
    ),
    companyIdIdx: index('application_lifecycle_history_company_id_idx').on(table.companyId),
    performedByIdx: index('application_lifecycle_history_performed_by_idx').on(
      table.performedBy
    ),
  })
);

export const officeOverheadCosts = pgTable(
  'office_overhead_costs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    costDate: timestamp('cost_date').defaultNow().notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    recurring: boolean('recurring').notNull().default(false),
    recurringFrequency: varchar('recurring_frequency', { length: 50 }),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    companyIdIdx: index('office_overhead_costs_company_id_idx').on(table.companyId),
    categoryIdx: index('office_overhead_costs_category_idx').on(table.category),
    costDateIdx: index('office_overhead_costs_cost_date_idx').on(table.costDate),
  })
);

export const cancellationSettings = pgTable(
  'cancellation_settings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cancellationType: varchar('cancellation_type', { length: 100 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    penaltyFee: decimal('penalty_fee', { precision: 10, scale: 2 }).notNull().default('0'),
    refundPercentage: decimal('refund_percentage', { precision: 5, scale: 2 })
      .notNull()
      .default('100'),
    nonRefundableComponents: json('non_refundable_components'),
    monthlyServiceFee: decimal('monthly_service_fee', { precision: 10, scale: 2 })
      .notNull()
      .default('0'),
    maxRefundAmount: decimal('max_refund_amount', { precision: 10, scale: 2 }),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    companyCancellationTypeUnique: unique(
      'cancellation_settings_company_cancellation_type_unique'
    ).on(table.companyId, table.cancellationType),
    companyIdIdx: index('cancellation_settings_company_id_idx').on(table.companyId),
    cancellationTypeIdx: index('cancellation_settings_cancellation_type_idx').on(
      table.cancellationType
    ),
  })
);

export const lawyerServiceSettings = pgTable(
  'lawyer_service_settings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    lawyerFeeCost: decimal('lawyer_fee_cost', { precision: 10, scale: 2 }).notNull(),
    lawyerFeeCharge: decimal('lawyer_fee_charge', { precision: 10, scale: 2 }).notNull(),
    description: text('description'),
    active: boolean('active').notNull().default(true),
    companyId: uuid('company_id')
      .notNull()
      .references(() => companies.id)
      .unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    companyIdIdx: index('lawyer_service_settings_company_id_idx').on(table.companyId),
  })
);

// Relations (for Drizzle ORM query builder)
export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  agents: many(agents),
  brokers: many(brokers),
  candidates: many(candidates),
  clients: many(clients),
  applications: many(applications),
  settings: many(settings),
  documentTemplates: many(documentTemplates),
  feeTemplates: many(feeTemplates),
  files: many(files),
  nationalities: many(nationalities),
  serviceTypes: many(serviceTypes),
  costTypes: many(costTypes),
  guarantorChanges: many(guarantorChanges),
  lifecycleHistory: many(applicationLifecycleHistory),
  overheadCosts: many(officeOverheadCosts),
  cancellationSettings: many(cancellationSettings),
  lawyerServiceSettings: many(lawyerServiceSettings),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  uploadedFiles: many(files),
  lifecycleHistory: many(applicationLifecycleHistory),
  overheadCosts: many(officeOverheadCosts),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  company: one(companies, {
    fields: [agents.companyId],
    references: [companies.id],
  }),
  candidates: many(candidates),
}));

export const brokersRelations = relations(brokers, ({ one, many }) => ({
  company: one(companies, {
    fields: [brokers.companyId],
    references: [companies.id],
  }),
  applications: many(applications),
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  agent: one(agents, {
    fields: [candidates.agentId],
    references: [agents.id],
  }),
  company: one(companies, {
    fields: [candidates.companyId],
    references: [companies.id],
  }),
  applications: many(applications),
  guarantorChanges: many(guarantorChanges),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  referrer: one(clients, {
    fields: [clients.referredByClient],
    references: [clients.id],
    relationName: 'clientReferrals',
  }),
  referrals: many(clients, { relationName: 'clientReferrals' }),
  company: one(companies, {
    fields: [clients.companyId],
    references: [companies.id],
  }),
  applications: many(applications),
  guarantorChangeApplications: many(applications),
  payments: many(payments),
  documents: many(clientDocuments),
  fromGuarantorChanges: many(guarantorChanges),
  toGuarantorChanges: many(guarantorChanges),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  client: one(clients, {
    fields: [applications.clientId],
    references: [clients.id],
  }),
  fromClient: one(clients, {
    fields: [applications.fromClientId],
    references: [clients.id],
  }),
  candidate: one(candidates, {
    fields: [applications.candidateId],
    references: [candidates.id],
  }),
  broker: one(brokers, {
    fields: [applications.brokerId],
    references: [brokers.id],
  }),
  feeTemplate: one(feeTemplates, {
    fields: [applications.feeTemplateId],
    references: [feeTemplates.id],
  }),
  company: one(companies, {
    fields: [applications.companyId],
    references: [companies.id],
  }),
  payments: many(payments),
  costs: many(costs),
  documentItems: many(documentChecklistItems),
  originalGuarantorChanges: many(guarantorChanges),
  newGuarantorChanges: many(guarantorChanges),
  lifecycleHistory: many(applicationLifecycleHistory),
}));

export const costsRelations = relations(costs, ({ one }) => ({
  application: one(applications, {
    fields: [costs.applicationId],
    references: [applications.id],
  }),
  candidate: one(candidates, {
    fields: [costs.candidateId],
    references: [candidates.id],
  }),
}));

export const feeTemplatesRelations = relations(feeTemplates, ({ one, many }) => ({
  company: one(companies, {
    fields: [feeTemplates.companyId],
    references: [companies.id],
  }),
  applications: many(applications),
  feeComponents: many(feeComponents),
}));

export const feeComponentsRelations = relations(feeComponents, ({ one }) => ({
  feeTemplate: one(feeTemplates, {
    fields: [feeComponents.feeTemplateId],
    references: [feeTemplates.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  application: one(applications, {
    fields: [payments.applicationId],
    references: [applications.id],
  }),
  client: one(clients, {
    fields: [payments.clientId],
    references: [clients.id],
  }),
}));

export const documentChecklistItemsRelations = relations(documentChecklistItems, ({ one }) => ({
  application: one(applications, {
    fields: [documentChecklistItems.applicationId],
    references: [applications.id],
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  company: one(companies, {
    fields: [files.companyId],
    references: [companies.id],
  }),
}));

export const clientDocumentsRelations = relations(clientDocuments, ({ one }) => ({
  client: one(clients, {
    fields: [clientDocuments.clientId],
    references: [clients.id],
  }),
}));

// Type exports for TypeScript
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

export type Broker = typeof brokers.$inferSelect;
export type NewBroker = typeof brokers.$inferInsert;

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type Cost = typeof costs.$inferSelect;
export type NewCost = typeof costs.$inferInsert;

export type FeeTemplate = typeof feeTemplates.$inferSelect;
export type NewFeeTemplate = typeof feeTemplates.$inferInsert;

export type FeeComponent = typeof feeComponents.$inferSelect;
export type NewFeeComponent = typeof feeComponents.$inferInsert;

export type DocumentChecklistItem = typeof documentChecklistItems.$inferSelect;
export type NewDocumentChecklistItem = typeof documentChecklistItems.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

export type DocumentTemplate = typeof documentTemplates.$inferSelect;
export type NewDocumentTemplate = typeof documentTemplates.$inferInsert;

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;

export type ClientDocument = typeof clientDocuments.$inferSelect;
export type NewClientDocument = typeof clientDocuments.$inferInsert;

export type Nationality = typeof nationalities.$inferSelect;
export type NewNationality = typeof nationalities.$inferInsert;

export type ServiceType = typeof serviceTypes.$inferSelect;
export type NewServiceType = typeof serviceTypes.$inferInsert;

export type CostType = typeof costTypes.$inferSelect;
export type NewCostType = typeof costTypes.$inferInsert;

export type GuarantorChange = typeof guarantorChanges.$inferSelect;
export type NewGuarantorChange = typeof guarantorChanges.$inferInsert;

export type ApplicationLifecycleHistory = typeof applicationLifecycleHistory.$inferSelect;
export type NewApplicationLifecycleHistory = typeof applicationLifecycleHistory.$inferInsert;

export type OfficeOverheadCost = typeof officeOverheadCosts.$inferSelect;
export type NewOfficeOverheadCost = typeof officeOverheadCosts.$inferInsert;

export type CancellationSetting = typeof cancellationSettings.$inferSelect;
export type NewCancellationSetting = typeof cancellationSettings.$inferInsert;

export type LawyerServiceSetting = typeof lawyerServiceSettings.$inferSelect;
export type NewLawyerServiceSetting = typeof lawyerServiceSettings.$inferInsert;
