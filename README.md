# Jobline Monorepo (Vercel + Render)

**Frontend:** Next.js (apps/web) → Vercel  
**Backend:** Express + Prisma (apps/api) → Render PostgreSQL

## Deploy quickstart

### 1) Create PostgreSQL (Render)
- Provision a PostgreSQL instance on Render.
- Copy the connection string and ensure SSL is enabled (append `?sslmode=require` if needed).

### 2) Render Web Service (Backend)
- New Web Service from this repo.
- **Root Directory:** `apps/api`
- **Build Command:**
  ```bash
  npm ci
  npx prisma generate --schema=prisma/schema.prisma
  npx prisma migrate deploy --schema=prisma/schema.prisma
  npm run build
  ```
- **Start Command:**
  ```bash
  npm start
  ```
- **Env Vars** (at minimum):
  - `DATABASE_URL` = your Render Postgres URL
  - `JWT_SECRET` = a strong random string
  - `NODE_ENV` = production

### 3) Vercel Project (Frontend)
- Import the same GitHub repo into Vercel.
- **Root Directory:** `apps/web`
- **Build Command:** `npm run build`
- **Install Command:** `npm ci`
- **Output Directory:** `.next`
- **Env Vars:**
  - `NEXT_PUBLIC_API_URL` = your Render backend URL (e.g., https://jobline-api.onrender.com)

### 4) First-time DB migrate + seed (optional)
- You can run from your local machine (connected to Render DB):
  ```bash
  cd apps/api
  DATABASE_URL=... npx prisma migrate deploy
  DATABASE_URL=... node prisma/seed.js
  ```

### 5) Logins
- Super Admin: `owner@jobline.local` / `admin123`
- Admin: `admin@jobline.local` / `admin123`

---

## Notes
- The Prisma schema is exactly as provided.
- Admins cannot access Cost endpoints or data. Server-side RBAC enforced.
- Public client status page at `/s/[token]` on the frontend calls `/public/applications/:token` on the backend.
