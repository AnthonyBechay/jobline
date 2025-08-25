# Jobline Deployment Guide

## Prerequisites
- Node.js 18+ installed locally
- npm 9+ installed locally
- Git repository on GitHub
- Vercel account (for frontend)
- Render account (for backend)
- PostgreSQL database (provided by Render)

## Local Development Setup

### 1. Initial Setup
```bash
# Clone the repository
git clone https://github.com/AnthonyBechay/jobline.git
cd jobline

# Install dependencies
npm install

# Build shared package
npm run build:shared

# Setup backend environment
cd packages/backend
cp .env.example .env
# Edit .env with your local database credentials

# Run database migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed

cd ../..
```

### 2. Running Locally
```bash
# From root directory
npm run dev

# This will start:
# - Backend on http://localhost:5000
# - Frontend on http://localhost:3000
```

## Production Deployment

### Backend Deployment (Render)

#### 1. Create PostgreSQL Database on Render
1. Log into Render Dashboard
2. Create New > PostgreSQL
3. Configure:
   - Name: `jobline-db`
   - Database: `jobline`
   - User: `jobline`
   - Region: Choose nearest to you
4. Wait for database to be created
5. Copy the **Internal Database URL** (starts with `postgresql://`)

#### 2. Deploy Backend to Render
1. Create New > Web Service
2. Connect your GitHub repository
3. Configure:
   - Name: `jobline-backend`
   - Region: Same as database
   - Branch: `master` or `main`
   - Root Directory: `packages/backend`
   - Runtime: Node
   - Build Command: `cd ../.. && npm install && npm run build:shared && cd packages/backend && npm run build && npx prisma generate && npx prisma migrate deploy`
   - Start Command: `npm start`
   - Instance Type: Free (or as needed)

4. Add Environment Variables:
   ```
   DATABASE_URL=<PostgreSQL Internal URL from step 1>
   JWT_SECRET=<generate a secure random string>
   NODE_ENV=production
   PORT=10000
   ```

5. Deploy and wait for build to complete

6. Copy the deployed URL (e.g., `https://jobline-backend.onrender.com`)

### Frontend Deployment (Vercel)

#### 1. Configure Frontend for Production
1. Update `packages/frontend/.env.production`:
   ```
   VITE_API_URL=https://jobline-backend.onrender.com
   ```

2. Commit and push changes to GitHub

#### 2. Deploy to Vercel
1. Log into Vercel Dashboard
2. Import Project > Import Git Repository
3. Select your GitHub repository
4. Configure:
   - Framework Preset: Vite
   - Root Directory: `packages/frontend`
   - Build Command: `cd ../.. && npm install && npm run build:shared && cd packages/frontend && npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. Add Environment Variables:
   ```
   VITE_API_URL=https://jobline-backend.onrender.com
   ```

6. Deploy

## Troubleshooting

### White Page Issue (Local)
If you see a white page locally:
1. Check browser console for errors
2. Ensure backend is running on port 5000
3. Verify database connection
4. Check that shared package is built: `npm run build:shared`

### Deployment Build Failures

#### Backend (Render)
If build fails with TypeScript errors:
1. Ensure all type packages are in dependencies (not devDependencies)
2. The tsconfig.json has been updated to include DOM types
3. Check that shared package builds first

#### Frontend (Vercel)
If build fails with missing modules:
1. Ensure shared package is built in build command
2. Check that all required packages are in dependencies
3. Verify environment variables are set

### CORS Issues
If you get CORS errors in production:
1. Verify backend CORS configuration includes frontend URL
2. Check that API calls use the correct production URL
3. Ensure cookies have proper SameSite settings

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/jobline

# JWT
JWT_SECRET=your-secret-key-here

# Environment
NODE_ENV=development
PORT=5000

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```env
# API URL (only used in production builds)
VITE_API_URL=http://localhost:5000
```

## First User Setup

After deployment, create the first Super Admin user:

1. Access the backend logs on Render
2. The seed script should have created a default admin
3. Default credentials (CHANGE IMMEDIATELY):
   - Email: admin@jobline.com
   - Password: Admin123!

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET
- [ ] Enable HTTPS on both frontend and backend
- [ ] Configure proper CORS origins
- [ ] Set secure cookie settings for production
- [ ] Review and update security headers
- [ ] Enable rate limiting on API
- [ ] Set up monitoring and logging
- [ ] Configure automated backups for database

## Monitoring

### Render (Backend)
- Check Logs tab for application logs
- Monitor Metrics tab for performance
- Set up health checks

### Vercel (Frontend)
- Use Analytics tab for performance metrics
- Check Functions tab for API route logs
- Monitor Build logs for deployment issues

## Updates and Maintenance

### Updating Dependencies
```bash
# From root directory
npm update
npm audit fix
```

### Database Migrations
```bash
# Create new migration
cd packages/backend
npx prisma migrate dev --name migration_name

# Deploy to production
npx prisma migrate deploy
```

## Support

For issues:
1. Check deployment logs
2. Verify environment variables
3. Test API endpoints directly
4. Check browser console for frontend errors
5. Review this guide for common issues
