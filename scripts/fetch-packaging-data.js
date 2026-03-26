#!/usr/bin/env node
/**
 * fetch-packaging-data.js
 * Queries Databricks via REST API (SQL Statements API) and generates:
 *   - client/public/packaging-waterfall.json  (latest complete month, by zone)
 *   - client/public/packaging-kpi-history.json (last 12 months, by zone)
 *
 * Usage:
 *   node scripts/fetch-packaging-data.js
 *
 * Methodology: ba_packaging_methodology.md
 *   Source: brewdat_uc_supchn_prod.gld_ghq_supply_supplychainkpi.gb_supplychainkpi_consolidated
 *   Filters: periodtype='MTH', attribute='AC', module='BOPSLINE', locationtype='LINE'
 *   Keg exclusion: LOWER(location) NOT LIKE '%keg%'
 *
 * KPI codes:
 *   TT=GE-R0060  NST=PG-R5796  ST=PG-R0080  LT=PG-R0070
 *   LET=PG-R0090 EPT=PG-R0060  OST=PG-K4039 Volume=PG-R0010
 *   OSE=PG-K4038(fallback)  GLY=PG-K0812  OAE=PG-K0880
 *   OEE=PG-K0912  LEF=PG-K1312
 *
 * Canonical formulas (NEVER simple average — aggregate components first):
 *   OSE = ΣEPT / ΣOST     GLY = ΣEPT / ΣST
 *   OAE = ΣEPT / ΣTT      OEE = ΣEPT / ΣLT      LEF = ΣEPT / ΣLET
 */



import https from 'https';
import fs from 'fs';
import path from 'path';

// ── Config ────────────────────────────────────────────────────────────────────
const DATABRICKS_HOST  = process.env.DATABRICKS_HOST  || 'adb-1833638405334946.6.azuredatabricks.net';
const DATABRICKS_TOKEN = process.env.DATABRICKS_TOKEN || 'dapi468bc693e389c0ee8e52d93094cfb3a3-2';
const WAREHOUSE_ID     = process.env.WAREHOUSE_ID     || 'e577c38274ac7a1b';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const TABLE   = 'brewdat_uc_supchn_prod.gld_ghq_supply_supplychainkpi.gb_supplychainkpi_consolidated';
const OUT_DIR = path.join(__dirname, '..', 'client', 'public');

// ── KPI code registry ─────────────────────────────────────────────────────────
const ALL_CODES = [
  'GE-R0060', // TT  — Total Time
  'PG-R5796', // NST — Total Net Scheduled Time
  'PG-R0080', // ST  — Scheduled Time
  'PG-R0070', // LT  — Loading Time
  'PG-R0090', // LET — Loading Effective Time
  'PG-R0060', // EPT — Effective Production Time
  'PG-K4039', // OST — Overall Supply Time
  'PG-R0010', // Volume (Net Repacked, hl)
  'PG-K4038', // OSE fallback (Anaplan pre-calculated)
  'PG-K0812', // GLY fallback
  'PG-K0880', // OAE fallback
  'PG-K0912', // OEE fallback
  'PG-K1312', // LEF fallback
];
const UNIQUE_CODES = [...new Set(ALL_CODES)];

// ── HTTP helper ───────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpsPost(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: DATABRICKS_HOST,
      path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DATABRICKS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { reject(new Error(`JSON parse error (${res.statusCode}): ${data.slice(0, 300)}`)); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function httpsGet(urlPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: DATABRICKS_HOST,
      path: urlPath,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${DATABRICKS_TOKEN}` },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { reject(new Error(`JSON parse error (${res.statusCode}): ${data.slice(0, 300)}`)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ── Databricks SQL Statements API ─────────────────────────────────────────────
async function runQuery(sql, label = 'query') {
  const t0 = Date.now();
  console.log(`\n[DB] Submitting ${label}...`);

  const submitRes = await httpsPost('/api/2.0/sql/statements', {
    statement: sql,
    warehouse_id: WAREHOUSE_ID,
    wait_timeout: '50s',
    on_wait_timeout: 'CONTINUE',
    format: 'JSON_ARRAY',
    disposition: 'INLINE',
  });

  if (submitRes.status !== 200) {
    throw new Error(`[DB] Submit failed (${submitRes.status}): ${JSON.stringify(submitRes.body)}`);
  }

  let result = submitRes.body;
  const stmtId = result.statement_id;

  // Poll while PENDING / RUNNING
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

  if (result.status?.state !== 'SUCCEEDED') {
    throw new Error(`[DB] ${label} failed: ${JSON.stringify(result.status?.error ?? result.status)}`);
  }

  const rawRows  = result.result?.data_array ?? [];
  const cols     = result.manifest?.schema?.columns?.map(c => c.name) ?? [];
  const elapsed  = Date.now() - t0;

  console.log(`[DB] ✓ ${label}: ${rawRows.length} rows in ${elapsed}ms (${polls} polls)`);

  return rawRows.map(row => {
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

// ── Period utilities ──────────────────────────────────────────────────────────
async function detectLatestPeriod() {
  const rows = await runQuery(
    `SELECT MAX(period) AS latest_period FROM ${TABLE}
     WHERE periodtype='MTH' AND attribute='AC' AND module='BOPSLINE' AND locationtype='LINE'`,
    'latest-period'
  );
  const p = rows[0]?.latest_period;
  if (!p) throw new Error('[Period] Could not detect latest period from table');
  return p;
}

function getLast12Months(latestPeriod) {
  const [y, m] = latestPeriod.split('-').map(Number);
  const months = [];
  for (let i = 11; i >= 0; i--) {
    let mo = m - i, yr = y;
    while (mo <= 0) { mo += 12; yr--; }
    months.push(`${yr}-${String(mo).padStart(2, '0')}`);
  }
  return months;
}

// ── SQL builders ──────────────────────────────────────────────────────────────
const CODES_SQL = UNIQUE_CODES.map(c => `'${c}'`).join(',');
const BASE_FILTER = `periodtype='MTH' AND attribute='AC' AND module='BOPSLINE' AND locationtype='LINE'
      AND LOWER(location) NOT LIKE '%keg%' AND LOWER(location) NOT LIKE '%kegging%'`;

function waterfallSQL(period) {
  return `
    SELECT period, zone, kpi_code, SUM(value) AS total_value
    FROM ${TABLE}
    WHERE ${BASE_FILTER}
      AND period   = '${period}'
      AND kpi_code IN (${CODES_SQL})
    GROUP BY period, zone, kpi_code
    ORDER BY zone, kpi_code
  `;
}

function historySQL(from, to) {
  return `
    SELECT period, zone, kpi_code, SUM(value) AS total_value
    FROM ${TABLE}
    WHERE ${BASE_FILTER}
      AND period   BETWEEN '${from}' AND '${to}'
      AND kpi_code IN (${CODES_SQL})
    GROUP BY period, zone, kpi_code
    ORDER BY period, zone, kpi_code
  `;
}

// ── Metrics computation ───────────────────────────────────────────────────────
function computeMetrics(kpiMap) {
  const v  = code => parseFloat(kpiMap[code] ?? 0) || 0;
  const TT  = v('GE-R0060');
  const NST = v('PG-R5796');
  const ST  = v('PG-R0080');
  const LT  = v('PG-R0070');
  const LET = v('PG-R0090');
  const EPT = v('PG-R0060');
  const OST = v('PG-K4039');
  const vol = v('PG-R0010');

  // Waterfall-derived losses
  const DPA = Math.max(0, ST  - LT);
  const EC  = Math.max(0, LT  - LET);
  const IC  = Math.max(0, LET - EPT);

  // Canonical KPIs — aggregate components, then divide (NEVER simple average)
  const pct = (num, den) => (den > 0 ? parseFloat(((num / den) * 100).toFixed(2)) : null);

  return {
    TT:  Math.round(TT),
    NST: Math.round(NST),
    ST:  Math.round(ST),
    DPA: Math.round(DPA),
    LT:  Math.round(LT),
    EC:  Math.round(EC),
    LET: Math.round(LET),
    IC:  Math.round(IC),
    EPT: Math.round(EPT),
    OST: Math.round(OST),
    volume_hl: Math.round(vol),
    OSE: pct(EPT, OST),   // ΣEPT / ΣOST
    GLY: pct(EPT, ST),    // ΣEPT / ΣST
    OAE: pct(EPT, TT),    // ΣEPT / ΣTT
    OEE: pct(EPT, LT),    // ΣEPT / ΣLT
    LEF: pct(EPT, LET),   // ΣEPT / ΣLET
  };
}

// ── Row pivoting ──────────────────────────────────────────────────────────────
function pivotByZone(rows) {
  const map = {};
  for (const row of rows) {
    const z    = row.zone;
    const code = row.kpi_code;
    const val  = parseFloat(row.total_value) || 0;
    if (!map[z]) map[z] = {};
    map[z][code] = (map[z][code] || 0) + val;
  }
  return map;
}

function buildGlobal(byZone) {
  const g = {};
  for (const kpis of Object.values(byZone)) {
    for (const [code, val] of Object.entries(kpis)) {
      g[code] = (g[code] || 0) + val;
    }
  }
  return g;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('='.repeat(62));
  console.log(' AB InBev — Packaging Data Fetcher');
  console.log(' Table: gb_supplychainkpi_consolidated');
  console.log('='.repeat(62));

  // 1. Detect latest period
  const latestPeriod = await detectLatestPeriod();
  const last12       = getLast12Months(latestPeriod);
  console.log(`\n[Config] Latest period : ${latestPeriod}`);
  console.log(`[Config] History range : ${last12[0]} → ${last12[last12.length - 1]}`);
  console.log(`[Config] Filters       : periodtype=MTH attribute=AC module=BOPSLINE locationtype=LINE keg_excluded=true`);

  // 2. Waterfall (latest period)
  const wfRows  = await runQuery(waterfallSQL(latestPeriod), `waterfall-${latestPeriod}`);
  const wfByZone = pivotByZone(wfRows);
  const zones    = Object.keys(wfByZone).sort();

  const waterfallOutput = {
    period:       latestPeriod,
    generated_at: new Date().toISOString(),
    filters:      { periodtype: 'MTH', attribute: 'AC', module: 'BOPSLINE', locationtype: 'LINE', keg_excluded: true },
    zones:        ['Global', ...zones],
    data: {
      Global: computeMetrics(buildGlobal(wfByZone)),
      ...Object.fromEntries(zones.map(z => [z, computeMetrics(wfByZone[z])])),
    },
  };

  console.log(`\n[Waterfall] Zones found : ${zones.join(', ')}`);
  const g = waterfallOutput.data.Global;
  console.log(`[Waterfall] Global summary:`);
  console.log(`  TT=${g.TT?.toLocaleString()}h  ST=${g.ST?.toLocaleString()}h  EPT=${g.EPT?.toLocaleString()}h`);
  console.log(`  OSE=${g.OSE}%  GLY=${g.GLY}%  OAE=${g.OAE}%  Volume=${g.volume_hl?.toLocaleString()}hl`);

  // 3. KPI History (12 months)
  const histRows      = await runQuery(historySQL(last12[0], last12[last12.length - 1]), 'kpi-history-12m');
  const histByZonePeriod = {};

  for (const row of histRows) {
    const key = `${row.period}|${row.zone}`;
    if (!histByZonePeriod[key]) histByZonePeriod[key] = { period: row.period, zone: row.zone, kpis: {} };
    const k = histByZonePeriod[key].kpis;
    k[row.kpi_code] = (k[row.kpi_code] || 0) + (parseFloat(row.total_value) || 0);
  }

  // Build Global per period
  const globalPerPeriod = {};
  for (const entry of Object.values(histByZonePeriod)) {
    const p = entry.period;
    if (!globalPerPeriod[p]) globalPerPeriod[p] = {};
    for (const [code, val] of Object.entries(entry.kpis)) {
      globalPerPeriod[p][code] = (globalPerPeriod[p][code] || 0) + val;
    }
  }

  const months = [];

  for (const entry of Object.values(histByZonePeriod)) {
    months.push({ period: entry.period, zone: entry.zone, ...computeMetrics(entry.kpis) });
  }
  for (const [period, kpis] of Object.entries(globalPerPeriod)) {
    months.push({ period, zone: 'Global', ...computeMetrics(kpis) });
  }

  months.sort((a, b) => a.period.localeCompare(b.period) || a.zone.localeCompare(b.zone));

  const kpiHistoryOutput = {
    generated_at:  new Date().toISOString(),
    latest_period: latestPeriod,
    filters:       { periodtype: 'MTH', attribute: 'AC', module: 'BOPSLINE', locationtype: 'LINE', keg_excluded: true },
    periods:       last12,
    months,
  };

  console.log(`\n[History] Total month×zone rows : ${months.length}`);

  // 4. Write JSON files
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const wfPath   = path.join(OUT_DIR, 'packaging-waterfall.json');
  const histPath = path.join(OUT_DIR, 'packaging-kpi-history.json');

  fs.writeFileSync(wfPath,   JSON.stringify(waterfallOutput,  null, 2), 'utf-8');
  fs.writeFileSync(histPath, JSON.stringify(kpiHistoryOutput, null, 2), 'utf-8');

  console.log(`\n✓ ${wfPath}`);
  console.log(`✓ ${histPath}`);
  console.log('\n[Done] Packaging data ready. Reload the dashboard.\n');
}

main().catch(err => {
  console.error('\n[FATAL]', err.message || err);
  console.error(err.stack);
  process.exit(1);
});
