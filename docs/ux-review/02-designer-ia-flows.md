# Design Spec: Arquitetura de Informacao e Fluxos de Navegacao

> Coverage Dashboard -- AB InBev Global Manufacturing
> Data: 2026-04-04 | Autor: UX/UI Designer (Celebration DS)
> Consumido por: dev_frontend

---

## 1. Diagnostico do Estado Atual

### Problemas identificados na IA vigente (7 abas)

| # | Problema | Heuristica violada |
|---|----------|--------------------|
| P1 | **Zone** e **Domain** sao eixos ortogonais do MESMO dado (maturidade), mas vivem em abas separadas. Usuario precisa alternar para cruzar zona x dominio. | H7 -- Flexibilidade e eficiencia |
| P2 | **Executive** agrega KPIs + targets + VPO threshold + heatmap + top 5 -- sobrecarga cognitiva numa unica view. | H8 -- Design estetico e minimalista |
| P3 | **Maturity vs Results** contem scatter, heatmap, waterfall OSE, correlacao, narrativa -- 5 sub-views empilhadas verticalmente com scroll infinito. | H6 -- Reconhecimento vs recall |
| P4 | **Portfolio Intelligence** e **Capability Gap** ambos respondem "o que falta?" mas com perspectivas diferentes (produto vs capacidade N3/N4) sem link cruzado explicito. | H4 -- Consistencia |
| P5 | Nao existe passagem de contexto entre abas: clicar numa zona no Executive nao filtra a view de Zone. Estado e perdido a cada transicao. | H3 -- Controle e liberdade do usuario |
| P6 | Sidebar fixa 208px mostra filtros de volume/complexidade, mas a NAV e horizontal no header -- dois padrones concorrentes. | H4 -- Consistencia |
| P7 | 7 itens na nav horizontal transbordam em telas < 1440px, exigindo scroll horizontal quase invisivel. | H1 -- Visibilidade do estado do sistema |

### Oportunidades

- Reduzir de 7 para **5 abas** mesclando eixos correlatos
- Criar **deep-links contextuais** que preservem filtro (zona, dominio, site)
- Separar **monitoramento** (estado atual) de **analise** (correlacoes, drivers)
- Garantir que cada aba responda a uma unica pergunta principal

---

## 2. Nova Arquitetura de Informacao -- 5 Abas

### Tabela completa

| # | ViewMode | Nome PT | Nome EN | Icone (Lucide) | Job-to-be-done | Conteudo principal | Origem | Persona primaria |
|---|----------|---------|---------|-----------------|----------------|--------------------|--------|------------------|
| 1 | `overview` | Visao Geral | Overview | `layout-dashboard` | "Como estamos no programa de maturidade digital?" | Hero KPIs (L2+%, OSE avg, VPO risk, sites analisados), Heatmap Zona x Dominio, Progresso vs Target 2026, Top 5 proximos de subir | **Redesenhada** de `executive` (simplificada: remove scatter, waterfall, VPO gate que migram para Analise) | C-Level |
| 2 | `maturity` | Maturidade | Maturity | `globe` | "Qual a distribuicao de maturidade e onde estao os gaps?" | Seletor dual zona/dominio, FunnelCards, Zone Health scorecards, Domain Blocking ranking, drill-down por site. Tabs internas: Por Zona / Por Dominio / Matriz Zona x Dominio | **Mesclada** de `zone` + `domain` | VP de Zona |
| 3 | `sites` | Sites | Sites | `clipboard-list` | "Quero encontrar, comparar e detalhar sites especificos" | Tabela filtrada/ordenavel, search, ScoreDot por dominio, comparacao lado-a-lado, link p/ Cap Gap do site | **Renomeada** (mantida) de `sites` | Tech Lead |
| 4 | `analysis` | Analise | Analysis | `bar-chart-2` | "Maturidade digital gera resultado? Onde investir?" | Sub-tabs: Correlacao (scatter+quadrante VPO), Drivers OSE (waterfall), Impacto por Cluster, Narrativa estatistica | **Redesenhada** de `maturityVsResults` (absorve conteudo analitico do antigo Executive) | C-Level |
| 5 | `portfolio` | Portfolio & Gap | Portfolio & Gap | `box` | "Quais produtos cobrem os sites? Quais capacidades faltam? Qual o plano de transicao?" | Sub-tabs: Cobertura de Produto (heatmap G/L, decomm roadmap), Gap de Capacidade (N3/N4, gates, fracao por dominio), Condicoes de Migracao | **Mesclada** de `portfolioIntelligence` + `capabilityGap` | Tech Lead |

### Relacao entre abas (de onde vem, para onde vai)

```
                    +-------------+
                    |  1 Overview  |
                    +------+------+
                           |
              click zona   |   click KPI
              ou dominio   |   ou insight
           +---------------+---------------+
           |                               |
    +------v------+                 +------v------+
    | 2 Maturidade |                | 4 Analise    |
    +------+------+                 +--------------+
           |
     click site
           |
    +------v------+
    |  3 Sites     |------> click "ver gap" -----> 5 Portfolio & Gap
    +--------------+
```

| Transicao | Trigger | Contexto preservado |
|-----------|---------|---------------------|
| Overview -> Maturidade | Click numa zona no heatmap | `zoneFilter = zona clicada` |
| Overview -> Maturidade | Click num dominio no heatmap | `domainFilter = dominio clicado` |
| Overview -> Analise | Click no card OSE ou "Ver correlacao" | nenhum filtro extra |
| Overview -> Sites | Click num site no Top 5 | `searchQuery = nome do site` |
| Maturidade -> Sites | Click num site na tabela de bloqueados | `searchQuery = nome do site` |
| Sites -> Portfolio & Gap | Click "Ver gap" no menu de acoes | `siteFilter = site selecionado`, sub-tab = Gap de Capacidade |
| Maturidade -> Portfolio & Gap | Click em dominio bloqueante | `domainFilter = dominio`, sub-tab = Cobertura |
| Qualquer -> Overview | Click no logo ou primeiro item nav | limpa filtros |

---

## 3. Fluxos de Navegacao por Persona

### 3.1 VP de Zona -- "Minha zona esta no caminho certo?"

**Tempo estimado:** 3-5 min (curto)

```
PASSO 1 ──► Overview
  Pergunta: "Qual o panorama global e como minha zona se compara?"
  Acao: Le os Hero KPIs, localiza sua zona no Heatmap Zona x Dominio
  Insight: Identifica que AFR tem celula vermelha em Maintenance

PASSO 2 ──► Maturidade (via click na zona AFR no heatmap)
  Contexto herdado: zoneFilter = AFR
  Pergunta: "Quantos sites em AFR estao em cada nivel? Qual dominio bloqueia?"
  Acao: Ve o FunnelCard de AFR, Zone Health scorecard, Domain Blocking rank
  Insight: Maintenance e bloqueante em 40% dos sites AFR

PASSO 3 ──► Maturidade > aba Matriz (sub-tab interna)
  Pergunta: "Quais sites especificos de AFR estao travados em MT?"
  Acao: Ve a matriz zona x dominio, filtra AFR + Maintenance
  Insight: 3 sites em L0 no Maintenance, demais em L2

PASSO 4 ──► Sites (via click no site Accra na lista)
  Contexto herdado: searchQuery = "Accra"
  Pergunta: "Qual o perfil completo de Accra?"
  Acao: Le ScoreDots por dominio, OSE, volume, tipo G/L
  Decisao: "Preciso investir em MT para Accra antes do proximo QBR"

HANDOFF: Exporta PDF/XLSX para levar ao tiered meeting
```

### 3.2 Tech Lead / Gerente Digital -- "Quais sites atacar primeiro?"

**Tempo estimado:** 8-12 min (medio)

```
PASSO 1 ──► Overview
  Pergunta: "Quantos sites ja estao em L2+? Qual o gap para o target?"
  Acao: Le Hero KPIs (L2+ %, progresso vs target 2026)
  Insight: 58% em L2+, target e 75%. Faltam 28 sites.

PASSO 2 ──► Overview > Top 5 proximos de subir
  Pergunta: "Quem esta mais perto de subir de nivel?"
  Acao: Le a tabela Top 5, identifica gap e dominio bloqueante
  Insight: Mbeya precisa de 0.3 em Quality para ir de L1 para L2

PASSO 3 ──► Sites (via click em Mbeya)
  Contexto herdado: searchQuery = "Mbeya"
  Pergunta: "Qual o detalhe de todos os dominios de Mbeya?"
  Acao: Ve ScoreDots, identifica que Quality esta em L1 com produto Legacy

PASSO 4 ──► Portfolio & Gap > Gap de Capacidade (via "Ver gap")
  Contexto herdado: siteFilter = "Mbeya"
  Pergunta: "Quais capacidades N3/N4 faltam em Quality para Mbeya?"
  Acao: Ve fracoes por dominio, gates L1/L2/L3/L4, capacidades faltantes
  Insight: Faltam 2 capacidades funcionais em Quality (peso 2.0 cada)

PASSO 5 ──► Portfolio & Gap > Cobertura de Produto (sub-tab)
  Pergunta: "O produto global de Quality ja esta implantado em Mbeya?"
  Acao: Ve heatmap G/L, identifica que Mbeya usa Legacy em Quality
  Decisao: "Preciso migrar Quality para produto global antes de subir nivel"

PASSO 6 ──► Portfolio & Gap > Condicoes de Migracao (sub-tab)
  Pergunta: "Quais pre-requisitos VPO para migracao?"
  Acao: Ve gate VPO, dominios-chave, OSE projetado
  Deliverable: Plano de implantacao com prioridade e timeline

HANDOFF: Exporta XLSX com lista de sites priorizados
```

### 3.3 C-Level / Estrategista -- "O portfolio digital impacta resultados?"

**Tempo estimado:** 5-8 min (medio)

```
PASSO 1 ──► Overview
  Pergunta: "Como estamos vs o target? Qual o risco?"
  Acao: Le Hero KPIs, Progresso vs Target gauge, VPO Risk count
  Insight: 23 sites abaixo de VPO 80% — risco de ROI negativo

PASSO 2 ──► Analise > Correlacao (via click no card OSE)
  Pergunta: "Maturidade realmente correlaciona com eficiencia?"
  Acao: Ve scatter Maturidade x OSE, quadrante VPO, R-squared
  Insight: VPO explica 34% da variancia, Tech so 12%. Processo precede tech.

PASSO 3 ──► Analise > Drivers OSE (sub-tab)
  Pergunta: "De onde vem a perda de eficiencia por zona?"
  Acao: Ve waterfall por zona, identifica que MAZ perde 15% em restricoes internas
  Insight: Restricoes internas em MAZ correlacionam com baixa maturidade em BP

PASSO 4 ──► Analise > Impacto por Cluster (sub-tab)
  Pergunta: "Qual o efeito marginal de subir de nivel?"
  Acao: Ve heatmap de impacto, compara L1→L2 vs L2→L3
  Insight: L1→L2 gera +3.2pp OSE medio; L2→L3 gera +1.8pp — priorizar L1→L2

PASSO 5 ──► Overview (retorno para contexto consolidado)
  Pergunta: "Qual a recomendacao para o Board?"
  Acao: Exporta PDF com narrativa: "Investir em VPO para 23 sites de risco; priorizar L1→L2 (+3.2pp OSE/site)"

HANDOFF: PDF para Board review / QBR deck
```

---

## 4. Padroes de Interacao Cross-Aba

### 4.1 Deep-links contextuais

Toda transicao entre abas usa um objeto de contexto compartilhado:

```typescript
interface NavigationContext {
  zoneFilter?: string;       // "AFR" | "SAZ" | ...
  domainFilter?: string;     // "Maintenance" | "Quality" | ...
  siteFilter?: string;       // "Accra" | "Mbeya" | ...
  searchQuery?: string;      // texto livre
  subTab?: string;           // "coverage" | "capGap" | "migration"
  sourceView?: ViewMode;     // de onde veio (para breadcrumb)
}
```

### 4.2 Persistencia de filtros

| Filtro | Escopo | Comportamento |
|--------|--------|---------------|
| Volume (G1/G2/G3) | **Global** (sidebar) | Persiste entre todas as abas |
| Complexidade do mix | **Global** (sidebar) | Persiste entre todas as abas |
| Zona | **Contextual** | Passado via deep-link, resetado ao mudar de aba manualmente |
| Dominio | **Contextual** | Passado via deep-link, resetado ao mudar de aba manualmente |
| Site | **Contextual** | Passado via deep-link, resetado ao mudar de aba manualmente |

### 4.3 Breadcrumb contextual

Quando o usuario chega numa aba via deep-link (nao via nav direta), exibir breadcrumb abaixo do titulo:

```
Overview > Maturidade (AFR)
Overview > Sites > Mbeya
Sites > Portfolio & Gap > Gap de Capacidade (Mbeya / Quality)
```

Implementacao: chip clicavel que retorna a view de origem com o contexto anterior.

```
+------------------------------------------------------------------+
| [< Overview]  Maturidade -- zona: [AFR x]                        |
+------------------------------------------------------------------+
```

O `[< Overview]` e um link de retorno. O `[AFR x]` e um chip de filtro removivel.

### 4.4 Tooltip de navegacao

Em qualquer celula clicavel que leve a outra aba, exibir tooltip com destino:

```
"Clique para ver detalhes em Maturidade > AFR"
"Clique para ver gap de capacidade de Mbeya"
```

---

## 5. Wireframe Textual de Cada Aba

### 5.1 Overview (ViewMode: `overview`)

```
+==================================================================+
| HEADER: Supply Capability Assessment                    [?][PT][D]|
| [# Overview] [# Maturidade] [# Sites] [# Analise] [# Portfolio] |
+==================================================================+
|         |                                                         |
| SIDEBAR |  TITULO: Visao Executiva                                |
| +-----+ |  Subtitulo: Panorama consolidado do programa            |
| |Vol  | |                                                         |
| |G1   | |  +----------+ +----------+ +----------+ +----------+   |
| |G2   | |  | Sites    | | OSE      | | Sites    | | Sites    |   |
| |G3   | |  | L2+      | | Medio    | | VPO < 80 | | Analis.  |   |
| +-----+ |  | 58%      | | 72.3%    | | 23       | | 163      |   |
| +-----+ |  | vs tgt75%| | vs tgt80%| | risco ROI| | N3/N4    |   |
| |Cmplx| |  +----------+ +----------+ +----------+ +----------+   |
| |L/M/H| |                                                         |
| +-----+ |  PROGRESSO VS TARGET 2026                               |
|         |  +----------------------------------------------------+ |
|         |  | [============================------] 58% / 75% tgt  | |
|         |  | [Editar Targets]                                    | |
|         |  +----------------------------------------------------+ |
|         |                                                         |
|         |  HEATMAP ZONA x DOMINIO                                 |
|         |  +----------------------------------------------------+ |
|         |  |       | DA | MDM| BP | PP | QL | MT | SF | MG | UT | |
|         |  | AFR   | 2.1| 1.8| 2.3| 1.5| 0.8| 0.5| 1.2| 1.0| 1.1|
|         |  | SAZ   | 2.5| 2.2| 2.8| 2.0| 1.9| 1.7| 1.5| 1.3| 1.6|
|         |  | ...   | ...| ...| ...| ...| ...| ...| ...| ...| ...|
|         |  +----------------------------------------------------+ |
|         |  Celulas clicaveis -> Maturidade(zona, dominio)         |
|         |                                                         |
|         |  TOP 5 SITES PROXIMOS DE SUBIR                          |
|         |  +----------------------------------------------------+ |
|         |  | Site      | Zona | Nivel | Gap  | Bloqueante | Acao | |
|         |  | Mbeya     | AFR  | L1    | 0.3  | QL         | [>]  | |
|         |  | Cochabamba| SAZ  | L1    | 0.5  | MT         | [>]  | |
|         |  | ...       | ...  | ...   | ...  | ...        | [>]  | |
|         |  +----------------------------------------------------+ |
|         |  [>] = navega para Sites com site pre-selecionado       |
|         |                                                         |
+==================================================================+
```

### 5.2 Maturidade (ViewMode: `maturity`)

```
+==================================================================+
| HEADER                                                            |
| [  Overview] [# Maturidade] [  Sites] [  Analise] [  Portfolio]  |
+==================================================================+
| TABS INTERNAS: [Por Zona] [Por Dominio] [Matriz]                 |
+------------------------------------------------------------------+
|         |                                                         |
| SIDEBAR |  BREADCRUMB: [< Overview] Maturidade -- [AFR x]        |
|         |                                                         |
|         |  === MODO: POR ZONA (tab selecionada) ===               |
|         |                                                         |
|         |  ZONE HEALTH SCORECARDS (horizontal scroll)             |
|         |  +--------+ +--------+ +--------+ +--------+           |
|         |  | AFR    | | SAZ    | | MAZ    | | ...    |           |
|         |  | Score  | | Score  | | Score  | |        |           |
|         |  | 62/100 | | 78/100 | | 71/100 | |        |           |
|         |  |Atencao | | Bom    | |Atencao | |        |           |
|         |  | OSE 68%| | OSE 76%| | OSE 71%| |        |           |
|         |  | VPO80+ | | VPO80+ | | VPO80+ | |        |           |
|         |  +--------+ +--------+ +--------+ +--------+           |
|         |  Card clicavel -> filtra FunnelCards abaixo             |
|         |                                                         |
|         |  FUNNEL CARDS (grid 3 cols desktop)                     |
|         |  +--------+ +--------+ +--------+                      |
|         |  |  AFR   | |  SAZ   | |  MAZ   |                      |
|         |  | L0 100%| | L0 100%| | L0 100%|                      |
|         |  | L1  82%| | L1  90%| | L1  85%|                      |
|         |  | L2  45%| | L2  67%| | L2  55%|                      |
|         |  | L3  12%| | L3  30%| | L3  22%|                      |
|         |  | L4   2%| | L4   8%| | L4   5%|                      |
|         |  +--------+ +--------+ +--------+                      |
|         |  Barras clicaveis -> tooltip com sites exclusivos       |
|         |                                                         |
|         |  === MODO: POR DOMINIO (quando selecionado) ===         |
|         |                                                         |
|         |  DOMAIN BLOCKING RANKING (tabela)                       |
|         |  | Dominio | %Bloq | Avg | Distrib | G/L | Sites |     |
|         |  | MT      | 42%   | 1.2 | [bars]  | 8G/3L| 120  |     |
|         |  | QL      | 35%   | 1.5 | [bars]  | 6G/5L| 115  |     |
|         |  Click em dominio -> drill-down sites bloqueados        |
|         |                                                         |
|         |  DOMAIN FUNNEL (grid igual ao zone)                     |
|         |                                                         |
|         |  === MODO: MATRIZ (quando selecionado) ===              |
|         |                                                         |
|         |  HEATMAP INTERATIVA grande (zona x dominio x nivel)     |
|         |  Com selector: metrica = avg score | %L2+ | %bloqueante |
|         |  Click em celula -> lista de sites filtrados abaixo     |
|         |                                                         |
+==================================================================+
```

### 5.3 Sites (ViewMode: `sites`)

```
+==================================================================+
| HEADER                                                            |
| [  Overview] [  Maturidade] [# Sites] [  Analise] [  Portfolio]  |
+==================================================================+
|         |                                                         |
| SIDEBAR |  TITULO: Detalhamento por Site                          |
|         |  Subtitulo: 163 sites no filtro                         |
|         |                                                         |
|         |  FILTROS EM LINHA                                       |
|         |  [Buscar site ou pais...] [Zona: Todas v] [Nivel: v]   |
|         |                                                         |
|         |  BARRA DE ACOES                                         |
|         |  [Comparar Sites (0)] .............. [Exportar XLSX]    |
|         |                                                         |
|         |  TABELA                                                 |
|         |  +----------------------------------------------------+ |
|         |  | Site     |Zona|Vol(HL)|Grp|Avg| DA MDM BP PP QL... | |
|         |  |----------|----| ------|---|---|-------------------| |
|         |  | Accra    |AFR |1.2M   |G1 |1.8| o  o  o  o  o    | |
|         |  | Alrode   |AFR |3.5M   |G2 |2.3| o  o  o  o  o    | |
|         |  | ...      |... | ...   |...|...| .  .  .  .  .    | |
|         |  +----------------------------------------------------+ |
|         |  o = ScoreDot (cor L0-L4, anel G=azul / L=cinza)       |
|         |                                                         |
|         |  PAGINACAO                                              |
|         |  [30 v] << < 1 2 3 > >> Exibindo 1-30 de 163           |
|         |                                                         |
|         |  MENU POR LINHA (...)                                   |
|         |  - Ver gap de capacidade -> Portfolio & Gap (capGap)    |
|         |  - Comparar com similar -> abre modal comparacao        |
|         |  - Ver no mapa de maturidade -> Maturidade (zona)       |
|         |                                                         |
+==================================================================+
```

### 5.4 Analise (ViewMode: `analysis`)

```
+==================================================================+
| HEADER                                                            |
| [  Overview] [  Maturidade] [  Sites] [# Analise] [  Portfolio]  |
+==================================================================+
| TABS INTERNAS: [Correlacao] [Drivers OSE] [Impacto] [Narrativa]  |
+------------------------------------------------------------------+
|         |                                                         |
| SIDEBAR |  === TAB: CORRELACAO ===                                |
|         |                                                         |
|         |  VPO THRESHOLD CALLOUT (banner amarelo)                 |
|         |  +----------------------------------------------------+ |
|         |  | !! 23 de 163 sites abaixo de VPO 80%. ROI marginal | |
|         |  +----------------------------------------------------+ |
|         |                                                         |
|         |  HERO: Maturidade gera resultado?                       |
|         |  +-------------------+  +-------------------+           |
|         |  | VPO explica       |  | Tech explica      |           |
|         |  | 34% da variancia  |  | 12% da variancia  |           |
|         |  +-------------------+  +-------------------+           |
|         |                                                         |
|         |  SCATTER PLOT (Maturidade x OSE)                        |
|         |  +----------------------------------------------------+ |
|         |  |  OSE%                                               | |
|         |  |   .   .                        .  .                 | |
|         |  |     . . .   .             .  .    .                 | |
|         |  | . .   .  .    .      .  .     .                     | |
|         |  |  .  .    .  .   .  .                                | |
|         |  +-------------------------------------- Maturity 0-4  | |
|         |  +----------------------------------------------------+ |
|         |  Quadrantes VPO clicaveis -> filtra tabela abaixo       |
|         |                                                         |
|         |  QUADRANT EXPLORER (tabela de sites filtrada)            |
|         |                                                         |
|         |  === TAB: DRIVERS OSE ===                               |
|         |  Waterfall por zona (TT -> NST -> ST -> ... -> EPT)     |
|         |  Comparativo entre zonas                                |
|         |                                                         |
|         |  === TAB: IMPACTO ===                                   |
|         |  Heatmap impacto por cluster (Vol x Maturidade)         |
|         |  Detalhamento por cluster (tabela)                      |
|         |                                                         |
|         |  === TAB: NARRATIVA ===                                 |
|         |  Analise estatistica consolidada                        |
|         |  Correlacao R, resumo por nivel, conclusao textual       |
|         |                                                         |
+==================================================================+
```

### 5.5 Portfolio & Gap (ViewMode: `portfolio`)

```
+==================================================================+
| HEADER                                                            |
| [  Overview] [  Maturidade] [  Sites] [  Analise] [# Portfolio]  |
+==================================================================+
| TABS INTERNAS: [Cobertura de Produto] [Gap de Capacidade]        |
|                [Condicoes de Migracao]                             |
+------------------------------------------------------------------+
|         |                                                         |
| SIDEBAR |  BREADCRUMB: [< Sites] Portfolio & Gap -- [Mbeya x]    |
|         |                                                         |
|         |  === TAB: COBERTURA DE PRODUTO ===                      |
|         |                                                         |
|         |  SELETOR DE ZONA: [Global v]                            |
|         |                                                         |
|         |  STATUS CARDS (horizontal)                              |
|         |  +--------+ +--------+ +--------+ +--------+           |
|         |  |Global  | |Aprox.  | |Legacy  | |Sem     |           |
|         |  |Lider.  | |Paridade| |Domin.  | |Produto |           |
|         |  | 42%    | | 18%    | | 28%    | | 12%    |           |
|         |  +--------+ +--------+ +--------+ +--------+           |
|         |                                                         |
|         |  HEATMAP ZONA x DOMINIO (G/L status)                    |
|         |  |       | DA | MDM| BP | PP | QL | MT | SF | MG | UT | |
|         |  | AFR   | GL | G  | GL | L  | L  | -  | G  | G  | L  |
|         |  Cores: verde=G lider, amarelo=paridade, verm=L domin   |
|         |                                                         |
|         |  DECOMM ROADMAP (Top 5 candidatos)                      |
|         |  | Produto Legacy | Sites | Pre-req | Gap | Urgencia | |
|         |                                                         |
|         |  === TAB: GAP DE CAPACIDADE ===                         |
|         |                                                         |
|         |  FILTROS: [Zona v] [Dominio v] [Nivel v]                |
|         |                                                         |
|         |  RESUMO POR ZONA (cards)                                |
|         |  Click em zona+dominio -> filtra matriz abaixo          |
|         |                                                         |
|         |  MATRIZ DE SITES                                        |
|         |  | Site   | Zona | Avg | DA | MDM| ... | Bloqueante |  |
|         |  | Accra  | AFR  | 62% | 70 | 55 | ... | MDM        |  |
|         |  Click em linha -> detalhe N3/N4 do site                |
|         |                                                         |
|         |  DETALHE DO SITE (expandido ou drawer lateral)           |
|         |  Fracoes por dominio, gates L1-L4, capacidades          |
|         |                                                         |
|         |  === TAB: CONDICOES DE MIGRACAO ===                     |
|         |                                                         |
|         |  Sub-tabs: [Por Nivel] [Por Site]                       |
|         |  VPO minimo, dominios-chave, OSE projetado              |
|         |  Sites: Ready / Close / Far (com badges)                |
|         |                                                         |
+==================================================================+
```

---

## 6. Componentes Celebration DS Utilizados

| Componente | Variante | Estado | Onde usado |
|------------|----------|--------|------------|
| Button | Primary (amber) | default / hover / disabled | Editar Targets, Exportar, acoes |
| Button | Secondary | default / hover | Filtros, sub-tabs, comparacao |
| Button | Tertiary | default / hover | Breadcrumb links, "Ver detalhe" |
| Card | KPI Hero (min 80px) | default | Hero KPIs no Overview |
| Card | Scorecard | default / hover | Zone Health, Status cards |
| Tag | Status (verde/amarelo/vermelho/cinza) | default | Badges de nivel, status G/L, health |
| Badge | Count | default | Contadores em tabs internas |
| Tabs | Horizontal (nav principal) | active / idle | Header nav (5 abas) |
| Tabs | Horizontal (sub-nav) | active / idle | Tabs internas (Por Zona/Dominio/Matriz) |
| Input Text (Search) | Default | default / focus / filled | Busca de sites |
| Select | Single | default / open | Zona filter, Dominio filter, Nivel filter |
| Table | Sortable + filterable | default / hover row / selected | Sites, Blocking ranking, Decomm |
| Tooltip | Default | shown / hidden | ScoreDots, celulas heatmap, nav hints |
| Breadcrumb | With chips | default | Indicador "de onde vim" |
| Pagination | Default | default | Tabela de sites |
| Loading | Spinner | loading | Fetch de product coverage, anaplan |
| Alert | Info (blue) | default | VPO Threshold callout |
| Alert | Warning (amber) | default | Dados Anaplan nao carregados |
| Modal | Default | open / closed | Metodologia, Comparacao de sites |
| Progress Bar | Segmented | default | Progresso vs Target |
| Dropdown | Actions menu | default / open | Menu por linha na tabela (...) |
| Avatar | Placeholder | default | Header (se adicionar auth) |
| Icon | Systemic (Lucide) | default | Nav items, acoes |
| Text/Heading | H1 / H2 / Body / Caption | default | Hierarquia tipografica |
| Toast | Success / Error | shown -> auto-hide | Export concluido, erro fetch |

---

## 7. Token Mapping (para o dev_frontend)

### Cores de Feedback

| Token DS | CSS var / Tailwind | Valor | Uso |
|----------|-------------------|-------|-----|
| feedback-success | `text-emerald-500` / `bg-emerald-50` | #10B981 | L4, health Bom, Global Leading |
| feedback-warning | `text-amber-500` / `bg-amber-50` | #F59E0B | L3, health Atencao, Approaching |
| feedback-error | `text-red-500` / `bg-red-50` | #EF4444 | Bloqueante alto, Legacy Dominant, health Critico |
| feedback-info | `text-blue-500` / `bg-blue-50` | #3B82F6 | VPO callout, Global ring |
| action-primary | `bg-yellow-400` | #FACC15 | Botoes primarios, tab ativa, accent bar |
| action-hover | `bg-yellow-300` | #FDE047 | Hover do primario |
| neutral-bg | `bg-gray-50` / `bg-gray-900` | Light/Dark | Fundo principal |
| neutral-surface | `bg-white` / `bg-gray-800` | Light/Dark | Cards, tabelas |
| neutral-border | `border-gray-200` / `border-gray-700` | Light/Dark | Bordas |

### Spacing

| Token | Valor | Uso |
|-------|-------|-----|
| spacing-xs | 4px (p-1) | Gap entre icone e label na nav |
| spacing-sm | 8px (p-2) | Padding interno de cells |
| spacing-md | 16px (p-4) | Padding de cards, gap entre elementos |
| spacing-lg | 24px (p-6) | Padding horizontal do content area |
| spacing-xl | 32px (p-8) | Margem entre secoes |
| spacing-2xl | 40px (p-10) | Separacao entre blocos principais |

### Elevation

| Token | Tailwind | Uso |
|-------|----------|-----|
| shadow-sm | `shadow-sm` | Cards, sidebar panels |
| shadow-md | `shadow-md` | Tooltips, dropdown menus |
| shadow-lg | `shadow-lg` | Modals, drawer |

### Tipografia

| Token | Tailwind | Uso |
|-------|----------|-----|
| heading-xl | `text-xl font-black` | Titulo da pagina |
| heading-lg | `text-lg font-black` | Titulo de secao |
| heading-md | `text-base font-bold` | Subtitulo de secao |
| body-default | `text-sm` | Texto de tabela, descricoes |
| body-small | `text-xs` | Labels, metadados |
| caption | `text-[10px] font-black uppercase tracking-widest` | Section headers sidebar |
| kpi-hero | `text-3xl font-black tabular-nums` | Numero principal nos Hero KPIs |

---

## 8. Acessibilidade

### ARIA Labels

| Elemento | aria-label | aria-role |
|----------|------------|-----------|
| Nav principal (5 abas) | "Navegacao principal" | `navigation` |
| Tabs internas | "Visualizacoes de {nomeAba}" | `tablist` |
| Tab button | "{nomeTab}" | `tab` com `aria-selected` |
| Tab panel | "Painel {nomeTab}" | `tabpanel` |
| Heatmap | "Heatmap de maturidade zona por dominio" | `table` |
| ScoreDot | "Score {dominio}: nivel {N}, tipo {G/L}" | `img` com `aria-label` |
| Hero KPI card | "{label}: {valor}" | `figure` com `aria-label` |
| Breadcrumb | "Trilha de navegacao" | `navigation` com `aria-label="breadcrumb"` |
| Botao exportar | "Exportar {formato}" | `button` |
| Filtro de zona | "Filtrar por zona" | `combobox` |
| Tabela ordenavel | "Ordenar por {coluna}" | `columnheader` com `aria-sort` |

### Contraste (WCAG AA)

| Par de cores | Ratio | Status |
|-------------|-------|--------|
| yellow-400 sobre gray-900 (botao primario dark) | 12.6:1 | PASS |
| gray-900 sobre yellow-400 (botao primario light) | 12.6:1 | PASS |
| white sobre gray-900 (texto dark mode) | 17.1:1 | PASS |
| gray-900 sobre white (texto light mode) | 17.1:1 | PASS |
| red-500 sobre white (feedback error) | 4.6:1 | PASS |
| emerald-500 sobre white (feedback success) | 3.4:1 | FAIL - usar emerald-700 para texto |
| amber-500 sobre white (feedback warning) | 3.0:1 | FAIL - usar amber-700 para texto |

**Acoes corretivas:**
- Substituir `text-emerald-500` por `text-emerald-700` em contexto de texto sobre fundo claro
- Substituir `text-amber-500` por `text-amber-700` em contexto de texto sobre fundo claro
- Manter as cores originais para backgrounds e icones (nao sao texto)

### Area de toque

- Minimo 44x44px para todos os botoes e links clicaveis
- ScoreDots na tabela: area de toque expandida via padding (`p-2`) mesmo que o dot visual seja 12px
- Celulas do heatmap: minimo 44x44px com padding

### Navegacao por teclado

| Acao | Tecla |
|------|-------|
| Navegar entre abas | Tab / Shift+Tab, Arrow Left/Right |
| Ativar aba | Enter / Space |
| Navegar tabela | Arrow keys dentro da tabela |
| Ordenar coluna | Enter no header |
| Abrir tooltip | Enter/Space no ScoreDot |
| Fechar tooltip/modal | Escape |
| Breadcrumb retorno | Enter no link de retorno |

---

## 9. Estados

### 9.1 Loading

```
+----------------------------------------------------+
|                                                     |
|           [spinner]                                 |
|     Carregando dados de cobertura...                |
|                                                     |
+----------------------------------------------------+
```

- Spinner centralizado no content area
- Skeleton loading para cards (retangulos pulsantes)
- Tabela: linhas skeleton com shimmer animation
- Nao bloquear sidebar nem nav durante loading

### 9.2 Empty

```
+----------------------------------------------------+
|                                                     |
|         [icone: search-x]                           |
|   Nenhum site encontrado para este filtro.          |
|   [Limpar filtros]                                  |
|                                                     |
+----------------------------------------------------+
```

- Empty state com ilustracao minima (icone Lucide)
- Acao primaria para resolver (limpar filtros, carregar dados)
- Mensagem especifica por contexto:
  - Tabela sem resultados: "Nenhum site no filtro selecionado. Ajuste o filtro de volume na barra lateral."
  - Anaplan nao carregado: "Dados Anaplan nao carregados. Carregue anaplan-ose-ttp-2025.json em client/public/."
  - Scatter sem dados: "Dados insuficientes para exibir o scatter plot."

### 9.3 Error

```
+----------------------------------------------------+
|  [!] Falha ao carregar dados de cobertura.          |
|      [Tentar novamente]                             |
+----------------------------------------------------+
```

- Alert component (variant: negative/error)
- Botao de retry
- Nao quebrar o layout -- exibir inline no lugar do conteudo que falhou

### 9.4 Success

```
+----------------------------------------------------+
| [toast canto inferior direito]                      |
| [check] Arquivo exportado com sucesso               |
|         Coverage_Assessment_2026-04-04.xlsx          |
+----------------------------------------------------+
```

- Toast auto-dismiss (5s)
- Posicao: bottom-right
- Variant: success (verde)

---

## 10. Heuristicas de Nielsen Aplicadas

| # | Heuristica | Problema no estado atual | Solucao na nova IA |
|---|-----------|--------------------------|---------------------|
| H1 | Visibilidade do estado do sistema | 7 abas transbordam; usuario nao sabe onde esta | 5 abas cabiveis em qualquer resolucao; breadcrumb contextual mostra "de onde vim"; tab ativa com destaque amarelo |
| H2 | Correspondencia com mundo real | Labels tecnicos ("maturityVsResults") nao ressoam com VP | Labels alinhados ao vocabulario do usuario: "Maturidade", "Analise", "Portfolio & Gap" |
| H3 | Controle e liberdade do usuario | Filtros resetam ao trocar de aba; sem "voltar" | NavigationContext preserva filtros; breadcrumb permite retorno; chips removiveis |
| H4 | Consistencia e padroes | Sidebar para filtros MAS nav horizontal para views; estilos misturados | Nav horizontal consistente (5 itens); sidebar exclusivamente para filtros globais (volume, complexidade) |
| H5 | Prevencao de erros | Clicar em celula do heatmap sem feedback de que e clicavel | Cursor pointer + tooltip "Clique para ver detalhes em..." + hover state com borda |
| H6 | Reconhecimento vs recall | Maturity vs Results empilha 5 sub-views em scroll infinito; usuario esquece o que viu | Sub-tabs nomeadas (Correlacao, Drivers, Impacto, Narrativa) -- cada uma com escopo claro |
| H7 | Flexibilidade e eficiencia | Zone e Domain separados; usuario avancado precisa alternar | Mesclados em "Maturidade" com sub-tabs; Matriz permite cruzar ambos eixos simultaneamente |
| H8 | Design estetico e minimalista | Executive view sobrecarregada com KPIs + heatmap + top5 + VPO gate + targets | Overview enxuto: 4 Hero KPIs + progress bar + heatmap + top 5. Conteudo analitico migra para "Analise" |
| H9 | Ajudar usuarios a reconhecer, diagnosticar e recuperar erros | Falta de dados Anaplan mostra mensagem generica | Mensagens especificas por tipo de dado faltante, com instrucoes de como carregar |
| H10 | Ajuda e documentacao | Botao "?" existe mas e pouco visivel | Botao "?" mantido no header + tooltips contextuais em cada secao complexa |

---

## 11. Mapeamento de Migracao (Estado Atual -> Novo)

| View atual | ViewMode atual | Destino | Acao |
|------------|---------------|---------|------|
| Visao Geral | `executive` | `overview` | **Redesenhada** -- removidos: scatter, waterfall, VPO gate analysis, readiness, migration. Mantidos: Hero KPIs, heatmap, top 5, progress vs target. |
| Por Zona | `zone` | `maturity` (sub-tab "Por Zona") | **Mesclada** com Domain |
| Por Dominio | `domain` | `maturity` (sub-tab "Por Dominio") | **Mesclada** com Zone. Domain Blocking ranking mantido aqui. |
| Por Site | `sites` | `sites` | **Mantida** com adicao de menu de acoes por linha e deep-links |
| Maturidade vs Resultados | `maturityVsResults` | `analysis` | **Redesenhada** -- conteudo redistribuido em 4 sub-tabs claras. Absorve VPO analysis e readiness gate do antigo Executive. |
| Portfolio Intelligence | `portfolioIntelligence` | `portfolio` (sub-tab "Cobertura") | **Mesclada** com Capability Gap |
| Gap de Capacidade | `capabilityGap` | `portfolio` (sub-tab "Gap de Capacidade") | **Mesclada** com Portfolio Intelligence |

**Conteudo novo (nao existia):**
- Sub-tab "Matriz" em Maturidade (cruzamento interativo zona x dominio com metricas selecionaveis)
- Breadcrumb contextual com chips de filtro removiveis
- NavigationContext (objeto de estado compartilhado entre views)
- Sub-tab "Condicoes de Migracao" consolidada em Portfolio & Gap (antes estava no Executive)

---

## 12. Notas para o dev_frontend

### 12.1 Refatoracao do estado de navegacao

```typescript
// Substituir o ViewMode atual:
type ViewMode = 'executive'|'domain'|'zone'|'sites'|'maturityVsResults'|'portfolioIntelligence'|'capabilityGap';

// Por:
type ViewMode = 'overview' | 'maturity' | 'sites' | 'analysis' | 'portfolio';

// Adicionar contexto de navegacao:
interface NavContext {
  zoneFilter?: string;
  domainFilter?: string;
  siteFilter?: string;
  searchQuery?: string;
  subTab?: string;
  sourceView?: ViewMode;
}

const [navCtx, setNavCtx] = useState<NavContext>({});

// Helper de navegacao com contexto:
const navigateTo = (view: ViewMode, ctx?: Partial<NavContext>) => {
  setView(view);
  setNavCtx(prev => ({ ...ctx, sourceView: prev.sourceView ?? view }));
};
```

### 12.2 Sub-tabs por view

```typescript
const SUB_TABS: Record<ViewMode, string[]> = {
  overview: [],                              // sem sub-tabs
  maturity: ['byZone', 'byDomain', 'matrix'],
  sites: [],                                 // sem sub-tabs
  analysis: ['correlation', 'driversOse', 'impact', 'narrative'],
  portfolio: ['coverage', 'capGap', 'migration'],
};
```

### 12.3 Breakpoints

| Breakpoint | Largura | Layout |
|------------|---------|--------|
| Mobile | < 768px | Sidebar oculta, nav horizontal scrollavel, cards empilhados |
| Tablet | 768-1279px | Sidebar colapsada (icones), nav horizontal com labels truncados |
| Desktop | >= 1280px | Sidebar 208px expandida, nav horizontal completa |

### 12.4 Performance

- **Lazy load** das sub-views de Analysis (scatter, waterfall) -- sao pesadas e so necessarias quando acessadas
- **Memoizar** `domainBlockingData` e `filteredSites` com `useMemo` (ja feito parcialmente)
- **Skeleton loading** para product coverage fetch (ja usa loading state)
- Heatmap da Matriz: renderizar com `<canvas>` se > 500 celulas, senao `<table>`

### 12.5 i18n -- novas chaves necessarias

```typescript
// Adicionar ao TRANSLATIONS:
maturityNav: 'Maturidade' / 'Maturity',
analysisNav: 'Analise' / 'Analysis',
portfolioGapNav: 'Portfolio & Gap' / 'Portfolio & Gap',
matrixTab: 'Matriz' / 'Matrix',
correlationTab: 'Correlacao' / 'Correlation',
impactTab: 'Impacto' / 'Impact',
narrativeTab: 'Narrativa' / 'Narrative',
coverageTab: 'Cobertura de Produto' / 'Product Coverage',
capGapTab: 'Gap de Capacidade' / 'Capability Gap',
migrationTab: 'Condicoes de Migracao' / 'Migration Requirements',
breadcrumbBack: 'Voltar para' / 'Back to',
filterChipRemove: 'Remover filtro' / 'Remove filter',
clickToNavigate: 'Clique para ver detalhes em' / 'Click to see details in',
```

### 12.6 Prioridade de implementacao

| Fase | Escopo | Estimativa |
|------|--------|------------|
| 1 | Refatorar ViewMode (7->5), criar NavigationContext, mover conteudo sem redesign | 2 sprints |
| 2 | Implementar sub-tabs em Maturidade e Analysis, breadcrumb contextual | 1 sprint |
| 3 | Nova sub-tab Matriz (heatmap interativo), deep-links com contexto | 1 sprint |
| 4 | Consolidar Portfolio + Cap Gap em unica view com 3 sub-tabs | 1 sprint |
| 5 | Ajustes de acessibilidade (ARIA, contraste, teclado) | 1 sprint |

---

## Apendice: Mapeamento de Icones Lucide

| Aba | Icone | Lucide name | Justificativa |
|-----|-------|-------------|---------------|
| Overview | 4 quadrados | `layout-dashboard` | Visao consolidada, dashboard |
| Maturidade | Globo | `globe` | Zonas geograficas, distribuicao global |
| Sites | Clipboard | `clipboard-list` | Lista detalhada, auditoria |
| Analise | Barras | `bar-chart-2` | Graficos, correlacoes, dados quantitativos |
| Portfolio & Gap | Cubo 3D | `box` | Produtos, portfolio, layers de capacidade |
