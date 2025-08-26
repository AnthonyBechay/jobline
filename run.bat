@echo off
echo ============================================
echo   JOBLINE - Recruitment Management System
echo ============================================
echo.

REM Check if this is first run
if not exist packages\backend\node_modules (
    echo First time setup detected...
    echo.
    goto :SETUP
)

REM Check if Prisma client exists
if not exist packages\backend\node_modules\.prisma (
    echo Generating Prisma client...
    cd packages\backend
    npx prisma generate
    cd ..\..
)

echo Starting Jobline...
echo.
echo ============================================
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3001
echo   Register: http://localhost:5173/register
echo ============================================
echo.
node start.js
goto :END

:SETUP
echo ============================================
echo   INITIAL SETUP
echo ============================================
echo.
echo Installing dependencies...
echo.

REM Install root dependencies
call npm install

REM Install frontend dependencies
echo Installing frontend dependencies...
cd packages\frontend
call npm install
cd ..\..

REM Install backend dependencies
echo Installing backend dependencies...
cd packages\backend
call npm install

REM Generate Prisma client
echo.
echo Generating Prisma client...
call npx prisma generate

REM Check if we need to run migrations
echo.
echo ============================================
echo   DATABASE SETUP
echo ============================================
echo.
echo Make sure PostgreSQL is running and you have
echo created a database for Jobline.
echo.
echo Your .env file should contain:
echo   DATABASE_URL="postgresql://user:password@localhost:5432/jobline"
echo.
pause

echo.
echo Running database migrations...
call npx prisma migrate dev --name init

cd ..\..

echo.
echo ============================================
echo   SETUP COMPLETE!
echo ============================================
echo.
echo Starting Jobline...
echo.
pause

node start.js

:END