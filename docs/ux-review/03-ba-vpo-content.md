# 03 - BA VPO/Management: Mapeamento de Conteudo por Aba

> **Autor:** BA VPO/Management Pillar
> **Data:** 2026-04-04
> **Escopo:** Requisitos de conteudo VPO que DEVEM existir no coverage-dashboard, independente da estrutura final de abas proposta por PM/Designer.
> **Fonte de verdade:** VPO Management Pillar Handbook 2026 (VPO-500024), SMS Supply Chain Management Handbook 2026, dados em `App.tsx`.

---

## Indice

1. [Mapeamento de conteudo por tipo de visao](#1-mapeamento-de-conteudo-por-tipo-de-visao)
2. [Regras de negocio VPO/Management](#2-regras-de-negocio-vpomanagement)
3. [Conexoes cross-aba](#3-conexoes-cross-aba)
4. [Gaps identificados](#4-gaps-identificados)

---

## 1. Mapeamento de conteudo por tipo de visao

### 1.1 Visao Executive / Overview

**Objetivo VPO:** Responder em 10 segundos se o investimento em maturidade digital esta gerando retorno operacional, e onde estao os riscos.

#### Secoes obrigatorias

| # | Metrica / Secao | Fonte atual | Regra de exibicao |
|---|----------------|-------------|-------------------|
| 1 | **Sites em L2+** (count e %) | `CSV_DATA` Total Global >= 2 | Card hero. Direcao: maior = melhor. Delta vs periodo anterior quando kpi-history disponivel. |
| 2 | **OSE Medio global** | `anaplan-kpis-2025.json` PG-K4038 | Card hero. Exibir com sparkline 6M (kpi-history.json) e badge de tendencia 3M. |
| 3 | **Sites abaixo do limiar VPO** (count) | `vpo-site-scores-2026.json` overall_score < 0.80 | Card hero com label "risco ROI". Cor vermelha. |
| 4 | **Quadrante VPO x Tech** | scatter VPO (Y) x Tech Score (X), cor = OSE | JA EXISTE. Manter. E a prova central: VPO Alto + Tech Alta = melhor OSE. |
| 5 | **Top 5 oportunidades** (sites mais proximos de subir de nivel) | `computeSiteMigrationStatuses()` | JA EXISTE. Ordenar por readinessClass + domainProgress + VPO. |
| 6 | **Correlacao Tech x VPO x OSE** (3 numeros) | `buildTriDimAnalysis()` corrTechOse, corrVpoOse, corrTechVpo | JA EXISTE. Exibir como gauge ou barra. |
| 7 | **VPO Threshold Callout** | Callout vermelho quando sites abaixo de 80% > 0 | JA EXISTE (US1). |

#### Como VPO score deve ser apresentado

| Aspecto | Recomendacao | Justificativa |
|---------|-------------|---------------|
| **Formato** | Percentual absoluto (ex: 82%) | VPO assessment score e compliance % (y/y+n), nao e escala relativa. Percentual e a linguagem nativa do VPO Forum. |
| **Banding** | 4 faixas com cor: <65% (vermelho), 65-79% (ambar), 80-87% (verde claro), >=88% (verde escuro) | Alinha com `LEVEL_MIGRATION_DEFS.vpoMinPct`: L0->L1=65%, L1->L2=80%, L2->L3=88%, L3->L4=90%. |
| **Referencia cruzada** | Sempre exibir VPO score ao lado do tech maturity level | Nunca mostrar tech level isolado -- o limiar VPO condiciona o ROI. |

#### Relacao VPO score x maturity level

A correlacao nao e linear direta. O modelo correto e **VPO como pre-requisito (gate), nao como driver linear**:

```
VPO >= 80%  AND  Tech L2+  =>  OSE incremento esperado +6 a +21 pp
VPO <  80%  AND  Tech L2+  =>  Correlacao negativa ou nula com OSE (investimento perdido)
VPO >= 88%  AND  Tech L3+  =>  Retorno maximo (+18-20 pp)
```

O dashboard JA implementa isso via `computeThresholdSweep()` -- sweep de 0.50 a 0.95. Manter e dar destaque visual ao ponto de inflexao (tipicamente ~0.80).

---

### 1.2 Visao de Maturidade (Zona / Dominio)

**Objetivo VPO:** Entender ONDE estao os gaps de maturidade digital por zona e dominio, com perspectiva temporal.

#### Distribuicao L0-L4

| Visualizacao | Quando usar | Nota |
|-------------|-------------|------|
| **Funil cumulativo** (barra empilhada decrescente) | Visao por zona -- comparar o shape de cada zona | JA EXISTE (`FunnelCard`). Manter logica L0=100% base. |
| **Stacked bar 100%** | Comparativo cross-zona -- quanto cada zona tem em cada nivel | Para drill-down por dominio dentro de zona. |
| **Heatmap zona x dominio** | Visao matricial -- identificar hot spots | Cor = score medio do par zona+dominio. Existe parcialmente no portfolioIntelligence. |

#### Metricas VPO de acompanhamento por zona

| Metrica | Fonte | Por que |
|---------|-------|---------|
| **VPO score medio da zona** | `vpo-site-scores-2026.json` avg(overall_score) por zona | Contextualiza o funil: EUR tem funil pior E VPO pior. |
| **% sites VPO >= 80%** na zona | count(overall_score >= 0.80) / total | Gate de readiness: qual % da zona esta pronta para investimento tech. |
| **Correlacao r(VPO, OSE) por zona** | `computeZoneAnalysis()` rVpoOse | JA EXISTE. Mostra que VPO->OSE e consistente globalmente. |
| **Correlacao r(Tech, OSE) por zona** | `computeZoneAnalysis()` rTechOse | JA EXISTE. Mostra que tech->OSE so e positiva onde VPO e alto. |
| **OSE medio por zona** | kpi-history.json ou anaplan | Resultado operacional da zona. |

#### Drill-down ao expandir zona ou dominio

Ao clicar em uma zona no funil:
1. Lista de sites da zona com: nome, tech level, VPO %, OSE, TTP, blocking domains
2. Distribuicao L0-L4 com tooltip de sites exclusivos (JA EXISTE)
3. Sparkline OSE 6M da zona (JA EXISTE via kpiHistory)
4. Mini-scatter tech x OSE filtrado para a zona

Ao clicar em um dominio:
1. Distribuicao de scores do dominio por zona (box plot ou violin)
2. Sites blocking neste dominio (score < gate do proximo nivel)
3. Global vs Legacy split por zona neste dominio
4. Correlacao score deste dominio x OSE (`computeDomainOseCorrelation()` -- JA EXISTE)

#### Perspectiva temporal (OBRIGATORIO)

> **Regra BA:** Nunca exibir apenas dados agregados em bloco. Toda metrica de resultado deve ter serie mensal/semanal + indicador de tendencia.

| Metrica | Serie temporal requerida | Fonte |
|---------|------------------------|-------|
| OSE por zona | Mensal, 6-12 meses | kpi-history.json (periods + months) |
| TTP por zona | Mensal, 6-12 meses | kpi-history.json ou anaplan |
| Score medio de maturidade | -- | Atualmente snapshot unico. **GAP: nao ha serie historica de scores.** |
| % L2+ por zona | -- | Atualmente snapshot unico. **GAP: nao ha serie historica de funil.** |

**Implementacao minima de tendencia:**
- Badge de tendencia 3M (delta ultimo trimestre vs anterior) -- JA EXISTE para OSE nos FunnelCards
- Sparkline inline nos cards de zona -- JA EXISTE
- Projecao linear simples (2 meses a frente) com area de confianca -- JA EXISTE (`projectOse()`)

---

### 1.3 Visao de Priorizacao

**Objetivo VPO:** Decidir em quais plantas investir primeiro -- combinando maturidade digital, maturidade de processo (VPO), volume e resultado.

#### Criterios de priorizacao VPO

A priorizacao combina 4 variaveis. O peso nao e aritmetico simples -- **VPO funciona como gate, nao como multiplicador**.

```
PRIORIZACAO = f(volume_weight, digital_gap, vpo_readiness_gate, ose_upside)
```

| Variavel | Peso / Papel | Logica |
|----------|-------------|--------|
| **VPO score** | GATE (binario) | Se < limiar do proximo nivel (LEVEL_MIGRATION_DEFS.vpoMinPct), site e classificado como "precisa de fundacao VPO primeiro". Nao entra no ranking de investimento tech. |
| **Digital gap** | ALTO (driver primario) | Quanto falta para o proximo nivel. Sites mais proximos = quick wins. `domainProgress` e `blockingDomains.length`. |
| **Volume** | MEDIO (multiplicador de impacto) | G3 > G2 > G1. Investir primeiro onde o volume amplifica o retorno. |
| **OSE atual** | CONTEXTO | OSE baixo + VPO alto + tech baixo = maior upside. OSE ja alto = menor urgencia. |

#### Framework de decisao -- arvore

```
1. VPO >= limiar do proximo nivel?
   |
   +-- NAO --> Cluster "Fundacao VPO primeiro"
   |           Acao: investir em pilares VPO (Management, Maintenance, People)
   |           Nao alocar budget tech ate VPO atingir limiar
   |
   +-- SIM --> 2. Quantos dominios digitais estao no gate do proximo nivel?
               |
               +-- >= 70% dos dominios prontos --> Cluster "Quick win"
               |   Prioridade ALTA. 1-2 dominios bloqueantes a resolver.
               |
               +-- 33-69% dos dominios prontos --> Cluster "Investment case"
               |   Prioridade MEDIA. Montar roadmap de 6-12 meses.
               |
               +-- < 33% dos dominios prontos --> Cluster "Long haul"
                   Prioridade BAIXA. Plano de 12-24 meses.
```

#### Clusters recomendados

| Cluster | Criterio | Cor sugerida | Acao |
|---------|----------|-------------|------|
| **Quick Win** | VPO >= limiar AND domainProgress >= 0.70 | Verde | Deploy imediato nos dominios bloqueantes. ROI em 3-6 meses. |
| **Investment Case** | VPO >= limiar AND 0.33 <= domainProgress < 0.70 | Ambar | Roadmap multi-dominio. ROI em 6-12 meses. |
| **Long Haul** | VPO >= limiar AND domainProgress < 0.33 | Laranja | Plano plurianual. Alinhar com 3YP do Business Cycle. |
| **VPO Foundation** | VPO < limiar | Vermelho | Investir em VPO primeiro. Tech deployment so apos atingir gate. |

> **Nota:** O dashboard JA implementa readinessClass = 'ready' / 'close' / 'far' no `computeSiteMigrationStatuses()`. A recomendacao e adicionar o cluster "VPO Foundation" como classe explicita, que hoje esta implicito no callout vermelho.

#### Identificar plantas "prontas para tech" vs "precisam de fundacao VPO"

| Indicador | Pronta para tech | Precisa de fundacao VPO |
|-----------|-----------------|------------------------|
| VPO overall score | >= `LEVEL_MIGRATION_DEFS[nextLevel].vpoMinPct` | < limiar |
| Pilares VPO criticos (Maint, Mgmt, People) | Todos >= 75% | Algum < 60% |
| SDCA estavel | SOP compliance alto, variabilidade baixa | Processo instavel, desvios frequentes |
| MCRS funcional | Rotinas de gestao em cascata operando | Reunioes sem action log, KPIs desconectados |

**O dashboard atualmente verifica apenas `overall_score` vs `vpoMinPct`.** Os pilares individuais estao disponiveis (`vpo.pillars[p].score`) mas nao sao usados como gate. Isso e um gap -- ver Secao 4.

---

### 1.4 Visao de Portfolio

**Objetivo VPO:** Informar priorizacao de rollout de produtos digitais (Global vs Legacy) usando maturidade VPO como input.

#### Como VPO assessment informa rollout

| Principio | Regra |
|-----------|-------|
| Produtos Global devem ser priorizados em plantas com VPO >= Silver (80%) | VPO maturo = processos estaveis = tech tem chance de ser adotada e gerar valor. |
| Plantas com VPO < Bronze (65%) devem receber apenas Digital Foundation (L1) | Sistemas complexos (L2+) requerem disciplina operacional que VPO baixo nao sustenta. |
| Decommissioning de Legacy so e viavel se VPO sustenta operacao pos-migracao | Risco: migrar de Legacy para Global em planta com VPO baixo pode piorar operacao. |

#### Relacao VPO pillar maturity x adocao de produtos digitais

| Dominio Digital | Pilar VPO correlato | Por que |
|----------------|--------------------|---------|
| Management (MG) | Management Pillar | MG digital = MCRS digital. Sem MCRS analogico funcional, o digital nao se sustenta. |
| Maintenance (MT) | Maintenance Pillar | CMMS, preditiva, CBM requerem disciplina de manutencao (AM/PM steps). |
| Quality (QL) | Quality Pillar | LIMS, SPC online requerem PTS atualizados e cultura de inspecao. |
| Safety (SF) | Safety Pillar | BBS digital, permit-to-work requerem rituais de seguranca funcionais. |
| Packaging Performance (PP) | Management + Maintenance | OEE real-time requer AM step 4+ e reunioes de SHO funcional. |
| Brewing Performance (BP) | Management + Quality | Controle de processo requer PTS atualizado e SDCA estavel. |
| Data Acquisition (DA) | Management (MCRS) | Dados coletados precisam alimentar rotinas. Sem MCRS, dados sao coletados e ignorados. |

#### Indicadores de risco: produto digital com VPO baixo

| Risco | Definicao | Acao |
|-------|----------|------|
| **Shelfware risk** | Site tem produto Global ativo (SITE_DOMAIN_TYPE = "G") em dominio onde VPO pillar correlato < 60% | Auditoria de adocao real. Produto pode estar instalado mas nao usado. |
| **Regression risk** | Site migrou de Legacy para Global mas VPO caiu nos ultimos 6 meses | Risco de rollback. Acionar VPO Coordinator. |
| **Premature rollout** | Site em L0/L1 com produto Global em mais de 3 dominios | Investimento tech provavelmente sem retorno. Realocar para VPO foundation. |

---

### 1.5 Visao de Sites (Tabela)

#### Colunas VPO obrigatorias

| Coluna | Fonte | Formato | Nota |
|--------|-------|---------|------|
| **VPO Score** | `vpoData[site].overall_score` | % com cor banded | JA EXISTE na migration table. Garantir que apareca na tabela principal de sites tambem. |
| **VPO Band** | Derivado de overall_score | Badge: Bronze/Silver/Gold/Platinum | Linguagem executiva. Facilita filtro. |
| **VPO Readiness** | overall_score >= vpoMinPct do proximo nivel | Icon: check/warning/x | JA EXISTE (siteReadyOk/Warn/Risk). |
| **Pilares VPO criticos** | pillars['Maintenance'], pillars['Management'], pillars['People'] | Micro-bar ou 3 numeros | Os 3 pilares com maior impacto na adocao de tech. |
| **Blocking Domains** | `blockingDomains` do migration status | Badges vermelhos com short code | JA EXISTE. |

#### Como VPO score complementa maturity score digital

- **Tech score** (0-4) mede ONDE a planta esta no glide path digital.
- **VPO score** (0-100%) mede SE a planta esta pronta para avancar.
- **A combinacao** determina a ACAO: investir em tech (VPO ok), investir em VPO (VPO baixo), ou manter (ambos altos).

Na tabela, a combinacao deve ser visivel em uma unica linha:
```
| Site     | Zone | Vol  | Tech | VPO  | OSE  | Readiness | Blocking |
| Luanda   | AFR  | G2   | L1   | 72%  | 38%  | VPO first | MT, MG   |
| Uberlandia| SAZ | G3   | L1   | 85%  | 42%  | Quick win | DA       |
```

#### Filtros VPO recomendados

| Filtro | Valores | Default |
|--------|---------|---------|
| VPO Band | All / Bronze / Silver / Gold / Platinum | All |
| VPO Readiness | All / Pronto / Quase / Risco / VPO First | All |
| Pilar VPO critico | Dropdown dos 7 pilares -- filtra sites onde pilar < 60% | -- |

---

### 1.6 Visao Capability Gap

**Objetivo VPO:** Identificar quais capacidades N3/N4 especificas faltam em cada site, cruzando com VPO readiness.

#### Conteudo VPO necessario

| Elemento | Detalhe |
|----------|---------|
| Score por N3/N4 com gate thresholds | JA EXISTE (cgL1Gate=60%, cgL2Gate=75%, cgL3Gate=85%, cgL4Gate=90%). Manter. |
| VPO readiness como coluna na matriz de sites | Adicionar VPO % e readiness badge na tabela de sites por zona. |
| Filtro "apenas sites VPO-ready" | Para focar analise de capability gap em sites que podem agir. |
| Produto ativo (G/L/-) por celula | JA EXISTE. Manter. |

---

## 2. Regras de negocio VPO/Management

### 2.1 Classificacao de maturidade VPO

O VPO Assessment classifica plantas em 4 niveis. O dashboard usa `overall_score` como proxy numerico.

| Nivel VPO | Score Range | Descricao | Implicacao para tech |
|-----------|------------|-----------|---------------------|
| **Not Benchmarked / Basic** | < 65% | Processos instáveis, SOPs incompletos, MCRS nao funcional | Nao investir em tech acima de L1. Foco em SDCA. |
| **Bronze** | 65% - 79% | Fundacao VPO existente, gaps em execucao | Digital Foundation (L1) viavel. L2 requer PDCA em pilares criticos. |
| **Silver** | 80% - 87% | Execucao consistente, MCRS funcional, rotinas em cascata | L2 (Connected Ops) viavel. Retorno positivo de investimento tech. |
| **Gold** | 88% - 94% | Excelencia operacional, PDCA ativo, benchmarking interno | L3 (Intelligent Ops) viavel. Integracao dados avancada. |
| **Platinum / World Class** | >= 95% | Referencia global, inovacao continua | L4 (Touchless Ops) candidato. Operacoes autonomas. |

> **Nota:** O VPO Assessment oficial usa Bronze/Silver/Gold/Platinum como certificacao formal (avaliada pelo ZBS/Global VPO Forum). O `overall_score` no JSON e o compliance score que ALIMENTA o assessment, nao e a certificacao em si. O dashboard deve usar as faixas acima como proxy, mas nao afirmar que o site "e Gold" -- deve dizer "score na faixa Gold (88%)".

### 2.2 Como VPO score se relaciona com L0-L4 digital

A relacao e de **pre-requisito (gate)**, nao de correlacao linear:

| Transicao digital | VPO minimo | Dominios-chave | Pilares VPO a fortalecer | OSE delta esperado |
|-------------------|-----------|----------------|-------------------------|-------------------|
| L0 -> L1 | 65% | DA, MDM, SF | Safety, Management, Maintenance | Insuficiente (n=12) |
| L1 -> L2 | 80% | DA, MDM, MG, QL, BP | Maintenance, People, Management | +6 a +21 pp |
| L2 -> L3 | 88% | DA, MDM, MG, UT, SF | Maintenance, Logistics, People | +18 a +20 pp |
| L3 -> L4 | 90% | DA, MT, PP, BP, UT | Maintenance, Logistics, Management | Projecao teorica |

Fonte: `LEVEL_MIGRATION_DEFS` em App.tsx. Estes valores sao derivados de analise estatistica cruzando vpo-site-scores com anaplan KPIs.

### 2.3 Criterios de readiness para implantacao digital

Um site e "ready" para investimento no proximo nivel digital quando:

1. **VPO overall >= limiar** (`LEVEL_MIGRATION_DEFS[nextLevel].vpoMinPct`)
2. **>= 70% dos dominios digitais atingem o gate do proximo nivel** (domainProgress >= 0.70)
3. **Nenhum dominio bloqueante critico** (DA e MDM devem estar no gate minimo -- sao fundacao de dados)

Readiness classes atuais no codigo:
- `ready`: todos dominios atingem gate, VPO ok
- `close`: 1-2 dominios faltando, VPO ok
- `far`: multiplos dominios faltando ou VPO insuficiente
- **[GAP] `vpo_foundation`**: nao existe como classe explicita. Sites com VPO < limiar sao misturados com `far`.

### 2.4 Thresholds e targets (padroes AB InBev)

| Parametro | Valor | Fonte |
|-----------|-------|-------|
| VPO threshold para ROI tech positivo | 80% (overall) | Analise interna (threshold sweep) + VPO Handbook |
| L2 como nivel minimo de "Connected Ops" | Score >= 2.0 | Tech Glide Path definition |
| Gate L1 capability | 60% das N3/N4 capabilities | OneMES Readiness methodology |
| Gate L2 capability | 75% das N3/N4 capabilities | OneMES Readiness methodology |
| Score maximo observado (2026) | 2.6 | Dataset atual. L3/L4 sao extrapolacoes. |
| VPO Assessment cycle | Anual (alinhado ao Business Cycle) | VPO Handbook -- TSC + 3YP |
| SuEP KPI targets | Definidos anualmente no Target Setting & Cascading | Global -> Zone -> Plant cascade |

### 2.5 Regras de calculo -- nao violar

| Regra | Detalhe |
|-------|---------|
| OSE canonica = SIGMA(EPT)/SIGMA(OST) | Nunca media simples de OSE por site. Usar PG-R0060 / PG-K4039. Fallback: PG-K4038. |
| Funil L0-L4 e cumulativo e decrescente | L0 = 100% sempre. Tooltip mostra exclusivos. |
| Legacy prevalece sobre Global | Quando G e L coexistem no mesmo site+dominio, exibir "L". |
| VPO score e 0-1 internamente, exibido como % | `overall_score * 100` para display. |
| Correlacao minima n=5 | Nao calcular Pearson com menos de 5 pontos. Exibir "n insuficiente". |

---

## 3. Conexoes cross-aba

### 3.1 Contexto passado entre abas

| De (aba origem) | Para (aba destino) | Contexto passado | Como |
|-----------------|-------------------|-----------------|------|
| Executive | Zone | Zona clicada no quadrante ou mapa | Filtro de zona ativo |
| Executive | Sites | Filtro "VPO below 80%" ou "Top 5 opportunities" | Pre-filtro de readiness ou sort |
| Zone | Domain | Zona + dominio selecionado | Ambos filtros ativos |
| Zone | Sites | Zona selecionada | Filtro de zona |
| Domain | Sites | Dominio selecionado | Filtro por blocking domain |
| MaturityVsResults | Sites | Cluster selecionado (quadrante VPO x Tech) | Filtro por cluster |
| Portfolio | Sites | Dominio + tipo (G/L) selecionado | Filtro combinado |
| Portfolio | CapabilityGap | Dominio selecionado para analise de gap | Filtro de dominio |
| CapabilityGap | Sites | Site selecionado na matriz | Navegacao para detalhe |
| Sites | MaturityVsResults | Site clicado | Highlight no scatter |

### 3.2 Links contextuais (click-through)

| Elemento clicavel | Destino | Acao |
|-------------------|---------|------|
| VPO score badge (qualquer aba) | Detalhe VPO do site (pilares, y/n/na) | Modal ou panel lateral com breakdown por pilar |
| Score de dominio (qualquer aba) | Capability Gap filtrado para aquele site+dominio | Navegacao para capabilityGap com pre-filtro |
| Badge de blocking domain | Tooltip com: bloqueio, score atual, target, acao de desbloqueio | JA EXISTE (tooltip com rationale). |
| Nome do site (qualquer tabela) | Sites view filtrado para aquele site | Navegacao + highlight |
| OSE % de zona | Drill-down com sparkline + serie mensal | JA EXISTE parcialmente (sparkline no FunnelCard). |
| Cluster "VPO Foundation" | Lista de sites com filtro VPO < limiar | Filtro pre-aplicado na tabela de sites |

### 3.3 Filtros que devem persistir entre abas

| Filtro | Escopo | Persistencia |
|--------|--------|-------------|
| **Volume group** (G1/G2/G3/All) | Global | Persiste em TODAS as abas. JA IMPLEMENTADO. |
| **Zona** | Global | Persiste em todas as abas. JA IMPLEMENTADO (parcial -- zone filter no sidebar). |
| **VPO readiness** | Novo | Deve persistir: filtrar por "VPO-ready only" afeta todas as visoes. |
| **Periodo temporal** | Global | Quando series temporais estiverem disponiveis, o periodo selecionado deve persistir. |
| **Idioma** (PT/EN) | Global | JA IMPLEMENTADO. |
| **Tema** (dark/light) | Global | JA IMPLEMENTADO. |

---

## 4. Gaps identificados

### 4.1 Metricas ausentes

| # | Gap | Impacto | Prioridade | Sugestao |
|---|-----|---------|-----------|----------|
| G1 | **VPO Band (Bronze/Silver/Gold/Platinum) como filtro e coluna** | Usuario nao consegue filtrar por maturidade VPO usando linguagem AB InBev nativa | ALTA | Derivar de overall_score com as faixas da Secao 2.1. Adicionar como coluna na SiteTable e como filtro no sidebar. |
| G2 | **Classe explicita "VPO Foundation"** no readiness | Sites com VPO < limiar sao misturados com "far" -- perde-se a acao diferenciada (investir em VPO, nao em tech) | ALTA | Adicionar readinessClass = 'vpo_foundation' em `computeSiteMigrationStatuses()` quando `vpoScore < vpoMinReq`. |
| G3 | **Pilares VPO como gate individual** | Atualmente so overall_score e gate. Um site pode ter overall 82% mas Maintenance em 50% -- tech de MT nao vai funcionar | MEDIA | Para cada dominio digital, verificar se o pilar VPO correlato (Secao 1.4) esta acima de threshold minimo (ex: 60%). Exibir warning se nao. |
| G4 | **VPO pillar breakdown visivel na tabela de sites** | Pilares estao no JSON (`vpo.pillars[p].score`) mas so aparecem na analise de correlacao parcial, nao na tabela principal | MEDIA | Adicionar mini-bars ou 3 numeros (Maint/Mgmt/People) como coluna expandivel. |
| G5 | **Risco de shelfware** (produto Global ativo + VPO baixo) | Investimento tech pode estar sem retorno em sites especificos | MEDIA | Cross-reference SITE_DOMAIN_TYPE == "G" com vpoData. Flag sites onde Global ativo mas VPO pillar correlato < 60%. |
| G6 | **SuEP KPIs alem de OSE e TTP** | Dashboard foca em OSE/TTP. SuEP tem BQI, Consumer Complaints, TRIR, LTI, OEE | BAIXA | Para V2+. Requer integracao com dados de Quality e Safety pillars. |

### 4.2 Correlacoes nao exploradas

| # | Correlacao | Status | Valor |
|---|-----------|--------|-------|
| C1 | **VPO pilar individual x dominio digital correspondente** (ex: Maintenance pilar score x MT domain score) | NAO EXISTE | Provaria que maturidade VPO no pilar e pre-requisito para maturidade digital no dominio correspondente. |
| C2 | **VPO score x velocidade de adocao** (tempo ate L2 desde implantacao de produto Global) | NAO EXISTE (falta dado temporal) | Provaria que plantas com VPO alto adotam mais rapido. |
| C3 | **Partial correlation por pilar VPO** (efeito proprio de cada pilar controlando overall) | JA EXISTE (`computePillarPartials()`) | Excelente. Mostra que Maintenance e People tem efeito proprio; outros sao espurios. Manter e dar mais visibilidade. |
| C4 | **VPO score x variabilidade de OSE** (nao so media, mas desvio padrao) | NAO EXISTE | VPO alto deveria reduzir variabilidade (SDCA). Isso e uma prova poderosa do valor de VPO. |
| C5 | **Tech maturity x KPI por pilar VPO band** (analise estratificada) | PARCIAL (threshold sweep existe, mas nao estratifica por band) | Mostrar que o efeito de tech em OSE e diferente em cada banda VPO. |

### 4.3 Perspectivas temporais faltantes

| # | Gap temporal | Impacto | Sugestao |
|---|-------------|---------|----------|
| T1 | **Serie historica de scores de maturidade digital** | Impossivel medir velocidade de adocao ou tendencia do funil | Armazenar snapshot mensal dos scores (CSV_DATA) em um historical.json. Mesmo se comecado agora, em 6 meses tera valor. |
| T2 | **Serie historica de VPO scores** | Impossivel correlacionar mudanca de VPO com mudanca de tech adoption ou KPI | Armazenar snapshot de vpo-site-scores apos cada assessment cycle (anual). |
| T3 | **Delta de funil L0-L4 entre periodos** | Executive nao sabe se o funil esta melhorando ou piorando | Card "delta vs periodo anterior" no executive view. Requer T1. |
| T4 | **OSE sparkline por SITE (nao so por zona)** | Na tabela de sites, OSE e um numero estatico. Nao se sabe se o site esta melhorando. | Requer dados de OSE por planta ao longo do tempo. Hoje so temos por zona (kpi-history.json). |
| T5 | **Projecao de atingimento de L2+ target** | Sem serie historica, nao ha como projetar quando cada zona atingira o target de L2+ | Requer T1. Com serie, aplicar projecao linear com confianca. |

### 4.4 Recomendacoes de melhoria (priorizadas)

| # | Recomendacao | Esforco | Impacto | Sprint sugerido |
|---|-------------|---------|---------|----------------|
| R1 | Implementar readinessClass 'vpo_foundation' | Baixo | Alto | Proximo sprint |
| R2 | Adicionar coluna VPO Band (Bronze/Silver/Gold/Platinum) + filtro | Baixo | Alto | Proximo sprint |
| R3 | Adicionar pilares VPO criticos como mini-bars na SiteTable | Medio | Alto | Sprint seguinte |
| R4 | Flag de shelfware risk (Global ativo + VPO pilar baixo) | Medio | Medio | Sprint seguinte |
| R5 | Correlacao VPO pilar x dominio digital (C1) | Medio | Alto | Sprint seguinte |
| R6 | Iniciar coleta de snapshot historico de scores (T1) | Baixo | Alto (futuro) | Imediato |
| R7 | VPO score x variabilidade OSE (C4) | Medio | Medio | V2 |
| R8 | SuEP KPIs adicionais (G6) | Alto | Medio | V2+ |

---

## Apendice A: Mapeamento de dados disponiveis vs necessarios

| Dado | Disponivel? | Arquivo | Notas |
|------|------------|---------|-------|
| Tech maturity scores por site+dominio | Sim | `CSV_DATA` em App.tsx | 163 sites, 9 dominios, score 0-4 |
| Global/Legacy por site+dominio | Sim | `SITE_DOMAIN_TYPE` em App.tsx | 246 sites |
| VPO overall score por site | Sim | `vpo-site-scores-2026.json` | overall_score 0-1 |
| VPO pillar scores por site | Sim | `vpo-site-scores-2026.json` | 7 pilares, score + y/n/na + by_level |
| OSE por zona (serie mensal) | Sim | `kpi-history.json` | 6 zonas, periodos mensais |
| OSE/TTP por site (snapshot) | Sim | `anaplan-kpis-2025.json` | join via normalizePlantToSite() |
| N3/N4 capabilities | Sim | `portfolio_capabilities.json` | 1679 capabilities |
| Waterfall OSE decomposition | Sim | `waterfall.json` | Por zona |
| VPO assessment historico | NAO | -- | Necessario para perspectiva temporal |
| Tech maturity historico | NAO | -- | Necessario para tendencia de funil |
| OSE por site (serie mensal) | NAO | -- | So existe por zona |
| SuEP KPIs (BQI, TRIR, etc.) | NAO | -- | Para V2+ |

## Apendice B: Glossario VPO para o time de desenvolvimento

| Termo | Significado no contexto do dashboard |
|-------|--------------------------------------|
| VPO | Voyager Plant Optimization -- sistema de gestao de plantas AB InBev |
| MCRS | Management Control Report System -- rotinas de gestao em cascata (Hourly -> SHO -> Daily -> Weekly -> Monthly) |
| SDCA | Standardize-Do-Check-Act -- manutencao de processo estavel |
| PDCA | Plan-Do-Check-Act -- melhoria incremental |
| PTS | Process Technical Specifications -- parametros de processo |
| SOP | Standard Operating Procedure |
| TSC | Target Setting & Cascading -- processo anual de definicao de metas |
| SuEP | Supply Excellence Program -- programa de excelencia com 6 pilares de KPI |
| BEP | Brewery Excellence Program -- nivel de planta do SuEP |
| ZBS | Zone Business Services -- camada de zona que coordena VPO assessments |
| OSE | Overall Supply Efficiency = EPT/OST -- principal KPI de eficiencia |
| TTP | Throughput per hour -- velocidade de producao |
| AM/PM | Autonomous Maintenance / Professional Maintenance -- steps do pilar Maintenance |
