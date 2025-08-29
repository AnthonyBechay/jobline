-- AlterTable
ALTER TABLE "fee_templates" ADD COLUMN "nationality" TEXT;

-- AlterTable 
ALTER TABLE "document_templates" ADD COLUMN "required_from" TEXT DEFAULT 'office';

-- CreateIndex
CREATE INDEX "fee_templates_nationality_idx" ON "fee_templates"("nationality");
