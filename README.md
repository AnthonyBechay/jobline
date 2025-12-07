# Jobline - Modern Recruitment Platform

A comprehensive recruitment management platform built with Next.js 15, Drizzle ORM, and modern web technologies.

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.7 (Strict Mode)
- **UI Components**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS 3.4
- **Forms**: React Hook Form + Zod
- **Tables**: TanStack Table
- **Charts**: Recharts
- **Date Handling**: date-fns
- **State Management**: Server Actions + React Server Components

### Backend
- **Runtime**: Node.js 20+
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM 0.36
- **Authentication**: Better-Auth 1.4
- **File Storage**: Cloudflare R2 (S3-compatible)
- **PDF Generation**: React-PDF (@react-pdf/renderer)
- **Validation**: Zod

### DevOps
- **Package Manager**: pnpm
- **Containerization**: Docker + Docker Compose
- **Deployment**: Coolify-ready
- **Build Output**: Standalone (optimized for production)

## ✨ Features

- ✅ Multi-tenant support with company isolation
- ✅ Role-based access control (Super Admin, Admin)
- ✅ Candidate management
- ✅ Client management
- ✅ Application tracking
- ✅ Document management with R2 storage
- ✅ Financial tracking (payments, costs, fees)
- ✅ Guarantor change workflows
- ✅ PDF generation for reports
- ✅ Real-time data with Server Components
- ✅ Responsive design (mobile-friendly)
- ✅ Dark mode support

## 📋 Getting Started

### Prerequisites

- Node.js 20+ and pnpm 10+
- PostgreSQL database
- Cloudflare R2 bucket (or S3-compatible storage)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd jobline
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/jobline_db"

# Better-Auth
BETTER_AUTH_SECRET="generate-with: openssl rand -base64 32"
BETTER_AUTH_URL="http://localhost:3000"

# Cloudflare R2
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="jobline-files"
R2_PUBLIC_URL="https://your-bucket.r2.dev"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

4. **Set up the database**

```bash
# Generate Drizzle client
pnpm db:generate

# Run migrations
pnpm db:push

# (Optional) Seed database
pnpm db:seed
```

5. **Run development server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗂️ Project Structure

```
jobline/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Dashboard pages
│   │   ├── candidates/
│   │   ├── clients/
│   │   ├── applications/
│   │   ├── documents/
│   │   ├── financial/
│   │   └── settings/
│   ├── api/                 # API routes
│   │   ├── auth/
│   │   └── upload/
│   ├── actions/             # Server Actions
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                  # Shadcn components
│   ├── forms/               # Reusable form components
│   ├── tables/              # Data table components
│   └── layouts/             # Layout components
├── lib/
│   ├── db/
│   │   ├── schema.ts        # Drizzle schema (24 tables)
│   │   └── index.ts         # DB client
│   ├── validations/         # Zod schemas
│   ├── auth.ts              # Better-Auth config
│   ├── auth-client.ts       # Client auth hooks
│   ├── auth-utils.ts        # Auth utilities
│   ├── storage.ts           # R2 storage client
│   └── utils.ts             # Utility functions
├── Dockerfile
├── docker-compose.yml
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## 🛠️ Development Scripts

```bash
# Development
pnpm dev                 # Start dev server
pnpm build               # Build for production
pnpm start               # Start production server
pnpm lint                # Run ESLint
pnpm type-check          # TypeScript type checking

# Database
pnpm db:generate         # Generate Drizzle migrations
pnpm db:migrate          # Apply migrations
pnpm db:push             # Push schema to database
pnpm db:studio           # Open Drizzle Studio
pnpm db:seed             # Seed database
```

## 🐳 Docker Deployment

### Using Docker Compose (Development/Testing)

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

### Using Dockerfile (Production)

```bash
# Build image
docker build -t jobline:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e BETTER_AUTH_SECRET="your-secret" \
  -e R2_ACCOUNT_ID="your-r2-account" \
  # ... other env vars
  jobline:latest
```

### Deploying to Coolify

1. **Push to Git repository**
2. **In Coolify**:
   - Create new resource → Docker Compose
   - Connect your repository
   - Add environment variables
   - Deploy

Coolify will automatically:
- Build the Docker image
- Run database migrations
- Start the application
- Set up reverse proxy with SSL

## 🔐 Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `BETTER_AUTH_SECRET` | Secret for auth tokens | Generate with `openssl rand -base64 32` |
| `R2_ACCOUNT_ID` | Cloudflare account ID | `abc123...` |
| `R2_ACCESS_KEY_ID` | R2 access key | `xyz789...` |
| `R2_SECRET_ACCESS_KEY` | R2 secret key | `secret123...` |
| `R2_BUCKET_NAME` | R2 bucket name | `jobline-files` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `BETTER_AUTH_URL` | App URL for auth | `http://localhost:3000` |
| `R2_PUBLIC_URL` | Public URL for R2 bucket | - |
| `MAX_FILE_SIZE` | Max upload size in bytes | `10485760` (10MB) |

## 📊 Database Schema

The application uses Drizzle ORM with PostgreSQL. Key tables include:

- `companies` - Multi-tenant company data
- `users` - User accounts with roles
- `candidates` - Recruitment candidates
- `clients` - Client companies
- `applications` - Job applications linking candidates and clients
- `payments` - Payment tracking
- `costs` - Expense tracking
- `files` - File metadata
- `fee_templates` - Fee structures
- And 15+ more tables for comprehensive functionality

### Database Migrations

When you modify the schema:

```bash
# 1. Update lib/db/schema.ts

# 2. Generate migration
pnpm db:generate

# 3. Apply migration
pnpm db:migrate

# OR push directly (dev only)
pnpm db:push
```

## 🔒 Authentication

The app uses Better-Auth with custom user schema:

- Email/password authentication
- Session-based auth with cookies
- Role-based access control
- Multi-tenant support via `companyId`

### Auth Utilities

```typescript
import { requireAuth, requireSuperAdmin } from '@/lib/auth-utils';

// Protect routes/actions
const { user } = await requireAuth();

// Require specific role
const { user } = await requireSuperAdmin();
```

## 📁 File Uploads

Files are stored in Cloudflare R2:

```typescript
import { uploadToR2 } from '@/lib/storage';

// Upload file
const result = await uploadToR2(file, 'candidates');
// Returns: { key, url, publicUrl }
```

## 🧪 Testing

```bash
# Run tests (when implemented)
pnpm test

# Type check
pnpm type-check

# Lint
pnpm lint
```

## 🚀 Production Deployment Checklist

- [ ] Update all environment variables with production values
- [ ] Generate strong `BETTER_AUTH_SECRET`
- [ ] Configure production database
- [ ] Set up Cloudflare R2 bucket
- [ ] Configure domain and SSL
- [ ] Run database migrations
- [ ] Test authentication flow
- [ ] Test file uploads
- [ ] Set up database backups
- [ ] Configure monitoring and logging

## 📝 Contributing

1. Create a feature branch
2. Make changes
3. Run `pnpm type-check` and `pnpm lint`
4. Create pull request

## 📄 License

Proprietary - All rights reserved

## 🤝 Support

For issues or questions, contact your development team.

---

Built with ❤️ using Next.js 15 and modern web technologies.
