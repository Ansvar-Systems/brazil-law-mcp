/**
 * check_currency — Check if a Brazilian federal law is currently in force.
 */

import type { Database } from '@ansvar/mcp-sqlite';
import { generateResponseMetadata, type ToolResponse } from '../utils/metadata.js';

export interface CheckCurrencyInput {
  document_id: string;
  provision_ref?: string;
}

export interface CurrencyResult {
  document_id: string;
  title: string;
  status: string;
  type: string;
  issued_date: string | null;
  in_force_date: string | null;
  is_current: boolean;
  provision_exists?: boolean;
  warnings: string[];
}

interface DocumentRow {
  id: string;
  title: string;
  status: string;
  type: string;
  issued_date: string | null;
  in_force_date: string | null;
}

export async function checkCurrency(
  db: Database,
  input: CheckCurrencyInput
): Promise<ToolResponse<CurrencyResult | null>> {
  if (!input.document_id) {
    throw new Error('document_id is required');
  }

  const doc = db.prepare(`
    SELECT id, title, status, type, issued_date, in_force_date
    FROM legal_documents
    WHERE id = ? OR title LIKE ?
    LIMIT 1
  `).get(input.document_id, `%${input.document_id}%`) as DocumentRow | undefined;

  if (!doc) {
    return {
      results: null,
      _metadata: generateResponseMetadata(db)
    };
  }

  const warnings: string[] = [];
  const isCurrent = doc.status === 'in_force';

  if (doc.status === 'repealed') {
    warnings.push('This law has been repealed (revogada)');
  }

  let provisionExists: boolean | undefined;
  if (input.provision_ref) {
    const normalizedRef = input.provision_ref
      .replace(/^art\.?\s*/i, '')
      .replace(/[ºªo°]+$/i, '')
      .trim();
    const artRef = `art${normalizedRef}`;

    const prov = db.prepare(
      'SELECT 1 FROM legal_provisions WHERE document_id = ? AND (provision_ref = ? OR provision_ref = ? OR section = ?)'
    ).get(doc.id, input.provision_ref, artRef, normalizedRef);
    provisionExists = !!prov;

    if (!provisionExists) {
      warnings.push(`Provision "${input.provision_ref}" not found in this document`);
    }
  }

  return {
    results: {
      document_id: doc.id,
      title: doc.title,
      status: doc.status,
      type: doc.type,
      issued_date: doc.issued_date,
      in_force_date: doc.in_force_date,
      is_current: isCurrent,
      provision_exists: provisionExists,
      warnings,
    },
    _metadata: generateResponseMetadata(db)
  };
}
