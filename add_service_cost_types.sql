-- Add serviceType field to FeeTemplate
ALTER TABLE "FeeTemplate" ADD COLUMN IF NOT EXISTS "serviceType" TEXT;

-- Create table for CostType management
CREATE TABLE IF NOT EXISTS "CostType" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CostType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique index for cost type name per company
CREATE UNIQUE INDEX IF NOT EXISTS "CostType_companyId_name_key" ON "CostType"("companyId", "name");

-- Create table for ServiceType management  
CREATE TABLE IF NOT EXISTS "ServiceType" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique index for service type name per company
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceType_companyId_name_key" ON "ServiceType"("companyId", "name");
