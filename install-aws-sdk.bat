@echo off
echo ================================
echo Installing AWS SDK v3 for Backblaze B2
echo ================================
echo.

cd packages\backend

echo Cleaning up old packages...
call npm uninstall aws-sdk @types/aws-sdk 2>nul

echo.
echo Installing AWS SDK v3 packages...
call npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

echo.
echo ✅ AWS SDK v3 installed successfully!
echo.
echo Starting backend server...
call npm run dev
