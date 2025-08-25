# Deployment Guide for Jobline

## Backend Deployment on Render

### Step 1: Prepare Backend for Deployment

1. Make sure your backend package.json has these scripts:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "postinstall": "prisma generate"
  }
}
```

2. Ensure TypeScript dependencies are in regular dependencies (not devDependencies) for build:
```json
{
  "dependencies": {
    "typescript": "^5.3.2",
    "@types/node": "^20.10.0"
  }
}
```

### Step 2: Configure Render

1. **Create New Web Service on Render**
   - Connect your GitHub repository
   - Root Directory: `packages/backend`
   - Build Command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
   - Start Command: `npm start`

2. **Add Environment Variables in Render Dashboard:**
```env
DATABASE_URL=postgresql://your_db_user:your_db_password@your_db_host/your_db_name
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend.vercel.app
```

3. **Create PostgreSQL Database on Render:**
   - Go to Dashboard > New > PostgreSQL
   - Copy the Internal Database URL
   - Use it as DATABASE_URL in your web service

### Step 3: Initial Database Setup

After first deployment, run these commands in Render Shell:
```bash
npx prisma migrate deploy
npx ts-node src/seed/seed-simple.ts
```

---

## Frontend Deployment on Vercel

### Step 1: Prepare Frontend

1. The shared types are now copied into `src/shared/` folder
2. All imports use `@jobline/shared` which resolves to local folder

### Step 2: Configure Vercel

1. **Import Project on Vercel**
   - Connect your GitHub repository
   - Root Directory: `packages/frontend`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

2. **Add Environment Variables in Vercel:**
```env
VITE_API_URL=https://your-backend.onrender.com
```

3. **Deploy Settings:**
   - Node.js Version: 18.x
   - Install Command: `npm install`

---

## Post-Deployment Checklist

### Backend (Render):
- [ ] Database is connected and migrations ran
- [ ] Seed data is loaded
- [ ] API endpoint is accessible at `/api/health`
- [ ] CORS is configured for frontend URL

### Frontend (Vercel):
- [ ] Environment variable VITE_API_URL points to Render backend
- [ ] Login page loads without errors
- [ ] API calls work (test login)

---

## Common Issues and Solutions

### Backend Issues:

**Issue: TypeScript compilation errors**
Solution: Move TypeScript and @types/node to regular dependencies:
```bash
npm install typescript @types/node
```

**Issue: Prisma Client not generated**
Solution: Add postinstall script:
```json
"postinstall": "prisma generate"
```

**Issue: Database connection failed**
Solution: Check DATABASE_URL format and ensure database exists

### Frontend Issues:

**Issue: Cannot find module '@jobline/shared'**
Solution: Shared types are copied to src/shared/, imports are aliased in vite.config.ts

**Issue: API calls fail**
Solution: Check VITE_API_URL environment variable and CORS settings

**Issue: Build fails with TypeScript errors**
Solution: Set noUnusedLocals and noUnusedParameters to false in tsconfig.json

---

## Update Workflow

### To Update Backend:
1. Push changes to GitHub
2. Render auto-deploys from main branch
3. Run migrations if schema changed: `npx prisma migrate deploy`

### To Update Frontend:
1. Push changes to GitHub
2. Vercel auto-deploys from main branch
3. Clear browser cache if needed

---

## Security Reminders

1. **Never commit .env files**
2. **Use strong JWT_SECRET in production**
3. **Enable HTTPS on both frontend and backend**
4. **Restrict CORS to your frontend domain only**
5. **Use environment variables for all sensitive data**
6. **Regular database backups**
