# Portfolio Intelligence — Plano de Redesign Consolidado

**Data:** 2026-04-04
**Autores:** PM + Designer + BA Manufacturing (Dev Crew)
**Componente:** `PortfolioIntelligenceView` (App.tsx linhas 3878–4823, 946 linhas)
**Público:** VP de Zona, C-Level, Global Directors

---

## Premissas Assumidas

1. Componente único App.tsx — refactor para subcomponentes é permitido mas dentro do mesmo build
2. Sem backend — dados vêm dos JSONs já carregados (portfolio_capabilities.json, product-coverage-2026.json, CSV_DATA, SITE_DOMAIN_TYPE)
3. Celebration DS é o design system oficial (tokens, componentes, padrões)
4. Dark mode já suportado — manter dual-theme
5. i18n já existe — novas keys serão adicionadas ao objeto TRANSLATIONS
6. Cálculos de `domainData`, `decommReadiness`, `capTree` já existem no código

---

## 1. DIAGNÓSTICO — Por que é "pouco gerencial"

### 1.1 Violações de Nielsen identificadas no código

| Heurística | Evidência | Impacto no VP |
|---|---|---|
| **H2 — Match com mundo real** | Terminologia técnica exposta: "N1", "N2", "N3", "N4", "Subarea", "domain_code" | VP não pensa em níveis de hierarquia de capability |
| **H3 — Controle e liberdade** | 2 sub-tabs rígidas sem fluxo narrativo | VP forçado a navegar entre abas para montar a resposta |
| **H6 — Reconhecimento vs memória** | Árvore 5 níveis com 1679 items | VP perde contexto ao navegar, precisa memorizar posição |
| **H7 — Flexibilidade** | Sem métricas-headline (scorecards) | VP precisa somar mentalmente — não há executive summary |
| **H8 — Design minimalista** | Cards mostram TUDO: produtos globais, barras, legados, níveis, ações | Overload cognitivo: 9 domain cards × 6 zonas |
| **H1 — Visibilidade do status** | Status de paridade como pills dentro de cards densos | Dificulta scanning rápido |

### 1.2 Diagnóstico do BA Manufacturing

> "A árvore N4 é uma interface de engenharia de produto apresentada para stakeholders executivos. É como entregar uma BOM para quem quer saber 'o carro está pronto?'"

**Problema central:** A tela responde "o que temos tecnicamente?" quando o VP pergunta "estou coberto?". Falta a camada de tradução entre taxonomia técnica e linguagem gerencial.

---

## 2. MODELO MENTAL DO VP — Como ele pensa

### 2.1 Taxonomia de navegação (BA Manufacturing)

O VP pensa em **domínios funcionais**, NÃO em sistemas:

```
Camada 1 (default):  Domínios VPO — Brewing, Packaging, Quality, Maintenance, Energy, Safety, Management
Camada 2 (drill):    Capabilities agrupadas (ex: Packaging → OEE, GLY, Inspection, Coding)
Camada 3 (detalhe):  Produto global específico + status por site ← VP NUNCA deveria chegar aqui
```

### 2.2 Os 5 estados de transição Legacy → Global

| Estado | Definição | Cor | Ação do VP |
|---|---|---|---|
| **GLOBAL DEPLOYED** | Produto READY + site usando | 🟢 Verde | Nenhuma — manter |
| **IN DEPLOYMENT** | Produto READY + deploy em andamento | 🔵 Azul | Monitorar cronograma |
| **READY TO DEPLOY** | Produto READY + zona não iniciou | 🟡 Amarelo | **Decisão do VP:** priorizar e alocar budget |
| **ON ROADMAP** | Produto NOT READY + planned date definido | ⚪ Cinza | Aguardar Global; preparar pré-requisitos |
| **GAP — NO GLOBAL** | Capability sem produto global planejado | 🔴 Vermelho | **Escalar para Global Technology Director** |

> **Insight crítico do BA:** A distinção entre "Ready to Deploy" (culpa minha) e "On Roadmap" (culpa do Global) é o que torna o dashboard **acionável**. Sem essa separação, o VP não sabe a quem cobrar.

### 2.3 Fluxo de decisão real do VP

```
VP vê gap de 40% em Quality
         │
    ┌────┴────────────────────────┐
    ▼                             ▼
READY TO DEPLOY               GAP REAL (sem produto global)
(produto existe,              (não existe alternativa)
 zona não deployou)
    │                             │
    ▼                             ▼
VP cobra ZTE/IT Director:     VP escala para Global:
"Por que não deployamos?"     "Quality tem X capabilities
    │                          sem produto. Qual roadmap?"
    ▼                             │
ZTE apresenta plano           Global responde:
com timeline e budget         - "Roadmap Q3" ou
    │                         - "Não planejado, aceite local"
    ▼
VP arbitra prioridade entre
domínios no CAPEX da zona
(Packaging vs Quality vs
Maintenance)
    │
    ▼
Decisão entra no 1YP/3YP
como projeto digital
```

---

## 3. NARRATIVA DO PM — "A história em 1 página"

### Estrutura: Situação → Meta → Gap → Plano

**Situação Atual:**
"Minha zona tem **X%** de paridade com o portfolio global. De 9 domínios, **Y** estão prontos, **Z** em transição e **W** dependem de legados."

**Meta:**
"Até Q4/2027, a meta é **85% de paridade**. Preciso mover de X% para 85%, habilitando **N capabilities** nos próximos 6 trimestres."

**Gap:**
"Faltam **N capabilities** em **K domínios**. Os 3 maiores gaps: [A], [B], [C]. Tenho **M legados**, dos quais **P** têm decomm planejado e **Q** não têm plano."

**Plano:**
"No próximo trimestre, entram **N capabilities** via [produto global]. Decomissionamos [sistema X] em [N sites]. Paridade move de X% para **Y%**."

---

## 4. MÉTRICAS HEADLINE — 5 KPIs

| # | Nome Executivo | Fórmula | Fonte | Target |
|---|---|---|---|---|
| 1 | **Global Parity Index** | N4 READY na zona / Total N4 no portfolio × 100 | portfolio_capabilities.json | 85% Q4/2027 |
| 2 | **Domain Readiness** | Domínios com Parity > 70% / 9 — formato "5 of 9" | portfolio_capabilities.json | 9/9 |
| 3 | **Legacy Exposure** | Sistemas legados ativos sem data de decomm | LOCAL_SYSTEMS + planned_year | 0 |
| 4 | **Decomm Velocity** | Legados decomissionados últimos 2Q / Total legados | LOCAL_SYSTEMS + histórico | Crescente QoQ |
| 5 | **Next Quarter Delta** | N4s que mudam NOT READY → READY no próximo quarter | portfolio_capabilities.json | Per roadmap |

**Cores:** 🟢 No target ou acima · 🟡 60-79% do target · 🔴 < 60% do target

---

## 5. DESIGN — Layout e Wireframes

### 5.1 Jornada do VP (7 passos, 60 segundos)

| Passo | Tempo | Pergunta Mental | Emoção | Componente |
|---|---|---|---|---|
| 1 | 5s | "Me dá o resumo" | Impaciente | Hero Scorecards |
| 2 | 5s | "68% global... e por domínio?" | Orientado | Heatmap scan |
| 3 | 5s | "MAZ tá 52%, por quê?" | Curioso | Heatmap click |
| 4 | 10s | "Quality vermelho, quando fecha?" | Preocupado | Drawer → Timeline |
| 5 | 5s | "Q3 2026 pra Quality, ok. E legados?" | Pragmático | Drawer → Decomm |
| 6 | 5s | "Athena 82%, quase..." | Decisor | Decomm cards |
| 7 | opcional | "Quais 8 N4s faltam?" | Analista | Drawer → N4 accordion |

### 5.2 Wireframe — Página Principal

```
+================================================================================+
| [Logo]  Portfolio Intelligence                    | [Zona: SAZ ▾] [⚙] [🔲]   |
+================================================================================+
|                                                                                |
|  PORTFOLIO INTELLIGENCE                                                        |
|  Visão consolidada de cobertura e prontidão para descomissionamento             |
|                                                                                |
|  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        |
|  │ COBERTURA│  │ SISTEMAS │  │ PARIDADE │  │ DECOMM   │  │ CAPABIL. │        |
|  │ GLOBAL   │  │ LEGACY   │  │ ESTIMADA │  │ READY    │  │ GAP      │        |
|  │          │  │          │  │          │  │          │  │          │        |
|  │   68%    │  │   47     │  │ Q3 2026  │  │  5 / 9   │  │  312     │        |
|  │ +3pp MoM │  │ sistemas │  │full parity│ │domínios  │  │ N4s NOT  │        |
|  │ [=====]  │  │ ativos   │  │          │  │prontos   │  │ READY    │        |
|  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘        |
|                                                                                |
|  MAPA DE COBERTURA — Zona × Domínio                           [Exportar ▾]    |
|  ┌──────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐              |
|  │      │ BP  │ DA  │ UT  │ MT  │ MG  │ MDM │ PP  │ QL  │ SF  │              |
|  ├──────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤              |
|  │ AFR  │ 89% │ 72% │ 65% │ 91% │ 45% │ 80% │ 55% │ 38% │ 70% │              |
|  │ SAZ  │ 75% │ 68% │ 72% │ 85% │ 52% │ 78% │ 62% │ 71% │ 65% │              |
|  │ MAZ  │ 62% │ 55% │ 48% │ 70% │ 38% │ 65% │ 45% │ 52% │ 58% │              |
|  │ NAZ  │ 80% │ 75% │ 70% │ 88% │ 60% │ 82% │ 58% │ 65% │ 72% │              |
|  │ EUR  │ 85% │ 70% │ 68% │ 90% │ 55% │ 85% │ 60% │ 68% │ 75% │              |
|  │ APAC │ 70% │ 62% │ 58% │ 78% │ 42% │ 72% │ 50% │ 55% │ 62% │              |
|  └──────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘              |
|  Legenda: [===] Global Leading  [///] Aprox.  [XXX] Legacy Dom.  [   ] Ausente |
|                                                                                |
|  ──────────────────────── below the fold ──────────────────────────            |
|                                                                                |
|  TIMELINE DE PARIDADE — Quando cada domínio atinge >= 80%                      |
|  ┌────────────────────────────────────────────────────────────┐                |
|  │         Q1 26  Q2 26  Q3 26  Q4 26  Q1 27  Q2 27         │                |
|  │  BP    [======|==========]                                 │                |
|  │  DA    [======|===============]                             │                |
|  │  UT    [======|==============================]              │                |
|  │  MT    [======|====]                                        │                |
|  │  MG    [======|==================]                          │                |
|  │  PP    [======|==============================|=======]      │                |
|  │  QL    [======|==================]                          │                |
|  │  SF    [======|========]                                    │                |
|  │         ^hoje                                               │                |
|  └────────────────────────────────────────────────────────────┘                |
|  Filtro: [Todas as zonas ▾]   [Todos os domínios ▾]                            |
|                                                                                |
|  PRONTIDÃO PARA DESCOMISSIONAMENTO                                             |
|  ┌─────────────────────────────┬─────────────────────────────┐                |
|  │ #1 Athena (SAZ)             │ #2 SIGMA (EUR)              │                |
|  │ Domínio: Quality            │ Domínio: Quality            │                |
|  │ [============        ] 82%  │ [==========          ] 76%  │                |
|  │ Gap: 8 N4s                  │ Gap: 14 N4s                 │                |
|  │ Paridade: Q4 2026           │ Paridade: Q1 2027           │                |
|  │ Impacto: 12 sites           │ Impacto: 8 sites            │                |
|  │ 🟡 EM CAMINHO               │ 🟡 EM CAMINHO               │                |
|  │ [Ver detalhes]              │ [Ver detalhes]              │                |
|  ├─────────────────────────────┼─────────────────────────────┤                |
|  │ #3 IMS (NAZ)               │ #4 BPA (NAZ)                │                |
|  │ ...                         │ ...                          │                |
|  └─────────────────────────────┴─────────────────────────────┘                |
+================================================================================+
```

### 5.3 Wireframe — Drawer de Detalhe (click em célula do heatmap)

```
+================================================================================+
|                                                                                |
|  MAPA DE COBERTURA (heatmap com célula AFR/QL selecionada)                     |
|                                                                                |
|     ┌───── DRAWER (slide from right, 480px) ──────────────────────┐            |
|     │  AFR / Quality                               [X fechar]     │            |
|     │                                                              │            |
|     │  Cobertura Global          Sistemas Legacy Ativos            │            |
|     │  [=======     ] 38%        LIMS Africa (14 sites)            │            |
|     │                             QCNet (6 sites)                   │            |
|     │  Status: Legacy Dominante                                    │            |
|     │                                                              │            |
|     │  CAPABILITIES RESUMO                                         │            |
|     │  ┌───────┬────────┬─────────┬──────────┐                    │            |
|     │  │ Total │ READY  │ Planej. │ Sem prev │                    │            |
|     │  │  47   │  18    │   22    │    7     │                    │            |
|     │  └───────┴────────┴─────────┴──────────┘                    │            |
|     │                                                              │            |
|     │  TIMELINE DE FECHAMENTO                                      │            |
|     │  Q2 26: +8 capabilities  (total 26/47)                      │            |
|     │  Q3 26: +11 capabilities (total 37/47)                      │            |
|     │  Q4 26: +3 capabilities  (total 40/47)                      │            |
|     │  ⚠ Sem previsão: 7 capabilities                             │            |
|     │                                                              │            |
|     │  LEGADOS IMPACTADOS                                          │            |
|     │  ┌──────────────┬───────┬─────────┬──────────┐              │            |
|     │  │ Sistema      │ Sites │ Cobert. │ Paridade │              │            |
|     │  ├──────────────┼───────┼─────────┼──────────┤              │            |
|     │  │ LIMS Africa  │  14   │   34%   │ Q1 2027  │              │            |
|     │  │ QCNet        │   6   │   45%   │ Q3 2026  │              │            |
|     │  └──────────────┴───────┴─────────┴──────────┘              │            |
|     │                                                              │            |
|     │  [▸ Expandir árvore N4 completa]  ← accordion colapsado     │            |
|     │                                                              │            |
|     │  (quando expandido: árvore N4 filtrada APENAS AFR + QL)     │            |
|     │  (~47 items, não 1679)                                       │            |
|     └──────────────────────────────────────────────────────────────┘            |
+================================================================================+
```

### 5.4 Progressive Disclosure — 4 Níveis

| Nível | Audiência | Tempo | O que vê | Interação |
|---|---|---|---|---|
| **N0 — Hero** | VP, C-Level | 5s | 5 scorecards agregados | Scan passivo |
| **N1 — Heatmap** | VP, C-Level | 10s | Matriz 6×9 colorida | Hover tooltip, click drill |
| **N2 — Drawer** | VP, Director | 15s | Resumo zona×domínio + timeline + decomm | Scroll no drawer |
| **N3 — N4 Tree** | Director, PO | Variável | Árvore filtrada (~30-80 items) | Accordion expand |

**Mecanismo técnico:**
- N0 + N1: renderizados na página (above the fold, sempre visíveis)
- N2: Drawer slide-in direita, triggered por click no heatmap
- N3: Accordion DENTRO do drawer, colapsado por default

---

## 6. ARMADILHAS DE DADOS — O que pode dar errado

| # | Armadilha | Risco | Solução |
|---|---|---|---|
| 1 | **READY ≠ DEPLOYED** | Zona aparece 80% "coberta" porque Global desenvolveu, mas zona não deployou | KPI principal = % DEPLOYED, não % READY. Separar claramente |
| 2 | **DEPLOYED ≠ ADOPTED** | Sistema instalado mas ninguém usa | Se possível, cruzar com usage data. Flag sites >6 meses sem dados no lake |
| 3 | **Capabilities sem peso** | "Push notification" e "SPC online" contam igual como 1 capability | Mostrar % ponderado por criticality (Critical/Important/Nice-to-have) |
| 4 | **Tier distorce média** | Sites L0/L1 puxam cobertura para baixo mas VP talvez não queira cobrir | Filtro por tier. Coverage ponderada por volume de produção |
| 5 | **Cross-domain deps** | Packaging 90% deployed mas Maintenance 30% → OEE automático não funciona | Alertar quando capability deployed depende de outra não deployed |
| 6 | **Legacy não é binário** | Muitos sites operam híbrido (global + legado + interfaces manuais) | Estado "HYBRID" para sites em transição. Red flag se >6 meses |

---

## 7. O QUE MANTER / REDESENHAR / REMOVER

### MANTER (código existente reutilizável)

| Elemento | Linhas | Por que manter |
|---|---|---|
| `domainData` useMemo | 3929-3975 | Cálculo de parity status por domínio — base do heatmap |
| `crossZone` useMemo | 3976-4020 | Matriz zona×domínio — dados diretos para heatmap |
| `decommCandidates` useMemo | 4021-4071 | Top candidatos a decomm — dados para ranking cards |
| `capTree` useMemo | 4083-4098 | Árvore hierárquica — vai para dentro do Drawer |
| `decommReadiness` useMemo | 4109-4127 | Readiness por legacy product — dados para decomm cards |
| Cores de zona/status | 836-843, 3920-3925 | Padrão visual consistente |
| Dark mode support | Vários | Já funciona, manter |
| Loading/error states | 4137-4193 | Handling existente, adaptar para novo layout |

### REDESENHAR

| Elemento | Mudança |
|---|---|
| Sub-tab "Deployment" (4475-4819) | → Heatmap 6×9 + Decomm ranking cards |
| Sub-tab "Capabilities" (4218-4473) | → Drawer com N4 tree filtrada (accordion) |
| Domain cards com produtos/barras | → Célula colorida no heatmap + detalhe no Drawer |
| Cross-zone matrix (4686-4748) | → Absorvido pelo heatmap principal |
| Top-5 decomm roadmap (4750-4816) | → Ranking expandido com stacked bars e impacto |
| Zone selector (6 botões) | → Dropdown no header + highlight na row do heatmap |

### REMOVER

| Elemento | Motivo |
|---|---|
| Sub-tabs (portfolioSubTab state) | Página única com disclosure progressivo |
| Domain status pills ("Global Leading"/"Approaching") | Absorvido pelas cores do heatmap |
| Referências a L-levels (L0-L4) na UI | Taxonomia técnica, não linguagem de VP |
| Tech level badges por produto | VP não precisa saber se é L2 ou L3 |

### ADICIONAR (novo)

| Elemento | Prioridade |
|---|---|
| Hero Scorecards (5 KPIs) | P0 |
| Heatmap Zona × Domínio (6×9) | P1 |
| Drawer de detalhes (zona×domínio) | P2 |
| Decomm Readiness redesenhado com ranking/impacto | P3 |
| Timeline Gantt horizontal de paridade | P4 |
| Árvore N4 dentro do Drawer (accordion) | P5 |
| Export PDF/PPTX | P6 |

---

## 8. PRIORIDADE DE IMPLEMENTAÇÃO

### Sprint 1 — "Resposta em 30 segundos" (P0 + P1)

**Objetivo:** VP abre a aba e responde "quanto tenho?" e "onde está o gap?" sem clicar em nada.

| Item | Impacto | Esforço | Dados |
|---|---|---|---|
| Hero Scorecards (5 cards) | 🔴 ALTO | 🟢 BAIXO | Métricas já computadas nos useMemos |
| Heatmap Zona × Domínio | 🔴 ALTO | 🟡 MÉDIO | crossZone já existe, rendering novo |

**Entrega:** Scorecards + heatmap com tooltips. Scroll down ainda mostra versão antiga para não quebrar.

### Sprint 2 — "Drill-down completo" (P2 + P3 + P5)

**Objetivo:** Click no heatmap abre contexto completo. Árvore N4 disponível sem ser obrigatória.

| Item | Impacto | Esforço | Dados |
|---|---|---|---|
| Drawer de Detalhes | 🔴 ALTO | 🟡 MÉDIO | Reshuffling dos domain cards |
| Decomm Cards redesenhados | 🟡 MÉDIO | 🟢 BAIXO | decommReadiness já existe |
| N4 Tree no Drawer | 🟢 BAIXO | 🟢 BAIXO | Mover capTree existente com filtro |

**Entrega:** Disclosure completo. Sub-tabs antigas removidas. Feature flag para rollback.

### Sprint 3 — "QBR-ready" (P4 + P6)

**Objetivo:** VP gera material para reunião. Timeline responde "quando vou ter paridade?"

| Item | Impacto | Esforço | Dados |
|---|---|---|---|
| Timeline Gantt horizontal | 🟡 MÉDIO | 🔴 ALTO | Agregação nova de planned_quarter |
| Export PDF/PPTX | 🟡 MÉDIO | 🔴 ALTO | html2canvas ou pptxgenjs |

**Entrega:** Storytelling temporal + material para QBR.

### Roadmap Visual

```
Sprint 1                    Sprint 2                    Sprint 3
━━━━━━━━━━━━━━━━━━━        ━━━━━━━━━━━━━━━━━━━        ━━━━━━━━━━━━━━━━━━━
[P0] Hero Scorecards  ──→  [P2] Drawer Detail    ──→  [P4] Timeline Gantt
[P1] Coverage Heatmap ──→  [P3] Decomm Cards     ──→  [P6] Export PDF/PPT
                           [P5] N4 Tree in Drawer
                           [--] Remove sub-tabs

Desbloqueios:
Sprint 1 ──→ Sprint 2: Heatmap habilita Drawer (click handler)
Sprint 2 ──→ Sprint 3: Drawer habilita contexto do Timeline por domínio
                        Sub-tabs removidas liberam espaço visual
```

---

## 9. CONSIDERAÇÕES TÉCNICAS

### 9.1 Estrutura de componentes (extrair de App.tsx)

```
PortfolioIntelligenceView/
├── HeroScoreCards.tsx          ← P0 (5 cards, props: domainData, capabilities)
├── CoverageHeatmap.tsx         ← P1 (grid 6×9, props: crossZone, onCellClick)
├── ZoneDetailDrawer.tsx        ← P2 (drawer, props: zone, domain, capTree, decomm)
├── DecommRankingCards.tsx      ← P3 (cards grid, props: decommCandidates)
├── ParityTimeline.tsx          ← P4 (gantt, props: capabilities grouped by domain)
├── CapabilityTreeAccordion.tsx ← P5 (accordion N4, props: filtered capTree)
└── ExportButton.tsx            ← P6 (pdf/pptx generation)
```

### 9.2 Estado

```typescript
// REMOVER
portfolioSubTab: 'deployment' | 'capabilities'  // sub-tabs eliminadas

// ADICIONAR
activeDrawerCell: { zone: string; domain: string } | null  // controla drawer
```

### 9.3 Heatmap rendering

- 6 zonas × 9 domínios = 54 células — sem preocupação de performance
- CSS Grid: `grid-template-columns: auto repeat(9, 1fr)`
- Cores via tokens Celebration DS: `--cds-feedback-success/warning/error`
- Background com opacidade 0.15 (light) / 0.25 (dark) + texto escuro

### 9.4 Timeline (Sprint 3)

- Recharts `BarChart` horizontal com `layout="vertical"`
- Barras stacked: READY | Planned | No Plan
- Reference line vertical em "hoje"
- Não precisa de lib Gantt dedicada

### 9.5 Feature flag

```
VITE_FEATURE_PORTFOLIO_V2=true → Novo layout
VITE_FEATURE_PORTFOLIO_V2=false → Layout atual (default durante rollout)
```

### 9.6 i18n — Novas keys

```
portfolioHeroGlobalCoverage, portfolioHeroLegacySystems,
portfolioHeroParityETA, portfolioHeroDecommReady, portfolioHeroCapGap,
portfolioHeatmapTitle, portfolioHeatmapLegend*,
portfolioTimelineTitle, portfolioTimelineFilter,
portfolioDecommRanking, portfolioDecommImpactSites
```

---

## 10. CRITÉRIOS DE ACEITE

| # | Critério | Validação |
|---|---|---|
| 1 | VP responde "quanto do portfolio global já tenho?" em ≤ 5 segundos | Global Parity Index visível no Hero sem scroll |
| 2 | VP identifica domínios problemáticos em ≤ 10 segundos | Heatmap com cores semafóricas, scanning visual |
| 3 | VP entende timeline de paridade sem drill-down | Timeline Gantt visível na página (below fold) |
| 4 | VP vê impacto de descomissionamento (sites, não N4s) | Decomm cards com "Impacto: N sites" |
| 5 | Director de Área acessa detalhe N4 quando necessário | Accordion no Drawer mantém árvore filtrada |
| 6 | Material exportável para QBR (PDF/PPT) | Botão Export gera one-pager com KPIs + heatmap |
| 7 | Nenhuma terminologia técnica visível (N1-N4, L-levels, domain_code) | Audit da UI por linguagem gerencial |

---

## 11. PERSPECTIVA TEMPORAL — 3 horizontes do VP (BA Manufacturing)

| Horizonte | Pergunta | Visualização | Frequência |
|---|---|---|---|
| **H1 — Quarter atual** | "Estou on-track nos deploys comprometidos?" | Burndown/progresso Q vs plan | Semanal |
| **H2 — Year-end (1YP)** | "Onde termino o ano?" | Projeção % deployed ao final do ano | Mensal |
| **H3 — Zone vs Zone** | "Como estou vs outras zonas?" | Ranking de zonas (Packaging Cup mindset) | QBR |

> **Insight BA:** O ranking zone-vs-zone é o que realmente move comportamento na AB InBev. O VP não quer ser o último.

---

## 12. RESUMO EXECUTIVO

### A pergunta-mestre que o dashboard deve responder:

> "Onde estou exposto — por inação minha (READY não deployed), por dependência do Global (GAP real), ou por execução lenta (deploy atrasado) — e como me comparo com as outras zonas?"

### O que muda:

| Antes | Depois |
|---|---|
| 2 sub-tabs técnicas | 1 página com disclosure progressivo |
| Árvore N4 com 1679 items como entry point | Heatmap 6×9 como entry point |
| Cards de domínio com tudo misturado | Scorecards headline → Heatmap → Drawer |
| Sem métricas resumo | 5 KPIs visíveis em 5 segundos |
| Sem timeline | Gantt de paridade por domínio |
| Top-5 decomm sem contexto | Ranking com impacto em sites e semáforo |
| Sem export | PDF/PPTX para QBR |

### 3 sprints, valor incremental:

- **Sprint 1:** VP responde 2 de 4 perguntas em 10 segundos (quanto tenho? onde é o gap?)
- **Sprint 2:** VP responde todas as 4 perguntas com drill-down (quando? o que descomissionar?)
- **Sprint 3:** VP leva material para reunião (timeline + export)
