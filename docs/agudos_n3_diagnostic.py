"""
agudos_n3_diagnostic.py
-----------------------
Avalia Agudos (SAZ) usando abordagem N3 com:
  1. Threshold N4: 40% (era 75%) — N3 entregue se ≥40% do peso N4 disponível
  2. Ponderação por relevância de N4 (keyword-based):
       - Funcional  (2.0): calculate, compute, monitor, track, register, record,
                           capture, measure, collect, generate, analyze, evaluate,
                           report, alert, detect, visualize, display, show, identify
       - Operacional (1.0): manage, provide, ensure, enable, improve, validate,
                            check, view, access, update, allow, perform, execute,
                            standardize, reduce, optimize, integrate
       - Administrativo (0.5): create, delete, edit, configure, setup, add, remove,
                               grant, revoke, duplicate, inactivate, populate, translate,
                               set up, expose, receive, send, sync
  3. Produto implantado em Agudos (cross com SITE_DOMAIN_TYPE):
       QL: exclui Process Hygiene + PTS Management
       MG: exclui KPI-PI
       Production Order: backbone — fica em todos os domínios onde aparece

Dominância: max(G_frac, L_SAZ_frac) por N3 group.
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
    "Brewing Performance":  "BP",
    "Data Acquisition":     "DA",
    "Utilities":            "UT",
    "Maintenance":          "MT",
    "Management":           "MG",
    "MasterData Management":"MDM",
    "Packaging Performance":"PP",
    "Quality":              "QL",
    "Safety":               "SF",
}

COL = {
    "domain":   3,   # D
    "product":  4,   # E
    "n3_func":  8,   # I — N3 functional group
    "n4_func":  9,   # J — N4 capability name
    "L1":      12,   # M
    "L2":      13,   # N
    "L3":      14,   # O
    "L4":      15,   # P
    "status":  16,   # Q
}
LEVELS = ["L1", "L2", "L3", "L4"]

# SAZ legacy columns (0-based index from letter)
SAZ_COLS_LETTERS = ["AN","AO","AP","AQ","AR","AS","AT","AU","AV","AW"]
SAZ_COL_NAMES    = ["Athena","LMS","SAP PM","Ceres","Argos",
                    "Smartcheck","Growler","Soda 1.0","Oraculo","Soda Vision"]

LEGACY_AVAILABLE = {"must have", "necessary"}

# ─────────────────────────────────────────────────────────────────────────────
# Filtro de escopo por domínio × nível — reduz régua ao processo central L1/L2
# ─────────────────────────────────────────────────────────────────────────────
def should_include_n3(domain: str, level: str, n3_name: str) -> bool:
    """Retorna True se o N3 group deve ser incluído no cálculo para esse domínio/nível."""
    n = n3_name.lower()

    # BP L1: performance de Brewhouse — downtime, volume, categorização, OSE
    # Exclui: integrações externas, configuração de site, AI suggestiva
    if domain == "BP" and level == "L1":
        exclude = [
            "integration between bms and",   # integrações externas
            "add target",                     # configuração de metas
            "brand & line parameter",         # config de linha
            "new site configuration",         # admin
            "suggestive categorization",      # AI feature (L3+)
            "show local mdm change",          # MDM audit trail
        ]
        return not any(p in n for p in exclude)

    # BP L2: criar/deletar/editar paradas em Filtração+Brassagem (auto e manual)
    #         + consolidação de performance via dashboard
    # Escopo intencional e restrito: sem MDM linkage, sem PI charts multi-área,
    # sem Cellar/BBT, sem gestão de plano de ordens
    if domain == "BP" and level == "L2":
        include = [
            "equipment downtime creat",      # criar paradas de equipamento (auto/manual)
            "equipment downtime categori",   # categorizar paradas
            "equipment downtime graph",      # gráfico de paradas → dashboard
            "equipment downtime table",      # tabela de paradas → dashboard
            "front-end indicators",          # indicadores por turno → dashboard
            "detailed categorization",       # categorização detalhada de paradas
            "create (sub)categor",           # criação de subcategorias de paradas
            "filtration",                    # área: filtração
            "brewhouse",                     # área: brassagem
            "order visibility",              # visibilidade de ordens → dashboard
        ]
        return any(p in n for p in include)

    # MDM L1/L2: apenas assets e master data básicos
    # Exclui: automação, observabilidade, features avançadas de governança
    if domain == "MDM" and level in ("L1", "L2"):
        include = [
            "asset", "location", "equipment", "material", "product", "brand",
            "shift", "user", "role", "cip entit", "parameter type",
            "static", "quality book", "translation", "management of",
            "master data of",
        ]
        return any(p in n for p in include)

    # SF L1: apenas registro básico de acidentes e gestão de incidentes
    # Exclui: gamificação, mapas de risco, contractor, permits, visitas, shift talks
    if domain == "SF" and level == "L1":
        include = [
            "accident", "incident", "standardize report", "unify incident",
            "capture observations", "sif", "establish fai",
        ]
        return any(p in n for p in include)

    # SF L2: vacuous — compliance depth desloca para L3
    # L2 = mínimo já executado em L1 (sem N3 adicionais)
    # Todo o step-up de compliance (profundidade de reporte, inspeção, planejamento anual) → L3
    if domain == "SF" and level == "L2":
        return False  # exclui todos → grupos vazio → vacuous PASS

    # QL L1: ordens e PTS para as 5 áreas de processo central
    # Packaging, Brewhouse, Cellars, BBT/Bright Beer, Filtration
    # PTS Execution genérico (não específico de área) também incluído
    if domain == "QL" and level == "L1":
        # Production Order: apenas os 5 sub-tipos de área em escopo
        po_in_scope = [
            "brewhouse order", "cellar order", "cellars order",
            "bright beer order", "bbt", "filtration order",
            "ccyp",  # Chill, Carbonation, Yeast Pitch — parte do processo BBT/Cellar
        ]
        # PTS Execution genérico: inclui todos exceto os claramente fora de escopo
        po_out_scope = [
            "yeast management order",
            "dealcoholiz",
            "road tankering",
            "soft drink",
            "general order",
            "scrapping",
            "downgrad",
            "material consumption",
            "wip management",
            "audition",
            "unity of measure",
            "production order step",
            "traceability",
        ]
        # Se é Production Order, filtra pelo sub-tipo
        if "production order" in n:
            if any(p in n for p in po_out_scope):
                return False
            return any(p in n for p in po_in_scope) or not any(
                out in n for out in po_out_scope
            )
        # PTS Execution e demais: incluir tudo
        return True

    # QL L2: mesma janela de 5 áreas do L1 + performance básica de execução
    # Compliance profundo (audit, traceabilidade, especificações) → L3
    if domain == "QL" and level == "L2":
        deep_compliance = [
            "audit", "traceabilit", "mass balance", "specification management",
            "supplier quality", "customer complaint", "deviation management",
            "sample plan", "quality gate", "release strategy",
            # Muito específico: exclusão de resultado individual de PTS do KPI → N2-level, não L2
            "exclude or surpress",
            "exclude or suppress",
        ]
        if any(p in n for p in deep_compliance):
            return False
        # Sub-tipos de produção fora de escopo para Agudos
        # (ao nível L2, o N3 pode ser só o nome do sub-tipo sem prefixo "production order")
        out_of_scope_types = [
            "yeast management", "dealcoholiz", "road tankering",
            "soft drink", "scrapping", "downgrad",
            "material consumption",
        ]
        if any(p in n for p in out_of_scope_types):
            return False
        # Também filtra via prefixo "production order" (caso o nome inclua)
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

    # PP L2: todos os equipamentos cobertas + KPI por equipamento + fault codes
    # Exclui: trends avançadas, dashboards customizados, gestão de plano de produção,
    #         fluxos NST/DPA, integração legacy, admin de configuração, analytics histórico
    if domain == "PP" and level == "L2":
        exclude = [
            "trend",                    # trend line KPIs, production trend → L3
            "dashboard",                # create dashboards → L3
            "finish production plan",   # plan management → L3
            "check production plan",    # plan management → L3
            "start production order",   # automation → L3
            "nst",                      # NST validation/approval workflow → L3
            "dpa",                      # DPA cancellation → L3
            "legacy integration",       # OneMes legacy integration → L3
            "configure line",           # admin line config → L3
            "manage line categor",      # admin line categories → L3
            "historical performance",   # historical analytics depth → L3
            "check metrics raw data",   # raw data depth → L3
            "multiple sku",             # complex multi-SKU order mgmt → L3
        ]
        return not any(p in n for p in exclude)

    # MG L2: ferramentas digitais de gestão (Eureka, SPLAN) disponíveis
    # Exclui: métricas de adoção comportamental (participação, autonomia, adesão)
    # Nota: os N3 names usam "front line" (com espaço) e verbos no gerúndio
    if domain == "MG" and level == "L2":
        exclude = [
            "team members actively",   # SPLAN front-line behavior
            "team understands",        # knowledge/behavioral assessment
            "team members can expla",  # behavioral assessment (frontline explains)
            "participat",              # "participate" e "participation" (Eureka adoption)
            "implementation progress", # tracking adoption status
            "implemented ideas",       # adoption result measurement
            "evaluate the im",         # teams evaluate implementation (Eureka)
            "non-compl",               # action plans for non-compliance
            "gop implementation is",   # GOP implementation tracking
            "implementation routines", # adoption routines in place
            "kpi tree",                # whether teams selected KPIs from tool
        ]
        return not any(p in n for p in exclude)

    return True  # demais domínios/níveis: sem filtro


# Threshold para declarar N3 como entregue (fração do peso N4 disponível)
N3_DELIVERY_THRESHOLD = 0.40

# Threshold progressivo por nível — L1 básico, L4 rigoroso
LEVEL_THRESHOLDS = {
    "L1": 0.60,
    "L2": 0.75,
    "L3": 0.85,
    "L4": 0.90,
}

# Agudos: domínios ativos e tipo (de SITE_DOMAIN_TYPE no App.tsx)
AGUDOS_DOMAINS = {
    "BP": "G",
    "DA": "G",
    "UT": "G",   # mantido no display, excluído do min()
    "MT": "G",
    "MG": "G",
    "MDM":"G",
    "PP": "L",
    "QL": "L",
    "SF": "G",
}

# Produtos a excluir para Agudos (não implantados)
AGUDOS_EXCLUDED_PRODUCTS = {
    "QL":  {"Process Hygiene", "PTS Management"},
    "MG":  {"KPI-PI"},
}

# ─────────────────────────────────────────────────────────────────────────────
# Peso de relevância por N4 (keyword matching na descrição, case-insensitive)
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
    """
    Retorna peso de relevância do N4 com base na descrição.
    Funcional=2.0, Administrativo=0.5, Operacional=1.0 (default).
    """
    desc = description.lower()
    # Checa funcional primeiro (maior peso)
    for kw in FUNCTIONAL_KEYWORDS:
        if kw in desc:
            return 2.0
    # Checa administrativo (menor peso)
    for kw in ADMIN_KEYWORDS:
        if kw in desc:
            return 0.5
    return 1.0  # operacional / neutro


# ─────────────────────────────────────────────────────────────────────────────
# Carga da planilha
# ─────────────────────────────────────────────────────────────────────────────

print("Carregando planilha…")
wb = openpyxl.load_workbook(READINESS_XL, read_only=True, data_only=True)
ws = wb["Capabilities Readiness"]

saz_idxs = [column_index_from_string(c) - 1 for c in SAZ_COLS_LETTERS]
max_col   = max(saz_idxs) + 1

# Estrutura: domain → level → (product, n3_group) → lista de {g, l_saz, weight}
data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

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

    # Nível
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

    # Filtro de produtos não implantados em Agudos
    excluded = AGUDOS_EXCLUDED_PRODUCTS.get(domain_code, set())
    if product in excluded:
        continue

    # Filtro de escopo N3 (BP=Brewhouse, MDM=assets, SF=acidentes)
    if not should_include_n3(domain_code, level, n3_group):
        continue

    global_ready = str(row[COL["status"]] or "").strip().upper() == "READY"
    l_saz = any(str(row[idx] or "").strip().lower() in LEGACY_AVAILABLE for idx in saz_idxs)

    weight = n4_weight(n4_desc)

    key = (product, n3_group)
    data[domain_code][level][key].append({
        "n4": n4_desc,
        "g":  global_ready,
        "l":  l_saz,
        "w":  weight,
    })
    rows_loaded += 1

wb.close()
print(f"  {rows_loaded} N4 capabilities carregadas\n")


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def score_agudos_domain(domain_code: str, sys_type: str) -> int:
    """
    Calcula o score L0-L4 de um domínio para Agudos.
    sys_type: 'G' ou 'L' (do SITE_DOMAIN_TYPE).
    Usa max(G, L_SAZ) para disponibilidade.
    """
    score = 0
    level_data = data[domain_code]

    for lvl in LEVELS:
        groups = level_data.get(lvl, {})
        if not groups:
            # Vacuous pass — nenhum N3 definido → avança
            score = int(lvl[1])
            continue

        total_weight_passed = 0.0
        total_weight_all    = 0.0

        for (prod, n3), n4s in groups.items():
            w_avail = sum(
                n4["w"] for n4 in n4s
                if n4["g"] or n4["l"]   # max(G, L_SAZ)
            )
            w_total = sum(n4["w"] for n4 in n4s)
            n3_frac = w_avail / w_total if w_total > 0 else 0.0
            n3_delivered = n3_frac >= N3_DELIVERY_THRESHOLD
            if n3_delivered:
                total_weight_passed += w_total
            total_weight_all += w_total

        level_frac = total_weight_passed / total_weight_all if total_weight_all > 0 else 0.0
        if level_frac >= LEVEL_THRESHOLDS[lvl]:
            score = int(lvl[1])
        else:
            break   # cumulativo — falhou aqui, para

    return score


# ─────────────────────────────────────────────────────────────────────────────
# Output por domínio (detalhe N3)
# ─────────────────────────────────────────────────────────────────────────────

thr_str = " | ".join(f"{l}≥{v*100:.0f}%" for l, v in LEVEL_THRESHOLDS.items())
print("=" * 100)
print(f"AGUDOS (SAZ) — Abordagem N3 com Ponderação de Relevância N4 | Thresholds Progressivos")
print(f"  N3 entregue  : frac_peso_disponível ≥ {N3_DELIVERY_THRESHOLD*100:.0f}%")
print(f"  Nível OK     : {thr_str}   (ponderado por peso_total do grupo)")
print(f"  Pesos N4     : Funcional=2.0 | Operacional=1.0 | Administrativo=0.5")
print(f"  Dominância   : max(G, L_SAZ)")
print("=" * 100)

domain_scores = {}

for domain_code in ["BP","DA","UT","MT","MG","MDM","PP","QL","SF"]:
    sys_type = AGUDOS_DOMAINS.get(domain_code, "G")
    excluded = AGUDOS_EXCLUDED_PRODUCTS.get(domain_code, set())

    print(f"\n{'─'*100}")
    print(f"[{domain_code}] tipo={sys_type}"
          + (f"  (excluídos: {', '.join(sorted(excluded))})" if excluded else ""))

    level_data = data[domain_code]
    products_seen = set()
    for lvl in LEVELS:
        for (prod, _) in level_data.get(lvl, {}):
            products_seen.add(prod)
    print(f"  Produtos: {', '.join(sorted(products_seen)) or '—'}")
    print(f"  {'N3 group (produto | funcionalidade)':<58} {'N4':>4} {'G%':>6} {'L%':>6} {'max%':>6} {'W_avail/W_tot':>14} {'≥40%?':>6}")

    score = 0
    for lvl in LEVELS:
        groups = level_data.get(lvl, {})
        if not groups:
            score = int(lvl[1])
            print(f"\n  [{lvl}] — sem N3 definidos (vacuous PASS → score sobe para {lvl})")
            continue

        total_w_passed = 0.0
        total_w_all    = 0.0
        n3_delivered_count = 0
        n3_total_count     = len(groups)

        group_rows = []
        for (prod, n3), n4s in sorted(groups.items()):
            n_n4    = len(n4s)
            g_count = sum(1 for x in n4s if x["g"])
            l_count = sum(1 for x in n4s if x["l"])
            g_pct   = g_count / n_n4 * 100
            l_pct   = l_count / n_n4 * 100
            max_pct = max(g_pct, l_pct)

            w_avail = sum(x["w"] for x in n4s if x["g"] or x["l"])
            w_total = sum(x["w"] for x in n4s)
            n3_frac = w_avail / w_total if w_total > 0 else 0.0
            delivered = n3_frac >= N3_DELIVERY_THRESHOLD

            if delivered:
                total_w_passed += w_total
                n3_delivered_count += 1
            total_w_all += w_total

            label = f"{prod[:22]} | {n3[:33]}"
            mark  = "✓" if delivered else "○"
            group_rows.append((delivered, mark, label, n_n4, g_pct, l_pct, max_pct,
                               w_avail, w_total, n3_frac))

        level_frac = total_w_passed / total_w_all if total_w_all > 0 else 0.0
        thr = LEVEL_THRESHOLDS[lvl]
        level_ok   = level_frac >= thr

        status_str = "✓ PASS" if level_ok else "✗ FAIL"
        print(f"\n  [{lvl}] {n3_delivered_count}/{n3_total_count} N3 entregues"
              f"   W_score={level_frac*100:.1f}% (gate={thr*100:.0f}%)  → {status_str}")

        # Mostrar grupos ordenados: falhos primeiro (para análise), depois entregues
        for delivered, mark, label, n_n4, g_pct, l_pct, max_pct, w_avail, w_total, n3_frac in \
                sorted(group_rows, key=lambda r: (r[0], -r[9])):
            print(f"    {mark} {label:<58} n={n_n4:>3}  G:{g_pct:4.0f}%  L:{l_pct:4.0f}%"
                  f"  max:{max_pct:4.0f}%  {w_avail:4.1f}/{w_total:4.1f}={n3_frac*100:4.0f}%"
                  f"  {'✓' if delivered else '—'}")

        if level_ok:
            score = int(lvl[1])
        else:
            break

    domain_scores[domain_code] = score
    print(f"\n  ⟹ Score Agudos [{domain_code}] = L{score}")

# ─────────────────────────────────────────────────────────────────────────────
# Resumo final
# ─────────────────────────────────────────────────────────────────────────────

print("\n\n" + "=" * 100)
print("RESUMO AGUDOS — Abordagem N3 Ponderada | N4≥40% | Nível≥90% (weighted)")
print("─" * 60)
print(f"  {'Dom':<6} {'Tipo':<6} {'Score'}")
for dc in ["BP","DA","UT","MT","MG","MDM","PP","QL","SF"]:
    sys_type = AGUDOS_DOMAINS.get(dc, "G")
    sc = domain_scores.get(dc, 0)
    note = " ← excluído do min()" if dc == "UT" else ""
    print(f"  {dc:<6} {sys_type:<6} L{sc}{note}")

active = {dc: s for dc, s in domain_scores.items() if dc in AGUDOS_DOMAINS and dc != "UT"}
site_score = min(active.values()) if active else 0
print(f"\n  Site score = min(domínios ativos, excl. UT) = L{site_score}")
print(f"  Survey atual = L2")

# ─────────────────────────────────────────────────────────────────────────────
# Tabela compacta de frações por domínio × nível
# ─────────────────────────────────────────────────────────────────────────────
print("\n\n" + "=" * 100)
print("FRAÇÕES W_SCORE POR DOMÍNIO × NÍVEL | gates progressivos: L1≥60% | L2≥75% | L3≥85% | L4≥90%")
print(f"  {'Dom':<6} {'L1(g60%)':>14} {'L2(g75%)':>14} {'L3(g85%)':>14} {'L4(g90%)':>14}   Score")
print("  " + "─" * 70)
for dc in ["BP","DA","UT","MT","MG","MDM","PP","QL","SF"]:
    fracs = []
    stop_reached = False
    score = 0
    for lvl in LEVELS:
        groups = data[dc].get(lvl, {})
        if not groups:
            fracs.append("vacuous")
            if not stop_reached:
                score = int(lvl[1])
            continue
        total_w_passed = 0.0
        total_w_all    = 0.0
        for (_, _), n4s in groups.items():
            w_avail = sum(x["w"] for x in n4s if x["g"] or x["l"])
            w_total = sum(x["w"] for x in n4s)
            n3_frac = w_avail / w_total if w_total > 0 else 0.0
            if n3_frac >= N3_DELIVERY_THRESHOLD:
                total_w_passed += w_total
            total_w_all += w_total
        lf = total_w_passed / total_w_all if total_w_all > 0 else 0.0
        thr = LEVEL_THRESHOLDS[lvl]
        fracs.append(f"{lf*100:4.1f}%(g{thr*100:.0f})")
        if not stop_reached:
            if lf >= thr:
                score = int(lvl[1])
            else:
                stop_reached = True
    row = "  " + f"{dc:<6}"
    for f in fracs:
        row += f"  {f:>8}"
    row += f"   L{score}"
    print(row)

print("\nDone.")
