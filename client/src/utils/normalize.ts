// Normalization utilities: plant names → site names, site KPI aggregation

import { KPI_EPT, KPI_OST, PLANT_TO_SITE_OVERRIDE, STUDY_KPI_OSE_PRECALC, STUDY_KPI_TTP } from "../constants/kpis";
import type { AnaplanRow, Site } from "../types";

export const normalizePlantToSite = (plant: string, siteNames: string[]): string | null => {
	// 1. Explicit override
	if (PLANT_TO_SITE_OVERRIDE[plant]) return PLANT_TO_SITE_OVERRIDE[plant];
	// 2. Strip common suffixes (case-insensitive)
	const p = plant
		.replace(/\s*_BOPS\s*$|\s*_T1\s*$/i, "")
		.replace(/\s*Beer_BOPS\s*$/i, "")
		.replace(/\s+Beer\s*$/i, "")
		.replace(/\s+Brewery\s*$/i, "")
		.replace(/\s*\(SABM\)\s*$|\s*\(BO\)\s*$|\s*\(New\)\s*$/i, "")
		.replace(/\s+New\s*$/i, "")
		.trim();
	// 3. Case-insensitive exact match
	const pl = p.toLowerCase();
	const exact = siteNames.find((s) => s.toLowerCase() === pl);
	if (exact) return exact;
	// 4. Word-boundary aware partial match (avoid false positives like "Ate" → "Albairate")
	const match = siteNames.find((s) => {
		const sl = s.toLowerCase();
		// Only match if one is a prefix/suffix of the other at word boundaries
		return (
			pl === sl || pl.startsWith(sl + " ") || sl.startsWith(pl + " ") || pl.endsWith(" " + sl) || sl.endsWith(" " + pl)
		);
	});
	return match ?? null;
};

export function getSiteOseTtp(
	sites: Site[],
	anaplanRows: AnaplanRow[],
): Record<string, { ose: number | null; ttp: number | null }> {
	const studyKpis = [KPI_EPT, KPI_OST, STUDY_KPI_OSE_PRECALC, STUDY_KPI_TTP];
	const studyRows = anaplanRows.filter((r) => studyKpis.includes(r.kpi_code));
	const siteNames = sites.map((s) => s.name);
	const plantToSite = (plant: string) => normalizePlantToSite(plant, siteNames);
	type SiteSums = { ept: number; ost: number; osePrecalc: number[]; ttp: number[] };
	const bySite: Record<string, SiteSums> = {};
	studyRows.forEach((r) => {
		if (r.plant === "N/A" || !r.plant) return;
		const site = plantToSite(r.plant);
		if (!site) return;
		if (!bySite[site]) bySite[site] = { ept: 0, ost: 0, osePrecalc: [], ttp: [] };
		const v = r.aggregated_value;
		if (r.kpi_code === KPI_EPT) bySite[site].ept += v;
		else if (r.kpi_code === KPI_OST) bySite[site].ost += v;
		else if (r.kpi_code === STUDY_KPI_OSE_PRECALC) bySite[site].osePrecalc.push(v);
		else if (r.kpi_code === STUDY_KPI_TTP) bySite[site].ttp.push(v);
	});
	const result: Record<string, { ose: number | null; ttp: number | null }> = {};
	sites.forEach((s) => {
		const k = bySite[s.name];
		let ose: number | null = null;
		if (k?.ost > 0) ose = k.ept / k.ost;
		if (ose == null && k?.osePrecalc?.length) ose = k.osePrecalc.reduce((a, b) => a + b, 0) / k.osePrecalc.length;
		const ttp = k?.ttp?.length ? k.ttp.reduce((a, b) => a + b, 0) / k.ttp.length : null;
		result[s.name] = { ose: ose ?? null, ttp };
	});
	return result;
}
