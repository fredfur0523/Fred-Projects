#!/usr/bin/env python3
"""
recalculate_csv_data.py
=======================
Gera novo CSV_DATA a partir de maturity_detail.json (scores N3/N4) +
dados de volume/country do CSV_DATA atual.

Regra: domínios sem produto ativo (exceto UT) → score = 0 (L0),
INCLUÍDOS no cálculo do site score.

Site score = min de TODOS os domínios não-UT (incluindo L0).
Sites ausentes do maturity_detail.json → todos os domínios L0, site score = 0.

Uso:
    cd /home/fredfur/projects/coverage-dashboard
    python3 scripts/recalculate_csv_data.py

Saída:
    Imprime o bloco CSV_DATA pronto para colar em App.tsx
    Salva em scripts/output/new_csv_data.csv para inspeção
"""

import csv
import io
import json
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
MATURITY_JSON = PROJECT_ROOT / "docs" / "maturity_detail.json"
APP_TSX = PROJECT_ROOT / "client" / "src" / "App.tsx"
OUTPUT_DIR = PROJECT_ROOT / "scripts" / "output"
OUTPUT_DIR.mkdir(exist_ok=True)
SITE_PRODUCT_MAP_TS = OUTPUT_DIR / "site_product_map.ts"

DOMAIN_KEYS = ["BP", "DA", "UT", "MT", "MG", "MDM", "PP", "QL", "SF"]

# Domínios excluídos do cálculo do site score (mín de domínios ativos):
#   UT — definições de nível ainda não estabelecidas
#   SF — Credit 360 universal (presente em todas as plantas, registro de acidentes) ainda não
#        mapeado na planilha de Coverage. SF=0 é um artefato de dados, não maturidade real.
#        TEMPORÁRIO — remover SF daqui quando a planilha for atualizada com os dados de SF.
SCORE_EXCLUDED = {"UT", "SF"}
DOMAIN_FULL = {
    "BP": "Brewing Performance",
    "DA": "Data Acquisition",
    "UT": "Utilities",
    "MT": "Maintenance",
    "MG": "Management",
    "MDM": "MasterData Management",
    "PP": "Packaging Performance",
    "QL": "Quality",
    "SF": "Safety",
}


def parse_site_product_map() -> dict[str, dict[str, int | None]]:
    """
    Lê o site_product_map.ts gerado e retorna {site: {domain: score}}.
    score != None significa score computado via union group scoring.

    O formato novo tem nested braces (globalFracs:{...}), então parseia
    linha-a-linha. 'score:' vem antes de 'globalFracs:', então [^}]* é seguro.
    """
    if not SITE_PRODUCT_MAP_TS.exists():
        print(f"  AVISO: {SITE_PRODUCT_MAP_TS} não encontrado — scores computados não serão usados")
        return {}

    # site_pattern: "SiteName":{ — one site per line
    site_pattern = re.compile(r'^\s+"([^"]+)":\{')
    # domain_pattern: 'BP':{...score:1,...} — score: comes before globalFracs:{}
    domain_pattern = re.compile(r"'([A-Z]+)':\{[^}]*score:(null|\d+)")

    result: dict[str, dict[str, int | None]] = {}

    for line in SITE_PRODUCT_MAP_TS.read_text(encoding='utf-8').splitlines():
        sm = site_pattern.match(line)
        if not sm:
            continue
        site_name = sm.group(1)
        domain_scores: dict[str, int | None] = {}
        for dm in domain_pattern.finditer(line):
            dom_code = dm.group(1)
            score_str = dm.group(2)
            domain_scores[dom_code] = None if score_str == 'null' else int(score_str)
        if domain_scores:
            result[site_name] = domain_scores

    computed_count = sum(
        1 for site_data in result.values()
        for score in site_data.values()
        if score is not None
    )
    print(f"  SITE_PRODUCT_MAP: {len(result)} sites, {computed_count} domínios com score computado")
    return result


def parse_app_tsx():
    """Parse CSV_DATA e SITE_DOMAIN_TYPE do App.tsx."""
    content = APP_TSX.read_text()

    # CSV_DATA: extrair zone, site, country, volume
    m = re.search(r'const CSV_DATA\s*=\s*`([^`]+)`', content)
    if not m:
        raise ValueError("CSV_DATA não encontrado em App.tsx")
    csv_text = m.group(1).strip()
    reader = csv.DictReader(io.StringIO(csv_text))
    csv_rows = []
    for row in reader:
        csv_rows.append({
            'zone': row.get('Zone', '').strip(),
            'site': row.get('Site', '').strip(),
            'country': row.get('Country', '').strip(),
            'volume': row.get('Volume', '0').strip(),
        })

    # SITE_DOMAIN_TYPE
    m2 = re.search(r'const SITE_DOMAIN_TYPE[^=]*=\s*(\{.*?\})\s*;', content, re.DOTALL)
    if not m2:
        raise ValueError("SITE_DOMAIN_TYPE não encontrado")
    sdt = json.loads(m2.group(1).replace(' as const', '').strip().rstrip(';'))

    return csv_rows, sdt


def main():
    # Carregar maturity_detail
    md = json.load(MATURITY_JSON.open())
    print(f"maturity_detail.json: {len(md)} sites")

    # Carregar SITE_PRODUCT_MAP scores (para force-added products)
    spm_scores = parse_site_product_map()

    # Carregar CSV_DATA atual e SITE_DOMAIN_TYPE
    csv_rows, sdt = parse_app_tsx()
    print(f"CSV_DATA atual: {len(csv_rows)} sites")
    print(f"SITE_DOMAIN_TYPE: {len(sdt)} sites")

    # Mapeamento de nomes alternativos (CSV_DATA → SITE_DOMAIN_TYPE)
    NAME_MAP = {
        "Santa Cruz BO": "Santa Cruz (BO)",
        "Santa Cruz SABM": "Santa Cruz (SABM)",
        "Itapissuma": "Pernambuco",
    }

    output_rows = []
    stats = {'from_md': 0, 'name_mapped': 0, 'l0_all': 0}

    for row in csv_rows:
        site = row['site']
        zone = row['zone']
        country = row['country']
        volume = row['volume']

        # Tentar encontrar no maturity_detail
        md_key = NAME_MAP.get(site, site)

        if md_key in md:
            # Scores vindos da metodologia N3/N4
            site_data = md[md_key]
            domain_scores = {}
            for dk in DOMAIN_KEYS:
                dom = site_data.get('domains', {}).get(dk)
                if dom is None:
                    # Domain not evaluated — check SITE_PRODUCT_MAP for force-added score
                    spm_site = spm_scores.get(md_key, {})
                    spm_score = spm_site.get(dk)
                    domain_scores[dk] = spm_score if spm_score is not None else 0
                else:
                    md_score = dom.get('score') or 0
                    # If maturity_detail score is 0 (not evaluated), check SITE_PRODUCT_MAP
                    # for force-added product score (e.g. SAP PM in non-EUR MT)
                    if md_score == 0:
                        spm_site = spm_scores.get(md_key, {})
                        spm_score = spm_site.get(dk)
                        domain_scores[dk] = spm_score if spm_score is not None else 0
                    else:
                        domain_scores[dk] = md_score

            # Site score = min de TODOS os domínios não-UT (incluindo L0)
            # Regra: domínios sem produto ativo → score 0 (L0), incluídos no cálculo
            active = [domain_scores[dk] for dk in DOMAIN_KEYS if dk not in SCORE_EXCLUDED]
            site_score = min(active) if active else 0

            tag = 'MD'
            if site != md_key:
                stats['name_mapped'] += 1
                tag = 'MAP'
            else:
                stats['from_md'] += 1

        else:
            # Site sem dados de Readiness: usar scores computados do SITE_PRODUCT_MAP
            spm_site = spm_scores.get(md_key, {})
            domain_scores = {}
            for dk in DOMAIN_KEYS:
                spm_score = spm_site.get(dk)
                domain_scores[dk] = spm_score if spm_score is not None else 0

            active = [domain_scores[dk] for dk in DOMAIN_KEYS if dk not in SCORE_EXCLUDED]
            site_score = min(active) if active else 0

            sdt_key = NAME_MAP.get(site, site)
            if sdt_key in sdt:
                tag = 'SDT'
            else:
                tag = 'L0'
                stats['l0_all'] += 1

        # Calcular Score médio (avg de TODOS domínios não-UT, incluindo L0)
        active_scores = [domain_scores[dk] for dk in DOMAIN_KEYS if dk != 'UT']
        if active_scores:
            avg_score = sum(active_scores) / len(active_scores)
        else:
            avg_score = 0.0

        output_rows.append({
            'zone': zone,
            'site': site,
            'country': country,
            'volume': volume,
            'domain_scores': domain_scores,
            'site_score': site_score,
            'avg_score': avg_score,
            'tag': tag,
        })

    # Estatísticas
    print(f"\nResultado:")
    print(f"  De maturity_detail: {stats['from_md']}")
    print(f"  Mapeados (nome alternativo): {stats['name_mapped']}")
    print(f"  L0 (sem sistemas em Coverage): {stats['l0_all']}")
    print(f"  Total: {len(output_rows)}")

    # Distribuição de scores
    from collections import Counter
    dist = Counter(r['site_score'] for r in output_rows)
    print(f"\nDistribuição de site scores:")
    for level in range(5):
        count = dist.get(level, 0)
        pct = count / len(output_rows) * 100
        print(f"  L{level}: {count:3d} sites ({pct:.1f}%)")

    # Gerar CSV string no formato do CSV_DATA
    header = "Zone,Site,Country,Volume," + ",".join(DOMAIN_KEYS) + ",Score"
    csv_lines = [header]
    for r in output_rows:
        ds = r['domain_scores']
        domain_vals = ",".join(str(ds[dk]) for dk in DOMAIN_KEYS)
        line = f"{r['zone']},{r['site']},{r['country']},{r['volume']},{domain_vals},{r['site_score']:.2f}"
        csv_lines.append(line)

    csv_output = "\n".join(csv_lines)

    # Salvar para inspeção
    out_csv = OUTPUT_DIR / "new_csv_data.csv"
    out_csv.write_text(csv_output)
    print(f"\nSalvo para inspeção: {out_csv}")

    # Imprimir bloco TypeScript
    print("\n" + "="*60)
    print("COLE EM App.tsx (substitua o conteúdo do CSV_DATA):")
    print("="*60)
    ts_block = f"const CSV_DATA = `\n{csv_output}\n`;"
    print(ts_block[:500] + "\n... [truncado]")
    print(f"\nTotal de linhas: {len(csv_lines)}")

    # Salvar bloco TS completo
    out_ts = OUTPUT_DIR / "csv_data_block.ts"
    out_ts.write_text(ts_block)
    print(f"Bloco TypeScript completo salvo em: {out_ts}")

    return csv_output


if __name__ == "__main__":
    main()
