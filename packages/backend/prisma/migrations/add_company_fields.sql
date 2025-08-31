-- AlterTable
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "mol_registration_number" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "bank_name" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "bank_account_number" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "bank_iban" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "bank_swift_code" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "license_number" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "established_date" TIMESTAMP(3);
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "number_of_employees" INTEGER;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "contact_person_name" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "contact_person_phone" TEXT;
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "contact_person_email" TEXT;

-- AlterTable for DocumentTemplate
ALTER TABLE "document_templates" ADD COLUMN IF NOT EXISTS "description" TEXT;
