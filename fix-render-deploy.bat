@echo off
echo Fixing deployment issues for Render...
echo.

REM Check if seed folder exists and remove it
if exist "packages\backend\src\seed" (
    echo Removing seed folder...
    rmdir /s /q "packages\backend\src\seed"
)

echo.
echo Deployment fixes complete!
echo.
echo Next steps:
echo 1. Commit changes: git add -A ^&^& git commit -m "Remove seed files and fix deployment"
echo 2. Push to GitHub: git push
echo 3. Render will automatically redeploy
echo.
pause