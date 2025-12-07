# Frontend (React + Vite) Dockerfile for Jobline
FROM node:20-alpine AS base
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/

# Install ALL dependencies (development mode to get devDependencies for build)
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app

# Accept Coolify's build args for VITE_* variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy shared source and build it
COPY packages/shared ./packages/shared
RUN cd packages/shared && npm run build

# Copy frontend source
COPY packages/frontend ./packages/frontend

# Build frontend
RUN cd packages/frontend && npm run build

# Production stage - serve with nginx
FROM nginx:alpine AS runner
WORKDIR /app

# Copy built files
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# Copy nginx configuration with API proxy
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://backend:5000/api; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
