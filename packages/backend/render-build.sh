#!/bin/bash

# Exit on error
set -e

echo "==> Starting Render build process..."

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "==> ERROR: package.json not found. Make sure root directory is set to 'packages/backend' in Render"
    exit 1
fi

echo "==> Installing dependencies..."
npm ci --production=false

echo "==> Generating Prisma Client..."
npx prisma generate

echo "==> Building TypeScript..."
npm run build

echo "==> Build completed successfully!"
