# Design Spec: Portfolio Intelligence Redesign

**Produto:** Coverage Dashboard
**Aba:** Portfolio Intelligence
**Autor:** UX/UI Designer -- Dev Crew
**Data:** 2026-04-04
**Versao anterior:** ~1000 linhas em PortfolioIntelligenceView (App.tsx linhas 3878-4823)
**PM Narrative ref:** docs/redesign-pm-narrative.md

---

## 1. Audience Layer

**Primaria:** VP de Zona (camada ESTRATEGICA)
- Contexto: reuniao executiva com CSO, 3 minutos para responder "minha zona esta pronta para o stack global?"
- Dispositivo: desktop 1920px, projetor de sala de reunioes, eventual tablet
- Modelo mental: Situacao -- Meta -- Gap -- Plano
- Linguagem: evitar L-levels, N4, taxonomia tecnica. Falar em % de paridade, dominios prontos, sistemas legados

**Secundaria:** Gerente de Transformacao Digital
- Contexto: planejamento de rollouts, priorizacao de investimentos
- Dispositivo: desktop, uso recorrente
- Precisa de drill-down mais profundo, mas partindo do mesmo resumo executivo

---

## 2. User Journey

```
Passo 1 (5s)     Passo 2 (15s)      Passo 3 (30s)        Passo 4 (10s)
"Como estou?"     "Onde estou bem     "O que falta e        "O que levo
                   e onde mal?"        quando chega?"        p/ reuniao?"
     |                  |                   |                     |
     v                  v                   v                     v
 KPI Strip         Domain Heatmap     Parity Timeline       Export Button
 5 hero cards      9 dominios x       Area chart trimestral  PDF/PPT/CSV
 verde/amarelo/    status colorido    com meta 85%
 vermelho          click filtra       + decom markers
     |                  |                   |
     v                  v                   v
  LEITURA           HOVER/CLICK         HOVER/TOGGLE
  PASSIVA           para filtrar        para detalhe
```

**Estado emocional:**
- Passo 1: "Preciso de resposta rapida" -> Confianca (numeros claros, cor semantica)
- Passo 2: "Quero entender o padrao" -> Orientacao (heatmap mostra onde focar)
- Passo 3: "Preciso de projecao" -> Planejamento (timeline mostra caminho)
- Passo 4: "Preciso de material" -> Autonomia (export autocontido)

---

## 3. Decisao de Estrutura: UNIFICAR as 2 sub-tabs

**Decisao:** Eliminar as sub-tabs "Deployment Global vs Legado" e "Comparativo de Capacidades". Unificar em fluxo unico com progressive disclosure.

**Racional:**
- VP nao navega sub-tabs -- quer fluxo linear de cima para baixo
- A separacao atual forca o VP a escolher entre "deployment" e "capabilities" sem contexto
- A informacao de capabilities e um drill-down natural do deployment, nao uma view paralela
- Toda a capability tree (5 niveis de Subarea->N4) sera colapsada em tabela flat filtravel

**Hierarquia above-the-fold (viewport 1080px):**
- KPI Strip: 100% visivel
- Domain Heatmap: 70% visivel (convida scroll)
- Timeline, Gap Table, Decom Roadmap: abaixo do fold, progressive disclosure

---

## 4. Wireframe ASCII -- Layout Completo

### 4.1 SECAO A: Zone Selector + KPI Hero Strip

```
+===========================================================================+
| PORTFOLIO INTELLIGENCE                                    [Export v]       |
| Paridade global e prontidao para descomissionamento                       |
+===========================================================================+
|                                                                           |
|  ZONA:  [*AFR*] [ SAZ ] [ MAZ ] [ NAZ ] [ EUR ] [ APAC ]                |
|          (32)    (41)    (28)    (22)    (19)    (21)                     |
|                                                                           |
+---------------------------------------------------------------------------+

+-----------+  +-----------+  +-----------+  +-----------+  +-----------+
|  ##.#%    |  |  # de 9   |  |    ##     |  |  ##.#%    |  |   +##     |
|           |  |           |  |           |  |           |  |           |
| Global    |  | Dominios  |  | Legados   |  | Decom     |  | Prox.    |
| Parity    |  | Prontos   |  | Expostos  |  | Velocity  |  | Trim.    |
| Index     |  |           |  |           |  |           |  | Delta    |
|           |  |           |  |           |  |           |  |           |
| [===--]   |  | [OOOOO--] |  |           |  | QoQ ^     |  | N4s      |
| meta: 85% |  | meta: 9/9 |  | sem plano |  |           |  | ativando |
+-----------+  +-----------+  +-----------+  +-----------+  +-----------+
    verde/         verde/        vermelho       tendencia      contagem
    amarelo/       amarelo/      quanto >0      QoQ            absoluta
    vermelho       vermelho
```

**Especificacoes do KPI Card:**
- Largura: `flex-1` em grid de 5 colunas (`grid-cols-5 gap-4`)
- Altura minima: 120px
- Metrica principal: `text-3xl font-black` (36px)
- Label: `text-xs font-medium uppercase tracking-wider` (12px)
- Sublabel/meta: `text-[10px]` (10px)
- Mini progress bar: 4px height, rounded-full
- Border-top: 3px solid [cor semantica]
- Sombra: elevation SM (`shadow-sm`)

### 4.2 SECAO B: Domain Readiness Heatmap

```
+---------------------------------------------------------------------------+
| PRONTIDAO POR DOMINIO                                    legenda: . . .  |
| AFR -- 9 dominios avaliados                                               |
+---------------------------------------------------------------------------+
|                                                                           |
|  +-------+-------+-------+-------+-------+-------+-------+-------+-----+ |
|  |  BP   |  PP   |  QL   |  MT   |  MG   |  SF   |  DA   | MDM  |  UT | |
|  |       |       |       |       |       |       |       |      |     | |
|  | 78%   | 45%   | 82%   | 61%   | 34%   | 71%   | 89%   | 52%  | 68%| |
|  |       |       |       |       |       |       |       |      |     | |
|  | READY | APPR  | READY | APPR  | LEGCY | APPR  | READY | APPR | APP| |
|  +-------+-------+-------+-------+-------+-------+-------+-------+-----+ |
|                                                                           |
|  Hover: tooltip com top-3 gaps do dominio                                 |
|  Click: filtra secoes C, D, E para o dominio selecionado                  |
+---------------------------------------------------------------------------+
```

**Especificacoes do Heatmap:**
- Grid: `grid-cols-9 gap-2` (1 coluna por dominio)
- Celula: `min-h-[100px]` com `rounded-lg`
- Cor de fundo: gradiente de intensidade baseado em % paridade
  - >= 70%: fundo verde (`bg-emerald-50/bg-emerald-900/20`)
  - 30-69%: fundo ambar (`bg-amber-50/bg-amber-900/20`)
  - < 30%: fundo vermelho (`bg-red-50/bg-red-900/20`)
- Codigo do dominio: `text-sm font-black`
- Percentual: `text-2xl font-black`
- Status label: `text-[9px] font-bold uppercase` em pill
- Click state: `ring-2 ring-blue-500` no dominio selecionado
- Hover: tooltip com 3 itens: top gap capability, legacy count, prox. ativacao

### 4.3 SECAO C: Parity Timeline

```
+---------------------------------------------------------------------------+
| EVOLUCAO DE PARIDADE                                 [Cap. Ativando]      |
| Projecao trimestral de cobertura global              [Legados Saindo]     |
+---------------------------------------------------------------------------+
|                                                                           |
|  100%|                                                                    |
|      |                                              ............META 85%  |
|   80%|                                    ___-------                      |
|      |                           ___-----/                                |
|   60%|                  ___-----/                                         |
|      |         ___-----/ +4     +7     +12    +8                          |
|   40%| ___----/                                                           |
|      |/  42%                                                              |
|   20%|                                                                    |
|      |     x       x       x                     (x = decom events)      |
|    0%+----+-------+-------+-------+-------+-------+-------+---->         |
|      Q1/26  Q2/26  Q3/26  Q4/26  Q1/27  Q2/27  Q3/27  Q4/27             |
|                                                                           |
|  [===] Paridade atual    [---] Projecao    [xxx] Decommissioning          |
|  +N = capabilities ativando no trimestre                                  |
+---------------------------------------------------------------------------+
```

**Especificacoes do Timeline:**
- Container: `min-h-[280px]` com padding `p-5`
- Implementacao: SVG inline (sem biblioteca externa)
- Eixo Y: 0-100%, gridlines a cada 20% em `stroke-gray-200/stroke-gray-700`
- Eixo X: trimestres, label `text-[10px] font-medium`
- Area preenchida: `fill-emerald-500/20` com `stroke-emerald-500` para paridade real
- Linha projetada: `stroke-emerald-400 stroke-dasharray-4-4`
- Linha meta 85%: `stroke-amber-500 stroke-dasharray-2-6` + label "Meta 85%"
- Markers de decom: circulos vermelhos `r=4` com tooltip ao hover
- Markers de capabilities: circulos verdes `r=3` acima da linha com `+N` label
- Area de toque dos markers: minimo `16px` para hover (rect invisivel)

### 4.4 SECAO D: Gap Detail Table (substitui Capability Tree)

```
+---------------------------------------------------------------------------+
| GAPS DE CAPACIDADE                          [Buscar...]  [Status v]       |
| Capacidades faltantes para paridade global  [Dominio v]  [Trimestre v]    |
+---------------------------------------------------------------------------+
|                                                                           |
|  Dominio  | Capacidade        | Produto  | Status   | Previsto  | Legacy |
|           | (nivel N2)        | Global   |          |           | Subst. |
|  ---------+-------------------+----------+----------+-----------+--------+
|  BP       | Recipe Mgmt       | Omnia OM | READY    | --        | Traks. |
|  BP       | Batch Tracking    | Omnia LMS| Q3/2026  | Q3/2026   | Traks. |
|  PP       | Line Performance  | Omnia LMS| Gap      | --        | Suite  |
|  QL       | Lab Integration   | Omnia IQ | Q4/2026  | Q4/2026   | LIMS   |
|  MT       | Work Orders       | SAP PM   | READY    | --        | local  |
|  ...      | ...               | ...      | ...      | ...       | ...    |
|                                                                           |
|  Exibindo 1-30 de 142 gaps         [< 1 2 3 4 5 >]  [30 por pagina v]  |
+---------------------------------------------------------------------------+
```

**Especificacoes da Tabela:**
- Colapsamento: 5 niveis (Subarea->N1->N2->N3->N4) viram 2 colunas (Dominio + Capability agrupada em N2)
- N4 capabilities com mesmo N2 parent sao agrupadas; contagem aparece como badge
- Colunas fixas: Dominio, Capability (N2), Produto Global, Status, Previsao, Legacy Substituto
- Status badges:
  - READY: `bg-emerald-100 text-emerald-700` / `bg-emerald-900/30 text-emerald-400`
  - Planejado: `bg-amber-100 text-amber-700` com texto "Q3/2026"
  - Gap (sem previsao): `bg-red-100 text-red-700` / `bg-red-900/30 text-red-400`
- Sorting: click em header ordena (default: por dominio, depois status desc)
- Filtros: dropdown de Status (All/READY/Planejado/Gap), Dominio (All + 9), Trimestre
- Paginacao: 30 itens default, `text-[10px]`
- Row hover: `bg-gray-50/bg-gray-700/20`
- Row click: expande inline mostrando N4 capabilities do grupo com seus status individuais

### 4.5 SECAO E: Decommissioning Roadmap (expandido)

```
+---------------------------------------------------------------------------+
| ROADMAP DE DESCOMISSIONAMENTO                          [Por urgencia v]   |
| Plano de saida de sistemas legados -- AFR                                 |
+---------------------------------------------------------------------------+
|                                                                           |
|  Timeline visual:                                                         |
|                                                                           |
|  Q2/26  Q3/26  Q4/26  Q1/27  Q2/27  Q3/27  Q4/27                        |
|  ---|------|------|------|------|------|------|----                        |
|  [==Traksys (BP, PP)===>X]                                                |
|            [=====Suite 360 (QL, MT)=========>X]                           |
|                   [===Local LIMS (QL)=======>?]     (? = sem data)        |
|                                                                           |
+---------------------------------------------------------------------------+
|                                                                           |
|  +-- Traksys -------------------------------------------------------+    |
|  | Dominios: BP, PP  |  Sites Legacy: 12  |  Paridade Global: 67%   |    |
|  | Substituto: Omnia LMS + Omnia OM                                  |    |
|  | Bloqueios: 4 N4 capabilities em Gap (sem previsao)                |    |
|  | [Ver capabilities faltantes]                                      |    |
|  +-------------------------------------------------------------------+    |
|                                                                           |
|  +-- Suite 360 -----------------------------------------------------+    |
|  | Dominios: QL, MT  |  Sites Legacy: 8   |  Paridade Global: 52%   |    |
|  | Substituto: Omnia IQ + SAP PM                                     |    |
|  | Bloqueios: 11 N4 capabilities em Gap                              |    |
|  | Previsao paridade: Q3/2027                                        |    |
|  | [Ver capabilities faltantes]                                      |    |
|  +-------------------------------------------------------------------+    |
|                                                                           |
+---------------------------------------------------------------------------+
```

**Especificacoes do Roadmap:**
- Timeline visual: SVG horizontal, barras por sistema legado
  - Barra: `height: 20px`, rounded, cor por urgencia
  - Fim com data: marcador `X` em verde
  - Fim sem data: marcador `?` em vermelho
  - Eixo: trimestres, alinhado com Secao C
- Cards de detalhe: `rounded-lg border p-4`
  - Grid interno: `grid-cols-3 gap-4` para metricas
  - Progress bar de paridade global: mesma spec da Secao B
  - Botao "Ver capabilities faltantes": filtra Secao D para o legacy selecionado
  - Border-left: `4px` na cor de urgencia do legado

### 4.6 SECAO F: Export Strip (sticky bottom ou floating)

```
+---------------------------------------------------------------------------+
| [Exportar Resumo Executivo (1pg PDF)] [Gap Report (CSV)] [Copiar KPIs]   |
+---------------------------------------------------------------------------+
```

**Especificacoes:**
- Posicao: inline ao fim da pagina (nao sticky)
- Botao primario: ambar/dourado (`bg-amber-500 text-white hover:bg-amber-600`)
- Botoes secundarios: `bg-gray-100 text-gray-700 border`
- Copy KPIs: copia os 5 KPIs em texto formatado para clipboard

---

## 5. Componentes Celebration DS Utilizados

| Componente | Variante | Estado | Uso |
|---|---|---|---|
| Button | Primary (Amber) | default/hover/disabled | Export, Zone Selector ativo |
| Button | Secondary | default/hover | Zone Selector inativo, filtros |
| Button | Tertiary | default/hover | Links internos, "Ver capabilities" |
| Card | Elevated SM | default | KPI Hero cards |
| Card | Flat | default | Domain Heatmap cells |
| Card | Bordered | default/hover | Decom Roadmap items |
| Tag | Status | success/warning/danger/neutral | READY/Planejado/Gap/Absent |
| Badge | Count | default | Site counts, capability counts |
| Tooltip | Default | hover | Heatmap detail, Timeline markers |
| Table | Sortable | default/hover/active-sort | Gap Detail Table |
| Pagination | Default | default | Gap Detail Table |
| Select | Single | default | Status filter, Domain filter |
| Search | Default | default/focus | Busca na Gap Table |
| Tabs | Horizontal | active/inactive | N/A -- removido, fluxo unico |
| Progress Bar | Segmented | success/warning/danger | Parity bars, decom readiness |
| Loading | Skeleton | loading | Fetch de capabilities JSON |
| Alert | Warning | default | Dados incompletos para zona |
| Icon | Systemic | default | Chevrons, export, filter |

---

## 6. Token Mapping

### 6.1 Paleta Semantica: Status de Paridade

| Status | Hex Light | Hex Dark | CSS var sugerida | Uso |
|---|---|---|---|---|
| Global Leading | `#10b981` bg:`#ecfdf5` | `#34d399` bg:`rgba(16,185,129,0.12)` | `--status-leading` | Dominio pronto, KPI no target |
| Approaching | `#f59e0b` bg:`#fffbeb` | `#fbbf24` bg:`rgba(245,158,11,0.12)` | `--status-approaching` | Em transicao, 30-69% |
| Legacy Dominant | `#ef4444` bg:`#fef2f2` | `#f87171` bg:`rgba(239,68,68,0.12)` | `--status-legacy` | Legacy prevalece, < 30% |
| Absent | `#6b7280` bg:`#f9fafb` | `#9ca3af` bg:`rgba(107,114,128,0.12)` | `--status-absent` | Sem produto global |

### 6.2 Paleta Semantica: Status de Capability

| Status | Hex Light | Hex Dark | Uso |
|---|---|---|---|
| READY | `#10b981` text / `#d1fae5` bg | `#34d399` text / `rgba(16,185,129,0.2)` bg | Capability ativa |
| Planejado (com quarter) | `#f59e0b` text / `#fef3c7` bg | `#fbbf24` text / `rgba(245,158,11,0.2)` bg | Com data prevista |
| Gap (sem previsao) | `#ef4444` text / `#fee2e2` bg | `#f87171` text / `rgba(239,68,68,0.2)` bg | Sem plano -- urgencia maxima |

### 6.3 Urgencia Visual -- Como comunicar pressao

A urgencia visual segue uma logica de 3 canais simultaneos para garantir que o VP perceba em 5 segundos:

1. **Cor de fundo do card/celula** -- gradiente suave (nao saturado) que colore a area
2. **Cor do texto numerico** -- forte e contrastante
3. **Border-left ou border-top** -- 3-4px solid na cor primaria do status

Quando um dominio esta em "Legacy Dominant", os 3 canais ativam em vermelho simultaneamente. Isso e suficiente sem usar animacoes ou icones de alerta (que cansam em dashboards executivos).

### 6.4 Spacing Tokens

| Elemento | Token | Valor |
|---|---|---|
| Gap entre KPI cards | `gap-4` | 16px |
| Padding interno card | `p-5` | 20px |
| Gap entre secoes | `space-y-6` | 24px |
| Padding do heatmap cell | `p-3` | 12px |
| Margin entre label e metrica | `mb-1` | 4px |
| Table cell padding | `px-3 py-2.5` | 12px / 10px |

### 6.5 Elevation

| Elemento | Level | Tailwind |
|---|---|---|
| KPI Hero cards | SM | `shadow-sm` |
| Domain Heatmap container | MD (border only) | `border rounded-xl` |
| Tooltip | LG | `shadow-lg` |
| Export buttons | None | flat |

### 6.6 Typography Scale

| Elemento | Size | Weight | Class |
|---|---|---|---|
| Page title | 18px | 900 (black) | `text-lg font-black` |
| KPI metric principal | 36px | 900 | `text-4xl font-black tabular-nums` |
| Heatmap % | 24px | 900 | `text-2xl font-black tabular-nums` |
| Section header | 10px | 900 uppercase | `text-[10px] font-black uppercase tracking-widest` |
| Table header | 10px | 700 | `text-[10px] font-bold` |
| Table body | 11px | 400/500 | `text-[11px]` |
| Sublabel/meta | 10px | 400 | `text-[10px]` |
| Status pill | 9px | 700 | `text-[9px] font-bold` |

---

## 7. Visualizacoes Propostas -- Decisao por tipo de dado

### 7.1 Gap entre Global e Zona

**Visualizacao:** KPI card com progress bar horizontal + delta numerico

**Racional:** O VP quer um numero ("estou em 62%") e uma meta ("preciso chegar em 85%"). Progress bar e a visualizacao mais direta para gap. O delta numerico ("faltam 23pp") complementa sem exigir interpretacao.

**Implementacao:** SVG rect com width proporcional a %, marker da meta em 85%, label acima.

### 7.2 Timeline de Paridade

**Visualizacao:** Area chart SVG com projecao linear

**Racional:** O VP precisa de narrativa temporal -- "estou melhorando?" e "quando chego?". Area chart mostra acumulo de paridade ao longo do tempo. A projecao linear (tracos) mostra o cenario se manter velocidade atual. Markers discretos para eventos de decommissioning conectam as duas narrativas.

**Alternativas descartadas:**
- Bar chart por trimestre: perde a narrativa de tendencia
- Stacked area por dominio: excessivamente complexo para VP; drill-down por dominio fica na tabela

### 7.3 Legados vs Global (urgencia de decommissioning)

**Visualizacao:** Gantt horizontal simplificado (barras por sistema legado) + cards de detalhe

**Racional:** A urgencia de decommissioning tem dimensao temporal (quando?) e dimensional (quantos sites impactados?). Gantt mostra o "quando" de forma intuitiva. Cards abaixo mostram o "quantos/o que falta" com progress bars.

**Alternativas descartadas:**
- Lista rankeada (atual): nao tem dimensao temporal
- Treemap: nao mostra sequencia

### 7.4 Cross-zone comparison

**Visualizacao:** Heatmap de celulas coloridas (dominio x zona) SUBSTITUINDO a dot matrix atual

**Racional:** A matrix atual usa dots coloridos que sao dificeis de ler (muito pequenos, sem hierarquia). O heatmap com celulas maiores, % numerico e cor de fundo forte da leitura instantanea. A interacao e simples: hover para detalhe, click para filtrar.

**Mudanca chave vs. atual:** O cross-zone matrix deixa de ser uma secao separada e se integra opcionalmente via toggle "Comparar Zonas" que expande o heatmap da Secao B para mostrar todas as zonas em vez de apenas a selecionada.

```
  Toggle: [Zona selecionada] / [Todas as zonas]

  Modo "Todas as zonas":

           BP    PP    QL    MT    MG    SF    DA    MDM   UT
  AFR     78%   45%   82%   61%   34%   71%   89%   52%   68%
  SAZ     85%   72%   79%   58%   67%   63%   91%   74%   72%
  MAZ     62%   38%   71%   45%   29%   55%   78%   41%   60%
  NAZ     70%   55%   68%   52%   45%   60%   82%   58%   65%
  EUR     88%   80%   90%   75%   72%   78%   95%   82%   85%
  APAC    55%   40%   60%   42%   35%   48%   70%   38%   52%
```

---

## 8. Capability Tree Redesign

### 8.1 Problema

A arvore atual tem 5 niveis de profundidade (Subarea -> N1 -> N2 -> N3 -> N4) com 1679 registros N4. Para um VP, isso e ilegivel. Para um Gerente de Transformacao, e util mas mal navegavel.

### 8.2 Solucao: Vista resumida (padrao) + Vista detalhada (on-demand)

**Vista Resumida (Gap Detail Table -- Secao D):**
- Agrupa N4 capabilities por N2 parent
- Exibe 1 linha por grupo N2
- Colunas: Dominio, Capability (N2 name), Produto Global, Status (badge), Previsto, Legacy
- Status do grupo N2:
  - READY: 100% dos N4 filhos em READY
  - Planejado: algum N4 planejado, nenhum Gap
  - Parcial: mix de READY + Gap
  - Gap: todos N4 em Gap
- Tooltip ou expand inline mostra os N4 individuais ao clicar na linha

**Vista Detalhada (expand inline):**
- Ao clicar em uma linha da tabela N2, expande abaixo mostrando:
  - Lista flat de N4 capabilities daquele grupo
  - Cada N4 com: nome, status badge, quarter planejado, legacy coverage chips
  - Background alternado para separar do conteudo da tabela pai

### 8.3 Indicacao visual de status nos nodes

```
  READY:     [============================] 100%   badge verde
  Parcial:   [=================-----------]  65%   badge ambar com fração "11/17"
  Planejado: [============................]  45%   badge ambar com quarter "Q3/26"
  Gap:       [............................]   0%   badge vermelho
```

A progress bar e a visualizacao primaria. O badge textual e redundancia intencional para acessibilidade e legibilidade em projetores.

---

## 9. Acessibilidade

### 9.1 ARIA Labels

| Elemento | aria-label | Nota |
|---|---|---|
| Zone Selector | `aria-label="Selecionar zona"` | Grupo de radio buttons semanticamente |
| KPI Card | `aria-label="Global Parity Index: 62%, meta 85%"` | Valor + contexto |
| Heatmap Cell | `aria-label="Brewing Performance: 78% paridade, status Global Leading"` | Dominio + valor + status |
| Timeline SVG | `role="img" aria-label="Grafico de evolucao de paridade trimestral"` | Descritivo |
| Status Badge | `aria-label="Status: Ready"` | Nao depender so de cor |
| Table Sort | `aria-sort="ascending"` | Estado de ordenacao |

### 9.2 Contraste

- Todos os textos atendem WCAG AA (4.5:1 para texto normal, 3:1 para texto grande)
- Badges de status usam texto colorido + background, nunca so cor
- Heatmap cells usam numero + cor + label textual (tripla codificacao)
- Dark mode: hex ajustados para manter ratio (valores light/dark distintos na paleta)

### 9.3 Area de Toque

- Zone selector buttons: minimo `44px` height (py-2.5 + text = ~40px, ajustar para 44)
- Table rows: `min-h-[44px]`
- Timeline markers: invisible rect `24x24px` para hover/click
- Export buttons: `px-4 py-2.5` minimo

### 9.4 Navegacao por Teclado

- Zone selector: arrow keys para navegar, Enter/Space para selecionar
- Heatmap: Tab percorre celulas, Enter filtra
- Table: Tab para filtros, Enter para sort, Tab+Enter para expand row
- Export: Tab navega entre botoes, Enter aciona

---

## 10. Estados

### 10.1 Loading

```
+-----------+  +-----------+  +-----------+  +-----------+  +-----------+
| [=====]   |  | [=====]   |  | [=====]   |  | [=====]   |  | [=====]   |
| [====]    |  | [====]    |  | [====]    |  | [====]    |  | [====]    |
| [==]      |  | [==]      |  | [==]      |  | [==]      |  | [==]      |
+-----------+  +-----------+  +-----------+  +-----------+  +-----------+
             animate-pulse em todos os blocos

+-------+-------+-------+-------+-------+-------+-------+-------+-------+
| [===] | [===] | [===] | [===] | [===] | [===] | [===] | [===] | [===] |
+-------+-------+-------+-------+-------+-------+-------+-------+-------+
             heatmap skeleton: 9 celulas pulsando
```

- Skeleton shapes respeitam o layout final (mesmas proporcoes)
- `animate-pulse` com cor `bg-gray-200/bg-gray-700`
- Apos 3 segundos sem resposta: mensagem "Carregando dados de cobertura..."

### 10.2 Error

```
+---------------------------------------------------------------------------+
|                          [!]                                              |
|                                                                           |
|     Falha ao carregar dados de cobertura de produto.                      |
|                                                                           |
|     Verifique se product-coverage-2026.json esta em                       |
|     client/public/ e recarregue a pagina.                                 |
|                                                                           |
|     [Tentar novamente]                                                    |
+---------------------------------------------------------------------------+
```

- Card centralizado com icone de warning
- Mensagem em linguagem nao-tecnica quando possivel
- Botao de retry primario
- Nao mostrar stack trace ou nomes de arquivo para VP (apenas para dev via console)

### 10.3 Empty (dados incompletos para zona)

```
+-----------+  +-----------+  +-----------+  +-----------+  +-----------+
|    --     |  |  -- de 9  |  |    --     |  |    --     |  |    --     |
| Global    |  | Dominios  |  | Legados   |  | Decom     |  | Prox.    |
| Parity    |  | Prontos   |  | Expostos  |  | Velocity  |  | Trim.    |
+-----------+  +-----------+  +-----------+  +-----------+  +-----------+

+---------------------------------------------------------------------------+
| [i] Dados incompletos para NAZ                                            |
|     Os dados de cobertura de produto para esta zona nao estao             |
|     disponiveis nesta versao. Entre em contato com o time de dados.       |
+---------------------------------------------------------------------------+
```

- KPI cards mostram "--" em cinza (nao zero)
- Alert banner info (azul) com explicacao
- Heatmap cells com `bg-striped` pattern e "N/D"

### 10.4 Success (estado normal)

O estado normal e o layout descrito nas secoes 4.1 a 4.6 com dados populados e cores semanticas ativas.

---

## 11. Fluxo de Navegacao

```
[Portfolio Intelligence]
        |
        v
  Zone Selector --> muda TODAS as secoes abaixo
        |
        v
  KPI Hero Strip (leitura passiva)
        |
        v
  Domain Heatmap
        |--- hover --> Tooltip: top gaps
        |--- click --> Filtra Secoes D e E por dominio
        |--- toggle "Todas as zonas" --> Expande para cross-zone matrix
        |
        v
  Parity Timeline (leitura passiva, hover para detalhes)
        |--- hover trimestre --> Popup: N capabilities, M decom
        |
        v
  Gap Detail Table
        |--- filtros inline --> Status, Dominio, Trimestre
        |--- click row --> Expand: N4 capabilities individuais
        |--- paginacao
        |
        v
  Decommissioning Roadmap
        |--- click legado --> Filtra Gap Table para capabilities do legado
        |--- click "Ver capabilities" --> Scroll to Gap Table filtrada
        |
        v
  Export Strip
        |--- PDF (1pg executivo)
        |--- CSV (gap completo)
        |--- Copy KPIs (clipboard)
```

---

## 12. Consideracoes de Implementacao

### 12.1 Restricoes tecnicas

- **Componente unico:** Todo o codigo permanece em App.tsx. A PortfolioIntelligenceView ja e um componente funcional isolado (~950 linhas). O redesign substitui o JSX interno sem alterar a interface.
- **Sem biblioteca de charts:** Timeline (Secao C) e Gantt (Secao E) sao SVG inline. O dashboard ja tem precedente de SVG inline (sparklines em MaturityLevelTable, scatter plot).
- **Dados no frontend:** Tudo ja carregado. `portfolio_capabilities.json` e fetched lazily (ja implementado). `product-coverage-2026.json` tambem. Nenhuma nova chamada backend.

### 12.2 Mapeamento de dados existentes para KPIs novos

| KPI | Formula | Dados fonte | Ja existe? |
|---|---|---|---|
| Global Parity Index | `capData.filter(READY).length / capData.length * 100` filtrado por zona | `portfolio_capabilities.json` | Dados existem, calculo novo |
| Domain Readiness | `domains.filter(parityPct > 70).length + " of 9"` | `computePortfolioMatrix()` ja calcula | Parcial -- reorganizar |
| Legacy Exposure | `LOCAL_SYSTEMS[zone].filter(sem planned_year).length` | `LOCAL_SYSTEMS` constante inline | Dados existem, contagem nova |
| Decom Velocity | Requer historico -- nao disponivel | N/A | **NAO EXISTE** -- usar placeholder "Em breve" |
| Next Quarter Delta | `capData.filter(planned_quarter === nextQ && status !== 'READY').length` | `portfolio_capabilities.json` | Dados existem, filtro novo |

**Nota critica:** Decom Velocity requer dados temporais que nao existem. Opcoes:
1. Exibir card com "--" e mensagem "Requer baseline historico"
2. Calcular um proxy: % de capabilities que mudaram de NOT READY para READY entre versoes do JSON
3. Omitir e manter 4 KPIs ate haver dados

**Recomendacao:** Opcao 1 -- exibir com "--" e nota. Nao omitir, para que o VP pergunte pelo dado e force a coleta.

### 12.3 Reutilizacao de logica existente

| Funcao existente | Linha aprox. | Reutilizar para |
|---|---|---|
| `computePortfolioMatrix()` | 3823 | Domain Readiness KPI, Heatmap |
| `statusColors` object | 3920 | Toda a paleta de status |
| `decommCandidates` useMemo | 4021 | Secao E Roadmap expandido |
| `capTree` useMemo | 4083 | Fonte de dados para Gap Table (flatten tree) |
| `decommReadiness` useMemo | 4109 | Progress bars do Roadmap |
| `fmtScore`, `fmtPct` | 4004 | Formatadores de numero |

### 12.4 SVG Timeline -- Estrutura basica

```tsx
// Pseudo-codigo para o dev frontend
const TIMELINE_W = 800, TIMELINE_H = 240;
const quarters = ['Q1/26','Q2/26','Q3/26','Q4/26','Q1/27','Q2/27','Q3/27','Q4/27'];
const parityByQ = computeParityByQuarter(capData, zone); // novo helper

<svg viewBox={`0 0 ${TIMELINE_W} ${TIMELINE_H}`} className="w-full">
  {/* Grid lines */}
  {[0,20,40,60,80,100].map(pct => (
    <line x1={40} y1={y(pct)} x2={TIMELINE_W-20} y2={y(pct)}
          stroke={dark?'#374151':'#e5e7eb'} strokeDasharray="2,4" />
  ))}
  {/* Meta 85% line */}
  <line x1={40} y1={y(85)} x2={TIMELINE_W-20} y2={y(85)}
        stroke="#f59e0b" strokeDasharray="4,4" strokeWidth={1.5} />
  {/* Area fill */}
  <path d={areaPath(parityByQ)} fill="rgba(16,185,129,0.15)" />
  {/* Line */}
  <path d={linePath(parityByQ)} fill="none" stroke="#10b981" strokeWidth={2} />
  {/* Projection dashed */}
  <path d={projPath(parityByQ)} fill="none" stroke="#10b981" strokeWidth={1.5}
        strokeDasharray="6,4" />
  {/* Quarter labels */}
  {quarters.map((q,i) => (
    <text x={x(i)} y={TIMELINE_H-5} textAnchor="middle"
          className="text-[10px] fill-gray-500">{q}</text>
  ))}
</svg>
```

### 12.5 Breakpoints

| Breakpoint | Layout |
|---|---|
| >= 1920px (target) | 5-col KPI grid, 9-col heatmap, full timeline |
| 1440px | 5-col KPI grid (tighter), 9-col heatmap, full timeline |
| 1280px | 3+2 KPI grid (3 top, 2 bottom), 5+4 heatmap rows, timeline full |
| < 1024px | 2-col KPI, heatmap scrollable horizontal, timeline reduced |

**Target principal:** 1920px. Nao otimizar para mobile -- este e dashboard executivo desktop.

### 12.6 Performance

- Gap Detail Table com 1679 N4 capabilities: usar paginacao (30/page) para evitar render de 1679 rows
- Timeline SVG: calcular `parityByQ` apenas quando `capData` ou `selectedZone` mudam (useMemo)
- Heatmap: 9 x 6 = 54 celulas no modo cross-zone -- render trivial
- Flatten tree (5 niveis -> tabela N2): transformacao one-time no useMemo, nao re-calcular a cada render

---

## 13. O que REMOVER do layout atual

| Elemento atual | Linha aprox. | Motivo | Destino da informacao |
|---|---|---|---|
| Sub-tab switcher (deployment/capabilities) | 4198-4215 | VP nao navega sub-tabs | Fluxo unico |
| Capability tree 5 niveis | 4276-4420 | Excessivamente tecnico | Gap Detail Table flat |
| Parity filter pills (4 estados) | 4498-4513 | Redundante com heatmap clickavel | Heatmap cell click |
| Domain cards expandidos com barras por zona | 4516-4684 | Muito densos | Heatmap + Gap Table |
| Cross-zone dot matrix | 4686-4748 | Dificil de ler | Heatmap cross-zone |
| Top-5 decommissioning sem timeline | 4750-4816 | Sem dimensao temporal | Roadmap com Gantt |

---

## 14. Checklist de Entrega para o Dev Frontend

- [ ] Criar helper `computeParityByQuarter(capData, zone)` que retorna `{quarter, parityPct, newCaps, decomEvents}[]`
- [ ] Criar helper `flattenCapTreeToN2(capTree)` que retorna array flat agrupado por N2
- [ ] Implementar KPI Hero Strip (Secao A) com 5 cards
- [ ] Implementar Domain Heatmap (Secao B) com toggle zona/cross-zone
- [ ] Implementar Parity Timeline SVG (Secao C)
- [ ] Implementar Gap Detail Table (Secao D) com flatten tree, paginacao, filtros
- [ ] Implementar Decom Roadmap expandido (Secao E) com Gantt SVG + cards
- [ ] Implementar Export Strip (Secao F) -- reutilizar logica de export existente
- [ ] Remover sub-tab switcher, capability tree, filter pills, cross-zone dot matrix
- [ ] Testar skeleton loading state
- [ ] Testar empty state (zona sem dados)
- [ ] Testar error state (JSON nao encontrado)
- [ ] Verificar contraste WCAG AA em light e dark mode
- [ ] Testar em 1920px e 1440px

---

*Spec gerada em 2026-04-04 pelo UX/UI Designer -- Dev Crew AB InBev*
*Fonte de verdade para implementacao. Duvidas: abrir thread no canal do projeto.*
