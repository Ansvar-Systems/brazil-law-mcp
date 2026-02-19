/**
 * Brazilian legal citation parser.
 *
 * Parses citations like:
 *   "Art. 1o, Lei no 13.709, de 14 de agosto de 2018"    (full)
 *   "Art. 1o, Lei 13.709/2018"                            (short)
 *   "Art. 1o, LGPD"                                       (alias)
 *   "Art. 1o, par. 1o"                                    (pinpoint with paragraph)
 *   "lei-13709-2018, art. 1"                              (ID-based)
 *   "Art. 5o, II, alinea b"                               (with inciso and alinea)
 */

import type { ParsedCitation } from '../types/index.js';

/** Portuguese month names for date parsing */
const MONTHS: Record<string, number> = {
  janeiro: 1, fevereiro: 2, marco: 3, abril: 4,
  maio: 5, junho: 6, julho: 7, agosto: 8,
  setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

/** Alias map for well-known laws */
const ALIAS_MAP: Record<string, { type: string; number: number; year: number }> = {
  'lgpd': { type: 'lei', number: 13709, year: 2018 },
  'marco civil': { type: 'lei', number: 12965, year: 2014 },
  'marco civil da internet': { type: 'lei', number: 12965, year: 2014 },
  'cdc': { type: 'lei', number: 8078, year: 1990 },
  'codigo de defesa do consumidor': { type: 'lei', number: 8078, year: 1990 },
  'codigo civil': { type: 'lei', number: 10406, year: 2002 },
  'carolina dieckmann': { type: 'lei', number: 12737, year: 2012 },
  'constituicao': { type: 'constituicao', number: 0, year: 1988 },
  'cf': { type: 'constituicao', number: 0, year: 1988 },
  'cf/88': { type: 'constituicao', number: 0, year: 1988 },
};

/** Map Portuguese type labels to internal type codes */
const TYPE_MAP: Record<string, string> = {
  'lei': 'lei',
  'lei complementar': 'lc',
  'medida provisoria': 'mp',
  'decreto': 'decreto',
  'constituicao': 'constituicao',
};

/**
 * Normalize ordinal suffixes: 1o, 1a, 2o -> 1, 2
 * Handles Unicode ordinal markers too.
 */
function stripOrdinal(s: string): string {
  return s.replace(/[ºªo°]+$/i, '').trim();
}

/**
 * Normalize text by removing accents for matching.
 */
function removeAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Full citation: "Art. 1o, Lei no 13.709, de 14 de agosto de 2018"
const FULL_CITATION = /^art\.?\s*(\d+[ºªo°]?)\s*,?\s*(lei|lei complementar|medida provis[oó]ria|decreto)\s+(?:n[ºo.]?\s*)?(\d[\d.]*)\s*,\s*de\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i;

// Short citation: "Art. 1o, Lei 13.709/2018"
const SHORT_CITATION = /^art\.?\s*(\d+[ºªo°]?)\s*,?\s*(lei|lei complementar|medida provis[oó]ria|decreto)\s+(?:n[ºo.]?\s*)?(\d[\d.]*)\s*\/\s*(\d{4})/i;

// Alias citation: "Art. 1o, LGPD"
const ALIAS_CITATION = /^art\.?\s*(\d+[ºªo°]?)\s*,?\s*(.+)$/i;

// ID-based citation: "lei-13709-2018, art. 1"
const ID_CITATION = /^(lei|lc|mp|decreto|constituicao)-(\d+)-(\d{4})\s*,?\s*art\.?\s*(\d+[ºªo°]?)/i;

// Paragraph: "par. 1o" or "ss 1o"
const PARAGRAPH_RE = /[§\u00a7]\s*(\d+[ºªo°]?)|par[aá]grafo\s+(?:[uú]nico|(\d+[ºªo°]?))/i;

// Inciso: Roman numeral items (I, II, III, IV, ...)
const INCISO_RE = /inciso\s+([IVXLCDM]+)|,\s*([IVXLCDM]+)\s*(?:,|$)/i;

// Alinea: lettered sub-items (a, b, c, ...)
const ALINEA_RE = /al[ií]nea\s+([a-z])/i;

export function parseCitation(citation: string): ParsedCitation {
  const trimmed = removeAccents(citation.trim());

  // Extract pinpoint elements (paragraph, inciso, alinea) from the full string
  const paragraphMatch = trimmed.match(PARAGRAPH_RE);
  const paragraph = paragraphMatch
    ? (paragraphMatch[1] ? stripOrdinal(paragraphMatch[1]) : 'unico')
    : undefined;

  const incisoMatch = trimmed.match(INCISO_RE);
  const inciso = incisoMatch ? (incisoMatch[1] ?? incisoMatch[2]) : undefined;

  const alineaMatch = trimmed.match(ALINEA_RE);
  const alinea = alineaMatch ? alineaMatch[1] : undefined;

  // Try ID-based citation first
  let match = trimmed.match(ID_CITATION);
  if (match) {
    const lawType = match[1].toLowerCase();
    return {
      valid: true,
      type: lawType as ParsedCitation['type'],
      law_type: lawType,
      number: parseInt(match[2], 10),
      year: parseInt(match[3], 10),
      article: stripOrdinal(match[4]),
      paragraph,
      inciso,
      alinea,
    };
  }

  // Try full citation
  match = trimmed.match(FULL_CITATION);
  if (match) {
    const rawType = removeAccents(match[2].toLowerCase());
    const lawType = TYPE_MAP[rawType] ?? 'lei';
    const number = parseInt(match[3].replace(/\./g, ''), 10);
    const year = parseInt(match[6], 10);
    return {
      valid: true,
      type: lawType as ParsedCitation['type'],
      law_type: lawType,
      title: `${match[2]} ${match[3]}/${match[6]}`,
      number,
      year,
      article: stripOrdinal(match[1]),
      paragraph,
      inciso,
      alinea,
    };
  }

  // Try short citation
  match = trimmed.match(SHORT_CITATION);
  if (match) {
    const rawType = removeAccents(match[2].toLowerCase());
    const lawType = TYPE_MAP[rawType] ?? 'lei';
    const number = parseInt(match[3].replace(/\./g, ''), 10);
    const year = parseInt(match[4], 10);
    return {
      valid: true,
      type: lawType as ParsedCitation['type'],
      law_type: lawType,
      title: `${match[2]} ${match[3]}/${match[4]}`,
      number,
      year,
      article: stripOrdinal(match[1]),
      paragraph,
      inciso,
      alinea,
    };
  }

  // Try alias citation
  match = trimmed.match(ALIAS_CITATION);
  if (match) {
    const aliasKey = match[2].trim().toLowerCase();
    const alias = ALIAS_MAP[aliasKey];
    if (alias) {
      return {
        valid: true,
        type: alias.type as ParsedCitation['type'],
        law_type: alias.type,
        number: alias.number,
        year: alias.year,
        article: stripOrdinal(match[1]),
        paragraph,
        inciso,
        alinea,
      };
    }
  }

  return {
    valid: false,
    type: 'unknown',
    error: `Could not parse Brazilian citation: "${citation.trim()}"`,
  };
}
