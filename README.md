# Brazil Law MCP

Brazilian federal law database for the [Model Context Protocol](https://modelcontextprotocol.io/), covering data protection (LGPD), internet regulation (Marco Civil da Internet), cybercrime, consumer protection, telecommunications, and civil code with Portuguese full-text search.

**MCP Registry:** `eu.ansvar/brazil-law-mcp`
**npm:** `@ansvar/brazil-law-mcp`
**License:** Apache-2.0

---

## Deployment Tier

**MEDIUM** -- dual tier, free database bundled in npm package.

| Tier | Platform | Database | Content |
|------|----------|----------|---------|
| **Free** | Vercel (Hobby) / npm (stdio) | Core federal laws (~120-200 MB) | Key federal legislation (LGPD, Marco Civil, Cybercrime Law, Consumer Protection Code, Civil Code), FTS search, EU/international cross-references |
| **Professional** | Azure Container Apps / Docker / Local | Full database (~600 MB - 1 GB) | + All federal laws and decrees, ANPD regulations and guidance, STF/STJ case law summaries, supplementary instruments |

The full database is larger due to the comprehensive scope of Brazilian federal legislation and supplementary regulatory materials from ANPD. The free tier contains all key data protection, cybercrime, consumer, and internet legislation from Planalto.

---

## Data Sources

| Source | Authority | Method | Update Frequency | License | Coverage |
|--------|-----------|--------|-----------------|---------|----------|
| [Planalto](https://www.planalto.gov.br/ccivil_03/) | Presidency of the Republic | HTML Scrape | Weekly | Public Domain | All federal laws, decrees, and constitutional amendments |
| [LexML Brazil](https://www.lexml.gov.br) | Brazilian Federal Senate | XML Download | Weekly | Government Open Data | Structured XML of federal, state, and municipal legislation |

> Full provenance metadata: [`sources.yml`](./sources.yml)

---

## Quick Start

### Claude Desktop / Cursor (stdio)

```json
{
  "mcpServers": {
    "brazil-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/brazil-law-mcp"]
    }
  }
}
```

### Vercel Streamable HTTP (ChatGPT / Claude.ai)

Once deployed, the public endpoint will be available at:

```
https://brazil-law-mcp.vercel.app/api/mcp
```

---

## Tools

| Tool | Description | Free Tier | Professional |
|------|-------------|-----------|-------------|
| `get_provision` | Retrieve a specific article from a Brazilian federal law | Yes | Yes |
| `search_legislation` | Full-text search across all federal legislation (Portuguese) | Yes | Yes |
| `list_laws` | List all available laws with metadata | Yes | Yes |
| `get_law_structure` | Get table of contents / structure of a law | Yes | Yes |
| `get_provision_eu_basis` | Cross-reference Brazilian law to EU/international equivalents | Yes | Yes |
| `search_decrees` | Search federal decrees and regulatory instruments | No (upgrade) | Yes |
| `get_anpd_guidance` | Retrieve ANPD (data protection authority) guidance and resolutions | No (upgrade) | Yes |

---

## Key Legislation Covered

| Law | Year | Domain | Key Topics |
|-----|------|--------|------------|
| **Lei Geral de Protecao de Dados (LGPD)** | 2018 (Lei 13.709) | Data Protection | Personal data processing, consent, data subject rights, ANPD, international data transfers, extraterritorial application |
| **Marco Civil da Internet** | 2014 (Lei 12.965) | Internet Regulation | Net neutrality, data retention, intermediary liability, freedom of expression, privacy of communications |
| **Cybercrime Law (Carolina Dieckmann Law)** | 2012 (Lei 12.737) | Cybercrime | Unauthorized access to computer devices, data interception, criminal penalties |
| **Consumer Protection Code** | 1990 (Lei 8.078) | Consumer Rights | Consumer rights, product liability, unfair commercial practices, class actions |
| **General Telecommunications Law** | 1997 (Lei 9.472) | Telecommunications | Telecom regulation, ANATEL, service licensing, spectrum management |
| **Brazilian Civil Code** | 2002 (Lei 10.406) | Civil Law | Persons, obligations, contracts, property, privacy and personality rights |

---

## Database Estimates

| Component | Free Tier | Full (Professional) |
|-----------|-----------|---------------------|
| Core federal laws | ~90-140 MB | ~90-140 MB |
| All federal decrees & instruments | -- | ~300-500 MB |
| ANPD guidance & resolutions | -- | ~30-50 MB |
| STF/STJ case law summaries | -- | ~100-200 MB |
| Cross-references & metadata | ~5 MB | ~15 MB |
| **Total** | **~120-200 MB** | **~600 MB - 1 GB** |

**Delivery strategy:** Free-tier DB bundled in npm package (Strategy A -- fits within Vercel 250 MB function limit). If final size exceeds 250 MB after ingestion, switch to Strategy B (runtime download from GitHub Releases).

---

## Development

```bash
# Clone the repository
git clone https://github.com/Ansvar-Systems/brazil-law-mcp.git
cd brazil-law-mcp

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run contract tests
npm run test:contract

# Build database (requires raw data in data/ directory)
npm run build:db

# Build free-tier database
npm run build:db:free

# Run drift detection
npm run drift:detect

# Full validation
npm run validate
```

---

## Architecture

```
brazil-law-mcp/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Test + lint + security scan
│   │   ├── publish.yml               # npm publish on version tags
│   │   ├── check-source-updates.yml  # Data freshness monitoring
│   │   └── drift-detect.yml          # Upstream drift detection
│   ├── SECURITY.md
│   ├── SECURITY-SETUP.md
│   └── ISSUE_TEMPLATE/
│       └── data-error.md
├── data/
│   └── .gitkeep
├── fixtures/
│   ├── golden-tests.json             # 12 contract tests
│   ├── golden-hashes.json            # 6 drift detection anchors
│   └── README.md
├── scripts/
│   ├── build-db.ts
│   ├── build-db-free.ts
│   ├── download-free-db.sh
│   ├── ingest.ts
│   ├── drift-detect.ts
│   └── check-source-updates.ts
├── src/
│   ├── server.ts
│   ├── db.ts
│   └── tools/
│       ├── get-provision.ts
│       ├── search-legislation.ts
│       ├── list-laws.ts
│       ├── get-law-structure.ts
│       ├── get-provision-eu-basis.ts
│       ├── search-decrees.ts
│       └── get-anpd-guidance.ts
├── __tests__/
│   ├── unit/
│   ├── contract/
│   │   └── golden.test.ts
│   └── integration/
├── sources.yml
├── server.json
├── package.json
├── tsconfig.json
├── vercel.json
├── CHANGELOG.md
├── LICENSE
└── README.md
```

---

## Notes on Brazilian Data Protection Landscape

**LGPD** (Lei Geral de Protecao de Dados) was modeled on the EU GDPR and shares many of the same principles:

- **Extraterritorial application** -- applies to any processing of personal data of individuals located in Brazil, regardless of where the processor is based
- **ANPD** (Autoridade Nacional de Protecao de Dados) became an independent body in 2022, with enhanced enforcement powers
- **Data Protection Officer (DPO)** requirement similar to GDPR
- **Data breach notification** obligations
- **International data transfer** mechanisms (adequacy decisions, standard contractual clauses, binding corporate rules)

**Marco Civil da Internet** (2014) established Brazil as a global leader in internet rights:
- **Net neutrality** -- ISPs may not discriminate traffic
- **Data retention** -- connection logs must be kept for 1 year, application logs for 6 months
- **Judicial authorization** required for content removal (with exceptions for revenge porn and copyright)

Brazil is **Latin America's largest economy** and LGPD compliance is increasingly required for doing business in the region.

---

## Related Documents

- [MCP Quality Standard](../../mcp-quality-standard.md) -- quality requirements for all Ansvar MCPs
- [MCP Infrastructure Blueprint](../../mcp-infrastructure-blueprint.md) -- infrastructure implementation templates
- [MCP Deployment Tiers](../../mcp-deployment-tiers.md) -- free vs. professional tier strategy
- [MCP Server Registry](../../mcp-server-registry.md) -- operational registry of all MCPs
- [MCP Remote Access](../../mcp-remote-access.md) -- public Vercel endpoint URLs

---

## Security

Report vulnerabilities to **security@ansvar.eu** (48-hour acknowledgment SLA).

See [SECURITY.md](.github/SECURITY.md) for full disclosure policy.

---

**Maintained by:** Ansvar Systems Engineering
**Contact:** hello@ansvar.eu
