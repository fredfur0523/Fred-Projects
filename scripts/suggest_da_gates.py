#!/usr/bin/env python3
"""
suggest_da_gates.py
===================
Preenche as colunas de gate (L1/L2/L3/L4) para as 58 linhas de Data Acquisition
que estão sem gate atribuído, com base na análise dos campos N1/N2/N3/N4.

Regras de nível aplicadas:
  L1 — Fundação digital: ingestão básica, leitura de sensores/equipamentos,
        padronização simples, storage local de curto prazo, triggers básicos.
  L2 — Connected Ops: transformações avançadas, delivery cloud/broker,
        monitoramento de disponibilidade, governance básica (guiar usuário),
        historian não-otimizado, cross-referência, triggers específicos.
  L3 — Intelligent Ops: governance de controle de acesso, historian otimizado/
        on-prem longo prazo, redundância, escalabilidade horizontal, aggregação
        multi-equipamento, código customizado, monitoramento de sistema, diagnósticos.
  L4 — Touchless Ops: chatbot integrado, operações totalmente autônomas.

Uso:
    cd /home/fredfur/projects/coverage-dashboard
    python3 scripts/suggest_da_gates.py

Nota: o script SOMENTE preenche células vazias — não sobrescreve gates já definidos.
"""

import openpyxl
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
XLSX = PROJECT_ROOT / "docs" / "OneMES Readiness Consolidated.xlsx"
SHEET = "Capabilities Readiness"

# Column indices (0-based): D=Domain(3), F=Subarea(5), I=N3(8), J=N4(9),
# M=L1(12), N=L2(13), O=L3(14), P=L4(15), Q=Status(16)
COL_DOMAIN = 3
COL_SUBAREA = 5
COL_N1 = 6
COL_N2 = 7
COL_N3 = 8
COL_N4 = 9
COL_L1, COL_L2, COL_L3, COL_L4 = 12, 13, 14, 15
COL_STATUS = 16


def suggest_gate(n1: str, n2: str, n3: str, n4: str, subarea: str) -> str:
    """
    Returns 'L1', 'L2', 'L3', or 'L4' based on the semantics of N1/N2/N3/N4.

    L1 — basic ingestion, reading, simple transforms, short-term local storage,
         simple triggers, basic standardization.
    L2 — cloud/broker delivery, advanced transforms, cross-reference std,
         availability monitoring, governance (guide user), basic historian,
         packaging/brewing PTS snapshots, continuous connection.
    L3 — governance (control/restrict), optimized historian, on-prem historian,
         redundancy, horizontal scale, custom code, multi-equipment aggregation,
         system monitoring & diagnostics, critical prioritization.
    L4 — chatbot, fully autonomous/AI-driven operations.
    """
    n1l, n2l, n3l, n4l = n1.lower(), n2.lower(), n3.lower(), n4.lower()

    # ── L4 signals ────────────────────────────────────────────────────────────
    if any(k in n4l or k in n3l for k in ['chatbot', 'autonomous', 'ai-driven', 'touchless']):
        return 'L4'

    # ── L3 signals ────────────────────────────────────────────────────────────
    l3_keywords = [
        'restrict', 'change request', 'approval flow', 'governance over user',
        'horizontal scale', 'redundancy', 'custom code', 'custon code',
        'multi-equipment', 'multiple equipment', 'prioritization of critical',
        'consistency check', 'diagnostics center', 'troubleshoot',
        'historical data visualization', 'request for historical data sample',
        'long-term time series storage on-prem', 'long-term time series storage on prem',
        'opc ua data source redundancy', 'on-prem infrastructure management',
        'new data format for historian', 'optimized for time series',
        'system monitoring',
    ]
    if any(k in n4l or k in n3l or k in n1l or k in n2l for k in l3_keywords):
        return 'L3'
    if 'historian' in n1l and any(k in n4l for k in ['optimized', 'on-prem', 'long-term']):
        return 'L3'
    if 'manage user actions' in n2l:
        return 'L3'

    # ── L2 signals ────────────────────────────────────────────────────────────
    l2_keywords = [
        'cloud', 'broker', 'pi data monitoring', 'custom function for data aggregation',
        'rules applicability configuration by asset', 'uptime monitoring',
        'data loss monitoring', 'schedule recurrence', 'snapshot',
        'pts portal integration', 'predefined rule', 'guide the user',
        'short-term time series storage',  # local broker delivery is L1; cloud = L2
        'delivery of on-prem data on cloud',
        'running process characteristics standardization',
        'rising/falling edge', 'rising edge', 'falling edge',
        'independent trigger condition',
        'calculation in mapping tags',
        'configuration wizard for pi',
        'multilingual',
        'packaging inspectors', 'without opc ua',
        'brewing batch system',
        'show automation tag quality',
        'laboratory and quality equipment',
        'faults and alarms data gathering based on integer',
        'packaging pts data gathering',
        'average of the instrument data',
        'historian', 'long-term',
    ]
    if any(k in n4l or k in n3l or k in n1l or k in n2l for k in l2_keywords):
        return 'L2'
    if 'uninterrupted connection' in n3l or 'uninterrupted connection' in n4l:
        return 'L2'
    if 'kpi' in n2l or 'kpi/pi' in n2l:
        return 'L2'
    if 'governance' in n1l and 'guide' in n2l:
        return 'L2'
    if 'internal quality' in n2l:
        return 'L2'
    if 'cross-reference' in n2l:
        return 'L2'
    if 'specific hour' in n3l or 'schedule' in n3l:
        return 'L2'

    # ── L1 default — foundational: ingestion, basic std, basic transform ──────
    return 'L1'


def main():
    if not XLSX.exists():
        print(f"Erro: arquivo não encontrado: {XLSX}")
        return

    print(f"Abrindo: {XLSX}")
    wb = openpyxl.load_workbook(XLSX)
    ws = wb[SHEET]

    gate_col_map = {'L1': COL_L1, 'L2': COL_L2, 'L3': COL_L3, 'L4': COL_L4}
    gate_col_letter = {'L1': 'M', 'L2': 'N', 'L3': 'O', 'L4': 'P'}

    filled = 0
    skipped = 0
    dist = {'L1': 0, 'L2': 0, 'L3': 0, 'L4': 0}

    print("\n{'Gate':<4} {'N4':<65} {'Status':<12}")
    print("-" * 85)

    for row in ws.iter_rows(min_row=2):
        domain_cell = row[COL_DOMAIN]
        if not domain_cell.value or str(domain_cell.value).strip() != 'Data Acquisition':
            continue

        l1v, l2v, l3v, l4v = row[COL_L1].value, row[COL_L2].value, row[COL_L3].value, row[COL_L4].value
        has_gate = any(v and str(v).strip() for v in [l1v, l2v, l3v, l4v])
        if has_gate:
            skipped += 1
            continue

        n1 = str(row[COL_N1].value or '')
        n2 = str(row[COL_N2].value or '')
        n3 = str(row[COL_N3].value or '')
        n4 = str(row[COL_N4].value or '')
        subarea = str(row[COL_SUBAREA].value or '')
        status = str(row[COL_STATUS].value or '')

        gate = suggest_gate(n1, n2, n3, n4, subarea)

        # Write 'x' into the suggested gate column
        row[gate_col_map[gate]].value = 'x'
        dist[gate] += 1
        filled += 1

        n4_display = n4[:64] if len(n4) <= 64 else n4[:61] + '...'
        print(f"  {gate}  {n4_display:<65} {status}")

    print(f"\n{'='*85}")
    print(f"Resultado:")
    print(f"  Linhas preenchidas: {filled}")
    print(f"  Já tinham gate (mantidas): {skipped}")
    print(f"  Distribuição sugerida: L1={dist['L1']}  L2={dist['L2']}  L3={dist['L3']}  L4={dist['L4']}")

    if filled > 0:
        wb.save(XLSX)
        print(f"\nArquivo salvo: {XLSX}")
        print("\nPróximo passo:")
        print("  1. Abra o Excel e cuide a aba 'Capabilities Readiness', filtrando Domain=Data Acquisition")
        print("  2. Revise cada sugestão de gate (colunas M/N/O/P)")
        print("  3. Após aprovação, rode:")
        print("     python3 scripts/generate_capability_detail.py")
        print("     cp scripts/output/capability_detail.ts client/src/capability_detail.ts")
        print("     npm run build")
    else:
        print("\nNenhuma alteração — arquivo não salvo.")


if __name__ == "__main__":
    main()
