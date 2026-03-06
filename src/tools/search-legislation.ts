/**
 * search_legislation — Full-text search across Brazilian federal law provisions.
 */

import type { Database } from '@ansvar/mcp-sqlite';
import { buildFtsQueryVariants } from '../utils/fts-query.js';
import { normalizeAsOfDate } from '../utils/as-of-date.js';
import { resolveExistingStatuteId } from '../utils/statute-id.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface SearchLegislationInput {
  query: string;
  document_id?: string;
  status?: string;
  as_of_date?: string;
  limit?: number;
}

export interface SearchLegislationResult {
  document_id: string;
  document_title: string;
  provision_ref: string;
  chapter: string | null;
  section: string;
  title: string | null;
  snippet: string;
  relevance: number;
}

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export async function searchLegislation(
  db: Database,
  input: SearchLegislationInput
): Promise<ToolResponse<SearchLegislationResult[]>> {
  if (!input.query || input.query.trim().length === 0) {
    return {
      results: [],
      _metadata: generateResponseMetadata(db)
    };
  }

  const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const fetchLimit = limit * 2;
  const queryVariants = buildFtsQueryVariants(input.query);
  if (input.as_of_date) normalizeAsOfDate(input.as_of_date);

  // Resolve document_id from title if provided
  let resolvedDocId: string | undefined;
  if (input.document_id) {
    const resolved = resolveExistingStatuteId(db, input.document_id);
    resolvedDocId = resolved ?? undefined;
    if (!resolved) {
      return {
        results: [],
        _metadata: {
          ...generateResponseMetadata(db),
          note: `No document found matching "${input.document_id}"`,
        },
      };
    }
  }

  let sql = `
    SELECT
      lp.document_id,
      ld.title as document_title,
      lp.provision_ref,
      lp.chapter,
      lp.section,
      lp.title,
      snippet(provisions_fts, 0, '>>>', '<<<', '...', 32) as snippet,
      bm25(provisions_fts) as relevance
    FROM provisions_fts
    JOIN legal_provisions lp ON lp.id = provisions_fts.rowid
    JOIN legal_documents ld ON ld.id = lp.document_id
    WHERE provisions_fts MATCH ?
  `;

  const params: (string | number)[] = [];

  if (resolvedDocId) {
    sql += ` AND lp.document_id = ?`;
    params.push(resolvedDocId);
  }

  if (input.status) {
    sql += ` AND ld.status = ?`;
    params.push(input.status);
  }

  sql += ` ORDER BY relevance LIMIT ?`;
  params.push(fetchLimit);

  const runQuery = (ftsQuery: string): SearchLegislationResult[] => {
    const bound = [ftsQuery, ...params];
    return db.prepare(sql).all(...bound) as SearchLegislationResult[];
  };

  const primaryResults = runQuery(queryVariants.primary);
  if (primaryResults.length > 0) {
    return {
      results: deduplicateResults(primaryResults, limit),
      _metadata: generateResponseMetadata(db),
    };
  }

  if (queryVariants.fallback) {
    const fallbackResults = runQuery(queryVariants.fallback);
    if (fallbackResults.length > 0) {
      return {
        results: deduplicateResults(fallbackResults, limit),
        _metadata: {
          ...generateResponseMetadata(db),
          query_strategy: 'broadened',
        },
      };
    }
  }

  return { results: [], _metadata: generateResponseMetadata(db) };
}

/**
 * Deduplicate search results by document_title + provision_ref.
 * Duplicate document IDs (numeric vs slug) cause the same provision to appear twice.
 * Keeps the first (highest-ranked) occurrence.
 */
function deduplicateResults(
  rows: SearchLegislationResult[],
  limit: number,
): SearchLegislationResult[] {
  const seen = new Set<string>();
  const deduped: SearchLegislationResult[] = [];
  for (const row of rows) {
    const key = `${row.document_title}::${row.provision_ref}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
    if (deduped.length >= limit) break;
  }
  return deduped;
}
