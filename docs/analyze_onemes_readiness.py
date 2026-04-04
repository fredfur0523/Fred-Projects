"""
analyze_onemes_readiness.py
----------------------------
Reads "OneMES Readiness Consolidated.xlsx" and generates a self-contained HTML
dashboard showing:
  1. Global platform readiness funnel (L0→L4) aggregated by domain
  2. Delivery roadmap for NOT READY capabilities
  3. Legacy system coverage per zone vs global delivery
  4. Gap analysis: what legacy covers that global doesn't (and vice versa)

Usage:
    python docs/analyze_onemes_readiness.py
Output:
    docs/onemes_readiness_dashboard.html
"""

import json
import sys
from collections import defaultdict
from pathlib import Path

try:
    import openpyxl
    from openpyxl.utils import column_index_from_string
except ImportError:
    sys.exit("openpyxl not found. Run: pip install openpyxl")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

FILE_PATH = Path(__file__).parent / "OneMES Readiness Consolidated.xlsx"
SHEET = "Capabilities Readiness"
OUT_PATH = Path(__file__).parent / "onemes_readiness_dashboard.html"

LEVEL_COLS = {"L1": "M", "L2": "N", "L3": "O", "L4": "P"}
STATUS_COL = "Q"   # READY / NOT READY / IN PROGRESS
YEAR_COL   = "R"   # planned delivery year
DOMAIN_COL = "D"
PRODUCT_COL = "E"
FUNC_COL   = "J"   # N4 - Functionality

ZONE_CONFIG = {
    "AFR": {
        "consolidated": "AB",
        "legacy": {
            "T":  "Traksys",
            "U":  "IAL PT",
            "V":  "HSEC",
            "W":  "Credit360",
            "X":  "SAP PM",
            "Y":  "Flow",
            "Z":  "MMIS",
            "AA": "Digital Brewsheets",
        },
    },
    "APAC": {
        "consolidated": "AM",
        "legacy": {
            "AC": "LIMS China",
            "AD": "NCM",
            "AE": "India/V/K",
            "AF": "DST",
            "AG": "Data Factory",
            "AH": "Line view",
            "AI": "SAP PM",
            "AJ": "DVPO",
            "AK": "EMS",
            "AL": "Lifecycle",
        },
    },
    "SAZ": {
        "consolidated": "AX",
        "legacy": {
            "AN": "Athena",
            "AO": "LMS",
            "AP": "SAP PM",
            "AQ": "Ceres",
            "AR": "Argos",
            "AS": "Smartcheck",
            "AT": "Growler",
            "AU": "Soda 1.0",
            "AV": "Oraculo",
            "AW": "Soda Vision",
        },
    },
    "NAZ": {
        "consolidated": "BL",
        "legacy": {
            "AY": "PTA",
            "AZ": "FLEX",
            "BA": "IMS",
            "BB": "EIT",
            "BC": "LIMS",
            "BD": "BIER/recipe app",
            "BE": "CA PowerBI/Excel",
            "BF": "US PowerBI/Excel",
            "BG": "BPA",
            "BH": "SAP PM",
            "BI": "Safety Apps",
            "BJ": "TRAKSYS LMS",
            "BK": "PG13/14",
        },
    },
    "MAZ": {
        "consolidated": "BQ",
        "legacy": {
            "BM": "Traksys CORE",
            "BN": "Mangyver",
            "BO": "Suite 360",
            "BP": "Safety Portal",
        },
    },
    "EUR": {
        "consolidated": "BY",
        "legacy": {
            "BR": "SIGMA",
            "BS": "LMS Live view",
            "BT": "Digital Operator Workstation",
            "BU": "EUR data collection BBX",
            "BV": "InterAction Log",
            "BW": "LPA Digital ecosystem",
            "BX": "Excel",
        },
    },
}

ZONES = list(ZONE_CONFIG.keys())

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def col_idx(letter: str) -> int:
    """Return 0-based column index from Excel letter (A=0, B=1, …)."""
    return column_index_from_string(letter) - 1


def is_ready(val) -> bool:
    if val is None:
        return False
    return str(val).strip().upper() == "READY"


def has_level_mark(val) -> bool:
    if val is None:
        return False
    s = str(val).strip()
    return s != "" and s != "None"


def is_covered(val) -> bool:
    """Legacy system covers this capability (Must Have or Nice to Have)."""
    if val is None:
        return False
    s = str(val).strip().lower()
    return s in ("must have", "nice to have")


def safe_year(val):
    if val is None:
        return None
    try:
        y = int(val)
        return y if 2020 <= y <= 2035 else None
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------------

def load_data():
    wb = openpyxl.load_workbook(FILE_PATH, read_only=True, data_only=True)
    ws = wb[SHEET]

    # Pre-compute column indices
    lvl_idx  = {lvl: col_idx(col) for lvl, col in LEVEL_COLS.items()}
    stat_idx = col_idx(STATUS_COL)
    year_idx = col_idx(YEAR_COL)
    dom_idx  = col_idx(DOMAIN_COL)
    prod_idx = col_idx(PRODUCT_COL)
    func_idx = col_idx(FUNC_COL)

    zone_con_idx   = {z: col_idx(cfg["consolidated"]) for z, cfg in ZONE_CONFIG.items()}
    zone_leg_idx   = {
        z: {col_idx(col): name for col, name in cfg["legacy"].items()}
        for z, cfg in ZONE_CONFIG.items()
    }

    capabilities = []
    max_col = max(
        max(zone_con_idx.values()),
        max(idx for z_map in zone_leg_idx.values() for idx in z_map.keys()),
    ) + 1

    for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        if len(row) < max_col:
            row = list(row) + [None] * (max_col - len(row))

        domain   = str(row[dom_idx]).strip() if row[dom_idx] else None
        product  = str(row[prod_idx]).strip() if row[prod_idx] else None
        func     = str(row[func_idx]).strip() if row[func_idx] else None

        if not domain or domain == "None":
            continue

        levels = [lvl for lvl, idx in lvl_idx.items() if has_level_mark(row[idx])]
        ready  = is_ready(row[stat_idx])
        status_raw = str(row[stat_idx]).strip() if row[stat_idx] else "UNKNOWN"
        year   = safe_year(row[year_idx])

        zone_cov = {}
        for zone in ZONES:
            con_val = row[zone_con_idx[zone]]
            zone_requires = is_covered(con_val)

            legacy_systems = []
            for leg_idx, leg_name in zone_leg_idx[zone].items():
                if is_covered(row[leg_idx]):
                    legacy_systems.append(leg_name)

            zone_cov[zone] = {
                "zone_requires": zone_requires,
                "legacy_systems": legacy_systems,
                "any_legacy_covers": len(legacy_systems) > 0,
            }

        capabilities.append({
            "domain":     domain,
            "product":    product,
            "func":       func,
            "levels":     levels,
            "is_ready":   ready,
            "status_raw": status_raw,
            "year":       year,
            "zone_cov":   zone_cov,
        })

    wb.close()
    return capabilities


# ---------------------------------------------------------------------------
# Aggregation
# ---------------------------------------------------------------------------

def aggregate(capabilities):
    domains = sorted(set(c["domain"] for c in capabilities))

    # domain_summary[domain] = { 'by_level': {...}, 'zones': {...}, 'capabilities': [...] }
    domain_summary = {}

    for domain in domains:
        caps = [c for c in capabilities if c["domain"] == domain]

        # --- by_level ---
        by_level = {}
        for lvl in ["L0", "L1", "L2", "L3", "L4"]:
            if lvl == "L0":
                bucket = [c for c in caps if not c["levels"]]
            else:
                bucket = [c for c in caps if lvl in c["levels"]]

            ready_caps    = [c for c in bucket if c["is_ready"]]
            not_ready_caps = [c for c in bucket if not c["is_ready"]]

            roadmap = defaultdict(int)
            for c in not_ready_caps:
                key = str(c["year"]) if c["year"] else "No date"
                roadmap[key] += 1

            by_level[lvl] = {
                "total":     len(bucket),
                "ready":     len(ready_caps),
                "not_ready": len(not_ready_caps),
                "roadmap":   dict(sorted(roadmap.items())),
            }

        # --- zones ---
        zones_data = {}
        for zone in ZONES:
            required     = [c for c in caps if c["zone_cov"][zone]["zone_requires"]]
            cov_by_leg   = [c for c in required if c["zone_cov"][zone]["any_legacy_covers"]]
            glob_ready   = [c for c in required if c["is_ready"]]
            only_legacy  = [c for c in required if c["zone_cov"][zone]["any_legacy_covers"] and not c["is_ready"]]
            only_global  = [c for c in required if c["is_ready"] and not c["zone_cov"][zone]["any_legacy_covers"]]
            neither      = [c for c in required if not c["is_ready"] and not c["zone_cov"][zone]["any_legacy_covers"]]

            # legacy breakdown
            leg_counter = defaultdict(int)
            for c in required:
                for sys_name in c["zone_cov"][zone]["legacy_systems"]:
                    leg_counter[sys_name] += 1

            zones_data[zone] = {
                "total_required":   len(required),
                "covered_by_legacy": len(cov_by_leg),
                "global_ready":     len(glob_ready),
                "only_legacy":      len(only_legacy),
                "only_global":      len(only_global),
                "neither":          len(neither),
                "legacy_breakdown": dict(sorted(leg_counter.items(), key=lambda x: -x[1])),
                "only_legacy_caps": [
                    {"func": c["func"], "product": c["product"], "year": c["year"],
                     "systems": c["zone_cov"][zone]["legacy_systems"]}
                    for c in only_legacy
                ][:50],  # cap list for HTML
                "only_global_caps": [
                    {"func": c["func"], "product": c["product"]}
                    for c in only_global
                ][:50],
            }

        # capability list for drill-down (capped at 500)
        cap_list = [
            {
                "func":    c["func"] or "",
                "product": c["product"] or "",
                "levels":  c["levels"],
                "ready":   c["is_ready"],
                "status":  c["status_raw"],
                "year":    c["year"],
                "zones":   {
                    z: {
                        "req": c["zone_cov"][z]["zone_requires"],
                        "leg": c["zone_cov"][z]["legacy_systems"],
                    }
                    for z in ZONES
                },
            }
            for c in caps
        ]

        domain_summary[domain] = {
            "total":    len(caps),
            "ready":    sum(1 for c in caps if c["is_ready"]),
            "by_level": by_level,
            "zones":    zones_data,
            "capabilities": cap_list,
        }

    # --- global totals ---
    total   = len(capabilities)
    ready   = sum(1 for c in capabilities if c["is_ready"])
    roadmap_global = defaultdict(int)
    for c in capabilities:
        if not c["is_ready"]:
            key = str(c["year"]) if c["year"] else "No date"
            roadmap_global[key] += 1

    return {
        "domains":       domains,
        "domain_summary": domain_summary,
        "total":         total,
        "ready":         ready,
        "roadmap_global": dict(sorted(roadmap_global.items())),
        "zones":         ZONES,
        "zone_systems":  {
            z: list(cfg["legacy"].values())
            for z, cfg in ZONE_CONFIG.items()
        },
    }


# ---------------------------------------------------------------------------
# HTML generation
# ---------------------------------------------------------------------------

HTML_TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>OneMES Readiness Dashboard</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh}
.page{max-width:1400px;margin:0 auto;padding:24px}
h1{font-size:1.6rem;font-weight:700;color:#f1f5f9;margin-bottom:4px}
.subtitle{color:#94a3b8;font-size:.9rem;margin-bottom:24px}
.kpi-row{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px}
.kpi{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:16px 20px;min-width:160px}
.kpi-val{font-size:2rem;font-weight:700;color:#38bdf8}
.kpi-label{font-size:.8rem;color:#94a3b8;margin-top:4px}
.section{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;margin-bottom:24px}
.section-title{font-size:1.1rem;font-weight:600;color:#f1f5f9;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.section-title .badge{font-size:.75rem;background:#0ea5e9;color:#fff;padding:2px 8px;border-radius:20px}
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
.tab{padding:6px 14px;border-radius:20px;border:1px solid #334155;background:#0f172a;color:#94a3b8;cursor:pointer;font-size:.82rem;transition:all .15s}
.tab:hover{border-color:#38bdf8;color:#38bdf8}
.tab.active{background:#0ea5e9;color:#fff;border-color:#0ea5e9}
canvas{max-height:420px}
table{width:100%;border-collapse:collapse;font-size:.83rem}
th{background:#0f172a;color:#94a3b8;padding:8px 12px;text-align:left;border-bottom:1px solid #334155;position:sticky;top:0}
td{padding:8px 12px;border-bottom:1px solid #1e293b;vertical-align:top}
tr:hover td{background:#243044}
.pill{display:inline-block;padding:2px 8px;border-radius:12px;font-size:.75rem;font-weight:600}
.pill-green{background:#064e3b;color:#34d399}
.pill-red{background:#450a0a;color:#f87171}
.pill-yellow{background:#422006;color:#fcd34d}
.pill-gray{background:#1e293b;color:#64748b;border:1px solid #334155}
.level-chip{display:inline-block;padding:1px 6px;border-radius:4px;font-size:.72rem;font-weight:700;margin-right:2px}
.l1{background:#1e40af;color:#93c5fd}
.l2{background:#6b21a8;color:#d8b4fe}
.l3{background:#92400e;color:#fcd34d}
.l4{background:#065f46;color:#6ee7b7}
.l0{background:#374151;color:#9ca3af}
.bar-wrap{background:#0f172a;border-radius:6px;overflow:hidden;height:8px;min-width:80px}
.bar-inner{height:100%;border-radius:6px;background:#22c55e}
.zone-tag{display:inline-block;padding:1px 5px;border-radius:4px;font-size:.7rem;font-weight:600;margin:1px}
.afr{background:#78350f;color:#fcd34d}
.apac{background:#164e63;color:#67e8f9}
.saz{background:#14532d;color:#86efac}
.naz{background:#3730a3;color:#a5b4fc}
.maz{background:#701a75;color:#f0abfc}
.eur{background:#831843;color:#fda4af}
.detail-panel{display:none;margin-top:16px;background:#0f172a;border-radius:8px;border:1px solid #334155;max-height:480px;overflow-y:auto}
.detail-panel.open{display:block}
.detail-row{padding:8px 12px;border-bottom:1px solid #1a2744;display:flex;gap:16px;align-items:start;font-size:.82rem}
.detail-row:hover{background:#111d35}
.detail-func{flex:1;color:#e2e8f0}
.detail-meta{color:#64748b;font-size:.75rem;white-space:nowrap}
.scroll-table{max-height:460px;overflow-y:auto;border-radius:8px;border:1px solid #334155}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:768px){.grid2{grid-template-columns:1fr}}
.legend-row{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;font-size:.8rem}
.legend-item{display:flex;align-items:center;gap:6px}
.legend-dot{width:12px;height:12px;border-radius:3px}
</style>
</head>
<body>
<div class="page">
  <h1>OneMES Readiness Dashboard</h1>
  <p class="subtitle">Capabilities readiness by domain &amp; zone — Source: OneMES Readiness Consolidated.xlsx</p>

  <!-- KPI chips -->
  <div class="kpi-row" id="kpi-row"></div>

  <!-- Section 1: Funnel by domain -->
  <div class="section">
    <div class="section-title">Global Platform Readiness — L0 → L4 by Domain</div>
    <div class="tabs" id="funnel-tabs"></div>
    <canvas id="funnel-chart"></canvas>
    <div class="legend-row" id="funnel-legend"></div>
  </div>

  <!-- Section 2: Roadmap -->
  <div class="section">
    <div class="section-title">Delivery Roadmap <span class="badge">NOT READY capabilities by year</span></div>
    <canvas id="roadmap-chart"></canvas>
  </div>

  <!-- Section 3: Legacy coverage matrix -->
  <div class="section">
    <div class="section-title">Legacy Coverage vs Global Delivery — by Domain &amp; Zone</div>
    <div class="tabs" id="zone-tabs"></div>
    <div id="legacy-matrix-wrap"></div>
  </div>

  <!-- Section 4: Gap analysis -->
  <div class="section">
    <div class="section-title">Gap Analysis — Capabilities in Legacy but NOT in Global</div>
    <div class="tabs" id="gap-zone-tabs"></div>
    <div id="gap-table-wrap"></div>
  </div>

  <!-- Section 5: Domain drill-down -->
  <div class="section">
    <div class="section-title">Domain Drill-down <span class="badge">click domain tab</span></div>
    <div class="tabs" id="drill-tabs"></div>
    <div id="drill-panel"></div>
  </div>
</div>

<script>
const DATA = __DATA_PLACEHOLDER__;

const ZONES = DATA.zones;
const DOMAINS = DATA.domains;
const DS = DATA.domain_summary;
const LEVEL_COLORS = {
  L0: {ready:'#4b5563', notready:'#1f2937'},
  L1: {ready:'#1d4ed8', notready:'#1e3a5f'},
  L2: {ready:'#7c3aed', notready:'#3b1f69'},
  L3: {ready:'#d97706', notready:'#6b3a06'},
  L4: {ready:'#059669', notready:'#064e3b'},
};
const ZONE_COLORS = {AFR:'#d97706',APAC:'#0891b2',SAZ:'#16a34a',NAZ:'#4f46e5',MAZ:'#9333ea',EUR:'#db2777'};

// KPI chips
const kr = document.getElementById('kpi-row');
const pct = Math.round(DATA.ready/DATA.total*100);
kr.innerHTML = `
  <div class="kpi"><div class="kpi-val">${DATA.total}</div><div class="kpi-label">Total Capabilities</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#34d399">${DATA.ready}</div><div class="kpi-label">READY (Global)</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#f87171">${DATA.total-DATA.ready}</div><div class="kpi-label">NOT READY</div></div>
  <div class="kpi"><div class="kpi-val">${pct}%</div><div class="kpi-label">Global Readiness</div></div>
  <div class="kpi"><div class="kpi-val">${DOMAINS.length}</div><div class="kpi-label">Domains</div></div>
`;

// ---- Section 1: Funnel chart ----
let funnelChart;
const funnelTabs = document.getElementById('funnel-tabs');
const LEVELS = ['L0','L1','L2','L3','L4'];

function buildFunnelDatasets(domain) {
  const bl = DS[domain].by_level;
  const datasets = [];
  LEVELS.forEach(lvl => {
    const d = bl[lvl];
    datasets.push({
      label: `${lvl} Ready`,
      data: [d.ready],
      backgroundColor: LEVEL_COLORS[lvl].ready,
      stack: lvl,
    });
    datasets.push({
      label: `${lvl} Not Ready`,
      data: [d.not_ready],
      backgroundColor: LEVEL_COLORS[lvl].notready,
      stack: lvl,
    });
  });
  return datasets;
}

function renderFunnel(domain) {
  const bl = DS[domain].by_level;
  const labels = LEVELS.map(l => {
    const d = bl[l];
    return `${l} (${d.total})`;
  });
  if (funnelChart) funnelChart.destroy();
  funnelChart = new Chart(document.getElementById('funnel-chart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'READY',
          data: LEVELS.map(l => bl[l].ready),
          backgroundColor: LEVELS.map(l => LEVEL_COLORS[l].ready),
        },
        {
          label: 'NOT READY',
          data: LEVELS.map(l => bl[l].not_ready),
          backgroundColor: LEVELS.map(l => LEVEL_COLORS[l].notready),
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: {display:true, labels:{color:'#94a3b8'}},
        tooltip: {
          callbacks: {
            afterLabel: (ctx) => {
              const lvl = LEVELS[ctx.dataIndex];
              const d = bl[lvl];
              const pct = d.total ? Math.round(ctx.raw/d.total*100) : 0;
              const rm = d.roadmap;
              const rmStr = Object.entries(rm).map(([y,c])=>`${y}: ${c}`).join(', ');
              return [`${pct}% of ${d.total}`, rmStr ? `Roadmap → ${rmStr}` : ''];
            }
          }
        }
      },
      scales: {
        x: {stacked:true, ticks:{color:'#94a3b8'}, grid:{color:'#1e293b'}},
        y: {stacked:true, ticks:{color:'#e2e8f0'}, grid:{color:'#1e293b'}},
      }
    }
  });
}

DOMAINS.forEach((d,i) => {
  const t = document.createElement('button');
  t.className = 'tab' + (i===0?' active':'');
  t.textContent = d;
  t.onclick = () => {
    funnelTabs.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    renderFunnel(d);
  };
  funnelTabs.appendChild(t);
});
renderFunnel(DOMAINS[0]);

// ---- Section 2: Roadmap ----
(function() {
  const rm = DATA.roadmap_global;
  const years = Object.keys(rm).filter(y=>y!=='No date').sort();
  const noDate = rm['No date'] || 0;
  const domainColors = DOMAINS.map((_,i) => `hsl(${i*360/DOMAINS.length},60%,55%)`);

  // per-domain roadmap datasets
  const domainRmData = {};
  DOMAINS.forEach(d => {
    const bl = DS[d].by_level;
    const merged = {};
    LEVELS.forEach(l => {
      Object.entries(bl[l].roadmap || {}).forEach(([y,c]) => {
        if(y !== 'No date') merged[y] = (merged[y]||0)+c;
      });
    });
    domainRmData[d] = merged;
  });

  const datasets = DOMAINS.map((d,i) => ({
    label: d,
    data: years.map(y => domainRmData[d][y] || 0),
    backgroundColor: domainColors[i],
  }));

  new Chart(document.getElementById('roadmap-chart'), {
    type: 'bar',
    data: { labels: years, datasets },
    options: {
      responsive: true,
      plugins: {
        legend: {display:true, labels:{color:'#94a3b8', boxWidth:12}},
      },
      scales: {
        x: {stacked:true, ticks:{color:'#e2e8f0'}, grid:{color:'#1e293b'}},
        y: {stacked:true, ticks:{color:'#94a3b8'}, grid:{color:'#1e293b'},
            title:{display:true, text:'NOT READY Capabilities', color:'#64748b'}},
      }
    }
  });
})();

// ---- Section 3: Legacy coverage matrix ----
let activeZoneTab = ZONES[0];
const zoneTabs = document.getElementById('zone-tabs');

function renderLegacyMatrix(zone) {
  const wrap = document.getElementById('legacy-matrix-wrap');
  const rows = DOMAINS.map(domain => {
    const zd = DS[domain].zones[zone];
    const total = zd.total_required;
    const legPct = total ? Math.round(zd.covered_by_legacy/total*100) : 0;
    const globPct = total ? Math.round(zd.global_ready/total*100) : 0;
    const legBar = `<div class="bar-wrap"><div class="bar-inner" style="width:${legPct}%;background:#f59e0b"></div></div>`;
    const globBar = `<div class="bar-wrap"><div class="bar-inner" style="width:${globPct}%"></div></div>`;
    const onlyLeg = zd.only_legacy;
    const onlyGlob = zd.only_global;
    const badge = onlyLeg > 0 ? `<span class="pill pill-yellow">${onlyLeg} only legacy</span>` : '';
    const badge2 = onlyGlob > 0 ? `<span class="pill pill-green">${onlyGlob} only global</span>` : '';
    const legDetail = Object.entries(zd.legacy_breakdown).slice(0,5).map(([s,c])=>`${s}(${c})`).join(', ');
    return `<tr>
      <td>${domain}</td>
      <td>${total}</td>
      <td>${globBar} ${globPct}% (${zd.global_ready})</td>
      <td>${legBar} ${legPct}% (${zd.covered_by_legacy})</td>
      <td>${badge} ${badge2}</td>
      <td style="color:#64748b;font-size:.75rem">${legDetail}</td>
    </tr>`;
  });

  wrap.innerHTML = `<div class="scroll-table"><table>
    <thead><tr>
      <th>Domain</th><th>Zone Required</th><th>Global READY</th><th>Legacy Covers</th><th>Gaps</th><th>Top Legacy Systems</th>
    </tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table></div>`;
}

ZONES.forEach((z,i) => {
  const t = document.createElement('button');
  t.className = 'tab' + (i===0?' active':'');
  t.textContent = z;
  t.style.color = ZONE_COLORS[z];
  t.onclick = () => {
    zoneTabs.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    activeZoneTab = z;
    renderLegacyMatrix(z);
  };
  zoneTabs.appendChild(t);
});
renderLegacyMatrix(ZONES[0]);

// ---- Section 4: Gap analysis ----
let activeGapZone = ZONES[0];
const gapZoneTabs = document.getElementById('gap-zone-tabs');

function renderGapTable(zone) {
  const wrap = document.getElementById('gap-table-wrap');
  const rows = [];
  DOMAINS.forEach(domain => {
    const zd = DS[domain].zones[zone];
    if(!zd.only_legacy) return;
    zd.only_legacy_caps.forEach(cap => {
      const systems = cap.systems.map(s=>`<span class="pill pill-yellow">${s}</span>`).join(' ');
      const yr = cap.year ? `<span class="pill pill-gray">Plan ${cap.year}</span>` : '';
      rows.push(`<tr>
        <td>${domain}</td>
        <td>${cap.product || ''}</td>
        <td>${cap.func || ''}</td>
        <td>${systems}</td>
        <td>${yr}</td>
      </tr>`);
    });
  });

  if(!rows.length) {
    wrap.innerHTML = `<p style="color:#64748b;padding:16px">No legacy-only gaps found for ${zone}</p>`;
    return;
  }

  wrap.innerHTML = `<div class="scroll-table"><table>
    <thead><tr>
      <th>Domain</th><th>Product</th><th>Functionality</th><th>Legacy Systems</th><th>Global Planned</th>
    </tr></thead>
    <tbody>${rows.join('')}</tbody>
  </table></div>`;
}

ZONES.forEach((z,i) => {
  const t = document.createElement('button');
  t.className = 'tab' + (i===0?' active':'');
  t.textContent = z;
  t.style.color = ZONE_COLORS[z];
  t.onclick = () => {
    gapZoneTabs.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    activeGapZone = z;
    renderGapTable(z);
  };
  gapZoneTabs.appendChild(t);
});
renderGapTable(ZONES[0]);

// ---- Section 5: Drill-down ----
const drillTabs = document.getElementById('drill-tabs');
const drillPanel = document.getElementById('drill-panel');
let drillChart;

function renderDrill(domain) {
  const caps = DS[domain].capabilities;
  const rows = caps.map(c => {
    const lvls = c.levels.length ? c.levels.map(l=>`<span class="level-chip ${l.toLowerCase()}">${l}</span>`).join('') : '<span class="level-chip l0">L0</span>';
    const status = c.ready
      ? '<span class="pill pill-green">READY</span>'
      : c.status.toUpperCase().includes('PROGRESS')
        ? '<span class="pill pill-yellow">IN PROGRESS</span>'
        : '<span class="pill pill-red">NOT READY</span>';
    const yr = c.year ? `<span style="color:#64748b;font-size:.75rem"> → ${c.year}</span>` : '';
    const zoneSpans = ZONES.filter(z=>c.zones[z].req)
      .map(z=>`<span class="zone-tag ${z.toLowerCase()}">${z}</span>`).join('');
    return `<div class="detail-row">
      <div class="detail-func"><strong>${c.func}</strong><br><span style="color:#64748b">${c.product}</span></div>
      <div class="detail-meta">${lvls} ${status}${yr}<br>${zoneSpans}</div>
    </div>`;
  });

  drillPanel.innerHTML = `
    <div style="color:#94a3b8;font-size:.83rem;margin-bottom:8px">
      ${caps.length} capabilities — ${DS[domain].ready} READY (${Math.round(DS[domain].ready/DS[domain].total*100)}%)
    </div>
    <div class="detail-panel open">${rows.join('')}</div>
  `;
}

DOMAINS.forEach((d,i) => {
  const t = document.createElement('button');
  t.className = 'tab' + (i===0?' active':'');
  t.textContent = d;
  t.onclick = () => {
    drillTabs.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    renderDrill(d);
  };
  drillTabs.appendChild(t);
});
renderDrill(DOMAINS[0]);
</script>
</body>
</html>
"""


def generate_html(data: dict) -> str:
    json_str = json.dumps(data, ensure_ascii=False)
    return HTML_TEMPLATE.replace("__DATA_PLACEHOLDER__", json_str)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if not FILE_PATH.exists():
        sys.exit(f"File not found: {FILE_PATH}")

    print(f"Reading: {FILE_PATH}")
    caps = load_data()
    print(f"Loaded {len(caps)} capability rows")

    print("Aggregating...")
    data = aggregate(caps)

    print(f"Domains: {data['domains']}")
    print(f"Total: {data['total']} | Ready: {data['ready']} ({round(data['ready']/data['total']*100)}%)")

    html = generate_html(data)
    OUT_PATH.write_text(html, encoding="utf-8")
    print(f"\nDashboard saved: {OUT_PATH}")


if __name__ == "__main__":
    main()
