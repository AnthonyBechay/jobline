#!/usr/bin/env node

/**
 * Clean Script
 * Removes build artifacts and dependencies
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
}

console.log('🧹 Cleaning Jobline project...\n');

const dirsToClean = [
  'node_modules',
  'packages/shared/node_modules',
  'packages/shared/dist',
  'packages/backend/node_modules',
  'packages/backend/dist',
  'packages/frontend/node_modules',
  'packages/frontend/dist',
];

dirsToClean.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`Removing ${dir}...`);
    try {
      deleteFolderRecursive(fullPath);
      console.log(`✅ Removed ${dir}`);
    } catch (err) {
      console.log(`❌ Failed to remove ${dir}:`, err.message);
    }
  }
});

console.log('\n✅ Cleanup complete!');
console.log('Run "node setup.js" to reinstall everything.');
