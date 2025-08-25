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

  // Step 1: Install root dependencies
  log('📦 Installing root dependencies...', colors.cyan);
  if (!runCommand('npm install')) {
    log('❌ Failed to install root dependencies', colors.red);
    process.exit(1);
  }
  log('✅ Root dependencies installed', colors.green);
  log('');

  // Step 2: Install shared package dependencies
  log('📦 Installing shared package dependencies...', colors.cyan);
  if (!runCommand('npm install', path.join(__dirname, 'packages', 'shared'))) {
    log('❌ Failed to install shared dependencies', colors.red);
    process.exit(1);
  }
  log('✅ Shared dependencies installed', colors.green);
  log('');

  // Step 3: Build shared package
  log('🔨 Building shared package...', colors.cyan);
  if (!runCommand('npm run build', path.join(__dirname, 'packages', 'shared'))) {
    log('❌ Failed to build shared package', colors.red);
    process.exit(1);
  }
  log('✅ Shared package built', colors.green);
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
  log('🗄️  Setting up database...', colors.cyan);
  
  // Check if .env exists in backend
  const envPath = path.join(__dirname, 'packages', 'backend', '.env');
  if (!fs.existsSync(envPath)) {
    log('Creating .env file...', colors.yellow);
    const envContent = `DATABASE_URL="file:./dev.db"
JWT_SECRET="jobline-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
`;
    fs.writeFileSync(envPath, envContent);
    log('✅ .env file created', colors.green);
  }

  // Generate Prisma client
  log('Generating Prisma client...', colors.cyan);
  if (!runCommand('npm run db:generate', path.join(__dirname, 'packages', 'backend'))) {
    log('❌ Failed to generate Prisma client', colors.red);
    process.exit(1);
  }
  log('✅ Prisma client generated', colors.green);

  // Run migrations
  log('Running database migrations...', colors.cyan);
  if (!runCommand('npm run db:migrate', path.join(__dirname, 'packages', 'backend'))) {
    log('⚠️  Migration failed or no migrations needed', colors.yellow);
  } else {
    log('✅ Database migrations completed', colors.green);
  }

  // Seed database
  log('Seeding database with sample data...', colors.cyan);
  if (!runCommand('npm run db:seed:simple', path.join(__dirname, 'packages', 'backend'))) {
    log('⚠️  Database seeding failed (may already be seeded)', colors.yellow);
  } else {
    log('✅ Database seeded with sample data', colors.green);
  }
  log('');

  // Success message
  log('========================================', colors.bright);
  log('✅ Setup completed successfully!', colors.green);
  log('========================================', colors.bright);
  log('');
  log('To start the application, run:', colors.cyan);
  log('  node start.js', colors.bright);
  log('');
  log('Login credentials:', colors.cyan);
  log('  Super Admin: admin@jobline.com / admin123', colors.dim);
  log('  Admin: secretary@jobline.com / secretary123', colors.dim);
  log('');
}

main().catch(error => {
  log('❌ Setup failed:', colors.red);
  console.error(error);
  process.exit(1);
});
