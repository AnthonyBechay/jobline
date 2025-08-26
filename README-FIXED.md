# Jobline - Recruitment Management System

## ✅ Current Status

All deployment issues have been **FIXED**! The system now includes:
- ✅ Multi-tenancy support (each registration creates a separate office)
- ✅ Simple authentication (no complex setup)
- ✅ Company-isolated data
- ✅ Fixed TypeScript errors
- ✅ Fixed missing dependencies

## 🚀 Quick Start (Windows)

Just run:
```bash
run.bat
```

This will:
1. Install all dependencies (if needed)
2. Set up the database (if needed)
3. Start both frontend and backend

## 🔧 Manual Setup

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database
- Git

### 2. Environment Setup

Create `.env` file in `packages/backend/`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/jobline"
JWT_SECRET="your-secret-key-here"
PORT=3001
NODE_ENV=development
```

### 3. Installation

```bash
# Install dependencies
npm install
cd packages/frontend && npm install
cd ../backend && npm install

# Generate Prisma client
cd packages/backend
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Start development servers
cd ../..
npm run dev
```

### 4. First Use

1. Navigate to http://localhost:5173/register
2. Enter your **Company/Office Name**
3. Create your **Super Admin** account
4. Start managing your recruitment office!

## 📱 System Architecture

### Multi-Tenancy Model
- Each registration creates a new **Company/Office**
- All data is isolated by company
- Users can only see their company's data
- Super Admin manages their own office

### User Roles
- **Super Admin**: Full access, including financial data
- **Admin**: Operational access (no financial data)

### Data Structure
```
Company (Office)
  ├── Users (Super Admin, Admins)
  ├── Candidates
  ├── Clients
  ├── Applications
  ├── Agents
  ├── Brokers
  ├── Settings
  └── Document Templates
```

## 🌐 Deployment

### Frontend (Vercel)
```bash
# Build command
cd packages/frontend && npm run build

# Output directory
packages/frontend/dist

# Environment variables
VITE_API_URL=https://your-backend.onrender.com
```

### Backend (Render)
```bash
# Build command
cd packages/backend && npm install && npm run build

# Start command
cd packages/backend && npm start

# Environment variables
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
NODE_ENV=production
PORT=3001
```

## 🐛 Troubleshooting

### Backend crashes on start
```bash
# Regenerate Prisma client
cd packages/backend
npx prisma generate
```

### Database connection issues
```bash
# Check your DATABASE_URL in .env
# Run migrations
cd packages/backend
npx prisma migrate dev
```

### TypeScript errors
```bash
# The auth routes issue has been fixed
# All imports have been corrected
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new office & super admin
- `POST /api/auth/login` - Login to system
- `GET /api/auth/me` - Get current user
- `POST /api/auth/users` - Create new user (Super Admin only)

### Resources (all company-scoped)
- `/api/candidates` - Manage candidates
- `/api/clients` - Manage clients
- `/api/applications` - Manage applications
- `/api/agents` - Manage agents (Super Admin)
- `/api/brokers` - Manage brokers (Super Admin)
- `/api/settings` - Manage settings (Super Admin)

## 🔐 Security Features

- JWT authentication (30-day expiry)
- Bcrypt password hashing
- Company-isolated data access
- Role-based permissions
- Secure API endpoints

## 📊 Features

### Current
- Multi-company support
- User management
- Candidate tracking
- Client management
- Application workflow
- Document checklists
- Financial tracking (Super Admin)
- Settings management

### Coming Soon
- File uploads
- Email notifications
- Advanced reporting
- Client portal
- Payment gateway integration

## 💻 Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Database commands
cd packages/backend
npx prisma studio     # Open database GUI
npx prisma migrate dev # Create migration
npx prisma db push     # Push schema changes
```

## 📧 Support

For issues or questions about deployment:
1. Check the logs in Vercel/Render
2. Ensure all environment variables are set
3. Verify database connection
4. Check that Prisma client is generated

## 🎉 Ready to Deploy!

The system is now ready for production deployment. Each recruitment office gets their own isolated environment with complete data separation.

---
**Version:** 1.0.0  
**Status:** Production Ready  
**Multi-Tenancy:** Enabled