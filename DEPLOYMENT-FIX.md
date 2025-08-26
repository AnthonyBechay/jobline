# Jobline Deployment Guide

## Quick Fix for Current Deployment Issues

1. **Run the fix script:**
   ```bash
   # On Windows
   fix-deploy.bat
   
   # Or manually
   node fix-deployment.js
   cd packages/frontend
   npm install
   ```

2. **Commit and push changes:**
   ```bash
   git add -A
   git commit -m "Fix deployment issues and simplify authentication"
   git push
   ```

3. **Vercel will automatically deploy the changes**

## Authentication System

### How it works:
- **Registration**: Creates a SUPER_ADMIN account by default
- **Login**: Simple email/password authentication
- **User Management**: Super Admin can add other users from the Users page

### First Time Setup:
1. Go to `/register`
2. Create your Super Admin account
3. Login with your credentials
4. From the dashboard, go to Users page to add other team members

### Environment Variables

Make sure these are set in Vercel:

**Frontend (Vercel):**
```
VITE_API_URL=https://your-backend.onrender.com
```

**Backend (Render):**
```
DATABASE_URL=your-postgres-connection-string
JWT_SECRET=your-secret-key-here
PORT=3001
NODE_ENV=production
```

## Deployment Status

### Frontend (Vercel)
- URL: Your Vercel URL
- Auto-deploys from GitHub main/master branch
- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `packages/frontend`

### Backend (Render)
- URL: Your Render URL  
- Auto-deploys from GitHub main/master branch
- Build command: `cd packages/backend && npm install && npm run build`
- Start command: `cd packages/backend && npm start`

## Troubleshooting

### If deployment fails:

1. **Check Vercel logs** for specific errors
2. **Ensure all dependencies are installed:**
   ```bash
   cd packages/frontend
   npm install
   ```

3. **Ensure imports are correct:**
   - Frontend should import from `../shared/types` not `@jobline/shared`
   - All UI component dependencies should be installed

4. **Test locally first:**
   ```bash
   npm run dev
   ```

### Common Issues:

1. **"Cannot find module 'class-variance-authority'"**
   - Run: `cd packages/frontend && npm install class-variance-authority tailwind-merge`

2. **"Type 'SUPER_ADMIN' is not assignable"**
   - Make sure to use `UserRole.SUPER_ADMIN` instead of string literals

3. **Auth not working:**
   - Check JWT_SECRET is set in backend environment
   - Ensure VITE_API_URL points to correct backend URL

## Security Notes

- JWT tokens expire after 30 days
- Passwords are bcrypt hashed
- Role-based access control (RBAC) implemented
- Super Admin has full access
- Admin has operational access (no financial data)

## Next Steps

After deployment is working:

1. **Set up your database schema:**
   ```bash
   cd packages/backend
   npx prisma migrate deploy
   ```

2. **Create your first Super Admin account:**
   - Navigate to `/register` on your frontend URL
   - Create account (will be Super Admin by default)

3. **Add other users:**
   - Login as Super Admin
   - Go to Users page
   - Add team members as needed

4. **Configure settings:**
   - Go to Settings page (Super Admin only)
   - Set up document templates
   - Configure fees and costs

## Support

For issues, check:
1. Vercel deployment logs
2. Render deployment logs  
3. Browser console for frontend errors
4. Network tab for API errors
