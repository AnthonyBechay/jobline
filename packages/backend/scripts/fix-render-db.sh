#!/bin/bash
# Script to fix database schema on Render

echo "Starting Render database fix..."

# Run migrations
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "Migration failed, attempting force sync..."
  npx prisma db push --force-reset
fi

# Generate client
npx prisma generate

# Seed if needed
if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding database..."
  npx ts-node src/scripts/seedCompany.ts
  npx ts-node src/scripts/seedBusinessSettings.ts
fi

echo "Database fix complete!"
