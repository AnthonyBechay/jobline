# Backend Dockerfile for Jobline
FROM node:20-alpine AS base
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

# Copy Prisma schema BEFORE install (needed for postinstall script)
COPY packages/backend/prisma ./packages/backend/prisma

# Install ALL dependencies (development mode to get devDependencies for build)
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app

# Copy shared source and build it
COPY packages/shared ./packages/shared
RUN cd packages/shared && npm run build

# Copy backend source
COPY packages/backend ./packages/backend

# Generate Prisma client and build
RUN cd packages/backend && npx prisma generate && npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl

# Copy package files
COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

# Copy Prisma schema BEFORE install (needed for postinstall script)
COPY packages/backend/prisma ./packages/backend/prisma

# Install ALL dependencies (including devDependencies for Prisma CLI)
RUN npm ci

# Copy built files from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

# Regenerate Prisma client for Alpine runtime
RUN cd packages/backend && npx prisma generate

EXPOSE 5000
ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "packages/backend/dist/index.js"]
