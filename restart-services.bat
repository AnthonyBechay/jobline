@echo off
echo ================================
echo Restarting Jobline Services
echo ================================
echo.

echo Please ensure both terminals are closed, then:
echo.
echo Terminal 1 - Backend:
echo ---------------------
echo cd packages\backend
echo npm run dev
echo.
echo Terminal 2 - Frontend:
echo ----------------------
echo cd packages\frontend
echo npm run dev
echo.
echo The services will be available at:
echo - Frontend: http://localhost:5173
echo - Backend API: http://localhost:5000/api
echo.
echo After starting both services, you can:
echo 1. Register a new office at: http://localhost:5173/register
echo 2. Login at: http://localhost:5173/login
echo.
pause
