@echo off
echo ================================
echo Fixing Jobline Setup
echo ================================
echo.

cd packages\backend

echo Installing backend dependencies...
call npm install

echo.
echo Installing AWS SDK v3...
call npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

echo.
echo Generating Prisma client...
call npx prisma generate

echo.
cd ..\frontend

echo Installing frontend dependencies...
call npm install

echo.
echo ================================
echo Setup Complete!
echo ================================
echo.
echo Now start the services:
echo.
echo Terminal 1:
echo   cd packages\backend
echo   npm run dev
echo.
echo Terminal 2:
echo   cd packages\frontend
echo   npm run dev
echo.
pause
