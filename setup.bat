@echo off
echo Setting up Jobline Recruitment Platform...
echo.

REM Check Node.js version
echo Checking Node.js version...
node -v
echo.

REM Install dependencies
echo Installing dependencies...
call npm install
echo.

REM Setup backend
echo Setting up backend...
cd packages\backend

REM Copy environment file if it doesn't exist
if not exist .env (
    copy .env.example .env
    echo Created .env file. Please update it with your database credentials.
)

REM Run Prisma generate
echo Generating Prisma client...
call npx prisma generate

REM Run migrations
echo Running database migrations...
call npx prisma migrate dev --name init

REM Seed database
echo Seeding database...
call npm run db:seed

cd ..\..

echo.
echo Setup complete!
echo.
echo To start the application, run:
echo   npm run dev
echo.
echo Default login credentials:
echo   Super Admin: owner@jobline.lb / admin123
echo   Admin: secretary@jobline.lb / secretary123
echo.
pause
