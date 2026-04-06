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
    [`COVERAGE DASHBOARD — Rollout Editável  [${ROLLOUT_SENTINEL}]`],
    [`Gerado em: ${today}   |   ${sites.length} sites   |   ${productMeta.size} produtos`],
    [''],
    ['ABAS DESTA PLANILHA'],
    ['  1. Guia              → Este guia de uso (você está aqui).'],
    ['  2. Rollout           → Lista de produtos por site/domínio. ABA EDITÁVEL (colunas amarelas).'],
    ['  3. Cobertura por Site → Scores L0-L4 por domínio para todos os sites. Somente leitura.'],
    ['  4. Produtos          → Visão de cada produto: sites, domínios cobertos por capabilidade.'],
    ['  5. Capabilidades     → Árvore completa de N4s por domínio e gate. Referência e análise.'],
    ['  6. Req. por Nível    → Requerimentos de capabilidade por gate (L1/L2/L3/L4).'],
    [''],
    ['COMO EDITAR E REIMPORTAR (aba Rollout)'],
    ['  Passo 1: Na aba Rollout, edite apenas as colunas com fundo AMARELO (G–J).'],
    ['  Passo 2: Salve o arquivo Excel (.xlsx).'],
    ['  Passo 3: Importe de volta no Coverage Dashboard. O formato é detectado automaticamente.'],
    [''],
    ['OPERAÇÕES NA ABA ROLLOUT'],
    ['  Colunas de CHAVE (não editar): Zona | País | Site | Código | Domínio | Score Dom.'],
    ['  Colunas EDITÁVEIS (fundo amarelo):'],
    ['    G — Produto      → Nome exato do produto (consulte aba Produtos para lista válida).'],
    ['    H — Tipo         → G = Global (produto padrão ABI)  |  L = Legado (produto local).'],
    ['    I — Ativo        → Sim = produto ativo neste site  |  Não = inativo / a remover.'],
    ['    J — Plano Rollout → Preenchimento livre: ex. "Q1 2026", "Piloto 2027". Não afeta scores.'],
    [''],
    ['  Adicionar produto : insira nova linha com as colunas de chave preenchidas + Produto + Tipo + Ativo=Sim.'],
    ['  Remover produto   : mude a coluna Ativo para "Não". A linha será ignorada na reimportação.'],
    [''],
    ['REGRAS APLICADAS AO REIMPORTAR'],
    ['  • Tipo L (Legado) prevalece sobre G (Global) no mesmo site + domínio.'],
    ['  • Scores recalculados automaticamente via base de capabilidades (aba Capabilidades).'],
    ['  • UT e SF excluídos do site score (dados pendentes — consulte aba Capabilidades).'],
    ['  • SAP PM é adicionado automaticamente como MT para zonas fora de EUR.'],
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
  XLSX.utils.book_append_sheet(wb, wsGuia, 'Guia');

  // ── Sheet 2: "Rollout" — one row per (site × domain × product) ──
  // Cols: A=Zona B=País C=Site D=Código E=Domínio F=Score Dom. [read-only]
  //       G=Produto H=Tipo I=Ativo J=Plano Rollout [EDITABLE]
  const rolloutHeader = [
    'Zona', 'País', 'Site', 'Código', 'Domínio', 'Score Dom.',
    'Produto ← EDITAR', 'Tipo ← EDITAR', 'Ativo ← EDITAR', 'Plano Rollout ← EDITAR',
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
          rolloutRows.push([site.zone, site.country, site.name, d, DOM_FULL[d], domScore, prod, entry.type, 'Sim', '']);
          rolloutScores.push(domScore);
        }
      } else {
        rolloutRows.push([site.zone, site.country, site.name, d, DOM_FULL[d], domScore, '', '', 'Não', '']);
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
    { ref: 'G1', comment: { author: 'Dashboard', t: 'Insira o nome exato do produto.\nConsulte a aba "Produtos" para a lista de produtos válidos.' } },
    { ref: 'H1', comment: { author: 'Dashboard', t: 'G = Global (produto padrão AB InBev)\nL = Legado (produto local ou legado)' } },
    { ref: 'I1', comment: { author: 'Dashboard', t: 'Sim = produto ativo neste site\nNão = produto inativo / a remover na reimportação' } },
    { ref: 'J1', comment: { author: 'Dashboard', t: 'Plano de rollout — preenchimento livre.\nExemplos: "Q1 2026", "Piloto 2027", "2026".\nEste campo não afeta o cálculo de scores.' } },
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

  const covHeader = ['Zona', 'País', 'Site', 'Score', ...COV_SCORE_KEYS.map(([k]) => k)];
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

  XLSX.utils.book_append_sheet(wb, wsCov, 'Cobertura por Site');

  // ── Sheet 4: "Produtos" ──
  const prodRows: any[][] = [
    ['Produto', 'Tipo', 'Zona', 'País', 'Site', 'Dom. Atribuído', 'Dom. Cobertos (cap)', 'Detalhes de Cobertura de Capabilidades'],
    ['', '(G=Global, L=Legado)', '', '', '', '', '(via base de capabilidades)', '(gate: cobertas/total)'],
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

  XLSX.utils.book_append_sheet(wb, wsProd, 'Produtos');

  // ── Sheet 5: "Capabilidades" ──
  type CapEntryFull = { name: string; subarea: string; coveredBy: string[]; n1: string; n2: string; n3: string; status: string; plannedYear: string };
  const capRows: any[][] = [
    ['Domínio', 'Gate', 'Subárea', 'ID (N4)', 'Funcionalidade (N4)', 'N1 — Processo', 'N2 — Eventos/Comportamento', 'N3 — Necessidade', 'Status', 'Ano Previsto', 'Coberto por (cap_keys)'],
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

  XLSX.utils.book_append_sheet(wb, wsCap, 'Capabilidades');

  // ── Sheet 6: "Req. por Nível" ──
  const reqRows: any[][] = [];

  reqRows.push(['RESUMO — Requerimentos por Gate (N4s: READY / Total)']);
  reqRows.push(['Domínio', 'L1 Total', 'L1 READY', 'L1 %', 'L2 Total', 'L2 READY', 'L2 %', 'L3 Total', 'L3 READY', 'L3 %', 'L4 Total', 'L4 READY', 'L4 %', 'Threshold']);
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
  reqRows.push(['NOTA: Para atingir um gate (L1→L4), o site precisa que ≥70% das N4s desse gate estejam cobertos pelos produtos instalados.']);
  reqRows.push(['O site score é o gate mínimo atingido em todos os domínios ativos (UT e SF excluídos).']);
  reqRows.push([]);

  const reqSummaryEnd = reqRows.length; // track where summary ends for styling

  for (const gate of ['L1', 'L2', 'L3', 'L4']) {
    reqRows.push([]);
    reqRows.push([`GATE ${gate} — Lista de Requerimentos`, '', '', '', '', '', '', '']);
    reqRows.push(['Domínio', 'Subárea', 'ID', 'Funcionalidade (N4)', 'N1 — Processo', 'Status', 'Ano Previsto', 'Coberto por (cap_keys)']);
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
    } else if (first === 'Domínio') {
      for (const col of ['A','B','C','D','E','F','G','H']) styleCell(wsReq, `${col}${row}`, S_HEADER_RO);
    } else {
      // data row: color status (col F = index 5)
      const status = rowData[5];
      if (status === 'READY') styleCell(wsReq, `F${row}`, S_READY);
      else if (status === 'NOT READY') styleCell(wsReq, `F${row}`, S_NOT_READY);
    }
  }

  XLSX.utils.book_append_sheet(wb, wsReq, 'Req. por Nível');

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
  XLSX.utils.book_append_sheet(wb, wsRules, 'Regras de Nível');

  XLSX.writeFile(wb, `rollout_editavel_${today}.xlsx`);
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
  rows.push(['REGRAS DE NÍVEL — Guia de Maturidade Digital  |  Coverage Dashboard AB InBev', '', '', '', '', '']);
  addMerge(0, 0, 0, 5);
  addStyle('A', 0, S_TITLE_MAIN);

  // ── ROW 1: Subtitle ──
  rows.push(['Este guia explica em linguagem de negócio o que cada nível significa e o que é necessário para avançar. Use em conjunto com a aba "Rollout" para planejar a evolução de cada site.', '', '', '', '', '']);
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
  rows.push(['SEÇÃO 1 — O QUE SIGNIFICA CADA NÍVEL?', '', '', '', '', '']);
  const sec1Row = rows.length - 1;
  addMerge(sec1Row, 0, sec1Row, 5);
  addStyle('A', sec1Row, S_SECTION_HDR);

  const generalDefs: [string, string, string, string, string, string][] = [
    [
      'Situação do site',
      'Nenhum sistema digital cobre as operações principais. Dados em papel ou planilhas isoladas.',
      'Pelo menos um sistema digital está em operação cobrindo as funções essenciais de cada domínio.',
      'Sistemas integrados e conectados. Dados fluem entre sistemas sem intervenção manual.',
      'Dados analisados automaticamente. O sistema detecta padrões, alerta desvios e sugere ações.',
      'Processos autônomos. O sistema decide e age com mínima intervenção humana.',
    ],
    [
      'Exemplo prático (Brewing)',
      'Controle de processo em papel. Receitas em cadernos. Sem rastreabilidade digital.',
      'Sistema registra ordens de produção, parâmetros de receita e downtime de forma digital.',
      'Sistema integra com sensores, puxa dados automaticamente e gera relatórios de performance.',
      'Algoritmos detectam desvios antes de impactar o produto e alertam o operador em tempo real.',
      'Sistema ajusta parâmetros automaticamente sem intervenção manual durante a brassagem.',
    ],
    [
      'Impacto esperado no OSE',
      'Base de referência (sem sistema)',
      '+2 a +5 pp OSE vs. L0 (quando VPO controlado)',
      '+5 a +10 pp OSE vs. L1',
      '+10 a +15 pp OSE vs. L2 (projeção)',
      '+15 pp+ OSE vs. L3 (projeção)',
    ],
    [
      'O que precisa instalar',
      '—',
      'Produto global ou legado cobrindo ≥70% das funcionalidades básicas (gate L1) do domínio.',
      'Produtos cobrindo ≥70% do gate L2. Normalmente requer expansão de módulos ou integração.',
      'Módulos avançados de analytics, modelos preditivos ou automação cobrindo ≥70% do gate L3.',
      'Automação completa e IA operacional cobrindo ≥70% do gate L4.',
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
  rows.push(['COMO O SCORE DO SITE É CALCULADO', '', '', '', '', '']);
  const calcRow = rows.length - 1;
  addMerge(calcRow, 0, calcRow, 5);
  addStyle('A', calcRow, S_SECTION_HDR);

  const calcRules = [
    ['Regra 1 — Cumulativo', 'Para ser L2, o site precisa ter passado L1 primeiro. Para L3, precisa ter passado L1 e L2. O score avança gate a gate.'],
    ['Regra 2 — Threshold 70%', 'Dentro de cada gate (L1, L2, L3, L4), o site precisa que ≥70% das funcionalidades (N4s) estejam cobertas pelos produtos instalados.'],
    ['Regra 3 — Mínimo entre domínios', 'O score final do SITE é o menor score entre todos os domínios ativos. Se BP=L2, MT=L1, MG=L2: site score = L1 (gargalo no Maintenance).'],
    ['Regra 4 — Domínios excluídos', 'UT (Utilities) e SF (Safety) NÃO entram no cálculo do site score. São monitorados mas não penalizam o site enquanto os dados estiverem incompletos.'],
    ['Regra 5 — Produto global vs. legado', 'Tanto produtos Global (G) quanto Legado (L) contribuem para o score. Legado prevalece sobre Global no mesmo domínio. Ambos contam.'],
    ['Regra 6 — Cross-domain', 'Produtos instalados em um domínio podem cobrir funcionalidades de outro. Ex: Omnia BMS instalado em BP pode cobrir N4s de DA automaticamente.'],
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
  rows.push(['⚠ ATENÇÃO: Muitos sites aparecem como L0 não por falta de sistema, mas porque o produto instalado ainda não está mapeado na base de capabilidades. Reporte ao time de Coverage se suspeitar disso.', '', '', '', '', '']);
  addMerge(noteRowIdx, 0, noteRowIdx, 5);
  addStyle('A', noteRowIdx, S_NOTE_ROW);

  // ══════════════════════════════════════════════════════════════
  // SECTION 2: Por Domínio
  // ══════════════════════════════════════════════════════════════
  rows.push(['', '', '', '', '', '']);
  rows.push(['SEÇÃO 2 — REGRAS POR DOMÍNIO', '', '', '', '', '']);
  const sec2Row = rows.length - 1;
  addMerge(sec2Row, 0, sec2Row, 5);
  addStyle('A', sec2Row, S_SECTION_HDR);

  rows.push(['Cada domínio tem suas próprias funcionalidades (N4s) por gate. Abaixo o significado de cada nível em linguagem de negócio, e o que precisa ser implementado para avançar.', '', '', '', '', '']);
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
        'Nenhum sistema digital para monitoramento de brassagem. Controle por papel, planilha ou sistema local sem integração.',
        'Sistema digital registra parâmetros de receita, categoriza downtime e gerencia ordens de produção. Operador consegue abrir, editar e fechar ordens digitalmente.',
        'Sistema integrado monitora todas as etapas da brassagem (brewhouse, fermentação, filtração, adega). Performance calculada automaticamente. Relatórios diários sem intervenção manual.',
        'Análise preditiva identifica desvios antes que impactem o produto. Benchmarking automático entre plantas. Recomendações baseadas em dados históricos.',
        'Ajuste automático de parâmetros durante a brassagem. Decisões de processo sem intervenção humana. Receitas auto-otimizadas.',
      ],
      actions: [
        'Instalar Omnia BMS, Traksys ou LMS configurados para sua planta. Ativar módulos de receita, categorização de downtime e gestão de ordens.',
        'Expandir para módulos de fermentação, filtração e adega. Configurar integração com instrumentação da planta. Ativar relatórios de performance automáticos.',
        'Ativar módulos de analytics e benchmarking. Integrar com modelos estatísticos de controle de processo (SPC). Conectar dados históricos para análise de tendências.',
        'Implementar loops de controle automático. Integrar com sistemas de automação (PLC/SCADA) para ajuste de parâmetros sem intervenção manual.',
      ],
      products: 'Omnia BMS · Traksys · LMS (Brew) · APAC BMS',
    },
    {
      code: 'DA', name: 'Data Acquisition', emoji: '📡',
      levels: [
        'Dados de processo não são coletados digitalmente ou ficam isolados em sistemas sem integração.',
        'Sistema coleta dados de processo de forma digital e os disponibiliza para consulta. Operadores conseguem visualizar dados históricos básicos.',
        'Coleta automatizada de múltiplas fontes. Dados normalizados e disponíveis em tempo real para outros sistemas. Pipeline de dados funcional e monitorado.',
        'Dados validados automaticamente. Anomalias detectadas e sinalizadas. Governança de dados estabelecida com rastreabilidade completa.',
        'Ecossistema de dados totalmente autônomo. Coleta, validação e distribuição sem intervenção humana. Auto-healing de falhas de pipeline.',
      ],
      actions: [
        'Instalar SODA ETL ou BMS Connect. Configurar conectores para os equipamentos principais da planta.',
        'Ampliar cobertura de sensores e fontes. Configurar pipeline normalizado com validação de qualidade de dados.',
        'Implementar monitoramento de pipeline, alertas de falha e dashboards de qualidade de dados. Documentar fontes e transformações.',
        'Configurar auto-detecção de anomalias e recuperação automática de falhas no pipeline.',
      ],
      products: 'SODA ETL · BMS Connect · Omnia Connect · PI System',
    },
    {
      code: 'MT', name: 'Maintenance', emoji: '🔧',
      levels: [
        'Sem sistema de gestão de manutenção. Ordens em papel, histórico de falhas inexistente ou em planilhas.',
        'Sistema digital para criação, aprovação e fechamento de ordens de trabalho. Histórico de manutenção registrado. Técnicos conseguem consultar equipamentos.',
        'Planejamento de manutenção preventiva integrado. KPIs de manutenção calculados automaticamente (MTBF, MTTR, backlog). Integração com operações para coordenação.',
        'Manutenção preditiva baseada em dados de condição. Ordens geradas automaticamente por triggers de condição. Priorização inteligente do backlog.',
        'Manutenção autônoma. Sistema decide quando e o que manter com base em modelos de vida útil e dados operacionais em tempo real.',
      ],
      actions: [
        'Implantar SAP PM, MAX WO ou similar. Configurar estrutura de equipamentos (functional locations). Treinar equipe de manutenção.',
        'Ativar módulos de planejamento PM. Configurar KPIs e dashboards. Integrar com operações para coordenação de paradas.',
        'Implementar sensores de condição nos equipamentos críticos. Configurar modelos de manutenção preditiva. Ativar priorização automática.',
        'Integrar completamente com sistemas de automação e condição. Configurar loops de decisão autônoma para equipamentos estratégicos.',
      ],
      products: 'SAP PM · MAX WO · Omnia Maintenance · IBM Maximo',
    },
    {
      code: 'MG', name: 'Management', emoji: '📊',
      levels: [
        'Rotinas de gestão em papel ou e-mail. Sem sistema de acompanhamento de ações ou performance.',
        'Reuniões de gestão com registro digital. Ações rastreadas digitalmente com responsável e prazo. Performance básica monitorada em dashboard.',
        'Rotinas de gestão conectadas com dados operacionais em tempo real. VPO digital integrado. Performance atualizada automaticamente sem preparação manual.',
        'IA identifica correlações entre gestão e performance. Recomendações automáticas de foco. Benchmarking automático entre sites similares.',
        'Gestão autônoma. Agenda de reuniões, pauta e ações priorizadas automaticamente com base em dados e benchmarks globais.',
      ],
      actions: [
        'Implantar Omnia Interact, One2Five ou SPlan. Configurar estrutura de reuniões e templates de ação.',
        'Integrar com dados operacionais (OSE, downtime). Configurar dashboards de performance em tempo real.',
        'Ativar módulos de analytics e benchmarking. Conectar com dados de múltiplos sites para comparação.',
        'Implementar recomendações automáticas baseadas em IA. Configurar priorização inteligente de agenda.',
      ],
      products: 'Omnia Interact · One2Five · SPlan · InteractionLog',
    },
    {
      code: 'MDM', name: 'MasterData Management', emoji: '🗂️',
      levels: [
        'Sem gestão centralizada de master data. Códigos de materiais, equipamentos e produtos inconsistentes entre sistemas.',
        'Sistema centralizado de master data. Código único de materiais e equipamentos. Sincronização básica entre sistemas.',
        'Master data integrado e sincronizado automaticamente entre todos os sistemas da planta. Mudanças propagadas sem intervenção manual.',
        'Governança automatizada de master data. Detecção e resolução de duplicidades. Qualidade de dados monitorada continuamente.',
        'Master data autônomo. Criação, atualização e inativação de registros sem intervenção humana baseada em regras de negócio.',
      ],
      actions: [
        'Instalar Omnia MDM ou SAP MDM. Criar estrutura de materiais e equipamentos padronizada.',
        'Configurar sincronização automática com sistemas ERP e operacionais. Estabelecer processos de governança.',
        'Implementar detecção automática de duplicidades e alertas de qualidade de dados.',
        'Configurar workflows automáticos para ciclo de vida de master data.',
      ],
      products: 'Omnia MDM · SAP MDM · Golden Record',
    },
    {
      code: 'PP', name: 'Packaging Performance', emoji: '📦',
      levels: [
        'Sem monitoramento digital das linhas de envase. Performance calculada manualmente ou não calculada.',
        'Sistema registra produção e downtime das linhas de envase. OEE básico calculado. Categorização de paradas digital.',
        'Performance de todas as linhas monitorada em tempo real. Integração com equipamentos. Relatórios automáticos por turno e dia.',
        'Análise preditiva identifica padrões de falha nas linhas. Benchmarking automático entre linhas e plantas. Otimização de schedule sugerida.',
        'Linhas auto-otimizadas. Sistema ajusta velocidade, planejamento de paradas e sequência de produção automaticamente.',
      ],
      actions: [
        'Instalar LMS, Traksys ou APAC Line View nas linhas principais. Configurar categorização de downtime.',
        'Expandir para todas as linhas. Configurar integração com PLCs e equipamentos. Ativar cálculo automático de OEE.',
        'Implementar analytics de padrões de falha. Conectar dados históricos para modelos preditivos.',
        'Configurar otimização automática de parâmetros de linha com base em performance histórica.',
      ],
      products: 'LMS · Traksys · APAC Line View · Omnia Packaging',
    },
    {
      code: 'QL', name: 'Quality', emoji: '✅',
      levels: [
        'Controle de qualidade em papel ou planilha local. Sem rastreabilidade digital do produto.',
        'Sistema registra resultados de análises de qualidade digitalmente. Especificações armazenadas no sistema. Rastreabilidade básica do lote.',
        'Qualidade integrada com processo. Resultados alimentam automaticamente relatórios de tendência. Não-conformidades gerenciadas digitalmente.',
        'Análise preditiva identifica desvios de qualidade antes da liberação. Sistema sugere ações corretivas baseado em histórico.',
        'Controle de qualidade autônomo. Decisões de liberação/rejeição automáticas com base em modelos de qualidade.',
      ],
      actions: [
        'Instalar eQMS, LIMS ou Omnia Quality. Configurar especificações e planos de amostragem.',
        'Integrar com dados de processo para correlação qualidade-processo. Configurar gerenciamento de não-conformidades.',
        'Implementar análise de tendências e alertas preditivos de qualidade.',
        'Configurar modelos de decisão automática para liberação de produto.',
      ],
      products: 'eQMS · LIMS · Omnia Quality · SAP QM',
    },
    {
      code: 'SF', name: 'Safety', emoji: '⛑️',
      levels: [
        'Registros de segurança em papel. Sem rastreabilidade digital de incidentes ou permissões de trabalho.',
        'Incidentes e quase-acidentes registrados digitalmente. Permissões de trabalho digitais. Treinamentos rastreados.',
        'Sistema integrado com operações. Permissões vinculadas a ordens de manutenção. Análise de incidentes automatizada.',
        'Análise preditiva de riscos. Sistema identifica condições de risco antes de incidentes. Recomendações proativas.',
        'Gestão de segurança autônoma com análise de risco em tempo real e alertas automáticos para condições perigosas.',
      ],
      actions: [
        'Instalar Credit 360 ou Guardian. Configurar registro digital de incidentes e permissões.',
        'Integrar com SAP PM para vincular permissões de trabalho a ordens. Configurar análise de causa raiz.',
        'Implementar análise preditiva de risco com base em histórico de incidentes.',
        'Configurar alertas automáticos e protocolos de resposta baseados em IA.',
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
    rows.push([`Produtos que contribuem para este domínio: ${dom.products}`, '', '', '', '', '']);
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
    rows.push(['O que significa', ...dom.levels] as any[]);
    addStyle('A', meaningIdx, S_RULE_KEY);
    for (const [ci, lv] of [[1,0],[2,1],[3,2],[4,3],[5,4]] as [number,number][]) {
      addStyle(colLetter(ci), meaningIdx, S_L_BODY[lv]);
    }

    // Arrow row: what to do to advance
    const arrowIdx = rows.length;
    rows.push(['Como avançar', '↑ para L1:', '↑ para L2:', '↑ para L3:', '↑ para L4:', '—']);
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
  rows.push(['📌 Para ver as funcionalidades técnicas (N4s) que compõem cada gate, consulte a aba "Req. por Nível". Para o plano de rollout e produtos por site, use a aba "Rollout".', '', '', '', '', '']);
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
  // Accept either "Guia" (V2) or "Instruções" (V1) as the guide sheet
  const guideSheet = workbook.Sheets['Guia'] ?? workbook.Sheets['Instruções'];
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
  if (!ws) throw new Error('Planilha "Rollout" não encontrada.');

  const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (rawRows.length < 2) throw new Error('Planilha "Rollout" está vazia.');

  // Find column indices from header row (strip "← EDITAR" suffixes)
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
    throw new Error('Colunas obrigatórias não encontradas ("Site", "Código", "Produto"). Verifique se o arquivo é um Rollout Editável válido.');
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
