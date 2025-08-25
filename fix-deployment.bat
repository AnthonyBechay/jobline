@echo off
echo Fixing Jobline deployment issues...

echo Installing missing dependencies...
cd packages\frontend
call npm install class-variance-authority clsx tailwind-merge
cd ..\..

echo Building shared package...
call npm run build:shared

echo All fixes applied!
echo.
echo Next steps:
echo 1. Run 'npm run dev' to test locally
echo 2. Commit and push changes to GitHub
echo 3. Redeploy on Vercel and Render
echo.
echo For deployment instructions, see DEPLOYMENT.md
pause
