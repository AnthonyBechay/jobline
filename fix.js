#!/usr/bin/env node

/**
 * Quick Fix Script for Jobline
 * Rebuilds shared package and restarts services
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Fixing Jobline setup...\n');

try {
  // Step 1: Build shared package
  console.log('Building shared package...');
  execSync('npm run build', {
    cwd: path.join(__dirname, 'packages', 'shared'),
    stdio: 'inherit'
  });
  console.log('✅ Shared package built\n');

  // Step 2: Generate Prisma Client
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', {
    cwd: path.join(__dirname, 'packages', 'backend'),
    stdio: 'inherit'
  });
  console.log('✅ Prisma client generated\n');

  console.log('✅ Fix completed!\n');
  console.log('To start the application:');
  console.log('  Windows: start-windows.bat');
  console.log('  Or: node start.js\n');
  
} catch (error) {
  console.error('❌ Fix failed:', error.message);
  process.exit(1);
}
