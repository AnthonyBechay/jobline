#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Setting up multi-tenancy database...\n');

try {
  // Navigate to backend directory
  const backendDir = path.join(__dirname, 'packages', 'backend');
  
  console.log('📦 Installing Prisma dependencies...');
  execSync('npm install', { cwd: backendDir, stdio: 'inherit' });
  
  console.log('\n🗄️ Creating database migration...');
  execSync('npx prisma migrate dev --name add-multi-tenancy', { 
    cwd: backendDir, 
    stdio: 'inherit',
    env: { ...process.env, SKIP_ENV_CHECK: 'true' }
  });
  
  console.log('\n✅ Database migration complete!');
  console.log('\n🎉 Your system is now ready for multi-tenancy!');
  console.log('\nEach registration creates a separate company/office with isolated data.');
  
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.log('\nPlease ensure:');
  console.log('1. PostgreSQL is running');
  console.log('2. DATABASE_URL is set in packages/backend/.env');
  console.log('3. The database is accessible');
}