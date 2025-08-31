#!/usr/bin/env node

/**
 * Pre-deployment validation script for Jobline
 * Runs comprehensive checks before deployment to Vercel and Render
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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function execCommand(command, cwd = process.cwd(), silent = false) {
  try {
    const output = execSync(command, { 
      cwd, 
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout };
  }
}

// Check functions
const checks = {
  // 1. Check Node version
  nodeVersion: () => {
    logSection('Node Version Check');
    const nodeVersion = process.version;
    const requiredMajor = 18;
    const currentMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (currentMajor >= requiredMajor) {
      logSuccess(`Node version ${nodeVersion} meets requirement (>= v${requiredMajor})`);
      return { passed: true };
    } else {
      logError(`Node version ${nodeVersion} is below requirement (>= v${requiredMajor})`);
      return { passed: false, error: `Node version ${nodeVersion} is below requirement (>= v${requiredMajor})` };
    }
  },

  // 2. Check dependencies
  dependencies: () => {
    logSection('Dependencies Check');
    const errors = [];
    
    logInfo('Checking root dependencies...');
    const rootInstall = execCommand('npm ci', process.cwd(), true);
    if (!rootInstall.success) {
      logError('Failed to install root dependencies');
      errors.push('Root dependencies: ' + rootInstall.error);
    } else {
      logSuccess('Root dependencies installed');
    }

    logInfo('Checking frontend dependencies...');
    const frontendInstall = execCommand('npm ci', path.join(process.cwd(), 'packages/frontend'), true);
    if (!frontendInstall.success) {
      logError('Failed to install frontend dependencies');
      errors.push('Frontend dependencies: ' + frontendInstall.error);
    } else {
      logSuccess('Frontend dependencies installed');
    }

    logInfo('Checking backend dependencies...');
    const backendInstall = execCommand('npm ci', path.join(process.cwd(), 'packages/backend'), true);
    if (!backendInstall.success) {
      logError('Failed to install backend dependencies');
      errors.push('Backend dependencies: ' + backendInstall.error);
    } else {
      logSuccess('Backend dependencies installed');
    }

    return { passed: errors.length === 0, errors };
  },

  // 3. TypeScript compilation check
  typescript: () => {
    logSection('TypeScript Compilation Check');
    const errors = [];
    
    logInfo('Checking frontend TypeScript...');
    const frontendTsc = execCommand('npx tsc --noEmit', path.join(process.cwd(), 'packages/frontend'), true);
    if (!frontendTsc.success) {
      logError('Frontend TypeScript compilation failed');
      errors.push('Frontend TypeScript:\n' + frontendTsc.error);
    } else {
      logSuccess('Frontend TypeScript compilation successful');
    }

    logInfo('Checking backend TypeScript...');
    const backendTsc = execCommand('npx tsc --noEmit', path.join(process.cwd(), 'packages/backend'), true);
    if (!backendTsc.success) {
      logError('Backend TypeScript compilation failed');
      errors.push('Backend TypeScript:\n' + backendTsc.error);
    } else {
      logSuccess('Backend TypeScript compilation successful');
    }

    return { passed: errors.length === 0, errors };
  },

  // 4. ESLint check (if configured)
  linting: () => {
    logSection('Linting Check');
    const warnings = [];
    
    // Check if eslint is configured
    const frontendEslintConfig = path.join(process.cwd(), 'packages/frontend/.eslintrc.json');
    const backendEslintConfig = path.join(process.cwd(), 'packages/backend/.eslintrc.json');
    
    if (fs.existsSync(frontendEslintConfig)) {
      logInfo('Running frontend linting...');
      const frontendLint = execCommand('npx eslint src --ext .ts,.tsx', path.join(process.cwd(), 'packages/frontend'), true);
      if (!frontendLint.success) {
        logWarning('Frontend linting issues found (non-blocking)');
        warnings.push('Frontend linting: ' + frontendLint.error);
      } else {
        logSuccess('Frontend linting passed');
      }
    } else {
      logInfo('Frontend ESLint not configured, skipping...');
    }

    if (fs.existsSync(backendEslintConfig)) {
      logInfo('Running backend linting...');
      const backendLint = execCommand('npx eslint src --ext .ts', path.join(process.cwd(), 'packages/backend'), true);
      if (!backendLint.success) {
        logWarning('Backend linting issues found (non-blocking)');
        warnings.push('Backend linting: ' + backendLint.error);
      } else {
        logSuccess('Backend linting passed');
      }
    } else {
      logInfo('Backend ESLint not configured, skipping...');
    }

    return { passed: true, warnings }; // Non-blocking
  },

  // 5. Environment variables check
  envVars: () => {
    logSection('Environment Variables Check');
    const warnings = [];
    
    const requiredFrontendEnv = [
      'VITE_API_URL',
    ];
    
    const requiredBackendEnv = [
      'DATABASE_URL',
      'JWT_SECRET',
      'PORT',
    ];

    // Check frontend .env
    const frontendEnvPath = path.join(process.cwd(), 'packages/frontend/.env');
    const frontendEnvExamplePath = path.join(process.cwd(), 'packages/frontend/.env.example');
    
    if (!fs.existsSync(frontendEnvPath) && !fs.existsSync(frontendEnvExamplePath)) {
      logWarning('Frontend .env or .env.example not found');
      logInfo('Make sure to set environment variables in Vercel dashboard');
      warnings.push('Frontend .env or .env.example not found');
    } else {
      logSuccess('Frontend environment configuration found');
    }

    // Check backend .env
    const backendEnvPath = path.join(process.cwd(), 'packages/backend/.env');
    const backendEnvExamplePath = path.join(process.cwd(), 'packages/backend/.env.example');
    
    if (!fs.existsSync(backendEnvPath) && !fs.existsSync(backendEnvExamplePath)) {
      logWarning('Backend .env or .env.example not found');
      logInfo('Make sure to set environment variables in Render dashboard');
      warnings.push('Backend .env or .env.example not found');
    } else {
      logSuccess('Backend environment configuration found');
    }

    return { passed: true, warnings };
  },

  // 6. Build test
  build: () => {
    logSection('Build Test');
    const errors = [];
    
    logInfo('Testing frontend build...');
    const frontendBuild = execCommand('npm run build', path.join(process.cwd(), 'packages/frontend'), true);
    if (!frontendBuild.success) {
      logError('Frontend build failed');
      errors.push('Frontend build:\n' + frontendBuild.error);
    } else {
      logSuccess('Frontend build successful');
      
      // Clean up build artifacts
      const frontendDistPath = path.join(process.cwd(), 'packages/frontend/dist');
      if (fs.existsSync(frontendDistPath)) {
        fs.rmSync(frontendDistPath, { recursive: true });
        logInfo('Cleaned up frontend build artifacts');
      }
    }

    logInfo('Testing backend build...');
    const backendBuild = execCommand('npm run build', path.join(process.cwd(), 'packages/backend'), true);
    if (!backendBuild.success) {
      logError('Backend build failed');
      errors.push('Backend build:\n' + backendBuild.error);
    } else {
      logSuccess('Backend build successful');
      
      // Clean up build artifacts
      const backendDistPath = path.join(process.cwd(), 'packages/backend/dist');
      if (fs.existsSync(backendDistPath)) {
        fs.rmSync(backendDistPath, { recursive: true });
        logInfo('Cleaned up backend build artifacts');
      }
    }

    return { passed: errors.length === 0, errors };
  },

  // 7. Database schema check (Prisma)
  database: () => {
    logSection('Database Schema Check');
    const errors = [];
    
    logInfo('Validating Prisma schema...');
    const validateSchema = execCommand('npx prisma validate', path.join(process.cwd(), 'packages/backend'), true);
    if (!validateSchema.success) {
      logError('Prisma schema validation failed');
      errors.push('Prisma validation: ' + validateSchema.error);
    } else {
      logSuccess('Prisma schema is valid');
    }

    logInfo('Checking for pending migrations...');
    // Note: This is informational only, as migrations should be run on the deployed database
    logWarning('Remember to run migrations on your production database after deployment');

    return { passed: errors.length === 0, errors };
  },

  // 8. Check for common issues
  commonIssues: () => {
    logSection('Common Issues Check');
    const warnings = [];
    
    // Check for console.log statements in production code
    logInfo('Checking for console.log statements...');
    const frontendLogs = execCommand('grep -r "console.log" src --include="*.tsx" --include="*.ts" | wc -l', path.join(process.cwd(), 'packages/frontend'), true);
    const backendLogs = execCommand('grep -r "console.log" src --include="*.ts" | wc -l', path.join(process.cwd(), 'packages/backend'), true);
    
    if (frontendLogs.success && parseInt(frontendLogs.output) > 0) {
      const msg = `Found ${frontendLogs.output.trim()} console.log statements in frontend code`;
      logWarning(msg);
      warnings.push(msg);
    }
    
    if (backendLogs.success && parseInt(backendLogs.output) > 0) {
      const msg = `Found ${backendLogs.output.trim()} console.log statements in backend code`;
      logWarning(msg);
      warnings.push(msg);
    }

    // Check for TODO comments
    logInfo('Checking for TODO comments...');
    const frontendTodos = execCommand('grep -r "TODO" src --include="*.tsx" --include="*.ts" | wc -l', path.join(process.cwd(), 'packages/frontend'), true);
    const backendTodos = execCommand('grep -r "TODO" src --include="*.ts" | wc -l', path.join(process.cwd(), 'packages/backend'), true);
    
    if (frontendTodos.success && parseInt(frontendTodos.output) > 0) {
      const msg = `Found ${frontendTodos.output.trim()} TODO comments in frontend code`;
      logWarning(msg);
      warnings.push(msg);
    }
    
    if (backendTodos.success && parseInt(backendTodos.output) > 0) {
      const msg = `Found ${backendTodos.output.trim()} TODO comments in backend code`;
      logWarning(msg);
      warnings.push(msg);
    }

    logSuccess('Common issues check completed');
    return { passed: true, warnings };
  },

  // 9. Package.json scripts check
  scripts: () => {
    logSection('Package Scripts Check');
    const errors = [];
    
    const rootPackage = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    const frontendPackage = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'packages/frontend/package.json'), 'utf8'));
    const backendPackage = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'packages/backend/package.json'), 'utf8'));

    const requiredFrontendScripts = ['dev', 'build', 'preview'];
    const requiredBackendScripts = ['dev', 'build', 'start'];

    requiredFrontendScripts.forEach(script => {
      if (!frontendPackage.scripts || !frontendPackage.scripts[script]) {
        const msg = `Frontend missing required script: ${script}`;
        logError(msg);
        errors.push(msg);
      }
    });

    requiredBackendScripts.forEach(script => {
      if (!backendPackage.scripts || !backendPackage.scripts[script]) {
        const msg = `Backend missing required script: ${script}`;
        logError(msg);
        errors.push(msg);
      }
    });

    if (errors.length === 0) {
      logSuccess('All required package scripts are present');
    }

    return { passed: errors.length === 0, errors };
  },

  // 10. Git status check
  gitStatus: () => {
    logSection('Git Status Check');
    const warnings = [];
    
    const status = execCommand('git status --porcelain', process.cwd(), true);
    if (status.success && status.output.trim() !== '') {
      logWarning('You have uncommitted changes:');
      console.log(status.output);
      warnings.push('Uncommitted changes in git');
      logInfo('Consider committing your changes before deployment');
    } else {
      logSuccess('Working directory is clean');
    }

    // Check current branch
    const branch = execCommand('git rev-parse --abbrev-ref HEAD', process.cwd(), true);
    if (branch.success) {
      logInfo(`Current branch: ${branch.output.trim()}`);
      if (branch.output.trim() !== 'main' && branch.output.trim() !== 'master') {
        logWarning('You are not on the main/master branch');
        warnings.push('Not on main/master branch');
      }
    }

    return { passed: true, warnings };
  }
};

// Main execution
async function main() {
  console.log('\n' + '='.repeat(60));
  log('   🚀 JOBLINE PRE-DEPLOYMENT CHECK', colors.bright + colors.magenta);
  console.log('='.repeat(60));

  const results = [];
  const allErrors = [];
  const allWarnings = [];
  let allPassed = true;

  // Run all checks
  for (const [name, check] of Object.entries(checks)) {
    try {
      const result = await check();
      const passed = result === true || result.passed;
      results.push({ name, passed, result });
      
      if (result.errors) {
        allErrors.push(...result.errors.map(e => `[${name}] ${e}`));
      }
      if (result.warnings) {
        allWarnings.push(...result.warnings.map(w => `[${name}] ${w}`));
      }
      
      if (!passed && name !== 'linting' && name !== 'commonIssues' && name !== 'gitStatus' && name !== 'envVars') {
        allPassed = false;
      }
    } catch (error) {
      logError(`Check '${name}' threw an error: ${error.message}`);
      results.push({ name, passed: false });
      allErrors.push(`[${name}] ${error.message}`);
      allPassed = false;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  log('   SUMMARY', colors.bright + colors.cyan);
  console.log('='.repeat(60));

  results.forEach(({ name, passed }) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    const color = passed ? colors.green : colors.red;
    log(`  ${name}: ${status}`, color);
  });

  // Show all errors if any
  if (allErrors.length > 0) {
    console.log('\n' + '='.repeat(60));
    log('   ERRORS', colors.bright + colors.red);
    console.log('='.repeat(60));
    allErrors.forEach(error => {
      console.log(colors.red + error + colors.reset);
    });
  }

  // Show all warnings if any
  if (allWarnings.length > 0) {
    console.log('\n' + '='.repeat(60));
    log('   WARNINGS', colors.bright + colors.yellow);
    console.log('='.repeat(60));
    allWarnings.forEach(warning => {
      console.log(colors.yellow + warning + colors.reset);
    });
  }

  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    log('   ✅ ALL CRITICAL CHECKS PASSED - Ready for deployment!', colors.bright + colors.green);
    console.log('='.repeat(60));
    console.log('\n' + colors.cyan + 'Deployment instructions:' + colors.reset);
    console.log('  Frontend (Vercel): ' + colors.yellow + 'git push origin main' + colors.reset);
    console.log('  Backend (Render):  ' + colors.yellow + 'git push origin main' + colors.reset);
    console.log('\n' + colors.blue + 'Note: Make sure environment variables are set in both platforms' + colors.reset);
    
    if (allWarnings.length > 0) {
      console.log('\n' + colors.yellow + 'ℹ️  There are some warnings you might want to address before deployment' + colors.reset);
    }
    
    process.exit(0);
  } else {
    log('   ❌ SOME CRITICAL CHECKS FAILED - Please fix issues before deployment', colors.bright + colors.red);
    console.log('='.repeat(60));
    console.log('\n' + colors.red + 'Fix the errors listed above and run the check again.' + colors.reset);
    console.log('\n' + colors.cyan + 'Quick fix command:' + colors.reset);
    console.log('  Windows: ' + colors.yellow + 'fix-deps.bat' + colors.reset);
    console.log('  Linux/Mac: ' + colors.yellow + 'bash fix-deps.sh' + colors.reset);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});
