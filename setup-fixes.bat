@echo off
echo ========================================
echo Jobline Setup and Fix Script
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
echo You can now:
echo 1. Start the development server: npm run dev
echo 2. Seed existing companies: npm run seed:all
echo 3. Seed a specific company: npm run seed:company [company-id]
echo.
echo New companies will be automatically seeded when created.
echo.
pause