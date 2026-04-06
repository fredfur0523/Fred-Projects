# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What this project is

Dashboard React/TypeScript tracking **digital product maturity** (L0–L4) across AB InBev Global Manufacturing sites, zones, and domains. It serves two purposes:

1. **Operational visualization** — L0–L4 funnel by zone, domain, site; volume filters; Global vs Legacy product indicators.
2. **Analytical base** — same data used by the Analysis Crew for Tech × KPI impact analyses (OSE, TTP, TPE, TEL, CO2).

---

## Commands

```bash
npm run dev      # dev server with hot reload (port 5000)
npm run build    # production build → dist/public/
npm run check    # TypeScript type-check only
npm start        # serve production build
```

**No test suite** — validate changes with `npm run build` (TypeScript errors catch most issues).

---

## Data pipeline (full update sequence)

When the source Excel (`docs/OneMES Readiness Consolidated.xlsx`) changes, run scripts in this order:

```bash
# 1. Assign gates to new capability rows (e.g. DA domain additions)
python scripts/suggest_da_gates.py          # fills L1/L2/L3/L4 columns in Excel

# 2. Regenerate N3/N4 maturity scores (→ docs/maturity_detail.json)
python scripts/generate_maturity_detail.py

# 3. Regenerate SITE_PRODUCT_MAP (→ scripts/output/site_product_map.ts)
python scripts/extract_site_products.py

# 4. Regenerate capability_detail (→ scripts/output/capability_detail.ts)
python scripts/generate_capability_detail.py
cp scripts/output/capability_detail.ts client/src/capability_detail.ts

# 5. Recalculate CSV_DATA scores (→ scripts/output/csv_data_block.ts)
python scripts/recalculate_csv_data.py

# 6. Embed updated constants into App.tsx — use Python replace, not paste:
python3 -c "
import json, re
app = 'client/src/App.tsx'
content = open(app).read()

# Replace CSV_DATA
csv_new = open('scripts/output/csv_data_block.ts').read()
content = re.sub(r'const CSV_DATA = \`[^\;]*\`;', csv_new, content, flags=re.DOTALL)

# Replace MATURITY_DETAIL
md = json.load(open('docs/maturity_detail.json'))
new_json = json.dumps(md, ensure_ascii=False, separators=(',', ':'))
content = re.sub(
    r'(const MATURITY_DETAIL: Record<string, MaturityDetailSite> = )(\{.*?\})(;)',
    lambda m: m.group(1) + new_json + m.group(3), content, flags=re.DOTALL)

# Replace SITE_PRODUCT_MAP (copy relevant block from site_product_map.ts manually)
open(app, 'w').write(content)
print('Done')
"

# 7. Build and verify
npm run build
```

**For Coverage data only** (site scores, no capability changes):
```bash
python scripts/update_csv_data.py        # extracts CSV_DATA from aba "Capabilities Readiness"
python scripts/extract_site_types.py     # extracts SITE_DOMAIN_TYPE from aba "Coverage global and legacy"
# Then paste outputs into App.tsx and run npm run build
```

---

## Architecture

### Single-file React app

`client/src/App.tsx` (~13,000+ lines) contains the entire application — intentionally monolithic. **Do not split into multiple files** without explicit instruction.

`client/src/capability_detail.ts` — generated file (~5,000+ lines), contains `CAPABILITY_DETAIL` and `PRODUCT_TO_CAP_KEYS`. Always regenerate via script, never edit manually.

### Major sections in App.tsx (by line approx.)

| Line | Section |
|------|---------|
| 1 | React import + `CAPABILITY_DETAIL` import from `./capability_detail` |
| 7 | `TRANSLATIONS` — all PT/EN strings |
| 786 | DATA — `DOMAINS`, `ZONES`, KPI codes, `ZONE_COLORS`, `GHQ_TOTALS`, `GLOBAL_STATS` |
| 936 | `SITE_PRODUCT_MAP` — site → domain → {products, type G/L, dominant, score, fracs} |
| 1220 | `MATURITY_DETAIL` type interfaces |
| 1262 | `MATURITY_DETAIL` inline JSON — 148 sites × 9 domains × 4 level fracs |
| 1429 | `CSV_DATA` inline CSV — 162 sites with zone/volume/domain scores/site score |
| 2472 | `FunnelLevel` / `FunnelMetrics` types + `calcFunnel()` |
| 2531 | `SiteTooltip` component |
| 2675 | `FunnelCard` component |
| 2771 | `SiteTable` component |
| 3302 | XLSX export (`loadXLSX`, `exportCurrentDataToExcel`) |
| 3442 | `Sidebar` component |
| 3565 | Maturity vs Results view (`MaturityResultsView`) |
| 7455 | Capability Gap view (`CapabilityGapView`) |
| 11261 | `App` root component — navigation, state, tab routing |

### Key data constants

| Constant | Source | Updated by |
|----------|--------|-----------|
| `SITE_DOMAIN_TYPE` | aba "Coverage global and legacy" | `extract_site_types.py` |
| `SITE_PRODUCT_MAP` | same aba + Capabilities | `extract_site_products.py` |
| `CSV_DATA` | computed scores | `recalculate_csv_data.py` |
| `MATURITY_DETAIL` | `docs/maturity_detail.json` | `generate_maturity_detail.py` |
| `CAPABILITY_DETAIL` | Capabilities Readiness aba | `generate_capability_detail.py` |

### Score computation pipeline

```
Excel "Capabilities Readiness"
  └─ generate_maturity_detail.py
       ├─ N4 weights: Functional=2.0, Operational=1.0, Admin=0.5
       ├─ N3 passes if: (weight of available N4s) / (total N4 weight) ≥ 40%
       ├─ Level passes if: (weight of passed N3s) / (total N3 weight) ≥ threshold
       │     L1≥60%, L2≥75%, L3≥85%, L4≥90%
       ├─ Level is "vacuous" (auto-pass) if no capabilities exist for that level
       │     ⚠ VACUOUS = TRUE means no caps loaded, not that caps were met
       └─ → docs/maturity_detail.json

docs/maturity_detail.json + SITE_PRODUCT_MAP scores
  └─ recalculate_csv_data.py
       ├─ site score = min of ALL non-UT, non-SF domain scores (including L0)
       └─ → scripts/output/csv_data_block.ts → CSV_DATA in App.tsx
```

**Critical**: if a domain has no capabilities in the Excel (e.g. gates not yet assigned), every level is vacuous → auto-pass → score=4. This is a data quality issue, not a real L4. After adding gates, regenerate both `maturity_detail.json` and `MATURITY_DETAIL` in App.tsx.

### Maturity levels

| Level | Score | AB InBev name |
|-------|-------|---------------|
| L0 | 0 | — (no digital foundation) |
| L1 | ≥1 | Digital Foundation |
| L2 | ≥2 | Connected Ops |
| L3 | ≥3 | Intelligent Ops |
| L4 | =4 | Touchless Ops |

**Funnel is cumulative**: L0 = 100% base always. Tooltips show sites with score EXACTLY equal to that level (exclusive). **Do not change this logic.**

Domains excluded from site score calculation: `UT` (levels not yet defined), `SF` (Credit 360 universal, not mapped in Coverage).

### Domains (9 codes)

`BP DA UT MT MG MDM PP QL SF` → Brewing Performance, Data Acquisition, Utilities, Maintenance, Management, MasterData Management, Packaging Performance, Quality, Safety.

### Global vs Legacy product classification

`GLOBAL_KEYS` (per domain) — the `coveredBy` keys that identify global products:
```typescript
BP: ['brewing performance','production order']   // Omnia BMS, BMS Prod.Order
DA: ['soda etl','soda vision','soda 1.0']
MT: ['apac - sap pm','eur - sap pm','maz - sap pm','naz - sap pm','saz - sap pm','max wo']
MG: ['acadia','eureka','ial','splan']
MDM: ['soda mdm']
PP: ['lms','traksys lms']
QL: ['sensory one','pts portal','tracegains']   // NOT lms/traksys — those are PP
SF: ['guardian']
```

`GLOBAL_KEYS` appears in **three places** in App.tsx — they must stay in sync:
1. Inside the compare tab IIFE (as `GK_LOCAL`, ~line 8900)
2. Inside the Methodology section (as `GLOBAL_KEYS`, ~line 10784)
3. Inside the Capability Gap view (~line 9976)

**Legacy prevalence rule**: when a site has both Global + Legacy in the same domain, `type='L'` (Legacy). `getSiteDomainType()` implements this. **Do not change.**

---

## Non-obvious technical decisions

### Tooltip positioning
`SiteTooltip` uses `ReactDOM.createPortal` + `position: fixed`. Position is computed from `getBoundingClientRect()` only. **Never add `window.scrollY`** — fixed positioning is viewport-relative.

### CDN libraries (not in package.json)
SheetJS (`xlsx-js-style`) and `html2pdf.js` are injected as `<script>` tags on demand when the user triggers export. Changing the CDN URL in `loadXLSX()` switches the library version.

### Tab routing
Top-level tabs (`viewMode` state): `overview`, `maturity`, `sites`, `analysis`, `portfolio`, `methodology`, `data`.  
Sub-tabs inside "Visão Geral" (`activeSection` state): `funnel`, `map`, `compare`, `methodology`.

The Global × Zone compare tab (`activeSection==='compare'`) has:
- `compareDom` state — selected domain, defaults to `'BP'`; `'ALL'` shows summary grid
- `compareZoneFilter` state — zone pill filter (`null` = all zones)
- `expandedN3s` state (Set<string>) — collapsed/expanded N3 groups in capability trees

### Data consistency pattern
When any domain's capability data changes in the Excel:
1. Verify no vacuous-pass inflation by inspecting `maturity_detail.json` for `n4_total: 0`
2. Regenerate both `MATURITY_DETAIL` (raw level fracs) and `CSV_DATA` (site scores) — they are separate constants and both need updating

---

## Colors

```typescript
// Maturity levels
L0: '#D1D5DB'  L1: '#FFE066'  L2: '#FFC000'  L3: '#F59E0B'  L4: '#10B981'

// Zones (dot color from ZONE_COLORS[zone].dot)
AFR: '#D97706'  SAZ: '#059669'  MAZ: '#2563EB'
NAZ: '#7C3AED'  EUR: '#DB2777'  APAC: '#EA580C'
```

---

## Analytical context

### Score max observed
~2.6 across all plants — L3/L4 are mathematical extrapolations, not observed states.

### KPIs tracked
| KPI | Anaplan code | Unit |
|-----|-------------|------|
| OSE | PG-K4038 | % (higher = better) |
| TTP | PG-K0412 | hL/h (higher = better) |
| EPT | PG-R0060 | % |
| OST | PG-K4039 | % |

Anaplan `periodtype: "MTH"` = monthly value; `"YTD"` + `month: "Dec"` = annual cumulative. **Never mix in the same series.**

### Key confounders
- **APAC India L0**: plants like Aurangabad/Mysore/Sonipat have L0 score but high OSE (82–87%) — new plants with 1–2 SKUs, not a tech comparison.
- **EUR L1**: Magor/Leuven/Bremen have L1 score but poor KPIs — driven by VPO BASIC/INT concentration + structural process instability, not technology.
- **Analytically valid transition**: L1→L2 (larger N, less confounded than L0→L1).

---

## Restrictions

- `shared/schema.ts` and `server/routes.ts` are unused scaffolding — do not develop.
- `docs/` contains Analysis Crew HTML outputs — read-only reference.
- Volume groups: G1 < 2M hL, G2 2–6M hL, G3 > 6M hL.
