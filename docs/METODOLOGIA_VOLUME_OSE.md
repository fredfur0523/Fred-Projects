# Metodologia: Volume e OSE (Supply Chain KPI)

Consolidação executiva com rigor metodológico. **Não alterar escopo ou fórmulas sem confirmação.**

---

## 1) Fonte de dados

**Tabela:**  
`brewdat_uc_supchn_prod.gld_ghq_supply_supplychainkpi.gb_supplychainkpi_consolidated`

---

## 2) Escopo padrão (não alterar sem pedir confirmação)

| Parâmetro        | Valor   | Notas |
|------------------|---------|--------|
| **periodtype**   | `'MTH'` | Mensal |
| **attribute**    | `'AC'`  | Actual |
| **module**       | `'BOPSLINE'` | |
| **locationtype**| `'LINE'` | |
| **Zonas válidas**| AFR, APAC, EUR, MAZ, NAZ, SAZ | |

**Excluir linhas de keg:**  
Desconsiderar plantlines com **keg**, **kegging** e **special kegging** (case-insensitive).

---

## 3) KPIs de Volume (hL)

Usar **EXATAMENTE** estes `kpi_code`:

| kpi_code | Descrição |
|----------|-----------|
| PB-R0030 | Bottling - Soft Drink & FAB's Volume filled |
| PB-R0010 | Bottling - Beer Volume filled |
| PB-R0050 | Bottling - Water Volume filled |
| PC-R0050 | Canning - Water Volume filled |
| PC-R0010 | Canning - Beer Volume filled |
| PC-R0030 | Canning - Soft Drink & FAB's Volume filled |
| PP-R0050 | PET - Water Volume filled |
| PP-R0010 | PET - Beer Volume filled |
| PP-R0030 | PET - Soft Drink & FAB's Volume filled |

---

## 4) KPIs base para GLY e OSE

| kpi_code  | Nome / Uso |
|-----------|------------|
| PG-R0060  | Effective Production Time (EPT) |
| PG-R0080  | Scheduled Time (ST) |
| PG-K4039  | Overall Supply Time (OST) |

---

## 5) Fórmulas obrigatórias

- **GLY** = Σ EPT / Σ ST  
- **OSE** = Σ EPT / Σ OST  

**IMPORTANTE:**  
- **Nunca** fazer média simples de GLY/OSE por linha, planta ou zona.  
- **Sempre** agregar primeiro os componentes (EPT, ST, OST) no nível **linha** e só depois aplicar a fórmula.  
- **Hierarquia obrigatória:** Linha → Plant → Country → Zone → Global.

---

## 6) NST (incluir na análise)

- Calcular **NST total em horas** no mesmo escopo.
- **Intensidade NST:**  
  **NST_int** = NST_h / Volume_hL × 1000  
  (horas por 1.000 hL)
- Se houver decomposição por motivo: listar principais **aumentos** e **reduções**.

---

## 7) Períodos e comparação

**Padrão:**  
- Comparar **Jan/2026 vs Jan/2025** (actual vs actual).  
- Quando solicitado **YTD**: usar apenas meses equivalentes fechados nos dois anos.  
- **Não** misturar AC com BU/FY/LY/LE sem solicitação explícita.

---

## 8) Regras de qualidade e validação

Antes de concluir:

1. **Contagem de linhas:** mostrar quantidade de linhas usadas no cálculo (all lines e active lines).  
2. **Coerência dos agregados:**  
   - Σ volume por zona = volume global  
   - Σ EPT / Σ ST / Σ OST por zona = global  
3. **Divergências:** reportar qualquer incoerência e possível causa (ex.: linhas não elegíveis, filtros de zona, linhas sem ST/OST).  
4. **Benchmark:** se o usuário informar GLY/OSE esperados, fazer contra-cheque explícito.

---

## 9) Formato de saída

Entregar em **3 blocos**:

1. **Resumo executivo (global)**  
2. **Visão por zona**  
3. **Deep dive de exceções** (plantas/linhas críticas + principais motivos NST + plano de ação)

**Sempre apresentar:**  
- Valor 2025  
- Valor 2026  
- Delta absoluto  
- Delta percentual / p.p. (quando aplicável)

---

## 10) Estilo de comunicação

- Linguagem executiva, objetiva, sem jargão desnecessário.  
- Se pedido “formato WhatsApp”: bullets curtos com números claros.  
- Se houver incerteza de regra de negócio: pausar e pedir confirmação antes de fechar.

---

## Relação com o Coverage Assessment Dashboard

- O dashboard pode exibir **OSE** via **Anaplan** (KPI **PG-K4038**) quando os dados forem carregados em `anaplan-ose-ttp-2025.json` ou `anaplan-kpis-2025.json`.  
- A definição **canônica** de OSE neste documento é **Σ EPT / Σ OST** (PG-R0060 / PG-K4039) na tabela consolidada, com escopo e hierarquia acima.  
- Em análises que exijam alinhamento com Supply/Packaging, usar esta metodologia; ao comparar com o dashboard, deixar explícito se a fonte é Anaplan (PG-K4038) ou a tabela consolidada (fórmula EPT/OST).
