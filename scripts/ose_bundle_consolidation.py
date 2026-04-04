#!/usr/bin/env python3
"""
OSE Consolidation by Strategic Bundle (VPO × Tech)
Bottom-up: OSE = ΣEPT / ΣOST, GLY = ΣEPT / ΣST
Source: gb_supplychainkpi_consolidated (2025 AC MTH BOPSLINE LINE, excl keg)
"""

import json
import os
from collections import defaultdict
from difflib import SequenceMatcher, get_close_matches
from pathlib import Path

BASE = Path("/home/fredfur/projects/coverage-dashboard/docs")
DBX_FILE = Path("/home/fredfur/.claude/projects/-home-fredfur/c2bbebfc-96c2-40ba-9e1d-5f244012316a/tool-results/mcp-maintenance-sap-workorders-execute_query-1775059228866.txt")

# ── STEP 1: Load & pivot Databricks data ──────────────────────────────────
print("=" * 60)
print("STEP 1: Loading Databricks data...")
raw = json.loads(DBX_FILE.read_text())
# Extract the actual data from the MCP wrapper
text_content = raw[0]["text"]
# Find the JSON array start
arr_start = text_content.index("[")
rows = json.loads(text_content[arr_start:])
print(f"  Raw rows from Databricks: {len(rows)}")

# Pivot: (zone, plant) -> {kpi_code: value}
plant_data = defaultdict(lambda: defaultdict(float))
plant_zones = {}
for r in rows:
    key = r["plant"]
    plant_data[key][r["kpi_code"]] = r["total_value"]
    plant_zones[key] = r["zone"]

print(f"  Distinct plants: {len(plant_data)}")

# ── STEP 2: Calculate OSE/GLY per plant ──────────────────────────────────
print("\n" + "=" * 60)
print("STEP 2: Calculating plant-level OSE & GLY...")

VOL_KPIS = [
    'PB-R0010', 'PB-R0030', 'PB-R0050',
    'PC-R0010', 'PC-R0030', 'PC-R0050',
    'PP-R0010', 'PP-R0030', 'PP-R0050',
]

plants = []
plants_st_zero = []
plants_ost_zero = []

for plant_name, kpis in plant_data.items():
    ept = kpis.get('PG-R0060', 0)
    st = kpis.get('PG-R0080', 0)
    ost = kpis.get('PG-K4039', 0)
    volume = sum(kpis.get(k, 0) for k in VOL_KPIS)
    zone = plant_zones[plant_name]

    if ost == 0:
        plants_ost_zero.append(plant_name)
    if st == 0:
        plants_st_zero.append(plant_name)

    ose = (ept / ost * 100) if ost > 0 else None
    gly = (ept / st * 100) if st > 0 else None

    plants.append({
        "plant": plant_name,
        "zone": zone,
        "EPT": round(ept, 2),
        "ST": round(st, 2),
        "OST": round(ost, 2),
        "volume_hL": round(volume, 2),
        "OSE": round(ose, 2) if ose is not None else None,
        "GLY": round(gly, 2) if gly is not None else None,
    })

total_before_filter = len(plants)
valid_plants = [p for p in plants if p["OSE"] is not None and p["GLY"] is not None]
total_after_filter = len(valid_plants)

print(f"  Plants before HAVING (OST>0 & ST>0): {total_before_filter}")
print(f"  Plants after HAVING: {total_after_filter}")
print(f"  Plants with ST=0: {len(plants_st_zero)} → {plants_st_zero[:10]}")
print(f"  Plants with OST=0: {len(plants_ost_zero)} → {plants_ost_zero[:10]}")

# Volume by zone
zone_summary = defaultdict(lambda: {"n": 0, "EPT": 0, "ST": 0, "OST": 0, "vol": 0})
for p in valid_plants:
    z = zone_summary[p["zone"]]
    z["n"] += 1
    z["EPT"] += p["EPT"]
    z["ST"] += p["ST"]
    z["OST"] += p["OST"]
    z["vol"] += p["volume_hL"]

print("\n  Volume by zone:")
by_zone_list = []
for zone in sorted(zone_summary.keys()):
    z = zone_summary[zone]
    ose_z = (z["EPT"] / z["OST"] * 100) if z["OST"] > 0 else 0
    gly_z = (z["EPT"] / z["ST"] * 100) if z["ST"] > 0 else 0
    print(f"    {zone}: {z['n']} plants, OSE={ose_z:.1f}%, GLY={gly_z:.1f}%, Vol={z['vol']:,.0f} hL")
    by_zone_list.append({
        "zone": zone,
        "n_plants": z["n"],
        "OSE_pct": round(ose_z, 2),
        "GLY_pct": round(gly_z, 2),
        "volume_hL": round(z["vol"], 2),
    })

# ── STEP 3: Fuzzy match with vpo_tech_data.json ─────────────────────────
print("\n" + "=" * 60)
print("STEP 3: Fuzzy matching with vpo_tech_data.json...")

vpo_data = json.loads((BASE / "vpo_tech_data.json").read_text())
sites = vpo_data["sites"]
print(f"  Sites in JSON: {len(sites)}")

# Build lookup: normalized site name -> site object
def normalize(s):
    return s.lower().strip().replace("brewery", "").replace("beer", "").replace("plant", "").strip()

site_names = {s["site"]: s for s in sites}
site_norm = {normalize(s["site"]): s["site"] for s in sites}

# Match each DB plant to a JSON site
matched = []
unmatched_db = []
matched_json_sites = set()

for p in valid_plants:
    plant_norm = normalize(p["plant"])
    # Try exact normalized match first
    best_match = None
    if plant_norm in site_norm:
        best_match = site_norm[plant_norm]
    else:
        # Try fuzzy
        candidates = list(site_norm.keys())
        close = get_close_matches(plant_norm, candidates, n=1, cutoff=0.65)
        if close:
            best_match = site_norm[close[0]]

    if best_match:
        site_obj = site_names[best_match]
        matched_json_sites.add(best_match)
        matched.append({
            "plant_db": p["plant"],
            "site_json": best_match,
            "bundle": site_obj["bundle"],
            "zone": p["zone"],
            "OSE": p["OSE"],
            "GLY": p["GLY"],
            "EPT": p["EPT"],
            "OST": p["OST"],
            "ST": p["ST"],
            "volume_hL": p["volume_hL"],
            "techScore": site_obj.get("techScore"),
            "vpoNum": site_obj.get("vpoNum"),
            "vpoLevel": site_obj.get("vpoLevel"),
            "ttp": site_obj.get("ttp"),
            "ose_json": site_obj.get("ose"),
        })
    else:
        unmatched_db.append({"plant": p["plant"], "zone": p["zone"], "OSE": p["OSE"], "volume_hL": p["volume_hL"]})

unmatched_json = [s["site"] for s in sites if s["site"] not in matched_json_sites]

print(f"  Matched: {len(matched)} plants")
print(f"  Unmatched DB: {len(unmatched_db)} plants")
print(f"  Unmatched JSON: {len(unmatched_json)} sites")

# ── Decide fallback strategy ─────────────────────────────────────────────
USE_FALLBACK = len(matched) < 30
if USE_FALLBACK:
    print(f"\n  ⚠ Match < 30 → using Anaplan PG-K4038 harmonic proxy as fallback")

# ── STEP 4: Calculate bundle stats ───────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 4: Calculating OSE/GLY by bundle...")

bundle_agg = defaultdict(lambda: {"n": 0, "EPT": 0, "OST": 0, "ST": 0, "vol": 0, "ttp_vals": []})

for m in matched:
    b = bundle_agg[m["bundle"]]
    b["n"] += 1
    b["EPT"] += m["EPT"]
    b["OST"] += m["OST"]
    b["ST"] += m["ST"]
    b["vol"] += m["volume_hL"]
    if m.get("ttp") is not None:
        b["ttp_vals"].append(m["ttp"])

# For unmatched JSON sites that have OSE in the JSON, add them if using fallback
if USE_FALLBACK:
    for site_name in unmatched_json:
        s = site_names[site_name]
        if s.get("ose") and s["ose"] > 0 and s.get("volume") and s["volume"] > 0:
            # Reconstruct OST from harmonic: OST ≈ volume / ose * 100
            vol = s["volume"]
            ose_val = s["ose"]
            ept_proxy = vol * ose_val / 100
            ost_proxy = vol
            b = bundle_agg[s["bundle"]]
            b["n"] += 1
            b["EPT"] += ept_proxy
            b["OST"] += ost_proxy
            b["vol"] += vol
            if s.get("ttp"):
                b["ttp_vals"].append(s["ttp"])

bundle_stats = {}
for bname in ["B1", "B2", "B3", "B4"]:
    b = bundle_agg[bname]
    ose_b = (b["EPT"] / b["OST"] * 100) if b["OST"] > 0 else 0
    gly_b = (b["EPT"] / b["ST"] * 100) if b["ST"] > 0 else 0
    ttp_avg = sum(b["ttp_vals"]) / len(b["ttp_vals"]) if b["ttp_vals"] else None
    bundle_stats[bname] = {
        "n_matched": b["n"],
        "ose_pct": round(ose_b, 2),
        "gly_pct": round(gly_b, 2),
        "volume_hL": round(b["vol"], 2),
        "EPT": round(b["EPT"], 2),
        "OST": round(b["OST"], 2),
        "ttp_avg": round(ttp_avg, 2) if ttp_avg else None,
    }
    prev_ose = vpo_data["bundle_stats"].get(bname, {}).get("ose_consolidated")
    print(f"  {bname}: n={b['n']}, OSE={ose_b:.1f}% (prev={prev_ose}%), GLY={gly_b:.1f}%, Vol={b['vol']:,.0f} hL, TTP={ttp_avg:.2f}" if ttp_avg else f"  {bname}: n={b['n']}, OSE={ose_b:.1f}% (prev={prev_ose}%), GLY={gly_b:.1f}%, Vol={b['vol']:,.0f} hL, TTP=N/A")

# ── Save JSON ─────────────────────────────────────────────────────────────
output = {
    "methodology": {
        "ose_formula": "ΣEPT / ΣOST (bottom-up, never simple average)",
        "gly_formula": "ΣEPT / ΣST (bottom-up)",
        "source": "brewdat_uc_supchn_prod.gld_ghq_supply_supplychainkpi.gb_supplychainkpi_consolidated",
        "scope": "year=2025, periodtype=MTH, attribute=AC, module=BOPSLINE, locationtype=LINE, excl keg",
        "kpi_ept": "PG-R0060",
        "kpi_st": "PG-R0080",
        "kpi_ost": "PG-K4039",
        "fuzzy_cutoff": 0.65,
        "fallback_used": USE_FALLBACK,
        "generated": "2026-04-01",
    },
    "scope": {
        "zones": ["AFR", "APAC", "EUR", "MAZ", "NAZ", "SAZ"],
        "year": 2025,
        "plants_in_dbx": total_before_filter,
        "plants_valid": total_after_filter,
        "plants_matched": len(matched),
        "plants_unmatched_db": len(unmatched_db),
        "sites_unmatched_json": len(unmatched_json),
    },
    "bundle_stats": bundle_stats,
    "by_zone": by_zone_list,
    "plants_matched": sorted(matched, key=lambda x: (x["bundle"], -x["volume_hL"])),
    "plants_unmatched_db": sorted(unmatched_db, key=lambda x: -x["volume_hL"]),
    "sites_unmatched_json": sorted(unmatched_json),
}

json_path = BASE / "vpo_tech_ose_correct.json"
json_path.write_text(json.dumps(output, indent=2, ensure_ascii=False))
print(f"\n  ✓ Saved: {json_path}")

# ── STEP 5: Generate HTML ────────────────────────────────────────────────
print("\n" + "=" * 60)
print("STEP 5: Generating dark-themed HTML dashboard...")

# Prepare data for chart (from vpo_tech_data.json sites)
chart_sites = []
for s in sites:
    chart_sites.append({
        "site": s["site"],
        "zone": s["zone"],
        "tech": s.get("techScore", 0),
        "vpo": s.get("vpoNum", 0),
        "volume": s.get("volume", 0),
        "bundle": s.get("bundle", ""),
        "ose": s.get("ose"),
        "ttp": s.get("ttp"),
    })

# Bundle KPI table data (from new Databricks calculation)
bundle_order = ["B4", "B2", "B3", "B1"]
prev_stats = vpo_data["bundle_stats"]

# TTP avg from JSON by bundle
ttp_by_bundle = defaultdict(list)
for s in sites:
    if s.get("ttp") is not None:
        ttp_by_bundle[s["bundle"]].append(s["ttp"])
ttp_avg_bundle = {}
for b in bundle_order:
    vals = ttp_by_bundle[b]
    ttp_avg_bundle[b] = round(sum(vals) / len(vals), 2) if vals else None

# Build insight cards
b4_ose = bundle_stats["B4"]["ose_pct"]
b1_ose = bundle_stats["B1"]["ose_pct"]
b3_ose = bundle_stats["B3"]["ose_pct"]
b2_ose = bundle_stats["B2"]["ose_pct"]
delta_b4_b1 = round(b4_ose - b1_ose, 1)
delta_b3_b2 = round(b3_ose - b2_ose, 1)

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VPO × Tech Strategy — OSE Bundle Consolidation</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ background: #0F172A; color: #F1F5F9; font-family: 'Segoe UI', system-ui, sans-serif; }}
  .top-bar {{ height: 4px; background: #F5A800; }}
  .header {{ background: #0F172A; padding: 18px 32px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid #334155; }}
  .header h1 {{ font-size: 1.4rem; font-weight: 700; color: #FFFFFF; }}
  .header .ab {{ color: #F5A800; font-weight: 800; font-size: 1.1rem; }}
  .main {{ display: flex; flex-direction: row; gap: 0; padding: 16px 24px; }}
  .chart-area {{ flex: 1; min-width: 0; background: #0F172A; border-radius: 10px; border: 1px solid #334155; padding: 16px; }}
  .side-panel {{ width: 340px; flex-shrink: 0; margin-left: 16px; display: flex; flex-direction: column; gap: 14px; }}
  .card {{ background: #1E293B; border-radius: 10px; border: 1px solid #334155; padding: 16px; }}
  .card h3 {{ font-size: 0.82rem; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }}
  /* KPI Bundle Table */
  .kpi-table {{ width: 100%; border-collapse: collapse; font-size: 0.82rem; }}
  .kpi-table th {{ color: #94A3B8; font-weight: 600; text-align: right; padding: 6px 8px; border-bottom: 1px solid #334155; }}
  .kpi-table th:first-child {{ text-align: left; }}
  .kpi-table td {{ padding: 6px 8px; text-align: right; }}
  .kpi-table td:first-child {{ text-align: left; font-weight: 600; }}
  .row-B4 {{ background: #1E3A5F; color: #93C5FD; font-weight: 600; }}
  .row-B2 {{ background: #064E3B; color: #6EE7B7; }}
  .row-B3 {{ background: #451A03; color: #FCD34D; }}
  .row-B1 {{ background: #450A0A; color: #FCA5A5; }}
  /* Legend */
  .legend {{ display: flex; flex-wrap: wrap; gap: 8px; }}
  .legend-item {{ display: flex; align-items: center; gap: 5px; font-size: 0.78rem; color: #94A3B8; }}
  .legend-dot {{ width: 10px; height: 10px; border-radius: 50%; }}
  /* Insight cards row */
  .insights-row {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; padding: 0 24px 24px; }}
  .insight {{ background: #1E293B; border-radius: 10px; border: 1px solid #334155; padding: 16px; }}
  .insight .num {{ font-size: 1.6rem; font-weight: 700; }}
  .insight .label {{ font-size: 0.78rem; color: #94A3B8; margin-top: 4px; }}
  .insight .desc {{ font-size: 0.75rem; color: #64748B; margin-top: 6px; line-height: 1.4; }}
  .note {{ font-size: 0.68rem; color: #64748B; line-height: 1.5; margin-top: 8px; }}
  .footer {{ text-align: center; padding: 12px; font-size: 0.65rem; color: #475569; border-top: 1px solid #334155; }}
</style>
</head>
<body>
<div class="top-bar"></div>
<div class="header">
  <span class="ab">AB InBev</span>
  <h1>VPO × Tech Strategy — OSE Bundle Consolidation (2025 AC)</h1>
</div>

<div class="main">
  <!-- Bubble Chart -->
  <div class="chart-area">
    <canvas id="bubbleChart" height="420"></canvas>
  </div>

  <!-- Side Panel -->
  <div class="side-panel">
    <!-- KPI Bundle Table -->
    <div class="card">
      <h3>KPI by Strategic Bundle</h3>
      <table class="kpi-table">
        <thead>
          <tr><th>Bundle</th><th>Sites</th><th>OSE %</th><th>GLY %</th><th>TTP</th><th>Vol (M hL)</th></tr>
        </thead>
        <tbody>
"""

for bname in bundle_order:
    bs = bundle_stats[bname]
    prev_ose_val = prev_stats.get(bname, {}).get("ose_consolidated")
    ose_val = bs["ose_pct"]
    gly_val = bs["gly_pct"]
    ttp_val = ttp_avg_bundle.get(bname)
    vol_m = bs["volume_hL"] / 1_000_000
    delta_str = ""
    if prev_ose_val:
        d = round(ose_val - prev_ose_val, 1)
        arrow = "▲" if d > 0 else "▼" if d < 0 else "="
        delta_str = f' <span style="font-size:0.7rem;opacity:0.7">({arrow}{abs(d):.1f})</span>'

    html += f"""          <tr class="row-{bname}">
            <td>{bname}</td>
            <td>{bs['n_matched']}</td>
            <td>{ose_val:.1f}{delta_str}</td>
            <td>{gly_val:.1f}</td>
            <td>{f"{ttp_val:.2f}" if ttp_val else "—"}</td>
            <td>{vol_m:.1f}</td>
          </tr>
"""

html += """        </tbody>
      </table>
      <p class="note" style="margin-top:10px;">OSE delta vs harmonic proxy (Anaplan). Bottom-up = ΣEPT/ΣOST.</p>
    </div>

    <!-- Zone Legend -->
    <div class="card">
      <h3>Zones</h3>
      <div class="legend">
        <div class="legend-item"><div class="legend-dot" style="background:#FB923C"></div>AFR</div>
        <div class="legend-item"><div class="legend-dot" style="background:#34D399"></div>SAZ</div>
        <div class="legend-item"><div class="legend-dot" style="background:#60A5FA"></div>MAZ</div>
        <div class="legend-item"><div class="legend-dot" style="background:#A78BFA"></div>NAZ</div>
        <div class="legend-item"><div class="legend-dot" style="background:#F472B6"></div>EUR</div>
        <div class="legend-item"><div class="legend-dot" style="background:#FB7185"></div>APAC</div>
      </div>
    </div>

    <!-- Methodology Note -->
    <div class="card">
      <h3>Methodology</h3>
      <p class="note">
        <b>OSE</b> = ΣEPT / ΣOST (bottom-up from gb_supplychainkpi_consolidated · 2025 AC)<br>
        <b>GLY</b> = ΣEPT / ΣST<br>
        <b>Tech Score</b> = avg(BP, DA, UT, MT, MG, MDM, PP, QL, SF)<br>
        <b>VPO threshold</b> = SUS (≥4)<br>
        <b>(*)</b> VPO estimado por zona para sites sem assessment
      </p>
    </div>
  </div>
</div>

<!-- Insight Cards -->
<div class="insights-row">
  <div class="insight">
    <div class="num" style="color:#93C5FD">+""" + f"""{delta_b4_b1:.1f}pp</div>
    <div class="label">B4 vs B1 — OSE Gap</div>
    <div class="desc">High VPO + High Tech (B4) delivers {b4_ose:.1f}% OSE vs {b1_ose:.1f}% in B1. Capability pays off.</div>
  </div>
  <div class="insight">
    <div class="num" style="color:#FCD34D">{delta_b3_b2:+.1f}pp</div>
    <div class="label">B3 vs B2 — Paradox Gap</div>
    <div class="desc">B3 (High VPO, Low Tech) at {b3_ose:.1f}% vs B2 (Low VPO, High Tech) at {b2_ose:.1f}%. {"Tech without VPO discipline outperforms VPO alone." if b2_ose > b3_ose else "VPO maturity compensates for tech gap."}</div>
  </div>
  <div class="insight">
    <div class="num" style="color:#6EE7B7">{round(b2_ose - b1_ose, 1):+.1f}pp</div>
    <div class="label">B2 vs B1 — VPO Driver</div>
    <div class="desc">Both low-tech, but B2's higher tech maturity adds {round(b2_ose - b1_ose, 1):.1f}pp. Tech is the differentiator at low VPO.</div>
  </div>
  <div class="insight">
    <div class="num" style="color:#93C5FD">{bundle_stats['B4']['n_matched']}</div>
    <div class="label">Sites in B4 (Target Quadrant)</div>
    <div class="desc">{bundle_stats['B4']['n_matched']} sites with VPO≥SUS + Tech≥1.9 representing {bundle_stats['B4']['volume_hL']/1e6:.0f}M hL — the aspiration zone.</div>
  </div>
</div>

<div class="footer">
  OSE = ΣEPT/ΣOST (bottom-up · gb_supplychainkpi_consolidated · 2025 AC) | Tech = avg(BP,DA,UT,MT,MG,MDM,PP,QL,SF) · VPO threshold = SUS | (*) VPO estimado por zona
</div>

<script>
const ZONE_COLORS = {{
  'AFR': {{ bg: 'rgba(251,146,60,0.70)', border: '#FB923C' }},
  'SAZ': {{ bg: 'rgba(52,211,153,0.70)', border: '#34D399' }},
  'MAZ': {{ bg: 'rgba(96,165,250,0.70)', border: '#60A5FA' }},
  'NAZ': {{ bg: 'rgba(167,139,250,0.70)', border: '#A78BFA' }},
  'EUR': {{ bg: 'rgba(244,114,182,0.70)', border: '#F472B6' }},
  'APAC': {{ bg: 'rgba(251,113,133,0.70)', border: '#FB7185' }},
}};

const QUAD_COLORS = {{
  'B4': 'rgba(30,58,138,0.18)',
  'B1': 'rgba(127,29,29,0.14)',
  'B2': 'rgba(6,78,59,0.14)',
  'B3': 'rgba(120,53,15,0.14)',
}};

const sites = {json.dumps(chart_sites)};

const TECH_TH = {vpo_data['thresholds']['tech']};
const VPO_TH = {vpo_data['thresholds']['vpo']};

const datasets = {{}};
sites.forEach(s => {{
  const z = s.zone;
  if (!datasets[z]) datasets[z] = [];
  datasets[z].push({{
    x: s.tech,
    y: s.vpo,
    r: Math.max(3, Math.sqrt(s.volume / 500000)),
    site: s.site,
    bundle: s.bundle,
    ose: s.ose,
    volume: s.volume,
  }});
}});

const chartDatasets = Object.entries(datasets).map(([zone, data]) => ({{
  label: zone,
  data: data,
  backgroundColor: ZONE_COLORS[zone]?.bg || 'rgba(148,163,184,0.5)',
  borderColor: ZONE_COLORS[zone]?.border || '#94A3B8',
  borderWidth: 1,
  hoverBorderWidth: 2,
}}));

// Add B4 highlight dataset
const b4Sites = sites.filter(s => s.bundle === 'B4');
chartDatasets.push({{
  label: 'B4 Highlight',
  data: b4Sites.map(s => ({{
    x: s.tech,
    y: s.vpo,
    r: Math.max(3, Math.sqrt(s.volume / 500000)) + 2,
    site: s.site,
  }})),
  backgroundColor: 'transparent',
  borderColor: '#60A5FA',
  borderWidth: 2,
  pointStyle: 'circle',
  hidden: true,
}});

const ctx = document.getElementById('bubbleChart').getContext('2d');
new Chart(ctx, {{
  type: 'bubble',
  data: {{ datasets: chartDatasets }},
  options: {{
    responsive: true,
    maintainAspectRatio: false,
    plugins: {{
      legend: {{
        display: true,
        position: 'top',
        labels: {{ color: '#94A3B8', font: {{ size: 11 }}, usePointStyle: true, pointStyle: 'circle' }},
      }},
      tooltip: {{
        backgroundColor: '#0F172A',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#E2E8F0',
        bodyColor: '#E2E8F0',
        padding: 12,
        callbacks: {{
          label: function(ctx) {{
            const d = ctx.raw;
            return [
              d.site + ' (' + ctx.dataset.label + ')',
              'Tech: ' + d.x?.toFixed(2) + ' | VPO: ' + d.y,
              'OSE: ' + (d.ose ? d.ose.toFixed(1) + '%' : 'N/A'),
              'Vol: ' + (d.volume ? (d.volume/1e6).toFixed(1) + 'M hL' : 'N/A'),
              'Bundle: ' + (d.bundle || ''),
            ];
          }}
        }}
      }},
      annotation: undefined,
    }},
    scales: {{
      x: {{
        title: {{ display: true, text: 'Tech Score (avg 9 domains)', color: '#94A3B8', font: {{ size: 12 }} }},
        grid: {{ color: '#1E293B', borderDash: [4, 4] }},
        ticks: {{ color: '#64748B' }},
        min: 1.5,
        max: 3.5,
      }},
      y: {{
        title: {{ display: true, text: 'VPO Level (numeric)', color: '#94A3B8', font: {{ size: 12 }} }},
        grid: {{ color: '#1E293B', borderDash: [4, 4] }},
        ticks: {{
          color: '#64748B',
          callback: function(v) {{
            const map = {{1:'FOUND',2:'BASIC',3:'INT',4:'SUS',5:'ADV',6:'WC'}};
            return map[v] || v;
          }}
        }},
        min: 0.5,
        max: 7,
      }},
    }},
  }},
  plugins: [{{
    id: 'quadrants',
    beforeDraw(chart) {{
      const {{ ctx, chartArea: {{ left, right, top, bottom }}, scales: {{ x, y }} }} = chart;
      const xMid = x.getPixelForValue(TECH_TH);
      const yMid = y.getPixelForValue(VPO_TH);
      // B1: low tech, low vpo (bottom-left)
      ctx.fillStyle = QUAD_COLORS.B1;
      ctx.fillRect(left, yMid, xMid - left, bottom - yMid);
      // B2: high tech, low vpo (bottom-right)
      ctx.fillStyle = QUAD_COLORS.B2;
      ctx.fillRect(xMid, yMid, right - xMid, bottom - yMid);
      // B3: low tech, high vpo (top-left)
      ctx.fillStyle = QUAD_COLORS.B3;
      ctx.fillRect(left, top, xMid - left, yMid - top);
      // B4: high tech, high vpo (top-right)
      ctx.fillStyle = QUAD_COLORS.B4;
      ctx.fillRect(xMid, top, right - xMid, yMid - top);
      // Quadrant labels
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#FCA5A5'; ctx.fillText('B1 — Low VPO · Low Tech', left + 8, bottom - 8);
      ctx.fillStyle = '#6EE7B7'; ctx.fillText('B2 — Low VPO · High Tech', right - 170, bottom - 8);
      ctx.fillStyle = '#FCD34D'; ctx.fillText('B3 — High VPO · Low Tech', left + 8, top + 16);
      ctx.fillStyle = '#93C5FD'; ctx.fillText('B4 — High VPO · High Tech', right - 170, top + 16);
      // Threshold lines
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xMid, top); ctx.lineTo(xMid, bottom); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(left, yMid); ctx.lineTo(right, yMid); ctx.stroke();
      ctx.restore();
    }}
  }}]
}});
</script>
</body>
</html>"""

html_path = BASE / "vpo_tech_strategy.html"
html_path.write_text(html)
print(f"  ✓ Saved: {html_path}")

# ── Final summary ─────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print(f"  Databricks plants: {total_before_filter} (valid: {total_after_filter})")
print(f"  Fuzzy matched: {len(matched)} | Unmatched DB: {len(unmatched_db)} | Unmatched JSON: {len(unmatched_json)}")
print(f"  Fallback used: {USE_FALLBACK}")
print(f"\n  Bundle OSE (new bottom-up vs prev harmonic):")
for b in bundle_order:
    new = bundle_stats[b]["ose_pct"]
    prev = prev_stats.get(b, {}).get("ose_consolidated")
    delta = round(new - prev, 1) if prev else "N/A"
    print(f"    {b}: {new:.1f}% (was {prev}%) → Δ={delta}")

print(f"\n  Files saved:")
print(f"    {json_path}")
print(f"    {html_path}")
