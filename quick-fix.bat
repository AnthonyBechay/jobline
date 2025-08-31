@echo off
echo ===========================================
echo    QUICK FIX for Jobline Issues
echo ===========================================

echo.
echo Cleaning and reinstalling frontend to fix Vite...
cd packages\frontend
rmdir /s /q node_modules 2>nul
del /f /q package-lock.json 2>nul
call npm install
cd ..\..

echo.
echo Regenerating Prisma client to fix backend...
cd packages\backend
call npx prisma generate
cd ..\..

echo.
echo ===========================================
echo    Done! Try running npm run dev now
echo ===========================================
pause
