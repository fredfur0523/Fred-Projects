#!/usr/bin/env python3
"""
fix_bp_l1_gates.py
==================
Reclassifica N4s de Brewing Performance no Excel:
  - Subareas avançadas (Filtration, Fermentation, Cold aging, Cellars transfers, Cellars)
    saem do gate L1 e entram no gate L2.
  - Subareas básicas (Brewhouse, General) permanecem em L1.

L1 deve representar apenas: brassagem básica, categorização de downtime,
abertura/fechamento/edição de ordens, visualização básica de performance.

Uso:
    cd /home/fredfur/projects/coverage-dashboard
    python3 scripts/fix_bp_l1_gates.py
"""

import openpyxl
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
XLSX = PROJECT_ROOT / "docs" / "OneMES Readiness Consolidated.xlsx"
SHEET = "Capabilities Readiness"

# Subareas de BP que devem sair do L1 e entrar em L2
PROMOTE_TO_L2 = {"Filtration", "Fermentation", "Cold aging", "Cellars transfers", "Cellars"}

# Subareas que permanecem em L1 (documentadas para referência)
KEEP_IN_L1 = {"Brewhouse", "General"}

# Índices de coluna (0-based)
COL_DOMAIN = 3   # D — "Brewing Performance"
COL_SUBAREA = 5  # F — Subarea
COL_L1 = 12      # M — L1 gate
COL_L2 = 13      # N — L2 gate


def main():
    if not XLSX.exists():
        print(f"Erro: arquivo não encontrado: {XLSX}")
        return

    print(f"Abrindo: {XLSX}")
    wb = openpyxl.load_workbook(XLSX)
    ws = wb[SHEET]

    changed = 0
    skipped_l1_keep = 0
    skipped_no_l1 = 0

    for row in ws.iter_rows(min_row=2):
        domain_cell = row[COL_DOMAIN]
        subarea_cell = row[COL_SUBAREA]
        l1_cell = row[COL_L1]
        l2_cell = row[COL_L2]

        if not domain_cell.value:
            continue
        if str(domain_cell.value).strip() != "Brewing Performance":
            continue

        # Sem gate L1 → nada a fazer
        if not l1_cell.value:
            skipped_no_l1 += 1
            continue

        subarea = str(subarea_cell.value).strip() if subarea_cell.value else ""

        if subarea in KEEP_IN_L1:
            skipped_l1_keep += 1
            continue

        if subarea not in PROMOTE_TO_L2:
            # Subarea desconhecida — manter em L1, avisar
            print(f"  AVISO: subarea não mapeada '{subarea}' — mantendo em L1")
            skipped_l1_keep += 1
            continue

        # Promover: remover L1, garantir L2
        old_l1_val = l1_cell.value
        l1_cell.value = None
        if not l2_cell.value:
            l2_cell.value = old_l1_val  # preservar valor original do gate
        changed += 1

    print(f"\nResultado:")
    print(f"  N4s reclassificados (L1 → L2): {changed}")
    print(f"  N4s mantidos em L1 (Brewhouse/General): {skipped_l1_keep}")
    print(f"  N4s BP sem gate L1 (ignorados): {skipped_no_l1}")

    if changed > 0:
        wb.save(XLSX)
        print(f"\nArquivo salvo: {XLSX}")
    else:
        print("\nNenhuma alteração — arquivo não salvo.")


if __name__ == "__main__":
    main()
