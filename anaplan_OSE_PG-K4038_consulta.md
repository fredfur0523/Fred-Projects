# OSE (On Shelf Execution) — KPI PG-K4038

O indicador **OSE** no Anaplan corresponde ao **código de KPI `PG-K4038`**.

O MCP do Anaplan não estava disponível nesta sessão. Use as chamadas abaixo quando o MCP **anaplan-supply-chain-kpi** estiver ativo.

---

## Consultas recomendadas

### 1. OSE agregado por zona e ano (todos os anos)
```json
{
  "dimensions": ["zone", "year"],
  "aggregation": "AVG",
  "filters": { "kpi_code": "PG-K4038" },
  "limit": 500
}
```

### 2. OSE 2025 por zona e mês (últimos 6 meses / ano)
```json
{
  "dimensions": ["zone", "year", "month"],
  "aggregation": "AVG",
  "filters": { "kpi_code": "PG-K4038", "year": 2025 },
  "limit": 500
}
```

### 3. OSE 2025 apenas SAZ (como no TTP)
```json
{
  "dimensions": ["zone", "year", "month"],
  "aggregation": "AVG",
  "filters": { "kpi_code": "PG-K4038", "zone": "SAZ", "year": 2025 },
  "limit": 20
}
```

### 4. OSE nas 6 zonas, últimos meses (2024 + 2025)
```json
{
  "dimensions": ["zone", "year", "month"],
  "aggregation": "AVG",
  "filters": { "kpi_code": "PG-K4038" },
  "limit": 500
}
```

---

## Como executar

- **No Cursor:** em uma sessão onde o MCP **user-anaplan-supply-chain-kpi** estiver habilitado, peça:  
  *"Chame aggregate_kpis com dimensions ['zone','year','month'], aggregation 'AVG', filters {'kpi_code':'PG-K4038','year':2025}, limit 500"*  
  ou use o conteúdo JSON acima.
- **Ferramenta:** `aggregate_kpis` do servidor `user-anaplan-supply-chain-kpi`.
- **Colunas de filtro permitidas (minúsculas):** `zone`, `year`, `month`, `kpi_code`, `kpi_name`, `business_area`, `module`, `attribute`, etc.

Quando tiver o resultado, você pode colar aqui e peço para formatar em tabela (por zona/mês) ou resumo.
