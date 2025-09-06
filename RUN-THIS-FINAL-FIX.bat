@echo off
cls
echo ========================================================
echo         DIRECT DATABASE FIX - RUN THIS NOW!
echo ========================================================
echo.
echo Your database is missing the non_refundable_components column.
echo This script will fix it immediately.
echo.
echo ========================================================
echo.

cd packages\backend

echo Step 1: Fixing database schema...
echo ---------------------------------
echo.
echo Adding missing columns...

call npx prisma db execute --file fix-schema.sql --schema prisma/schema.prisma

if errorlevel 1 (
    echo.
    echo Trying alternative method...
    
    REM Try with psql directly if available
    echo ALTER TABLE cancellation_settings ADD COLUMN IF NOT EXISTS non_refundable_components JSONB DEFAULT '[]'::jsonb; | npx prisma db execute --stdin --schema prisma/schema.prisma 2>nul
    echo ALTER TABLE cancellation_settings ADD COLUMN IF NOT EXISTS name TEXT DEFAULT ''; | npx prisma db execute --stdin --schema prisma/schema.prisma 2>nul
)

echo.
echo Step 2: Regenerating Prisma Client...
echo -------------------------------------
call npx prisma generate

echo.
echo Step 3: Verifying fix...
echo ------------------------
call npx ts-node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.cancellationSetting.count().then(c => console.log('✓ Database fixed! Found', c, 'settings')).catch(e => console.log('✗ Still broken:', e.message.split('\n')[0])).finally(() => p.$disconnect())"

echo.
echo ========================================================
echo            STARTING BACKEND SERVER
echo ========================================================
echo.
echo If you see "Database fixed!" above, everything should work.
echo.
echo Server starting on http://localhost:5000
echo Frontend at http://localhost:3000
echo.
echo Go to Business Settings to verify it works!
echo.
echo ========================================================
echo.

call npm run dev
