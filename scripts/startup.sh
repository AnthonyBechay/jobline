#!/bin/sh
set -e

echo "==> Starting Jobline application..."
echo "==> Database URL: ${DATABASE_URL:0:30}..."

echo "==> Running database schema push..."
if pnpm db:push; then
    echo "==> Database schema updated successfully"
else
    echo "==> WARNING: Database schema push failed, but continuing..."
fi

echo "==> Starting Next.js server..."
exec node server.js
