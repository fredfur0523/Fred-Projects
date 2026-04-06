# Design Spec: Coverage Assessment Dashboard — Excel Export Redesign

**Date:** 2026-04-05
**Designer:** UX/UI Senior (Celebration DS)
**Audience Layer:** Strategic (gestores de tecnologia global, analistas regionais, gerentes de produto)
**Implementation:** TypeScript + SheetJS/XLSX (browser-side)
**File output:** `rollout_editavel_YYYY-MM-DD.xlsx`

---

## 1. Lista Final de Abas

| # | Nome da Aba | Proposta de Valor | Publico | Tipo | Tab Color (hex) |
|---|-------------|-------------------|---------|------|-----------------|
| 1 | **Guia** | Legenda de cores, regras de edicao, glossario — tudo em tabelas formatadas | Todos | Referencia | `#1B5E9E` |
| 2 | **Rollout** | Uma linha por (site x dominio x produto). Aba principal editavel. | Gestor Global, Analista Regional | **Editavel** | `#D97706` |
| 3 | **Cobertura por Site** | Uma linha por site: score geral + score por dominio + tipo + gap analysis. Somente leitura. | Gestor Global, Analista Regional | Referencia | `#047857` |
| 4 | **Produtos** | Uma linha por produto: alcance (# sites), dominios cobertos, capabilidades atendidas. | Gerente de Produto | Referencia | `#7C3AED` |
| 5 | **Capabilidades** | Arvore completa N4 flat (1561 linhas). | Analista tecnico | Referencia | `#6B7280` |
| 6 | **Req. por Nivel** | Resumo matricial gate x dominio + detalhamento por gate. | Todos | Referencia | `#6B7280` |

### Decisoes de design sobre as abas

**Nova aba "Cobertura por Site" (aba 3):** Atende ao feedback "nao mostra relacionamentos". Consolida a visao de um site inteiro em uma unica linha: score geral, cada dominio com score numerico, tipo (G/L), e indicacao de gap. Permite filtrar/ordenar em Excel para encontrar rapidamente sites abaixo de um threshold.

**Renomeacao "Instrucoes" para "Guia":** Nome mais curto na tab do Excel, menos formal, mais actionable.

**Ordem das abas:** Guia primeiro (padrao Excel para arquivos editaveis), Rollout em segundo (aba de trabalho principal), seguido de abas de referencia em ordem decrescente de uso.

---

## 2. Paleta de Cores Completa

### 2.1 Cores Estruturais

| Uso | Hex | RGB | Aplicacao |
|-----|-----|-----|-----------|
| Header de aba editavel (Rollout) | `#FEF3C7` | 254,243,199 | Fundo do header row inteiro |
| Header de aba referencia | `#E0E7FF` | 224,231,255 | Fundo do header row inteiro |
| Coluna editavel (fundo celulas de dados) | `#FFFFF0` | 255,255,240 | Fundo das celulas editaveis na Rollout |
| Coluna somente-leitura (fundo celulas de dados) | `#F9FAFB` | 249,250,251 | Fundo celulas read-only na Rollout |
| Linha de separacao de site (Rollout) | `#F3F4F6` | 243,244,246 | Borda bottom cinza entre blocos de site |
| Texto de header | `#1F2937` | 31,41,55 | Font color em todos os headers |
| Texto de dados | `#374151` | 55,65,81 | Font color default |
| Texto de nota/legenda | `#6B7280` | 107,114,128 | Texto auxiliar, subtitulos |

### 2.2 Cores de Nivel de Maturidade

| Nivel | Fundo Celula | Texto | Uso |
|-------|-------------|-------|-----|
| L0 (sem produto) | `#FEE2E2` | `#991B1B` | Celulas de score = 0 |
| L1 | `#FEF3C7` | `#92400E` | Score = 1 |
| L2 | `#FDE68A` | `#78350F` | Score = 2 |
| L3 | `#D1FAE5` | `#065F46` | Score = 3 |
| L4 | `#A7F3D0` | `#064E3B` | Score = 4 |

### 2.3 Cores de Status

| Status | Fundo Celula | Texto | Uso |
|--------|-------------|-------|-----|
| READY | `#D1FAE5` | `#065F46` | Capabilidade pronta |
| NOT READY | `#FEE2E2` | `#991B1B` | Capabilidade nao pronta |
| IN PROGRESS | `#FEF3C7` | `#92400E` | Capabilidade em andamento |
| N/A | `#F3F4F6` | `#6B7280` | Nao aplicavel |

### 2.4 Cores de Tipo de Produto

| Tipo | Fundo | Texto | Uso |
|------|-------|-------|-----|
| G (Global) | `#DBEAFE` | `#1E40AF` | Badge de tipo Global |
| L (Legado) | `#FEE2E2` | `#991B1B` | Badge de tipo Legacy — visual alert |

### 2.5 Cores de Editabilidade (Rollout)

| Tipo Coluna | Header Fundo | Header Texto | Cell Fundo | Cell Border |
|-------------|-------------|-------------|------------|-------------|
| Editavel | `#FEF3C7` | `#92400E` | `#FFFFF0` | `#F59E0B` (left border amber) |
| Somente-leitura | `#E5E7EB` | `#374151` | `#F9FAFB` | `#E5E7EB` |

### 2.6 Cores da Aba Guia

| Elemento | Fundo | Texto |
|----------|-------|-------|
| Titulo principal | `#1B5E9E` | `#FFFFFF` |
| Subtitulo secao | `#E0E7FF` | `#1E40AF` |
| Legenda de cor (amostra) | Cor correspondente | Texto correspondente |
| Tabela de regras | `#F9FAFB` | `#374151` |

---

## 3. Layout Coluna-a-Coluna de Cada Aba

### 3.1 Aba "Guia"

Layout em blocos verticais com merge cells para titulos, tabelas para legendas.

**Row 1 (merge A1:H1):** Titulo
- Texto: `COVERAGE DASHBOARD — Rollout Editavel  [COVERAGE_ROLLOUT_V2]`
- Font: bold, size 14, color `#FFFFFF`
- Fill: `#1B5E9E`
- Height: 36

**Row 2 (merge A2:H2):** Subtitulo
- Texto: `Gerado em: YYYY-MM-DD  |  N sites  |  N produtos`
- Font: size 11, color `#374151`
- Fill: `#E0E7FF`
- Height: 24

**Row 3:** Blank (height 8)

**Rows 4-9: Secao "ABAS DESTA PLANILHA"**

| Row | A (wch 3) | B (wch 18) | C (wch 60) | D (wch 12) |
|-----|-----------|------------|------------|------------|
| 4 | # | Aba | Descricao | Tipo |
| 5 | 1 | Guia | Este guia de uso, legenda e regras | Referencia |
| 6 | 2 | Rollout | Lista de produtos por site/dominio — ABA EDITAVEL | **Editavel** |
| 7 | 3 | Cobertura por Site | Score de maturidade consolidado por site | Referencia |
| 8 | 4 | Produtos | Alcance de cada produto: sites e capabilidades | Referencia |
| 9 | 5 | Capabilidades | Arvore N4 completa por dominio e gate | Referencia |
| 10 | 6 | Req. por Nivel | Requerimentos por gate com resumo matricial | Referencia |

- Row 4: header style (bold, fill `#E0E7FF`)
- Row 6: fill `#FEF3C7` para destacar que Rollout e editavel, bold em "Editavel"

**Row 11:** Blank

**Rows 12-17: Secao "LEGENDA DE CORES — MATURIDADE"**

| Row | A | B | C |
|-----|---|---|---|
| 12 | (merge A:C) LEGENDA DE CORES — MATURIDADE | | |
| 13 | [fill L0 color] | L0 | Sem produto ativo no dominio |
| 14 | [fill L1 color] | L1 | >=70% N4s do gate L1 cobertas |
| 15 | [fill L2 color] | L2 | >=70% N4s dos gates L1+L2 cobertas |
| 16 | [fill L3 color] | L3 | >=70% N4s dos gates L1+L2+L3 cobertas |
| 17 | [fill L4 color] | L4 | >=70% N4s de todos os gates cobertas |

- Coluna A: celula pintada com a cor de fundo do nivel (amostra visual)
- Row 12: section header, bold, fill `#E0E7FF`

**Rows 18:** Blank

**Rows 19-23: Secao "LEGENDA DE CORES — EDITABILIDADE"**

| Row | A | B | C |
|-----|---|---|---|
| 19 | (merge A:C) LEGENDA DE CORES — EDITABILIDADE | | |
| 20 | [fill `#FFFFF0`] | Fundo amarelo claro | Celula EDITAVEL — pode alterar |
| 21 | [fill `#F9FAFB`] | Fundo cinza claro | Celula SOMENTE LEITURA — nao alterar |
| 22 | [fill `#FEF3C7`] | Header amarelo | Coluna editavel |
| 23 | [fill `#E5E7EB`] | Header cinza | Coluna somente leitura |

**Rows 24:** Blank

**Rows 25-31: Secao "COMO EDITAR E REIMPORTAR"**

| Row | A (merge A:C) |
|-----|--------------|
| 25 | COMO EDITAR E REIMPORTAR |
| 26 | Passo 1: Va para a aba "Rollout". Colunas editaveis tem fundo amarelo claro. |
| 27 | Passo 2: Edite Produto, Tipo, Ativo, ou Plano Rollout. |
| 28 | Passo 3: Salve o arquivo Excel normalmente. |
| 29 | Passo 4: No Coverage Dashboard, importe o arquivo. Deteccao automatica. |
| 30 | |
| 31 | ATENCAO: Nao edite Zona, Pais, Site, Codigo, Dominio — sao chaves do sistema. |

- Row 25: section header, bold, fill `#E0E7FF`
- Row 31: bold, fill `#FEE2E2`, color `#991B1B`

**Rows 32:** Blank

**Rows 33-39: Secao "OPERACOES COMUNS"**

| Row | A | B | C |
|-----|---|---|---|
| 33 | (merge A:C) OPERACOES COMUNS | | |
| 34 | Operacao | Como fazer | Exemplo |
| 35 | Adicionar produto | Nova linha: copie Zona/Pais/Site/Codigo/Dominio de linha existente, preencha Produto+Tipo+Ativo=Sim | Produto="One MES", Tipo="G", Ativo="Sim" |
| 36 | Remover produto | Mude "Ativo" para "Nao" | Ativo="Nao" |
| 37 | Trocar tipo | Mude "Tipo" de G para L ou vice-versa | Tipo="L" |
| 38 | Planejar rollout | Preencha data/periodo no campo Plano Rollout | "Q3 2026" |
| 39 | |

- Row 33: section header
- Row 34: table header, bold

**Rows 40:** Blank

**Rows 41-46: Secao "REGRAS DE REIMPORTACAO"**

| Row | A (merge A:C) |
|-----|--------------|
| 41 | REGRAS APLICADAS NA REIMPORTACAO |
| 42 | Tipo L (Legado) prevalece sobre G (Global) no mesmo site+dominio. |
| 43 | Scores sao recalculados automaticamente via base de capabilidades. |
| 44 | UT e SF sao excluidos do site score (dados pendentes). |
| 45 | Linhas com Ativo="Nao" sao removidas do calculo. |
| 46 | Linhas sem Produto ou com Produto vazio sao ignoradas. |

- Row 41: section header, bold, fill `#E0E7FF`

**Rows 47:** Blank

**Rows 48-57: Secao "GLOSSARIO"**

| Row | A | B |
|-----|---|---|
| 48 | (merge A:B) GLOSSARIO | |
| 49 | Termo | Definicao |
| 50 | N4 | Capabilidade funcional atomica (nivel mais granular) |
| 51 | Gate | Nivel de maturidade (L1/L2/L3/L4) |
| 52 | cap_key | Chave unica que mapeia produto a capabilidade |
| 53 | Score do site | Minimo dos scores de dominio (exceto UT, SF) |
| 54 | Score do dominio | Gate maximo onde >=70% das N4s estao cobertas |
| 55 | Global (G) | Produto padrao AB InBev, mantido globalmente |
| 56 | Legado (L) | Produto local/regional, a ser migrado |
| 57 | Threshold | >=70% das N4s do gate precisam estar cobertas |

**Column widths para Guia:**
- A: wch 4
- B: wch 22
- C: wch 65
- D: wch 14

**Sentinel:** Manter `COVERAGE_ROLLOUT_V2` na row 1 (atualizar sentinel para V2 para diferenciar do formato antigo, mas manter deteccao retrocompativel no parser).

---

### 3.2 Aba "Rollout" (Editavel)

**Estrutura:** Uma linha por (site x dominio x produto). Sites sem produto em um dominio geram uma linha com Produto vazio para indicar gap.

| Col | Nome Header | wch | Tipo Dado | Editavel? | Header Fill | Cell Fill | Notas |
|-----|------------|-----|-----------|-----------|-------------|-----------|-------|
| A | Zona | 7 | string | NAO | `#E5E7EB` | `#F9FAFB` | Codigo da zona (LATAM_S, EUR, etc) |
| B | Pais | 16 | string | NAO | `#E5E7EB` | `#F9FAFB` | |
| C | Site | 30 | string | NAO | `#E5E7EB` | `#F9FAFB` | Nome do site |
| D | Cod. | 6 | string | NAO | `#E5E7EB` | `#F9FAFB` | Codigo dominio (BP, DA, etc) |
| E | Dominio | 26 | string | NAO | `#E5E7EB` | `#F9FAFB` | Nome completo (Brewing Performance, etc) |
| F | Score Dom. | 10 | number | NAO | `#E5E7EB` | *Cor por nivel* | Score atual deste dominio neste site (0-4). Cor de fundo condicional L0-L4. |
| G | Produto | 34 | string | **SIM** | `#FEF3C7` | `#FFFFF0` | Nome do produto. Vazio = gap (sem produto neste dominio). |
| H | Tipo | 7 | string | **SIM** | `#FEF3C7` | `#FFFFF0` | G = Global, L = Legado |
| I | Ativo | 7 | string | **SIM** | `#FEF3C7` | `#FFFFF0` | Sim / Nao |
| J | Plano Rollout | 18 | string | **SIM** | `#FEF3C7` | `#FFFFF0` | Livre: "Q1 2026", "Piloto", etc |

**Decisoes de design:**

1. **Score do Dominio (coluna F nova):** Responde ao feedback "nao mostra relacionamentos". Mostra o score calculado diretamente ao lado do dominio, com cor condicional. Celula read-only. Permite ao gestor ver imediatamente o impacto de adicionar/remover produtos (apos reimportacao).

2. **Separacao visual editavel vs. read-only:**
   - Headers: amarelo claro (editavel) vs. cinza (read-only) — distingue em um olhar
   - Celulas de dados: ivory `#FFFFF0` (editavel) vs. cinza muito claro `#F9FAFB` (read-only)
   - Borda esquerda amber `#F59E0B` (1px) na primeira coluna editavel (G) — cria divisor visual

3. **Linhas de gap (site sem produto no dominio):**
   - Produto vazio, Tipo vazio, Ativo = "Nao"
   - Toda a linha com fill `#FEE2E2` (vermelho claro) para chamar atencao ao gap
   - Score Dom. mostra 0 com cor L0

4. **Agrupamento visual por site:** Inserir borda bottom grossa (`medium`, cor `#D1D5DB`) na ultima linha de cada site para separar visualmente blocos de site.

**Header row:**
- Row 1: headers
- Font: bold, size 11, color `#1F2937`
- Height: 28
- Freeze pane: `A2` (congela header)

**Formato dos headers (compatibilidade parser):**
- Colunas A-F: nome simples sem sufixo
- Colunas G-J: manter sufixo ` [EDITAR]` no header para compatibilidade com parser
  - Parser strip regex: `/\s*[\[←].*$/` — atualizar regex para suportar `[EDITAR]` alem de `← EDITAR`
  - Headers finais: `Produto [EDITAR]`, `Tipo [EDITAR]`, `Ativo [EDITAR]`, `Plano Rollout [EDITAR]`
  - Mais limpo visualmente que `←`, e o colchete e menos ambiguo

**ALTERNATIVA compatibilidade total:** Se nao quiser mudar o parser, manter `Produto ← EDITAR` etc. A paleta de cores ja resolve a distincao visual, entao o sufixo se torna redundante mas inofensivo. **Recomendacao: manter `← EDITAR` por seguranca e backward compatibility.** As cores fazem o trabalho pesado agora.

**Headers finais (backward compatible):**
```
Zona | Pais | Site | Cod. | Dominio | Score Dom. | Produto ← EDITAR | Tipo ← EDITAR | Ativo ← EDITAR | Plano Rollout ← EDITAR
```

**Nota para o parser:** O campo `Score Dom.` e novo e read-only. O parser deve ignorar colunas que nao reconhece (ja faz isso — busca por nome). Nenhuma mudanca no parser necessaria se os nomes das colunas editaveis se manterem identicos.

---

### 3.3 Aba "Cobertura por Site" (NOVA)

**Estrutura:** Uma linha por site. Consolida tudo que o gestor precisa para avaliar um site em um olhar.

| Col | Nome Header | wch | Tipo Dado | Fill Cell | Notas |
|-----|------------|-----|-----------|-----------|-------|
| A | Zona | 7 | string | `#F9FAFB` | |
| B | Pais | 16 | string | `#F9FAFB` | |
| C | Site | 30 | string | `#F9FAFB` | Bold |
| D | Score Geral | 10 | number | *Cor por nivel* | Min dos dominios (exceto UT, SF) |
| E | BP | 6 | number | *Cor por nivel* | Score Brewing Performance |
| F | DA | 6 | number | *Cor por nivel* | Score Data Acquisition |
| G | UT | 6 | number | *Cor por nivel* | Score Utilities (italico, excl. do geral) |
| H | MT | 6 | number | *Cor por nivel* | Score Maintenance |
| I | MG | 6 | number | *Cor por nivel* | Score Management |
| J | MDM | 6 | number | *Cor por nivel* | Score MasterData Management |
| K | PP | 6 | number | *Cor por nivel* | Score Packaging Performance |
| L | QL | 6 | number | *Cor por nivel* | Score Quality |
| M | SF | 6 | number | *Cor por nivel* | Score Safety (italico, excl. do geral) |
| N | Gaps (L0) | 8 | number | `#F9FAFB` | Contagem de dominios com score 0 |
| O | Tipo Predominante | 8 | string | *Cor por tipo* | G ou L (baseado na maioria dos dominios) |
| P | Total Produtos | 8 | number | `#F9FAFB` | Numero de produtos ativos |

**Formatacao condicional por celula (colunas D-M):**
- Aplicar fill + font color conforme tabela de cores L0-L4 (secao 2.2)
- UT e SF: font italic para indicar exclusao do score geral

**Header row:**
- Fill: `#E0E7FF`
- Font: bold, size 11
- Freeze pane: `A2`
- Row height: 28

**Ordenacao default:** Zona (A) > Pais (B) > Site (C) ascending

---

### 3.4 Aba "Produtos" (Reformulada)

**Mudanca principal:** Eliminar blocos com linhas em branco. Usar tabela flat, uma linha por produto, com toda informacao consolidada.

| Col | Nome Header | wch | Tipo Dado | Notas |
|-----|------------|-----|-----------|-------|
| A | Produto | 32 | string | Nome do produto |
| B | Tipo | 7 | string | G/L. Cor por tipo. |
| C | Sites Ativos | 10 | number | Contagem de sites usando o produto |
| D | Zonas | 20 | string | Lista de zonas (separadas por virgula) |
| E | Dominios Cobertos (Cap) | 28 | string | Dominios derivados de cap_keys: "BP, DA, MT" |
| F | Cobertura L1 | 12 | string | Ex: "BP:8/12, DA:3/5" (cobertas/total por dominio) |
| G | Cobertura L2 | 12 | string | Idem para L2 |
| H | Cobertura L3 | 12 | string | Idem para L3 |
| I | Cobertura L4 | 12 | string | Idem para L4 |
| J | Cap Keys | 40 | string | Lista de cap_keys mapeadas (referencia tecnica) |

**Header:**
- Fill: `#E0E7FF`
- Freeze pane: `A2`

**Ordenacao default:** Sites Ativos descending (produtos mais usados primeiro)

---

### 3.5 Aba "Capabilidades" (Melhorada)

**Estrutura:** Manter flat table (1561 linhas), mas adicionar formatacao visual para navegabilidade.

| Col | Nome Header | wch | Tipo Dado | Notas |
|-----|------------|-----|-----------|-------|
| A | Dominio | 6 | string | Codigo (BP, DA, etc) |
| B | Gate | 5 | string | L1/L2/L3/L4 |
| C | Subarea | 22 | string | Agrupamento funcional |
| D | ID (N4) | 12 | string | Identificador unico |
| E | Funcionalidade (N4) | 55 | string | Descricao da capabilidade |
| F | N1 — Processo | 35 | string | |
| G | N2 — Eventos | 35 | string | |
| H | N3 — Necessidade | 35 | string | |
| I | Status | 11 | string | READY / NOT READY / IN PROGRESS. **Cor condicional.** |
| J | Ano Previsto | 10 | string | |
| K | Coberto por | 40 | string | cap_keys (virgula-separados) |

**Formatacao visual para navegabilidade:**

1. **Banding por dominio:** Alternar fundo entre dominios:
   - Dominios impares (BP, UT, MG, PP, SF): `#F9FAFB`
   - Dominios pares (DA, MT, MDM, QL): `#FFFFFF`
   - Isso cria blocos visuais sem precisar de linhas em branco

2. **Linha separadora de gate:** Na primeira linha de cada novo gate dentro de um dominio, aplicar borda top `thin` em `#9CA3AF`. Celula B (Gate) em bold.

3. **Cor condicional na coluna Status (I):**
   - READY: fill `#D1FAE5`, font `#065F46`
   - NOT READY: fill `#FEE2E2`, font `#991B1B`
   - IN PROGRESS: fill `#FEF3C7`, font `#92400E`

**Header:**
- Fill: `#E0E7FF`
- Freeze pane: `C2` (congela Dominio + Gate ao scrollar horizontalmente)
- Row height header: 28

---

### 3.6 Aba "Req. por Nivel" (Melhorada)

**Part A: Resumo Matricial (rows 1-14)**

Row 1 (merge A1:N1): `RESUMO — Cobertura por Gate`
- Fill: `#E0E7FF`, bold, size 12

Row 2: Header

| A | B | C | D | E | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Dominio | L1 Total | L1 Ready | L1 % | L2 Total | L2 Ready | L2 % | L3 Total | L3 Ready | L3 % | L4 Total | L4 Ready | L4 % | Threshold |

Rows 3-11: Um por dominio (9 dominios)
- Celulas de % (colunas D, G, J, M): cor condicional
  - >= 70%: fill `#D1FAE5`, font `#065F46`
  - 50-69%: fill `#FEF3C7`, font `#92400E`
  - < 50%: fill `#FEE2E2`, font `#991B1B`
- Coluna N: texto fixo `>= 70%`

Row 12: Blank
Row 13-14: Notas explicativas
- "Para atingir um gate, o site precisa cobrir >=70% das N4s desse gate no dominio."
- "Score final do site = gate minimo atingido em todos os dominios ativos (exceto UT e SF)."

**Part B: Detalhamento por Gate (rows 16+)**

Para cada gate (L1, L2, L3, L4):

Gate separator row (merge A:K):
- Texto: `GATE L1 — Requerimentos` (etc.)
- Fill: level color (L1=`#FEF3C7`, L2=`#FDE68A`, L3=`#D1FAE5`, L4=`#A7F3D0`)
- Font: bold, size 12
- Height: 28

Sub-header row:

| Dominio | Subarea | ID | Funcionalidade (N4) | N1 — Processo | Status | Ano Previsto | Coberto por |
|---------|---------|----|--------------------|--------------|--------|-------------|-------------|

Data rows: mesma formatacao da aba Capabilidades (status com cor condicional, banding por dominio).

**Freeze pane:** `A3` (congela titulo + header do resumo)

**Column widths:**
- A: 8, B: 10, C: 10, D: 8, E: 10, F: 10, G: 8, H: 10, I: 10, J: 8, K: 10, L: 10, M: 8, N: 18

---

## 4. Formatacao Global

### 4.1 Freeze Panes

| Aba | Freeze Cell | Efeito |
|-----|------------|--------|
| Guia | Nenhum | Conteudo livre para scroll (nao e tabela) |
| Rollout | `A2` | Header fixo ao scrollar verticalmente |
| Cobertura por Site | `D2` | Zona+Pais+Site fixos ao scrollar horizontalmente; header fixo vertical |
| Produtos | `A2` | Header fixo |
| Capabilidades | `C2` | Dominio+Gate fixos ao scrollar horizontal; header fixo vertical |
| Req. por Nivel | `A3` | Titulo + header do resumo fixos |

### 4.2 Font Styles

| Elemento | Font Family | Size | Bold | Italic | Color |
|----------|-------------|------|------|--------|-------|
| Titulo principal (Guia row 1) | Calibri | 14 | Sim | Nao | `#FFFFFF` |
| Titulo de secao (Guia) | Calibri | 12 | Sim | Nao | `#1E40AF` |
| Header de tabela (todas abas) | Calibri | 11 | Sim | Nao | `#1F2937` |
| Dado normal | Calibri | 10 | Nao | Nao | `#374151` |
| Dado de site (nome) | Calibri | 10 | Sim | Nao | `#1F2937` |
| UT/SF score (excluidos) | Calibri | 10 | Nao | Sim | `#6B7280` |
| Nota/legenda | Calibri | 9 | Nao | Sim | `#6B7280` |
| Alerta (Guia row 31) | Calibri | 10 | Sim | Nao | `#991B1B` |
| Gate separator | Calibri | 12 | Sim | Nao | texto do nivel |

### 4.3 Row Heights

| Tipo de row | Height (points) |
|-------------|----------------|
| Titulo principal | 36 |
| Titulo de secao | 28 |
| Header de tabela | 28 |
| Dados normais | 18 (default) |
| Linha em branco (separador) | 8 |
| Gate separator | 28 |

### 4.4 Merge Cells

| Aba | Merge | Conteudo |
|-----|-------|----------|
| Guia | A1:H1 | Titulo principal |
| Guia | A2:H2 | Subtitulo com data/contagem |
| Guia | A(secao):C(secao) | Cada titulo de secao |
| Req. por Nivel | A1:N1 | Titulo do resumo |
| Req. por Nivel | A(gate):K(gate) | Separador de gate |

### 4.5 Borders

| Elemento | Estilo | Cor | Aplicacao |
|----------|--------|-----|-----------|
| Header bottom (todas abas) | medium | `#9CA3AF` | Borda inferior do header row |
| Celula normal | thin | `#E5E7EB` | Todas as celulas de dados |
| Separador de site (Rollout) | medium bottom | `#D1D5DB` | Ultima linha de cada site |
| Separador de gate (Capabilidades) | thin top | `#9CA3AF` | Primeira linha de novo gate |
| Divisor editavel/read-only (Rollout col G) | medium left | `#F59E0B` | Borda esquerda da col G (Produto) |
| Celula de titulo (Guia) | medium | `#1B5E9E` | Contorno do titulo |

---

## 5. Comentarios/Notas nas Celulas

SheetJS suporta cell comments (aparecem como triangulo vermelho no canto da celula, visivel on hover no Excel).

### 5.1 Rollout

| Celula | Conteudo do Comment |
|--------|-------------------|
| G1 (header Produto) | `Edite esta coluna: insira o nome exato do produto. Consulte a aba "Produtos" para nomes validos.` |
| H1 (header Tipo) | `G = Produto Global (padrao AB InBev)\nL = Produto Legado (local/regional, a ser migrado)` |
| I1 (header Ativo) | `Sim = produto ativo no site\nNao = produto inativo/removido\nSo aceita "Sim" ou "Nao".` |
| J1 (header Plano Rollout) | `Campo livre para planejamento.\nExemplos: "Q1 2026", "Piloto Mar/26", "2027 H2"\nNao afeta scores — e referencia para gestao.` |
| F1 (header Score Dom.) | `Score de maturidade atual do dominio neste site.\n0=sem produto, 1-4=nivel atingido.\nRecalculado automaticamente na reimportacao.` |
| Cada celula de gap (Produto vazio) | `GAP: Nenhum produto ativo neste dominio.\nPara adicionar: preencha Produto, Tipo e mude Ativo para "Sim".` |

### 5.2 Cobertura por Site

| Celula | Conteudo do Comment |
|--------|-------------------|
| D1 (Score Geral) | `Minimo dos scores de dominio.\nExclui UT e SF do calculo.\nL0=0 ate L4=4.` |
| G1 (UT) | `Utilities: excluido temporariamente do score geral (dados pendentes). Mostrado em italico.` |
| M1 (SF) | `Safety: excluido temporariamente do score geral (dados pendentes). Mostrado em italico.` |

### 5.3 Produtos

| Celula | Conteudo do Comment |
|--------|-------------------|
| E1 (Dominios Cobertos) | `Dominios derivados automaticamente via mapeamento cap_keys.\nNao e o dominio de assignment, e o dominio de impacto nas capabilidades.` |
| F1-I1 (Cobertura L1-L4) | `Formato: DOM:cobertas/total.\nEx: "BP:8/12" = 8 de 12 N4s do gate cobertas no dominio BP.` |

### 5.4 Capabilidades

| Celula | Conteudo do Comment |
|--------|-------------------|
| K1 (Coberto por) | `Lista de cap_keys dos produtos que cobrem esta N4.\nUm produto pode ter multiplas cap_keys.` |

---

## 6. Aba Guia — Conteudo Exato

Descrito completamente na secao 3.1 acima. Resumo das secoes:

1. **Titulo + subtitulo** (rows 1-2)
2. **Abas desta planilha** (rows 4-10) — tabela com #, nome, descricao, tipo
3. **Legenda de cores — Maturidade** (rows 12-17) — amostras visuais L0-L4
4. **Legenda de cores — Editabilidade** (rows 19-23) — amostras editavel/read-only
5. **Como editar e reimportar** (rows 25-31) — passo-a-passo + alerta
6. **Operacoes comuns** (rows 33-39) — tabela operacao/como/exemplo
7. **Regras de reimportacao** (rows 41-46) — lista de regras do parser
8. **Glossario** (rows 48-57) — tabela termo/definicao

**Sentinel string:** `COVERAGE_ROLLOUT_V2` na celula A1, entre colchetes no titulo. Manter backward compat: parser aceita V1 ou V2.

---

## 7. Relacionamentos e Navegabilidade

Hyperlinks entre abas nao sao suportados pelo SheetJS. Estrategias alternativas:

### 7.1 Cross-reference por texto explicito

Na aba Rollout, a coluna Score Dom. (F) mostra o resultado calculado, criando a ponte direta: "este produto neste dominio neste site resulta neste score".

Na aba Produtos, a coluna "Dominios Cobertos (Cap)" e "Cobertura L1-L4" mostram o impacto do produto nas capabilidades sem precisar ir para outra aba.

Na aba Cobertura por Site, todos os 9 scores de dominio em uma linha permitem comparacao imediata.

### 7.2 Chaves compartilhadas para filtragem

Todas as abas usam os mesmos codigos de dominio (BP, DA, UT, MT, MG, MDM, PP, QL, SF). O usuario pode usar Ctrl+F ou AutoFilter do Excel para navegar entre abas usando o mesmo codigo.

Estrategia sugerida no Guia (secao operacoes):
> "Para ver quais capabilidades um produto cobre: filtre a aba Capabilidades pela coluna K (Coberto por) usando o nome do produto."

### 7.3 Nomenclatura consistente

- Produto: mesmo nome exato em Rollout, Produtos, e Capabilidades (col K)
- Dominio: mesmo codigo (BP etc) em todas as abas
- Gate: mesmo formato (L1/L2/L3/L4) em todas as abas

### 7.4 Ordem de abas como fluxo narrativo

1. Guia: contexto
2. Rollout: acao (editar)
3. Cobertura por Site: resultado (ver impacto)
4. Produtos: referencia (o que cada produto faz)
5. Capabilidades: detalhe (granularidade N4)
6. Req. por Nivel: regras (o que precisa para subir)

Este fluxo guia o usuario de "o que fazer" para "entender por que".

---

## 8. Compatibilidade com Reimportacao

### 8.1 Constraints do parser existente (funcao `parseRolloutImport`)

1. **Aba "Rollout" deve existir:** `workbook.Sheets['Rollout']` — nome exato, case-sensitive
2. **Header na row 0:** Parser le `rawRows[0]` como header
3. **Strip de sufixo:** Regex `\s*←.*$` remove tudo apos `←`. Nomes resultantes esperados (lowercase): `zona`, `pais`/`país`, `site`, `codigo`/`código`, `dominio`/`domínio`, `produto`, `tipo`, `ativo`, `plano rollout`
4. **Colunas obrigatorias:** `site`, `codigo`/`código`, `produto` — parser lanca erro se ausentes
5. **Colunas opcionais:** `zona`, `pais`, `tipo`, `ativo` — parser usa defaults se ausentes
6. **Colunas desconhecidas sao ignoradas:** Parser busca por nome, nao por indice. A nova coluna `Score Dom.` sera ignorada automaticamente.
7. **Sentinel na aba Instrucoes:** `isRolloutWorkbook` busca `COVERAGE_ROLLOUT_V1` em qualquer row da aba "Instrucoes"

### 8.2 Mudancas que PRESERVAM compatibilidade (safe)

| Mudanca | Motivo da seguranca |
|---------|-------------------|
| Adicionar coluna `Score Dom.` na Rollout | Parser ignora colunas desconhecidas |
| Adicionar aba `Cobertura por Site` | Parser so le aba "Rollout" |
| Reformular aba Produtos | Parser nao le aba Produtos |
| Adicionar cores, borders, comments | Parser le valores, ignora formatacao |
| Mudar nome de `Instrucoes` para `Guia` | **REQUER MUDANCA** (ver abaixo) |
| Mudar sentinel para V2 | **REQUER MUDANCA** (ver abaixo) |

### 8.3 Mudancas que REQUEREM atualizacao do parser

**Mudanca 1: Nome da aba de instrucoes**

Atual: parser busca `workbook.Sheets['Instrucoes']` (com cedilha depende do encoding, mas no codigo fonte esta `'Instruções'`).

Opcao A (recomendada): Manter aba chamada `Guia` no export, mas atualizar `isRolloutWorkbook` para aceitar ambos:
```typescript
const instrSheet = workbook.Sheets['Instruções'] || workbook.Sheets['Guia'];
```

Opcao B: Manter nome `Instruções` por compatibilidade. **Nao recomendado** — o nome nao reflete mais o conteudo reformulado.

**Mudanca 2: Sentinel V2**

Atualizar deteccao para aceitar V1 e V2:
```typescript
return rows.some(r => {
  const s = String(r[0] ?? '');
  return s.includes('COVERAGE_ROLLOUT_V1') || s.includes('COVERAGE_ROLLOUT_V2');
});
```

**Mudanca 3: Header "Cod." vs "Codigo"**

Atual header: `Código`. Proposta: `Cod.` (mais curto). O parser ja faz fallback com `ci(['código', 'codigo', 'cod.', 'code'])` — `cod.` ja e aceito. **Safe.**

### 8.4 Formato dos dados na Rollout (nao mudar)

| Campo | Formato esperado pelo parser | Manter |
|-------|---------------------------|--------|
| Zona | String livre | Sim |
| Pais | String livre | Sim |
| Site | String livre, obrigatorio | Sim |
| Codigo | String uppercase (BP, DA, etc), obrigatorio | Sim |
| Dominio | String livre (ignorada pelo parser, usa Codigo) | Sim |
| Produto | String livre, obrigatorio | Sim |
| Tipo | "G" ou "L" (default "G") | Sim |
| Ativo | "Sim"/"Nao" (aceita "yes"/"no"/"true"/"false") | Sim |
| Plano Rollout | String livre (nao parseada) | Sim |
| Score Dom. (novo) | Number (ignorado pelo parser) | N/A |

---

## 9. Notas para o Dev Frontend

### 9.1 Implementacao SheetJS — Referencia rapida

```typescript
// Cor de fundo de celula
cell.s = {
  fill: { fgColor: { rgb: "FEF3C7" } }, // sem #, 6 hex digits
  font: { bold: true, color: { rgb: "92400E" }, sz: 11, name: "Calibri" },
  border: {
    bottom: { style: "medium", color: { rgb: "D1D5DB" } },
    left: { style: "medium", color: { rgb: "F59E0B" } },
  },
  alignment: { vertical: "center", horizontal: "left" },
};

// Freeze panes
ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: "A2", state: "frozen" };
// OU (formato alternativo mais comum em SheetJS):
ws['!panes'] = [{ xSplit: 0, ySplit: 1, topLeftCell: "A2", activePane: "bottomLeft", state: "frozen" }];

// Cell comments (notas)
if (!ws['!comments']) ws['!comments'] = {};
ws['G1'].c = [{ a: "Coverage Dashboard", t: "Edite esta coluna..." }];

// Merge cells
ws['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // A1:H1
];

// Column widths
ws['!cols'] = [{ wch: 7 }, { wch: 16 }, ...];

// Row heights
ws['!rows'] = [{ hpt: 36 }, { hpt: 24 }, ...]; // indexed by row number
```

### 9.2 Funcao helper sugerida para cor condicional de nivel

```typescript
function getLevelStyle(score: number): { fill: string; font: string } {
  const map: Record<number, { fill: string; font: string }> = {
    0: { fill: "FEE2E2", font: "991B1B" }, // L0
    1: { fill: "FEF3C7", font: "92400E" }, // L1
    2: { fill: "FDE68A", font: "78350F" }, // L2
    3: { fill: "D1FAE5", font: "065F46" }, // L3
    4: { fill: "A7F3D0", font: "064E3B" }, // L4
  };
  return map[score] ?? map[0];
}
```

### 9.3 Funcao helper para status

```typescript
function getStatusStyle(status: string): { fill: string; font: string } {
  const s = status.toUpperCase().trim();
  if (s === "READY") return { fill: "D1FAE5", font: "065F46" };
  if (s === "NOT READY") return { fill: "FEE2E2", font: "991B1B" };
  if (s === "IN PROGRESS") return { fill: "FEF3C7", font: "92400E" };
  return { fill: "F3F4F6", font: "6B7280" }; // N/A
}
```

### 9.4 Performance com ~1500-2000 linhas na Rollout

- Aplicar estilos em batch (iterar uma vez sobre todas as celulas, nao por coluna)
- Cell comments sao leves (apenas headers + gaps)
- A nova aba "Cobertura por Site" tem ~163 linhas (uma por site) — negligivel
- Capabilidades tem ~1561 linhas com banding — pre-computar dominio par/impar antes do loop

### 9.5 Checklist de implementacao

- [ ] Atualizar sentinel para `COVERAGE_ROLLOUT_V2`
- [ ] Atualizar `isRolloutWorkbook` para aceitar V1 e V2
- [ ] Atualizar `isRolloutWorkbook` para aceitar aba "Guia" alem de "Instrucoes"
- [ ] Aba Guia: conteudo formatado com merges, tabelas, legendas visuais
- [ ] Aba Rollout: adicionar coluna Score Dom. (posicao F, antes de Produto)
- [ ] Aba Rollout: aplicar cores editavel/read-only em headers e celulas
- [ ] Aba Rollout: linhas de gap com fill vermelho claro
- [ ] Aba Rollout: borda esquerda amber na coluna Produto (divisor visual)
- [ ] Aba Rollout: bordas de separacao entre sites
- [ ] Aba Rollout: freeze pane A2
- [ ] Aba Rollout: cell comments nos headers editaveis e nas celulas de gap
- [ ] Nova aba Cobertura por Site: gerar a partir dos dados existentes
- [ ] Aba Cobertura por Site: cores condicionais por nivel em cada celula de score
- [ ] Aba Cobertura por Site: freeze pane D2
- [ ] Aba Produtos: reformular para flat table (eliminar blocos com linhas em branco)
- [ ] Aba Produtos: colunas de cobertura por gate (L1-L4)
- [ ] Aba Capabilidades: banding por dominio
- [ ] Aba Capabilidades: cor condicional na coluna Status
- [ ] Aba Capabilidades: freeze pane C2
- [ ] Aba Req. por Nivel: cores condicionais no % do resumo matricial
- [ ] Aba Req. por Nivel: separadores de gate coloridos
- [ ] Todas abas: font Calibri consistente, tamanhos conforme spec
- [ ] Testar reimportacao com arquivo formatado (garantir parser ignora novas colunas/abas)

### 9.6 Ordem de colunas na Rollout — mapeamento antigo vs. novo

| Col Antiga | Col Nova | Header Antigo | Header Novo |
|-----------|---------|--------------|-------------|
| A | A | Zona | Zona |
| B | B | Pais | Pais |
| C | C | Site | Site |
| D | D | Codigo | Cod. |
| E | E | Dominio | Dominio |
| (nao existia) | **F** | — | **Score Dom.** |
| F | **G** | Produto ← EDITAR | Produto ← EDITAR |
| G | **H** | Tipo ← EDITAR | Tipo ← EDITAR |
| H | **I** | Ativo ← EDITAR | Ativo ← EDITAR |
| I | **J** | Plano Rollout ← EDITAR | Plano Rollout ← EDITAR |

**ATENCAO:** A insercao da coluna F (Score Dom.) desloca as colunas editaveis de F-I para G-J. O parser busca por NOME de coluna, nao por indice, entao isso e **safe**. Mas se houver qualquer codigo que referencia colunas por indice numerico, precisa ser atualizado.

---

## 10. Wireframe ASCII — Visao Geral

### Aba Rollout (colunas A-J, primeiras linhas)

```
+-------+--------+--------------------+------+------------------+--------+----------------------------+-------+-------+------------------+
| Zona  | Pais   | Site               | Cod. | Dominio          | Score  | Produto ← EDITAR          | Tipo  | Ativo | Plano Rollout    |
|       |        |                    |      |                  | Dom.   |                            |← ED. |← ED. | ← EDITAR         |
| [GRAY HEADER]  [GRAY HEADER]        [GRAY] [GRAY HEADER]     [GRAY]  |[== AMBER HEADER ===========|=======|=======|==================]|
+-------+--------+--------------------+------+------------------+--------+------|---------------------+-------+-------+------------------+
| AFR   | Ghana  | Accra Brewery      | BP   | Brewing Perf.    |  2     |█ Star Lager Insights       | G     | Sim   |                  |
| AFR   | Ghana  | Accra Brewery      | DA   | Data Acquisition |  1     |█ SCADA Gateway             | G     | Sim   | Q3 2026          |
| AFR   | Ghana  | Accra Brewery      | UT   | Utilities        |  0     |█ [vermelho claro - GAP]    |       | Nao   |                  |
| AFR   | Ghana  | Accra Brewery      | MT   | Maintenance      |  3     |█ SAP PM                    | L     | Sim   |                  |
| ...   | ...    |                    | ...  |                  |        |█                           |       |       |                  |
+-------+--------+====================+------+------------------+--------+============================+=======+=======+==================+
| AFR   | Ghana  | Kumasi Brewery     | BP   | Brewing Perf.    |  1     |█ ...                       |       |       |                  |
```

Legenda:
- `[GRAY HEADER]` = fill `#E5E7EB`
- `[AMBER HEADER]` = fill `#FEF3C7`
- `█` = borda esquerda amber `#F59E0B` (divisor visual editavel)
- `[vermelho claro - GAP]` = fill `#FEE2E2` na linha inteira
- `===` entre sites = borda bottom medium `#D1D5DB`
- Celulas ivory `#FFFFF0` nas colunas editaveis (G-J)
- Celulas cinza `#F9FAFB` nas colunas read-only (A-F)

### Aba Cobertura por Site (colunas A-P, primeiras linhas)

```
+-------+--------+--------------------+--------+----+----+----+----+----+-----+----+----+----+------+------+--------+
| Zona  | Pais   | Site               | Score  | BP | DA | UT | MT | MG | MDM | PP | QL | SF | Gaps | Tipo | Prods  |
|       |        |                    | Geral  |    |    |    |    |    |     |    |    |    | (L0) | Pred | Total  |
+-------+--------+--------------------+--------+----+----+----+----+----+-----+----+----+----+------+------+--------+
| AFR   | Ghana  | **Accra Brewery**  | [L1]1  |[2] |[1] |[0] |[3] |[1] | [1] |[2] |[1] |[0] | 2    | G    | 12     |
| AFR   | Ghana  | **Kumasi Brewery** | [L0]0  |[1] |[0] |[0] |[0] |[1] | [0] |[1] |[0] |[0] | 6    | L    | 4      |
```

Legenda: `[Ln]` = celula com cor de fundo do nivel n (ver paleta secao 2.2)

---

*End of Design Spec*
