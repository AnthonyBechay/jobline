@echo off
echo Starting Jobline dependency installation...
echo.

cd packages\backend
echo Installing backend dependencies...
call npm install node-fetch@2.7.0 @types/node-fetch@2.6.11

echo.
echo Installation complete!
echo.
echo Please restart your development server by running:
echo npm run dev
echo.
pause