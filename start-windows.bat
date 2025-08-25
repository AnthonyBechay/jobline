@echo off
echo ========================================
echo        Jobline Development Server       
echo ========================================
echo.

echo Building shared package...
cd packages\shared
call npm run build
cd ..\..

echo.
echo Starting services...
echo.

start "Backend Server" cmd /k "cd packages\backend && npm run dev"
timeout /t 3 /nobreak > nul
start "Frontend Server" cmd /k "cd packages\frontend && npm run dev"

echo.
echo ========================================
echo Services are starting...
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo.
echo Login credentials:
echo   Super Admin: admin@jobline.com / admin123
echo   Admin: secretary@jobline.com / secretary123
echo.
echo Close this window and the server windows to stop all services.
pause
