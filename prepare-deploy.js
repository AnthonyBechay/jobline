#!/usr/bin/env node

/**
 * Prepare for Deployment Script
 * This script prepares the project for deployment to Render and Vercel
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing Jobline for deployment...\n');

// Check if shared types are copied to frontend
const sharedSourcePath = path.join(__dirname, 'packages', 'shared', 'src');
const sharedDestPath = path.join(__dirname, 'packages', 'frontend', 'src', 'shared');

if (!fs.existsSync(sharedDestPath)) {
  console.log('❌ Shared types not found in frontend. Please ensure src/shared folder exists in frontend.');
} else {
  console.log('✅ Shared types are in frontend/src/shared');
}

// Check backend package.json
const backendPackageJson = require('./packages/backend/package.json');
if (backendPackageJson.scripts.postinstall && backendPackageJson.dependencies.typescript) {
  console.log('✅ Backend package.json is configured for deployment');
} else {
  console.log('⚠️  Backend package.json may need updates for deployment');
}

// Check for .env files
const backendEnvPath = path.join(__dirname, 'packages', 'backend', '.env');
const frontendEnvPath = path.join(__dirname, 'packages', 'frontend', '.env');

if (fs.existsSync(backendEnvPath)) {
  console.log('✅ Backend .env file exists (remember to set env vars in Render)');
} else {
  console.log('⚠️  No backend .env file found');
}

if (fs.existsSync(frontendEnvPath)) {
  console.log('✅ Frontend .env file exists (remember to set env vars in Vercel)');
} else {
  console.log('⚠️  No frontend .env file found');
}

console.log('\n📋 Deployment Checklist:');
console.log('');
console.log('For Render (Backend):');
console.log('1. Set Root Directory: packages/backend');
console.log('2. Build Command: npm install && npx prisma generate && npx prisma migrate deploy && npm run build');
console.log('3. Start Command: npm start');
console.log('4. Add environment variables:');
console.log('   - DATABASE_URL (PostgreSQL connection string)');
console.log('   - JWT_SECRET');
console.log('   - FRONTEND_URL (your Vercel URL)');
console.log('');
console.log('For Vercel (Frontend):');
console.log('1. Set Root Directory: packages/frontend');
console.log('2. Build Command: npm run build');
console.log('3. Output Directory: dist');
console.log('4. Add environment variable:');
console.log('   - VITE_API_URL (your Render URL)');
console.log('');
console.log('✅ Ready for deployment!');
console.log('');
console.log('See DEPLOYMENT.md for detailed instructions.');
