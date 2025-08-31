#!/bin/bash

echo "==========================================="
echo "   Fixing Jobline Development Issues"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Cleaning node_modules...${NC}"
# Clean node_modules in all packages
if [ -d "node_modules" ]; then rm -rf node_modules; fi
if [ -d "packages/frontend/node_modules" ]; then rm -rf packages/frontend/node_modules; fi
if [ -d "packages/backend/node_modules" ]; then rm -rf packages/backend/node_modules; fi

echo -e "${YELLOW}2. Installing root dependencies...${NC}"
npm install

echo -e "${YELLOW}3. Installing frontend dependencies...${NC}"
cd packages/frontend
npm install
cd ../..

echo -e "${YELLOW}4. Installing backend dependencies...${NC}"
cd packages/backend
npm install

echo -e "${YELLOW}5. Generating Prisma client...${NC}"
npx prisma generate

cd ../..

echo -e "${GREEN}✅ All dependencies installed and Prisma client generated!${NC}"
echo ""
echo -e "${YELLOW}Now you can run:${NC}"
echo "  npm run dev    - to start development servers"
echo "  npm run pre-deploy - to check deployment readiness"
