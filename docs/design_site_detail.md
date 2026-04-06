# Design Spec: Site + Domain Detail View (Capability Drill-Down)

**Date:** 2026-04-05
**Author:** UX/UI Designer (Coverage Dashboard)
**Status:** Ready for dev handoff
**Audience Layer:** Estrategica (VPs regionais, Global Manufacturing IT) + Operacional (Diretores de planta)

---

## 1. Padrao de Interacao (Click Flow)

### Decisao: Expansao Inline dentro do CapabilitySiteDetail

Concordo com a proposta de expandir inline. Justificativa:
- Evita modal-sobre-modal (anti-pattern de profundidade cognitiva)
- Mantem contexto visual -- o usuario ve os outros dominios acima/abaixo
- O CapabilitySiteDetail ja e um painel/card (nao um modal full-screen), entao expandir um dominio nao quebra hierarquia

### Fluxo Completo

```
SiteMatrix table
  |
  v  [click row]
CapabilitySiteDetail card (aparece acima da tabela)
  |
  |  Mostra: header do site + lista de dominios com barras L1-L4
  |  (componente existente, linhas 7422-7528)
  |
  v  [click no dominio card -- area inteira clicavel]
DomainExpansion inline
  |
  |  Anima: chevron rota 90->0, conteudo slide-down
  |  Mostra: barras de progresso detalhadas + lista de capabilities
  |
  v  [click novamente ou click em outro dominio]
Colapsa e restaura estado anterior
```

### Interacao Detalhada

1. **Cursor:** `cursor-pointer` no dominio row inteiro (ja tem hover state)
2. **Indicador de expansao:** chevron `>` a direita do badge de tipo (G/L), rotaciona para `v` ao expandir
3. **Comportamento accordion:** ao expandir um dominio, o anteriormente aberto colapsa (single-expand para manter viewport controlada)
4. **Scroll-into-view:** apos expandir, `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` para garantir visibilidade
5. **Keyboard:** Enter/Space para toggle, Escape para colapsar

### State necessario no CapabilitySiteDetail

```typescript
const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
```

---

## 2. Layout das Barras de Progresso

### 2A. Contexto atual vs. proposta

O CapabilitySiteDetail **ja tem barras L1-L4 por dominio** (linhas 7470-7522). A proposta nao duplica essas barras, mas as **aprimora** dentro da expansao com:
- Separacao Global vs Legacy quando ambos existem
- Threshold marker mais proeminente
- Contagem absoluta (ex: "14/18 N4s")

### 2B. ASCII Mockup -- Dominio Expandido (caso Global + Legacy)

```
+---------------------------------------------------------------------------+
| BP   Brewing Performance              [L2] [G]  [L]           v          |
+---------------------------------------------------------------------------+
|                                                                           |
|  GLOBAL (G)                                                               |
|  +----- L1 ------+                                                        |
|  | label  bar                          threshold     pct   count  status  |
|  |  L1    [========|====--------|-----]   |60%       72%   13/18    V     |
|  |  L2    [==========|===-------|-----]   |75%       68%   12/18    X     |
|  |  L3    [===|====----------|--------]   |85%       45%    8/18    X     |
|  |  L4    [    vacuous / n.a.         ]   |90%        --    0/0    --     |
|  +-----------------------------------------                               |
|                                                                           |
|  LEGACY (L)                                                               |
|  +----- L1 ------+                                                        |
|  |  L1    [==============|=---|-------]   |60%       82%   15/18    V     |
|  |  L2    [================|==|-------]   |75%       92%   17/18    V     |
|  |  L3    [===============|==-|-------]   |85%       88%   16/18    V     |
|  |  L4    [===========|====---|-------]   |90%       76%   14/18    X     |
|  +-----------------------------------------                               |
|                                                                           |
|  [--- Capabilities N4 list below ---]                                     |
+---------------------------------------------------------------------------+
```

### 2C. ASCII Mockup -- Dominio Expandido (caso tipo unico -- so Global OU so Legacy)

```
+---------------------------------------------------------------------------+
| DA   Data Acquisition                 [L3] [G]                 v          |
+---------------------------------------------------------------------------+
|                                                                           |
|  +------ Progress Bars (single product) --------------------------------+ |
|  |                                                                      | |
|  |  L1  [#########################|##.............] |60%   82%  15/18 V  | |
|  |  L2  [##############################|.........] |75%   92%  17/18 V  | |
|  |  L3  [############################|#..........] |85%   88%  16/18 V  | |
|  |  L4  [####################|##.................] |90%   76%  14/18 X  | |
|  |                                                                      | |
|  +----------------------------------------------------------------------+ |
|                                                                           |
|  [--- Capabilities N4 list below ---]                                     |
+---------------------------------------------------------------------------+
```

### 2D. Detalhamento Visual da Barra Individual

```
Anatomia de uma barra:

 L2  [===============|====----|--------------------]  75%   68%  12/18  X
 ^    ^               ^       ^                        ^     ^    ^     ^
 |    |               |       |                        |     |    |     |
 |    filled area     |       gate marker              |     |    |     pass/fail
 |    (cor do level)  |       (vertical dashed line)   |     |    |
 |                    |                                |     |    count (covered/total)
 label               current frac position            gate   pct
```

### 2E. Especificacao Visual das Barras

**Container da barra:**
- Altura: `h-5` (20px) -- levemente maior que as atuais `h-4` para acomodar threshold marker
- Border radius: `rounded`
- Background: track vazio

**Fill da barra:**
- Cor baseada no LEVEL, nao no pass/fail (diferente do padrao atual):
  - L1: `#FFE066` (yellow)
  - L2: `#FFC000` (amber)
  - L3: `#F59E0B` (amber dark)
  - L4: `#10B981` (emerald)
- Width: `width: ${Math.round(frac * 100)}%`
- Transicao: `transition-all duration-300 ease-out`

**Threshold marker:**
- Posicao: `left: ${gate * 100}%` via style absoluto
- Visual: linha vertical `w-0.5 h-full` com cor `bg-white/60` (dark) ou `bg-gray-900/30` (light)
- Dashed pattern: `border-l-2 border-dashed` ao inves de solid para distinguir de bordas

**Label do gate:**
- Posicao: acima da barra, alinhado com threshold marker
- Texto: `60%` / `75%` / `85%` / `90%`
- Classe: `text-[9px] font-medium opacity-60`
- Aparece apenas na PRIMEIRA barra (L1) como header; nas demais, so a linha vertical

**Percentual a direita:**
- `text-xs font-mono font-bold`
- Cor: emerald se pass, red se fail, gray se vacuous
- Format: `72%`

**Contagem N4:**
- `text-[10px] font-mono`
- Cor: `text-gray-400` (dark) / `text-gray-500` (light)
- Format: `14/18`
- Aparece entre o percentual e o check/X

**Pass/Fail icon:**
- Pass: `text-emerald-500` + V (check mark)
- Fail: `text-red-400` + X
- Vacuous: `text-gray-400` + `--`

### 2F. Secao de Tipo (Global vs Legacy)

Quando o dominio tem ambos G e L:

**Section header:**
```
GLOBAL                                    LEGACY
[ring-blue-400 dot] text-xs font-bold     [ring-gray-400 dot] text-xs font-bold
```

**Layout:**
- Duas colunas `grid grid-cols-2 gap-4` em desktop (>= 768px)
- Stack vertical `grid grid-cols-1 gap-3` em mobile (< 768px)

**Borda de separacao:**
- Global section: `border-l-2 border-blue-400 pl-3`
- Legacy section: `border-l-2 border-gray-400 pl-3`

---

## 3. Layout da Lista de Capabilities (N4s)

### 3A. Modelo de Dados Necessario

O modelo atual (`MaturityDetailDomain`) nao contem capabilities individuais -- apenas `frac` agregada por level. A feature precisa de um novo campo:

```typescript
interface N4Capability {
  id: string;                          // ex: "BP-L2-003"
  name: string;                        // ex: "Batch Tracking Integration"
  subarea?: string;                    // ex: "Process Control"
  level: 'L1' | 'L2' | 'L3' | 'L4';  // gate a que pertence
  covered: boolean;                    // true = atendida, false = pendente
  weight: number;                      // Funcional=2.0, Operacional=1.0, Admin=0.5
  product?: 'G' | 'L';                // qual produto cobre (quando ambos existem)
}

// Extensao do dominio
interface MaturityDetailDomainExtended extends MaturityDetailDomain {
  capabilities?: N4Capability[];       // opcional para backward compat
}
```

**Nota para o dev:** ate que a API/JSON fornecea capabilities, mostrar empty state: "Detalhamento de capabilities nao disponivel para este dominio. Contate o administrador."

### 3B. Agrupamento: Por Gate (L1/L2/L3/L4), com Collapsible

A decisao e agrupar por gate (nao por subarea) porque:
1. O mental model do usuario ja esta em L1/L2/L3/L4 (vem das barras acima)
2. A pergunta natural e "o que falta para passar L2?" -- gate-first responde isso diretamente
3. Subareas podem ter nomes longos e inconsistentes entre dominios

### 3C. ASCII Mockup -- Lista de Capabilities

```
+-----------------------------------------------------------------------+
| CAPABILITIES N4                                        [V Atendidas]  |
|                                              [toggle: All / Pending]  |
+-----------------------------------------------------------------------+
|                                                                       |
| v L1 -- 60% gate                              13/18 covered   [72%]  |
| +-------------------------------------------------------------------+ |
| | V  BP-L1-001  Batch Record Management          Funcional    2.0   | |
| | V  BP-L1-002  Equipment Status Monitoring       Operacional 1.0   | |
| | V  BP-L1-003  Basic Recipe Download             Funcional    2.0   | |
| | X  BP-L1-004  Alarm Configuration               Operacional 1.0   | |
| | X  BP-L1-005  Manual Data Entry Interface        Admin       0.5   | |
| | ...                                                                | |
| +-------------------------------------------------------------------+ |
|                                                                       |
| > L2 -- 75% gate                               8/12 covered   [67%]  |
|   (collapsed -- click to expand)                                      |
|                                                                       |
| > L3 -- 85% gate                               3/10 covered   [30%]  |
|   (collapsed -- click to expand)                                      |
|                                                                       |
| > L4 -- 90% gate                                0/0  vacuous    --   |
|   (collapsed -- grayed out)                                           |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 3D. "Next Gate" Highlight

O gate mais critico e o PROXIMO gate nao passado (ex: se o dominio esta em L1, o next gate e L2). Este gate recebe tratamento especial:

```
+-----------------------------------------------------------------------+
| * L2 -- 75% gate  (NEXT GATE)                  8/12 covered   [67%]  |
| +-------------------------------------------------------------------+ |
| |     Faltam 4 capabilities para atingir L2 (gap: 8%)               | |
| |                                                                    | |
| | PENDENTES (prioridade):                                            | |
| | X  BP-L2-009  Real-time Quality Parameters    Funcional  2.0  [!] | |
| | X  BP-L2-010  Automated Batch Release          Funcional  2.0  [!] | |
| | X  BP-L2-011  Shift Handover Digital           Oper.     1.0      | |
| | X  BP-L2-012  Report Scheduling                Admin     0.5      | |
| |                                                                    | |
| | ATENDIDAS:                                                         | |
| | V  BP-L2-001  Production Order Mgmt            Funcional  2.0     | |
| | V  BP-L2-002  Material Consumption Track        Funcional  2.0     | |
| | ...                                                                | |
| +-------------------------------------------------------------------+ |
```

**Visual do next gate:**
- Border: `border-l-4 border-amber-400` (destaque amarelo ambar)
- Background: `bg-amber-50/50` (light) ou `bg-amber-900/10` (dark)
- Badge "NEXT GATE": `bg-amber-400 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full`
- Callout de gap: `text-xs text-amber-600` (light) / `text-amber-400` (dark)
- Auto-expand: este gate inicia expandido; os demais colapsados

**Capabilities pendentes dentro do next gate:**
- Ordenadas por peso descendente (Funcional > Operacional > Admin)
- Badge de prioridade `[!]` para peso >= 2.0: `text-red-500 font-bold`

### 3E. Treatment Visual de Cada Capability Row

```
Atendida:
+--+---------------------------+-------------+-----+
| V | Nome da capability       | Tipo        | Peso|
+--+---------------------------+-------------+-----+
  ^   ^                          ^              ^
  |   text-sm font-medium        text-[10px]    text-[10px] font-mono
  |   text-gray-200 (dark)       text-gray-400  text-gray-500
  text-emerald-500
  bg-emerald-500/10 (row bg tint sutil)

Pendente:
+--+---------------------------+-------------+-----+
| X | Nome da capability       | Tipo        | Peso|
+--+---------------------------+-------------+-----+
  ^   text-sm font-medium
  |   text-gray-200 (dark)
  text-red-400
  bg-red-500/5 (row bg tint sutil)
```

### 3F. Filtro Toggle

No header da secao de capabilities:
- `[All]` / `[Pending only]` toggle
- Implementacao: duas pill buttons
- Default: All (mostra covered + pending)
- Quando "Pending only": esconde capabilities com `covered: true`

```typescript
const [capFilter, setCapFilter] = useState<'all' | 'pending'>('all');
```

Classes do toggle:
- Active: `bg-yellow-400 text-gray-900 font-bold`
- Inactive: dark ? `bg-gray-700 text-gray-400` : `bg-gray-100 text-gray-500`
- Container: `flex gap-1 text-xs rounded-lg overflow-hidden`

---

## 4. Estados

### 4A. Loading

Quando capabilities estao sendo carregadas (fetch assincrono futuro):

```
+-----------------------------------------------------------------------+
| BP   Brewing Performance              [L2] [G]                v       |
+-----------------------------------------------------------------------+
|                                                                       |
|  [skeleton bar L1]  ████████░░░░░░░░░░░░░░░  -----                   |
|  [skeleton bar L2]  ██████░░░░░░░░░░░░░░░░░  -----                   |
|  [skeleton bar L3]  ████░░░░░░░░░░░░░░░░░░░  -----                   |
|  [skeleton bar L4]  ██░░░░░░░░░░░░░░░░░░░░░  -----                   |
|                                                                       |
|  [pulse animation]  Carregando capabilities...                        |
|                                                                       |
+-----------------------------------------------------------------------+
```

Skeleton classes:
- Track: `h-5 rounded animate-pulse` + (dark ? `bg-gray-700` : `bg-gray-200`)
- Texto: `text-xs animate-pulse` + sub

### 4B. Empty State (Sem dados de capabilities)

```
+-----------------------------------------------------------------------+
| BP   Brewing Performance              [L2] [G]                v       |
+-----------------------------------------------------------------------+
|                                                                       |
|  [barras de progresso normais -- frac data existe]                    |
|                                                                       |
|  +---------------------------------------------------------------+   |
|  |  (icone documento vazio)                                      |   |
|  |  Detalhamento de capabilities N4 nao disponivel               |   |
|  |  para este dominio.                                           |   |
|  |                                                               |   |
|  |  As barras de progresso acima representam a fracao            |   |
|  |  ponderada agregada. O detalhamento individual sera           |   |
|  |  carregado do OneMES Readiness.                               |   |
|  +---------------------------------------------------------------+   |
|                                                                       |
+-----------------------------------------------------------------------+
```

Classes do empty state container:
- `rounded-lg border border-dashed p-6 text-center`
- dark: `border-gray-600 bg-gray-800/50`
- light: `border-gray-300 bg-gray-50`
- Texto principal: `text-sm font-medium` + (dark ? `text-gray-300` : `text-gray-600`)
- Texto secundario: `text-xs mt-1` + sub

### 4C. Collapsed (estado padrao do dominio)

Exatamente o layout atual do CapabilitySiteDetail -- nenhuma mudanca visual. Apenas adicionar o chevron indicator:

```
| BP   Brewing Performance   [L2] [G]   >  |
|  L1 [=========|==---] 72%  V             |
|  L2 [======|====----] 68%  X             |
|  L3 [===|==========] 45%   X             |
|  L4 [  vacuous     ]  --  --             |
```

O chevron `>` (colapsado) muda para `v` (expandido).

### 4D. Expanded (apos click)

Layout completo com barras Global/Legacy + capabilities conforme secoes 2 e 3 acima.

Transicao:
- `max-height` animation com `overflow-hidden`
- Duracao: `duration-200 ease-out`
- Chevron: `transform rotate-0` -> `rotate-90` com `transition-transform duration-200`

### 4E. Vacuous Level

Quando um level e vacuous (sem capabilities mapeadas nesse gate):

```
|  L4  [===================== n/a ====================]   --   0/0   -- |
```

- Barra inteira em gray: `bg-gray-300` (light) / `bg-gray-600` (dark)
- Texto: "n/a" centralizado na barra
- Sem threshold marker
- Count: `0/0`

### 4F. Dominio Inativo (sem produto ativo)

Mantido como no design atual -- row com opacity 30% e texto "Sem produto ativo":

```
| SF   Safety                           --   --     >  |  (opacity-30)
```

Chevron nao aparece. Row nao e clicavel. `cursor-default`.

---

## 5. Responsividade

### Breakpoints

| Viewport        | Largura       | Comportamento                                    |
|-----------------|---------------|--------------------------------------------------|
| Desktop large   | >= 1440px     | Barras G/L lado a lado (`grid-cols-2`)           |
| Desktop         | >= 1024px     | Barras G/L lado a lado (`grid-cols-2`)           |
| Tablet          | 768 - 1023px  | Barras G/L empilhadas (`grid-cols-1`)            |
| Mobile          | < 768px       | Barras G/L empilhadas, caps list compacta        |

### Adaptacoes Mobile

1. **Barras de progresso:** mantidas em full width, mas labels encurtadas:
   - `L1` ao inves de `Level 1`
   - Gate label (`60%`) removido -- so a linha vertical permanece
   - Count (`14/18`) movido para baixo da barra ao inves de inline

2. **Lista de capabilities:**
   - Nome truncado com `truncate` e `title` tooltip
   - Tipo (Funcional/Operacional/Admin) vira badge abreviado: `F` / `O` / `A`
   - Peso removido (visivel apenas em tooltip)

3. **Scroll:** secao de capabilities com `max-h-[300px] overflow-y-auto` em mobile para nao empurrar outros dominios para longe

### Classe Condicional Exemplo

```typescript
// Container das barras G/L
const gridClass = 'grid gap-4 ' + (hasGlobalAndLegacy ? 'md:grid-cols-2 grid-cols-1' : 'grid-cols-1');
```

---

## 6. Especificacao de Tailwind Classes

### 6A. Domain Row (Clicavel para Expandir)

```typescript
// Wrapper do dominio (substitui o div atual da linha 7459)
const domainRowClasses = [
  'border-b pb-3 cursor-pointer transition-all',
  'hover:bg-gray-50 dark:hover:bg-gray-700/30',
  dark ? 'border-gray-700' : 'border-gray-100',
].join(' ');

// Chevron de expansao
const chevronClasses = [
  'w-4 h-4 transition-transform duration-200 flex-shrink-0',
  dark ? 'text-gray-500' : 'text-gray-400',
  expandedDomain === dom ? 'rotate-90' : '',
].join(' ');
```

### 6B. Expansion Container

```typescript
const expansionClasses = [
  'overflow-hidden transition-all duration-200 ease-out',
  expandedDomain === dom ? 'max-h-[2000px] opacity-100 mt-3' : 'max-h-0 opacity-0',
].join(' ');
```

### 6C. Progress Bar Track

```typescript
const trackClasses = 'flex-1 relative h-5 rounded overflow-hidden';
const trackBg = dark ? 'bg-gray-700' : 'bg-gray-200';
```

### 6D. Progress Bar Fill

```typescript
const fillStyle = {
  width: `${Math.round(frac * 100)}%`,
  backgroundColor: LEVEL_COLORS[level], // '#FFE066' | '#FFC000' | '#F59E0B' | '#10B981'
};
const fillClasses = 'h-full rounded transition-all duration-300 ease-out';
```

### 6E. Threshold Marker

```typescript
const markerStyle = { left: `${gate * 100}%` };
const markerClasses = [
  'absolute top-0 h-full w-0.5',
  dark ? 'bg-white/40' : 'bg-gray-900/30',
  'border-l border-dashed',
  dark ? 'border-white/20' : 'border-gray-900/15',
].join(' ');
```

### 6F. Type Section Header (Global / Legacy)

```typescript
const typeSectionClasses = (type: 'G' | 'L') => [
  'pl-3 border-l-2',
  type === 'G' ? 'border-blue-400' : 'border-gray-400',
].join(' ');

const typeLabelClasses = (type: 'G' | 'L') => [
  'text-xs font-bold mb-2 flex items-center gap-1.5',
  type === 'G'
    ? (dark ? 'text-blue-300' : 'text-blue-600')
    : (dark ? 'text-gray-400' : 'text-gray-500'),
].join(' ');
```

### 6G. Capability Row

```typescript
const capRowClasses = (covered: boolean) => [
  'flex items-center gap-3 py-1.5 px-2 rounded text-sm',
  covered
    ? (dark ? 'bg-emerald-500/5' : 'bg-emerald-50/50')
    : (dark ? 'bg-red-500/5' : 'bg-red-50/30'),
].join(' ');

const capIconClasses = (covered: boolean) => [
  'text-xs font-bold flex-shrink-0 w-4 text-center',
  covered ? 'text-emerald-500' : 'text-red-400',
].join(' ');

const capNameClasses = [
  'flex-1 truncate',
  dark ? 'text-gray-200' : 'text-gray-700',
].join(' ');
```

### 6H. Next Gate Callout

```typescript
const nextGateClasses = [
  'border-l-4 border-amber-400 rounded-r-lg p-3 mb-2',
  dark ? 'bg-amber-900/10' : 'bg-amber-50/50',
].join(' ');

const nextGateBadge = 'bg-amber-400 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full';

const gapCallout = [
  'text-xs font-medium mt-1',
  dark ? 'text-amber-400' : 'text-amber-600',
].join(' ');
```

### 6I. Gate Section Header (Collapsible)

```typescript
const gateSectionHeader = (isNextGate: boolean) => [
  'flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer transition-colors',
  isNextGate
    ? (dark ? 'hover:bg-amber-900/20' : 'hover:bg-amber-50')
    : (dark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'),
].join(' ');
```

### 6J. Filter Toggle (All / Pending)

```typescript
const filterBtn = (active: boolean) => [
  'px-3 py-1 rounded-lg text-xs font-bold transition-all',
  active
    ? 'bg-yellow-400 text-gray-900'
    : (dark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'),
].join(' ');
```

---

## 7. Acessibilidade

### ARIA Attributes

```html
<!-- Domain row (accordion trigger) -->
<div
  role="button"
  tabIndex={0}
  aria-expanded={expandedDomain === dom}
  aria-controls={`domain-detail-${dom}`}
  aria-label={`${DOMAIN_FULL_NAMES[dom]}: Level ${d.score}, ${d.type === 'G' ? 'Global' : 'Legacy'}`}
  onKeyDown={handleKeyDown}
>

<!-- Expansion panel -->
<div
  id={`domain-detail-${dom}`}
  role="region"
  aria-labelledby={`domain-header-${dom}`}
  aria-hidden={expandedDomain !== dom}
>

<!-- Progress bar -->
<div
  role="progressbar"
  aria-valuenow={Math.round(frac * 100)}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label={`${level} progress: ${Math.round(frac * 100)}% of ${gate * 100}% gate`}
>

<!-- Capability item -->
<div
  role="listitem"
  aria-label={`${cap.name}: ${cap.covered ? 'covered' : 'pending'}, weight ${cap.weight}`}
>

<!-- Gate section (collapsible) -->
<div
  role="button"
  tabIndex={0}
  aria-expanded={gateExpanded}
  aria-controls={`gate-${level}-caps`}
>
```

### Keyboard Navigation

| Key           | Action                                                  |
|---------------|--------------------------------------------------------|
| Tab           | Move entre domain rows                                  |
| Enter / Space | Toggle expand/collapse do dominio focado                |
| Escape        | Colapsa dominio expandido, foco volta ao domain row     |
| Arrow Down    | Dentro de capabilities, move para proxima capability    |
| Arrow Up      | Dentro de capabilities, move para capability anterior   |

### Contraste

Todos os textos ja atendem WCAG AA (4.5:1 ratio minimo):

| Elemento                    | Light mode          | Dark mode           | Ratio  |
|----------------------------|--------------------|--------------------|--------|
| Texto principal no fill    | gray-700 on white  | gray-200 on gray-800 | > 7:1  |
| Percentual pass (emerald)  | emerald-600 on white | emerald-400 on gray-800 | > 4.5:1 |
| Percentual fail (red)      | red-600 on white   | red-400 on gray-800 | > 4.5:1 |
| Gate label (60%/75%...)    | gray-500 on gray-50 | gray-400 on gray-700 | > 4.5:1 |

### Area de Toque

- Domain row: full width, min-height `44px` (ja atendido pelo padding pb-3 + content)
- Gate section header: `py-2 px-2` = min 40px height. Adicionar `min-h-[44px]` explicitamente
- Filter toggle buttons: `px-3 py-1` = ~28px height. **Aumentar para `py-1.5`** = ~32px. Aceitavel em desktop; em mobile, adicionar `min-h-[44px]`

---

## 8. Notas para o Dev Frontend

### 8A. Dados

1. **Barras de progresso:** dados ja existem em `MaturityDetailDomain.levels[L1-L4].frac`. Nenhuma mudanca de data model necessaria para as barras.

2. **Capabilities list:** dados NAO existem no modelo atual. Opcoes:
   - **Curto prazo:** parse do XLSX (`OneMES Readiness Consolidated.xlsx`) via script Python para gerar JSON com capabilities individuais. Formato sugerido:
     ```json
     {
       "Accra": {
         "BP": {
           "G": [
             { "id": "BP-L1-001", "name": "Batch Record", "level": "L1", "covered": true, "weight": 2.0 }
           ]
         }
       }
     }
     ```
   - **Longo prazo:** endpoint API que retorna capabilities por site+dominio

3. **Ate ter capabilities:** mostrar empty state (secao 4B). As barras de progresso funcionam independentemente.

### 8B. State Management

```typescript
// Dentro de CapabilitySiteDetail:
const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
const [expandedGates, setExpandedGates] = useState<Set<string>>(new Set());
const [capFilter, setCapFilter] = useState<'all' | 'pending'>('all');

// Toggle dominio (accordion single-open)
const toggleDomain = (dom: string) => {
  setExpandedDomain(prev => prev === dom ? null : dom);
  setExpandedGates(new Set()); // reset gates ao trocar dominio
  setCapFilter('all');         // reset filter ao trocar dominio
};

// Toggle gate (multi-open dentro do dominio)
const toggleGate = (level: string) => {
  setExpandedGates(prev => {
    const next = new Set(prev);
    next.has(level) ? next.delete(level) : next.add(level);
    return next;
  });
};
```

### 8C. Auto-Expand Next Gate

```typescript
// Quando dominio expande, auto-expand o next failing gate
useEffect(() => {
  if (expandedDomain && site.domains[expandedDomain]) {
    const d = site.domains[expandedDomain];
    const nextFail = (['L1','L2','L3','L4'] as const).find(l => !d.levels[l].pass && !d.levels[l].vacuous);
    if (nextFail) {
      setExpandedGates(new Set([nextFail]));
    }
  }
}, [expandedDomain]);
```

### 8D. Performance

- A lista de capabilities pode ter 50+ itens por dominio. Nao virtualizar (volume insuficiente para justificar react-window). Usar `useMemo` para filtrar/agrupar.
- Transicao `max-height`: usar valor fixo alto (`max-h-[2000px]`) ao inves de calcular height exata -- mais simples e perceptualmente igual.

### 8E. Cuidados com o Overlay System Existente

- O CapabilitySiteDetail NAO e um overlay/modal -- e um card inline que aparece acima da tabela (linha 7815). A expansao de dominio acontece DENTRO desse card.
- Nenhuma alteracao no sistema de Portal/fixed positioning e necessaria.
- Se o card ficar muito alto com dominio expandido, considerar `max-h-[70vh] overflow-y-auto` no container do CapabilitySiteDetail.

### 8F. Paleta Consolidada (copiar direto)

```typescript
const LEVEL_COLORS: Record<string, string> = {
  L0: '#D1D5DB',
  L1: '#FFE066',
  L2: '#FFC000',
  L3: '#F59E0B',
  L4: '#10B981',
};

const LEVEL_GATES: Record<string, number> = {
  L1: 0.60,
  L2: 0.75,
  L3: 0.85,
  L4: 0.90,
};

// Bar track bg
const barTrackBg = (dark: boolean) => dark ? '#374151' : '#E5E7EB'; // gray-700 / gray-200

// Bar fill when pass
const barFillPass = (level: string) => LEVEL_COLORS[level];

// Bar fill when fail (still uses level color but with reduced opacity overlay)
const barFillFail = (level: string) => LEVEL_COLORS[level]; // same color, failure shown by X icon + red pct text

// Type colors
const TYPE_COLORS = {
  G: { border: 'border-blue-400', text: 'text-blue-600', bg: 'bg-blue-50', darkText: 'text-blue-300' },
  L: { border: 'border-gray-400', text: 'text-gray-500', bg: 'bg-gray-50', darkText: 'text-gray-400' },
};
```

### 8G. Arquivo de Referencia

Este design estende o componente `CapabilitySiteDetail` (linha 7315 de `App.tsx`). O dominio row a ser modificado esta nas linhas 7458-7524. Nao alterar a interface `CapabilitySiteDetailProps` -- adicionar o campo `capabilities` como opcional.

---

## 9. Resumo de Componentes Celebration DS Utilizados

| Componente DS       | Variante             | Estado                          | Uso neste design                       |
|---------------------|----------------------|---------------------------------|---------------------------------------|
| Progress Bar        | Segmented/Custom     | Active, Vacuous, Pass, Fail     | Barras L1-L4 por tipo G/L             |
| Accordion           | Single-open          | Collapsed, Expanded             | Dominio drill-down                     |
| Accordion (nested)  | Multi-open           | Collapsed, Expanded             | Gate sections dentro do dominio        |
| Tag/Badge           | Pill, Colored        | Default                         | Level badge, Type badge, Next Gate     |
| Button (Tertiary)   | Small, Toggle        | Active, Inactive                | Filter All/Pending                     |
| Alert (Warning)     | Inline, Callout      | Default                         | Next Gate gap callout                  |
| Tooltip             | Default              | Hover                           | Capability name truncado, gate label   |
| Loading/Skeleton    | Bar, Text            | Animating                       | Loading state                          |
| Empty State         | Illustration + Text  | Default                         | No capabilities data                   |

---

## 10. Token Mapping

| Token DS               | CSS var / Tailwind class                  | Valor                  |
|------------------------|-----------------------------------------|------------------------|
| spacing-xs             | `gap-1`, `py-0.5`                        | 4px                    |
| spacing-sm             | `gap-2`, `py-1.5`, `px-2`               | 8px                    |
| spacing-md             | `gap-3`, `p-3`                           | 12px                   |
| spacing-lg             | `gap-4`, `p-5`                           | 16-20px                |
| border-radius-sm       | `rounded`                                | 4px                    |
| border-radius-md       | `rounded-lg`                             | 8px                    |
| border-radius-lg       | `rounded-xl`                             | 12px                   |
| elevation-sm           | `shadow-sm`                              | 0 1px 2px              |
| font-size-xs           | `text-[10px]`                            | 10px                   |
| font-size-sm           | `text-xs`                                | 12px                   |
| font-size-base         | `text-sm`                                | 14px                   |
| font-weight-bold       | `font-bold`                              | 700                    |
| font-weight-black      | `font-black`                             | 900                    |
| feedback-success       | `text-emerald-500` / `#10B981`           | emerald-500            |
| feedback-error         | `text-red-400` / `#EF4444`              | red-400                |
| feedback-warning       | `text-amber-400` / `border-amber-400`   | amber-400              |
| neutral-bg-primary     | `bg-white` / `bg-gray-800`              | mode-dependent         |
| neutral-bg-secondary   | `bg-gray-50` / `bg-gray-900`            | mode-dependent         |
| neutral-border         | `border-gray-200` / `border-gray-700`   | mode-dependent         |
| motion-duration-fast   | `duration-200`                           | 200ms                  |
| motion-easing-out      | `ease-out`                               | cubic-bezier(0,0,.2,1) |
