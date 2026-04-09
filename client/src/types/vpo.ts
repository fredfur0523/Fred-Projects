// VPO Process Maturity data: loaded from vpo-site-scores-2026.json

export interface VpoPillarScore {
	score: number | null;
	y: number;
	n: number;
	na: number;
	by_level: Record<string, { y: number; n: number; na: number }>;
}

export interface VpoSiteData {
	vpo_name: string;
	zone: string;
	overall_score: number | null;
	pillars: Record<string, VpoPillarScore>;
}

export type VpoData = Record<string, VpoSiteData>;
