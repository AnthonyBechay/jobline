#!/bin/bash

echo "Running Jobline Database Migration..."
echo "======================================"

cd packages/backend

# Check if migration already exists and delete it if needed
if [ -d "prisma/migrations/20250906_financial_improvements" ]; then
    echo "✅ Migration folder exists, applying..."
else
    echo "Creating migration folder..."
    mkdir -p prisma/migrations/20250906_financial_improvements
fi

# Run the migration
echo "Applying migration..."
npx prisma migrate deploy

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo ""
echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Start the application: npm run dev"
echo "2. Go to Settings → Business Settings"
echo "3. Configure your cancellation policies with the new types:"
echo "   - Pre-Arrival Client Cancellation"
echo "   - Pre-Arrival Candidate Cancellation"
echo "   - Post-Arrival Within 3 Months"
echo "   - Post-Arrival After 3 Months"
echo "   - Candidate Post-Arrival Cancellation"
