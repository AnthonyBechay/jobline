# Jobline Recruitment Platform

A comprehensive web application for recruitment agencies in Lebanon specializing in domestic workers. The platform manages the entire recruitment lifecycle from candidate selection to post-placement management.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+
- Git

### Installation

1. Clone the repository:
```bash
cd C:\Users\User\Desktop\wealthlogs\jobline
```

2. Install dependencies:
```bash
npm install
```

3. Set up PostgreSQL database:
   - Create a new database named `jobline_db`
   - Update the connection string in `packages/backend/.env`

4. Copy environment variables:
```bash
cd packages/backend
copy .env.example .env
```

5. Update the `.env` file with your database credentials:
```
DATABASE_URL="postgresql://username:password@localhost:5432/jobline_db?schema=public"
```

6. Run database migrations:
```bash
npm run db:migrate
```

7. Seed the database with initial data:
```bash
npm run db:seed
```

8. Start the development servers:
```bash
# From the root directory
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📁 Project Structure

```
jobline/
├── packages/
│   ├── backend/        # Node.js/Express API with Prisma ORM
│   ├── frontend/       # React application with Material-UI
│   └── shared/         # Shared TypeScript types and constants
├── docs/              # Documentation and requirements
└── package.json       # Root monorepo configuration
```

## 🔐 Default Login Credentials

After seeding the database, you can login with:

- **Super Admin (Owner)**
  - Email: owner@jobline.lb
  - Password: admin123

- **Admin (Secretary)**
  - Email: secretary@jobline.lb
  - Password: secretary123

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Material-UI, Vite
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Deployment**: Vercel (frontend), Render (backend)

## 📚 Features

### User Roles & Permissions

1. **Super Admin** (Agency Owner)
   - Full system access
   - Financial management (costs, profitability)
   - User management
   - Settings configuration
   - Agent & Broker management

2. **Admin** (Office Secretary)
   - Manage clients, candidates, applications
   - Record payments (revenue only)
   - Update application statuses
   - Generate client share links

3. **Client** (Employer)
   - View application status via unique link
   - Check document requirements
   - View payment history

### Core Modules

- **Dashboard**: Overview of pending tasks, application pipeline, financial summary
- **Candidate Management**: Track workers from sourcing to placement
- **Client Management**: Manage employers and referral tracking
- **Application Tracker**: Central workflow management system
- **Financial Module**: Revenue, costs, and profitability tracking
- **Document Management**: Dynamic checklists per application stage
- **Settings**: System configuration and document templates

## 🚦 Application Workflow

### New Candidate Process
1. Selection → MoL Pre-Authorization → Visa Application → Worker Arrival → Post-Arrival Paperwork → Active Employment → Renewal

### Guarantor Change Process
1. Return → Reassignment → Change of Guarantor/Post-Arrival Paperwork → Active Employment

## 📝 Development Commands

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only

# Build
npm run build           # Build all packages

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run db:reset        # Reset database

# Testing
npm run test            # Run tests
npm run lint            # Run linter
```

## 🌐 API Documentation

The backend API is available at `http://localhost:5000/api`

Main endpoints:
- `/api/auth` - Authentication
- `/api/candidates` - Candidate management
- `/api/clients` - Client management
- `/api/applications` - Application tracking
- `/api/payments` - Payment recording
- `/api/costs` - Cost tracking (Super Admin only)
- `/api/dashboard` - Dashboard statistics
- `/api/public/status/:shareableLink` - Public client status page

## 🚀 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set the root directory to `packages/frontend`
3. Set build command: `npm run build`
4. Set output directory: `dist`

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set root directory to `packages/backend`
4. Set build command: `npm install && npm run build`
5. Set start command: `npm start`
6. Add PostgreSQL database
7. Set environment variables

## 📄 License

This project is proprietary software for internal use only.

## 👥 Support

For support and questions, please contact the development team.
