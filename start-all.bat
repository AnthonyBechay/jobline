@echo off
echo ================================
echo Starting Jobline Full Stack
echo ================================
echo.
echo This will open 2 terminals - one for backend, one for frontend
echo.

echo Starting Backend Server...
start cmd /k "cd /d %~dp0packages\backend && echo BACKEND SERVER && echo -------------- && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start cmd /k "cd /d %~dp0packages\frontend && echo FRONTEND SERVER && echo --------------- && npm run dev"

echo.
echo ================================
echo Services Starting...
echo ================================
echo.
echo Wait for both services to fully start, then:
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo.
echo To register: http://localhost:5173/register
echo To login:    http://localhost:5173/login
echo.
pause
