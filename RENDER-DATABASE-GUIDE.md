# 🚀 Render Database Management Guide

## 📊 Current Situation
Your local database has schema issues. The **SAME issues will occur on Render** when you deploy.

## 🔍 Check Render Database Status

### Method 1: Via Render Dashboard
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your PostgreSQL database
3. Go to "Shell" tab
4. Run:
```bash
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'cancellation_settings';"
```

### Method 2: Connect Locally
```bash
# Get your External Database URL from Render
psql "postgresql://user:pass@host.render.com/dbname" -c "\d cancellation_settings"
```

## 🛠️ Fix Render Database

### **Option 1: Safe Production Fix (Recommended)**

1. **Add to package.json:**
```json
{
  "scripts": {
    "fix:render-db": "ts-node src/scripts/fixRenderDatabase.ts",
    "migrate:prod": "prisma migrate deploy",
    "db:push:prod": "prisma db push"
  }
}
```

2. **Set Environment Variable on Render:**
   - Go to Environment tab
   - Add: `DATABASE_URL` (already there)
   - Add: `NODE_ENV=production`

3. **Run via Render Shell:**
```bash
cd packages/backend
npm run fix:render-db
```

### **Option 2: Reset Database (Data Loss!)**

1. **Connect to Render Database:**
```bash
# Use connection string from Render dashboard
psql "your-render-database-url"
```

2. **Drop and Recreate:**
```sql
-- WARNING: This deletes ALL data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
\q
```

3. **Run Migrations:**
```bash
cd packages/backend
DATABASE_URL="your-render-url" npx prisma migrate deploy
DATABASE_URL="your-render-url" npx ts-node src/scripts/seedCompany.ts
```

## 📝 Render Build Configuration

### **Update `render-build.sh`:**
```bash
#!/usr/bin/env bash
# exit on error
set -o errexit

cd packages/backend

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Build TypeScript
npm run build

# Run migrations
npx prisma migrate deploy

# Fix any schema issues
npx ts-node src/scripts/fixRenderDatabase.ts || true

echo "Build complete!"
```

### **Update `render.yaml` (if using):**
```yaml
services:
  - type: web
    name: jobline-backend
    env: node
    region: oregon
    plan: free
    buildCommand: "./packages/backend/render-build.sh"
    startCommand: "cd packages/backend && node dist/index.js"
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: jobline-db
          property: connectionString
      - key: NODE_ENV
        value: production

databases:
  - name: jobline-db
    plan: free
    region: oregon
```

## 🔄 Deployment Workflow

### **Before Each Deploy:**

1. **Test migrations locally:**
```bash
# Use a test database
DATABASE_URL="postgresql://test" npx prisma migrate dev
```

2. **Create migration files:**
```bash
npx prisma migrate dev --name your_change
```

3. **Commit migration files:**
```bash
git add prisma/migrations
git commit -m "feat: add migration for X"
```

4. **Deploy:**
```bash
git push origin main
```

### **After Deploy:**

Check logs on Render:
- Look for "Database fixed successfully!"
- Check for migration errors
- Verify app starts correctly

## 🚨 Emergency Fixes

### **If Render App Crashes:**

1. **Quick Fix via Shell:**
```bash
# In Render Shell
cd packages/backend
npx prisma db push --force-reset
npm run fix:render-db
```

2. **Rollback:**
```bash
# Revert to previous deployment
# Use Render Dashboard > Events > Rollback
```

### **If Database is Corrupted:**

1. **Export data (if possible):**
```bash
pg_dump $DATABASE_URL > backup.sql
```

2. **Reset completely:**
```bash
# In Render Shell
npx prisma migrate reset --force --skip-seed
npx ts-node src/scripts/seedCompany.ts
npx ts-node src/scripts/seedBusinessSettings.ts
```

## 📋 Environment Variables on Render

Required variables:
```env
DATABASE_URL=postgresql://...  # Auto-set by Render
NODE_ENV=production
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-frontend.vercel.app
```

Optional:
```env
SEED_DATABASE=true  # To auto-seed on deploy
DEBUG=prisma:*      # For debugging
```

## 🔧 Monitoring & Maintenance

### **Check Database Health:**
```sql
-- In psql or Render Shell
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### **View Recent Errors:**
```bash
# In Render Shell
tail -n 100 /var/log/app.log | grep ERROR
```

### **Database Backup:**
Render automatically backs up databases daily on paid plans. For free tier:
```bash
# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

## 🎯 Best Practices

1. **Always test migrations locally first**
2. **Keep migration files in git**
3. **Use `migrate deploy` in production, not `db push`**
4. **Have a rollback plan**
5. **Monitor logs after deploy**

## 📊 Current Schema Status Check

Run this to see what needs fixing:
```bash
# Local
npm run diagnose-db

# On Render (via Shell)
cd packages/backend && npx ts-node src/scripts/diagnoseSchema.ts
```

## ✅ Success Verification

After fixing, you should see:
- ✅ App deploys without errors
- ✅ No 500 errors in Business Settings
- ✅ Can create/edit cancellation policies
- ✅ Database queries work

## 🆘 If All Else Fails

1. **Create new database on Render**
2. **Update DATABASE_URL**
3. **Run fresh migrations**
4. **Seed initial data**

This ensures a clean slate with correct schema.

---

**IMPORTANT:** Fix your local database first with `.\FORCE-SYNC-DATABASE.bat`, then deploy to Render. The fix script will handle any remaining issues automatically during deployment.
