# Jobline - Recruitment Platform

A comprehensive web application for recruitment agencies in Lebanon specializing in domestic workers.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose
- PostgreSQL database (can be external or in Docker)

### Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/jobline_db?schema=public

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Setup Key (for initial user registration)
SETUP_KEY=jobline-setup-2024

# Frontend URL (your production domain)
FRONTEND_URL=https://yourdomain.com

# Build Args (for frontend)
VITE_API_URL=/api

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

### Deployment

1. **Build and start the application**
   ```bash
   docker-compose up -d
   ```

2. **View logs**
   ```bash
   docker-compose logs -f
   ```

3. **Stop the application**
   ```bash
   docker-compose down
   ```

### Initial Setup
- Open your frontend URL in a browser
- Navigate to `/register`
- Create your first Super Admin account
- Use the `SETUP_KEY` from your `.env` file

## 📁 Project Structure

```
jobline/
├── packages/
│   ├── shared/              # Shared TypeScript types
│   ├── backend/             # Express.js + Prisma + PostgreSQL
│   │   ├── src/            # Source code
│   │   ├── prisma/         # Database schema and migrations
│   │   └── Dockerfile      # Backend Docker configuration
│   └── frontend/           # React + Material-UI + Vite
│       ├── src/            # Source code
│       └── Dockerfile      # Frontend Docker configuration
├── docker-compose.yml       # Docker Compose configuration
├── .dockerignore           # Docker ignore patterns
└── README.md               # This file
```

## 🔧 Development

### Local Development (without Docker)

#### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- PostgreSQL (v12 or higher)

#### Setup

1. **Create Database**
   ```bash
   psql -U postgres -c "CREATE DATABASE jobline_db;"
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd packages/backend && npm install
   cd ../frontend && npm install
   cd ../shared && npm install
   ```

3. **Setup Environment**
   Create `.env` file in `packages/backend/`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/jobline_db?schema=public"
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   SETUP_KEY=jobline-setup-2024
   FRONTEND_URL=http://localhost:5173
   MAX_FILE_SIZE=5242880
   UPLOAD_DIR=./uploads
   ```

4. **Run Database Migrations**
   ```bash
   npm run db:migrate
   ```

5. **Start Development Servers**
   ```bash
   npm run dev:backend    # Backend on port 5000
   npm run dev:frontend   # Frontend on port 5173
   ```

### Backend Commands
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run db:migrate       # Run database migrations
npm run db:generate      # Generate Prisma client
npm run db:seed          # Seed database
npx prisma studio        # Database GUI
```

### Frontend Commands
```bash
npm run dev              # Start development server
npm run build            # Build for production
```

## 👥 User Management

### First Time Setup
1. Navigate to `/register` on the frontend
2. Create the first Super Admin account
3. Requires the setup key from `.env`
4. Only works when no users exist in the database

### User Roles
- **Super Admin**: Full system access, financial data, user management
- **Admin**: Operational access, no financial data visibility

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

### Production Security Checklist
- [ ] Change all default passwords
- [ ] Use strong, unique JWT_SECRET
- [ ] Update SETUP_KEY to something unique
- [ ] Configure proper DATABASE_URL with strong credentials
- [ ] Enable HTTPS on your domain
- [ ] Configure CORS properly (via FRONTEND_URL)
- [ ] Regularly backup your database
- [ ] Keep dependencies updated

## 🐳 Docker Deployment on Coolify/Hetzner

### Coolify Setup

1. **Connect your Git repository** to Coolify

2. **Set Environment Variables** in Coolify dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `SETUP_KEY`
   - `FRONTEND_URL`
   - `VITE_API_URL`

3. **Deploy** - Coolify will automatically use the `docker-compose.yml`

### Database Migration

Migrations run automatically on container startup. To run manually:

```bash
docker-compose exec backend sh -c "cd packages/backend && npx prisma migrate deploy"
```

## 🔨 Troubleshooting

### Database Connection Issues
```bash
# Check database is accessible
docker-compose exec backend sh -c "cd packages/backend && npx prisma db push"

# View migration status
docker-compose exec backend sh -c "cd packages/backend && npx prisma migrate status"
```

### Container Issues
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart containers
docker-compose restart

# Rebuild containers
docker-compose up -d --build
```

### Port Conflicts
- Backend runs on port 5000 internally
- Frontend runs on port 80 (nginx)
- Make sure these ports are available or configure different ones in docker-compose.yml

## 📄 License

Private - All rights reserved
