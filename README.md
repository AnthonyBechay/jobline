# Jobline Recruitment Platform

A comprehensive web application for recruitment agencies in Lebanon specializing in domestic workers.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- PostgreSQL database

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/AnthonyBechay/jobline.git
   cd jobline
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Backend configuration
   cd packages/backend
   cp .env.example .env
   # Edit .env with your database credentials
   cd ../..
   ```

4. **Setup database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Start the application**
   
   **Windows:**
   ```bash
   # Double-click start.bat
   # OR run:
   npm run dev:windows
   ```
   
   **Mac/Linux:**
   ```bash
   npm run dev
   ```

## 🔗 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/health

## 🔑 Default Credentials

- **Email**: admin@jobline.com
- **Password**: Admin123!

⚠️ **Important**: Change the default password immediately after first login!

## 🛠️ Troubleshooting

### White Page Issue
Run the fix script:
```bash
# Windows
fix-deployment.bat

# Mac/Linux
node fix-deployment.js
```

### Database Connection Error
1. Check PostgreSQL is running
2. Verify credentials in `packages/backend/.env`
3. Run `npm run db:migrate`

### Port Already in Use
1. Frontend (3000): Change in `packages/frontend/vite.config.ts`
2. Backend (5000): Change in `packages/backend/.env`

## 📚 Documentation

- [Full Deployment Guide](DEPLOYMENT.md)
- [Requirements Document](requirements.md)
- [API Documentation](packages/backend/README.md)

## 🏗️ Tech Stack

- **Frontend**: React, TypeScript, Material-UI, Vite
- **Backend**: Node.js, Express, Prisma, PostgreSQL
- **Authentication**: JWT
- **Deployment**: Vercel (Frontend), Render (Backend)

## 📦 Project Structure

```
jobline/
├── packages/
│   ├── backend/       # Express API server
│   ├── frontend/      # React application
│   └── shared/        # Shared types and constants
├── start.bat          # Windows startup script
├── fix-deployment.bat # Windows fix script
└── DEPLOYMENT.md      # Deployment guide
```

## 🚢 Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying to:
- Vercel (Frontend)
- Render (Backend + PostgreSQL)

## 📝 License

Private - All rights reserved

## 👥 Support

For issues or questions, please contact the development team.
