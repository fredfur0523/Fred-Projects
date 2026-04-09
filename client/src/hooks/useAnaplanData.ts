// Hook: fetch Anaplan KPIs, VPO scores, KPI history, and waterfall data
import { useState, useEffect } from 'react';
import type { AnaplanData, VpoData, KpiHistoryData, WaterfallData } from '../types';
import type { ViewMode } from '../types/app';

export function useAnaplanData(view: ViewMode) {
  const [anaplanData, setAnaplanData] = useState<AnaplanData | null>(null);
  const [vpoData, setVpoData] = useState<VpoData | null>(null);
  const [kpiHistory, setKpiHistory] = useState<KpiHistoryData | null>(null);
  const [waterfallData, setWaterfallData] = useState<WaterfallData | null>(null);

  // Fetch Anaplan KPIs + VPO when analysis/sites/overview views are active
  useEffect(() => {
    if (view !== 'analysis' && view !== 'sites' && view !== 'overview') return;
    let cancelled = false;
    const load = (url: string) => fetch(url).then(r => r.ok ? r.json() : null);
    Promise.all([
      load('/anaplan-kpis-2025.json').then(d => d?.rows?.length ? d : load('/anaplan-kpis.json')),
      load('/anaplan-ose-ttp-2025.json'),
      load('/vpo-site-scores-2026.json'),
    ]).then(([base, oseTtp, vpo]) => {
      if (cancelled) return;
      const year = (base as AnaplanData | null)?.year ?? (oseTtp as AnaplanData | null)?.year ?? 2025;
      const baseRows = (base as AnaplanData | null)?.rows ?? [];
      const oseTtpRows = (oseTtp as AnaplanData | null)?.rows ?? [];
      const rows = oseTtpRows.length ? [...baseRows, ...oseTtpRows] : baseRows;
      if (rows.length) setAnaplanData({ year, rows });
      else setAnaplanData(null);
      if (vpo && typeof vpo === 'object') setVpoData(vpo as VpoData);
    }).catch(() => { if (!cancelled) { setAnaplanData(null); setVpoData(null); } });
    return () => { cancelled = true; };
  }, [view]);

  // Fetch KPI history for sparklines & trend badges
  useEffect(() => {
    if (kpiHistory) return;
    if (view !== 'analysis' && view !== 'maturity' && view !== 'overview') return;
    fetch('/kpi-history.json')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.periods && d.months) setKpiHistory(d as KpiHistoryData); })
      .catch(() => {});
  }, [view, kpiHistory]);

  // Fetch waterfall.json for OSE drivers
  useEffect(() => {
    if (waterfallData) return;
    if (view !== 'analysis') return;
    fetch('/waterfall.json')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.data) setWaterfallData(d as WaterfallData); })
      .catch(() => {});
  }, [view, waterfallData]);

  return { anaplanData, vpoData, kpiHistory, waterfallData };
}
