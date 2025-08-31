/*
  Warnings:

  - The `cost_type` column on the `costs` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "height" TEXT,
ADD COLUMN     "weight" TEXT;

-- AlterTable
ALTER TABLE "costs" DROP COLUMN "cost_type",
ADD COLUMN     "cost_type" TEXT NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "fee_templates" ADD COLUMN     "service_type" TEXT;

-- DropEnum
DROP TYPE "CostType";

-- CreateTable
CREATE TABLE "service_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_types_company_id_idx" ON "service_types"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_types_company_id_name_key" ON "service_types"("company_id", "name");

-- CreateIndex
CREATE INDEX "cost_types_company_id_idx" ON "cost_types"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "cost_types_company_id_name_key" ON "cost_types"("company_id", "name");

-- AddForeignKey
ALTER TABLE "service_types" ADD CONSTRAINT "service_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_types" ADD CONSTRAINT "cost_types_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
