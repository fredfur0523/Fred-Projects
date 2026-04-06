# Validacao Operacional e de Negocio — Portfolio Intelligence Redesign

**Data:** 2026-04-04
**Autor:** BA VPO/Management — Dev Crew
**Escopo:** Aba "Portfolio Intelligence" do coverage-dashboard
**Baseline de dados:** portfolio_capabilities.json (1.679 N4s), product-coverage-2026.json (6 zonas), SITE_DOMAIN_TYPE (163 sites), LOCAL_SYSTEMS, GLOBAL_PRODUCT_LEVELS (~15 produtos)

---

## 1. Modelo Mental do VP de Zona

### 1.1 Como o VP pensa: Dominios, nao Sistemas

O VP de Zona **pensa em dominios** — Brewing, Quality, Packaging, Maintenance — porque e assim que o VPO esta estruturado. Cada dominio tem um Pillar Champion, KPIs proprios (OSE para Packaging, BQI para Quality, OEE/OAE para Brewing) e um ciclo de assessment independente. A conversa de portfolio acontece dentro do contexto do Pillar Review, nao da TI.

Porem, **na hora de tomar decisao de descomissionamento**, o VP muda para linguagem de sistema: "Quando posso desligar o Traksys?", "O Athena ja pode ser substituido?". Isso acontece porque o custo de manutencao e negociado por contrato de sistema, nao por dominio. O dashboard precisa fazer a ponte entre as duas linguagens.

**Recomendacao para o dashboard:**
- Navegacao primaria por dominio (como ja esta implementado)
- Dentro de cada dominio, exibir os sistemas legados nomeados (LOCAL_SYSTEMS) — ja implementado parcialmente
- Adicionar visao "por sistema legado" que consolide todos os dominios que aquele sistema cobre (ex: "Traksys cobre BP + QL em AFR e MAZ — para descomissionar, precisa paridade em ambos os dominios")

### 1.2 Contexto da conversa de portfolio nas reunioes de zona

A conversa de portfolio acontece em dois foros:

1. **VPO Forum / Zone Strategy Review (2x/ano):** O ZBS Director apresenta o status de transformacao digital como parte do 3YP/1YP cycle. Aqui o VP quer ver a posicao relativa da zona vs. target corporativo e vs. outras zonas. O dashboard ja tem a cross-zone matrix — este e o artefato certo para esse foro.

2. **Monthly Business Review (MCRS Tactical):** O PPM (Performance Planning Manager) revisa KPIs de SuEP e conecta maturidade digital com resultados operacionais. Aqui o VP quer drill-down por site: "Qual planta esta presa em Legacy em Packaging? Isso explica o OSE deles?" O dashboard precisa permitir esse fluxo site-by-site.

**Impacto no MCRS:** A tab Portfolio Intelligence gera acoes que devem ser rastreadas no Action Log do MCRS. O dashboard deveria sugerir templates de acao: "Avaliar viabilidade de decommissioning de [sistema] em [zona] para [dominio] — owner: [Pillar Champion], prazo: [Q+1]".

### 1.3 Benchmark de comparacao

O VP compara com tres referencias, em ordem de prioridade:

1. **Target corporativo (mandate):** "100% dos sites em produto global ate 2028 para dominios core." O dashboard deveria ter uma linha de target configuravel.
2. **Melhor zona:** APAC lidera em coverage (63% de N4s com legacy coverage mapeado) e e referencia de best practice. O cross-zone matrix ja permite essa comparacao.
3. **Media global:** Util para posicionamento, mas nao e o driver de decisao.

**Gap no dashboard:** Nenhum target corporativo esta visivel. O VP nao sabe se 70% de coverage e bom ou ruim sem referencia. Recomendacao: adicionar linha/indicador de target (ex: "Target 2027: 85% Global Coverage").

### 1.4 Vocabulario correto

| Termo no dashboard        | Termo VPO correto           | Observacao                                                    |
|----------------------------|-----------------------------|---------------------------------------------------------------|
| Global Leading             | **Global Parity Achieved**  | "Leading" implica competicao; "Parity" e o conceito correto   |
| Approaching Parity         | **Transition Phase**        | "Approaching" e vago; "Transition" indica acao em curso        |
| Legacy Dominant            | **Legacy Dependent**        | "Dominant" tem conotacao positiva; "Dependent" indica risco    |
| Decommissioning Readiness  | **Migration Readiness**     | "Decommissioning" e tecnico; VPO fala em "migracao"           |
| Coverage                   | **Deployment Rate**         | Alinhado com vocabulario de SuEP / BEP assessment             |
| Absent                     | **Gap**                     | Mais direto e ja usado no VPO Assessment scoring              |

---

## 2. Logica de Priorizacao de Decommissioning

### 2.1 Criterios de decisao do VP

Quando um VP decide descomissionar um legado, aplica estes criterios (em ordem):

**Criterio 1 — Mandate corporativo (peso alto)**
Existe mandate global para adotar o produto global? Se sim, o timeline e imposto top-down. O VP nao decide *se* migra, mas *quando*. O campo `planned_year/quarter` no portfolio_capabilities e a proxy desse mandate.

**Criterio 2 — Cobertura funcional do global (peso alto)**
O produto global ja cobre as capacidades que o legado cobre? Medido por: N4s READY no global / N4s total que o legado cobre naquela zona. Se < 80%, migracao forcada causa perda funcional. Os dados atuais mostram:

| Dominio | Total N4s | READY | % | Risco de gap funcional |
|---------|-----------|-------|---|------------------------|
| MT      | 432       | 196   | 45% | Medio — MAX WO/PS cobrem parte |
| MG      | 111       | 66    | 59% | Baixo — Acadia/IALog maduros |
| DA      | 75        | 26    | 34% | Alto — SODA ETL em desenvolvimento |
| PP      | 310       | 69    | 22% | Muito alto — LMS ainda nascente |
| QL      | 331       | 69    | 20% | Muito alto — PTS/IQ incompletos |
| BP      | 221       | 61    | 27% | Alto — Omnia BMS em rollout |
| SF      | 128       | 35    | 27% | Alto — Guardian em expansao |
| MDM     | 40        | 16    | 40% | Medio — SODA MDM estavel |
| UT      | 0         | 0     | 0%  | **Critico** — nenhum N4 mapeado |

**Alerta critico: Utilities (UT) tem ZERO capacidades mapeadas no portfolio_capabilities.json.** Isso significa que o dominio inteiro nao tem roadmap de produto global documentado. Se ha sites com score UT no CSV_DATA, eles estao operando com sistemas locais sem plano de substituicao. Isso precisa ser comunicado ao VP como gap de planejamento, nao como "ausente".

**Criterio 3 — Custo de manutencao do legado (peso medio)**
O custo de licenca/suporte do legado e alto? Isso nao esta nos dados do dashboard — e informacao financeira que vem do ZTE (Zone Technology Excellence). O dashboard deveria ter um campo ou indicador qualitativo (alto/medio/baixo) por sistema legado.

**Criterio 4 — Capacidade de change management (peso medio)**
A zona tem capacidade de absorver a migracao? Medido por: numero de sites simultaneos em transicao, complexidade do dominio, disponibilidade de belts para liderar o PDCA de transicao. Nao esta nos dados atuais.

### 2.2 Formula de Decommissioning Readiness Score

A implementacao atual usa `decommReady = parityStatus === 'global_leading'` (boolean simples). Proponho um score continuo de 0–100:

```
Decommissioning Readiness Score (DRS) =
    w1 * Capability_Coverage_Pct    (N4s READY / N4s que o legado cobre)
  + w2 * Site_Deployment_Pct         (sites com global / total sites na zona-dominio)
  + w3 * Score_Parity_Factor         (avgScoreGlobal / max(avgScoreLegacy, 1))
  + w4 * Timeline_Urgency            (1 se planned completion <= 2027; 0.5 se <= 2029; 0 se nenhum)

Pesos recomendados:
  w1 = 0.40  (cobertura funcional e o criterio mais critico)
  w2 = 0.25  (deployment real)
  w3 = 0.20  (qualidade da implantacao)
  w4 = 0.15  (pressao de timeline)
```

**Faixas de interpretacao:**
- DRS >= 80: "Pronto para Migration Conversation" (verde)
- DRS 50–79: "Em Transicao — monitorar quarterly" (amarelo)
- DRS 30–49: "Gap significativo — priorizar roadmap" (laranja)
- DRS < 30: "Dependencia critica de legado" (vermelho)

**Dados disponiveis para calcular:**
- `Capability_Coverage_Pct`: calculavel a partir de `portfolio_capabilities.json` (ja implementado em `decommReadiness`)
- `Site_Deployment_Pct`: calculavel a partir de `SITE_DOMAIN_TYPE` (covPct ja calculado)
- `Score_Parity_Factor`: calculavel a partir de `avgScoreGlobal` / `avgScoreLegacy` (ja calculado em `domainData`)
- `Timeline_Urgency`: calculavel a partir de `planned_year` / `planned_quarter` de `portfolio_capabilities.json`

### 2.3 Roadmap de transicao legado-para-global

O VP precisa ver o roadmap como um waterfall temporal, nao como uma tabela estática. O formato ideal e:

```
Hoje (Q2 2026)    Q3 2026    Q4 2026    Q1 2027    Q2 2027    ...
|--- Athena (SAZ/QL) ---|
    [35% READY]  [50%]     [65%]     [80%]     [95% → Migration Conversation]
```

**Dados disponiveis para projecao:**
- `planned_year` + `planned_quarter` das capabilities NOT READY fornecem datas estimadas
- Distribuicao atual: 261 N4s planejados para 2026, 310 para 2027, 145 para 2028
- A curva de readiness pode ser projetada assumindo entrega conforme planejado

**Risco da projecao:** O `planned_year/quarter` e estimativa do product team, nao compromisso firme. O dashboard deve exibir como "Previsao baseada em roadmap do produto — sujeita a revisao" e nao como promessa.

---

## 3. KPIs que Importam para VPO

### 3.1 Global Parity Index (GPI)

**Definicao recomendada:**

```
GPI(zona, dominio) =
    0.50 * (N4_READY / N4_Total_do_dominio)           -- Funcional Readiness
  + 0.30 * (Sites_Global / (Sites_Global + Sites_Legacy))  -- Deployment Rate
  + 0.20 * min(AvgScore_Global / 2.0, 1.0)              -- Qualidade (normalizada p/ L2 como gate)

GPI(zona) = media ponderada dos GPIs por dominio, peso = numero de N4s do dominio
GPI(global) = media ponderada por zona, peso = numero de sites
```

**Por que esta formulacao:**
- Peso por N4 (nao por dominio) evita que dominios com poucos N4s (MDM: 40) tenham o mesmo peso que dominios complexos (MT: 432)
- Normalizacao por L2 porque L2 e o gate de "Connected Ops" — abaixo disso o produto global nao entrega valor operacional
- Deployment Rate baseado em sites (nao capabilities) porque e a metrica que o VP acompanha

**Valores atuais estimados (com dados disponiveis):**
- Funcional Readiness global: 551/1679 = 32.8%
- Deployment Rate varia por zona (APAC lidera, EUR e mais dispersa)
- O GPI global provavelmente esta entre 25–35% — comunicacao ao VP deve ser: "Estamos em ~30% de paridade global. Target e 80% ate 2028."

### 3.2 Coverage Rate — definicao correta

O dashboard atual usa duas definicoes diferentes e isso gera confusao:

| Metrica na UI         | Calculo atual                                      | Problema                                    |
|-----------------------|----------------------------------------------------|---------------------------------------------|
| `globalCoveragePct`   | nGlobal / (nGlobal + nLegacy) — exclui "nNeither"  | Inflacionada: ignora sites sem produto      |
| Funil L0-L4           | Sites >= Lx / Total sites                           | Mede maturidade, nao coverage               |

**Definicao recomendada para VPO:**
- **Deployment Rate** = Sites com produto global ativo / Total de sites na zona (inclui "nNeither")
- **Functional Coverage** = N4s READY / Total N4s do dominio (independe de deployment)
- **Effective Coverage** = Deployment Rate * Functional Coverage (metrica composta)

**O VPO ja usa metricas similares no SuEP:**
- SuEP mede "% sites com sistema digital ativo por dominio" como parte do BEP Assessment
- O Assessment Score (Bronze/Silver/Gold/Platinum) tem componente de "Digital Foundation" que mapeia para L1/L2
- Recomendacao: alinhar o label "Deployment Rate" com a linguagem do SuEP Assessment

### 3.3 Metricas VPO existentes para transformacao digital

O VPO Assessment 2026 (vpo-assessment-2026.json ja existe no projeto) mede:

1. **VPO Pillar Scores**: 0-100 por pilar, por site. Sites com VPO < 80% nao devem receber investimento em tech (insight ja identificado na MaturityVsResults view)
2. **BEP/SuEP Dashboard**: Safety (TRIR, LTI), Quality (BQI, Consumer Complaints), Cost (VLC), People (Engagement). Nenhum mede diretamente "digital coverage" — este dashboard preenche esse gap.
3. **Assessment Level**: Bronze/Silver/Gold/Platinum. Progresso de nivel requer baseline digital (L1 minimo para Silver, L2 para Gold). O dashboard deveria mostrar: "X sites precisam de L2 para atingir Gold — atualmente em L1.X"

### 3.4 Alinhamento de KPIs do dashboard com vocabulario VPO

| KPI do Dashboard                  | Equivalente VPO/SuEP              | Onde aparece no MCRS                |
|-----------------------------------|-----------------------------------|-------------------------------------|
| Global Parity Index               | Nao existe — **novo KPI**         | Monthly Strategic Review do ZBS     |
| Deployment Rate                   | "Digital Foundation Coverage"     | SuEP Dashboard — People/VPO pillar |
| DRS (Decommissioning Readiness)   | Nao existe — **novo KPI**         | Quarterly Zone Tech Review          |
| Functional Coverage               | Nao existe — **novo KPI**         | VPO Forum (2x/ano)                  |
| Score medio por dominio           | Assessment Pillar Score           | Monthly Plant Review                |

**Recomendacao: registrar GPI e DRS como PIs (Performance Indicators) no KPI & PI Dashboard do MCRS.** Eles nao sao KPIs de SuEP, mas sao PIs de acompanhamento estrategico que alimentam decisoes do Zone Strategy.

---

## 4. Gaps e Riscos nos Dados

### 4.1 Legacy Coverage — confiabilidade

O campo `legacy_coverage` em `portfolio_capabilities.json` e derivado de colunas especificas do Excel "OneMES Readiness Consolidated.xlsx":

**Mapeamento de colunas (do script `generate_portfolio_capabilities.py`):**
- AFR: colunas 19-26 (8 produtos: Traksys, IAL PT, HSEC, Credit360, SAP PM, Flow, MMIS, Digital Brewsheets)
- APAC: colunas 28-37 (10 produtos: LIMS China, NCM, India/V/K, DST, Data Factory, Line View, SAP PM, DVPO, EMS, Lifecycle)
- SAZ: colunas 39-48 (10 produtos: Athena, LMS, SAP PM, Ceres, Argos, Smartcheck, Growler, Soda 1.0, Oraculo, Soda Vision)
- NAZ: colunas 50-62 (13 produtos)
- MAZ: colunas 64-68 (5 produtos)
- EUR: colunas 70-76 (7 produtos)

**Criterio de "coverage":** celula = "must have" ou "necessary" (case-insensitive). Isso significa que o mapeamento reflete **necessidade**, nao **disponibilidade real**. Um legado marcado como "must have" significa "esta capacidade e necessaria E o legado a cobre", nao "o legado esta deployed neste site".

**Quem mantem:** O Excel e mantido pelo time global de Produto/OneMES. A atualizacao depende de input dos ZTEs (Zone Technology Excellence) por zona. A frequencia de atualizacao nao e definida — risco de dados defasados.

**Riscos identificados:**
1. **AFR e MAZ tem poucos produtos mapeados** (8 e 5 respectivamente) — provavelmente ha sistemas locais nao documentados
2. **EUR tem coverage de apenas 26%** dos N4s — pode ser gap de documentacao, nao ausencia real de legados
3. **NAZ e SAZ tem FULL GAP em LOCAL_SYSTEMS** (arrays vazios no codigo) — o VP vera dados de sites classificados como "Legacy" sem saber qual sistema e

### 4.2 Planned Year/Quarter — firmeza do dado

**Avaliacao: estimativa, NAO compromisso.**

Evidencias:
- 83 N4s planejados para 2024 e 61 para 2025 — ja deveriam estar READY. Se nao estao, houve atraso. O dashboard deveria sinalizar: "X capabilities com data planejada ja vencida"
- A distribuicao temporal (2026: 261, 2027: 310, 2028: 145) sugere pipeline agressivo — improvavel que 100% seja entregue no prazo
- O script nao valida se `planned_year` mudou entre versoes do Excel — nao ha historico de re-forecasting

**Recomendacao:**
- Exibir `planned_year/quarter` com disclaimer: "Estimativa de roadmap — ultima atualizacao: [data do Excel]"
- Calcular "Overdue Rate": N4s com `planned_year < 2026` E `status = NOT READY`. Com os dados atuais: 83 + 61 = **144 N4s com previsao vencida** (8.5% do total). Isso e informacao critica para o VP.

### 4.3 Dominios com dados incompletos

| Dominio    | Risco de incompletude | Evidencia                                                                           |
|------------|----------------------|-------------------------------------------------------------------------------------|
| **UT**     | **CRITICO**           | Zero N4s no portfolio_capabilities. Dominio inteiro sem roadmap documentado           |
| **DA**     | Alto                  | 75 N4s, todos de SODA ETL. Nao ha segundo produto global mapeado                     |
| **MDM**    | Medio                 | 40 N4s, todos de SODA MDM. Cobertura funcional parece estreita                       |
| **PP**     | Alto                  | 310 N4s mas apenas 22% READY. LMS tem 264 N4s e e o produto mais complexo            |
| **QL**     | Alto                  | 331 N4s, 20% READY. PTS Management tem 84 N4s com apenas 3 READY (3.6%)             |
| **SF**     | Medio                 | 128 N4s, Guardian e unico produto. Cobertura parece razoavel mas concentrada         |

**Dominios nao mapeados no portfolio_capabilities:**
- `ENV` (8 N4s) e `CORE` (23 N4s) existem no JSON mas nao mapeiam para os 9 dominios do dashboard (BP/DA/UT/MT/MG/MDM/PP/QL/SF). O dashboard os ignora silenciosamente. Recomendacao: ENV poderia ser integrado com UT (Utilities), CORE com MG (Management).

### 4.4 L-level dos produtos globais

**Avaliacao: estimativa, NAO confirmado.**

O codigo explicita: `confirmed: false` para TODOS os 15 produtos em `GLOBAL_PRODUCT_LEVELS`. O comentario diz: "Needs validation from product teams — these are best-estimate from deployment data."

**Impacto:** Se o L-level real de um produto for menor que o estimado, o calculo de paridade fica otimista. Exemplo: se Omnia BMS e L1 (nao L2 como estimado), entao um site com Omnia BMS ativo nao atinge Connected Ops — e o VP acha que atinge.

**Recomendacao:** Adicionar badge "nao confirmado" visivel na UI (ja implementado como `*` no nome do nivel). Criar acao de validacao: "Pillar Champion de [dominio] deve confirmar L-level com product team ate [data]."

---

## 5. Acoes do VP Apos Ver o Dashboard

### Acao 1: Priorizar zonas/dominios para aceleracao de deployment

**Dado usado:** Cross-zone matrix (heatmap de status) + Deployment Rate por zona-dominio
**Decisao:** "SAZ esta em 'Legacy Dependent' em PP — priorizar rollout de Omnia LMS em SAZ no 1YP"
**Next step sugerido pelo dashboard:** "Abrir iniciativa 1YP: Rollout [produto global] em [zona] para [dominio]. Owner: [Pillar Champion]. KPI target: Deployment Rate de X% para Y% ate Q4."

### Acao 2: Iniciar conversa de decommissioning com planta

**Dado usado:** DRS >= 80 para zona-dominio especifico + lista de sites Legacy restantes
**Decisao:** "MG em AFR esta pronto — Acadia/IALog cobrem 34/34 sites. Podemos desligar o sistema legado."
**Next step sugerido pelo dashboard:** "Agendar Migration Readiness Review com Plant Manager de [sites Legacy]. Checklist: (1) Treinamento completo? (2) SOPs atualizados? (3) MOC aprovado? (4) Periodo de coexistencia definido?"

### Acao 3: Escalar gap de roadmap ao ZBS Director

**Dado usado:** Dominio com zero N4s (UT) ou Overdue Rate alto
**Decisao:** "Utilities nao tem roadmap global — escalar ao ZBS para incluir no proximo VPO Forum"
**Next step sugerido pelo dashboard:** "Registrar gap no Strategic Action Log: [dominio] sem roadmap de produto global. Escalar para VPO Forum [data]. Owner: ZBS Director."

### Acao 4: Ajustar Target Setting para proximo ciclo

**Dado usado:** GPI atual vs target + curva de convergencia projetada
**Decisao:** "Com o ritmo atual, nao atingimos 80% GPI ate 2028. Precisamos de 15pp adicionais em MT e PP."
**Next step sugerido pelo dashboard:** "Incluir target de GPI no TSC (Target Setting & Cascading) do proximo Business Cycle. Cascatear para Pillar Champions como PI mensal."

### Acao 5: Benchmarking entre zonas para Knowledge Management

**Dado usado:** Zona com melhor DRS por dominio vs zona com pior
**Decisao:** "APAC atingiu GPI 65% em DA. AFR esta em 34%. Replicar a abordagem de APAC como Best Practice."
**Next step sugerido pelo dashboard:** "Capturar Good Practice de [zona lider] para [dominio]. Registrar no Knowledge Management System. Owner: Pillar Champion + ZTE."

---

## 6. Perspectiva Temporal Obrigatoria

### 6.1 Evolucao quarter a quarter do GPI

**Dados disponiveis para historico:**
- `portfolio_capabilities.json` tem `planned_year` + `planned_quarter` — permite projetar curva futura
- O dashboard NAO tem dados historicos de periodos anteriores. Nao ha arquivo com "GPI de Q1 2026", "GPI de Q4 2025".

**Recomendacao para implementacao:**
1. **Projecao forward (calculavel hoje):** Usando `planned_year/quarter`, calcular: "Se todas as capabilities planejadas forem entregues no prazo, o GPI sera X% em Q4 2026, Y% em Q4 2027, Z% em Q4 2028." Exibir como curva de convergencia.
2. **Historico retroativo (requer nova fonte):** Salvar snapshot mensal do GPI em `kpi-history.json` (arquivo ja existe mas vazio para portfolio). Cada build do dashboard deveria gravar o GPI do momento.
3. **Overlay de actual vs planned:** Quando houver historico, exibir curva planejada vs curva real. Delta entre as duas e o "delivery risk".

### 6.2 Curva de convergencia projetada

Com os dados atuais de `planned_year`:

```
           READY hoje    +2026    +2027    +2028    +2029    +2030    Sem plano
N4s:       551           +261     +310     +145     +45      +6       -392 (gap)
Acum:      551           812      1122     1267     1312     1318
% total:   32.8%         48.4%    66.8%    75.5%    78.1%    78.5%

==> Com roadmap atual, maximo atingivel e ~78.5% (1318/1679)
==> 392 N4s (23.3%) NAO TEM PREVISAO — impedem 100% de paridade
==> 144 N4s (8.5%) tem previsao VENCIDA (2024-2025) — provavelmente atrasados
```

**Comunicacao ao VP:**
"O roadmap atual projeta 78% de Functional Readiness ate 2030. Para atingir 100%, ha 392 capabilities sem previsao de entrega — precisam de roadmap. Alem disso, 144 capabilities com previsao vencida podem atrasar a curva."

### 6.3 Tipo de tendencia que o VP espera ver

O VP espera ver **aceleracao** — cada quarter deve mostrar progresso maior que o anterior. Se a curva achata (estagnacao) ou inverte (regressao), e sinal de problema.

**Indicadores de alerta:**
- **Aceleracao saudavel:** +5pp ou mais por quarter no GPI
- **Estagnacao:** < 2pp por quarter — indica gargalo de delivery ou change management
- **Regressao:** GPI caiu — pode acontecer se sites foram reclassificados ou se um produto global perdeu funcionalidade (raro, mas possivel)

O dashboard deveria usar icones de tendencia (seta para cima/horizontal/para baixo) ao lado do GPI de cada zona, com tooltip mostrando os ultimos 4 quarters.

---

## 7. Validacao de Regras de Negocio da Implementacao Atual

### 7.1 Thresholds de paridade — analise critica

A implementacao atual usa:
```
Global Leading:    covPct >= 0.70 E avgScoreGlobal >= avgScoreLegacy
Approaching:       covPct >= 0.30
Legacy Dominant:   tudo abaixo
```

**Problemas identificados:**

1. **O threshold de 70% para "Global Leading" e agressivo.** Em VPO, paridade funcional requer ~90% de cobertura para que o VP se sinta confortavel em aprovar decommissioning. Recomendacao: subir para 80%.

2. **O threshold de 30% para "Approaching" e baixo.** Com 30%, a maioria dos sites ainda esta em legado. Recomendacao: 40-50%.

3. **O score comparison (avgScoreGlobal >= avgScoreLegacy) nao considera o tipo de dominio.** Para dominios de compliance (SF, QL), qualquer gap de score e critico. Para dominios de eficiencia (BP, PP), um gap de 0.3 pode ser aceitavel. A implementacao trata todos igualmente.

4. **nNeither (sites sem produto) e excluido do calculo de covPct.** Isso e correto para "Global vs Legacy", mas incorreto para "Deployment Rate". Um dominio com 10 sites Global, 0 Legacy, e 20 sem produto aparece como "100% Global Leading" — mas na verdade 67% dos sites nao tem nenhum produto. O VP precisa ver ambas as metricas.

### 7.2 Logica de decommReady

Atual: `decommReady = parityStatus === 'global_leading'` (boolean binario).

**Problema:** Nao considera a capability tree. Um dominio pode ter 100% de deployment (todos os sites em Global) mas o produto global cobre apenas 40% das funcionalidades do legado. O VP que descomissiona com base nesse indicador perde funcionalidade.

**Recomendacao:** `decommReady` deve integrar o DRS proposto na secao 2.2, nao apenas o parityStatus.

### 7.3 LOCAL_SYSTEMS — dados incompletos nao comunicados

NAZ e SAZ tem arrays vazios:
```javascript
NAZ: [ // FULL GAP ],
SAZ: [ // FULL GAP ],
```

O UI trata isso com mensagem "sistema nao identificado" (linha 4638-4639), o que e correto. Porem, o VP pode interpretar como "nao ha legado" quando na verdade "nao sabemos qual e o legado". Recomendacao: adicionar badge vermelha "Dados pendentes" ao lado da zona no zone selector.

### 7.4 Dominio UT sem dados — impacto na cross-zone matrix

O portfolio_capabilities.json tem zero N4s para UT, mas o CSV_DATA tem scores de UT por site. Isso significa:
- A cross-zone matrix nao pode calcular Functional Readiness para UT
- O DRS para UT sera sempre zero
- O VP ve sites com score UT = 2.0 (algum produto digital existe) mas a tab Portfolio Intelligence diz "sem produto global"

**Recomendacao:** Adicionar nota explicita: "Utilities: produto global nao mapeado no catalogo de capacidades. Score existente pode refletir sistema local nao catalogado."

---

## 8. Impactos no Ecossistema VPO

### 8.1 Management Pillar blocks impactados

| Block              | Impacto                                                                                       |
|--------------------|-----------------------------------------------------------------------------------------------|
| **MCRS**           | TOR do Monthly Review deve incluir revisao do GPI. Action Log deve rastrear acoes de migracao |
| **Strategy (1YP)** | GPI target deve ser incluido no TSC. Key Initiatives de migracao entram no 1YP                |
| **Problem Solving**| Gaps de deployment devem usar PDCA. Gaps de produto (UT, PP) devem usar DMAIC com Belt        |
| **Standards**      | SOPs de uso do produto global devem ser criados antes de decommissioning. MOC obrigatorio      |
| **5S Digital**     | Apos decommissioning, limpar acessos/pastas/integrações do sistema legado                     |
| **KM**             | Boas praticas de migracao devem ser documentadas como GOPs e replicadas entre zonas            |

### 8.2 MOC Requirements

Qualquer decommissioning de sistema legado dispara MOC obrigatorio:
1. Risk Assessment: impacto em operacoes, compliance, safety
2. Aprovacoes: Plant Manager + Pillar Champion + ZTE
3. Treinamento: todos os usuarios do legado devem ser treinados no global (com SOP atualizado)
4. Periodo de coexistencia: minimo 1 mes com ambos os sistemas ativos
5. Rollback plan: como reativar o legado se o global falhar
6. Documentacao: atualizar PTS, SIC, OPL que referenciam o legado

### 8.3 Impacto no VPO Assessment Level

O Assessment nao mede "Global vs Legacy" diretamente, mas mede "Digital Foundation":
- **Bronze → Silver:** Requer L1 em dominios core. O GPI alimenta a conversa de "estamos prontos para Silver?"
- **Silver → Gold:** Requer L2 em dominios core + PDCA de melhoria documentado. Deployment Rate do global e proxy.
- **Gold → Platinum:** Requer L3+ com integracao entre dominios. So atingivel com produtos globais (legados isolados nao integram).

O dashboard deveria mapear: "Para atingir [proximo nivel de assessment], a zona precisa de GPI >= X% em dominios [lista]."

### 8.4 Stakeholders e responsabilidades

| Stakeholder          | Responsabilidade no contexto deste dashboard                                     |
|----------------------|-----------------------------------------------------------------------------------|
| **ZBS Director**     | Aprova targets de GPI no TSC. Patrocina Key Initiatives de migracao no 1YP        |
| **VPO Coordinator**  | Integra GPI/DRS no MCRS Map. Garante que TORs de Monthly Review incluem portfolio |
| **Plant Manager**    | Executa migracao na planta. Aprova MOC de decommissioning                         |
| **Pillar Champions** | Validam L-level dos produtos globais. Lideram PDCA de deployment por dominio      |
| **PPM**              | Inclui GPI no KPI & PI Dashboard. Acompanha evolucao mensal                       |
| **ZTE**              | Fornece dados de custo de legado. Valida LOCAL_SYSTEMS. Executa transicao tecnica |
| **Belt (Green/Black)**| Lidera DMAIC para gaps complexos (PP com 22% READY, QL com 20%)                 |

---

## 9. Recomendacoes Consolidadas para o Redesign

### Prioridade 1 — Correcoes de dados e comunicacao

1. **Sinalizar UT como gap critico** — dominio sem roadmap documentado
2. **Calcular e exibir Overdue Rate** — 144 N4s com previsao vencida
3. **Comunicar LOCAL_SYSTEMS incompletos** — NAZ e SAZ com badge "dados pendentes"
4. **Confirmar L-levels** com product teams — todos marcados como nao confirmados
5. **Separar Deployment Rate (inclui nNeither) de Global Coverage (exclui nNeither)**

### Prioridade 2 — KPIs e logica de negocio

6. **Implementar DRS (Decommissioning Readiness Score)** continuo 0-100, substituindo boolean
7. **Implementar GPI (Global Parity Index)** como metrica composta
8. **Ajustar thresholds** de paridade: Global Leading >= 80%, Approaching >= 45%
9. **Alinhar vocabulario** com terminologia VPO (ver tabela secao 1.4)
10. **Adicionar target corporativo** visivel na UI

### Prioridade 3 — Perspectiva temporal

11. **Projetar curva de convergencia** com dados de `planned_year/quarter`
12. **Implementar snapshot mensal** do GPI para historico
13. **Exibir tendencia** (seta up/flat/down) por zona no cross-zone matrix
14. **Sinalizar capabilities overdue** como risco de delivery

### Prioridade 4 — Acoes e integracao VPO

15. **Templates de acao** para MCRS Action Log (migracao, escalonamento, roadmap gap)
16. **Link para VPO Assessment level** — "para atingir Gold, precisa de X"
17. **Visao "por sistema legado"** que consolide dominios (Traksys = BP + QL)
18. **Export de Migration Brief** — 1 pagina por zona-dominio para Monthly Review

---

## Anexo A: Mapa de Dados Disponíveis vs. Necessarios

| Dado                                    | Fonte atual                        | Disponivel? | Qualidade    |
|-----------------------------------------|------------------------------------|-------------|--------------|
| N4 Capabilities por dominio             | portfolio_capabilities.json        | Sim         | Boa (exceto UT) |
| Status READY/NOT READY                  | portfolio_capabilities.json        | Sim         | Boa          |
| Planned Year/Quarter                    | portfolio_capabilities.json        | Sim         | Estimativa   |
| Legacy Coverage por zona                | portfolio_capabilities.json        | Sim         | Parcial (EUR 26%) |
| Sites com Global/Legacy por dominio     | SITE_DOMAIN_TYPE (CSV_DATA)        | Sim         | Boa          |
| Score de maturidade por site-dominio    | CSV_DATA                           | Sim         | Boa          |
| Produtos globais por zona-dominio       | product-coverage-2026.json         | Sim         | Boa          |
| Sistemas legados nomeados              | LOCAL_SYSTEMS (hardcoded)          | Parcial     | NAZ/SAZ gap  |
| L-level dos produtos globais            | GLOBAL_PRODUCT_LEVELS (hardcoded)  | Sim         | Nao confirmado |
| VPO Assessment scores                   | vpo-assessment-2026.json           | Sim         | Boa          |
| KPIs operacionais (OSE/TTP)            | anaplan-kpis-2025.json             | Sim         | Boa          |
| Custo de manutencao de legados         | Nao disponivel                     | Nao         | —            |
| Capacidade de change management        | Nao disponivel                     | Nao         | —            |
| Historico temporal de GPI              | Nao disponivel                     | Nao         | —            |
| Target corporativo de deployment       | Nao disponivel                     | Nao         | —            |

## Anexo B: Numeros-chave para referencia

- **1.679** N4 capabilities total no catalogo
- **551** READY (32.8%), **1.128** NOT READY
- **392** N4s sem previsao de entrega (23.3% do total)
- **144** N4s com previsao vencida (2024-2025)
- **19** produtos globais unicos, **~53** sistemas legados mapeados (6 zonas)
- **163** sites no CSV_DATA, **6** zonas, **9** dominios + 2 nao padrao (ENV, CORE)
- **0** N4s para Utilities — gap critico de roadmap
- Projecao: **~78.5%** de Functional Readiness atingivel ate 2030 com roadmap atual
