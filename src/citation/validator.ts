/**
 * Brazilian legal citation validator.
 *
 * Validates a citation string against the database to ensure the document
 * and provision actually exist (zero-hallucination enforcement).
 */

import type { Database } from '@ansvar/mcp-sqlite';
import type { ValidationResult } from '../types/index.js';
import { parseCitation } from './parser.js';

/**
 * Build a document ID from parsed citation components.
 */
function buildDocumentId(type: string, number: number | undefined, year: number | undefined): string {
  if (type === 'constituicao') {
    return `constituicao-${year ?? 1988}`;
  }
  return `${type}-${number ?? 0}-${year ?? 0}`;
}

export function validateCitation(db: Database, citation: string): ValidationResult {
  const parsed = parseCitation(citation);
  const warnings: string[] = [];

  if (!parsed.valid) {
    return {
      citation: parsed,
      document_exists: false,
      provision_exists: false,
      warnings: [parsed.error ?? 'Invalid citation format'],
    };
  }

  // Build expected document ID
  const expectedId = buildDocumentId(parsed.type, parsed.number, parsed.year);

  // Look up document by ID first, then by title match
  let doc = db.prepare(
    "SELECT id, title, status FROM legal_documents WHERE id = ? LIMIT 1"
  ).get(expectedId) as { id: string; title: string; status: string } | undefined;

  if (!doc && parsed.title) {
    doc = db.prepare(
      "SELECT id, title, status FROM legal_documents WHERE title LIKE ? LIMIT 1"
    ).get(`%${parsed.title}%`) as { id: string; title: string; status: string } | undefined;
  }

  if (!doc) {
    return {
      citation: parsed,
      document_exists: false,
      provision_exists: false,
      warnings: [`Document "${expectedId}" not found in database`],
    };
  }

  if (doc.status === 'repealed') {
    warnings.push('This law has been repealed');
  }

  // Check provision existence
  let provisionExists = false;
  if (parsed.article) {
    const artRef = `art${parsed.article}`;
    const artDot = `art. ${parsed.article}`;

    const prov = db.prepare(
      `SELECT 1
       FROM legal_provisions
       WHERE document_id = ?
         AND (
           provision_ref = ?
           OR provision_ref = ?
           OR section = ?
           OR section = ?
         )
       LIMIT 1`
    ).get(doc.id, artRef, artDot, parsed.article, artRef);
    provisionExists = !!prov;

    if (!provisionExists) {
      warnings.push(`Art. ${parsed.article} not found in ${doc.title}`);
    }
  }

  return {
    citation: parsed,
    document_exists: true,
    provision_exists: provisionExists,
    document_title: doc.title,
    status: doc.status,
    warnings,
  };
}
