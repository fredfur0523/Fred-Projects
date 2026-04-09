// Core site data types

export interface Site {
	zone: string;
	name: string;
	country: string;
	volume: number;
	group: string;
	scores: Record<string, number>;
}

// Product coverage data: loaded from product-coverage-2026.json
export interface ProductDeployment {
	product: string;
	sites: string[];
	n: number;
}
export type ProductCoverageData = Record<string, Record<string, ProductDeployment[]>>;

// Maturity detail types (from docs/maturity_detail.json)
export interface MaturityDetailLevel {
	vacuous: boolean;
	frac: number | null;
	pass: boolean;
}

export interface MaturityDetailDomain {
	score: number;
	type: "G" | "L";
	levels: {
		L1: MaturityDetailLevel;
		L2: MaturityDetailLevel;
		L3: MaturityDetailLevel;
		L4: MaturityDetailLevel;
	};
}

export interface MaturityDetailSite {
	zone: string;
	score: number;
	domains: Record<string, MaturityDetailDomain | null>;
}

// Volume mix and complexity (from Anaplan volume KPIs)
export interface SiteVolumeMix {
	siteName: string;
	totalHL: number;
	shares: number[]; // 9 shares (0–1) in VOLUME_KPI_CODES order
	complexity: number; // 0–1: normalized entropy (1 = balanced mix, 0 = concentrated)
}

export type ProductType =
	| "beer_only"
	| "soft_drink_only"
	| "water_only"
	| "mixed_beer_soft_drink"
	| "mixed_other"
	| "unknown";

// Site migration readiness status (Sprint 9)
export interface SiteMigrationStatus {
	name: string;
	zone: string;
	volume: number;
	volGroup: string;
	currentLevel: number; // 0-4 (Total Global rounded)
	techAvg: number; // continuous avg of active domains
	vpoScore: number | null;
	ose: number | null;
	ttp: number | null;
	blockingDomains: { short: string; key: string; score: number; target: number; productType: string }[];
	domainsReadyCount: number; // active domains already at target level
	totalActiveCount: number; // total active domains for this site
	domainProgress: number; // 0-1 fraction of domains ready
	vpoReady: boolean; // VPO meets minimum for next transition
	readinessClass: "ready" | "close" | "far" | "nodata" | "vpo_foundation";
}
