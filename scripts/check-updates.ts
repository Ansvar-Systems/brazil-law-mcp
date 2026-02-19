#!/usr/bin/env tsx
/**
 * Check planalto.gov.br for recently updated or new Brazilian federal laws.
 *
 * Exits:
 *   0 = no updates
 *   1 = updates found
 *   2 = check failed
 */

import Database from 'better-sqlite3';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, '../data/database.db');
const INDEX_PATH = resolve(__dirname, '../data/source/law-index.json');

const USER_AGENT = 'BrazilLawMCP/1.0';
const REQUEST_TIMEOUT_MS = 15_000;

interface LawIndexEntry {
  title: string;
  type: string;
  number: number;
  year: number;
  url: string;
  path: string;
}

function toDocumentId(entry: Pick<LawIndexEntry, 'type' | 'number' | 'year'>): string {
  return `${entry.type}-${entry.number}-${entry.year}`;
}

async function checkUrl(url: string): Promise<{ status: number; lastModified?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    return {
      status: response.status,
      lastModified: response.headers.get('last-modified') ?? undefined,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main(): Promise<void> {
  console.log('Brazil Law MCP - Update checker');
  console.log('');

  if (!existsSync(DB_PATH)) {
    console.error(`Database not found: ${DB_PATH}`);
    process.exit(2);
  }

  if (!existsSync(INDEX_PATH)) {
    console.error(`Law index not found: ${INDEX_PATH}`);
    process.exit(2);
  }

  const db = new Database(DB_PATH, { readonly: true });
  const localDocs = new Set<string>(
    (db.prepare("SELECT id FROM legal_documents").all() as { id: string }[])
      .map((row) => row.id),
  );
  db.close();

  const laws: LawIndexEntry[] = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));
  let updatesFound = 0;

  console.log(`Checking ${laws.length} laws for upstream changes...\n`);

  for (const law of laws) {
    const docId = toDocumentId(law);
    try {
      const result = await checkUrl(law.url);
      const inDb = localDocs.has(docId) ? 'YES' : 'NEW';
      console.log(`  ${inDb}  ${docId} -> HTTP ${result.status}${result.lastModified ? ` (Last-Modified: ${result.lastModified})` : ''}`);
      if (!localDocs.has(docId)) {
        updatesFound++;
      }
    } catch (error) {
      console.log(`  ERROR  ${docId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log('');
  if (updatesFound > 0) {
    console.log(`${updatesFound} new law(s) found.`);
    process.exit(1);
  }

  console.log('No new laws detected.');
}

main().catch((error) => {
  console.error(`Update check failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
});
