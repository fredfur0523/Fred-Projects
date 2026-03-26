#!/usr/bin/env python3
"""
extract_site_types.py
=====================
Extrai o mapeamento Global/Legacy por site+domínio da planilha Coverage.xlsx
e gera o conteúdo da constante SITE_DOMAIN_TYPE para App.tsx.

Uso
---
    python scripts/extract_site_types.py
    # ou especificando o caminho do Excel:
    python scripts/extract_site_types.py --excel ../Coverage.xlsx

Saída
-----
    Imprime no terminal o bloco TypeScript pronto para colar em App.tsx.
    Também salva em scripts/output/site_domain_type.json para inspeção.

Regras de negócio
-----------------
- Fonte: aba "Coverage global and legacy", coluna "GlobalxLegacy"
- Filtro: apenas registros com Live? = "Yes" (case-insensitive)
- Quando um site tem Global E Legacy ativos no mesmo domínio: Legacy prevalece
- Domínios sem produto ativo são omitidos do mapeamento

Dependências
------------
    pip install pandas openpyxl
"""

import argparse
import json
import os
import sys
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("Erro: pandas não instalado. Execute: pip install pandas openpyxl")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Mapeamento nome completo do domínio → código curto usado em App.tsx
# Obs: "Data Acquisiton" tem typo na planilha original — mantido intencionalmente
# ---------------------------------------------------------------------------
DOMAIN_MAP = {
    "Brewing Performance":   "BP",
    "Data Acquisiton":       "DA",   # typo na planilha — não corrigir
    "Data Acquisition":      "DA",   # variante corrigida, caso apareça
    "Maintenance":           "MT",
    "Management":            "MG",
    "MasterData Management": "MDM",
    "Packaging Performance": "PP",
    "Quality":               "QL",
    "Safety":                "SF",
    "Utilities":             "UT",
}

# Domínios que devem ser ignorados (não têm código no dashboard)
IGNORED_DOMAINS = {"Production", "E2"}


def find_excel(explicit_path: str | None) -> Path:
    """Localiza o arquivo Coverage.xlsx."""
    if explicit_path:
        p = Path(explicit_path)
        if not p.exists():
            print(f"Erro: arquivo não encontrado: {p}")
            sys.exit(1)
        return p

    # Tenta caminhos padrão relativos à raiz do projeto
    candidates = [
        Path("Coverage.xlsx"),
        Path("../Coverage.xlsx"),
        Path("../../Coverage.xlsx"),
    ]
    for c in candidates:
        if c.exists():
            return c.resolve()

    print(
        "Erro: Coverage.xlsx não encontrado.\n"
        "Coloque o arquivo na raiz do projeto ou use --excel <caminho>."
    )
    sys.exit(1)


def extract(excel_path: Path) -> dict[str, dict[str, str]]:
    """Lê a planilha e retorna o mapeamento site → domínio → G/L."""
    print(f"Lendo: {excel_path}")
    df = pd.read_excel(excel_path, sheet_name="Coverage global and legacy")

    # Normaliza a coluna Live?
    live_col = next((c for c in df.columns if c.strip().lower().startswith("live")), None)
    if not live_col:
        print("Erro: coluna 'Live?' não encontrada na aba.")
        sys.exit(1)

    df["_live"] = df[live_col].astype(str).str.strip().str.lower() == "yes"
    live = df[df["_live"]].copy()

    print(f"  Total de registros: {len(df)}")
    print(f"  Registros ativos (Live=Yes): {len(live)}")

    result: dict[str, dict[str, str]] = {}

    for (plant, domain), grp in live.groupby(["Plant", "Domain"]):
        dom_short = DOMAIN_MAP.get(str(domain).strip())
        if not dom_short:
            if str(domain).strip() not in IGNORED_DOMAINS:
                print(f"  Aviso: domínio desconhecido ignorado → '{domain}'")
            continue

        types = set(grp["GlobalxLegacy"].astype(str).str.strip().unique())
        # Legacy prevalece quando ambos coexistem
        gl = "L" if "Legacy Product" in types else "G"

        plant_key = str(plant).strip()
        if plant_key not in result:
            result[plant_key] = {}
        result[plant_key][dom_short] = gl

    return result


def main():
    parser = argparse.ArgumentParser(description="Extrai SITE_DOMAIN_TYPE do Coverage.xlsx")
    parser.add_argument("--excel", help="Caminho para o arquivo Coverage.xlsx", default=None)
    parser.add_argument("--no-file", action="store_true", help="Não salvar arquivo JSON de saída")
    args = parser.parse_args()

    excel_path = find_excel(args.excel)
    result = extract(excel_path)

    print(f"\n  Sites mapeados: {len(result)}")
    g_count = sum(1 for s in result.values() for v in s.values() if v == "G")
    l_count = sum(1 for s in result.values() for v in s.values() if v == "L")
    print(f"  Entradas Global (G): {g_count}")
    print(f"  Entradas Legacy (L): {l_count}")

    json_inline = json.dumps(result, ensure_ascii=False, separators=(",", ":"))
    ts_line = f"const SITE_DOMAIN_TYPE: Record<string, Record<string, string>> = {json_inline};"

    # Salvar arquivo para inspeção
    if not args.no_file:
        out_dir = Path("scripts/output")
        out_dir.mkdir(parents=True, exist_ok=True)
        out_json = out_dir / "site_domain_type.json"
        out_json.write_text(
            json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print(f"\nArquivo salvo: {out_json}")

    print("\n" + "=" * 72)
    print("CONTEÚDO PARA COLAR EM App.tsx (linha ~164):")
    print("Substitua a linha que começa com 'const SITE_DOMAIN_TYPE'")
    print("=" * 72)
    print(ts_line)
    print("=" * 72)
    print("\nDica: no Cursor, use Ctrl+F → 'const SITE_DOMAIN_TYPE' para localizar.")


if __name__ == "__main__":
    main()
