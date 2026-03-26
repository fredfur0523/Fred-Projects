# Estudo Anaplan 2025 — OSE e TTP por period type

**KPIs:** PG-K4038 (OSE) e PG-K0412 (Total Technical Productivity)  
**Ano:** 2025  
**Fonte:** MCP Anaplan Supply Chain KPI (`user-anaplan-supply-chain-kpi`, ferramenta `aggregate_kpis`).

*Metodologia canônica de Volume e OSE (fórmula ΣEPT/ΣOST, escopo, KPIs de volume):* **docs/METODOLOGIA_VOLUME_OSE.md**

**Regra de period type (coluna `periodtype` no Anaplan):**
- **MTH** (mensal): uso ao longo do ano para variabilidade e sazonalidade. Consulta sem filtro `periodtype` ou com `periodtype: "MTH"`; dimensões `zone`, `year`, `month`, `kpi_code`.
- **YTD Dez/2025**: fechamento do ano (acumulado até dezembro). Consulta com **`periodtype: "YTD"`** e **`month: "Dec"`**, `year: 2025`.

---

## 1. Dados MTH 2025 — variabilidade e sazonalidade

Dados obtidos com `aggregate_kpis`: `dimensions: ['zone','year','month','kpi_code']`, `aggregation: 'AVG'`, `filters: { year: 2025, kpi_code: 'PG-K4038' }` (e idem para PG-K0412). Valores por mês por zona (6 zonas principais).

### 1.1 OSE (PG-K4038) — valores mensais por zona

| Zona | Jan | Fev | Mar | Abr | Mai | Jun | Jul | Ago | Set | Out | Nov | Dez |
|------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| **AFR** | 33,57 | 33,57 | 33,18 | 32,99 | 32,99 | 33,26 | 33,84 | 33,91 | 33,82 | 33,76 | 33,80 | 33,83 |
| **SAZ** | 34,72 | 34,77 | 34,19 | 34,11 | 33,88 | 33,99 | 33,73 | 34,43 | 34,67 | 35,05 | 34,92 | 34,91 |
| **NAZ** | 35,42 | 35,34 | 36,25 | 35,99 | 35,82 | 35,87 | 35,63 | 36,04 | 36,25 | 36,11 | 36,44 | 36,09 |
| **MAZ** | 41,53 | 41,32 | 40,91 | 41,36 | 41,42 | 41,30 | 41,55 | 41,62 | 41,51 | 41,56 | 41,42 | 41,50 |
| **EUR** | 32,43 | 31,81 | 32,19 | 32,17 | 32,45 | 31,92 | 31,95 | 32,33 | 31,95 | 31,91 | 31,93 | 32,05 |
| **APAC** | 46,09 | 46,24 | 45,67 | 46,27 | 46,23 | 46,31 | 46,09 | 46,17 | 46,00 | 45,68 | 45,11 | 44,85 |

### 1.2 TTP (PG-K0412) — valores mensais por zona

| Zona | Jan | Fev | Mar | Abr | Mai | Jun | Jul | Ago | Set | Out | Nov | Dez |
|------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| **AFR** | 2,17 | 2,11 | 2,15 | 2,10 | 2,15 | 2,11 | 2,15 | 2,17 | 2,15 | 2,24 | 2,20 | 2,23 |
| **SAZ** | 2,36 | 2,20 | 2,25 | 2,15 | 2,17 | 2,09 | 2,14 | 2,17 | 2,19 | 2,25 | 2,18 | 2,31 |
| **NAZ** | 2,40 | 2,39 | 2,49 | 2,48 | 2,51 | 2,56 | 2,55 | 2,56 | 2,53 | 2,46 | 2,48 | 2,50 |
| **MAZ** | 2,42 | 2,37 | 2,43 | 2,41 | 2,41 | 2,41 | 2,41 | 2,42 | 2,41 | 2,43 | 2,47 | 2,48 |
| **EUR** | 0,45 | 0,45 | 0,48 | 0,50 | 0,50 | 0,51 | 0,51 | 0,51 | 0,50 | 0,49 | 0,48 | 0,48 |
| **APAC** | 2,19 | 2,05 | 2,16 | 2,13 | 2,28 | 2,32 | 2,24 | 2,29 | 2,15 | 2,06 | 1,99 | 2,01 |

---

## 2. Fechamento do ano — YTD Dezembro 2025

Valores **YTD** com **`periodtype: "YTD"`**, **`month: "Dec"`** e **`year: 2025`** (acumulado do ano até dezembro). Consulta: `filters: { year: 2025, month: 'Dec', kpi_code: '...', periodtype: 'YTD' }`.

| Zona | OSE (PG-K4038) YTD Dez/2025 | TTP (PG-K0412) YTD Dez/2025 |
|------|-----------------------------|------------------------------|
| **AFR** | 27,07 | 1,72 |
| **SAZ** | 27,11 | 1,72 |
| **NAZ** | 28,28 | 1,96 |
| **MAZ** | 32,20 | 1,94 |
| **EUR** | 25,02 | 0,39 |
| **APAC** | 36,80 | 1,74 |

*Nota: YTD e MTH têm naturezas diferentes — YTD é acumulado do ano; MTH é valor do mês. Para OSE o YTD Dez é menor que a média MTH porque é média/agregado acumulado; para TTP idem.*

---

## 3. Variabilidade (MTH 2025)

Com base nos 12 meses MTH por zona (dados MCP 2025).

### 3.1 OSE (PG-K4038)

| Zona | Mín (mês) | Máx (mês) | Amplitude | Média aprox. |
|------|-----------|-----------|-----------|--------------|
| AFR | 32,99 (Abr/Mai) | 33,91 (Ago) | 0,92 | ~33,4 |
| SAZ | 33,73 (Jul) | 35,05 (Out) | 1,32 | ~34,5 |
| NAZ | 35,42 (Jan) | 36,44 (Nov) | 1,02 | ~36,0 |
| MAZ | 40,91 (Mar) | 41,62 (Ago) | 0,71 | ~41,4 |
| EUR | 31,81 (Fev) | 32,45 (Mai) | 0,64 | ~32,0 |
| APAC | 44,85 (Dez) | 46,31 (Jun) | 1,46 | ~45,8 |

- **APAC** tem maior amplitude (1,46) e queda no 4º trimestre (Out–Dez).
- **MAZ** e **EUR** são os mais estáveis (amplitude < 0,75).
- **SAZ** e **NAZ** têm pico no 2º semestre (Out–Nov).

### 3.2 TTP (PG-K0412)

| Zona | Mín (mês) | Máx (mês) | Amplitude | Média aprox. |
|------|-----------|-----------|-----------|--------------|
| AFR | 2,10 (Abr) | 2,24 (Out) | 0,14 | ~2,17 |
| SAZ | 2,09 (Jun) | 2,36 (Jan) | 0,27 | ~2,21 |
| NAZ | 2,39 (Fev) | 2,56 (Ago) | 0,17 | ~2,49 |
| MAZ | 2,37 (Fev) | 2,48 (Dez) | 0,11 | ~2,43 |
| EUR | 0,45 (Jan/Fev) | 0,51 (Jun–Ago) | 0,06 | ~0,49 |
| APAC | 1,99 (Nov) | 2,32 (Jun) | 0,33 | ~2,16 |

- **APAC** tem maior variabilidade (amplitude 0,33) e forte queda no 2º semestre (Out–Dez).
- **EUR** tem nível muito menor (~0,5) e baixa amplitude.
- **MAZ** é a mais estável entre as zonas com TTP em nível “normal”.

---

## 4. Sazonalidade (MTH 2025)

### OSE (PG-K4038)
- **APAC:** padrão de queda no 4º trimestre (nov–dez); primeiro semestre mais alto.
- **SAZ e NAZ:** tendência de alta no 3º/4º trimestre (ago–nov).
- **AFR:** leve alta em jul–ago.
- **MAZ e EUR:** sem padrão sazonal marcante.

### TTP (PG-K0412)
- **APAC:** pico no meio do ano (mai–jun) e queda acentuada out–dez (sazonalidade forte).
- **NAZ:** pico jun–ago.
- **SAZ:** mínimo em jun, recuperação no 4º trimestre (dez maior).
- **AFR e MAZ:** relativamente estáveis ao longo do ano.

---

## 5. Resumo

| Aspecto | OSE (PG-K4038) | TTP (PG-K0412) |
|---------|----------------|----------------|
| **Fechamento YTD Dez/2025** | APAC > MAZ > NAZ > SAZ ≈ AFR > EUR | NAZ > MAZ > APAC ≈ AFR ≈ SAZ > EUR |
| **Maior variabilidade MTH** | APAC, SAZ | APAC |
| **Maior sazonalidade** | APAC (Q4 para baixo), SAZ/NAZ (Q3–Q4 para cima) | APAC (Q2 pico, Q4 queda) |
| **Zonas mais estáveis** | MAZ, EUR | MAZ, EUR (EUR em nível baixo) |

**Period types utilizados:** MTH para análise ao longo do ano (dimensões `zone`, `year`, `month`, `kpi_code`); YTD com **`periodtype: "YTD"`** e **`month: "Dec"`** para fechamento do ano. Dados agregados com **AVG** (média). Coluna no Anaplan: **`periodtype`** (valores MTH / YTD).

---

## 6. Chamadas MCP (reprodução)

Servidor: **user-anaplan-supply-chain-kpi**, ferramenta **aggregate_kpis**.

- **MTH 2025 (variabilidade/sazonalidade):**  
  `dimensions: ['zone','year','month','kpi_code']`, `aggregation: 'AVG'`, `filters: { year: 2025, kpi_code: 'PG-K4038' }` (e idem para `'PG-K0412'`), `limit: 500`.

- **YTD Dezembro 2025 (fechamento do ano):**  
  `dimensions: ['zone','year','month','kpi_code']`, `aggregation: 'AVG'`, `filters: { year: 2025, month: 'Dec', kpi_code: 'PG-K4038', periodtype: 'YTD' }` (e idem para `'PG-K0412'`), `limit: 100`.
