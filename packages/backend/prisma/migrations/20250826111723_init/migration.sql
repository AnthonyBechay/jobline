/*
  Warnings:

  - A unique constraint covering the columns `[company_id,stage,name]` on the table `document_templates` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[company_id,key]` on the table `settings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `company_id` to the `agents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_id` to the `applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_id` to the `brokers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_id` to the `candidates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_id` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_id` to the `document_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_id` to the `settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "document_templates_stage_name_key";

-- DropIndex
DROP INDEX "settings_key_key";

-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "company_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "company_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "brokers" ADD COLUMN     "company_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "company_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "company_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "document_templates" ADD COLUMN     "company_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "company_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "company_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agents_company_id_idx" ON "agents"("company_id");

-- CreateIndex
CREATE INDEX "applications_company_id_idx" ON "applications"("company_id");

-- CreateIndex
CREATE INDEX "brokers_company_id_idx" ON "brokers"("company_id");

-- CreateIndex
CREATE INDEX "candidates_company_id_idx" ON "candidates"("company_id");

-- CreateIndex
CREATE INDEX "clients_company_id_idx" ON "clients"("company_id");

-- CreateIndex
CREATE INDEX "document_templates_company_id_idx" ON "document_templates"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_templates_company_id_stage_name_key" ON "document_templates"("company_id", "stage", "name");

-- CreateIndex
CREATE INDEX "settings_company_id_idx" ON "settings"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_company_id_key_key" ON "settings"("company_id", "key");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brokers" ADD CONSTRAINT "brokers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_templates" ADD CONSTRAINT "document_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
