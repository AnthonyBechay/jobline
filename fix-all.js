#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing all issues and setting up multi-tenancy...\n');

try {
  // 1. Fix frontend dependencies
  console.log('📦 Fixing frontend dependencies...');
  const frontendPackageJsonPath = path.join(__dirname, 'packages', 'frontend', 'package.json');
  const frontendPackageJson = JSON.parse(fs.readFileSync(frontendPackageJsonPath, 'utf8'));
  
  frontendPackageJson.dependencies = {
    ...frontendPackageJson.dependencies,
    "class-variance-authority": "^0.7.0",
    "tailwind-merge": "^2.2.0",
    "@radix-ui/react-slot": "^1.1.1",
    "lucide-react": "^0.468.0",
    "clsx": "^2.1.1"
  };
  
  fs.writeFileSync(frontendPackageJsonPath, JSON.stringify(frontendPackageJson, null, 2));
  console.log('✅ Frontend package.json updated\n');

  // 2. Install frontend dependencies
  console.log('📦 Installing frontend dependencies...');
  execSync('npm install', { 
    cwd: path.join(__dirname, 'packages', 'frontend'), 
    stdio: 'inherit' 
  });
  console.log('✅ Frontend dependencies installed\n');

  // 3. Install backend dependencies  
  console.log('📦 Installing backend dependencies...');
  execSync('npm install', { 
    cwd: path.join(__dirname, 'packages', 'backend'), 
    stdio: 'inherit' 
  });
  console.log('✅ Backend dependencies installed\n');

  // 4. Generate Prisma client
  console.log('🗄️ Generating Prisma client...');
  execSync('npx prisma generate', { 
    cwd: path.join(__dirname, 'packages', 'backend'), 
    stdio: 'inherit' 
  });
  console.log('✅ Prisma client generated\n');

  console.log('🎉 All fixes applied successfully!\n');
  console.log('Next steps:');
  console.log('1. Set up your database:');
  console.log('   cd packages/backend');
  console.log('   npx prisma migrate dev --name init');
  console.log('');
  console.log('2. Start the development servers:');
  console.log('   npm run dev');
  console.log('');
  console.log('3. Register your first office at http://localhost:5173/register');
  console.log('');
  console.log('For deployment:');
  console.log('   git add -A');
  console.log('   git commit -m "Add multi-tenancy support"');
  console.log('   git push');

} catch (error) {
  console.error('❌ Error during setup:', error.message);
  process.exit(1);
}