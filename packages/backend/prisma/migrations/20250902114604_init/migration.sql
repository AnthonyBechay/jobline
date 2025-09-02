-- DropForeignKey
ALTER TABLE "application_lifecycle_history" DROP CONSTRAINT "application_lifecycle_history_application_id_fkey";

-- AddForeignKey
ALTER TABLE "application_lifecycle_history" ADD CONSTRAINT "application_lifecycle_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "cancellation_settings_company_id_type_key" RENAME TO "cancellation_settings_company_id_cancellation_type_key";
