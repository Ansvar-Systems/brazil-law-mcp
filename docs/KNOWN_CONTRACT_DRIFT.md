# Known Contract-Test Drift — 2026-04-26

This file tracks contract-test failures that the golden-standard sweep (2026-04-26) flagged as **NEEDS_REVIEW**. They are not mechanical fixes — they need domain review of either the test expectations or the source data.

The build / lint gates pass. The runtime tools return data. Only the assertions in `__tests__/contract/golden.test.ts` are out of sync.

## Failures

### `br-003` — Cybercrime Law Art. 1 (Carolina Dieckmann Law)

- **Tool:** `get_provision`
- **Symptom:** result is `{"results":null,"_metadata":{...}}` — the lookup returns null
- **Failed assertions:** `text_contains: ["dispositivo", "informatico", "Codigo Penal", "Penal"]`, `fields_present: ["text"]`
- **Probable cause:** the article being requested doesn't exist in the DB under the expected `(document_id, article)` key. Either the test's `input` parameters are stale (article numbering changed during ingestion) or the law itself isn't ingested.

### `br-004` — Search "dados pessoais" (LGPD provisions)

- **Tool:** `search_provisions`
- **Symptom:** results returned, but top hits are non-LGPD laws (e.g., `lei-14129...`)
- **Failed assertions:** `any_result_contains: ["lgpd", "Lei 13.709", "protecao de dados"]`
- **Probable cause:** FTS5 ranking shifted as more laws were ingested. LGPD (Lei 13.709) is no longer in the top-N for "dados pessoais" — either ingestion order changed scoring, or LGPD provisions need re-indexing.

### `br-005` — Search "crime cibernetico" (Criminal Code + cybercrime)

- **Tool:** `search_provisions`
- **Symptom:** results returned, but expected references absent
- **Failed assertions:** `any_result_contains: ["codigo penal", "informatico", "dispositivo", "Lei 12.737"]`
- **Probable cause:** same shape as `br-004` — the Carolina Dieckmann Law (Lei 12.737) and Codigo Penal Art. 154-A provisions are not in the result window for this query.

### `br-006` — Search "consumidor" (Consumer Protection Code)

- **Tool:** `search_provisions`
- **Symptom:** results returned, but the Codigo de Defesa do Consumidor (Lei 8.078) isn't in the top hits
- **Failed assertions:** `any_result_contains: ["codigo de defesa do consumidor", "Lei 8.078", "direito do consumidor"]`
- **Probable cause:** same shape — CDC provisions ranked below other consumer-related laws under current FTS5 weighting.

## What changes are required

For someone with Brazilian-law domain knowledge:

1. **`br-003`** — verify the article ID format. Open the live DB and run:
   ```bash
   sqlite3 data/database.db "SELECT document_id, article_ref, substr(content,1,80) FROM legal_provisions WHERE document_id LIKE 'lei-12737%' OR document_id LIKE 'lei-12.737%' LIMIT 10;"
   ```
   Adjust the test's `input` to match what the DB has, or re-ingest if Lei 12.737 is missing.

2. **`br-004` / `br-005` / `br-006`** — either:
   - Increase the result window (`limit`) on the test queries so canonical laws appear, or
   - Update `any_result_contains` to match what's actually returned and add a *separate* explicit `get_document` test for each canonical law (LGPD, Codigo Penal, CDC), or
   - Re-tune the FTS5 ranker / boost canonical laws.

## Pre-flight gate state (2026-04-26)

| Gate | Result |
|------|--------|
| G1-build | PASS |
| G2-lint | PASS |
| G3-test | FAIL (5 sub-cases) |
| G4-contract | FAIL (5 sub-cases) |

`apply-mcp-standard.py` exited 2 (NEEDS_REVIEW). Standard treatment was **not** applied — that should be a follow-up after the contract drift is resolved.

## Reference

- Sweep handover: `docs/handover/2026-04-26-golden-standard-next-batch-handover.md`
- Pattern catalog (this is novel — call it Pattern J: contract-test data drift)
