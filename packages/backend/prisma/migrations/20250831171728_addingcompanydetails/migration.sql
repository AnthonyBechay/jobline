-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "bank_account_number" TEXT,
ADD COLUMN     "bank_iban" TEXT,
ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "bank_swift_code" TEXT,
ADD COLUMN     "contact_person_email" TEXT,
ADD COLUMN     "contact_person_name" TEXT,
ADD COLUMN     "contact_person_phone" TEXT,
ADD COLUMN     "established_date" TIMESTAMP(3),
ADD COLUMN     "license_number" TEXT,
ADD COLUMN     "mol_registration_number" TEXT,
ADD COLUMN     "number_of_employees" INTEGER;

-- AlterTable
ALTER TABLE "document_templates" ADD COLUMN     "description" TEXT;
