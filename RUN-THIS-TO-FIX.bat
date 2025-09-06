@echo off
cls
echo ====================================================
echo       AUTOMATIC DATABASE FIX FOR JOBLINE
echo ====================================================
echo.
echo This will fix your database issues in 3 steps:
echo.
echo 1. Check current state
echo 2. Fix the schema
echo 3. Start the backend
echo.
echo ====================================================
echo.
pause

cd packages\backend

echo.
echo STEP 1: Checking database...
echo --------------------------------
call npx ts-node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.cancellationSetting.findMany().then(r => console.log('Found', r.length, 'settings')).catch(e => console.log('Error:', e.message)).finally(() => p.$disconnect())" 2>nul

echo.
echo STEP 2: Applying fix...
echo --------------------------------

REM Create a SQL fix file
echo -- Fix cancellation_settings table > fix.sql
echo ALTER TABLE cancellation_settings ADD COLUMN IF NOT EXISTS name TEXT; >> fix.sql
echo UPDATE cancellation_settings SET name = CASE >> fix.sql
echo   WHEN cancellation_type = 'pre_arrival' THEN 'Pre-Arrival Cancellation' >> fix.sql
echo   WHEN cancellation_type = 'pre_arrival_client' THEN 'Pre-Arrival Client Cancellation' >> fix.sql
echo   WHEN cancellation_type = 'pre_arrival_candidate' THEN 'Pre-Arrival Candidate Cancellation' >> fix.sql
echo   WHEN cancellation_type = 'post_arrival_within_3_months' THEN 'Post-Arrival Within 3 Months' >> fix.sql
echo   WHEN cancellation_type = 'post_arrival_after_3_months' THEN 'Post-Arrival After 3 Months' >> fix.sql
echo   WHEN cancellation_type = 'candidate_cancellation' THEN 'Candidate Cancellation' >> fix.sql
echo   ELSE cancellation_type >> fix.sql
echo END >> fix.sql
echo WHERE name IS NULL OR name = ''; >> fix.sql
echo ALTER TABLE cancellation_settings ALTER COLUMN name SET NOT NULL; >> fix.sql
echo ALTER TABLE cancellation_settings DROP COLUMN IF EXISTS deportation_cost; >> fix.sql

echo Running SQL fix...
call npx prisma db execute --file fix.sql --schema prisma/schema.prisma 2>nul
del fix.sql 2>nul

echo Regenerating Prisma Client...
call npx prisma generate >nul 2>&1

echo.
echo STEP 3: Verification...
echo --------------------------------
call npx ts-node -e "console.log('Database fixed successfully!')" 2>nul

echo.
echo ====================================================
echo              FIX COMPLETE!
echo ====================================================
echo.
echo Starting the backend server now...
echo.
echo Once it starts, open your browser and go to:
echo http://localhost:3000 -> Business Settings
echo.
echo ====================================================
echo.

timeout /t 3 /nobreak >nul
call npm run dev
