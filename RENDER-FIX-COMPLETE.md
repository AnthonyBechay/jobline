# 🚀 Render Database Fix - Complete Solution

## 📋 Quick Summary

Your Render database will have the same schema issues as your local database. Here's how to fix it:

## 🎯 Automatic Fix (Already Configured)

I've updated your deployment scripts to **automatically fix the database** during deployment:

1. **`render-build.sh`** - Now includes database fix logic
2. **`package.json`** - Added fix scripts to render-build
3. **`fixRenderDatabase.ts`** - Script that fixes schema issues

### Just Deploy and It Works:
```bash
git add .
git commit -m "fix: database schema and render deployment"
git push origin main
```

Render will automatically:
- ✅ Run migrations
- ✅ Fix missing columns
- ✅ Update existing records
- ✅ Verify database works

## 🛠️ Manual Fix (If Needed)

### Option 1: Via Render Shell
1. Go to Render Dashboard → Your Service → Shell
2. Run:
```bash
cd packages/backend
npm run db:fix-render
```

### Option 2: Connect from Local
```bash
# Set your Render database URL
export DATABASE_URL="postgresql://user:pass@host.render.com/db"

# Run fix
cd packages/backend
npm run db:fix-render
```

### Option 3: Direct SQL
1. Get connection string from Render
2. Connect with psql:
```bash
psql "your-render-database-url"
```
3. Run:
```sql
-- Add missing columns
ALTER TABLE cancellation_settings 
ADD COLUMN IF NOT EXISTS non_refundable_components JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';

-- Update existing records
UPDATE cancellation_settings 
SET non_refundable_components = '[]'::jsonb 
WHERE non_refundable_components IS NULL;

UPDATE cancellation_settings 
SET name = cancellation_type 
WHERE name IS NULL OR name = '';

-- Remove deprecated columns
ALTER TABLE cancellation_settings 
DROP COLUMN IF EXISTS deportation_cost;
```

## 📊 What Gets Fixed

| Issue | Fix |
|-------|-----|
| Missing `non_refundable_components` | Added as JSONB with `[]` default |
| Missing `name` column | Added with type-based defaults |
| Deprecated `deportation_cost` | Removed |
| NULL values | Updated with proper defaults |

## 🔍 Verify Fix Worked

### Check via Render Logs
Look for these messages:
- "✓ Database connection successful"
- "✓ Database is working! Found X settings"
- "Build completed successfully!"

### Check via Application
1. Open your deployed app
2. Go to Business Settings
3. Should load without 500 errors

### Check via Shell
```bash
# In Render Shell
cd packages/backend
npm run db:diagnose
```

## 🚨 Troubleshooting

### If Deploy Fails:

1. **Check logs:**
   - Render Dashboard → Logs
   - Look for database errors

2. **Reset database (nuclear option):**
```bash
# In Render Shell
npx prisma migrate reset --force --skip-seed
npm run seed:all
```

3. **Force sync:**
```bash
# In Render Shell
npx prisma db push --force-reset
```

### If Business Settings Still Fails:

1. **Clear and reseed:**
```bash
# In Render Shell
npx ts-node -e "
const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.cancellationSetting.deleteMany().then(() => {
  console.log('Cleared settings');
  return p.$disconnect();
});
"
npm run seed:settings
```

2. **Check company exists:**
```bash
npx ts-node -e "
const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.company.findFirst().then(c => {
  console.log('Company:', c);
  return p.$disconnect();
});
"
```

## 📝 Environment Variables

Make sure these are set in Render:

```env
DATABASE_URL=internal://...  # Auto-set by Render
NODE_ENV=production
JWT_SECRET=your-secret
```

## 🔄 Future Deployments

The fix is now automatic. Every deployment will:
1. Try to run migrations
2. If migrations fail, fix schema
3. Verify database works
4. Continue with deployment

## ✅ Success Checklist

After deployment, verify:
- [ ] No migration errors in logs
- [ ] "Database connection successful" in logs
- [ ] App starts without crashes
- [ ] Business Settings page loads
- [ ] Can create/edit cancellation policies
- [ ] No 500 errors in browser

## 📚 Scripts Reference

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `npm run db:fix-render` | Fix schema issues | When database is broken |
| `npm run db:diagnose` | Check schema status | To see what's wrong |
| `npm run db:migrate:deploy` | Run migrations | Normal deployment |
| `npm run db:push` | Force sync schema | When migrations fail |
| `npm run seed:all` | Add initial data | Fresh database |

## 🎉 Done!

Your Render deployment is now configured to automatically handle database schema issues. Just push your code and everything will work!

---

**Next Step:** 
```bash
git push origin main
```
Then watch the Render logs to confirm the fix worked!
