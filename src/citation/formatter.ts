/**
 * Brazilian legal citation formatter.
 *
 * Formats:
 *   full:     "Art. 1o, Lei no 13.709, de 14 de agosto de 2018"
 *   short:    "Art. 1o, Lei 13.709/2018"
 *   pinpoint: "Art. 1o, par. 1o, II, alinea b"
 */

import type { ParsedCitation, CitationFormat } from '../types/index.js';

/** Type label map (internal code -> display label) */
const TYPE_LABEL: Record<string, string> = {
  lei: 'Lei',
  lc: 'Lei Complementar',
  mp: 'Medida Provisoria',
  decreto: 'Decreto',
  constituicao: 'Constituicao Federal',
};

/**
 * Format a number with Brazilian ordinal suffix (1o, 2o, etc.)
 */
function ordinal(n: string | number): string {
  return `${n}\u00BA`;
}

/**
 * Format a law number with Brazilian dot separators (13.709).
 */
function formatLawNumber(n: number): string {
  return n.toLocaleString('pt-BR');
}

export function formatCitation(
  parsed: ParsedCitation,
  format: CitationFormat = 'full'
): string {
  if (!parsed.valid || !parsed.article) {
    return '';
  }

  const pinpoint = buildPinpoint(parsed);
  const typeLabel = TYPE_LABEL[parsed.law_type ?? parsed.type] ?? 'Lei';

  switch (format) {
    case 'full': {
      if (parsed.type === 'constituicao') {
        return `Art. ${pinpoint}, Constituicao Federal de ${parsed.year ?? 1988}`;
      }
      const numStr = parsed.number ? formatLawNumber(parsed.number) : '';
      return `Art. ${pinpoint}, ${typeLabel} n\u00BA ${numStr}/${parsed.year ?? ''}`.trim();
    }

    case 'short': {
      if (parsed.type === 'constituicao') {
        return `Art. ${pinpoint}, CF/88`;
      }
      const numStr = parsed.number ? formatLawNumber(parsed.number) : '';
      return `Art. ${pinpoint}, ${typeLabel} ${numStr}/${parsed.year ?? ''}`.trim();
    }

    case 'pinpoint':
      return `Art. ${pinpoint}`;

    default:
      return `Art. ${pinpoint}, ${typeLabel} ${parsed.number ?? ''}/${parsed.year ?? ''}`.trim();
  }
}

function buildPinpoint(parsed: ParsedCitation): string {
  let ref = ordinal(parsed.article ?? '');

  if (parsed.paragraph) {
    ref += parsed.paragraph === 'unico'
      ? ', paragrafo unico'
      : `, \u00A7 ${ordinal(parsed.paragraph)}`;
  }

  if (parsed.inciso) {
    ref += `, ${parsed.inciso}`;
  }

  if (parsed.alinea) {
    ref += `, alinea ${parsed.alinea}`;
  }

  return ref;
}
