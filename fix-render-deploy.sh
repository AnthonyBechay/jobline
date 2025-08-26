#!/bin/bash
# Deployment fix script for Render

echo "🔧 Fixing deployment issues for Render..."

# Remove seed folder if it exists
if [ -d "packages/backend/src/seed" ]; then
    echo "Removing seed folder..."
    rm -rf packages/backend/src/seed
fi

echo "✅ Deployment fixes complete!"
echo ""
echo "Next steps:"
echo "1. Commit changes: git add -A && git commit -m 'Remove seed files for deployment'"
echo "2. Push to GitHub: git push"
echo "3. Render will automatically redeploy"