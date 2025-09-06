#!/usr/bin/env bash
# Render Database Fix Script
# This runs during deployment or can be run manually

echo "==========================================="
echo "   Render Database Schema Fix"
echo "==========================================="
echo ""

# Exit on error
set -e

# Change to backend directory
cd packages/backend 2>/dev/null || cd /opt/render/project/src/packages/backend

echo "1. Checking database connection..."
npx prisma db execute --sql "SELECT 1" --schema prisma/schema.prisma >/dev/null 2>&1 && echo "   ✓ Connected to database" || echo "   ⚠ Connection issues"

echo ""
echo "2. Running migrations..."
npx prisma migrate deploy 2>/dev/null || {
    echo "   ⚠ Migration failed, attempting alternative fix..."
    npx prisma db push --accept-data-loss 2>/dev/null || {
        echo "   ⚠ Schema push failed, running manual fix..."
        npx ts-node src/scripts/fixRenderDatabase.ts
    }
}

echo ""
echo "3. Generating Prisma Client..."
npx prisma generate

echo ""
echo "4. Checking for existing data..."
COUNT=$(npx ts-node -e "
const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.company.count().then(c => {
  console.log(c);
  p.$disconnect();
}).catch(() => {
  console.log(0);
  p.$disconnect();
});
" 2>/dev/null)

if [ "$COUNT" = "0" ]; then
    echo "   No companies found. Seeding initial data..."
    npx ts-node src/scripts/seedCompany.ts 2>/dev/null || echo "   ⚠ Could not seed company"
    npx ts-node src/scripts/seedBusinessSettings.ts 2>/dev/null || echo "   ⚠ Could not seed settings"
else
    echo "   ✓ Found $COUNT existing companies"
fi

echo ""
echo "5. Verifying database schema..."
npx ts-node -e "
const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.cancellationSetting.findFirst().then(() => {
  console.log('   ✓ Schema is correct!');
  p.$disconnect();
}).catch(e => {
  console.log('   ✗ Schema issues remain:', e.message);
  p.$disconnect();
});
" 2>/dev/null

echo ""
echo "==========================================="
echo "   Database fix complete!"
echo "==========================================="
echo ""
