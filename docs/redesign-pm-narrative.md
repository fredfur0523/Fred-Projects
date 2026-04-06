# Portfolio Intelligence -- Redesign PM Narrative

**Produto:** Coverage Dashboard (React/TypeScript)
**Aba:** Portfolio Intelligence
**Persona-alvo:** VP de Zona (AFR, SAZ, MAZ, NAZ, EUR, APAC)
**Data:** 2026-04-04
**Autor:** PM Dev Crew

---

## 1. Narrativa para VP de Zona

O VP de Zona entra numa reunião executiva mensal com o Chief Supply Officer. Tem 3 minutos para responder: "Sua zona esta pronta para operar no stack global?" A aba Portfolio Intelligence precisa armar esse VP com resposta inequivoca em menos de 60 segundos de leitura.

### Estrutura da historia: Situacao -- Meta -- Gap -- Plano

**Situacao Atual**
"Minha zona tem X% de paridade com o portfolio global. De 9 dominios, Y estao prontos, Z estao em transicao e W ainda dependem de sistemas legados."

**Meta**
"Ate Q4/2027, a meta corporativa e 85% de paridade global. Minha zona precisa mover de X% para 85%, o que significa habilitar N capabilities nos proximos 6 trimestres."

**Gap**
"Hoje faltam N capabilities em K dominios. Os 3 maiores gaps sao [Dominio A], [Dominio B] e [Dominio C]. Tenho M sistemas legados cobrindo essas funcoes, dos quais P tem decommissioning planejado e Q nao tem plano ainda."

**Plano**
"No proximo trimestre, entram N capabilities via [produto global]. Ao mesmo tempo, decomissionamos [sistema legado X] em [N sites]. Isso move minha paridade de X% para Y%."

> O VP nao quer saber de N4 capabilities, L-levels ou taxonomia tecnica. Quer saber: estou cobrindo o que a companhia espera? O que falta? Quando fecho o gap?

---

## 2. Metricas Headline (5 KPIs)

Esses sao os 5 numeros que aparecem no topo da aba, em cards grandes, visiveis em 5 segundos.

| # | Metrica | Formula Conceitual | Fonte de Dados | Target |
|---|---------|-------------------|----------------|--------|
| 1 | **Global Parity Index** | (N4 capabilities com status=READY na zona) / (Total N4 capabilities no portfolio global) x 100 | portfolio_capabilities.json filtrado por zona | 85% ate Q4/2027 |
| 2 | **Domain Readiness** | Contagem de dominios onde Parity Index > 70% vs total de 9 dominios. Formato: "5 of 9 domains ready" | portfolio_capabilities.json agrupado por domain_code | 9/9 |
| 3 | **Legacy Exposure** | Numero de sistemas legados ativos na zona sem data de decommissioning planejada | LOCAL_SYSTEMS cruzado com planned_year | 0 |
| 4 | **Decommission Velocity** | Sistemas legados decomissionados nos ultimos 2 trimestres / Total de legados no inicio do periodo | LOCAL_SYSTEMS + historico temporal | Crescente QoQ |
| 5 | **Next Quarter Delta** | Quantas N4 capabilities mudam de NOT READY para READY no proximo trimestre (planned_year + planned_quarter) | portfolio_capabilities.json filtrado por planned_quarter | Conforme roadmap |

### Logica de cores nos cards

- **Verde:** metrica no target ou acima
- **Amarelo:** metrica entre 60-79% do target
- **Vermelho:** metrica abaixo de 60% do target

---

## 3. Jornada do VP na Tela (4 passos)

A sequencia de leitura respeita a logica: overview rapido, identificacao de problema, entendimento do gap, plano de acao.

### Passo 1 -- "Como estou?" (5 segundos)

**O VP ve:** 5 KPI cards headline no topo da tela.
**Pergunta respondida:** "Qual meu nivel de paridade global e qual minha exposicao a legados?"
**Interacao:** Nenhuma. Leitura passiva. Cores indicam saude.

### Passo 2 -- "Onde estou bem e onde estou mal?" (15 segundos)

**O VP ve:** Heatmap de 9 dominios (linhas) x status (READY / IN PROGRESS / LEGACY). Cada celula mostra % de paridade do dominio.
**Pergunta respondida:** "Quais dominios estao prontos, quais estao atrasados, quais sao criticos?"
**Interacao:** Hover mostra tooltip com top-3 gaps do dominio. Click filtra a tela inteira para aquele dominio.

### Passo 3 -- "O que falta e quando chega?" (30 segundos)

**O VP ve:** Timeline horizontal (trimestral) mostrando: capabilities planejadas para ativacao + legados planejados para decommissioning. Linha de projecao mostra quando a zona atinge 85%.
**Pergunta respondida:** "Quando terei paridade? O roadmap atual fecha o gap?"
**Interacao:** Hover por trimestre mostra detalhes. Toggle entre "capabilities arriving" e "legacies retiring".

### Passo 4 -- "O que levo para a reuniao?" (10 segundos)

**O VP ve:** Botao "Export Summary" que gera um one-pager PDF/PPT com os 5 KPIs, heatmap resumido, top-5 gaps e proximo trimestre.
**Pergunta respondida:** "Que material levo para a proxima reuniao com o CSO?"
**Interacao:** Click gera export. Opcao de incluir ou nao drill-down por dominio.

---

## 4. Estrutura de Secoes da Aba Redesenhada

### Secao A -- KPI Headline Strip

| Aspecto | Detalhe |
|---------|---------|
| **Proposito** | Resposta em 5 segundos: "como estou?" |
| **O que mostra** | 5 cards com Global Parity Index, Domain Readiness, Legacy Exposure, Decommission Velocity, Next Quarter Delta |
| **Dados** | portfolio_capabilities.json, LOCAL_SYSTEMS |
| **Decisao** | NOVO -- nao existe hoje |

### Secao B -- Domain Readiness Heatmap

| Aspecto | Detalhe |
|---------|---------|
| **Proposito** | Visao cross-domain: quais dominios estao prontos, em transicao ou legados |
| **O que mostra** | Grid 9 dominios x 3 status buckets (Ready / Approaching / Legacy). Celulas colorizadas por % paridade. Tooltip com top gaps |
| **Dados** | portfolio_capabilities.json agrupado por domain_code + status |
| **Decisao** | NOVO -- substitui a capability tree de 5 niveis |

### Secao C -- Parity Timeline

| Aspecto | Detalhe |
|---------|---------|
| **Proposito** | Narrativa temporal: onde estou, para onde vou, quando chego |
| **O que mostra** | Grafico de area/linha trimestral. Eixo Y = % paridade. Linha de meta (85%). Areas empilhadas por dominio opcional. Markers de decommissioning |
| **Dados** | portfolio_capabilities.json (planned_year, planned_quarter, status) |
| **Decisao** | NOVO -- nao existe narrativa temporal hoje |

### Secao D -- Gap Detail Table

| Aspecto | Detalhe |
|---------|---------|
| **Proposito** | Drill-down para quem quer entender o que especificamente falta |
| **O que mostra** | Tabela filtravel: Dominio, Capability (nivel N2 no maximo, nao N4), Produto Global associado, Status, Planned Quarter, Legado que substitui |
| **Dados** | portfolio_capabilities.json + GLOBAL_PRODUCT_LEVELS + LOCAL_SYSTEMS |
| **Decisao** | REDESENHAR -- a capability tree atual vira tabela flat filtravel, colapsando 5 niveis em 2 (dominio + capability agrupada) |

### Secao E -- Decommissioning Roadmap

| Aspecto | Detalhe |
|---------|---------|
| **Proposito** | Plano de saida de legados com timeline e impacto |
| **O que mostra** | Lista de sistemas legados da zona, ordenada por data de decommissioning. Para cada: nome, dominios cobertos, sites impactados, produto global substituto, data planejada. Filtro por dominio |
| **Dados** | LOCAL_SYSTEMS + SITE_DOMAIN_TYPE + GLOBAL_PRODUCT_LEVELS |
| **Decisao** | REDESENHAR -- expande o top-5 atual para lista completa com timeline e drill-down |

### Secao F -- Export / Takeaway

| Aspecto | Detalhe |
|---------|---------|
| **Proposito** | VP gera material para proxima reuniao |
| **O que mostra** | Botao de export com opcoes: Executive Summary (1 pagina), Gap Report (detalhado), Action Plan (proximos 2 trimestres) |
| **Dados** | Todos os anteriores, renderizados em template PDF/PPT |
| **Decisao** | NOVO -- nao existe hoje |

### O que REMOVER

| Elemento atual | Motivo da remocao |
|----------------|-------------------|
| Capability tree 5 niveis (Subarea-N1-N2-N3-N4) | Excessivamente tecnico para VP. Informacao migra para Gap Detail Table em formato flat |
| Top-5 decommissioning sem timeline | Substituido pela Secao E completa |
| Qualquer referencia a L-levels (L1-L4) | Taxonomia interna de produto, nao linguagem de VP |

---

## 5. Exportabilidade -- Takeaway para o VP

O VP participa de 3 tipos de reuniao onde precisa de material do Portfolio Intelligence:

### 5.1 Reuniao executiva mensal com CSO (1 pagina)

**Formato:** PDF ou slide PPT unico
**Conteudo:**
- 5 KPIs headline com setas de tendencia (vs mes anterior)
- Mini heatmap de 9 dominios (3 cores)
- Top 3 gaps por impacto
- Proximo trimestre: o que entra e o que sai
- Assinatura: "Gerado em [data] para [zona]"

### 5.2 Reuniao de planejamento trimestral (3-5 paginas)

**Formato:** PDF detalhado
**Conteudo:**
- Tudo do executive summary
- Gap detail por dominio (top 10 capabilities faltantes por dominio)
- Decommissioning roadmap completo com timeline
- Projecao: "Se mantivermos velocidade atual, atingimos 85% em Q[X]/[YYYY]"

### 5.3 Action list para follow-up (tabela)

**Formato:** CSV ou Excel
**Conteudo:**
- Lista de gaps com: dominio, capability, produto global, status, quarter planejado, sistema legado relacionado, sites impactados
- Filtravel e ordenavel pelo VP ou seu time de suporte

---

## Resumo de Decisoes

| Decisao | Racional |
|---------|----------|
| Colapsar 5 niveis de capability em 2 | VP nao navega taxonomia tecnica. Dominio + capability agrupada e suficiente |
| Adicionar metricas headline | Sem numeros grandes, nao ha resposta em 5 segundos |
| Criar narrativa temporal | Sem timeline, VP nao sabe se esta melhorando ou piorando |
| Expandir decommissioning | Top-5 sem timeline nao responde "quando descomissiono tudo?" |
| Heatmap cross-domain | VP precisa de visao comparativa entre dominios, nao lista sequencial |
| Export em 3 formatos | VP usa material em contextos diferentes; um formato unico nao atende |

---

## Proximos Passos

1. Validar esta narrativa com 1-2 VPs de zona (preferencialmente SAZ e EUR por diversidade de maturidade)
2. Criar wireframe low-fidelity seguindo a jornada de 4 passos
3. Estimar esforco de desenvolvimento (sprint planning)
4. Definir se export PDF/PPT requer biblioteca adicional ou se usa solucao existente
