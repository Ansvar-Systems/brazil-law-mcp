#!/usr/bin/env tsx
/**
 * Brazil Law MCP — Full Corpus Ingestion Pipeline
 *
 * High-throughput ingestion of Brazilian federal legislation from planalto.gov.br.
 * Uses parallel fetching (10 concurrent) to process the entire corpus efficiently.
 *
 * Usage:
 *   npm run ingest                         # Full ingestion
 *   npm run ingest -- --limit 100          # First 100 laws
 *   npm run ingest -- --skip-discovery     # Reuse cached index, fetch missing only
 *   npm run ingest -- --from 2003          # Only 2003+ laws
 *   npm run ingest -- --type lc            # Only complementary laws
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { parsePlanaltoHtml, type LawIndexEntry, type ParsedLaw } from './lib/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.resolve(__dirname, '../data/source');
const SEED_DIR = path.resolve(__dirname, '../data/seed');
const INDEX_PATH = path.join(SOURCE_DIR, 'law-index.json');

const UA = 'Mozilla/5.0 (compatible; BrazilLawMCP/1.0; +https://github.com/Ansvar-Systems/brazil-law-mcp)';
const CONCURRENCY = 10;
const BATCH_DELAY_MS = 500; // Delay between batches of 10

// ─────────────────────────────────────────────────────────────────────────────
// Fetch
// ─────────────────────────────────────────────────────────────────────────────

async function tryFetch(url: string): Promise<{ ok: boolean; body: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html' },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.status !== 200) return { ok: false, body: '' };
    const body = await res.text();
    return { ok: body.length > 500, body };
  } catch {
    return { ok: false, body: '' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// URL generation
// ─────────────────────────────────────────────────────────────────────────────

function atoBracket(year: number): string {
  const base = 2003 + Math.floor((year - 2003) / 4) * 4;
  return `${base}-${base + 3}`;
}

interface LawCandidate {
  type: string;
  number: number;
  year: number;
  urls: string[];
  paths: string[];
}

function buildCandidates(args: CliArgs): LawCandidate[] {
  const candidates: LawCandidate[] = [];

  // ── Constitution ──
  if (args.lawType === 'all' || args.lawType === 'constituicao') {
    candidates.push({
      type: 'constituicao', number: 1988, year: 1988,
      urls: ['https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm'],
      paths: ['constituicao/constituicao.htm'],
    });
  }

  // ── Leis Complementares (1-210) ──
  if (args.lawType === 'all' || args.lawType === 'lc') {
    for (let n = 1; n <= 210; n++) {
      candidates.push({
        type: 'lc', number: n, year: 0,
        urls: [`https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp${n}.htm`],
        paths: [`leis/lcp/lcp${n}.htm`],
      });
    }
  }

  // ── Leis Ordinárias ──
  if (args.lawType === 'all' || args.lawType === 'lei') {
    // Pre-2001: prefer compiled version
    if (!args.fromYear || args.fromYear < 2001) {
      for (let n = 1; n <= 10200; n++) {
        candidates.push({
          type: 'lei', number: n, year: 0,
          urls: [
            `https://www.planalto.gov.br/ccivil_03/leis/l${n}compilado.htm`,
            `https://www.planalto.gov.br/ccivil_03/leis/l${n}compilada.htm`,
            `https://www.planalto.gov.br/ccivil_03/leis/l${n}.htm`,
          ],
          paths: [`leis/l${n}compilado.htm`, `leis/l${n}compilada.htm`, `leis/l${n}.htm`],
        });
      }
    }

    // 2001-2002
    if (!args.fromYear || args.fromYear <= 2002) {
      for (let n = 10200; n <= 10700; n++) {
        candidates.push({
          type: 'lei', number: n, year: 0,
          urls: [
            `https://www.planalto.gov.br/ccivil_03/leis/2002/l${n}.htm`,
            `https://www.planalto.gov.br/ccivil_03/leis/2001/l${n}.htm`,
          ],
          paths: [`leis/2002/l${n}.htm`, `leis/2001/l${n}.htm`],
        });
      }
    }

    // 2003+
    const yearRanges: Array<[number, number, number]> = [
      [10700, 10900, 2003], [10800, 11000, 2004], [11000, 11200, 2005], [11200, 11400, 2006],
      [11300, 11500, 2007], [11500, 11700, 2008], [11700, 12000, 2009], [11900, 12200, 2010],
      [12200, 12400, 2011], [12400, 12600, 2012], [12600, 12800, 2013], [12800, 13000, 2014],
      [13000, 13200, 2015], [13100, 13300, 2016], [13300, 13500, 2017], [13400, 13600, 2018],
      [13600, 13800, 2019], [13800, 14100, 2020], [14000, 14200, 2021], [14200, 14500, 2022],
      [14400, 14600, 2023], [14600, 14800, 2024], [14800, 15000, 2025], [15000, 15100, 2026],
    ];

    for (const [from, to, year] of yearRanges) {
      if (args.fromYear && year < args.fromYear) continue;
      const bracket = atoBracket(year);
      for (let n = from; n < to; n++) {
        candidates.push({
          type: 'lei', number: n, year,
          urls: [`https://www.planalto.gov.br/ccivil_03/_ato${bracket}/${year}/lei/l${n}.htm`],
          paths: [`_ato${bracket}/${year}/lei/l${n}.htm`],
        });
      }
    }
  }

  return candidates;
}

// ─────────────────────────────────────────────────────────────────────────────
// Process a single candidate
// ─────────────────────────────────────────────────────────────────────────────

interface ProcessResult {
  found: boolean;
  provisions: number;
  entry?: LawIndexEntry;
  cached: boolean;
}

async function processCandidate(c: LawCandidate): Promise<ProcessResult> {
  const seedFile = path.join(SEED_DIR, `${c.type}_${c.number}_${c.year}.json`);

  // Skip if already cached with provisions
  if (fs.existsSync(seedFile)) {
    try {
      const existing = JSON.parse(fs.readFileSync(seedFile, 'utf-8')) as ParsedLaw;
      if (existing.provisions && existing.provisions.length > 0) {
        return {
          found: true, provisions: existing.provisions.length, cached: true,
          entry: { title: existing.title, type: c.type, number: c.number, year: c.year, url: existing.url, path: c.paths[0] },
        };
      }
    } catch { /* corrupt */ }
  }

  // Try each URL
  for (let u = 0; u < c.urls.length; u++) {
    const result = await tryFetch(c.urls[u]);
    if (!result.ok) continue;

    const title = `${c.type === 'lc' ? 'Lei Complementar' : c.type === 'constituicao' ? 'Constituicao' : 'Lei'} ${c.number}${c.year ? '/' + c.year : ''}`;
    const parsed = parsePlanaltoHtml(result.body, c.type, c.number, c.year, title);
    parsed.url = c.urls[u];
    fs.writeFileSync(seedFile, JSON.stringify(parsed, null, 2));

    return {
      found: true, provisions: parsed.provisions.length, cached: false,
      entry: { title: parsed.title || title, type: c.type, number: c.number, year: c.year, url: c.urls[u], path: c.paths[u] },
    };
  }

  return { found: false, provisions: 0, cached: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

interface CliArgs {
  limit: number | null;
  skipDiscovery: boolean;
  fromYear: number;
  lawType: 'all' | 'lei' | 'lc' | 'constituicao';
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = { limit: null, skipDiscovery: false, fromYear: 0, lawType: 'all' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) { result.limit = parseInt(args[i + 1], 10); i++; }
    else if (args[i] === '--skip-discovery') { result.skipDiscovery = true; }
    else if (args[i] === '--from' && args[i + 1]) { result.fromYear = parseInt(args[i + 1], 10); i++; }
    else if (args[i] === '--type' && args[i + 1]) { result.lawType = args[i + 1] as CliArgs['lawType']; i++; }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs();

  console.log('Brazil Law MCP — Full Corpus Ingestion');
  console.log(`Concurrency: ${CONCURRENCY}, Batch delay: ${BATCH_DELAY_MS}ms\n`);

  fs.mkdirSync(SEED_DIR, { recursive: true });
  fs.mkdirSync(SOURCE_DIR, { recursive: true });

  const candidates = buildCandidates(args);
  const total = args.limit ? Math.min(args.limit, candidates.length) : candidates.length;
  console.log(`${total} candidates to process\n`);

  const foundIndex: LawIndexEntry[] = [];
  let processed = 0;
  let found = 0;
  let cached = 0;
  let totalProvisions = 0;
  const startTime = Date.now();

  // Process in parallel batches
  for (let i = 0; i < total; i += CONCURRENCY) {
    const batch = candidates.slice(i, Math.min(i + CONCURRENCY, total));

    const results = await Promise.allSettled(batch.map(c => processCandidate(c)));

    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.found) {
        if (r.value.cached) cached++;
        else found++;
        totalProvisions += r.value.provisions;
        if (r.value.entry) foundIndex.push(r.value.entry);
      }
      processed++;
    }

    // Progress every 200
    if (processed % 200 < CONCURRENCY) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = (processed / ((Date.now() - startTime) / 1000)).toFixed(1);
      const eta = (((total - processed) / parseFloat(rate)) / 60).toFixed(0);
      console.log(
        `  [${((processed / total) * 100).toFixed(1)}%] ${processed}/${total} — ` +
        `${found} new + ${cached} cached — ${totalProvisions} provisions — ` +
        `${rate}/s — ETA ${eta}min`
      );
    }

    await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
  }

  // Save index
  fs.writeFileSync(INDEX_PATH, JSON.stringify(foundIndex, null, 2));

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Done in ${elapsed} min`);
  console.log(`Laws: ${found + cached} (${found} new + ${cached} cached)`);
  console.log(`Provisions: ${totalProvisions}`);
  console.log(`Seed files: ${fs.readdirSync(SEED_DIR).filter(f => f.endsWith('.json')).length}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
