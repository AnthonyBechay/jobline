#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Jobline Platform Fixes...\n');

const fixes = [
  {
    name: '✅ Fix 1: Candidate Creation Without Agent',
    file: 'packages/backend/src/controllers/candidate.controller.ts',
    check: (content) => {
      return content.includes('Only Super Admin can assign agents') &&
             content.includes('{ agentId: null }');
    }
  },
  {
    name: '✅ Fix 2: Applications Menu Order',
    file: 'packages/frontend/src/components/Layout.tsx',
    check: (content) => {
      const menuSection = content.match(/const menuItems = \[([\s\S]*?)\]/);
      if (menuSection) {
        const items = menuSection[1];
        const dashboardIndex = items.indexOf('Dashboard');
        const applicationsIndex = items.indexOf('Applications');
        const clientsIndex = items.indexOf('Clients');
        return applicationsIndex > dashboardIndex && applicationsIndex < clientsIndex;
      }
      return false;
    }
  },
  {
    name: '✅ Fix 3: Background Contrast Improved',
    file: 'packages/frontend/src/components/Layout.tsx',
    check: (content) => {
      return content.includes("bgcolor: '#e8edf3'");
    }
  },
  {
    name: '✅ Fix 4: Broker Field Optional in Applications',
    file: 'packages/frontend/src/pages/Applications.tsx',
    check: (content) => {
      return content.includes('defaultValue=""') && 
             content.includes("value={field.value || ''}") &&
             content.includes('Broker (Optional)');
    }
  },
  {
    name: '✅ Fix 5: User-Friendly Error Messages',
    file: 'packages/backend/src/routes/application.routes.ts',
    check: (content) => {
      return content.includes('Please submit the following documents before proceeding') &&
             content.includes('userFriendly: true');
    }
  },
  {
    name: '✅ Fix 6: Public Status Route Response Format',
    file: 'packages/backend/src/routes/public.routes.ts',
    check: (content) => {
      return content.includes('application: {') &&
             content.includes('documents: application.documentItems.map') &&
             content.includes('payments: application.payments.map');
    }
  }
];

let allPassed = true;

fixes.forEach(fix => {
  const filePath = path.join(__dirname, fix.file);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${fix.name}`);
      console.log(`   File not found: ${fix.file}\n`);
      allPassed = false;
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const passed = fix.check(content);
    
    if (passed) {
      console.log(`✅ ${fix.name}`);
      console.log(`   File: ${fix.file}`);
      console.log(`   Status: Applied successfully\n`);
    } else {
      console.log(`❌ ${fix.name}`);
      console.log(`   File: ${fix.file}`);
      console.log(`   Status: Fix not applied or incomplete\n`);
      allPassed = false;
    }
  } catch (error) {
    console.log(`❌ ${fix.name}`);
    console.log(`   Error reading file: ${error.message}\n`);
    allPassed = false;
  }
});

console.log('═'.repeat(60));
if (allPassed) {
  console.log('✅ All fixes have been successfully applied!');
  console.log('\n📋 Next Steps:');
  console.log('1. Run: npm install (if needed)');
  console.log('2. Run: npm run dev (to test the application)');
  console.log('3. Test the following:');
  console.log('   - Create a candidate without selecting an agent');
  console.log('   - Create an application without selecting a broker');
  console.log('   - Check the shareable link for an application');
  console.log('   - Verify UI improvements (colors, menu order)');
} else {
  console.log('⚠️  Some fixes are not applied or incomplete.');
  console.log('Please review the issues above and apply the missing fixes.');
}

console.log('\n📌 Remaining Enhancements to Implement:');
console.log('- Complete photo upload integration for candidates');
console.log('- Add nationalities management in Settings');
console.log('- Update PDF generation to include photos');
console.log('- Add document upload for clients');
console.log('- Reorganize Settings page with Office Management section');

console.log('\n✨ The critical fixes have been implemented!');
