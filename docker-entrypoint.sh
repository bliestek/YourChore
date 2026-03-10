#!/bin/sh
set -e

echo "🏠 YourChore - Starting up..."

# Initialize/migrate the database using prisma CLI directly (not npx)
echo "📦 Initializing database..."
node ./node_modules/prisma/build/index.js db push --skip-generate 2>&1

# Check if database needs seeding (no users exist)
NEEDS_SEED=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count().then(c => { console.log(c === 0 ? 'yes' : 'no'); p.\$disconnect(); }).catch(() => { console.log('yes'); p.\$disconnect(); });
" 2>/dev/null || echo "yes")

if [ "$NEEDS_SEED" = "yes" ] && [ "$SEED_ON_STARTUP" = "true" ]; then
  echo "🌱 Seeding database with demo data..."
  node ./node_modules/tsx/dist/cli.mjs prisma/seed.ts 2>&1
  echo "✅ Seed complete!"
fi

echo "🚀 Starting YourChore server..."
exec node server.js
