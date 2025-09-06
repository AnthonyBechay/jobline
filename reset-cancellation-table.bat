@echo off
echo ========================================
echo Reset Cancellation Settings Table
echo ========================================
echo.
echo WARNING: This will DELETE all existing cancellation settings
echo and recreate the table with proper schema.
echo.
echo Press Ctrl+C to cancel, or
pause

cd packages\backend

echo.
echo [1/4] Dropping and recreating cancellation_settings table...
echo.

echo -- Drop existing table and recreate > reset_table.sql
echo DROP TABLE IF EXISTS "cancellation_settings"; >> reset_table.sql
echo. >> reset_table.sql
echo CREATE TABLE "cancellation_settings" ( >> reset_table.sql
echo   "id" TEXT NOT NULL, >> reset_table.sql
echo   "cancellation_type" TEXT NOT NULL, >> reset_table.sql
echo   "name" TEXT NOT NULL, >> reset_table.sql
echo   "penalty_fee" DECIMAL(10,2) DEFAULT 0, >> reset_table.sql
echo   "refund_percentage" DECIMAL(5,2) DEFAULT 100, >> reset_table.sql
echo   "non_refundable_components" JSONB, >> reset_table.sql
echo   "monthly_service_fee" DECIMAL(10,2) DEFAULT 0, >> reset_table.sql
echo   "max_refund_amount" DECIMAL(10,2), >> reset_table.sql
echo   "description" TEXT, >> reset_table.sql
echo   "active" BOOLEAN DEFAULT true, >> reset_table.sql
echo   "company_id" TEXT NOT NULL, >> reset_table.sql
echo   "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, >> reset_table.sql
echo   "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, >> reset_table.sql
echo   CONSTRAINT "cancellation_settings_pkey" PRIMARY KEY ("id"), >> reset_table.sql
echo   CONSTRAINT "cancellation_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE >> reset_table.sql
echo ); >> reset_table.sql
echo. >> reset_table.sql
echo CREATE UNIQUE INDEX "cancellation_settings_company_id_cancellation_type_key" ON "cancellation_settings"("company_id", "cancellation_type"); >> reset_table.sql
echo CREATE INDEX "cancellation_settings_company_id_idx" ON "cancellation_settings"("company_id"); >> reset_table.sql
echo CREATE INDEX "cancellation_settings_cancellation_type_idx" ON "cancellation_settings"("cancellation_type"); >> reset_table.sql

call npx prisma db execute --file reset_table.sql --schema prisma/schema.prisma
del reset_table.sql
echo     ✓ Table recreated
echo.

echo [2/4] Seeding default cancellation settings...
call npx ts-node src/scripts/seedBusinessSettings.ts
if errorlevel 1 (
    echo     Note: Seeding might have failed. You can add settings manually.
)
echo.

echo [3/4] Regenerating Prisma Client...
call npx prisma generate
echo     ✓ Prisma Client regenerated
echo.

echo [4/4] Starting backend server...
echo.
echo ========================================
echo Table has been reset and seeded with defaults!
echo Backend is starting on http://localhost:5000
echo ========================================
echo.
call npm run dev

:end
