# Privacy & Client Confidentiality

**IMPORTANT READING FOR LEGAL PROFESSIONALS**

This document addresses privacy and confidentiality considerations when using this Tool, with particular attention to professional obligations under Brazilian legal professional rules.

---

## Executive Summary

**Key Risks:**
- Queries through Claude API flow via Anthropic cloud infrastructure
- Query content may reveal client matters and privileged information
- OAB (Ordem dos Advogados do Brasil) rules require strict confidentiality (sigilo profissional) and data handling controls

**Safe Use Options:**
1. **General Legal Research**: Use Tool for non-client-specific queries
2. **Local npm Package**: Install `@ansvar/brazil-law-mcp` locally — database queries stay on your machine
3. **Remote Endpoint**: Vercel Streamable HTTP endpoint — queries transit Vercel infrastructure
4. **On-Premise Deployment**: Self-host with local LLM for privileged matters

---

## Data Flows and Infrastructure

### MCP (Model Context Protocol) Architecture

This Tool uses the **Model Context Protocol (MCP)** to communicate with AI clients:

```
User Query -> MCP Client (Claude Desktop/Cursor/API) -> Anthropic Cloud -> MCP Server -> Database
```

### Deployment Options

#### 1. Local npm Package (Most Private)

```bash
npx @ansvar/brazil-law-mcp
```

- Database is local SQLite file on your machine
- No data transmitted to external servers (except to AI client for LLM processing)
- Full control over data at rest

#### 2. Remote Endpoint (Vercel)

```
Endpoint: https://brazil-law-mcp.vercel.app/mcp
```

- Queries transit Vercel infrastructure
- Tool responses return through the same path
- Subject to Vercel's privacy policy

### What Gets Transmitted

When you use this Tool through an AI client:

- **Query Text**: Your search queries and tool parameters
- **Tool Responses**: Statute text, provision content, search results
- **Metadata**: Timestamps, request identifiers

**What Does NOT Get Transmitted:**
- Files on your computer
- Your full conversation history (depends on AI client configuration)

---

## Professional Obligations (Brazil)

### OAB Code of Ethics and Discipline

Brazilian lawyers are bound by strict confidentiality rules under the Estatuto da Advocacia (Law 8.906/1994) and the OAB Code of Ethics and Discipline (Código de Ética e Disciplina da OAB).

#### Sigilo Profissional (Professional Secrecy)

- All client communications are protected by sigilo profissional
- Client identity may be confidential in sensitive matters
- Case strategy and legal analysis are protected under attorney-client privilege
- Information that could identify clients or matters must be safeguarded

### LGPD and Client Data Processing

Under the **LGPD (Lei Geral de Proteção de Dados, Law 13.709/2018)**:

- You are the **Controlador** (data controller) when processing client personal data
- AI service providers (Anthropic, Vercel) may be **Operadores** (data processors)
- A **data processing agreement** may be required
- International data transfers must comply with LGPD Chapter V requirements
- The **ANPD (Autoridade Nacional de Proteção de Dados)** oversees compliance

---

## Risk Assessment by Use Case

### LOW RISK: General Legal Research

**Safe to use through any deployment:**

```
Example: "What does the Código Civil say about contractual liability?"
```

- No client identity involved
- No case-specific facts
- Publicly available legal information

### MEDIUM RISK: Anonymized Queries

**Use with caution:**

```
Example: "What are the penalties for tax evasion under Brazilian criminal law?"
```

- Query pattern may reveal you are working on a tax crime matter
- Anthropic/Vercel logs may link queries to your API key

### HIGH RISK: Client-Specific Queries

**DO NOT USE through cloud AI services:**

- Remove ALL identifying details
- Use the local npm package with a self-hosted LLM
- Or use commercial legal databases with proper DPAs

---

## Data Collection by This Tool

### What This Tool Collects

**Nothing.** This Tool:

- Does NOT log queries
- Does NOT store user data
- Does NOT track usage
- Does NOT use analytics
- Does NOT set cookies

The database is read-only. No user data is written to disk.

### What Third Parties May Collect

- **Anthropic** (if using Claude): Subject to [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy)
- **Vercel** (if using remote endpoint): Subject to [Vercel Privacy Policy](https://vercel.com/legal/privacy-policy)

---

## Recommendations

### For Solo Practitioners / Small Firms

1. Use local npm package for maximum privacy
2. General research: Cloud AI is acceptable for non-client queries
3. Client matters: Use commercial legal databases (JusBrasil, LexisNexis BR, RT Online)

### For Large Firms / Corporate Legal

1. Negotiate DPAs with AI service providers under LGPD requirements
2. Consider on-premise deployment with self-hosted LLM
3. Train staff on safe vs. unsafe query patterns

### For Government / Public Sector

1. Use self-hosted deployment, no external APIs
2. Follow Brazilian government information security requirements (IN GSI/PR)
3. Air-gapped option available for classified matters

---

## Questions and Support

- **Privacy Questions**: Open issue on [GitHub](https://github.com/Ansvar-Systems/brazil-law-mcp/issues)
- **Anthropic Privacy**: Contact privacy@anthropic.com
- **OAB Guidance**: Consult OAB (Ordem dos Advogados do Brasil) ethics guidance

---

**Last Updated**: 2026-02-22
**Tool Version**: 1.0.0
