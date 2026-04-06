# PM Scope: Site + Domain Detail Experience

**Produto:** Coverage Assessment Dashboard
**Feature:** Detalhe por Site + Dominio (barras de progresso L1-L4 e capabilities N4)
**Data:** 2026-04-05
**Autor:** PM Agent
**Alinhamento estrategico:** Fase 2 da Consolidacao UX (absorver Gap de Capacidade na aba Sites)

---

## 1. Contexto e Oportunidade

### Problema
O dashboard mostra scores agregados por site e dominio, mas nao responde a pergunta mais frequente do Tech Lead e do VP de Zona: **"O que exatamente falta para este site subir de nivel neste dominio?"**. Hoje, o usuario precisa sair do dashboard e consultar planilhas Excel para obter essa informacao.

O modal CapabilitySiteDetail ja mostra gates L1-L4 por dominio com thresholds (60/75/85/90%), mas e uma visao de semaforo -- nao detalha o progresso dentro de cada gate nem lista as capabilities individuais pendentes.

### Oportunidade
Transformar o clique em um dominio em um painel **actionable**: mostrar quanto falta para atingir o proximo gate e quais capabilities especificas precisam ser implantadas. Isso reduz o tempo de decisao de "horas consultando planilhas" para "segundos dentro do dashboard" e habilita o fluxo de priorizacao site-a-site.

### Relacao com o roadmap
Esta feature corresponde a Fase 2 da Consolidacao UX aprovada em 2026-04-04. O plano original preve "expandable row ou panel lateral em Sites com detalhamento N3/N4" e "remocao da aba Gap de Capacidade". Esta especificacao detalha o **como** dessa decisao ja tomada.

---

## 2. Decisoes de Produto (D1-D4)

### D1: Onde mostrar o detalhe?

**Decisao: Opcao A -- Expandir dentro do CapabilitySiteDetail existente.**

**Justificativa:**
- O usuario ja esta no contexto mental correto (olhando para um site especifico). Abrir um segundo modal quebraria o fluxo e criaria profundidade de navegacao desnecessaria.
- Expandir inline dentro do modal existente mantem a hierarquia natural: Site > Dominios (visao atual) > Dominio especifico (nova visao).
- Zero impacto em componentes fora do modal. Menor risco de regressao.
- Consistente com a diretriz de Fase 2: "expandable row ou panel lateral".

**Mecanica:** Ao clicar em uma linha de dominio dentro do CapabilitySiteDetail, a linha expande para baixo mostrando barras de progresso e (na v2) lista de capabilities. Clicar novamente colapsa. Apenas um dominio expandido por vez.

### D2: Dados de fracs -- qual fonte usar?

**Decisao: Opcao C -- Ambos (MATURITY_DETAIL como primario + globalFracs/legacyFracs para separacao G/L).**

**Justificativa:**
- A separacao Global vs Legacy e um dos insights mais demandados pelo VP de Zona. Um site pode ter 70% de cobertura em um dominio, mas se tudo e Legacy, a posicao estrategica e completamente diferente de 70% Global.
- O custo adicional de 132KB e aceitavel (ja validado como dentro das restricoes de bundle).
- Usar MATURITY_DETAIL como fonte primaria garante consistencia com os scores ja exibidos. GlobalFracs/legacyFracs sao complemento para a visualizacao de barra segmentada.
- Sem a separacao G/L, a feature entrega apenas 60% do valor de negocio.

**Implementacao de dados:** Embarcar `globalFracs` e `legacyFracs` do `site_product_map.ts` (293KB completo, delta util ~132KB) no App.tsx.

### D3: Nivel de detalhe de capabilities (N4s)?

**Decisao: Opcao D -- Apenas para o "next gate" (capabilities faltantes para subir de nivel). Implementar na v2.**

**Justificativa:**
- Mostrar TODAS as capabilities de TODOS os gates gera sobrecarga cognitiva. O usuario nao precisa ver 160 N4s; precisa saber "o que falta para eu subir de L2 para L3?".
- O framing "next gate" e inerentemente actionable: e uma lista de tarefas, nao um inventario.
- O volume de dados e drasticamente menor: em vez de ~160 N4s por dominio x 150 sites, mostra apenas os N4s faltantes do proximo gate (tipicamente 5-15 itens).
- Requer geracao de dataset TS a partir do Excel, o que adiciona complexidade e dependencia. Separar em v2 reduz risco do MVP.
- Na v2, agrupar por subarea dentro do gate NAO e necessario inicialmente. Lista simples com status atendido/pendente e suficiente.

### D4: Escopo de release

**Decisao: Opcao C -- Progressivo (MVP agora, capabilities na proxima iteracao).**

| Release | Conteudo | Dados necessarios |
|---------|----------|-------------------|
| **MVP (Sprint atual)** | Barras de progresso L1-L4 com separacao Global/Legacy, dentro do CapabilitySiteDetail expandivel | MATURITY_DETAIL (ja embarcado) + globalFracs/legacyFracs (embarcar do site_product_map.ts) |
| **v2 (Sprint seguinte)** | Lista de N4s faltantes para o proximo gate, com status atendido/pendente | Dataset TS gerado a partir do Excel via Python script |

**Justificativa:**
- O MVP ja entrega 80% do valor: o usuario ve quanto falta por level e entende a posicao G/L.
- Separar a geracao do dataset de capabilities (que tem dependencia de pipeline Python) isola o risco.
- Permite validar o padrao de interacao (expandir dominio dentro do modal) antes de investir em dados mais granulares.

---

## 3. Personas Afetadas

| Persona | Necessidade primaria | Frequencia de uso |
|---------|---------------------|-------------------|
| **Tech Lead / Gerente Digital** | "O que falta para subir este site de L2 para L3 em DA?" -- precisa de lista acionavel para planejar implantacoes | Diaria |
| **VP de Zona** | "Meus sites estao convergindo para Global ou ainda dependem de Legacy?" -- precisa de visao estrategica G/L | Semanal |
| **Diretor Global** | "Quais dominios estao bloqueando a maturidade em escala?" -- precisa de pattern recognition cross-site | Mensal |

---

## 4. User Stories

### US-01: Barras de progresso por gate

**Como** Tech Lead, **quero** ver barras de progresso L1/L2/L3/L4 ao clicar em um dominio de um site, **para** entender rapidamente quanto falta para atingir cada gate sem consultar planilhas.

**Criterios de aceite:**
1. Ao clicar em uma linha de dominio dentro do CapabilitySiteDetail, a linha expande mostrando 4 barras horizontais (L1, L2, L3, L4).
2. Cada barra mostra o percentual de N4s cobertos (frac do MATURITY_DETAIL) com valor numerico visivel (ex: "12/18 = 67%").
3. Barra indica visualmente se o threshold do gate foi atingido (60/75/85/90%) com cor ou marcador.
4. Apenas um dominio pode estar expandido por vez; clicar em outro colapsa o anterior.
5. Clicar novamente no mesmo dominio colapsa a expansao.

**Story Points: 5** (complexidade moderada: novo componente visual dentro de estrutura existente, sem dados novos)

---

### US-02: Separacao Global vs Legacy nas barras

**Como** VP de Zona, **quero** ver a proporcao Global vs Legacy dentro de cada barra de progresso, **para** distinguir se a cobertura de um dominio e sustentavel (Global) ou temporaria (Legacy).

**Criterios de aceite:**
1. Cada barra L1-L4 e segmentada em duas cores: Global (ex: azul) e Legacy (ex: amarelo/laranja).
2. Tooltip ou label mostra: "Global: X/Y (Z%) | Legacy: A/B (C%) | Total: D/E (F%)".
3. Se um site nao tem produtos Legacy em um dominio, a barra mostra apenas Global (sem segmento vazio).
4. Dados vem de globalFracs/legacyFracs do site_product_map expandido.
5. Os totais das barras sao consistentes com os scores ja exibidos no CapabilitySiteDetail (sem divergencia numerica).

**Story Points: 5** (complexidade moderada: requer embarcar novo dataset + logica de merge com dados existentes + validacao de consistencia)

---

### US-03: Indicacao visual de gate atual e proximo gate

**Como** Tech Lead, **quero** ver claramente qual e o gate atual do site neste dominio e quanto falta para o proximo, **para** priorizar acoes que movem o site de nivel.

**Criterios de aceite:**
1. O gate atualmente atingido (ex: L2) e destacado visualmente (badge, cor, ou icone).
2. O proximo gate (ex: L3) mostra o delta: "faltam X capabilities para atingir L3 (atualmente em Y%)".
3. Se o site ja esta em L4, mostra "Gate maximo atingido" sem delta.
4. Se o site nao atingiu L1, mostra "Abaixo de L1 -- faltam X capabilities para L1".

**Story Points: 3** (simples: logica derivada dos fracs ja disponveis, sem dados novos, apenas apresentacao)

---

### US-04: Lista de capabilities (N4s) faltantes para o proximo gate [v2]

**Como** Tech Lead, **quero** ver a lista de capabilities individuais (N4s) que faltam para o proximo gate, **para** criar um plano de implantacao especifico.

**Criterios de aceite:**
1. Abaixo das barras de progresso, secao "Capabilities pendentes para [proximo gate]" lista cada N4 faltante.
2. Cada item mostra: nome da capability (N4), status (pendente/atendida), e se e Global ou Legacy.
3. Lista e ordenada por subarea (agrupamento leve, nao hierarquico).
4. Se ha mais de 15 itens, mostrar os primeiros 10 com "ver mais" expansivel.
5. Total de pendentes visivel: "X de Y capabilities pendentes".

**Story Points: 8** (complexo: requer geracao de dataset TS a partir de Excel, pipeline Python, validacao de mapeamento N4-to-gate, e novo componente de lista)

---

### US-05: Responsividade e performance do detalhe expandido

**Como** usuario do dashboard, **quero** que a expansao do detalhe por dominio seja instantanea e nao quebre o layout do modal, **para** ter uma experiencia fluida sem espera.

**Criterios de aceite:**
1. A expansao/colapso do detalhe acontece em menos de 200ms (animacao CSS, sem re-render pesado).
2. O modal nao excede a altura da viewport; se necessario, scroll interno.
3. Em tela de 1366x768 (resolucao minima corporativa), o conteudo expandido e legivel sem scroll horizontal.
4. Com dados de qualquer dos 163 sites, o componente nao apresenta erro de renderizacao.

**Story Points: 3** (simples: requisitos nao-funcionais de componente visual, sem logica de dados)

---

## 5. Tabela Resumo

| ID | Historia (resumo) | Persona | MoSCoW | SP |
|----|--------------------|---------|--------|-----|
| US-01 | Barras de progresso L1-L4 por dominio no modal | Tech Lead | **Must** | 5 |
| US-02 | Separacao Global vs Legacy nas barras | VP de Zona | **Must** | 5 |
| US-03 | Indicacao de gate atual e delta para proximo gate | Tech Lead | **Should** | 3 |
| US-04 | Lista de N4s faltantes para proximo gate [v2] | Tech Lead | **Could** | 8 |
| US-05 | Responsividade e performance do detalhe expandido | Todos | **Must** | 3 |

### Breakdown de SP

| Prioridade | Historias | SP |
|------------|-----------|-----|
| **Must** | US-01, US-02, US-05 | 13 |
| **Should** | US-03 | 3 |
| **Could** | US-04 | 8 |
| **Total** | | **24** |

### Sprint allocation recomendada

- **Sprint atual (MVP):** US-01 + US-02 + US-03 + US-05 = **16 SP** (Must + Should)
- **Sprint seguinte (v2):** US-04 = **8 SP** (Could, promovido a Must na sprint seguinte)

---

## 6. Requisitos de Dados

| Dataset | Fonte | Status | Acao necessaria | Impacto em bundle |
|---------|-------|--------|-----------------|-------------------|
| MATURITY_DETAIL | App.tsx | Ja embarcado | Nenhuma | 0 |
| globalFracs / legacyFracs | scripts/output/site_product_map.ts (293KB) | Disponivel, nao embarcado | Importar no App.tsx com estrutura compacta | +132KB (aceitavel) |
| Capabilities N4 por site+dominio+gate | docs/OneMES Readiness Consolidated.xlsx | Disponivel em Excel, sem dataset TS | Gerar via Python script; validar mapeamento N4-to-gate | Estimativa: 200-400KB dependendo de compactacao |

### Contrato de dados para globalFracs/legacyFracs

Estrutura esperada (por site, por dominio):
```
{
  globalFracs: { L1: {pass, total}, L2: {pass, total}, L3: {pass, total}, L4: {pass, total} },
  legacyFracs: { L1: {pass, total}, L2: {pass, total}, L3: {pass, total}, L4: {pass, total} }
}
```

**Validacao critica:** `globalFracs[Lx].pass + legacyFracs[Lx].pass` deve ser consistente com `MATURITY_DETAIL[site][domain][Lx].frac`. Se houver divergencia, MATURITY_DETAIL e a fonte de verdade para o total, e G/L sao proporcionais.

---

## 7. Definition of Done

- [ ] Barras de progresso L1-L4 renderizam corretamente para todos os 163 sites e 9 dominios
- [ ] Separacao G/L visivel e tooltips com valores exatos
- [ ] Nenhuma divergencia numerica entre barras e scores do CapabilitySiteDetail existente
- [ ] Threshold markers (60/75/85/90%) visiveis nas barras
- [ ] Expansao/colapso funciona sem erro em Chrome, Edge (navegadores corporativos)
- [ ] Componente testado com dados reais (nao mocks) de pelo menos 10 sites de diferentes zonas
- [ ] Nenhuma regressao em funcionalidades existentes do CapabilitySiteDetail
- [ ] Bundle size total do dashboard permanece abaixo de 3MB (verificar com build de producao)

---

## 8. Riscos e Mitigacoes

| # | Risco | Probabilidade | Impacto | Mitigacao |
|---|-------|--------------|---------|-----------|
| R1 | **Divergencia numerica entre MATURITY_DETAIL e globalFracs/legacyFracs** -- se as fontes nao batem, o usuario perde confianca no dashboard | Media | Alto | Implementar validacao automatica no build: sum(G+L) deve igualar total do MATURITY_DETAIL. Se divergir, usar MATURITY_DETAIL como verdade e distribuir G/L proporcionalmente. |
| R2 | **Performance do modal com 9 dominios expandiveis** -- cada expansao renderiza 4 barras segmentadas | Baixa | Medio | Limitar a 1 dominio expandido por vez (ja previsto em US-01 AC4). Lazy render do conteudo expandido. |
| R3 | **Dataset de N4 capabilities (v2) e muito grande** -- 160 N4s x 150 sites x 9 dominios = potencialmente 200K+ registros | Alta | Alto | Gerar dataset apenas com N4s do "proximo gate" por site+dominio (reduz a ~10% do volume total). Compactar com codificacao de IDs. Avaliar lazy loading por site. |
| R4 | **Mudanca no Excel fonte (OneMES Readiness Consolidated)** entre MVP e v2 invalida o pipeline Python | Media | Medio | Definir schema esperado do Excel e validar no script de geracao. Alertar se colunas esperadas nao existirem. |
| R5 | **Escopo creep: stakeholders pedem filtros adicionais (por produto, por capability type)** | Alta | Medio | Escopo esta fixo para MVP: barras + G/L + gate indicator. Qualquer filtro adicional vai para backlog pos-v2. Comunicar escopo fechado antes do inicio da sprint. |

---

## 9. Decisoes Descartadas (e por que)

| Opcao descartada | Motivo |
|------------------|--------|
| Novo modal/drawer para detalhe de dominio (D1-b) | Profundidade de navegacao desnecessaria. Dois niveis de modal e anti-pattern. |
| Inline na SiteTable (D1-c) | A SiteTable ja e densa. Adicionar barras de progresso por dominio inline tornaria a tabela ilegivel. O modal ja existe como container apropriado. |
| Apenas MATURITY_DETAIL sem G/L (D2-a) | Entrega apenas 60% do valor. A separacao G/L e o insight estrategico mais pedido pelo VP de Zona. O custo de 132KB e justificado. |
| Todas as capabilities de todos os gates (D3-b/c) | Sobrecarga cognitiva. 160 N4s por dominio nao e acionavel. O framing "proximo gate" foca a atencao no que importa. |
| Full feature em uma unica sprint (D4-b) | Risco alto por dependencia do pipeline Python para N4s. Separar em MVP + v2 isola riscos e permite validar a interacao antes de investir em dados granulares. |
