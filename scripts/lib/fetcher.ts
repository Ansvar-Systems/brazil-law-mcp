/**
 * Rate-limited HTTP client for Brazilian legal data sources.
 *
 * Dual-source fetcher:
 *   - planalto.gov.br (HTML) — Presidency of the Republic
 *   - lexml.gov.br (XML) — Federal Senate structured XML
 *
 * - 500ms minimum delay between requests
 * - User-Agent header identifying the MCP
 * - No auth needed (public domain / government open data)
 */

const USER_AGENT = 'Mozilla/5.0 (compatible; BrazilLawMCP/1.0; +https://github.com/Ansvar-Systems/brazil-law-mcp)';
const MIN_DELAY_MS = 500;

let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

export interface FetchResult {
  status: number;
  body: string;
  contentType: string;
}

/**
 * Fetch a URL with rate limiting and proper headers.
 * Retries up to 3 times on 429/5xx errors with exponential backoff.
 */
export async function fetchWithRateLimit(url: string, maxRetries = 3): Promise<FetchResult> {
  await rateLimit();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html, application/xml, application/xhtml+xml, */*',
      },
    });

    if (response.status === 429 || response.status >= 500) {
      if (attempt < maxRetries) {
        const backoff = Math.pow(2, attempt + 1) * 1000;
        console.log(`  HTTP ${response.status} for ${url}, retrying in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }
    }

    const body = await response.text();
    return {
      status: response.status,
      body,
      contentType: response.headers.get('content-type') ?? '',
    };
  }

  throw new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}

/**
 * Fetch a law page from planalto.gov.br (HTML).
 */
export async function fetchPlanaltoHtml(path: string): Promise<FetchResult> {
  const url = `https://www.planalto.gov.br/ccivil_03/${path}`;
  return fetchWithRateLimit(url);
}

/**
 * Fetch a compiled/consolidated law from planalto.gov.br.
 */
export async function fetchPlanaltoLaw(lawPath: string): Promise<FetchResult> {
  return fetchWithRateLimit(`https://www.planalto.gov.br/ccivil_03/${lawPath}`);
}

/**
 * Fetch structured XML from LexML Brazil.
 */
export async function fetchLexmlXml(urn: string): Promise<FetchResult> {
  const url = `https://www.lexml.gov.br/urn/${urn}`;
  return fetchWithRateLimit(url);
}

/**
 * Fetch a direct URL.
 */
export async function fetchUrl(url: string): Promise<FetchResult> {
  return fetchWithRateLimit(url);
}
