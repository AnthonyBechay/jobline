@echo off
echo Running Jobline Database Migration...
echo ======================================
echo.

cd packages\backend

echo Applying migration...
npx prisma migrate deploy

echo.
echo Generating Prisma client...
npx prisma generate

echo.
echo =====================================
echo Migration complete!
echo =====================================
echo.
echo Next steps:
echo 1. Start the application: npm run dev
echo 2. Go to Settings - Business Settings
echo 3. Configure your cancellation policies with the new types:
echo    - Pre-Arrival Client Cancellation
echo    - Pre-Arrival Candidate Cancellation
echo    - Post-Arrival Within 3 Months
echo    - Post-Arrival After 3 Months
echo    - Candidate Post-Arrival Cancellation
echo.
echo 4. The Fee Components feature enhances your existing fee templates
echo    allowing you to break down fees into refundable/non-refundable parts
echo.
pause
