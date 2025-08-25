# Jobline - Recruitment Platform

A comprehensive web application for recruitment agencies in Lebanon specializing in domestic workers.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- PostgreSQL (v12 or higher)

### Database Setup

1. **Create PostgreSQL Database**
   ```bash
   psql -U postgres
   CREATE DATABASE jobline_db;
   \q
   ```

2. **Configure Environment**
   
   Make sure your `.env` file in `packages/backend/` has:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/jobline_db?schema=public"
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

### Installation & Setup

1. **Quick Fix (if you're having issues)**
   ```bash
   node fix.js
   ```

2. **Full Setup (first time)**
   ```bash
   # Install dependencies
   npm install
   cd packages/shared && npm install && npm run build && cd ../..
   cd packages/backend && npm install && cd ../..
   cd packages/frontend && npm install && cd ../..
   
   # Setup database
   cd packages/backend
   npx prisma generate
   npx prisma migrate dev --name init
   npm run db:seed:simple
   cd ../..
   ```

3. **Start the Application**

   **Windows:**
   ```bash
   start-windows.bat
   ```
   
   **Or using Node:**
   ```bash
   node start.js
   ```

   **Or manually:**
   ```bash
   # Terminal 1 - Backend
   cd packages/backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd packages/frontend
   npm run dev
   ```

4. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### Login Credentials

**Super Admin** (Full access including financial data):
- Email: admin@jobline.com
- Password: admin123

**Admin** (Operational access, no financial data):
- Email: secretary@jobline.com
- Password: secretary123

## 🔨 Troubleshooting

### White Screen / Module Errors

If you see errors about missing exports or white screen:

1. **Rebuild shared package:**
   ```bash
   cd packages/shared
   npm run build
   ```

2. **Clear Vite cache:**
   ```bash
   cd packages/frontend
   rm -rf node_modules/.vite
   ```

3. **Restart services**

### Database Connection Issues

1. **Make sure PostgreSQL is running:**
   ```bash
   # Windows
   net start postgresql-x64-14
   
   # Linux/Mac
   sudo service postgresql start
   ```

2. **Check your credentials in .env file**

3. **Recreate database if needed:**
   ```bash
   psql -U postgres -c "DROP DATABASE IF EXISTS jobline_db;"
   psql -U postgres -c "CREATE DATABASE jobline_db;"
   cd packages/backend
   npx prisma migrate dev --name init
   npm run db:seed:simple
   ```

### Port Already in Use

- Backend runs on port 5000
- Frontend runs on port 5173

Kill processes using these ports or change them in the configuration files.

## 📁 Project Structure

```
jobline/
├── packages/
│   ├── shared/         # Shared TypeScript types and constants
│   ├── backend/        # Express.js backend with Prisma & PostgreSQL
│   └── frontend/       # React frontend with Material-UI & Vite
├── start.js            # Development server launcher
├── start-windows.bat   # Windows batch file to start services
├── fix.js              # Quick fix script for common issues
└── README.md           # This file
```

## 📋 Features

### For Super Admin
- Full system access
- Financial management (costs, profits)
- User management
- Agent & Broker management
- System settings
- All reports and analytics

### For Admin
- Candidate management
- Client management
- Application tracking
- Payment recording (revenue only)
- Document checklist management
- Operational reports

### For Clients
- View application status via shareable link
- See required documents
- Track payment history
- No login required (access via unique link)

## 🔐 Security Notes

- Default credentials are for development only
- Change all passwords in production
- Update JWT_SECRET in production
- Use HTTPS in production
- Configure proper CORS origins
- Use environment variables for sensitive data

## 🛠️ Common Commands

### Backend Commands (from packages/backend)
```bash
npm run dev              # Start backend in development mode
npm run build            # Build for production
npx prisma studio        # Open Prisma Studio (database GUI)
npx prisma migrate dev   # Run migrations
npm run db:seed:simple   # Seed with sample data
npm run db:reset         # Reset database (WARNING: deletes all data)
```

### Frontend Commands (from packages/frontend)
```bash
npm run dev              # Start frontend in development mode
npm run build            # Build for production
npm run preview          # Preview production build
```

### Shared Package Commands (from packages/shared)
```bash
npm run build            # Build TypeScript to JavaScript
npm run dev              # Build in watch mode
```

## 📄 License

Private - All rights reserved

## 👥 Support

For issues or questions, please contact the development team.
