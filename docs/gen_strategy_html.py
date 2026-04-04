#!/usr/bin/env python3
"""Generate vpo_tech_strategy.html with dual OSE visualization (absolute + normalized)."""

import json, os, random

BASE = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(BASE, "vpo_tech_data.json")) as f:
    tech = json.load(f)
with open(os.path.join(BASE, "vpo_tech_ose_correct.json")) as f:
    ose = json.load(f)

# Build SITES JS array with jitter and ose_rel
random.seed(42)
sites_js = []
for s in tech["sites"]:
    jx = round(random.uniform(-0.08, 0.08), 4)
    jy = round(random.uniform(-0.22, 0.22), 4)
    ose_v = "null" if s.get("ose") is None else str(s["ose"])
    ttp_v = "null" if s.get("ttp") is None else str(s["ttp"])
    ose_rel_v = "null" if s.get("ose_rel") is None else str(s["ose_rel"])
    sites_js.append(
        f"{{s:'{s['site']}',z:'{s['zone']}',c:'{s['country']}',"
        f"t:{s['techScore']},v:{s['vpoNum']},vol:{s['volume']},"
        f"b:'{s['bundle']}',ose:{ose_v},ttp:{ttp_v},ose_rel:{ose_rel_v},"
        f"jx:{jx},jy:{jy}}}"
    )

sites_block = ",\n".join(sites_js)

# Extract computed data
br = ose["normalized_bundle_stats"]
zone_avg = ose["zone_avg_ose"]
bzb = ose["bundle_zone_breakdown"]

# Bundle absolute OSE from ose_correct
bs = ose["bundle_stats"]
b4_abs = bs["B4"]["ose_pct"]
b2_abs = bs["B2"]["ose_pct"]
b1_abs = bs["B1"]["ose_pct"]
b3_abs = bs["B3"]["ose_pct"]

# Normalized
b4_rel = br["B4"]["ose_rel_vol_weighted"]
b2_rel = br["B2"]["ose_rel_vol_weighted"]
b1_rel = br["B1"]["ose_rel_vol_weighted"]
b3_rel = br["B3"]["ose_rel_vol_weighted"]

# B4 excl APAC
b4_excl = bzb["B4"].get("AFR", {})
b4_excl_n = b4_excl.get("n", 0)
b4_excl_rel = b4_excl.get("ose_rel_wt", 0)

# VPO lift: B2 vs B1 absolute
vpo_lift = round(b2_abs - b1_abs, 1)
# Tech-only penalty: B3 vs B1
tech_penalty = round(b3_abs - b1_abs, 1)
# Volume at stake
vol_b1 = tech["bundle_stats"]["B1"]["vol_total_hL"]
vol_b3 = tech["bundle_stats"]["B3"]["vol_total_hL"]
vol_b4 = tech["bundle_stats"]["B4"]["vol_total_hL"]
vol_total = sum(tech["bundle_stats"][b]["vol_total_hL"] for b in ["B1","B2","B3","B4"])
vas_pct = round((vol_b1 + vol_b3) / vol_total * 100, 1)
vas_vol = round((vol_b1 + vol_b3) / 1e6)

# Zone counts from tech_data
n_b4 = tech["bundle_stats"]["B4"]["n"]
n_b2 = tech["bundle_stats"]["B2"]["n"]
n_b1 = tech["bundle_stats"]["B1"]["n"]
n_b3 = tech["bundle_stats"]["B3"]["n"]
n_total = n_b4 + n_b2 + n_b1 + n_b3

# Zone breakdown table for B4
b4z_rows = ""
for z in ["APAC", "AFR"]:
    if z in bzb["B4"]:
        d = bzb["B4"][z]
        b4z_rows += f'<tr><td>{z}</td><td>{d["n"]}</td><td>{d["ose_abs_wt"]:.1f}%</td><td class="rel {"pos" if d["ose_rel_wt"]>=0 else "neg"}">{d["ose_rel_wt"]:+.1f}pp</td></tr>\n'

# Zone breakdown for B2
b2z_rows = ""
for z in ["MAZ", "SAZ", "APAC", "AFR", "NAZ"]:
    if z in bzb["B2"]:
        d = bzb["B2"][z]
        b2z_rows += f'<tr><td>{z}</td><td>{d["n"]}</td><td>{d["ose_abs_wt"]:.1f}%</td><td class="rel {"pos" if d["ose_rel_wt"]>=0 else "neg"}">{d["ose_rel_wt"]:+.1f}pp</td></tr>\n'

# Zone avg table
zone_avg_rows = ""
for z in ["APAC", "MAZ", "NAZ", "SAZ", "AFR", "EUR"]:
    v = zone_avg.get(z)
    if v:
        zone_avg_rows += f'<tr><td>{z}</td><td>{v:.1f}%</td></tr>\n'

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tech Supply Strategy — AB InBev</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js"></script>
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{background:#0F172A;color:#F1F5F9;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;min-height:100vh}}
.top-bar{{height:4px;background:#F5A800}}
header{{display:flex;justify-content:space-between;align-items:center;padding:20px 32px 12px}}
header h1{{font-size:22px;font-weight:700;letter-spacing:1.2px;color:#F1F5F9}}
header .sub{{font-size:13px;color:#94A3B8;margin-top:2px}}
header .brand{{font-size:15px;font-weight:600;color:#F5A800;letter-spacing:0.5px}}
.main-row{{display:flex;gap:0;padding:0 24px 16px;height:calc(100vh - 200px);min-height:520px}}
.chart-wrap{{flex:1;min-width:0;position:relative;background:#1E293B;border-radius:10px;overflow:hidden}}
.chart-wrap canvas{{width:100%!important;height:100%!important}}
.side-panel{{width:360px;flex-shrink:0;margin-left:16px;display:flex;flex-direction:column;gap:12px;overflow-y:auto}}
.side-section{{background:#1E293B;border-radius:8px;padding:14px 16px}}
.side-section h3{{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#94A3B8;margin-bottom:10px}}
table.kpi{{width:100%;border-collapse:collapse;font-size:13px}}
table.kpi th{{text-align:left;color:#64748B;font-size:11px;padding:4px 6px;border-bottom:1px solid #334155}}
table.kpi td{{padding:5px 6px;border-bottom:1px solid rgba(51,65,85,0.4)}}
.b4-row{{background:#1E3A5F;color:#93C5FD;font-weight:700}}
.b2-row{{background:#064E3B;color:#6EE7B7}}
.b1-row{{background:#1C1917;color:#A8A29E}}
.b3-row{{background:#4C0519;color:#FCA5A5;font-style:italic}}
.vas-box{{display:flex;gap:12px;align-items:center}}
.vas-big{{font-size:28px;font-weight:800;color:#FCD34D}}
.vas-detail{{font-size:12px;color:#94A3B8;line-height:1.5}}
.legend-grid{{display:grid;grid-template-columns:1fr 1fr;gap:6px}}
.legend-item{{display:flex;align-items:center;gap:6px;font-size:12px}}
.legend-dot{{width:12px;height:12px;border-radius:50%;flex-shrink:0}}
.method-note{{font-size:11px;color:#64748B;line-height:1.5}}
.cards-row{{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:0 24px 24px}}
.card{{background:#1E293B;border-radius:8px;border-top:3px solid #334155;padding:16px 18px}}
.card .big{{font-size:32px;font-weight:800;line-height:1.1}}
.card .label{{font-size:13px;color:#94A3B8;margin-top:6px}}
.card .detail{{font-size:11px;color:#64748B;margin-top:4px}}
/* === NEW: Normalized section === */
.section-title{{padding:24px 24px 8px;font-size:18px;font-weight:700;color:#F1F5F9;letter-spacing:0.5px}}
.section-title .accent{{color:#F5A800}}
.section-subtitle{{padding:0 24px 16px;font-size:13px;color:#94A3B8}}
.norm-grid{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;padding:0 24px 24px}}
.norm-panel{{background:#1E293B;border-radius:8px;padding:16px 18px}}
.norm-panel h3{{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#94A3B8;margin-bottom:10px}}
table.norm{{width:100%;border-collapse:collapse;font-size:13px}}
table.norm th{{text-align:left;color:#64748B;font-size:11px;padding:4px 6px;border-bottom:1px solid #334155}}
table.norm td{{padding:5px 6px;border-bottom:1px solid rgba(51,65,85,0.4)}}
table.norm td.rel.pos{{color:#34D399;font-weight:600}}
table.norm td.rel.neg{{color:#F87171;font-weight:600}}
.norm-cards{{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:0 24px 24px}}
.norm-card{{background:#1E293B;border-radius:8px;padding:14px 16px;border-left:3px solid #334155}}
.norm-card.highlight{{border-left-color:#F59E0B}}
.norm-card .val{{font-size:26px;font-weight:800;line-height:1.1}}
.norm-card .lbl{{font-size:12px;color:#94A3B8;margin-top:4px}}
.norm-card .sub{{font-size:11px;color:#64748B;margin-top:3px}}
.bar-container{{display:flex;align-items:center;gap:8px;margin:4px 0}}
.bar{{height:18px;border-radius:3px;min-width:2px}}
.bar-label{{font-size:11px;color:#94A3B8;min-width:50px;text-align:right}}
.bar-val{{font-size:11px;color:#CBD5E1;min-width:50px}}
.divider{{height:1px;background:linear-gradient(90deg,transparent,#334155,transparent);margin:8px 24px}}
.footer-note{{padding:8px 24px 24px;font-size:11px;color:#475569;text-align:center}}
</style>
</head>
<body>
<div class="top-bar"></div>
<header>
  <div>
    <h1>TECH SUPPLY STRATEGY</h1>
    <div class="sub">VPO Maturity &times; Tech Maturity &middot; {n_total} Operations &middot; 2025</div>
  </div>
  <div class="brand">AB InBev</div>
</header>

<div class="main-row">
  <div class="chart-wrap">
    <canvas id="bubbleChart"></canvas>
  </div>
  <div class="side-panel">
    <div class="side-section">
      <h3>Bundle KPIs (Absolute OSE)</h3>
      <table class="kpi">
        <tr><th>Bundle</th><th>N</th><th>OSE</th><th>Volume</th></tr>
        <tr class="b4-row"><td>B4 &#9733;</td><td>{n_b4}</td><td>{b4_abs:.2f}%</td><td>{round(vol_b4/1e6)}M</td></tr>
        <tr class="b2-row"><td>B2</td><td>{n_b2}</td><td>{b2_abs:.2f}%</td><td>{round(tech["bundle_stats"]["B2"]["vol_total_hL"]/1e6)}M</td></tr>
        <tr class="b1-row"><td>B1</td><td>{n_b1}</td><td>{b1_abs:.2f}%</td><td>{round(vol_b1/1e6)}M</td></tr>
        <tr class="b3-row"><td>B3 &#9888;</td><td>{n_b3}</td><td>{b3_abs:.2f}%</td><td>{round(vol_b3/1e6)}M</td></tr>
      </table>
    </div>
    <div class="side-section">
      <h3>Volume at Stake</h3>
      <div class="vas-box">
        <div class="vas-big">{vas_pct}%</div>
        <div class="vas-detail">
          B1+B3: <b>{vas_vol}M hL</b><br>
          vs B4: {round(vol_b4/1e6)}M hL<br>
          {vas_pct}% of network below potential
        </div>
      </div>
    </div>
    <div class="side-section">
      <h3>Zones</h3>
      <div class="legend-grid">
        <div class="legend-item"><div class="legend-dot" style="background:#FB923C"></div>AFR &middot; {tech["bundle_stats"]["B1"]["zones"].get("AFR",0)+tech["bundle_stats"]["B2"]["zones"].get("AFR",0)+tech["bundle_stats"]["B3"]["zones"].get("AFR",0)+tech["bundle_stats"]["B4"]["zones"].get("AFR",0)}</div>
        <div class="legend-item"><div class="legend-dot" style="background:#34D399"></div>SAZ &middot; {tech["bundle_stats"]["B1"]["zones"].get("SAZ",0)+tech["bundle_stats"]["B2"]["zones"].get("SAZ",0)+tech["bundle_stats"]["B3"]["zones"].get("SAZ",0)+tech["bundle_stats"]["B4"]["zones"].get("SAZ",0)}</div>
        <div class="legend-item"><div class="legend-dot" style="background:#60A5FA"></div>MAZ &middot; {tech["bundle_stats"]["B1"]["zones"].get("MAZ",0)+tech["bundle_stats"]["B2"]["zones"].get("MAZ",0)+tech["bundle_stats"]["B3"]["zones"].get("MAZ",0)+tech["bundle_stats"]["B4"]["zones"].get("MAZ",0)}</div>
        <div class="legend-item"><div class="legend-dot" style="background:#A78BFA"></div>NAZ &middot; {tech["bundle_stats"]["B1"]["zones"].get("NAZ",0)+tech["bundle_stats"]["B2"]["zones"].get("NAZ",0)+tech["bundle_stats"]["B3"]["zones"].get("NAZ",0)+tech["bundle_stats"]["B4"]["zones"].get("NAZ",0)}</div>
        <div class="legend-item"><div class="legend-dot" style="background:#F472B6"></div>EUR &middot; {tech["bundle_stats"]["B1"]["zones"].get("EUR",0)+tech["bundle_stats"]["B2"]["zones"].get("EUR",0)}</div>
        <div class="legend-item"><div class="legend-dot" style="background:#FB7185"></div>APAC &middot; {tech["bundle_stats"]["B1"]["zones"].get("APAC",0)+tech["bundle_stats"]["B2"]["zones"].get("APAC",0)+tech["bundle_stats"]["B3"]["zones"].get("APAC",0)+tech["bundle_stats"]["B4"]["zones"].get("APAC",0)}</div>
      </div>
    </div>
    <div class="side-section">
      <h3>Methodology</h3>
      <p class="method-note">
        OSE = &Sigma;EPT / &Sigma;OST (bottom-up). APAC excluded from B1/B3 OSE to avoid composition bias.
        VPO threshold: SUS (&ge;4). Tech threshold: 2.1. Bubble size &prop; &radic;volume.
        {n_total} operations, 2025 actuals.
      </p>
    </div>
  </div>
</div>

<div class="cards-row">
  <div class="card">
    <div class="big" style="color:#93C5FD">{b4_abs:.2f}%</div>
    <div class="label">OSE Best-in-Class (B4)</div>
    <div class="detail">VPO + Tech combined &middot; {n_b4} plants</div>
  </div>
  <div class="card">
    <div class="big" style="color:#6EE7B7">+{vpo_lift} pp</div>
    <div class="label">VPO is the dominant driver</div>
    <div class="detail">B2 vs B1: VPO alone lifts OSE by {vpo_lift} pp</div>
  </div>
  <div class="card">
    <div class="big" style="color:#FCA5A5">{tech_penalty:+.1f} pp</div>
    <div class="label">Tech without VPO {"hurts" if tech_penalty < 0 else "marginal"}</div>
    <div class="detail">B3 vs B1: tech {"distraction lowers" if tech_penalty < 0 else "alone barely lifts"} OSE</div>
  </div>
  <div class="card">
    <div class="big" style="color:#FCD34D">{vas_vol}M hL</div>
    <div class="label">Volume at Stake</div>
    <div class="detail">{vas_pct}% of network in B1+B3</div>
  </div>
</div>

<div class="divider"></div>

<!-- ═══ SECTION 2: Normalized OSE ═══ -->
<div class="section-title">After Controlling for <span class="accent">Zone</span></div>
<div class="section-subtitle">
  OSE<sub>rel</sub> = OSE<sub>plant</sub> &minus; OSE<sub>zone avg</sub>, aggregated by bundle (volume-weighted).
  Removes the APAC composition bias that inflates B4 absolute OSE.
</div>

<div class="norm-cards">
  <div class="norm-card highlight">
    <div class="val" style="color:#F59E0B">B2 &asymp; B4</div>
    <div class="lbl">Key finding: B4 superiority vanishes</div>
    <div class="sub">After zone control, B2 ({b2_rel:+.2f}pp) and B4 ({b4_rel:+.2f}pp) are equivalent</div>
  </div>
  <div class="norm-card">
    <div class="val" style="color:#93C5FD">{b4_rel:+.2f}pp</div>
    <div class="lbl">B4 normalized OSE<sub>rel</sub></div>
    <div class="sub">85% APAC (zone avg 83.6%) &mdash; drops from 80.7% abs to +{b4_rel:.1f}pp rel</div>
  </div>
  <div class="norm-card">
    <div class="val" style="color:#F87171">B1 worst</div>
    <div class="lbl">Baseline plants underperform zone avg</div>
    <div class="sub">B1: {b1_rel:+.2f}pp &middot; B3: {b3_rel:+.2f}pp &mdash; both below zone avg</div>
  </div>
  <div class="norm-card">
    <div class="val" style="color:#34D399">+{b4_excl_rel:.1f}pp</div>
    <div class="lbl">B4 excl APAC (AFR only, N={b4_excl_n})</div>
    <div class="sub">Small sample but strong: genuine outperformance in AFR</div>
  </div>
</div>

<div class="norm-grid">
  <div class="norm-panel">
    <h3>Normalized OSE by Bundle</h3>
    <table class="norm">
      <tr><th>Bundle</th><th>N</th><th>OSE abs</th><th>OSE<sub>rel</sub></th></tr>
      <tr class="b4-row"><td>B4 &#9733;</td><td>{br["B4"]["n_plants_with_ose"]}</td><td>{b4_abs:.1f}%</td><td class="rel {"pos" if b4_rel>=0 else "neg"}">{b4_rel:+.2f}pp</td></tr>
      <tr class="b2-row"><td>B2</td><td>{br["B2"]["n_plants_with_ose"]}</td><td>{b2_abs:.1f}%</td><td class="rel {"pos" if b2_rel>=0 else "neg"}">{b2_rel:+.2f}pp</td></tr>
      <tr class="b1-row"><td>B1</td><td>{br["B1"]["n_plants_with_ose"]}</td><td>{b1_abs:.1f}%</td><td class="rel {"pos" if b1_rel>=0 else "neg"}">{b1_rel:+.2f}pp</td></tr>
      <tr class="b3-row"><td>B3 &#9888;</td><td>{br["B3"]["n_plants_with_ose"]}</td><td>{b3_abs:.1f}%</td><td class="rel {"pos" if b3_rel>=0 else "neg"}">{b3_rel:+.2f}pp</td></tr>
    </table>
    <p class="method-note" style="margin-top:8px">
      Ranking absoluto: B4 &gt; B2 &gt; B3 &gt; B1<br>
      Ranking normalizado: <b>B2 &asymp; B4</b> &gt; B3 &gt; B1
    </p>
  </div>

  <div class="norm-panel">
    <h3>B4 Composition by Zone</h3>
    <table class="norm">
      <tr><th>Zone</th><th>N</th><th>OSE abs</th><th>OSE<sub>rel</sub></th></tr>
      {b4z_rows}
    </table>
    <p class="method-note" style="margin-top:8px">
      B4 = 85% APAC (23/27). APAC zone avg = 83.6%.<br>
      B4 APAC plants only +0.9pp above their zone peers.<br>
      B4 AFR (N=4) shows +6.0pp genuine outperformance.
    </p>
  </div>

  <div class="norm-panel">
    <h3>B2 Composition by Zone</h3>
    <table class="norm">
      <tr><th>Zone</th><th>N</th><th>OSE abs</th><th>OSE<sub>rel</sub></th></tr>
      {b2z_rows}
    </table>
    <p class="method-note" style="margin-top:8px">
      B2 = diverse (5 zones). Strongest in AFR (+19pp) and SAZ (+4.8pp).<br>
      B2 APAC plants actually <b>underperform</b> zone avg by -3.6pp.
    </p>
  </div>
</div>

<div class="norm-grid" style="grid-template-columns:1fr 1fr">
  <div class="norm-panel">
    <h3>Zone Average OSE (&Sigma;EPT/&Sigma;OST)</h3>
    <table class="norm">
      <tr><th>Zone</th><th>OSE avg</th></tr>
      {zone_avg_rows}
    </table>
    <p class="method-note" style="margin-top:8px">
      APAC at 83.6% is 20+ pp above every other zone.<br>
      Any bundle concentrated in APAC gets an automatic lift.
    </p>
  </div>

  <div class="norm-panel">
    <h3>Visual: OSE<sub>rel</sub> by Bundle</h3>
    <div style="padding:8px 0">
      <div class="bar-container">
        <div class="bar-label">B2</div>
        <div class="bar" style="width:{max(5, b2_rel * 40)}px;background:#6EE7B7"></div>
        <div class="bar-val" style="color:#6EE7B7">{b2_rel:+.2f}pp</div>
      </div>
      <div class="bar-container">
        <div class="bar-label">B4</div>
        <div class="bar" style="width:{max(5, b4_rel * 40)}px;background:#93C5FD"></div>
        <div class="bar-val" style="color:#93C5FD">{b4_rel:+.2f}pp</div>
      </div>
      <div style="height:1px;background:#334155;margin:6px 0"></div>
      <div class="bar-container">
        <div class="bar-label">B3</div>
        <div class="bar" style="width:{max(5, abs(b3_rel) * 40)}px;background:#FCA5A5"></div>
        <div class="bar-val" style="color:#FCA5A5">{b3_rel:+.2f}pp</div>
      </div>
      <div class="bar-container">
        <div class="bar-label">B1</div>
        <div class="bar" style="width:{max(5, abs(b1_rel) * 40)}px;background:#A8A29E"></div>
        <div class="bar-val" style="color:#A8A29E">{b1_rel:+.2f}pp</div>
      </div>
    </div>
    <p class="method-note" style="margin-top:4px">
      Above line = outperforms zone average.<br>
      Below line = underperforms zone average.<br>
      <b>Gap B2-B4 = {abs(b2_rel - b4_rel):.2f}pp</b> (statistically negligible).
    </p>
  </div>
</div>

<div class="footer-note">
  OSE = &Sigma;EPT / &Sigma;OST (bottom-up). OSE<sub>rel</sub> = OSE<sub>plant</sub> &minus; OSE<sub>zone_avg</sub>, vol-weighted by bundle.
  Zone avg from {ose["scope"]["plants_matched"]} matched plants. {n_total} operations, 2025 actuals.
  Generated 2026-04-01.
</div>

<script>
const SITES = [
{sites_block}
];

const ZONE_COLORS = {{
  AFR: {{fill:'rgba(251,146,60,0.70)',border:'#FB923C'}},
  SAZ: {{fill:'rgba(52,211,153,0.70)',border:'#34D399'}},
  MAZ: {{fill:'rgba(96,165,250,0.70)',border:'#60A5FA'}},
  NAZ: {{fill:'rgba(167,139,250,0.70)',border:'#A78BFA'}},
  EUR: {{fill:'rgba(244,114,182,0.70)',border:'#F472B6'}},
  APAC: {{fill:'rgba(251,113,133,0.70)',border:'#FB7185'}}
}};

const R_MIN = 6, R_MAX = 32;
const vols = SITES.map(s => s.vol);
const vMin = Math.sqrt(Math.min(...vols));
const vMax = Math.sqrt(Math.max(...vols));

function radius(v) {{
  const sv = Math.sqrt(v);
  return R_MIN + (sv - vMin) / (vMax - vMin) * (R_MAX - R_MIN);
}}

const zones = ['AFR','SAZ','MAZ','NAZ','EUR','APAC'];
const datasets = zones.map(z => {{
  const pts = SITES.filter(s => s.z === z).map(s => ({{
    x: s.t + s.jx,
    y: s.v + s.jy,
    r: radius(s.vol),
    site: s.s, zone: s.z, country: s.c,
    techScore: s.t, vpoNum: s.v, bundle: s.b,
    volume: s.vol, ose: s.ose, ttp: s.ttp, ose_rel: s.ose_rel
  }}));
  return {{
    label: z,
    data: pts,
    backgroundColor: pts.map(p => {{
      const a = p.bundle === 'B4' ? 0.85 : 0.60;
      return ZONE_COLORS[z].fill.replace(/[\\d.]+\\)$/, a + ')');
    }}),
    borderColor: pts.map(p => p.bundle === 'B4' ? '#60A5FA' : ZONE_COLORS[z].border),
    borderWidth: pts.map(p => p.bundle === 'B4' ? 2 : 1),
    hoverBorderWidth: 3,
    hoverBorderColor: '#F5A800'
  }};
}});

const ctx = document.getElementById('bubbleChart').getContext('2d');
new Chart(ctx, {{
  type: 'bubble',
  data: {{ datasets }},
  options: {{
    responsive: true,
    maintainAspectRatio: false,
    layout: {{ padding: {{ top: 20, right: 24, bottom: 12, left: 12 }} }},
    scales: {{
      x: {{
        min: 0.3, max: 2.8,
        title: {{ display: true, text: 'Tech Maturity Score (avg 9 domains)', color: '#94A3B8', font: {{ size: 13 }} }},
        ticks: {{ color: '#64748B', font: {{ size: 11 }}, stepSize: 0.5 }},
        grid: {{ color: 'rgba(51,65,85,0.3)' }}
      }},
      y: {{
        min: 1.2, max: 6.8,
        title: {{ display: true, text: 'VPO Maturity', color: '#94A3B8', font: {{ size: 13 }} }},
        ticks: {{
          callback: v => ({{2:'Basic',3:'INT',4:'SUS',5:'EXC',6:'WC'}}[v] || ''),
          color: '#64748B', font: {{ size: 11 }},
          stepSize: 1
        }},
        grid: {{ color: 'rgba(51,65,85,0.3)' }}
      }}
    }},
    plugins: {{
      legend: {{
        position: 'bottom',
        labels: {{
          color: '#94A3B8', padding: 16, font: {{ size: 12 }},
          usePointStyle: true, pointStyle: 'circle'
        }}
      }},
      tooltip: {{
        backgroundColor: '#0F172A',
        titleColor: '#F1F5F9',
        bodyColor: '#CBD5E1',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        callbacks: {{
          title: ctx => ctx[0].raw.site,
          label: ctx => {{
            const d = ctx.raw;
            const lines = [
              'Zone: ' + d.zone + ' \\u00b7 ' + d.country,
              'Tech: ' + d.techScore.toFixed(2) + ' \\u00b7 VPO: ' + ({{2:'Basic',3:'INT',4:'SUS',5:'EXC',6:'WC'}}[d.vpoNum] || d.vpoNum),
              'Bundle: ' + d.bundle,
              'Volume: ' + (d.volume/1e6).toFixed(1) + 'M hL',
              d.ose != null ? 'OSE: ' + d.ose + '%' : 'OSE: n/a'
            ];
            if (d.ose_rel != null) lines.push('OSE\\u1d63\\u2091\\u2097: ' + (d.ose_rel > 0 ? '+' : '') + d.ose_rel.toFixed(1) + 'pp vs zone');
            if (d.ttp != null) lines.push('TTP: ' + d.ttp);
            return lines;
          }}
        }}
      }},
      annotation: {{
        annotations: {{
          techLine: {{
            type: 'line', xMin: 2.1, xMax: 2.1, yMin: 1.2, yMax: 6.8,
            borderColor: 'rgba(148,163,184,0.5)', borderWidth: 1.5, borderDash: [6,4],
            label: {{ display: true, content: 'Tech 2.1', position: 'start',
              backgroundColor: 'transparent', color: '#94A3B8', font: {{ size: 10 }} }}
          }},
          vpoLine: {{
            type: 'line', yMin: 4, yMax: 4, xMin: 0.3, xMax: 2.8,
            borderColor: 'rgba(148,163,184,0.5)', borderWidth: 1.5, borderDash: [6,4],
            label: {{ display: true, content: 'SUS threshold', position: 'start',
              backgroundColor: 'transparent', color: '#94A3B8', font: {{ size: 10 }} }}
          }},
          b4bg: {{
            type: 'box', xMin: 2.1, xMax: 2.8, yMin: 4, yMax: 6.8,
            backgroundColor: 'rgba(30,58,138,0.18)', borderWidth: 0
          }},
          b2bg: {{
            type: 'box', xMin: 0.3, xMax: 2.1, yMin: 4, yMax: 6.8,
            backgroundColor: 'rgba(6,78,59,0.14)', borderWidth: 0
          }},
          b1bg: {{
            type: 'box', xMin: 0.3, xMax: 2.1, yMin: 1.2, yMax: 4,
            backgroundColor: 'rgba(71,85,105,0.10)', borderWidth: 0
          }},
          b3bg: {{
            type: 'box', xMin: 2.1, xMax: 2.8, yMin: 1.2, yMax: 4,
            backgroundColor: 'rgba(127,29,29,0.20)', borderWidth: 0
          }},
          b4label: {{
            type: 'label', xValue: 2.62, yValue: 6.5,
            content: ['Bundle 4 \\u2605','Best-in-Class'],
            color: '#93C5FD', font: {{ size: 12, weight: 'bold' }}
          }},
          b2label: {{
            type: 'label', xValue: 0.55, yValue: 6.5,
            content: ['Bundle 2','VPO sem Tech'],
            color: '#6EE7B7', font: {{ size: 11 }}
          }},
          b1label: {{
            type: 'label', xValue: 0.55, yValue: 1.5,
            content: ['Bundle 1','Baseline'],
            color: '#94A3B8', font: {{ size: 11 }}
          }},
          b3label: {{
            type: 'label', xValue: 2.62, yValue: 1.5,
            content: ['Bundle 3 \\u26a0','Tech distrai'],
            color: '#FCA5A5', font: {{ size: 11 }}
          }}
        }}
      }}
    }}
  }}
}});
</script>
</body>
</html>'''

with open(os.path.join(BASE, "vpo_tech_strategy.html"), "w") as f:
    f.write(html)

print(f"HTML generated: {len(html):,} chars, {n_total} sites, {len(sites_js)} SITES entries")
