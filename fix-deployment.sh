#!/bin/bash

echo "🔧 Fixing Jobline deployment issues..."

# Navigate to project root
cd "$(dirname "$0")"

echo "📦 Installing missing dependencies..."

# Install missing frontend dependencies
cd packages/frontend
npm install class-variance-authority clsx tailwind-merge
cd ../..

# Build shared package
echo "🏗️ Building shared package..."
npm run build:shared

echo "✅ All fixes applied!"
echo ""
echo "📝 Next steps:"
echo "1. Run 'npm run dev' to test locally"
echo "2. Commit and push changes to GitHub"
echo "3. Redeploy on Vercel and Render"
echo ""
echo "🚀 For deployment instructions, see DEPLOYMENT.md"
