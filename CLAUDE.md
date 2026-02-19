# Brazil Law MCP — Project Guide

## Overview
MCP server providing Brazilian federal legislation via Model Context Protocol. Data sourced from planalto.gov.br (Presidency of the Republic) and lexml.gov.br (Federal Senate). Strategy A deployment (bundled DB in npm package, with Strategy B fallback for Vercel).

## Architecture
- **Dual transport**: stdio (`src/index.ts`) + Streamable HTTP (`api/mcp.ts`)
- **Shared tool registry**: `src/tools/registry.ts` — both transports use identical tools
- **Database**: SQLite + FTS5, built by `scripts/build-db.ts` from seed JSON
- **Ingestion**: `scripts/ingest.ts` fetches HTML from planalto.gov.br (cheerio) and XML from lexml.gov.br (fast-xml-parser)
- **Dual source**: Planalto (HTML scrape) + LexML (structured XML)

## Key Conventions
- All tool implementations return `ToolResponse<T>` with `results` + `_metadata`
- Database queries MUST use parameterized statements (never string interpolation)
- FTS5 queries go through `buildFtsQueryVariants()` for sanitization
- Statute IDs resolved via `resolveExistingStatuteId()` (exact match, short name map, then LIKE)
- Journal mode must be DELETE (not WAL) for WASM/serverless compatibility
- Portuguese language throughout — no English translations of legal text

## Brazilian Specifics
- Document ID format: `type-number-year` (e.g., `lei-13709-2018`)
- Types: `lei` (ordinary law), `lc` (complementary law), `mp` (medida provisoria), `decreto` (decree), `constituicao`
- Article notation: `Art. 1o` with ordinal suffix (handled by `stripOrdinal()`)
- Citation format: `Art. 1o, Lei no 13.709/2018` (full), `Art. 1o, LGPD` (alias)
- Pinpoint elements: paragrafo (ss), inciso (Roman numeral), alinea (letter)
- Short name aliases: LGPD, Marco Civil, CDC, CF/88, etc.

## Commands
- `npm test` — run unit + integration tests (vitest)
- `npm run test:contract` — run golden contract tests
- `npm run test:coverage` — coverage report
- `npm run build` — compile TypeScript
- `npm run validate` — full test suite (unit + contract)
- `npm run dev` — stdio server in dev mode
- `npm run ingest` — fetch legislation from upstream
- `npm run build:db` — rebuild SQLite from seed JSON

## Testing
- Golden contract tests in `__tests__/contract/` driven by `fixtures/golden-tests.json`
- Drift detection via `fixtures/golden-hashes.json`
- Always run `npm run validate` before committing

## File Structure
- `src/tools/*.ts` — one file per MCP tool (13 tools)
- `src/utils/*.ts` — shared utilities (FTS, metadata, statute ID resolution, date handling)
- `src/citation/*.ts` — Brazilian citation parsing, formatting, validation
- `scripts/` — ingestion pipeline and maintenance scripts
- `api/` — Vercel serverless functions (health + MCP endpoint)
- `fixtures/` — golden tests and drift hashes

## Git Workflow
- **Never commit directly to `main`.** Always create a feature branch and open a Pull Request.
- Branch protection requires: verified signatures, PR review, and status checks to pass.
- Use conventional commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`, etc.
