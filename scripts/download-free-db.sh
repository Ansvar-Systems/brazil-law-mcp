#!/usr/bin/env bash
# Download free-tier database for Vercel deployment.
# Falls back to building from scratch if download fails.

set -euo pipefail

DB_PATH="data/database-free.db"
VERSION="${npm_package_version:-1.0.0}"
REPO="Ansvar-Systems/brazil-law-mcp"
ASSET_URL="https://github.com/${REPO}/releases/download/v${VERSION}/database-free.db.gz"

if [ -f "$DB_PATH" ]; then
  echo "Free-tier database already exists at $DB_PATH"
  exit 0
fi

echo "Attempting to download free-tier database..."
mkdir -p data

if curl -fsSL "$ASSET_URL" | gunzip > "$DB_PATH" 2>/dev/null; then
  echo "Downloaded free-tier database to $DB_PATH"
else
  echo "Download failed (release may not exist yet). Building from scratch..."
  # If ingest data exists, build; otherwise create empty DB
  if [ -d "data/seed" ] && [ "$(ls -A data/seed 2>/dev/null)" ]; then
    npx tsx scripts/build-db-free.ts
  else
    echo "No seed data available. Skipping DB build."
    touch "$DB_PATH"
  fi
fi
