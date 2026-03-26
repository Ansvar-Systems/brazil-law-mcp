# Brazilian Law MCP Server

**The LexML (Presidência da República) alternative for the AI age.**

[![npm version](https://badge.fury.io/js/@ansvar%2Fbrazil-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/brazil-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/brazil-law-mcp?style=social)](https://github.com/Ansvar-Systems/brazil-law-mcp)
[![CI](https://github.com/Ansvar-Systems/brazil-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/brazil-law-mcp/actions/workflows/ci.yml)
[![Database](https://img.shields.io/badge/database-pre--built-green)](https://github.com/Ansvar-Systems/brazil-law-mcp)
[![Provisions](https://img.shields.io/badge/provisions-28%2C585-blue)](https://github.com/Ansvar-Systems/brazil-law-mcp)

Pesquise **2.471 leis federais brasileiras** -- da LGPD (Lei Geral de Proteção de Dados) e o Marco Civil da Internet ao Código Penal, Código Civil e a CLT (Consolidação das Leis do Trabalho) -- diretamente do Claude, Cursor ou qualquer cliente compatível com MCP.

If you're building legal tech, compliance tools, or doing Brazilian legal research, this is your verified reference database.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Por que isso existe

A pesquisa jurídica federal brasileira está espalhada entre lexml.gov.br, planalto.gov.br, e jusbrasil.com.br, com legislação publicada no Diário Oficial da União. Seja você:
- Um **advogado** validando citações em uma petição ou contrato
- Um **profissional de compliance** verificando as obrigações da LGPD ou regulamentações da ANPD
- Um **desenvolvedor legaltech** construindo ferramentas sobre o direito brasileiro
- Um **pesquisador** rastreando legislação federal através de 2.471 leis

...você não deveria precisar de dezenas de abas no navegador e pesquisa manual em PDF. Pergunte ao Claude. Obtenha a disposição exata. Com contexto.

Este servidor MCP torna o direito brasileiro **consultável, referenciável e legível por IA**.

---

## Quick Start

### Use Remotely (No Install Needed)

> Connect directly to the hosted version -- zero dependencies, nothing to install.

**Endpoint:** `https://brazil-law-mcp.vercel.app/mcp`

| Client | How to Connect |
|--------|---------------|
| **Claude.ai** | Settings > Connectors > Add Integration > paste URL |
| **Claude Code** | `claude mcp add brazil-law --transport http https://brazil-law-mcp.vercel.app/mcp` |
| **Claude Desktop** | Add to config (see below) |
| **GitHub Copilot** | Add to VS Code settings (see below) |

**Claude Desktop** -- add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "brazil-law": {
      "type": "url",
      "url": "https://brazil-law-mcp.vercel.app/mcp"
    }
  }
}
```

**GitHub Copilot** -- add to VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "brazil-law": {
      "type": "http",
      "url": "https://brazil-law-mcp.vercel.app/mcp"
    }
  }
}
```

### Use Locally (npm)

```bash
npx @ansvar/brazil-law-mcp
```

**Claude Desktop** -- add to `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

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

**Cursor / VS Code:**

```json
{
  "mcp.servers": {
    "brazil-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/brazil-law-mcp"]
    }
  }
}
```

---

## Exemplos de Consultas

Uma vez conectado, pergunte naturalmente:

- *"Pesquisar 'proteção de dados pessoais' na LGPD (Lei 13.709/2018)"*
- *"O que diz o artigo 46 da LGPD sobre segurança dos dados?"*
- *"Quais são as penalidades previstas no Código Penal para crimes cibernéticos?"*
- *"Encontrar disposições sobre rescisão contratual na CLT"*
- *"O Marco Civil da Internet ainda está em vigor?"*
- *"Pesquisar obrigações de consentimento no Código Civil"*
- *"Como a LGPD se alinha com o GDPR europeu em termos de bases legais?"*
- *"Validar a citação: Lei 13.709/2018, art. 7º, inciso I"*
- *"Construir uma posição jurídica sobre direitos dos titulares de dados no Brasil"*
- *"Encontrar disposições sobre proteção ao consumidor no Código de Defesa do Consumidor"*

---

## What's Included

| Category | Count | Details |
|----------|-------|---------|
| **Federal Laws** | 2,471 laws | Comprehensive Brazilian federal legislation |
| **Provisions** | 28,585 sections | Full-text searchable with FTS5 |
| **Preparatory Works** | 116,256 documents | Legislative history and parliamentary records |
| **Database Size** | ~50 MB | Optimized SQLite, portable |
| **Language** | Portuguese (Brazilian) | Official language of Brazilian law |
| **Freshness Checks** | Automated | Drift detection against LexML and Planalto |

### Key Laws Included

| Law | Description |
|-----|-------------|
| Lei 13.709/2018 (LGPD) | Lei Geral de Proteção de Dados Pessoais |
| Lei 12.965/2014 (Marco Civil) | Marco Civil da Internet |
| Decreto-Lei 2.848/1940 (CP) | Código Penal |
| Lei 10.406/2002 (CC) | Código Civil |
| Decreto-Lei 5.452/1943 (CLT) | Consolidação das Leis do Trabalho |
| Lei 8.078/1990 (CDC) | Código de Defesa do Consumidor |
| Lei 12.737/2012 (Lei Carolina Dieckmann) | Crimes cibernéticos |
| Lei 9.472/1997 (LGT) | Lei Geral de Telecomunicações |

**Verified data only** -- every citation is validated against official sources (lexml.gov.br, planalto.gov.br). Zero LLM-generated content.

---

## LGPD and GDPR Alignment

**Brazil's LGPD (Lei Geral de Proteção de Dados) is explicitly modelled on the EU GDPR.** The structural and conceptual alignment is significant:

| LGPD | GDPR | Alignment |
|------|------|-----------|
| Art. 7 (Bases legais) | Art. 6 (Lawful bases) | Direct structural parallel -- 10 LGPD bases align with GDPR's 6 |
| Art. 18 (Direitos dos titulares) | Art. 15-22 (Data subject rights) | Right of access, rectification, deletion, portability |
| Art. 37-39 (DPO / Encarregado) | Art. 37-39 (DPO) | Encarregado role mirrors DPO obligations |
| Art. 46-51 (Segurança) | Art. 25, 32 (Data security) | Privacy by design + security measures |
| Art. 52-54 (Sanções) | Art. 83-84 (Penalties) | ANPD fines up to 2% of revenue (cf. GDPR 4%) |
| Art. 33-36 (Transferências internacionais) | Art. 44-49 (International transfers) | Adequacy decisions, standard clauses |

The EU tools in this MCP reveal alignment between LGPD and GDPR provisions -- useful for multi-jurisdictional compliance work involving both Brazilian and EU data subjects.

> **Note on adequacy:** Brazil does not yet have a formal EU adequacy decision (unlike Canada under PIPEDA). International data transfers from EU to Brazil require appropriate safeguards (SCCs, BCRs). Use the `validate_eu_compliance` tool to assess alignment for specific provisions.

---

## Why This Works

**Verbatim Source Text (No LLM Processing):**
- All statute text is ingested from lexml.gov.br and planalto.gov.br official sources
- Provisions are returned **unchanged** from SQLite FTS5 database rows
- Zero LLM summarization or paraphrasing -- the database contains law text, not AI interpretations

**Smart Context Management:**
- Search returns ranked provisions with BM25 scoring (safe for context)
- Provision retrieval gives exact text by law number + article
- Cross-references help navigate without loading everything at once

**Technical Architecture:**
```
LexML / Planalto --> Parse --> SQLite --> FTS5 snippet() --> MCP response
                       ^                        ^
                Provision parser         Verbatim database query
```

### Traditional Research vs. This MCP

| Abordagem Tradicional | Este Servidor MCP |
|----------------------|-------------------|
| Pesquisar no LexML por número de lei | Pesquisar em português: *"proteção dados pessoais consentimento"* |
| Navegar manualmente em códigos multi-artigo | Obter a disposição exata com contexto |
| Referências cruzadas manuais entre leis | `build_legal_stance` agrega de várias fontes |
| "Esta lei ainda está em vigor?" -- verificar manualmente | Ferramenta `check_currency` -- resposta em segundos |
| Comparar LGPD com GDPR -- verificar EUR-Lex manualmente | `get_eu_basis` -- alinhamento com GDPR instantaneamente |
| Sem API, sem integração | Protocolo MCP -- nativo para IA |

**Tradicional:** Pesquisar no Planalto --> Navegar no HTML --> Ctrl+F --> Verificar no Diário Oficial --> Cruzar com EUR-Lex para comparação LGPD/GDPR --> Repetir

**Este MCP:** *"Quais são as bases legais para tratamento de dados pessoais na LGPD e como se comparam com o GDPR?"* --> Concluído.

---

## Available Tools (13)

### Core Legal Research Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 full-text search across 28,585 provisions with BM25 ranking. Supports Brazilian Portuguese queries |
| `get_provision` | Retrieve specific provision by law number + article (e.g., "Lei 13.709/2018" + "art. 7") |
| `check_currency` | Check if a law is in force, amended, or repealed |
| `validate_citation` | Validate citation against database -- zero-hallucination check |
| `build_legal_stance` | Aggregate citations from multiple laws for a legal topic |
| `format_citation` | Format citations per Brazilian conventions (full/short/pinpoint) |
| `list_sources` | List all available laws with metadata, coverage scope, and data provenance |
| `about` | Server info, capabilities, dataset statistics, and coverage summary |

### EU Law Integration Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get EU directives/regulations that a Brazilian law aligns with (e.g., LGPD-GDPR mapping) |
| `get_brazilian_implementations` | Find Brazilian laws aligning with a specific EU act |
| `search_eu_implementations` | Search EU documents with Brazilian alignment counts |
| `get_provision_eu_basis` | Get EU law references for a specific provision |
| `validate_eu_compliance` | Check alignment status of Brazilian laws against EU directives |

---

## Data Sources & Freshness

All content is sourced from authoritative Brazilian legal databases:

- **[LexML Brasil](https://lexml.gov.br/)** -- Official Brazilian legal document repository (Presidência da República)
- **[Planalto](https://www.planalto.gov.br/)** -- Presidential Portal, official consolidated federal legislation
- **[Câmara dos Deputados](https://www.camara.leg.br/)** -- Chamber of Deputies legislative documents and preparatory works
- **[Senado Federal](https://www.senado.leg.br/)** -- Federal Senate legislative records

### Data Provenance

| Field | Value |
|-------|-------|
| **Authority** | Presidência da República / LexML |
| **Language** | Portuguese (Brazilian) |
| **Coverage** | 2,471 federal laws across all legislative areas |
| **Preparatory Works** | 116,256 parliamentary documents |
| **Last ingested** | 2026-02-28 |

### Automated Freshness Checks

A GitHub Actions workflow monitors all data sources:

| Check | Method |
|-------|--------|
| **Law amendments** | Drift detection against known provision anchors |
| **New laws** | Comparison against LexML and Planalto index |
| **Repealed laws** | Status change detection |

**Verified data only** -- every citation is validated against official sources. Zero LLM-generated content.

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Daily |
| **Socket.dev** | Supply chain attack detection | PRs |
| **Dependabot** | Automated dependency updates | Weekly |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from LexML (Presidência da República) and Planalto. However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Court case coverage is not included** -- do not rely solely on this for jurisprudência
> - **Verify critical citations** against primary sources for official proceedings
> - **EU cross-references** reflect alignment relationships; Brazil does not yet have EU adequacy status
> - **State-level legislation is not included** -- this covers federal Acts only
> - For professional legal advice in Brazil, consult a member of the **Ordem dos Advogados do Brasil (OAB)**

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [SECURITY.md](SECURITY.md)

### Client Confidentiality

Queries go through the Claude API. For privileged or confidential matters, use on-premise deployment.

---

## Development

### Setup

```bash
git clone https://github.com/Ansvar-Systems/brazil-law-mcp
cd brazil-law-mcp
npm install
npm run build
npm test
```

### Running Locally

```bash
npm run dev                                       # Start MCP server
npx @anthropic/mcp-inspector node dist/index.js   # Test with MCP Inspector
```

### Data Management

```bash
npm run ingest              # Ingest laws from LexML/Planalto
npm run build:db            # Rebuild SQLite database
npm run check-updates       # Check for amendments and new laws
```

### Performance

- **Search Speed:** <100ms for most FTS5 queries
- **Database Size:** ~50 MB (efficient, portable)
- **Reliability:** 100% ingestion success rate across 2,471 Acts

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite** -- MCP servers that work together for end-to-end compliance coverage:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, MiFID II, eIDAS, and more. Pair with this server for LGPD-GDPR alignment analysis. `npx @ansvar/eu-regulations-mcp`

### [@ansvar/security-controls-mcp](https://github.com/Ansvar-Systems/security-controls-mcp)
**Query 261 security frameworks** -- ISO 27001, NIST CSF, SOC 2, CIS Controls, SCF, and more. `npx @ansvar/security-controls-mcp`

### [@ansvar/sanctions-mcp](https://github.com/Ansvar-Systems/Sanctions-MCP)
**Offline-capable sanctions screening** -- OFAC, EU, UN sanctions lists. `pip install ansvar-sanctions-mcp`

**70+ national law MCPs** covering Australia, Brazil, Canada, China, Denmark, Finland, France, Germany, Ghana, Iceland, India, Ireland, Israel, Italy, Japan, Kenya, Netherlands, Nigeria, Norway, Singapore, Slovenia, South Korea, Sweden, Switzerland, Thailand, UAE, UK, and more.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas:
- Court case law expansion (STF, STJ jurisprudência)
- ANPD guidance documents and resolutions
- State-level privacy law summaries
- Historical law versions and amendment tracking
- Regulatory agency (ANATEL, BACEN, CVM) instruments

---

## Roadmap

- [x] Core law database with FTS5 search
- [x] Full corpus ingestion (2,471 laws, 28,585 provisions)
- [x] Preparatory works (116,256 parliamentary documents)
- [x] EU/LGPD-GDPR alignment tools
- [x] Vercel Streamable HTTP deployment
- [x] npm package publication
- [ ] Court case law expansion (STF, STJ)
- [ ] ANPD resolution and guidance coverage
- [ ] Historical law versions (amendment tracking)
- [ ] State-level legislation

---

## Citation

If you use this MCP server in academic research:

```bibtex
@software{brazil_law_mcp_2026,
  author = {Ansvar Systems AB},
  title = {Brazilian Law MCP Server: AI-Powered Legal Research Tool},
  year = {2026},
  url = {https://github.com/Ansvar-Systems/brazil-law-mcp},
  note = {2,471 Brazilian federal laws with 28,585 provisions and 116,256 preparatory works documents}
}
```

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **Statutes & Legislation:** Presidência da República / LexML (public domain)
- **Preparatory Works:** Câmara dos Deputados / Senado Federal (public domain)
- **EU Metadata:** EUR-Lex (EU public domain)

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools for the global market. This MCP server started as our internal reference tool for Brazilian legal research -- turns out everyone building compliance tools across Brazil and EU jurisdictions has the same research frustrations.

So we're open-sourcing it. Navigating 2,471 federal laws and mapping LGPD to GDPR shouldn't require hours of manual cross-referencing.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>
