@echo off
echo ================================
echo Jobline Services Status Check
echo ================================
echo.

echo Checking Backend (http://localhost:5000)...
curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Backend is RUNNING
    curl http://localhost:5000/api/health
) else (
    echo ❌ Backend is NOT running
    echo.
    echo Please start it with:
    echo   cd packages\backend
    echo   npm run dev
)

echo.
echo --------------------------------
echo.

echo Checking Frontend (http://localhost:5173)...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Frontend is RUNNING
) else (
    echo ❌ Frontend is NOT running
    echo.
    echo Please start it with:
    echo   cd packages\frontend
    echo   npm run dev
)

echo.
echo ================================
echo Test Complete
echo ================================
echo.
echo If both are running but login still fails:
echo 1. Clear browser cache (Ctrl+F5)
echo 2. Check browser console for errors (F12)
echo 3. Open test-api.html in your browser to test connections
echo.
pause
