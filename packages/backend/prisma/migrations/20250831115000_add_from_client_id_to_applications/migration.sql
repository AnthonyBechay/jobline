-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "from_client_id" TEXT;

-- CreateIndex
CREATE INDEX "applications_from_client_id_idx" ON "applications"("from_client_id");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_from_client_id_fkey" FOREIGN KEY ("from_client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

