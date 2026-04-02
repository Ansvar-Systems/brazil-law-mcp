# Auto-generated Dockerfile for Law MCP HTTP transport.
# Built by rollout-http-transport.sh from Ansvar-Architecture-Documentation.

# ── Stage 1: Build ──────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: Production ────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --from=builder /app/dist ./dist
COPY data/database.db ./data/database.db
RUN node --input-type=module - <<'NODE'
import Database from '@ansvar/mcp-sqlite';
import { searchLegislation } from './dist/tools/search-legislation.js';
const db = new Database('./data/database.db', { readonly: true });
const tables = new Set(
  db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(row => row.name)
);
for (const table of ['legal_documents', 'legal_provisions', 'provisions_fts']) {
  if (!tables.has(table)) {
    throw new Error(`Missing required table: ${table}`);
  }
}
const result = await searchLegislation(db, { query: 'dados pessoais', limit: 1 });
if (!result.results.length) {
  throw new Error('Search smoke test returned no Brazilian law results');
}
db.close();
NODE

# Security: non-root user
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs \
 && chown -R nodejs:nodejs /app/data
USER nodejs

ENV NODE_ENV=production
CMD ["node", "dist/http-server.js"]
