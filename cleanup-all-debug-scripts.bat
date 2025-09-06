@echo off
echo ========================================
echo Cleaning up debug and fix scripts...
echo ========================================
echo.

REM List of files to remove
set FILES_TO_DELETE=fix-backend.bat.bak regenerate-prisma.bat cleanup-temp.js cleanup.bat fix-backend-complete.bat start-backend-fixed.bat fix-database-settings.bat complete-fix-database.bat reset-cancellation-table.bat check-database.bat RUN-THIS-TO-FIX.bat FIX-SCHEMA-NOW.bat QUICK-FIX.bat RUN-THIS-FINAL-FIX.bat FORCE-SYNC-DATABASE.bat diagnose-database.bat cleanup-debug-files.bat test-business-settings.bat

echo Files to remove:
for %%F in (%FILES_TO_DELETE%) do (
    if exist "%%F" (
        echo   - %%F
        del "%%F" 2>nul
    )
)

echo.
echo Keeping important files:
echo   ✓ RENDER-DATABASE-GUIDE.md (deployment reference)
echo   ✓ RENDER-FIX-COMPLETE.md (fix documentation)
echo   ✓ DATABASE-FIX-GUIDE.md (troubleshooting guide)
echo   ✓ Backend scripts in src/scripts/
echo.

echo Cleanup complete!
echo.
echo To fix any future database issues:
echo   Local: npx prisma db push --force-reset
echo   Render: Deploy and it auto-fixes
echo.
pause
