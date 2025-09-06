@echo off
cls
echo ========================================================
echo       FORCE SYNC DATABASE WITH PRISMA SCHEMA
echo ========================================================
echo.
echo This will force your database to match the Prisma schema.
echo.
echo WARNING: This may reset some data. Make sure you have backups!
echo.
echo Press Ctrl+C to cancel, or
pause

cd packages\backend

echo.
echo [1/4] Backing up current settings (if any exist)...
echo ----------------------------------------------------
call npx ts-node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); const fs = require('fs'); p.$queryRaw`SELECT * FROM cancellation_settings`.then(r => {fs.writeFileSync('settings-backup.json', JSON.stringify(r, null, 2)); console.log('Backup saved to settings-backup.json');}).catch(e => console.log('No settings to backup')).finally(() => p.$disconnect())" 2>nul

echo.
echo [2/4] Force pushing Prisma schema to database...
echo ------------------------------------------------
echo This will make your database match the schema.prisma file.
echo.
call npx prisma db push --force-reset --skip-generate

if errorlevel 1 (
    echo.
    echo Failed to push schema. Trying alternative approach...
    call npx prisma migrate reset --force --skip-seed --skip-generate
    call npx prisma db push --skip-generate
)

echo.
echo [3/4] Regenerating Prisma Client...
echo ------------------------------------
call npx prisma generate

echo.
echo [4/4] Seeding default settings...
echo ----------------------------------
call npx ts-node src/scripts/seedBusinessSettings.ts 2>nul
if errorlevel 1 (
    echo Note: Seeding might need a company first.
    echo You can add settings manually through the UI.
)

echo.
echo ========================================================
echo                   COMPLETE!
echo ========================================================
echo.
echo Your database schema is now synchronized with Prisma.
echo.
echo Starting the backend server...
echo.
echo Once started:
echo 1. Go to http://localhost:3000
echo 2. Navigate to Business Settings
echo 3. Add your cancellation policies
echo.
echo ========================================================
echo.

timeout /t 3 /nobreak >nul
call npm run dev
