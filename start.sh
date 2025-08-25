#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================"
echo "    Starting Jobline Development"
echo -e "========================================${NC}"
echo ""

# Check if .env exists
if [ ! -f packages/backend/.env ]; then
    echo -e "${YELLOW}[WARNING] .env file not found in packages/backend/${NC}"
    echo "Creating from .env.example..."
    cp packages/backend/.env.example packages/backend/.env
    echo "Please edit packages/backend/.env with your database credentials"
    read -p "Press Enter to continue..."
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    npm install --legacy-peer-deps
fi

# Check if shared is built
if [ ! -d packages/shared/dist ]; then
    echo "Building shared package..."
    cd packages/shared
    npm run build
    cd ../..
fi

# --- CORRECTED SECTION FOR KILLING PROCESSES ---
echo ""
echo "Cleaning up existing processes..."

# Find and kill process on port 3000
PID_3000=$(netstat -aon | findstr 'LISTENING' | findstr ':3000' | awk '{print $NF}' | head -n 1)
if [ -n "$PID_3000" ]; then
    echo "Found process $PID_3000 on port 3000. Terminating..."
    # Use //F and //PID to prevent Git Bash path conversion
    taskkill //F //PID $PID_3000 > /dev/null
else
    echo "No process found on port 3000."
fi

# Find and kill process on port 5000
PID_5000=$(netstat -aon | findstr 'LISTENING' | findstr ':5000' | awk '{print $NF}' | head -n 1)
if [ -n "$PID_5000" ]; then
    echo "Found process $PID_5000 on port 5000. Terminating..."
    # Use //F and //PID to prevent Git Bash path conversion
    taskkill //F //PID $PID_5000 > /dev/null
else
    echo "No process found on port 5000."
fi
# --- END OF CORRECTED SECTION ---

echo "Waiting for ports to be released..."
sleep 1

echo ""
echo -e "${GREEN}Starting servers...${NC}"
echo "========================================"
echo -e "${GREEN}Backend:  http://localhost:5000${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo "========================================"
echo ""

# Start backend in background
(cd packages/backend && npm run dev) &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend in background
(cd packages/frontend && npm run dev) &
FRONTEND_PID=$!

echo "Servers are starting..."
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait and handle shutdown
trap "echo 'Shutting down servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait