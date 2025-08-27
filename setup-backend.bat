@echo off
echo ================================
echo Jobline Backend Setup
echo ================================
echo.

echo 📦 Installing backend dependencies...
cd packages\backend
call npm install

echo.
echo 🔄 Generating Prisma Client...
call npx prisma generate

echo.
echo 🗄️ Running database migrations...
call npx prisma migrate dev --name add-file-model

echo.
echo ================================
echo ✅ Setup completed successfully!
echo ================================
echo.
echo 📝 Next steps:
echo 1. Make sure your PostgreSQL database is running
echo 2. Update your .env file with Backblaze B2 credentials
echo 3. Start the backend with: npm run dev
echo 4. The API will be available at http://localhost:5000
echo.
pause
