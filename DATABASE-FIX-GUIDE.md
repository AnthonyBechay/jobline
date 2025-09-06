# 🚨 CRITICAL: Database Schema Mismatch - SOLUTION

## The Problem
Your database error shows:
```
The column `cancellation_settings.non_refundable_components` does not exist
```

This means your PostgreSQL database doesn't have the columns that Prisma expects.

## Root Cause
- **Database has old schema**: Missing `non_refundable_components` column
- **Prisma expects new schema**: With `non_refundable_components` as JSONB
- **Result**: 500 errors when trying to query the table

## 🎯 IMMEDIATE FIX - Choose One:

### Option 1: Force Sync (Recommended if data isn't critical)
```bash
.\FORCE-SYNC-DATABASE.bat
```
This will:
- Reset the table to match Prisma schema
- Add all missing columns
- Seed default settings
- **⚠️ May lose existing settings**

### Option 2: Add Missing Columns (Preserves data)
```bash
.\RUN-THIS-FINAL-FIX.bat
```
This will:
- Add `non_refundable_components` column
- Add `name` column
- Keep existing data
- Fix schema without data loss

### Option 3: Diagnose First
```bash
.\diagnose-database.bat
```
This will show you:
- What columns exist
- What columns are missing
- What needs to be fixed

## 📝 Manual SQL Fix (if scripts fail)

Connect to your PostgreSQL database and run:

```sql
-- Add missing columns
ALTER TABLE cancellation_settings 
ADD COLUMN IF NOT EXISTS non_refundable_components JSONB DEFAULT '[]'::jsonb;

ALTER TABLE cancellation_settings 
ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';

-- Update NULL values
UPDATE cancellation_settings 
SET non_refundable_components = '[]'::jsonb 
WHERE non_refundable_components IS NULL;

UPDATE cancellation_settings 
SET name = cancellation_type 
WHERE name IS NULL OR name = '';

-- Make columns required
ALTER TABLE cancellation_settings 
ALTER COLUMN name SET NOT NULL;

-- Remove old columns
ALTER TABLE cancellation_settings 
DROP COLUMN IF EXISTS deportation_cost;
```

Then regenerate Prisma:
```bash
cd packages\backend
npx prisma generate
npm run dev
```

## 🔍 How to Verify It's Fixed

1. Run diagnostic:
   ```bash
   .\diagnose-database.bat
   ```
   Should show: "✅ Query successful!"

2. Check backend:
   ```bash
   cd packages\backend
   npm run dev
   ```
   Should start without errors

3. Test frontend:
   - Open http://localhost:3000
   - Go to Business Settings
   - Should load without 500 errors

## 📊 Expected Database Structure After Fix

| Column | Type | Required |
|--------|------|----------|
| id | TEXT | Yes |
| cancellation_type | TEXT | Yes |
| name | TEXT | Yes |
| penalty_fee | DECIMAL | Yes |
| refund_percentage | DECIMAL | Yes |
| **non_refundable_components** | **JSONB** | **Yes** |
| monthly_service_fee | DECIMAL | Yes |
| max_refund_amount | DECIMAL | No |
| description | TEXT | No |
| active | BOOLEAN | Yes |
| company_id | TEXT | Yes |
| created_at | TIMESTAMP | Yes |
| updated_at | TIMESTAMP | Yes |

## 🚀 Quick Start After Fix

1. **Run the fix:**
   ```bash
   .\FORCE-SYNC-DATABASE.bat
   ```

2. **Start backend:**
   Already starts automatically after fix

3. **Start frontend (in new terminal):**
   ```bash
   cd packages\frontend
   npm run dev
   ```

4. **Test Business Settings:**
   - Navigate to Business Settings
   - Create a new cancellation policy
   - Should work without errors!

## ⚠️ If Still Having Issues

### Check PostgreSQL is running:
```bash
psql -U postgres -c "SELECT version();"
```

### Check connection string in `.env`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/jobline_db"
```

### Nuclear option - Complete reset:
```bash
cd packages\backend
npx prisma migrate reset --force
npx ts-node src/scripts/seedCompany.ts
npx ts-node src/scripts/seedBusinessSettings.ts
```

## ✅ Success Indicators

You'll know it's fixed when:
- `diagnose-database.bat` shows all columns exist
- No errors when starting backend
- Business Settings page loads
- Can create/edit/delete cancellation policies
- No 500 errors in browser console

## 💡 Prevention for Future

Always run migrations when pulling updates:
```bash
cd packages\backend
npx prisma migrate deploy
npx prisma generate
```

---

**RUN `.\FORCE-SYNC-DATABASE.bat` NOW TO FIX EVERYTHING!**
