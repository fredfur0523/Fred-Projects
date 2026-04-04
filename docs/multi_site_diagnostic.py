"""
multi_site_diagnostic.py
-------------------------
Checklist oficial de maturidade OneMES — 3 sites × 3 zonas.
Usa a mesma metodologia calibrada em Agudos:
  - N3/N4 ponderado por relevância (Funcional=2.0, Operacional=1.0, Admin=0.5)
  - N3 entregue se frac_peso_disponível ≥ 40%
  - Gates progressivos: L1≥60% | L2≥75% | L3≥85% | L4≥90%
  - Disponibilidade = max(G_global, L_zona)
  - Filtros de escopo canônicos (should_include_n3)

Sites: Zacatecas (MAZ), Agudos (SAZ), Putian (APAC)
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
    "Brewing Performance":   "BP",
    "Data Acquisition":      "DA",
    "Utilities":             "UT",
    "Maintenance":           "MT",
    "Management":            "MG",
    "MasterData Management": "MDM",
    "Packaging Performance": "PP",
    "Quality":               "QL",
    "Safety":                "SF",
}

COL = {
    "domain":  3,   # D
    "product": 4,   # E
    "n3_func": 8,   # I — N3 functional group
    "n4_func": 9,   # J — N4 capability name
    "L1":     12,   # M
    "L2":     13,   # N
    "L3":     14,   # O
    "L4":     15,   # P
    "status": 16,   # Q
}
LEVELS = ["L1", "L2", "L3", "L4"]
LEGACY_AVAILABLE = {"must have", "necessary"}

# Zone legacy columns (letters from aba "Capabilities Readiness")
ZONE_LEGACY_COLS = {
    "SAZ":  ["AN","AO","AP","AQ","AR","AS","AT","AU","AV","AW"],
    "MAZ":  ["BM","BN","BO","BP"],
    "APAC": ["AC","AD","AE","AF","AG","AH","AI","AJ","AK","AL"],
}
ZONES = list(ZONE_LEGACY_COLS.keys())

# ─────────────────────────────────────────────────────────────────────────────
# Configuração dos 3 sites
# ─────────────────────────────────────────────────────────────────────────────
SITES = [
    {
        "name": "Zacatecas", "zone": "MAZ",
        "domains": {
            "BP": "L", "DA": "G", "MT": "L", "MG": "G",
            "MDM": "G", "PP": "L", "QL": "L", "SF": "L",
        },
        "excluded_products": {
            "QL": {"Process Hygiene", "PTS Management"},
            "MG": {"KPI-PI"},
        },
    },
    {
        "name": "Agudos", "zone": "SAZ",
        "domains": {
            "BP": "G", "DA": "G", "UT": "G", "MT": "G", "MG": "G",
            "MDM": "G", "PP": "L", "QL": "L", "SF": "G",
        },
        "excluded_products": {
            "QL": {"Process Hygiene", "PTS Management"},
            "MG": {"KPI-PI"},
        },
    },
    {
        "name": "Putian", "zone": "APAC",
        "domains": {
            "DA": "L", "MT": "G", "MG": "L", "MDM": "G", "QL": "L", "SF": "L",
            # BP, PP, UT ausentes → não avaliados
        },
        "excluded_products": {
            "MG": {"KPI-PI"},
        },
    },
]

N3_DELIVERY_THRESHOLD = 0.40
LEVEL_THRESHOLDS = {"L1": 0.60, "L2": 0.75, "L3": 0.85, "L4": 0.90}

# Ordem canônica de domínios no display
ALL_DOMAINS = ["BP", "DA", "UT", "MT", "MG", "MDM", "PP", "QL", "SF"]


# ─────────────────────────────────────────────────────────────────────────────
# Filtro de escopo canônico por domínio × nível (checklist oficial)
# Calibrado e validado em Agudos (site score = L2)
# ─────────────────────────────────────────────────────────────────────────────
def should_include_n3(domain: str, level: str, n3_name: str) -> bool:
    """True se o N3 group deve ser incluído no cálculo para esse domínio/nível."""
    n = n3_name.lower()

    # BP L1: performance de Brewhouse — downtime, volume, categorização, OSE
    # Exclui: integrações externas, configuração de site, AI suggestiva
    if domain == "BP" and level == "L1":
        exclude = [
            "integration between bms and",
            "add target",
            "brand & line parameter",
            "new site configuration",
            "suggestive categorization",
            "show local mdm change",
        ]
        return not any(p in n for p in exclude)

    # BP L2: criar/editar paradas em Filtração+Brassagem (auto e manual)
    #         + consolidação de performance via dashboard
    if domain == "BP" and level == "L2":
        include = [
            "equipment downtime creat",
            "equipment downtime categori",
            "equipment downtime graph",
            "equipment downtime table",
            "front-end indicators",
            "detailed categorization",
            "create (sub)categor",
            "filtration",
            "brewhouse",
            "order visibility",
        ]
        return any(p in n for p in include)

    # MDM L1/L2: apenas assets e master data básicos
    if domain == "MDM" and level in ("L1", "L2"):
        include = [
            "asset", "location", "equipment", "material", "product", "brand",
            "shift", "user", "role", "cip entit", "parameter type",
            "static", "quality book", "translation", "management of",
            "master data of",
        ]
        return any(p in n for p in include)

    # SF L1: apenas registro básico de acidentes e gestão de incidentes
    if domain == "SF" and level == "L1":
        include = [
            "accident", "incident", "standardize report", "unify incident",
            "capture observations", "sif", "establish fai",
        ]
        return any(p in n for p in include)

    # SF L2: vacuous — compliance depth desloca para L3
    if domain == "SF" and level == "L2":
        return False  # exclui todos → vacuous PASS

    # QL L1: ordens e PTS para as 5 áreas de processo central
    if domain == "QL" and level == "L1":
        po_out_scope = [
            "yeast management order", "dealcoholiz", "road tankering",
            "soft drink", "general order", "scrapping", "downgrad",
            "material consumption", "wip management", "audition",
            "unity of measure", "production order step", "traceability",
        ]
        po_in_scope = [
            "brewhouse order", "cellar order", "cellars order",
            "bright beer order", "bbt", "filtration order", "ccyp",
        ]
        if "production order" in n:
            if any(p in n for p in po_out_scope):
                return False
            return any(p in n for p in po_in_scope) or not any(
                out in n for out in po_out_scope
            )
        return True

    # QL L2: mesma janela de 5 áreas + performance básica de execução
    # Compliance profundo (audit, traceabilidade, especificações) → L3
    if domain == "QL" and level == "L2":
        deep_compliance = [
            "audit", "traceabilit", "mass balance", "specification management",
            "supplier quality", "customer complaint", "deviation management",
            "sample plan", "quality gate", "release strategy",
            "exclude or surpress", "exclude or suppress",
        ]
        if any(p in n for p in deep_compliance):
            return False
        out_of_scope_types = [
            "yeast management", "dealcoholiz", "road tankering",
            "soft drink", "scrapping", "downgrad", "material consumption",
        ]
        if any(p in n for p in out_of_scope_types):
            return False
        po_out_scope = [
            "yeast management order", "dealcoholiz", "road tankering",
            "soft drink", "general order", "scrapping", "downgrad",
            "material consumption", "wip management", "audition",
            "unity of measure", "production order step", "traceability",
        ]
        if "production order" in n:
            if any(p in n for p in po_out_scope):
                return False
        return True

    # PP L2: todos os equipamentos + KPI por equipamento + fault codes
    # Exclui: trends, dashboards, gestão de plano, NST/DPA, integração legacy, admin, analytics
    if domain == "PP" and level == "L2":
        exclude = [
            "trend", "dashboard", "finish production plan", "check production plan",
            "start production order", "nst", "dpa", "legacy integration",
            "configure line", "manage line categor", "historical performance",
            "check metrics raw data", "multiple sku",
        ]
        return not any(p in n for p in exclude)

    # MG L2: ferramentas digitais de gestão (Eureka, SPLAN) em uso
    # Exclui: métricas de adoção comportamental
    if domain == "MG" and level == "L2":
        exclude = [
            "team members actively", "team understands", "team members can expla",
            "participat", "implementation progress", "implemented ideas",
            "evaluate the im", "non-compl", "gop implementation is",
            "implementation routines", "kpi tree",
        ]
        return not any(p in n for p in exclude)

    return True  # demais domínios/níveis: sem filtro


# ─────────────────────────────────────────────────────────────────────────────
# Ponderação N4 por relevância
# ─────────────────────────────────────────────────────────────────────────────
FUNCTIONAL_KEYWORDS = {
    "calculat", "comput", "monitor", "track", "register", "record",
    "captur", "measur", "collect", "generat", "analyz", "analys",
    "evaluat", "report", "alert", "detect", "visualiz", "display",
    "show", "identif", "perform", "execut", "enforce", "standardiz",
    "optimiz", "reduc", "improv", "enabl",
}
ADMIN_KEYWORDS = {
    "creat", "delet", "edit", "configur", "setup", "set up",
    "add", "remov", "grant", "revok", "duplicat", "inactivat",
    "populat", "translat", "expos", "receiv", "send", "sync",
}


def n4_weight(description: str) -> float:
    desc = description.lower()
    for kw in FUNCTIONAL_KEYWORDS:
        if kw in desc:
            return 2.0
    for kw in ADMIN_KEYWORDS:
        if kw in desc:
            return 0.5
    return 1.0


# ─────────────────────────────────────────────────────────────────────────────
# Carga da planilha — uma única vez para todos os sites
# ─────────────────────────────────────────────────────────────────────────────
zone_idxs = {
    zone: [column_index_from_string(c) - 1 for c in cols]
    for zone, cols in ZONE_LEGACY_COLS.items()
}
max_col = max(idx for idxs in zone_idxs.values() for idx in idxs) + 1

print("Carregando planilha…")
wb = openpyxl.load_workbook(READINESS_XL, read_only=True, data_only=True)
ws = wb["Capabilities Readiness"]

# raw_caps[domain][level][(product, n3)] = [{"n4", "g", "l_by_zone": {zone: bool}, "w"}]
raw_caps = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

# product_zone_coverage[domain][product] = set of zones with ≥1 "Must Have"/"Necessary"
# Usado para determinar escopo de produto por zona (sites tipo Legacy)
product_zone_coverage = defaultdict(lambda: defaultdict(set))
all_domain_products   = defaultdict(set)

rows_loaded = 0
for row in ws.iter_rows(min_row=2, values_only=True):
    if len(row) < max_col:
        row = list(row) + [None] * (max_col - len(row))

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

    product  = str(row[COL["product"]] or "").strip()
    n3_group = str(row[COL["n3_func"]] or "").strip()
    n4_desc  = str(row[COL["n4_func"]] or "").strip()

    all_domain_products[domain_code].add(product)

    # Registra cobertura legacy do produto por zona (independe do filtro N3)
    for zone, idxs in zone_idxs.items():
        if any(str(row[idx] or "").strip().lower() in LEGACY_AVAILABLE for idx in idxs):
            product_zone_coverage[domain_code][product].add(zone)

    # Filtro de escopo canônico (site-agnostic)
    if not should_include_n3(domain_code, level, n3_group):
        continue

    global_ready = str(row[COL["status"]] or "").strip().upper() == "READY"
    l_by_zone = {
        zone: any(
            str(row[idx] or "").strip().lower() in LEGACY_AVAILABLE
            for idx in idxs
        )
        for zone, idxs in zone_idxs.items()
    }
    weight = n4_weight(n4_desc)

    key = (product, n3_group)
    raw_caps[domain_code][level][key].append({
        "n4": n4_desc,
        "g":  global_ready,
        "l_by_zone": l_by_zone,
        "w":  weight,
    })
    rows_loaded += 1

wb.close()
print(f"  {rows_loaded} N4 capabilities carregadas\n")


def get_zone_product_scope(domain_code: str, zone: str) -> set | None:
    """
    Retorna o conjunto de produtos em escopo para um domínio × zona (tipo Legacy).
    - Produtos com cobertura nesta zona → IN SCOPE
    - Produtos sem cobertura em nenhuma zona (global-only) → IN SCOPE
    - Produtos com cobertura em outras zonas mas NÃO nesta → OUT OF SCOPE
    Retorna None se não há produtos com cobertura de zona neste domínio (→ todos em escopo).
    """
    products_with_zone = {
        p for p, zones in product_zone_coverage[domain_code].items()
        if zone in zones
    }
    if not products_with_zone:
        return None  # nenhum produto tem cobertura legacy nesta zona → inclui todos

    global_only = {
        p for p in all_domain_products[domain_code]
        if not product_zone_coverage[domain_code].get(p)
    }
    return products_with_zone | global_only


# ─────────────────────────────────────────────────────────────────────────────
# Análise de um site × domínio
# ─────────────────────────────────────────────────────────────────────────────
def analyze_site_domain(site_cfg: dict, domain_code: str):
    """
    Retorna (score, level_details, first_failing_level).
    level_details[lvl] = dict com vacuous/pass/frac/threshold/groups/n_delivered/n_total

    Escopo de produto por zona:
    - Tipo G: todos os produtos em escopo (produto global)
    - Tipo L: apenas produtos com cobertura legacy nesta zona + global-only
      → produtos com cobertura em outras zonas mas não nesta são excluídos
    """
    zone      = site_cfg["zone"]
    site_type = site_cfg["domains"][domain_code]   # "G" ou "L"
    excluded  = site_cfg["excluded_products"].get(domain_code, set())

    # Escopo de produto: None = todos; set = restrito por zona
    zone_scope = get_zone_product_scope(domain_code, zone) if site_type == "L" else None

    score               = 0
    first_failing_level = None
    level_details       = {}

    for lvl in LEVELS:
        groups = raw_caps[domain_code].get(lvl, {})
        # Filtra: produtos excluídos manualmente + fora do escopo de zona (Legacy)
        filtered = {
            (prod, n3): n4s
            for (prod, n3), n4s in groups.items()
            if prod not in excluded
            and (zone_scope is None or prod in zone_scope)
        }

        if not filtered:
            # Vacuous pass
            score = int(lvl[1])
            level_details[lvl] = {"vacuous": True, "pass": True}
            continue

        group_details   = []
        total_w_passed  = 0.0
        total_w_all     = 0.0

        for (prod, n3), n4s in sorted(filtered.items()):
            n_n4    = len(n4s)
            g_avail = sum(1 for x in n4s if x["g"])
            l_avail = sum(1 for x in n4s if x["l_by_zone"][zone])
            g_pct   = g_avail / n_n4 * 100 if n_n4 > 0 else 0.0
            l_pct   = l_avail / n_n4 * 100 if n_n4 > 0 else 0.0

            w_avail = sum(x["w"] for x in n4s if x["g"] or x["l_by_zone"][zone])
            w_total = sum(x["w"] for x in n4s)
            n3_frac = w_avail / w_total if w_total > 0 else 0.0
            delivered = n3_frac >= N3_DELIVERY_THRESHOLD

            if delivered:
                total_w_passed += w_total
            total_w_all += w_total

            group_details.append({
                "prod": prod, "n3": n3, "n_n4": n_n4,
                "g_pct": g_pct, "l_pct": l_pct,
                "frac": n3_frac, "delivered": delivered,
                "w_avail": w_avail, "w_total": w_total,
            })

        level_frac = total_w_passed / total_w_all if total_w_all > 0 else 0.0
        thr        = LEVEL_THRESHOLDS[lvl]
        level_pass = level_frac >= thr

        level_details[lvl] = {
            "vacuous":     False,
            "pass":        level_pass,
            "frac":        level_frac,
            "threshold":   thr,
            "groups":      group_details,
            "n_delivered": sum(1 for g in group_details if g["delivered"]),
            "n_total":     len(group_details),
        }

        if level_pass:
            score = int(lvl[1])
        else:
            first_failing_level = lvl
            break

    return score, level_details, first_failing_level


# ─────────────────────────────────────────────────────────────────────────────
# Compute scores for all sites × domains
# ─────────────────────────────────────────────────────────────────────────────
results = {}  # results[site_name][domain_code] = (score, level_details, first_failing_level)

for site in SITES:
    site_name = site["name"]
    results[site_name] = {}
    for dc in ALL_DOMAINS:
        if dc not in site["domains"]:
            results[site_name][dc] = None  # domínio não ativo neste site
        else:
            score, lvl_det, fail_lvl = analyze_site_domain(site, dc)
            results[site_name][dc] = (score, lvl_det, fail_lvl)


def site_score(site_cfg: dict) -> int:
    """Score do site = min dos domínios ativos (excluindo UT do min)."""
    name = site_cfg["name"]
    active_scores = [
        results[name][dc][0]
        for dc in site_cfg["domains"]
        if dc != "UT" and results[name][dc] is not None
    ]
    return min(active_scores) if active_scores else 0


# ─────────────────────────────────────────────────────────────────────────────
# SEÇÃO 1 — Percentuais de alcance por site × domínio × nível
# ─────────────────────────────────────────────────────────────────────────────
# Formato de célula: "nn.n✓" | "nn.n✗" | " vac " | "  —  "
# Gates: L1≥60% | L2≥75% | L3≥85% | L4≥90%

def fmt_cell(d, lvl):
    """Formata uma célula de porcentagem (7 chars)."""
    if d is None:
        return f"{'—':^7}"
    if d.get("vacuous"):
        return f"{'vac':^7}"
    pct = d["frac"] * 100
    ok  = "✓" if d["pass"] else "✗"
    return f"{pct:5.1f}{ok} "

CELL_W  = 7
BLK_W   = CELL_W * 4 + 3   # 4 níveis × 7 chars + 3 separadores internos
SEP     = "│"

print("=" * (6 + 2 + (BLK_W + 3) * len(SITES)))
print("SEÇÃO 1 — PERCENTUAIS DE ALCANCE POR DOMÍNIO × NÍVEL × SITE")
print("  ✓ = gate atingido  ✗ = gate não atingido  vac = vacuous pass  — = domínio inativo")
print(f"  Gates: L1≥60% | L2≥75% | L3≥85% | L4≥90%   |   N3 entregue se frac_peso ≥ 40%")
print("=" * (6 + 2 + (BLK_W + 3) * len(SITES)))

# Header linha 1: site names
hdr1 = f"  {'Dom':<4}  "
for site in SITES:
    label = f"{site['name']} ({site['zone']})"
    hdr1 += f" {SEP} {label:^{BLK_W}}"
print(hdr1)

# Header linha 2: L1 L2 L3 L4 per site
hdr2 = f"  {'':4}  "
for _ in SITES:
    lvl_hdr = "  ".join(f"{'L'+str(i+1):^{CELL_W}}" for i in range(4))
    hdr2 += f" {SEP} {lvl_hdr}"
print(hdr2)
print("  " + "─" * (4 + 2 + (BLK_W + 3) * len(SITES)))

for dc in ALL_DOMAINS:
    note = "(excl)" if dc == "UT" else ""
    row = f"  {dc:<4}{note:^2}"
    for site in SITES:
        res = results[site["name"]][dc]
        cells = []
        for lvl in LEVELS:
            if res is None:
                cells.append(fmt_cell(None, lvl))
            else:
                _, lvl_det, _ = res
                cells.append(fmt_cell(lvl_det.get(lvl), lvl))
        row += f" {SEP} {'  '.join(cells)}"
    print(row)

print("  " + "─" * (4 + 2 + (BLK_W + 3) * len(SITES)))
# Site score row
row = f"  {'SITE':<4}  "
for site in SITES:
    ss = site_score(site)
    row += f" {SEP} {'Score = L'+str(ss):^{BLK_W}}"
print(row)
print()


# ─────────────────────────────────────────────────────────────────────────────
# SEÇÃO 2 — Detalhamento de gaps por site × domínio
# ─────────────────────────────────────────────────────────────────────────────
print("=" * 100)
print("SEÇÃO 2 — DETALHAMENTO DE GAPS POR SITE × DOMÍNIO")
print("  Para cada domínio que não atingiu L4: primeiro nível de falha + N3 groups")
print("  Formato: ○ = N3 não entregue (frac<40%)  ✓ = N3 entregue")
print("=" * 100)

for site in SITES:
    name = site["name"]
    zone = site["zone"]
    ss   = site_score(site)
    print(f"\n{'═'*100}")
    print(f"  {name.upper()} ({zone}) — Site Score: L{ss}")
    print(f"{'═'*100}")

    for dc in ALL_DOMAINS:
        res = results[name][dc]
        if res is None:
            continue  # domínio não ativo

        score, lvl_det, fail_lvl = res
        site_type = site["domains"][dc]
        excluded  = site["excluded_products"].get(dc, set())
        zone_scope = get_zone_product_scope(dc, site["zone"]) if site_type == "L" else None
        all_prods  = all_domain_products[dc]
        out_of_zone = (all_prods - zone_scope - excluded) if zone_scope is not None else set()

        exc_note  = f"  [excl manual: {', '.join(sorted(excluded))}]" if excluded else ""
        zone_note = f"  [excl zona: {', '.join(sorted(out_of_zone))}]" if out_of_zone else ""
        note_ut   = "  (excluído do min)" if dc == "UT" else ""

        print(f"\n  [{dc}] tipo={site_type}  Score=L{score}{note_ut}{exc_note}{zone_note}")

        if score == 4:
            print(f"    ✓ L4 atingido — nenhum gap")
            continue

        if fail_lvl is None:
            # Todos os níveis definidos passaram (score pode ser <4 por vacuous parcial)
            print(f"    ✓ Todos os níveis com N3 definidos passaram")
            continue

        # Mostrar resumo de todos os níveis
        for lvl in LEVELS:
            d = lvl_det.get(lvl)
            if d is None:
                continue
            if d["vacuous"]:
                lbl = int(lvl[1])
                print(f"    [{lvl}] vacuous PASS → score sobe para L{lbl}")
                continue
            ok_str = "PASS ✓" if d["pass"] else f"FAIL ✗  ← bloqueio"
            pct    = d["frac"] * 100
            thr    = d["threshold"] * 100
            nd     = d["n_delivered"]
            nt     = d["n_total"]
            print(f"    [{lvl}] {nd}/{nt} N3 entregues  W_score={pct:.1f}% (gate={thr:.0f}%)  → {ok_str}")

        # Detalhamento do nível que falhou
        d = lvl_det.get(fail_lvl)
        if d and not d["vacuous"]:
            print(f"\n    Detalhamento {fail_lvl} (N3 groups):")
            print(f"    {'':2} {'Produto | N3 group':<60} {'G%':>5} {'L%':>5} {'frac%':>6} {'≥40%':>5}")
            print(f"    {'':2} {'─'*80}")
            # Falhos primeiro, depois entregues; dentro de cada grupo ordenar por frac desc
            for g in sorted(d["groups"], key=lambda x: (x["delivered"], x["frac"])):
                mark = "✓" if g["delivered"] else "○"
                label = f"{g['prod'][:24]} | {g['n3'][:34]}"
                frac_pct = g["frac"] * 100
                thr_mark = "✓" if g["delivered"] else "—"
                print(f"    {mark} {label:<60} {g['g_pct']:>4.0f}%  {g['l_pct']:>4.0f}%  {frac_pct:>5.1f}%  {thr_mark}")

print(f"\n{'='*100}")
print("Done.")
