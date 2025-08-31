@echo off
echo ===========================================
echo    Fixing Jobline Development Issues
echo ===========================================

echo.
echo Step 1: Cleaning ALL node_modules and lock files...
echo ----------------------------------------
if exist node_modules (
    echo Removing root node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Removing root package-lock.json...
    del /f /q package-lock.json
)

if exist packages\frontend\node_modules (
    echo Removing frontend node_modules...
    rmdir /s /q packages\frontend\node_modules
)
if exist packages\frontend\package-lock.json (
    echo Removing frontend package-lock.json...
    del /f /q packages\frontend\package-lock.json
)

if exist packages\backend\node_modules (
    echo Removing backend node_modules...
    rmdir /s /q packages\backend\node_modules
)
if exist packages\backend\package-lock.json (
    echo Removing backend package-lock.json...
    del /f /q packages\backend\package-lock.json
)

echo.
echo Step 2: Installing root dependencies...
echo ----------------------------------------
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)

echo.
echo Step 3: Installing frontend dependencies...
echo ----------------------------------------
cd packages\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo.
echo Step 4: Installing backend dependencies...
echo ----------------------------------------
cd packages\backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    cd ..\..
    pause
    exit /b 1
)

echo.
echo Step 5: Generating Prisma client...
echo ----------------------------------------
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    cd ..\..
    pause
    exit /b 1
)

cd ..\..

echo.
echo ===========================================
echo    ✅ ALL DEPENDENCIES FIXED!
echo ===========================================
echo.
echo Next steps:
echo 1. Run "npm run dev" to start development
echo 2. Run "npm run pre-deploy" to check deployment readiness
echo.
pause
