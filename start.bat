@echo off
echo ========================================
echo    Jobline Application Startup Script
echo ========================================
echo.

echo [1/5] Checking dependencies...
cd packages\frontend
call npm list class-variance-authority >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing missing frontend dependencies...
    call npm install class-variance-authority clsx tailwind-merge
) else (
    echo Frontend dependencies OK
)
cd ..\..

echo.
echo [2/5] Building shared package...
call npm run build:shared >nul 2>&1
if %errorlevel% equ 0 (
    echo Shared package built successfully
) else (
    echo Error building shared package
    call npm run build:shared
)

echo.
echo [3/5] Checking database connection...
cd packages\backend
call npx prisma db push --skip-generate >nul 2>&1
if %errorlevel% equ 0 (
    echo Database connection OK
) else (
    echo Warning: Could not connect to database
    echo Please check your DATABASE_URL in packages\backend\.env
)
cd ..\..

echo.
echo [4/5] Starting the application...
echo.
echo Starting backend on http://localhost:5000
echo Starting frontend on http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

start cmd /k "cd packages\backend && npm run dev"
timeout /t 3 >nul
start cmd /k "cd packages\frontend && npm run dev"

echo.
echo ========================================
echo    Application started successfully!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000/api/health
echo.
echo Default login credentials:
echo Email: admin@jobline.com
echo Password: Admin123!
echo.
pause
