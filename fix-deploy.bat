@echo off
echo Fixing deployment issues...

echo Running fix script...
node fix-deployment.js

echo.
echo Fix complete! Now you can:
echo.
echo 1. Test locally:
echo    npm run dev
echo.
echo 2. Deploy to Vercel:
echo    git add -A
echo    git commit -m "Fix deployment and simplify auth"
echo    git push
echo.
pause
