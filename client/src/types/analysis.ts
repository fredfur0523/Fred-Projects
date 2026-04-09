import type { Site } from './sites';

// Statistical analysis types

export interface ImpactByLevel {
  level: string;
  siteCount: number;
  withKpiCount: number;
  avgOse: number | null;
  avgVic: number | null;
  avgLifecycle: number | null;
  avgTtp: number | null;
  composite: number | null; // average of non-null KPIs, for bar scale
}

export interface StatsAnalysis {
  correlation: number | null;
  byLevel: { level: string; mean: number | null; count: number }[];
  narrative: string;
  correlationOse?: number | null;
  correlationTtp?: number | null;
}

export interface ZoneAnalysisRow { zone: string; n: number; avgVpo: number | null; avgOse: number | null; avgTtp: number | null; avgTech: number; rVpoOse: number | null; rTechOse: number | null; }

export interface ThresholdRow { threshold: number; nAbove: number; rAbove: number | null; nBelow: number; rBelow: number | null; }

export interface DomainOseRow { domain: string; short: string; ghqPct: number; rOse: number | null; n: number; cls: 'global' | 'mixed' | 'legacy'; }

export interface PillarPartialRow { pillar: string; rSimple: number | null; rPartial: number | null; n: number; cls: 'own' | 'spurious' | 'marginal'; }

export interface DomainTransition { from: number; to: number; fromN: number; toN: number; fromOse: number | null; toOse: number | null; delta: number | null; viable: boolean; topVpo: number | null; botVpo: number | null; }

export interface ImpactByLevelOseTtp {
  level: string;
  siteCount: number;
  withKpiCount: number;
  avgOse: number | null;  // ratio 0–1 (display as %)
  avgTtp: number | null;
  oseFromCanonical: boolean;
}

export interface DomainAnalysisRow {
  domain: string;
  domainShort: string;
  siteCount: number;
  avgMaturity: number;
  avgOsePct: number | null;
  avgTtp: number | null;
}

export interface DomainAnalysis {
  rows: DomainAnalysisRow[];
  correlationMaturityOse: number | null;
  correlationMaturityTtp: number | null;
  answerMatureDomain: string;
  answerHighAvg: string;
  answerPortfolio: string;
}

export interface VolumeComplexityCluster {
  clusterKey: string;
  volumeBand: string;
  complexityBand: string;
  siteCount: number;
  sites: Site[];
  avgOsePct: number | null;
  avgTtp: number | null;
  withKpiCount: number;
}

export interface MaturityProfileCluster {
  clusterKey: string;
  label: string;
  description: string;
  siteCount: number;
  sites: Site[];
  avgOsePct: number | null;
  avgTtp: number | null;
  avgMaturity: number;
  withKpiCount: number;
}

export interface LevelRow { level: string; siteCount: number; withKpiCount: number; avgOse: number | null; avgTtp: number | null; }

export interface TriDimSiteRow {
  name: string;
  zone: string;
  techLevel: string;      // L0-L4
  techScore: number;      // Total Global 0-4
  vpoScore: number | null;  // % compliance overall
  vpoPillars: Record<string, number | null>;
  ose: number | null;     // 0-1
  ttp: number | null;     // hl/h
}

export interface TriDimQuadrant {
  label: string;
  description: string;
  sites: TriDimSiteRow[];
  avgOse: number | null;
  avgTtp: number | null;
  color: string;
}

export interface ZoneDomainSummary {
  avgScore: number;
  siteCount: number;
  avgFracL2: number | null;
  avgFracL3: number | null;
}
