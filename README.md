# Jobline - Recruitment Platform

A comprehensive web application for recruitment agencies in Lebanon specializing in domestic workers.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- PostgreSQL (v12 or higher)

### Installation

1. **Create Database**
   ```bash
   psql -U postgres
   CREATE DATABASE jobline_db;
   \q
   ```

2. **Setup Project**
   ```bash
   node setup.js
   ```

3. **Start Application**
   ```bash
   node start.js
   ```

4. **Initial Setup**
   - Open http://localhost:5173/register
   - Create your first Super Admin account
   - Setup Key: `jobline-setup-2024` (from .env file)

### Access Points
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📁 Project Structure

```
jobline/
├── packages/
│   ├── shared/         # Shared TypeScript types
│   ├── backend/        # Express.js + Prisma + PostgreSQL
│   └── frontend/       # React + Material-UI + Vite
├── setup.js            # Setup script
├── start.js            # Start development servers
├── clean.js            # Clean build artifacts
└── README.md           # This file
```

## 🔧 Scripts

### Main Scripts
- `node setup.js` - Initial setup (install dependencies, setup database)
- `node start.js` - Start development servers
- `node clean.js` - Clean all build artifacts and dependencies

### Backend Commands (from packages/backend)
```bash
npm run dev              # Start development server
npm run build            # Build for production
npx prisma studio        # Database GUI
npx prisma migrate dev   # Run migrations
```

### Frontend Commands (from packages/frontend)
```bash
npm run dev              # Start development server
npm run build            # Build for production
```

## 👥 User Management

### First Time Setup
1. Use the `/register` page to create the first Super Admin
2. Requires a setup key from the `.env` file
3. Only works when no users exist in the database

### User Roles
- **Super Admin**: Full system access, financial data, user management
- **Admin**: Operational access, no financial data

### Creating Additional Users
- Super Admins can create new users from Settings > Users
- Both Admin and Super Admin roles can be assigned

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
- No login required

## 🔐 Security

### Environment Variables
Update `.env` file in `packages/backend/`:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/jobline_db"
JWT_SECRET=your-super-secret-jwt-key
SETUP_KEY=your-setup-key
```

### Production Security
- Change all default passwords
- Use strong JWT_SECRET
- Update SETUP_KEY
- Enable HTTPS
- Configure CORS properly

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions to:
- Render (Backend)
- Vercel (Frontend)

## 🔨 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U postgres -c "\l"

# Recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS jobline_db;"
psql -U postgres -c "CREATE DATABASE jobline_db;"
```

### Port Issues
- Backend: Port 5000
- Frontend: Port 5173
- Kill processes using these ports or change in config

### Build Issues
```bash
# Clean everything and start fresh
node clean.js
node setup.js
```

## 📄 License

Private - All rights reserved
