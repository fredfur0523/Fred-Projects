# Coverage Assessment Dashboard — Guia para Cursor

> Este arquivo é o ponto de entrada para trabalhar neste projeto no Cursor.
> Leia do início ao fim antes de fazer qualquer alteração.

---

## 1. O que é este projeto

Dashboard React/TypeScript de acompanhamento de **maturidade de produtos digitais** por site, zona e domínio. Os dados vêm de um arquivo Excel (`Coverage.xlsx`) que foi pré-processado e embutido diretamente no bundle como constantes TypeScript — sem backend de dados, sem banco de dados.

**URL de produção:** https://www.perplexity.ai/computer/a/coverage-assessment-dashboard-nWap03zKRXK0s6L7M8aPkw

---

## 2. Pré-requisitos

| Ferramenta | Versão mínima | Instalação |
|---|---|---|
| Node.js | 20.x | https://nodejs.org |
| npm | 10.x | incluído com Node |
| Python | 3.9+ | https://python.org (só para scripts de dados) |
| pandas + openpyxl | — | `pip install pandas openpyxl` |

---

## 3. Setup inicial

```bash
# 1. Clone / copie o projeto para sua máquina
cd coverage-dashboard

# 2. Instale as dependências Node
npm install

# 3. Rode em modo desenvolvimento (porta 5000)
npm run dev
# Acesse: http://localhost:5000
```

Não há variáveis de ambiente necessárias. O projeto é 100% client-side com dados embutidos.

---

## 4. Estrutura de arquivos

```
coverage-dashboard/
│
├── CURSOR.md                    ← você está aqui
├── .cursorrules                 ← contexto para o AI do Cursor
├── README.md                    ← documentação técnica completa
│
├── client/
│   ├── index.html               ← HTML root, importa fontes Google
│   └── src/
│       ├── App.tsx              ← TODA a aplicação (componente único, ~1200 linhas)
│       ├── index.css            ← Tailwind base + scrollbar customizado
│       └── main.tsx             ← ponto de entrada React (renderiza <App />)
│
├── server/
│   ├── index.ts                 ← servidor Express (usado só em dev)
│   ├── routes.ts                ← rotas API (vazio — sem API neste projeto)
│   ├── static.ts                ← serve dist/public/ em produção
│   └── vite.ts                  ← integração Vite dev server
│
├── shared/
│   └── schema.ts                ← schema Drizzle/Zod (não usado ativamente)
│
├── script/
│   └── build.ts                 ← build script (Vite client + esbuild server)
│
├── scripts/                     ← scripts Python para atualizar dados
│   ├── extract_site_types.py    ← extrai SITE_DOMAIN_TYPE do Excel
│   └── update_csv_data.py       ← extrai CSV_DATA do Excel
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── postcss.config.js
```

> **Nota:** a pasta `dist/` é gerada pelo `npm run build` e não deve ser editada manualmente.

---

## 5. Comandos disponíveis

```bash
npm run dev      # desenvolvimento com hot reload (porta 5000)
npm run build    # build de produção → dist/public/
npm run check    # type-check TypeScript
npm start        # serve o build de produção (após npm run build)
```

---

## 6. Arquitetura do App.tsx

Todo o código React está em um único arquivo (`client/src/App.tsx`, ~1200 linhas). Está organizado em seções marcadas por comentários `// ===`:

```
Linha 1    → imports React
Linha 7    → TRANSLATIONS        — strings PT/EN para i18n
Linha 126  → ZONE_COLORS         — paleta por zona (AFR, SAZ, MAZ, NAZ, EUR, APAC)
Linha 164  → SITE_DOMAIN_TYPE    — mapeamento Global/Legado por site+domínio (JSON inline, 246 sites)
Linha 166  → getSiteDomainType() — helper de acesso ao mapeamento
Linha 170  → CSV_DATA            — dados de 163 sites (string CSV inline)
Linha ~310 → LEVEL_COLORS        — paleta de cores L0–L4
Linha ~320 → DOMAIN_SHORTS       — mapa nome completo → código curto de domínio
Linha ~340 → parseCSV()          — parser do CSV_DATA
Linha ~360 → ScoreDot            — componente: bolinha colorida com anel G/L
Linha ~420 → SiteTooltip         — componente: tooltip clicável com lista de sites exclusivos
Linha ~560 → FunnelCard          — componente: card com funil L0→L4 + trigger de tooltip
Linha ~750 → SiteTable           — componente: tabela "Por Site" com ScoreDot por domínio
Linha ~950 → App (default)       — componente raiz: sidebar, tabs, filtros, views
```

### Fluxo de dados

```
Coverage.xlsx
    ↓ (pré-processado pelos scripts Python)
CSV_DATA (string)           → parseCSV() → sites[]
SITE_DOMAIN_TYPE (JSON)     → getSiteDomainType(site, domainShort) → "G" | "L" | null

sites[] + filtros (zona/volume/domínio)
    ↓
FunnelCard — calcula funil L0–L4 por contagem cumulativa
ScoreDot   — usa getSiteDomainType para mostrar anel azul (G) ou cinza (L)
SiteTable  — cruza scores + tipos por domínio
```

---

## 7. Modelo de dados

### CSV_DATA — 163 sites

Colunas:
```
Zone, Site, Country, Volume, BP, DA, UT, MT, MG, MDM, PP, QL, SF, Score
```

- `Volume` — em HL/ano
- `BP` a `SF` — scores 0–4 por domínio (veja seção 9)
- `Score` — média dos scores de domínio ativos

### SITE_DOMAIN_TYPE — 246 sites

```typescript
Record<string, Record<string, string>>
// { "NomeSite": { "BP": "G", "DA": "L", ... } }
```

- `"G"` = produto Global ativo neste site+domínio
- `"L"` = produto Legado ativo (prevalece quando ambos coexistem)
- chave ausente = sem produto ativo

**Fonte:** aba `Coverage global and legacy` do `Coverage.xlsx`, coluna `GlobalxLegacy`, filtrado por `Live? = Yes`. Quando um site tem Global e Legacy simultâneos no mesmo domínio, **Legacy prevalece**.

---

## 8. Funil de maturidade L0–L4

| Nível | Score | Descrição |
|---|---|---|
| L0 | 0 | Sem mínimo do L1 — base 100% |
| L1 | ≥ 1 | Digital Foundation |
| L2 | ≥ 2 | Connected Ops |
| L3 | ≥ 3 | Intelligent Ops |
| L4 | = 4 | Touchless Ops |

**Funil cumulativo e decrescente:** L0 sempre representa 100%. Cada nível mostra os sites que atingiram aquele score mínimo. Os tooltips mostram sites *exclusivos* de cada nível (score exatamente igual ao número do nível).

---

## 9. Domínios e códigos curtos

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

## 10. Grupos de volume

| Grupo | Faixa |
|---|---|
| G1 | < 2.000.000 HL |
| G2 | 2.000.000 – 6.000.000 HL |
| G3 | > 6.000.000 HL |

---

## 11. Paleta de cores

```typescript
// Níveis de maturidade
L0: '#D1D5DB'  // cinza
L1: '#FFE066'  // amarelo
L2: '#FFC000'  // âmbar
L3: '#F59E0B'  // laranja âmbar
L4: '#10B981'  // verde esmeralda

// Zonas
AFR:  '#D97706'
SAZ:  '#059669'
MAZ:  '#2563EB'
NAZ:  '#7C3AED'
EUR:  '#DB2777'
APAC: '#EA580C'

// Global/Legacy (Tailwind)
Global ring:  ring-blue-400
Legacy ring:  ring-gray-400
```

---

## 12. Como atualizar os dados

### Quando receber um novo `Coverage.xlsx`

Há dois conjuntos de dados para atualizar:

#### A) Scores dos sites (CSV_DATA)

```bash
# Com o novo Coverage.xlsx na raiz do projeto:
python scripts/update_csv_data.py

# O script imprime o novo CSV_DATA no terminal.
# Copie e substitua o conteúdo da constante CSV_DATA em App.tsx.
```

#### B) Mapeamento Global/Legado (SITE_DOMAIN_TYPE)

```bash
python scripts/extract_site_types.py

# O script imprime o JSON no terminal.
# Copie e substitua o conteúdo da constante SITE_DOMAIN_TYPE em App.tsx.
```

Após atualizar, rode o build:

```bash
npm run build
```

### Localização das constantes no App.tsx

```
SITE_DOMAIN_TYPE → linha ~164 (busque: "const SITE_DOMAIN_TYPE")
CSV_DATA         → linha ~170 (busque: "const CSV_DATA")
```

---

## 13. Tooltip — decisões técnicas importantes

O `SiteTooltip` tem três particularidades críticas. Não altere sem entender:

1. **Portal em `document.body`** — renderizado via `ReactDOM.createPortal` para evitar clipping por `overflow: hidden` dos cards pai.

2. **`position: fixed` com `getBoundingClientRect()`** — o posicionamento usa APENAS coordenadas do viewport. **Nunca adicionar `window.scrollY`** — isso causaria deslocamento incorreto para cards na parte inferior da tela.

3. **Click-only** — o tooltip abre só ao clicar na barra do funil, não no hover. Isso permite navegação (scroll, paginação) dentro do tooltip sem fechamento acidental.

---

## 14. Tema escuro / i18n

**Dark mode:** toggle via `document.documentElement.classList.toggle('dark', dark)`. As classes Tailwind `dark:` são aplicadas automaticamente.

**Idioma:** o objeto `TRANSLATIONS` (topo do arquivo) contém todas as strings em `pt` e `en`. O prop `t: T` é passado para todos os componentes que precisam de texto.

---

## 15. CDNs carregados on-demand

Duas bibliotecas são carregadas via `<script>` injetado no `<head>` apenas quando o usuário aciona o export:

| Biblioteca | CDN | Finalidade |
|---|---|---|
| SheetJS 0.18.5 | cdnjs.cloudflare.com | Export XLSX (3 abas) |
| html2pdf.js 0.10.1 | cdnjs.cloudflare.com | Export PDF |

Se precisar atualizar as versões, busque por `cdnjs.cloudflare.com` no App.tsx.

---

## 16. Fluxo de build e deploy

```bash
# Build local
npm run build
# Gera: dist/public/index.html + dist/public/assets/*.{css,js}

# O projeto é um bundle estático puro.
# Pode ser servido por qualquer CDN, S3, Netlify, Vercel, nginx, etc.
# Entry point: dist/public/index.html
```

---

## 17. Pontos de atenção para o Cursor AI

- **Não fragmentar App.tsx em múltiplos arquivos** sem necessidade — o projeto foi deliberadamente construído como componente único para facilitar iteração.
- **Não alterar a lógica do funil cumulativo** — L0 = 100% base, cada nível subtrai os exclusivos do nível anterior.
- **Não alterar a regra Legacy > Global** — quando ambos coexistem num site+domínio, Legacy prevalece.
- **Não usar `window.scrollY` no tooltip** — o posicionamento é `fixed`, relativo ao viewport.
- O `shared/schema.ts` e `server/routes.ts` existem como scaffolding mas não são usados ativamente neste projeto.
