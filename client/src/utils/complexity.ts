// Operational complexity computation utilities
import type { Site, SiteVolumeMix, ProductType, VolumeComplexityCluster } from '../types';
import { DOMAIN_KEYS } from '../constants/domains';

export function complexityBand(c: number): 'L' | 'M' | 'H' {
  if (c < 0.25) return 'L';
  if (c < 0.60) return 'M';
  return 'H';
}

// Proxy complexity: variance of applicable domain scores.
// If TG > 0, domains with score=0 are "N/A" (excluded to avoid inflating variance).
// If TG = 0, all domains included (zeros represent real gaps).
function getProxyComplexity(site: Site): number {
  const keys = DOMAIN_KEYS.filter(d => d.key !== 'Total Global').map(d => d.key);
  const tg = site.scores['Total Global'] ?? 0;
  const allScores = keys.map(k => site.scores[k] ?? 0);
  const scores = tg > 0 ? allScores.filter(v => v > 0) : allScores;
  if (scores.length < 2) return 0;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, x) => a + (x - mean) ** 2, 0) / scores.length;
  return Math.min(1, variance / 4);
}

export function getSiteComplexity(site: Site, volumeMix: Map<string, SiteVolumeMix>): number {
  const mix = volumeMix.get(site.name);
  if (mix && mix.totalHL > 0) return mix.complexity;
  return getProxyComplexity(site);
}

export function getSiteComplexityBand(site: Site, volumeMix: Map<string, SiteVolumeMix>): 'L' | 'M' | 'H' {
  return complexityBand(getSiteComplexity(site, volumeMix));
}

// Tertile-based bands — ensures L/M/H always has ~⅓ of operations each,
// independent of raw value compression (proxy or real volume).
export function getSiteComplexityBands(sites: Site[], volumeMix: Map<string, SiteVolumeMix>): Record<string, 'L' | 'M' | 'H'> {
  const rawBySite: Record<string, number> = {};
  sites.forEach(s => { rawBySite[s.name] = getSiteComplexity(s, volumeMix); });
  const sorted = [...Object.values(rawBySite)].sort((a, b) => a - b);
  const n = sorted.length;
  const t33 = sorted[Math.floor(n / 3)] ?? 0;
  const t67 = sorted[Math.floor(2 * n / 3)] ?? 0;
  const out: Record<string, 'L' | 'M' | 'H'> = {};
  sites.forEach(s => {
    const raw = rawBySite[s.name] ?? 0;
    out[s.name] = raw <= t33 ? 'L' : raw <= t67 ? 'M' : 'H';
  });
  return out;
}

export function getSiteClusterKey(site: Site, volumeMix: Map<string, SiteVolumeMix>, complexityBands?: Record<string, 'L' | 'M' | 'H'>): string {
  const band = complexityBands?.[site.name] ?? getSiteComplexityBand(site, volumeMix);
  return `${site.group}_${band}`;
}

export function getProductType(site: Site, volumeMix: Map<string, SiteVolumeMix>): ProductType {
  const mix = volumeMix.get(site.name);
  if (!mix || mix.totalHL <= 0) return 'unknown';
  const beer = (mix.shares[1] ?? 0) + (mix.shares[4] ?? 0) + (mix.shares[7] ?? 0);
  const softDrink = (mix.shares[0] ?? 0) + (mix.shares[5] ?? 0) + (mix.shares[8] ?? 0);
  const water = (mix.shares[2] ?? 0) + (mix.shares[3] ?? 0) + (mix.shares[6] ?? 0);
  const tol = 0.05;
  if (beer >= 1 - tol && softDrink < tol && water < tol) return 'beer_only';
  if (softDrink >= 1 - tol && beer < tol && water < tol) return 'soft_drink_only';
  if (water >= 1 - tol && beer < tol && softDrink < tol) return 'water_only';
  if (beer >= tol && softDrink >= tol) return 'mixed_beer_soft_drink';
  return 'mixed_other';
}

export function buildVolumeComplexityClusters(
  sites: Site[],
  volumeMix: Map<string, SiteVolumeMix>,
  siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>,
  complexityBands?: Record<string, 'L' | 'M' | 'H'>
): VolumeComplexityCluster[] {
  const clusters = new Map<string, Site[]>();
  sites.forEach(site => {
    const band = complexityBands?.[site.name] ?? getSiteComplexityBand(site, volumeMix);
    const key = `${site.group}_${band}`;
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key)!.push(site);
  });
  return Array.from(clusters.entries()).map(([clusterKey, clusterSites]) => {
    const [volumeBand, complexityBandVal] = clusterKey.split('_');
    const withKpi = clusterSites.filter(s => siteOseTtp[s.name] && (siteOseTtp[s.name].ose != null || siteOseTtp[s.name].ttp != null));
    const oseVals = withKpi.map(s => siteOseTtp[s.name].ose).filter((v): v is number => v != null && isFinite(v));
    const ttpVals = withKpi.map(s => siteOseTtp[s.name].ttp).filter((v): v is number => v != null && isFinite(v));
    return {
      clusterKey, volumeBand, complexityBand: complexityBandVal,
      siteCount: clusterSites.length, sites: clusterSites,
      avgOsePct: oseVals.length ? (oseVals.reduce((a, b) => a + b, 0) / oseVals.length) * 100 : null,
      avgTtp: ttpVals.length ? ttpVals.reduce((a, b) => a + b, 0) / ttpVals.length : null,
      withKpiCount: withKpi.length,
    };
  }).filter(c => c.siteCount > 0).sort((a, b) => a.clusterKey.localeCompare(b.clusterKey));
}
