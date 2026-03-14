#!/bin/sh
set -e

echo "========================================"
echo "  YourChore - Starting up..."
echo "========================================"

DB_DIR="/app/data"
DB_FILE="$DB_DIR/yourchore.db"
BACKUP_DIR="$DB_DIR/backups"
MAX_BACKUPS=5

# ── Restore from backup if requested ──────────────────────────────
if [ -n "$RESTORE_BACKUP" ]; then
  if [ "$RESTORE_BACKUP" = "latest" ]; then
    RESTORE_FILE=$(ls -t "$BACKUP_DIR"/yourchore-*.db 2>/dev/null | head -1)
  else
    RESTORE_FILE="$BACKUP_DIR/$RESTORE_BACKUP"
  fi

  if [ -n "$RESTORE_FILE" ] && [ -f "$RESTORE_FILE" ]; then
    echo "🔄 Restoring database from backup: $RESTORE_FILE"
    cp "$RESTORE_FILE" "$DB_FILE"
    echo "✅ Restore complete! Remove RESTORE_BACKUP env var and redeploy."
  else
    echo "❌ Backup not found: ${RESTORE_FILE:-no backups exist}"
    echo "   Available backups:"
    ls -lh "$BACKUP_DIR"/yourchore-*.db 2>/dev/null || echo "   (none)"
    exit 1
  fi
fi

# ── Check existing database (file-level only, no PrismaClient) ───
if [ -f "$DB_FILE" ]; then
  DB_SIZE=$(ls -lh "$DB_FILE" | awk '{print $5}')
  echo "📂 Existing database found: $DB_FILE ($DB_SIZE)"
else
  echo "📂 No existing database — fresh install"
fi

# ── Backup before schema push ────────────────────────────────────
if [ -f "$DB_FILE" ]; then
  mkdir -p "$BACKUP_DIR"
  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
  BACKUP_FILE="$BACKUP_DIR/yourchore-$TIMESTAMP.db"
  cp "$DB_FILE" "$BACKUP_FILE"
  echo "💾 Backed up database to: $BACKUP_FILE"

  # Also backup WAL and SHM files if they exist (SQLite journal)
  [ -f "$DB_FILE-wal" ] && cp "$DB_FILE-wal" "$BACKUP_FILE-wal"
  [ -f "$DB_FILE-shm" ] && cp "$DB_FILE-shm" "$BACKUP_FILE-shm"

  # Rotate old backups — keep only the last N
  BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/yourchore-*.db 2>/dev/null | wc -l | tr -d ' ')
  if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    REMOVE_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
    echo "🗑️  Rotating backups (keeping last $MAX_BACKUPS)..."
    ls -t "$BACKUP_DIR"/yourchore-*.db | tail -n "$REMOVE_COUNT" | while read -r OLD; do
      rm -f "$OLD" "$OLD-wal" "$OLD-shm"
    done
  fi
fi

# ── Apply schema updates FIRST (before any PrismaClient usage) ───
echo "📦 Applying schema updates..."
if ! node ./node_modules/prisma/build/index.js db push --skip-generate 2>&1; then
  echo ""
  echo "❌ Schema update failed!"
  echo "   This usually means the schema change would cause data loss."
  echo "   Your database has NOT been modified — your data is safe."
  echo ""
  echo "   Options:"
  echo "   1. Fix the schema change to be non-destructive"
  echo "   2. Set FORCE_SCHEMA_PUSH=true to accept data loss (NOT recommended)"
  echo ""

  if [ "$FORCE_SCHEMA_PUSH" = "true" ]; then
    echo "⚠️  FORCE_SCHEMA_PUSH=true — retrying with --accept-data-loss..."
    node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss 2>&1
    echo "⚠️  Schema pushed with potential data loss. Check your data!"
  else
    echo "   Shutting down to protect your data."
    exit 1
  fi
fi
echo "✅ Schema is up to date"

# ── Check user count (safe now — schema is current) ──────────────
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count().then(c => { console.log(c); p.\$disconnect(); }).catch(() => { console.log('error'); p.\$disconnect(); });
" 2>/dev/null || echo "error")

if [ "$USER_COUNT" != "error" ] && [ "$USER_COUNT" -gt 0 ] 2>/dev/null; then
  echo "👥 Database has $USER_COUNT user(s) — data is intact"
elif [ "$USER_COUNT" = "0" ]; then
  echo "⚠️  Database exists but has 0 users"
fi

# ── Seed if empty and requested ──────────────────────────────────
NEEDS_SEED="no"
if [ "$USER_COUNT" = "0" ] || [ "$USER_COUNT" = "error" ]; then
  NEEDS_SEED="yes"
fi

if [ "$NEEDS_SEED" = "yes" ] && [ "$SEED_ON_STARTUP" = "true" ]; then
  echo "🌱 Seeding database with demo data..."
  node ./node_modules/tsx/dist/cli.mjs prisma/seed.ts 2>&1
  echo "✅ Seed complete!"
elif [ "$NEEDS_SEED" = "yes" ]; then
  echo "📝 Database is empty. Set SEED_ON_STARTUP=true to load demo data."
fi

# ── List available backups ───────────────────────────────────────
if [ -d "$BACKUP_DIR" ]; then
  BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/yourchore-*.db 2>/dev/null | wc -l | tr -d ' ')
  if [ "$BACKUP_COUNT" -gt 0 ]; then
    echo "💾 $BACKUP_COUNT backup(s) available in $BACKUP_DIR"
    echo "   To restore: set RESTORE_BACKUP=latest (or a specific filename)"
  fi
fi

echo "========================================"
echo "  Starting YourChore server..."
echo "========================================"
exec node server.js
