CREATE TYPE "public"."ApplicationStatus" AS ENUM('PENDING_MOL', 'MOL_AUTH_RECEIVED', 'VISA_PROCESSING', 'VISA_RECEIVED', 'WORKER_ARRIVED', 'LABOUR_PERMIT_PROCESSING', 'RESIDENCY_PERMIT_PROCESSING', 'ACTIVE_EMPLOYMENT', 'CONTRACT_ENDED', 'RENEWAL_PENDING', 'CANCELLED_PRE_ARRIVAL', 'CANCELLED_POST_ARRIVAL', 'CANCELLED_CANDIDATE');--> statement-breakpoint
CREATE TYPE "public"."ApplicationType" AS ENUM('NEW_CANDIDATE', 'GUARANTOR_CHANGE');--> statement-breakpoint
CREATE TYPE "public"."CandidateStatus" AS ENUM('AVAILABLE_ABROAD', 'AVAILABLE_IN_LEBANON', 'RESERVED', 'IN_PROCESS', 'PLACED');--> statement-breakpoint
CREATE TYPE "public"."DocumentStatus" AS ENUM('PENDING', 'RECEIVED', 'SUBMITTED');--> statement-breakpoint
CREATE TYPE "public"."UserRole" AS ENUM('SUPER_ADMIN', 'ADMIN');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_details" json NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "application_lifecycle_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"from_status" varchar(100),
	"to_status" varchar(100),
	"from_client_id" uuid,
	"to_client_id" uuid,
	"candidate_status_before" varchar(100),
	"candidate_status_after" varchar(100),
	"financial_impact" json,
	"notes" text,
	"performed_by" uuid NOT NULL,
	"performed_at" timestamp DEFAULT now() NOT NULL,
	"company_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"from_client_id" uuid,
	"candidate_id" uuid NOT NULL,
	"status" "ApplicationStatus" NOT NULL,
	"type" "ApplicationType" NOT NULL,
	"broker_id" uuid,
	"permit_expiry_date" timestamp,
	"exact_arrival_date" timestamp,
	"labor_permit_date" timestamp,
	"residency_permit_date" timestamp,
	"shareable_link" varchar(255) NOT NULL,
	"fee_template_id" uuid,
	"final_fee_amount" numeric(10, 2),
	"lawyer_service_requested" boolean DEFAULT false NOT NULL,
	"lawyer_fee_cost" numeric(10, 2),
	"lawyer_fee_charge" numeric(10, 2),
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "applications_shareable_link_unique" UNIQUE("shareable_link")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brokers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_details" json NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cancellation_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cancellation_type" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"penalty_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"refund_percentage" numeric(5, 2) DEFAULT '100' NOT NULL,
	"non_refundable_components" json,
	"monthly_service_fee" numeric(10, 2) DEFAULT '0' NOT NULL,
	"max_refund_amount" numeric(10, 2),
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cancellation_settings_company_cancellation_type_unique" UNIQUE("company_id","cancellation_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"photo_url" varchar(500),
	"face_photo_url" varchar(500),
	"full_body_photo_url" varchar(500),
	"date_of_birth" timestamp,
	"nationality" varchar(100) NOT NULL,
	"education" varchar(255),
	"skills" json,
	"experience_summary" text,
	"height" varchar(50),
	"weight" varchar(50),
	"status" "CandidateStatus" NOT NULL,
	"agent_id" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"document_name" varchar(255) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"url" varchar(500) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"address" text,
	"notes" text,
	"referred_by_client_id" uuid,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50),
	"address" text,
	"email" varchar(255),
	"website" varchar(255),
	"tax_id" varchar(100),
	"mol_registration_number" varchar(100),
	"bank_name" varchar(255),
	"bank_account_number" varchar(100),
	"bank_iban" varchar(100),
	"bank_swift_code" varchar(50),
	"license_number" varchar(100),
	"established_date" timestamp,
	"number_of_employees" integer,
	"contact_person_name" varchar(255),
	"contact_person_phone" varchar(50),
	"contact_person_email" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cost_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cost_types_company_name_unique" UNIQUE("company_id","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid,
	"candidate_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"cost_date" timestamp DEFAULT now() NOT NULL,
	"cost_type" varchar(100) DEFAULT 'OTHER' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"document_name" varchar(255) NOT NULL,
	"status" "DocumentStatus" NOT NULL,
	"stage" "ApplicationStatus" NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"required_from" varchar(50) DEFAULT 'office' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stage" "ApplicationStatus" NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"required" boolean DEFAULT true NOT NULL,
	"required_from" varchar(50) DEFAULT 'office' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "document_templates_company_stage_name_unique" UNIQUE("company_id","stage","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fee_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fee_template_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"is_refundable" boolean DEFAULT true NOT NULL,
	"refundable_after_arrival" boolean DEFAULT false NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fee_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"default_price" numeric(10, 2) NOT NULL,
	"min_price" numeric(10, 2) NOT NULL,
	"max_price" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"nationality" varchar(100),
	"service_type" varchar(255),
	"description" text,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "fee_templates_company_name_unique" UNIQUE("company_id","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size" bigint NOT NULL,
	"url" varchar(500) NOT NULL,
	"cloudinary_id" varchar(255),
	"uploaded_by" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guarantor_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_application_id" uuid NOT NULL,
	"new_application_id" uuid,
	"from_client_id" uuid NOT NULL,
	"to_client_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"change_date" timestamp DEFAULT now() NOT NULL,
	"reason" text,
	"refund_amount" numeric(10, 2),
	"refund_currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"refund_processed" boolean DEFAULT false NOT NULL,
	"refund_processed_date" timestamp,
	"candidate_status_before" varchar(100) NOT NULL,
	"candidate_status_after" varchar(100) NOT NULL,
	"notes" text,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lawyer_service_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lawyer_fee_cost" numeric(10, 2) NOT NULL,
	"lawyer_fee_charge" numeric(10, 2) NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lawyer_service_settings_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nationalities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(255) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "nationalities_company_code_unique" UNIQUE("company_id","code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "office_overhead_costs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"cost_date" timestamp DEFAULT now() NOT NULL,
	"category" varchar(100) NOT NULL,
	"recurring" boolean DEFAULT false NOT NULL,
	"recurring_frequency" varchar(50),
	"company_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD' NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"payment_type" varchar(50) DEFAULT 'FEE' NOT NULL,
	"notes" text,
	"is_refundable" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "service_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_types_company_name_unique" UNIQUE("company_id","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(255) NOT NULL,
	"value" json NOT NULL,
	"description" text,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_company_key_unique" UNIQUE("company_id","key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"display_email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "UserRole" NOT NULL,
	"company_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_company_unique" UNIQUE("email","company_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agents" ADD CONSTRAINT "agents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "application_lifecycle_history" ADD CONSTRAINT "application_lifecycle_history_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "application_lifecycle_history" ADD CONSTRAINT "application_lifecycle_history_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "application_lifecycle_history" ADD CONSTRAINT "application_lifecycle_history_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applications" ADD CONSTRAINT "applications_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applications" ADD CONSTRAINT "applications_from_client_id_clients_id_fk" FOREIGN KEY ("from_client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applications" ADD CONSTRAINT "applications_broker_id_brokers_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."brokers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applications" ADD CONSTRAINT "applications_fee_template_id_fee_templates_id_fk" FOREIGN KEY ("fee_template_id") REFERENCES "public"."fee_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "applications" ADD CONSTRAINT "applications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brokers" ADD CONSTRAINT "brokers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cancellation_settings" ADD CONSTRAINT "cancellation_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidates" ADD CONSTRAINT "candidates_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "candidates" ADD CONSTRAINT "candidates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clients" ADD CONSTRAINT "clients_referred_by_client_id_clients_id_fk" FOREIGN KEY ("referred_by_client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clients" ADD CONSTRAINT "clients_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cost_types" ADD CONSTRAINT "cost_types_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "costs" ADD CONSTRAINT "costs_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "costs" ADD CONSTRAINT "costs_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_checklist_items" ADD CONSTRAINT "document_checklist_items_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fee_components" ADD CONSTRAINT "fee_components_fee_template_id_fee_templates_id_fk" FOREIGN KEY ("fee_template_id") REFERENCES "public"."fee_templates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fee_templates" ADD CONSTRAINT "fee_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guarantor_changes" ADD CONSTRAINT "guarantor_changes_original_application_id_applications_id_fk" FOREIGN KEY ("original_application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guarantor_changes" ADD CONSTRAINT "guarantor_changes_new_application_id_applications_id_fk" FOREIGN KEY ("new_application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guarantor_changes" ADD CONSTRAINT "guarantor_changes_from_client_id_clients_id_fk" FOREIGN KEY ("from_client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guarantor_changes" ADD CONSTRAINT "guarantor_changes_to_client_id_clients_id_fk" FOREIGN KEY ("to_client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guarantor_changes" ADD CONSTRAINT "guarantor_changes_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guarantor_changes" ADD CONSTRAINT "guarantor_changes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lawyer_service_settings" ADD CONSTRAINT "lawyer_service_settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nationalities" ADD CONSTRAINT "nationalities_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "office_overhead_costs" ADD CONSTRAINT "office_overhead_costs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "office_overhead_costs" ADD CONSTRAINT "office_overhead_costs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "service_types" ADD CONSTRAINT "service_types_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "settings" ADD CONSTRAINT "settings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_company_id_idx" ON "agents" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "application_lifecycle_history_application_id_idx" ON "application_lifecycle_history" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "application_lifecycle_history_company_id_idx" ON "application_lifecycle_history" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "application_lifecycle_history_performed_by_idx" ON "application_lifecycle_history" USING btree ("performed_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "applications_status_idx" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "applications_client_id_idx" ON "applications" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "applications_from_client_id_idx" ON "applications" USING btree ("from_client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "applications_candidate_id_idx" ON "applications" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "applications_company_id_idx" ON "applications" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brokers_company_id_idx" ON "brokers" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cancellation_settings_company_id_idx" ON "cancellation_settings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cancellation_settings_cancellation_type_idx" ON "cancellation_settings" USING btree ("cancellation_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candidates_status_idx" ON "candidates" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candidates_nationality_idx" ON "candidates" USING btree ("nationality");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "candidates_company_id_idx" ON "candidates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "client_documents_client_id_idx" ON "client_documents" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "clients_company_id_idx" ON "clients" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cost_types_company_id_idx" ON "cost_types" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "costs_application_id_idx" ON "costs" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "costs_candidate_id_idx" ON "costs" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_checklist_items_application_id_idx" ON "document_checklist_items" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "document_templates_company_id_idx" ON "document_templates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fee_components_fee_template_id_idx" ON "fee_components" USING btree ("fee_template_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fee_templates_company_id_idx" ON "fee_templates" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fee_templates_nationality_idx" ON "fee_templates" USING btree ("nationality");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_entity_type_id_idx" ON "files" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_company_id_idx" ON "files" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guarantor_changes_original_application_id_idx" ON "guarantor_changes" USING btree ("original_application_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guarantor_changes_new_application_id_idx" ON "guarantor_changes" USING btree ("new_application_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guarantor_changes_from_client_id_idx" ON "guarantor_changes" USING btree ("from_client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guarantor_changes_to_client_id_idx" ON "guarantor_changes" USING btree ("to_client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guarantor_changes_candidate_id_idx" ON "guarantor_changes" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "guarantor_changes_company_id_idx" ON "guarantor_changes" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lawyer_service_settings_company_id_idx" ON "lawyer_service_settings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "nationalities_company_id_idx" ON "nationalities" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "office_overhead_costs_company_id_idx" ON "office_overhead_costs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "office_overhead_costs_category_idx" ON "office_overhead_costs" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "office_overhead_costs_cost_date_idx" ON "office_overhead_costs" USING btree ("cost_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_application_id_idx" ON "payments" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_client_id_idx" ON "payments" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "service_types_company_id_idx" ON "service_types" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "settings_company_id_idx" ON "settings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_company_id_idx" ON "users" USING btree ("company_id");