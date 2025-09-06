@echo off
echo ========================================
echo Testing Business Settings Flow
echo ========================================
echo.

cd packages\backend

echo [1/3] Regenerating Prisma Client...
call npx prisma generate >nul 2>&1
echo     ✓ Prisma Client ready
echo.

echo [2/3] Running database migration...
call npx prisma migrate deploy >nul 2>&1
echo     ✓ Database schema updated
echo.

echo [3/3] Starting backend server...
echo.
echo ========================================
echo Backend is starting on http://localhost:5000
echo.
echo Business Settings Endpoints:
echo - GET  /api/business-settings/cancellation
echo - POST /api/business-settings/cancellation
echo - GET  /api/business-settings/lawyer-service
echo - POST /api/business-settings/lawyer-service
echo.
echo Open the frontend and navigate to Business Settings
echo to test the full flow!
echo ========================================
echo.
call npm run dev
