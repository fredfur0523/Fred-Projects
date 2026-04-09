// Portfolio and product types

export interface LocalSystem { name: string; domains: string[]; note?: string; }

export interface CapabilityRecord {
  domain: string;
  domain_code: string;
  global_product: string;
  subarea: string;
  n1: string;
  n2: string;
  n3: string;
  n4: string;
  n4_full: string;
  levels: string[];
  status: 'READY' | 'NOT READY';
  planned_year: number | null;
  planned_quarter: string | null;
  legacy_coverage: Record<string, string[]>;
}

export interface DomainZonePortfolioRow {
  domain: string; short: string; zone: string; // 'Global' for aggregate
  nGlobal: number; nLegacy: number; nNeither: number; nTotal: number;
  avgScoreGlobal: number | null; avgScoreLegacy: number | null; avgScoreNone: number | null;
  globalCoveragePct: number; // nGlobal / (nGlobal + nLegacy) — excludes nNeither
  parityStatus: 'global_leading' | 'approaching' | 'legacy_dominant' | 'absent';
  decommReady: boolean;
  decommGap: number; // Legacy sites remaining to migrate
}
