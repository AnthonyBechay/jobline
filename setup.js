#!/usr/bin/env node

/**
 * Jobline Setup Script
 * Run this script to setup the project for first time
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, cwd = null) {
  try {
    const options = { stdio: 'inherit' };
    if (cwd) {
      options.cwd = cwd;
    }
    execSync(command, options);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  log('========================================', colors.bright);
  log('       Jobline Setup Script             ', colors.bright);
  log('========================================', colors.bright);
  log('');

  // Step 1: Check if PostgreSQL is accessible
  log('📋 Prerequisites:', colors.cyan);
  log('1. PostgreSQL must be installed and running', colors.yellow);
  log('2. Create a database named: jobline_db', colors.yellow);
  log('   Run: psql -U postgres -c "CREATE DATABASE jobline_db;"', colors.dim);
  log('');

  // Step 2: Install root dependencies
  log('📦 Installing root dependencies...', colors.cyan);
  if (!runCommand('npm install')) {
    log('❌ Failed to install root dependencies', colors.red);
    process.exit(1);
  }
  log('✅ Root dependencies installed', colors.green);
  log('');

  // Step 3: Install and build shared package
  log('📦 Setting up shared package...', colors.cyan);
  if (!runCommand('npm install', path.join(__dirname, 'packages', 'shared'))) {
    log('❌ Failed to install shared dependencies', colors.red);
    process.exit(1);
  }
  if (!runCommand('npm run build', path.join(__dirname, 'packages', 'shared'))) {
    log('❌ Failed to build shared package', colors.red);
    process.exit(1);
  }
  log('✅ Shared package ready', colors.green);
  log('');

  // Step 4: Install backend dependencies
  log('📦 Installing backend dependencies...', colors.cyan);
  if (!runCommand('npm install', path.join(__dirname, 'packages', 'backend'))) {
    log('❌ Failed to install backend dependencies', colors.red);
    process.exit(1);
  }
  log('✅ Backend dependencies installed', colors.green);
  log('');

  // Step 5: Install frontend dependencies
  log('📦 Installing frontend dependencies...', colors.cyan);
  if (!runCommand('npm install', path.join(__dirname, 'packages', 'frontend'))) {
    log('❌ Failed to install frontend dependencies', colors.red);
    process.exit(1);
  }
  log('✅ Frontend dependencies installed', colors.green);
  log('');

  // Step 6: Setup database
  log('🗄️  Setting up PostgreSQL database...', colors.cyan);
  
  // Check if .env exists in backend
  const envPath = path.join(__dirname, 'packages', 'backend', '.env');
  if (!fs.existsSync(envPath)) {
    log('Creating .env file with default settings...', colors.yellow);
    const envContent = `# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/jobline_db?schema=public"

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Setup
SETUP_KEY=jobline-setup-2024

# CORS
FRONTEND_URL=http://localhost:5173

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
`;
    fs.writeFileSync(envPath, envContent);
    log('✅ .env file created', colors.green);
    log('⚠️  Please update the DATABASE_URL with your PostgreSQL credentials', colors.yellow);
  }

  // Generate Prisma client
  log('Generating Prisma client...', colors.cyan);
  if (!runCommand('npx prisma generate', path.join(__dirname, 'packages', 'backend'))) {
    log('❌ Failed to generate Prisma client', colors.red);
    process.exit(1);
  }
  log('✅ Prisma client generated', colors.green);

  // Run migrations
  log('Running database migrations...', colors.cyan);
  if (!runCommand('npx prisma migrate dev --name init', path.join(__dirname, 'packages', 'backend'))) {
    log('⚠️  Migration failed. Make sure PostgreSQL is running and credentials are correct.', colors.yellow);
  } else {
    log('✅ Database migrations completed', colors.green);
  }

  log('');
  log('========================================', colors.bright);
  log('✅ Setup completed successfully!', colors.green);
  log('========================================', colors.bright);
  log('');
  log('Next steps:', colors.cyan);
  log('1. Start the application: node start.js', colors.bright);
  log('2. Open http://localhost:5173/register', colors.bright);
  log('3. Create your first Super Admin account', colors.bright);
  log('   Setup Key: jobline-setup-2024', colors.yellow);
  log('');
}

main().catch(error => {
  log('❌ Setup failed:', colors.red);
  console.error(error);
  process.exit(1);
});
