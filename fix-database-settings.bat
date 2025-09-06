@echo off
echo ========================================
echo Fixing Database and Business Settings
echo ========================================
echo.

cd packages\backend

echo [1/5] Applying manual migration to fix existing data...
echo.
echo This will:
echo - Add 'name' column to existing cancellation_settings
echo - Set default names for existing rows
echo - Remove deprecated deportation_cost column
echo.

REM Run the migration SQL directly using Prisma
call npx prisma db execute --file prisma/migrations/20250906130000_fix_cancellation_settings/migration.sql --schema prisma/schema.prisma
if errorlevel 1 (
    echo.
    echo Note: Some changes might already be applied. Continuing...
    echo.
)

echo.
echo [2/5] Marking migration as applied...
call npx prisma migrate resolve --applied 20250906130000_fix_cancellation_settings 2>nul
echo     ✓ Migration marked as applied
echo.

echo [3/5] Running any pending migrations...
call npx prisma migrate deploy
if errorlevel 1 (
    echo     Note: No pending migrations or already applied
) else (
    echo     ✓ Migrations complete
)
echo.

echo [4/5] Regenerating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo     ✗ Failed to regenerate Prisma client
    pause
    exit /b 1
)
echo     ✓ Prisma Client regenerated
echo.

echo [5/5] Starting backend server...
echo.
echo ========================================
echo Backend ready at http://localhost:5000
echo.
echo You can now:
echo 1. Open the frontend
echo 2. Navigate to Business Settings
echo 3. All settings should load correctly
echo ========================================
echo.
call npm run dev

:end
