#!/bin/bash

echo "Starting Render build process..."

# Navigate to root
cd ../..

echo "Installing root dependencies..."
npm install

echo "Building shared package..."
cd packages/shared
npm install
npm run build
cd ../..

echo "Building backend..."
cd packages/backend
npm install
npm run build

echo "Generating Prisma client..."
npx prisma generate

echo "Running database migrations..."
npx prisma migrate deploy

echo "Build complete!"
