#!/bin/bash

# Script to run database migrations and generate Prisma client

echo "🔄 Generating Prisma Client..."
cd packages/backend
npx prisma generate

echo "🗄️ Creating database migration..."
npx prisma migrate dev --name add-file-model

echo "✅ Database migration completed!"
echo "📝 Files table has been added to the database"
echo ""
echo "🚀 You can now start the backend with: npm run dev"
