# Brazil Law MCP

MCP server for Brazilian Law — 4,805 statutes from www.planalto.gov.br/ccivil_03

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-spec--compliant-green.svg)](https://modelcontextprotocol.io)
[![Jurisdiction](https://img.shields.io/badge/Jurisdiction-BR-informational.svg)](#coverage)

## What this is

This server indexes the legal materials listed under **Sources** below and
exposes them via the Model Context Protocol. Part of the Ansvar MCP fleet —
source-available servers published for self-hosting.

It makes no outbound network calls except to the upstream sources during
ingestion — no analytics, no phone-home.

## Coverage

- **Corpus:** Brazilian Law — 4,805 statutes, 54,934 provisions
- **Jurisdiction code:** `BR`
- **Corpus snapshot:** 2026-03-30

The corpus is rebuilt from the upstream sources by the included ingestion script; re-run periodically to refresh.

See **Sources** below for source URLs, terms, and reuse conditions.

## Why this exists

LLMs answering compliance, security, or legal questions from training data
alone will fabricate citations — confidently producing article numbers,
statute names, and source URLs that do not exist, or that do not say what
the model claims. This MCP exists so an agent can call a tool that returns
the real text, the real identifier, and the real source URL straight from
the indexed materials — and ground an answer rather than recall it.

One MCP, one corpus. The point is composition.

The **Ansvar Gateway** ([ansvar.eu](https://ansvar.eu)) joins this MCP
with the rest of the Ansvar fleet behind a single authenticated
endpoint — 300+ servers covering legal jurisdictions, EU
regulations, security frameworks, sector regulators, privacy-pattern
catalogues, and risk-scoring tools. That lets an agent run cross-domain
workflows that no single MCP can serve alone:

- **Threat model and TARA.** Threat enumeration → known component
  vulnerabilities → severity scoring → applicable AI, cybersecurity, and
  automotive obligations → privacy threats. Every finding traceable to
  its source.
- **Gap analysis.** Target framework requirements → current-state
  evidence → unmet obligations → remediation guidance and authority
  opinions. Every gap traceable to the specific requirement that flagged
  it.
- **Data Protection Impact Assessment.** Privacy regulation articles →
  national DPA guidance → privacy-pattern catalogue → applicable case
  law.

### Getting high-quality citations

Citation accuracy degrades when an agent's context fills up. Long inputs
cause retrieval-stage drift — the model recalls claim text correctly but
misattributes the source. Two practices keep accuracy high:

1. **Focused first pass, checking-agent second pass.** Query a small,
   relevant set of MCPs first, then run a separate agent whose only job
   is to re-resolve each citation against the source MCP and flag any
   that no longer match. The checking agent uses the same MCP tools as
   the synthesis agent.
2. **Pull the source text verbatim when in doubt.** Every citation an
   agent emits points back to a tool call against this server. You — or
   another agent — can call the same tool with the same identifier and
   read the raw statute, article, or standard text directly. If the
   verbatim text doesn't support what the agent claimed, the citation
   was misused, regardless of whether the identifier was real.

Both patterns work the same way self-hosted or through the gateway.

## Two ways to use it

**Self-host (free, Apache 2.0)** — clone this repo, run the ingestion script to build your local database from the listed upstream sources, point your MCP client at the local server. Instructions below.

**Use the hosted gateway** — for production use against the curated,
kept-fresh corpus across the full Ansvar MCP fleet, with citation enrichment
and multi-jurisdiction fan-out — see [ansvar.eu](https://ansvar.eu).

## Self-hosting

### Install

> Requires Node 18+.

```bash
git clone https://github.com/Ansvar-Systems/brazil-law-mcp.git
cd brazil-law-mcp
npm install
```

### Build

```bash
npm run build
```

### Build the database

```bash
npm run ingest && npm run build:db
```

The database lands at `./data/data/database.db`.

Ingestion fetches from the upstream source(s) listed under **Sources** below and builds a local SQLite database. Re-run periodically to refresh. Review the source's published terms before running ingestion in a commercial deployment, and inspect the ingestion script in this repo for the actual access method (open API, bulk download, HTML scrape, or feed).

Ingestion is a snapshot — your local copy goes stale until you re-run it. The hosted gateway corpus is refreshed continuously.

### Configure your MCP client

```json
{
  "mcpServers": {
    "brazil-law-mcp": {
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

## Sources

| Source | Source URL | Terms / license URL | License basis | Attribution required | Commercial use | Redistribution / caching | Notes |
|---|---|---|---|---|---|---|---|
| [Planalto (Presidency of the Republic - Federal Legislation)](https://www.planalto.gov.br/ccivil_03/) | https://www.planalto.gov.br/ccivil_03/ | [Terms](https://www.planalto.gov.br) | Brazilian Government Public Domain | Recommended | Yes | Yes | Federal statutes, decrees, and constitutional texts. Lei 9.610/98 Art. 8 excludes ‘textos de leis, decretos…’ from copyright protection. |
| [LexML Brazil (Structured Legal XML)](https://www.lexml.gov.br) | https://www.lexml.gov.br | [Terms](https://www.lexml.gov.br) | Default fallback for gov.br sub-portals: CC BY-ND 3.0 (Atribuição-SemDerivações 3.0 Não Adaptada) — observed footer pattern across ANPD, CGU, COAF, CVM, SUSEP. Always verify the specific sub-portal in case it differs (BCB, TCU notably do not display this footer). | Yes | Yes | Yes | WILDCARD FALLBACK: most gov.br sub-portals display the footer 'Todo o conteúdo deste site está publicado sob a licença Creative Commons Atribuição-SemDerivações 3.0 Não Adaptada.' This wildcard catches sub-portals not enumerated as explicit entries (e.g. gov.br/agu, gov.br/inpi). The CC BY-ND 3.0 caveat applies — sharing and verbatim redistribution permitted with attribution; derivative works (translations, paraphrasing, restructuring) are NOT permitted. Underlying federal statutes and regulatory acts cited remain public-domain under Lei 9.610/98 Art. 8 IV regardless of the site portal terms. Confirmed exceptions where the footer is NOT present: BCB (bcb.gov.br), TCU (tcu.gov.br) — both have dedicated entries with conservative defaults. |

## Upstream license constraints

The Sources table above lists each upstream provider's license. Some of those licenses constrain how the retrieved corpus can be used downstream of this MCP:

**No-derivatives sources.** LexML Brazil — these sources are licensed under CC BY-ND. Their underlying statutory text may be public-domain by national law (e.g. Lei 9.610/98 Art. 8 IV in Brazil), but the portal compilation as published is no-derivatives. Verbatim retrieval and quotation are permitted; producing summaries, paraphrases, translations, or restructured derivatives in the consumer's pipeline is not — those require either falling back to verbatim quotation or obtaining separate license from the upstream provider.

The Apache 2.0 license below covers the code in this repository only. The Sources table above lists each upstream's terms; consumer-side compliance with those terms is the user's responsibility.

## What this repository does not provide

This repository's source — the MCP server code, schema, and ingestion script — is licensed under Apache
2.0. The license below covers the code in this repository only; it does not
extend to the upstream legal materials. Pre-built database snapshots present under `data/` (e.g. `data/database.db`), where shipped, are a convenience only. Their presence does not change the legal positioning above — running ingestion is still the canonical way to build a fresh corpus from upstream sources.

Running ingestion may download, cache, transform, and index materials from the listed upstream sources. You are responsible for confirming that your use of those materials complies with the source terms, attribution requirements, robots/rate limits, database rights, copyright rules, and any commercial-use or redistribution limits that apply in your jurisdiction.

## License

Apache 2.0 — see [LICENSE](LICENSE). Commercial use, modification, and
redistribution of **the source code in this repository** are permitted under
that license. The license does not extend to upstream legal materials downloaded by the ingestion script; those remain governed by the source jurisdictions' own publishing terms (see Sources above).

## The Ansvar gateway

If you'd rather not self-host, [ansvar.eu](https://ansvar.eu) provides this
MCP plus the full Ansvar fleet through a single authenticated endpoint, with
the curated production corpus, multi-MCP query orchestration, and citation
enrichment.

---

Issues: [github.com/Ansvar-Systems/brazil-law-mcp/issues](https://github.com/Ansvar-Systems/brazil-law-mcp/issues) · Security: <security@ansvar.eu>

