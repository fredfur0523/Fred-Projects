# Histórico Anaplan — últimos 6 meses por zona

**Período:** Out/2024 a Mar/2025  
**Zonas:** AFR, SAZ, NAZ, MAZ, EUR, APAC  
**Fonte:** MCP Anaplan Supply Chain KPI (`aggregate_kpis`)

---

## Indicadores OSE, TTP, VIC e Lifecycle

**Não foi possível obter dados específicos para OSE, TTP, VIC e Lifecycle.**

No modelo de dados exposto pelo MCP **anaplan-supply-chain-kpi** não existem dimensões ou filtros com esses nomes. O que está disponível é:

- **Dimensões:** `zone`, `year`, `month`, `kpi_code`, `kpi_name`, `business_area`, `module`, `attribute`, etc.
- **kpi_code:** códigos como `PG-R5622`, `CA-K0110`, `SL-R0123` (não OSE/TTP/VIC/Lifecycle).
- **kpi_name:** descrições longas (ex.: "Disposed quantity of Spent Grain dried in kg wet matter", "T2 Delivery Delay").
- **business_area:** "Production", "Service Level", "2nd Tier Distribution Centre", etc.
- **attribute:** "AC", "BU", "LY", "AC_LY_PERCENT", etc.

Para trazer histórico **por indicador** OSE, TTP, VIC e Lifecycle seria necessário:

1. Saber no Anaplan qual **kpi_code** ou **kpi_name** (ou outra dimensão) corresponde a cada um (OSE, TTP, VIC, Lifecycle), ou  
2. Ter esses indicadores expostos no MCP com esses nomes.

---

## Histórico agregado (média de todos os KPIs) por zona e mês

Valor abaixo = **média** (`AVG`) do campo `value` agregada por `zone`, `year`, `month` (apenas zonas principais AFR, SAZ, NAZ, MAZ, EUR, APAC).

| Zona | Out/2024 | Nov/2024 | Dez/2024 | Jan/2025 | Fev/2025 | Mar/2025 |
|------|----------|----------|-----------|----------|----------|----------|
| **AFR** | -20 237 845 708 | -2 588 486 414 | -3 646 060 810 | -3 548 170 695 | 11 940 083 578 | -29 847 968 856 |
| **SAZ** | 6 182 323 | 6 270 217 | 6 601 023 | 90 225 384 | 2 409 086 | 2 853 938 |
| **NAZ** | -13 734 454 | -195 096 522 | 81 089 782 | 800 976 913 | 3 958 411 571 | 4 146 280 510 |
| **MAZ** | 4 364 068 200 | -54 356 777 | -6 360 537 330 | 15 435 218 | 2 466 370 093 | 2 784 225 |
| **EUR** | 1 773 362 | 1 887 465 | 1 972 883 | 769 026 | 850 444 | -1 781 178 |
| **APAC** | -309 865 614 | -20 556 480 608 | -3 554 564 744 | 3 469 238 681 | 1 416 003 257 | 1 926 325 051 |

*Valores = média (AVG) de todos os KPIs naquele mês/zona. Negativos indicam média negativa (mix de métricas e unidades).*

Valores em notação numérica; negativos indicam que a média agregada naquele mês/zona foi negativa (comum quando há mix de métricas em diferentes unidades e sinais).

---

## Como obter OSE, TTP, VIC e Lifecycle

1. **No Anaplan:** localizar o nome técnico ou código do KPI para OSE, TTP, VIC e Lifecycle (ex.: em qual lista/dimensão eles aparecem).
2. **No MCP:** usar `aggregate_kpis` com filtro nessa dimensão (ex.: `kpi_name` ou `kpi_code`) e dimensões `zone`, `year`, `month` para gerar o histórico por mês e por zona.
3. Se o MCP for estendido para expor “indicadores nomeados” (ex.: OSE, TTP, VIC, Lifecycle), a mesma consulta poderá ser feita diretamente por nome.

Se você tiver o **kpi_code** ou o **kpi_name** exato de OSE, TTP, VIC e Lifecycle no Anaplan, posso montar as chamadas ao MCP e a tabela só com esses indicadores.
