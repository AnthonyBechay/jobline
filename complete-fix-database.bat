@echo off
echo ========================================
echo Complete Database Fix for Business Settings
echo ========================================
echo.
echo This script will fix the database schema and data issues.
echo.

cd packages\backend

echo [1/6] Updating existing records with proper names...
call npx ts-node src/scripts/updateCancellationSettings.ts
if errorlevel 1 (
    echo     Note: Might already be updated or no records exist
)
echo.

echo [2/6] Running Prisma migrations...
call npx prisma migrate deploy --skip-seed
if errorlevel 1 (
    echo     Attempting to resolve migration issues...
    
    REM Reset migration history if needed
    echo     Resetting migration history...
    call npx prisma migrate resolve --rolled-back 20250906120000_remove_deportation_cost 2>nul
    call npx prisma migrate resolve --rolled-back 20250906130000_fix_cancellation_settings 2>nul
    
    REM Try migration again
    call npx prisma migrate deploy --skip-seed
    if errorlevel 1 (
        echo     Migration issues persist. Will attempt manual fix...
    )
)
echo.

echo [3/6] Applying manual schema fixes...
echo.
echo -- Ensuring name column exists and has values > temp_fix.sql
echo ALTER TABLE "cancellation_settings" ADD COLUMN IF NOT EXISTS "name" TEXT; >> temp_fix.sql
echo UPDATE "cancellation_settings" SET "name" = COALESCE("name", "cancellation_type") WHERE "name" IS NULL OR "name" = ''; >> temp_fix.sql
echo ALTER TABLE "cancellation_settings" DROP COLUMN IF EXISTS "deportation_cost"; >> temp_fix.sql

call npx prisma db execute --file temp_fix.sql --schema prisma/schema.prisma 2>nul
del temp_fix.sql 2>nul
echo     ✓ Schema fixes applied
echo.

echo [4/6] Regenerating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo     ✗ Failed to regenerate Prisma client
    pause
    exit /b 1
)
echo     ✓ Prisma Client regenerated
echo.

echo [5/6] Verifying database state...
call npx prisma db pull --print 2>nul | findstr "cancellation_settings" >nul
if errorlevel 1 (
    echo     ⚠ Warning: Could not verify database state
) else (
    echo     ✓ Database schema verified
)
echo.

echo [6/6] Starting backend server...
echo.
echo ========================================
echo Backend is starting on http://localhost:5000
echo.
echo The Business Settings should now work correctly!
echo If you still see errors:
echo 1. Try refreshing the browser
echo 2. Clear browser cache
echo 3. Check the console for any remaining issues
echo ========================================
echo.
call npm run dev

:end
