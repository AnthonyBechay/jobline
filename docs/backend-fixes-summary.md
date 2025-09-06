# Backend Fixes Summary

## Issues Fixed

### 1. **Field Name Corrections**
- Changed `nonRefundableFees` to `nonRefundableComponents` throughout the codebase to match the Prisma schema
- This affects:
  - `/src/routes/businessSettings.routes.ts`
  - `/src/scripts/seedBusinessSettings.ts`
  - `/src/services/improvedFinancial.service.ts`

### 2. **Added Required 'name' Field**
- Added the `name` field to all CancellationSetting records
- The field is now properly set in both the routes and seed scripts
- Falls back to using the cancellationType as the name if not provided

### 3. **Removed Special Deportation Cost Handling**
- Removed `deportationCost` field from the CancellationSetting model in Prisma schema
- Removed special deportation cost logic from `improvedFinancial.service.ts`
- Deportation costs should now be added as regular costs to applications
- Business logic: When you deport a candidate, you lose money because you can't sell to the client

### 4. **Database Migration**
- Created migration to remove the `deportation_cost` column from the database
- Migration file: `/packages/backend/prisma/migrations/20250906120000_remove_deportation_cost/migration.sql`

### 5. **ESLint Configuration**
- Added `.eslintrc.js` configuration file for the backend
- Configured to work with TypeScript and ignore certain warnings

## How to Apply the Fixes

Run the complete fix script from the root directory:

```bash
.\fix-backend-complete.bat
```

This script will:
1. Run the database migration
2. Regenerate the Prisma client
3. Build TypeScript
4. Clean up temporary files
5. Start the backend server

## Business Logic Clarification

- **Deportation Costs**: These are now regular costs (like tickets) that get added to an application when a candidate is deported. They're not handled specially in refund calculations.
- **Financial Impact**: When you deport a candidate, you incur the cost but can't sell to a client, resulting in a loss.

## Files Modified

- `/packages/backend/src/routes/businessSettings.routes.ts`
- `/packages/backend/src/scripts/seedBusinessSettings.ts`
- `/packages/backend/src/services/improvedFinancial.service.ts`
- `/packages/backend/prisma/schema.prisma`
- `/packages/backend/.eslintrc.js` (created)
- `/package.json` (added helper scripts)

## Next Steps

After running the fix script, the backend should start without TypeScript errors. The system will now properly handle:
- Cancellation settings with correct field names
- Fee components and refund calculations
- Regular cost tracking for deportations
