@echo off
echo ========================================
echo Checking Database State
echo ========================================
echo.

cd packages\backend

call npx ts-node src/scripts/checkDatabase.ts

echo.
pause
