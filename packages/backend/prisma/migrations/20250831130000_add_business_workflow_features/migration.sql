-- Add new application statuses for cancellation flows
ALTER TYPE "ApplicationStatus" ADD VALUE 'CANCELLED_PRE_ARRIVAL';
ALTER TYPE "ApplicationStatus" ADD VALUE 'CANCELLED_POST_ARRIVAL';
ALTER TYPE "ApplicationStatus" ADD VALUE 'CANCELLED_CANDIDATE';

-- Add exact arrival date to applications
ALTER TABLE "applications" ADD COLUMN "exact_arrival_date" TIMESTAMP(3);

-- Add lawyer service fields to applications
ALTER TABLE "applications" ADD COLUMN "lawyer_service_requested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "applications" ADD COLUMN "lawyer_fee_cost" DECIMAL(10,2);
ALTER TABLE "applications" ADD COLUMN "lawyer_fee_charge" DECIMAL(10,2);

-- Create application lifecycle history table
CREATE TABLE "application_lifecycle_history" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT,
    "from_client_id" TEXT,
    "to_client_id" TEXT,
    "candidate_status_before" TEXT,
    "candidate_status_after" TEXT,
    "financial_impact" JSONB,
    "notes" TEXT,
    "performed_by" TEXT NOT NULL,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "company_id" TEXT NOT NULL,

    CONSTRAINT "application_lifecycle_history_pkey" PRIMARY KEY ("id")
);

-- Create office overhead costs table
CREATE TABLE "office_overhead_costs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "cost_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_frequency" TEXT, -- 'monthly', 'quarterly', 'yearly'
    "company_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_overhead_costs_pkey" PRIMARY KEY ("id")
);

-- Create cancellation settings table
CREATE TABLE "cancellation_settings" (
    "id" TEXT NOT NULL,
    "cancellation_type" TEXT NOT NULL, -- 'pre_arrival', 'post_arrival', 'candidate_cancellation'
    "penalty_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "refund_percentage" DECIMAL(5,2) NOT NULL DEFAULT 100, -- 0-100
    "non_refundable_fees" JSONB, -- Array of fee types that are non-refundable
    "monthly_service_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_refund_amount" DECIMAL(10,2),
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cancellation_settings_pkey" PRIMARY KEY ("id")
);

-- Create lawyer service settings table
CREATE TABLE "lawyer_service_settings" (
    "id" TEXT NOT NULL,
    "lawyer_fee_cost" DECIMAL(10,2) NOT NULL, -- Actual cost to office
    "lawyer_fee_charge" DECIMAL(10,2) NOT NULL, -- What office charges client
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lawyer_service_settings_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "application_lifecycle_history_application_id_idx" ON "application_lifecycle_history"("application_id");
CREATE INDEX "application_lifecycle_history_company_id_idx" ON "application_lifecycle_history"("company_id");
CREATE INDEX "application_lifecycle_history_performed_by_idx" ON "application_lifecycle_history"("performed_by");

CREATE INDEX "office_overhead_costs_company_id_idx" ON "office_overhead_costs"("company_id");
CREATE INDEX "office_overhead_costs_category_idx" ON "office_overhead_costs"("category");
CREATE INDEX "office_overhead_costs_cost_date_idx" ON "office_overhead_costs"("cost_date");

CREATE INDEX "cancellation_settings_company_id_idx" ON "cancellation_settings"("company_id");
CREATE INDEX "cancellation_settings_cancellation_type_idx" ON "cancellation_settings"("cancellation_type");

CREATE INDEX "lawyer_service_settings_company_id_idx" ON "lawyer_service_settings"("company_id");

-- Add foreign key constraints
ALTER TABLE "application_lifecycle_history" ADD CONSTRAINT "application_lifecycle_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "application_lifecycle_history" ADD CONSTRAINT "application_lifecycle_history_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "application_lifecycle_history" ADD CONSTRAINT "application_lifecycle_history_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "office_overhead_costs" ADD CONSTRAINT "office_overhead_costs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "office_overhead_costs" ADD CONSTRAINT "office_overhead_costs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cancellation_settings" ADD CONSTRAINT "cancellation_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lawyer_service_settings" ADD CONSTRAINT "lawyer_service_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add unique constraints
CREATE UNIQUE INDEX "cancellation_settings_company_id_type_key" ON "cancellation_settings"("company_id", "cancellation_type");
CREATE UNIQUE INDEX "lawyer_service_settings_company_id_key" ON "lawyer_service_settings"("company_id");
