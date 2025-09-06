@echo off
cls
echo ========================================================
echo        QUICK FIX - Add Missing Database Columns
echo ========================================================
echo.
echo This will add the missing non_refundable_components column
echo and fix your database schema.
echo.
echo ========================================================
echo.

cd packages\backend

echo [1/3] Adding missing columns to database...
echo.

REM Create SQL to add missing columns
echo -- Add missing columns > add_columns.sql
echo ALTER TABLE cancellation_settings >> add_columns.sql
echo ADD COLUMN IF NOT EXISTS non_refundable_components JSONB DEFAULT '[]'::jsonb, >> add_columns.sql
echo ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Default Name'; >> add_columns.sql
echo. >> add_columns.sql
echo -- Update any NULL values >> add_columns.sql
echo UPDATE cancellation_settings >> add_columns.sql
echo SET non_refundable_components = '[]'::jsonb >> add_columns.sql
echo WHERE non_refundable_components IS NULL; >> add_columns.sql
echo. >> add_columns.sql
echo UPDATE cancellation_settings >> add_columns.sql
echo SET name = cancellation_type >> add_columns.sql
echo WHERE name IS NULL OR name = 'Default Name'; >> add_columns.sql
echo. >> add_columns.sql
echo -- Drop deprecated columns >> add_columns.sql
echo ALTER TABLE cancellation_settings >> add_columns.sql
echo DROP COLUMN IF EXISTS deportation_cost, >> add_columns.sql
echo DROP COLUMN IF EXISTS non_refundable_fees; >> add_columns.sql

echo Executing SQL...
call npx prisma db execute --file add_columns.sql --schema prisma/schema.prisma 2>nul
del add_columns.sql

echo.
echo [2/3] Regenerating Prisma Client...
call npx prisma generate >nul 2>&1
echo.

echo [3/3] Testing the fix...
call npx ts-node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.cancellationSetting.findMany().then(r => console.log('SUCCESS: Found', r.length, 'settings. Database is fixed!')).catch(e => console.log('ERROR:', e.message)).finally(() => p.$disconnect())"

echo.
echo ========================================================
echo              Database Fixed!
echo ========================================================
echo.
echo Starting backend server...
echo.
timeout /t 2 /nobreak >nul
call npm run dev
