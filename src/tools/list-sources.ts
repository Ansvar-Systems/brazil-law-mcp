/**
 * list_sources — Returns metadata about data sources, coverage, and freshness.
 */

import type { Database } from '@ansvar/mcp-sqlite';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface ListSourcesResult {
  jurisdiction: string;
  sources: Array<{
    name: string;
    authority: string;
    url: string;
    license: string;
    coverage: string;
    languages: string[];
  }>;
  database: {
    tier: string;
    schema_version: string;
    built_at: string;
    document_count: number;
    provision_count: number;
    eu_document_count: number;
  };
  limitations: string[];
}

function safeCount(db: Database, sql: string): number {
  try {
    const row = db.prepare(sql).get() as { count: number } | undefined;
    return row ? Number(row.count) : 0;
  } catch {
    return 0;
  }
}

function safeMetaValue(db: Database, key: string): string {
  try {
    const row = db.prepare('SELECT value FROM db_metadata WHERE key = ?').get(key) as { value: string } | undefined;
    return row?.value ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

export async function listSources(db: Database): Promise<ToolResponse<ListSourcesResult>> {
  const documentCount = safeCount(db, 'SELECT COUNT(*) as count FROM legal_documents');
  const provisionCount = safeCount(db, 'SELECT COUNT(*) as count FROM legal_provisions');
  const euDocumentCount = safeCount(db, 'SELECT COUNT(*) as count FROM eu_documents');

  return {
    results: {
      jurisdiction: 'Brazil (BR)',
      sources: [
        {
          name: 'Planalto (Presidencia da Republica)',
          authority: 'Presidencia da Republica do Brasil',
          url: 'https://www.planalto.gov.br/ccivil_03/',
          license: 'Brazilian Government Public Domain',
          coverage: 'Federal laws (Leis Ordinarias, Leis Complementares), decrees, and constitutional amendments. Covers LGPD, Marco Civil da Internet, Cybercrime Law, Consumer Protection Code, Civil Code, Constitution of 1988.',
          languages: ['pt'],
        },
        {
          name: 'LexML Brazil (Senado Federal)',
          authority: 'Senado Federal do Brasil',
          url: 'https://www.lexml.gov.br',
          license: 'Brazilian Government Open Data',
          coverage: 'Structured XML representations of federal, state, and municipal legislation with URN identifiers and cross-references.',
          languages: ['pt'],
        },
      ],
      database: {
        tier: safeMetaValue(db, 'tier'),
        schema_version: safeMetaValue(db, 'schema_version'),
        built_at: safeMetaValue(db, 'built_at'),
        document_count: documentCount,
        provision_count: provisionCount,
        eu_document_count: euDocumentCount,
      },
      limitations: [
        `Covers ${documentCount.toLocaleString()} Brazilian federal laws. State and municipal legislation are not included.`,
        'Provisions are extracted from official Portuguese text. No English translations are provided.',
        'EU/international cross-references are auto-extracted and may not capture all indirect references (e.g., LGPD modeled on GDPR).',
        'ANPD (data protection authority) guidance and STF/STJ case law summaries require the Professional tier.',
        'Always verify against the Diario Oficial da Uniao when legal certainty is required.',
      ],
    },
    _metadata: generateResponseMetadata(db),
  };
}
