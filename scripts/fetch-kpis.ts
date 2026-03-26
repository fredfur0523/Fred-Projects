#!/usr/bin/env tsx
/**
 * fetch-kpis.ts
 * Queries Databricks via REST API (SQL Statements API) and generates:
 *   - client/public/waterfall.json      (latest complete month, by zone)
 *   - client/public/kpi-history.json    (last 12 months, by zone)
 *
 * Usage:
 *   npx tsx scripts/fetch-kpis.ts
 *
 * Schema discovery (DESCRIBE TABLE):
 *   Columns: year (string), month (string '3-letter: Jan…Dec'),
 *            periodtype, locationtype, zone, country, plant, plantlines,
 *            kpi_code, value, module, attribute, …
 *   NOTE: no "period" column — period is derived as YYYY-MM from year+month.
 *   NOTE: location filter uses "plantlines" column (not "location").
 *
 * Methodology: ba_packaging_methodology.md / docs/METODOLOGIA_VOLUME_OSE.md
 *   Source : brewdat_uc_supchn_prod.gld_ghq_supply_supplychainkpi.gb_supplychainkpi_consolidated
 *   Filters: periodtype='MTH', attribute='AC', module='BOPSLINE', locationtype='LINE'
 *   Keg exclusion: plantlines → keg | kegging | special kegging (case-insensitive)
 *
 * Waterfall KPI codes:
 *   TT      = GE-R0060   (Total Time)
 *   NST     = PG-R5796   (Total Non-Scheduled Time)
 *   ST      = PG-R0080   (Scheduled Time)
 *   LT      = PG-R0070   (Loading Time)
 *   EPT     = PG-R0060   (Effective Production Time)
 *   OST     = PG-K4039   (Overall Supply Time)
 *   Sub-DPA = PG-R5784, PG-R5785, PG-R5786, PG-R5787, PG-R0161
 *   Sub-EC  = PG-R5779, PG-R5780, PG-R5782, PG-R5783
 *   Sub-IC  = PG-R5776, PG-R5777, PG-R5778
 *   Volume  = PG-R0010   (Net Repacked Volume hl)
 *
 * Performance KPI codes (pre-calculated / fallback):
 *   PG-K4038 (OSE), PG-K0812 (GLY), PG-K0880 (OAE), PG-K0912 (OEE), PG-K1312 (LEF)
 *
 * Canonical formulas (NEVER simple average — aggregate components first):
 *   DPA = Σ Sub-DPA codes
 *   EC  = Σ Sub-EC codes
 *   IC  = Σ Sub-IC codes
 *   LET = EPT + IC          (Loading Effective Time)
 *   OSE = ΣEPT / ΣOST       GLY = ΣEPT / ΣST
 *   OAE = ΣEPT / ΣTT        OEE = ΣEPT / ΣLT        LEF = ΣEPT / ΣLET
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Config ────────────────────────────────────────────────────────────────────
const DATABRICKS_HOST  = process.env.DATABRICKS_HOST  || 'adb-1833638405334946.6.azuredatabricks.net';
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN || 'dapi468bc693e389c0ee8e52d93094cfb3a3-2';
const WAREHOUSE_ID     = process.env.WAREHOUSE_ID     || 'e577c38274ac7a1b';

const TABLE   = 'brewdat_uc_supchn_prod.gld_ghq_supply_supplychainkpi.gb_supplychainkpi_consolidated';
const OUT_DIR = path.join(__dirname, '..', 'client', 'public');

// ── Month helpers ─────────────────────────────────────────────────────────────
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function monthAbbrToNum(abbr: string): number {
  const i = MONTH_ABBR.indexOf(abbr);
  return i >= 0 ? i + 1 : 0;
}

/** Convert month abbreviation to zero-padded string: "Mar" → "03" */
function monthAbbrToStr(abbr: string): string {
  const n = monthAbbrToNum(abbr);
  return n > 0 ? String(n).padStart(2, '0') : '00';
}

/** Period string "YYYY-MM" from year and month abbreviation */
function toPeriod(year: string, month: string): string {
  return `${year}-${monthAbbrToStr(month)}`;
}

// SQL CASE expression that converts month abbreviation to zero-padded string
const MONTH_CASE_SQL = `CASE month
  WHEN 'Jan' THEN '01' WHEN 'Feb' THEN '02' WHEN 'Mar' THEN '03'
  WHEN 'Apr' THEN '04' WHEN 'May' THEN '05' WHEN 'Jun' THEN '06'
  WHEN 'Jul' THEN '07' WHEN 'Aug' THEN '08' WHEN 'Sep' THEN '09'
  WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12'
  ELSE '00' END`;

// Derived period column in SQL: "YYYY-MM" for correct lexicographic ordering
const PERIOD_EXPR = `CONCAT(year, '-', ${MONTH_CASE_SQL})`;

// ── KPI code registry ─────────────────────────────────────────────────────────
const CODE_TT  = 'GE-R0060';
const CODE_NST = 'PG-R5796';
const CODE_ST  = 'PG-R0080';
const CODE_LT  = 'PG-R0070';
const CODE_LET = 'PG-R0090'; // Loading Effective Time (direct from table)
const CODE_EPT = 'PG-R0060';
const CODE_OST = 'PG-K4039';
const CODE_VOL = 'PG-R0010';

const CODES_DPA = ['PG-R5784', 'PG-R5785', 'PG-R5786', 'PG-R5787', 'PG-R0161'];
const CODES_EC  = ['PG-R5779', 'PG-R5780', 'PG-R5782', 'PG-R5783'];
const CODES_IC  = ['PG-R5776', 'PG-R5777', 'PG-R5778'];
const CODES_PERF = ['PG-K4038', 'PG-K0812', 'PG-K0880', 'PG-K0912', 'PG-K1312'];

const ALL_CODES: string[] = [...new Set([
  CODE_TT, CODE_NST, CODE_ST, CODE_LT, CODE_LET, CODE_EPT, CODE_OST, CODE_VOL,
  ...CODES_DPA, ...CODES_EC, ...CODES_IC, ...CODES_PERF,
])];

// Main zones only — exclude SOP sub-zones (AFR_SOP_Bev, AFR_BOPS, EUR_RUK, etc.)
// to prevent double-counting when aggregating Global.
const MAIN_ZONES = ['AFR', 'APAC', 'EUR', 'MAZ', 'NAZ', 'SAZ'];

const CODES_SQL = ALL_CODES.map(c => `'${c}'`).join(', ');

// ── Types ─────────────────────────────────────────────────────────────────────
interface RawRow {
  period: string;
  zone: string;
  kpi_code: string;
  total_value: string;
}

interface KpiMap { [code: string]: number }

interface ZoneMetrics {
  TT: number; NST: number; ST: number; DPA: number;
  LT: number; EC: number; LET: number; IC: number;
  EPT: number; OST: number; volume_hl: number;
  OSE: number|null; GLY: number|null; OAE: number|null;
  OEE: number|null; LEF: number|null;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

function httpsPost(urlPath: string, body: object) {
  return new Promise<{ status: number; body: any }>((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      { hostname: DATABRICKS_HOST, path: urlPath, method: 'POST',
        headers: { 'Authorization': `Bearer ${DATABRICKS_TOKEN}`,
                   'Content-Type': 'application/json',
                   'Content-Length': Buffer.byteLength(payload) } },
      res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode!, body: JSON.parse(d) }); }
          catch (e) { reject(new Error(`JSON parse error (${res.statusCode}): ${d.slice(0,300)}`)); }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function httpsGet(urlPath: string) {
  return new Promise<{ status: number; body: any }>((resolve, reject) => {
    const req = https.request(
      { hostname: DATABRICKS_HOST, path: urlPath, method: 'GET',
        headers: { 'Authorization': `Bearer ${DATABRICKS_TOKEN}` } },
      res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode!, body: JSON.parse(d) }); }
          catch (e) { reject(new Error(`JSON parse error (${res.statusCode}): ${d.slice(0,300)}`)); }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

// ── Databricks SQL Statements API ─────────────────────────────────────────────
async function runQuery(sql: string, label = 'query'): Promise<RawRow[]> {
  const t0 = Date.now();
  console.log(`\n[DB] Submitting ${label}...`);

  const submitRes = await httpsPost('/api/2.0/sql/statements', {
    statement: sql, warehouse_id: WAREHOUSE_ID,
    wait_timeout: '50s', on_wait_timeout: 'CONTINUE',
    format: 'JSON_ARRAY', disposition: 'INLINE',
  });

  if (submitRes.status !== 200)
    throw new Error(`[DB] Submit failed (${submitRes.status}): ${JSON.stringify(submitRes.body)}`);

  let result = submitRes.body;
  const stmtId: string = result.statement_id;

  let polls = 0;
  while (['PENDING', 'RUNNING'].includes(result.status?.state)) {
    polls++;
    const wait = Math.min(2000 + polls * 500, 8000);
    console.log(`[DB] ${label}: ${result.status.state} (poll #${polls}, waiting ${wait}ms)`);
    await sleep(wait);
    const pollRes = await httpsGet(`/api/2.0/sql/statements/${stmtId}`);
    if (pollRes.status !== 200) throw new Error(`[DB] Poll failed: ${JSON.stringify(pollRes.body)}`);
    result = pollRes.body;
  }

  if (result.status?.state !== 'SUCCEEDED')
    throw new Error(`[DB] ${label} failed: ${JSON.stringify(result.status?.error ?? result.status)}`);

  const rawRows: any[][] = result.result?.data_array ?? [];
  const cols: string[]   = result.manifest?.schema?.columns?.map((c: any) => c.name) ?? [];
  console.log(`[DB] ✓ ${label}: ${rawRows.length} rows in ${Date.now()-t0}ms (${polls} polls)`);

  return rawRows.map(row => {
    const obj: any = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj as RawRow;
  });
}

// ── Base filter (shared by all queries) ───────────────────────────────────────
const ZONES_SQL = MAIN_ZONES.map(z => `'${z}'`).join(', ');
const BASE_WHERE = `
  periodtype = 'MTH'
  AND attribute = 'AC'
  AND module    = 'BOPSLINE'
  AND locationtype = 'LINE'
  AND zone IN (${ZONES_SQL})
  AND LOWER(plantlines) NOT LIKE '%keg%'
  AND LOWER(plantlines) NOT LIKE '%kegging%'
  AND LOWER(plantlines) NOT LIKE '%special kegging%'
`.trim();

// ── Period detection ──────────────────────────────────────────────────────────
async function detectLatestPeriod(): Promise<string> {
  // Use EPT (PG-R0060) as the anchor for "real" operational data.
  // Future months may have TT projections but no actual EPT — this ensures
  // we pick the latest period with genuine production data.
  const rows = await runQuery(`
    SELECT year, month
    FROM ${TABLE}
    WHERE ${BASE_WHERE}
      AND kpi_code = 'PG-R0060'
    GROUP BY year, month
    ORDER BY year DESC, ${MONTH_CASE_SQL} DESC
    LIMIT 1
  `, 'latest-period');

  if (!rows.length) throw new Error('[Period] No rows with EPT (PG-R0060) found for MTH/AC/BOPSLINE/LINE filters');
  const row = rows[0] as any;
  return toPeriod(row.year ?? row['year'], row.month ?? row['month']);
}

function getLast12Months(latestPeriod: string): string[] {
  const [y, m] = latestPeriod.split('-').map(Number);
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    let mo = m - i, yr = y;
    while (mo <= 0) { mo += 12; yr--; }
    months.push(`${yr}-${String(mo).padStart(2, '0')}`);
  }
  return months;
}

// ── SQL builder ───────────────────────────────────────────────────────────────
/**
 * Builds the main SELECT query.
 * period_filter_sql: an SQL expression that uses PERIOD_EXPR (the derived YYYY-MM column).
 * Example: `${PERIOD_EXPR} = '2026-01'`
 *          `${PERIOD_EXPR} BETWEEN '2025-02' AND '2026-01'`
 */
function buildSQL(periodFilterSql: string): string {
  return `
    SELECT
      ${PERIOD_EXPR}  AS period,
      zone,
      kpi_code,
      SUM(CAST(value AS DOUBLE)) AS total_value
    FROM ${TABLE}
    WHERE ${BASE_WHERE}
      AND kpi_code IN (${CODES_SQL})
      AND ${periodFilterSql}
    GROUP BY ${PERIOD_EXPR}, zone, kpi_code
    ORDER BY period, zone, kpi_code
  `;
}

// ── Metrics computation ───────────────────────────────────────────────────────
function sumCodes(map: KpiMap, codes: string[]): number {
  return codes.reduce((acc, c) => acc + (map[c] ?? 0), 0);
}

function computeMetrics(kpiMap: KpiMap): ZoneMetrics {
  const v = (code: string) => kpiMap[code] ?? 0;

  const TT  = v(CODE_TT);
  const NST = v(CODE_NST);
  const ST  = v(CODE_ST);
  const LT  = v(CODE_LT);
  const EPT = v(CODE_EPT);
  const OST = v(CODE_OST);
  const vol = v(CODE_VOL);

  // Losses from actual sub-KPI codes (canonical — never derived from time differences)
  const DPA = sumCodes(kpiMap, CODES_DPA);
  const EC  = sumCodes(kpiMap, CODES_EC);
  const IC  = sumCodes(kpiMap, CODES_IC);
  // LET = PG-R0090 when available; falls back to EPT + IC (hierarchy: LET → IC losses → EPT)
  // Waterfall: TT > NST > ST > DPA > LT > EC > LET > IC > EPT  ∴ LET = EPT + IC
  const LET_direct = kpiMap['PG-R0090'] ?? 0;
  const LET = LET_direct > 0 ? Math.round(LET_direct) : EPT + IC;

  const pct = (num: number, den: number): number | null =>
    den > 0 ? parseFloat(((num / den) * 100).toFixed(2)) : null;

  return {
    TT:        Math.round(TT),
    NST:       Math.round(NST),
    ST:        Math.round(ST),
    DPA:       Math.round(DPA),
    LT:        Math.round(LT),
    EC:        Math.round(EC),
    LET,                          // already Math.round above
    IC:        Math.round(IC),
    EPT:       Math.round(EPT),
    OST:       Math.round(OST),
    volume_hl: Math.round(vol),
    OSE: pct(EPT, OST),           // ΣEPT / ΣOST
    GLY: pct(EPT, ST),            // ΣEPT / ΣST
    OAE: pct(EPT, TT),            // ΣEPT / ΣTT
    OEE: pct(EPT, LT),            // ΣEPT / ΣLT
    LEF: pct(EPT, LET),           // ΣEPT / ΣLET
  };
}

// ── Row pivoting ──────────────────────────────────────────────────────────────
function pivotByZone(rows: RawRow[]): Record<string, KpiMap> {
  const map: Record<string, KpiMap> = {};
  for (const row of rows) {
    const z = row.zone;
    if (!map[z]) map[z] = {};
    map[z][row.kpi_code] = (map[z][row.kpi_code] || 0) + (parseFloat(row.total_value) || 0);
  }
  return map;
}

function buildGlobal(byZone: Record<string, KpiMap>): KpiMap {
  const g: KpiMap = {};
  for (const kpis of Object.values(byZone)) {
    for (const [code, val] of Object.entries(kpis)) {
      g[code] = (g[code] || 0) + val;
    }
  }
  return g;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('='.repeat(64));
  console.log(' AB InBev — Packaging KPI Fetcher (fetch-kpis.ts)');
  console.log(' Table: gb_supplychainkpi_consolidated');
  console.log('='.repeat(64));

  // 1. Detect latest period
  const latestPeriod = await detectLatestPeriod();
  const last12       = getLast12Months(latestPeriod);

  console.log(`\n[Config] Latest period : ${latestPeriod}`);
  console.log(`[Config] History range : ${last12[0]} → ${last12[last12.length - 1]}`);
  console.log(`[Config] Zones scope   : ${MAIN_ZONES.join(', ')}`);
  console.log(`[Config] All codes     : ${ALL_CODES.join(', ')}`);

  // 2. ── Waterfall (latest period) ──────────────────────────────────────────
  const wfRows   = await runQuery(
    buildSQL(`${PERIOD_EXPR} = '${latestPeriod}'`),
    `waterfall-${latestPeriod}`
  );
  const wfByZone = pivotByZone(wfRows);
  const zones    = Object.keys(wfByZone).sort();

  const waterfallOutput = {
    period:       latestPeriod,
    generated_at: new Date().toISOString(),
    filters: { periodtype: 'MTH', attribute: 'AC', module: 'BOPSLINE', locationtype: 'LINE', keg_excluded: true, zones: MAIN_ZONES },
    zones: ['Global', ...zones],
    data: {
      Global: computeMetrics(buildGlobal(wfByZone)),
      ...Object.fromEntries(zones.map(z => [z, computeMetrics(wfByZone[z])])),
    },
  };

  const g = waterfallOutput.data.Global;
  console.log(`\n[Waterfall] Zones     : ${zones.join(', ')}`);
  console.log(`[Waterfall] Global:`);
  console.log(`  TT=${g.TT?.toLocaleString()}h  ST=${g.ST?.toLocaleString()}h  LT=${g.LT?.toLocaleString()}h  EPT=${g.EPT?.toLocaleString()}h`);
  console.log(`  DPA=${g.DPA?.toLocaleString()}h  EC=${g.EC?.toLocaleString()}h  IC=${g.IC?.toLocaleString()}h  LET=${g.LET?.toLocaleString()}h`);
  console.log(`  OSE=${g.OSE}%  GLY=${g.GLY}%  OAE=${g.OAE}%  OEE=${g.OEE}%  LEF=${g.LEF}%`);
  console.log(`  Volume=${g.volume_hl?.toLocaleString()}hl`);

  // 3. ── KPI History (last 12 months) ───────────────────────────────────────
  const histRows = await runQuery(
    buildSQL(`${PERIOD_EXPR} BETWEEN '${last12[0]}' AND '${last12[last12.length - 1]}'`),
    'kpi-history-12m'
  );

  const histByKey: Record<string, { period: string; zone: string; kpis: KpiMap }> = {};
  for (const row of histRows) {
    const key = `${row.period}|${row.zone}`;
    if (!histByKey[key]) histByKey[key] = { period: row.period, zone: row.zone, kpis: {} };
    histByKey[key].kpis[row.kpi_code] = (histByKey[key].kpis[row.kpi_code] || 0) + (parseFloat(row.total_value) || 0);
  }

  // Build Global per period
  const globalPerPeriod: Record<string, KpiMap> = {};
  for (const { period, kpis } of Object.values(histByKey)) {
    if (!globalPerPeriod[period]) globalPerPeriod[period] = {};
    for (const [code, val] of Object.entries(kpis)) {
      globalPerPeriod[period][code] = (globalPerPeriod[period][code] || 0) + val;
    }
  }

  const months = [
    ...Object.values(histByKey).map(e => ({ period: e.period, zone: e.zone, ...computeMetrics(e.kpis) })),
    ...Object.entries(globalPerPeriod).map(([period, kpis]) => ({ period, zone: 'Global', ...computeMetrics(kpis) })),
  ].sort((a, b) => a.period.localeCompare(b.period) || a.zone.localeCompare(b.zone));

  const kpiHistoryOutput = {
    generated_at:  new Date().toISOString(),
    latest_period: latestPeriod,
    filters: { periodtype: 'MTH', attribute: 'AC', module: 'BOPSLINE', locationtype: 'LINE', keg_excluded: true, zones: MAIN_ZONES },
    periods: last12,
    months,
  };

  console.log(`\n[History] month×zone rows : ${months.length}`);
  const histZones = [...new Set(months.map(m => m.zone).filter(z => z !== 'Global'))].sort();
  console.log(`[History] Zones           : ${histZones.join(', ')}`);

  // 4. ── Write output files ──────────────────────────────────────────────────
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const wfPath   = path.join(OUT_DIR, 'waterfall.json');
  const histPath = path.join(OUT_DIR, 'kpi-history.json');

  fs.writeFileSync(wfPath,   JSON.stringify(waterfallOutput,  null, 2), 'utf-8');
  fs.writeFileSync(histPath, JSON.stringify(kpiHistoryOutput, null, 2), 'utf-8');

  console.log(`\n✓ ${wfPath}`);
  console.log(`✓ ${histPath}`);
  console.log('\n[Done] Packaging KPI data ready. Reload the dashboard.\n');
}

main().catch(err => {
  console.error('\n[FATAL]', err.message || err);
  console.error(err.stack);
  process.exit(1);
});
