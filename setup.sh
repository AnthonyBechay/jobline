#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Jobline Setup & Installation Script ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to print colored messages
print_status() {
    echo -e "${YELLOW}➤${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check Node.js version
print_status "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) detected"

# Check npm version
print_status "Checking npm version..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
fi
print_success "npm $(npm -v) detected"

# Clean project
print_status "Cleaning project..."
echo "  Removing node_modules directories..."
find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true

echo "  Removing build directories..."
find . -name "dist" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find . -name "build" -type d -prune -exec rm -rf {} + 2>/dev/null || true

echo "  Removing lock files..."
rm -f package-lock.json 2>/dev/null || true
rm -f packages/*/package-lock.json 2>/dev/null || true

echo "  Removing temporary files..."
find . -name "*.log" -type f -delete 2>/dev/null || true
find . -name ".turbo" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find . -name ".cache" -type d -prune -exec rm -rf {} + 2>/dev/null || true

print_success "Project cleaned"

# Install dependencies
print_status "Installing dependencies..."
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi
print_success "Dependencies installed"

# Setup Prisma
print_status "Setting up Prisma..."
cd packages/backend

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    print_error "Failed to generate Prisma client"
    exit 1
fi
print_success "Prisma client generated"

# Check if .env exists
if [ ! -f .env ]; then
    print_error ".env file not found in packages/backend/"
    echo ""
    echo "Please create a .env file with the following content:"
    echo "----------------------------------------"
    echo "DATABASE_URL=\"postgresql://username:password@localhost:5432/jobline_db?schema=public\""
    echo "JWT_SECRET=\"your-super-secret-jwt-key\""
    echo "JWT_EXPIRES_IN=\"7d\""
    echo "PORT=5000"
    echo "NODE_ENV=development"
    echo "FRONTEND_URL=http://localhost:3000"
    echo "----------------------------------------"
    echo ""
    read -p "Press Enter after creating the .env file to continue..."
fi

# Run migrations
print_status "Running database migrations..."
npx prisma migrate deploy
if [ $? -ne 0 ]; then
    print_error "Failed to run migrations. Please check your database connection."
    exit 1
fi
print_success "Database migrations completed"

# Seed database
read -p "Do you want to seed the database with initial data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Seeding database..."
    npm run db:seed
    if [ $? -ne 0 ]; then
        print_error "Failed to seed database"
    else
        print_success "Database seeded successfully"
    fi
fi

cd ../..

# Build shared package
print_status "Building shared package..."
cd packages/shared
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build shared package"
    exit 1
fi
print_success "Shared package built"
cd ../..

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}        Setup Complete! 🎉              ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "To start the application, run:"
echo -e "  ${YELLOW}npm run dev${NC}"
echo ""
echo "Default login credentials:"
echo "  Super Admin: owner@jobline.lb / admin123"
echo "  Admin: secretary@jobline.lb / secretary123"
echo ""
echo "Application URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo ""
