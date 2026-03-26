# Coverage Assessment Dashboard

Dashboard interativo de acompanhamento de maturidade de produtos digitais por site, zona e domínio.

---

## Visão Geral

O dashboard exibe o funil de maturidade L0–L4 para 163 sites distribuídos em 6 zonas (AFR, SAZ, MAZ, NAZ, EUR, APAC) e 10 domínios de produto. Os dados vêm de um CSV embutido no bundle e de um mapeamento inline de tipos Global/Legado por site+domínio extraído da planilha `Coverage.xlsx`.

---

## Tech Stack

| Camada | Tecnologia |
|---|---|
| UI | React 18 + TypeScript |
| Build | Vite 7 |
| Estilo | Tailwind CSS v3 |
| Servidor dev | Express (apenas desenvolvimento) |
| Export XLSX | SheetJS via CDN (carregado on-demand) |
| Export PDF | html2pdf.js via CDN (carregado on-demand) |

---

## Estrutura de Arquivos

```
coverage-dashboard/
├── client/
│   └── src/
│       ├── App.tsx          # Aplicação completa (componente único, ~1200 linhas)
│       ├── index.css        # Tailwind base + scrollbar customizado
│       └── main.tsx         # Ponto de entrada React
├── dist/
│   └── public/              # Build de produção (gerado por npm run build)
│       ├── index.html
│       └── assets/
│           ├── index-*.css
│           └── index-*.js
├── script/
│   └── build.ts             # Script de build (client + server)
├── server/
│   └── index.ts             # Servidor Express (dev)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

---

## Dependências

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "express": "^4.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^7.x",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^3.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x",
    "tsx": "^4.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "@types/node": "^20.x",
    "@types/express": "^4.x"
  }
}
```

CDNs carregados on-demand (sem instalação):
- `https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js` — SheetJS para export XLSX
- `https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js` — html2pdf.js para export PDF

---

## Instalação e Execução

```bash
# Instalar dependências
npm install

# Desenvolvimento (porta 5000)
npm run dev

# Build de produção
npm run build

# Os arquivos estáticos ficam em dist/public/
# Sirva dist/public/ com qualquer servidor HTTP estático
```

---

## Modelo de Dados

### Sites e Métricas (CSV_DATA em App.tsx)

163 sites com os campos:

| Campo | Tipo | Descrição |
|---|---|---|
| `site` | string | Nome do site |
| `zone` | string | Zona (AFR, SAZ, MAZ, NAZ, EUR, APAC) |
| `volume` | number | Volume em HL/ano |
| `BP` | 0–4 | Score Brewing Performance |
| `DA` | 0–4 | Score Data Acquisition |
| `MT` | 0–4 | Score Maintenance |
| `MG` | 0–4 | Score Management |
| `MDM` | 0–4 | Score MasterData Management |
| `PP` | 0–4 | Score Packaging Performance |
| `QL` | 0–4 | Score Quality |
| `SF` | 0–4 | Score Safety |

O score de cada site é calculado como a média dos scores de domínio ativos.

### Mapeamento Global/Legado por Site+Domínio (SITE_DOMAIN_TYPE)

Constante inline em App.tsx com tipo `Record<string, Record<string, string>>`.

**Fonte:** planilha `Coverage global and legacy` do arquivo `Coverage.xlsx`, coluna `GlobalxLegacy`, filtrado por `Live? = Yes`.

**Estrutura:**
```typescript
const SITE_DOMAIN_TYPE: Record<string, Record<string, string>> = {
  "NomeDo Site": {
    "BP": "G",   // Global
    "DA": "L",   // Legado (Legacy)
    "MDM": "G",
    // domínios sem produto ativo são omitidos
  },
  // ... 246 sites no total
}
```

**Valores possíveis:**
- `"G"` — produto Global ativo neste site+domínio
- `"L"` — produto Legado (Legacy) ativo neste site+domínio
- chave ausente — sem produto ativo neste domínio para este site

**Helper de acesso:**
```typescript
function getSiteDomainType(siteName: string, domainShort: string): string | null {
  return SITE_DOMAIN_TYPE[siteName]?.[domainShort] ?? null;
}
// Retorna "G", "L" ou null
```

### Funil de Maturidade L0–L4

| Nível | Score | Significado |
|---|---|---|
| L0 | 0 | Sem mínimo do L1 (base 100%) |
| L1 | 1 | Fundação mínima implantada |
| L2 | 2 | Processo digital estruturado |
| L3 | 3 | Gestão avançada por dados |
| L4 | 4 | Excelência operacional digital |

O funil é **cumulativo e decrescente**: L0 = 100% dos sites, cada nível subsequente remove os sites que ficaram no nível anterior (exclusive). A barra de L1 mostra sites com score ≥ 1, L2 com score ≥ 2, etc.

**Tooltip (exclusivos por nível):** o tooltip exibido ao clicar numa barra mostra APENAS os sites exclusivos daquele nível — i.e., sites com score EXATAMENTE igual ao número do nível (não chegaram ao próximo). Isso permite identificar quais sites precisam de esforço para subir de nível.

### Grupos de Volume

| Grupo | Faixa | Descrição |
|---|---|---|
| G1 | < 2M HL | Sites de menor volume |
| G2 | 2–6M HL | Sites de volume médio |
| G3 | > 6M HL | Sites de maior volume |

Os filtros G1/G2/G3 na sidebar selecionam sites por faixa e exibem a contagem de sites em cada grupo. São cumulativos (multi-seleção).

---

## Funcionalidades

### Três Visões

1. **Por Zona** — funil L0–L4 para Total Global + 6 zonas (tabs)
2. **Por Domínio** — funil L0–L4 para cada um dos 10 domínios (tabs)
3. **Por Site** — tabela detalhada com ScoreDot por domínio, ordenável por zona/volume/nome

### Sidebar

- **Filtros de Volume (G1/G2/G3):** multi-seleção, sem seleção = todos os sites
- **Tech Glide Path:** legenda compacta dos níveis L0–L4 com cor e descrição

### Tooltip de Sites (click-only)

- Abre ao **clicar** na barra do funil (não hover)
- Fecha ao clicar fora ou no botão ×
- Mostra somente sites **exclusivos** do nível clicado
- Paginação integrada (10 sites por página) — navegação dentro do tooltip
- Posicionamento via `getBoundingClientRect()` com `position: fixed` — sem uso de `scrollY`, garantindo posição correta mesmo em cards inferiores
- Renderizado via `ReactDOM.createPortal` em `document.body` para evitar clipping por overflow

### Indicadores Global/Legado

- **ScoreDot na tabela Por Site:** anel azul = produto Global ativo, anel cinza = produto Legado ativo, sem anel = sem produto
- **Badge no header do card:** porcentagem de sites com produto Global ativo naquela visão
- **Lógica:** baseada em `SITE_DOMAIN_TYPE`, por site+domínio individualmente — cada site pode ter mix de Global e Legado em domínios diferentes

### Outros

- **Tema escuro/claro:** toggle no header, persiste via `document.documentElement.classList`
- **Idioma PT/EN:** toggle no header, troca toda a UI via objeto `TRANSLATIONS`
- **Export XLSX:** 3 abas — Sites (raw), Resumo por Zona, Resumo por Domínio
- **Export PDF:** captura o dashboard visível

---

## Paleta de Cores

| Elemento | Cor |
|---|---|
| L0 | `#D1D5DB` (cinza claro) |
| L1 | `#FFE066` (amarelo) |
| L2 | `#FFC000` (âmbar) |
| L3 | `#F59E0B` (laranja âmbar) |
| L4 | `#10B981` (verde esmeralda) |
| AFR | `#D97706` |
| SAZ | `#059669` |
| MAZ | `#2563EB` |
| NAZ | `#7C3AED` |
| EUR | `#DB2777` |
| APAC | `#EA580C` |
| Global ring | `ring-blue-400` (Tailwind) |
| Legacy ring | `ring-gray-400` (Tailwind) |

---

## Decisões de Arquitetura

### Por que tudo em App.tsx?

O componente único (`App.tsx`, ~1200 linhas) foi uma escolha deliberada para facilitar iteração rápida. Todos os dados, constantes, helpers, componentes e lógica de estado ficam num só arquivo. Para projetos maiores, recomenda-se separar em:

```
src/
├── data/
│   ├── csvData.ts        # CSV_DATA + parse
│   └── siteTypes.ts      # SITE_DOMAIN_TYPE + getSiteDomainType
├── components/
│   ├── FunnelCard.tsx
│   ├── ScoreDot.tsx
│   ├── SiteTooltip.tsx
│   └── SiteTable.tsx
├── hooks/
│   └── useFilters.ts
└── i18n/
    └── translations.ts
```

### SITE_DOMAIN_TYPE inline

O mapeamento Global/Legado (16KB, 246 sites) está embutido diretamente em App.tsx como constante TypeScript. Isso elimina qualquer fetch de arquivo externo e garante que o bundle estático seja auto-contido (deploy em S3/CDN sem backend).

### Tooltip com Portal + getBoundingClientRect

O tooltip usa `ReactDOM.createPortal(content, document.body)` com `position: fixed`. O posicionamento usa exclusivamente `getBoundingClientRect()` — **nunca** adicionar `window.scrollY`, pois `fixed` é relativo ao viewport, não ao documento.

```typescript
const rect = triggerRef.current.getBoundingClientRect();
// Posição final: rect.top + rect.height (abaixo da barra) ou acima se perto do fundo
setTooltipPos({ top: rect.bottom + 8, left: rect.left });
```

---

## Como Atualizar os Dados

### Atualizar sites (CSV_DATA)

1. Abra `client/src/App.tsx`
2. Localize a constante `CSV_DATA` (string CSV com cabeçalho)
3. Substitua o conteúdo pelo novo CSV exportado da planilha
4. Execute `npm run build`

### Atualizar mapeamento Global/Legado (SITE_DOMAIN_TYPE)

1. Exporte a planilha `Coverage global and legacy` do `Coverage.xlsx`
2. Filtre por `Live? = Yes`
3. Para cada linha, mapeie `SiteName → DomainShort → GlobalxLegacy` (`G` ou `L`)
4. Gere o JSON no formato `Record<string, Record<string, string>>`
5. Substitua a constante `SITE_DOMAIN_TYPE` em `App.tsx`
6. Execute `npm run build`

Script Python de referência para extração:

```python
import pandas as pd, json

df = pd.read_excel("Coverage.xlsx", sheet_name="Coverage global and legacy")
df = df[df["Live?"] == "Yes"]

result = {}
for _, row in df.iterrows():
    site = str(row["Site"]).strip()
    domain = str(row["DomainShort"]).strip()  # ajuste o nome da coluna se necessário
    gl = str(row["GlobalxLegacy"]).strip()    # "G" ou "L"
    if site not in result:
        result[site] = {}
    result[site][domain] = gl

print(json.dumps(result, ensure_ascii=False, indent=2))
```

---

## Deploy

```bash
npm run build
# Faça upload de dist/public/ para qualquer CDN ou S3 bucket
# Entry point: index.html
```

O build gera apenas 3 arquivos estáticos:
- `dist/public/index.html`
- `dist/public/assets/index-*.css`
- `dist/public/assets/index-*.js`

---

## Variáveis de Ambiente

Nenhuma variável de ambiente é necessária. O dashboard é 100% client-side com dados embutidos no bundle.

---

*Gerado com [Perplexity Computer](https://www.perplexity.ai/computer)*
