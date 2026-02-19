/**
 * Brazilian statute identifier handling.
 *
 * Brazilian laws are identified by type-number-year, e.g. "lei-13709-2018" (LGPD).
 * Types: lei (ordinary law), lc (complementary law), mp (medida provisoria), decreto (decree).
 *
 * Also supports lookup by common short names: LGPD, Marco Civil, CDC, etc.
 */

import type { Database } from '@ansvar/mcp-sqlite';

/** Well-known short names for Brazilian legislation */
const SHORT_NAME_MAP: Record<string, string> = {
  'lgpd': 'lei-13709-2018',
  'marco civil': 'lei-12965-2014',
  'marco civil da internet': 'lei-12965-2014',
  'carolina dieckmann': 'lei-12737-2012',
  'lei carolina dieckmann': 'lei-12737-2012',
  'cdc': 'lei-8078-1990',
  'codigo de defesa do consumidor': 'lei-8078-1990',
  'codigo civil': 'lei-10406-2002',
  'lei geral de telecomunicacoes': 'lei-9472-1997',
  'lgt': 'lei-9472-1997',
  'constituicao': 'constituicao-1988',
  'constituicao federal': 'constituicao-1988',
  'cf': 'constituicao-1988',
  'cf/88': 'constituicao-1988',
};

/**
 * Normalize a "Lei nnn/yyyy" or "Lei n. nnn/yyyy" style reference into
 * the internal ID format "lei-nnn-yyyy".
 */
function normalizeReference(input: string): string | null {
  // Handle "Lei nº 13.709, de 14 de agosto de 2018" or "Lei 13.709/2018"
  const fullMatch = input.match(
    /^(lei|lc|mp|decreto)\s+(?:n[ºo.]?\s*)?(\d[\d.]*)\s*(?:\/|,\s*de\s+\d{1,2}\s+de\s+\w+\s+de\s+)(\d{4})/i
  );
  if (fullMatch) {
    const type = fullMatch[1].toLowerCase();
    const number = fullMatch[2].replace(/\./g, '');
    const year = fullMatch[3];
    return `${type}-${number}-${year}`;
  }

  // Handle "Lei 13.709/2018" shorthand
  const shortMatch = input.match(
    /^(lei|lc|mp|decreto)\s+(?:n[ºo.]?\s*)?(\d[\d.]*)\s*\/\s*(\d{4})/i
  );
  if (shortMatch) {
    const type = shortMatch[1].toLowerCase();
    const number = shortMatch[2].replace(/\./g, '');
    const year = shortMatch[3];
    return `${type}-${number}-${year}`;
  }

  return null;
}

export function isValidStatuteId(id: string): boolean {
  return id.length > 0 && id.trim().length > 0;
}

export function statuteIdCandidates(id: string): string[] {
  const trimmed = id.trim().toLowerCase();
  const candidates = new Set<string>();
  candidates.add(trimmed);
  candidates.add(id.trim());

  // Check short name map
  const mapped = SHORT_NAME_MAP[trimmed];
  if (mapped) {
    candidates.add(mapped);
  }

  // Try normalizing reference notation
  const normalized = normalizeReference(id.trim());
  if (normalized) {
    candidates.add(normalized);
  }

  // Convert spaces/dashes
  if (trimmed.includes(' ')) {
    candidates.add(trimmed.replace(/\s+/g, '-'));
  }
  if (trimmed.includes('-')) {
    candidates.add(trimmed.replace(/-/g, ' '));
  }

  return [...candidates];
}

export function resolveExistingStatuteId(
  db: Database,
  inputId: string,
): string | null {
  // Try exact match first
  const exact = db.prepare(
    "SELECT id FROM legal_documents WHERE id = ? LIMIT 1"
  ).get(inputId) as { id: string } | undefined;

  if (exact) return exact.id;

  // Try short name map
  const lower = inputId.trim().toLowerCase();
  const mapped = SHORT_NAME_MAP[lower];
  if (mapped) {
    const fromMap = db.prepare(
      "SELECT id FROM legal_documents WHERE id = ? LIMIT 1"
    ).get(mapped) as { id: string } | undefined;
    if (fromMap) return fromMap.id;
  }

  // Try normalizing reference notation
  const normalized = normalizeReference(inputId.trim());
  if (normalized) {
    const fromNorm = db.prepare(
      "SELECT id FROM legal_documents WHERE id = ? LIMIT 1"
    ).get(normalized) as { id: string } | undefined;
    if (fromNorm) return fromNorm.id;
  }

  // Try LIKE match on title
  const byTitle = db.prepare(
    "SELECT id FROM legal_documents WHERE title LIKE ? LIMIT 1"
  ).get(`%${inputId}%`) as { id: string } | undefined;

  return byTitle?.id ?? null;
}
