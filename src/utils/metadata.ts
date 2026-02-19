/**
 * Response metadata for Brazil Law MCP tool responses.
 */

import type Database from '@ansvar/mcp-sqlite';

export interface ResponseMetadata {
  data_freshness: string;
  disclaimer: string;
  source_authority: string;
}

export interface ToolResponse<T> {
  results: T;
  _metadata: ResponseMetadata;
}

const STALENESS_THRESHOLD_DAYS = 30;

export function generateResponseMetadata(
  db?: InstanceType<typeof Database>
): ResponseMetadata {
  let freshness = 'Database freshness unknown';

  if (db) {
    try {
      const row = db.prepare("SELECT value FROM db_metadata WHERE key = 'built_at'").get() as { value: string } | undefined;
      if (row?.value) {
        const builtDate = new Date(row.value);
        const daysSince = Math.floor((Date.now() - builtDate.getTime()) / (1000 * 60 * 60 * 24));
        freshness = daysSince > STALENESS_THRESHOLD_DAYS
          ? `WARNING: Database is ${daysSince} days old. Data may be outdated.`
          : `Database built ${daysSince} day(s) ago.`;
      }
    } catch {
      // Ignore metadata read errors
    }
  }

  return {
    data_freshness: freshness,
    disclaimer:
      'This data is derived from planalto.gov.br and lexml.gov.br official sources. ' +
      'Verify against the Diario Oficial da Uniao when legal certainty is required.',
    source_authority: 'Presidencia da Republica (planalto.gov.br) / Senado Federal (lexml.gov.br)',
  };
}
