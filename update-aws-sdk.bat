@echo off
echo ================================
echo Updating to AWS SDK v3
echo ================================
echo.

cd packages\backend

echo 📦 Removing old AWS SDK v2...
call npm uninstall aws-sdk @types/aws-sdk

echo.
echo 📦 Installing AWS SDK v3...
call npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

echo.
echo ✅ AWS SDK v3 installed successfully!
echo.
echo 🚀 Restart your backend server to apply changes
pause
