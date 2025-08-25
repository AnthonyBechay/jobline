# Jobline Recruitment Platform

A comprehensive web application for recruitment agencies in Lebanon specializing in domestic workers. The platform manages the entire recruitment lifecycle from candidate selection to post-placement management.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+

### Installation

1. **Clone and navigate to the project**:
```bash
cd jobline
```

2. **Create PostgreSQL database**:
```sql
CREATE DATABASE jobline_db;
```

3. **Configure environment**:
Create a `.env` file in `packages/backend/` with:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/jobline_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

4. **Run setup script**:
```bash
# Unix/Mac
chmod +x setup.sh
./setup.sh

# Windows
setup.bat
```

5. **Start the application**:
```bash
npm run dev
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database Studio**: `npm run db:studio`

### Default Credentials
- **Super Admin**: owner@jobline.lb / admin123
- **Admin**: secretary@jobline.lb / secretary123

## 📁 Project Structure

```
jobline/
├── packages/
│   ├── backend/        # Express API + Prisma ORM
│   ├── frontend/       # React + Material-UI
│   └── shared/         # Shared TypeScript types
└── docs/              # Requirements documentation
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only

# Build
npm run build           # Build all packages
npm run build:frontend  # Build frontend only
npm run build:backend   # Build backend only

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed initial data
npm run db:reset        # Reset database
npm run db:studio       # Open Prisma Studio

# Maintenance
npm run clean           # Clean all build artifacts
npm run clean:install   # Clean and reinstall
npm run setup          # Full setup (clean, install, migrate, seed)
npm run format         # Format code with Prettier
npm run lint           # Run ESLint
```

## 📚 Features

### Core Modules
- **Dashboard**: Real-time statistics and task overview
- **Candidate Management**: Worker tracking and status management
- **Client Management**: Employer profiles and referral tracking
- **Application Tracker**: Workflow management with document checklists
- **Financial Module**: Revenue, costs, and profitability (Super Admin only)
- **Settings**: System configuration and templates (Super Admin only)

### User Roles
1. **Super Admin**: Full system access including financial data
2. **Admin**: Operational management without financial access
3. **Client**: Public status page via shareable link

### Application Workflow
- **New Candidate**: Selection → MoL Pre-Auth → Visa → Arrival → Paperwork → Employment
- **Guarantor Change**: Return → Reassignment → Transfer → Employment

## 🔧 Technology Stack

- **Frontend**: React, TypeScript, Material-UI, Vite
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Monorepo**: npm workspaces

## 🚀 Deployment

The application is configured for:
- **Frontend**: Vercel deployment
- **Backend**: Render deployment

Configure deployment settings directly through the Vercel and Render dashboards.

## 📝 License

Proprietary software for internal use only.
