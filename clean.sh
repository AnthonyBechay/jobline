#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Cleaning Jobline project...${NC}"

# Remove node_modules
echo "Removing node_modules..."
find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove build directories
echo "Removing build directories..."
find . -name "dist" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find . -name "build" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find . -name ".next" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove cache directories
echo "Removing cache directories..."
find . -name ".turbo" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find . -name ".cache" -type d -prune -exec rm -rf {} + 2>/dev/null || true
find . -name ".parcel-cache" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove lock files
echo "Removing lock files..."
rm -f package-lock.json 2>/dev/null || true
rm -f yarn.lock 2>/dev/null || true
rm -f pnpm-lock.yaml 2>/dev/null || true
find . -name "package-lock.json" -not -path "./node_modules/*" -delete 2>/dev/null || true

# Remove log files
echo "Removing log files..."
find . -name "*.log" -type f -delete 2>/dev/null || true

# Remove temporary files
echo "Removing temporary files..."
find . -name "*.tmp" -type f -delete 2>/dev/null || true
find . -name "*~" -type f -delete 2>/dev/null || true

echo -e "${GREEN}✓ Project cleaned successfully!${NC}"
