#!/usr/bin/env python3
"""
generate_maturity_detail.py
============================
Gera docs/maturity_detail.json com análise N3/N4 para todos os sites do CSV_DATA.

Usa a mesma metodologia calibrada em agudos_n3_diagnostic.py / multi_site_diagnostic.py:
  - N4 ponderado por relevância (Funcional=2.0, Operacional=1.0, Admin=0.5)
  - N3 entregue se frac_peso_disponível ≥ 40%
  - Gates progressivos: L1≥60% | L2≥75% | L3≥85% | L4≥90%
  - Escopo de produto por zona (Legacy vs Global)
  - Filtros canônicos should_include_n3 por domínio × nível

Fontes de dados:
  - docs/OneMES Readiness Consolidated.xlsx  → capabilities N3/N4
  - client/src/App.tsx                       → SITE_DOMAIN_TYPE + CSV_DATA (site→zone)

Saída:
  - docs/maturity_detail.json

Uso:
    cd /home/fredfur/projects/coverage-dashboard
    python scripts/generate_maturity_detail.py
"""

import csv
import io
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

try:
    import openpyxl
    from openpyxl.utils import column_index_from_string
except ImportError:
    sys.exit("pip install openpyxl")

# ─── Caminhos ────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
READINESS_XL = PROJECT_ROOT / "docs" / "OneMES Readiness Consolidated.xlsx"
APP_TSX      = PROJECT_ROOT / "client" / "src" / "App.tsx"
OUTPUT_JSON  = PROJECT_ROOT / "docs" / "maturity_detail.json"

# ─── Configuração de domínios ─────────────────────────────────────────────────
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
ALL_DOMAINS = ["BP", "DA", "UT", "MT", "MG", "MDM", "PP", "QL", "SF"]

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

# ─── Colunas legacy por zona (aba "Capabilities Readiness") ──────────────────
# Extraídas do cabeçalho da planilha
ZONE_LEGACY_COLS = {
    "AFR":  ["T","U","V","W","X","Y","Z","AA"],
    "APAC": ["AC","AD","AE","AF","AG","AH","AI","AJ","AK","AL"],
    "SAZ":  ["AN","AO","AP","AQ","AR","AS","AT","AU","AV","AW"],
    "NAZ":  ["AY","AZ","BA","BB","BC","BD","BE","BF","BG","BH","BI","BJ","BK"],
    "MAZ":  ["BM","BN","BO","BP"],
    "EUR":  ["BR","BS","BT","BU","BV","BW","BX"],
}
ZONES = list(ZONE_LEGACY_COLS.keys())

# ─── Parâmetros do modelo ─────────────────────────────────────────────────────
N3_DELIVERY_THRESHOLD = 0.40
LEVEL_THRESHOLDS = {"L1": 0.60, "L2": 0.75, "L3": 0.85, "L4": 0.90}

# Exclusões universais por domínio (produtos fora de escopo analítico)
UNIVERSAL_EXCLUDED: dict[str, set] = {
    "QL": {"Process Hygiene", "PTS Management"},
    "MG": {"KPI-PI"},
}


# ─────────────────────────────────────────────────────────────────────────────
# Extração de dados do App.tsx
# ─────────────────────────────────────────────────────────────────────────────

def parse_app_tsx() -> tuple[dict, dict]:
    """
    Extrai SITE_DOMAIN_TYPE e site→zone do App.tsx.
    Retorna (site_domain_type, site_zone_map).
    """
    text = APP_TSX.read_text(encoding="utf-8")

    # ── SITE_DOMAIN_TYPE ────────────────────────────────────────────────────
    # A constante está em uma única linha: const SITE_DOMAIN_TYPE: Record<...> = {...};
    m = re.search(
        r"const SITE_DOMAIN_TYPE[^=]*=\s*(\{.*?\});",
        text,
        re.DOTALL,
    )
    if not m:
        sys.exit("Erro: SITE_DOMAIN_TYPE não encontrado em App.tsx")
    site_domain_type: dict = json.loads(m.group(1))

    # ── CSV_DATA (site → zone) ───────────────────────────────────────────────
    m2 = re.search(r"const CSV_DATA = `([^`]+)`", text, re.DOTALL)
    if not m2:
        sys.exit("Erro: CSV_DATA não encontrado em App.tsx")
    csv_text = m2.group(1).strip()

    reader = csv.DictReader(io.StringIO(csv_text))
    site_zone_map: dict[str, str] = {}
    for row in reader:
        site_zone_map[row["Site"].strip()] = row["Zone"].strip()

    return site_domain_type, site_zone_map


# ─────────────────────────────────────────────────────────────────────────────
# Filtro de escopo canônico N3 (idêntico ao multi_site_diagnostic.py)
# ─────────────────────────────────────────────────────────────────────────────

def should_include_n3(domain: str, level: str, n3_name: str) -> bool:
    n = n3_name.lower()

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

    if domain == "MDM" and level in ("L1", "L2"):
        include = [
            "asset", "location", "equipment", "material", "product", "brand",
            "shift", "user", "role", "cip entit", "parameter type",
            "static", "quality book", "translation", "management of",
            "master data of",
        ]
        return any(p in n for p in include)

    if domain == "SF" and level == "L1":
        include = [
            "accident", "incident", "standardize report", "unify incident",
            "capture observations", "sif", "establish fai",
        ]
        return any(p in n for p in include)

    if domain == "SF" and level == "L2":
        return False  # vacuous PASS

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

    if domain == "PP" and level == "L2":
        exclude = [
            "trend", "dashboard", "finish production plan", "check production plan",
            "start production order", "nst", "dpa", "legacy integration",
            "configure line", "manage line categor", "historical performance",
            "check metrics raw data", "multiple sku",
        ]
        return not any(p in n for p in exclude)

    if domain == "MG" and level == "L2":
        exclude = [
            "team members actively", "team understands", "team members can expla",
            "participat", "implementation progress", "implemented ideas",
            "evaluate the im", "non-compl", "gop implementation is",
            "implementation routines", "kpi tree",
        ]
        return not any(p in n for p in exclude)

    return True


# ─────────────────────────────────────────────────────────────────────────────
# Ponderação N4
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
# Carga da planilha
# ─────────────────────────────────────────────────────────────────────────────

def load_capabilities():
    zone_idx_map = {
        zone: [column_index_from_string(c) - 1 for c in cols]
        for zone, cols in ZONE_LEGACY_COLS.items()
    }
    max_col = max(idx for idxs in zone_idx_map.values() for idx in idxs) + 1

    print(f"Carregando planilha: {READINESS_XL.name}…")
    wb = openpyxl.load_workbook(READINESS_XL, read_only=True, data_only=True)
    ws = wb["Capabilities Readiness"]

    # raw_caps[domain][level][(product, n3)] = list of N4 dicts
    raw_caps = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    # product_zone_coverage[domain][product] = set of zones with ≥1 legacy entry
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

        # Cobertura legacy por zona (para escopo de produto)
        for zone, idxs in zone_idx_map.items():
            if any(str(row[idx] or "").strip().lower() in LEGACY_AVAILABLE for idx in idxs):
                product_zone_coverage[domain_code][product].add(zone)

        # Filtro de escopo canônico
        if not should_include_n3(domain_code, level, n3_group):
            continue

        global_ready = str(row[COL["status"]] or "").strip().upper() == "READY"
        l_by_zone = {
            zone: any(
                str(row[idx] or "").strip().lower() in LEGACY_AVAILABLE
                for idx in idxs
            )
            for zone, idxs in zone_idx_map.items()
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
    print(f"  {rows_loaded} N4 capabilities carregadas")
    return raw_caps, product_zone_coverage, all_domain_products


# ─────────────────────────────────────────────────────────────────────────────
# Escopo de produto por zona
# ─────────────────────────────────────────────────────────────────────────────

def get_zone_product_scope(
    domain_code: str,
    zone: str,
    product_zone_coverage,
    all_domain_products,
) -> set | None:
    """
    Retorna conjunto de produtos em escopo para um domínio × zona (tipo Legacy).
    None = todos em escopo (sem produtos com cobertura de zona neste domínio).
    """
    products_with_zone = {
        p for p, zones in product_zone_coverage[domain_code].items()
        if zone in zones
    }
    if not products_with_zone:
        return None

    global_only = {
        p for p in all_domain_products[domain_code]
        if not product_zone_coverage[domain_code].get(p)
    }
    return products_with_zone | global_only


# ─────────────────────────────────────────────────────────────────────────────
# Análise de um site × domínio (todos os 4 níveis, sem break)
# ─────────────────────────────────────────────────────────────────────────────

def analyze_domain(
    zone: str,
    site_type: str,          # "G" ou "L"
    domain_code: str,
    excluded: set,
    raw_caps,
    product_zone_coverage,
    all_domain_products,
) -> dict:
    """
    Retorna dict com score e detalhes por nível.
    Computa todos os 4 níveis independentemente (sem parar no primeiro falho).
    Score = maior nível consecutivo a partir de L1.
    """
    zone_scope = (
        get_zone_product_scope(domain_code, zone, product_zone_coverage, all_domain_products)
        if site_type == "L"
        else None
    )

    levels_out = {}
    for lvl in LEVELS:
        groups = raw_caps[domain_code].get(lvl, {})
        filtered = {
            (prod, n3): n4s
            for (prod, n3), n4s in groups.items()
            if prod not in excluded
            and (zone_scope is None or prod in zone_scope)
        }

        if not filtered:
            levels_out[lvl] = {"vacuous": True, "pass": True, "frac": None}
            continue

        total_w_passed = 0.0
        total_w_all    = 0.0
        for (prod, n3), n4s in filtered.items():
            w_avail = sum(x["w"] for x in n4s if x["g"] or x["l_by_zone"].get(zone, False))
            w_total = sum(x["w"] for x in n4s)
            n3_frac = w_avail / w_total if w_total > 0 else 0.0
            if n3_frac >= N3_DELIVERY_THRESHOLD:
                total_w_passed += w_total
            total_w_all += w_total

        level_frac = total_w_passed / total_w_all if total_w_all > 0 else 0.0
        thr        = LEVEL_THRESHOLDS[lvl]
        levels_out[lvl] = {
            "vacuous": False,
            "frac":    round(level_frac, 4),
            "pass":    level_frac >= thr,
        }

    # Score = nível consecutivo mais alto a partir de L1
    score = 0
    for lvl in LEVELS:
        if levels_out[lvl]["pass"]:
            score = int(lvl[1])
        else:
            break

    return {"score": score, "levels": levels_out}


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("Extraindo dados do App.tsx…")
    site_domain_type, site_zone_map = parse_app_tsx()
    print(f"  SITE_DOMAIN_TYPE: {len(site_domain_type)} sites")
    print(f"  CSV_DATA (site→zone): {len(site_zone_map)} sites")

    raw_caps, product_zone_coverage, all_domain_products = load_capabilities()

    # Sites a analisar: interseção de CSV_DATA e SITE_DOMAIN_TYPE
    sites_to_analyze = sorted(
        s for s in site_zone_map if s in site_domain_type
    )
    print(f"\nSites a analisar: {len(sites_to_analyze)}")

    output: dict = {}
    skipped = []

    for site_name in sites_to_analyze:
        zone       = site_zone_map[site_name]
        domain_map = site_domain_type[site_name]  # {"BP": "G", "MT": "L", ...}

        if zone not in ZONES:
            skipped.append((site_name, zone, "zona não suportada"))
            continue

        site_result: dict = {"zone": zone, "domains": {}}

        domain_scores = []
        for dc in ALL_DOMAINS:
            if dc not in domain_map:
                site_result["domains"][dc] = None
                continue

            site_type = domain_map[dc]
            excluded  = UNIVERSAL_EXCLUDED.get(dc, set())

            dom_detail = analyze_domain(
                zone, site_type, dc, excluded,
                raw_caps, product_zone_coverage, all_domain_products,
            )
            dom_detail["type"] = site_type
            site_result["domains"][dc] = dom_detail

            if dc != "UT":
                domain_scores.append(dom_detail["score"])

        site_result["score"] = min(domain_scores) if domain_scores else 0
        output[site_name] = site_result

    if skipped:
        print(f"\nSkipped ({len(skipped)}):")
        for s, z, reason in skipped:
            print(f"  {s} ({z}): {reason}")

    # ── Salvar JSON ───────────────────────────────────────────────────────────
    OUTPUT_JSON.write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"\nSalvo: {OUTPUT_JSON}")
    print(f"  {len(output)} sites × {len(ALL_DOMAINS)} domínios")

    # ── Resumo de score distribution ─────────────────────────────────────────
    from collections import Counter
    score_dist = Counter(v["score"] for v in output.values())
    print("\nDistribuição de scores (site score):")
    for lvl in range(5):
        print(f"  L{lvl}: {score_dist[lvl]:>4} sites")


if __name__ == "__main__":
    main()
