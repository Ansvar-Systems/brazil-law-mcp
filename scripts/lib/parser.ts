/**
 * Parser for Brazilian legislation from planalto.gov.br (HTML) and lexml.gov.br (XML).
 *
 * Planalto HTML: Articles marked with "Art." prefix, paragraphs with ss symbol,
 * incisos with Roman numerals, alineas with lowercase letters.
 *
 * LexML XML: Structured XML with URN identifiers following the LexML Brazil standard.
 */

import { load as cheerioLoad, type CheerioAPI } from 'cheerio';
import { XMLParser } from 'fast-xml-parser';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LawIndexEntry {
  title: string;
  type: string;
  number: number;
  year: number;
  url: string;
  path: string;
}

export interface ParsedProvision {
  provision_ref: string;
  section: string;
  title: string;
  content: string;
  chapter?: string;
}

export interface ParsedLaw {
  id: string;
  type: string;
  title: string;
  short_name: string;
  status: 'in_force';
  issued_date: string;
  url: string;
  provisions: ParsedProvision[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Portuguese date parsing
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS: Record<string, string> = {
  janeiro: '01', fevereiro: '02', marco: '03', abril: '04',
  maio: '05', junho: '06', julho: '07', agosto: '08',
  setembro: '09', outubro: '10', novembro: '11', dezembro: '12',
};

function removeAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseBrazilianDate(dateStr: string): string {
  // "14 de agosto de 2018" -> "2018-08-14"
  const match = dateStr.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (match) {
    const day = match[1].padStart(2, '0');
    const monthName = removeAccents(match[2].toLowerCase());
    const month = MONTHS[monthName] ?? '01';
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML Parser (Planalto)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip ordinal suffixes from article numbers: 1o, 1a -> 1
 */
function stripOrdinal(s: string): string {
  return s.replace(/[ºªo°]+$/i, '').trim();
}

/**
 * Parse a Planalto HTML page into structured provisions.
 *
 * Planalto uses a simple format where articles appear as paragraphs
 * starting with "Art." followed by the article number.
 */
export function parsePlanaltoHtml(
  html: string,
  lawType: string,
  lawNumber: number,
  year: number,
  lawTitle: string
): ParsedLaw {
  const $ = cheerioLoad(html);
  const provisions: ParsedProvision[] = [];
  let currentChapter = '';

  // Extract date from title block
  let issuedDate = `${year}-01-01`;
  const dateMatch = html.match(/de\s+(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (dateMatch) {
    issuedDate = parseBrazilianDate(`${dateMatch[1]} de ${dateMatch[2]} de ${dateMatch[3]}`);
  }

  // Extract chapter headings and articles from the HTML body
  const textContent = $('body').text();
  const lines = textContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Detect chapter headings (CAPITULO, TITULO, SECAO)
    const chapterMatch = line.match(/^(CAP[IÍ]TULO|T[IÍ]TULO|SE[CÇ][AÃ]O)\s+([IVXLCDM]+)/i);
    if (chapterMatch) {
      // Next non-empty line might be the chapter title
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      currentChapter = `${chapterMatch[1]} ${chapterMatch[2]}${nextLine && !nextLine.match(/^Art\./i) ? ' - ' + nextLine : ''}`;
      i++;
      continue;
    }

    // Detect articles: "Art. 1o ..." or "Art. 1. ..."
    const artMatch = line.match(/^Art\.\s*(\d+)[ºªo°.\s-]*(.*)/i);
    if (artMatch) {
      const artNum = stripOrdinal(artMatch[1]);
      let content = artMatch[2].trim();

      // Collect continuation lines (paragraphs, incisos, alineas)
      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        // Stop at next article or chapter
        if (nextLine.match(/^Art\.\s*\d+/i) || nextLine.match(/^(CAP[IÍ]TULO|T[IÍ]TULO|SE[CÇ][AÃ]O)\s+[IVXLCDM]+/i)) {
          break;
        }
        content += '\n' + nextLine;
        i++;
      }

      provisions.push({
        provision_ref: `art${artNum}`,
        section: artNum,
        title: '',
        content: content.replace(/\s+/g, ' ').trim(),
        chapter: currentChapter || undefined,
      });
    }

    i++;
  }

  const id = `${lawType}-${lawNumber}-${year}`;

  return {
    id,
    type: lawType,
    title: lawTitle,
    short_name: buildShortName(lawTitle, year),
    status: 'in_force',
    issued_date: issuedDate,
    url: `https://www.planalto.gov.br/ccivil_03/`,
    provisions,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// XML Parser (LexML)
// ─────────────────────────────────────────────────────────────────────────────

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  isArray: (name) => {
    return [
      'Artigo', 'Paragrafo', 'Inciso', 'Alinea',
      'Capitulo', 'Titulo', 'Secao', 'Subsecao',
      'Caput', 'p',
    ].includes(name);
  },
  trimValues: true,
  parseAttributeValue: false,
});

/**
 * Extract text content from a LexML XML node, recursively.
 */
function extractXmlText(node: unknown): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractXmlText).filter(Boolean).join(' ');
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    const parts: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('@_')) continue;
      parts.push(extractXmlText(value));
    }
    return parts.filter(Boolean).join(' ');
  }
  return '';
}

/**
 * Parse a LexML XML document into structured provisions.
 */
export function parseLexmlXml(
  xml: string,
  lawType: string,
  lawNumber: number,
  year: number,
  lawTitle: string
): ParsedLaw {
  const parsed = xmlParser.parse(xml);
  const provisions: ParsedProvision[] = [];

  // Navigate into the document structure
  const root = parsed.LexML ?? parsed;
  const norma = root?.Norma ?? root;
  const artigos = findArticles(norma);

  for (const artigo of artigos) {
    if (!artigo || typeof artigo !== 'object') continue;
    const art = artigo as Record<string, unknown>;

    const id = (art['@_id'] as string) ?? '';
    const numMatch = id.match(/art(\d+)/i);
    const artNum = numMatch ? numMatch[1] : '';

    const content = extractXmlText(art);

    if (content.trim() && artNum) {
      provisions.push({
        provision_ref: `art${artNum}`,
        section: artNum,
        title: '',
        content: content.replace(/\s+/g, ' ').trim(),
      });
    }
  }

  const id = `${lawType}-${lawNumber}-${year}`;

  return {
    id,
    type: lawType,
    title: lawTitle,
    short_name: buildShortName(lawTitle, year),
    status: 'in_force',
    issued_date: `${year}-01-01`,
    url: `https://www.planalto.gov.br/ccivil_03/`,
    provisions,
  };
}

/**
 * Recursively find all Artigo elements in a LexML document.
 */
function findArticles(node: unknown): unknown[] {
  if (!node || typeof node !== 'object') return [];

  const obj = node as Record<string, unknown>;
  const results: unknown[] = [];

  if ('Artigo' in obj) {
    const artigos = Array.isArray(obj.Artigo) ? obj.Artigo : [obj.Artigo];
    results.push(...artigos);
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('@_') || key === '#text' || key === 'Artigo') continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        results.push(...findArticles(item));
      }
    } else if (value && typeof value === 'object') {
      results.push(...findArticles(value));
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildShortName(title: string, year: number): string {
  // Well-known short names
  if (/13\.?709/i.test(title) && year === 2018) return 'LGPD';
  if (/12\.?965/i.test(title) && year === 2014) return 'Marco Civil da Internet';
  if (/12\.?737/i.test(title) && year === 2012) return 'Lei Carolina Dieckmann';
  if (/8\.?078/i.test(title) && year === 1990) return 'CDC';
  if (/10\.?406/i.test(title) && year === 2002) return 'Codigo Civil';
  if (/9\.?472/i.test(title) && year === 1997) return 'LGT';
  if (/constituicao/i.test(title)) return 'CF/88';

  // Abbreviation from title
  const words = title.replace(/[()]/g, '').split(/\s+/);
  if (words.length <= 3) return `${title} ${year}`;

  const significant = words.filter(w =>
    w.length > 2 &&
    w[0] === w[0].toUpperCase() &&
    !['Lei', 'Da', 'De', 'Do', 'Das', 'Dos', 'No', 'Na', 'Em', 'Para', 'Com', 'Sobre'].includes(w)
  );

  if (significant.length >= 2) {
    const initials = significant.slice(0, 4).map(w => w[0]).join('');
    return `${initials} ${year}`;
  }

  return `${title.substring(0, 30).trim()} ${year}`;
}
