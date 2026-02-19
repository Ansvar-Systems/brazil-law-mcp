/**
 * get_provision — Retrieve a specific provision from a Brazilian federal law.
 */

import type { Database } from '@ansvar/mcp-sqlite';
import { resolveExistingStatuteId } from '../utils/statute-id.js';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface GetProvisionInput {
  document_id?: string;
  law_identifier?: string;
  article?: string;
  provision_ref?: string;
}

export interface ProvisionResult {
  document_id: string;
  document_title: string;
  document_status: string;
  provision_ref: string;
  chapter: string | null;
  section: string;
  article_number: string;
  title: string | null;
  content: string;
  text: string;
  citation_url: string;
}

interface ProvisionRow {
  document_id: string;
  document_title: string;
  document_status: string;
  document_url: string;
  provision_ref: string;
  chapter: string | null;
  section: string;
  title: string | null;
  content: string;
}

const MAX_ALL_PROVISIONS = 200;

export async function getProvision(
  db: Database,
  input: GetProvisionInput
): Promise<ToolResponse<ProvisionResult | ProvisionResult[] | { provisions: ProvisionResult[]; truncated: boolean; total: number } | null>> {
  const docInput = input.document_id ?? input.law_identifier;
  if (!docInput) {
    throw new Error('document_id or law_identifier is required');
  }

  const resolvedDocumentId = resolveExistingStatuteId(db, docInput) ?? docInput;

  // Get document URL for citation
  const docRow = db.prepare(
    'SELECT url FROM legal_documents WHERE id = ?'
  ).get(resolvedDocumentId) as { url: string } | undefined;
  const baseUrl = docRow?.url ?? `https://www.planalto.gov.br/ccivil_03/`;

  const articleRef = input.provision_ref ?? input.article;

  // If no specific article, return all provisions (with safety cap)
  if (!articleRef) {
    const countRow = db.prepare(
      'SELECT COUNT(*) as count FROM legal_provisions WHERE document_id = ?'
    ).get(resolvedDocumentId) as { count: number } | undefined;
    const total = countRow?.count ?? 0;

    const rows = db.prepare(`
      SELECT
        lp.document_id,
        ld.title as document_title,
        ld.status as document_status,
        ld.url as document_url,
        lp.provision_ref,
        lp.chapter,
        lp.section,
        lp.title,
        lp.content
      FROM legal_provisions lp
      JOIN legal_documents ld ON ld.id = lp.document_id
      WHERE lp.document_id = ?
      ORDER BY lp.id
      LIMIT ?
    `).all(resolvedDocumentId, MAX_ALL_PROVISIONS) as ProvisionRow[];

    const mapped = rows.map(r => toResult(r, baseUrl));

    if (total > MAX_ALL_PROVISIONS) {
      return {
        results: { provisions: mapped, truncated: true, total },
        _metadata: generateResponseMetadata(db),
      };
    }

    return {
      results: mapped,
      _metadata: generateResponseMetadata(db)
    };
  }

  // Normalize article reference: strip "art", "art.", leading zeros, ordinal suffixes
  const normalizedArticle = articleRef
    .replace(/^art\.?\s*/i, '')
    .replace(/[ºªo°]+$/i, '')
    .trim();

  const artRef = `art${normalizedArticle}`;
  const artDot = `art. ${normalizedArticle}`;

  const rows = db.prepare(`
    SELECT
      lp.document_id,
      ld.title as document_title,
      ld.status as document_status,
      ld.url as document_url,
      lp.provision_ref,
      lp.chapter,
      lp.section,
      lp.title,
      lp.content
    FROM legal_provisions lp
    JOIN legal_documents ld ON ld.id = lp.document_id
    WHERE lp.document_id = ?
      AND (lp.provision_ref = ? OR lp.provision_ref = ? OR lp.section = ? OR lp.section = ?)
  `).all(resolvedDocumentId, artRef, artDot, normalizedArticle, artRef) as ProvisionRow[];

  if (rows.length === 0) {
    return {
      results: null,
      _metadata: generateResponseMetadata(db)
    };
  }

  if (rows.length === 1) {
    return {
      results: toResult(rows[0], baseUrl),
      _metadata: generateResponseMetadata(db)
    };
  }

  return {
    results: rows.map(r => toResult(r, baseUrl)),
    _metadata: generateResponseMetadata(db)
  };
}

function toResult(row: ProvisionRow, baseUrl: string): ProvisionResult {
  const articleNum = row.provision_ref.replace(/^art\.?\s*/i, '').replace(/[ºªo°]+$/i, '');
  return {
    document_id: row.document_id,
    document_title: row.document_title,
    document_status: row.document_status,
    provision_ref: row.provision_ref,
    chapter: row.chapter,
    section: row.section,
    article_number: articleNum,
    title: row.title,
    content: row.content,
    text: row.content,
    citation_url: row.document_url ?? baseUrl,
  };
}
