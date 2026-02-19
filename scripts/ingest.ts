#!/usr/bin/env tsx
/**
 * Brazil Law MCP — Ingestion Pipeline
 *
 * Dual-source ingestion of Brazilian federal legislation:
 *   Phase 1 (Discovery): Build index of target federal laws
 *   Phase 2 (Content): Fetch HTML from Planalto, parse, and write seed JSON
 *
 * Usage:
 *   npm run ingest                    # Full ingestion
 *   npm run ingest -- --limit 10      # Test with 10 laws
 *   npm run ingest -- --skip-discovery # Reuse cached index
 *
 * Data is sourced from planalto.gov.br (public domain) and lexml.gov.br (government open data).
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { fetchPlanaltoLaw } from './lib/fetcher.js';
import { parsePlanaltoHtml, type LawIndexEntry, type ParsedLaw } from './lib/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.resolve(__dirname, '../data/source');
const SEED_DIR = path.resolve(__dirname, '../data/seed');
const INDEX_PATH = path.join(SOURCE_DIR, 'law-index.json');

// ─────────────────────────────────────────────────────────────────────────────
// Brazilian law registry (core federal legislation)
// ─────────────────────────────────────────────────────────────────────────────

const CORE_LAWS: LawIndexEntry[] = [
  {
    title: 'Lei Geral de Protecao de Dados Pessoais (LGPD)',
    type: 'lei', number: 13709, year: 2018,
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm',
    path: '_ato2015-2018/2018/lei/l13709.htm',
  },
  {
    title: 'Marco Civil da Internet',
    type: 'lei', number: 12965, year: 2014,
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm',
    path: '_ato2011-2014/2014/lei/l12965.htm',
  },
  {
    title: 'Lei de Crimes Ciberneticos (Carolina Dieckmann)',
    type: 'lei', number: 12737, year: 2012,
    url: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12737.htm',
    path: '_ato2011-2014/2012/lei/l12737.htm',
  },
  {
    title: 'Codigo de Defesa do Consumidor',
    type: 'lei', number: 8078, year: 1990,
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm',
    path: 'leis/l8078compilado.htm',
  },
  {
    title: 'Codigo Civil',
    type: 'lei', number: 10406, year: 2002,
    url: 'https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm',
    path: 'leis/2002/l10406compilada.htm',
  },
  {
    title: 'Lei Geral de Telecomunicacoes',
    type: 'lei', number: 9472, year: 1997,
    url: 'https://www.planalto.gov.br/ccivil_03/leis/l9472.htm',
    path: 'leis/l9472.htm',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CLI argument parsing
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(): { limit: number | null; skipDiscovery: boolean } {
  const args = process.argv.slice(2);
  let limit: number | null = null;
  let skipDiscovery = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--skip-discovery') {
      skipDiscovery = true;
    }
  }

  return { limit, skipDiscovery };
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 1: Discovery — Build law index
// ─────────────────────────────────────────────────────────────────────────────

function discoverLaws(): LawIndexEntry[] {
  console.log('Phase 1: Building Brazilian federal law index...\n');
  console.log(`  ${CORE_LAWS.length} core laws registered\n`);

  fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.writeFileSync(INDEX_PATH, JSON.stringify(CORE_LAWS, null, 2));
  console.log(`  Index saved to ${INDEX_PATH}\n`);

  return CORE_LAWS;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2: Content — Fetch and parse each law
// ─────────────────────────────────────────────────────────────────────────────

async function fetchAndParseLaws(laws: LawIndexEntry[], limit: number | null): Promise<void> {
  const toProcess = limit ? laws.slice(0, limit) : laws;
  console.log(`Phase 2: Fetching content for ${toProcess.length} laws...\n`);

  fs.mkdirSync(SEED_DIR, { recursive: true });

  let processed = 0;
  let skipped = 0;
  let failed = 0;
  let totalProvisions = 0;

  for (const law of toProcess) {
    const seedFile = path.join(SEED_DIR, `${law.type}_${law.number}_${law.year}.json`);

    // Incremental: skip if seed already exists
    if (fs.existsSync(seedFile)) {
      skipped++;
      processed++;
      continue;
    }

    try {
      console.log(`  Fetching ${law.title}...`);
      const result = await fetchPlanaltoLaw(law.path);

      if (result.status !== 200) {
        console.log(`  ERROR: HTTP ${result.status} for ${law.url}`);
        // Write minimal seed
        const minimalSeed: ParsedLaw = {
          id: `${law.type}-${law.number}-${law.year}`,
          type: law.type,
          title: law.title,
          short_name: '',
          status: 'in_force',
          issued_date: `${law.year}-01-01`,
          url: law.url,
          provisions: [],
        };
        fs.writeFileSync(seedFile, JSON.stringify(minimalSeed, null, 2));
        failed++;
      } else {
        const parsed = parsePlanaltoHtml(result.body, law.type, law.number, law.year, law.title);
        parsed.url = law.url;
        fs.writeFileSync(seedFile, JSON.stringify(parsed, null, 2));
        totalProvisions += parsed.provisions.length;
        console.log(`    -> ${parsed.provisions.length} articles extracted`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`  ERROR parsing ${law.title}: ${msg}`);
      failed++;
    }

    processed++;
  }

  console.log(`\nPhase 2 complete:`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped (already cached): ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total provisions extracted: ${totalProvisions}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { limit, skipDiscovery } = parseArgs();

  console.log('Brazil Law MCP — Ingestion Pipeline');
  console.log('====================================\n');

  if (limit) console.log(`  --limit ${limit}`);
  if (skipDiscovery) console.log(`  --skip-discovery`);
  console.log('');

  let laws: LawIndexEntry[];

  if (skipDiscovery && fs.existsSync(INDEX_PATH)) {
    console.log(`Using cached law index from ${INDEX_PATH}\n`);
    laws = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
    console.log(`  ${laws.length} laws in index\n`);
  } else {
    laws = discoverLaws();
  }

  await fetchAndParseLaws(laws, limit);

  console.log('\nIngestion complete.');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
