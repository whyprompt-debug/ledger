#!/bin/sh
set -e

# Use DATABASE_URL from env or default to local path
export DATABASE_URL="${DATABASE_URL:-file:./prisma/dev.db}"

echo "Running prisma db push..."
npx prisma db push --skip-generate

echo "Running seed..."
node prisma/seed.js

echo "Starting Next.js on port ${PORT:-3000}..."
exec npx next start -p "${PORT:-3000}"
