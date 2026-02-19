export type CitationFormat = 'full' | 'short' | 'pinpoint';

export interface ParsedCitation {
  valid: boolean;
  type: 'lei' | 'lc' | 'mp' | 'decreto' | 'constituicao' | 'unknown';
  title?: string;
  law_type?: string;
  number?: number;
  year?: number;
  article?: string;
  paragraph?: string;
  inciso?: string;
  alinea?: string;
  error?: string;
}

export interface ValidationResult {
  citation: ParsedCitation;
  document_exists: boolean;
  provision_exists: boolean;
  document_title?: string;
  status?: string;
  warnings: string[];
}
