@echo off
echo ========================================
echo Jobline Final Setup Script
echo ========================================
echo.

echo Step 1: Installing backend dependencies...
cd packages\backend
call npm install node-fetch@2.7.0 @types/node-fetch@2.6.11

echo.
echo Step 2: Generating Prisma client...
call npx prisma generate

echo.
echo Step 3: Building backend...
call npm run build

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo NEXT STEPS:
echo -----------
echo 1. Start the development server:
echo    npm run dev
echo.
echo 2. For existing companies, seed default data:
echo    cd packages\backend
echo    npm run seed:all
echo.
echo 3. New companies will automatically get:
echo    - 20 Nationalities
echo    - 15 Cost Types
echo    - 12 Service Types  
echo    - 10 Fee Templates (Ethiopia $2000, Philippines $5000, Kenya $2300, etc.)
echo    - 18 Document Templates
echo    - 5 System Settings
echo.
echo FEATURES ADDED:
echo ---------------
echo - PDF Export: Now includes candidate photos, height, and weight
echo - Document Management: Available in Settings for searching/managing files
echo - Better file organization on Blackblaze
echo - Automatic company data seeding
echo - Improved document validation messages
echo.
pause