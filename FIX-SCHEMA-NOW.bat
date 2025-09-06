@echo off
cls
echo ========================================================
echo    COMPLETE DATABASE SCHEMA FIX FOR JOBLINE
echo ========================================================
echo.
echo Your database is missing required columns.
echo This script will fix ALL schema issues.
echo.
echo ========================================================
echo.
pause

cd packages\backend

echo.
echo [1/5] Creating comprehensive schema fix...
echo --------------------------------------------------------

REM Create a comprehensive SQL fix
echo -- Complete fix for cancellation_settings table > complete_fix.sql
echo. >> complete_fix.sql
echo -- Add missing columns if they don't exist >> complete_fix.sql
echo ALTER TABLE cancellation_settings ADD COLUMN IF NOT EXISTS name TEXT; >> complete_fix.sql
echo ALTER TABLE cancellation_settings ADD COLUMN IF NOT EXISTS non_refundable_components JSONB; >> complete_fix.sql
echo ALTER TABLE cancellation_settings ADD COLUMN IF NOT EXISTS deportation_cost DECIMAL(10,2); >> complete_fix.sql
echo. >> complete_fix.sql
echo -- Update existing records with default values >> complete_fix.sql
echo UPDATE cancellation_settings SET name = CASE >> complete_fix.sql
echo   WHEN cancellation_type = 'pre_arrival' THEN 'Pre-Arrival Cancellation' >> complete_fix.sql
echo   WHEN cancellation_type = 'pre_arrival_client' THEN 'Pre-Arrival Client Cancellation' >> complete_fix.sql
echo   WHEN cancellation_type = 'pre_arrival_candidate' THEN 'Pre-Arrival Candidate Cancellation' >> complete_fix.sql
echo   WHEN cancellation_type = 'post_arrival_within_3_months' THEN 'Post-Arrival Within 3 Months' >> complete_fix.sql
echo   WHEN cancellation_type = 'post_arrival_after_3_months' THEN 'Post-Arrival After 3 Months' >> complete_fix.sql
echo   WHEN cancellation_type = 'candidate_cancellation' THEN 'Candidate Cancellation' >> complete_fix.sql
echo   ELSE cancellation_type >> complete_fix.sql
echo END >> complete_fix.sql
echo WHERE name IS NULL OR name = ''; >> complete_fix.sql
echo. >> complete_fix.sql
echo -- Set default value for non_refundable_components >> complete_fix.sql
echo UPDATE cancellation_settings SET non_refundable_components = '[]'::jsonb WHERE non_refundable_components IS NULL; >> complete_fix.sql
echo. >> complete_fix.sql
echo -- Make required columns NOT NULL >> complete_fix.sql
echo ALTER TABLE cancellation_settings ALTER COLUMN name SET NOT NULL; >> complete_fix.sql
echo. >> complete_fix.sql
echo -- Drop deprecated column >> complete_fix.sql
echo ALTER TABLE cancellation_settings DROP COLUMN IF EXISTS deportation_cost; >> complete_fix.sql

echo Running comprehensive fix...
call npx prisma db execute --file complete_fix.sql --schema prisma/schema.prisma
if errorlevel 1 (
    echo.
    echo Note: Some changes might already be applied.
    echo.
)
del complete_fix.sql 2>nul

echo.
echo [2/5] Pulling current database schema...
echo --------------------------------------------------------
call npx prisma db pull --force >nul 2>&1
echo Schema pulled from database.

echo.
echo [3/5] Resetting Prisma migrations...
echo --------------------------------------------------------
call npx prisma migrate reset --skip-generate --skip-seed --force >nul 2>&1
echo Migrations reset.

echo.
echo [4/5] Creating fresh migration...
echo --------------------------------------------------------
call npx prisma migrate dev --name fix_schema --skip-generate >nul 2>&1
echo Migration created.

echo.
echo [5/5] Regenerating Prisma Client...
echo --------------------------------------------------------
call npx prisma generate
if errorlevel 1 (
    echo Failed to generate Prisma client!
    pause
    exit /b 1
)
echo Prisma Client regenerated successfully!

echo.
echo ========================================================
echo                 FIX COMPLETE!
echo ========================================================
echo.
echo Database schema has been fixed.
echo Starting the backend server now...
echo.
echo Once started:
echo 1. Open http://localhost:3000
echo 2. Go to Business Settings
echo 3. Everything should work!
echo.
echo ========================================================
echo.

timeout /t 3 /nobreak >nul
call npm run dev
