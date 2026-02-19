#!/usr/bin/env tsx
/**
 * Free-tier database builder for Brazil Law MCP.
 * Builds the same database as build-db.ts but outputs to data/database-free.db.
 *
 * Usage: npm run build:db:free
 */

import { execSync } from 'child_process';
import { copyFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, '../data/database.db');
const FREE_DB_PATH = resolve(__dirname, '../data/database-free.db');

// Build the full database first
execSync('node --import tsx scripts/build-db.ts', {
  cwd: resolve(__dirname, '..'),
  stdio: 'inherit',
});

if (existsSync(DB_PATH)) {
  copyFileSync(DB_PATH, FREE_DB_PATH);
  console.log(`\nFree-tier database copied to ${FREE_DB_PATH}`);
} else {
  console.error('Error: database.db not found after build');
  process.exit(1);
}
