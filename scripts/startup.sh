#!/bin/sh
set -e

echo "==> Starting Jobline application..."
echo "==> Database URL: ${DATABASE_URL:0:30}..."

echo "==> Running database migrations..."
if pnpm db:migrate; then
    echo "==> Database migrations applied successfully"
else
    echo "==> WARNING: Database migrations failed, but continuing..."
fi

echo "==> Starting Next.js server..."
exec node server.js
