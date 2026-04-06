# BA Manufacturing — Mapeamento de Conteudo por Aba

**Produto:** Coverage Dashboard
**Autor:** BA Packaging/Manufacturing — Dev Crew
**Data:** 2026-04-04
**Baseline de dados:** CSV_DATA (163 sites), SITE_DOMAIN_TYPE (246 sites), waterfall.json, kpi-history.json, anaplan-ose-ttp-2025.json, anaplan-kpis-2025.json, portfolio_capabilities.json (1679 N4s), product-coverage-2026.json, vpo-assessment-2026.json, vpo-site-scores-2026.json

---

## Sumario

Este documento mapeia como cada aba do dashboard deve expor KPIs industriais de Manufacturing (Brewing, Packaging, Quality, Maintenance, Safety, Utilities), conectando maturidade digital com resultado operacional. O objetivo e permitir que VPs de Zona e ZBS Directors respondam: "Qual investimento em tecnologia digital destrava mais resultado industrial?"

---

## 1. Mapeamento de KPIs Industriais por Aba

### 1.1 Executive Summary (`executive`)

**Finalidade Manufacturing:** Responder em 5 segundos: "Como estao meus KPIs industriais e a maturidade digital esta ajudando?"

**KPIs industriais obrigatorios:**

| KPI | Codigo Anaplan | Formato | Fonte no projeto |
|-----|---------------|---------|------------------|
| **OSE** (Overall System Effectiveness) | PG-K4038 (fallback) ou EPT/OST (PG-R0060/PG-K4039) | % gauge + sparkline 12 meses | waterfall.json (ultimo mes) + kpi-history.json (serie) |
| **GLY** (Gross Line Yield) | EPT/ST | % gauge | waterfall.json |
| **TTP** (Total Throughput Performance) | PG-K0412 | hL/h | anaplan-ose-ttp-2025.json |
| **OEE** (Overall Equipment Effectiveness) | EPT/LT | % | waterfall.json |
| **VPO Assessment Score** | -- | 0-1 score | vpo-site-scores-2026.json |

**Como mostrar correlacao maturidade digital -> resultado industrial:**

1. **Hero card OSE** com delta vs mes anterior e vs budget. Cor semantica: verde >= target, amarelo gap < 3pp, vermelho gap > 3pp.
2. **Sparkline 12 meses obrigatoria** (nunca so agregado -- feedback BA temporal analysis). A serie vem de kpi-history.json (12 meses, 6 zonas).
3. **Correlation badge** ao lado do OSE: "Zonas com score digital > 1.5 tem OSE +7.2pp vs L1" (dado real do CLAUDE.md, transicao L1->L2 VPO Alto).
4. **VPO confound warning**: quando a zona tem VPO < Intermediate, exibir footnote: "Resultado influenciado por maturidade VPO -- comparacao direta requer controle de cluster."

**Formato recomendado:**

```
+------------+  +------------+  +------------+  +------------+
|  OSE 66.9% |  | GLY 75.2%  |  | TTP 2.3h/h |  | OEE 84.5%  |
|  [=======] |  | [========] |  |             |  | [========] |
|  +1.2pp MoM|  | -0.3pp MoM |  | +0.1 MoM   |  | +0.5pp MoM |
|  ~~~~~~~~~ |  | ~~~~~~~~~ |  | ~~~~~~~~~ |  | ~~~~~~~~~ |
|  12m spark  |  | 12m spark  |  | 12m spark  |  | 12m spark  |
+------------+  +------------+  +------------+  +------------+
```

**Perspectiva temporal (OBRIGATORIO):**
- Serie mensal minima de 12 meses (kpi-history.json cobre Mar/2025 a Fev/2026)
- Tendencia via regressao linear simples (slope positivo/negativo/flat)
- Marcacao de sazonalidade conhecida (ex: SAZ Q3/Q4 alta, APAC Q4 queda)
- Delta MoM com classificacao: estavel (<1.5pp), significativo (>3pp), critico (>5pp)

**Dados disponíveis e usados hoje:**
- waterfall.json: Global + 6 zonas, periodo 2026-02, todos os blocos do waterfall (TT, NST, ST, DPA, LT, EC, LET, IC, EPT, OST) + KPIs derivados (OSE, GLY, OAE, OEE, LEF)
- kpi-history.json: 12 meses x 6 zonas, mesmos blocos + KPIs derivados
- ExecutiveSummaryView ja exibe OSE hero cards e navega para detalhes

**Gap atual:** O executive view mostra OSE mas falta sparkline temporal com tendencia. O TTP nao aparece no executive. Nao ha badge de correlacao digital->industrial.

---

### 1.2 Maturity vs Results (`maturityVsResults`)

**Finalidade Manufacturing:** Provar (ou refutar) que maturidade digital impacta KPIs industriais.

**Sub-views existentes:**
- **Scatter Plot**: Maturidade (X) x OSE% (Y), cada ponto = site
- **Drivers de OSE**: Waterfall decomposition por zona
- **Migration Value**: Impacto projetado por transicao de nivel

**Para cada dominio digital -- KPI industrial primario:**

| Dominio Digital | KPI Industrial Primario | KPIs Secundarios | Como maturidade digital impacta |
|-----------------|------------------------|------------------|--------------------------------|
| **BP** (Brewing Performance) | **OSE** | Brewing yield, extract losses, TTP | MES/Omnia monitora processo em tempo real -> reducao de EC (External Causes) por brewing supply. SCADA integrado permite ajuste automatico de fermentacao, reducao de hold time. Impacto direto no bloco EC do waterfall. |
| **PP** (Packaging Performance) | **GLY / OSE** | OEE, LEF, changeover time, IC | PTS de packaging (Omnia PTS) controla parametros de linha (velocidade, pressao, CO2, O2/TPO). LMS (Line Management System) otimiza sequenciamento -> reducao de DPA (changeover). Sensor fusion detecta micro-stops -> reducao de IC. Impacto nos blocos DPA e IC do waterfall. |
| **QL** (Quality) | **VIC (Visual Inspection Compliance)** | BQI, rejeicao VPI, quality holds, Glass Inclusion rate | PTS Execution digital garante frequencia de testes. IQ (Instrument Qualification) calibra sensores automaticamente. Reducao de EC por quality holds e IC por quality losses. **Glass Inclusion prevention** requer controle digital robusto de GMP e PRP. |
| **MT** (Maintenance) | **OEE** | MTBF, MTTR, planned vs unplanned ratio | CMMS/MAX WO digitaliza work orders. Predictive/CBM (Condition Based Monitoring) antecipa falhas -> reducao de IC (failures >=10min). PS (Planning & Scheduling) otimiza PM -> reducao de DPA (PM/Overhauls). Impacto nos blocos DPA e IC. |
| **SF** (Safety) | **TRIR / LTI rate** | Near-miss reporting rate, safety audit score | Guardian digitaliza BOS (Behavioral Observation System). Lock-out/Tag-out digital. Impacto indireto: planta segura = menos paradas por investigacao de incidente (EC ou DPA). |
| **UT** (Utilities) | **TPE (Total Primary Energy)** | CO2 surplus, water ratio, steam efficiency | SCADA de utilidades + SODA ETL permite monitoramento real-time de consumo. Otimizacao de CIP (menos agua/energia) -> reducao de DPA (CIP time). Reducao de EC por utilities failure. **ALERTA: UT tem ZERO N4s mapeados em portfolio_capabilities.json -- gap critico de planejamento.** |
| **DA** (Data Acquisition) | **Nenhum KPI direto** | Disponibilidade de dados, % de linhas com coleta automatica | DA e a fundacao: sem coleta de dados nao ha visibilidade. Impacto indireto em TODOS os KPIs -- e pre-requisito para BP, PP, QL, MT. Sites com DA em L0 nao conseguem calcular OSE real. |
| **MDM** (Master Data Management) | **Nenhum KPI direto** | Acuracia de BOM, integridade de dados mestres | MDM garante que materiais, recipes e equipment trees estejam corretos no SAP/MES. Impacto indireto: dados mestres errados causam retrabalho em scheduling (DPA) e erros de processo (IC/quality losses). |
| **MG** (Management) | **VPO Assessment Score** | MCRS compliance, action log closure rate | Acadia/InterActionLog digitalizam gestao VPO. Impacto: gestao digital mais rapida -> ciclo PDCA mais curto -> melhoria de todos os KPIs ao longo do tempo. Correlacao indireta mas forte com OSE (VPO e a principal variavel de confundimento). |

**Blocking domain analysis -- como priorizar por impacto em OSE:**

O dominio que "bloqueia" mais uma planta deve ser priorizado nao pelo score mais baixo, mas pelo maior impacto potencial em OSE. Regra:

```
Impacto_estimado(dominio) =
    peso_waterfall[dominio] * (score_target - score_atual) * elasticidade[dominio]

Onde:
  peso_waterfall = fracao do waterfall que o dominio influencia
    BP -> EC_brewing + IC_process (tipicamente 5-15% do ST)
    PP -> DPA_changeover + IC_failures + IC_speed (tipicamente 20-35% do ST)
    QL -> EC_quality_holds + IC_quality_losses (tipicamente 3-8% do ST)
    MT -> DPA_PM + IC_failures (tipicamente 15-25% do ST)
    UT -> EC_utilities + DPA_CIP (tipicamente 3-8% do ST)
    SF -> EC_safety (tipicamente <2% do ST)

  elasticidade = ganho observado por ponto de maturidade
    (dados CLAUDE.md: L1->L2 = +7.2pp OSE para VPO Alto)
```

**PP (Packaging Performance) e o dominio de maior impacto potencial** porque influencia os dois maiores blocos de perda: DPA (changeover) e IC (failures + speed losses), que juntos representam 35-60% das perdas em ST.

---

### 1.3 Zone View (`zone`)

**Finalidade Manufacturing:** Comparar performance industrial entre zonas e identificar best practices.

**KPIs industriais por zona (dados disponiveis em waterfall.json, Feb/2026):**

| Zona | OSE | GLY | OAE | OEE | LEF | Maior gap vs Global |
|------|-----|-----|-----|-----|-----|---------------------|
| APAC | 85.3% | 86.2% | 36.0% | 95.2% | 98.0% | OAE baixo (NST alto = 58% do TT) |
| MAZ | 74.7% | 79.9% | 48.8% | 90.9% | 93.6% | GLY (DPA + IC) |
| NAZ | 67.5% | 72.9% | 37.6% | 86.0% | 87.9% | OSE (NST + IC) |
| Global | 66.9% | 75.2% | 42.6% | 84.5% | 87.6% | -- |
| SAZ | 63.8% | 75.3% | 46.1% | 80.8% | 83.2% | OEE (IC = 16.8% do LET) |
| EUR | 54.9% | 57.5% | 33.9% | 68.5% | 74.3% | GLY e OEE (IC = 25.7% do LET) |
| AFR | 52.8% | 68.5% | 45.8% | 78.8% | 83.1% | OSE (NST + DPA + IC) |

**Como o zone view deve usar dados industriais:**
1. Cada card de zona deve ter OSE + GLY como subtitulo (ja parcialmente implementado)
2. **Serie temporal obrigatoria**: kpi-history.json tem 12 meses por zona -- mostrar mini-sparkline
3. **Waterfall mini**: para cada zona, mostrar barra empilhada simplificada (NST | DPA | EC | IC | EPT) normalizada por ST
4. **Ranking de oportunidade**: ordenar zonas por maior gap EPT vs ST (= maior potencial de GLY)

**Conexao maturidade -> industrial por zona:**
- EUR tem o pior OSE (54.9%) E o pior VPO da rede. Tecnologia sozinha nao resolve -- VPO precisa subir primeiro.
- APAC tem OSE alto (85.3%) mas OAE baixo (36%) -- o problema e NST (58% do TT = no demand), nao tecnologia.
- SAZ e AFR tem IC alto -> dominio MT e PP sao prioritarios para investimento digital.

---

### 1.4 Domain View (`domain`)

**Finalidade Manufacturing:** Para cada dominio digital, mostrar status de maturidade E impacto industrial.

**Para cada dominio, exibir:**

1. **Funil L0-L4** (ja implementado)
2. **KPI industrial primario** da tabela da secao 1.2
3. **Waterfall component** que o dominio influencia:

| Dominio | Bloco do waterfall impactado | Como medir impacto |
|---------|-----------------------------|--------------------|
| BP | EC (brewing supply) | EC/LT < 2% = saudavel |
| PP | DPA (changeover) + IC (failures, speed) | DPA/ST < 12% + IC/LET < 15% |
| QL | EC (quality holds) + IC (quality losses) | EC_quality/LT < 1% + IC_quality/LET < 3% |
| MT | DPA (PM/overhauls) + IC (failures >=10min) | DPA_PM/ST < 3% + IC_failures/LET < 8% |
| SF | EC (safety stops) | EC_safety/LT < 0.5% |
| UT | EC (utilities) + DPA (CIP) | EC_utilities/LT < 1.5% + DPA_CIP/ST < 3% |
| DA | Nenhum direto | % linhas com coleta automatica (proxy) |
| MDM | Nenhum direto | Acuracia de dados mestres (nao disponivel) |
| MG | Nenhum direto | VPO Assessment Score (vpo-site-scores-2026.json) |

**Gap atual:** O domain view mostra apenas o funil de maturidade. Falta o KPI industrial correspondente e o componente do waterfall. A conexao "este dominio impacta este bloco de perda" nao e visivel.

---

### 1.5 Site View (`sites`)

**Finalidade Manufacturing:** Drill-down por planta para investigar performance individual.

**Colunas industriais obrigatorias:**

| Coluna | Fonte | Prioridade |
|--------|-------|-----------|
| Site | CSV_DATA | P0 |
| Zone | CSV_DATA | P0 |
| Volume (hL) | CSV_DATA | P0 |
| Volume Group (G1/G2/G3) | Derivado de Volume | P0 |
| Score medio (maturidade) | CSV_DATA | P0 |
| OSE% | anaplan-ose-ttp-2025.json (PG-K4038) | P0 |
| GLY% | Calculado se EPT e ST disponiveis | P1 |
| TTP (hL/h) | anaplan-ose-ttp-2025.json (PG-K0412) | P1 |
| VPO Score | vpo-site-scores-2026.json | P1 |
| VPO Cluster | Derivado de VPO Score | P1 |
| Dominio mais fraco | MIN(scores por dominio) do CSV_DATA | P2 |
| # dominios em Legacy | SITE_DOMAIN_TYPE count(L) | P2 |

**Como ordenar/filtrar por potencial de ganho industrial:**

```
Potencial_ganho(site) =
    (OSE_target_zona - OSE_site) * Volume_site / 1000000

Onde OSE_target_zona = media dos top-25% sites da mesma zona
```

Sites com alto potencial de ganho E baixo score digital sao os **quick-wins** para investimento em tecnologia.

**Comparacao entre sites -- regras:**
1. **Mesma zona**: comparacao direta e valida
2. **Mesmo volume group**: G1 (<2M hL), G2 (2-6M hL), G3 (>6M hL) -- plantas de volume similar tem complexidade comparavel
3. **Mesmo cluster VPO**: NUNCA comparar site VPO Baixo com VPO Alto -- a variavel de confundimento distorce tudo (CLAUDE.md alerta 1, 2, 3)
4. **Cross-zona**: so valida com controle de VPO e volume group

**Gap atual:** SitesView exibe sites com scores por dominio e OSE quando disponivel (anaplan data). Faltam: volume group como filtro, VPO cluster, ranking por potencial de ganho.

---

### 1.6 Portfolio Intelligence (`portfolioIntelligence`)

**Finalidade Manufacturing:** Mostrar prontidao para migracao de legados para produtos globais.

**Conexao com KPIs industriais:**
- Cada capability N4 do portfolio_capabilities.json mapeia para um dominio
- Dominios com baixo % READY significam que a planta depende de legados
- Legados tipicamente nao integram com MES/SCADA global -> perda de visibilidade -> KPIs nao monitorados em real-time

**Capabilities "must-have" por dominio para desbloquear ganhos:**

| Dominio | Capability critica (N2/N3) | Por que e must-have | Impacto no KPI |
|---------|---------------------------|---------------------|----------------|
| PP | LMS Line Scheduling | Sequenciamento otimizado reduz changeover | DPA -2 a -5pp |
| PP | PTS Packaging Execution | Controle de parametros de linha em real-time | IC quality -1 a -3pp |
| BP | Omnia BMS Process Control | Controle automatico de brassagem | EC brewing -1 a -3pp |
| QL | PTS Frequency Compliance | Garante frequencia de testes conforme SOP | Quality holds -50% |
| QL | IQ Instrument Qualification | Calibracao automatica de sensores | Acuracia de medicao +20% |
| MT | MAX WO Execution | Work order digital com SLA tracking | MTTR -15 a -25% |
| MT | CBM Condition Monitoring | Predictive maintenance via sensores | Unplanned downtime -20 a -40% |
| SF | Guardian BOS | Behavioral observation digital | Near-miss reporting +3x |
| DA | SODA ETL Data Pipeline | Coleta automatica de dados de linha | % dados confiavel +50pp |
| MG | Acadia VPO Management | Gestao VPO digital (MCRS, routines) | PDCA cycle time -30% |

**Status atual dos dominios (portfolio_capabilities.json):**

| Dominio | Total N4s | READY | % Ready | Risco |
|---------|-----------|-------|---------|-------|
| MT | 432 | 196 | 45% | Medio |
| QL | 331 | 69 | 20% | Muito alto |
| PP | 310 | 69 | 22% | Muito alto |
| BP | 221 | 61 | 27% | Alto |
| SF | 128 | 35 | 27% | Alto |
| MG | 111 | 66 | 59% | Baixo |
| DA | 75 | 26 | 34% | Alto |
| MDM | 40 | 16 | 40% | Medio |
| **UT** | **0** | **0** | **0%** | **CRITICO -- nenhum N4 mapeado** |

**Timeline de gap closure com impacto projetado:**
- 261 N4s planejados para 2026, 310 para 2027, 145 para 2028
- Se entregues conforme roadmap, Functional Coverage sobe de 32.8% para ~47% em Q4/2026 e ~65% em Q4/2027
- Impacto projetado em OSE: cada 10pp de Functional Coverage esta correlacionado com ~1-2pp de OSE incremental (estimativa conservadora baseada na transicao L1->L2)

**Gap atual:** PortfolioIntelligenceView exibe tree de capabilities e deployment. Falta: conexao com KPI industrial, must-have capabilities destacadas, timeline com impacto projetado.

---

### 1.7 Capability Gap (`capabilityGap`)

**Finalidade Manufacturing:** Detalhar gaps especificos de capabilities por site e dominio.

**Conexao com KPIs industriais:**
- Cada capability gap = funcionalidade digital ausente = processo manual
- Processos manuais geram: maior variabilidade, tempo de resposta mais lento, menos dados
- Isso se traduz em perdas especificas no waterfall

**Como mostrar impacto:**
1. Para cada gap, indicar o bloco do waterfall impactado (DPA, EC, IC)
2. Estimar perda evitavel: `horas_perdidas_no_bloco * (% atribuivel ao gap)`
3. Ranquear gaps por impacto em horas de producao recuperavel

**Gap atual:** CapabilityGapView mostra gaps por dominio e site. Falta: impacto estimado em horas/OSE por gap.

---

## 2. Tabela Consolidada: Dominio Digital -> KPIs Industriais

| Dominio Digital | KPI Industrial Primario | KPIs Secundarios | Bloco Waterfall | Como maturidade digital impacta | Elasticidade estimada (L1->L2) |
|-----------------|------------------------|------------------|-----------------|---------------------------------|-------------------------------|
| **BP** | OSE | Brewing yield, extract loss, fermentation efficiency | EC (brewing supply) | MES/Omnia monitora processo -> ajuste automatico -> menos paradas por falta de cerveja/problemas de processo | +7.2pp OSE (agregado, inclui PP) |
| **PP** | GLY / OSE | OEE, LEF, changeover time, AVCOT, IC rate | DPA (changeover) + IC (failures, speed, quality) | LMS sequencia -> menos changeover. PTS parametriza -> menos rejeicao. Sensor fusion -> menos micro-stops | +7.2pp OSE (agregado com BP) |
| **QL** | VIC / BQI | Quality holds rate, Glass Inclusion rate, rejeicao VPI | EC (quality holds) + IC (quality losses) | PTS digital garante frequencia. IQ calibra sensores. Rastreabilidade automatica de lote (GS1/SSCC) | Indireto: -1 a -2pp em IC quality |
| **MT** | OEE | MTBF, MTTR, planned/unplanned ratio, PM compliance | DPA (PM/overhauls) + IC (failures >=10min) | WO digital com SLA. CBM antecipa falha. PS otimiza calendario de preventivas | +2 a +4pp OEE |
| **SF** | TRIR / LTI | Near-miss rate, BOS compliance, safety audit score | EC (safety stops) | Guardian digitaliza BOS. LOTO digital. Reporting automatico | Indireto |
| **UT** | TPE (MJ/hL) | CO2 surplus, water ratio, steam efficiency | EC (utilities) + DPA (CIP) | SCADA de utilidades + analytics. Otimizacao de CIP. Deteccao de leaks | +42.8 MJ/hL TPE (L1->L2) |
| **DA** | Nenhum direto | % linhas com coleta automatica, data availability | Pre-requisito para todos | Sem DA nao ha dados para calcular KPIs. DA e a fundacao que habilita todos os outros dominios | Habilitador |
| **MDM** | Nenhum direto | BOM accuracy, recipe accuracy | Indireto via todos | Dados mestres errados -> erros de scheduling (DPA) + erros de processo (IC) | Habilitador |
| **MG** | VPO Score | MCRS compliance, action closure rate, routine adherence | Indireto via todos | Gestao digital acelera PDCA -> todos os KPIs melhoram ao longo do tempo | Amplificador |

---

## 3. Regras de Negocio de Manufacturing

### 3.1 Calculo e Decomposicao do OSE

**Formula canonica (docs/METODOLOGIA_VOLUME_OSE.md):**

```
OSE = SIGMA(EPT) / SIGMA(OST)

Onde:
  EPT = Effective Production Time (PG-R0060)
  OST = Overall Supply Time (PG-K4039)
```

**REGRA CRITICA: Nunca fazer media simples de OSE por linha/planta/zona. Sempre agregar EPT e OST primeiro, depois dividir.**

**Hierarquia de agregacao:** Linha -> Planta -> Country -> Zone -> Global

**Decomposicao via waterfall (todos os valores em horas):**

```
TT (Total Time)
 |-- NST (Non-Scheduled Time) ........... nao agendado (no demand, engineering, etc.)
 |-- ST (Scheduled Time) = TT - NST
      |-- DPA (Deliberate Plant Action) .. paradas planejadas (changeover, CIP, PM)
      |-- LT (Loading Time) = ST - DPA
           |-- EC (External Causes) ...... causas externas (brewing, utilities, quality)
           |-- LET (Line Equipment Time) = LT - EC
                |-- IC (Induced Causes) .. causas da linha (falhas, speed loss, quality)
                |-- EPT (Effective Production Time) = LET - IC
```

**KPIs derivados:**

| KPI | Formula | O que mede |
|-----|---------|-----------|
| GLY | EPT / ST | Eficiencia durante tempo agendado |
| OSE | EPT / OST | Eficiencia sobre o tempo total de supply |
| OAE | EPT / TT | Utilizacao total do ativo |
| OEE | EPT / LT | Eficiencia operacional (exclui DPA) |
| LEF | EPT / LET | Eficiencia de equipamento (exclui DPA e EC) |

### 3.2 TTP (Total Throughput Performance)

**Codigo Anaplan:** PG-K0412
**Unidade:** hL/h
**O que mede:** Volume produzido por hora de producao efetiva. Mede velocidade real vs potencial.

**Interpretacao:**
- TTP alto + OSE alto = planta eficiente e rapida
- TTP alto + OSE baixo = planta rapida quando roda, mas para muito
- TTP baixo + OSE alto = planta que roda bastante, mas devagar (speed losses)
- TTP baixo + OSE baixo = planta com problemas em ambas dimensoes

**Dados disponiveis:** anaplan-ose-ttp-2025.json tem TTP (PG-K0412) por planta, YTD 2025.

### 3.3 Interpretacao do Waterfall

**Regras de severidade (fonte: packaging_waterfall_insight_rules.md):**

| Metrica | Normal | Alta | Critica |
|---------|--------|------|---------|
| NST (% de TT) | <25% | 25-40% | >40% |
| DPA (% de ST) | <12% | 12-20% | >20% |
| EC (% de LT) | <5% | 5-10% | >10% |
| IC (% de LET) | <15% | 15-25% | >25% |

**Aplicando aos dados reais (waterfall.json, Feb/2026):**

| Zona | NST/TT | DPA/ST | EC/LT | IC/LET | Classificacao |
|------|--------|--------|-------|--------|---------------|
| APAC | **58.2%** CRIT | 9.5% NORM | 1.9% NORM | 2.0% NORM | NST critico (no demand) |
| MAZ | 38.9% ALTA | 12.1% ALTA | 1.6% NORM | 6.4% NORM | NST + DPA altos |
| NAZ | **48.4%** CRIT | 15.2% ALTA | 1.7% NORM | 12.1% NORM | NST critico + DPA alto |
| Global | 43.3% CRIT | 10.9% NORM | 2.0% NORM | 12.4% NORM | NST critico |
| SAZ | 38.7% ALTA | 6.9% NORM | 1.5% NORM | **16.8%** ALTA | IC alta (SAZ foco) |
| EUR | 41.2% CRIT | 16.0% ALTA | 3.1% NORM | **25.7%** CRIT | IC critico + NST critico + DPA alto |
| AFR | 33.1% ALTA | 13.1% ALTA | 3.1% NORM | **16.9%** ALTA | DPA e IC altos |

**Conclusao waterfall:** EUR e AFR sao as zonas com mais oportunidade de melhoria via tecnologia digital, com IC e DPA acima dos thresholds. APAC e NAZ perdem mais por NST (problema de demanda/scheduling, nao de linha).

### 3.4 Thresholds de Performance

| Nivel | OSE | GLY | OEE | Referencia |
|-------|-----|-----|-----|-----------|
| **World Class** | >80% | >85% | >90% | Top-5% global AB InBev |
| **Best in Class** | 70-80% | 78-85% | 85-90% | Top-25% |
| **Average** | 55-70% | 65-78% | 75-85% | Mediana |
| **Below Average** | 40-55% | 50-65% | 60-75% | Bottom-25% |
| **Poor** | <40% | <50% | <60% | Requer intervenção urgente |

### 3.5 Volume Groups e Benchmarking

| Grupo | Faixa (conforme CLAUDE.md) | Caracteristicas |
|-------|---------------------------|-----------------|
| G1 | < 2.000.000 hL | Menor complexidade, menos linhas, menor mix SKU |
| G2 | 2.000.000 - 6.000.000 hL | Complexidade media, 3-8 linhas tipicas |
| G3 | > 6.000.000 hL | Alta complexidade, muitas linhas, alto mix SKU |

**Regra de benchmarking:** Sempre comparar dentro do mesmo volume group. G3 tende a ter OSE mais baixo pela complexidade (mais changeovers, mais linhas, mais SKUs). Comparar G3 com G1 sem ajuste e enganoso.

**Packaging Cup (ZBS):** Scoring anual de benchmarking entre plantas. Normaliza por formato de linha (can, bottle, PET), velocidade nominal e complexidade de mix. O dashboard deveria indicar a posicao no Packaging Cup quando disponivel.

---

## 4. Conexoes Cross-Aba

### 4.1 Contexto industrial que deve ser passado entre abas

| De | Para | Contexto passado | Interacao |
|----|------|-----------------|-----------|
| Executive -> Zone | OSE global highlighted, zona selecionada | Click na zona no executive navega para zone view com zona pre-filtrada |
| Executive -> MaturityVsResults | KPI selecionado (OSE/GLY/TTP) | Click no hero card de KPI navega para scatter com aquele KPI no eixo Y |
| Zone -> Sites | Zona selecionada + volume group | Click em zona filtra sites daquela zona |
| Zone -> Domain | Zona selecionada | Manter filtro de zona ao trocar para domain view |
| Domain -> Portfolio | Dominio selecionado | Click em dominio navega para portfolio filtrado naquele dominio |
| Sites -> MaturityVsResults | Site selecionado highlighted no scatter | Click no site na tabela destaca o ponto no scatter |
| MaturityVsResults -> Sites | Quadrante selecionado | Click num quadrante do scatter filtra a tabela de sites |
| Portfolio -> CapabilityGap | Dominio + zona selecionados | Click em gap no portfolio navega para detalhamento |

### 4.2 Links de drill-down

| KPI clicavel | Drill-down para | O que mostra |
|-------------|-----------------|-------------|
| OSE (hero card) | Waterfall decomposition (MaturityVsResults > Drivers de OSE) | Barras empilhadas NST/DPA/EC/IC/EPT por zona |
| GLY (hero card) | Zone view com GLY highlight | GLY por zona + serie temporal |
| TTP (hero card) | Scatter TTP x Maturidade | Cada site como ponto, TTP no eixo Y |
| Score dominio (domain view) | Portfolio filtrado | Capabilities daquele dominio, status READY/NOT READY |
| OSE de site (site table) | Site detail com waterfall (nao existe hoje) | Waterfall da planta individual |

### 4.3 Filtros industriais que devem persistir

| Filtro | Escopo | Persiste entre abas? |
|--------|--------|---------------------|
| Zona | Global | Sim -- filtro primario |
| Volume Group | Global | Sim -- afeta benchmarking |
| VPO Cluster | MaturityVsResults, Sites | Sim -- variavel de confundimento |
| Dominio | Domain, Portfolio, CapabilityGap | Sim dentro do fluxo domain->portfolio->gap |
| Periodo (mes) | Waterfall, KPI history | Sim -- usuario pode navegar no tempo |

---

## 5. Gaps Identificados no Dashboard Atual

### 5.1 KPIs industriais que faltam

| KPI | Importancia | Dados disponiveis? | Onde deveria aparecer |
|-----|-------------|--------------------|-----------------------|
| **GLY** | Alta -- eficiencia durante tempo agendado | Sim (waterfall.json: EPT/ST) | Executive hero + Zone cards |
| **OEE** | Alta -- eficiencia operacional | Sim (waterfall.json: EPT/LT) | Zone cards + Site table |
| **LEF** | Media -- eficiencia de equipamento | Sim (waterfall.json: EPT/LET) | Site detail drill-down |
| **TTP** no executive | Alta -- velocidade de producao | Sim (anaplan-ose-ttp-2025.json) | Executive hero card |
| **VPO Score** por site | Alta -- variavel de confundimento | Sim (vpo-site-scores-2026.json) | Site table + scatter |
| **NST breakdown** | Media -- entender causas de nao-uso | Nao (waterfall.json so tem NST total) | Zone waterfall detail |
| **IC breakdown** (failures vs speed vs quality) | Alta -- direciona acao | Nao (waterfall.json so tem IC total) | Domain view (MT, PP, QL) |
| **DPA breakdown** (changeover vs CIP vs PM) | Alta -- direciona acao | Nao (waterfall.json so tem DPA total) | Domain view (PP, MT) |
| **Volume** em waterfall | Media -- normalizar por hL | Parcial (volume_hl = 0 em waterfall.json) | Zone cards |

### 5.2 Correlacoes nao exploradas

| Correlacao | Hipotese | Dados disponíveis | Dificuldade |
|-----------|----------|------------------|-------------|
| **Score PP x IC/LET** | Maturidade em Packaging reduz IC | CSV_DATA (PP score) + waterfall.json (IC/LET por zona) | Baixa -- so precisa cruzar |
| **Score MT x DPA_PM + IC_failures** | Maturidade em Manutencao reduz paradas | CSV_DATA (MT score) + waterfall.json (DPA + IC por zona) | Baixa -- so precisa cruzar |
| **Score BP x EC_brewing** | Maturidade em Brewing reduz paradas por falta de cerveja | CSV_DATA (BP score) + waterfall.json (EC por zona) | Baixa |
| **VPO Score x OSE** | VPO e o principal preditor de OSE | vpo-site-scores-2026.json + anaplan-ose-ttp-2025.json | Media -- precisa join por site |
| **Score DA x % dados disponiveis** | DA habilita visibilidade | CSV_DATA (DA score) vs coverage de dados | Alta -- nao temos % dados |
| **Legacy count x OSE** | Sites com muitos legados tem pior OSE | SITE_DOMAIN_TYPE (count L) + anaplan-ose-ttp-2025.json | Media -- precisa join |
| **Capability READY% x OSE por dominio** | Dominios com mais capabilities prontas geram melhor KPI | portfolio_capabilities.json + waterfall por zona | Media |

### 5.3 Dados que existem nos JSONs mas nao sao usados

| Dado | Arquivo | Status no dashboard | Recomendacao |
|------|---------|--------------------|--------------|
| **OEE, LEF** por zona | waterfall.json | Nao exibido | Adicionar ao zone view e site table |
| **kpi-history 12 meses** completo | kpi-history.json | Usado no MaturityVsResults mas nao no Executive | Sparklines no executive hero |
| **VPO pillar scores** por site | vpo-assessment-2026.json | Nao integrado | Filtro por VPO cluster + overlay no scatter |
| **VPO overall score** por site | vpo-site-scores-2026.json | Nao integrado | Coluna na site table + variavel de confundimento no scatter |
| **Legacy coverage** por capability | portfolio_capabilities.json (campo legacy_coverage) | Parcialmente usado | Mostrar quais legados bloqueiam cada capability |
| **Planned year/quarter** | portfolio_capabilities.json | Usado na timeline | Conectar com projecao de impacto em KPI |
| **Volume** por site | CSV_DATA (coluna Volume) | Usado para filtro | Usar para ponderar medias de OSE (weighted avg) |

### 5.4 Recomendacoes de Melhoria -- Priorizadas

**P0 -- Implementar imediatamente:**

1. **Sparkline temporal no Executive**: kpi-history.json ja tem 12 meses de dados. Adicionar sparkline aos hero cards de OSE. Nunca so valor agregado (feedback BA).

2. **VPO Score como filtro global**: vpo-site-scores-2026.json tem overall_score por site. Criar filtro de VPO cluster (Alto/Medio/Baixo) que persiste entre abas. Isso controla a principal variavel de confundimento.

3. **Volume-weighted OSE**: Atualmente OSE no executive e media simples por zona. Deve ser weighted por volume (ou melhor: SIGMA EPT / SIGMA OST conforme metodologia). waterfall.json ja fornece os agregados corretos.

**P1 -- Proximo sprint:**

4. **Tabela domain -> KPI industrial**: Adicionar ao domain view um indicador do KPI primario e o componente do waterfall impactado. Transformar dominio de "metrica de maturidade" em "alavanca de resultado".

5. **TTP no executive**: anaplan-ose-ttp-2025.json tem TTP (PG-K0412) por planta. Agregar e exibir como hero card.

6. **Site table enriquecida**: Adicionar colunas VPO Score, volume group, dominio mais fraco, # legados. Permitir sort por potencial de ganho.

**P2 -- Backlog:**

7. **Waterfall mini no zone view**: Barra empilhada NST|DPA|EC|IC|EPT por zona.

8. **Correlacao scatter domain-score x waterfall-block**: Scatter onde X = score do dominio (ex: MT) e Y = bloco correspondente do waterfall (ex: IC/LET).

9. **IC/DPA breakdown**: Requer dados adicionais (sub-blocos do waterfall). Se disponibilizados, habilita acoes muito mais especificas.

10. **Packaging Cup integration**: Se dados de Packaging Cup estiverem disponiveis, adicionar como coluna no site table e como metrica no zone view.

---

## 6. Implicacoes de Glass Inclusion, BCM e PRP

### 6.1 Glass Inclusion (CRITICO -- SMS Handbook 2026)

"A glass inclusion is to Quality what a lost time injury (LTI) is to Safety." O dashboard deve:

- Quando dominio QL esta em L0 ou L1, exibir alerta: "Controle de Glass Inclusion pode estar insuficiente -- verificar PRP assessment"
- Sites com bottle lines (identificaveis por formato de linha, se disponivel) devem ter indicador de Glass Inclusion risk
- O PRP assessment (mensal) deveria alimentar o dashboard como metrica de quality maturity complementar ao score digital

**Dados atuais:** Nao ha dados de Glass Inclusion ou PRP no dashboard. Recomendacao: incluir no proximo ciclo de ingestao de dados.

### 6.2 BCM (Beer Contact Material)

- Relevante para dominios QL e PP
- Materiais em contato com cerveja (gaskets, valve liners, can coatings, crown liners) devem seguir protocolo ABI-specific
- O controle digital de BCM (rastreabilidade de pecas, aprovacao de materiais) e uma capability que deveria estar mapeada em QL ou PP no portfolio
- **Status atual:** Nao ha capability BCM explicita no portfolio_capabilities.json

### 6.3 PRP (Pre-Requisite Program)

- Assessment mensal de higiene e GMP
- Scoring externo obrigatorio ("outside eyes") para evitar bias
- Sites com score QL digital alto mas PRP baixo sao risco: a tecnologia nao substitui GMP
- **Recomendacao:** Adicionar PRP score como metrica complementar ao QL digital score

---

## 7. Impacto no Packaging Cup

O Packaging Cup e o sistema de benchmarking anual do ZBS Packaging entre plantas AB InBev. O dashboard de coverage pode complementar o Packaging Cup ao:

1. **Identificar plantas com potencial de subir no ranking**: Alto score digital + baixo OSE atual = oportunidade de otimizacao via tecnologia ja instalada
2. **Explicar posicoes no ranking**: Plantas com score digital baixo E Packaging Cup baixo -> investimento digital e alavanca. Plantas com score digital alto E Packaging Cup baixo -> o problema e operacional (VPO), nao tecnologico
3. **Normalizar por formato**: O Packaging Cup normaliza por can/bottle/PET. O dashboard deveria indicar formato de linha quando disponivel

**Status:** Packaging Cup data nao esta disponivel no dashboard.

---

## 8. Stakeholders

| Papel | O que busca no dashboard | Aba principal | KPI primario |
|-------|------------------------|--------------:|--------------|
| **VP de Zona** | "Minha zona esta melhorando? Investimento em tech vale a pena?" | Executive + Zone | OSE + GPI |
| **ZBS Packaging Director** | "Quais plantas priorizar para investimento digital em Packaging?" | MaturityVsResults + Sites | GLY + IC rate |
| **ZBS Brewing Director** | "Maturidade BP esta reduzindo paradas de brewing?" | Domain (BP) + Zone | OSE + EC rate |
| **Line Leader** | "Que tecnologia me ajuda a reduzir paradas na minha linha?" | Sites + CapabilityGap | OEE + IC breakdown |
| **Quality Inspector** | "PTS digital esta melhorando compliance de testes?" | Domain (QL) + Portfolio | VIC + quality holds |
| **ZTE Packaging** | "Quais legados posso descomissionar sem risco?" | Portfolio + CapabilityGap | DRS + Capability Coverage |
| **PPM (Performance Planning Manager)** | "Que alavanca digital incluo no 1YP/3YP?" | MaturityVsResults + Zone | OSE delta por nivel |
| **Zone Maintenance Manager** | "CBM e WO digital estao reduzindo downtime?" | Domain (MT) + Sites | OEE + MTBF + unplanned % |

---

## Apendice A: Glossario de KPIs

| Sigla | Nome completo | Formula | Direcao |
|-------|--------------|---------|---------|
| OSE | Overall System Effectiveness | EPT / OST | Maior = melhor |
| GLY | Gross Line Yield | EPT / ST | Maior = melhor |
| OAE | Overall Asset Effectiveness | EPT / TT | Maior = melhor |
| OEE | Overall Equipment Effectiveness | EPT / LT | Maior = melhor |
| LEF | Line Equipment Effectiveness | EPT / LET | Maior = melhor |
| TTP | Total Throughput Performance | Volume / EPT | Maior = melhor |
| TPE | Total Primary Energy | MJ / hL | Menor = melhor |
| TEL | Total Extract Loss | % | Menor = melhor |
| VIC | Visual Inspection Compliance | % | Maior = melhor |
| BQI | Beer Quality Index | Score | Maior = melhor |
| TRIR | Total Recordable Incident Rate | Incidents / hours worked | Menor = melhor |
| LTI | Lost Time Injury | Count | Menor = melhor |
| MTBF | Mean Time Between Failures | Hours | Maior = melhor |
| MTTR | Mean Time To Repair | Hours | Menor = melhor |
| AVCOT | Average Changeover Time | Minutes | Menor = melhor |
| DRS | Decommissioning Readiness Score | 0-100 | Maior = melhor |
| GPI | Global Parity Index | 0-100% | Maior = melhor |

## Apendice B: Fontes de Dados e Gaps

| Arquivo | Conteudo | Usado no dashboard? | Gap |
|---------|---------|--------------------|----|
| waterfall.json | Waterfall OSE ultimo mes, 6 zonas + global | Sim (MaturityVsResults) | Falta sub-blocos (IC breakdown, DPA breakdown) |
| kpi-history.json | 12 meses x 6 zonas, waterfall completo | Sim (parcial) | Nao usado no Executive para sparklines |
| anaplan-ose-ttp-2025.json | OSE e TTP por planta, YTD 2025 | Sim (scatter, site table) | So YTD, sem serie mensal por site |
| anaplan-kpis-2025.json | Multiplos KPIs por planta (PG-K0412, PG-K4038, PG-K4039, PG-R0060) | Sim (parcial) | Muito grande, parsing pode ser lento |
| portfolio_capabilities.json | 1679 N4 capabilities | Sim (Portfolio, CapabilityGap) | UT tem 0 N4s; BCM nao mapeado |
| product-coverage-2026.json | Produtos por zona x dominio | Sim (Portfolio) | OK |
| vpo-assessment-2026.json | VPO pillar scores por site (y/n/na por nivel) | Nao | Deveria ser integrado |
| vpo-site-scores-2026.json | VPO overall score por site | Nao | Deveria ser filtro global |
| CSV_DATA | 163 sites, scores L0-L4, volume | Sim (base) | OK |
| SITE_DOMAIN_TYPE | G/L/- por site+dominio | Sim | OK |
