-- CreateTable for Nationality
CREATE TABLE IF NOT EXISTS "nationalities" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "company_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nationalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable for ClientDocument
CREATE TABLE IF NOT EXISTS "client_documents" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "document_name" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_documents_pkey" PRIMARY KEY ("id")
);

-- Add new columns to Company table
ALTER TABLE "companies" 
ADD COLUMN IF NOT EXISTS "email" TEXT,
ADD COLUMN IF NOT EXISTS "website" TEXT,
ADD COLUMN IF NOT EXISTS "tax_id" TEXT;

-- Add new columns to Candidate table
ALTER TABLE "candidates"
ADD COLUMN IF NOT EXISTS "face_photo_url" TEXT,
ADD COLUMN IF NOT EXISTS "full_body_photo_url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "nationalities_company_id_code_key" ON "nationalities"("company_id", "code");
CREATE INDEX IF NOT EXISTS "nationalities_company_id_idx" ON "nationalities"("company_id");
CREATE INDEX IF NOT EXISTS "client_documents_client_id_idx" ON "client_documents"("client_id");

-- AddForeignKey
ALTER TABLE "nationalities" ADD CONSTRAINT "nationalities_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
