/**
 * Tool registry for Brazil Law MCP Server.
 * Shared between stdio (index.ts) and HTTP (api/mcp.ts) entry points.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import Database from '@ansvar/mcp-sqlite';

import { searchLegislation, SearchLegislationInput } from './search-legislation.js';
import { getProvision, GetProvisionInput } from './get-provision.js';
import { listSources } from './list-sources.js';
import { validateCitationTool, ValidateCitationInput } from './validate-citation.js';
import { buildLegalStance, BuildLegalStanceInput } from './build-legal-stance.js';
import { formatCitationTool, FormatCitationInput } from './format-citation.js';
import { checkCurrency, CheckCurrencyInput } from './check-currency.js';
import { getEUBasis, GetEUBasisInput } from './get-eu-basis.js';
import { getBrazilianImplementations, GetBrazilianImplementationsInput } from './get-brazilian-implementations.js';
import { searchEUImplementations, SearchEUImplementationsInput } from './search-eu-implementations.js';
import { getProvisionEUBasis, GetProvisionEUBasisInput } from './get-provision-eu-basis.js';
import { validateEUCompliance, ValidateEUComplianceInput } from './validate-eu-compliance.js';
import { getAbout, type AboutContext } from './about.js';
export type { AboutContext } from './about.js';

const ABOUT_TOOL: Tool = {
  name: 'about',
  description:
    'Server metadata, dataset statistics, freshness, and provenance. ' +
    'Call this to verify data coverage, currency, and content basis before relying on results.',
  inputSchema: { type: 'object', properties: {} },
};

export const TOOLS: Tool[] = [
  {
    name: 'search_legislation',
    description:
      'Search Brazilian federal laws and regulations by keyword (Portuguese). Returns provision-level results with BM25 relevance ranking. ' +
      'Supports natural language queries (e.g., "dados pessoais", "protecao do consumidor") and FTS5 syntax (AND, OR, NOT, "phrase", prefix*). ' +
      'Results include: document ID, title, provision reference, snippet with >>>highlight<<< markers, and relevance score. ' +
      'Use document_id to filter within a single law. Use status to filter by in_force/amended/repealed. ' +
      'Default limit is 10 (max 50). For broad legal research, prefer build_legal_stance instead.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query in Portuguese. Supports natural language or FTS5 syntax. Example: "dados pessoais" OR "protecao de dados"',
        },
        document_id: {
          type: 'string',
          description: 'Filter to a specific law by ID (e.g., "lei-13709-2018") or title (e.g., "LGPD")',
        },
        status: {
          type: 'string',
          enum: ['in_force', 'amended', 'repealed'],
          description: 'Filter by legislative status. Omit to search all statuses.',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default: 10, max: 50).',
          default: 10,
          minimum: 1,
          maximum: 50,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_provision',
    description:
      'Retrieve the full text of a specific article (artigo) from a Brazilian federal law, or all articles if no article is specified. ' +
      'Pass law_identifier as the internal ID (e.g., "lei-13709-2018"), a citation (e.g., "Lei 13.709/2018"), or a short name (e.g., "LGPD"). ' +
      'Brazilian provisions use article notation: Art. 1o, Art. 5o. Pass article as a number (e.g., "1", "5"). ' +
      'Returns: document ID, title, status, provision reference, article number, content text, and citation URL. ' +
      'WARNING: Omitting article returns ALL provisions (capped at 200) for the law.',
    inputSchema: {
      type: 'object',
      properties: {
        law_identifier: {
          type: 'string',
          description: 'Law identifier: internal ID (e.g., "lei-13709-2018"), citation (e.g., "Lei 13.709/2018"), or short name (e.g., "LGPD", "Marco Civil", "CDC").',
        },
        article: {
          type: 'string',
          description: 'Article number (e.g., "1", "5", "7"). Ordinal suffixes (1o) are handled automatically.',
        },
      },
      required: ['law_identifier'],
    },
  },
  {
    name: 'list_sources',
    description:
      'Returns metadata about all data sources backing this server, including jurisdiction, authoritative source details, ' +
      'database tier, schema version, build date, record counts, and known limitations. ' +
      'Call this first to understand data coverage and freshness before relying on other tools.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'validate_citation',
    description:
      'Validate a Brazilian legal citation against the database. Returns whether the cited law and article exist. ' +
      'Use this as a zero-hallucination check before presenting legal references to users. ' +
      'Supported formats: "Art. 1o, Lei no 13.709/2018", "Art. 1, LGPD", "lei-13709-2018, art. 1". ' +
      'Returns: valid (boolean), parsed components, warnings about repealed/amended status.',
    inputSchema: {
      type: 'object',
      properties: {
        citation: {
          type: 'string',
          description: 'Brazilian legal citation to validate. Examples: "Art. 1o, Lei 13.709/2018", "Art. 5, LGPD", "Art. 7, Marco Civil"',
        },
      },
      required: ['citation'],
    },
  },
  {
    name: 'build_legal_stance',
    description:
      'Build a comprehensive set of citations for a legal question by searching across all Brazilian federal laws simultaneously. ' +
      'Returns aggregated results from legislation search, cross-referenced with EU/international law where applicable. ' +
      'Best for broad legal research questions like "What Brazilian laws govern personal data processing?" ' +
      'For targeted lookups of a known article, use get_provision instead.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Legal question or topic to research in Portuguese (e.g., "tratamento de dados pessoais")',
        },
        document_id: {
          type: 'string',
          description: 'Optionally limit search to one law by ID or title',
        },
        limit: {
          type: 'number',
          description: 'Max results per category (default: 5, max: 20)',
          default: 5,
          minimum: 1,
          maximum: 20,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'format_citation',
    description:
      'Format a Brazilian legal citation per standard conventions. ' +
      'Formats: "full" -> "Art. 1o, Lei no 13.709/2018", ' +
      '"short" -> "Art. 1o, Lei 13.709/2018", "pinpoint" -> "Art. 1o". ' +
      'Does NOT validate existence -- use validate_citation for that.',
    inputSchema: {
      type: 'object',
      properties: {
        citation: {
          type: 'string',
          description: 'Citation string to format (e.g., "Art. 1, Lei 13.709/2018")',
        },
        format: {
          type: 'string',
          enum: ['full', 'short', 'pinpoint'],
          description: 'Output format. "full" (default): formal citation. "short": abbreviated. "pinpoint": article reference only.',
          default: 'full',
        },
      },
      required: ['citation'],
    },
  },
  {
    name: 'check_currency',
    description:
      'Check whether a Brazilian federal law or article is currently in force (vigente), amended, or repealed (revogada). ' +
      'Returns: is_current (boolean), status, dates (issued, in-force), and warnings. ' +
      'Essential before citing legislation -- repealed laws should not be cited as current law.',
    inputSchema: {
      type: 'object',
      properties: {
        document_id: {
          type: 'string',
          description: 'Law identifier (e.g., "lei-13709-2018") or title (e.g., "LGPD")',
        },
        provision_ref: {
          type: 'string',
          description: 'Optional article reference to check a specific article (e.g., "art1", "5")',
        },
      },
      required: ['document_id'],
    },
  },
  {
    name: 'get_eu_basis',
    description:
      'Get EU/international legal basis for a Brazilian law. Returns all EU instruments that the Brazilian law ' +
      'implements, is modeled on, or references, including CELEX numbers and relationship status. ' +
      'Key example: LGPD (Lei 13.709/2018) -> modeled on GDPR (Regulation 2016/679).',
    inputSchema: {
      type: 'object',
      properties: {
        document_id: {
          type: 'string',
          description: 'Brazilian law identifier (e.g., "lei-13709-2018") or title (e.g., "LGPD")',
        },
        include_articles: {
          type: 'boolean',
          description: 'Include specific EU article references in the response (default: false)',
          default: false,
        },
        reference_types: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['implements', 'supplements', 'applies', 'references', 'modeled_on', 'cites_article'],
          },
          description: 'Filter by reference type (e.g., ["modeled_on"]). Omit to return all types.',
        },
      },
      required: ['document_id'],
    },
  },
  {
    name: 'get_brazilian_implementations',
    description:
      'Find Brazilian laws that implement or are modeled on a specific EU directive or regulation. ' +
      'Input the EU document ID in "type:year/number" format (e.g., "regulation:2016/679" for GDPR). ' +
      'Returns matching Brazilian laws with relationship status and whether each is the primary implementation.',
    inputSchema: {
      type: 'object',
      properties: {
        eu_document_id: {
          type: 'string',
          description: 'EU document ID in format "type:year/number" (e.g., "regulation:2016/679" for GDPR)',
        },
        primary_only: {
          type: 'boolean',
          description: 'Return only primary implementing laws (default: false)',
          default: false,
        },
        in_force_only: {
          type: 'boolean',
          description: 'Return only laws currently in force (default: false)',
          default: false,
        },
      },
      required: ['eu_document_id'],
    },
  },
  {
    name: 'search_eu_implementations',
    description:
      'Search for EU directives and regulations that have been implemented or referenced by Brazilian laws. ' +
      'Search by keyword (e.g., "data protection", "privacy"), filter by type (directive/regulation), ' +
      'or year range. Returns EU documents with counts of Brazilian laws referencing them.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Keyword search across EU document titles and short names (e.g., "data protection")',
        },
        type: {
          type: 'string',
          enum: ['directive', 'regulation'],
          description: 'Filter by EU document type',
        },
        year_from: { type: 'number', description: 'Filter: EU documents from this year onwards' },
        year_to: { type: 'number', description: 'Filter: EU documents up to this year' },
        has_brazilian_implementation: {
          type: 'boolean',
          description: 'If true, only return EU documents that have at least one Brazilian implementing law',
        },
        limit: {
          type: 'number',
          description: 'Max results (default: 20, max: 100)',
          default: 20,
          minimum: 1,
          maximum: 100,
        },
      },
    },
  },
  {
    name: 'get_provision_eu_basis',
    description:
      'Get EU/international legal basis for a specific article within a Brazilian law, with article-level precision. ' +
      'Example: LGPD Art. 5 -> references GDPR Art. 4 (definitions). ' +
      'Use this for pinpoint EU compliance checks at the provision level.',
    inputSchema: {
      type: 'object',
      properties: {
        document_id: {
          type: 'string',
          description: 'Brazilian law identifier (e.g., "lei-13709-2018") or title',
        },
        provision_ref: {
          type: 'string',
          description: 'Article reference (e.g., "art5", "1")',
        },
      },
      required: ['document_id', 'provision_ref'],
    },
  },
  {
    name: 'validate_eu_compliance',
    description:
      'Check EU compliance status for a Brazilian law or article. Detects references to EU directives, ' +
      'modeled-on relationships, and alignment gaps. Returns compliance status: compliant, partial, unclear, or not_applicable. ' +
      'Useful for assessing LGPD-GDPR alignment at the law or article level.',
    inputSchema: {
      type: 'object',
      properties: {
        document_id: {
          type: 'string',
          description: 'Brazilian law identifier (e.g., "lei-13709-2018") or title',
        },
        provision_ref: {
          type: 'string',
          description: 'Optional: check a specific article (e.g., "art5")',
        },
        eu_document_id: {
          type: 'string',
          description: 'Optional: check compliance with a specific EU document (e.g., "regulation:2016/679")',
        },
      },
      required: ['document_id'],
    },
  },
];

export function buildTools(context?: AboutContext): Tool[] {
  return context ? [...TOOLS, ABOUT_TOOL] : TOOLS;
}

export function registerTools(
  server: Server,
  db: InstanceType<typeof Database>,
  context?: AboutContext,
): void {
  const allTools = buildTools(context);

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: allTools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: unknown;

      switch (name) {
        case 'search_legislation':
          result = await searchLegislation(db, args as unknown as SearchLegislationInput);
          break;
        case 'get_provision':
          result = await getProvision(db, {
            law_identifier: (args as any)?.law_identifier,
            document_id: (args as any)?.document_id ?? (args as any)?.law_identifier,
            article: (args as any)?.article,
            provision_ref: (args as any)?.provision_ref,
          } as GetProvisionInput);
          break;
        case 'list_sources':
          result = await listSources(db);
          break;
        case 'validate_citation':
          result = await validateCitationTool(db, args as unknown as ValidateCitationInput);
          break;
        case 'build_legal_stance':
          result = await buildLegalStance(db, args as unknown as BuildLegalStanceInput);
          break;
        case 'format_citation':
          result = await formatCitationTool(args as unknown as FormatCitationInput);
          break;
        case 'check_currency':
          result = await checkCurrency(db, args as unknown as CheckCurrencyInput);
          break;
        case 'get_eu_basis':
          result = await getEUBasis(db, args as unknown as GetEUBasisInput);
          break;
        case 'get_brazilian_implementations':
          result = await getBrazilianImplementations(db, args as unknown as GetBrazilianImplementationsInput);
          break;
        case 'search_eu_implementations':
          result = await searchEUImplementations(db, args as unknown as SearchEUImplementationsInput);
          break;
        case 'get_provision_eu_basis':
          result = await getProvisionEUBasis(db, args as unknown as GetProvisionEUBasisInput);
          break;
        case 'validate_eu_compliance':
          result = await validateEUCompliance(db, args as unknown as ValidateEUComplianceInput);
          break;
        case 'about':
          if (context) {
            result = getAbout(db, context);
          } else {
            return {
              content: [{ type: 'text', text: 'About tool not configured.' }],
              isError: true,
            };
          }
          break;
        default:
          return {
            content: [{ type: 'text', text: `Error: Unknown tool "${name}".` }],
            isError: true,
          };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: 'text', text: `Error: ${message}` }],
        isError: true,
      };
    }
  });
}
