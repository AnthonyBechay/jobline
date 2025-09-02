-- Add payment type and refundable fields to payments table
ALTER TABLE "payments" ADD COLUMN "payment_type" TEXT NOT NULL DEFAULT 'FEE';
ALTER TABLE "payments" ADD COLUMN "is_refundable" BOOLEAN NOT NULL DEFAULT true;

-- Create guarantor_changes table
CREATE TABLE "guarantor_changes" (
    "id" TEXT NOT NULL,
    "original_application_id" TEXT NOT NULL,
    "new_application_id" TEXT,
    "from_client_id" TEXT NOT NULL,
    "to_client_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "change_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "refund_amount" DECIMAL(10,2),
    "refund_currency" TEXT NOT NULL DEFAULT 'USD',
    "refund_processed" BOOLEAN NOT NULL DEFAULT false,
    "refund_processed_date" TIMESTAMP(3),
    "candidate_status_before" TEXT NOT NULL,
    "candidate_status_after" TEXT NOT NULL,
    "notes" TEXT,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guarantor_changes_pkey" PRIMARY KEY ("id")
);

-- Create indexes for guarantor_changes
CREATE INDEX "guarantor_changes_original_application_id_idx" ON "guarantor_changes"("original_application_id");
CREATE INDEX "guarantor_changes_new_application_id_idx" ON "guarantor_changes"("new_application_id");
CREATE INDEX "guarantor_changes_from_client_id_idx" ON "guarantor_changes"("from_client_id");
CREATE INDEX "guarantor_changes_to_client_id_idx" ON "guarantor_changes"("to_client_id");
CREATE INDEX "guarantor_changes_candidate_id_idx" ON "guarantor_changes"("candidate_id");
CREATE INDEX "guarantor_changes_company_id_idx" ON "guarantor_changes"("company_id");

-- Add foreign key constraints for guarantor_changes
ALTER TABLE "guarantor_changes" ADD CONSTRAINT "guarantor_changes_original_application_id_fkey" FOREIGN KEY ("original_application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "guarantor_changes" ADD CONSTRAINT "guarantor_changes_new_application_id_fkey" FOREIGN KEY ("new_application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "guarantor_changes" ADD CONSTRAINT "guarantor_changes_from_client_id_fkey" FOREIGN KEY ("from_client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "guarantor_changes" ADD CONSTRAINT "guarantor_changes_to_client_id_fkey" FOREIGN KEY ("to_client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "guarantor_changes" ADD CONSTRAINT "guarantor_changes_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "guarantor_changes" ADD CONSTRAINT "guarantor_changes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
