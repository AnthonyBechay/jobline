-- Add labor permit and residency permit date fields to applications table
ALTER TABLE "applications" ADD COLUMN "labor_permit_date" TIMESTAMP(3);
ALTER TABLE "applications" ADD COLUMN "residency_permit_date" TIMESTAMP(3);

