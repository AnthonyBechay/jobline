/*
  Warnings:

  - You are about to drop the column `non_refundable_fees` on the `cancellation_settings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cancellation_settings" DROP COLUMN "non_refundable_fees",
ADD COLUMN     "non_refundable_components" JSONB;

-- AlterTable
ALTER TABLE "document_checklist_items" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "required" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requiredFrom" TEXT NOT NULL DEFAULT 'office';
