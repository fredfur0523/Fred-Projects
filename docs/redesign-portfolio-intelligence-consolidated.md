# Portfolio Intelligence — Plano de Redesign Consolidado

**Produto:** Coverage Dashboard (React/TypeScript)
**Aba:** Portfolio Intelligence (PortfolioIntelligenceView, App.tsx ~L3878-4823)
**Data:** 2026-04-04
**Fontes:** PM Narrative + Designer Layout Spec + BA VPO Validation

---

## Sumario Executivo

O redesign transforma a aba Portfolio Intelligence de uma ferramenta tecnica (arvore de 5 niveis, dot matrix) em um **executive briefing de 60 segundos** para VPs de Zona. A mudanca central: eliminar sub-tabs, unificar num fluxo linear de 6 secoes com progressive disclosure, e adicionar KPIs headline + timeline de projecao que nao existem hoje.

### Decisoes Estruturais

| Decisao | Racional |
|---------|----------|
| **Eliminar sub-tabs** | VP nao navega entre "Deployment" e "Capacidades" — quer fluxo linear |
| **5 KPIs hero** no topo | Sem numeros grandes, nao ha resposta em 5s |
| **Capability tree 5→2 niveis** | Tree de Subarea→N4 vira tabela flat agrupada por Dominio+N2 |
| **Timeline de projecao** (novo) | VP precisa de narrativa temporal: "estou melhorando? quando chego?" |
| **Gantt de decommissioning** (novo) | Top-5 sem timeline nao responde "quando descomissiono tudo?" |
| **DRS score continuo** (0-100) | Boolean `decommReady` atual nao diferencia graus de prontidao |
| **Vocabulario VPO** | Renomear "Global Leading" → "Parity Achieved", "Decommissioning" → "Migration" |

---

## 1. Narrativa do VP (PM)

**Formato:** Situacao → Meta → Gap → Plano

> "Minha zona tem **X%** de paridade global. De 9 dominios, **Y** estao prontos e **Z** dependem de legados.
> A meta corporativa e **85% ate Q4/2027**. Faltam **N** capabilities em **K** dominios.
> No proximo trimestre, entram **+M** capabilities e decomissionamos **P** legados.
> Isso move a paridade de X% para Y%."

**Jornada de 4 passos (60 segundos total):**

| Passo | Tempo | Pergunta | Componente | Interacao |
|-------|-------|----------|------------|-----------|
| 1. "Como estou?" | 5s | Status geral | KPI Hero Strip | Leitura passiva |
| 2. "Onde estou bem/mal?" | 15s | Quais dominios | Domain Heatmap | Hover/click filtra |
| 3. "O que falta e quando?" | 30s | Timeline | Parity Timeline | Hover por trimestre |
| 4. "O que levo p/ reuniao?" | 10s | Export | Export Strip | Click gera PDF/CSV |

---

## 2. Metricas Headline (5 KPIs)

| # | KPI | Formula | Dados | Target | Cor |
|---|-----|---------|-------|--------|-----|
| 1 | **Global Parity Index (GPI)** | 0.50×(N4_READY/N4_Total) + 0.30×(Sites_G/(Sites_G+Sites_L)) + 0.20×min(AvgScore/2.0, 1.0) | capabilities + SITE_DOMAIN_TYPE + CSV_DATA | 85% Q4/2027 | Verde≥70%, Amarelo 45-69%, Vermelho<45% |
| 2 | **Domain Readiness** | Dominios com Parity% > 70% / 9 → "X of 9" | capabilities agrupado por domain_code | 9/9 | Verde≥7, Amarelo 4-6, Vermelho≤3 |
| 3 | **Legacy Exposure** | Legados ativos sem data de migration planejada | LOCAL_SYSTEMS × planned_year | 0 | Verde=0, Amarelo 1-3, Vermelho>3 |
| 4 | **Decom Velocity** | — (requer baseline historico) | N/A | Crescente QoQ | Exibir "--" com nota |
| 5 | **Next Quarter Delta** | N4s que viram READY no proximo Q (planned_quarter match) | capabilities filtrado | Conforme roadmap | Contagem absoluta |

> **BA Alert:** Decom Velocity nao tem dados. Exibir com "--" e "Requer baseline historico" — forca o VP a pedir o dado.

---

## 3. Layout Visual — 6 Secoes (Designer)

### Arquitetura: Fluxo unico, sem sub-tabs

```
+===========================================================================+
| PORTFOLIO INTELLIGENCE                                    [Export ▼]      |
| Paridade global e prontidao para migracao                                |
+===========================================================================+
|                                                                           |
|  ZONA:  [*AFR*] [ SAZ ] [ MAZ ] [ NAZ ] [ EUR ] [ APAC ]               |
|          (32)    (41)    (28)    (22)    (19)    (21)                    |
+---------------------------------------------------------------------------+

  A. KPI Hero Strip          ← 5 cards, above the fold
  B. Domain Readiness Heatmap ← 9 colunas, click filtra secoes abaixo
  C. Parity Timeline          ← SVG area chart trimestral, meta 85%
  D. Gap Detail Table         ← tabela flat (tree colapsada em 2 niveis)
  E. Decom Roadmap            ← Gantt SVG + cards detalhados
  F. Export Strip             ← PDF 1pg / CSV / Copy KPIs
```

### A. KPI Hero Strip
```
+-----------+  +-----------+  +-----------+  +-----------+  +-----------+
|  ##.#%    |  |  # de 9   |  |    ##     |  |    --     |  |   +##     |
| Global    |  | Dominios  |  | Legados   |  | Decom     |  | Prox.    |
| Parity    |  | Prontos   |  | Expostos  |  | Velocity  |  | Trim.    |
| Index     |  |           |  |           |  |           |  | Delta    |
| [===--]   |  | [OOOOO--] |  |           |  | --        |  | N4s      |
| meta: 85% |  | meta: 9/9 |  | sem plano |  | s/ dados  |  | ativando |
+-----------+  +-----------+  +-----------+  +-----------+  +-----------+
```
- `grid-cols-5 gap-4`, min-h: 120px
- Metrica: `text-4xl font-black tabular-nums`
- Border-top: 3px na cor semantica

### B. Domain Readiness Heatmap
```
+-------+-------+-------+-------+-------+-------+-------+-------+-----+
|  BP   |  PP   |  QL   |  MT   |  MG   |  SF   |  DA   | MDM  |  UT |
| 78%   | 45%   | 82%   | 61%   | 34%   | 71%   | 89%   | 52%  | --  |
| PARITY| TRANS | PARITY| TRANS | LEGCY | TRANS | PARITY| TRANS | GAP |
+-------+-------+-------+-------+-------+-------+-------+-------+-----+
  Toggle: [Zona selecionada] / [Todas as zonas]
```
- `grid-cols-9 gap-2`, min-h: 100px
- Cor: ≥70% verde, 45-69% ambar, <45% vermelho (thresholds ajustados por BA)
- Click → filtra secoes D e E
- Toggle cross-zone: expande para matrix 6×9

### C. Parity Timeline (SVG inline)
```
100%|
    |                                              ............META 85%
 80%|                                    ___-------
    |                           ___-----/
 60%|                  ___-----/
    |         ___-----/  +4     +7     +12    +8
 40%| ___----/
    |/  32.8%
 20%|
    |     x       x       x                     (x = decom events)
  0%+----+-------+-------+-------+-------+-------+-------+---->
    Q1/26  Q2/26  Q3/26  Q4/26  Q1/27  Q2/27  Q3/27  Q4/27
```
- SVG 800×240, viewBox responsivo
- Area fill: `rgba(16,185,129,0.15)`, stroke: `#10b981`
- Projecao: dashed `stroke-dasharray: 6,4`
- Meta 85%: `#f59e0b` dashed

> **BA Alert — Teto de projecao:** Com roadmap atual, maximo atingivel e **~78.5%** (1318/1679 N4s). 392 N4s (23.3%) nao tem previsao. A timeline DEVE mostrar esse teto como plateau, nao extrapolar para 100%.

### D. Gap Detail Table (substitui Capability Tree)
```
Dominio | Capacidade (N2)  | Produto Global | Status    | Previsto | Legacy
--------+------------------+----------------+-----------+----------+--------
BP      | Recipe Mgmt      | Omnia OM       | ✓ READY   | --       | Traks.
PP      | Line Performance | Omnia LMS      | ✗ Gap     | --       | Suite
QL      | Lab Integration  | Omnia IQ       | ◐ Q4/2026 | Q4/2026  | LIMS
```
- 5 niveis (Subarea→N4) colapsados em 2 (Dominio + N2)
- Click na row expande N4s individuais inline
- Paginacao: 30/page, filtros: Status, Dominio, Trimestre
- Badge especial: **"⚠ Overdue"** para 144 N4s com planned_year < 2026

### E. Decommissioning Roadmap (Gantt + Cards)
```
Q2/26  Q3/26  Q4/26  Q1/27  Q2/27  Q3/27  Q4/27
---|------|------|------|------|------|------|----
[==Traksys (BP, PP)===>X]
          [=====Suite 360 (QL, MT)=========>X]
                 [===Local LIMS (QL)=======>?]     (? = sem data)

+-- Traksys ------------------------------------------------+
| Dominios: BP, PP  |  Sites Legacy: 12  |  DRS: 67/100     |
| Substituto: Omnia LMS + Omnia OM                          |
| Bloqueios: 4 N4s em Gap (sem previsao)                    |
| [Ver capabilities faltantes]                               |
+------------------------------------------------------------+
```
- DRS (Decommissioning Readiness Score) substitui boolean:
  - ≥80: "Pronto para Migration Conversation" (verde)
  - 50-79: "Em Transicao" (amarelo)
  - 30-49: "Gap significativo" (laranja)
  - <30: "Dependencia critica" (vermelho)

**Formula DRS:**
```
DRS = 0.40 × Capability_Coverage_Pct
    + 0.25 × Site_Deployment_Pct
    + 0.20 × Score_Parity_Factor
    + 0.15 × Timeline_Urgency
```

### F. Export Strip
```
[Exportar Resumo Executivo (1pg PDF)] [Gap Report (CSV)] [Copiar KPIs]
```

---

## 4. Validacao Operacional (BA VPO)

### 4.1 Achados Criticos nos Dados

| # | Achado | Impacto | Acao |
|---|--------|---------|------|
| 1 | **UT tem ZERO N4s** no catalogo | Dominio inteiro sem roadmap | Sinalizar como gap critico na UI |
| 2 | **144 N4s com previsao vencida** (2024-2025) | 8.5% do total pode estar atrasado | Badge "Overdue" na Gap Table |
| 3 | **392 N4s sem previsao** | Teto de readiness = 78.5%, nao 100% | Mostrar plateau na timeline |
| 4 | **Todos L-levels = `confirmed: false`** | Calculo de paridade pode ser otimista | Badge "nao confirmado" |
| 5 | **NAZ e SAZ sem LOCAL_SYSTEMS** | VP ve "Legacy" sem saber qual sistema | Badge "dados pendentes" na zona |
| 6 | **Threshold 70% para Leading e baixo** | VP acha que tem paridade quando nao tem | Subir para 80% |
| 7 | **nNeither excluido de covPct** | Inflaciona coverage | Separar Deployment Rate vs Coverage |

### 4.2 Vocabulario VPO (renomear na UI)

| Termo atual | Termo VPO correto | Motivo |
|-------------|-------------------|--------|
| Global Leading | **Parity Achieved** | "Leading" implica competicao |
| Approaching | **Transition Phase** | Indica acao em curso |
| Legacy Dominant | **Legacy Dependent** | "Dependent" indica risco |
| Decommissioning | **Migration Readiness** | VPO fala em "migracao" |
| Absent | **Gap** | Ja usado no VPO Assessment |

### 4.3 Modelo Mental do VP

- **Navega por dominio** (Brewing, Quality, Packaging) — alinhado com VPO Pillars
- **Decide por sistema** ("quando desligo o Traksys?") — precisa de visao por legado
- **Compara com**: target corporativo (85%) > melhor zona > media global
- **Contexto**: VPO Forum (2x/ano, estrategico) e Monthly Business Review (MCRS, tatico)

### 4.4 Acoes do VP apos ver o dashboard

| Acao | Dado usado | Next step sugerido |
|------|-----------|-------------------|
| Priorizar deployment | Heatmap + Deployment Rate | "Abrir iniciativa 1YP: Rollout [produto] em [zona]" |
| Iniciar migration conversation | DRS ≥ 80 + lista sites Legacy | "Agendar Migration Review com Plant Manager" |
| Escalar gap de roadmap | Dominio com zero N4s (UT) | "Registrar no Strategic Action Log" |
| Ajustar targets | GPI vs target + curva | "Incluir GPI no TSC do proximo ciclo" |
| Benchmarking | Cross-zone heatmap | "Capturar Good Practice da zona lider" |

---

## 5. O Que Manter / Redesenhar / Remover

| Elemento | Decisao | Destino |
|----------|---------|---------|
| Zone selector (6 botoes) | **MANTER** | Topo, acima dos KPIs |
| Parity filter pills (4 estados) | **REMOVER** | Substituido por heatmap clickavel |
| Domain cards com barras por zona | **REMOVER** | Info migra para heatmap + gap table |
| Cross-zone dot matrix | **REMOVER** | Substituido por heatmap toggle cross-zone |
| Capability tree 5 niveis | **REMOVER** | Substituido por Gap Detail Table flat |
| Top-5 decommissioning | **REDESENHAR** | Vira Gantt + cards completos |
| Decom readiness cards (% substituibilidade) | **REDESENHAR** | Integrado no Roadmap com DRS score |
| `computePortfolioMatrix()` | **REUTILIZAR** | Alimenta heatmap + KPIs |
| `decommCandidates` useMemo | **REUTILIZAR** | Alimenta Roadmap expandido |
| `capTree` useMemo | **REUTILIZAR** | Flatten para Gap Table |
| `statusColors` object | **REUTILIZAR** | Paleta base (com rename VPO) |

---

## 6. Paleta de Cores e Semantica

### Status de Paridade
| Status | Light: bg / text | Dark: bg / text | CSS var |
|--------|-----------------|-----------------|---------|
| Parity Achieved | `#ecfdf5` / `#10b981` | `rgba(16,185,129,0.12)` / `#34d399` | `--status-parity` |
| Transition Phase | `#fffbeb` / `#f59e0b` | `rgba(245,158,11,0.12)` / `#fbbf24` | `--status-transition` |
| Legacy Dependent | `#fef2f2` / `#ef4444` | `rgba(239,68,68,0.12)` / `#f87171` | `--status-legacy` |
| Gap | `#f9fafb` / `#6b7280` | `rgba(107,114,128,0.12)` / `#9ca3af` | `--status-gap` |

### Status de Capability
| Status | Badge |
|--------|-------|
| READY | `bg-emerald-100 text-emerald-700` |
| Planejado (com Q) | `bg-amber-100 text-amber-700` |
| Gap (sem previsao) | `bg-red-100 text-red-700` |
| Overdue (planned < 2026) | `bg-red-100 text-red-700` + icone ⚠ |

### Urgencia Visual (3 canais simultaneos)
1. **Cor de fundo** do card/celula (gradiente suave)
2. **Cor do texto** numerico (forte, contrastante)
3. **Border-left/top** 3-4px solid na cor primaria

---

## 7. Prioridade de Implementacao

### Sprint 1 — Hero Metrics + Heatmap (maior impacto visual)
| Item | SP est. | Descricao |
|------|---------|-----------|
| KPI Hero Strip (Secao A) | 8 | 5 cards com GPI, Domain Readiness, Legacy Exposure, Decom Velocity (--), Next Q Delta |
| Domain Heatmap (Secao B) | 5 | Grid 9 dominios, click filtra, toggle cross-zone |
| Remover sub-tabs | 2 | Unificar em fluxo unico |
| Renomear vocabulario VPO | 1 | Global Leading → Parity Achieved, etc. |
| Helper: `computeGPI()` | 3 | Formula composta GPI |
| **Total Sprint 1** | **19** | |

### Sprint 2 — Timeline + Gap Table (narrativa temporal)
| Item | SP est. | Descricao |
|------|---------|-----------|
| Parity Timeline SVG (Secao C) | 13 | Area chart, projecao, markers de decom, meta 85%, plateau warning |
| Gap Detail Table (Secao D) | 8 | Flatten tree, paginacao, filtros, expand inline N4s |
| Helper: `computeParityByQuarter()` | 5 | Projecao trimestral com dados planned_year/quarter |
| Helper: `flattenCapTreeToN2()` | 3 | Transforma tree em tabela flat |
| Badge "Overdue" para 144 N4s | 2 | Sinalizar planned < 2026 AND NOT READY |
| Sinalizar UT como gap critico | 1 | Nota no heatmap + alert |
| **Total Sprint 2** | **32** | |

### Sprint 3 — Decom Roadmap + Export (plano de acao)
| Item | SP est. | Descricao |
|------|---------|-----------|
| Decom Roadmap Gantt SVG (Secao E) | 13 | Barras horizontais por legado, timeline alinhada com Secao C |
| DRS Score continuo (0-100) | 5 | Substituir boolean decommReady, formula 4 fatores |
| Decom Cards detalhados | 5 | Dominios, sites, DRS, bloqueios, link p/ Gap Table |
| Export Strip (Secao F) | 8 | PDF 1pg executivo + CSV gap + copy KPIs |
| Ajustar thresholds (80%/45%) | 2 | Global Leading ≥ 80%, Approaching ≥ 45% |
| **Total Sprint 3** | **33** | |

---

## 8. Roadmap Visual

```
Sprint 1 (19 SP)              Sprint 2 (32 SP)              Sprint 3 (33 SP)
"VP ve status em 5s"          "VP entende timeline"          "VP planeja acoes"

┌─────────────────────┐       ┌─────────────────────┐       ┌─────────────────────┐
│ KPI Hero Strip (A)  │──────▶│ Parity Timeline (C) │──────▶│ Decom Roadmap (E)   │
│ Domain Heatmap (B)  │       │ Gap Detail Table (D) │      │ DRS Score           │
│ Remove sub-tabs     │       │ Overdue badges       │      │ Export Strip (F)    │
│ VPO vocabulary      │       │ UT gap alert         │      │ Threshold adjust    │
│ computeGPI()        │       │ computeParityByQ()   │      │                     │
│                     │       │ flattenCapTreeToN2() │      │                     │
└─────────────────────┘       └─────────────────────┘       └─────────────────────┘
        │                              │                              │
        ▼                              ▼                              ▼
  VP responde:              VP responde:                VP responde:
  "Estou em 32% de          "Chego em 78% ate          "Traksys tem DRS 67,
   paridade, 3 de 9          2030, preciso de            posso migrar em Q3.
   dominios prontos"         roadmap para 392 N4s"       QL e PP sao bloqueio."
```

---

## 9. Consideracoes de Implementacao

### Restricoes
- **Componente unico**: Todo codigo em App.tsx. PortfolioIntelligenceView e funcao isolada (~950 linhas) — redesign substitui JSX interno
- **Sem lib de charts**: Timeline e Gantt sao SVG inline (precedente: sparklines, scatter plot ja existem)
- **Dados no frontend**: Tudo ja carregado. Nenhuma chamada backend nova
- **Target**: 1920px desktop (projetor de sala de reunioes)

### Reutilizacao de logica existente
| Funcao | Linha aprox. | Reutilizar para |
|--------|-------------|-----------------|
| `computePortfolioMatrix()` | ~3823 | Heatmap + KPIs |
| `decommCandidates` useMemo | ~4021 | Roadmap Gantt |
| `capTree` useMemo | ~4083 | Flatten para Gap Table |
| `decommReadiness` useMemo | ~4109 | DRS score |
| `statusColors` | ~3920 | Paleta (com rename) |
| `fmtScore`, `fmtPct` | ~4004 | Formatadores |

### Novos helpers necessarios
| Helper | Input | Output |
|--------|-------|--------|
| `computeGPI(capData, zone, siteData)` | capabilities + SITE_DOMAIN_TYPE + CSV_DATA | numero 0-100 |
| `computeParityByQuarter(capData, zone)` | capabilities filtrado | `{quarter, pct, newCaps, decomEvents}[]` |
| `flattenCapTreeToN2(capTree)` | tree hierarquica | array flat agrupado por N2 |
| `computeDRS(zone, domain, capData, siteData)` | multiplos | numero 0-100 |

### Performance
- Gap Table: paginacao 30/page (1679 N4s nao renderizam de vez)
- Timeline SVG: useMemo por zone/capData
- Heatmap cross-zone: 54 celulas — trivial
- Flatten tree: one-time no useMemo

---

## 10. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|--------------|---------|-----------|
| Projecao temporal imprecisa (planned_year e estimativa) | Alta | VP toma decisao em dado incorreto | Disclaimer "Previsao de roadmap — sujeita a revisao" |
| UT sem N4s gera confusion | Alta | VP nao entende por que dominio esta vazio | Alert explicito + nota na heatmap cell |
| Decom Velocity sem dados | Certa | KPI card vazio | Exibir "--" com CTA "Requer baseline" |
| L-levels nao confirmados | Alta | GPI pode ser otimista | Badge "nao confirmado" no tooltip |
| NAZ/SAZ sem LOCAL_SYSTEMS | Certa | VP nao sabe qual legado | Badge "dados pendentes" no zone selector |
| Export PDF sem lib | Media | Complexidade de implementacao | Avaliar html2canvas ou print CSS |

---

## Documentos de Referencia

- [PM Narrative](./redesign-pm-narrative.md) — narrativa completa, jornada de 4 passos, exportabilidade
- [Designer Layout Spec](./redesign-designer-layout.md) — wireframes ASCII, tokens, acessibilidade, estados, checklist
- [BA VPO Validation](./redesign-ba-validation.md) — modelo mental VP, DRS formula, gaps de dados, impactos VPO, numeros-chave

---

*Consolidado em 2026-04-04 pelo Orquestrador — Dev Crew AB InBev*
