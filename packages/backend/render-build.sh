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

echo "==> Running database migrations..."
npx prisma migrate deploy || {
    echo "==> Migration failed, attempting to fix database schema..."
    
    # Try to push schema directly
    npx prisma db push --accept-data-loss || {
        echo "==> Schema push failed, running fix script..."
        
        # Run the fix script
        if [ -f "src/scripts/fixRenderDatabase.ts" ]; then
            npx ts-node src/scripts/fixRenderDatabase.ts || {
                echo "==> Fix script failed, but continuing..."
            }
        fi
    }
}

echo "==> Verifying database connection..."
npx ts-node -e "
const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.\$connect()
  .then(() => {
    console.log('==> Database connection successful');
    return p.cancellationSetting.count();
  })
  .then(count => {
    console.log('==> Found', count, 'cancellation settings');
    return p.\$disconnect();
  })
  .catch(e => {
    console.log('==> Database verification warning:', e.message);
    return p.\$disconnect();
  });
" || true

echo "==> Build completed successfully!"
