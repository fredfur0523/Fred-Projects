#!/usr/bin/env python3
"""
update_csv_data.py
==================
Extrai os dados de scores dos 163 sites da planilha Coverage.xlsx
e gera o conteúdo da constante CSV_DATA para App.tsx.

Uso
---
    python scripts/update_csv_data.py
    # ou especificando o caminho do Excel:
    python scripts/update_csv_data.py --excel ../Coverage.xlsx

Saída
-----
    Imprime no terminal o bloco TypeScript pronto para colar em App.tsx.
    Também salva em scripts/output/csv_data.txt para inspeção.

Mapeamento de colunas
---------------------
    Planilha "Consolidação Coverage"    →  CSV_DATA (App.tsx)
    ─────────────────────────────────────────────────────────
    Zone                                → Zone
    Site                                → Site
    Country                             → Country
    Volume          (de "Sites")        → Volume
    Brewing Performance                 → BP
    Data Acquisiton                     → DA
    E2                                  → UT   ← nota: E2 é renomeado para UT
    Maintenance                         → MT
    Management                          → MG
    MasterData Management               → MDM
    Packaging Performance               → PP
    Quality                             → QL
    Safety                              → SF
    Score                               → Score

Observações
-----------
- A aba "Consolidação Coverage" não tem a coluna Volume: ela é buscada
  na aba "Sites" com join pelo nome do site (Plant).
- Volumes ausentes são preenchidos com 0.
- A coluna E2 da planilha corresponde a Utilities (UT) no dashboard.
- Scores são convertidos para inteiro (0–4). NaN → 0.

Dependências
------------
    pip install pandas openpyxl
"""

import argparse
import io
import sys
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    print("Erro: pandas não instalado. Execute: pip install pandas openpyxl")
    sys.exit(1)


def find_excel(explicit_path: str | None) -> Path:
    """Localiza o arquivo Coverage.xlsx."""
    if explicit_path:
        p = Path(explicit_path)
        if not p.exists():
            print(f"Erro: arquivo não encontrado: {p}")
            sys.exit(1)
        return p

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


def extract(excel_path: Path) -> pd.DataFrame:
    """Lê a planilha e retorna DataFrame com as colunas do CSV_DATA."""
    print(f"Lendo: {excel_path}")

    # ── Aba principal de scores ──────────────────────────────────────────────
    scores = pd.read_excel(excel_path, sheet_name="Consolidação Coverage")
    print(f"  Aba 'Consolidação Coverage': {len(scores)} sites")

    # ── Aba de volumes ───────────────────────────────────────────────────────
    sites = pd.read_excel(excel_path, sheet_name="Sites")
    # Agregar por site (soma de sub-plantas, se houver duplicatas)
    vol_map = (
        sites.groupby("Plant")["Volume"]
        .sum()
        .reset_index()
        .rename(columns={"Plant": "Site"})
    )

    # ── Merge volumes ────────────────────────────────────────────────────────
    df = scores.merge(vol_map, on="Site", how="left")
    # A coluna Volume vem do merge (vol_map); pode não existir se nenhum site bateu
    if "Volume" not in df.columns:
        df["Volume"] = 0
    df["Volume"] = df["Volume"].fillna(0).astype(int)

    # ── Renomear colunas para os códigos curtos ──────────────────────────────
    col_rename = {
        "Brewing Performance":   "BP",
        "Data Acquisiton":       "DA",   # typo original — não corrigir
        "Data Acquisition":      "DA",   # variante corrigida
        "E2":                    "UT",   # E2 = Utilities no dashboard
        "Maintenance":           "MT",
        "Management":            "MG",
        "MasterData Management": "MDM",
        "Packaging Performance": "PP",
        "Quality":               "QL",
        "Safety":                "SF",
    }
    df = df.rename(columns=col_rename)

    # ── Verificar colunas esperadas ──────────────────────────────────────────
    required_score_cols = ["BP", "DA", "UT", "MT", "MG", "MDM", "PP", "QL", "SF"]
    missing = [c for c in required_score_cols if c not in df.columns]
    if missing:
        print(f"\nAviso: colunas ausentes (serão preenchidas com 0): {missing}")
        for c in missing:
            df[c] = 0

    # ── Converter scores para inteiro ────────────────────────────────────────
    for c in required_score_cols:
        df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0).astype(int)

    # ── Calcular Score médio (arredondado para 2 casas) ──────────────────────
    # Usa a coluna Score já existente na planilha; se ausente, recalcula
    if "Score" in df.columns:
        df["Score"] = pd.to_numeric(df["Score"], errors="coerce").fillna(0).round(2)
    else:
        active_cols = [c for c in required_score_cols if df[c].sum() > 0]
        df["Score"] = df[active_cols].mean(axis=1).round(2)

    # ── Selecionar e ordenar colunas finais ──────────────────────────────────
    output_cols = ["Zone", "Site", "Country", "Volume",
                   "BP", "DA", "UT", "MT", "MG", "MDM", "PP", "QL", "SF", "Score"]

    # Manter apenas colunas que existem
    available = [c for c in output_cols if c in df.columns]
    missing_out = [c for c in output_cols if c not in df.columns]
    if missing_out:
        print(f"\nAviso: colunas de saída ausentes (omitidas): {missing_out}")

    return df[available]


def df_to_csv_data(df: pd.DataFrame) -> str:
    """Converte DataFrame para string CSV no formato do CSV_DATA."""
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    return buf.getvalue().strip()


def main():
    parser = argparse.ArgumentParser(description="Extrai CSV_DATA do Coverage.xlsx")
    parser.add_argument("--excel", help="Caminho para o arquivo Coverage.xlsx", default=None)
    parser.add_argument("--no-file", action="store_true", help="Não salvar arquivo de saída")
    args = parser.parse_args()

    excel_path = find_excel(args.excel)
    df = extract(excel_path)

    print(f"\n  Sites extraídos: {len(df)}")
    print(f"  Zonas: {sorted(df['Zone'].unique())}")

    csv_text = df_to_csv_data(df)
    ts_block = f"const CSV_DATA = `{csv_text}`;"

    # Salvar para inspeção
    if not args.no_file:
        out_dir = Path("scripts/output")
        out_dir.mkdir(parents=True, exist_ok=True)
        out_csv = out_dir / "csv_data.csv"
        out_csv.write_text(csv_text, encoding="utf-8")
        print(f"\nArquivo salvo: {out_csv}")

    print("\n" + "=" * 72)
    print("CONTEÚDO PARA COLAR EM App.tsx (linha ~170):")
    print("Substitua o bloco que começa com 'const CSV_DATA = `'")
    print("=" * 72)
    print(ts_block)
    print("=" * 72)
    print("\nDica: no Cursor, use Ctrl+F → 'const CSV_DATA' para localizar.")


if __name__ == "__main__":
    main()
