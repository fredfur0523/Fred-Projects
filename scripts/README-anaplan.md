# Atualizar dados Anaplan (Maturidade vs Resultados)

A visão **Maturidade vs Resultados** cruza os níveis de maturidade (L0–L4) do dashboard com indicadores do Anaplan (OSE, VIC, Lifecycle, TTP). Os dados do Anaplan vêm do MCP `user-anaplan-supply-chain-kpi`.

## Como atualizar `anaplan-kpis.json`

1. No Cursor, use o MCP **anaplan-supply-chain-kpi** e chame a ferramenta **aggregate_kpis** com:
   - **dimensions**: `['plant', 'year', 'kpi_code']`
   - **aggregation**: `'AVG'`
   - **filters** (opcional): `{ 'year': 2026 }` para um ano específico
   - **limit**: `5000` (máximo) para obter o máximo de linhas

2. A resposta terá a forma:
   ```json
   { "row_count": N, "data": [ { "plant": "...", "year": "...", "kpi_code": "...", "aggregated_value": ... }, ... ] }
   ```

3. Converta para o formato esperado pelo dashboard:
   - **year**: número (ex.: 2026)
   - **rows**: array dos objetos em `data` (com `plant`, `year`, `kpi_code`, `aggregated_value`)

4. Salve o resultado em **client/public/anaplan-kpis.json** (substitua o arquivo inteiro).

Exemplo de conteúdo mínimo:
```json
{"year":2026,"rows":[{"plant":"Manaus","year":"2026","kpi_code":"PG-R5795","aggregated_value":123456}]}
```

## Mapeamento KPI → indicador (OSE / VIC / Lifecycle / TTP)

No `App.tsx`, a constante `KPI_GROUP_BY_PREFIX` mapeia o **prefixo de 2 letras** do `kpi_code` para um dos quatro indicadores:

| Prefixo | Indicador  |
|---------|------------|
| PG      | Lifecycle  |
| SL      | OSE        |
| LP      | VIC        |
| CA      | TTP        |
| AL      | OSE        |
| DC      | TTP        |
| LE      | Lifecycle  |

Ajuste esse mapeamento em `App.tsx` se o seu Anaplan usar outra convenção (ex.: coluna KPI_Group).

## Clusters

- **Volume + Maturidade**: cada cluster é identificado por `{G1|G2|G3}_{L0|L1|L2|L3|L4}` (ex.: G2_L2).
- **Zona + Volume + Maturidade**: cada cluster é `{AFR|SAZ|...}_{G1|G2|G3}_{L0|...|L4}` (ex.: SAZ_G2_L2).

O nome do **plant** no Anaplan é normalizado para bater com o **Site** do coverage (ex.: "Accra Beer" → "Accra"). Sites sem correspondência no Anaplan entram no cluster mas não entram na média de OSE/VIC/Lifecycle/TTP.

## Period type (YTD vs MTH)

O modelo Anaplan expõe a coluna **`periodtype`** (filtro em `aggregate_kpis`):

- **MTH** (mensal): use para análise ao longo do ano (variabilidade e sazonalidade). Dimensões: `zone`, `year`, `month`, `kpi_code`.
- **YTD** (year-to-date): use para fechamento do ano. Filtros: `periodtype: 'YTD'`, `month: 'Dec'`, `year: 2025`.

Exemplo — fechamento 2025 só com OSE e TTP:
- **YTD Dez/2025:** `filters: { year: 2025, month: 'Dec', kpi_code: 'PG-K4038', periodtype: 'YTD' }` (e idem para `PG-K0412`).
- **MTH 2025:** `filters: { year: 2025, kpi_code: 'PG-K4038' }`, `dimensions: ['zone','year','month','kpi_code']`.

Estudo completo com os dois KPIs (PG-K4038 OSE, PG-K0412 Total Technical Productivity) e dados 2025: ver **anaplan_estudo_OSE_TTP_2025_periodtype.md** na raiz do projeto.

**Metodologia canônica Volume e OSE (Supply/Packaging):** definição de escopo, KPIs de volume (hL), fórmulas GLY = ΣEPT/ΣST e OSE = ΣEPT/ΣOST, NST e validações — ver **docs/METODOLOGIA_VOLUME_OSE.md**.

### Estudo OSE & TTP por nível tecnológico (a nível planta)

O dashboard cruza maturidade L0–L4 com OSE e TTP **a nível planta**. Para isso:

1. Obtenha dados **YTD Dez/2025** com `aggregate_kpis`:  
   `dimensions: ['plant','year','kpi_code']`, `aggregation: 'AVG'`,  
   `filters: { year: 2025, month: 'Dec', kpi_code: 'PG-K4038', periodtype: 'YTD' }` (e idem para `PG-K0412`).
2. Salve cada resposta em **scripts/ose-2025.json** e **scripts/ttp-2025.json** (objeto com chave `"data"`).
3. Rode: `node scripts/merge_ose_ttp_2025.js`  
   Isso gera **client/public/anaplan-ose-ttp-2025.json**, que o app carrega e mescla aos dados principais para o bloco "Estudo OSE & TTP por nível tecnológico".
