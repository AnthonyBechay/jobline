-- CreateTable
CREATE TABLE "fee_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "default_price" DECIMAL(10,2) NOT NULL,
    "min_price" DECIMAL(10,2) NOT NULL,
    "max_price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_templates_pkey" PRIMARY KEY ("id")
);

-- AddColumn to applications table to track which fee template was used
ALTER TABLE "applications" ADD COLUMN "fee_template_id" TEXT;
ALTER TABLE "applications" ADD COLUMN "final_fee_amount" DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "fee_templates_company_id_idx" ON "fee_templates"("company_id");
CREATE UNIQUE INDEX "fee_templates_company_id_name_key" ON "fee_templates"("company_id", "name");

-- AddForeignKey
ALTER TABLE "fee_templates" ADD CONSTRAINT "fee_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_fee_template_id_fkey" FOREIGN KEY ("fee_template_id") REFERENCES "fee_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
