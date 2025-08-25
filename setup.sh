#!/bin/bash

echo "🚀 Setting up Jobline Recruitment Platform..."

# Check Node.js version
NODE_VERSION=$(node -v)
echo "Node version: $NODE_VERSION"

# Check PostgreSQL
echo "Checking PostgreSQL connection..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup backend
echo "⚙️ Setting up backend..."
cd packages/backend

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file. Please update it with your database credentials."
fi

# Run Prisma generate
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "🗄️ Running database migrations..."
npx prisma migrate dev --name init

# Seed database
echo "🌱 Seeding database..."
npm run db:seed

cd ../..

echo "✅ Setup complete!"
echo ""
echo "To start the application, run:"
echo "  npm run dev"
echo ""
echo "Default login credentials:"
echo "  Super Admin: owner@jobline.lb / admin123"
echo "  Admin: secretary@jobline.lb / secretary123"
