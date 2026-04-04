# Sprint Planning Brief — Coverage Assessment Dashboard

**Data:** 2026-04-03
**Audiência:** Digital Manufacturing Director / Zone Lead
**Contexto:** Deep dive pré-ciclo de revisão completa. Diagnóstico baseado em leitura integral do App.tsx (6.007 linhas), CLAUDE.md e docs/maturity_detail.json.

---

## A. Inventário de telas/views existentes

### 1. Por Zona (`view = 'zone'`)

**Propósito:** Funil L0→L4 por zona e total global. A tela principal.

**Dados exibidos:** FunnelCard por zona (AFR, SAZ, MAZ, NAZ, EUR, APAC + Total Global), percentuais cumulativos, score médio, tooltip de sites exclusivos por nível. Filtros: Volume (G1/G2/G3) e Complexidade de Mix (L/M/H) via sidebar.

**O que funciona bem:**
- Funil cumulativo com lógica correta (L0=100% base fixo).
- Tooltip click-only com paginação — funcional e sem bugs de scroll.
- Sidebar com Glide Path sempre visível contextualiza os níveis.

**O que está confuso:**
- Filtro "Complexidade do Mix" exige tooltip de `title` para ser entendido. É invisível para quem não passa o mouse.
- Score médio exibido no FunnelCard (ex: "1.84") não tem interpretação direta — o usuário não sabe se é bom ou ruim sem contexto de benchmark.
- Tabs "Total Global" + 6 zonas são redundantes com o funil Total — os dados são os mesmos vistos de ângulos diferentes sem ganho adicional.

**O que está faltando:**
- Nenhuma indicação de tendência temporal. O Zone Lead não sabe se a zona melhorou ou piorou desde a última medição.
- Sem ligação entre o nível de maturidade e KPIs operacionais nessa tela. A conexão OSE/TTP existe em outra view, mas quem está aqui não vê o contexto.
- GHQ (headcount total por nível) é calculado mas pouco comunicado — o dado está ali mas perdido.

---

### 2. Por Domínio (`view = 'domain'`)

**Propósito:** Funil L0→L4 por domínio tecnológico (BP, DA, UT, MT, MG, MDM, PP, QL, SF).

**Dados exibidos:** Mesmos FunnelCards, filtrados por domínio + zona (tabs). 10 domínios + tabs por zona.

**O que funciona bem:**
- Permite identificar domínios críticos que travam o nível global de um site.

**O que está confuso:**
- 10 domínios × 7 tabs = 70 combinações possíveis. Navegação por tab horizontal em cards de funil não é escalável — o usuário perde o contexto de onde está.
- Não há ordenação por prioridade. Quais domínios estão mais atrasados? Quais travam mais sites?

**O que está faltando:**
- Heatmap resumido Zona × Domínio (já existe em `CapabilityGapView` na aba "Resumo por Zona" — mas o usuário não sabe disso).
- Indicação de quais domínios têm produto Global disponível vs apenas Legacy — a informação está em `SITE_DOMAIN_TYPE` mas não aparece nessa view.

---

### 3. Por Site (`view = 'sites'`, componente `SitesView`)

**Propósito:** Tabela de todos os 163 sites com score médio, scores por domínio, zona, volume, grupo.

**Dados exibidos:** Tabela com busca full-text por site ou país, ordenação por nome/zona/volume/score. Bolinha colorida com anel G/L por domínio.

**O que funciona bem:**
- Busca full-text funciona bem. A bolinha com anel G/L é o melhor artefato informacional do dashboard — muito do contexto operacional está ali.

**O que está confuso:**
- Sem filtro por nível (ex: "mostrar só sites L1"). Para um Zone Lead que quer "quem está preso no L1?", exige scroll manual.
- Sem indicação de qual site está mais próximo de subir de nível — a oportunidade mais fácil não está destacada.
- Score médio na coluna "Avg" inclui domínios sem produto ativo, o que distorce a leitura.

**O que está faltando:**
- Coluna de KPI operacional (OSE/TTP) ao lado do score de maturidade. O join de dados existe (via `PLANT_TO_SITE_OVERRIDE` + Anaplan JSON), mas não aparece aqui.
- Coluna "gap para próximo nível" — quantos pontos faltam.
- Indicador de qual domínio específico está bloqueando cada site.

---

### 4. Maturidade vs Resultados (`view = 'maturityVsResults'`)

**Propósito:** Análise analítica cruzando maturidade tecnológica com KPIs Anaplan (OSE, TTP) e VPO.

**Dados exibidos:** 4 blocos principais — (a) TriDimensionalView com matriz de correlações e quadrantes estratégicos clicáveis, (b) MaturityLevelTable com OSE/TTP médio por nível L0→L4, (c) Correlação por domínio, (d) Análise por zona com comparação OSE/TTP. Requer arquivo `anaplan-kpis-2025.json` + `vpo-site-scores-2026.json`.

**O que funciona bem:**
- A Tri-Dimensional View é genuinamente poderosa. Matriz de 5 correlações + 4 quadrantes clicáveis é o conteúdo mais sofisticado do dashboard.
- Narrativa auto-gerada dos quadrantes é boa — economiza interpretação.
- SparkBar na MaturityLevelTable é visualmente eficiente.

**O que está confuso:**
- Essa view é a mais valiosa estrategicamente mas é a mais escondida — terceiro item na barra de navegação sem hierarquia.
- A mensagem de erro "Nenhum dado Anaplan carregado" aparece em plain text sem instrução clara para o Zone Lead — só para o desenvolvedor.
- Filtros de "Perfil de produto" e "Complexidade" no topo são opções avançadas que confundem quem só quer ver o resultado global.
- Não há persistência de estado: trocar de view e voltar limpa os filtros.

**O que está faltando:**
- Scatter plot visual de sites (eixo X = maturidade, eixo Y = OSE) — a tabela de correlação é correta mas não intuitiva.
- Interpretação do limiar VPO de forma mais direta: "Se VPO < 80%, investir em tech não vai mover OSE." Esse insight existe na narrativa mas está sepultado.

---

### 5. Portfolio Intelligence (`view = 'portfolioIntelligence'`)

**Propósito:** Análise Global vs Legacy por domínio e zona — base para conversas de descomissionamento.

**Dados exibidos:** Matriz Domínio × Zona com status de paridade (Global Liderando / Aprox. Paridade / Legacy Dominante), % de cobertura Global, score médio Global vs Legacy, readiness de descomissionamento. Requer `product-coverage-2026.json`.

**O que funciona bem:**
- Conceito forte: a visão de paridade Global/Legacy é única e tem valor estratégico real para decisões de portfólio.
- `decommReady` flag automatiza uma decisão que levaria horas em planilha.

**O que está confuso:**
- A seleção de zona no dropdown some sem feedback quando não há dados carregados — o usuário vê uma tela em branco.
- "Aprox. Paridade" e "Legacy Dominante" são julgamentos com thresholds hardcoded (0.70, 0.30) não explicados na UI.
- Local systems (Traksys, Suite 360) têm dados de AFR/MAZ mas NAZ e SAZ têm "FULL GAP" anotado no código — e a UI não comunica isso.

**O que está faltando:**
- Plano de ação concreto por domínio-zona: "Para descomissionar Traksys em MAZ, BP precisa ir de L1.8 para L2.5 em 12 sites."
- Linha de tempo estimada para paridade com base na velocidade atual de deploy.

---

### 6. Gap de Capacidade (`view = 'capabilityGap'`)

**Propósito:** Análise baseada em capacidades N3/N4 do `maturity_detail.json` — mais granular que o score CSV.

**Dados exibidos:** Duas sub-views: "Resumo por Zona" (heatmap Zona × Domínio com avgScore + frac L2/L3) e "Matriz de Sites" (tabela de todos os sites com score de capacidade e domínio bloqueante). Click em linha abre `CapabilitySiteDetail` com barras de progresso L1→L4 por domínio.

**O que funciona bem:**
- `CapabilitySiteDetail` é o melhor artefato de diagnóstico do dashboard. Mostra exatamente onde cada site está em cada nível de cada domínio, com barra de progresso vs gate.
- Heatmap Zona × Domínio no "Resumo" resolve o problema de navegação que a view "Por Domínio" tem.

**O que está confuso:**
- "Este score pode diferir do overview (metodologia mais rigorosa)" aparece como nota pequena. Não é nota — é informação central. Ter dois scores diferentes para o mesmo site sem explicação clara corrói a confiança.
- A sub-view "Resumo por Zona" e "Matriz de Sites" não são integradas — o usuário clica na zona no resumo mas não fica com o contexto de qual zona estava selecionando ao ir para sites.
- Filtro de "Nível atual" na matriz de sites usa o score de capacidade mas o label "L1/L2" remete ao score do CSV — ambiguidade que não é resolvida.

**O que está faltando:**
- Link direto da `CapabilitySiteDetail` para a view de Maturidade × Resultados filtrada por aquele site — o diagnóstico não tem continuação.
- Capacidade de comparar dois sites lado a lado (ex: site que subiu de L1 para L2 vs site preso em L1 — o que os diferencia?).

---

## B. Gaps de experiência vs. job-to-be-done estratégico

### Job 1: Entender onde estão os sites na jornada L0→L4

**Status: COBERTO — com ressalvas de UX**

O funil por zona existe e funciona. O heatmap Zona × Domínio no CapabilityGap resolve a visão cruzada. O problema é que esses dois artefatos estão em views separadas sem conexão visual. O Zone Lead que abre o dashboard pela primeira vez não tem uma tela de entrada que mostre "onde estamos" de forma executiva — cai direto num funil técnico.

Falta: uma tela de resumo executivo (não existe nenhuma view com esse propósito explícito) que responda "Zona X: N% em L2+, melhorou Y pp desde última medição."

---

### Job 2: Identificar o que está bloqueando cada site de subir de nível

**Status: PARCIALMENTE COBERTO**

`CapabilitySiteDetail` resolve isso site a site — é genuinamente bom. O problema é o caminho até lá: navegar por seis telas de navegação, selecionar uma zona, abrir uma sub-view, clicar em uma linha.

Falta: um atalho direto na view "Por Site" (tabela) que mostre o domínio bloqueante de cada site em coluna adicional, com link para o detalhe. O dado existe em `maturity_detail.json` mas não aparece na tabela.

---

### Job 3: Cruzar maturidade com evolução de KPIs operacionais (OSE, TTP, TPE)

**Status: PARCIALMENTE COBERTO — dado existe, experiência é fraca**

`MaturityVsResultsView` tem os dados quando os arquivos JSON estão presentes. O cruzamento Maturity × OSE existe e a correlação é calculada corretamente. Porém:

- Não há visualização site-a-site (scatter plot). O Zone Lead quer ver "onde está a minha planta?", não uma tabela de médias por nível.
- Série histórica não existe. A view mostra YTD estático — não há tendência.
- TPE, TEL e CO2 não estão incluídos — apenas OSE e TTP. Os demais KPIs mencionados no CLAUDE.md (`PG-K4039`, `PG-R0060`) têm fallback mas sem UI para exibição direta.

---

### Job 4: Preparar conversas com plantas sobre priorização de capacidades

**Status: FRAGILMENTE COBERTO**

`MigrationView` (dentro de `MaturityVsResultsView`) tem a estrutura "Por Nível" e "Por Site" com domínios bloqueantes. Mas está integrada a uma view analítica pesada, sem formato exportável para conversas.

O PDF export existe mas gera um relatório denso sem estrutura de "o que a planta precisa fazer". A lógica de pré-requisitos VPO está no texto do CLAUDE.md mas não aparece na UI — o Zone Lead não vê "essa planta não deve receber investimento tech ainda porque VPO < 80%".

Falta: um "site brief" exportável — 1 página por site com: nível atual, domínio bloqueante, próximo passo, OSE atual vs potencial.

---

### Job 5: Monitorar progresso ao longo do tempo

**Status: AUSENTE**

Não existe nenhuma funcionalidade de série histórica no dashboard. Todos os dados são snapshot. O arquivo `kpi-history.json` existe em `client/public/` mas não há componente que o consuma. Isso é o gap mais crítico para o propósito de "acompanhamento" que o dashboard propõe — sem tendência, não é possível saber se o programa está funcionando.

---

## C. Oportunidades de melhoria priorizadas

### P1 — Impacto alto, esforço baixo/médio

**C1. Coluna de KPI operacional na view "Por Site"**
- Problema: a tabela de sites não mostra OSE/TTP — a informação mais relevante para o Zone Lead.
- O que fazer: adicionar colunas `OSE` e `TTP` na `SitesView` usando o join via `normalizePlantToSite` + `anaplanData`. O join já existe e funciona em `MaturityVsResultsView`.
- Onde em App.tsx: componente `SitesView` (~linha 2149), adicionar 2 colunas à tabela existente e consumir `siteOseTtp` que já é calculado.
- Impacto: o Zone Lead passa a ter numa única tabela: site, zona, volume, nível, OSE, TTP. Hoje esses dados estão em views diferentes.

**C2. Coluna de domínio bloqueante na tabela "Por Site"**
- Problema: o usuário não sabe qual domínio está travando cada site de subir.
- O que fazer: para cada site com score N, calcular qual domínio tem o menor score (o "bloqueante") e exibir como badge colorida. O dado vem de `MATURITY_DETAIL` que já é importado.
- Onde em App.tsx: `SitesView`, adicionar coluna "Bloq." com short do domínio colorido pelo score.
- Impacto: resolve o Job 2 diretamente para todos os 163 sites.

**C3. Filtro por nível atual na view "Por Site"**
- Problema: sem filtro de nível, o usuário não consegue ver "todos os sites L1" facilmente.
- O que fazer: adicionar dropdown de filtro L0/L1/L2/L3/L4 na barra de filtros da `SitesView`. Estado local, filtra `filtered` pelo campo `Math.round(s.scores['Total Global'])`.
- Onde em App.tsx: ~linha 2149, adicionar estado local e filtro.
- Esforço: baixo — 20-30 linhas.

**C4. Alerta de VPO na view "Maturidade vs Resultados"**
- Problema: o insight mais importante do dashboard ("investir em tech sem VPO ≥ 80% não funciona") está enterrado na narrativa de texto.
- O que fazer: adicionar um callout card no topo da view com a conclusão central formatada como decisão: "X% dos sites no filtro estão abaixo do limiar VPO. Para esses sites, o retorno de investimento em tecnologia é marginal."
- Onde em App.tsx: início do JSX de `MaturityVsResultsView` (~linha 4230), antes dos filtros.
- Esforço: baixo — é apresentação de dados já calculados.

---

### P2 — Impacto alto, esforço médio/alto

**C5. Scatter plot maturidade × OSE**
- Problema: a correlação existe como números mas não como visualização. O Zone Lead precisa ver "onde estão os meus sites?" num espaço 2D.
- O que fazer: scatter plot SVG simples (sem biblioteca) com eixo X = score de maturidade (0-4), eixo Y = OSE (%), um ponto por site, coloridos por zona. Ao clicar, abre o `CapabilitySiteDetail`.
- Onde em App.tsx: novo componente `ScatterView` dentro de `MaturityVsResultsView`.
- Esforço: médio — SVG com cálculo de coordenadas + interatividade.

**C6. Tela de resumo executivo como view padrão**
- Problema: não existe uma tela de entrada executiva. O dashboard abre no funil técnico "Por Zona".
- O que fazer: criar nova view `'executive'` como padrão com: (a) 3-4 KPIs globais em destaque (% em L2+, OSE médio, sites com VPO gap), (b) heatmap Zona × Domínio compacto, (c) top 5 oportunidades (sites mais próximos de subir de nível).
- Onde em App.tsx: novo componente `ExecutiveSummaryView`, adicionar `'executive'` ao `ViewMode`, definir como `useState` inicial.
- Esforço: médio — novo componente mas dados todos existem.

**C7. Série histórica de OSE/TTP por zona**
- Problema: `kpi-history.json` existe em `client/public/` mas nenhum componente o consome. Sem tendência, não há acompanhamento de progresso.
- O que fazer: carregar `kpi-history.json` quando `view === 'maturityVsResults'`, exibir sparklines de 6 meses por zona na tabela de análise por zona.
- Onde em App.tsx: adicionar `useState<HistoryData | null>` no `App`, consumir no `MaturityVsResultsView` para renderizar sparklines SVG simples por zona.
- Esforço: médio — requer definir schema de `kpi-history.json` e construir sparkline component.

---

### P3 — Impacto médio, esforço variável

**C8. Reconciliar os dois scores de maturidade**
- Problema: há dois scores para o mesmo site — um do CSV (baseado em L0-4 agregado) e um do `maturity_detail.json` (baseado em frações N3/N4). A nota "Este score pode diferir" corrói confiança.
- O que fazer: ou unificar os scores (usar `maturity_detail` como fonte canônica) ou tornar explícito na UI que são metodologias diferentes e qual usar para qual decisão. Mínimo: adicionar legenda no `CapabilityGapView` e `SitesView` que explica a diferença.
- Esforço: baixo para clarificação de UI; alto para unificação de dados.

**C9. Export "Site Brief" — 1 página por site**
- Problema: o PDF export gera relatório denso sem formato de conversa com planta.
- O que fazer: novo modo de export em `CapabilitySiteDetail` que gera HTML/PDF de 1 página: nível atual, domínio bloqueante, gap de capacidade por domínio, OSE atual, ação recomendada.
- Esforço: médio — requer template HTML adicional no `buildPdfHTML`.

**C10. Comunicar gaps de dados no `LOCAL_SYSTEMS`**
- Problema: NAZ e SAZ têm `FULL GAP` hardcoded no código mas a UI do Portfolio Intelligence não comunica isso — o usuário vê células vazias sem entender por quê.
- O que fazer: badge "Dado incompleto" nas células de zona com gap identificado, com tooltip explicativo.
- Esforço: baixo.

---

## D. Estrutura de sprints sugerida

### Sprint 1 — "O Zone Lead consegue fazer sua revisão mensal" (3 dias)

**Goal:** A view "Por Site" se torna o ponto de entrada operacional — tabela com nível, bloqueante, OSE e TTP numa única tela.

**User stories:**
1. Como Zone Lead, quero ver OSE e TTP de cada site ao lado do score de maturidade, para não precisar cruzar duas views.
   - Critério: colunas OSE% e TTP (hL/h) na `SitesView`, populadas quando `anaplanData` disponível, exibindo "—" quando ausente.
2. Como Zone Lead, quero filtrar a tabela por nível atual (L0, L1, L2...), para focar nos sites num estágio específico.
   - Critério: dropdown de nível na barra de filtros, funciona combinado com os filtros de volume existentes.
3. Como Zone Lead, quero ver qual domínio está bloqueando cada site, para preparar a pauta da revisão.
   - Critério: coluna "Bloq." com short do domínio de menor score, colorida pelo nível. Click leva para `CapabilitySiteDetail`.

**Este sprint traz mais valor imediato** — resolve os Jobs 2 e 3 com esforço mínimo de código.

---

### Sprint 2 — "O dado faz sentido e a narrativa estratégica é clara" (3 dias)

**Goal:** A view "Maturidade vs Resultados" passa a ser o briefing executivo, não uma ferramenta analítica para especialistas.

**User stories:**
1. Como Digital Manufacturing Director, quero ver no topo da análise se minha zona está acima ou abaixo do limiar VPO, para decidir onde recomendar investimento.
   - Critério: callout card com % de sites acima/abaixo de VPO 80%, com recomendação automática ("investir em tech" vs "priorizar VPO").
2. Como Zone Lead, quero ver um scatter plot de sites mostrando maturidade vs OSE, para identificar visualmente os outliers.
   - Critério: SVG com pontos por site, coloridos por zona, com tooltip ao hover mostrando nome, nível e OSE.
3. Como Zone Lead, quero que a view execute com zero configuração — sem mensagem de erro sobre "arquivo não carregado".
   - Critério: quando `anaplanData` ausente, exibir estado placeholder com dados estimados do CLAUDE.md (OSE por zona do histórico), não erro técnico.

---

### Sprint 3 — "O programa tem evidência de progresso" (3 dias)

**Goal:** Dashboard passa de snapshot para ferramenta de acompanhamento de tendência.

**User stories:**
1. Como Zone Lead, quero ver se o OSE médio da minha zona melhorou ou piorou nos últimos 6 meses, para justificar o investimento do programa.
   - Critério: sparklines de 6 meses na tabela de zonas de `MaturityVsResultsView`, consumindo `kpi-history.json`.
2. Como Zone Lead, quero ver a evolução do % de sites em L2+ por zona ao longo do tempo (não só o snapshot atual).
   - Critério: mini-gráfico de tendência na tela "Por Zona" mostrando a série histórica do % L2+ para a zona selecionada.
3. Como Digital Manufacturing Director, quero exportar o briefing de um site específico em 1 página, para usar em conversa de revisão com o gerente da planta.
   - Critério: botão "Export Site Brief" no `CapabilitySiteDetail` gerando PDF de 1 página com: nível, bloqueante, OSE atual, ação recomendada.

---

### Sprint 4 — "Tela de entrada executiva" (3 dias)

**Goal:** O dashboard tem uma view padrão que responde em 10 segundos "como está o programa globalmente?"

**User stories:**
1. Como Digital Manufacturing Director, quero que o dashboard abra com uma visão consolidada global (não o funil técnico), para ter o contexto antes de ir ao detalhe.
   - Critério: nova view `'executive'` como padrão com: % global em L2+, OSE médio global, contagem de sites com VPO gap, heatmap compacto Zona × Domínio.
2. Como Zone Lead, quero ver as top 5 oportunidades — sites mais próximos de subir de nível — para priorizar sem análise manual.
   - Critério: lista ordenada de sites por "gap para próximo nível" (menor gap = maior prioridade), com domínio bloqueante e OSE atual.
3. Como usuário qualquer, quero entender a diferença entre os dois scores de maturidade exibidos no sistema, para confiar nos dados.
   - Critério: modal de ajuda acessível em qualquer view que explica a diferença entre score CSV (snapshot L0-4) e score de capacidade (N3/N4 fractions), com link para metodologia.

---

## Observação final

O dashboard tem mais funcionalidade do que é aparente — está sub-comunicado. Os componentes mais valiosos (`CapabilitySiteDetail`, `TriDimensionalView`, `MaturityLevelTable`) ficam escondidos atrás de múltiplos cliques sem hierarquia de importância. O risco não é falta de dados: é que o Zone Lead usa apenas as primeiras duas views e perde 70% do valor. Os sprints 1 e 2 resolvem isso com menos de 300 linhas de código cada.
