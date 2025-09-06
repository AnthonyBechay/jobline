@echo off
cls
echo Running Database Schema Diagnostic...
echo.

cd packages\backend
call npx ts-node src/scripts/diagnoseSchema.ts

echo.
pause
