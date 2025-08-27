@echo off
echo ================================
echo Jobline Full Stack Test
echo ================================
echo.

echo Checking backend...
curl -s http://localhost:5000/api/health > nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Backend is running at http://localhost:5000
) else (
    echo ❌ Backend is NOT running. Please start it with: cd packages\backend ^&^& npm run dev
    pause
    exit /b 1
)

echo.
echo Checking frontend...
curl -s http://localhost:5173 > nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Frontend is running at http://localhost:5173
) else (
    echo ❌ Frontend is NOT running. Please start it with: cd packages\frontend ^&^& npm run dev
    pause
    exit /b 1
)

echo.
echo ================================
echo ✅ Both services are running!
echo ================================
echo.
echo You can now:
echo 1. Register at: http://localhost:5173/register
echo 2. Login at: http://localhost:5173/login
echo.
pause
