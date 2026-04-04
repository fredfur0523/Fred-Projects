"""
project_coverage_from_readiness.py
------------------------------------
Projeta o nível de maturidade L0–L4 por domínio e por site, cruzando:
  - CSV_DATA + SITE_DOMAIN_TYPE do App.tsx (sites, zonas, tipo G/L por domínio)
  - OneMES Readiness Consolidated.xlsx (capabilities por nível por domínio)

REGRAS (validadas com o usuário):
  1. Uma capability está DISPONÍVEL para um site se:
       - O site usa Global (G) no domínio  →  Q = "READY"
       - O site usa Legacy (L) no domínio  →  qualquer sistema legado da zona
                                               tem valor "Must Have" OR "Necessary"
                                               (usa colunas individuais, não a consolidada)

  2. Nível de um domínio para um site (cumulativo, 90%):
       - Score = nível mais alto L onde, para TODOS os níveis 1..L:
           (disponíveis_no_nível / total_no_nível) >= 0.90
       - Se um nível não tem capabilities definidas → vacuosamente aprovado
       - Se L1 < 90% → score = 0 (L0)

  3. Score do site = MÍNIMO dos scores de domínio dos domínios ATIVOS
       (domínios onde SITE_DOMAIN_TYPE tem G ou L)

  4. Excluir: Core, Environment
     Incluir: BP, DA, UT, MT, MG, MDM, PP, QL, SF

  5. Análise secundária: % de capabilities cobertas via Global vs Legacy

Output: docs/coverage_projection_dashboard.html
"""

import json, re, sys
from collections import defaultdict
from pathlib import Path

try:
    import openpyxl
    from openpyxl.utils import column_index_from_string
except ImportError:
    sys.exit("pip install openpyxl")

# ──────────────────────────────────────────────────────────────────────────────
# Configuração
# ──────────────────────────────────────────────────────────────────────────────

APP_TSX      = Path(__file__).parent.parent / "client" / "src" / "App.tsx"
READINESS_XL = Path(__file__).parent / "OneMES Readiness Consolidated.xlsx"
OUT_HTML     = Path(__file__).parent / "coverage_projection_dashboard.html"

# Domínios ativos (excluir Core e Environment)
DOMAIN_MAP = {          # code no dashboard → nome na planilha
    "BP":  "Brewing Performance",
    "DA":  "Data Acquisition",
    "UT":  "Utilities",
    "MT":  "Maintenance",
    "MG":  "Management",
    "MDM": "MasterData Management",
    "PP":  "Packaging Performance",
    "QL":  "Quality",
    "SF":  "Safety",
}
DOMAIN_NAME_TO_CODE = {v: k for k, v in DOMAIN_MAP.items()}
DOMAIN_CODES = list(DOMAIN_MAP.keys())   # ordem do CSV

# Colunas da planilha (0-indexed)
COL = {
    "domain":  3,   # D
    "product": 4,   # E
    "n1":      6,   # G
    "n4_func": 9,   # J
    "L1":     12,   # M
    "L2":     13,   # N
    "L3":     14,   # O
    "L4":     15,   # P
    "status": 16,   # Q
    "year":   17,   # R
}

# Sistemas legados por zona — colunas das planilha (letra → nome do sistema)
# Os produtos são sempre as colunas entre duas zonas, À ESQUERDA da consolidada
ZONE_LEGACY_COLS = {
    "AFR":  {"T":"Traksys","U":"IAL PT","V":"HSEC","W":"Credit360",
             "X":"SAP PM","Y":"Flow","Z":"MMIS","AA":"Digital Brewsheets"},
    "APAC": {"AC":"LIMS China","AD":"NCM","AE":"India/V/K","AF":"DST",
             "AG":"Data Factory","AH":"Line view","AI":"SAP PM",
             "AJ":"DVPO","AK":"EMS","AL":"Lifecycle"},
    "SAZ":  {"AN":"Athena","AO":"LMS","AP":"SAP PM","AQ":"Ceres",
             "AR":"Argos","AS":"Smartcheck","AT":"Growler",
             "AU":"Soda 1.0","AV":"Oraculo","AW":"Soda Vision"},
    "NAZ":  {"AY":"PTA","AZ":"FLEX","BA":"IMS","BB":"EIT","BC":"LIMS",
             "BD":"BIER/recipe app","BE":"CA PowerBI/Excel",
             "BF":"US PowerBI/Excel","BG":"BPA","BH":"SAP PM",
             "BI":"Safety Apps","BJ":"TRAKSYS LMS","BK":"PG13/14"},
    "MAZ":  {"BM":"Traksys CORE","BN":"Mangyver","BO":"Suite 360","BP":"Safety Portal"},
    "EUR":  {"BR":"SIGMA","BS":"LMS Live view","BT":"Digital Operator Workstation",
             "BU":"EUR data collection BBX","BV":"InterAction Log",
             "BW":"LPA Digital ecosystem","BX":"Excel"},
}
ZONES = list(ZONE_LEGACY_COLS.keys())

# Valores que indicam "capability disponível" nos sistemas legados
LEGACY_AVAILABLE = {"must have", "necessary"}

LEVEL_THRESHOLD = 0.90   # 90%
LEVELS = ["L1", "L2", "L3", "L4"]

# ──────────────────────────────────────────────────────────────────────────────
# V3: subset de capabilities obrigatórias (proposta estratégica baseada no PDF)
# Formato: { domain_code: { level: {produtos incluídos} } }
# Se o nível não está mapeado → inclui todos os produtos daquele domínio
# Se está mapeado → inclui APENAS os produtos listados
# ──────────────────────────────────────────────────────────────────────────────
V3_MANDATORY = {
    # BP: L1 obrigatório = apenas 'Production Order' (basic OSE management per PDF)
    # Exclui 'Brewing performance' L1 (153 caps granulares de recipe/cellar — L2+)
    "BP": {
        "L1": {"Production Order"},
        "L2": {"Production Order"},
        "L3": {"Production Order"},
    },
    # MT: L1 obrigatório = apenas 'Max WO' (maintenance execution per PDF)
    # Exclui 'Max PS' L1 (planejamento avançado — L2+)
    # L2+ inclui Max PS + Maintenance One (KPI dashboards, connected planning)
    "MT": {
        "L1": {"Max WO"},
        "L2": {"Max WO", "Maintenance One"},
        "L3": {"Max WO", "Maintenance One", "Max PS"},
        "L4": {"Max WO", "Maintenance One", "Max PS"},
    },
    # MG: L1 = execução operacional básica (IAL, Acadia, GOPs)
    # Exclui KPI-PI L1 (0% READY, configuração) e SPLAN (começa em L2)
    "MG": {
        "L1": {"IAL", "Acadia", "GOPs & Toolkits"},
        "L2": {"IAL", "Acadia", "GOPs & Toolkits", "SPLAN", "KPI-PI", "Eureka"},
        "L3": {"IAL", "Acadia", "GOPs & Toolkits", "SPLAN", "KPI-PI", "Eureka"},
    },
    # QL: L1 = execução de checks e CIP (PTS Execution + Process Hygiene)
    # Exclui 'PTS Management' L1 (84 caps de configuração de parâmetros — não execução)
    # Exclui 'Production Order' QL L1 (duplica escopo de BP/PP)
    "QL": {
        "L1": {"PTS Execution", "Process Hygiene"},
        "L2": {"PTS Execution", "Process Hygiene", "PTS Management"},
        "L3": {"PTS Execution", "Process Hygiene", "PTS Management", "Production Order"},
    },
    # DA, MDM, PP, SF: todos os produtos são core — sem filtragem por produto
    # (UT: sem capabilities na planilha — não aparece aqui)
}

ZONE_COLORS  = {"AFR":"#d97706","APAC":"#0891b2","SAZ":"#16a34a",
                "NAZ":"#4f46e5","MAZ":"#9333ea","EUR":"#db2777"}
LEVEL_COLORS = {
    "L0": {"fill":"#374151","text":"#9ca3af"},
    "L1": {"fill":"#ffe066","text":"#78350f"},
    "L2": {"fill":"#ffc000","text":"#451a03"},
    "L3": {"fill":"#f59e0b","text":"#292524"},
    "L4": {"fill":"#10b981","text":"#fff"},
}

def vol_group(v: int) -> str:
    return "G1" if v < 2_000_000 else "G2" if v < 6_000_000 else "G3"


# ──────────────────────────────────────────────────────────────────────────────
# 1. Parse App.tsx
# ──────────────────────────────────────────────────────────────────────────────

def parse_apptsx():
    src = APP_TSX.read_text(encoding="utf-8")

    # SITE_DOMAIN_TYPE
    m = re.search(r'const SITE_DOMAIN_TYPE\s*:.*?=\s*(\{.*?\});', src, re.DOTALL)
    if not m:
        sys.exit("SITE_DOMAIN_TYPE não encontrado")
    sdt = json.loads(m.group(1))

    # CSV_DATA
    m = re.search(r'const CSV_DATA\s*=\s*`(.*?)`', src, re.DOTALL)
    if not m:
        sys.exit("CSV_DATA não encontrado")

    sites = []
    for line in m.group(1).strip().split("\n")[1:]:
        p = line.strip().split(",")
        if len(p) < 13:
            continue
        vol = int(p[3]) if p[3].isdigit() else 0
        # CSV: Zone,Site,Country,Volume,BP,DA,UT,MT,MG,MDM,PP,QL,SF,Score
        sites.append({
            "zone":    p[0],
            "name":    p[1],
            "country": p[2],
            "volume":  vol,
            "group":   vol_group(vol),
            "current_scores": {
                code: int(p[i]) if p[i].strip().lstrip("-").isdigit() else 0
                for code, i in zip(DOMAIN_CODES, range(4, 13))
            },
            "current_total": float(p[13]) if p[13].replace(".", "").lstrip("-").isdigit() else 0.0,
        })

    print(f"  CSV_DATA: {len(sites)} sites  |  SITE_DOMAIN_TYPE: {len(sdt)} entradas")
    return sites, sdt


# ──────────────────────────────────────────────────────────────────────────────
# 2. Carregar capabilities da planilha
# ──────────────────────────────────────────────────────────────────────────────

def load_capability_records():
    """
    Retorna lista de dicts, um por capability row com mark de nível:
      {
        domain_code: str,
        product: str,
        level: 'L1'|'L2'|'L3'|'L4',
        global_ready: bool,
        zone_available: {zone: bool},   # True se QUALQUER legacy system = "Must Have" | "Necessary"
      }
    Exclui Core e Environment. Exclui rows sem mark de nível.
    """
    wb = openpyxl.load_workbook(READINESS_XL, read_only=True, data_only=True)
    ws = wb["Capabilities Readiness"]

    # Índices 0-based para colunas de legacy de cada zona
    zone_leg_idx = {
        zone: {column_index_from_string(col) - 1: sys_name
               for col, sys_name in cols.items()}
        for zone, cols in ZONE_LEGACY_COLS.items()
    }
    max_col_needed = max(idx for z in zone_leg_idx.values() for idx in z) + 1

    records = []
    domain_stats = defaultdict(lambda: {l: {"total": 0, "ready": 0} for l in LEVELS})

    for row in ws.iter_rows(min_row=2, values_only=True):
        # Padding caso a row seja curta
        if len(row) < max_col_needed:
            row = list(row) + [None] * (max_col_needed - len(row))

        domain_raw = row[COL["domain"]]
        if not domain_raw:
            continue
        domain_name = str(domain_raw).strip()

        # Excluir Core e Environment
        if domain_name in ("Core", "Environment"):
            continue

        domain_code = DOMAIN_NAME_TO_CODE.get(domain_name)
        if domain_code is None:
            continue  # domínio não mapeado

        # Qual nível está marcado? (mutuamente exclusivo)
        level = None
        for lvl in LEVELS:
            v = row[COL[lvl]]
            if v is not None and str(v).strip() not in ("", "None"):
                level = lvl
                break
        if level is None:
            continue  # sem mark de nível

        product = str(row[COL["product"]] or "").strip()
        global_ready = str(row[COL["status"]] or "").strip().upper() == "READY"

        # Disponibilidade nos sistemas legados por zona
        zone_available = {}
        for zone, leg_map in zone_leg_idx.items():
            available = any(
                str(row[idx] or "").strip().lower() in LEGACY_AVAILABLE
                for idx in leg_map
            )
            zone_available[zone] = available

        # V3: mandatory flag — True se o capability faz parte do subset estratégico
        domain_v3 = V3_MANDATORY.get(domain_code)
        if domain_v3 is None:
            mandatory = True  # domínio sem filtragem → todos obrigatórios
        else:
            allowed = domain_v3.get(level)
            if allowed is None:
                mandatory = True  # nível sem filtragem → todos obrigatórios
            else:
                mandatory = product in allowed

        records.append({
            "domain_code":   domain_code,
            "product":       product,
            "level":         level,
            "global_ready":  global_ready,
            "zone_available": zone_available,
            "mandatory":     mandatory,   # V3 flag
        })

        domain_stats[domain_name][level]["total"] += 1
        if global_ready:
            domain_stats[domain_name][level]["ready"] += 1

    wb.close()

    # Relatório
    print(f"\n  {len(records)} capabilities com mark de nível carregadas")
    print(f"\n  {'Domínio':<28} {'L1':>5} {'L2':>5} {'L3':>5} {'L4':>5}  {'READY%':>7}")
    print(f"  {'-'*65}")
    for dn in sorted(domain_stats.keys()):
        ds = domain_stats[dn]
        total_all = sum(ds[l]["total"] for l in LEVELS)
        ready_all = sum(ds[l]["ready"] for l in LEVELS)
        pct = f"{ready_all/total_all*100:.0f}%" if total_all else "—"
        row_str = "  ".join(f"{ds[l]['total']:>5}" for l in LEVELS)
        print(f"  {dn:<28} {row_str}  {pct:>7}")

    return records


# ──────────────────────────────────────────────────────────────────────────────
# 3. Calcular scores por domínio por site
# ──────────────────────────────────────────────────────────────────────────────

def domain_score_from_fractions(fractions: dict) -> int:
    """
    Regra cumulativa 90%:
      - Itera L1 → L2 → L3 → L4
      - Se fração >= 90%: avança o score
      - Se fração < 90%: para
      - Se não há capabilities no nível (fração=None): vacuosamente aprovado, avança
    Retorna int 0..4
    """
    score = 0
    for lvl in LEVELS:
        frac = fractions.get(lvl)
        if frac is None:
            # Nenhuma capability definida neste nível → vacuosamente aprovado
            score = int(lvl[1])   # avança p/ este nível
            continue
        if frac >= LEVEL_THRESHOLD:
            score = int(lvl[1])
        else:
            break  # não atinge este nível, para aqui
    return score


def _score_domain(caps, sys_type, zone, mandatory_only: bool):
    """Calcula score de um domínio para um site dado o tipo (G/L) e zona."""
    level_totals = defaultdict(int)
    level_avail  = defaultdict(int)
    level_gl     = defaultdict(lambda: {"global": 0, "legacy": 0})

    for cap in caps:
        if mandatory_only and not cap["mandatory"]:
            continue
        lvl = cap["level"]
        level_totals[lvl] += 1
        if sys_type == "G" and cap["global_ready"]:
            level_avail[lvl] += 1
            level_gl[lvl]["global"] += 1
        elif sys_type == "L" and cap["zone_available"].get(zone, False):
            level_avail[lvl] += 1
            level_gl[lvl]["legacy"] += 1

    fracs = {}
    for lvl in LEVELS:
        total = level_totals.get(lvl, 0)
        fracs[lvl] = None if total == 0 else level_avail.get(lvl, 0) / total

    score = domain_score_from_fractions(fracs)
    gl_counts = {
        lvl: {
            "avail":  level_avail.get(lvl, 0),
            "total":  level_totals.get(lvl, 0),
            "global": level_gl[lvl]["global"],
            "legacy": level_gl[lvl]["legacy"],
            "frac":   fracs[lvl],
        }
        for lvl in LEVELS
    }
    return score, fracs, gl_counts


def _site_min(domain_scores: dict) -> int:
    """Score do site = mínimo dos domínios ativos, excluindo UT (dados faltantes)."""
    scores = {c: s for c, s in domain_scores.items() if c != "UT"}
    return min(scores.values()) if scores else (min(domain_scores.values()) if domain_scores else 0)


def compute_scores(sites, sdt, records):
    """
    Para cada site calcula scores V2 (todos caps) e V3 (caps obrigatórias per PDF).
    V1 = current_total já vem do CSV_DATA (survey existente).
    """
    by_domain = defaultdict(list)
    for r in records:
        by_domain[r["domain_code"]].append(r)

    enriched = []
    for site in sites:
        zone    = site["zone"]
        sdt_map = sdt.get(site["name"], {})

        v2_scores = {}; v2_fracs = {}; v2_gl = {}
        v3_scores = {}; v3_fracs = {}; v3_gl = {}

        for code in DOMAIN_CODES:
            sys_type = sdt_map.get(code)
            if sys_type is None:
                continue

            caps = by_domain.get(code, [])

            sc2, fr2, gl2 = _score_domain(caps, sys_type, zone, mandatory_only=False)
            sc3, fr3, gl3 = _score_domain(caps, sys_type, zone, mandatory_only=True)

            v2_scores[code] = sc2; v2_fracs[code] = fr2; v2_gl[code] = gl2
            v3_scores[code] = sc3; v3_fracs[code] = fr3; v3_gl[code] = gl3

        enriched.append({
            **site,
            "domain_types":    sdt_map,
            # V2: todos os capabilities
            "domain_scores":   v2_scores,
            "domain_fracs":    v2_fracs,
            "domain_gl":       v2_gl,
            "site_score":      _site_min(v2_scores),
            # V3: capabilities obrigatórias (proposta estratégica)
            "domain_scores_v3": v3_scores,
            "domain_fracs_v3":  v3_fracs,
            "domain_gl_v3":     v3_gl,
            "site_score_v3":    _site_min(v3_scores),
        })

    return enriched


# ──────────────────────────────────────────────────────────────────────────────
# 4. Agregações
# ──────────────────────────────────────────────────────────────────────────────

def level_label(score: int) -> str:
    return f"L{score}"


def _funnel(pool, score_fn):
    """Funil cumulativo usando score_fn(site) → score int."""
    result = {}
    n = len(pool)
    for lvl_n in range(5):
        lvl = f"L{lvl_n}"
        if lvl_n == 0:
            result[lvl] = {"n": n, "pct": 100.0}
        else:
            el = [s for s in pool if score_fn(s) >= lvl_n]
            result[lvl] = {"n": len(el), "pct": round(len(el) / n * 100, 1) if n else 0}
    return result


def aggregate_site_funnel(sites):
    """Funil por zona para as 3 visões: V1 (survey), V2 (all caps), V3 (mandatory)."""
    result = {}
    for zone_key in ["ALL"] + ZONES:
        pool = sites if zone_key == "ALL" else [s for s in sites if s["zone"] == zone_key]
        if not pool:
            continue
        n = len(pool)
        result[zone_key] = {
            "count":   n,
            "v1":      _funnel(pool, lambda s: round(s["current_total"])),
            "v2":      _funnel(pool, lambda s: s["site_score"]),
            "v3":      _funnel(pool, lambda s: s["site_score_v3"]),
            "avg_v1":  round(sum(s["current_total"]  for s in pool) / n, 2),
            "avg_v2":  round(sum(s["site_score"]     for s in pool) / n, 2),
            "avg_v3":  round(sum(s["site_score_v3"]  for s in pool) / n, 2),
        }
    return result


def _domain_zone_entry(active, code, score_key, gl_key):
    """Agrega funil e GL breakdown para uma combinação domínio×zona×visão."""
    n = len(active)
    dist = defaultdict(int)
    for s in active:
        scores = s[score_key]
        dist[scores.get(code, 0)] += 1

    funnel = {}
    for lvl_n in range(5):
        lvl = f"L{lvl_n}"
        if lvl_n == 0:
            funnel[lvl] = {"n": n, "pct": 100.0}
        else:
            cnt = sum(v for k, v in dist.items() if k >= lvl_n)
            funnel[lvl] = {"n": cnt, "pct": round(cnt / n * 100, 1) if n else 0}

    gl_by_level = {}
    for lvl in LEVELS:
        n_global = sum(s[gl_key][code][lvl]["global"] for s in active if code in s[gl_key])
        n_legacy = sum(s[gl_key][code][lvl]["legacy"] for s in active if code in s[gl_key])
        n_total  = sum(s[gl_key][code][lvl]["total"]  for s in active if code in s[gl_key])
        n_avail  = sum(s[gl_key][code][lvl]["avail"]  for s in active if code in s[gl_key])
        gl_by_level[lvl] = {
            "pct_avail":  round(n_avail  / n_total * 100, 1) if n_total else 0,
            "pct_global": round(n_global / n_avail * 100, 1) if n_avail else 0,
            "pct_legacy": round(n_legacy / n_avail * 100, 1) if n_avail else 0,
        }

    n_g = sum(1 for s in active if s["domain_types"].get(code) == "G")
    n_l = sum(1 for s in active if s["domain_types"].get(code) == "L")
    return {
        "active":          n,
        "n_global_sites":  n_g,
        "n_legacy_sites":  n_l,
        "funnel":          funnel,
        "dist":            dict(dist),
        "gl_by_level":     gl_by_level,
    }


def aggregate_domain_funnel(sites):
    """Por domínio × zona: funil V2 e V3 em paralelo."""
    result = {}
    for code in DOMAIN_CODES:
        result[code] = {}
        for zone_key in ["ALL"] + ZONES:
            pool   = sites if zone_key == "ALL" else [s for s in sites if s["zone"] == zone_key]
            active = [s for s in pool if code in s["domain_scores"]]
            if not active:
                result[code][zone_key] = None
                continue
            result[code][zone_key] = {
                "v2": _domain_zone_entry(active, code, "domain_scores",    "domain_gl"),
                "v3": _domain_zone_entry(active, code, "domain_scores_v3", "domain_gl_v3"),
            }
    return result


def aggregate_product_view(sites, records):
    """
    Para cada domínio: quais produtos contribuem para cada nível?
    Mostra total de capabilities por produto × nível e % READY global.
    """
    # {domain_code: {product: {level: {total, ready}}}}
    prod_data = defaultdict(lambda: defaultdict(lambda: defaultdict(lambda: {"total": 0, "ready": 0})))
    for r in records:
        prod_data[r["domain_code"]][r["product"]][r["level"]]["total"] += 1
        if r["global_ready"]:
            prod_data[r["domain_code"]][r["product"]][r["level"]]["ready"] += 1

    result = {}
    for code, products in prod_data.items():
        result[code] = []
        for prod_name, levels in sorted(products.items()):
            entry = {"product": prod_name, "levels": {}}
            for lvl in LEVELS:
                d = levels.get(lvl, {"total": 0, "ready": 0})
                entry["levels"][lvl] = {
                    "total": d["total"],
                    "ready": d["ready"],
                    "pct_ready": round(d["ready"] / d["total"] * 100, 1) if d["total"] else 0,
                }
            result[code].append(entry)
    return result


# ──────────────────────────────────────────────────────────────────────────────
# 5. HTML
# ──────────────────────────────────────────────────────────────────────────────

HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Coverage Projection — OneMES</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.page{max-width:1440px;margin:0 auto;padding:24px}
h1{font-size:1.5rem;font-weight:700;color:#f1f5f9;margin-bottom:4px}
.subtitle{color:#94a3b8;font-size:.85rem;margin-bottom:20px;line-height:1.6;max-width:900px}
.rule-box{background:#1e2d45;border:1px solid #1d4ed8;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:.8rem;color:#93c5fd;line-height:1.7}
.rule-box strong{color:#e2e8f0}
.kpi-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:22px}
.kpi{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:12px 16px;min-width:130px}
.kpi-val{font-size:1.75rem;font-weight:700;color:#38bdf8}
.kpi-label{font-size:.74rem;color:#94a3b8;margin-top:2px}
.section{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:18px;margin-bottom:20px}
.section-title{font-size:1rem;font-weight:600;color:#f1f5f9;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.badge{font-size:.68rem;padding:2px 8px;border-radius:16px;font-weight:500}
.b-blue{background:#1d4ed8;color:#bfdbfe}
.b-amber{background:#92400e;color:#fde68a}
.b-green{background:#065f46;color:#a7f3d0}
.b-purple{background:#4c1d95;color:#ddd6fe}
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.tab{padding:4px 12px;border-radius:16px;border:1px solid #334155;background:#0f172a;color:#94a3b8;cursor:pointer;font-size:.78rem;font-weight:500;transition:all .15s}
.tab:hover{color:#38bdf8;border-color:#38bdf8}
.tab.active{background:#0ea5e9;color:#fff;border-color:#0ea5e9}
/* Funnel */
.funnel-header{display:grid;grid-template-columns:48px 1fr 1fr 52px 52px 52px;gap:8px;font-size:.68rem;color:#475569;margin-bottom:6px;padding:0 2px;text-align:center}
.funnel-header div:first-child{text-align:right;padding-right:6px}
.frow{display:grid;grid-template-columns:48px 1fr 1fr 52px 52px 52px;gap:8px;align-items:center;margin-bottom:5px}
.flabel{font-size:.8rem;font-weight:700;text-align:right;padding-right:6px}
.bar-bg{height:28px;background:#0f172a;border-radius:5px;overflow:hidden;cursor:default}
.bar-fill{height:100%;border-radius:5px;display:flex;align-items:center;padding:0 7px;font-size:.74rem;font-weight:700;min-width:4px}
.stat{font-size:.76rem;color:#94a3b8;text-align:center}
.dp{color:#34d399;font-weight:700;text-align:center;font-size:.76rem}
.dn{color:#f87171;font-weight:700;text-align:center;font-size:.76rem}
.dz{color:#475569;font-weight:700;text-align:center;font-size:.76rem}
/* Domain grid */
.dgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
.dcard{background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:14px}
.dcard-title{font-size:.85rem;font-weight:600;color:#e2e8f0;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center}
.dcard-funnel{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}
.dcard-row{display:flex;align-items:center;gap:8px;font-size:.74rem}
.dcard-lvl{width:22px;text-align:right;color:#64748b;font-weight:700}
.dcard-bar-bg{flex:1;height:16px;background:#1e293b;border-radius:4px;overflow:hidden}
.dcard-bar-fill{height:100%;border-radius:4px;display:flex;align-items:center;padding:0 5px;font-size:.68rem;font-weight:700}
.dcard-n{width:28px;text-align:right;font-size:.72rem;color:#64748b}
/* GL stacked */
.stk{height:10px;border-radius:5px;overflow:hidden;display:flex;margin-top:6px}
.stk .sg{background:#38bdf8}
.stk .sl{background:#f59e0b}
.stk .sn{background:#1e293b}
.gl-row{display:flex;gap:10px;font-size:.71rem;color:#64748b;margin-top:5px}
.gl-row span{display:flex;align-items:center;gap:3px}
.dot{width:7px;height:7px;border-radius:50%;display:inline-block}
/* Product table */
.prod-table{width:100%;border-collapse:collapse;font-size:.79rem}
.prod-table th{background:#0f172a;color:#64748b;padding:6px 10px;text-align:left;border-bottom:1px solid #334155;font-weight:500}
.prod-table td{padding:6px 10px;border-bottom:1px solid #1e293b;vertical-align:top}
.prod-table tr:hover td{background:#1a2744}
.lvl-cell{display:flex;gap:4px;align-items:center;flex-wrap:wrap}
.cap-pill{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:10px;font-size:.7rem;font-weight:600}
/* Site table */
.scroll{max-height:480px;overflow-y:auto;border-radius:8px;border:1px solid #334155}
table.st{width:100%;border-collapse:collapse;font-size:.78rem}
table.st th{background:#0f172a;color:#64748b;padding:6px 9px;text-align:left;border-bottom:1px solid #334155;position:sticky;top:0;font-weight:500}
table.st td{padding:6px 9px;border-bottom:1px solid #1e293b;vertical-align:middle}
table.st tr:hover td{background:#1a2744}
.lchip{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.72rem;font-weight:700}
.tg{color:#60a5fa;font-size:.7rem;font-weight:600}
.tl{color:#fca5a5;font-size:.7rem;font-weight:600}
.tn{color:#374151;font-size:.7rem}
.search-bar{background:#0f172a;border:1px solid #334155;border-radius:8px;padding:6px 12px;color:#e2e8f0;font-size:.82rem;width:260px;outline:none}
.search-bar:focus{border-color:#38bdf8}
</style>
</head>
<body>
<div class="page">
<h1>Coverage Projection — OneMES Capabilities</h1>
<p class="subtitle">
  Projeção de nível L0–L4 por domínio e por site, cruzando SITE_DOMAIN_TYPE com capabilities do OneMES Readiness.
</p>
<div class="rule-box">
  <strong>Regras aplicadas:</strong>
  Capability disponível = <strong>Global (G)</strong>: Q=READY &nbsp;|&nbsp;
  <strong>Legacy (L)</strong>: coluna do sistema da zona = "Must Have" ou "Necessary". &nbsp;·&nbsp;
  <strong>Nível do domínio</strong> = nível mais alto onde ≥90% das capabilities estão disponíveis (cumulativo). &nbsp;·&nbsp;
  <strong>Nível do site</strong> = mínimo entre os domínios ativos. &nbsp;·&nbsp;
  Excluídos: Core, Environment.
</div>

<div class="kpi-row" id="kpi-row"></div>

<!-- ── Seção 1: Funil por site/zona ── -->
<div class="section">
  <div class="section-title">
    Funil por Site / Zona — Atual vs Projetado
    <span class="badge b-blue">score do site = mínimo dos domínios ativos</span>
  </div>
  <div class="tabs" id="sf-tabs"></div>
  <div class="funnel-header">
    <div></div>
    <div>Atual (survey)</div>
    <div>Projetado (capabilities ≥90%)</div>
    <div>Cur n</div>
    <div>Prj n</div>
    <div>Δ</div>
  </div>
  <div id="sf-funnel"></div>
</div>

<!-- ── Seção 2: Funil por domínio ── -->
<div class="section">
  <div class="section-title">
    Funil por Domínio
    <span class="badge b-amber">clique na zona para filtrar</span>
  </div>
  <div class="tabs" id="df-tabs"></div>
  <div class="dgrid" id="df-grid"></div>
</div>

<!-- ── Seção 3: Produtos por domínio ── -->
<div class="section">
  <div class="section-title">
    Produtos por Domínio — Capabilities por Nível
    <span class="badge b-purple">Global readiness % por produto</span>
  </div>
  <div class="tabs" id="prod-tabs"></div>
  <div id="prod-wrap"></div>
</div>

<!-- ── Seção 4: Tabela de sites ── -->
<div class="section">
  <div class="section-title">Tabela de Sites</div>
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px">
    <div class="tabs" id="st-tabs" style="margin:0"></div>
    <input class="search-bar" id="search" placeholder="Buscar site ou país…"/>
  </div>
  <div class="scroll" id="st-wrap"></div>
</div>

</div>
<script>
const D = __DATA__;
const ZONES = D.zones;
const DCODES = D.domain_codes;
const LC = D.level_colors;
const ZC = D.zone_colors;
const LEVELS = ['L0','L1','L2','L3','L4'];
const LEVELS14 = ['L1','L2','L3','L4'];

// ── utils ──
function chip(score) {
  const l = `L${score}`;
  return `<span class="lchip" style="background:${LC[l].fill};color:${LC[l].text}">${l}</span>`;
}
function tabs(containerId, labels, onSelect, colorFn) {
  const el = document.getElementById(containerId);
  labels.forEach((lbl,i) => {
    const t = document.createElement('button');
    t.className='tab'+(i===0?' active':'');
    t.textContent=lbl;
    if(colorFn) { const c=colorFn(lbl); if(c) t.style.borderColor=c; }
    t.onclick=()=>{ el.querySelectorAll('.tab').forEach(x=>x.classList.remove('active')); t.classList.add('active'); onSelect(lbl); };
    el.appendChild(t);
  });
}
function deltaClass(d){ return d>0?'dp':d<0?'dn':'dz'; }

// ── KPI chips ──
(()=>{
  const a=D.site_funnel['ALL'];
  document.getElementById('kpi-row').innerHTML=`
    <div class="kpi"><div class="kpi-val">${a.count}</div><div class="kpi-label">Sites</div></div>
    <div class="kpi"><div class="kpi-val">${a.avg_v1}</div><div class="kpi-label">Score médio V1 (survey)</div></div>
    <div class="kpi"><div class="kpi-val">${a.avg_v2}</div><div class="kpi-label">Score médio V2 (AS-IS)</div></div>
    <div class="kpi"><div class="kpi-val">${a.avg_v3}</div><div class="kpi-label">Score médio V3 (proposta)</div></div>
    <div class="kpi"><div class="kpi-val">${a.v1.L1.n}</div><div class="kpi-label">L1+ V1 survey</div></div>
    <div class="kpi"><div class="kpi-val">${a.v2.L1.n}</div><div class="kpi-label">L1+ V2 AS-IS</div></div>
    <div class="kpi"><div class="kpi-val">${a.v3.L1.n}</div><div class="kpi-label">L1+ V3 proposta</div></div>
  `;
})();

// ── Seção 1: Funil site/zona — 3 visões ──
function renderSiteFunnel(zone) {
  const fd=D.site_funnel[zone]||D.site_funnel['ALL'];
  const views=[
    {key:'v1', label:'V1 Survey', op:'1.0'},
    {key:'v2', label:'V2 AS-IS',  op:'0.75'},
    {key:'v3', label:'V3 Proposta', op:'0.5'},
  ];
  document.getElementById('sf-funnel').innerHTML=`
    <div style="display:grid;grid-template-columns:60px repeat(3,1fr);gap:4px;align-items:center;margin-bottom:6px">
      <div></div>
      ${views.map(v=>`<div style="text-align:center;font-size:.72rem;font-weight:600;color:#94a3b8">${v.label}</div>`).join('')}
    </div>
    ${LEVELS.map(lvl=>{
      const col=LC[lvl];
      const bars=views.map(v=>{
        const f=fd[v.key][lvl];
        return `<div>
          <div class="bar-bg" title="${v.label}: ${f.n} (${f.pct}%)">
            <div class="bar-fill" style="width:${f.pct}%;background:${col.fill};opacity:${v.op};color:${col.text}">${f.pct}%</div>
          </div>
          <div style="font-size:.67rem;color:#475569;text-align:right">${f.n} sites</div>
        </div>`;
      }).join('');
      return `<div style="display:grid;grid-template-columns:60px repeat(3,1fr);gap:4px;align-items:center;margin-bottom:8px">
        <div class="flabel" style="color:${col.fill}">${lvl}</div>
        ${bars}
      </div>`;
    }).join('')}
  `;
}
tabs('sf-tabs',['ALL',...ZONES],renderSiteFunnel,z=>ZC[z]);
renderSiteFunnel('ALL');

// ── Seção 2: Funil por domínio — V2 e V3 side-by-side ──
function funnelCard(dd, view, label, active) {
  if(!dd) return `<div style="color:#374151;font-size:.72rem;text-align:center">${label}: sem dados</div>`;
  const gl1=dd.gl_by_level['L1'];
  const gw=gl1.pct_global, lw=gl1.pct_legacy;
  const rows=LEVELS.map(lvl=>{
    const f=dd.funnel[lvl], c=LC[lvl];
    return `<div class="dcard-row">
      <div class="dcard-lvl" style="color:${c.fill}">${lvl}</div>
      <div class="dcard-bar-bg">
        <div class="dcard-bar-fill" style="width:${f.pct}%;background:${c.fill};color:${c.text}">${f.pct}%</div>
      </div>
      <div class="dcard-n">${f.n}</div>
    </div>`;
  }).join('');
  return `
    <div style="font-size:.68rem;font-weight:600;color:#94a3b8;margin-bottom:4px">${label}</div>
    <div class="dcard-funnel">${rows}</div>
    <div style="font-size:.7rem;color:#64748b;margin-bottom:3px">L1 coverage: ${gl1.pct_avail}%</div>
    <div class="stk" title="G ${gw}% · L ${lw}%">
      <div class="sg" style="width:${gw}%"></div>
      <div class="sl" style="width:${lw}%"></div>
      <div class="sn" style="flex:1"></div>
    </div>
    <div class="gl-row">
      <span><i class="dot" style="background:#38bdf8"></i>G ${gw}%</span>
      <span><i class="dot" style="background:#f59e0b"></i>L ${lw}%</span>
    </div>`;
}

function renderDomainGrid(zone) {
  const grid=document.getElementById('df-grid');
  grid.innerHTML=DCODES.map(code=>{
    const entry=D.domain_funnel[code][zone];
    if(!entry){
      return `<div class="dcard"><div class="dcard-title">${D.domain_names[code]}</div><p style="color:#475569;font-size:.75rem">Sem dados</p></div>`;
    }
    const v2=entry.v2, v3=entry.v3;
    const active=v2?v2.active:(v3?v3.active:0);
    const n_g=v2?v2.n_global_sites:0, n_l=v2?v2.n_legacy_sites:0;
    return `<div class="dcard">
      <div class="dcard-title">
        <span>${D.domain_names[code]}</span>
        <span style="font-size:.7rem;color:#64748b">${active} sites · G:${n_g} L:${n_l}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px">
        <div style="border-right:1px solid #1e293b;padding-right:8px">${funnelCard(v2,'v2','V2 — AS-IS (todos caps)',active)}</div>
        <div>${funnelCard(v3,'v3','V3 — Proposta estratégica',active)}</div>
      </div>
    </div>`;
  }).join('');
}
tabs('df-tabs',['ALL',...ZONES],renderDomainGrid,z=>ZC[z]);
renderDomainGrid('ALL');

// ── Seção 3: Produtos por domínio ──
function renderProducts(code) {
  const prods=D.products[code]||[];
  if(!prods.length){
    document.getElementById('prod-wrap').innerHTML='<p style="color:#475569">Sem dados.</p>';
    return;
  }
  const rows=prods.map(p=>{
    const lvlCells=LEVELS14.map(lvl=>{
      const d=p.levels[lvl];
      if(!d||d.total===0) return `<td><span style="color:#374151;font-size:.72rem">—</span></td>`;
      const pct=d.pct_ready;
      const bgColor=pct>=90?'#064e3b':pct>=50?'#422006':'#450a0a';
      const txtColor=pct>=90?'#6ee7b7':pct>=50?'#fcd34d':'#fca5a5';
      return `<td>
        <span class="cap-pill" style="background:${bgColor};color:${txtColor}"
              title="${d.ready}/${d.total} READY">
          ${d.total} caps · ${pct}% ✓
        </span>
      </td>`;
    }).join('');
    return `<tr><td style="color:#e2e8f0;font-weight:500">${p.product}</td>${lvlCells}</tr>`;
  }).join('');
  document.getElementById('prod-wrap').innerHTML=`<table class="prod-table">
    <thead><tr><th>Produto</th><th>L1</th><th>L2</th><th>L3</th><th>L4</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}
const firstCode=DCODES[0];
tabs('prod-tabs', DCODES.map(c=>c+' ('+D.domain_names[c].split(' ')[0]+')'),
  (lbl)=>{ const code=lbl.split(' ')[0]; renderProducts(code); }, ()=>null);
// remap tab labels → codes
document.querySelectorAll('#prod-tabs .tab').forEach((t,i)=>{
  t.onclick=(()=>{
    const code=DCODES[i];
    return ()=>{
      document.querySelectorAll('#prod-tabs .tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      renderProducts(code);
    };
  })();
});
renderProducts(DCODES[0]);

// ── Seção 4: Tabela de sites ──
let stZone='ALL', stSearch='';
document.getElementById('search').oninput=e=>{ stSearch=e.target.value.toLowerCase(); renderSiteTable(); };
tabs('st-tabs',['ALL',...ZONES],z=>{stZone=z;renderSiteTable();},z=>ZC[z]);

function renderSiteTable() {
  let pool=D.sites;
  if(stZone!=='ALL') pool=pool.filter(s=>s.zone===stZone);
  if(stSearch) pool=pool.filter(s=>s.name.toLowerCase().includes(stSearch)||s.country.toLowerCase().includes(stSearch));
  pool=[...pool].sort((a,b)=>b.site_score_v3-a.site_score_v3||b.site_score-a.site_score||b.current_total-a.current_total);

  const domHdrs=DCODES.map(c=>`<th colspan="2" title="${D.domain_names[c]}">${c}</th>`).join('');
  const rows=pool.map(s=>{
    const dv2=s.site_score-Math.round(s.current_total);
    const dv3=s.site_score_v3-Math.round(s.current_total);
    const dc2=+dv2>0?'#34d399':+dv2<0?'#f87171':'#64748b';
    const dc3=+dv3>0?'#34d399':+dv3<0?'#f87171':'#64748b';
    const domCells=DCODES.map(c=>{
      const t=s.domain_types[c];
      if(!t) return `<td><span class="tn">—</span></td><td><span class="tn">—</span></td>`;
      const sc2=s.domain_scores[c]; const sc3=s.domain_scores_v3[c];
      const typSpan=t==='G'?'<span class="tg">G</span>':'<span class="tl">L</span>';
      return `<td title="V2 AS-IS">${sc2!==undefined?chip(sc2):''} ${typSpan}</td>
              <td title="V3 Proposta" style="border-right:1px solid #0f172a">${sc3!==undefined?chip(sc3):''}</td>`;
    }).join('');
    return `<tr>
      <td><strong style="color:#e2e8f0">${s.name}</strong></td>
      <td><span style="color:${ZC[s.zone]||'#94a3b8'};font-weight:600">${s.zone}</span></td>
      <td style="color:#94a3b8">${s.country}</td>
      <td style="color:#64748b">${s.group}</td>
      <td title="V1 — survey atual">${chip(Math.round(s.current_total))} <span style="color:#64748b;font-size:.65rem">${s.current_total}</span></td>
      <td title="V2 — AS-IS OneMES">${chip(s.site_score)} <span style="color:${dc2};font-size:.65rem">${dv2>=0?'+':''}${dv2}</span></td>
      <td title="V3 — Proposta estratégica">${chip(s.site_score_v3)} <span style="color:${dc3};font-size:.65rem">${dv3>=0?'+':''}${dv3}</span></td>
      ${domCells}
    </tr>`;
  }).join('');

  document.getElementById('st-wrap').innerHTML=`<table class="st">
    <thead>
      <tr>
        <th rowspan="2">Site</th><th rowspan="2">Zona</th><th rowspan="2">País</th><th rowspan="2">Grp</th>
        <th rowspan="2">V1 Survey</th><th rowspan="2">V2 AS-IS</th><th rowspan="2">V3 Prop.</th>
        ${DCODES.map(c=>`<th colspan="2" title="${D.domain_names[c]}">${c}</th>`).join('')}
      </tr>
      <tr>${DCODES.map(()=>'<th style="font-size:.6rem">V2</th><th style="font-size:.6rem;border-right:1px solid #0f172a">V3</th>').join('')}</tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}
renderSiteTable();
</script>
</body>
</html>
"""


def generate_html(sites, site_funnel, domain_funnel, product_view):
    site_payload = [{
        "name":             s["name"],
        "zone":             s["zone"],
        "country":          s["country"],
        "group":            s["group"],
        "current_total":    s["current_total"],
        "site_score":       s["site_score"],
        "site_score_v3":    s["site_score_v3"],
        "domain_types":     s["domain_types"],
        "domain_scores":    s["domain_scores"],
        "domain_scores_v3": s["domain_scores_v3"],
    } for s in sites]

    # V3 mandatory counts por domínio (para exibir no legend do HTML)
    v3_counts = {}
    for code in DOMAIN_CODES:
        dm = V3_MANDATORY.get(code)
        v3_counts[code] = {
            lvl: (list(dm[lvl]) if (dm and lvl in dm) else ["all"])
            for lvl in LEVELS
        }

    payload = {
        "zones":         ZONES,
        "domain_codes":  DOMAIN_CODES,
        "domain_names":  DOMAIN_MAP,
        "level_colors":  LEVEL_COLORS,
        "zone_colors":   ZONE_COLORS,
        "sites":         site_payload,
        "site_funnel":   site_funnel,
        "domain_funnel": domain_funnel,
        "products":      product_view,
        "v3_mandatory":  v3_counts,
    }
    return HTML.replace("__DATA__", json.dumps(payload, ensure_ascii=False))


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def main():
    print("=== Coverage Projection (regras corrigidas) ===\n")

    print("1. Parsing App.tsx…")
    sites, sdt = parse_apptsx()

    print("\n2. Carregando capabilities da planilha…")
    records = load_capability_records()

    print("\n3. Calculando scores…")
    sites = compute_scores(sites, sdt, records)

    print("\n4. Agregando…")
    sf = aggregate_site_funnel(sites)
    df = aggregate_domain_funnel(sites)
    pv = aggregate_product_view(sites, records)

    print("\n── Funil de sites (ALL) — comparativo 3 visões ──")
    fa = sf["ALL"]
    print(f"  {'Nível':<5} {'V1 Survey':>12} {'V2 AS-IS':>12} {'V3 Proposta':>12}")
    for lvl in ["L0","L1","L2","L3","L4"]:
        v1 = fa["v1"][lvl]; v2 = fa["v2"][lvl]; v3 = fa["v3"][lvl]
        print(f"  {lvl}    {v1['n']:>5}({v1['pct']:>4}%)  {v2['n']:>5}({v2['pct']:>4}%)  {v3['n']:>5}({v3['pct']:>4}%)")

    print("\n── Score de domínio por zona — V2 AS-IS (% de sites em L1+) ──")
    print(f"  {'Domínio':<24}", end="")
    for z in ["ALL"] + ZONES:
        print(f"  {z:>6}", end="")
    print()
    for code in DOMAIN_CODES:
        print(f"  {DOMAIN_MAP[code]:<24}", end="")
        for z in ["ALL"] + ZONES:
            dd = df[code].get(z)
            if dd:
                pct = dd["v2"]["funnel"]["L1"]["pct"]
                print(f"  {pct:>5}%", end="")
            else:
                print(f"  {'—':>6}", end="")
        print()

    print("\n── Score de domínio por zona — V3 Proposta (% de sites em L1+) ──")
    print(f"  {'Domínio':<24}", end="")
    for z in ["ALL"] + ZONES:
        print(f"  {z:>6}", end="")
    print()
    for code in DOMAIN_CODES:
        print(f"  {DOMAIN_MAP[code]:<24}", end="")
        for z in ["ALL"] + ZONES:
            dd = df[code].get(z)
            if dd:
                pct = dd["v3"]["funnel"]["L1"]["pct"]
                print(f"  {pct:>5}%", end="")
            else:
                print(f"  {'—':>6}", end="")
        print()

    # ── Diagnóstico de frações V3 para confirmar a proposta ──
    print("\n── Frações L1: V2 (todos) vs V3 (mandatory) por zona ──")
    print(f"  {'Dom':<5} {'Vista':<5}", end="")
    for z in ["ALL"] + ZONES:
        print(f"  {z:>6}", end="")
    print()
    for code in [c for c in DOMAIN_CODES if c != "UT"]:
        for view, score_key, gl_key in [("V2","domain_scores","domain_gl"),("V3","domain_scores_v3","domain_gl_v3")]:
            print(f"  {code:<5} {view:<5}", end="")
            for zone_key in ["ALL"] + ZONES:
                pool = sites if zone_key == "ALL" else [s for s in sites if s["zone"] == zone_key]
                active = [s for s in pool if code in s[score_key]]
                if not active:
                    print(f"  {'—':>6}", end=""); continue
                # Fração L1 média
                n_tot = sum(s[gl_key][code]["L1"]["total"] for s in active if code in s[gl_key])
                n_avail = sum(s[gl_key][code]["L1"]["avail"] for s in active if code in s[gl_key])
                pct = round(n_avail/n_tot*100,0) if n_tot else 0
                print(f"  {int(pct):>5}%", end="")
            print()

    print("\n5. Gerando HTML…")
    html = generate_html(sites, sf, df, pv)
    OUT_HTML.write_text(html, encoding="utf-8")
    print(f"   → {OUT_HTML}")


if __name__ == "__main__":
    main()
