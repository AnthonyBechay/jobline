#!/usr/bin/env node

/**
 * Jobline Development Server
 * This script starts both backend and frontend servers concurrently
 */

const { spawn, exec } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper function to log with color
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Function to run a command
function runCommand(command, args, options, label, color) {
  const proc = spawn(command, args, {
    ...options,
    shell: true,
    stdio: 'pipe',
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${color}[${label}]${colors.reset} ${line}`);
    });
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      // Filter out non-error messages
      if (!line.includes('WARNING') && !line.includes('npm notice') && !line.includes('Debugger')) {
        console.error(`${colors.red}[${label} ERROR]${colors.reset} ${line}`);
      }
    });
  });

  proc.on('error', (error) => {
    console.error(`${colors.red}[${label} ERROR] Failed to start process: ${error.message}${colors.reset}`);
  });

  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      log(`[${label}] Process exited with code ${code}`, colors.yellow);
    }
  });

  return proc;
}

// Function to kill process on port 5000
function killPort5000() {
  return new Promise((resolve) => {
    log('🔍 Checking for existing processes on port 5000...', colors.yellow);
    
    // Windows command to find and kill process on port 5000
    const command = process.platform === 'win32' 
      ? 'netstat -ano | findstr :5000'
      : 'lsof -ti:5000';
    
    exec(command, (error, stdout, stderr) => {
      if (stdout && stdout.trim()) {
        if (process.platform === 'win32') {
          // Parse Windows netstat output
          const lines = stdout.trim().split('\n');
          const pids = new Set();
          
          lines.forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 5 && parts[1].includes(':5000')) {
              pids.add(parts[4]);
            }
          });
          
          if (pids.size > 0) {
            log(`🛑 Found ${pids.size} process(es) on port 5000, killing...`, colors.red);
            pids.forEach(pid => {
              exec(`taskkill /PID ${pid} /F`, (killError) => {
                if (!killError) {
                  log(`✅ Killed process ${pid}`, colors.green);
                }
              });
            });
            setTimeout(resolve, 2000); // Wait 2 seconds for processes to be killed
          } else {
            resolve();
          }
        } else {
          // Unix/Linux/Mac
          const pids = stdout.trim().split('\n');
          if (pids.length > 0 && pids[0]) {
            log(`🛑 Found ${pids.length} process(es) on port 5000, killing...`, colors.red);
            pids.forEach(pid => {
              exec(`kill -9 ${pid}`, (killError) => {
                if (!killError) {
                  log(`✅ Killed process ${pid}`, colors.green);
                }
              });
            });
            setTimeout(resolve, 2000);
          } else {
            resolve();
          }
        }
      } else {
        log('✅ No existing processes found on port 5000', colors.green);
        resolve();
      }
    });
  });
}

async function main() {
  log('========================================', colors.bright);
  log('       Jobline Development Server       ', colors.bright);
  log('========================================', colors.bright);
  log('');

  // Kill any existing processes on port 5000
  await killPort5000();
  log('');

  const processes = [];

  // Build shared package first
  log('Building shared package...', colors.cyan);
  const buildProc = spawn('npm', ['run', 'build'], {
    cwd: path.join(__dirname, 'packages', 'shared'),
    shell: true,
    stdio: 'inherit'
  });
  
  await new Promise((resolve) => {
    buildProc.on('exit', () => {
      log('✅ Shared package built', colors.green);
      log('');
      resolve();
    });
  });

  // Start backend
  log(`Starting backend on port 5000...`, colors.yellow);
  const backendProcess = runCommand(
    'npm',
    ['run', 'dev'],
    { cwd: path.join(__dirname, 'packages', 'backend') },
    'BACKEND',
    colors.yellow
  );
  processes.push(backendProcess);

  // Wait a bit for backend to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Start frontend
  log(`Starting frontend on port 5173...`, colors.blue);
  const frontendProcess = runCommand(
    'npm',
    ['run', 'dev'],
    { cwd: path.join(__dirname, 'packages', 'frontend') },
    'FRONTEND',
    colors.blue
  );
  processes.push(frontendProcess);

  // Wait for services to be ready
  await new Promise(resolve => setTimeout(resolve, 5000));

  log('');
  log('========================================', colors.bright);
  log('✅ All services started successfully!', colors.green);
  log('========================================', colors.bright);
  log('');
  log('🌐 Frontend: http://localhost:5173', colors.cyan);
  log('🔧 Backend:  http://localhost:5000', colors.cyan);
  log('');
  log('📝 Login credentials:', colors.magenta);
  log('   Super Admin: admin@jobline.com / admin123', colors.dim);
  log('   Admin: secretary@jobline.com / secretary123', colors.dim);
  log('');
  log('Press Ctrl+C to stop all services', colors.dim);
  log('');

  // Handle cleanup
  process.on('SIGINT', () => {
    log('\n🛑 Shutting down services...', colors.yellow);
    processes.forEach(proc => {
      if (proc && !proc.killed) {
        proc.kill();
      }
    });
    process.exit(0);
  });

  // Handle termination
  process.on('SIGTERM', () => {
    processes.forEach(proc => {
      if (proc && !proc.killed) {
        proc.kill();
      }
    });
    process.exit(0);
  });

  // Keep the script running
  await new Promise(() => {});
}

// Run the main function
main().catch(error => {
  log('❌ Fatal error:', colors.red);
  console.error(error);
  process.exit(1);
});
