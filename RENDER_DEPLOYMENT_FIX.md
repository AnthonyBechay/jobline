# Render Deployment Fix

## The Issue
Your Render deployment is stuck at the build command because:
1. The build command is too complex and trying to run migrations during build
2. Migrations should run at startup, not during build
3. The monorepo structure might be causing dependency resolution issues

## Solution

### Option 1: Simplified Build Commands (Recommended)

Update your Render settings:

**Root Directory:** `packages/backend`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:** 
```bash
npm run render-start
```

The `render-start` script in package.json will:
1. Run database migrations
2. Start the server

### Option 2: Skip Migrations During Build

If you want to handle migrations separately:

**Build Command:**
```bash
npm install && npx prisma generate && npm run build
```

**Start Command:**
```bash
npm start
```

Then run migrations manually through Render Shell after deployment:
```bash
npx prisma migrate deploy
```

### Option 3: Use render.yaml (Infrastructure as Code)

1. Commit the `render.yaml` file I created to your repository
2. In Render Dashboard, create a new "Blueprint" 
3. Connect your GitHub repo
4. Render will automatically create services based on render.yaml

## Environment Variables Required

Make sure these are set in Render:

```env
DATABASE_URL=postgresql://[username]:[password]@[host]/[database]?sslmode=require
JWT_SECRET=your-secure-random-string
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend.vercel.app
```

## Debug Steps

If deployment still fails:

1. **Check Render Logs:**
   - Look for specific error messages
   - Check if it's a memory issue (starter plans have 512MB limit)

2. **Test Build Locally:**
   ```bash
   cd packages/backend
   rm -rf node_modules dist
   npm install
   npx prisma generate
   npm run build
   ```

3. **Common Issues:**
   - **Memory:** Build might exceed memory limit. Solution: Upgrade to a paid plan
   - **Timeout:** Build taking too long (>15 mins). Solution: Simplify build steps
   - **Dependencies:** Missing production dependencies. Solution: Move TypeScript to dependencies

## Alternative: Deploy Without Migrations

For first deployment, you can skip migrations:

**Build Command:**
```bash
npm install && npx prisma generate && npm run build
```

**Start Command:**
```bash
node dist/index.js
```

After deployment succeeds:
1. Go to Render Dashboard > Shell
2. Run: `npx prisma migrate deploy`
3. Update start command to include migrations

## Monitoring

After successful deployment:
1. Check health endpoint: `https://your-app.onrender.com/api/health`
2. Monitor logs for any runtime errors
3. Test database connection
