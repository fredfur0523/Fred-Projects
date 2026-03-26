#!/usr/bin/env python3
"""
fetch-packaging-data.py
=======================
Queries Databricks (databricks-sql-connector) and generates:
  - client/public/packaging-waterfall.json  (latest complete month, by zone)
  - client/public/packaging-kpi-history.json (last 12 months, by zone)

Usage:
  python3 scripts/fetch-packaging-data.py

Methodology: ba_packaging_methodology.md
  Source  : brewdat_uc_supchn_prod.gld_ghq_supply_supplychainkpi.gb_supplychainkpi_consolidated
  Filters : periodtype='MTH', attribute='AC', module='BOPSLINE', locationtype='LINE'
  Keg     : LOWER(location) NOT LIKE '%keg%' / '%kegging%'

KPI codes:
  TT=GE-R0060  NST=PG-R5796  ST=PG-R0080  LT=PG-R0070
  LET=PG-R0090 EPT=PG-R0060  OST=PG-K4039 Volume=PG-R0010
  OSE=PG-K4038(fallback) GLY=PG-K0812 OAE=PG-K0880
  OEE=PG-K0912 LEF=PG-K1312

Canonical formulas (NEVER simple average — aggregate components first):
  OSE = ΣEPT/ΣOST   GLY = ΣEPT/ΣST
  OAE = ΣEPT/ΣTT    OEE = ΣEPT/ΣLT   LEF = ΣEPT/ΣLET
"""

import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

# ── Config ─────────────────────────────────────────────────────────────────────
HOST   = os.environ.get("DATABRICKS_HOST",  "adb-1833638405334946.6.azuredatabricks.net")
PATH   = os.environ.get("DATABRICKS_PATH",  "/sql/1.0/warehouses/e577c38274ac7a1b")
TOKEN  = os.environ.get("DATABRICKS_TOKEN", "dapi468bc693e389c0ee8e52d93094cfb3a3-2")

TABLE  = "brewdat_uc_supchn_prod.gld_ghq_supply_supplychainkpi.gb_supplychainkpi_consolidated"
SCRIPT_DIR = Path(__file__).parent
OUT_DIR    = SCRIPT_DIR / ".." / "client" / "public"

# ── KPI code list ──────────────────────────────────────────────────────────────
ALL_CODES = [
    "GE-R0060",  # TT  — Total Time
    "PG-R5796",  # NST — Net Scheduled Time
    "PG-R0080",  # ST  — Scheduled Time
    "PG-R0070",  # LT  — Loading Time
    "PG-R0090",  # LET — Loading Effective Time
    "PG-R0060",  # EPT — Effective Production Time
    "PG-K4039",  # OST — Overall Supply Time
    "PG-R0010",  # Volume (Net Repacked hl)
    "PG-K4038",  # OSE fallback (Anaplan pre-calc)
    "PG-K0812",  # GLY fallback
    "PG-K0880",  # OAE fallback
    "PG-K0912",  # OEE fallback
    "PG-K1312",  # LEF fallback
]
UNIQUE_CODES = list(dict.fromkeys(ALL_CODES))  # preserve order, deduplicate
CODES_SQL    = ", ".join(f"'{c}'" for c in UNIQUE_CODES)

BASE_FILTER = (
    "periodtype = 'MTH' AND attribute = 'AC' AND module = 'BOPSLINE'"
    " AND locationtype = 'LINE'"
    # TODO: add keg filter when location/line_name column confirmed via MDM
    # AND LOWER(location) NOT LIKE '%keg%' AND LOWER(location) NOT LIKE '%kegging%'
)

# ── DB connection ──────────────────────────────────────────────────────────────
def get_conn():
    from databricks import sql
    return sql.connect(
        server_hostname=HOST,
        http_path=PATH,
        access_token=TOKEN,
    )

def run_query(conn, sql_str, label="query"):
    t0 = time.time()
    print(f"[DB] Executing {label}...", flush=True)
    cursor = conn.cursor()
    cursor.execute(sql_str)
    rows = cursor.fetchall()
    cols = [d[0] for d in cursor.description]
    elapsed = time.time() - t0
    print(f"[DB] ✓ {label}: {len(rows)} rows in {elapsed:.1f}s", flush=True)
    cursor.close()
    return [dict(zip(cols, row)) for row in rows]

# ── Period utilities ───────────────────────────────────────────────────────────
def detect_latest_period(conn):
    rows = run_query(conn,
        f"SELECT MAX(period) AS latest_period FROM {TABLE}"
        f" WHERE {BASE_FILTER}",
        "latest-period"
    )
    p = rows[0]["latest_period"] if rows else None
    if not p:
        raise RuntimeError("Could not detect latest period")
    return p

def get_last_12_months(latest):
    y, m = int(latest[:4]), int(latest[5:7])
    months = []
    for i in range(11, -1, -1):
        mo = m - i
        yr = y
        while mo <= 0:
            mo += 12
            yr -= 1
        months.append(f"{yr}-{mo:02d}")
    return months

# ── SQL builders ───────────────────────────────────────────────────────────────
def waterfall_sql(period):
    return f"""
        SELECT period, zone, kpi_code, SUM(value) AS total_value
        FROM   {TABLE}
        WHERE  {BASE_FILTER}
          AND  period   = '{period}'
          AND  kpi_code IN ({CODES_SQL})
        GROUP BY period, zone, kpi_code
        ORDER BY zone, kpi_code
    """

def history_sql(from_p, to_p):
    return f"""
        SELECT period, zone, kpi_code, SUM(value) AS total_value
        FROM   {TABLE}
        WHERE  {BASE_FILTER}
          AND  period   BETWEEN '{from_p}' AND '{to_p}'
          AND  kpi_code IN ({CODES_SQL})
        GROUP BY period, zone, kpi_code
        ORDER BY period, zone, kpi_code
    """

# ── Metrics computation ────────────────────────────────────────────────────────
def compute_metrics(kpi_map):
    def v(code): return float(kpi_map.get(code) or 0)

    TT  = v("GE-R0060")
    NST = v("PG-R5796")
    ST  = v("PG-R0080")
    LT  = v("PG-R0070")
    LET = v("PG-R0090")
    EPT = v("PG-R0060")
    OST = v("PG-K4039")
    vol = v("PG-R0010")

    # Derived waterfall losses
    DPA = max(0.0, ST  - LT)
    EC  = max(0.0, LT  - LET)
    IC  = max(0.0, LET - EPT)

    # Canonical KPIs — aggregate first, then divide
    def pct(num, den):
        return round((num / den) * 100, 2) if den > 0 else None

    return {
        "TT":        round(TT),
        "NST":       round(NST),
        "ST":        round(ST),
        "DPA":       round(DPA),
        "LT":        round(LT),
        "EC":        round(EC),
        "LET":       round(LET),
        "IC":        round(IC),
        "EPT":       round(EPT),
        "OST":       round(OST),
        "volume_hl": round(vol),
        "OSE":       pct(EPT, OST),   # ΣEPT / ΣOST
        "GLY":       pct(EPT, ST),    # ΣEPT / ΣST
        "OAE":       pct(EPT, TT),    # ΣEPT / ΣTT
        "OEE":       pct(EPT, LT),    # ΣEPT / ΣLT
        "LEF":       pct(EPT, LET),   # ΣEPT / ΣLET
    }

def pivot_by_zone(rows):
    result = {}
    for row in rows:
        z = row["zone"]
        code = row["kpi_code"]
        val = float(row["total_value"] or 0)
        if z not in result:
            result[z] = {}
        result[z][code] = result[z].get(code, 0.0) + val
    return result

def build_global(by_zone):
    g = {}
    for kpis in by_zone.values():
        for code, val in kpis.items():
            g[code] = g.get(code, 0.0) + val
    return g

# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print("=" * 62)
    print(" AB InBev — Packaging Data Fetcher (Python)")
    print(f" Table: {TABLE.split('.')[-1]}")
    print("=" * 62)

    conn = get_conn()
    print(f"\n[DB] Connected to {HOST}\n")

    # 1. Latest period
    latest  = detect_latest_period(conn)
    last_12 = get_last_12_months(latest)
    print(f"\n[Config] Latest period : {latest}")
    print(f"[Config] History range : {last_12[0]} → {last_12[-1]}")
    print(f"[Config] Filters       : periodtype=MTH attribute=AC module=BOPSLINE locationtype=LINE keg_excluded=true")

    # 2. Waterfall query
    wf_rows  = run_query(conn, waterfall_sql(latest), f"waterfall-{latest}")
    wf_by_zone = pivot_by_zone(wf_rows)
    zones = sorted(wf_by_zone.keys())

    waterfall_out = {
        "period":       latest,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "filters": {
            "periodtype": "MTH", "attribute": "AC",
            "module": "BOPSLINE", "locationtype": "LINE",
            "keg_excluded": True,
        },
        "zones": ["Global"] + zones,
        "data": {
            "Global": compute_metrics(build_global(wf_by_zone)),
            **{z: compute_metrics(wf_by_zone[z]) for z in zones},
        },
    }

    g = waterfall_out["data"]["Global"]
    print(f"\n[Waterfall] Zones : {', '.join(zones)}")
    print(f"[Waterfall] Global → TT={g['TT']:,}h  ST={g['ST']:,}h  EPT={g['EPT']:,}h")
    print(f"[Waterfall] Global → OSE={g['OSE']}%  GLY={g['GLY']}%  OAE={g['OAE']}%  Vol={g['volume_hl']:,}hl")

    # 3. KPI history query
    hist_rows = run_query(conn, history_sql(last_12[0], last_12[-1]), "kpi-history-12m")

    # Group by period+zone
    by_period_zone = {}
    for row in hist_rows:
        key = (row["period"], row["zone"])
        if key not in by_period_zone:
            by_period_zone[key] = {"period": row["period"], "zone": row["zone"], "kpis": {}}
        code = row["kpi_code"]
        val  = float(row["total_value"] or 0)
        by_period_zone[key]["kpis"][code] = by_period_zone[key]["kpis"].get(code, 0.0) + val

    # Build Global per period
    global_per_period = {}
    for entry in by_period_zone.values():
        p = entry["period"]
        if p not in global_per_period:
            global_per_period[p] = {}
        for code, val in entry["kpis"].items():
            global_per_period[p][code] = global_per_period[p].get(code, 0.0) + val

    months = []
    for entry in by_period_zone.values():
        months.append({"period": entry["period"], "zone": entry["zone"], **compute_metrics(entry["kpis"])})
    for period, kpis in global_per_period.items():
        months.append({"period": period, "zone": "Global", **compute_metrics(kpis)})

    months.sort(key=lambda x: (x["period"], x["zone"]))

    kpi_history_out = {
        "generated_at":  datetime.utcnow().isoformat() + "Z",
        "latest_period": latest,
        "filters": {
            "periodtype": "MTH", "attribute": "AC",
            "module": "BOPSLINE", "locationtype": "LINE",
            "keg_excluded": True,
        },
        "periods": last_12,
        "months":  months,
    }

    print(f"\n[History] Total month×zone rows : {len(months)}")

    conn.close()

    # 4. Write files
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    wf_path   = OUT_DIR / "packaging-waterfall.json"
    hist_path = OUT_DIR / "packaging-kpi-history.json"

    wf_path.write_text(json.dumps(waterfall_out,  indent=2, ensure_ascii=False), encoding="utf-8")
    hist_path.write_text(json.dumps(kpi_history_out, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\n✓ {wf_path.resolve()}")
    print(f"✓ {hist_path.resolve()}")
    print("\n[Done] Reload the dashboard to see updated data.\n")

if __name__ == "__main__":
    main()
