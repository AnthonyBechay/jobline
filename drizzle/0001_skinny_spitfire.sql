ALTER TABLE "clients" ADD COLUMN "identity_document_url" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "identity_document_tag" varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "document_1_url" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "document_1_tag" varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "document_2_url" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "document_2_tag" varchar(255);