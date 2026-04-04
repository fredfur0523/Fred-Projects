"""
debug_coverage_fractions.py
-----------------------------
Diagnóstico: mostra frações reais de cobertura por domínio × zona × nível,
e simula scores com thresholds diferentes (50%, 70%, 80%, 90%).
"""
import sys
from collections import defaultdict
from pathlib import Path

try:
    import openpyxl
    from openpyxl.utils import column_index_from_string
except ImportError:
    sys.exit("pip install openpyxl")

READINESS_XL = Path(__file__).parent / "OneMES Readiness Consolidated.xlsx"

DOMAIN_NAME_TO_CODE = {
    "Brewing Performance": "BP",
    "Data Acquisition": "DA",
    "Utilities": "UT",
    "Maintenance": "MT",
    "Management": "MG",
    "MasterData Management": "MDM",
    "Packaging Performance": "PP",
    "Quality": "QL",
    "Safety": "SF",
}

COL = {"domain": 3, "L1": 12, "L2": 13, "L3": 14, "L4": 15, "status": 16}
LEVELS = ["L1", "L2", "L3", "L4"]
LEGACY_AVAILABLE = {"must have", "necessary"}

ZONE_LEGACY_COLS = {
    "AFR":  {"T","U","V","W","X","Y","Z","AA"},
    "APAC": {"AC","AD","AE","AF","AG","AH","AI","AJ","AK","AL"},
    "SAZ":  {"AN","AO","AP","AQ","AR","AS","AT","AU","AV","AW"},
    "NAZ":  {"AY","AZ","BA","BB","BC","BD","BE","BF","BG","BH","BI","BJ","BK"},
    "MAZ":  {"BM","BN","BO","BP"},
    "EUR":  {"BR","BS","BT","BU","BV","BW","BX"},
}
ZONES = list(ZONE_LEGACY_COLS.keys())

zone_leg_idx = {
    zone: {column_index_from_string(col) - 1 for col in cols}
    for zone, cols in ZONE_LEGACY_COLS.items()
}
max_col_needed = max(idx for z in zone_leg_idx.values() for idx in z) + 1

print("Carregando planilha...")
wb = openpyxl.load_workbook(READINESS_XL, read_only=True, data_only=True)
ws = wb["Capabilities Readiness"]

# Estrutura: domain_code → zone → level → {total, avail_global, avail_legacy}
stats = defaultdict(lambda: {
    zone: {lvl: {"total": 0, "avail_g": 0, "avail_l": 0} for lvl in LEVELS}
    for zone in ZONES
})

# Also: global-only stats (ignoring zone)
global_stats = defaultdict(lambda: {lvl: {"total": 0, "ready": 0} for lvl in LEVELS})

rows_loaded = 0
for row in ws.iter_rows(min_row=2, values_only=True):
    if len(row) < max_col_needed:
        row = list(row) + [None] * (max_col_needed - len(row))

    domain_raw = row[COL["domain"]]
    if not domain_raw:
        continue
    domain_name = str(domain_raw).strip()
    if domain_name in ("Core", "Environment"):
        continue
    domain_code = DOMAIN_NAME_TO_CODE.get(domain_name)
    if domain_code is None:
        continue

    level = None
    for lvl in LEVELS:
        v = row[COL[lvl]]
        if v is not None and str(v).strip() not in ("", "None"):
            level = lvl
            break
    if level is None:
        continue

    global_ready = str(row[COL["status"]] or "").strip().upper() == "READY"
    rows_loaded += 1

    global_stats[domain_code][level]["total"] += 1
    if global_ready:
        global_stats[domain_code][level]["ready"] += 1

    for zone, idxs in zone_leg_idx.items():
        stats[domain_code][zone][level]["total"] += 1
        if global_ready:
            stats[domain_code][zone][level]["avail_g"] += 1
        legacy_available = any(
            str(row[idx] or "").strip().lower() in LEGACY_AVAILABLE
            for idx in idxs
        )
        if legacy_available:
            stats[domain_code][zone][level]["avail_l"] += 1

wb.close()
print(f"  {rows_loaded} capabilities carregadas\n")


def score_at_threshold(fracs, threshold):
    score = 0
    for lvl in LEVELS:
        frac = fracs.get(lvl)
        if frac is None:
            score = int(lvl[1])
            continue
        if frac >= threshold:
            score = int(lvl[1])
        else:
            break
    return score


THRESHOLDS = [0.50, 0.70, 0.80, 0.90]

print("=" * 90)
print("FRAÇÕES DE COBERTURA GLOBAL (Q=READY) POR DOMÍNIO × NÍVEL")
print("=" * 90)
print(f"{'Domínio':<22} {'L1 frac':>9} {'L2 frac':>9} {'L3 frac':>9} {'L4 frac':>9}  |  Score@50% Score@70% Score@80% Score@90%")
print("-" * 90)

for code in ["BP","DA","UT","MT","MG","MDM","PP","QL","SF"]:
    gs = global_stats[code]
    fracs = {}
    for lvl in LEVELS:
        t = gs[lvl]["total"]
        r = gs[lvl]["ready"]
        fracs[lvl] = (r / t) if t > 0 else None

    frac_strs = []
    for lvl in LEVELS:
        f = fracs[lvl]
        if f is None:
            frac_strs.append("  —  ")
        else:
            frac_strs.append(f"{f*100:5.1f}%")

    scores = [score_at_threshold(fracs, t) for t in THRESHOLDS]
    score_str = "  ".join(f"L{s}" for s in scores)
    print(f"  {code:<20} {'  '.join(frac_strs)}  |  {score_str}")


print("\n")
print("=" * 110)
print("FRAÇÕES DE COBERTURA POR DOMÍNIO × ZONA (G=global, L=legacy) — nível L1")
print("Para cada célula: avail_G/total | avail_L/total")
print("=" * 110)

header = f"{'Domínio':<22}"
for zone in ZONES:
    header += f"  {zone:^18}"
print(header)
print("-" * 110)

for code in ["BP","DA","UT","MT","MG","MDM","PP","QL","SF"]:
    row_str = f"  {code:<20}"
    for zone in ZONES:
        s = stats[code][zone]["L1"]
        t = s["total"]
        if t == 0:
            row_str += f"  {'—':^18}"
        else:
            g_pct = s["avail_g"] / t * 100
            l_pct = s["avail_l"] / t * 100
            row_str += f"  G:{g_pct:4.1f}% L:{l_pct:4.1f}%  "
    print(row_str)


print("\n")
print("=" * 110)
print("SCORES PROJETADOS POR DOMÍNIO × ZONA (assumindo G para global, L para legacy)")
print("Threshold: 90%  |  Usando tipo G → frações globais, tipo L → frações legacy")
print("=" * 110)

print(f"\n--- Usando tipo G (global) ---")
header = f"{'Domínio':<22}"
for zone in ZONES:
    header += f"  {zone:>7}"
print(header)
print("-" * 70)
for code in ["BP","DA","UT","MT","MG","MDM","PP","QL","SF"]:
    row_str = f"  {code:<20}"
    for zone in ZONES:
        fracs = {}
        for lvl in LEVELS:
            s = stats[code][zone][lvl]
            t = s["total"]
            fracs[lvl] = (s["avail_g"] / t) if t > 0 else None
        sc = score_at_threshold(fracs, 0.90)
        row_str += f"  L{sc:>5}"
    print(row_str)

print(f"\n--- Usando tipo L (legacy) ---")
header = f"{'Domínio':<22}"
for zone in ZONES:
    header += f"  {zone:>7}"
print(header)
print("-" * 70)
for code in ["BP","DA","UT","MT","MG","MDM","PP","QL","SF"]:
    row_str = f"  {code:<20}"
    for zone in ZONES:
        fracs = {}
        for lvl in LEVELS:
            s = stats[code][zone][lvl]
            t = s["total"]
            fracs[lvl] = (s["avail_l"] / t) if t > 0 else None
        sc = score_at_threshold(fracs, 0.90)
        row_str += f"  L{sc:>5}"
    print(row_str)


print("\n")
print("=" * 90)
print("SIMULAÇÃO: se THRESHOLD fosse 50% / 70% / 80% / 90%")
print("Quantos domínios × zona atingiriam cada score (tipo G = global delivery)")
print("=" * 90)
for thresh in THRESHOLDS:
    dist = defaultdict(int)
    count = 0
    for code in ["BP","DA","UT","MT","MG","MDM","PP","QL","SF"]:
        for zone in ZONES:
            fracs = {}
            for lvl in LEVELS:
                s = stats[code][zone][lvl]
                t = s["total"]
                fracs[lvl] = (s["avail_g"] / t) if t > 0 else None
            sc = score_at_threshold(fracs, thresh)
            dist[sc] += 1
            count += 1
    l_counts = "  ".join(f"L{i}:{dist[i]:>3}" for i in range(5))
    print(f"  @{thresh*100:.0f}%:  {l_counts}")

print("\n")
print("=" * 90)
print("DETALHAMENTO SAZ — frações reais por domínio × nível (para debug)")
print("G=global, L=legacy (SAZ cols: AN-AW)")
print("=" * 90)
zone = "SAZ"
for code in ["BP","DA","UT","MT","MG","MDM","PP","QL","SF"]:
    print(f"\n  {code}:")
    g_fracs = {}
    l_fracs = {}
    for lvl in LEVELS:
        s = stats[code][zone][lvl]
        t = s["total"]
        g_fracs[lvl] = (s["avail_g"] / t) if t > 0 else None
        l_fracs[lvl] = (s["avail_l"] / t) if t > 0 else None
        g_str = f"{g_fracs[lvl]*100:5.1f}%" if g_fracs[lvl] is not None else "  —  "
        l_str = f"{l_fracs[lvl]*100:5.1f}%" if l_fracs[lvl] is not None else "  —  "
        print(f"    {lvl}: total={t:>4}  G={g_str}  L={l_str}")
    g_sc = score_at_threshold(g_fracs, 0.90)
    l_sc = score_at_threshold(l_fracs, 0.90)
    print(f"    → Score@90%: G=L{g_sc}, L=L{l_sc}")

print("\nDone.")
