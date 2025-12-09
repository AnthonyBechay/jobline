#!/bin/sh
set -e

echo "Running database migrations..."
pnpm db:push

echo "Starting Next.js server..."
exec node server.js
