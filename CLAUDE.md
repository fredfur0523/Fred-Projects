# Coverage Assessment Dashboard — CLAUDE.md

> Instruções de contexto para o Claude Code. Leia este arquivo antes de qualquer alteração.

---

## 1. O que é este projeto

Dashboard React/TypeScript de acompanhamento de **maturidade de produtos digitais** por site, zona e domínio na AB InBev Global Manufacturing.

O produto serve a dois propósitos complementares:

1. **Visualização operacional** — funil L0–L4 por zona, domínio e site; filtros de volume; indicadores Global vs Legado por site+domínio.
2. **Base analítica** — os dados expostos no dashboard são a mesma base usada pela Analysis Crew para análises de impacto de tecnologia nos KPIs operacionais (OSE, TTP, TPE, TEL, CO2) e para benchmarks cross-zona.

---

## 2. Tech Stack

| Camada | Tecnologia |
|---|---|
| UI | React 18 + TypeScript |
| Build | Vite 7 |
| Estilo | Tailwind CSS v3 |
| Servidor dev | Express (apenas desenvolvimento) |
| Export XLSX | SheetJS via CDN (carregado on-demand) |
| Export PDF | html2pdf.js via CDN (carregado on-demand) |

**Sem backend de dados.** Todos os dados são constantes TypeScript embutidas no bundle (`CSV_DATA`, `SITE_DOMAIN_TYPE`). O deploy é um bundle estático puro.

---

## 3. Comandos

```bash
npm run dev      # desenvolvimento com hot reload (porta 5000)
npm run build    # build de produção → dist/public/
npm run check    # type-check TypeScript
npm start        # serve o build de produção
```

Para atualizar os dados (após receber novo Coverage.xlsx):
```bash
python scripts/update_csv_data.py       # extrai CSV_DATA
python scripts/extract_site_types.py    # extrai SITE_DOMAIN_TYPE
# Após colar as constantes no App.tsx:
npm run build
```

---

## 4. Estrutura de arquivos

```
coverage-dashboard/
├── client/src/
│   ├── App.tsx          ← TODA a aplicação (~1200 linhas, componente único deliberado)
│   ├── index.css        ← Tailwind base + scrollbar
│   └── main.tsx         ← ponto de entrada React
├── scripts/
│   ├── extract_site_types.py   ← extrai SITE_DOMAIN_TYPE do Excel
│   └── update_csv_data.py      ← extrai CSV_DATA do Excel
├── server/index.ts      ← Express dev server
├── docs/                ← análises HTML exportadas pela Analysis Crew
└── dist/public/         ← build de produção (não editar manualmente)
```

Documentos de análise de contexto em `docs/` e nos arquivos `.md` na raiz:
- `docs/` — relatórios HTML gerados pela Analysis Crew (Tech Maturity × VPO KPIs)
- `anaplan_analise_OSE_TTP.md` — série histórica OSE e TTP por zona (Out/24–Mar/25)
- `anaplan_estudo_OSE_TTP_2025_periodtype.md` — metodologia MTH vs YTD no Anaplan
- `anaplan_OSE_PG-K4038_consulta.md` — queries MCP para OSE por zona/mês
- `anaplan_TTP_SAZ_2025.md` — TTP SAZ 2025 por mês
- `anaplan_historico_6meses_6zonas.md` — KPIs históricos 6 zonas

---

## 5. Modelo de dados

### CSV_DATA — 163 sites (fonte: Coverage.xlsx)

Colunas: `Zone, Site, Country, Volume, BP, DA, UT, MT, MG, MDM, PP, QL, SF, Score`

| Campo | Tipo | Descrição |
|---|---|---|
| `Zone` | string | AFR, SAZ, MAZ, NAZ, EUR, APAC |
| `Volume` | number | Volume anual em hL |
| `BP`–`SF` | 0–4 | Score de maturidade por domínio |
| `Score` | float | Média dos scores de domínio ativos |

### SITE_DOMAIN_TYPE — 246 sites (fonte: aba "Coverage global and legacy")

```typescript
Record<string, Record<string, string>>
// { "NomeSite": { "BP": "G", "DA": "L", ... } }
```

- `"G"` = produto Global ativo
- `"L"` = produto Legado ativo (**Legacy prevalece quando ambos coexistem**)
- chave ausente = sem produto ativo neste domínio

### Domínios (9 códigos)

| Código | Nome completo |
|---|---|
| `BP` | Brewing Performance |
| `DA` | Data Acquisition |
| `UT` | Utilities |
| `MT` | Maintenance |
| `MG` | Management |
| `MDM` | MasterData Management |
| `PP` | Packaging Performance |
| `QL` | Quality |
| `SF` | Safety |

---

## 6. Funil de maturidade L0–L4

| Nível | Score | Nome AB InBev |
|---|---|---|
| L0 | 0 | — (sem fundação digital) |
| L1 | ≥ 1 | Digital Foundation |
| L2 | ≥ 2 | Connected Ops |
| L3 | ≥ 3 | Intelligent Ops |
| L4 | = 4 | Touchless Ops |

**Regras críticas do funil:**
- **Cumulativo e decrescente:** L0 = 100% base; cada nível inclui todos os sites que atingiram aquele score mínimo.
- **Tooltip mostra exclusivos:** ao clicar numa barra, o tooltip lista apenas sites com score EXATAMENTE igual ao nível (não chegaram ao próximo). Permite identificar quem precisa de esforço para subir.
- **Score max observado nas 160 plantas = 2.6** — L3/L4 são extrapolações matemáticas, não dados observados. Isso é relevante ao exibir projeções.

### Grupos de volume

| Grupo | Faixa |
|---|---|
| G1 | < 2.000.000 hL |
| G2 | 2.000.000 – 6.000.000 hL |
| G3 | > 6.000.000 hL |

---

## 7. Paleta de cores

```typescript
// Níveis de maturidade
L0: '#D1D5DB'   // cinza
L1: '#FFE066'   // amarelo
L2: '#FFC000'   // âmbar
L3: '#F59E0B'   // laranja âmbar
L4: '#10B981'   // verde esmeralda

// Zonas
AFR:  '#D97706'
SAZ:  '#059669'
MAZ:  '#2563EB'
NAZ:  '#7C3AED'
EUR:  '#DB2777'
APAC: '#EA580C'

// Global/Legado (Tailwind ring)
Global: ring-blue-400
Legacy: ring-gray-400
```

---

## 8. Arquitetura do App.tsx

Todo o código React está em `client/src/App.tsx` (~1200 linhas). Organizado por seções com comentários `// ===`:

| Linha aprox. | Seção |
|---|---|
| 1 | imports React |
| 7 | `TRANSLATIONS` — strings PT/EN |
| 126 | `ZONE_COLORS` |
| 164 | `SITE_DOMAIN_TYPE` — mapeamento Global/Legado (246 sites) |
| 166 | `getSiteDomainType()` — helper de acesso |
| 170 | `CSV_DATA` — 163 sites (string CSV inline) |
| ~310 | `LEVEL_COLORS` |
| ~320 | `DOMAIN_SHORTS` |
| ~340 | `parseCSV()` |
| ~360 | `ScoreDot` — bolinha com anel G/L |
| ~420 | `SiteTooltip` — tooltip clicável com paginação |
| ~560 | `FunnelCard` — card com funil L0→L4 |
| ~750 | `SiteTable` — tabela "Por Site" |
| ~950 | `App` — componente raiz |

---

## 9. Decisões técnicas não óbvias — NÃO alterar sem entender

### 9.1 Componente único (App.tsx)
Escolha deliberada para facilitar iteração rápida. **Não fragmentar em múltiplos arquivos** sem necessidade explícita.

### 9.2 Funil cumulativo
L0 = 100% base fixo. **Não alterar esta lógica.** Os tooltips mostram exclusivos (score exato = número do nível), não cumulativos.

### 9.3 Legacy prevalece
Quando um site tem Global + Legado simultâneos no mesmo domínio, **Legacy prevalece**. `getSiteDomainType()` implementa isso.

### 9.4 Tooltip com Portal + position:fixed
O `SiteTooltip` usa `ReactDOM.createPortal(content, document.body)` com `position: fixed`.
- Posicionamento via `getBoundingClientRect()` exclusivamente.
- **Nunca adicionar `window.scrollY`** — `fixed` é relativo ao viewport, não ao documento.
- Click-only (não hover) para permitir paginação dentro do tooltip sem fechamento acidental.

### 9.5 CDNs on-demand
SheetJS e html2pdf.js são injetados via `<script>` no `<head>` somente quando o usuário aciona export. Não estão no `package.json`.

---

## 10. Contexto analítico — Tech Maturity × KPIs operacionais

Este projeto existe no contexto de uma análise maior de impacto da maturidade tecnológica nos KPIs de Brewing Performance. Os documentos em `docs/` e os `.md` na raiz são outputs da Analysis Crew que usam os mesmos dados do dashboard.

### KPIs de resultado monitorados

| KPI | Código Anaplan | Unidade | Direção positiva |
|---|---|---|---|
| OSE | PG-K4038 | % | maior = melhor |
| TTP | PG-K0412 | hL/h | maior = melhor |
| TPE | — | MJ/hL | menor = melhor |
| TEL | — | % | menor = melhor |
| CO2 Surplus | — | kg/hL | menor = melhor |

### Clusters VPO (variável de confundimento crítica)

A maturidade VPO é a principal variável de confundimento nas análises Tech × KPI. Nunca comparar tech levels sem controlar VPO:

| Cluster | Descrição |
|---|---|
| VPO Alto (SUS/EXC/WC) | Sustaining / Excellence / World Class |
| VPO Médio (INT) | Intermediate |
| VPO Baixo (NB+Basic) | Not Benchmarked + Basic |

### Alertas de confundimento conhecidos (docs/analysis_tech_maturity_vpo_kpi_crew_v5.html)

1. **APAC India — L0 inflado**: Plantas como Aurangabad, Mysore, Sonipat, Rohtak têm score 0.4 (L0) com OSE 82–87% porque são plantas novas com 1–2 SKUs simples. Comparação bruta L0 vs L1 é enganosa.

2. **EUR L1 — KPIs deprimidos**: Plantas europeias (Magor, Leuven, Bremen) têm score 1.3–1.4 (L1) e KPIs significativamente piores (OSE 43–61%). O driver não é o portfólio: EUR tem o pior VPO da rede (concentração em BASIC/INT) + desestabilidade de processo estrutural. Os KPIs baixos são da fragilidade operacional, não da tecnologia.

3. **L0→L1 para VPO Alto parece negativo**: É artifact de composição regional (India L0 vs EUR L1). **A transição analiticamente válida é L1→L2**, onde N é maior e o confound é menor.

### Ganhos observados por transição de nível (referência: VPO Alto, dados reais)

| KPI | L0→L1 | L1→L2 | L2→L3* | L3→L4* |
|---|---|---|---|---|
| OSE | -11 pp* | +7.2 pp | +1.1 pp | +1.4 pp |
| TPE | -35.4 MJ/hL* | +42.8 MJ/hL* | +11.3 | +14.2 |
| TEL | -1.4 pp* | +1.3 pp* | +0.7 pp | +0.9 pp |
| TTP | -2.8 hL/h* | +2.6 hL/h | +0.4 | +0.5 |
| CO2 | -0.16 kg/hL | +0.61 kg/hL* | +0.27 | +0.34 |

*obs = dados reais | * = L2→L3 e L3→L4 são extrapolações (score max obs = 2.6)*

### OSE por zona — série 2025 MTH (kpi_code PG-K4038)

| Zona | Média 2025 | Variabilidade | Padrão sazonal |
|---|---|---|---|
| APAC | ~45.8% | Alta (1.46) | Queda Q4 |
| MAZ | ~41.4% | Baixa (0.71) | Estável |
| NAZ | ~36.0% | Média (1.02) | Alta Q3/Q4 |
| SAZ | ~34.5% | Média (1.32) | Alta Q3/Q4 |
| AFR | ~33.4% | Baixa (0.92) | Leve alta jul/ago |
| EUR | ~32.0% | Muito baixa (0.64) | Sem padrão |

### TTP por zona — série 2025 MTH (kpi_code PG-K0412)

| Zona | Média 2025 | Variabilidade | Padrão sazonal |
|---|---|---|---|
| NAZ | ~2.49 hL/h | Baixa (0.17) | Pico jun–ago |
| MAZ | ~2.43 hL/h | Muito baixa (0.11) | Estável |
| SAZ | ~2.21 hL/h | Média (0.27) | Mínimo jun, pico dez |
| APAC | ~2.16 hL/h | Alta (0.33) | Pico Q2, queda Q4 |
| AFR | ~2.17 hL/h | Baixa (0.14) | Leve pico out |
| EUR | ~0.49 hL/h | Muito baixa (0.06) | Nível estruturalmente baixo |

**Nota metodológica Anaplan:**
- `periodtype: "MTH"` → valor mensal (variabilidade/sazonalidade). Dimensões: `zone`, `year`, `month`, `kpi_code`.
- `periodtype: "YTD"` + `month: "Dec"` → fechamento anual acumulado. Natureza diferente — YTD Dec < média MTH é normal.

---

## 11. Analysis Crew — como usar para análises deste domínio

Para análises que cruzam os dados de maturidade tecnológica com KPIs reais, use a Analysis Crew:

```bash
python -m crews.analysis_crew "<pergunta>"
```

**Perguntas típicas neste contexto:**
- "Qual é a correlação entre score de maturidade BP e OSE por zona?"
- "Plantas SAZ L2 têm TTP melhor do que L1? A diferença é significativa?"
- "Quais são os sites da EUR com OSE abaixo de 50% e score ≥ 2?"
- "Como está evoluindo o TTP nas plantas MAZ que passaram de L1 para L2?"

A Analysis Crew aciona:
- `ba_brewing` / `ba_packaging` — contexto de processo e KPIs
- `de_kpis` → `kpis-anaplan-operational` — dados reais por zona/site
- `de_brewing` / `de_packaging` → MCPs de downtime
- `data_scientist` — quando a pergunta exige correlação ou teste de hipótese

**Queries MCP para OSE (PG-K4038):**
```json
{
  "dimensions": ["zone", "year", "month", "kpi_code"],
  "aggregation": "AVG",
  "filters": { "kpi_code": "PG-K4038", "year": 2025 },
  "limit": 500
}
```

**Queries MCP para TTP (PG-K0412):**
```json
{
  "dimensions": ["zone", "year", "month", "kpi_code"],
  "aggregation": "AVG",
  "filters": { "kpi_code": "PG-K0412", "year": 2025 },
  "limit": 500
}
```

---

## 12. Como atualizar os dados

### Quando receber novo Coverage.xlsx

```bash
# 1. Atualizar CSV_DATA (scores dos sites)
python scripts/update_csv_data.py
# Copie o output e substitua CSV_DATA em App.tsx (~linha 170)

# 2. Atualizar SITE_DOMAIN_TYPE (Global/Legado)
python scripts/extract_site_types.py
# Copie o output e substitua SITE_DOMAIN_TYPE em App.tsx (~linha 164)

# 3. Build
npm run build
```

**Regra de extração SITE_DOMAIN_TYPE:** aba `Coverage global and legacy`, filtro `Live? = Yes`. Quando Global e Legacy coexistem no mesmo site+domínio, `L` prevalece.

---

## 13. Restrições e padrões

- **Não fragmentar App.tsx** — componente único é intencional.
- **Não alterar lógica do funil cumulativo** — L0 = 100% sempre.
- **Não alterar regra Legacy > Global** — está em `getSiteDomainType()`.
- **Não usar `window.scrollY` no tooltip** — `position: fixed`, relativo ao viewport.
- **Não instalar SheetJS ou html2pdf.js** — carregamento via CDN on-demand.
- `shared/schema.ts` e `server/routes.ts` existem como scaffolding; não são usados ativamente.
- Dados do Anaplan: `periodtype = "MTH"` e `"YTD"` têm naturezas diferentes — nunca misturar na mesma série sem notar.
