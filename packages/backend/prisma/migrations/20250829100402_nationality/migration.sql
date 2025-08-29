/*
  Warnings:

  - You are about to drop the column `required_from` on the `document_templates` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "document_templates" DROP COLUMN "required_from",
ADD COLUMN     "requiredFrom" TEXT NOT NULL DEFAULT 'office';
