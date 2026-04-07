// data_import.ts — Browser-side Coverage.xlsx import pipeline
// Replicates the Python pipeline (extract_site_products.py + recalculate_csv_data.py)
// in TypeScript, using CAPABILITY_DETAIL and PRODUCT_TO_CAP_KEYS already in the bundle.

import { CAPABILITY_DETAIL, PRODUCT_TO_CAP_KEYS } from './capability_detail';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DataQualityIssueType =
  | 'unknown_product'
  | 'name_normalized'
  | 'force_added'
  | 'excluded_domain'
  | 'site_not_in_maturity'
  | 'cross_domain';

export interface DataQualityIssue {
  type: DataQualityIssueType;
  site?: string;
  domain?: string;
  product?: string;
  normalizedTo?: string;
  message: string;
}

export interface DomainFracs {
  L1: number; L2: number; L3: number; L4: number;
}

export interface DomainEntry {
  products: string[];
  type: 'G' | 'L';
  dominant: string;
  score: number | null;
  globalFracs: DomainFracs | null;
  legacyFracs: DomainFracs | null;
  scoreGlobal: number;
  scoreLegacy: number;
}

export type ImportedSPM = Record<string, Record<string, DomainEntry>>;

export interface ImportedSiteRow {
  zone: string;
  site: string;
  country: string;
  volume: number;
  BP: number; DA: number; UT: number; MT: number; MG: number;
  MDM: number; PP: number; QL: number; SF: number;
  score: number;
}

export interface ImportStats {
  totalSites: number;
  fromMaturity: number;
  computed: number;
  l0: number;
  unknownProducts: number;
  crossDomainAdded: number;
  forceAdded: number;
}

export interface ImportedData {
  siteProductMap: ImportedSPM;
  sites: ImportedSiteRow[];
  issues: DataQualityIssue[];
  importedAt: Date;
  fileName: string;
  stats: ImportStats;
}

// ---------------------------------------------------------------------------
// Business rules (mirrors Python patches — single source of truth in JS)
// ---------------------------------------------------------------------------

const DOMAIN_MAP: Record<string, string> = {
  'Brewing Performance':   'BP',
  'Data Acquisiton':       'DA',  // typo in sheet — keep
  'Data Acquisition':      'DA',
  'Maintenance':           'MT',
  'Management':            'MG',
  'MasterData Management': 'MDM',
  'MasterData management': 'MDM',
  'Packaging Performance': 'PP',
  'Quality':               'QL',
  'Safety':                'SF',
  'Utilities':             'UT',
};

const IGNORED_DOMAINS = new Set(['Other', 'Production', 'E2', 'Cyber OT']);

// Product name normalization: wrong/variant names in Coverage sheet → canonical display name
const PRODUCT_DISPLAY_NORMALIZE: Record<string, string> = {
  'APAC - LMS':   'APAC Line View',
  'APAC LMS':     'APAC Line View',
  'Line View':    'APAC Line View',
};

// Zones where SAP PM is automatically added as legacy MT product
const SAP_PM_FORCED_ZONES = new Set(['AFR', 'APAC', 'SAZ', 'NAZ', 'MAZ']);

// Domains excluded from site score calculation (min of actives)
export const SCORE_EXCLUDED = new Set(['UT', 'SF']);

// All domain codes for cross-domain pool expansion
const ALL_DOMAIN_CODES = ['BP', 'DA', 'UT', 'MT', 'MG', 'MDM', 'PP', 'QL', 'SF'];

// Level gates (fraction threshold to pass)
const LEVEL_THRESHOLD = 0.70;

// SAP PM zone-specific cap key override (instead of using all zone keys)
const SAP_PM_ZONE_CAP_KEY: Record<string, string> = {
  APAC: 'apac - sap pm',
  SAZ:  'saz - sap pm',
  NAZ:  'naz - sap pm',
  MAZ:  'maz - sap pm',
  EUR:  'eur - sap pm',
  // AFR: no dedicated SAP PM column in Capabilities Readiness
};

// Zones where force-added APAC Line View is applied (APAC China sites)
function shouldForceAPACLineView(zone: string, country: string): boolean {
  return zone === 'APAC' && country.toLowerCase().includes('china');
}

// ---------------------------------------------------------------------------
// Capability scoring helpers
// ---------------------------------------------------------------------------

// Resolve product display name → cap key(s), with zone-aware SAP PM handling
function resolveCapKeys(productName: string, zone: string): string[] {
  const pLower = productName.toLowerCase();

  // SAP PM: use zone-specific key only (not all zone variants)
  if (pLower === 'sap pm') {
    const zoneKey = SAP_PM_ZONE_CAP_KEY[zone];
    return zoneKey ? [zoneKey] : [];
  }

  return PRODUCT_TO_CAP_KEYS[pLower] ?? [];
}

// Compute domain score for a set of products using CAPABILITY_DETAIL
function computeDomainScore(
  products: string[],
  productTypes: Record<string, 'G' | 'L'>,
  domainCode: string,
  zone: string,
): {
  score: number | null;
  globalFracs: DomainFracs | null;
  legacyFracs: DomainFracs | null;
  scoreGlobal: number;
  scoreLegacy: number;
  unknownProducts: string[];
} {
  const capDomain = CAPABILITY_DETAIL[domainCode];
  if (!capDomain) {
    return { score: null, globalFracs: null, legacyFracs: null, scoreGlobal: 0, scoreLegacy: 0, unknownProducts: [] };
  }

  const unknownProducts: string[] = [];

  // Split products into global and legacy pools
  const globalKeys: string[] = [];
  const legacyKeys: string[] = [];

  for (const prod of products) {
    const keys = resolveCapKeys(prod, zone);
    if (keys.length === 0 && prod !== 'SAP PM') {
      unknownProducts.push(prod);
    }
    const isLegacy = productTypes[prod] === 'L';
    if (isLegacy) {
      for (const k of keys) if (!legacyKeys.includes(k)) legacyKeys.push(k);
    } else {
      for (const k of keys) if (!globalKeys.includes(k)) globalKeys.push(k);
    }
  }

  function scorePool(capKeys: string[]): { score: number; fracs: DomainFracs } | null {
    if (capKeys.length === 0) return null;
    const fracs: DomainFracs = { L1: 0, L2: 0, L3: 0, L4: 0 };
    let score = 0;
    for (const level of ['L1', 'L2', 'L3', 'L4'] as const) {
      const n4s = capDomain[level];
      if (!n4s) continue;
      const total = Object.keys(n4s).length;
      if (total === 0) { fracs[level] = 1; score = parseInt(level[1]); continue; }
      const covered = Object.values(n4s).filter(n4 =>
        n4.coveredBy.some(ck => capKeys.includes(ck))
      ).length;
      const frac = covered / total;
      fracs[level] = Math.round(frac * 10000) / 10000;
      if (frac >= LEVEL_THRESHOLD) {
        score = parseInt(level[1]);
      } else {
        break; // cumulative — must pass L1 before L2
      }
    }
    return { score, fracs };
  }

  const gResult = scorePool(globalKeys);
  const lResult = scorePool(legacyKeys);

  const scoreGlobal = gResult?.score ?? 0;
  const scoreLegacy = lResult?.score ?? 0;
  const bestScore = Math.max(scoreGlobal, scoreLegacy);

  return {
    score: bestScore > 0 ? bestScore : null,
    globalFracs: gResult?.fracs ?? null,
    legacyFracs: lResult?.fracs ?? null,
    scoreGlobal,
    scoreLegacy,
    unknownProducts,
  };
}

// ---------------------------------------------------------------------------
// Parse Coverage sheet from SheetJS workbook
// ---------------------------------------------------------------------------

interface RawCoverageRow {
  site: string;
  zone: string;
  country: string;
  domain: string;       // short code
  product: string;      // normalized display name
  type: 'G' | 'L';
}

function parseCoverageSheet(workbook: any): { rows: RawCoverageRow[]; issues: DataQualityIssue[] } {
  const issues: DataQualityIssue[] = [];
  const XLSX = (window as any).XLSX;

  const sheetName = 'Coverage global and legacy';
  const ws = workbook.Sheets[sheetName];
  if (!ws) {
    issues.push({ type: 'unknown_product', message: `Aba "${sheetName}" não encontrada no arquivo.` });
    return { rows: [], issues };
  }

  const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (raw.length < 2) return { rows: [], issues };

  // Column indices (0-based) per extract_site_products.py
  const COL_DOMAIN  = 2;
  const COL_PRODUCT = 3;
  const COL_GL      = 4;
  const COL_ZONE    = 6;
  const COL_COUNTRY = 7;
  const COL_PLANT   = 9;
  const COL_LIVE    = 10;

  const rows: RawCoverageRow[] = [];

  for (let i = 1; i < raw.length; i++) {
    const r = raw[i];
    const liveVal = String(r[COL_LIVE] ?? '').trim().toLowerCase();
    if (liveVal !== 'yes') continue;

    const domainRaw = String(r[COL_DOMAIN] ?? '').trim();
    const domCode = DOMAIN_MAP[domainRaw];
    if (!domCode) {
      if (domainRaw && !IGNORED_DOMAINS.has(domainRaw)) {
        // silently skip unknown but non-ignored domains
      }
      continue;
    }

    const site    = String(r[COL_PLANT]   ?? '').trim();
    const glRaw   = String(r[COL_GL]      ?? '').trim();
    const zone    = String(r[COL_ZONE]    ?? '').trim();
    const country = String(r[COL_COUNTRY] ?? '').trim();
    let   product = String(r[COL_PRODUCT] ?? '').trim();

    if (!site || !product || product === 'nan') continue;

    // Normalize product display name
    const normalized = PRODUCT_DISPLAY_NORMALIZE[product];
    if (normalized && normalized !== product) {
      issues.push({
        type: 'name_normalized',
        site,
        domain: domCode,
        product,
        normalizedTo: normalized,
        message: `"${product}" → "${normalized}" em ${site} (${domCode})`,
      });
      product = normalized;
    }

    const isLegacy = glRaw.toLowerCase().includes('legacy');

    rows.push({ site, zone, country, domain: domCode, product, type: isLegacy ? 'L' : 'G' });
  }

  return { rows, issues };
}

// ---------------------------------------------------------------------------
// Main import pipeline
// ---------------------------------------------------------------------------

export function computeImportedData(
  workbook: any,
  fileName: string,
  maturityDetail: Record<string, { zone: string; score: number; domains: Record<string, { score: number; type: string } | null> }>,
  existingVolumes: Record<string, number>, // site name → volume from static data
): ImportedData {
  const allIssues: DataQualityIssue[] = [];

  // 1. Parse Coverage sheet
  const { rows, issues: parseIssues } = parseCoverageSheet(workbook);
  allIssues.push(...parseIssues);

  // 2. Group by site → domain → { products, productTypes, zone, country }
  type SiteDomInfo = {
    products: Map<string, 'G' | 'L'>;
    hasLegacy: boolean;
    zone: string;
    country: string;
  };
  const grouped = new Map<string, { meta: { zone: string; country: string }; domains: Map<string, SiteDomInfo> }>();

  for (const row of rows) {
    if (!grouped.has(row.site)) {
      grouped.set(row.site, { meta: { zone: row.zone, country: row.country }, domains: new Map() });
    }
    const siteEntry = grouped.get(row.site)!;

    if (!siteEntry.domains.has(row.domain)) {
      siteEntry.domains.set(row.domain, {
        products: new Map(),
        hasLegacy: false,
        zone: row.zone,
        country: row.country,
      });
    }
    const domEntry = siteEntry.domains.get(row.domain)!;
    domEntry.products.set(row.product, row.type);
    if (row.type === 'L') domEntry.hasLegacy = true;
  }

  // 3. Apply force-adds
  let forceAddedCount = 0;
  for (const [site, siteEntry] of grouped) {
    const { zone, country } = siteEntry.meta;

    // SAP PM → MT for non-EUR zones
    if (SAP_PM_FORCED_ZONES.has(zone)) {
      const mtEntry = siteEntry.domains.get('MT');
      if (!mtEntry) {
        siteEntry.domains.set('MT', {
          products: new Map([['SAP PM', 'L']]),
          hasLegacy: true,
          zone,
          country,
        });
        forceAddedCount++;
        allIssues.push({ type: 'force_added', site, domain: 'MT', product: 'SAP PM', message: `SAP PM adicionado automaticamente em ${site} (${zone}) MT` });
      } else if (!mtEntry.products.has('SAP PM')) {
        mtEntry.products.set('SAP PM', 'L');
        mtEntry.hasLegacy = true;
        forceAddedCount++;
      }
    }

    // APAC Line View → PP for APAC China sites
    if (shouldForceAPACLineView(zone, country)) {
      const ppEntry = siteEntry.domains.get('PP');
      if (!ppEntry) {
        siteEntry.domains.set('PP', {
          products: new Map([['APAC Line View', 'L']]),
          hasLegacy: true,
          zone,
          country,
        });
        forceAddedCount++;
        allIssues.push({ type: 'force_added', site, domain: 'PP', product: 'APAC Line View', message: `APAC Line View adicionado automaticamente em ${site} (China) PP` });
      } else if (!ppEntry.products.has('APAC Line View')) {
        ppEntry.products.set('APAC Line View', 'L');
        ppEntry.hasLegacy = true;
        forceAddedCount++;
      }
    }
  }

  // 4. Build all-site product pool (cross-domain) and compute domain scores
  const siteProductMap: ImportedSPM = {};
  let totalUnknown = 0;
  let crossDomainAdded = 0;

  for (const [site, siteEntry] of grouped) {
    const { zone, country } = siteEntry.meta;
    siteProductMap[site] = {};

    // Collect ALL products from ALL domains for cross-domain pool
    const allGlobalKeys: string[] = [];
    const allLegacyKeys: string[] = [];
    const allProductTypes = new Map<string, 'G' | 'L'>();

    for (const domInfo of siteEntry.domains.values()) {
      for (const [prod, type] of domInfo.products) {
        allProductTypes.set(prod, type);
        const keys = resolveCapKeys(prod, zone);
        if (type === 'L') {
          for (const k of keys) if (!allLegacyKeys.includes(k)) allLegacyKeys.push(k);
        } else {
          for (const k of keys) if (!allGlobalKeys.includes(k)) allGlobalKeys.push(k);
        }
      }
    }

    const allProductTypesObj = Object.fromEntries(allProductTypes);
    const allProductsList = [...allProductTypes.keys()];

    // Score existing domains using cross-domain product pool
    for (const [domCode, domInfo] of siteEntry.domains) {
      const result = computeDomainScore(allProductsList, allProductTypesObj, domCode, zone);

      for (const up of result.unknownProducts) {
        allIssues.push({ type: 'unknown_product', site, domain: domCode, product: up, message: `Produto desconhecido: "${up}" em ${site} (${domCode})` });
        totalUnknown++;
      }

      const hasLegacy = domInfo.hasLegacy;
      const products = [...domInfo.products.keys()];
      const dominant = products[0] ?? '';

      siteProductMap[site][domCode] = {
        products,
        type: hasLegacy ? 'L' : 'G',
        dominant,
        score: result.score,
        globalFracs: result.globalFracs,
        legacyFracs: result.legacyFracs,
        scoreGlobal: result.scoreGlobal,
        scoreLegacy: result.scoreLegacy,
      };
    }

    // Cross-domain: score domains NOT in Coverage using full site product pool
    for (const domCode of ALL_DOMAIN_CODES) {
      if (siteProductMap[site][domCode]) continue;

      const result = computeDomainScore(allProductsList, allProductTypesObj, domCode, zone);
      if (result.score && result.score > 0) {
        const coveredProducts = allProductsList.filter(p => {
          const keys = resolveCapKeys(p, zone);
          if (keys.length === 0) return false;
          const capDomain = CAPABILITY_DETAIL[domCode];
          if (!capDomain?.L1) return false;
          return Object.values(capDomain.L1).some(n4 => n4.coveredBy.some(ck => keys.includes(ck)));
        });

        const hasLegacy = coveredProducts.some(p => allProductTypesObj[p] === 'L');
        siteProductMap[site][domCode] = {
          products: coveredProducts,
          type: hasLegacy ? 'L' : 'G',
          dominant: coveredProducts[0] ?? '',
          score: result.score,
          globalFracs: result.globalFracs,
          legacyFracs: result.legacyFracs,
          scoreGlobal: result.scoreGlobal,
          scoreLegacy: result.scoreLegacy,
        };
        crossDomainAdded++;
        allIssues.push({ type: 'cross_domain', site, domain: domCode, message: `${domCode} inferido de produtos de outros domínios em ${site}` });
      }
    }
  }

  // 5. Compute site scores (merge with MATURITY_DETAIL)
  const domainCodes = ['BP', 'DA', 'UT', 'MT', 'MG', 'MDM', 'PP', 'QL', 'SF'] as const;
  const sites: ImportedSiteRow[] = [];
  let fromMaturity = 0, computed = 0, l0count = 0;

  for (const [site, domMap] of Object.entries(siteProductMap)) {
    const meta = grouped.get(site)!.meta;
    const md = maturityDetail[site];

    const domScores: Record<string, number> = {};

    for (const dom of domainCodes) {
      const mdDom = md?.domains?.[dom];
      const spmDom = domMap[dom];

      if (mdDom && mdDom.score > 0) {
        // Maturity detail takes priority
        domScores[dom] = mdDom.score;
        fromMaturity++;
      } else if (spmDom?.score != null && spmDom.score > 0) {
        // Computed via capabilities
        domScores[dom] = spmDom.score;
        computed++;
      } else {
        domScores[dom] = 0;
      }
    }

    // Site score = min of non-excluded domains
    const activeDomScores = domainCodes
      .filter(d => !SCORE_EXCLUDED.has(d))
      .map(d => domScores[d]);
    const siteScore = activeDomScores.length > 0 ? Math.min(...activeDomScores) : 0;
    if (siteScore === 0) l0count++;

    if (!md) {
      allIssues.push({ type: 'site_not_in_maturity', site, message: `${site} não está na base de avaliação N3/N4 (maturity_detail)` });
    }

    sites.push({
      zone: meta.zone,
      site,
      country: meta.country,
      volume: existingVolumes[site] ?? 0,
      BP: domScores.BP,  DA: domScores.DA,  UT: domScores.UT,
      MT: domScores.MT,  MG: domScores.MG,  MDM: domScores.MDM,
      PP: domScores.PP,  QL: domScores.QL,  SF: domScores.SF,
      score: siteScore,
    });
  }

  // Sort by volume descending (matches current CSV_DATA ordering)
  sites.sort((a, b) => b.volume - a.volume);

  // Deduplicate issues for unknown products (one entry per unique site+domain+product)
  const seenIssues = new Set<string>();
  const dedupedIssues = allIssues.filter(issue => {
    if (issue.type !== 'unknown_product') return true;
    const key = `${issue.site}|${issue.domain}|${issue.product}`;
    if (seenIssues.has(key)) return false;
    seenIssues.add(key);
    return true;
  });

  const uniqueUnknownProducts = new Set(
    dedupedIssues.filter(i => i.type === 'unknown_product').map(i => i.product)
  ).size;

  return {
    siteProductMap,
    sites,
    issues: dedupedIssues,
    importedAt: new Date(),
    fileName,
    stats: {
      totalSites: sites.length,
      fromMaturity,
      computed,
      l0: l0count,
      unknownProducts: uniqueUnknownProducts,
      crossDomainAdded,
      forceAdded: forceAddedCount,
    },
  };
}

// ---------------------------------------------------------------------------
// Export to Excel (multi-sheet)
// ---------------------------------------------------------------------------

export async function exportImportedDataToExcel(data: ImportedData): Promise<void> {
  const XLSX = (window as any).XLSX;

  const wb = XLSX.utils.book_new();

  // Sheet 1: Scores
  const scoreRows = [
    ['Zone', 'Site', 'Country', 'Volume', 'BP', 'DA', 'UT', 'MT', 'MG', 'MDM', 'PP', 'QL', 'SF', 'Score'],
    ...data.sites.map(s => [
      s.zone, s.site, s.country, s.volume,
      s.BP, s.DA, s.UT, s.MT, s.MG, s.MDM, s.PP, s.QL, s.SF,
      s.score,
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(scoreRows), 'Scores');

  // Sheet 2: Products
  const prodRows = [
    ['Site', 'Zone', 'Domain', 'Products', 'Type', 'Dominant', 'Score', 'L1%', 'L2%', 'L3%', 'L4%'],
  ];
  for (const [site, domMap] of Object.entries(data.siteProductMap)) {
    for (const [dom, entry] of Object.entries(domMap)) {
      const fracs = entry.legacyFracs ?? entry.globalFracs;
      prodRows.push([
        site, data.sites.find(s => s.site === site)?.zone ?? '', dom,
        entry.products.join(', '), entry.type, entry.dominant,
        entry.score ?? 0,
        fracs ? Math.round(fracs.L1 * 100) : 0,
        fracs ? Math.round(fracs.L2 * 100) : 0,
        fracs ? Math.round(fracs.L3 * 100) : 0,
        fracs ? Math.round(fracs.L4 * 100) : 0,
      ]);
    }
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodRows), 'Produtos');

  // Sheet 3: Issues
  const issueRows = [
    ['Tipo', 'Site', 'Domínio', 'Produto', 'Normalizado para', 'Mensagem'],
    ...data.issues.map(i => [i.type, i.site ?? '', i.domain ?? '', i.product ?? '', i.normalizedTo ?? '', i.message]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(issueRows), 'Problemas');

  XLSX.writeFile(wb, `coverage_data_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const DOM_CODES = ['BP','DA','UT','MT','MG','MDM','PP','QL','SF'] as const;
type DomCode = typeof DOM_CODES[number];

const DOM_FULL: Record<DomCode, string> = {
  BP: 'Brewing Performance', DA: 'Data Acquisition', UT: 'Utilities',
  MT: 'Maintenance', MG: 'Management', MDM: 'MasterData Management',
  PP: 'Packaging Performance', QL: 'Quality', SF: 'Safety',
};

// Sentinel string embedded in the exported file so we can detect it on re-import.
const ROLLOUT_SENTINEL = 'COVERAGE_ROLLOUT_V2';

// ---------------------------------------------------------------------------
// Cell-style helpers (xlsx-js-style API)
// ---------------------------------------------------------------------------

const LEVEL_STYLE: Record<number, { bg: string; fg: string }> = {
  0: { bg: 'FEE2E2', fg: '991B1B' },
  1: { bg: 'FEF3C7', fg: '92400E' },
  2: { bg: 'FDE68A', fg: '78350F' },
  3: { bg: 'D1FAE5', fg: '065F46' },
  4: { bg: 'A7F3D0', fg: '047857' },
};

function cs(opts: {
  bg?: string; fg?: string; bold?: boolean; italic?: boolean;
  border?: boolean; wrapText?: boolean; halign?: string; sz?: number;
}): any {
  const s: any = {};
  if (opts.bg) s.fill = { patternType: 'solid', fgColor: { rgb: opts.bg } };
  if (opts.fg || opts.bold || opts.italic || opts.sz) {
    s.font = {};
    if (opts.fg)   s.font.color = { rgb: opts.fg };
    if (opts.bold) s.font.bold = true;
    if (opts.italic) s.font.italic = true;
    if (opts.sz)   s.font.sz = opts.sz;
  }
  if (opts.border) s.border = {
    top:    { style: 'thin', color: { rgb: 'D1D5DB' } },
    bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
    left:   { style: 'thin', color: { rgb: 'D1D5DB' } },
    right:  { style: 'thin', color: { rgb: 'D1D5DB' } },
  };
  if (opts.wrapText || opts.halign) {
    s.alignment = {};
    if (opts.wrapText) s.alignment.wrapText = true;
    if (opts.halign)   s.alignment.horizontal = opts.halign;
  }
  return s;
}

// Apply style to an existing cell (no-op if cell not found)
function styleCell(ws: any, addr: string, style: any) {
  if (ws[addr]) ws[addr].s = style;
}

// Apply style to all cells in a row (by row index 0-based → row 1-based)
function styleRow(ws: any, rowIdx: number, cols: string[], style: any) {
  for (const col of cols) styleCell(ws, `${col}${rowIdx + 1}`, style);
}

// Apply style to a single column range [startRow, endRow] inclusive (0-based)
function styleCol(ws: any, col: string, startRow: number, endRow: number, style: any) {
  for (let r = startRow; r <= endRow; r++) styleCell(ws, `${col}${r + 1}`, style);
}

// Number → column letter (0=A, 1=B, …, 25=Z, 26=AA …)
function colLetter(n: number): string {
  let s = '';
  n++;
  while (n > 0) { s = String.fromCharCode(65 + ((n - 1) % 26)) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// ---------------------------------------------------------------------------
// Export — clean editable format (3 sheets: Instruções + Rollout + Ref_Produtos)
// Replaces the old analytical 4-sheet export.
// ---------------------------------------------------------------------------

export interface CurrentSiteRow {
  zone: string; name: string; country: string; volume: number; group: string;
  scores: Record<string, number>;
}

export interface CurrentSPMEntry {
  products: string[]; type: 'G'|'L'; dominant: string;
  score: number | null;
  globalFracs: {L1:number;L2:number;L3:number;L4:number} | null;
  legacyFracs:  {L1:number;L2:number;L3:number;L4:number} | null;
  scoreGlobal: number; scoreLegacy: number;
}

export interface CurrentMDEntry {
  score: number;
  domains: Record<string, { score: number; type: string } | null>;
}

// Helper: for a product name, get cap_keys it maps to
function getCapKeysForProduct(productName: string, zone?: string): string[] {
  const lower = productName.toLowerCase();
  const direct = PRODUCT_TO_CAP_KEYS[lower] ?? [];
  if (direct.length) return direct;
  // Fuzzy: find first key that starts with or contains the product name
  for (const [k, v] of Object.entries(PRODUCT_TO_CAP_KEYS)) {
    if (k.startsWith(lower) || lower.startsWith(k)) return v;
  }
  return [];
}

// Helper: for a set of cap_keys, count covered N4s per domain per gate
type CapCoverage = Record<string, Record<string, { total: number; covered: number }>>;
function computeCapCoverage(capKeys: string[]): CapCoverage {
  const result: CapCoverage = {};
  for (const [dom, gateMap] of Object.entries(CAPABILITY_DETAIL)) {
    for (const [gate, n4Map] of Object.entries(gateMap as Record<string, Record<string, { coveredBy: string[] }>>)) {
      const n4s = Object.values(n4Map);
      const total = n4s.length;
      const covered = n4s.filter(n4 => n4.coveredBy.some(k => capKeys.includes(k))).length;
      if (total > 0) {
        if (!result[dom]) result[dom] = {};
        result[dom][gate] = { total, covered };
      }
    }
  }
  return result;
}

export async function exportCurrentDataToExcel(
  sites: CurrentSiteRow[],
  siteProductMap: Record<string, Record<string, CurrentSPMEntry>>,
  _siteDomainType: Record<string, Record<string, string>>,
  _maturityDetail: Record<string, CurrentMDEntry>,
): Promise<void> {
  const XLSX = (window as any).XLSX;
  const wb = XLSX.utils.book_new();
  const today = new Date().toISOString().slice(0, 10);

  // ── Pre-compute: sorted sites ──
  const sortedSites = [...sites].sort((a, b) =>
    a.zone.localeCompare(b.zone) || a.country.localeCompare(b.country) || a.name.localeCompare(b.name)
  );

  // ── Pre-compute: unique products with their sites/zones/domains ──
  const productMeta = new Map<string, { type: string; sites: Set<string>; zones: Set<string>; assignedDoms: Set<string> }>();
  for (const site of sites) {
    const spm = siteProductMap[site.name] ?? {};
    for (const [d, entry] of Object.entries(spm)) {
      for (const prod of (entry.products ?? [])) {
        if (!productMeta.has(prod)) productMeta.set(prod, { type: entry.type, sites: new Set(), zones: new Set(), assignedDoms: new Set() });
        const pm = productMeta.get(prod)!;
        pm.sites.add(site.name);
        pm.zones.add(site.zone);
        pm.assignedDoms.add(d);
        if (entry.type === 'L') pm.type = 'L';
      }
    }
  }

  // ── Style constants ──
  const S_HEADER_BLUE  = cs({ bg: '1B5E9E', fg: 'FFFFFF', bold: true, wrapText: true });
  const S_HEADER_GREEN = cs({ bg: '047857', fg: 'FFFFFF', bold: true });
  const S_HEADER_AMBER = cs({ bg: 'D97706', fg: 'FFFFFF', bold: true, wrapText: true });
  const S_HEADER_RO    = cs({ bg: 'E5E7EB', fg: '374151', bold: true, wrapText: true }); // read-only header
  const S_HEADER_EDIT  = cs({ bg: 'FEF3C7', fg: '78350F', bold: true, wrapText: true }); // editable header
  const S_CELL_RO      = cs({ bg: 'F9FAFB', fg: '374151' });
  const S_CELL_EDIT    = cs({ bg: 'FFFFF0', fg: '1F2937' });
  const S_TITLE        = cs({ bg: 'DBEAFE', fg: '1E3A8A', bold: true, sz: 14 });
  const S_SECTION      = cs({ fg: '1B5E9E', bold: true });
  const S_NOTE         = cs({ fg: '6B7280', italic: true });
  const S_GATE_HDR     = cs({ bg: '374151', fg: 'FFFFFF', bold: true });
  const S_READY        = cs({ bg: 'D1FAE5', fg: '065F46', bold: true });
  const S_NOT_READY    = cs({ bg: 'FEE2E2', fg: '991B1B' });
  const S_TYPE_G       = cs({ bg: 'DBEAFE', fg: '1E40AF' });
  const S_TYPE_L       = cs({ bg: 'FEE2E2', fg: '991B1B' });

  // ── Sheet 1: "Guia" ──
  const instrRows: any[][] = [
    [`COVERAGE DASHBOARD — Editable Rollout  [${ROLLOUT_SENTINEL}]`],
    [`Generated: ${today}   |   ${sites.length} sites   |   ${productMeta.size} products`],
    [''],
    ['SHEETS IN THIS WORKBOOK'],
    ['  1. Guide           → This usage guide (you are here).'],
    ['  2. Rollout         → Product list per site/domain. EDITABLE SHEET (yellow columns).'],
    ['  3. Site Coverage   → L0-L4 scores per domain for all sites. Read-only.'],
    ['  4. Products        → Each product: sites, domains covered by capability.'],
    ['  5. Capabilities    → Full N4 tree by domain and gate. Reference and analysis.'],
    ['  6. Level Req.      → Capability requirements by gate (L1/L2/L3/L4).'],
    [''],
    ['HOW TO EDIT AND RE-IMPORT (Rollout sheet)'],
    ['  Step 1: In the Rollout sheet, edit only columns with YELLOW background (G–J).'],
    ['  Step 2: Save the Excel file (.xlsx).'],
    ['  Step 3: Import back into the Coverage Dashboard. Format is detected automatically.'],
    [''],
    ['ROLLOUT SHEET OPERATIONS'],
    ['  KEY columns (do not edit): Zone | Country | Site | Code | Domain | Dom. Score'],
    ['  EDITABLE columns (yellow background):'],
    ['    G — Product      → Exact product name (see Products sheet for valid list).'],
    ['    H — Type         → G = Global (AB InBev standard)  |  L = Legacy (local product).'],
    ['    I — Active       → Yes = product active at this site  |  No = inactive / to remove.'],
    ['    J — Rollout Plan → Free text: e.g. "Q1 2026", "Pilot 2027". Does not affect scores.'],
    [''],
    ['  Add product : insert new row with key columns filled + Product + Type + Active=Yes.'],
    ['  Remove product : change Active column to "No". Row will be ignored on re-import.'],
    [''],
    ['RULES APPLIED ON RE-IMPORT'],
    ['  • Type L (Legacy) takes precedence over G (Global) for same site + domain.'],
    ['  • Scores recalculated automatically via capabilities base (Capabilities sheet).'],
    ['  • UT and SF excluded from site score (pending data — see Capabilities sheet).'],
    ['  • SAP PM added automatically as MT for zones outside EUR.'],
  ];
  const wsGuia = XLSX.utils.aoa_to_sheet(instrRows);
  wsGuia['!cols'] = [{ wch: 98 }];
  wsGuia['!tabcolor'] = { rgb: '1B5E9E' };
  // Style
  if (wsGuia['A1']) wsGuia['A1'].s = S_TITLE;
  if (wsGuia['A2']) wsGuia['A2'].s = S_NOTE;
  if (wsGuia['A4']) wsGuia['A4'].s = S_SECTION;
  if (wsGuia['A12']) wsGuia['A12'].s = S_SECTION;
  if (wsGuia['A17']) wsGuia['A17'].s = S_SECTION;
  if (wsGuia['A27']) wsGuia['A27'].s = S_SECTION;
  XLSX.utils.book_append_sheet(wb, wsGuia, 'Guide');

  // ── Sheet 2: "Rollout" — one row per (site × domain × product) ──
  // Cols: A=Zone B=Country C=Site D=Code E=Domain F=Dom. Score [read-only]
  //       G=Product H=Type I=Active J=Rollout Plan [EDITABLE]
  const rolloutHeader = [
    'Zone', 'Country', 'Site', 'Code', 'Domain', 'Dom. Score',
    'Product ← EDIT', 'Type ← EDIT', 'Active ← EDIT', 'Rollout Plan ← EDIT',
  ];
  const rolloutRows: any[][] = [rolloutHeader];
  const rolloutScores: number[] = []; // score per data row (excluding header)

  for (const site of sortedSites) {
    const spm = siteProductMap[site.name] ?? {};
    for (const d of DOM_CODES) {
      const entry = spm[d];
      const domScore = (entry?.score ?? 0);
      if (entry && entry.products.length > 0) {
        for (const prod of entry.products) {
          rolloutRows.push([site.zone, site.country, site.name, d, DOM_FULL[d], domScore, prod, entry.type, 'Yes', '']);
          rolloutScores.push(domScore);
        }
      } else {
        rolloutRows.push([site.zone, site.country, site.name, d, DOM_FULL[d], domScore, '', '', 'No', '']);
        rolloutScores.push(domScore);
      }
    }
  }

  const wsRollout = XLSX.utils.aoa_to_sheet(rolloutRows);
  wsRollout['!cols'] = [
    { wch: 6  }, // A Zona
    { wch: 14 }, // B País
    { wch: 28 }, // C Site
    { wch: 6  }, // D Código
    { wch: 24 }, // E Domínio
    { wch: 10 }, // F Score Dom.
    { wch: 28 }, // G Produto ← edit
    { wch: 6  }, // H Tipo ← edit
    { wch: 6  }, // I Ativo ← edit
    { wch: 18 }, // J Plano Rollout ← edit
  ];
  wsRollout['!rows'] = [{ hpt: 36 }]; // header row height
  wsRollout['!freeze'] = { xSplit: 0, ySplit: 1 };
  wsRollout['!tabcolor'] = { rgb: 'D97706' };

  // Header row styles
  for (const col of ['A','B','C','D','E','F']) styleCell(wsRollout, `${col}1`, S_HEADER_RO);
  for (const col of ['G','H','I','J']) styleCell(wsRollout, `${col}1`, S_HEADER_EDIT);

  // Data row styles
  const roStyle   = S_CELL_RO;
  const editStyle = S_CELL_EDIT;
  for (let i = 0; i < rolloutScores.length; i++) {
    const row = i + 2; // 1-indexed, skip header
    const levelSt = cs({ bg: LEVEL_STYLE[rolloutScores[i]]?.bg, fg: LEVEL_STYLE[rolloutScores[i]]?.fg, halign: 'center' });
    for (const col of ['A','B','C','D','E']) styleCell(wsRollout, `${col}${row}`, roStyle);
    styleCell(wsRollout, `F${row}`, levelSt);
    for (const col of ['G','H','I','J']) styleCell(wsRollout, `${col}${row}`, editStyle);
  }

  // Cell comments on editable headers
  if (!wsRollout['!comments']) wsRollout['!comments'] = [];
  wsRollout['!comments'].push(
    { ref: 'G1', comment: { author: 'Dashboard', t: 'Enter the exact product name.\nSee the "Products" sheet for the valid product list.' } },
    { ref: 'H1', comment: { author: 'Dashboard', t: 'G = Global (AB InBev standard product)\nL = Legacy (local or legacy product)' } },
    { ref: 'I1', comment: { author: 'Dashboard', t: 'Yes = product active at this site\nNo = product inactive / to remove on re-import' } },
    { ref: 'J1', comment: { author: 'Dashboard', t: 'Rollout plan — free text.\nExamples: "Q1 2026", "Pilot 2027", "2026".\nThis field does not affect score calculation.' } },
  );

  XLSX.utils.book_append_sheet(wb, wsRollout, 'Rollout');

  // ── Sheet 3: "Cobertura por Site" ── (NEW)
  // scores keys in ALL_SITES use full domain names (from DOMAIN_COLS in App.tsx)
  const COV_SCORE_KEYS: [string, string][] = [
    ['BP',  'Brewing Performance'],
    ['DA',  'Data Acquisition'],
    ['UT',  'Utilities'],
    ['MT',  'Maintenance'],
    ['MG',  'Management'],
    ['MDM', 'MasterData Management'],
    ['PP',  'Packaging Performance'],
    ['QL',  'Quality'],
    ['SF',  'Safety'],
  ];
  const COV_SITE_SCORE_KEY = 'Total Global';

  const covHeader = ['Zone', 'Country', 'Site', 'Score', ...COV_SCORE_KEYS.map(([k]) => k)];
  const covSites = [...sites].sort((a, b) =>
    a.zone.localeCompare(b.zone) || (b.scores[COV_SITE_SCORE_KEY] ?? 0) - (a.scores[COV_SITE_SCORE_KEY] ?? 0) || a.name.localeCompare(b.name)
  );
  const covRows: any[][] = [covHeader];
  for (const site of covSites) {
    covRows.push([
      site.zone, site.country, site.name,
      site.scores[COV_SITE_SCORE_KEY] ?? 0,
      ...COV_SCORE_KEYS.map(([, fullKey]) => site.scores[fullKey] ?? 0),
    ]);
  }

  const wsCov = XLSX.utils.aoa_to_sheet(covRows);
  wsCov['!cols'] = [
    { wch: 6  }, // Zona
    { wch: 14 }, // País
    { wch: 28 }, // Site
    { wch: 7  }, // Score
    { wch: 5  }, // BP
    { wch: 5  }, // DA
    { wch: 5  }, // UT
    { wch: 5  }, // MT
    { wch: 5  }, // MG
    { wch: 6  }, // MDM
    { wch: 5  }, // PP
    { wch: 5  }, // QL
    { wch: 5  }, // SF
  ];
  wsCov['!freeze'] = { xSplit: 3, ySplit: 1 };
  wsCov['!tabcolor'] = { rgb: '047857' };

  // Header row
  for (const col of ['A','B','C','D','E','F','G','H','I','J','K','L','M']) {
    styleCell(wsCov, `${col}1`, S_HEADER_GREEN);
  }
  // Data rows: color score cells by level
  const scoreCols = ['D','E','F','G','H','I','J','K','L','M'];
  for (let i = 0; i < covSites.length; i++) {
    const row = i + 2;
    styleCell(wsCov, `A${row}`, S_CELL_RO);
    styleCell(wsCov, `B${row}`, S_CELL_RO);
    styleCell(wsCov, `C${row}`, S_CELL_RO);
    const rowVals = covRows[row - 1];
    for (let ci2 = 0; ci2 < scoreCols.length; ci2++) {
      const val = Math.floor(Number(rowVals[3 + ci2]) ?? 0);
      const lv = Math.min(4, Math.max(0, val));
      styleCell(wsCov, `${scoreCols[ci2]}${row}`, cs({ bg: LEVEL_STYLE[lv].bg, fg: LEVEL_STYLE[lv].fg, halign: 'center' }));
    }
  }

  XLSX.utils.book_append_sheet(wb, wsCov, 'Site Coverage');

  // ── Sheet 4: "Produtos" ──
  const prodRows: any[][] = [
    ['Product', 'Type', 'Zone', 'Country', 'Site', 'Assigned Dom.', 'Covered Dom. (cap)', 'Capability Coverage Details'],
    ['', '(G=Global, L=Legacy)', '', '', '', '', '(via capability base)', '(gate: covered/total)'],
  ];

  const sortedProducts = [...productMeta.entries()].sort((a, b) => b[1].sites.size - a[1].sites.size);

  for (const [prod, meta] of sortedProducts) {
    prodRows.push([]);
    const capKeys = getCapKeysForProduct(prod);
    const coverage = computeCapCoverage(capKeys);
    const capDoms = Object.entries(coverage)
      .filter(([, gd]) => Object.values(gd).some(g => g.covered > 0))
      .map(([dom]) => dom).sort().join(', ');
    const detailParts: string[] = [];
    for (const [dom, gd] of Object.entries(coverage).sort()) {
      const gParts = Object.entries(gd).filter(([, g]) => g.covered > 0).sort()
        .map(([gate, g]) => `${gate}:${g.covered}/${g.total}`);
      if (gParts.length) detailParts.push(`${dom}(${gParts.join(',')})`);
    }
    prodRows.push([prod, meta.type, '', '', `${meta.sites.size} sites`, '', capDoms, detailParts.join(' · ')]);

    const sitesForProd = [...meta.sites].sort();
    for (const siteName of sitesForProd) {
      const siteObj = sites.find(s => s.name === siteName);
      const spm = siteProductMap[siteName] ?? {};
      const assignedDoms = Object.entries(spm).filter(([, e]) => e.products.includes(prod)).map(([d]) => d).sort().join(', ');
      prodRows.push(['', meta.type, siteObj?.zone ?? '', siteObj?.country ?? '', siteName, assignedDoms, '', '']);
    }
  }

  const wsProd = XLSX.utils.aoa_to_sheet(prodRows);
  wsProd['!cols'] = [
    { wch: 30 }, { wch: 6 }, { wch: 6 }, { wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 28 }, { wch: 55 },
  ];
  wsProd['!tabcolor'] = { rgb: '7C3AED' };
  for (const col of ['A','B','C','D','E','F','G','H']) styleCell(wsProd, `${col}1`, S_HEADER_BLUE);

  // Color G/L type column
  for (let i = 2; i < prodRows.length + 1; i++) {
    const typeVal = prodRows[i - 1]?.[1];
    if (typeVal === 'G') styleCell(wsProd, `B${i}`, S_TYPE_G);
    else if (typeVal === 'L') styleCell(wsProd, `B${i}`, S_TYPE_L);
  }

  XLSX.utils.book_append_sheet(wb, wsProd, 'Products');

  // ── Sheet 5: "Capabilidades" ──
  type CapEntryFull = { name: string; subarea: string; coveredBy: string[]; n1: string; n2: string; n3: string; status: string; plannedYear: string };
  const capRows: any[][] = [
    ['Domain', 'Gate', 'Subarea', 'ID (N4)', 'Functionality (N4)', 'N1 — Process', 'N2 — Events/Behavior', 'N3 — Need', 'Status', 'Planned Year', 'Covered by (cap_keys)'],
  ];

  for (const [dom, gateMap] of Object.entries(CAPABILITY_DETAIL).sort()) {
    for (const gate of ['L1', 'L2', 'L3', 'L4']) {
      const n4Map = (gateMap as any)[gate] as Record<string, CapEntryFull> | undefined;
      if (!n4Map) continue;
      for (const [id, entry] of Object.entries(n4Map).sort()) {
        capRows.push([
          dom, gate, entry.subarea, id, entry.name,
          entry.n1, entry.n2, entry.n3, entry.status, entry.plannedYear,
          entry.coveredBy.join(', '),
        ]);
      }
    }
  }

  const wsCap = XLSX.utils.aoa_to_sheet(capRows);
  wsCap['!cols'] = [
    { wch: 6 }, { wch: 5 }, { wch: 20 }, { wch: 10 }, { wch: 55 },
    { wch: 35 }, { wch: 35 }, { wch: 35 }, { wch: 11 }, { wch: 10 }, { wch: 40 },
  ];
  wsCap['!tabcolor'] = { rgb: '6B7280' };
  for (const col of ['A','B','C','D','E','F','G','H','I','J','K']) styleCell(wsCap, `${col}1`, S_HEADER_AMBER);

  // Status column (col I = index 8) — color READY/NOT READY
  for (let i = 1; i < capRows.length; i++) {
    const row = i + 1;
    const status = capRows[i][8];
    if (status === 'READY') styleCell(wsCap, `I${row}`, S_READY);
    else if (status === 'NOT READY') styleCell(wsCap, `I${row}`, S_NOT_READY);
    // Gate column color
    const gateVal = capRows[i][1];
    const gateLevel = gateVal ? parseInt(gateVal[1]) : 0;
    if (gateLevel >= 1 && gateLevel <= 4) {
      styleCell(wsCap, `B${row}`, cs({ bg: LEVEL_STYLE[gateLevel].bg, fg: LEVEL_STYLE[gateLevel].fg, bold: true, halign: 'center' }));
    }
  }

  XLSX.utils.book_append_sheet(wb, wsCap, 'Capabilities');

  // ── Sheet 6: "Req. por Nível" ──
  const reqRows: any[][] = [];

  reqRows.push(['SUMMARY — Requirements by Gate (N4s: READY / Total)']);
  reqRows.push(['Domain', 'L1 Total', 'L1 READY', 'L1 %', 'L2 Total', 'L2 READY', 'L2 %', 'L3 Total', 'L3 READY', 'L3 %', 'L4 Total', 'L4 READY', 'L4 %', 'Threshold']);
  for (const [dom, gateMap] of Object.entries(CAPABILITY_DETAIL).sort()) {
    const row: any[] = [dom];
    for (const gate of ['L1', 'L2', 'L3', 'L4']) {
      const n4Map = (gateMap as any)[gate] as Record<string, CapEntryFull> | undefined;
      if (!n4Map) { row.push(0, 0, '—'); continue; }
      const n4s = Object.values(n4Map);
      const total = n4s.length;
      const ready = n4s.filter(e => e.status === 'READY').length;
      row.push(total, ready, total > 0 ? `${Math.round(ready / total * 100)}%` : '—');
    }
    row.push('≥ 70%');
    reqRows.push(row);
  }
  reqRows.push([]);
  reqRows.push(['NOTE: To reach a gate (L1→L4), the site needs ≥70% of the N4s for that gate covered by installed products.']);
  reqRows.push(['Site score = minimum gate achieved across all active domains (UT and SF excluded).']);
  reqRows.push([]);

  const reqSummaryEnd = reqRows.length; // track where summary ends for styling

  for (const gate of ['L1', 'L2', 'L3', 'L4']) {
    reqRows.push([]);
    reqRows.push([`GATE ${gate} — Requirements List`, '', '', '', '', '', '', '']);
    reqRows.push(['Domain', 'Subarea', 'ID', 'Functionality (N4)', 'N1 — Process', 'Status', 'Planned Year', 'Covered by (cap_keys)']);
    for (const [dom, gateMap] of Object.entries(CAPABILITY_DETAIL).sort()) {
      const n4Map = (gateMap as any)[gate] as Record<string, CapEntryFull> | undefined;
      if (!n4Map) continue;
      const bySubarea: Record<string, [string, CapEntryFull][]> = {};
      for (const [id, entry] of Object.entries(n4Map)) {
        const sa = entry.subarea || '—';
        if (!bySubarea[sa]) bySubarea[sa] = [];
        bySubarea[sa].push([id, entry]);
      }
      for (const [, entries] of Object.entries(bySubarea).sort()) {
        for (const [id, entry] of entries.sort((a, b) => a[0].localeCompare(b[0]))) {
          reqRows.push([dom, entry.subarea, id, entry.name, entry.n1, entry.status, entry.plannedYear, entry.coveredBy.join(', ')]);
        }
      }
    }
  }

  const wsReq = XLSX.utils.aoa_to_sheet(reqRows);
  wsReq['!cols'] = [
    { wch: 8 }, { wch: 20 }, { wch: 10 }, { wch: 55 }, { wch: 35 }, { wch: 11 }, { wch: 10 }, { wch: 40 },
  ];
  wsReq['!tabcolor'] = { rgb: '6B7280' };

  // Style summary header
  if (wsReq['A1']) wsReq['A1'].s = S_SECTION;
  for (const col of ['A','B','C','D','E','F','G','H','I','J','K','L','M','N']) styleCell(wsReq, `${col}2`, S_HEADER_RO);

  // Style gate section headers and detail status cells
  for (let i = reqSummaryEnd + 1; i < reqRows.length; i++) {
    const row = i + 1;
    const rowData = reqRows[i];
    if (!rowData || rowData.length === 0) continue;
    const first = String(rowData[0] ?? '');
    if (first.startsWith('GATE ')) {
      for (const col of ['A','B','C','D','E','F','G','H']) styleCell(wsReq, `${col}${row}`, S_GATE_HDR);
    } else if (first === 'Domain') {
      for (const col of ['A','B','C','D','E','F','G','H']) styleCell(wsReq, `${col}${row}`, S_HEADER_RO);
    } else {
      // data row: color status (col F = index 5)
      const status = rowData[5];
      if (status === 'READY') styleCell(wsReq, `F${row}`, S_READY);
      else if (status === 'NOT READY') styleCell(wsReq, `F${row}`, S_NOT_READY);
    }
  }

  XLSX.utils.book_append_sheet(wb, wsReq, 'Level Req.');

  // ── Sheet 7: "Regras de Nível" — human-readable level guide ──
  // Section 1: What each level means (general concept)
  // Section 2: How the score is calculated
  // Section 3: Per-domain breakdown (business language, actionable)
  const RULES = buildLevelRulesSheet();
  const wsRules = XLSX.utils.aoa_to_sheet(RULES.rows);
  wsRules['!cols'] = RULES.cols;
  wsRules['!merges'] = RULES.merges;
  wsRules['!tabcolor'] = { rgb: '1B5E9E' };
  wsRules['!freeze'] = { xSplit: 1, ySplit: 4 }; // freeze col A + first 4 rows
  // Apply styles
  for (const [addr, style] of RULES.styles) styleCell(wsRules, addr, style);
  XLSX.utils.book_append_sheet(wb, wsRules, 'Level Rules');

  XLSX.writeFile(wb, `coverage_rollout_${today}.xlsx`);
}

// ---------------------------------------------------------------------------
// Level Rules Sheet builder
// Separated for readability — returns rows, merges, styles, cols
// ---------------------------------------------------------------------------

interface RulesSheet {
  rows: any[][];
  merges: { s: { r: number; c: number }; e: { r: number; c: number } }[];
  styles: [string, any][];
  cols: { wch: number }[];
}

function buildLevelRulesSheet(): RulesSheet {
  const rows: any[][] = [];
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
  const styles: [string, any][] = [];

  // ── Style helpers (re-used from module scope: cs, LEVEL_STYLE) ──
  const S_L: Record<number, any> = {
    0: cs({ bg: 'FEE2E2', fg: '991B1B', bold: true, halign: 'center', wrapText: true }),
    1: cs({ bg: 'FEF3C7', fg: '92400E', bold: true, halign: 'center', wrapText: true }),
    2: cs({ bg: 'FDE68A', fg: '78350F', bold: true, halign: 'center', wrapText: true }),
    3: cs({ bg: 'D1FAE5', fg: '065F46', bold: true, halign: 'center', wrapText: true }),
    4: cs({ bg: 'A7F3D0', fg: '047857', bold: true, halign: 'center', wrapText: true }),
  };
  const S_L_BODY: Record<number, any> = {
    0: cs({ bg: 'FFF5F5', fg: '7F1D1D', wrapText: true }),
    1: cs({ bg: 'FFFBEB', fg: '78350F', wrapText: true }),
    2: cs({ bg: 'FFFDE7', fg: '713F12', wrapText: true }),
    3: cs({ bg: 'F0FDF4', fg: '14532D', wrapText: true }),
    4: cs({ bg: 'ECFDF5', fg: '064E3B', wrapText: true }),
  };
  const S_DOM_HDR    = cs({ bg: '1E3A5F', fg: 'FFFFFF', bold: true, wrapText: true });
  const S_SECTION_HDR = cs({ bg: '1B5E9E', fg: 'FFFFFF', bold: true, sz: 12 });
  const S_TITLE_MAIN  = cs({ bg: '0F172A', fg: 'FFFFFF', bold: true, sz: 14 });
  const S_SUBTITLE    = cs({ bg: '1E3A5F', fg: 'DBEAFE', italic: true, wrapText: true });
  const S_RULE_KEY    = cs({ bg: 'EFF6FF', fg: '1E40AF', bold: true, wrapText: true });
  const S_RULE_VAL    = cs({ bg: 'F8FAFC', fg: '334155', wrapText: true });
  const S_ARROW       = cs({ bg: 'F1F5F9', fg: '64748B', bold: true, halign: 'center' });
  const S_NOTE_ROW    = cs({ bg: 'FFFBEB', fg: '92400E', italic: true, wrapText: true });

  const addStyle = (col: string, rowIdx: number, style: any) => styles.push([`${col}${rowIdx + 1}`, style]);
  const addMerge = (r1: number, c1: number, r2: number, c2: number) =>
    merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });

  // Columns: A=Domain(22) | B=L0(22) | C=L1(26) | D=L2(26) | E=L3(26) | F=L4(26)
  const cols = [{ wch: 24 }, { wch: 24 }, { wch: 28 }, { wch: 28 }, { wch: 28 }, { wch: 28 }];

  // ── ROW 0: Main title ──
  rows.push(['LEVEL RULES — Digital Maturity Guide  |  Coverage Dashboard AB InBev', '', '', '', '', '']);
  addMerge(0, 0, 0, 5);
  addStyle('A', 0, S_TITLE_MAIN);

  // ── ROW 1: Subtitle ──
  rows.push(['This guide explains in business language what each level means and what is needed to advance. Use together with the "Rollout" sheet to plan the evolution of each site.', '', '', '', '', '']);
  addMerge(1, 0, 1, 5);
  addStyle('A', 1, S_SUBTITLE);

  // ── ROW 2: Blank ──
  rows.push(['', '', '', '', '', '']);

  // ── ROW 3: Level header row ──
  rows.push(['', 'L0 — Non Digital', 'L1 — Basic', 'L2 — Connected', 'L3 — Integrated', 'L4 — Touchless']);
  for (const [ci, lv] of [[1,0],[2,1],[3,2],[4,3],[5,4]] as [number,number][]) {
    addStyle(colLetter(ci), 3, S_L[lv]);
  }
  addStyle('A', 3, cs({ bg: '1E3A5F', fg: 'FFFFFF', bold: true }));

  // ══════════════════════════════════════════════════════════════
  // SECTION 1: O que significa cada nível (conceito geral)
  // ══════════════════════════════════════════════════════════════
  rows.push(['SECTION 1 — WHAT DOES EACH LEVEL MEAN?', '', '', '', '', '']);
  const sec1Row = rows.length - 1;
  addMerge(sec1Row, 0, sec1Row, 5);
  addStyle('A', sec1Row, S_SECTION_HDR);

  const generalDefs: [string, string, string, string, string, string][] = [
    [
      'Site situation',
      'No digital system covers core operations. Data on paper or isolated spreadsheets.',
      'At least one digital system is operational covering essential functions of each domain.',
      'Integrated and connected systems. Data flows between systems without manual intervention.',
      'Data automatically analyzed. System detects patterns, alerts deviations and suggests actions.',
      'Autonomous processes. System decides and acts with minimal human intervention.',
    ],
    [
      'Practical example (Brewing)',
      'Process control on paper. Recipes in notebooks. No digital traceability.',
      'System records production orders, recipe parameters and downtime digitally.',
      'System integrates with sensors, pulls data automatically and generates performance reports.',
      'Algorithms detect deviations before impacting product and alert operator in real time.',
      'System adjusts parameters automatically without manual intervention during brewing.',
    ],
    [
      'Expected OSE impact',
      'Reference baseline (no system)',
      '+2 to +5 pp OSE vs. L0 (when VPO controlled)',
      '+5 to +10 pp OSE vs. L1',
      '+10 to +15 pp OSE vs. L2 (projection)',
      '+15 pp+ OSE vs. L3 (projection)',
    ],
    [
      'What needs to be installed',
      '—',
      'Global or legacy product covering ≥70% of basic functionalities (L1 gate) of the domain.',
      'Products covering ≥70% of L2 gate. Typically requires module expansion or integration.',
      'Advanced analytics modules, predictive models or automation covering ≥70% of L3 gate.',
      'Full automation and operational AI covering ≥70% of L4 gate.',
    ],
  ];

  for (const rowData of generalDefs) {
    const rowIdx = rows.length;
    rows.push(rowData as any[]);
    addStyle('A', rowIdx, S_RULE_KEY);
    for (const [ci, lv] of [[1,0],[2,1],[3,2],[4,3],[5,4]] as [number,number][]) {
      addStyle(colLetter(ci), rowIdx, S_L_BODY[lv]);
    }
  }

  // ── Como o score é calculado ──
  rows.push(['', '', '', '', '', '']);
  rows.push(['HOW THE SITE SCORE IS CALCULATED', '', '', '', '', '']);
  const calcRow = rows.length - 1;
  addMerge(calcRow, 0, calcRow, 5);
  addStyle('A', calcRow, S_SECTION_HDR);

  const calcRules = [
    ['Rule 1 — Cumulative', 'To be L2, the site must have passed L1 first. For L3, must have passed L1 and L2. Score advances gate by gate.'],
    ['Rule 2 — 70% Threshold', 'Within each gate (L1, L2, L3, L4), the site needs ≥70% of functionalities (N4s) covered by installed products.'],
    ['Rule 3 — Minimum across domains', 'The final SITE score is the lowest score among all active domains. If BP=L2, MT=L1, MG=L2: site score = L1 (bottleneck in Maintenance).'],
    ['Rule 4 — Excluded domains', 'UT (Utilities) and SF (Safety) do NOT enter site score calculation. They are monitored but do not penalize the site while data is incomplete.'],
    ['Rule 5 — Global vs. legacy product', 'Both Global (G) and Legacy (L) products contribute to the score. Legacy takes precedence over Global in the same domain. Both count.'],
    ['Rule 6 — Cross-domain', 'Products installed in one domain can cover functionalities in another. E.g.: Omnia BMS installed in BP can automatically cover DA N4s.'],
  ];

  for (const [key, val] of calcRules) {
    const rowIdx = rows.length;
    rows.push([key, val, '', '', '', '']);
    addMerge(rowIdx, 1, rowIdx, 5);
    addStyle('A', rowIdx, S_RULE_KEY);
    addStyle('B', rowIdx, S_RULE_VAL);
  }

  // ── Nota sobre L0 ──
  rows.push(['', '', '', '', '', '']);
  const noteRowIdx = rows.length;
  rows.push(['⚠ NOTE: Many sites appear as L0 not due to lack of systems, but because the installed product is not yet mapped in the capability base. Report to the Coverage team if you suspect this.', '', '', '', '', '']);
  addMerge(noteRowIdx, 0, noteRowIdx, 5);
  addStyle('A', noteRowIdx, S_NOTE_ROW);

  // ══════════════════════════════════════════════════════════════
  // SECTION 2: Por Domínio
  // ══════════════════════════════════════════════════════════════
  rows.push(['', '', '', '', '', '']);
  rows.push(['SECTION 2 — RULES BY DOMAIN', '', '', '', '', '']);
  const sec2Row = rows.length - 1;
  addMerge(sec2Row, 0, sec2Row, 5);
  addStyle('A', sec2Row, S_SECTION_HDR);

  rows.push(['Each domain has its own functionalities (N4s) per gate. Below is the meaning of each level in business language, and what needs to be implemented to advance.', '', '', '', '', '']);
  const descRow2 = rows.length - 1;
  addMerge(descRow2, 0, descRow2, 5);
  addStyle('A', descRow2, S_SUBTITLE);

  // Domain definitions: [code, fullName, [L0, L1, L2, L3, L4], [action L0→L1, L1→L2, L2→L3, L3→L4]]
  const DOMAIN_DEFS: Array<{
    code: string; name: string; emoji: string;
    levels: [string, string, string, string, string]; // what each level means (business)
    actions: [string, string, string, string];         // what to do to advance (L0→L1, L1→L2, L2→L3, L3→L4)
    products: string;
  }> = [
    {
      code: 'BP', name: 'Brewing Performance', emoji: '🍺',
      levels: [
        'No digital system for brewing monitoring. Control by paper, spreadsheet or local system without integration.',
        'Digital system records recipe parameters, categorizes downtime and manages production orders. Operator can open, edit and close orders digitally.',
        'Integrated system monitors all brewing stages (brewhouse, fermentation, filtration, cellar). Performance calculated automatically. Daily reports without manual intervention.',
        'Predictive analysis identifies deviations before impacting product. Automatic benchmarking between plants. Recommendations based on historical data.',
        'Automatic parameter adjustment during brewing. Process decisions without human intervention. Self-optimized recipes.',
      ],
      actions: [
        'Install Omnia BMS, Traksys or LMS configured for your plant. Activate recipe, downtime categorization and order management modules.',
        'Expand to fermentation, filtration and cellar modules. Configure integration with plant instrumentation. Activate automatic performance reports.',
        'Activate analytics and benchmarking modules. Integrate with statistical process control (SPC) models. Connect historical data for trend analysis.',
        'Implement automatic control loops. Integrate with automation systems (PLC/SCADA) for parameter adjustment without manual intervention.',
      ],
      products: 'Omnia BMS · Traksys · LMS (Brew) · APAC BMS',
    },
    {
      code: 'DA', name: 'Data Acquisition', emoji: '📡',
      levels: [
        'Process data not collected digitally or isolated in systems without integration.',
        'System collects process data digitally and makes it available for querying. Operators can view basic historical data.',
        'Automated collection from multiple sources. Normalized data available in real time for other systems. Functional and monitored data pipeline.',
        'Data validated automatically. Anomalies detected and flagged. Data governance established with full traceability.',
        'Fully autonomous data ecosystem. Collection, validation and distribution without human intervention. Auto-healing of pipeline failures.',
      ],
      actions: [
        'Install SODA ETL or BMS Connect. Configure connectors for main plant equipment.',
        'Expand sensor and source coverage. Configure normalized pipeline with data quality validation.',
        'Implement pipeline monitoring, failure alerts and data quality dashboards. Document sources and transformations.',
        'Configure auto-detection of anomalies and automatic recovery of pipeline failures.',
      ],
      products: 'SODA ETL · BMS Connect · Omnia Connect · PI System',
    },
    {
      code: 'MT', name: 'Maintenance', emoji: '🔧',
      levels: [
        'No maintenance management system. Orders on paper, failure history nonexistent or in spreadsheets.',
        'Digital system for creating, approving and closing work orders. Maintenance history recorded. Technicians can query equipment.',
        'Integrated preventive maintenance planning. KPIs calculated automatically (MTBF, MTTR, backlog). Integration with operations for coordination.',
        'Predictive maintenance based on condition data. Orders automatically generated by condition triggers. Intelligent backlog prioritization.',
        'Autonomous maintenance. System decides when and what to maintain based on lifecycle models and real-time operational data.',
      ],
      actions: [
        'Deploy SAP PM, MAX WO or similar. Configure equipment structure (functional locations). Train maintenance team.',
        'Activate PM planning modules. Configure KPIs and dashboards. Integrate with operations for shutdown coordination.',
        'Implement condition sensors on critical equipment. Configure predictive maintenance models. Activate automatic prioritization.',
        'Fully integrate with automation and condition systems. Configure autonomous decision loops for strategic equipment.',
      ],
      products: 'SAP PM · MAX WO · Omnia Maintenance · IBM Maximo',
    },
    {
      code: 'MG', name: 'Management', emoji: '📊',
      levels: [
        'Management routines on paper or email. No system for tracking actions or performance.',
        'Management meetings with digital records. Actions tracked digitally with owner and deadline. Basic performance monitored on dashboard.',
        'Management routines connected with real-time operational data. Digital VPO integrated. Performance updated automatically without manual preparation.',
        'AI identifies correlations between management and performance. Automatic focus recommendations. Automatic benchmarking between similar sites.',
        'Autonomous management. Meeting agenda, topics and actions automatically prioritized based on data and global benchmarks.',
      ],
      actions: [
        'Deploy Omnia Interact, One2Five or SPlan. Configure meeting structure and action templates.',
        'Integrate with operational data (OSE, downtime). Configure real-time performance dashboards.',
        'Activate analytics and benchmarking modules. Connect with data from multiple sites for comparison.',
        'Implement AI-based automatic recommendations. Configure intelligent agenda prioritization.',
      ],
      products: 'Omnia Interact · One2Five · SPlan · InteractionLog',
    },
    {
      code: 'MDM', name: 'MasterData Management', emoji: '🗂️',
      levels: [
        'No centralized master data management. Material, equipment and product codes inconsistent across systems.',
        'Centralized master data system. Single code for materials and equipment. Basic synchronization between systems.',
        'Master data integrated and automatically synchronized across all plant systems. Changes propagated without manual intervention.',
        'Automated master data governance. Duplicate detection and resolution. Data quality continuously monitored.',
        'Autonomous master data. Record creation, update and deactivation without human intervention based on business rules.',
      ],
      actions: [
        'Install Omnia MDM or SAP MDM. Create standardized material and equipment structure.',
        'Configure automatic synchronization with ERP and operational systems. Establish governance processes.',
        'Implement automatic duplicate detection and data quality alerts.',
        'Configure automatic workflows for master data lifecycle.',
      ],
      products: 'Omnia MDM · SAP MDM · Golden Record',
    },
    {
      code: 'PP', name: 'Packaging Performance', emoji: '📦',
      levels: [
        'No digital monitoring of packaging lines. Performance calculated manually or not calculated.',
        'System records production and downtime of packaging lines. Basic OEE calculated. Digital stop categorization.',
        'All line performance monitored in real time. Integration with equipment. Automatic reports per shift and day.',
        'Predictive analysis identifies failure patterns on lines. Automatic benchmarking between lines and plants. Schedule optimization suggested.',
        'Self-optimized lines. System automatically adjusts speed, stop planning and production sequence.',
      ],
      actions: [
        'Install LMS, Traksys or APAC Line View on main lines. Configure downtime categorization.',
        'Expand to all lines. Configure integration with PLCs and equipment. Activate automatic OEE calculation.',
        'Implement failure pattern analytics. Connect historical data for predictive models.',
        'Configure automatic line parameter optimization based on historical performance.',
      ],
      products: 'LMS · Traksys · APAC Line View · Omnia Packaging',
    },
    {
      code: 'QL', name: 'Quality', emoji: '✅',
      levels: [
        'Quality control on paper or local spreadsheet. No digital product traceability.',
        'System records quality analysis results digitally. Specifications stored in system. Basic lot traceability.',
        'Quality integrated with process. Results automatically feed trend reports. Non-conformances managed digitally.',
        'Predictive analysis identifies quality deviations before release. System suggests corrective actions based on history.',
        'Autonomous quality control. Automatic release/rejection decisions based on quality models.',
      ],
      actions: [
        'Install eQMS, LIMS or Omnia Quality. Configure specifications and sampling plans.',
        'Integrate with process data for quality-process correlation. Configure non-conformance management.',
        'Implement trend analysis and predictive quality alerts.',
        'Configure automatic decision models for product release.',
      ],
      products: 'eQMS · LIMS · Omnia Quality · SAP QM',
    },
    {
      code: 'SF', name: 'Safety', emoji: '⛑️',
      levels: [
        'Safety records on paper. No digital traceability of incidents or work permits.',
        'Incidents and near-misses recorded digitally. Digital work permits. Training tracked.',
        'System integrated with operations. Permits linked to maintenance orders. Automated incident analysis.',
        'Predictive risk analysis. System identifies risk conditions before incidents. Proactive recommendations.',
        'Autonomous safety management with real-time risk analysis and automatic alerts for hazardous conditions.',
      ],
      actions: [
        'Install Credit 360 or Guardian. Configure digital incident and permit registration.',
        'Integrate with SAP PM to link work permits to orders. Configure root cause analysis.',
        'Implement predictive risk analysis based on incident history.',
        'Configure automatic alerts and AI-based response protocols.',
      ],
      products: 'Credit 360 · Guardian · Safety One',
    },
  ];

  for (const dom of DOMAIN_DEFS) {
    // blank row
    rows.push(['', '', '', '', '', '']);

    // Domain header
    const domHdrIdx = rows.length;
    rows.push([`${dom.emoji}  ${dom.code} — ${dom.name}`, '', '', '', '', '']);
    addMerge(domHdrIdx, 0, domHdrIdx, 5);
    addStyle('A', domHdrIdx, S_DOM_HDR);

    // Subheader: products
    const prodIdx = rows.length;
    rows.push([`Products contributing to this domain: ${dom.products}`, '', '', '', '', '']);
    addMerge(prodIdx, 0, prodIdx, 5);
    addStyle('A', prodIdx, S_SUBTITLE);

    // Column headers
    const colHdrIdx = rows.length;
    rows.push(['', 'L0 — Non Digital', 'L1 — Basic', 'L2 — Connected', 'L3 — Integrated', 'L4 — Touchless']);
    addStyle('A', colHdrIdx, cs({ bg: '334155', fg: 'FFFFFF', bold: true }));
    for (const [ci, lv] of [[1,0],[2,1],[3,2],[4,3],[5,4]] as [number,number][]) {
      addStyle(colLetter(ci), colHdrIdx, S_L[lv]);
    }

    // What this level means
    const meaningIdx = rows.length;
    rows.push(['What it means', ...dom.levels] as any[]);
    addStyle('A', meaningIdx, S_RULE_KEY);
    for (const [ci, lv] of [[1,0],[2,1],[3,2],[4,3],[5,4]] as [number,number][]) {
      addStyle(colLetter(ci), meaningIdx, S_L_BODY[lv]);
    }

    // Arrow row: what to do to advance
    const arrowIdx = rows.length;
    rows.push(['How to advance', '↑ to L1:', '↑ to L2:', '↑ to L3:', '↑ to L4:', '—']);
    addStyle('A', arrowIdx, S_RULE_KEY);
    for (const ci of [1, 2, 3, 4, 5]) addStyle(colLetter(ci), arrowIdx, S_ARROW);

    // Action descriptions
    const actionIdx = rows.length;
    rows.push(['', ...dom.actions, ''] as any[]);
    addStyle('A', actionIdx, S_RULE_KEY);
    for (const [ci, lv] of [[1,1],[2,2],[3,3],[4,4]] as [number,number][]) {
      addStyle(colLetter(ci), actionIdx, cs({ bg: LEVEL_STYLE[lv].bg, fg: LEVEL_STYLE[lv].fg, wrapText: true }));
    }
    addStyle('F', actionIdx, cs({ bg: 'F1F5F9', fg: '94A3B8', italic: true }));
  }

  // ── Final note ──
  rows.push(['', '', '', '', '', '']);
  const finalNoteIdx = rows.length;
  rows.push(['📌 To see the technical functionalities (N4s) that make up each gate, see the "Level Req." sheet. For the rollout plan and products by site, use the "Rollout" sheet.', '', '', '', '', '']);
  addMerge(finalNoteIdx, 0, finalNoteIdx, 5);
  addStyle('A', finalNoteIdx, S_NOTE_ROW);

  return { rows, merges, styles, cols };
}

// ---------------------------------------------------------------------------
// Import — parse an edited Rollout file back into ImportedData
// ---------------------------------------------------------------------------

// Auto-detect: returns true if the workbook looks like an exported Rollout file.
export function isRolloutWorkbook(workbook: any): boolean {
  if (!workbook?.SheetNames?.includes('Rollout')) return false;
  // Accept "Guide" (V3), "Guia" (V2) or "Instruções" (V1) as the guide sheet
  const guideSheet = workbook.Sheets['Guide'] ?? workbook.Sheets['Guia'] ?? workbook.Sheets['Instruções'];
  if (!guideSheet) return true; // Rollout sheet alone is enough
  const XLSX = (window as any).XLSX;
  const rows: any[][] = XLSX.utils.sheet_to_json(guideSheet, { header: 1, defval: '' });
  // Accept V1 and V2 sentinels
  return rows.some(r => String(r[0] ?? '').includes('COVERAGE_ROLLOUT'));
}

export function parseRolloutImport(
  workbook: any,
  fileName: string,
  maturityDetail: Record<string, { zone: string; score: number; domains: Record<string, { score: number; type: string } | null> }>,
  existingVolumes: Record<string, number>,
): ImportedData {
  const XLSX = (window as any).XLSX;
  const ws = workbook.Sheets['Rollout'];
  if (!ws) throw new Error('Sheet "Rollout" not found.');

  const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (rawRows.length < 2) throw new Error('Sheet "Rollout" is empty.');

  // Find column indices from header row (strip "← EDIT" / "← EDITAR" suffixes)
  const header = (rawRows[0] as any[]).map(h => String(h ?? '').trim().toLowerCase().replace(/\s*←.*$/, '').trim());
  const ci = (names: string[]) => {
    for (const n of names) { const idx = header.indexOf(n); if (idx >= 0) return idx; }
    // fallback: starts-with match
    for (const n of names) { const idx = header.findIndex(h => h.startsWith(n)); if (idx >= 0) return idx; }
    return -1;
  };
  const iZone    = ci(['zona', 'zone']);
  const iCountry = ci(['país', 'pais', 'country']);
  const iSite    = ci(['site']);
  const iCode    = ci(['código', 'codigo', 'cod.', 'code']);
  const iProduct = ci(['produto', 'product']);
  const iType    = ci(['tipo', 'type']);
  const iActive  = ci(['ativo', 'active']);

  if (iSite < 0 || iCode < 0 || iProduct < 0) {
    throw new Error('Required columns not found ("Site", "Code", "Product"). Check that the file is a valid Editable Rollout.');
  }

  // Parse data rows into grouped structure: site → domain → {products, type, zone, country}
  type SiteDomInfo = {
    products: Map<string, 'G' | 'L'>;
    hasLegacy: boolean;
    zone: string;
    country: string;
  };
  const grouped = new Map<string, { meta: { zone: string; country: string }; domains: Map<string, SiteDomInfo> }>();

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i] as any[];
    const site    = String(row[iSite]    ?? '').trim();
    const code    = String(row[iCode]    ?? '').trim().toUpperCase();
    const product = String(row[iProduct] ?? '').trim();
    const type    = (String(row[iType]   ?? 'G').trim().toUpperCase() === 'L' ? 'L' : 'G') as 'G' | 'L';
    const zone    = iZone    >= 0 ? String(row[iZone]    ?? '').trim() : '';
    const country = iCountry >= 0 ? String(row[iCountry] ?? '').trim() : '';
    const activeRaw = iActive >= 0 ? String(row[iActive] ?? '').trim().toLowerCase() : 'sim';

    if (!site || !code) continue;
    if (!product || product === '—' || product === '-') continue;

    // "Não", "No", "—", "-", "false", or empty = inactive → skip
    const isActive = activeRaw === 'sim' || activeRaw === 'yes' || activeRaw === 'true' || activeRaw === '1';
    if (!isActive) continue;

    // Only accept known domain codes
    if (!DOM_CODES.includes(code as DomCode)) continue;

    if (!grouped.has(site)) grouped.set(site, { meta: { zone, country }, domains: new Map() });
    const siteEntry = grouped.get(site)!;
    if (!siteEntry.meta.zone && zone) siteEntry.meta.zone = zone;
    if (!siteEntry.meta.country && country) siteEntry.meta.country = country;

    if (!siteEntry.domains.has(code)) {
      siteEntry.domains.set(code, { products: new Map(), hasLegacy: false, zone, country });
    }
    const domEntry = siteEntry.domains.get(code)!;
    domEntry.products.set(product, type);
    if (type === 'L') domEntry.hasLegacy = true;
  }

  const allIssues: DataQualityIssue[] = [];

  // Apply force-adds (same as computeImportedData)
  let forceAddedCount = 0;
  for (const [site, siteEntry] of grouped) {
    const { zone, country } = siteEntry.meta;
    if (SAP_PM_FORCED_ZONES.has(zone)) {
      if (!siteEntry.domains.has('MT')) {
        siteEntry.domains.set('MT', { products: new Map([['SAP PM', 'L']]), hasLegacy: true, zone, country });
        forceAddedCount++;
        allIssues.push({ type: 'force_added', site, domain: 'MT', product: 'SAP PM', message: `SAP PM adicionado automaticamente em ${site} (${zone}) MT` });
      }
    }
    if (shouldForceAPACLineView(zone, country)) {
      if (!siteEntry.domains.has('PP')) {
        siteEntry.domains.set('PP', { products: new Map([['APAC Line View', 'L']]), hasLegacy: true, zone, country });
        forceAddedCount++;
        allIssues.push({ type: 'force_added', site, domain: 'PP', product: 'APAC Line View', message: `APAC Line View adicionado em ${site} PP` });
      }
    }
  }

  // Build siteProductMap with cross-domain scoring (same as computeImportedData)
  const siteProductMap: ImportedSPM = {};
  let totalUnknown = 0, crossDomainAdded = 0;

  for (const [site, siteEntry] of grouped) {
    const { zone } = siteEntry.meta;
    siteProductMap[site] = {};

    const allProductTypes = new Map<string, 'G' | 'L'>();
    for (const domInfo of siteEntry.domains.values()) {
      for (const [prod, type] of domInfo.products) allProductTypes.set(prod, type);
    }
    const allProductsList = [...allProductTypes.keys()];
    const allProductTypesObj = Object.fromEntries(allProductTypes);

    for (const [domCode, domInfo] of siteEntry.domains) {
      const result = computeDomainScore(allProductsList, allProductTypesObj, domCode, zone);
      for (const up of result.unknownProducts) {
        allIssues.push({ type: 'unknown_product', site, domain: domCode, product: up, message: `Produto desconhecido: "${up}" em ${site} (${domCode})` });
        totalUnknown++;
      }
      siteProductMap[site][domCode] = {
        products: [...domInfo.products.keys()],
        type: domInfo.hasLegacy ? 'L' : 'G',
        dominant: [...domInfo.products.keys()][0] ?? '',
        score: result.score,
        globalFracs: result.globalFracs,
        legacyFracs: result.legacyFracs,
        scoreGlobal: result.scoreGlobal,
        scoreLegacy: result.scoreLegacy,
      };
    }

    for (const domCode of ALL_DOMAIN_CODES) {
      if (siteProductMap[site][domCode]) continue;
      const result = computeDomainScore(allProductsList, allProductTypesObj, domCode, zone);
      if (result.score && result.score > 0) {
        const coveredProducts = allProductsList.filter(p => {
          const keys = resolveCapKeys(p, zone);
          if (!keys.length) return false;
          const capDomain = CAPABILITY_DETAIL[domCode];
          if (!capDomain?.L1) return false;
          return Object.values(capDomain.L1).some((n4: any) => n4.coveredBy.some((ck: string) => keys.includes(ck)));
        });
        const hasLegacy = coveredProducts.some(p => allProductTypesObj[p] === 'L');
        siteProductMap[site][domCode] = {
          products: coveredProducts,
          type: hasLegacy ? 'L' : 'G',
          dominant: coveredProducts[0] ?? '',
          score: result.score,
          globalFracs: result.globalFracs,
          legacyFracs: result.legacyFracs,
          scoreGlobal: result.scoreGlobal,
          scoreLegacy: result.scoreLegacy,
        };
        crossDomainAdded++;
        allIssues.push({ type: 'cross_domain', site, domain: domCode, message: `${domCode} inferido de produtos de outros domínios em ${site}` });
      }
    }
  }

  // Compute site scores
  const domainCodes = ['BP','DA','UT','MT','MG','MDM','PP','QL','SF'] as const;
  const sitesOut: ImportedSiteRow[] = [];
  let fromMaturity = 0, computed = 0, l0count = 0;

  for (const [site, domMap] of Object.entries(siteProductMap)) {
    const meta = grouped.get(site)!.meta;
    const md = maturityDetail[site];
    const domScores: Record<string, number> = {};

    for (const dom of domainCodes) {
      const mdDom  = md?.domains?.[dom];
      const spmDom = domMap[dom];
      if (mdDom && mdDom.score > 0) { domScores[dom] = mdDom.score; fromMaturity++; }
      else if (spmDom?.score != null && spmDom.score > 0) { domScores[dom] = spmDom.score; computed++; }
      else domScores[dom] = 0;
    }

    const activeDomScores = domainCodes.filter(d => !SCORE_EXCLUDED.has(d)).map(d => domScores[d]);
    const siteScore = activeDomScores.length > 0 ? Math.min(...activeDomScores) : 0;
    if (siteScore === 0) l0count++;
    if (!md) allIssues.push({ type: 'site_not_in_maturity', site, message: `${site} não está na base de avaliação N3/N4` });

    sitesOut.push({
      zone: meta.zone, site, country: meta.country,
      volume: existingVolumes[site] ?? 0,
      BP: domScores.BP, DA: domScores.DA, UT: domScores.UT,
      MT: domScores.MT, MG: domScores.MG, MDM: domScores.MDM,
      PP: domScores.PP, QL: domScores.QL, SF: domScores.SF,
      score: siteScore,
    });
  }

  sitesOut.sort((a, b) => b.volume - a.volume);

  const seenIssues = new Set<string>();
  const dedupedIssues = allIssues.filter(issue => {
    if (issue.type !== 'unknown_product') return true;
    const key = `${issue.site}|${issue.domain}|${issue.product}`;
    if (seenIssues.has(key)) return false;
    seenIssues.add(key);
    return true;
  });

  const uniqueUnknownProducts = new Set(dedupedIssues.filter(i => i.type === 'unknown_product').map(i => i.product)).size;

  return {
    siteProductMap,
    sites: sitesOut,
    issues: dedupedIssues,
    importedAt: new Date(),
    fileName,
    stats: {
      totalSites: sitesOut.length,
      fromMaturity,
      computed,
      l0: l0count,
      unknownProducts: uniqueUnknownProducts,
      crossDomainAdded,
      forceAdded: forceAddedCount,
    },
  };
}
