#!/bin/bash

echo "Starting Jobline Development Servers..."
echo ""

# Function to kill process on port
kill_port() {
    port=$1
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "Killing process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null
    fi
}

# Clean up existing processes
echo "Cleaning up existing processes..."
kill_port 3000
kill_port 5000

# Start backend
echo "Starting backend server on port 5000..."
cd packages/backend && npm run dev &
BACKEND_PID=$!

sleep 3

# Start frontend
echo "Starting frontend server on port 3000..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "Servers are starting..."
echo ""
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to handle Ctrl+C
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT

# Wait for processes
wait
