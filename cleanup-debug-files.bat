@echo off
echo Cleaning up temporary files...

del fix-backend.bat.bak 2>nul
del regenerate-prisma.bat 2>nul
del cleanup-temp.js 2>nul
del cleanup.bat 2>nul
del fix-backend-complete.bat 2>nul
del start-backend-fixed.bat 2>nul

echo ✓ Cleanup complete
