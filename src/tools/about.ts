import type Database from '@ansvar/mcp-sqlite';

export interface AboutContext {
  version: string;
  fingerprint: string;
  dbBuilt: string;
}

export interface AboutResult {
  server: {
    name: string;
    package: string;
    version: string;
    suite: string;
    repository: string;
  };
  dataset: {
    fingerprint: string;
    built: string;
    jurisdiction: string;
    content_basis: string;
    counts: Record<string, number>;
  };
  provenance: {
    sources: string[];
    license: string;
    authenticity_note: string;
  };
  security: {
    access_model: string;
    network_access: boolean;
    filesystem_access: boolean;
    arbitrary_code: boolean;
  };
}

function safeCount(db: InstanceType<typeof Database>, sql: string): number {
  try {
    const row = db.prepare(sql).get() as { count: number } | undefined;
    return row ? Number(row.count) : 0;
  } catch {
    return 0;
  }
}

export function getAbout(
  db: InstanceType<typeof Database>,
  context: AboutContext
): AboutResult {
  return {
    server: {
      name: 'Brazil Law MCP',
      package: '@ansvar/brazil-law-mcp',
      version: context.version,
      suite: 'Ansvar Compliance Suite',
      repository: 'https://github.com/Ansvar-Systems/brazil-law-mcp',
    },
    dataset: {
      fingerprint: context.fingerprint,
      built: context.dbBuilt,
      jurisdiction: 'Brazil (BR)',
      content_basis:
        'Brazilian federal legislation from planalto.gov.br and lexml.gov.br. ' +
        'Covers data protection (LGPD), internet regulation (Marco Civil), cybercrime, ' +
        'consumer protection, telecommunications, and civil code.',
      counts: {
        legal_documents: safeCount(db, 'SELECT COUNT(*) as count FROM legal_documents'),
        legal_provisions: safeCount(db, 'SELECT COUNT(*) as count FROM legal_provisions'),
        eu_documents: safeCount(db, 'SELECT COUNT(*) as count FROM eu_documents'),
        eu_references: safeCount(db, 'SELECT COUNT(*) as count FROM eu_references'),
      },
    },
    provenance: {
      sources: [
        'planalto.gov.br (federal laws, decrees, constitution)',
        'lexml.gov.br (structured XML, LexML URN identifiers)',
      ],
      license:
        'Apache-2.0 (server code). Legal source texts are Brazilian Government Public Domain.',
      authenticity_note:
        'Law text is derived from planalto.gov.br and lexml.gov.br open data. ' +
        'Verify against the Diario Oficial da Uniao when legal certainty is required.',
    },
    security: {
      access_model: 'read-only',
      network_access: false,
      filesystem_access: false,
      arbitrary_code: false,
    },
  };
}
