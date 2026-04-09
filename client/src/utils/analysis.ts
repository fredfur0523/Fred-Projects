// Statistical and analytical computation utilities
import type {
  Site, VpoData, AnaplanRow,
  ImpactByLevel, StatsAnalysis, ZoneAnalysisRow, ThresholdRow,
  DomainOseRow, PillarPartialRow, DomainTransition,
  DomainAnalysisRow, DomainAnalysis,
  VolumeComplexityCluster, MaturityProfileCluster,
} from '../types';
import { DOMAIN_KEYS } from '../constants/domains';

// Pearson correlation: x = predictor, y = outcome
export function pearson(x: number[], y: number[]): number | null {
  const n = x.length;
  if (n < 2) return null;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  return denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : null;
}

// Partial correlation r(X,Y|Z): effect of X on Y controlling for Z
export function partialCorr(x: number[], y: number[], z: number[]): number | null {
  const rxy = pearson(x, y), rxz = pearson(x, z), ryz = pearson(y, z);
  if (rxy == null || rxz == null || ryz == null) return null;
  const d = Math.sqrt((1 - rxz * rxz) * (1 - ryz * ryz));
  return d > 0 ? (rxy - rxz * ryz) / d : null;
}

export function computeStatsAnalysis(impactByLevel: ImpactByLevel[]): StatsAnalysis {
  const levels = impactByLevel.filter(i => i.composite != null && i.withKpiCount > 0);
  const n = levels.length;
  if (n < 2) {
    return {
      correlation: null,
      byLevel: impactByLevel.map(i => ({ level: i.level, mean: i.composite, count: i.withKpiCount })),
      narrative: n === 0 ? 'Dados insuficientes para análise estatística.' : 'É necessário mais de um nível com dados para correlacionar maturidade e resultado.',
    };
  }
  const levelNum = (l: string) => parseInt(l.replace('L', ''), 10) || 0;
  const x = levels.map(i => levelNum(i.level));
  const y = levels.map(i => i.composite!);
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const corr = denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : null;
  let narrative = '';
  if (corr != null) {
    if (corr > 0.3) narrative = 'Há associação positiva entre nível de maturidade tecnológica e resultado operacional: quanto maior o nível (L0→L4), maior tende a ser o indicador composto. O investimento em maturidade mostra efeito nos resultados.';
    else if (corr < -0.3) narrative = 'Há associação negativa entre maturidade e indicador: revisar métricas ou amostra.';
    else narrative = 'A correlação entre maturidade e resultado é fraca no período. Pode ser necessário mais tempo ou mais dados para observar o efeito.';
  }
  return {
    correlation: corr,
    byLevel: impactByLevel.map(i => ({ level: i.level, mean: i.composite, count: i.withKpiCount })),
    narrative,
  };
}

export function computeZoneAnalysis(
  sites: Site[], siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>,
  vpoData: VpoData | null
): ZoneAnalysisRow[] {
  const zones = ['APAC', 'MAZ', 'SAZ', 'NAZ', 'AFR', 'EUR'];
  return zones.map(z => {
    const zSites = sites.filter(s => s.zone === z);
    const rows = zSites.map(s => {
      const kpi = siteOseTtp[s.name];
      const vpo = vpoData?.[s.name]?.overall_score ?? null;
      const active = Object.entries(s.scores).filter(([k, v]) => k !== 'Total Global' && v > 0);
      const techAvg = active.length > 0 ? active.reduce((a, [, v]) => a + v, 0) / active.length : 0;
      return { ose: kpi?.ose ?? null, ttp: kpi?.ttp ?? null, vpo, techAvg };
    }).filter(r => r.vpo != null && r.ose != null);
    const vpos = rows.map(r => r.vpo!);
    const oses = rows.map(r => r.ose!);
    const techs = rows.map(r => r.techAvg);
    const ttps = rows.filter(r => r.ttp != null).map(r => r.ttp!);
    return {
      zone: z, n: rows.length,
      avgVpo: vpos.length ? vpos.reduce((a, b) => a + b, 0) / vpos.length : null,
      avgOse: oses.length ? oses.reduce((a, b) => a + b, 0) / oses.length : null,
      avgTtp: ttps.length ? ttps.reduce((a, b) => a + b, 0) / ttps.length : null,
      avgTech: techs.length ? techs.reduce((a, b) => a + b, 0) / techs.length : 0,
      rVpoOse: rows.length >= 5 ? pearson(vpos, oses) : null,
      rTechOse: rows.length >= 5 ? pearson(techs, oses) : null,
    };
  });
}

export function computeThresholdSweep(
  sites: Site[], siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>,
  vpoData: VpoData | null, thresholds: number[]
): ThresholdRow[] {
  const rows = sites.map(s => {
    const kpi = siteOseTtp[s.name]; const vpo = vpoData?.[s.name]?.overall_score ?? null;
    const active = Object.entries(s.scores).filter(([k, v]) => k !== 'Total Global' && v > 0);
    const techAvg = active.length > 0 ? active.reduce((a, [, v]) => a + v, 0) / active.length : 0;
    return { ose: kpi?.ose ?? null, vpo, techAvg };
  }).filter(r => r.vpo != null && r.ose != null);
  return thresholds.map(t => {
    const above = rows.filter(r => r.vpo! >= t);
    const below = rows.filter(r => r.vpo! < t);
    return {
      threshold: t,
      nAbove: above.length,
      rAbove: above.length >= 5 ? pearson(above.map(r => r.techAvg), above.map(r => r.ose!)) : null,
      nBelow: below.length,
      rBelow: below.length >= 5 ? pearson(below.map(r => r.techAvg), below.map(r => r.ose!)) : null,
    };
  });
}

export function computeDomainOseCorrelation(
  sites: Site[], siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>
): DomainOseRow[] {
  const GHQ_PCT: Record<string, number> = { 'Management': 63, 'Quality': 1, 'Packaging Performance': 1, 'Brewing Performance': 39, 'Safety': 45, 'Maintenance': 33, 'Data Acquisition': 79, 'MasterData Management': 93, 'Utilities': 4 };
  return DOMAIN_KEYS.filter(d => d.key !== 'Total Global').map(dk => {
    const pairs = sites.map(s => ({ score: s.scores[dk.key] ?? 0, ose: siteOseTtp[s.name]?.ose ?? null })).filter(p => p.score > 0 && p.ose != null);
    const ghq = GHQ_PCT[dk.key] ?? 0;
    return {
      domain: dk.key, short: dk.short, ghqPct: ghq, n: pairs.length,
      rOse: pairs.length >= 5 ? pearson(pairs.map(p => p.score), pairs.map(p => p.ose!)) : null,
      cls: ghq >= 60 ? 'global' as const : ghq >= 20 ? 'mixed' as const : 'legacy' as const,
    };
  }).sort((a, b) => (b.ghqPct - a.ghqPct));
}

export function computePillarPartials(
  sites: Site[], siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>,
  vpoData: VpoData | null
): PillarPartialRow[] {
  const PILS = ['Maintenance', 'Logistics', 'Management', 'Quality', 'People', 'Environment', 'Safety'];
  return PILS.map(p => {
    const rows = sites.map(s => {
      const kpi = siteOseTtp[s.name]; const vpo = vpoData?.[s.name];
      return { ose: kpi?.ose ?? null, pillar: vpo?.pillars?.[p]?.score ?? null, overall: vpo?.overall_score ?? null };
    }).filter(r => r.ose != null && r.pillar != null && r.overall != null);
    const ps = rows.map(r => r.pillar!); const os = rows.map(r => r.ose!); const vs = rows.map(r => r.overall!);
    const rSimple = rows.length >= 5 ? pearson(ps, os) : null;
    const rPartial = rows.length >= 5 ? partialCorr(ps, os, vs) : null;
    const cls = rPartial != null && Math.abs(rPartial) > 0.15 ? 'own' as const : rPartial != null && Math.abs(rPartial) < 0.05 ? 'spurious' as const : 'marginal' as const;
    return { pillar: p, rSimple, rPartial, n: rows.length, cls };
  });
}

export function computeDomainReadiness(
  sites: Site[], siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>,
  vpoData: VpoData | null, domainKey: string
): DomainTransition[] {
  const byScore: Record<number, { ose: number | null; vpo: number | null }[]> = {};
  sites.forEach(s => {
    const sc = s.scores[domainKey] ?? 0;
    if (sc === 0) return;
    const kpi = siteOseTtp[s.name]; const vpo = vpoData?.[s.name]?.overall_score ?? null;
    if (!byScore[sc]) byScore[sc] = [];
    byScore[sc].push({ ose: kpi?.ose ?? null, vpo });
  });
  const transitions: DomainTransition[] = [];
  for (const [fl, tl] of [[1, 2], [2, 3]] as [number, number][]) {
    const from = (byScore[fl] ?? []).filter(r => r.ose != null);
    const to = (byScore[tl] ?? []).filter(r => r.ose != null);
    if (from.length < 3 || to.length < 3) continue;
    const fromOse = from.reduce((a, r) => a + r.ose!, 0) / from.length;
    const toOse = to.reduce((a, r) => a + r.ose!, 0) / to.length;
    const sorted = [...to].sort((a, b) => a.ose! - b.ose!);
    const mid = Math.floor(sorted.length / 2);
    const topHalf = sorted.slice(mid).filter(r => r.vpo != null);
    const botHalf = sorted.slice(0, mid).filter(r => r.vpo != null);
    transitions.push({
      from: fl, to: tl, fromN: from.length, toN: to.length,
      fromOse, toOse, delta: toOse - fromOse,
      viable: (toOse - fromOse) > 0.05,
      topVpo: topHalf.length ? topHalf.reduce((a, r) => a + r.vpo!, 0) / topHalf.length : null,
      botVpo: botHalf.length ? botHalf.reduce((a, r) => a + r.vpo!, 0) / botHalf.length : null,
    });
  }
  return transitions;
}

export function buildDomainAnalysis(
  sites: Site[],
  siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>,
  domainKeys: { key: string; short: string }[]
): DomainAnalysis {
  const rows: DomainAnalysisRow[] = domainKeys.map(d => {
    const siteScores = sites.map(s => ({ site: s, score: s.scores[d.key] ?? 0 }));
    const avgMaturity = siteScores.length ? siteScores.reduce((a, x) => a + x.score, 0) / siteScores.length : 0;
    const matureSites = siteScores.filter(x => x.score >= 2).map(x => x.site);
    const withOse = matureSites.filter(s => siteOseTtp[s.name]?.ose != null);
    const withTtp = matureSites.filter(s => siteOseTtp[s.name]?.ttp != null);
    const avgOsePct = withOse.length ? withOse.reduce((a, s) => a + (siteOseTtp[s.name].ose! * 100), 0) / withOse.length : null;
    const avgTtp = withTtp.length ? withTtp.reduce((a, s) => a + siteOseTtp[s.name].ttp!, 0) / withTtp.length : null;
    return { domain: d.key, domainShort: d.short, siteCount: matureSites.length, avgMaturity, avgOsePct, avgTtp };
  });
  const withBoth = rows.filter(r => r.avgOsePct != null && r.avgTtp != null);
  const n = withBoth.length;
  const corrOse = n >= 2 ? pearson(withBoth.map(r => r.avgMaturity), withBoth.map(r => r.avgOsePct!)) : null;
  const corrTtp = n >= 2 ? pearson(withBoth.map(r => r.avgMaturity), withBoth.map(r => r.avgTtp!)) : null;
  let answerMatureDomain = 'Dados insuficientes para correlacionar maturidade do domínio com OSE/TTP.';
  if (corrOse != null || corrTtp != null) {
    if ((corrOse != null && corrOse > 0.3) || (corrTtp != null && corrTtp > 0.3))
      answerMatureDomain = 'Sim. Domínios com maturidade média mais alta tendem a apresentar melhores OSE e/ou TTP (correlação positiva). Investir em maturidade por domínio está alinhado a melhores resultados.';
    else if ((corrOse != null && corrOse < -0.3) || (corrTtp != null && corrTtp < -0.3))
      answerMatureDomain = 'Não no período. A correlação entre maturidade do domínio e indicadores é negativa; revisar métricas ou amostra.';
    else
      answerMatureDomain = 'A correlação é fraca: ter um domínio mais maduro não mostra, nos dados atuais, relação forte com OSE/TTP. Pode ser necessário mais tempo ou mais dados.';
  }
  const highMaturityLowIndicators = rows.filter(r => r.avgMaturity >= 2 && (r.avgOsePct != null && r.avgOsePct < 70 || r.avgTtp != null && r.avgTtp < 2));
  let answerHighAvg = 'Média de maturidade alta com indicadores ainda baixos pode indicar rollout recente (resultados ainda não refletidos) ou outros fatores (volume, mix, operação). Não é necessariamente mau sinal se a tendência for de melhoria.';
  if (highMaturityLowIndicators.length > 0)
    answerHighAvg = `${highMaturityLowIndicators.length} domínio(s) com maturidade média ≥2 e OSE <70% ou TTP <2. ` + answerHighAvg;
  const bestOse = rows.filter(r => r.avgOsePct != null).sort((a, b) => (b.avgOsePct ?? 0) - (a.avgOsePct ?? 0))[0];
  const bestTtp = rows.filter(r => r.avgTtp != null).sort((a, b) => (b.avgTtp ?? 0) - (a.avgTtp ?? 0))[0];
  let answerPortfolio = 'Compare a maturidade por domínio (tabela abaixo) com OSE e TTP. Em geral, priorizar domínios que impactam supply (DA, MDM, PP, BP) e elevar para L2+ tende a melhorar indicadores quando há correlação positiva.';
  if (bestOse || bestTtp)
    answerPortfolio = `Melhor OSE médio: ${bestOse?.domainShort ?? '—'}. Melhor TTP médio: ${bestTtp?.domainShort ?? '—'}. ` + answerPortfolio;
  return { rows, correlationMaturityOse: corrOse ?? null, correlationMaturityTtp: corrTtp ?? null, answerMatureDomain, answerHighAvg, answerPortfolio };
}

export function buildMaturityProfileClusters(
  sites: Site[],
  siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>
): MaturityProfileCluster[] {
  const clusters: { key: string; label: string; description: string; test: (s: Site) => boolean }[] = [
    {
      key: 'TOP', label: 'Top Performers',
      description: 'Total Global ≥ 3 — alta maturidade em quase todos os domínios',
      test: s => (s.scores['Total Global'] ?? 0) >= 3,
    },
    {
      key: 'PKG', label: 'Packaging Focus',
      description: 'Forte em BP e PP (≥ 2.5 em média) — packaging como diferencial',
      test: s => ((s.scores['Brewing Performance'] ?? 0) + (s.scores['Packaging Performance'] ?? 0)) / 2 >= 2.5
        && (s.scores['Total Global'] ?? 0) < 3,
    },
    {
      key: 'DAT', label: 'Data Maturity',
      description: 'Forte em DA e MDM (≥ 2.5 em média) — dados e master data',
      test: s => ((s.scores['Data Acquisition'] ?? 0) + (s.scores['MasterData Management'] ?? 0)) / 2 >= 2.5
        && ((s.scores['Brewing Performance'] ?? 0) + (s.scores['Packaging Performance'] ?? 0)) / 2 < 2.5
        && (s.scores['Total Global'] ?? 0) < 3,
    },
    {
      key: 'DEV', label: 'Developing',
      description: 'Total Global 1–2 — maturidade média em avanço',
      test: s => {
        const tg = s.scores['Total Global'] ?? 0;
        return tg >= 1 && tg < 3
          && ((s.scores['Brewing Performance'] ?? 0) + (s.scores['Packaging Performance'] ?? 0)) / 2 < 2.5
          && ((s.scores['Data Acquisition'] ?? 0) + (s.scores['MasterData Management'] ?? 0)) / 2 < 2.5;
      },
    },
    {
      key: 'EMG', label: 'Emerging',
      description: 'Total Global < 1 — início da jornada digital',
      test: s => (s.scores['Total Global'] ?? 0) < 1,
    },
  ];
  return clusters.map(c => {
    const clusterSites = sites.filter(c.test);
    const withOse = clusterSites.filter(s => siteOseTtp[s.name]?.ose != null);
    const withTtp = clusterSites.filter(s => siteOseTtp[s.name]?.ttp != null);
    const avgOsePct = withOse.length ? withOse.reduce((a, s) => a + siteOseTtp[s.name].ose! * 100, 0) / withOse.length : null;
    const avgTtp = withTtp.length ? withTtp.reduce((a, s) => a + siteOseTtp[s.name].ttp!, 0) / withTtp.length : null;
    const avgMaturity = clusterSites.length ? clusterSites.reduce((a, s) => a + (s.scores['Total Global'] ?? 0), 0) / clusterSites.length : 0;
    return {
      clusterKey: c.key, label: c.label, description: c.description,
      siteCount: clusterSites.length, sites: clusterSites,
      avgOsePct, avgTtp, avgMaturity,
      withKpiCount: Math.max(withOse.length, withTtp.length),
    };
  }).filter(c => c.siteCount > 0);
}

export function buildPageInsights(
  filteredSites: Site[],
  totalSites: number,
  impactOseTtp: { level: string; siteCount: number; withKpiCount: number; avgOse: number | null; avgTtp: number | null }[],
  volumeComplexityClusters: VolumeComplexityCluster[],
  domainAnalysis: DomainAnalysis,
  selectedClusters: string[],
  hasOseTtpStudy: boolean,
  statsResolved: { correlationOse?: number | null; correlationTtp?: number | null; narrative?: string }
): string {
  const parts: string[] = [];
  const escopo = selectedClusters.length > 0
    ? `Análise restrita aos clusters ${selectedClusters.join(', ')}: ${filteredSites.length} de ${totalSites} operações.`
    : `Análise sobre as ${totalSites} operações (sem filtro de cluster).`;
  parts.push(escopo);

  if (hasOseTtpStudy && impactOseTtp.length) {
    const byLevel = impactOseTtp
      .filter(i => i.withKpiCount > 0 && (i.avgOse != null || i.avgTtp != null))
      .map(i => `${i.level}: OSE ${i.avgOse != null ? (i.avgOse * 100).toFixed(1) + '%' : '—'}, TTP ${i.avgTtp != null ? i.avgTtp.toFixed(2) : '—'} (${i.withKpiCount} sites)`);
    if (byLevel.length) parts.push(`Por nível de maturidade (L0–L4): ${byLevel.join('; ')}.`);
    const bestOse = impactOseTtp.filter(i => i.avgOse != null).sort((a, b) => (b.avgOse ?? 0) - (a.avgOse ?? 0))[0];
    if (bestOse) parts.push(`Nível com melhor OSE médio: ${bestOse.level}.`);
  }

  if (volumeComplexityClusters.length) {
    const bestCluster = volumeComplexityClusters.filter(c => c.avgOsePct != null).sort((a, b) => (b.avgOsePct ?? 0) - (a.avgOsePct ?? 0))[0];
    const worstTtp = volumeComplexityClusters.filter(c => c.avgTtp != null).sort((a, b) => (b.avgTtp ?? 0) - (a.avgTtp ?? 0))[0];
    if (bestCluster) parts.push(`Entre os clusters (volume × complexidade), melhor OSE médio em ${bestCluster.clusterKey} (${bestCluster.avgOsePct?.toFixed(1)}%).`);
    if (worstTtp && volumeComplexityClusters.length > 1) parts.push(`Maior TTP médio no cluster ${worstTtp.clusterKey} (${worstTtp.avgTtp?.toFixed(2)}), sugerindo maior complexidade operacional.`);
  }

  const corrOse = domainAnalysis.correlationMaturityOse ?? statsResolved.correlationOse;
  const corrTtp = domainAnalysis.correlationMaturityTtp ?? statsResolved.correlationTtp;
  if (corrOse != null || corrTtp != null) {
    const interp = [];
    if (corrOse != null && corrOse > 0.3) interp.push('correlação positiva entre maturidade e OSE');
    else if (corrOse != null && corrOse < -0.3) interp.push('correlação negativa maturidade×OSE');
    if (corrTtp != null && corrTtp > 0.3) interp.push('maturidade e TTP positivamente correlacionados');
    else if (corrTtp != null && corrTtp < -0.3) interp.push('correlação negativa maturidade×TTP');
    if (interp.length) parts.push(`Correlações: ${interp.join('; ')}.`);
  }

  const bestDomainOse = domainAnalysis.rows.filter(r => r.avgOsePct != null).sort((a, b) => (b.avgOsePct ?? 0) - (a.avgOsePct ?? 0))[0];
  const bestDomainTtp = domainAnalysis.rows.filter(r => r.avgTtp != null).sort((a, b) => (b.avgTtp ?? 0) - (a.avgTtp ?? 0))[0];
  if (bestDomainOse || bestDomainTtp)
    parts.push(`Por domínio, destaque em OSE: ${bestDomainOse?.domainShort ?? '—'}; em TTP: ${bestDomainTtp?.domainShort ?? '—'}. Priorizar maturidade em DA, MDM, PP e BP tende a reforçar resultados quando a correlação for positiva.`);

  if (statsResolved.narrative) parts.push(statsResolved.narrative);
  return parts.join(' ');
}
