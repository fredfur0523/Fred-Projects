import type { Site } from "./sites";

// App-level UI types

export type ViewMode = "overview" | "maturity" | "sites" | "analysis" | "portfolio" | "methodology" | "data";

// Lang and T are defined in App.tsx (T = typeof TRANSLATIONS['pt']),
// will move here in Phase 2 when TRANSLATIONS is extracted to constants/translations.ts

// Funnel types
export interface FunnelLevel {
	level: string;
	pct: number;
	siteCount: number;
	exclusiveSites: Site[];
	ghq: number;
}
export interface FunnelMetrics {
	avg: string;
	totalSites: number;
	funnel: FunnelLevel[];
}

// Quadrant / navigation types
export type QuadrantFilter =
	| "all"
	| "tech_high_vpo_high"
	| "tech_high_vpo_low"
	| "tech_low_vpo_high"
	| "tech_low_vpo_low";
export type CgSubView = "summary" | "sites";
export type SortKey = "name" | "zone" | "maturity" | "ose" | "ttp" | "vpo";

// CapabilityGapView props (uses Record<string, unknown> for t, not T)
export interface CapabilityGapViewProps {
	dark: boolean;
	t: Record<string, unknown>;
	lang: string;
}

// CapabilitySiteDetail props (uses inline object type for t subset)
export interface CapabilitySiteDetailProps {
	siteName: string;
	site: import("./sites").MaturityDetailSite;
	dark: boolean;
	t: {
		cgVacuous: string;
		cgNoActiveProduct: string;
		cgL1Gate: string;
		cgL2Gate: string;
		cgL3Gate: string;
		cgL4Gate: string;
		[k: string]: unknown;
	};
	onClose: () => void;
	siteOseData?: { ose: number | null; ttp: number | null } | null;
}
