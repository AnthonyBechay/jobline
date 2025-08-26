#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Running startup check and fixes...\n');

try {
  // 1. Check if backend dependencies are installed
  console.log('📦 Checking backend dependencies...');
  const backendPath = path.join(__dirname, 'packages', 'backend');
  
  try {
    require.resolve(path.join(backendPath, 'node_modules', '@prisma', 'client'));
    console.log('✅ Backend dependencies installed\n');
  } catch (e) {
    console.log('⚠️ Installing backend dependencies...');
    execSync('npm install', { cwd: backendPath, stdio: 'inherit' });
  }

  // 2. Generate Prisma client
  console.log('🗄️ Generating Prisma client...');
  execSync('npx prisma generate', { 
    cwd: backendPath, 
    stdio: 'pipe' // Silent mode
  });
  console.log('✅ Prisma client ready\n');

  // 3. Check if database is migrated
  console.log('🗄️ Checking database migrations...');
  try {
    execSync('npx prisma migrate status', { 
      cwd: backendPath, 
      stdio: 'pipe'
    });
    console.log('✅ Database is up to date\n');
  } catch (e) {
    console.log('⚠️ Database needs migration. Run:');
    console.log('   cd packages/backend');
    console.log('   npx prisma migrate dev --name init\n');
  }

  // 4. Start the application
  console.log('🚀 Starting Jobline...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📌 Frontend: http://localhost:5173');
  console.log('📌 Backend:  http://localhost:3001');
  console.log('📌 Register: http://localhost:5173/register');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Start the original start script
  require('./start.js');
  
} catch (error) {
  console.error('❌ Startup check failed:', error.message);
  process.exit(1);
}