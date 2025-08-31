@echo off
echo ===========================================
echo    Fixing Jobline Development Issues
echo ===========================================

echo 1. Cleaning node_modules...
if exist node_modules rmdir /s /q node_modules
if exist packages\frontend\node_modules rmdir /s /q packages\frontend\node_modules
if exist packages\backend\node_modules rmdir /s /q packages\backend\node_modules

echo 2. Installing root dependencies...
call npm install

echo 3. Installing frontend dependencies...
cd packages\frontend
call npm install
cd ..\..

echo 4. Installing backend dependencies...
cd packages\backend
call npm install

echo 5. Generating Prisma client...
call npx prisma generate

cd ..\..

echo.
echo ✅ All dependencies installed and Prisma client generated!
echo.
echo Now you can run:
echo   npm run dev    - to start development servers
echo   npm run pre-deploy - to check deployment readiness
