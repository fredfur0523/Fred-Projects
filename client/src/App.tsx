import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';

// ============================================================================
// i18n
// ============================================================================
const TRANSLATIONS = {
  pt: {
    appSub: 'Audit Operations',
    appTitle: 'Supply Capability',
    appAccent: 'Assessment',
    byZone: 'Por Zona',
    byDomain: 'Por Domínio',
    bySite: 'Por Site',
    exportPdf: 'Exportar PDF',
    exportXlsx: 'Exportar XLSX',
    generating: 'Gerando...',
    volumeGroups: 'Grupos de Volume',
    allSites: 'Todos os Sites',
    fullUniverse: 'Universo completo',
    glidePathTitle: 'Tech Glide Path',
    glidePathSub: 'Níveis de maturidade digital',
    levels: {
      L0: { label: 'Sem L1',             desc: 'Ausência do mínimo definido em L1' },
      L1: { label: 'Digital Foundation',  desc: 'Visibilidade em tempo real, compliance' },
      L2: { label: 'Connected Ops',       desc: 'Insights acionáveis — VPO Digital' },
      L3: { label: 'Intelligent Ops',     desc: 'Dados integrados, otimização VPO' },
      L4: { label: 'Touchless Ops',       desc: 'Operações autônomas' },
    },
    monitoring: 'Monitoramento',
    consolidated: 'Global Consolidado',
    consolidatedSub: 'Visão consolidada do universo selecionado',
    overallView: 'Visão Geral',
    globalPerf: 'Performance Global',
    sitesTitle: 'Detalhamento por Site',
    sitesCount: (n: number) => `${n} sites no filtro`,
    filterBy: 'Filtrar por volume:',
    searchPlaceholder: 'Buscar site ou país...',
    allZones: 'Todas',
    tooltipSites: (level: string, n: number) => `Exclusivos ${level} (${n})`,
    tooltipEmpty: 'Nenhum site exclusivo',
    tooltipNote: 'Sites que atingem exatamente este nível',
    sortName: 'Site',
    sortZone: 'Zona',
    sortVolume: 'Volume (HL)',
    sortGroup: 'Grp',
    sortAvg: 'Avg',
    darkMode: 'Tema escuro',
    lightMode: 'Tema claro',
    langToggle: 'EN',
    global: 'Global',
    legacy: 'Legado',
    domainTypeHeader: 'Tipo',
    xlsxExportTitle: 'Coverage_Assessment',
    xlsxSheetSites: 'Sites',
    xlsxSheetSummaryZone: 'Resumo por Zona',
    xlsxSheetSummaryDomain: 'Resumo por Domínio',
    maturityVsResults: 'Maturidade vs Resultados',
    maturityVsResultsSub: 'Comparação por cluster: maturidade tecnológica × indicadores Anaplan',
    clusterBy: 'Agrupar por',
    clusterVolMat: 'Volume + Maturidade',
    clusterZoneVolMat: 'Zona + Volume + Maturidade',
    kpiOse: 'OSE',
    kpiOseFormula: 'OSE (ΣEPT/ΣOST)',
    kpiVic: 'VIC',
    kpiLifecycle: 'Lifecycle',
    kpiTtp: 'TTP',
    cluster: 'Cluster',
    sitesInCluster: 'Sites',
    avgMaturity: 'Maturidade média',
    noAnaplanData: 'Nenhum dado Anaplan carregado. Para KPIs priorizados use 2025 acumulado: salve em client/public/anaplan-kpis-2025.json (ou anaplan-kpis.json). Use o MCP anaplan-supply-chain-kpi (aggregate_kpis).',
    yearLabel: 'Ano',
    execObjective: 'Verificar se o processo de maturidade tecnológica tem efeito e impacto nos resultados das operações.',
    execQuestion: 'Sites com maior maturidade digital entregam melhores resultados operacionais?',
    whatAreClusters: 'O que são clusters?',
    whatAreClustersBody: 'Clusters são agrupamentos homogêneos de operações para comparação justa: mesmo porte (volume G1/G2/G3) e mesmo estágio de maturidade (L0 a L4). Assim evitamos comparar sites muito diferentes entre si e isolamos o efeito da maturidade sobre os indicadores.',
    impactByMaturity: 'Impacto por nível de maturidade',
    impactByMaturitySub: 'Média dos indicadores operacionais (Anaplan) por estágio do Tech Glide Path',
    impactHeatmap: 'Mapa de impacto por cluster',
    impactHeatmapSub: 'Intensidade = resultado relativo ao máximo (quanto mais escuro, maior o valor)',
    detailTable: 'Detalhamento por cluster',
    indicator: 'Indicador',
    level: 'Nível',
    resultVsMaturity: 'Resultado × Maturidade',
    insightL2Plus: 'Sites em L2 ou acima concentram melhor resultado médio nos indicadores.',
    noSitesInFilter: 'Nenhum site no filtro selecionado. Ajuste o filtro de volume na barra lateral.',
    year2025Accumulated: '2025 acumulado',
    statsAnalysis: 'Análise estatística',
    statsCorrelation: 'Correlação maturidade × resultado',
    statsByLevel: 'Resumo por nível',
    statsNarrative: 'Conclusão',
    studyOseTtpTitle: 'Estudo OSE & TTP por nível tecnológico',
    studyOseTtpSub: 'Cruzamento a nível planta: maturidade (L0–L4) × OSE e TTP. Dados YTD. Alinhado à metodologia Supply/Packaging (escopo MTH/AC/BOPSLINE/LINE, exclusão keg).',
    studyOseTtpNoData: 'Para OSE canônico: inclua PG-R0060 (EPT) e PG-K4039 (OST) em anaplan-ose-ttp-2025.json ou anaplan-kpis-2025.json. OSE = ΣEPT/ΣOST (%). TTP: PG-K0412. Fallback OSE: PG-K4038.',
    withKpi: 'Com KPI',
    oseVolumeMethodology: 'OSE canônica = ΣEPT/ΣOST (PG-R0060/PG-K4039), exibida em %. Fonte: tabela consolidada; escopo MTH/AC/BOPSLINE/LINE; exclusão keg. Dashboard exibe Anaplan PG-K4038 quando disponível. Detalhes: docs/METODOLOGIA_VOLUME_OSE.md',
    oseMethodologyOutput: 'Análise em 3 blocos: (1) Resumo executivo global, (2) Visão por zona, (3) Deep dive exceções + NST + plano de ação.',
    oseMissingHint: 'Para OSE: inclua PG-R0060 (EPT) e PG-K4039 (OST) em client/public/anaplan-ose-ttp-2025.json. Ou use PG-K4038 como fallback.',
    noDataShort: 'Sem dado',
    // ── Stakeholder Executive View ──
    heroQuestion: 'Maturidade tecnológica gera resultado operacional?',
    heroVpoExplains: 'Processo (VPO) explica',
    heroTechExplains: 'Tecnologia explica',
    heroOfVariance: 'da variância de OSE',
    heroVerdict: 'Abaixo de VPO 80%, investir em tecnologia correlaciona com PIORA da eficiência operacional.',
    quadrantTitle: 'Prova por quadrante: Processo supera Tecnologia',
    quadrantSub: 'Clique em um quadrante para filtrar o explorador de sites',
    quadrantTechHigh: 'Tech Alta',
    quadrantTechLow: 'Tech Baixa',
    quadrantVpoHigh: 'VPO Alto',
    quadrantVpoLow: 'VPO Baixo',
    quadrantInsight: (vpoDelta: string, techDelta: string) => `VPO faz ${vpoDelta} p.p. de diferença · Tech faz ${techDelta} p.p.`,
    investTitle: 'Onde investir',
    investPillars: 'Pilares VPO',
    investPortfolio: 'Portfólio Tech',
    investOwnEffect: 'Efeito próprio',
    investSpurious: 'Espúrio',
    investMarginal: 'Marginal',
    investGlobal: 'Global',
    investMixed: 'Misto',
    investLegacy: 'Legacy',
    zoneTitle: 'Mapa por zona',
    zoneSub: 'VPO→OSE é consistente globalmente. APAC é a exceção onde tech tem efeito direto.',
    zoneLowN: 'n insuficiente',
    readinessTitle: 'Gate de prontidão: Pré-requisitos VPO',
    readinessSub: 'Maturidade de processo mínima antes que tecnologia gere retorno',
    readinessThreshold: 'Limiar VPO',
    readinessAbove: 'Acima',
    readinessBelow: 'Abaixo',
    readinessInflection: 'Ponto de inflexão',
    readinessViable: 'Viável',
    readinessAvoid: 'Evitar',
    readinessNeutral: 'Neutro',
    siteReadyOk: 'Pronto',
    siteReadyWarn: 'Quase',
    siteReadyRisk: 'Risco',
    sites: 'sites',
    rCorr: 'r',
    correlationStudy: 'Estudo de Correlação',
    pillarCol: 'Pilar',
    partialCol: 'Parcial',
    statusCol: 'Status',
    zoneCol: 'Zona',
    topPerformersVpo: (top: string, bot: string, gap: string) => `VPO top performers: ${top}% · base: ${bot}% · diferença: ${gap}pp`,
    noDomainData: 'Dados insuficientes para este domínio.',
    migrationTitle: 'Condicionantes de Migração de Nível',
    migrationSub: 'O que deve estar em ordem antes de investir para subir de nível — por domínio e para o site completo',
    migrationTabLevels: 'Por Nível',
    migrationTabSites: 'Por Site',
    migrationVpoReq: 'VPO mínimo',
    migrationDomains: 'Domínios-chave',
    migrationValueTitle: 'Geração de Valor Esperada',
    migrationValueOse: 'OSE projetado',
    migrationValueNote: (vpo: string) => `Válido apenas com VPO ≥ ${vpo}%`,
    migrationBlocking: 'Domínios bloqueantes',
    migrationReady: 'Pronto para subir',
    migrationClose: 'Próximo da transição',
    migrationFar: 'Ainda longe',
    migrationNoData: 'Sem dados KPI',
    migrationLevel: 'Nível atual',
    migrationGap: 'Gap por domínio',
    migrationGlobalLabel: 'Produto Global disponível',
    migrationLegacyLabel: 'Produto Legacy',
    migrationNoProduct: 'Sem produto ativo',
    tooltipBlocking: (short: string, from: number, to: number) => `🔒 Bloqueio: ${short} (${from}→${to})`,
    tooltipAction: '✅ Ação para desbloqueio:',
    // ── Portfolio Intelligence ──
    portfolioTitle: 'Portfolio Intelligence: Global vs Legacy',
    portfolioSub: 'Maturidade e cobertura dos produtos globais por domínio e zona — base para conversas de descomissionamento',
    portfolioGlobalLeading: 'Global Liderando',
    portfolioApproaching: 'Aprox. Paridade',
    portfolioLegacyDominant: 'Legacy Dominante',
    portfolioAbsent: 'Sem Produto Global',
    portfolioCoverage: 'Cobertura',
    portfolioMaturity: 'Maturidade Média',
    portfolioDecomm: 'Prontidão p/ Descomissionamento',
    portfolioDecommReady: 'Pronto para conversa',
    portfolioDecommGap: (n: number) => `${n} sites Legacy restantes`,
    portfolioSitesGlobal: 'Global',
    portfolioSitesLegacy: 'Legacy',
    portfolioSitesNone: 'Sem produto',
    portfolioZoneDetail: 'Detalhe por Zona',
    portfolioConditions: 'Condições para Descomissionamento',
    portfolioScoreOk: (g: string, l: string) => `Score Global (${g}) ≥ Legacy (${l})`,
    portfolioScoreGap: (g: string, l: string) => `Score Global (${g}) < Legacy (${l}) — gap a fechar`,
    portfolioCovOk: (pct: string) => `Cobertura global ${pct}% ≥ 70%`,
    portfolioCovGap: (pct: string, n: number) => `Cobertura ${pct}% — ${n} sites ainda em Legacy`,
    portfolioDomainsMature: (n: number) => `${n} de 9 domínios com produto global maduro`,
    portfolioNavLabel: 'Portfolio',
    portfolioZoneSelect: 'Selecionar Zona',
    portfolioSystemsTitle: 'Sistemas por Domínio',
    portfolioGlobalProduct: 'Produto Global',
    portfolioLocalLegacy: 'Local / Legacy',
    portfolioNGlobal: 'Sites Global',
    portfolioNLegacy: 'Sites Legacy',
    portfolioNNone: 'Sem produto',
    portfolioTechLevel: 'Nível Tech (média)',
    portfolioParityLabel: 'Status de Paridade',
    portfolioNoGlobalYet: 'Sem produto global implantado',
    portfolioDecommAction: 'Ação p/ Descomissionamento',
    portfolioSummaryTitle: 'Visão Consolidada por Zona',
    portfolioZoneCompareSub: 'Comparativo de cobertura e maturidade entre zonas por domínio',
    // ── Capability Gap ──
    capabilityGapNavLabel: 'Gap de Cap.',
    capabilityGapTitle: 'Análise de Gap de Capacidade',
    capabilityGapSub: 'Avaliação baseada em capacidades N3/N4 — metodologia calibrada por tipo de funcionalidade',
    cgZoneSummary: 'Resumo por Zona',
    cgSiteMatrix: 'Matriz de Sites',
    cgSiteDetail: 'Detalhe do Site',
    cgSelectZone: 'Selecione uma zona',
    cgSelectDomain: 'Domínio',
    cgAllDomains: 'Todos',
    cgScoreFilter: 'Nível atual',
    cgAllLevels: 'Todos',
    cgSites: 'sites',
    cgAvgScore: 'Score médio',
    cgDomainActive: 'domínios ativos',
    cgBlockedBy: 'Bloqueante(s)',
    cgVacuous: 'vac.',
    cgNoActiveProduct: 'Sem produto',
    cgL1Gate: 'Gate L1: 60%',
    cgL2Gate: 'Gate L2: 75%',
    cgL3Gate: 'Gate L3: 85%',
    cgL4Gate: 'Gate L4: 90%',
    cgCapBased: 'Avaliação baseada em capacidades',
    cgDiffNote: 'Nota: este score pode diferir do overview (metodologia mais rigorosa)',
    cgClickRow: 'Clique em uma linha para ver o detalhe do site',
    cgClickCell: 'Clique em uma célula de zona+domínio para filtrar sites',
  },
  en: {
    appSub: 'Audit Operations',
    appTitle: 'Supply Capability',
    appAccent: 'Assessment',
    byZone: 'By Zone',
    byDomain: 'By Domain',
    bySite: 'By Site',
    exportPdf: 'Export PDF',
    exportXlsx: 'Export XLSX',
    generating: 'Generating...',
    volumeGroups: 'Volume Groups',
    allSites: 'All Sites',
    fullUniverse: 'Full universe',
    glidePathTitle: 'Tech Glide Path',
    glidePathSub: 'Digital maturity levels',
    levels: {
      L0: { label: 'Below L1',            desc: 'Missing minimum requirements of L1' },
      L1: { label: 'Digital Foundation',   desc: 'Real-time visibility, compliance baseline' },
      L2: { label: 'Connected Ops',        desc: 'Actionable insights — Digital VPO' },
      L3: { label: 'Intelligent Ops',      desc: 'Integrated data, VPO optimization' },
      L4: { label: 'Touchless Ops',        desc: 'Autonomous operations' },
    },
    monitoring: 'Monitoring',
    consolidated: 'Global Consolidated',
    consolidatedSub: 'Consolidated view of selected universe',
    overallView: 'Overview',
    globalPerf: 'Global Performance',
    sitesTitle: 'Site Detail',
    sitesCount: (n: number) => `${n} sites in filter`,
    filterBy: 'Filter by volume:',
    searchPlaceholder: 'Search site or country...',
    allZones: 'All',
    tooltipSites: (level: string, n: number) => `Exclusive to ${level} (${n})`,
    tooltipEmpty: 'No exclusive sites at this level',
    tooltipNote: 'Sites that reach exactly this maturity level',
    sortName: 'Site',
    sortZone: 'Zone',
    sortVolume: 'Volume (HL)',
    sortGroup: 'Grp',
    sortAvg: 'Avg',
    darkMode: 'Dark mode',
    lightMode: 'Light mode',
    langToggle: 'PT',
    global: 'Global',
    legacy: 'Legacy',
    domainTypeHeader: 'Type',
    xlsxExportTitle: 'Coverage_Assessment',
    xlsxSheetSites: 'Sites',
    xlsxSheetSummaryZone: 'Summary by Zone',
    xlsxSheetSummaryDomain: 'Summary by Domain',
    maturityVsResults: 'Maturity vs Results',
    maturityVsResultsSub: 'Comparison by cluster: tech maturity × Anaplan indicators',
    clusterBy: 'Cluster by',
    clusterVolMat: 'Volume + Maturity',
    clusterZoneVolMat: 'Zone + Volume + Maturity',
    kpiOse: 'OSE',
    kpiOseFormula: 'OSE (ΣEPT/ΣOST)',
    kpiVic: 'VIC',
    kpiLifecycle: 'Lifecycle',
    kpiTtp: 'TTP',
    cluster: 'Cluster',
    sitesInCluster: 'Sites',
    avgMaturity: 'Avg maturity',
    noAnaplanData: 'No Anaplan data loaded. For prioritized KPIs use 2025 accumulated: save to client/public/anaplan-kpis-2025.json (or anaplan-kpis.json). Use MCP anaplan-supply-chain-kpi (aggregate_kpis).',
    yearLabel: 'Year',
    execObjective: 'Verify whether the technology maturity process has a measurable effect and impact on operational results.',
    execQuestion: 'Do sites with higher digital maturity deliver better operational results?',
    whatAreClusters: 'What are clusters?',
    whatAreClustersBody: 'Clusters are homogeneous groups of operations for fair comparison: same scale (volume G1/G2/G3) and same maturity stage (L0 to L4). This avoids comparing very different sites and isolates the effect of maturity on indicators.',
    impactByMaturity: 'Impact by maturity level',
    impactByMaturitySub: 'Average operational indicators (Anaplan) by Tech Glide Path stage',
    impactHeatmap: 'Impact map by cluster',
    impactHeatmapSub: 'Intensity = result relative to maximum (darker = higher value)',
    detailTable: 'Detail by cluster',
    indicator: 'Indicator',
    level: 'Level',
    resultVsMaturity: 'Result × Maturity',
    insightL2Plus: 'Sites at L2 or above show higher average results on indicators.',
    noSitesInFilter: 'No sites in selected filter. Adjust the volume filter in the sidebar.',
    year2025Accumulated: '2025 accumulated',
    statsAnalysis: 'Statistical analysis',
    statsCorrelation: 'Maturity × result correlation',
    statsByLevel: 'Summary by level',
    statsNarrative: 'Conclusion',
    studyOseTtpTitle: 'OSE & TTP study by tech level',
    studyOseTtpSub: 'Plant-level cross: maturity (L0–L4) × OSE and TTP. YTD data. Aligned to Supply/Packaging methodology (scope MTH/AC/BOPSLINE/LINE, keg excluded).',
    studyOseTtpNoData: 'For canonical OSE include PG-R0060 (EPT) and PG-K4039 (OST) in anaplan-ose-ttp-2025.json or anaplan-kpis-2025.json. OSE = ΣEPT/ΣOST (%). TTP: PG-K0412. Fallback OSE: PG-K4038.',
    withKpi: 'With KPI',
    oseVolumeMethodology: 'Canonical OSE = ΣEPT/ΣOST (PG-R0060/PG-K4039), shown in %. Source: consolidated table; scope MTH/AC/BOPSLINE/LINE; keg excluded. Dashboard shows Anaplan PG-K4038 when available. Details: docs/METODOLOGIA_VOLUME_OSE.md',
    oseMethodologyOutput: 'Analysis in 3 blocks: (1) Global executive summary, (2) View by zone, (3) Deep dive exceptions + NST + action plan.',
    oseMissingHint: 'For OSE add PG-R0060 (EPT) and PG-K4039 (OST) to client/public/anaplan-ose-ttp-2025.json. Or use PG-K4038 as fallback.',
    noDataShort: 'No data',
    // ── Stakeholder Executive View ──
    heroQuestion: 'Does technology maturity drive operational results?',
    heroVpoExplains: 'Process (VPO) explains',
    heroTechExplains: 'Technology explains',
    heroOfVariance: 'of OSE variance',
    heroVerdict: 'Below VPO 80%, investing in technology correlates with WORSE operational efficiency.',
    quadrantTitle: 'Quadrant proof: Process trumps Technology',
    quadrantSub: 'Click a quadrant to filter the Site Explorer below',
    quadrantTechHigh: 'Tech High',
    quadrantTechLow: 'Tech Low',
    quadrantVpoHigh: 'VPO High',
    quadrantVpoLow: 'VPO Low',
    quadrantInsight: (vpoDelta: string, techDelta: string) => `VPO makes ${vpoDelta} p.p. difference · Tech makes ${techDelta} p.p.`,
    investTitle: 'Where to invest',
    investPillars: 'VPO Pillars',
    investPortfolio: 'Tech Portfolio',
    investOwnEffect: 'Own effect',
    investSpurious: 'Spurious',
    investMarginal: 'Marginal',
    investGlobal: 'Global',
    investMixed: 'Mixed',
    investLegacy: 'Legacy',
    zoneTitle: 'Zone map',
    zoneSub: 'VPO→OSE is consistent globally. APAC is the exception where tech has direct effect.',
    zoneLowN: 'Low n',
    readinessTitle: 'Readiness gate: VPO prerequisites',
    readinessSub: 'Minimum process maturity before technology pays off',
    readinessThreshold: 'VPO Threshold',
    readinessAbove: 'Above',
    readinessBelow: 'Below',
    readinessInflection: 'Inflection point',
    readinessViable: 'Viable',
    readinessAvoid: 'Avoid',
    readinessNeutral: 'Neutral',
    siteReadyOk: 'Ready',
    siteReadyWarn: 'Near',
    siteReadyRisk: 'Risk',
    sites: 'sites',
    rCorr: 'r',
    correlationStudy: 'Correlation Study',
    pillarCol: 'Pillar',
    partialCol: 'Partial',
    statusCol: 'Status',
    zoneCol: 'Zone',
    topPerformersVpo: (top: string, bot: string, gap: string) => `VPO top performers: ${top}% · bottom: ${bot}% · gap: ${gap}pp`,
    noDomainData: 'Insufficient data for this domain.',
    migrationTitle: 'Level Migration Requirements',
    migrationSub: 'What must be in place before investing to move to the next level — by domain and for the full site',
    migrationTabLevels: 'By Level',
    migrationTabSites: 'By Site',
    migrationVpoReq: 'Minimum VPO',
    migrationDomains: 'Key domains',
    migrationValueTitle: 'Expected Value Generation',
    migrationValueOse: 'Projected OSE',
    migrationValueNote: (vpo: string) => `Valid only with VPO ≥ ${vpo}%`,
    migrationBlocking: 'Blocking domains',
    migrationReady: 'Ready to level up',
    migrationClose: 'Close to transition',
    migrationFar: 'Still far',
    migrationNoData: 'No KPI data',
    migrationLevel: 'Current level',
    migrationGap: 'Gap by domain',
    migrationGlobalLabel: 'Global product available',
    migrationLegacyLabel: 'Legacy product',
    migrationNoProduct: 'No active product',
    tooltipBlocking: (short: string, from: number, to: number) => `🔒 Blocking: ${short} (${from}→${to})`,
    tooltipAction: '✅ Action to unblock:',
    // ── Portfolio Intelligence ──
    portfolioTitle: 'Portfolio Intelligence: Global vs Legacy',
    portfolioSub: 'Maturity and coverage of global products by domain and zone — foundation for decommissioning conversations',
    portfolioGlobalLeading: 'Global Leading',
    portfolioApproaching: 'Approaching Parity',
    portfolioLegacyDominant: 'Legacy Dominant',
    portfolioAbsent: 'No Global Product',
    portfolioCoverage: 'Coverage',
    portfolioMaturity: 'Avg Maturity',
    portfolioDecomm: 'Decommissioning Readiness',
    portfolioDecommReady: 'Ready for conversation',
    portfolioDecommGap: (n: number) => `${n} Legacy sites remaining`,
    portfolioSitesGlobal: 'Global',
    portfolioSitesLegacy: 'Legacy',
    portfolioSitesNone: 'No product',
    portfolioZoneDetail: 'Zone Detail',
    portfolioConditions: 'Decommissioning Conditions',
    portfolioScoreOk: (g: string, l: string) => `Global score (${g}) ≥ Legacy (${l})`,
    portfolioScoreGap: (g: string, l: string) => `Global score (${g}) < Legacy (${l}) — gap to close`,
    portfolioCovOk: (pct: string) => `Global coverage ${pct}% ≥ 70%`,
    portfolioCovGap: (pct: string, n: number) => `Coverage ${pct}% — ${n} sites still on Legacy`,
    portfolioDomainsMature: (n: number) => `${n} of 9 domains with mature global product`,
    portfolioNavLabel: 'Portfolio',
    // ── Capability Gap ──
    capabilityGapNavLabel: 'Cap. Gap',
    capabilityGapTitle: 'Capability Gap Analysis',
    capabilityGapSub: 'N3/N4 capability-based assessment — calibrated by functionality type',
    cgZoneSummary: 'Zone Summary',
    cgSiteMatrix: 'Site Matrix',
    cgSiteDetail: 'Site Detail',
    cgSelectZone: 'Select a zone',
    cgSelectDomain: 'Domain',
    cgAllDomains: 'All',
    cgScoreFilter: 'Current level',
    cgAllLevels: 'All',
    cgSites: 'sites',
    cgAvgScore: 'Avg score',
    cgDomainActive: 'active domains',
    cgBlockedBy: 'Blocker(s)',
    cgVacuous: 'vac.',
    cgNoActiveProduct: 'No product',
    cgL1Gate: 'L1 gate: 60%',
    cgL2Gate: 'L2 gate: 75%',
    cgL3Gate: 'L3 gate: 85%',
    cgL4Gate: 'L4 gate: 90%',
    cgCapBased: 'Capability-based assessment',
    cgDiffNote: 'Note: this score may differ from overview (more rigorous methodology)',
    cgClickRow: 'Click a row to see site detail',
    cgClickCell: 'Click a zone+domain cell to filter sites',
    portfolioZoneSelect: 'Select Zone',
    portfolioSystemsTitle: 'Systems by Domain',
    portfolioGlobalProduct: 'Global Product',
    portfolioLocalLegacy: 'Local / Legacy',
    portfolioNGlobal: 'Global Sites',
    portfolioNLegacy: 'Legacy Sites',
    portfolioNNone: 'No product',
    portfolioTechLevel: 'Tech Level (avg)',
    portfolioParityLabel: 'Parity Status',
    portfolioNoGlobalYet: 'No global product deployed',
    portfolioDecommAction: 'Decommissioning Action',
    portfolioSummaryTitle: 'Consolidated Zone View',
    portfolioZoneCompareSub: 'Coverage and maturity comparison across zones by domain',
  }
};
type Lang = 'pt' | 'en';
type T = typeof TRANSLATIONS['pt'];

// ============================================================================
// DATA
// ============================================================================
const getGroupFromVolume = (v: number) => v > 6000000 ? 'G3' : v >= 2000000 ? 'G2' : 'G1';

const DOMAINS = [
  "Total Global","Data Acquisition","MasterData Management","Brewing Performance",
  "Packaging Performance","Quality","Maintenance","Safety","Management","Utilities"
];
const ZONES = ["AFR","SAZ","MAZ","NAZ","EUR","APAC"];

// Anaplan KPI data: load from file generated via MCP user-anaplan-supply-chain-kpi (aggregate_kpis)
// Schema: { year: number, rows: { plant, year, kpi_code, aggregated_value[, periodtype?, month?] }[] }
type AnaplanRow = { plant: string; year: string; kpi_code: string; aggregated_value: number; periodtype?: string; month?: string };
type AnaplanData = { year: number; rows: AnaplanRow[] };

// Product Coverage data: loaded from product-coverage-2026.json (from OneMes Coverage.xlsx)
// zone → domain → [{product, sites, n}]
interface ProductDeployment { product: string; sites: string[]; n: number; }
type ProductCoverageData = Record<string, Record<string, ProductDeployment[]>>;

// VPO Process Maturity data: loaded from vpo-site-scores-2026.json
interface VpoPillarScore {
  score: number | null;
  y: number; n: number; na: number;
  by_level: Record<string, { y: number; n: number; na: number }>;
}
interface VpoSiteData {
  vpo_name: string;
  zone: string;
  overall_score: number | null;
  pillars: Record<string, VpoPillarScore>;
}
type VpoData = Record<string, VpoSiteData>;

// KPIs de Volume (hL) — mix e complexidade. Preferir YTD para mix anual; MTH para mensal.
const VOLUME_KPI_CODES = [
  'PB-R0030', 'PB-R0010', 'PB-R0050', // Bottling: Soft Drink, Beer, Water
  'PC-R0050', 'PC-R0010', 'PC-R0030', // Canning: Water, Beer, Soft Drink
  'PP-R0050', 'PP-R0010', 'PP-R0030', // PET: Water, Beer, Soft Drink
] as const;
const ANAPLAN_KPI_GROUPS = ['OSE', 'VIC', 'Lifecycle', 'TTP'] as const;
type KpiGroup = typeof ANAPLAN_KPI_GROUPS[number];
// Map kpi_code prefix (first 2 chars) to indicator group — adjust to match your Anaplan KPI_Group
const KPI_GROUP_BY_PREFIX: Record<string, KpiGroup> = {
  PG: 'Lifecycle', SL: 'OSE', LP: 'VIC', CA: 'TTP', AL: 'OSE', DC: 'TTP', LE: 'Lifecycle',
};
// Estudo OSE/TTP: cálculo canônico OSE = ΣEPT/ΣOST (nunca média simples)
const KPI_EPT = 'PG-R0060';  // Effective Production Time
const KPI_OST = 'PG-K4039';  // Overall Supply Time
const STUDY_KPI_OSE_PRECALC = 'PG-K4038';  // fallback se EPT/OST não disponíveis
const STUDY_KPI_TTP = 'PG-K0412';
const getKpiGroup = (kpiCode: string): KpiGroup | null => {
  if (kpiCode === STUDY_KPI_OSE_PRECALC) return 'OSE';
  if (kpiCode === STUDY_KPI_TTP) return 'TTP';
  const prefix = kpiCode.slice(0, 2);
  return KPI_GROUP_BY_PREFIX[prefix] ?? null;
};
// Normalize Anaplan plant name to match coverage Site name (for join)
// Explicit plant-name → site-name overrides (handles case, suffixes, and abbreviation differences)
const PLANT_TO_SITE_OVERRIDE: Record<string, string> = {
  'ZACATECAS': 'Zacatecas', 'TORREON': 'Torreon', 'MAZATLAN': 'Mazatlan', 'GUADALAJARA': 'Guadalajara',
  'Mexico Apan': 'Mexico APAN',
  'Accra Beer': 'Accra', 'Alrode Beer': 'Alrode', 'Ate Beer': 'Ate',
  'Jiamusi New': 'Jiamusi', 'Mudanjiang(New)': 'Mudanjiang', 'Putian (New)': 'Putian',
  'Sapucaia do Sul': 'Sapucaia', 'Cachoeiras de Macacu': 'Macacu',
  'Gateway Brewery': 'Gateway', 'Jinja Beer': 'Jinja', 'Guayaquil Beer': 'Guayaquil',
  'Motupe Beer': 'Motupe', 'Panama Beer': 'Panama', 'Kgalagadi Beer': 'Kgalagadi',
  'Lesotho Beer': 'Lesotho', 'Lusaka Beer': 'Lusaka', 'Namibia Beer': 'Namibia',
  'San Pedro Sula Beer': 'San Pedro Sula',
  'Santa Cruz': 'Santa Cruz BO', 'Santa Cruz (SABM)': 'Santa Cruz SABM',
  'Ind La Constancia Beer': 'Ind La Constancia',
};

const normalizePlantToSite = (plant: string, siteNames: string[]): string | null => {
  // 1. Explicit override
  if (PLANT_TO_SITE_OVERRIDE[plant]) return PLANT_TO_SITE_OVERRIDE[plant];
  // 2. Strip common suffixes (case-insensitive)
  const p = plant
    .replace(/\s*_BOPS\s*$|\s*_T1\s*$/i, '')
    .replace(/\s*Beer_BOPS\s*$/i, '')
    .replace(/\s+Beer\s*$/i, '')
    .replace(/\s+Brewery\s*$/i, '')
    .replace(/\s*\(SABM\)\s*$|\s*\(BO\)\s*$|\s*\(New\)\s*$/i, '')
    .replace(/\s+New\s*$/i, '')
    .trim();
  // 3. Case-insensitive exact match
  const pl = p.toLowerCase();
  const exact = siteNames.find(s => s.toLowerCase() === pl);
  if (exact) return exact;
  // 4. Word-boundary aware partial match (avoid false positives like "Ate" → "Albairate")
  const match = siteNames.find(s => {
    const sl = s.toLowerCase();
    // Only match if one is a prefix/suffix of the other at word boundaries
    return (pl === sl)
      || (pl.startsWith(sl + ' ') || sl.startsWith(pl + ' '))
      || (pl.endsWith(' ' + sl) || sl.endsWith(' ' + pl));
  });
  return match ?? null;
};


const ZONE_COLORS: Record<string,{bg:string;text:string;border:string;dot:string;darkBg:string;darkText:string}> = {
  AFR:  {bg:'bg-amber-50',   text:'text-amber-700',   border:'border-amber-200',  dot:'#D97706',darkBg:'bg-amber-900/30',  darkText:'text-amber-300'},
  SAZ:  {bg:'bg-emerald-50', text:'text-emerald-700', border:'border-emerald-200',dot:'#059669',darkBg:'bg-emerald-900/30',darkText:'text-emerald-300'},
  MAZ:  {bg:'bg-blue-50',    text:'text-blue-700',    border:'border-blue-200',   dot:'#2563EB',darkBg:'bg-blue-900/30',   darkText:'text-blue-300'},
  NAZ:  {bg:'bg-purple-50',  text:'text-purple-700',  border:'border-purple-200', dot:'#7C3AED',darkBg:'bg-purple-900/30', darkText:'text-purple-300'},
  EUR:  {bg:'bg-pink-50',    text:'text-pink-700',    border:'border-pink-200',   dot:'#DB2777',darkBg:'bg-pink-900/30',   darkText:'text-pink-300'},
  APAC: {bg:'bg-orange-50',  text:'text-orange-700',  border:'border-orange-200', dot:'#EA580C',darkBg:'bg-orange-900/30', darkText:'text-orange-300'},
};

const GHQ_TOTALS: Record<string,Record<string,number>> = {
  "Management":            {AFR:100,APAC:0, EUR:0,  MAZ:65, NAZ:100,SAZ:100,Global:63},
  "Quality":               {AFR:4,  APAC:0, EUR:0,  MAZ:0,  NAZ:0,  SAZ:0,  Global:1 },
  "Packaging Performance": {AFR:0,  APAC:0, EUR:0,  MAZ:0,  NAZ:0,  SAZ:2,  Global:1 },
  "Brewing Performance":   {AFR:14, APAC:11,EUR:0,  MAZ:0,  NAZ:100,SAZ:100,Global:39},
  "Safety":                {AFR:75, APAC:0, EUR:17, MAZ:23, NAZ:14, SAZ:100,Global:45},
  "Maintenance":           {AFR:0,  APAC:22,EUR:50, MAZ:0,  NAZ:0,  SAZ:98, Global:33},
  "Data Acquisition":      {AFR:100,APAC:16,EUR:100,MAZ:90, NAZ:100,SAZ:100,Global:79},
  "MasterData Management": {AFR:100,APAC:76,EUR:100,MAZ:90, NAZ:100,SAZ:100,Global:93},
  "Utilities":             {AFR:0,  APAC:3, EUR:42, MAZ:0,  NAZ:7,  SAZ:0,  Global:4 },
  "Total Global":          {AFR:0,  APAC:0, EUR:0,  MAZ:0,  NAZ:0,  SAZ:0,  Global:0 },
};

const GLOBAL_STATS: Record<string,Record<string,{dist:number[];avg:string;total:number}>> = {
  "Total Global":{"AFR":{dist:[50,0,50,0,0],avg:"1.93",total:28},"SAZ":{dist:[7,3,90,0,0],avg:"1.98",total:41},"MAZ":{dist:[6,4,90,0,0],avg:"1.96",total:31},"NAZ":{dist:[0,50,50,0,0],avg:"1.83",total:14},"EUR":{dist:[0,100,0,0,0],avg:"1.72",total:12},"APAC":{dist:[27,19,54,0,0],avg:"2.00",total:37},"Global":{dist:[18,17,65,0,0],avg:"1.94",total:163}},
  "Data Acquisition":{"AFR":{dist:[0,0,100,0,0],avg:"2.00",total:28},"SAZ":{dist:[0,0,100,0,0],avg:"2.00",total:41},"MAZ":{dist:[6,0,94,0,0],avg:"1.87",total:31},"NAZ":{dist:[0,0,100,0,0],avg:"2.00",total:14},"EUR":{dist:[0,0,100,0,0],avg:"2.00",total:12},"APAC":{dist:[16,0,16,68,0],avg:"2.35",total:37},"Global":{dist:[5,0,80,15,0],avg:"2.06",total:163}},
  "MasterData Management":{"AFR":{dist:[0,0,100,0,0],avg:"2.00",total:28},"SAZ":{dist:[0,0,100,0,0],avg:"2.00",total:41},"MAZ":{dist:[6,0,94,0,0],avg:"1.87",total:31},"NAZ":{dist:[0,0,100,0,0],avg:"2.00",total:14},"EUR":{dist:[0,0,100,0,0],avg:"2.00",total:12},"APAC":{dist:[16,0,16,68,0],avg:"2.35",total:37},"Global":{dist:[5,0,80,15,0],avg:"2.06",total:163}},
  "Utilities":{"AFR":{dist:[0,32,68,0,0],avg:"1.68",total:28},"SAZ":{dist:[0,0,100,0,0],avg:"2.00",total:41},"MAZ":{dist:[0,0,100,0,0],avg:"2.00",total:31},"NAZ":{dist:[0,50,50,0,0],avg:"1.50",total:14},"EUR":{dist:[0,50,50,0,0],avg:"1.50",total:12},"APAC":{dist:[0,24,8,68,0],avg:"2.43",total:37},"Global":{dist:[0,19,66,15,0],avg:"1.96",total:163}},
  "Brewing Performance":{"AFR":{dist:[0,32,14,54,0],avg:"2.21",total:28},"SAZ":{dist:[7,0,93,0,0],avg:"1.85",total:41},"MAZ":{dist:[0,0,100,0,0],avg:"2.00",total:31},"NAZ":{dist:[0,36,64,0,0],avg:"1.64",total:14},"EUR":{dist:[0,92,8,0,0],avg:"1.08",total:12},"APAC":{dist:[27,5,68,0,0],avg:"1.41",total:37},"Global":{dist:[8,17,66,9,0],avg:"1.77",total:163}},
  "Packaging Performance":{"AFR":{dist:[50,0,50,0,0],avg:"1.00",total:28},"SAZ":{dist:[0,2,98,0,0],avg:"1.98",total:41},"MAZ":{dist:[0,0,100,0,0],avg:"2.00",total:31},"NAZ":{dist:[0,36,64,0,0],avg:"1.64",total:14},"EUR":{dist:[0,0,100,0,0],avg:"2.00",total:12},"APAC":{dist:[27,19,54,0,0],avg:"1.27",total:37},"Global":{dist:[15,8,77,0,0],avg:"1.63",total:163}},
  "Quality":{"AFR":{dist:[0,4,43,54,0],avg:"2.50",total:28},"SAZ":{dist:[0,0,100,0,0],avg:"2.00",total:41},"MAZ":{dist:[0,3,97,0,0],avg:"1.97",total:31},"NAZ":{dist:[0,36,64,0,0],avg:"1.64",total:14},"EUR":{dist:[0,8,92,0,0],avg:"1.92",total:12},"APAC":{dist:[8,19,73,0,0],avg:"1.65",total:37},"Global":{dist:[2,9,80,9,0],avg:"1.96",total:163}},
  "Maintenance":{"AFR":{dist:[0,0,100,0,0],avg:"2.00",total:28},"SAZ":{dist:[0,0,100,0,0],avg:"2.00",total:41},"MAZ":{dist:[0,0,100,0,0],avg:"2.00",total:31},"NAZ":{dist:[0,0,100,0,0],avg:"2.00",total:14},"EUR":{dist:[0,0,100,0,0],avg:"2.00",total:12},"APAC":{dist:[0,19,81,0,0],avg:"1.81",total:37},"Global":{dist:[0,4,96,0,0],avg:"1.96",total:163}},
  "Safety":{"AFR":{dist:[0,0,100,0,0],avg:"2.00",total:28},"SAZ":{dist:[0,0,100,0,0],avg:"2.00",total:41},"MAZ":{dist:[0,0,100,0,0],avg:"2.00",total:31},"NAZ":{dist:[0,0,100,0,0],avg:"2.00",total:14},"EUR":{dist:[0,0,100,0,0],avg:"2.00",total:12},"APAC":{dist:[0,19,14,67,0],avg:"2.49",total:37},"Global":{dist:[0,4,80,16,0],avg:"2.11",total:163}},
  "Management":{"AFR":{dist:[0,0,100,0,0],avg:"2.00",total:28},"SAZ":{dist:[0,0,100,0,0],avg:"2.00",total:41},"MAZ":{dist:[0,6,94,0,0],avg:"1.94",total:31},"NAZ":{dist:[0,0,100,0,0],avg:"2.00",total:14},"EUR":{dist:[0,100,0,0,0],avg:"1.00",total:12},"APAC":{dist:[19,5,8,68,0],avg:"2.24",total:37},"Global":{dist:[4,10,71,15,0],avg:"1.97",total:163}},
};

// Per-site, per-domain Global/Legacy type derived from Coverage.xlsx
// G = Global Product live, L = Legacy Product live, omitted = no live product
// Source: 'Coverage global and legacy' sheet, GlobalxLegacy column, Live?=Yes
const SITE_DOMAIN_TYPE: Record<string, Record<string, string>> = {"Accra":{"BP":"L","DA":"G","MG":"G","MDM":"G","QL":"L","SF":"G"},"Acheral":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Agudos":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Alrode":{"BP":"L","DA":"G","MG":"G","MDM":"G","QL":"L","SF":"L"},"Aquiraz":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Arcen":{"QL":"G"},"Archibald":{"MG":"G"},"Arequipa":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Aromas":{"DA":"G","MT":"G","MG":"G","MDM":"G","QL":"L","SF":"G"},"Arusha":{"BP":"G","DA":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"Ate":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Atlantico":{"MG":"G","QL":"G","SF":"G"},"Aurangabad":{"MG":"L","QL":"G"},"BARI Barley Research":{"BP":"L","MG":"G","PP":"L","QL":"L"},"Baldwinsville":{"BP":"G","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L"},"Baoding":{"DA":"L","MG":"L","MDM":"G","QL":"L","SF":"L"},"Barbarian":{"MG":"G","SF":"L"},"Barranquilla":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Beira":{"DA":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"Bogota":{"MG":"G","SF":"L"},"Bohemia":{"DA":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"Bosteels":{"DA":"G","MDM":"G","QL":"G","SF":"G"},"Boyaca":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Bremen":{"BP":"L","DA":"G","MT":"G","MDM":"G","PP":"L","QL":"L"},"Bucaramanga":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Budweiser Technical Center":{"MG":"G"},"Camacari":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Camden Town - Enfield":{"DA":"G","MDM":"G","QL":"G","SF":"G"},"Can Arnold":{"BP":"L","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L"},"Can Enalbo":{"DA":"G","MT":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"Can Jacksonville":{"BP":"L","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L"},"Can Minas":{"DA":"G","MT":"G","MG":"G","MDM":"G","QL":"L","SF":"G"},"Can Mira Loma":{"BP":"L","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L"},"Can Newburgh":{"BP":"L","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L"},"Can Windsor":{"BP":"L","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L"},"Can Zacatecas":{"DA":"G","MT":"L","MG":"G","MDM":"G","QL":"G","SF":"G"},"Cartersville":{"BP":"G","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L"},"Cebrasa":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Chamdor":{"BP":"L","DA":"G","MG":"G","MDM":"G","QL":"L","SF":"L"},"Charminar":{"QL":"G"},"Cheongwon":{"DA":"G","MG":"L","MDM":"G","QL":"G"},"Cochabamba":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"G","QL":"L","SF":"G"},"Colorado":{"MG":"G","QL":"G","SF":"G"},"Columbus":{"BP":"G","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Contagem":{"MG":"G","QL":"L","SF":"G"},"Cordoba":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Corporate Culture Yeast Plant (CCYP)":{"DA":"G","MG":"G","MDM":"G","QL":"G"},"Corrientes":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Creston":{"BP":"G","DA":"G","MG":"G","MDM":"G","QL":"L"},"Crown Coroplas":{"MT":"G","MG":"G","QL":"G","SF":"G"},"Crown Manaus":{"DA":"G","MT":"G","MG":"G","MDM":"G","QL":"L","SF":"G"},"Crown Tocancipa":{"DA":"G","MT":"L","MG":"G","MDM":"G","SF":"G"},"Crown Zacatecas":{"DA":"G","MT":"L","MG":"G","MDM":"G","SF":"G"},"Cucapa":{"MG":"G","QL":"G","SF":"L"},"Cuiaba":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Curitibana":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"G","SF":"G"},"Cusco":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Cutwater Spirits":{"BP":"L","MG":"G","PP":"L","QL":"L"},"Dante Robino":{"MG":"G","SF":"G"},"Dar es Salaam":{"BP":"G","DA":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"Devils Backbone":{"BP":"L","MG":"G","PP":"L","QL":"L"},"Diekirch":{"DA":"G","MDM":"G","QL":"G","SF":"G"},"Dommelen":{"BP":"L","DA":"G","MT":"G","MDM":"G","PP":"L","QL":"L"},"Eagle Packaging":{"BP":"L","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L"},"Edmonton":{"BP":"G","DA":"G","MG":"G","MDM":"G","QL":"L"},"El Alto":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Equatorial":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Eswatini":{"DA":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"EverGrain":{"DA":"G","MG":"G","MDM":"G"},"Fernandez Oro":{"MG":"G","SF":"G"},"Fort Collins":{"BP":"G","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L"},"Foshan":{"DA":"L","MT":"G","MG":"L","MDM":"G","QL":"L","SF":"L"},"Fosters":{"MG":"L","QL":"G"},"Four Peaks":{"BP":"L","MG":"G","PP":"L","QL":"L"},"Francistown TAB":{"MG":"G","SF":"G"},"Gabarone TAB":{"SF":"G"},"Gateway":{"BP":"L","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Glass Coatzacoalcos":{"MT":"L","MG":"G","QL":"G","SF":"G"},"Glass Lab Tultitan":{"MG":"G","QL":"G"},"Glass Parana":{"MG":"G","SF":"G"},"Glass Potosi":{"DA":"G","MT":"L","MG":"G","MDM":"G","QL":"G","SF":"G"},"Glass Rio":{"DA":"G","MT":"G","MG":"G","MDM":"G","QL":"L","SF":"G"},"Glass Ypane":{"DA":"G","MT":"G","MG":"G","MDM":"G","SF":"G"},"Goose Island":{"BP":"L","MG":"G","PP":"L","QL":"L"},"Guadalajara":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Guarana Maues":{"MG":"G","SF":"G"},"Guarulhos":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Guayaquil":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Gwangju":{"BP":"L","DA":"G","MG":"L","MDM":"G","QL":"L"},"Halifax":{"BP":"G","DA":"G","MG":"G","MDM":"G","QL":"L"},"Harbin 2":{"DA":"L","MT":"G","MG":"L","MDM":"G","QL":"L","SF":"L"},"Hato Nuevo":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Hoegaarden":{"BP":"L","DA":"G","MT":"L","MDM":"G","PP":"L","QL":"L"},"Hop Elk Mountain Farms":{"BP":"L","MG":"G","PP":"L","QL":"L"},"Hop George":{"MG":"G","SF":"G"},"Houston":{"BP":"G","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L"},"Huachipa":{"MG":"G","QL":"G","SF":"L"},"Huari":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Hyderabad":{"QL":"G"},"Ibhayi":{"BP":"L","DA":"G","MG":"G","MDM":"G","QL":"L","SF":"L"},"Icheon":{"BP":"L","DA":"G","MG":"L","MDM":"G","QL":"L"},"Ilesa":{"BP":"L","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Ind La Constancia":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Ind La Constancia CSD":{"MT":"L","MG":"G","QL":"G","SF":"G"},"Ind La Constancia Water":{"BP":"L","MT":"L","MG":"G","PP":"L","QL":"L","SF":"G"},"Issum":{"BP":"L","DA":"G","MDM":"G","PP":"L","QL":"L"},"Jacarei":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Jacksonville":{"BP":"G","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L"},"Jaguariuna":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Jiamusi":{"DA":"L","MG":"L","MDM":"G","QL":"L","SF":"L"},"Jinja":{"DA":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"Jinshibai":{"DA":"L","MG":"L","MDM":"G","QL":"L","SF":"L"},"Jinzhou":{"DA":"L","MG":"L","MDM":"G","QL":"L","SF":"L"},"Jishui":{"DA":"L","MG":"L","MDM":"G","QL":"L","SF":"L"},"Juatuba":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"G","SF":"G"},"Jundiai":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Jupille":{"BP":"L","DA":"G","MT":"G","MDM":"G","PP":"L","QL":"L"},"Karbach":{"BP":"L","MG":"G","PP":"L","QL":"L","SF":"G"},"Kgalagadi":{"DA":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"Kunming":{"BP":"G","DA":"L","MG":"L","MDM":"G","QL":"L","SF":"L"},"La Paz":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Label Indugral":{"DA":"G","MT":"L","MG":"G","MDM":"G","SF":"G"},"Label Sao Paulo":{"DA":"G","MT":"G","MG":"G","MDM":"G","QL":"L","SF":"G"},"Lages":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Las Palmas":{"BP":"L","DA":"G","MDM":"G","PP":"L","QL":"L"},"Lesotho":{"DA":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"Leuven":{"BP":"L","DA":"G","MT":"G","MDM":"G","PP":"L","QL":"L"},"Leuven Research Pilot Brewery":{"QL":"G"},"Lid Oklahoma":{"BP":"L","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Lid Riverside":{"BP":"L","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L"},"London":{"BP":"G","DA":"G","MG":"G","MDM":"G","QL":"L","SF":"G"},"Los Angeles":{"BP":"G","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L"},"Lusaka":{"DA":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"Macacu":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Magor":{"BP":"L","DA":"G","MT":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Malt Alrode":{"BP":"L","DA":"G","MG":"G","MDM":"G","QL":"L","SF":"L"},"Malt Caledon":{"BP":"L","DA":"G","MG":"G","MDM":"G","QL":"L","SF":"L"},"Malt Cartagena":{"DA":"G","MT":"L","MG":"G","MDM":"G","QL":"G","SF":"G"},"Malt Cebadas":{"DA":"G","MT":"L","MG":"G","MDM":"G","QL":"G","SF":"G"},"Malt Guayaquil":{"DA":"G","MT":"L","MG":"G","MDM":"G","QL":"G","SF":"G"},"Malt Idaho Falls":{"BP":"L","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L"},"Malt Jinja":{"DA":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"Malt Lima":{"DA":"G","MT":"L","MG":"G","MDM":"G","QL":"G","SF":"G"},"Malt Lusaka":{"DA":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"Malt Moshi":{"DA":"G","MG":"G","MDM":"G","SF":"G"},"Malt Musa":{"DA":"G","MT":"G","MG":"G","MDM":"G","QL":"L","SF":"G"},"Malt Navegantes":{"DA":"G","MT":"G","MG":"G","MDM":"G","QL":"L","SF":"G"},"Malt Pampa":{"MT":"G","MG":"G","QL":"G","SF":"G"},"Malt Passo Fundo":{"DA":"G","MT":"G","MG":"G","MDM":"G","QL":"L","SF":"G"},"Malt Paysandu":{"DA":"G","MT":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"Malt Tibito":{"MT":"L","MG":"G","QL":"G","SF":"G"},"Malt Tres Arroyos":{"DA":"G","MT":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"Malt Zacatecas":{"DA":"G","MT":"L","MG":"G","MDM":"G","QL":"G","SF":"G"},"Manantial":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Manaus":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Maputo":{"DA":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"Marracuene":{"BP":"L","DA":"G","MG":"G","MDM":"G","QL":"L","SF":"G"},"Mazatlan":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Mbarara":{"DA":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"Mbeya":{"BP":"G","DA":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"Medellin":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Meerut":{"MG":"L","QL":"G"},"Mendoza":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Merida":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Mexico APAN":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Mexico City Research Pilot Brewery":{"MG":"G","SF":"G"},"Mexico Plant":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Montevideo":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Montreal":{"BP":"G","DA":"G","MG":"G","MDM":"G","QL":"L"},"Motupe":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Mudanjiang":{"DA":"L","MG":"L","QL":"L","SF":"L"},"Munich":{"BP":"L","DA":"G","MT":"L","MDM":"G","PP":"L","QL":"L"},"Mwanza":{"BP":"G","DA":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"MyPhuoc":{"DA":"G","MG":"L","MDM":"G","QL":"G"},"Mysore":{"DA":"G","MG":"L","MDM":"G","QL":"G"},"Namibia":{"BP":"L","DA":"G","MG":"G","MDM":"G","QL":"L","SF":"G"},"Nampula":{"BP":"L","DA":"G","MG":"G","MDM":"G","QL":"L","SF":"G"},"Nanchang 3":{"DA":"L","MG":"L","MDM":"G","QL":"L","SF":"L"},"Nanning":{"DA":"L","MG":"L","QL":"L","SF":"L"},"Nantong":{"DA":"L","MG":"L","MDM":"G","QL":"L","SF":"L"},"Ndola":{"DA":"G","MG":"G","MDM":"G","QL":"G","SF":"G"},"Newlands":{"BP":"L","DA":"G","MG":"G","MDM":"G","QL":"L","SF":"L"},"Ningbo":{"DA":"L","MG":"L","QL":"L","SF":"L"},"Onitsha":{"BP":"L","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Panama":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Pernambuco":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Pirai":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Polokwane":{"BP":"L","DA":"G","MG":"G","MDM":"G","QL":"L","SF":"L"},"Ponta Grossa":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Port Harcourt":{"BP":"L","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Prospecton":{"BP":"L","DA":"G","MG":"G","MDM":"G","QL":"L","SF":"L"},"Putian":{"DA":"L","MT":"G","MG":"L","MDM":"G","QL":"L","SF":"L"},"Quilmes":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Quito":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Rice Jonesboro":{"BP":"L","MG":"G","PP":"L","QL":"L"},"Rio de Janeiro":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Rosslyn":{"BP":"L","DA":"G","MG":"G","MDM":"G","QL":"L","SF":"L"},"SAZ Zitec Research Pilot Brewery":{"MT":"G","MG":"G","SF":"G"},"Samlesbury":{"BP":"L","DA":"G","MT":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"San Juan":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"San Pedro Sula":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"San Pedro Sula CSD":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Santa Cruz (BO)":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Santa Cruz (SABM)":{"BP":"L","DA":"G","MDM":"G","PP":"L","QL":"L"},"Santiago":{"BP":"G","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Santo Domingo":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Sapucaia":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Sergipe":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Sete Lagoas":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Shiliang":{"DA":"L","MG":"L","MDM":"G","QL":"L","SF":"L"},"Sint-Pieters-Leeuw":{"DA":"G","MDM":"G","QL":"G","SF":"G"},"Sonipat":{"MG":"L","QL":"G"},"St. Louis":{"BP":"G","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L"},"St. Louis Research Pilot Brewery":{"BP":"L","MG":"G","PP":"L","QL":"L"},"Suqian":{"BP":"G","DA":"L","MT":"G","MG":"L","MDM":"G","QL":"L","SF":"L"},"Sur":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Tangshan 2":{"DA":"L","MG":"L","MDM":"G","QL":"L","SF":"L"},"Tanzania Distilleries":{"MG":"G","QL":"G","SF":"G"},"Tarija":{"DA":"G","MT":"G","MG":"G","MDM":"G","QL":"L","SF":"G"},"Teresina":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Tocancipa":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Tocancipa Research Pilot Brewery":{"MG":"G","SF":"G"},"Torreon":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Turning Point":{"MG":"G"},"Tuxtepec":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Uberlandia":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"VSIP":{"DA":"G","MT":"G","MG":"L","MDM":"G","QL":"G"},"Valle":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Viamao":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Wenzhou":{"BP":"G","DA":"L","MT":"G","MG":"L","MDM":"G","QL":"L","SF":"L"},"Wernigerode":{"BP":"L","DA":"G","MDM":"G","PP":"L","QL":"L"},"Wicked Weed":{"BP":"L","MG":"G","PP":"L","QL":"L"},"Williamsburg":{"BP":"G","DA":"G","MG":"G","MDM":"G","PP":"L","QL":"L"},"Wugang":{"DA":"L","MG":"L","MDM":"G","QL":"L","SF":"L"},"Wuhan":{"DA":"L","MT":"G","MG":"L","MDM":"G","QL":"L","SF":"L"},"Xinxiang":{"BP":"G","DA":"L","MT":"G","MG":"L","MDM":"G","QL":"L","SF":"L"},"Xinyang":{"DA":"L","MG":"L","QL":"L","SF":"L"},"Yanji":{"DA":"L","MG":"L","MDM":"G","QL":"L","SF":"L"},"Yingkou":{"DA":"L","MG":"L","MDM":"G","QL":"L","SF":"L"},"Ypane":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Zacapa":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Zacatecas":{"BP":"L","DA":"G","MT":"L","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"L"},"Zarate":{"BP":"G","DA":"G","MT":"G","MG":"G","MDM":"G","PP":"L","QL":"L","SF":"G"},"Zarate Research Pilot Brewery":{"MG":"G","SF":"G"},"Zhangzhou":{"DA":"L","MG":"L","MDM":"G","QL":"L","SF":"L"},"Ziyang":{"DA":"L","MG":"L","MDM":"G","QL":"L","SF":"L"}};

const getSiteDomainType = (siteName: string, domainShort: string): 'G' | 'L' | '-' => {
  return (SITE_DOMAIN_TYPE[siteName]?.[domainShort] as 'G' | 'L' | undefined) ?? '-';
};


// ============================================================================
// MATURITY_DETAIL — N3/N4 capability-based maturity assessment (148 sites)
// Source: scripts/generate_maturity_detail.py from capability matrix
// N4 weights: Functional=2.0, Operational=1.0, Administrative=0.5
// Level gates: L1≥60%, L2≥75%, L3≥85%, L4≥90%
// ============================================================================
interface MaturityDetailLevel {
  vacuous: boolean;
  frac: number | null;
  pass: boolean;
}
interface MaturityDetailDomain {
  score: number;
  type: 'G' | 'L';
  levels: {
    L1: MaturityDetailLevel;
    L2: MaturityDetailLevel;
    L3: MaturityDetailLevel;
    L4: MaturityDetailLevel;
  };
}
interface MaturityDetailSite {
  zone: string;
  score: number;
  domains: Record<string, MaturityDetailDomain | null>;
}
const MATURITY_DETAIL: Record<string, MaturityDetailSite> = {"Accra":{"zone":"AFR","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8238,"pass":true},"L2":{"vacuous":false,"frac":0.9259,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7188,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Agudos":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Alrode":{"zone":"AFR","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8238,"pass":true},"L2":{"vacuous":false,"frac":0.9259,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7188,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Aquiraz":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Arequipa":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Ate":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Aurangabad":{"zone":"APAC","domains":{"BP":null,"DA":null,"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":null,"PP":null,"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6054,"pass":true},"L2":{"vacuous":false,"frac":0.8043,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":null},"score":2},"Baldwinsville":{"zone":"NAZ","domains":{"BP":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5681,"pass":false},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.0741,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8654,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":1,"levels":{"L1":{"vacuous":false,"frac":0.9326,"pass":true},"L2":{"vacuous":false,"frac":0.6,"pass":false},"L3":{"vacuous":false,"frac":0.3972,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9062,"pass":true},"L2":{"vacuous":false,"frac":0.9143,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":0},"Baoding":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Barranquilla":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Beira":{"zone":"AFR","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5189,"pass":false},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":0},"Boyaca":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Bremen":{"zone":"EUR","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9531,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.8148,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":1,"levels":{"L1":{"vacuous":false,"frac":0.7688,"pass":true},"L2":{"vacuous":false,"frac":0.5714,"pass":false},"L3":{"vacuous":false,"frac":0.2278,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":null,"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.4579,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9135,"pass":true},"L2":{"vacuous":false,"frac":0.7826,"pass":true},"L3":{"vacuous":false,"frac":0.9375,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":1},"Bucaramanga":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Camacari":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Cartersville":{"zone":"NAZ","domains":{"BP":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5681,"pass":false},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.0741,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8654,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":1,"levels":{"L1":{"vacuous":false,"frac":0.9326,"pass":true},"L2":{"vacuous":false,"frac":0.6,"pass":false},"L3":{"vacuous":false,"frac":0.3972,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9062,"pass":true},"L2":{"vacuous":false,"frac":0.9143,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":0},"Chamdor":{"zone":"AFR","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8238,"pass":true},"L2":{"vacuous":false,"frac":0.9259,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7188,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Charminar":{"zone":"APAC","domains":{"BP":null,"DA":null,"UT":null,"MT":null,"MG":null,"MDM":null,"PP":null,"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6054,"pass":true},"L2":{"vacuous":false,"frac":0.8043,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":null},"score":2},"Cheongwon":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6054,"pass":true},"L2":{"vacuous":false,"frac":0.8043,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":null},"score":2},"Cochabamba":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"G"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Columbus":{"zone":"NAZ","domains":{"BP":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5681,"pass":false},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.0741,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8654,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":1,"levels":{"L1":{"vacuous":false,"frac":0.9326,"pass":true},"L2":{"vacuous":false,"frac":0.6,"pass":false},"L3":{"vacuous":false,"frac":0.3972,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9062,"pass":true},"L2":{"vacuous":false,"frac":0.9143,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":0},"Cordoba":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Corrientes":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Creston":{"zone":"NAZ","domains":{"BP":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5681,"pass":false},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.0741,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8654,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9062,"pass":true},"L2":{"vacuous":false,"frac":0.9143,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":0},"Cuiaba":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Curitibana":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Cusco":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Dar es Salaam":{"zone":"AFR","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8263,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.8148,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5189,"pass":false},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":0},"Dommelen":{"zone":"EUR","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9531,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.8148,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":1,"levels":{"L1":{"vacuous":false,"frac":0.7688,"pass":true},"L2":{"vacuous":false,"frac":0.5714,"pass":false},"L3":{"vacuous":false,"frac":0.2278,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":null,"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.4579,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9135,"pass":true},"L2":{"vacuous":false,"frac":0.7826,"pass":true},"L3":{"vacuous":false,"frac":0.9375,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":1},"Edmonton":{"zone":"NAZ","domains":{"BP":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5681,"pass":false},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.0741,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8654,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9062,"pass":true},"L2":{"vacuous":false,"frac":0.9143,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":0},"El Alto":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Equatorial":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Eswatini":{"zone":"AFR","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5189,"pass":false},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":0},"Fort Collins":{"zone":"NAZ","domains":{"BP":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5681,"pass":false},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.0741,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8654,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":1,"levels":{"L1":{"vacuous":false,"frac":0.9326,"pass":true},"L2":{"vacuous":false,"frac":0.6,"pass":false},"L3":{"vacuous":false,"frac":0.3972,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9062,"pass":true},"L2":{"vacuous":false,"frac":0.9143,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":0},"Foshan":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9796,"pass":true},"L3":{"vacuous":false,"frac":0.6139,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Gateway":{"zone":"AFR","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8238,"pass":true},"L2":{"vacuous":false,"frac":0.9259,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.6682,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7188,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Guadalajara":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Guarulhos":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Guayaquil":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Gwangju":{"zone":"APAC","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9585,"pass":true},"L2":{"vacuous":false,"frac":0.9259,"pass":true},"L3":{"vacuous":false,"frac":0.9091,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":2},"Halifax":{"zone":"NAZ","domains":{"BP":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5681,"pass":false},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.0741,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8654,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9062,"pass":true},"L2":{"vacuous":false,"frac":0.9143,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":0},"Harbin 2":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9796,"pass":true},"L3":{"vacuous":false,"frac":0.6139,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Hato Nuevo":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Hoegaarden":{"zone":"EUR","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9531,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.8148,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.8624,"pass":true},"L3":{"vacuous":false,"frac":0.2554,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":null,"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.4579,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9135,"pass":true},"L2":{"vacuous":false,"frac":0.7826,"pass":true},"L3":{"vacuous":false,"frac":0.9375,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":2},"Houston":{"zone":"NAZ","domains":{"BP":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5681,"pass":false},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.0741,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8654,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":1,"levels":{"L1":{"vacuous":false,"frac":0.9326,"pass":true},"L2":{"vacuous":false,"frac":0.6,"pass":false},"L3":{"vacuous":false,"frac":0.3972,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9062,"pass":true},"L2":{"vacuous":false,"frac":0.9143,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":0},"Huachipa":{"zone":"SAZ","domains":{"BP":null,"DA":null,"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":null,"PP":null,"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Huari":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Hyderabad":{"zone":"APAC","domains":{"BP":null,"DA":null,"UT":null,"MT":null,"MG":null,"MDM":null,"PP":null,"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6054,"pass":true},"L2":{"vacuous":false,"frac":0.8043,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":null},"score":2},"Ibhayi":{"zone":"AFR","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8238,"pass":true},"L2":{"vacuous":false,"frac":0.9259,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7188,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Icheon":{"zone":"APAC","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9585,"pass":true},"L2":{"vacuous":false,"frac":0.9259,"pass":true},"L3":{"vacuous":false,"frac":0.9091,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":2},"Ilesa":{"zone":"AFR","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8238,"pass":true},"L2":{"vacuous":false,"frac":0.9259,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.6682,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7188,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Ind La Constancia":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Ind La Constancia CSD":{"zone":"MAZ","domains":{"BP":null,"DA":null,"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":null,"PP":null,"QL":{"score":1,"levels":{"L1":{"vacuous":false,"frac":0.6541,"pass":true},"L2":{"vacuous":false,"frac":0.7391,"pass":false},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":1},"Ind La Constancia Water":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":null,"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":null,"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Issum":{"zone":"EUR","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9531,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.8148,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":null,"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.4579,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9135,"pass":true},"L2":{"vacuous":false,"frac":0.7826,"pass":true},"L3":{"vacuous":false,"frac":0.9375,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":2},"Jacarei":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Jacksonville":{"zone":"NAZ","domains":{"BP":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5681,"pass":false},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.0741,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8654,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":1,"levels":{"L1":{"vacuous":false,"frac":0.9326,"pass":true},"L2":{"vacuous":false,"frac":0.6,"pass":false},"L3":{"vacuous":false,"frac":0.3972,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9062,"pass":true},"L2":{"vacuous":false,"frac":0.9143,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":0},"Jaguariuna":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Jiamusi":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Jinja":{"zone":"AFR","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5189,"pass":false},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":0},"Jinshibai":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Jinzhou":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Jishui":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Jundiai":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Jupille":{"zone":"EUR","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9531,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.8148,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":1,"levels":{"L1":{"vacuous":false,"frac":0.7688,"pass":true},"L2":{"vacuous":false,"frac":0.5714,"pass":false},"L3":{"vacuous":false,"frac":0.2278,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":null,"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.4579,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9135,"pass":true},"L2":{"vacuous":false,"frac":0.7826,"pass":true},"L3":{"vacuous":false,"frac":0.9375,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":1},"Kgalagadi":{"zone":"AFR","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5189,"pass":false},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":0},"Kunming":{"zone":"APAC","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9484,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.7407,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"La Paz":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Lages":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Las Palmas":{"zone":"EUR","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9531,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.8148,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":null,"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.4579,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9135,"pass":true},"L2":{"vacuous":false,"frac":0.7826,"pass":true},"L3":{"vacuous":false,"frac":0.9375,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":2},"Lesotho":{"zone":"AFR","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5189,"pass":false},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":0},"Leuven":{"zone":"EUR","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9531,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.8148,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":1,"levels":{"L1":{"vacuous":false,"frac":0.7688,"pass":true},"L2":{"vacuous":false,"frac":0.5714,"pass":false},"L3":{"vacuous":false,"frac":0.2278,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":null,"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.4579,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9135,"pass":true},"L2":{"vacuous":false,"frac":0.7826,"pass":true},"L3":{"vacuous":false,"frac":0.9375,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":1},"London":{"zone":"NAZ","domains":{"BP":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5681,"pass":false},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.0741,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8654,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9062,"pass":true},"L2":{"vacuous":false,"frac":0.9143,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":0},"Los Angeles":{"zone":"NAZ","domains":{"BP":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5681,"pass":false},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.0741,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8654,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":1,"levels":{"L1":{"vacuous":false,"frac":0.9326,"pass":true},"L2":{"vacuous":false,"frac":0.6,"pass":false},"L3":{"vacuous":false,"frac":0.3972,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9062,"pass":true},"L2":{"vacuous":false,"frac":0.9143,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":0},"Lusaka":{"zone":"AFR","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5189,"pass":false},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":0},"Macacu":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Magor":{"zone":"EUR","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9531,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.8148,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":1,"levels":{"L1":{"vacuous":false,"frac":0.7688,"pass":true},"L2":{"vacuous":false,"frac":0.5714,"pass":false},"L3":{"vacuous":false,"frac":0.2278,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":null,"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.4579,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9135,"pass":true},"L2":{"vacuous":false,"frac":0.7826,"pass":true},"L3":{"vacuous":false,"frac":0.9375,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":1},"Manaus":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Maputo":{"zone":"AFR","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5189,"pass":false},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":0},"Marracuene":{"zone":"AFR","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8238,"pass":true},"L2":{"vacuous":false,"frac":0.9259,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7188,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Mazatlan":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Mbarara":{"zone":"AFR","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5189,"pass":false},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":0},"Mbeya":{"zone":"AFR","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8263,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.8148,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5189,"pass":false},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":0},"Medellin":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Meerut":{"zone":"APAC","domains":{"BP":null,"DA":null,"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":null,"PP":null,"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6054,"pass":true},"L2":{"vacuous":false,"frac":0.8043,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":null},"score":2},"Mendoza":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Merida":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Mexico APAN":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Mexico Plant":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Montreal":{"zone":"NAZ","domains":{"BP":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5681,"pass":false},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.0741,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8654,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9062,"pass":true},"L2":{"vacuous":false,"frac":0.9143,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":0},"Motupe":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Mudanjiang":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":null,"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Munich":{"zone":"EUR","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9531,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.8148,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.8624,"pass":true},"L3":{"vacuous":false,"frac":0.2554,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":null,"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.4579,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9135,"pass":true},"L2":{"vacuous":false,"frac":0.7826,"pass":true},"L3":{"vacuous":false,"frac":0.9375,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":2},"Mwanza":{"zone":"AFR","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8263,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.8148,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5189,"pass":false},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":0},"MyPhuoc":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6054,"pass":true},"L2":{"vacuous":false,"frac":0.8043,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":null},"score":2},"Mysore":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6054,"pass":true},"L2":{"vacuous":false,"frac":0.8043,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":null},"score":2},"Namibia":{"zone":"AFR","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8238,"pass":true},"L2":{"vacuous":false,"frac":0.9259,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7188,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Nampula":{"zone":"AFR","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8238,"pass":true},"L2":{"vacuous":false,"frac":0.9259,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7188,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Nanning":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":null,"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Nantong":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Newlands":{"zone":"AFR","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8238,"pass":true},"L2":{"vacuous":false,"frac":0.9259,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7188,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Onitsha":{"zone":"AFR","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8238,"pass":true},"L2":{"vacuous":false,"frac":0.9259,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.6682,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7188,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Panama":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Pernambuco":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Pirai":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Polokwane":{"zone":"AFR","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8238,"pass":true},"L2":{"vacuous":false,"frac":0.9259,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7188,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Ponta Grossa":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Port Harcourt":{"zone":"AFR","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8238,"pass":true},"L2":{"vacuous":false,"frac":0.9259,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.6682,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7188,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Prospecton":{"zone":"AFR","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8238,"pass":true},"L2":{"vacuous":false,"frac":0.9259,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7188,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Putian":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9796,"pass":true},"L3":{"vacuous":false,"frac":0.6139,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Quilmes":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Quito":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Rio de Janeiro":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Rosslyn":{"zone":"AFR","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8238,"pass":true},"L2":{"vacuous":false,"frac":0.9259,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7561,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9808,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7188,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Samlesbury":{"zone":"EUR","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9531,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.8148,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":1,"levels":{"L1":{"vacuous":false,"frac":0.7688,"pass":true},"L2":{"vacuous":false,"frac":0.5714,"pass":false},"L3":{"vacuous":false,"frac":0.2278,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":null,"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.4579,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9135,"pass":true},"L2":{"vacuous":false,"frac":0.7826,"pass":true},"L3":{"vacuous":false,"frac":0.9375,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":1},"San Juan":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"San Pedro Sula":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"San Pedro Sula CSD":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Santo Domingo":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Sapucaia":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Sergipe":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Sete Lagoas":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Shiliang":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Sonipat":{"zone":"APAC","domains":{"BP":null,"DA":null,"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":null,"PP":null,"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6054,"pass":true},"L2":{"vacuous":false,"frac":0.8043,"pass":true},"L3":{"vacuous":false,"frac":0.1875,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"SF":null},"score":2},"St. Louis":{"zone":"NAZ","domains":{"BP":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5681,"pass":false},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.0741,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8654,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":1,"levels":{"L1":{"vacuous":false,"frac":0.9326,"pass":true},"L2":{"vacuous":false,"frac":0.6,"pass":false},"L3":{"vacuous":false,"frac":0.3972,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9062,"pass":true},"L2":{"vacuous":false,"frac":0.9143,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":0},"Suqian":{"zone":"APAC","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9484,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.7407,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9796,"pass":true},"L3":{"vacuous":false,"frac":0.6139,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Sur":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Tangshan 2":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Teresina":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Tocancipa":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Torreon":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Tuxtepec":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Uberlandia":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Viamao":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Wenzhou":{"zone":"APAC","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9484,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.7407,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9796,"pass":true},"L3":{"vacuous":false,"frac":0.6139,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Wernigerode":{"zone":"EUR","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9531,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.8148,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":null,"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":0.4579,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9135,"pass":true},"L2":{"vacuous":false,"frac":0.7826,"pass":true},"L3":{"vacuous":false,"frac":0.9375,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":2},"Williamsburg":{"zone":"NAZ","domains":{"BP":{"score":0,"levels":{"L1":{"vacuous":false,"frac":0.5681,"pass":false},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.0741,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8654,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":1,"levels":{"L1":{"vacuous":false,"frac":0.9326,"pass":true},"L2":{"vacuous":false,"frac":0.6,"pass":false},"L3":{"vacuous":false,"frac":0.3972,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9062,"pass":true},"L2":{"vacuous":false,"frac":0.9143,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":null},"score":0},"Wugang":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Wuhan":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9796,"pass":true},"L3":{"vacuous":false,"frac":0.6139,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Xinxiang":{"zone":"APAC","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9484,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.7407,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9796,"pass":true},"L3":{"vacuous":false,"frac":0.6139,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Xinyang":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":null,"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Yingkou":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Ypane":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Zacapa":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Zacatecas":{"zone":"MAZ","domains":{"BP":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9482,"pass":true},"L2":{"vacuous":false,"frac":1.0,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.7073,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":false,"frac":0.9031,"pass":true},"L3":{"vacuous":false,"frac":0.4672,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"L"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.7885,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.981,"pass":true},"L3":{"vacuous":false,"frac":0.3925,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9141,"pass":true},"L2":{"vacuous":false,"frac":0.8,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Zarate":{"zone":"SAZ","domains":{"BP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6432,"pass":true},"L2":{"vacuous":false,"frac":0.8462,"pass":true},"L3":{"vacuous":false,"frac":0.4444,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":1.0,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"UT":null,"MT":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8313,"pass":true},"L2":{"vacuous":false,"frac":0.784,"pass":true},"L3":{"vacuous":false,"frac":0.5444,"pass":false},"L4":{"vacuous":false,"frac":1.0,"pass":true}},"type":"G"},"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"MDM":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8269,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9101,"pass":true},"L2":{"vacuous":false,"frac":0.8286,"pass":true},"L3":{"vacuous":false,"frac":0.3832,"pass":false},"L4":{"vacuous":false,"frac":0.0,"pass":false}},"type":"L"},"QL":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6324,"pass":true},"L2":{"vacuous":false,"frac":0.8913,"pass":true},"L3":{"vacuous":false,"frac":0.0625,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.6736,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"}},"score":2},"Zhangzhou":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2},"Ziyang":{"zone":"APAC","domains":{"BP":null,"DA":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8049,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"UT":null,"MT":null,"MG":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.8961,"pass":true},"L2":{"vacuous":false,"frac":0.977,"pass":true},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"MDM":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.9423,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"G"},"PP":null,"QL":{"score":4,"levels":{"L1":{"vacuous":false,"frac":0.8438,"pass":true},"L2":{"vacuous":false,"frac":0.8857,"pass":true},"L3":{"vacuous":false,"frac":1.0,"pass":true},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"},"SF":{"score":2,"levels":{"L1":{"vacuous":false,"frac":0.9583,"pass":true},"L2":{"vacuous":true,"pass":true,"frac":null},"L3":{"vacuous":false,"frac":0.0,"pass":false},"L4":{"vacuous":true,"pass":true,"frac":null}},"type":"L"}},"score":2}};

const CSV_DATA = `Zone,Site,Country,Volume,BP,DA,UT,MT,MG,MDM,PP,QL,SF,Score
MAZ,Zacatecas,Mexico,21490232,2,2,2,2,2,2,2,2,2,2
MAZ,Tocancipa,Colombia,11877306,2,2,2,2,2,2,2,2,2,2
MAZ,Mexico APAN,Mexico,11762721,2,2,2,2,2,2,2,2,2,2
NAZ,St. Louis,USA,11625432,2,2,2,2,2,2,2,2,2,2
SAZ,Rio de Janeiro,Brazil,11195323,2,2,2,2,2,2,2,2,2,2
MAZ,Tuxtepec,Mexico,11116745,2,2,2,2,2,2,2,2,2,2
NAZ,Houston,USA,10631547,2,2,2,2,2,2,2,2,2,2
MAZ,Mexico Plant,Mexico,10452776,2,2,2,2,2,2,2,2,2,2
SAZ,Sete Lagoas,Brazil,9710192,2,2,2,2,2,2,2,2,2,2
APAC,Putian,China,9361612,2,3,2,2,3,2,2,2,2,2
AFR,Accra,Ghana,8268546,3,2,2,2,2,2,2,3,2,2
MAZ,San Pedro Sula CSD,Honduras,8129123,2,2,2,2,2,2,2,2,2,2
NAZ,Jacksonville,USA,8093143,2,2,2,2,2,2,2,2,2,2
AFR,Alrode,South Africa,8069020,2,2,2,2,2,2,2,3,2,2
APAC,Foshan,China,7956210,2,3,3,2,3,3,2,2,2,2
SAZ,Pernambuco,Brazil,7763920,2,2,2,2,2,2,2,2,2,2
NAZ,Columbus,USA,7675003,2,2,2,2,2,2,2,2,2,2
MAZ,Ate,Peru,7547062,2,2,2,2,2,2,2,2,2,2
NAZ,Fort Collins,USA,7422385,2,2,2,2,2,2,2,2,2,2
NAZ,Baldwinsville,USA,7170161,2,2,1,2,2,2,2,2,2,1
NAZ,Los Angeles,USA,7146842,2,2,2,2,2,2,2,2,2,2
SAZ,Jundiai,Brazil,7004740,2,2,2,2,2,2,2,2,2,2
SAZ,Jacarei,Brazil,6971809,2,2,2,2,2,2,2,2,2,2
NAZ,Cartersville,USA,6927016,3,2,2,2,2,2,2,2,2,2
SAZ,Itapissuma,Brazil,6600077,2,2,2,2,2,2,2,2,2,2
SAZ,Uberlandia,Brazil,6182294,2,2,2,2,2,2,2,2,2,2
SAZ,Agudos,Brazil,6147209,2,2,2,2,2,2,2,2,2,2
EUR,Magor,United Kingdom,6011596,2,2,2,2,1,2,2,2,2,1
NAZ,Williamsburg,USA,5926289,2,2,1,2,2,2,2,2,2,1
SAZ,Jaguariuna,Brazil,5877702,2,2,2,2,2,2,2,2,2,2
SAZ,Pirai,Brazil,5571090,2,2,2,2,2,2,2,2,2,2
APAC,Icheon,South Korea,5400783,1,2,2,2,2,2,0,2,2,0
EUR,Leuven,Belgium,5223871,2,2,2,2,1,2,2,2,2,1
AFR,Prospecton,South Africa,5233078,3,2,2,2,2,2,2,3,2,2
SAZ,Viamao,Brazil,4937776,2,2,2,2,2,2,2,2,2,2
SAZ,Camacari,Brazil,4936812,2,2,2,2,2,2,2,2,2,2
AFR,Inanda,South Africa,4704538,1,2,2,2,2,2,2,2,2,2
SAZ,Aquiraz,Brazil,4703919,2,2,2,2,2,2,2,2,2,2
SAZ,Sur,Argentina,4688943,2,2,2,2,2,2,2,2,2,2
SAZ,Quilmes,Argentina,4654841,2,2,2,2,2,2,2,2,2,2
MAZ,Santo Domingo,Dominican Republic,4541107,2,2,2,2,2,2,2,2,2,2
MAZ,Ind La Constancia Water,El Salvador,4427409,2,0,2,2,1,2,0,2,2,0
MAZ,Guadalajara,Mexico,4349004,2,2,2,2,2,2,2,2,2,2
MAZ,Boyaca,Colombia,4276591,2,2,2,2,2,2,2,2,2,2
EUR,Bremen,Germany,4255902,1,2,2,2,1,2,2,2,2,1
MAZ,Barranquilla,Colombia,4200971,2,2,2,2,2,2,2,2,2,2
MAZ,Ind La Constancia CSD,El Salvador,4153127,2,0,2,2,1,2,0,2,2,0
SAZ,Ponta Grossa,Brazil,4083690,2,2,2,2,2,2,2,2,2,2
AFR,Newlands,South Africa,4073762,3,2,2,2,2,2,2,3,2,2
EUR,Samlesbury,United Kingdom,3932263,1,2,2,2,1,2,2,2,2,1
MAZ,Medellin,Colombia,3930434,2,2,2,2,2,2,2,2,2,2
APAC,Wuhan,China,3737412,2,3,3,2,3,3,2,2,2,2
SAZ,Ypane,Paraguay,3596873,2,2,2,2,2,2,2,2,2,2
EUR,Jupille,Belgium,3593528,2,2,2,2,1,2,2,2,2,1
SAZ,Sergipe,Brazil,3552437,2,2,2,2,2,2,2,2,2,2
SAZ,Zarate,Argentina,3447034,2,2,2,2,2,2,2,2,2,2
SAZ,Quilmes 2,Argentina,3309284,2,2,2,2,2,2,2,2,2,2
SAZ,Equatorial,Brazil,3279525,2,2,2,2,2,2,2,2,2,2
APAC,Jinshibai,China,3266999,2,3,3,2,3,3,2,2,2,2
MAZ,Guayaquil,Ecuador,3257552,2,2,2,2,2,2,2,2,2,2
SAZ,Cachoeiras,Brazil,3237498,2,2,2,2,2,2,2,2,2,2
APAC,Shiliang,China,3112540,2,3,3,2,3,3,2,2,3,2
AFR,Chamdor,South Africa,3073102,3,2,2,2,2,2,2,3,2,2
MAZ,Motupe,Peru,3072045,2,2,2,2,2,2,2,2,2,2
NAZ,London,Canada,3041422,1,2,2,2,1,2,2,0,2,1
APAC,Gwangju,South Korea,2968668,1,2,2,2,2,2,0,2,2,0
APAC,Cheongwon,South Korea,2959517,0,2,2,2,2,2,0,2,2,0
APAC,Harbin 2,China,2897663,2,3,3,2,3,3,2,2,2,2
SAZ,Lages,Brazil,2869908,2,2,2,2,2,2,2,2,2,2
MAZ,Merida,Mexico,2848134,2,2,2,2,2,2,2,2,2,2
APAC,Ziyang,China,2844535,2,3,3,2,3,3,2,2,3,2
AFR,Dar es Salaam,Tanzania,2805741,2,2,2,2,2,2,2,2,2,2
MAZ,Torreon,Mexico,2797436,2,2,2,2,2,2,2,2,2,2
APAC,Suqian,China,2762633,2,3,3,2,3,3,2,2,3,2
APAC,Wenzhou,China,2750215,2,3,3,2,3,3,2,2,3,2
SAZ,Guarulhos,Brazil,2698383,2,2,2,2,2,2,2,2,2,2
SAZ,Cuiaba,Brazil,2613994,2,2,2,2,2,2,2,2,2,2
NAZ,Montreal,Canada,2612694,1,2,2,2,1,2,2,0,2,1
SAZ,Teresina,Brazil,2494659,2,2,2,2,2,2,2,2,2,2
SAZ,Sapucaia,Brazil,2392284,0,2,2,2,2,2,2,2,2,2
SAZ,Macacu,Brazil,2369745,2,2,2,2,2,2,2,2,2,2
MAZ,Quito,Ecuador,2252976,2,2,2,2,2,2,2,2,2,2
AFR,Gateway,Nigeria,2251714,3,2,2,2,2,2,2,3,2,2
APAC,Nanchang 1,China,2114522,2,3,3,2,2,3,2,2,2,2
MAZ,San Pedro Sula,Honduras,2053369,2,2,2,2,2,2,2,2,2,2
EUR,Munich,Germany,2041558,1,2,2,2,1,2,2,1,2,1
SAZ,Manaus,Brazil,2041326,2,2,2,2,2,2,2,2,2,2
APAC,Nanning,China,1940444,2,3,3,2,3,3,2,2,2,2
MAZ,Bucaramanga,Colombia,1936433,2,2,2,2,2,2,2,2,2,2
APAC,Xinxiang,China,1920884,2,3,3,2,3,3,2,2,3,2
EUR,Wernigerode,Germany,1897050,1,2,2,2,1,2,2,1,2,1
MAZ,San Juan,Peru,1883825,2,2,2,2,2,2,2,2,2,2
APAC,Zhangzhou,China,1835676,2,3,3,2,3,3,1,2,3,2
APAC,Tangshan 2,China,1804951,2,3,3,2,3,3,2,2,3,2
MAZ,Ind La Constancia,El Salvador,1731889,2,2,2,2,2,2,2,2,2,2
MAZ,Panama,Panama,1707242,2,2,2,2,2,2,2,2,2,2
SAZ,Mendoza,Argentina,1676116,2,2,2,2,2,2,2,2,2,2
AFR,Ibhayi,South Africa,1666051,3,2,2,2,2,2,2,3,2,2
AFR,Onitsha,Nigeria,1611235,3,2,2,2,2,2,2,3,2,2
MAZ,Arequipa,Peru,1606665,2,2,2,2,2,2,2,2,2,2
AFR,Marracuene,Mozambique,1588950,3,2,2,2,2,2,2,3,2,2
SAZ,Santa Cruz BO,Bolivia,1555839,2,2,2,2,2,2,2,2,2,2
MAZ,Armenia,Colombia,1512540,2,2,2,2,2,2,2,2,2,2
AFR,Jinja,Uganda,1469800,1,2,2,2,2,2,2,0,2,1
AFR,Ilesa,Nigeria,1435063,3,2,2,2,2,2,2,2,2,2
NAZ,Edmonton,Canada,1365943,1,2,2,2,1,2,2,0,2,1
AFR,Lusaka,Zambia,1365641,1,2,2,2,2,2,2,2,2,1
APAC,Baoding,China,1352928,2,3,3,2,3,3,2,2,3,2
SAZ,Corrientes,Argentina,1352486,2,2,2,2,2,2,2,2,2,2
MAZ,Hato Nuevo,Dominican Republic,1345154,2,2,2,2,2,2,2,2,2,2
SAZ,El Alto,Bolivia,1296070,2,2,2,2,2,2,2,2,2,2
SAZ,Curitibana,Brazil,1286150,0,2,2,2,2,2,2,2,2,2
AFR,Maputo,Mozambique,1285760,1,2,2,2,2,2,2,2,2,1
AFR,Port Harcourt,Nigeria,1274513,3,2,2,2,2,2,2,3,2,2
APAC,Aurangabad,India,1271625,0,0,1,1,0,0,1,0,1,0
AFR,Ilorin,Nigeria,1331782,1,2,2,2,2,2,2,2,2,1
EUR,Dommelen,Netherlands,1382165,1,2,2,2,1,2,2,1,2,1
SAZ,Tucuman,Argentina,1254087,2,2,2,2,2,2,2,2,2,2
EUR,Hoegaarden,Belgium,1154717,1,2,2,2,1,2,2,1,2,1
APAC,Jinzhou,China,1110825,2,3,3,2,3,3,1,2,3,1
APAC,Mysore,India,1075882,0,0,1,1,0,0,1,0,1,0
MAZ,Cusco,Peru,1068857,2,2,2,2,2,2,2,2,2,2
APAC,Nantong,China,1038747,2,3,3,2,3,3,2,2,3,2
SAZ,Cochabamba,Bolivia,1030936,2,2,2,2,2,2,2,2,2,2
APAC,Sonipat,India,1016449,0,0,1,1,0,0,1,0,1,0
SAZ,Huachipa,Peru,987693,2,2,2,2,2,2,2,2,2,2
AFR,Mbarara,Uganda,979938,1,2,2,2,2,2,2,0,2,1
APAC,Jishui,China,937258,2,3,3,2,3,3,2,2,3,2
AFR,Nampula,Mozambique,628699,3,2,2,2,2,2,2,3,2,2
APAC,Mudanjiang,China,764171,2,3,3,2,3,3,2,2,3,2
SAZ,Cordoba,Argentina,745018,2,2,2,2,2,2,2,2,2,2
MAZ,Mazatlan,Mexico,727620,2,2,2,2,2,2,2,2,2,2
SAZ,La Paz,Bolivia,712689,2,2,2,2,2,2,2,2,2,2
AFR,Mwanza,Tanzania,1058574,2,2,2,2,2,2,2,0,2,2
AFR,Mbeya,Tanzania,757159,2,2,2,2,2,2,2,0,2,2
APAC,Hyderabad,India,649833,0,0,1,1,0,0,1,0,1,0
APAC,Charminar,India,636120,0,0,1,1,0,0,1,0,1,0
APAC,Kunming,China,635021,2,3,3,2,3,3,2,2,3,2
AFR,Polokwane,South Africa,1630622,3,2,2,2,2,2,2,3,2,2
EUR,Las Palmas,Spain,609797,1,2,2,2,1,2,2,1,2,1
SAZ,Huari,Bolivia,603883,2,2,2,2,2,2,2,2,2,2
NAZ,Halifax,Canada,581503,1,2,2,2,1,2,2,0,2,1
AFR,Rosslyn2,South Africa,571761,2,2,2,2,2,2,2,2,2,2
APAC,Jiamusi,China,568202,2,3,3,2,3,3,2,2,3,2
APAC,Wugang,China,563192,2,3,3,2,3,3,2,2,3,2
APAC,Daqing,China,561401,2,3,3,2,3,3,2,2,3,2
APAC,Yingkou,China,557877,2,3,3,2,3,3,2,2,3,2
APAC,Xinyang,China,554297,2,3,3,2,3,3,2,2,3,2
NAZ,Creston,Canada,546005,1,2,2,2,1,2,2,0,2,1
APAC,HBP,Vietnam,466492,1,2,2,2,2,2,1,2,2,1
EUR,Issum,Germany,448881,1,2,2,2,1,2,2,1,2,1
APAC,Rohtak,India,402172,0,0,1,1,0,0,1,0,1,0
SAZ,Santa Cruz SABM,Bolivia,396645,2,2,2,2,2,2,2,2,2,2
APAC,MyPhuoc,Vietnam,379245,1,2,2,2,2,2,1,2,2,1
AFR,Eswatini,Swaziland,354230,1,2,2,2,1,2,2,1,2,1
MAZ,Zacapa,Guatemala,326265,2,2,2,2,2,2,2,2,2,2
AFR,Namibia,Namibia,310889,3,2,2,2,2,2,2,3,2,2
APAC,Meerut,India,170263,0,0,1,1,0,0,1,0,1,0
AFR,Kgalagadi,Botswana,797731,1,2,2,2,2,2,2,1,2,1
AFR,Lesotho,Lesotho,422520,1,2,2,2,2,2,2,0,2,1
AFR,Rosslyn,South Africa,9152428,2,2,2,2,2,2,2,2,2,2
AFR,Beira,Mozambique,6286999,2,2,2,2,2,2,2,2,2,2`;

// ============================================================================
// TYPES + PARSER
// ============================================================================
interface Site { zone:string; name:string; country:string; volume:number; group:string; scores:Record<string,number>; }

const DOMAIN_COLS: [string,number][] = [
  ["Brewing Performance",4],["Data Acquisition",5],["Utilities",6],["Maintenance",7],
  ["Management",8],["MasterData Management",9],["Packaging Performance",10],
  ["Quality",11],["Safety",12],["Total Global",13],
];
const parseCSV = (csv: string): Site[] =>
  csv.trim().split('\n').slice(1).map(line => {
    const c = line.split(',');
    const volume = parseInt(c[3],10)||0;
    const scores: Record<string,number> = {};
    DOMAIN_COLS.forEach(([n,i]) => { scores[n] = parseInt(c[i],10)||0; });
    return { zone:c[0], name:c[1], country:c[2], volume, group:getGroupFromVolume(volume), scores };
  });

const ALL_SITES: Site[] = parseCSV(CSV_DATA);

// Build cluster key: volume + maturity (e.g. G2_L2) or zone + volume + maturity (e.g. SAZ_G2_L2)
const getMaturityLevel = (site: Site): string => {
  const s = site.scores['Total Global'] ?? 0;
  return 'L' + Math.min(4, Math.max(0, Math.round(s)));
};

// Impact by maturity level only (L0..L4): for executive "does maturity correlate with results?"
interface ImpactByLevel {
  level: string;
  siteCount: number;
  withKpiCount: number;
  avgOse: number | null;
  avgVic: number | null;
  avgLifecycle: number | null;
  avgTtp: number | null;
  composite: number | null; // average of non-null KPIs, for bar scale
}

interface StatsAnalysis {
  correlation: number | null;
  byLevel: { level: string; mean: number | null; count: number }[];
  narrative: string;
  correlationOse?: number | null;
  correlationTtp?: number | null;
}
function computeStatsAnalysis(impactByLevel: ImpactByLevel[]): StatsAnalysis {
  const levels = impactByLevel.filter(i => i.composite != null && i.withKpiCount > 0);
  const n = levels.length;
  if (n < 2) {
    return {
      correlation: null,
      byLevel: impactByLevel.map(i => ({ level: i.level, mean: i.composite, count: i.withKpiCount })),
      narrative: n === 0 ? 'Dados insuficientes para análise estatística.' : 'É necessário mais de um nível com dados para correlacionar maturidade e resultado.',
    };
  }
  const levelNum = (l: string) => parseInt(l.replace('L', ''), 10) || 0;
  const x = levels.map(i => levelNum(i.level));
  const y = levels.map(i => i.composite!);
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const corr = denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : null;
  let narrative = '';
  if (corr != null) {
    if (corr > 0.3) narrative = 'Há associação positiva entre nível de maturidade tecnológica e resultado operacional: quanto maior o nível (L0→L4), maior tende a ser o indicador composto. O investimento em maturidade mostra efeito nos resultados.';
    else if (corr < -0.3) narrative = 'Há associação negativa entre maturidade e indicador: revisar métricas ou amostra.';
    else narrative = 'A correlação entre maturidade e resultado é fraca no período. Pode ser necessário mais tempo ou mais dados para observar o efeito.';
  }
  return {
    correlation: corr,
    byLevel: impactByLevel.map(i => ({ level: i.level, mean: i.composite, count: i.withKpiCount })),
    narrative,
  };
}

// Pearson: x = nível (0–4), y = indicador
function pearson(x: number[], y: number[]): number | null {
  const n = x.length;
  if (n < 2) return null;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  return denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : null;
}

// Correlação parcial r(X,Y|Z): efeito de X em Y controlando Z
function partialCorr(x: number[], y: number[], z: number[]): number | null {
  const rxy = pearson(x, y), rxz = pearson(x, z), ryz = pearson(y, z);
  if (rxy == null || rxz == null || ryz == null) return null;
  const d = Math.sqrt((1 - rxz * rxz) * (1 - ryz * ryz));
  return d > 0 ? (rxy - rxz * ryz) / d : null;
}

// Análise por zona: VPO→OSE e Tech→OSE por zona
interface ZoneAnalysisRow { zone: string; n: number; avgVpo: number | null; avgOse: number | null; avgTtp: number | null; avgTech: number; rVpoOse: number | null; rTechOse: number | null; }
function computeZoneAnalysis(
  sites: Site[], siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>,
  vpoData: VpoData | null
): ZoneAnalysisRow[] {
  const zones = ['APAC', 'MAZ', 'SAZ', 'NAZ', 'AFR', 'EUR'];
  return zones.map(z => {
    const zSites = sites.filter(s => s.zone === z);
    const rows = zSites.map(s => {
      const kpi = siteOseTtp[s.name];
      const vpo = vpoData?.[s.name]?.overall_score ?? null;
      const active = Object.entries(s.scores).filter(([k, v]) => k !== 'Total Global' && v > 0);
      const techAvg = active.length > 0 ? active.reduce((a, [, v]) => a + v, 0) / active.length : 0;
      return { ose: kpi?.ose ?? null, ttp: kpi?.ttp ?? null, vpo, techAvg };
    }).filter(r => r.vpo != null && r.ose != null);
    const vpos = rows.map(r => r.vpo!);
    const oses = rows.map(r => r.ose!);
    const techs = rows.map(r => r.techAvg);
    const ttps = rows.filter(r => r.ttp != null).map(r => r.ttp!);
    return {
      zone: z, n: rows.length,
      avgVpo: vpos.length ? vpos.reduce((a, b) => a + b, 0) / vpos.length : null,
      avgOse: oses.length ? oses.reduce((a, b) => a + b, 0) / oses.length : null,
      avgTtp: ttps.length ? ttps.reduce((a, b) => a + b, 0) / ttps.length : null,
      avgTech: techs.length ? techs.reduce((a, b) => a + b, 0) / techs.length : 0,
      rVpoOse: rows.length >= 5 ? pearson(vpos, oses) : null,
      rTechOse: rows.length >= 5 ? pearson(techs, oses) : null,
    };
  });
}

// Threshold sweep: para cada limiar de VPO, verifica se tech→OSE muda de sinal
interface ThresholdRow { threshold: number; nAbove: number; rAbove: number | null; nBelow: number; rBelow: number | null; }
function computeThresholdSweep(
  sites: Site[], siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>,
  vpoData: VpoData | null, thresholds: number[]
): ThresholdRow[] {
  const rows = sites.map(s => {
    const kpi = siteOseTtp[s.name]; const vpo = vpoData?.[s.name]?.overall_score ?? null;
    const active = Object.entries(s.scores).filter(([k, v]) => k !== 'Total Global' && v > 0);
    const techAvg = active.length > 0 ? active.reduce((a, [, v]) => a + v, 0) / active.length : 0;
    return { ose: kpi?.ose ?? null, vpo, techAvg };
  }).filter(r => r.vpo != null && r.ose != null);
  return thresholds.map(t => {
    const above = rows.filter(r => r.vpo! >= t);
    const below = rows.filter(r => r.vpo! < t);
    return {
      threshold: t,
      nAbove: above.length,
      rAbove: above.length >= 5 ? pearson(above.map(r => r.techAvg), above.map(r => r.ose!)) : null,
      nBelow: below.length,
      rBelow: below.length >= 5 ? pearson(below.map(r => r.techAvg), below.map(r => r.ose!)) : null,
    };
  });
}

// Correlação domínio tech → OSE com classificação Global/Legacy
interface DomainOseRow { domain: string; short: string; ghqPct: number; rOse: number | null; n: number; cls: 'global' | 'mixed' | 'legacy'; }
function computeDomainOseCorrelation(
  sites: Site[], siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>
): DomainOseRow[] {
  const GHQ_PCT: Record<string, number> = { 'Management': 63, 'Quality': 1, 'Packaging Performance': 1, 'Brewing Performance': 39, 'Safety': 45, 'Maintenance': 33, 'Data Acquisition': 79, 'MasterData Management': 93, 'Utilities': 4 };
  return DOMAIN_KEYS.filter(d => d.key !== 'Total Global').map(dk => {
    const pairs = sites.map(s => ({ score: s.scores[dk.key] ?? 0, ose: siteOseTtp[s.name]?.ose ?? null })).filter(p => p.score > 0 && p.ose != null);
    const ghq = GHQ_PCT[dk.key] ?? 0;
    return {
      domain: dk.key, short: dk.short, ghqPct: ghq, n: pairs.length,
      rOse: pairs.length >= 5 ? pearson(pairs.map(p => p.score), pairs.map(p => p.ose!)) : null,
      cls: ghq >= 60 ? 'global' as const : ghq >= 20 ? 'mixed' as const : 'legacy' as const,
    };
  }).sort((a, b) => (b.ghqPct - a.ghqPct));
}

// Parciais por pilar VPO: efeito próprio de cada pilar controlando VPO geral
interface PillarPartialRow { pillar: string; rSimple: number | null; rPartial: number | null; n: number; cls: 'own' | 'spurious' | 'marginal'; }
function computePillarPartials(
  sites: Site[], siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>,
  vpoData: VpoData | null
): PillarPartialRow[] {
  const PILS = ['Maintenance', 'Logistics', 'Management', 'Quality', 'People', 'Environment', 'Safety'];
  return PILS.map(p => {
    const rows = sites.map(s => {
      const kpi = siteOseTtp[s.name]; const vpo = vpoData?.[s.name];
      return { ose: kpi?.ose ?? null, pillar: vpo?.pillars?.[p]?.score ?? null, overall: vpo?.overall_score ?? null };
    }).filter(r => r.ose != null && r.pillar != null && r.overall != null);
    const ps = rows.map(r => r.pillar!); const os = rows.map(r => r.ose!); const vs = rows.map(r => r.overall!);
    const rSimple = rows.length >= 5 ? pearson(ps, os) : null;
    const rPartial = rows.length >= 5 ? partialCorr(ps, os, vs) : null;
    const cls = rPartial != null && Math.abs(rPartial) > 0.15 ? 'own' as const : rPartial != null && Math.abs(rPartial) < 0.05 ? 'spurious' as const : 'marginal' as const;
    return { pillar: p, rSimple, rPartial, n: rows.length, cls };
  });
}

// Domain readiness: transições L1→L2 e L2→L3 com OSE delta e VPO dos top performers
interface DomainTransition { from: number; to: number; fromN: number; toN: number; fromOse: number | null; toOse: number | null; delta: number | null; viable: boolean; topVpo: number | null; botVpo: number | null; }
function computeDomainReadiness(
  sites: Site[], siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>,
  vpoData: VpoData | null, domainKey: string
): DomainTransition[] {
  const byScore: Record<number, { ose: number | null; vpo: number | null }[]> = {};
  sites.forEach(s => {
    const sc = s.scores[domainKey] ?? 0;
    if (sc === 0) return;
    const kpi = siteOseTtp[s.name]; const vpo = vpoData?.[s.name]?.overall_score ?? null;
    if (!byScore[sc]) byScore[sc] = [];
    byScore[sc].push({ ose: kpi?.ose ?? null, vpo });
  });
  const transitions: DomainTransition[] = [];
  for (const [fl, tl] of [[1, 2], [2, 3]] as [number, number][]) {
    const from = (byScore[fl] ?? []).filter(r => r.ose != null);
    const to = (byScore[tl] ?? []).filter(r => r.ose != null);
    if (from.length < 3 || to.length < 3) continue;
    const fromOse = from.reduce((a, r) => a + r.ose!, 0) / from.length;
    const toOse = to.reduce((a, r) => a + r.ose!, 0) / to.length;
    const sorted = [...to].sort((a, b) => a.ose! - b.ose!);
    const mid = Math.floor(sorted.length / 2);
    const topHalf = sorted.slice(mid).filter(r => r.vpo != null);
    const botHalf = sorted.slice(0, mid).filter(r => r.vpo != null);
    transitions.push({
      from: fl, to: tl, fromN: from.length, toN: to.length,
      fromOse, toOse, delta: toOse - fromOse,
      viable: (toOse - fromOse) > 0.05,
      topVpo: topHalf.length ? topHalf.reduce((a, r) => a + r.vpo!, 0) / topHalf.length : null,
      botVpo: botHalf.length ? botHalf.reduce((a, r) => a + r.vpo!, 0) / botHalf.length : null,
    });
  }
  return transitions;
}

// ── Level Migration: per-site readiness to move from current level to next ──
interface SiteMigrationStatus {
  name: string; zone: string; volume: number; volGroup: string;
  currentLevel: number;      // 0-4 (Total Global rounded)
  techAvg: number;           // continuous avg of active domains
  vpoScore: number | null;
  ose: number | null; ttp: number | null;
  blockingDomains: { short: string; key: string; score: number; target: number; productType: string }[];
  domainsReadyCount: number;   // active domains already at target level
  totalActiveCount: number;    // total active domains for this site
  domainProgress: number;      // 0-1 fraction of domains ready
  vpoReady: boolean;         // VPO meets minimum for next transition
  readinessClass: 'ready' | 'close' | 'far' | 'nodata';
}

// Per-domain rationale text for each transition — explains what blocking/unblocking means
const DOMAIN_RATIONALE_PT: Record<string, Record<string, { blocking: string; action: string }>> = {
  'L0→L1': {
    BP: { blocking: 'Sem produto de Brewing ativo (score 0). Mínimo L1 requer visibilidade básica de processo de brassagem.', action: 'Implantar produto Global (G) de Brewing Performance com monitoramento de processo básico.' },
    DA: { blocking: 'Sem aquisição de dados ativa. L1 exige visibilidade em tempo real de variáveis-chave.', action: 'Implantar DA Global — maior penetração global (79%). Estabelece base para todos os domínios seguintes.' },
    UT: { blocking: 'Utilities sem monitoramento ativo. L1 exige medição de consumos (energia, água, vapor).', action: 'Implantar medição de utilities com alertas básicos.' },
    MT: { blocking: 'Maintenance sem sistema ativo. L1 exige registro de ordens de trabalho.', action: 'Implantar CMMS básico (Global preferred).' },
    MG: { blocking: 'Management sem ferramenta ativa. L1 exige visibilidade de KPIs operacionais.', action: 'Implantar MG Global (63% penetração). Forte correlação com VPO Maintenance e People.' },
    MDM: { blocking: 'Master Data sem sistema ativo. L1 exige cadastro padronizado de equipamentos e materiais.', action: 'Implantar MDM Global (93% penetração) — fundação para DA, QL e relatórios.' },
    PP: { blocking: 'Packaging Performance sem produto ativo. L1 exige rastreabilidade básica de linha.', action: 'Implantar rastreabilidade de packaging (Legacy aceitável em L1).' },
    QL: { blocking: 'Quality sem sistema ativo. L1 exige registro de não-conformidades.', action: 'Implantar QL básico. Nota: QL tem correlação negativa com OSE quando Legacy — priorizar Global.' },
    SF: { blocking: 'Safety sem sistema ativo. L1 exige registro de incidentes e permissões de trabalho.', action: 'Implantar SF Global (45% penetração). VPO Safety tem forte correlação com OSE.' },
  },
  'L1→L2': {
    BP: { blocking: 'BP score 1 → precisa chegar em 2. Visibilidade básica implantada mas sem otimização de processo.', action: 'Avançar para BP Global com controle de processo em tempo real. Impacto: +13pp OSE quando combinado com VPO Maintenance ≥85%.' },
    DA: { blocking: 'DA score 1 → precisa chegar em 2. Coleta de dados existe mas sem contextualização e análise.', action: 'Avançar DA para nível Connected (automação de coleta + contexto de processo). Maior ROI do portfólio: +20pp OSE em L2→L3.' },
    UT: { blocking: 'UT score 1 → precisa chegar em 2. Medição existe mas sem gestão de desvios.', action: 'Implantar alarmes automáticos e gestão de desvios de utilities.' },
    MT: { blocking: 'MT score 1 → precisa chegar em 2. CMMS básico existe mas sem planejamento preditivo.', action: 'Evoluir para Manutenção Planejada + preditiva básica. SINERGIA: MT×VPO Maintenance = +6.7pp supra-aditivo — único par com efeito multiplicador comprovado.' },
    MG: { blocking: 'MG score 1 → precisa chegar em 2. Visibilidade de KPI existe mas sem gestão por objetivos.', action: 'Implantar MG Global com gestão por objetivos e dashboards operacionais. Impacto: +7pp OSE (VPO Management parcial=0.02 — efeito via VPO geral).' },
    MDM: { blocking: 'MDM score 1 → precisa chegar em 2. Master data básico existe mas sem governança e qualidade de dado.', action: 'Implantar governança de master data (93% Global). Habilitador crítico para DA e QL avançados.' },
    PP: { blocking: 'PP score 1 → precisa chegar em 2. Rastreabilidade básica existe mas sem controle de performance.', action: 'Avançar para controle de OEE de linha. ATENÇÃO: PP é Legacy (1% Global) — exige VPO Logistics ≥87% para ter impacto positivo em OSE.' },
    QL: { blocking: 'QL score 1 → precisa chegar em 2. Registro de não-conformidades existe mas sem controle estatístico.', action: 'Avançar para SPC (Statistical Process Control). Impacto: +21pp OSE — MAIOR retorno em L1→L2. Exige VPO Quality ≥83% e C2 Process Capability ≥40%.' },
    SF: { blocking: 'SF score 1 → precisa chegar em 2. Registro de incidentes existe mas sem gestão proativa.', action: 'Avançar para gestão proativa de riscos. SF é VPO pillar com efeito marginal em OSE (parcial=-0.14) mas Safety alta correlaciona com cultura operacional.' },
  },
  'L2→L3': {
    BP: { blocking: 'BP score 2 → precisa chegar em 3. Controle em tempo real existe mas sem otimização automatizada.', action: 'Avançar para otimização de processo com ML/AI. Apenas 9% dos sites globais em L3+ em BP. CUIDADO: L2→L3 em BP está associado a QUEDA de OSE (-17pp) — validar hipótese local antes de investir.' },
    DA: { blocking: 'DA score 2 → precisa chegar em 3. Connected existe mas sem análise prescritiva.', action: 'Avançar DA para Intelligent (análise prescritiva + integração cross-domain). MAIOR ROI: +20pp OSE em L2→L3. Exige VPO ≥88% — sites L3 têm VPO uniformemente alto.' },
    UT: { blocking: 'UT score 2 → precisa chegar em 3. Gestão de desvios existe mas sem otimização de consumo.', action: 'Avançar para otimização automática de utilities (+19.5pp OSE projetado). 15% dos sites globais já em L3.' },
    MT: { blocking: 'MT score 2 → precisa chegar em 3. Manutenção planejada existe mas sem preditiva avançada.', action: 'Avançar para Manutenção Preditiva avançada com sensores e ML. VPO Maintenance precisa estar ≥89%.' },
    MG: { blocking: 'MG score 2 → precisa chegar em 3. Gestão por objetivos existe mas sem otimização automática.', action: 'Avançar MG para sistema integrado com alertas preditivos (+18.6pp OSE projetado). 15% dos sites globais em L3.' },
    MDM: { blocking: 'MDM score 2 → precisa chegar em 3. Governança existe mas sem integração em tempo real.', action: 'Avançar MDM para integração full com DA e sistemas de execução (+19.5pp projetado). 15% globais em L3.' },
    PP: { blocking: 'PP score 2 → precisa chegar em 3. OEE de linha existe mas sem otimização automatizada.', action: 'Avançar PP para controle adaptativo de linha. ATENÇÃO: PP Legacy (1% Global) — impacto em OSE negativo (r=-0.17) neste nível. Foco em processo (VPO Logistics) primeiro.' },
    QL: { blocking: 'QL score 2 → precisa chegar em 3. SPC existe mas sem predição de qualidade.', action: 'Avançar QL para predição e controle automático. CUIDADO: L2→L3 em QL associado a -17pp OSE — validar antes de investir.' },
    SF: { blocking: 'SF score 2 → precisa chegar em 3. Gestão proativa existe mas sem análise preditiva de riscos.', action: 'Avançar para prevenção preditiva de acidentes e IoT de segurança (+18.7pp projetado com VPO ≥89%).' },
  },
  'L3→L4': {
    BP: { blocking: 'BP em L3, meta L4. Operação autônoma de brassagem — sem precedente na rede atual (0 sites L4).', action: 'Território experimental. Requer AI/ML para controle de processo sem intervenção humana. Validar em piloto.' },
    DA: { blocking: 'DA em L3, meta L4. Analytics prescritivo existe mas sem tomada de decisão autônoma.', action: 'Avançar para AI autônoma com tomada de decisão sem intervenção humana. Zero referências na rede atual.' },
    UT: { blocking: 'UT em L3, meta L4. Otimização existe mas sem controle autônomo multi-utility.', action: 'Objetivo: autonomia completa de gestão energética e hídrica com AI.' },
    MT: { blocking: 'MT em L3, meta L4. Preditiva avançada existe mas sem manutenção autônoma.', action: 'Objetivo: robótica e AI para execução autônoma de manutenção.' },
    MG: { blocking: 'MG em L3, meta L4. Otimização automática existe mas sem gestão completamente autônoma.', action: 'Objetivo: sistema de gestão totalmente autônomo com AI para planejamento e execução.' },
    MDM: { blocking: 'MDM em L3, meta L4. Integração full existe mas sem auto-governança de dados.', action: 'Objetivo: data quality e integração autônoma com IA de classificação.' },
    PP: { blocking: 'PP em L3, meta L4. Controle adaptativo existe mas sem linha autônoma.', action: 'Objetivo: linha de packaging completamente autônoma (changeover, QC, OEE sem operador).' },
    QL: { blocking: 'QL em L3, meta L4. Predição existe mas sem liberação autônoma de produto.', action: 'Objetivo: controle de qualidade autônomo com liberação automática de bateladas.' },
    SF: { blocking: 'SF em L3, meta L4. Preditiva existe mas sem resposta autônoma a emergências.', action: 'Objetivo: sistema de resposta a emergências autônomo com IA de análise de risco em tempo real.' },
  },
};

const DOMAIN_RATIONALE_EN: Record<string, Record<string, { blocking: string; action: string }>> = {
  'L0→L1': {
    BP: { blocking: 'No active Brewing product (score 0). L1 minimum requires basic process visibility for brewing.', action: 'Deploy Global Brewing Performance product with basic process monitoring.' },
    DA: { blocking: 'No active data acquisition. L1 requires real-time visibility of key variables.', action: 'Deploy Global DA — highest global penetration (79%). Foundation for all subsequent domains.' },
    UT: { blocking: 'Utilities without active monitoring. L1 requires measurement of consumption (energy, water, steam).', action: 'Deploy utilities measurement with basic alerts.' },
    MT: { blocking: 'Maintenance without active system. L1 requires work order registration.', action: 'Deploy basic CMMS (Global preferred).' },
    MG: { blocking: 'No active management tool. L1 requires operational KPI visibility.', action: 'Deploy Global MG (63% penetration). Strong correlation with VPO Maintenance and People.' },
    MDM: { blocking: 'No active Master Data system. L1 requires standardized equipment and material registry.', action: 'Deploy Global MDM (93% penetration) — foundation for DA, QL, and reporting.' },
    PP: { blocking: 'No active Packaging Performance product. L1 requires basic line traceability.', action: 'Deploy packaging traceability (Legacy acceptable at L1).' },
    QL: { blocking: 'No active Quality system. L1 requires non-conformance logging.', action: 'Deploy basic QL. Note: QL has negative OSE correlation when Legacy — prioritize Global.' },
    SF: { blocking: 'No active Safety system. L1 requires incident registration and work permits.', action: 'Deploy Global SF (45% penetration). VPO Safety has strong OSE correlation.' },
  },
  'L1→L2': {
    BP: { blocking: 'BP score 1 → needs to reach 2. Basic visibility deployed but no process optimization.', action: 'Advance to Global BP with real-time process control. Impact: +13pp OSE when combined with VPO Maintenance ≥85%.' },
    DA: { blocking: 'DA score 1 → needs to reach 2. Data collection exists but without contextualization and analysis.', action: 'Advance DA to Connected level (automated collection + process context). Highest portfolio ROI: +20pp OSE in L2→L3.' },
    UT: { blocking: 'UT score 1 → needs to reach 2. Measurement exists but without deviation management.', action: 'Deploy automatic alarms and utilities deviation management.' },
    MT: { blocking: 'MT score 1 → needs to reach 2. Basic CMMS exists but without predictive planning.', action: 'Evolve to Planned + basic predictive Maintenance. SYNERGY: MT×VPO Maintenance = +6.7pp supra-additive — the only pair with proven multiplier effect.' },
    MG: { blocking: 'MG score 1 → needs to reach 2. KPI visibility exists but without objective management.', action: 'Deploy Global MG with objective management and operational dashboards. Impact: +7pp OSE (VPO Management partial=0.02 — effect via overall VPO).' },
    MDM: { blocking: 'MDM score 1 → needs to reach 2. Basic master data exists but without governance and data quality.', action: 'Deploy master data governance (93% Global). Critical enabler for advanced DA and QL.' },
    PP: { blocking: 'PP score 1 → needs to reach 2. Basic traceability exists but without performance control.', action: 'Advance to OEE line control. CAUTION: PP is Legacy (1% Global) — requires VPO Logistics ≥87% for positive OSE impact.' },
    QL: { blocking: 'QL score 1 → needs to reach 2. Non-conformance logging exists but without statistical control.', action: 'Advance to SPC (Statistical Process Control). Impact: +21pp OSE — HIGHEST return in L1→L2. Requires VPO Quality ≥83% and C2 Process Capability ≥40%.' },
    SF: { blocking: 'SF score 1 → needs to reach 2. Incident logging exists but without proactive management.', action: 'Advance to proactive risk management. SF is a VPO pillar with marginal OSE effect (partial=-0.14) but high Safety correlates with operational culture.' },
  },
  'L2→L3': {
    BP: { blocking: 'BP score 2 → needs to reach 3. Real-time control exists but without automated optimization.', action: 'Advance to ML/AI process optimization. Only 9% of global sites at L3+ in BP. CAUTION: L2→L3 in BP associated with OSE DROP (-17pp) — validate local hypothesis before investing.' },
    DA: { blocking: 'DA score 2 → needs to reach 3. Connected exists but without prescriptive analysis.', action: 'Advance DA to Intelligent (prescriptive analytics + cross-domain integration). HIGHEST ROI: +20pp OSE in L2→L3. Requires VPO ≥88% — L3 sites have uniformly high VPO.' },
    UT: { blocking: 'UT score 2 → needs to reach 3. Deviation management exists but without consumption optimization.', action: 'Advance to automatic utilities optimization (+19.5pp OSE projected). 15% of global sites already at L3.' },
    MT: { blocking: 'MT score 2 → needs to reach 3. Planned maintenance exists but without advanced predictive.', action: 'Advance to advanced Predictive Maintenance with sensors and ML. VPO Maintenance needs to be ≥89%.' },
    MG: { blocking: 'MG score 2 → needs to reach 3. Objective management exists but without automatic optimization.', action: 'Advance MG to integrated system with predictive alerts (+18.6pp OSE projected). 15% of global sites at L3.' },
    MDM: { blocking: 'MDM score 2 → needs to reach 3. Governance exists but without real-time integration.', action: 'Advance MDM to full integration with DA and execution systems (+19.5pp projected). 15% globally at L3.' },
    PP: { blocking: 'PP score 2 → needs to reach 3. Line OEE exists but without automated optimization.', action: 'Advance PP to adaptive line control. CAUTION: PP Legacy (1% Global) — negative OSE impact (r=-0.17) at this level. Focus on process (VPO Logistics) first.' },
    QL: { blocking: 'QL score 2 → needs to reach 3. SPC exists but without quality prediction.', action: 'Advance QL to prediction and automatic control. CAUTION: L2→L3 in QL associated with -17pp OSE — validate before investing.' },
    SF: { blocking: 'SF score 2 → needs to reach 3. Proactive management exists but without predictive risk analysis.', action: 'Advance to predictive accident prevention and safety IoT (+18.7pp projected with VPO ≥89%).' },
  },
  'L3→L4': {
    BP: { blocking: 'BP at L3, target L4. Autonomous brewing operation — no precedent in current network (0 L4 sites).', action: 'Experimental territory. Requires AI/ML for processs control without human intervention. Validate in pilot.' },
    DA: { blocking: 'DA at L3, target L4. Prescriptive analytics exists but without autonomous decision-making.', action: 'Advance to autonomous AI with decision-making without human intervention. Zero references in current network.' },
    UT: { blocking: 'UT at L3, target L4. Optimization exists but without autonomous multi-utility control.', action: 'Goal: full autonomy in energy and water management with AI.' },
    MT: { blocking: 'MT at L3, target L4. Advanced predictive exists but without autonomous maintenance.', action: 'Goal: robotics and AI for autonomous maintenance execution.' },
    MG: { blocking: 'MG at L3, target L4. Automatic optimization exists but without fully autonomous management.', action: 'Goal: fully autonomous management system with AI for planning and execution.' },
    MDM: { blocking: 'MDM at L3, target L4. Full integration exists but without data self-governance.', action: 'Goal: autonomous data quality and integration with classification AI.' },
    PP: { blocking: 'PP at L3, target L4. Adaptive control exists but without autonomous line.', action: 'Goal: fully autonomous packaging line (changeover, QC, OEE without operator).' },
    QL: { blocking: 'QL at L3, target L4. Prediction exists but without autonomous product release.', action: 'Goal: autonomous quality control with automatic batch release.' },
    SF: { blocking: 'SF at L3, target L4. Predictive exists but without autonomous emergency response.', action: 'Goal: autonomous emergency response system with real-time AI risk analysis.' },
  },
};

function getDomainRationale(lang: Lang): Record<string, Record<string, { blocking: string; action: string }>> {
  return lang === 'en' ? DOMAIN_RATIONALE_EN : DOMAIN_RATIONALE_PT;
}

// Static level migration definitions (from readiness analysis)
const LEVEL_MIGRATION_DEFS: Record<string, {
  fromLabel: string; toLabel: string;
  vpoMinPct: number;           // minimum VPO % for ROI
  avgOseDeltaLow: number | null;  // conservative estimate p.p.
  avgOseDeltaHigh: number | null; // optimistic estimate p.p.
  keyDomains: string[];        // domains most impactful for this transition
  topVpoPillars: string[];     // VPO pillars to strengthen first
  caveats: string;
}> = {
  'L0→L1': {
    fromLabel: 'L0', toLabel: 'L1',
    vpoMinPct: 65,
    avgOseDeltaLow: null, avgOseDeltaHigh: null,  // limited data (12 L0 sites)
    keyDomains: ['DA', 'MDM', 'SF'],
    topVpoPillars: ['Safety', 'Management', 'Maintenance'],
    caveats: 'Dados insuficientes (n=12 sites L0). Baseline: estabelecer visibilidade de dados e compliance de segurança.',
  },
  'L1→L2': {
    fromLabel: 'L1', toLabel: 'L2',
    vpoMinPct: 80,
    avgOseDeltaLow: 6, avgOseDeltaHigh: 21,
    keyDomains: ['DA', 'MDM', 'MG', 'QL', 'BP'],
    topVpoPillars: ['Maintenance', 'People', 'Management'],
    caveats: 'OSE delta varia por domínio (QL: +21pp, BP: +13pp, MG: +7pp). Exige VPO ≥80%.',
  },
  'L2→L3': {
    fromLabel: 'L2', toLabel: 'L3',
    vpoMinPct: 88,
    avgOseDeltaLow: 18, avgOseDeltaHigh: 20,
    keyDomains: ['DA', 'MDM', 'MG', 'UT', 'SF'],
    topVpoPillars: ['Maintenance', 'Logistics', 'People'],
    caveats: 'Maior retorno do portfólio (+18-20pp). Exige VPO ≥88%. Sites L3 têm VPO uniformemente alto — resultado orgânico de maturidade de processo.',
  },
  'L3→L4': {
    fromLabel: 'L3', toLabel: 'L4',
    vpoMinPct: 90,
    avgOseDeltaLow: null, avgOseDeltaHigh: null,  // no L4 sites in dataset
    keyDomains: ['DA', 'MT', 'PP', 'BP', 'UT'],
    topVpoPillars: ['Maintenance', 'Logistics', 'Management'],
    caveats: 'Nenhum site L4 no dataset atual. Projeção teórica — validar com pilotos.',
  },
};

function computeSiteMigrationStatuses(
  sites: Site[],
  siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>,
  vpoData: VpoData | null
): SiteMigrationStatus[] {
  return sites.map(s => {
    const kpi = siteOseTtp[s.name];
    const vpo = vpoData?.[s.name]?.overall_score ?? null;
    const currentLevel = Math.min(4, Math.max(0, Math.round(s.scores['Total Global'] ?? 0)));
    const targetLevel = Math.min(4, currentLevel + 1);

    // Active domain scores (exclude N/A)
    const domEntries = DOMAIN_KEYS.filter(d => d.key !== 'Total Global').map(d => ({
      short: d.short, key: d.key,
      score: s.scores[d.key] ?? 0,
      active: (currentLevel > 0 ? (s.scores[d.key] ?? 0) > 0 : true),
    }));
    const activeEntries = domEntries.filter(d => d.active || currentLevel === 0);
    const techAvg = activeEntries.length > 0 ? activeEntries.reduce((a, d) => a + d.score, 0) / activeEntries.length : 0;

    // Blocking domains: those with score < targetLevel
    const blockingDomains = activeEntries
      .filter(d => d.score < targetLevel && d.score > 0)  // only active domains that need to grow
      .map(d => ({
        short: d.short, key: d.key, score: d.score, target: targetLevel,
        productType: getSiteDomainType(s.name, d.short),
      }))
      .sort((a, b) => a.score - b.score); // show weakest first

    // Domain progress: how many active domains are already at or above target level
    const domainsReadyCount = activeEntries.filter(d => d.score >= targetLevel).length;
    const totalActiveCount = activeEntries.length;

    // VPO readiness for this transition
    const migKey = `L${currentLevel}→L${targetLevel}` as keyof typeof LEVEL_MIGRATION_DEFS;
    const def = LEVEL_MIGRATION_DEFS[migKey];
    const vpoMinReq = def?.vpoMinPct ?? 80;
    const vpoReady = vpo != null && vpo * 100 >= vpoMinReq;

    // Readiness class
    let readinessClass: SiteMigrationStatus['readinessClass'] = 'nodata';
    if (kpi?.ose != null || vpo != null) {
      const domainsOk = blockingDomains.length === 0;
      const vpoNearReady = vpo != null && vpo * 100 >= vpoMinReq * 0.9;
      if (domainsOk && vpoReady) readinessClass = 'ready';
      else if (blockingDomains.length <= 2 && vpoNearReady) readinessClass = 'close';
      else readinessClass = 'far';
    }

    // Volume group
    const vol = s.volume;
    const volGroup = vol < 2_000_000 ? 'G1' : vol < 6_000_000 ? 'G2' : 'G3';

    return {
      name: s.name, zone: s.zone, volume: vol, volGroup,
      currentLevel, techAvg, vpoScore: vpo,
      ose: kpi?.ose ?? null, ttp: kpi?.ttp ?? null,
      blockingDomains, domainsReadyCount, totalActiveCount,
      domainProgress: totalActiveCount > 0 ? domainsReadyCount / totalActiveCount : 0,
      vpoReady,
      readinessClass,
    };
  });
}

// Análise estatística: correlação maturidade × OSE e maturidade × TTP
function computeStatsAnalysisOseTtp(impactOseTtp: ImpactByLevelOseTtp[]): StatsAnalysis {
  const levelNum = (l: string) => parseInt(l.replace('L', ''), 10) || 0;
  const levelsOse = impactOseTtp.filter(i => i.avgOse != null && isFinite(i.avgOse) && i.withKpiCount > 0);
  const levelsTtp = impactOseTtp.filter(i => i.avgTtp != null && isFinite(i.avgTtp) && i.withKpiCount > 0);
  const corrOse = levelsOse.length >= 2 ? pearson(levelsOse.map(i => levelNum(i.level)), levelsOse.map(i => i.avgOse!)) : null;
  const corrTtp = levelsTtp.length >= 2 ? pearson(levelsTtp.map(i => levelNum(i.level)), levelsTtp.map(i => i.avgTtp!)) : null;
  const composite = (row: ImpactByLevelOseTtp): number | null => {
    const o = row.avgOse, t = row.avgTtp;
    if (o != null && t != null && isFinite(o) && isFinite(t)) return (o + t) / 2;
    return o != null && isFinite(o) ? o : t != null && isFinite(t) ? t : null;
  };
  const correlation = corrOse != null && corrTtp != null ? (corrOse + corrTtp) / 2 : corrOse ?? corrTtp ?? null;
  // Identify which levels have any sites at all (even without KPI)
  const levelsWithSites = impactOseTtp.filter(i => i.siteCount > 0);
  let narrative = '';
  if (levelsOse.length < 2 && levelsTtp.length < 2) {
    if (levelsWithSites.length === 1) {
      const singleLevel = levelsWithSites[0].level;
      narrative = `O filtro ativo concentra todas as operações no nível ${singleLevel} — correlação não computável com um único nível. Isso ocorre porque o proxy de complexidade (variância dos scores de domínio) está correlacionado com maturidade: operações homogêneas em domínios caem em "Baixa", enquanto L0/L1 (com domínios assimétricos) caem em "Alta". Use "Todos" ou filtre por volume (G1/G2/G3) para ver a análise completa.`;
    } else {
      narrative = levelsOse.length + levelsTtp.length === 0
        ? 'Dados insuficientes: nenhum site no escopo tem OSE ou TTP para o período.'
        : 'Apenas um nível tecnológico tem dados de KPI nesta amostra — correlação requer ao menos dois níveis. Expanda o filtro de volume ou complexidade.';
    }
  } else {
    const parts: string[] = [];
    if (corrOse != null) {
      if (corrOse > 0.3) parts.push('Maturidade correlaciona positivamente com OSE (%): níveis mais altos tendem a maior OSE.');
      else if (corrOse < -0.3) parts.push('Maturidade correlaciona negativamente com OSE; revisar métricas ou amostra.');
      else parts.push('Correlação maturidade × OSE fraca.');
    }
    if (corrTtp != null) {
      if (corrTtp > 0.3) parts.push('Maturidade correlaciona positivamente com TTP: níveis mais altos tendem a maior TTP.');
      else if (corrTtp < -0.3) parts.push('Maturidade correlaciona negativamente com TTP; revisar métricas ou amostra.');
      else parts.push('Correlação maturidade × TTP fraca.');
    }
    narrative = parts.length ? parts.join(' ') : 'Correlações fracas no período; pode ser necessário mais dados ou tempo para observar efeito da maturidade.';
  }
  return {
    correlation,
    byLevel: impactOseTtp.map(i => ({ level: i.level, mean: composite(i), count: i.withKpiCount })),
    narrative,
    correlationOse: corrOse ?? undefined,
    correlationTtp: corrTtp ?? undefined,
  };
}

function buildImpactByMaturityLevel(sites: Site[], anaplanRows: AnaplanRow[]): ImpactByLevel[] {
  const siteNames = sites.map(s => s.name);
  const plantToSite = (plant: string) => normalizePlantToSite(plant, siteNames);
  type SiteKpis = { OSE: number[]; VIC: number[]; Lifecycle: number[]; TTP: number[] };
  const bySite: Record<string, SiteKpis> = {};
  anaplanRows.forEach(r => {
    if (r.plant === 'N/A' || !r.plant) return;
    const site = plantToSite(r.plant);
    if (!site) return;
    const g = getKpiGroup(r.kpi_code);
    if (!g) return;
    if (!bySite[site]) bySite[site] = { OSE: [], VIC: [], Lifecycle: [], TTP: [] };
    bySite[site][g].push(r.aggregated_value);
  });
  const siteKpiAvg = (siteName: string): { OSE: number | null; VIC: number | null; Lifecycle: number | null; TTP: number | null } => {
    const k = bySite[siteName];
    if (!k) return { OSE: null, VIC: null, Lifecycle: null, TTP: null };
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
    return { OSE: avg(k.OSE), VIC: avg(k.VIC), Lifecycle: avg(k.Lifecycle), TTP: avg(k.TTP) };
  };

  const byLevel = new Map<string, Site[]>();
  sites.forEach(site => {
    const mat = getMaturityLevel(site);
    if (!byLevel.has(mat)) byLevel.set(mat, []);
    byLevel.get(mat)!.push(site);
  });

  const LEVEL_ORDER = ['L0', 'L1', 'L2', 'L3', 'L4'];
  return LEVEL_ORDER.map(level => {
    const clusterSites = byLevel.get(level) ?? [];
    const withKpi = clusterSites.filter(s => bySite[s.name]);
    const kpis = ANAPLAN_KPI_GROUPS.map(g => {
      const vals = withKpi.map(s => (siteKpiAvg(s.name) as Record<string, number | null>)[g]).filter((v): v is number => v != null && isFinite(v));
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    });
    const composite = kpis.filter((v): v is number => v != null && isFinite(v)).length
      ? kpis.filter((v): v is number => v != null && isFinite(v)).reduce((a, b) => a + b, 0) / kpis.filter((v): v is number => v != null && isFinite(v)).length
      : null;
    return {
      level,
      siteCount: clusterSites.length,
      withKpiCount: withKpi.length,
      avgOse: kpis[0] ?? null,
      avgVic: kpis[1] ?? null,
      avgLifecycle: kpis[2] ?? null,
      avgTtp: kpis[3] ?? null,
      composite,
    };
  });
}

// Estudo OSE & TTP por nível: OSE = ΣEPT/ΣOST (agregar depois aplicar fórmula). OSE exibido em %.
interface ImpactByLevelOseTtp {
  level: string;
  siteCount: number;
  withKpiCount: number;
  avgOse: number | null;  // razão 0–1 (exibir como %)
  avgTtp: number | null;
  oseFromCanonical: boolean;
}
function buildImpactByLevelOseTtp(sites: Site[], anaplanRows: AnaplanRow[]): ImpactByLevelOseTtp[] {
  const studyKpis = [KPI_EPT, KPI_OST, STUDY_KPI_OSE_PRECALC, STUDY_KPI_TTP];
  const studyRows = anaplanRows.filter(r => studyKpis.includes(r.kpi_code));
  if (!studyRows.length) return [];
  const siteNames = sites.map(s => s.name);
  const plantToSite = (plant: string) => normalizePlantToSite(plant, siteNames);
  type SiteSums = { ept: number; ost: number; osePrecalc: number[]; ttp: number[] };
  const bySite: Record<string, SiteSums> = {};
  studyRows.forEach(r => {
    if (r.plant === 'N/A' || !r.plant) return;
    const site = plantToSite(r.plant);
    if (!site) return;
    if (!bySite[site]) bySite[site] = { ept: 0, ost: 0, osePrecalc: [], ttp: [] };
    const v = r.aggregated_value;
    if (r.kpi_code === KPI_EPT) bySite[site].ept += v;
    else if (r.kpi_code === KPI_OST) bySite[site].ost += v;
    else if (r.kpi_code === STUDY_KPI_OSE_PRECALC) bySite[site].osePrecalc.push(v);
    else if (r.kpi_code === STUDY_KPI_TTP) bySite[site].ttp.push(v);
  });
  const hasCanonical = Object.values(bySite).some(s => s.ept > 0 && s.ost > 0);
  const byLevel = new Map<string, Site[]>();
  sites.forEach(site => {
    const mat = getMaturityLevel(site);
    if (!byLevel.has(mat)) byLevel.set(mat, []);
    byLevel.get(mat)!.push(site);
  });
  const LEVEL_ORDER = ['L0', 'L1', 'L2', 'L3', 'L4'];
  return LEVEL_ORDER.map(level => {
    const clusterSites = byLevel.get(level) ?? [];
    const withKpi = clusterSites.filter(s => bySite[s.name]);
    let avgOse: number | null = null;
    if (hasCanonical) {
      let sumEPT = 0, sumOST = 0;
      withKpi.forEach(s => {
        const k = bySite[s.name];
        if (k.ost > 0) { sumEPT += k.ept; sumOST += k.ost; }
      });
      avgOse = sumOST > 0 ? sumEPT / sumOST : null;
    }
    if (avgOse == null && withKpi.length > 0) {
      const precalc = withKpi.map(s => bySite[s.name].osePrecalc).filter(a => a.length).flat();
      avgOse = precalc.length ? precalc.reduce((a, b) => a + b, 0) / precalc.length : null;
    }
    const ttpVals = withKpi.flatMap(s => bySite[s.name].ttp).filter((v): v is number => v != null && isFinite(v));
    const avgTtp = ttpVals.length ? ttpVals.reduce((a, b) => a + b, 0) / ttpVals.length : null;
    return {
      level,
      siteCount: clusterSites.length,
      withKpiCount: withKpi.length,
      avgOse,
      avgTtp,
      oseFromCanonical: hasCanonical,
    };
  });
}

// — Volume mix e complexidade por site (para clusters). Usar rows com periodtype YTD para ano; MTH somado ou filtrado conforme necessidade.
export interface SiteVolumeMix {
  siteName: string;
  totalHL: number;
  shares: number[];  // 9 shares (0–1) na ordem VOLUME_KPI_CODES
  complexity: number;  // 0–1: entropia normalizada (1 = mix equilibrado, 0 = concentrado)
}
function buildVolumeMixFromRows(sites: Site[], anaplanRows: AnaplanRow[]): Map<string, SiteVolumeMix> {
  const volumeRows = anaplanRows.filter(r => (VOLUME_KPI_CODES as readonly string[]).includes(r.kpi_code));
  if (!volumeRows.length) return new Map();
  const siteNames = sites.map(s => s.name);
  const plantToSite = (plant: string) => normalizePlantToSite(plant, siteNames);
  const bySite: Record<string, number[]> = {};
  volumeRows.forEach(r => {
    if (r.plant === 'N/A' || !r.plant) return;
    const site = plantToSite(r.plant);
    if (!site) return;
    if (!bySite[site]) bySite[site] = VOLUME_KPI_CODES.map(() => 0);
    const idx = (VOLUME_KPI_CODES as readonly string[]).indexOf(r.kpi_code);
    if (idx >= 0) bySite[site][idx] += r.aggregated_value;
  });
  const out = new Map<string, SiteVolumeMix>();
  Object.entries(bySite).forEach(([siteName, vals]) => {
    if (siteName === '__order' || !vals) return;
    const total = vals.reduce((a, b) => a + b, 0);
    if (total <= 0) return;
    const shares = vals.map(v => v / total);
    // Operational complexity: format diversity × product diversity × cross-category
    // VOLUME_KPI_CODES order: [PB-R0030(0), PB-R0010(1), PB-R0050(2), PC-R0050(3), PC-R0010(4), PC-R0030(5), PP-R0050(6), PP-R0010(7), PP-R0030(8)]
    // Beer=1,4,7  SoftDrink=0,5,8  Water=2,3,6   Bottling=0+1+2  Canning=3+4+5  PET=6+7+8
    const MIN_SH = 0.05;
    const beerSh = vals[1] + vals[4] + vals[7];
    const softSh = vals[0] + vals[5] + vals[8];
    const waterSh = vals[2] + vals[3] + vals[6];
    const bottlSh = vals[0] + vals[1] + vals[2];
    const cannSh  = vals[3] + vals[4] + vals[5];
    const petSh   = vals[6] + vals[7] + vals[8];
    const activeFmt  = [bottlSh, cannSh, petSh].filter(v => v / total >= MIN_SH).length;
    const activeProd = [beerSh, softSh, waterSh].filter(v => v / total >= MIN_SH).length;
    const fmtDiv  = activeFmt  <= 1 ? 0 : activeFmt  === 2 ? 0.5 : 1.0;
    const prodDiv = activeProd <= 1 ? 0 : activeProd === 2 ? 0.5 : 1.0;
    const cross   = (beerSh / total >= MIN_SH) && ((softSh + waterSh) / total >= MIN_SH) ? 0.5 : 0;
    const complexity = 0.4 * fmtDiv + 0.4 * prodDiv + 0.2 * cross;
    out.set(siteName, { siteName, totalHL: total, shares, complexity });
  });
  return out;
}

// — OSE e TTP por site (para clusters e análise domínio)
function getSiteOseTtp(sites: Site[], anaplanRows: AnaplanRow[]): Record<string, { ose: number | null; ttp: number | null }> {
  const studyKpis = [KPI_EPT, KPI_OST, STUDY_KPI_OSE_PRECALC, STUDY_KPI_TTP];
  const studyRows = anaplanRows.filter(r => studyKpis.includes(r.kpi_code));
  const siteNames = sites.map(s => s.name);
  const plantToSite = (plant: string) => normalizePlantToSite(plant, siteNames);
  type SiteSums = { ept: number; ost: number; osePrecalc: number[]; ttp: number[] };
  const bySite: Record<string, SiteSums> = {};
  studyRows.forEach(r => {
    if (r.plant === 'N/A' || !r.plant) return;
    const site = plantToSite(r.plant);
    if (!site) return;
    if (!bySite[site]) bySite[site] = { ept: 0, ost: 0, osePrecalc: [], ttp: [] };
    const v = r.aggregated_value;
    if (r.kpi_code === KPI_EPT) bySite[site].ept += v;
    else if (r.kpi_code === KPI_OST) bySite[site].ost += v;
    else if (r.kpi_code === STUDY_KPI_OSE_PRECALC) bySite[site].osePrecalc.push(v);
    else if (r.kpi_code === STUDY_KPI_TTP) bySite[site].ttp.push(v);
  });
  const result: Record<string, { ose: number | null; ttp: number | null }> = {};
  sites.forEach(s => {
    const k = bySite[s.name];
    let ose: number | null = null;
    if (k?.ost > 0) ose = k.ept / k.ost;
    if (ose == null && k?.osePrecalc?.length) ose = k.osePrecalc.reduce((a, b) => a + b, 0) / k.osePrecalc.length;
    const ttp = k?.ttp?.length ? k.ttp.reduce((a, b) => a + b, 0) / k.ttp.length : null;
    result[s.name] = { ose: ose ?? null, ttp };
  });
  return result;
}

// — Complexidade operacional: 3 fatores independentes de escala
// Format diversity (Bottling/Canning/PET) + Product diversity (Beer/SoftDrink/Water) + Cross-category penalty
// Limiares absolutos — não dependem do dataset
function complexityBand(c: number): 'L' | 'M' | 'H' {
  if (c < 0.25) return 'L';  // única categoria de formato ou produto
  if (c < 0.60) return 'M';  // dois formatos ou dois produtos, ou cerveja + outra categoria
  return 'H';                 // três formatos, ou multi-produto entre categorias distintas
}

// Proxy de complexidade: variância dos scores de domínio APLICÁVEIS.
// Regra: se TG > 0, domínios com score=0 são “Não Aplicável” (ex: BP=0 em operação só CSD)
// e são excluídos para não inflar variância artificialmente.
// Se TG = 0, todos os domínios são incluídos — os zeros representam gaps reais.
function getProxyComplexity(site: Site): number {
  const keys = DOMAIN_KEYS.filter(d => d.key !== 'Total Global').map(d => d.key);
  const tg = site.scores['Total Global'] ?? 0;
  const allScores = keys.map(k => site.scores[k] ?? 0);
  // Excluir N/A (score=0 quando TG>0 significa domínio não aplicável a essa operação)
  const scores = tg > 0 ? allScores.filter(v => v > 0) : allScores;
  if (scores.length < 2) return 0;
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, x) => a + (x - mean) ** 2, 0) / scores.length;
  const maxVar = 4;
  return Math.min(1, variance / maxVar);
}

// Complexidade final: do mix (entropia) quando há dados; senão proxy da variância dos domínios
function getSiteComplexity(site: Site, volumeMix: Map<string, SiteVolumeMix>): number {
  const mix = volumeMix.get(site.name);
  if (mix && mix.totalHL > 0) return mix.complexity;
  return getProxyComplexity(site);
}

function getSiteComplexityBand(site: Site, volumeMix: Map<string, SiteVolumeMix>): 'L' | 'M' | 'H' {
  return complexityBand(getSiteComplexity(site, volumeMix));
}

// Bandas por site via tercis — garante L/M/H sempre com ~⅓ das operações cada,
// independente da compressão dos valores brutos (proxy ou volume real).
function getSiteComplexityBands(sites: Site[], volumeMix: Map<string, SiteVolumeMix>): Record<string, 'L' | 'M' | 'H'> {
  const rawBySite: Record<string, number> = {};
  sites.forEach(s => { rawBySite[s.name] = getSiteComplexity(s, volumeMix); });
  const sorted = [...Object.values(rawBySite)].sort((a, b) => a - b);
  const n = sorted.length;
  const t33 = sorted[Math.floor(n / 3)] ?? 0;
  const t67 = sorted[Math.floor(2 * n / 3)] ?? 0;
  const out: Record<string, 'L' | 'M' | 'H'> = {};
  sites.forEach(s => {
    const raw = rawBySite[s.name] ?? 0;
    out[s.name] = raw <= t33 ? 'L' : raw <= t67 ? 'M' : 'H';
  });
  return out;
}

function getSiteClusterKey(site: Site, volumeMix: Map<string, SiteVolumeMix>, complexityBands?: Record<string, 'L' | 'M' | 'H'>): string {
  const band = complexityBands?.[site.name] ?? getSiteComplexityBand(site, volumeMix);
  return `${site.group}_${band}`;
}

// — Tipo de produto: só cerveja | misto (cerveja+refrig) | só refrigerante | água | multi
// Índices em shares: Beer = 1,4,7 (R0010); SoftDrink = 0,5,8 (R0030); Water = 2,3,6 (R0050)
export type ProductType = 'beer_only' | 'soft_drink_only' | 'water_only' | 'mixed_beer_soft_drink' | 'mixed_other' | 'unknown';
function getProductType(site: Site, volumeMix: Map<string, SiteVolumeMix>): ProductType {
  const mix = volumeMix.get(site.name);
  if (!mix || mix.totalHL <= 0) return 'unknown';
  const beer = (mix.shares[1] ?? 0) + (mix.shares[4] ?? 0) + (mix.shares[7] ?? 0);
  const softDrink = (mix.shares[0] ?? 0) + (mix.shares[5] ?? 0) + (mix.shares[8] ?? 0);
  const water = (mix.shares[2] ?? 0) + (mix.shares[3] ?? 0) + (mix.shares[6] ?? 0);
  const tol = 0.05;
  if (beer >= 1 - tol && softDrink < tol && water < tol) return 'beer_only';
  if (softDrink >= 1 - tol && beer < tol && water < tol) return 'soft_drink_only';
  if (water >= 1 - tol && beer < tol && softDrink < tol) return 'water_only';
  if (beer >= tol && softDrink >= tol) return 'mixed_beer_soft_drink';
  return 'mixed_other';
}

// — Clusters: perfil volume (G1/G2/G3) + complexidade (L/M/H)
export interface VolumeComplexityCluster {
  clusterKey: string;
  volumeBand: string;
  complexityBand: string;
  siteCount: number;
  sites: Site[];
  avgOsePct: number | null;
  avgTtp: number | null;
  withKpiCount: number;
}
function buildVolumeComplexityClusters(
  sites: Site[],
  volumeMix: Map<string, SiteVolumeMix>,
  siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>,
  complexityBands?: Record<string, 'L' | 'M' | 'H'>
): VolumeComplexityCluster[] {
  const clusters = new Map<string, Site[]>();
  sites.forEach(site => {
    const band = complexityBands?.[site.name] ?? getSiteComplexityBand(site, volumeMix);
    const key = `${site.group}_${band}`;
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key)!.push(site);
  });
  return Array.from(clusters.entries()).map(([clusterKey, clusterSites]) => {
    const [volumeBand, complexityBand] = clusterKey.split('_');
    const withKpi = clusterSites.filter(s => siteOseTtp[s.name] && (siteOseTtp[s.name].ose != null || siteOseTtp[s.name].ttp != null));
    const oseVals = withKpi.map(s => siteOseTtp[s.name].ose).filter((v): v is number => v != null && isFinite(v));
    const ttpVals = withKpi.map(s => siteOseTtp[s.name].ttp).filter((v): v is number => v != null && isFinite(v));
    return {
      clusterKey,
      volumeBand,
      complexityBand,
      siteCount: clusterSites.length,
      sites: clusterSites,
      avgOsePct: oseVals.length ? (oseVals.reduce((a, b) => a + b, 0) / oseVals.length) * 100 : null,
      avgTtp: ttpVals.length ? ttpVals.reduce((a, b) => a + b, 0) / ttpVals.length : null,
      withKpiCount: withKpi.length,
    };
  }).filter(c => c.siteCount > 0).sort((a, b) => a.clusterKey.localeCompare(b.clusterKey));
}

// — Análise por domínio: maturidade média × OSE/TTP e respostas às 3 perguntas
export interface DomainAnalysisRow {
  domain: string;
  domainShort: string;
  siteCount: number;
  avgMaturity: number;
  avgOsePct: number | null;
  avgTtp: number | null;
}
export interface DomainAnalysis {
  rows: DomainAnalysisRow[];
  correlationMaturityOse: number | null;
  correlationMaturityTtp: number | null;
  answerMatureDomain: string;
  answerHighAvg: string;
  answerPortfolio: string;
}
function buildDomainAnalysis(
  sites: Site[],
  siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>,
  domainKeys: { key: string; short: string }[]
): DomainAnalysis {
  const rows: DomainAnalysisRow[] = domainKeys.map(d => {
    const siteScores = sites.map(s => ({ site: s, score: s.scores[d.key] ?? 0 }));
    const avgMaturity = siteScores.length ? siteScores.reduce((a, x) => a + x.score, 0) / siteScores.length : 0;
    // Indicadores por domínio: média OSE/TTP dos sites com maturidade alta (≥2) nesse domínio
    const matureSites = siteScores.filter(x => x.score >= 2).map(x => x.site);
    const withOse = matureSites.filter(s => siteOseTtp[s.name]?.ose != null);
    const withTtp = matureSites.filter(s => siteOseTtp[s.name]?.ttp != null);
    const avgOsePct = withOse.length ? withOse.reduce((a, s) => a + (siteOseTtp[s.name].ose! * 100), 0) / withOse.length : null;
    const avgTtp = withTtp.length ? withTtp.reduce((a, s) => a + siteOseTtp[s.name].ttp!, 0) / withTtp.length : null;
    return {
      domain: d.key,
      domainShort: d.short,
      siteCount: matureSites.length,
      avgMaturity,
      avgOsePct,
      avgTtp,
    };
  });
  const withBoth = rows.filter(r => r.avgOsePct != null && r.avgTtp != null);
  const n = withBoth.length;
  const pearson = (x: number[], y: number[]) => {
    if (x.length < 2) return null;
    const mx = x.reduce((a, b) => a + b, 0) / x.length;
    const my = y.reduce((a, b) => a + b, 0) / y.length;
    let num = 0, dx2 = 0, dy2 = 0;
    for (let i = 0; i < x.length; i++) {
      const dx = x[i] - mx, dy = y[i] - my;
      num += dx * dy;
      dx2 += dx * dx;
      dy2 += dy * dy;
    }
    return dx2 > 0 && dy2 > 0 ? num / Math.sqrt(dx2 * dy2) : null;
  };
  const corrOse = n >= 2 ? pearson(withBoth.map(r => r.avgMaturity), withBoth.map(r => r.avgOsePct!)) : null;
  const corrTtp = n >= 2 ? pearson(withBoth.map(r => r.avgMaturity), withBoth.map(r => r.avgTtp!)) : null;
  let answerMatureDomain = 'Dados insuficientes para correlacionar maturidade do domínio com OSE/TTP.';
  if (corrOse != null || corrTtp != null) {
    if ((corrOse != null && corrOse > 0.3) || (corrTtp != null && corrTtp > 0.3))
      answerMatureDomain = 'Sim. Domínios com maturidade média mais alta tendem a apresentar melhores OSE e/ou TTP (correlação positiva). Investir em maturidade por domínio está alinhado a melhores resultados.';
    else if ((corrOse != null && corrOse < -0.3) || (corrTtp != null && corrTtp < -0.3))
      answerMatureDomain = 'Não no período. A correlação entre maturidade do domínio e indicadores é negativa; revisar métricas ou amostra.';
    else
      answerMatureDomain = 'A correlação é fraca: ter um domínio mais maduro não mostra, nos dados atuais, relação forte com OSE/TTP. Pode ser necessário mais tempo ou mais dados.';
  }
  const highMaturityLowIndicators = rows.filter(r => r.avgMaturity >= 2 && (r.avgOsePct != null && r.avgOsePct < 70 || r.avgTtp != null && r.avgTtp < 2));
  let answerHighAvg = 'Média de maturidade alta com indicadores ainda baixos pode indicar rollout recente (resultados ainda não refletidos) ou outros fatores (volume, mix, operação). Não é necessariamente mau sinal se a tendência for de melhoria.';
  if (highMaturityLowIndicators.length > 0)
    answerHighAvg = `${highMaturityLowIndicators.length} domínio(s) com maturidade média ≥2 e OSE <70% ou TTP <2. ` + answerHighAvg;
  const bestOse = rows.filter(r => r.avgOsePct != null).sort((a, b) => (b.avgOsePct ?? 0) - (a.avgOsePct ?? 0))[0];
  const bestTtp = rows.filter(r => r.avgTtp != null).sort((a, b) => (b.avgTtp ?? 0) - (a.avgTtp ?? 0))[0];
  let answerPortfolio = 'Compare a maturidade por domínio (tabela abaixo) com OSE e TTP. Em geral, priorizar domínios que impactam supply (DA, MDM, PP, BP) e elevar para L2+ tende a melhorar indicadores quando há correlação positiva.';
  if (bestOse || bestTtp)
    answerPortfolio = `Melhor OSE médio: ${bestOse?.domainShort ?? '—'}. Melhor TTP médio: ${bestTtp?.domainShort ?? '—'}. ` + answerPortfolio;
  return {
    rows,
    correlationMaturityOse: corrOse ?? null,
    correlationMaturityTtp: corrTtp ?? null,
    answerMatureDomain,
    answerHighAvg,
    answerPortfolio,
  };
}

// — Clusters por perfil de maturidade por domínio (funciona com dados atuais)
export interface MaturityProfileCluster {
  clusterKey: string;
  label: string;
  description: string;
  siteCount: number;
  sites: Site[];
  avgOsePct: number | null;
  avgTtp: number | null;
  avgMaturity: number;
  withKpiCount: number;
}
function buildMaturityProfileClusters(
  sites: Site[],
  siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>
): MaturityProfileCluster[] {
  const clusters: { key: string; label: string; description: string; test: (s: Site) => boolean }[] = [
    {
      key: 'TOP',
      label: 'Top Performers',
      description: 'Total Global ≥ 3 — alta maturidade em quase todos os domínios',
      test: s => (s.scores['Total Global'] ?? 0) >= 3,
    },
    {
      key: 'PKG',
      label: 'Packaging Focus',
      description: 'Forte em BP e PP (≥ 2.5 em média) — packaging como diferencial',
      test: s => ((s.scores['Brewing Performance'] ?? 0) + (s.scores['Packaging Performance'] ?? 0)) / 2 >= 2.5
        && (s.scores['Total Global'] ?? 0) < 3,
    },
    {
      key: 'DAT',
      label: 'Data Maturity',
      description: 'Forte em DA e MDM (≥ 2.5 em média) — dados e master data',
      test: s => ((s.scores['Data Acquisition'] ?? 0) + (s.scores['MasterData Management'] ?? 0)) / 2 >= 2.5
        && ((s.scores['Brewing Performance'] ?? 0) + (s.scores['Packaging Performance'] ?? 0)) / 2 < 2.5
        && (s.scores['Total Global'] ?? 0) < 3,
    },
    {
      key: 'DEV',
      label: 'Developing',
      description: 'Total Global 1–2 — maturidade média em avanço',
      test: s => {
        const tg = s.scores['Total Global'] ?? 0;
        return tg >= 1 && tg < 3
          && ((s.scores['Brewing Performance'] ?? 0) + (s.scores['Packaging Performance'] ?? 0)) / 2 < 2.5
          && ((s.scores['Data Acquisition'] ?? 0) + (s.scores['MasterData Management'] ?? 0)) / 2 < 2.5;
      },
    },
    {
      key: 'EMG',
      label: 'Emerging',
      description: 'Total Global < 1 — início da jornada digital',
      test: s => (s.scores['Total Global'] ?? 0) < 1,
    },
  ];
  return clusters.map(c => {
    const clusterSites = sites.filter(c.test);
    const withOse = clusterSites.filter(s => siteOseTtp[s.name]?.ose != null);
    const withTtp = clusterSites.filter(s => siteOseTtp[s.name]?.ttp != null);
    const avgOsePct = withOse.length ? withOse.reduce((a, s) => a + siteOseTtp[s.name].ose! * 100, 0) / withOse.length : null;
    const avgTtp = withTtp.length ? withTtp.reduce((a, s) => a + siteOseTtp[s.name].ttp!, 0) / withTtp.length : null;
    const avgMaturity = clusterSites.length ? clusterSites.reduce((a, s) => a + (s.scores['Total Global'] ?? 0), 0) / clusterSites.length : 0;
    return {
      clusterKey: c.key,
      label: c.label,
      description: c.description,
      siteCount: clusterSites.length,
      sites: clusterSites,
      avgOsePct,
      avgTtp,
      avgMaturity,
      withKpiCount: Math.max(withOse.length, withTtp.length),
    };
  }).filter(c => c.siteCount > 0);
}

// — Insights da página: narrativa única a partir de objetivo, níveis, clusters, domínios e correlações
function buildPageInsights(
  filteredSites: Site[],
  totalSites: number,
  impactOseTtp: { level: string; siteCount: number; withKpiCount: number; avgOse: number | null; avgTtp: number | null }[],
  volumeComplexityClusters: VolumeComplexityCluster[],
  domainAnalysis: DomainAnalysis,
  selectedClusters: string[],
  hasOseTtpStudy: boolean,
  statsResolved: { correlationOse?: number | null; correlationTtp?: number | null; narrative?: string }
): string {
  const parts: string[] = [];
  const escopo = selectedClusters.length > 0
    ? `Análise restrita aos clusters ${selectedClusters.join(', ')}: ${filteredSites.length} de ${totalSites} operações.`
    : `Análise sobre as ${totalSites} operações (sem filtro de cluster).`;
  parts.push(escopo);

  if (hasOseTtpStudy && impactOseTtp.length) {
    const byLevel = impactOseTtp
      .filter(i => i.withKpiCount > 0 && (i.avgOse != null || i.avgTtp != null))
      .map(i => `${i.level}: OSE ${i.avgOse != null ? (i.avgOse * 100).toFixed(1) + '%' : '—'}, TTP ${i.avgTtp != null ? i.avgTtp.toFixed(2) : '—'} (${i.withKpiCount} sites)`);
    if (byLevel.length) parts.push(`Por nível de maturidade (L0–L4): ${byLevel.join('; ')}.`);
    const bestOse = impactOseTtp.filter(i => i.avgOse != null).sort((a, b) => (b.avgOse ?? 0) - (a.avgOse ?? 0))[0];
    if (bestOse) parts.push(`Nível com melhor OSE médio: ${bestOse.level}.`);
  }

  if (volumeComplexityClusters.length) {
    const bestCluster = volumeComplexityClusters
      .filter(c => c.avgOsePct != null)
      .sort((a, b) => (b.avgOsePct ?? 0) - (a.avgOsePct ?? 0))[0];
    const worstTtp = volumeComplexityClusters
      .filter(c => c.avgTtp != null)
      .sort((a, b) => (b.avgTtp ?? 0) - (a.avgTtp ?? 0))[0];
    if (bestCluster) parts.push(`Entre os clusters (volume × complexidade), melhor OSE médio em ${bestCluster.clusterKey} (${bestCluster.avgOsePct?.toFixed(1)}%).`);
    if (worstTtp && volumeComplexityClusters.length > 1) parts.push(`Maior TTP médio no cluster ${worstTtp.clusterKey} (${worstTtp.avgTtp?.toFixed(2)}), sugerindo maior complexidade operacional.`);
  }

  const corrOse = domainAnalysis.correlationMaturityOse ?? statsResolved.correlationOse;
  const corrTtp = domainAnalysis.correlationMaturityTtp ?? statsResolved.correlationTtp;
  if (corrOse != null || corrTtp != null) {
    const interp = [];
    if (corrOse != null && corrOse > 0.3) interp.push('correlação positiva entre maturidade e OSE');
    else if (corrOse != null && corrOse < -0.3) interp.push('correlação negativa maturidade×OSE');
    if (corrTtp != null && corrTtp > 0.3) interp.push('maturidade e TTP positivamente correlacionados');
    else if (corrTtp != null && corrTtp < -0.3) interp.push('correlação negativa maturidade×TTP');
    if (interp.length) parts.push(`Correlações: ${interp.join('; ')}.`);
  }

  const bestDomainOse = domainAnalysis.rows.filter(r => r.avgOsePct != null).sort((a, b) => (b.avgOsePct ?? 0) - (a.avgOsePct ?? 0))[0];
  const bestDomainTtp = domainAnalysis.rows.filter(r => r.avgTtp != null).sort((a, b) => (b.avgTtp ?? 0) - (a.avgTtp ?? 0))[0];
  if (bestDomainOse || bestDomainTtp)
    parts.push(`Por domínio, destaque em OSE: ${bestDomainOse?.domainShort ?? '—'}; em TTP: ${bestDomainTtp?.domainShort ?? '—'}. Priorizar maturidade em DA, MDM, PP e BP tende a reforçar resultados quando a correlação for positiva.`);

  if (statsResolved.narrative) parts.push(statsResolved.narrative);
  return parts.join(' ');
}

// ============================================================================
// FUNNEL CALC
// ============================================================================
interface FunnelLevel { level:string; pct:number; siteCount:number; exclusiveSites:Site[]; ghq:number; }
interface FunnelMetrics { avg:string; totalSites:number; funnel:FunnelLevel[]; }

const calcFunnel = (sites: Site[], domain: string, zone: string, volFilter: string): FunnelMetrics => {
  const n = sites.length;
  const emptyFunnel: FunnelLevel[] = [
    {level:'L0',pct:0,siteCount:0,exclusiveSites:[],ghq:0},
    {level:'L1',pct:0,siteCount:0,exclusiveSites:[],ghq:0},
    {level:'L2',pct:0,siteCount:0,exclusiveSites:[],ghq:0},
    {level:'L3',pct:0,siteCount:0,exclusiveSites:[],ghq:0},
    {level:'L4',pct:0,siteCount:0,exclusiveSites:[],ghq:0},
  ];
  if (!n) return { avg:"0.00", totalSites:0, funnel:emptyFunnel };

  const byScore: Record<number,Site[]> = {0:[],1:[],2:[],3:[],4:[]};
  let sum = 0;
  sites.forEach(s => {
    const sc = s.scores[domain] ?? 0;
    sum += sc;
    byScore[Math.min(sc,4)].push(s);
  });

  let pe0=(byScore[0].length/n)*100, pe1=(byScore[1].length/n)*100,
      pe2=(byScore[2].length/n)*100, pe3=(byScore[3].length/n)*100;
  let avg=(sum/n).toFixed(2), total=n;

  if (volFilter==='All') {
    const s = GLOBAL_STATS[domain]?.[zone];
    if (s) { [pe0,pe1,pe2,pe3]=s.dist; avg=s.avg||avg; total=s.total||n; }
  }

  const pct0=100;
  const pct1=Math.max(0,Math.round(100-pe0));
  const pct2=Math.max(0,Math.round(100-pe0-pe1));
  const pct3=Math.max(0,Math.round(100-pe0-pe1-pe2));
  const pct4=Math.max(0,Math.round(100-pe0-pe1-pe2-pe3));
  const sc=(p:number)=>Math.round((p/100)*total);
  const ghq=GHQ_TOTALS[domain]?.[zone]??0;

  return {
    avg, totalSites:total,
    funnel:[
      {level:'L0',pct:pct0,siteCount:sc(pct0),exclusiveSites:byScore[0],ghq:(ghq*pct0)/100},
      {level:'L1',pct:pct1,siteCount:sc(pct1),exclusiveSites:byScore[1],ghq:(ghq*pct1)/100},
      {level:'L2',pct:pct2,siteCount:sc(pct2),exclusiveSites:byScore[2],ghq:(ghq*pct2)/100},
      {level:'L3',pct:pct3,siteCount:sc(pct3),exclusiveSites:byScore[3],ghq:(ghq*pct3)/100},
      {level:'L4',pct:pct4,siteCount:sc(pct4),exclusiveSites:byScore[4],ghq:(ghq*pct4)/100},
    ]
  };
};

const barColor=(l:string)=>l==='L0'?'#D1D5DB':l==='L1'?'#FFE066':l==='L2'?'#FFC000':l==='L3'?'#F59E0B':'#10B981';
const levelPill=(l:string,dark:boolean)=>{
  const base='inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ';
  if(l==='L0') return base+(dark?'bg-gray-700 text-gray-300':'bg-gray-100 text-gray-500');
  if(l==='L1') return base+(dark?'bg-yellow-900/60 text-yellow-300':'bg-yellow-100 text-yellow-700');
  if(l==='L2') return base+'bg-yellow-400 text-gray-900';
  if(l==='L3') return base+'bg-amber-500 text-white';
  return base+'bg-emerald-500 text-white';
};

// ============================================================================
// TOOLTIP — click to open, interactive, scrollable, portal-rendered
// Positioning: uses viewport-relative coords (fixed), no scrollY offset needed
// ============================================================================
interface TooltipProps { sites: Site[]; level: string; t: T; dark: boolean; }
const SiteTooltip: React.FC<TooltipProps> = ({ sites, level, t, dark }) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, below: false });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!triggerRef.current) return;
    if (visible) { setVisible(false); return; }
    const r = triggerRef.current.getBoundingClientRect();
    // Use viewport coords for fixed positioning — no scrollY needed
    setPos({ top: r.top, left: r.left + r.width / 2, below: false });
    setPage(0);
    setVisible(true);
  }, [visible]);

  // Reposition after tooltip renders to avoid overflow
  useEffect(() => {
    if (!visible || !tooltipRef.current || !triggerRef.current) return;
    const tp = tooltipRef.current.getBoundingClientRect();
    const tr = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const MARGIN = 10;
    const TIP_W = tp.width;
    const TIP_H = tp.height;

    // Vertical: prefer above, fallback below
    let top: number;
    let below = false;
    if (tr.top - TIP_H - MARGIN >= 0) {
      top = tr.top - TIP_H - MARGIN;
    } else {
      top = tr.bottom + MARGIN;
      below = true;
    }

    // Horizontal: center on trigger, clamp to viewport
    let left = tr.left + tr.width / 2 - TIP_W / 2;
    if (left < MARGIN) left = MARGIN;
    if (left + TIP_W > vw - MARGIN) left = vw - TIP_W - MARGIN;

    setPos({ top, left, below });
  }, [visible]);

  // Close on outside click
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible]);

  const bg = dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-950 border-gray-800 text-white';
  const totalPages = Math.ceil(sites.length / PAGE_SIZE);
  const pageSites = sites.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={toggle}
        className={'absolute inset-0 z-10 ' + (sites.length > 0 ? 'cursor-pointer' : 'cursor-default')}
        title={sites.length > 0 ? `${sites.length} sites exclusivos — clique para ver` : undefined}
      />
      {visible && ReactDOM.createPortal(
        <div
          ref={tooltipRef}
          className={'fixed z-[9999] rounded-2xl shadow-2xl border p-4 w-80 pointer-events-auto ' + (bg)}
          style={{ top: pos.top, left: pos.left }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={'flex items-center gap-2 border-b pb-2 mb-3 ' + (dark ? 'border-gray-700' : 'border-gray-800')}>
            <span className={levelPill(level, dark)}>{level}</span>
            <span className="font-bold text-sm flex-1">{t.tooltipSites(level, sites.length)}</span>
            <div className="flex items-center gap-1">
              {totalPages > 1 && (
                <span className="text-[10px] text-gray-400">{page + 1}/{totalPages}</span>
              )}
              <button
                onClick={() => setVisible(false)}
                className="ml-1 text-gray-500 hover:text-gray-300 text-lg leading-none"
              >×</button>
            </div>
          </div>

          {/* Site list */}
          {sites.length === 0
            ? <p className="text-gray-400 italic text-xs text-center py-3">{t.tooltipEmpty}</p>
            : <div className="space-y-1">
                {pageSites.map((s, i) => {
                  const zc = ZONE_COLORS[s.zone];
                  return (
                    <div key={i} className="flex items-center justify-between gap-2 py-1 border-b border-gray-800 last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={'px-1.5 py-0.5 rounded-full text-[9px] font-black border ' + (dark ? zc.darkBg + ' ' + zc.darkText : 'bg-gray-800 text-gray-200') + ' border-transparent'}>{s.zone}</span>
                        <span className="font-semibold text-xs truncate">{s.name}</span>
                      </div>
                      <span className="text-gray-400 text-[10px] whitespace-nowrap flex-shrink-0">{(s.volume / 1e6).toFixed(1)}M · {s.group}</span>
                    </div>
                  );
                })}
              </div>
          }

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-800">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2 py-1 rounded text-[11px] font-bold disabled:opacity-30 hover:bg-gray-800 transition-colors"
              >← Prev</button>
              <span className="text-[10px] text-gray-500">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sites.length)} de {sites.length}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="px-2 py-1 rounded text-[11px] font-bold disabled:opacity-30 hover:bg-gray-800 transition-colors"
              >Next →</button>
            </div>
          )}

          <p className="text-[9px] text-gray-500 mt-2 pt-2 border-t border-gray-800">{t.tooltipNote}</p>
        </div>,
        document.body
      )}
    </>
  );
};

// ============================================================================
// FUNNEL CARD
// ============================================================================
// FUNNEL CARD
// ============================================================================
interface FunnelCardProps { title:string; subtitle?:string; domain:string; zone:string; volFilter:string; sites:Site[]; isFeatured?:boolean; accent?:string; t:T; dark:boolean; }
const FunnelCard: React.FC<FunnelCardProps> = ({title,subtitle,domain,zone,volFilter,sites,isFeatured,accent,t,dark}) => {
  const {avg,totalSites,funnel} = useMemo(()=>calcFunnel(sites,domain,zone,volFilter),[sites,domain,zone,volFilter]);
  const ghqTotal = GHQ_TOTALS[domain]?.[zone]??0;
  const ghqCls = ghqTotal>=70
    ? (dark?'border-emerald-500 bg-emerald-900/30 text-emerald-300':'border-emerald-400 bg-emerald-50 text-emerald-800')
    : ghqTotal>=40
    ? (dark?'border-yellow-500 bg-yellow-900/30 text-yellow-300':'border-yellow-400 bg-yellow-50 text-yellow-800')
    : (dark?'border-red-500 bg-red-900/30 text-red-300':'border-red-300 bg-red-50 text-red-700');
  const cardBg = dark ? 'bg-gray-800 border-gray-700 hover:border-yellow-500' : 'bg-white border-gray-100 hover:border-yellow-300';

  return (
    <div className={'rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden ${cardBg} ' + (isFeatured?'h-full':'')}>
      {accent && <div className="h-1 w-full flex-shrink-0" style={{backgroundColor:accent}}/>}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div className="min-w-0 mr-3">
            <h3 className={'text-base font-black leading-tight ' + (dark?'text-white':'text-gray-900')}>{title}</h3>
            {subtitle&&<p className={'text-xs mt-0.5 ' + (dark?'text-gray-400':'text-gray-400')}>{subtitle}</p>}
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div className="flex gap-1.5">
              <span className={'border px-2 py-0.5 rounded-full text-[11px] font-bold ' + (ghqCls)}>GHQ {ghqTotal}%</span>
              <span className={'border px-2 py-0.5 rounded-full text-[11px] font-bold ' + (dark?'border-gray-600 bg-gray-700 text-gray-300':'border-gray-200 bg-gray-50 text-gray-700')}>Avg {avg}</span>
            </div>
            <span className={'text-[10px] font-medium ' + (dark?'text-gray-500':'text-gray-400')}>{totalSites} sites</span>
          </div>
        </div>

        {totalSites === 0 ? (
          <p className={'text-xs px-1 py-2 ' + (dark?'text-amber-400/90':'text-amber-600')}>{t.noSitesInFilter}</p>
        ) : (
          <div className="flex flex-grow" style={{minHeight:isFeatured?'240px':'200px'}}>
            {/* Funnel arrow */}
            <div className="w-7 flex-shrink-0 relative mr-3">
              <div className="absolute inset-0 flex flex-col items-center pt-2 pb-2">
                <div className="w-[3px] flex-1 bg-gradient-to-b from-gray-300 to-emerald-500 rounded-t"/>
                <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-emerald-500"/>
              </div>
              <span className={'absolute -top-1 left-1/2 -translate-x-1/2 text-[9px] font-black ' + (dark?'text-gray-500':'text-gray-400')}>L0</span>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black text-emerald-500">L4</span>
            </div>

            <div className="flex-grow flex flex-col justify-between py-0.5">
              {funnel.map(item => (
                <div key={item.level} className="flex items-center w-full relative">
                  <SiteTooltip sites={item.exclusiveSites} level={item.level} t={t} dark={dark}/>
                  <span className={'text-[11px] font-black w-7 flex-shrink-0 ' + (item.pct===0?(dark?'text-gray-600':'text-gray-300'):(dark?'text-gray-400':'text-gray-500'))}>{item.level}</span>
                  <div className="flex-grow mx-2">
                    <div className={'h-7 rounded-lg overflow-hidden border ' + (dark?'bg-gray-700 border-gray-600':'bg-gray-50 border-gray-100')}>
                      <div className="h-full rounded-lg transition-all duration-700 ease-out" style={{width: item.pct + '%', backgroundColor: barColor(item.level)}}/>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 justify-end" style={{minWidth:'80px'}}>
                    <span className={'font-black text-sm tabular-nums ' + (item.pct===0?(dark?'text-gray-600':'text-gray-300'):(dark?'text-white':'text-gray-900'))}>{item.pct}%</span>
                    <span className={'text-xs tabular-nums ' + (item.pct===0?(dark?'text-gray-700':'text-gray-200'):(dark?'text-gray-500':'text-gray-400'))}>({item.siteCount})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SITES TABLE
// ============================================================================
const DOMAIN_KEYS = [
  {key:"Brewing Performance",short:"BP"},{key:"Data Acquisition",short:"DA"},
  {key:"Utilities",short:"UT"},{key:"Maintenance",short:"MT"},
  {key:"Management",short:"MG"},{key:"MasterData Management",short:"MDM"},
  {key:"Packaging Performance",short:"PP"},{key:"Quality",short:"QL"},{key:"Safety",short:"SF"},
];

const ScoreDot: React.FC<{score:number;dark:boolean;siteName:string;domainShort:string;t:T}> = ({score,dark,siteName,domainShort,t}) => {
  const type = getSiteDomainType(siteName, domainShort);
  const isGlobal = type === 'G';
  const isLegacy = type === 'L';
  const cls = score===0?(dark?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-400')
            : score===1?(dark?'bg-yellow-800/60 text-yellow-300':'bg-yellow-100 text-yellow-700')
            : score===2?'bg-yellow-400 text-gray-900'
            : score===3?'bg-amber-500 text-white'
            : 'bg-emerald-500 text-white';
  const ring = isGlobal
    ? 'ring-2 ring-offset-1 ring-blue-400 ring-offset-transparent'
    : isLegacy
    ? 'ring-1 ring-offset-1 ring-gray-400 ring-offset-transparent'
    : '';
  const label = isGlobal ? t.global : isLegacy ? t.legacy : '-';
  return (
    <div className="relative inline-flex items-center justify-center" title={`L${score} · ${label}`}>
      <span className={'inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-black ${cls} ' + (ring)}>
        L{score}
      </span>
    </div>
  );
};

const SitesView: React.FC<{sites:Site[];t:T;dark:boolean;lang:string}> = ({sites,t,dark,lang}) => {
  const [sortBy,setSortBy] = useState<'name'|'zone'|'volume'|'avg'>('volume');
  const [sortDir,setSortDir] = useState<'asc'|'desc'>('desc');
  const [search,setSearch] = useState('');
  const [zoneFilter,setZoneFilter] = useState('All');

  const filtered = useMemo(()=>{
    let list = sites;
    if(zoneFilter!=='All') list = list.filter(s=>s.zone===zoneFilter);
    if(search) list = list.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||s.country.toLowerCase().includes(search.toLowerCase()));
    return [...list].sort((a,b)=>{
      if(sortBy==='name') return sortDir==='asc'?a.name.localeCompare(b.name):b.name.localeCompare(a.name);
      if(sortBy==='zone') return sortDir==='asc'?a.zone.localeCompare(b.zone):b.zone.localeCompare(a.zone);
      if(sortBy==='volume') return sortDir==='asc'?a.volume-b.volume:b.volume-a.volume;
      const avg=(s:Site)=>DOMAIN_KEYS.reduce((acc,d)=>acc+(s.scores[d.key]??0),0)/DOMAIN_KEYS.length;
      return sortDir==='asc'?avg(a)-avg(b):avg(b)-avg(a);
    });
  },[sites,sortBy,sortDir,search,zoneFilter]);

  const toggleSort=(col:typeof sortBy)=>{ if(sortBy===col) setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortBy(col);setSortDir('desc');}};
  const SortIcon=({col}:{col:typeof sortBy})=><span className="ml-0.5 opacity-50">{sortBy===col?(sortDir==='asc'?'↑':'↓'):'↕'}</span>;

  const inp = dark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-yellow-400' : 'bg-white border-gray-200 text-gray-900 focus:border-yellow-400';
  const th = dark ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-gray-50 text-gray-600 border-gray-100';
  const tr = dark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-50 hover:bg-gray-50';

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.searchPlaceholder} className={'w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ' + (inp)}/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{k:'All',label:t.allZones},...ZONES.map(z=>({k:z,label:z}))].map(({k,label})=>{
            const active=zoneFilter===k;
            return(
              <button key={k} onClick={()=>setZoneFilter(k)} className={'px-3 py-2 rounded-lg text-xs font-bold transition-all ' + (
                active?(dark?'bg-yellow-400 text-gray-900':'bg-gray-900 text-white'):
                       (dark?'bg-gray-700 text-gray-300 hover:bg-gray-600':'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')
              )}>{label}</button>
            );
          })}
        </div>
        <span className={'text-xs font-medium ml-auto ' + (dark?'text-gray-400':'text-gray-400')}>{filtered.length} sites</span>
      </div>

      {/* Legend: Global vs Legacy — per site, per domain */}
      <div className={'flex items-center gap-4 mb-3 px-1 text-xs ' + (dark?'text-gray-400':'text-gray-500')}>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 text-gray-900 text-[10px] font-black ring-2 ring-offset-1 ring-blue-400">L2</span>
          <span className={'inline-flex items-center gap-0.5 text-[10px] font-bold rounded px-1.5 py-0.5 ' + (dark?'bg-blue-900/40 text-blue-300':'bg-blue-50 text-blue-600')}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
            {t.global}
          </span>
          <span className="text-[10px]">{lang === 'pt' ? 'produto global ativo' : 'active global product'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-400 text-gray-900 text-[10px] font-black ring-1 ring-offset-1 ring-gray-400">L2</span>
          <span className={'inline-flex items-center gap-0.5 text-[10px] font-bold rounded px-1.5 py-0.5 ' + (dark?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-500')}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            {t.legacy}
          </span>
          <span className="text-[10px]">{lang === 'pt' ? 'produto legado ativo' : 'active legacy product'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={'inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ' + (dark?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-400')}>L0</span>
          <span className={'text-[10px] ' + (dark?'text-gray-500':'text-gray-400')}>{lang === 'pt' ? 'sem produto ativo' : 'no active product'}</span>
        </div>
      </div>

      <div className={'rounded-2xl border shadow-sm overflow-hidden ' + (dark?'bg-gray-800 border-gray-700':'bg-white border-gray-100')}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className={'border-b ' + (th)}>
                <th className="text-left px-4 py-3 text-xs font-black"><button onClick={()=>toggleSort('name')} className="flex items-center hover:opacity-100 opacity-80">{t.sortName}<SortIcon col="name"/></button></th>
                <th className="text-left px-3 py-3 text-xs font-black"><button onClick={()=>toggleSort('zone')} className="flex items-center hover:opacity-100 opacity-80">{t.sortZone}<SortIcon col="zone"/></button></th>
                <th className="text-right px-3 py-3 text-xs font-black"><button onClick={()=>toggleSort('volume')} className="flex items-center ml-auto hover:opacity-100 opacity-80">{t.sortVolume}<SortIcon col="volume"/></button></th>
                <th className="text-center px-2 py-3 text-xs font-black">{t.sortGroup}</th>
                {DOMAIN_KEYS.map(d=>(
                  <th key={d.key} title={d.key} className="text-center px-1 py-3 text-[10px] font-black">{d.short}</th>
                ))}
                <th className="text-center px-3 py-3 text-xs font-black"><button onClick={()=>toggleSort('avg')} className="flex items-center hover:opacity-100 opacity-80">{t.sortAvg}<SortIcon col="avg"/></button></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((site,i)=>{
                const scores=DOMAIN_KEYS.map(d=>site.scores[d.key]??0);
                const avg=(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(2);
                const zc=ZONE_COLORS[site.zone];
                return(
                  <tr key={`${site.name}-${i}`} className={'border-b transition-colors ' + (tr)}>
                    <td className="px-4 py-2.5">
                      <div className={'font-semibold text-sm ' + (dark?'text-white':'text-gray-900')}>{site.name}</div>
                      <div className={'text-[10px] ' + (dark?'text-gray-500':'text-gray-400')}>{site.country}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ' + (dark?zc.darkBg+' '+zc.darkText+' border-transparent':zc.bg+' '+zc.text+' '+zc.border)}>{site.zone}</span>
                    </td>
                    <td className={'px-3 py-2.5 text-right font-mono text-xs ' + (dark?'text-gray-400':'text-gray-600')}>{site.volume.toLocaleString('pt-BR')}</td>
                    <td className="px-2 py-2.5 text-center"><span className={'text-[10px] font-bold px-1.5 py-0.5 rounded ' + (dark?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-500')}>{site.group}</span></td>
                    {DOMAIN_KEYS.map((d,j)=>(
                      <td key={j} className="px-1 py-2.5 text-center">
                        <ScoreDot score={site.scores[d.key]??0} dark={dark} siteName={site.name} domainShort={d.short} t={t}/>
                      </td>
                    ))}
                    <td className={'px-3 py-2.5 text-center font-black text-sm ' + (dark?'text-white':'text-gray-900')}>{avg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// XLSX EXPORT
// ============================================================================
const loadXLSX = (): Promise<any> => new Promise((resolve, reject) => {
  if ((window as any).XLSX) { resolve((window as any).XLSX); return; }
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  script.onload = () => resolve((window as any).XLSX);
  script.onerror = reject;
  document.body.appendChild(script);
});

const exportXLSX = async (t: T) => {
  const XLSX = await loadXLSX();

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Sites (all raw data)
  const sitesData = ALL_SITES.map(s => ({
    [t.sortZone]: s.zone,
    [t.sortName]: s.name,
    'Country': s.country,
    [t.sortVolume]: s.volume,
    [t.sortGroup]: s.group,
    'BP Score': s.scores['Brewing Performance'] ?? 0,
    'DA Score': s.scores['Data Acquisition'] ?? 0,
    'UT Score': s.scores['Utilities'] ?? 0,
    'MT Score': s.scores['Maintenance'] ?? 0,
    'MG Score': s.scores['Management'] ?? 0,
    'MDM Score': s.scores['MasterData Management'] ?? 0,
    'PP Score': s.scores['Packaging Performance'] ?? 0,
    'QL Score': s.scores['Quality'] ?? 0,
    'SF Score': s.scores['Safety'] ?? 0,
    'Avg Score': (DOMAIN_KEYS.reduce((acc,d) => acc+(s.scores[d.key]??0), 0)/DOMAIN_KEYS.length).toFixed(2),
    'Maturity Level': `L${s.scores['Total Global'] ?? 0}`,
    'Domain Type Mix': DOMAIN_KEYS.filter(d => getSiteDomainType(s.name, d.short) === 'G').map(d => d.short).join('/') || '-',
  }));
  const ws1 = XLSX.utils.json_to_sheet(sitesData);
  ws1['!cols'] = [
    {wch:6},{wch:24},{wch:18},{wch:14},{wch:6},
    {wch:10},{wch:10},{wch:10},{wch:10},{wch:10},
    {wch:10},{wch:10},{wch:10},{wch:10},
    {wch:10},{wch:14},{wch:14},
  ];
  XLSX.utils.book_append_sheet(wb, ws1, t.xlsxSheetSites);

  // ── Sheet 2: Summary by Zone
  const zoneRows: any[] = [];
  ['Global',...ZONES].forEach(zone => {
    const zoneSites = zone === 'Global' ? ALL_SITES : ALL_SITES.filter(s => s.zone === zone);
    DOMAINS.forEach(domain => {
      if (domain === 'Total Global') return;
      const metrics = calcFunnel(zoneSites, domain, zone, 'All');
      metrics.funnel.forEach(fl => {
        zoneRows.push({
          Zone: zone,
          Domain: domain,
          'Domain Type': ['Data Acquisition','MasterData Management','Management'].includes(domain) ? t.global : t.legacy,
          Level: fl.level,
          'Pct (%)': fl.pct,
          'Site Count': fl.siteCount,
          'Avg Score': metrics.avg,
          'Total Sites': metrics.totalSites,
          'GHQ %': GHQ_TOTALS[domain]?.[zone] ?? 0,
          'Exclusive Sites': fl.exclusiveSites.map(s => s.name).join(', '),
        });
      });
    });
  });
  const ws2 = XLSX.utils.json_to_sheet(zoneRows);
  ws2['!cols'] = [{wch:8},{wch:26},{wch:10},{wch:6},{wch:8},{wch:10},{wch:10},{wch:10},{wch:8},{wch:60}];
  XLSX.utils.book_append_sheet(wb, ws2, t.xlsxSheetSummaryZone);

  // ── Sheet 3: Summary by Domain
  const domainRows: any[] = [];
  DOMAINS.filter(d => d !== 'Total Global').forEach(domain => {
    ZONES.forEach(zone => {
      const metrics = calcFunnel(ALL_SITES.filter(s => s.zone === zone), domain, zone, 'All');
      domainRows.push({
        Domain: domain,
        'Domain Type': ['Data Acquisition','MasterData Management','Management'].includes(domain) ? t.global : t.legacy,
        Zone: zone,
        'L0 %': metrics.funnel[0]?.pct ?? 0,
        'L1 %': metrics.funnel[1]?.pct ?? 0,
        'L2 %': metrics.funnel[2]?.pct ?? 0,
        'L3 %': metrics.funnel[3]?.pct ?? 0,
        'L4 %': metrics.funnel[4]?.pct ?? 0,
        'Avg Score': metrics.avg,
        'Total Sites': metrics.totalSites,
        'GHQ %': GHQ_TOTALS[domain]?.[zone] ?? 0,
      });
    });
    // Global total row
    const globalMetrics = calcFunnel(ALL_SITES, domain, 'Global', 'All');
    domainRows.push({
      Domain: domain,
      'Domain Type': ['Data Acquisition','MasterData Management','Management'].includes(domain) ? t.global : t.legacy,
      Zone: 'GLOBAL',
      'L0 %': globalMetrics.funnel[0]?.pct ?? 0,
      'L1 %': globalMetrics.funnel[1]?.pct ?? 0,
      'L2 %': globalMetrics.funnel[2]?.pct ?? 0,
      'L3 %': globalMetrics.funnel[3]?.pct ?? 0,
      'L4 %': globalMetrics.funnel[4]?.pct ?? 0,
      'Avg Score': globalMetrics.avg,
      'Total Sites': globalMetrics.totalSites,
      'GHQ %': GHQ_TOTALS[domain]?.['Global'] ?? 0,
    });
  });
  const ws3 = XLSX.utils.json_to_sheet(domainRows);
  ws3['!cols'] = [{wch:26},{wch:10},{wch:8},{wch:8},{wch:8},{wch:8},{wch:8},{wch:8},{wch:10},{wch:10},{wch:8}];
  XLSX.utils.book_append_sheet(wb, ws3, t.xlsxSheetSummaryDomain);

  XLSX.writeFile(wb, `${t.xlsxExportTitle}_${new Date().toISOString().slice(0,10)}.xlsx`);
};

// ============================================================================
// SIDEBAR
// ============================================================================
const Sidebar: React.FC<{volFilter:string;onFilter:(g:string)=>void;complexityFilter:string;onComplexity:(c:string)=>void;t:T;dark:boolean}> = ({volFilter,onFilter,complexityFilter,onComplexity,t,dark}) => {
  const counts = useMemo(()=>({
    All:ALL_SITES.length,
    G1:ALL_SITES.filter(s=>s.group==='G1').length,
    G2:ALL_SITES.filter(s=>s.group==='G2').length,
    G3:ALL_SITES.filter(s=>s.group==='G3').length,
  }),[]);

  const groups = [
    {key:'All', label:t.allSites,  range:t.fullUniverse, dotCls:'bg-gray-400'},
    {key:'G1',  label:'G1',        range:'< 2M HL',       dotCls:'bg-gray-300'},
    {key:'G2',  label:'G2',        range:'2–6M HL',       dotCls:'bg-gray-500'},
    {key:'G3',  label:'G3',        range:'> 6M HL',       dotCls:'bg-gray-800'},
  ];

  const levels = [
    {code:'L0', hex:'#D1D5DB'},
    {code:'L1', hex:'#FFE066'},
    {code:'L2', hex:'#FFC000'},
    {code:'L3', hex:'#F59E0B'},
    {code:'L4', hex:'#10B981'},
  ] as const;

  const card = dark?'bg-gray-800 border-gray-700':'bg-white border-gray-100';
  const hdr  = dark?'border-gray-700 text-gray-400':'border-gray-100 text-gray-500';

  return (
    <div className="flex flex-col gap-3">
      {/* Volume — compact pill row */}
      <div className={'rounded-xl border shadow-sm overflow-hidden ' + (card)}>
        <div className={'px-4 pt-3 pb-2 border-b ' + (hdr)}>
          <p className="text-[10px] font-black uppercase tracking-widest">{t.volumeGroups}</p>
        </div>
        <div className="p-2 flex flex-col gap-1">
          {groups.map(g=>{
            const active=volFilter===g.key;
            const count=counts[g.key as keyof typeof counts];
            return(
              <button key={g.key} onClick={()=>onFilter(g.key)}
                className={'w-full px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-2.5 ' + (
                  active
                    ? 'bg-yellow-400 text-gray-900'
                    : (dark?'text-gray-300 hover:bg-gray-700':'text-gray-600 hover:bg-gray-50')
                )}>
                <div className={'w-2.5 h-2.5 rounded-full flex-shrink-0 ' + (active?'bg-gray-900':g.dotCls)}/>
                <span className="text-xs font-bold flex-1 text-left">{g.label}</span>
                <span className={'text-[10px] font-normal ' + (active?'text-gray-700':dark?'text-gray-500':'text-gray-400')}>{g.range}</span>
                <span className={'text-[10px] font-bold tabular-nums min-w-[28px] text-right ' + (active?'text-gray-800':(dark?'text-gray-400':'text-gray-400'))}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Complexidade do Mix — mesmo estilo do volume; mesmo mix = menos complexo */}
      <div className={'rounded-xl border shadow-sm overflow-hidden ' + (card)}>
        <div className={'px-4 pt-3 pb-2 border-b ' + (hdr)}>
          <p className="text-[10px] font-black uppercase tracking-widest">Complexidade do mix</p>
        </div>
        <div className="p-2 flex flex-col gap-1">
          {([
            {key:'All', label:'Todos',  desc:'',                dotCls:'bg-gray-400',
             tooltip:'Todas as operações, sem filtro de complexidade.'},
            {key:'L',   label:'Baixa',  desc:'Domínios homogêneos', dotCls:'bg-indigo-300',
             tooltip:'Baixa heterogeneidade (1º tercil da variância de domínio).\nOperações com todos os domínios no mesmo nível: ex. 9 domínios todos em score 2 → variância zero.\nNeste dataset, captura principalmente operações L2 completamente equilibradas.\n⚠️ Para análise de maturidade vs resultados, use "Todos" — este filtro concentra operações no mesmo nível tecnológico, impossibilitando correlação.'},
            {key:'M',   label:'Média',  desc:'Domínios parcialmente assimétricos', dotCls:'bg-indigo-500',
             tooltip:'Heterogeneidade média (2º tercil).\nOperações com alguns domínios acima da média: ex. TG=2 mas BP=3, QL=3.\nMix de L1 avançados e L2 com capacidades diferenciadas em domínios específicos.\nUtil para identificar operações em transição de nível.'},
            {key:'H',   label:'Alta',   desc:'Domínios muito assimétricos', dotCls:'bg-indigo-800',
             tooltip:'Alta heterogeneidade (3º tercil).\nOperações com domínios muito desiguais: ex. score 2 em 8 domínios mas 0 em 1 domínio crítico → nível L0.\nCaptura principalmente operações L0/L1 onde o domínio mais fraco "segura" o nível global.\nIdeal para análise de onde concentrar investimento para destravar o próximo nível.'},
          ] as const).map(g=>{
            const active = complexityFilter === g.key;
            return (
              <button key={g.key} onClick={()=>onComplexity(g.key)} title={g.tooltip}
                className={'w-full px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-2.5 ' + (
                  active ? 'bg-yellow-400 text-gray-900' : (dark?'text-gray-300 hover:bg-gray-700':'text-gray-600 hover:bg-gray-50')
                )}>
                <div className={'w-2.5 h-2.5 rounded-full flex-shrink-0 ' + (active ? 'bg-gray-900' : g.dotCls)}/>
                <span className="text-xs font-bold flex-1 text-left">{g.label}</span>
                <span className={'text-[10px] font-normal truncate max-w-[80px] ' + (active?'text-gray-700':dark?'text-gray-500':'text-gray-400')}>{g.desc}</span>
              </button>
            );
          })}
        </div>
        <div className={'px-4 pb-2 pt-1 border-t ' + (hdr)}>
          <p className="text-[9px] leading-snug">Tercis do dataset. Volume real (9 KPIs PB-R0xxx) quando disponível; proxy pela variância de scores de domínio caso contrário.</p>
        </div>
      </div>

      {/* Glide Path — compact */}
      <div className={'rounded-xl border shadow-sm overflow-hidden ' + (card)}>
        <div className={'px-4 pt-3 pb-2 border-b ' + (hdr)}>
          <p className="text-[10px] font-black uppercase tracking-widest">{t.glidePathTitle}</p>
        </div>
        <div className="p-2">
          {levels.map((l,i)=>{
            const info = t.levels[l.code as keyof typeof t.levels];
            const isLast = i === levels.length-1;
            return(
              <div key={l.code} className="flex items-stretch gap-2.5">
                {/* connector column */}
                <div className="flex flex-col items-center w-6 flex-shrink-0">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border border-black/10" style={{backgroundColor:l.hex}}>
                    <span className="text-[9px] font-black text-gray-800">{l.code}</span>
                  </div>
                  {!isLast && <div className={'w-px flex-1 my-0.5 ' + (dark?'bg-gray-600':'bg-gray-200')}/>}
                </div>
                {/* text */}
                <div className={'py-1 ' + (!isLast?'pb-2':'')}>
                  <p className={'text-[11px] font-bold leading-tight ' + (dark?'text-gray-200':'text-gray-800')}>{info.label}</p>
                  <p className={'text-[9px] leading-snug ' + (dark?'text-gray-500':'text-gray-400')}>{info.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MATURITY VS RESULTS VIEW — mesa analítica (4 blocos: filtros, quadro, domínio, insights)
// ============================================================================

const PRODUCT_FILTER_OPTIONS: { key: ProductType | 'All'; label: string }[] = [
  { key: 'All', label: 'Todos' },
  { key: 'beer_only', label: 'Só cerveja' },
  { key: 'mixed_beer_soft_drink', label: 'Misto cerveja+refrig' },
  { key: 'soft_drink_only', label: 'Só refrigerante' },
  { key: 'water_only', label: 'Só água' },
  { key: 'mixed_other', label: 'Multi/outros' },
  { key: 'unknown', label: 'Sem dados' },
];
const COMPLEXITY_OPTIONS: { key: string; label: string }[] = [
  { key: 'All', label: 'Todos' },
  { key: 'L', label: 'Baixa' },
  { key: 'M', label: 'Média' },
  { key: 'H', label: 'Alta' },
];

// ── helpers para Maturidade × Resultados ────────────────────────────────────

function buildByZoneOseTtp(
  sites: Site[],
  siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>
): { zone: string; siteCount: number; withKpiCount: number; avgMaturity: number; avgOsePct: number | null; avgTtp: number | null }[] {
  return ZONES.map(zone => {
    const zoneSites = sites.filter(s => s.zone === zone);
    const withKpi = zoneSites.filter(s => siteOseTtp[s.name]?.ose != null || siteOseTtp[s.name]?.ttp != null);
    const oseVals = zoneSites.filter(s => siteOseTtp[s.name]?.ose != null).map(s => siteOseTtp[s.name].ose! * 100);
    const ttpVals = zoneSites.filter(s => siteOseTtp[s.name]?.ttp != null).map(s => siteOseTtp[s.name].ttp!);
    const avgMaturity = zoneSites.length ? zoneSites.reduce((a, s) => a + (s.scores['Total Global'] ?? 0), 0) / zoneSites.length : 0;
    return {
      zone,
      siteCount: zoneSites.length,
      withKpiCount: withKpi.length,
      avgMaturity,
      avgOsePct: oseVals.length ? oseVals.reduce((a, b) => a + b, 0) / oseVals.length : null,
      avgTtp: ttpVals.length ? ttpVals.reduce((a, b) => a + b, 0) / ttpVals.length : null,
    };
  }).filter(z => z.siteCount > 0);
}

// Componentes internos da mesa analítica
const MaturityResultsFilters: React.FC<{
  productFilter: string; onProduct: (v: string) => void;
  complexityFilter: string; onComplexity: (v: string) => void;
  hasVolumeData: boolean; dark: boolean; t: T;
}> = ({ productFilter, onProduct, complexityFilter, onComplexity, hasVolumeData, dark, t }) => {
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const btn = (active: boolean, key: string) =>
    'px-3 py-1.5 rounded-lg text-xs font-semibold ' + (active ? 'bg-yellow-400 text-gray-900' : (dark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'));
  return (
    <div className={'rounded-xl border p-4 ' + (card)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className={'text-[10px] font-black uppercase tracking-wider mb-2 ' + (dark ? 'text-gray-400' : 'text-gray-500')}>Perfil de produto</p>
          <div className="flex flex-wrap gap-1.5">
            {PRODUCT_FILTER_OPTIONS.map(o => (
              <button key={o.key} type="button" onClick={() => onProduct(o.key)} className={btn(productFilter === o.key, o.key)}>
                {o.label}
              </button>
            ))}
          </div>
          {!hasVolumeData && <p className={'mt-1.5 text-[10px] ' + (dark ? 'text-amber-400/80' : 'text-amber-600')}>Requer KPIs de volume (PB/PC/PP-R*).</p>}
        </div>
        <div>
          <p className={'text-[10px] font-black uppercase tracking-wider mb-2 ' + (dark ? 'text-gray-400' : 'text-gray-500')}>Perfil operacional (complexidade)</p>
          <div className="flex flex-wrap gap-1.5">
            {COMPLEXITY_OPTIONS.map(o => (
              <button key={o.key} type="button" onClick={() => onComplexity(o.key)} className={btn(complexityFilter === o.key, o.key)}>
                {o.label}
              </button>
            ))}
          </div>
          {!hasVolumeData && <p className={'mt-1.5 text-[10px] ' + (dark ? 'text-gray-500' : 'text-gray-500')}>Proxy por domínios até haver KPIs de volume.</p>}
        </div>
      </div>
    </div>
  );
};

// ── SparkBar helper ──────────────────────────────────────────────────────────
const SparkBar: React.FC<{
  value: number | null;
  max: number;
  color: string;
  label: string;
  dark: boolean;
}> = ({ value, max, color, label, dark }) => {
  if (value == null || max <= 0) return <span className={dark ? 'text-gray-600' : 'text-gray-400'}>—</span>;
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-1.5 min-w-[110px]">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: dark ? '#374151' : '#e5e7eb' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className={'text-xs tabular-nums font-medium ' + (dark ? 'text-gray-300' : 'text-gray-700')}>{label}</span>
    </div>
  );
};

// ── Nível Tecnológico × Resultados ───────────────────────────────────────────
interface LevelRow { level: string; siteCount: number; withKpiCount: number; avgOse: number | null; avgTtp: number | null; }
const LEVEL_HEX: Record<string,string> = { L0:'#6b7280', L1:'#f59e0b', L2:'#f97316', L3:'#10b981', L4:'#059669' };

const corrBadge = (r: number | null | undefined, label: string, dark: boolean) => {
  if (r == null) return null;
  const color = r >= 0.3 ? (dark?'text-emerald-400 bg-emerald-900/30 border-emerald-700':'text-emerald-700 bg-emerald-50 border-emerald-300')
    : r <= -0.3 ? (dark?'text-red-400 bg-red-900/30 border-red-700':'text-red-700 bg-red-50 border-red-300')
    : (dark?'text-amber-400 bg-amber-900/30 border-amber-700':'text-amber-700 bg-amber-50 border-amber-200');
  return <span className={'px-2 py-0.5 rounded border text-[11px] font-bold ' + color}>r({label}) = {r.toFixed(2)}</span>;
};

const MaturityLevelTable: React.FC<{ levels: LevelRow[]; stats: StatsAnalysis; dark: boolean }> = ({ levels, stats, dark }) => {
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const th = dark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200';
  const td = dark ? 'text-gray-200 border-gray-700/40' : 'text-gray-800 border-gray-100';
  const maxOse = Math.max(...levels.map(l => l.avgOse ?? 0), 0.0001);
  const maxTtp = Math.max(...levels.map(l => l.avgTtp ?? 0), 0.0001);
  const l0 = levels.find(l => l.level === 'L0');
  return (
    <div className={'rounded-xl border overflow-hidden ' + card}>
      <div className={'px-5 py-3.5 border-b flex items-start justify-between gap-3 flex-wrap ' + (dark ? 'border-gray-700' : 'border-gray-200')}>
        <div>
          <p className={'text-xs font-black uppercase tracking-wider ' + (dark?'text-gray-400':'text-gray-500')}>Por Nível Tecnológico (L0 → L4)</p>
          <p className={'text-[11px] mt-0.5 ' + (dark?'text-gray-500':'text-gray-400')}>OSE média (%) e produtividade técnica total (TTP hl/h) por nível</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {corrBadge(stats.correlationOse, 'OSE', dark)}
          {corrBadge(stats.correlationTtp, 'TTP', dark)}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead><tr>
            <th className={'px-4 py-2.5 border-b text-xs font-semibold ' + th}>Nível</th>
            <th className={'px-4 py-2.5 border-b text-xs font-semibold text-right ' + th}>Sites</th>
            <th className={'px-4 py-2.5 border-b text-xs font-semibold text-right ' + th}>Com KPI</th>
            <th className={'px-4 py-2.5 border-b text-xs font-semibold ' + th + ' min-w-[200px]'}>OSE (%)</th>
            <th className={'px-4 py-2.5 border-b text-xs font-semibold text-right ' + th}>Δ vs L0</th>
            <th className={'px-4 py-2.5 border-b text-xs font-semibold ' + th + ' min-w-[200px]'}>TTP (hl/h)</th>
          </tr></thead>
          <tbody>
            {levels.map(l => {
              const hasData = l.withKpiCount > 0;
              const oseBase = l0?.avgOse ?? null;
              const delta = (oseBase != null && l.avgOse != null && l.level !== 'L0') ? ((l.avgOse - oseBase) / oseBase) * 100 : null;
              return (
                <tr key={l.level} className={hasData ? '' : (dark?'opacity-30':'opacity-20')}>
                  <td className={'px-4 py-3 border-b ' + td}>
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{backgroundColor: LEVEL_HEX[l.level]}} />
                      <span className="font-black text-base">{l.level}</span>
                    </span>
                  </td>
                  <td className={'px-4 py-3 border-b text-right tabular-nums ' + td}>{l.siteCount}</td>
                  <td className={'px-4 py-3 border-b text-right tabular-nums ' + td}>{l.withKpiCount}</td>
                  <td className={'px-4 py-3 border-b ' + td}>
                    <SparkBar value={l.avgOse} max={maxOse} color="#10b981" label={l.avgOse != null ? (l.avgOse * 100).toFixed(1) + '%' : '—'} dark={dark} />
                  </td>
                  <td className={'px-4 py-3 border-b text-right tabular-nums text-xs font-semibold ' + td}>
                    {delta == null ? '—' : <span className={delta >= 0 ? (dark?'text-emerald-400':'text-emerald-600') : (dark?'text-red-400':'text-red-600')}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)}%</span>}
                  </td>
                  <td className={'px-4 py-3 border-b ' + td}>
                    <SparkBar value={l.avgTtp} max={maxTtp} color="#3b82f6" label={l.avgTtp != null ? l.avgTtp.toFixed(0) + ' hl/h' : '—'} dark={dark} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {stats.narrative && <div className={'px-5 py-3 border-t text-xs leading-relaxed ' + (dark?'border-gray-700 text-gray-400 bg-gray-800/50':'border-gray-200 text-gray-600 bg-gray-50')}>{stats.narrative}</div>}
    </div>
  );
};

// ── Domínio × Resultados ──────────────────────────────────────────────────────
const DomainTable: React.FC<{ domainAnalysis: DomainAnalysis; dark: boolean }> = ({ domainAnalysis, dark }) => {
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const th = dark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200';
  const td = dark ? 'text-gray-200 border-gray-700/40' : 'text-gray-800 border-gray-100';
  const rows = domainAnalysis.rows;
  const maxMat = Math.max(...rows.map(r => r.avgMaturity), 0.01);
  const maxOse = Math.max(...rows.map(r => r.avgOsePct ?? 0), 0.01);
  const maxTtp = Math.max(...rows.map(r => r.avgTtp ?? 0), 0.01);
  const bestOse = rows.filter(r => r.avgOsePct != null).sort((a,b) => (b.avgOsePct??0)-(a.avgOsePct??0))[0];
  const bestTtp = rows.filter(r => r.avgTtp != null).sort((a,b) => (b.avgTtp??0)-(a.avgTtp??0))[0];
  return (
    <div className={'rounded-xl border overflow-hidden ' + card}>
      <div className={'px-5 py-3.5 border-b flex items-start justify-between gap-3 flex-wrap ' + (dark?'border-gray-700':'border-gray-200')}>
        <div>
          <p className={'text-xs font-black uppercase tracking-wider ' + (dark?'text-gray-400':'text-gray-500')}>Por Domínio Tecnológico</p>
          <p className={'text-[11px] mt-0.5 ' + (dark?'text-gray-500':'text-gray-400')}>Maturidade média × OSE e TTP de sites com score ≥ L2 no domínio</p>
        </div>
        <div className={'text-[11px] flex gap-3 flex-wrap ' + (dark?'text-gray-500':'text-gray-400')}>
          {domainAnalysis.correlationMaturityOse != null && <span>r(Mat×OSE) <strong className={dark?'text-gray-300':'text-gray-700'}>{domainAnalysis.correlationMaturityOse.toFixed(2)}</strong></span>}
          {domainAnalysis.correlationMaturityTtp != null && <span>r(Mat×TTP) <strong className={dark?'text-gray-300':'text-gray-700'}>{domainAnalysis.correlationMaturityTtp.toFixed(2)}</strong></span>}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead><tr>
            <th className={'px-4 py-2.5 border-b font-semibold ' + th}>Domínio</th>
            <th className={'px-4 py-2.5 border-b font-semibold text-right ' + th}>Sites ≥L2</th>
            <th className={'px-4 py-2.5 border-b font-semibold ' + th + ' min-w-[160px]'}>Maturidade média</th>
            <th className={'px-4 py-2.5 border-b font-semibold ' + th + ' min-w-[160px]'}>OSE (%)</th>
            <th className={'px-4 py-2.5 border-b font-semibold ' + th + ' min-w-[160px]'}>TTP (hl/h)</th>
          </tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.domain}>
                <td className={'px-4 py-2.5 border-b ' + td}>
                  <span className="font-semibold">{r.domain}</span>
                  {(r.domain === bestOse?.domain || r.domain === bestTtp?.domain) && (
                    <span className={'ml-1.5 text-[10px] px-1.5 py-0.5 rounded font-bold ' + (dark?'bg-yellow-400/20 text-yellow-300':'bg-yellow-100 text-yellow-700')}>
                      {r.domain === bestOse?.domain && r.domain === bestTtp?.domain ? '★OSE+TTP' : r.domain === bestOse?.domain ? '★OSE' : '★TTP'}
                    </span>
                  )}
                </td>
                <td className={'px-4 py-2.5 border-b text-right tabular-nums ' + td}>{r.siteCount}</td>
                <td className={'px-4 py-2.5 border-b ' + td}><SparkBar value={r.avgMaturity} max={maxMat} color="#f59e0b" label={r.avgMaturity.toFixed(2)} dark={dark} /></td>
                <td className={'px-4 py-2.5 border-b ' + td}><SparkBar value={r.avgOsePct} max={maxOse} color="#10b981" label={r.avgOsePct != null ? r.avgOsePct.toFixed(1)+'%' : '—'} dark={dark} /></td>
                <td className={'px-4 py-2.5 border-b ' + td}><SparkBar value={r.avgTtp} max={maxTtp} color="#3b82f6" label={r.avgTtp != null ? r.avgTtp.toFixed(0)+' hl/h' : '—'} dark={dark} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {domainAnalysis.answerMatureDomain && (
        <div className={'px-5 py-2.5 border-t text-xs leading-relaxed ' + (dark?'border-gray-700 text-gray-400 bg-gray-800/50':'border-gray-200 text-gray-600 bg-gray-50')}>
          {domainAnalysis.answerMatureDomain}
        </div>
      )}
    </div>
  );
};

// ── Explorador de Sites ───────────────────────────────────────────────────────
type SortKey = 'name' | 'zone' | 'maturity' | 'ose' | 'ttp' | 'vpo';
const SiteExplorer: React.FC<{
  sites: Site[];
  siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>;
  dark: boolean;
  vpoData?: VpoData | null;
  quadrantFilter?: QuadrantFilter;
  vpoMedian?: number;
}> = ({ sites, siteOseTtp, dark, vpoData, quadrantFilter, vpoMedian }) => {
  const [sortKey, setSortKey] = useState<SortKey>('maturity');
  const [sortAsc, setSortAsc] = useState(false);
  const [zoneFilter, setZoneFilter] = useState('All');
  const [search, setSearch] = useState('');

  const sorted = useMemo(() => {
    let list = [...sites];
    if (zoneFilter !== 'All') list = list.filter(s => s.zone === zoneFilter);
    if (search) list = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    if (quadrantFilter && quadrantFilter !== 'all' && vpoData && vpoMedian != null) {
      list = list.filter(s => {
        const techHigh = (s.scores['Total Global'] ?? 0) >= 2;
        const vScore = vpoData[s.name]?.overall_score;
        if (vScore == null) return false;
        const vpoHigh = vScore >= vpoMedian;
        if (quadrantFilter === 'tech_high_vpo_high') return techHigh && vpoHigh;
        if (quadrantFilter === 'tech_high_vpo_low') return techHigh && !vpoHigh;
        if (quadrantFilter === 'tech_low_vpo_high') return !techHigh && vpoHigh;
        if (quadrantFilter === 'tech_low_vpo_low') return !techHigh && !vpoHigh;
        return true;
      });
    }
    list.sort((a, b) => {
      let diff = 0;
      if (sortKey === 'name') diff = a.name.localeCompare(b.name);
      else if (sortKey === 'zone') diff = a.zone.localeCompare(b.zone);
      else if (sortKey === 'maturity') diff = (a.scores['Total Global']??0) - (b.scores['Total Global']??0);
      else if (sortKey === 'ose') diff = ((siteOseTtp[a.name]?.ose ?? -1)) - ((siteOseTtp[b.name]?.ose ?? -1));
      else if (sortKey === 'ttp') diff = ((siteOseTtp[a.name]?.ttp ?? -1)) - ((siteOseTtp[b.name]?.ttp ?? -1));
      else if (sortKey === 'vpo') diff = ((vpoData?.[a.name]?.overall_score ?? -1)) - ((vpoData?.[b.name]?.overall_score ?? -1));
      return sortAsc ? diff : -diff;
    });
    return list;
  }, [sites, sortKey, sortAsc, zoneFilter, search, siteOseTtp, quadrantFilter, vpoData, vpoMedian]);

  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const th = dark ? 'text-gray-400 border-gray-700 bg-gray-800' : 'text-gray-500 border-gray-200 bg-gray-50';
  const td = dark ? 'text-gray-200 border-gray-700/40' : 'text-gray-800 border-gray-100';
  const thBtn = (k: SortKey) => 'cursor-pointer select-none hover:opacity-70 ' + (sortKey === k ? (dark?'text-yellow-400':'text-yellow-600') : '');

  const toggle = (k: SortKey) => {
    if (sortKey === k) setSortAsc(!sortAsc);
    else { setSortKey(k); setSortAsc(false); }
  };

  const maturityLevel = (s: Site) => {
    const v = s.scores['Total Global'] ?? 0;
    return 'L' + Math.min(4, Math.max(0, Math.round(v)));
  };

  return (
    <div className={'rounded-xl border overflow-hidden ' + card}>
      <div className={'px-5 py-3.5 border-b ' + (dark?'border-gray-700':'border-gray-200')}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className={'text-xs font-black uppercase tracking-wider ' + (dark?'text-gray-400':'text-gray-500')}>Explorador de Sites</p>
            <p className={'text-[11px] mt-0.5 ' + (dark?'text-gray-500':'text-gray-400')}>
              {sorted.length} operações · clique no cabeçalho para ordenar
              {quadrantFilter && quadrantFilter !== 'all' && (
                <span className={dark ? 'text-yellow-400' : 'text-yellow-600'}> · filtro de quadrante ativo</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar site..."
              className={'px-2.5 py-1 text-xs rounded-lg border ' + (dark?'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500':'bg-white border-gray-300 text-gray-800 placeholder-gray-400')}
            />
            <div className="flex gap-1">
              {['All', ...ZONES].map(z => (
                <button key={z} onClick={() => setZoneFilter(z)}
                  className={'px-2 py-1 rounded text-xs font-semibold ' + (zoneFilter === z ? 'bg-yellow-400 text-gray-900' : (dark?'text-gray-400 hover:bg-gray-700':'text-gray-500 hover:bg-gray-100'))}>
                  {z === 'All' ? 'Todas' : z}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className={'px-3 py-2.5 border-b font-semibold ' + th + ' ' + thBtn('name')} onClick={() => toggle('name')}>Site {sortKey==='name'&&(sortAsc?'↑':'↓')}</th>
              <th className={'px-3 py-2.5 border-b font-semibold ' + th + ' ' + thBtn('zone')} onClick={() => toggle('zone')}>Zona {sortKey==='zone'&&(sortAsc?'↑':'↓')}</th>
              <th className={'px-3 py-2.5 border-b font-semibold ' + th + ' ' + thBtn('maturity')} onClick={() => toggle('maturity')}>Nível {sortKey==='maturity'&&(sortAsc?'↑':'↓')}</th>
              <th className={'px-3 py-2.5 border-b font-semibold ' + th}>Score Global</th>
              <th className={'px-3 py-2.5 border-b font-semibold ' + th + ' ' + thBtn('vpo')} onClick={() => toggle('vpo')}>VPO % {sortKey==='vpo'&&(sortAsc?'↑':'↓')}</th>
              <th className={'px-3 py-2.5 border-b font-semibold ' + th + ' ' + thBtn('ose')} onClick={() => toggle('ose')}>OSE % {sortKey==='ose'&&(sortAsc?'↑':'↓')}</th>
              <th className={'px-3 py-2.5 border-b font-semibold ' + th + ' ' + thBtn('ttp')} onClick={() => toggle('ttp')}>TTP hl/h {sortKey==='ttp'&&(sortAsc?'↑':'↓')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(s => {
              const lvl = maturityLevel(s);
              const kpi = siteOseTtp[s.name];
              const ose = kpi?.ose != null ? (kpi.ose * 100).toFixed(1) + '%' : null;
              const ttp = kpi?.ttp != null ? kpi.ttp.toFixed(0) + ' hl/h' : null;
              const zc = ZONE_COLORS[s.zone];
              return (
                <tr key={s.name}>
                  <td className={'px-3 py-2 border-b font-medium ' + td}>{s.name}</td>
                  <td className={'px-3 py-2 border-b ' + td}>
                    <span className={'px-1.5 py-0.5 rounded text-[10px] font-bold ' + (dark ? zc.darkBg + ' ' + zc.darkText : zc.bg + ' ' + zc.text)}>{s.zone}</span>
                  </td>
                  <td className={'px-3 py-2 border-b ' + td}>
                    <span className="font-black text-sm" style={{color: LEVEL_HEX[lvl]}}>{lvl}</span>
                  </td>
                  <td className={'px-3 py-2 border-b tabular-nums ' + td}>{(s.scores['Total Global']??0).toFixed(2)}</td>
                  <td className={'px-3 py-2 border-b tabular-nums ' + td}>
                    {(() => {
                      const vScore = vpoData?.[s.name]?.overall_score;
                      if (vScore == null) return <span className={dark?'text-gray-600':'text-gray-400'}>—</span>;
                      const pct = (vScore * 100).toFixed(0) + '%';
                      const clr = vScore >= 0.85 ? (dark?'text-emerald-400':'text-emerald-700') : vScore >= 0.70 ? (dark?'text-amber-400':'text-amber-600') : (dark?'text-red-400':'text-red-600');
                      return <span className={'font-semibold ' + clr}>{pct}</span>;
                    })()}
                  </td>
                  <td className={'px-3 py-2 border-b tabular-nums ' + (ose ? (dark?'text-emerald-300':'text-emerald-700') : (dark?'text-gray-600':'text-gray-400'))}>
                    {ose ?? '—'}
                  </td>
                  <td className={'px-3 py-2 border-b tabular-nums ' + (ttp ? (dark?'text-blue-300':'text-blue-700') : (dark?'text-gray-600':'text-gray-400'))}>
                    {ttp ?? '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Narrativa analítica gerada automaticamente ───────────────────────────────
function generateAnalyticalNarrative(
  levels: LevelRow[],
  stats: StatsAnalysis,
  domainAnalysis: DomainAnalysis
): string[] {
  const paragraphs: string[] = [];
  const rOse = stats.correlationOse ?? null;
  const rTtp = stats.correlationTtp ?? null;
  const fmtPct = (v: number | null) => v != null ? (v * 100).toFixed(1) + '%' : 'N/D';

  // — Parágrafo 1: correlação macro
  const strOse = rOse == null ? 'sem dados' : Math.abs(rOse) >= 0.5 ? 'forte' : Math.abs(rOse) >= 0.3 ? 'moderada' : rOse >= 0 ? 'fraca' : 'negativa';
  const strTtp = rTtp == null ? 'sem dados' : Math.abs(rTtp) >= 0.5 ? 'forte' : Math.abs(rTtp) >= 0.3 ? 'moderada' : rTtp >= 0 ? 'fraca' : 'negativa';
  const bothPositive = (rOse != null && rOse >= 0.3) && (rTtp != null && rTtp >= 0.3);
  const onePositive = !bothPositive && ((rOse != null && rOse >= 0.3) || (rTtp != null && rTtp >= 0.3));
  const conclusion = bothPositive
    ? 'sustentando a hipótese central de que o avanço tecnológico se traduz em eficiência operacional mensurável'
    : onePositive
    ? 'sugerindo uma correlação assimétrica — o efeito da maturidade tecnológica aparece com clareza em apenas um dos indicadores, o que merece investigação por zona e porte'
    : 'indicando que, nesta amostra e janela temporal, o nível tecnológico por si só não explica a variação nos KPIs operacionais — fatores como zona, porte e mix de produto podem estar diluindo o sinal';
  paragraphs.push(
    `A análise de correlação de Pearson entre nível tecnológico (L0→L4) e indicadores operacionais revela associação <strong>${strOse}</strong> com OSE (r&nbsp;=&nbsp;${rOse?.toFixed(2) ?? '—'}) e <strong>${strTtp}</strong> com TTP (r&nbsp;=&nbsp;${rTtp?.toFixed(2) ?? '—'}), ${conclusion}.`
  );

  // — Parágrafo 2: progressão OSE por nível
  const levWithOse = levels.filter(l => l.avgOse != null && isFinite(l.avgOse));
  if (levWithOse.length >= 2) {
    const bestOse = [...levWithOse].sort((a, b) => b.avgOse! - a.avgOse!)[0];
    const l0 = levWithOse.find(l => l.level === 'L0');
    const lTop = levWithOse[levWithOse.length - 1];
    let bigJump = { from: '', to: '', delta: 0 };
    for (let i = 1; i < levWithOse.length; i++) {
      const d = levWithOse[i].avgOse! - levWithOse[i - 1].avgOse!;
      if (d > bigJump.delta) bigJump = { from: levWithOse[i - 1].level, to: levWithOse[i].level, delta: d };
    }
    const gapText = l0 && lTop && l0.level !== lTop.level
      ? ` A diferença entre ${l0.level} (${fmtPct(l0.avgOse)}) e ${lTop.level} (${fmtPct(lTop.avgOse)}) é de ${((lTop.avgOse! - l0.avgOse!) * 100).toFixed(1)} p.p.`
      : '';
    const jumpText = bigJump.from
      ? ` O salto mais expressivo ocorre na transição ${bigJump.from}→${bigJump.to} (+${(bigJump.delta * 100).toFixed(1)} p.p.), que representa o ponto de maior retorno no contínuo de maturidade.`
      : '';
    paragraphs.push(
      `Em OSE, o nível ${bestOse.level} registra a maior média do portfólio (${fmtPct(bestOse.avgOse)}).${gapText}${jumpText}`
    );
  }

  // — Parágrafo 3: progressão TTP por nível
  const levWithTtp = levels.filter(l => l.avgTtp != null && isFinite(l.avgTtp));
  if (levWithTtp.length >= 2) {
    const bestTtp = [...levWithTtp].sort((a, b) => b.avgTtp! - a.avgTtp!)[0];
    const l0t = levWithTtp.find(l => l.level === 'L0');
    const lTopt = levWithTtp[levWithTtp.length - 1];
    let bigJt = { from: '', to: '', delta: 0 };
    for (let i = 1; i < levWithTtp.length; i++) {
      const d = levWithTtp[i].avgTtp! - levWithTtp[i - 1].avgTtp!;
      if (d > bigJt.delta) bigJt = { from: levWithTtp[i - 1].level, to: levWithTtp[i].level, delta: d };
    }
    const gapTtp = l0t && lTopt && l0t.level !== lTopt.level
      ? ` Variação entre ${l0t.level} (${l0t.avgTtp!.toFixed(0)} hl/h) e ${lTopt.level} (${lTopt.avgTtp!.toFixed(0)} hl/h): ${(lTopt.avgTtp! - l0t.avgTtp!).toFixed(0)} hl/h.`
      : '';
    const jumpTtp = bigJt.from
      ? ` A transição ${bigJt.from}→${bigJt.to} concentra o maior ganho em throughput (+${bigJt.delta.toFixed(0)} hl/h).`
      : '';
    paragraphs.push(
      `Para TTP (throughput de produção), ${bestTtp.level} lidera com ${bestTtp.avgTtp!.toFixed(0)} hl/h de média.${gapTtp}${jumpTtp}`
    );
  }

  // — Parágrafo 4: domínios
  if (domainAnalysis.rows.length > 0) {
    const sorted = [...domainAnalysis.rows].sort((a, b) => b.avgMaturity - a.avgMaturity);
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    const rDomOse = domainAnalysis.correlationMaturityOse;
    const rDomTtp = domainAnalysis.correlationMaturityTtp;
    const corrDomText = rDomOse != null || rDomTtp != null
      ? ` A correlação entre maturidade média por domínio e OSE é r&nbsp;=&nbsp;${rDomOse?.toFixed(2) ?? '—'}, e com TTP é r&nbsp;=&nbsp;${rDomTtp?.toFixed(2) ?? '—'}.`
      : '';
    const topOseText = top.avgOsePct != null
      ? ` Sites com score ≥2 em ${top.domainShort} apresentam OSE médio de ${top.avgOsePct.toFixed(1)}%.`
      : '';
    paragraphs.push(
      `Na decomposição por domínio, <strong>${top.domainShort}</strong> lidera a maturidade média (${top.avgMaturity.toFixed(2)} pts) enquanto <strong>${bottom.domainShort}</strong> é o domínio com maior oportunidade de desenvolvimento (${bottom.avgMaturity.toFixed(2)} pts).${topOseText}${corrDomText}`
    );
  }

  // — Parágrafo 5: interpretação para PM
  if (bothPositive) {
    paragraphs.push(
      `<strong>Implicação estratégica:</strong> os dados sustentam o case de investimento em maturidade tecnológica como alavanca de eficiência. A correlação positiva em ambos os indicadores indica que operações em níveis mais avançados entregam resultados consistentemente superiores. A prioridade deve ser acelerar a jornada das operações em L0 e L1, que concentram a maior lacuna de performance e, portanto, o maior potencial de retorno marginal.`
    );
  } else if (onePositive) {
    paragraphs.push(
      `<strong>Implicação estratégica:</strong> o relacionamento é assimétrico entre OSE e TTP, sugerindo que esses indicadores têm drivers distintos — TTP responde mais fortemente ao porte e ao mix de produto, enquanto OSE reflete mais diretamente a disciplina de processo. Recomenda-se segmentar a análise por zona e cluster de volume (G1/G2/G3) antes de definir a tese de investimento em cada domínio.`
    );
  } else {
    paragraphs.push(
      `<strong>Implicação estratégica:</strong> a correlação fraca não elimina o efeito da maturidade — ela pode estar sendo diluída por variáveis confundidoras (zona geográfica, porte, mix de produto). O explorador de sites abaixo permite identificar outliers e entender casos onde operações de baixo nível tecnológico entregam bons KPIs (ou vice-versa). Uma análise controlada por cluster de volume é o próximo passo recomendado.`
    );
  }

  return paragraphs;
}

const AnalyticalNarrative: React.FC<{
  levels: LevelRow[];
  stats: StatsAnalysis;
  domainAnalysis: DomainAnalysis;
  dark: boolean;
}> = ({ levels, stats, domainAnalysis, dark }) => {
  const paragraphs = useMemo(
    () => generateAnalyticalNarrative(levels, stats, domainAnalysis),
    [levels, stats, domainAnalysis]
  );
  if (!paragraphs.length) return null;
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMuted = dark ? 'text-gray-400' : 'text-gray-500';
  const textBody = dark ? 'text-gray-200' : 'text-gray-700';
  return (
    <div className={'rounded-xl border p-5 ' + card}>
      <p className={'text-[10px] font-black uppercase tracking-widest mb-3 ' + textMuted}>Análise Interpretativa</p>
      <div className={'space-y-3 text-sm leading-relaxed ' + textBody}>
        {paragraphs.map((p, i) => (
          <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
        ))}
      </div>
    </div>
  );
};

// ── Análise Tri-Dimensional: Tech × Processo VPO × Resultados ────────────────
const VPO_PILLARS = ['Environment', 'Logistics', 'Maintenance', 'Management', 'People', 'Quality', 'Safety'] as const;
const VPO_PILLAR_SHORT: Record<string, string> = {
  'Environment': 'Env', 'Logistics': 'Log', 'Maintenance': 'Mnt',
  'Management': 'Mgmt', 'People': 'Ppl', 'Quality': 'Qlty', 'Safety': 'Safe',
};

interface TriDimSiteRow {
  name: string;
  zone: string;
  techLevel: string;      // L0-L4
  techScore: number;      // Total Global 0-4
  vpoScore: number | null;  // % compliance overall
  vpoPillars: Record<string, number | null>;
  ose: number | null;     // 0-1
  ttp: number | null;     // hl/h
}

interface TriDimQuadrant {
  label: string;
  description: string;
  sites: TriDimSiteRow[];
  avgOse: number | null;
  avgTtp: number | null;
  color: string;
}

function buildTriDimAnalysis(
  sites: Site[],
  siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>,
  vpoData: VpoData
): {
  rows: TriDimSiteRow[];
  quadrants: TriDimQuadrant[];
  corrTechVpo: number | null;
  corrVpoOse: number | null;
  corrVpoTtp: number | null;
  corrTechOse: number | null;
  corrTechTtp: number | null;
  vpoMedian: number;
  pillarCorrelations: Record<string, { rOse: number | null; rTtp: number | null }>;
} {
  const rows: TriDimSiteRow[] = [];
  for (const site of sites) {
    const vpo = vpoData[site.name];
    if (!vpo || vpo.overall_score == null) continue;
    const kpi = siteOseTtp[site.name];
    const pillars: Record<string, number | null> = {};
    for (const p of VPO_PILLARS) {
      pillars[p] = vpo.pillars[p]?.score ?? null;
    }
    rows.push({
      name: site.name,
      zone: site.zone,
      techLevel: getMaturityLevel(site),
      techScore: site.scores['Total Global'] ?? 0,
      vpoScore: vpo.overall_score,
      vpoPillars: pillars,
      ose: kpi?.ose ?? null,
      ttp: kpi?.ttp ?? null,
    });
  }

  // VPO median for quadrant split
  const vpoScores = rows.map(r => r.vpoScore!).sort((a, b) => a - b);
  const vpoMedian = vpoScores.length > 0 ? vpoScores[Math.floor(vpoScores.length / 2)] : 0.5;

  // Quadrants: techLevel ≤ L1 vs ≥ L2, VPO < median vs ≥ median
  const quadDefs: { label: string; description: string; techHigh: boolean; vpoHigh: boolean; color: string }[] = [
    { label: 'Tech Alta + Processo Forte', description: 'Excelência: tecnologia e processo maduros, máximo potencial de resultado', techHigh: true, vpoHigh: true, color: '#10b981' },
    { label: 'Tech Alta + Processo Fraco', description: 'Gap de processo: tecnologia disponível mas subutilizada por falta de disciplina VPO', techHigh: true, vpoHigh: false, color: '#f59e0b' },
    { label: 'Tech Baixa + Processo Forte', description: 'Eficiência manual: bons processos compensam limitação tecnológica', techHigh: false, vpoHigh: true, color: '#3b82f6' },
    { label: 'Tech Baixa + Processo Fraco', description: 'Duplo gap: prioridade para intervenção — nem tecnologia nem processo suportam resultado', techHigh: false, vpoHigh: false, color: '#ef4444' },
  ];

  const quadrants: TriDimQuadrant[] = quadDefs.map(q => {
    const filtered = rows.filter(r => {
      const techHigh = r.techScore >= 2;
      const vpoHigh = r.vpoScore! >= vpoMedian;
      return techHigh === q.techHigh && vpoHigh === q.vpoHigh;
    });
    const oseVals = filtered.map(r => r.ose).filter((v): v is number => v != null && isFinite(v));
    const ttpVals = filtered.map(r => r.ttp).filter((v): v is number => v != null && isFinite(v));
    return {
      label: q.label,
      description: q.description,
      sites: filtered,
      avgOse: oseVals.length ? oseVals.reduce((a, b) => a + b, 0) / oseVals.length : null,
      avgTtp: ttpVals.length ? ttpVals.reduce((a, b) => a + b, 0) / ttpVals.length : null,
      color: q.color,
    };
  });

  // Correlations
  const withAll = rows.filter(r => r.ose != null && r.ttp != null);
  const corrTechVpo = pearson(rows.map(r => r.techScore), rows.map(r => r.vpoScore!));
  const corrVpoOse = pearson(withAll.map(r => r.vpoScore!), withAll.map(r => r.ose!));
  const corrVpoTtp = pearson(withAll.map(r => r.vpoScore!), withAll.map(r => r.ttp!));
  const corrTechOse = pearson(withAll.map(r => r.techScore), withAll.map(r => r.ose!));
  const corrTechTtp = pearson(withAll.map(r => r.techScore), withAll.map(r => r.ttp!));

  // Per-pillar correlations
  const pillarCorrelations: Record<string, { rOse: number | null; rTtp: number | null }> = {};
  for (const p of VPO_PILLARS) {
    const withPillar = withAll.filter(r => r.vpoPillars[p] != null);
    pillarCorrelations[p] = {
      rOse: pearson(withPillar.map(r => r.vpoPillars[p]!), withPillar.map(r => r.ose!)),
      rTtp: pearson(withPillar.map(r => r.vpoPillars[p]!), withPillar.map(r => r.ttp!)),
    };
  }

  return { rows, quadrants, corrTechVpo, corrVpoOse, corrVpoTtp, corrTechOse, corrTechTtp, vpoMedian, pillarCorrelations };
}

const TriDimensionalView: React.FC<{
  sites: Site[];
  siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>;
  vpoData: VpoData;
  dark: boolean;
  quadrantFilter: QuadrantFilter;
  onQuadrantFilter: (q: QuadrantFilter) => void;
}> = ({ sites, siteOseTtp, vpoData, dark, quadrantFilter, onQuadrantFilter }) => {
  const analysis = useMemo(() => buildTriDimAnalysis(sites, siteOseTtp, vpoData), [sites, siteOseTtp, vpoData]);

  if (analysis.rows.length < 5) return null;

  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const hdr = dark ? 'text-gray-400' : 'text-gray-500';
  const th = dark ? 'text-gray-400 bg-gray-900/50' : 'text-gray-500 bg-gray-50';
  const td = dark ? 'border-gray-700' : 'border-gray-100';
  const txt = dark ? 'text-gray-200' : 'text-gray-700';

  const fmtR = (r: number | null) => r == null ? '—' : r.toFixed(2);
  const rClr = (r: number | null) =>
    r == null ? (dark ? 'text-gray-500' : 'text-gray-400') :
    r >= 0.3 ? (dark ? 'text-emerald-400' : 'text-emerald-600') :
    r <= -0.3 ? (dark ? 'text-red-400' : 'text-red-600') :
    (dark ? 'text-amber-400' : 'text-amber-600');

  // Generate narrative
  const narrative = useMemo(() => {
    const { corrTechVpo, corrVpoOse, corrVpoTtp, corrTechOse, corrTechTtp, quadrants, pillarCorrelations, rows } = analysis;
    const p: string[] = [];

    // Para 1: relationship between tech and process
    const techVpoStr = corrTechVpo == null ? 'indeterminada' : corrTechVpo >= 0.3 ? 'positiva' : corrTechVpo <= -0.3 ? 'negativa' : 'fraca';
    p.push(`<strong>Tecnologia × Processo:</strong> A correlação entre maturidade tecnológica e score VPO é <strong>${techVpoStr}</strong> (r=${fmtR(corrTechVpo)}). ${
      corrTechVpo != null && corrTechVpo >= 0.3
        ? 'Plantas com maior investimento tecnológico tendem a ter processos mais maduros — reforço mútuo entre as duas dimensões.'
        : corrTechVpo != null && corrTechVpo <= -0.3
        ? 'Surpreendentemente, há uma relação inversa — plantas com mais tecnologia têm processos menos disciplinados, sugerindo dependência excessiva de automação.'
        : 'As duas dimensões evoluem de forma relativamente independente nesta amostra — ter tecnologia avançada não garante processo maduro (e vice-versa).'
    }`);

    // Para 2: which dimension drives results more?
    const vpoStronger = (Math.abs(corrVpoOse ?? 0) + Math.abs(corrVpoTtp ?? 0)) > (Math.abs(corrTechOse ?? 0) + Math.abs(corrTechTtp ?? 0));
    p.push(`<strong>O que impulsiona resultados?</strong> Processo VPO → OSE: r=${fmtR(corrVpoOse)}, VPO → TTP: r=${fmtR(corrVpoTtp)}. Tecnologia → OSE: r=${fmtR(corrTechOse)}, Tech → TTP: r=${fmtR(corrTechTtp)}. ${
      vpoStronger
        ? 'A maturidade de processo (VPO) é <strong>mais preditiva</strong> de resultados do que a maturidade tecnológica isoladamente.'
        : 'A maturidade tecnológica mostra <strong>correlação mais forte</strong> com os KPIs do que o score VPO, sugerindo que a tecnologia tem peso direto no resultado.'
    }`);

    // Para 3: quadrant insight
    const q0 = quadrants[0]; // Tech Alta + Processo Forte
    const q1 = quadrants[1]; // Tech Alta + Processo Fraco
    const q2 = quadrants[2]; // Tech Baixa + Processo Forte
    const q3 = quadrants[3]; // Tech Baixa + Processo Fraco
    if (q0.avgOse != null && q1.avgOse != null) {
      const gap = (q0.avgOse - q1.avgOse) * 100;
      p.push(`<strong>Efeito do processo:</strong> Plantas com tech alta E processo forte (${q0.sites.length} sites) alcançam OSE ${(q0.avgOse*100).toFixed(1)}% vs ${(q1.avgOse*100).toFixed(1)}% das que têm tech alta mas processo fraco (${q1.sites.length} sites) — diferença de <strong>${gap.toFixed(1)} p.p.</strong> ${
        gap > 3 ? 'Isso demonstra que a tecnologia só se traduz em resultado quando acompanhada de disciplina de processo.' :
        gap > 0 ? 'A diferença existe mas é modesta — a tecnologia por si só já entrega parte do valor.' :
        'Surpreendentemente, o processo não acrescenta valor adicional em plantas de alta tecnologia nesta amostra.'
      }`);
    }
    if (q2.avgOse != null && q3.avgOse != null) {
      const gap2 = (q2.avgOse - q3.avgOse) * 100;
      p.push(`<strong>Processo sem tecnologia:</strong> Mesmo sem tecnologia avançada, plantas com VPO forte (${q2.sites.length} sites) alcançam OSE ${(q2.avgOse*100).toFixed(1)}% vs ${(q3.avgOse*100).toFixed(1)}% das com processo fraco (${q3.sites.length} sites) — ${gap2 > 3 ? `um delta de ${gap2.toFixed(1)} p.p., confirmando que processo maduro gera resultado independente do nível tecnológico` : `diferença de ${gap2.toFixed(1)} p.p.`}.`);
    }

    // Para 4: pillar insights
    const pillarEntries = Object.entries(pillarCorrelations)
      .filter(([, v]) => v.rOse != null || v.rTtp != null)
      .sort((a, b) => Math.abs(b[1].rOse ?? 0) - Math.abs(a[1].rOse ?? 0));
    if (pillarEntries.length >= 2) {
      const best = pillarEntries[0];
      const worst = pillarEntries[pillarEntries.length - 1];
      p.push(`<strong>Pilares VPO mais impactantes:</strong> O pilar com maior influência nos resultados é <strong>${best[0]}</strong> (r(OSE)=${fmtR(best[1].rOse)}, r(TTP)=${fmtR(best[1].rTtp)}), enquanto <strong>${worst[0]}</strong> tem menor impacto direto (r(OSE)=${fmtR(worst[1].rOse)}). Investir em ${best[0]} tende a ter o maior retorno operacional.`);
    }

    return p;
  }, [analysis]);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className={'rounded-xl border p-5 ' + card}>
        <p className={'text-[10px] font-black uppercase tracking-widest mb-1.5 ' + hdr}>Análise Tri-Dimensional</p>
        <p className={'text-lg font-black leading-snug mb-1 ' + (dark?'text-white':'text-gray-900')}>
          Tecnologia × Processo VPO × Resultados
        </p>
        <p className={'text-xs mb-4 ' + hdr}>
          {analysis.rows.length} operações com dados nas 3 dimensões · mediana VPO: {(analysis.vpoMedian * 100).toFixed(0)}%
        </p>

        {/* Correlation matrix */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          {[
            { label: 'Tech → VPO', r: analysis.corrTechVpo },
            { label: 'VPO → OSE', r: analysis.corrVpoOse },
            { label: 'VPO → TTP', r: analysis.corrVpoTtp },
            { label: 'Tech → OSE', r: analysis.corrTechOse },
            { label: 'Tech → TTP', r: analysis.corrTechTtp },
          ].map(({ label, r }) => (
            <div key={label} className={'rounded-lg px-3 py-2.5 text-center ' + (dark?'bg-gray-700/60':'bg-gray-50 border border-gray-200')}>
              <p className={'text-[9px] font-bold uppercase ' + hdr}>{label}</p>
              <p className={'text-xl font-black mt-0.5 ' + rClr(r)}>{fmtR(r)}</p>
              <p className={'text-[10px] ' + rClr(r)}>{
                r == null ? 'sem dados' : r >= 0.3 ? 'positiva' : r <= -0.3 ? 'negativa' : 'fraca'
              }</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quadrants (clickable filter) ── */}
      <div className={'rounded-xl border p-5 ' + card}>
        <div className="flex items-center justify-between mb-3">
          <p className={'text-[10px] font-black uppercase tracking-widest ' + hdr}>Quadrantes Estratégicos</p>
          {quadrantFilter !== 'all' && (
            <button onClick={() => onQuadrantFilter('all')}
              className={'text-[10px] font-semibold px-2 py-0.5 rounded ' + (dark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
              ✕ Limpar filtro
            </button>
          )}
        </div>
        <p className={'text-[11px] mb-3 ' + hdr}>Clique em um quadrante para filtrar o Explorador de Sites abaixo</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {analysis.quadrants.map((q, i) => {
            const qKey = QUADRANT_KEYS[i];
            const isActive = quadrantFilter === qKey;
            const isDimmed = quadrantFilter !== 'all' && !isActive;
            return (
              <div key={q.label}
                onClick={() => onQuadrantFilter(isActive ? 'all' : qKey)}
                className={'rounded-lg border px-4 py-3 cursor-pointer transition-all ' +
                  (isActive ? (dark ? 'border-yellow-500 bg-gray-700/80 ring-1 ring-yellow-500/50' : 'border-yellow-400 bg-yellow-50 ring-1 ring-yellow-300') :
                   isDimmed ? (dark ? 'border-gray-800 opacity-40' : 'border-gray-200 opacity-40') :
                   (dark ? 'border-gray-700 hover:border-gray-500' : 'border-gray-200 hover:border-gray-400'))}
                style={{ borderLeftWidth: 4, borderLeftColor: q.color }}>
                <p className={'text-sm font-bold ' + (dark?'text-white':'text-gray-900')}>{q.label}</p>
                <p className={'text-[10px] mb-2 ' + hdr}>{q.description}</p>
                <div className="flex gap-4 text-xs">
                  <span className={txt}><strong>{q.sites.length}</strong> sites</span>
                  <span className={dark?'text-emerald-400':'text-emerald-700'}>OSE: <strong>{q.avgOse != null ? (q.avgOse*100).toFixed(1)+'%' : '—'}</strong></span>
                  <span className={dark?'text-blue-400':'text-blue-700'}>TTP: <strong>{q.avgTtp != null ? q.avgTtp.toFixed(0)+' hl/h' : '—'}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pillar Heatmap ── */}
      <div className={'rounded-xl border p-5 overflow-x-auto ' + card}>
        <p className={'text-[10px] font-black uppercase tracking-widest mb-3 ' + hdr}>Impacto por Pilar VPO nos Resultados</p>
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className={'text-left px-3 py-2 ' + th}>Pilar VPO</th>
              <th className={'text-center px-3 py-2 ' + th}>Score Médio</th>
              <th className={'text-center px-3 py-2 ' + th}>r(OSE)</th>
              <th className={'text-center px-3 py-2 ' + th}>r(TTP)</th>
              <th className={'px-3 py-2 ' + th}>Impacto</th>
            </tr>
          </thead>
          <tbody>
            {VPO_PILLARS.map(p => {
              const scores = analysis.rows.map(r => r.vpoPillars[p]).filter((v): v is number => v != null);
              const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
              const pc = analysis.pillarCorrelations[p];
              const impact = Math.max(Math.abs(pc?.rOse ?? 0), Math.abs(pc?.rTtp ?? 0));
              const barW = Math.min(100, impact * 200);
              return (
                <tr key={p}>
                  <td className={'px-3 py-2 border-b font-medium ' + td}>{p} <span className={hdr}>({VPO_PILLAR_SHORT[p]})</span></td>
                  <td className={'px-3 py-2 border-b text-center tabular-nums ' + td}>{avg != null ? (avg * 100).toFixed(0) + '%' : '—'}</td>
                  <td className={'px-3 py-2 border-b text-center font-bold tabular-nums ' + td + ' ' + rClr(pc?.rOse ?? null)}>{fmtR(pc?.rOse ?? null)}</td>
                  <td className={'px-3 py-2 border-b text-center font-bold tabular-nums ' + td + ' ' + rClr(pc?.rTtp ?? null)}>{fmtR(pc?.rTtp ?? null)}</td>
                  <td className={'px-3 py-2 border-b ' + td}>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 rounded-full" style={{ width: barW + '%', backgroundColor: impact >= 0.3 ? '#10b981' : impact >= 0.15 ? '#f59e0b' : '#94a3b8', minWidth: 4 }} />
                      <span className={'text-[10px] tabular-nums ' + hdr}>{(impact * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Narrativa ── */}
      <div className={'rounded-xl border p-5 ' + card}>
        <p className={'text-[10px] font-black uppercase tracking-widest mb-3 ' + hdr}>Interpretação Analítica — Três Dimensões</p>
        <div className={'space-y-3 text-sm leading-relaxed ' + txt}>
          {narrative.map((p, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
          ))}
        </div>
      </div>
    </div>
  );
};

// ── View principal ────────────────────────────────────────────────────────────
// ── Portfolio: Local/Legacy system names per zone × domain ───────────────────
// Source: OneMes Readiness and Coverage.xlsx (columns: AFR-Traksys, MAZ-Suite360, etc.)
// ⚠️ = data gap — needs business input to complete
// Format: { systemName, domains[], note? }
interface LocalSystem { name: string; domains: string[]; note?: string; }
const LOCAL_SYSTEMS: Record<string, LocalSystem[]> = {
  AFR: [
    { name: 'Traksys',        domains: ['Brewing Performance', 'Quality'] },
    { name: 'MMIS/Digit BS',  domains: ['Brewing Performance'] },
    // ⚠️ gaps: DA, MT, MDM, UT, PP, SF, MG — no local system identified in source data
  ],
  APAC: [
    { name: 'Bluebox',        domains: ['Data Acquisition'], note: 'China only' },
    { name: 'Local SCADA/MES',domains: ['Brewing Performance', 'Packaging Performance', 'Quality'], note: 'China' },
    { name: 'Local systems',  domains: ['Brewing Performance', 'Quality'], note: 'India/Vietnam/Korea' },
    { name: 'DST',            domains: ['Safety'] },
    // ⚠️ gaps: MT, MDM, UT, MG — no local system identified
  ],
  EUR: [
    { name: 'iSamlesbury',    domains: ['Safety'], note: 'Samlesbury only' },
    { name: 'iMagor',         domains: ['Safety'], note: 'Magor only' },
    { name: 'LPA Digital',    domains: ['Safety'] },
    { name: 'Excel/SharePoint',domains: ['Safety'] },
    // ⚠️ gaps: BP, DA, MT, MDM, UT, PP, QL, MG — no local system identified
  ],
  MAZ: [
    { name: 'Traksys',        domains: ['Brewing Performance', 'Quality'] },
    { name: 'Suite 360',      domains: ['Brewing Performance'] },
    { name: 'Safety360',      domains: ['Safety'] },
    { name: 'SmartSheet',     domains: ['Safety'] },
    // ⚠️ gaps: DA, MT, MDM, UT, PP, MG — no local system identified
  ],
  NAZ: [
    // ⚠️ FULL GAP — no local system identified in source data. Needs business input.
  ],
  SAZ: [
    // ⚠️ FULL GAP — no local system identified in source data. Needs business input.
  ],
};

// ── Global product tech levels ────────────────────────────────────────────────
// Tech level = highest L achievable by the global product when fully deployed.
// Derived from GLOBAL_STATS distribution — APAC (most advanced zone) shows max achievable level.
// ⚠️ Needs validation from product teams — these are best-estimate from deployment data.
// Protocol: 'Acquisition' products (SODA ETL, SODA MDM) map to L2/L3 with data integration.
//           'Acknowledgement' products (Omnia, Guardian, MAX) map to L2 base, L3 with advanced config.
const GLOBAL_PRODUCT_LEVELS: Record<string, { level: string; note: string; confirmed: boolean }> = {
  'Omnia BMS':       { level: 'L2', note: 'Brewing control + real-time monitoring. L3 in roadmap.', confirmed: false },
  'SODA ETL':        { level: 'L3', note: 'APAC: 68% sites at L3. Data acquisition + analytics.', confirmed: false },
  'MAX WO':          { level: 'L2', note: 'Work orders + planned maintenance.', confirmed: false },
  'MAX PS':          { level: 'L2', note: 'Predictive scheduling module.', confirmed: false },
  'MAX SP':          { level: 'L2', note: 'Spare parts management.', confirmed: false },
  'Acadia':          { level: 'L3', note: 'APAC: 68% at L3. Operational intelligence platform.', confirmed: false },
  'InterActionLog':  { level: 'L2', note: 'Shift log + action tracking.', confirmed: false },
  'SPLAN':           { level: 'L2', note: 'Production planning + scheduling.', confirmed: false },
  'SODA MDM':        { level: 'L3', note: 'APAC: 68% at L3. Master data governance + integration.', confirmed: false },
  'Omnia LMS':       { level: 'L2', note: 'Line management + OEE tracking.', confirmed: false },
  'Omnia OM':        { level: 'L2', note: 'Order management + execution.', confirmed: false },
  'Omnia IQ':        { level: 'L2', note: 'In-process quality control.', confirmed: false },
  'Omnia PH':        { level: 'L2', note: 'Process hygiene monitoring.', confirmed: false },
  'Sensory One':     { level: 'L2', note: 'Sensory + lab quality management.', confirmed: false },
  'Guardian':        { level: 'L3', note: 'APAC/AFR: 54–67% at L3. Safety compliance + analytics.', confirmed: false },
};

// ── Portfolio Intelligence: Global vs Legacy ──────────────────────────────────
interface DomainZonePortfolioRow {
  domain: string; short: string; zone: string; // 'Global' for aggregate
  nGlobal: number; nLegacy: number; nNeither: number; nTotal: number;
  avgScoreGlobal: number | null; avgScoreLegacy: number | null; avgScoreNone: number | null;
  globalCoveragePct: number; // nGlobal / (nGlobal + nLegacy) — excludes nNeither
  parityStatus: 'global_leading' | 'approaching' | 'legacy_dominant' | 'absent';
  decommReady: boolean;
  decommGap: number; // Legacy sites remaining to migrate
}

function computePortfolioMatrix(sites: Site[]): DomainZonePortfolioRow[] {
  const zones = [...ZONES, 'Global'] as string[];
  const rows: DomainZonePortfolioRow[] = [];
  for (const dk of DOMAIN_KEYS.filter(d => d.key !== 'Total Global')) {
    for (const zone of zones) {
      const zoneSites = zone === 'Global' ? sites : sites.filter(s => s.zone === zone);
      let nG = 0, nL = 0, nN = 0;
      const scoresG: number[] = [], scoresL: number[] = [], scoresNone: number[] = [];
      for (const s of zoneSites) {
        const ptype = getSiteDomainType(s.name, dk.short);
        const score = s.scores[dk.key] ?? 0;
        if (ptype === 'G') { nG++; if (score > 0) scoresG.push(score); }
        else if (ptype === 'L') { nL++; if (score > 0) scoresL.push(score); }
        else { nN++; if (score > 0) scoresNone.push(score); }
      }
      const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
      const aG = avg(scoresG), aL = avg(scoresL);
      const activePair = nG + nL;
      const covPct = activePair > 0 ? nG / activePair : 0;
      // Parity status logic
      let parityStatus: DomainZonePortfolioRow['parityStatus'];
      if (nG === 0) {
        parityStatus = activePair > 0 ? 'legacy_dominant' : 'absent';
      } else if (aG != null && aL != null) {
        if (aG >= aL && covPct >= 0.70) parityStatus = 'global_leading';
        else if (aG >= aL - 0.3 && covPct >= 0.30) parityStatus = 'approaching';
        else parityStatus = 'legacy_dominant';
      } else {
        parityStatus = covPct >= 0.70 ? 'global_leading' : 'approaching';
      }
      const decommReady = parityStatus === 'global_leading';
      rows.push({ domain: dk.key, short: dk.short, zone, nGlobal: nG, nLegacy: nL, nNeither: nN, nTotal: zoneSites.length, avgScoreGlobal: aG, avgScoreLegacy: aL, avgScoreNone: avg(scoresNone), globalCoveragePct: covPct, parityStatus, decommReady, decommGap: nL });
    }
  }
  return rows;
}

// ── PortfolioIntelligenceView — Zone-Individualized ──────────────────────────
const PortfolioIntelligenceView: React.FC<{
  sites: Site[]; dark: boolean; t: T; lang: Lang;
  productCoverage: ProductCoverageData | null;
}> = ({ sites, dark, t, productCoverage }) => {
  const [selectedZone, setSelectedZone] = useState<string>('AFR');
  const [domainFilter, setDomainFilter] = useState<string>('all');

  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const sub = dark ? 'text-gray-400' : 'text-gray-500';
  const h2 = 'text-[10px] font-black uppercase tracking-widest mb-1 ' + sub;
  const td = dark ? 'text-gray-200 border-gray-700/40' : 'text-gray-800 border-gray-100';

  const LEVEL_HEX: Record<string,string> = { L0:'#6b7280',L1:'#f59e0b',L2:'#f97316',L3:'#10b981',L4:'#059669' };

  const statusColors = {
    global_leading: { dot:'#10b981', text: dark?'text-emerald-400':'text-emerald-700', bg: dark?'bg-emerald-900/20':'bg-emerald-50' },
    approaching:    { dot:'#f59e0b', text: dark?'text-amber-400':'text-amber-700',   bg: dark?'bg-amber-900/20':'bg-amber-50'   },
    legacy_dominant:{ dot:'#ef4444', text: dark?'text-red-400':'text-red-700',       bg: dark?'bg-red-900/20':'bg-red-50'       },
    absent:         { dot:'#6b7280', text: sub,                                         bg: dark?'bg-gray-700/20':'bg-gray-100'   },
  };

  // Build domain-level data for selected zone
  const zoneSites = useMemo(() => sites.filter(s => s.zone === selectedZone), [sites, selectedZone]);
  const domainData = useMemo(() => {
    return DOMAIN_KEYS.filter(dk => dk.key !== 'Total Global').map(dk => {
      // Sites classified by product type
      const globalSites: { name: string; score: number }[] = [];
      const legacySites: { name: string; score: number }[] = [];
      const noneSites:   { name: string; score: number }[] = [];
      for (const s of zoneSites) {
        const ptype = getSiteDomainType(s.name, dk.short);
        const score = s.scores[dk.key] ?? 0;
        const entry = { name: s.name, score };
        if (ptype === 'G') globalSites.push(entry);
        else if (ptype === 'L') legacySites.push(entry);
        else noneSites.push(entry);
      }
      const avgScore = (arr: {score:number}[]) => arr.length ? arr.reduce((a,e)=>a+e.score,0)/arr.length : null;
      const aG = avgScore(globalSites.filter(s=>s.score>0));
      const aL = avgScore(legacySites.filter(s=>s.score>0));
      // Global products for this domain — ALL zones aggregated for capilarity view
      // Each product shows: total live globally + sites in selectedZone specifically
      type GlobalProductRow = { product: string; nZone: number; nGlobal: number; byZone: Record<string, number> };
      const globalProductMap: Record<string, GlobalProductRow> = {};
      if (productCoverage) {
        for (const z of ZONES) {
          for (const p of productCoverage[z]?.[dk.key] ?? []) {
            if (!globalProductMap[p.product]) globalProductMap[p.product] = { product: p.product, nZone: 0, nGlobal: 0, byZone: {} };
            globalProductMap[p.product].nGlobal += p.n;
            globalProductMap[p.product].byZone[z] = p.n;
            if (z === selectedZone) globalProductMap[p.product].nZone = p.n;
          }
        }
      }
      const globalProducts: GlobalProductRow[] = Object.values(globalProductMap).sort((a, b) => b.nGlobal - a.nGlobal);
      // Parity status
      const nG = globalSites.length, nL = legacySites.length;
      const covPct = (nG+nL) > 0 ? nG/(nG+nL) : 0;
      let parityStatus: 'global_leading'|'approaching'|'legacy_dominant'|'absent';
      if (nG === 0) parityStatus = nL > 0 ? 'legacy_dominant' : 'absent';
      else if (aG!=null && aL!=null ? aG>=aL && covPct>=0.70 : covPct>=0.70) parityStatus = 'global_leading';
      else if (covPct >= 0.30) parityStatus = 'approaching';
      else parityStatus = 'legacy_dominant';
      return { dk, globalSites, legacySites, noneSites, aG, aL, covPct, globalProducts, parityStatus, nG, nL, nNone: noneSites.length };
    });
  }, [zoneSites, selectedZone, productCoverage]);

  const filteredDomainData = domainFilter === 'all' ? domainData : domainData.filter(d => d.parityStatus === domainFilter);

  // Cross-zone summary matrix
  const crossZone = useMemo(() => {
    return DOMAIN_KEYS.filter(dk => dk.key !== 'Total Global').map(dk => {
      return {
        dk,
        zones: ZONES.map(z => {
          const zs = sites.filter(s => s.zone === z);
          let nG=0, nL=0, nN=0; const sG:number[]=[], sL:number[]=[];
          for (const s of zs) {
            const pt = getSiteDomainType(s.name, dk.short);
            const sc = s.scores[dk.key] ?? 0;
            if (pt==='G') { nG++; if(sc>0) sG.push(sc); }
            else if (pt==='L') { nL++; if(sc>0) sL.push(sc); }
            else nN++;
          }
          const avg=(a:number[])=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
          const aG=avg(sG), aL=avg(sL);
          const covPct=(nG+nL)>0?nG/(nG+nL):0;
          let parity: 'global_leading'|'approaching'|'legacy_dominant'|'absent';
          if(nG===0) parity=nL>0?'legacy_dominant':'absent';
          else if((aG!=null&&aL!=null?aG>=aL&&covPct>=0.70:covPct>=0.70)) parity='global_leading';
          else if(covPct>=0.30) parity='approaching';
          else parity='legacy_dominant';
          return { z, nG, nL, nN, aG, aL, covPct, parity };
        })
      };
    });
  }, [sites]);

  const fmtScore = (v:number|null) => v!=null ? v.toFixed(2) : '—';
  const fmtPct = (v:number) => (v*100).toFixed(0)+'%';
  const statusIcon = (s:string) => ({global_leading:'🟢',approaching:'🟡',legacy_dominant:'🔴',absent:'⬜'}[s]??'⬜');

  return (
    <div className="space-y-5">

      {/* ══ ZONE SELECTOR ══ */}
      <div className={'rounded-xl border p-5 ' + card}>
        <p className={h2}>{t.portfolioZoneSelect}</p>
        <div className="flex gap-2 flex-wrap mt-2">
          {ZONES.map(z => {
            const zSites = sites.filter(s=>s.zone===z).length;
            const active = selectedZone === z;
            return (
              <button key={z} onClick={() => setSelectedZone(z)}
                className={'px-4 py-2 rounded-lg text-xs font-bold border transition-all ' +
                  (active ? 'border-blue-500 text-white bg-blue-600' :
                   (dark ? 'border-gray-700 bg-gray-700/30 text-gray-300 hover:border-gray-500' :
                   'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400'))}>
                <span style={{ color: active ? undefined : ZONE_COLORS[z]?.dot }}>●</span>
                {' '}{z}
                <span className={'ml-1.5 text-[10px] ' + (active ? 'text-blue-200' : sub)}>({zSites})</span>
              </button>
            );
          })}
        </div>
        {/* Zone summary pills */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          {(['all','global_leading','approaching','legacy_dominant'] as const).map(st => {
            const count = st==='all' ? domainData.length : domainData.filter(d=>d.parityStatus===st).length;
            const labels: Record<string,string> = {all:'Todos',global_leading:t.portfolioGlobalLeading,approaching:t.portfolioApproaching,legacy_dominant:t.portfolioLegacyDominant};
            const c = st==='all' ? {dot:'#6b7280',text:sub,bg:dark?'bg-gray-700/30':'bg-gray-100'} : statusColors[st as keyof typeof statusColors];
            const active = domainFilter === st;
            return (
              <button key={st} onClick={()=>setDomainFilter(domainFilter===st?'all':st)}
                className={'rounded-lg p-2 text-center border transition-all ' + c.bg + (active?' ring-2 ring-blue-500 border-blue-500':dark?' border-gray-700':' border-transparent')}>
                <p className={'text-lg font-black ' + c.text}>{count}</p>
                <p className={'text-[9px] font-bold ' + c.text}>{labels[st]}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ DOMAIN TABLE FOR SELECTED ZONE ══ */}
      <div className={'rounded-xl border p-5 ' + card}>
        <p className={h2}>{selectedZone} — {t.portfolioSystemsTitle}</p>
        <p className={'text-[10px] mb-3 ' + sub}>{zoneSites.length} operações · {t.portfolioGlobalProduct}: GHQ (OneMes/SODA) · {t.portfolioLocalLegacy}: sistemas locais sem cobertura global</p>
        <div className="space-y-3">
          {filteredDomainData.map(d => {
            const c = statusColors[d.parityStatus];
            const allGlobalN = d.globalProducts.reduce((a,p)=>a+p.nGlobal,0);
            return (
              <div key={d.dk.key} className={'rounded-lg border-l-4 p-4 ' + c.bg} style={{borderLeftColor: c.dot}}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className={'font-black text-sm ' + (dark?'text-white':'text-gray-900')}>{d.dk.short}</span>
                    <span className={'text-xs ml-2 ' + sub}>{d.dk.key}</span>
                  </div>
                  <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full ' + c.bg + ' ' + c.text}>
                    {statusIcon(d.parityStatus)} {({global_leading:t.portfolioGlobalLeading,approaching:t.portfolioApproaching,legacy_dominant:t.portfolioLegacyDominant,absent:t.portfolioAbsent})[d.parityStatus]}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ── Global products with tech level ── */}
                  <div>
                    <p className={'text-[10px] font-black uppercase mb-2 ' + (dark?'text-emerald-400':'text-emerald-700')}>🟢 {t.portfolioGlobalProduct}</p>
                    {d.globalProducts.length > 0 ? (
                      <div className="space-y-2">
                        {d.globalProducts.map(p => {
                          const lvInfo = GLOBAL_PRODUCT_LEVELS[p.product];
                          const lvHex = lvInfo ? LEVEL_HEX[lvInfo.level] ?? '#6b7280' : '#6b7280';
                          const zoneN = p.nZone;
                          const isInZone = zoneN > 0;
                          return (
                            <div key={p.product} className={'rounded px-2.5 py-2 ' + (isInZone ? (dark?'bg-emerald-900/20':'bg-emerald-50') : (dark?'bg-gray-700/30':'bg-gray-100'))}>
                              {/* Product header row */}
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={'font-bold text-xs ' + (isInZone ? (dark?'text-emerald-300':'text-emerald-800') : (dark?'text-gray-400':'text-gray-500'))}>
                                  {p.product}
                                </span>
                                {lvInfo ? (
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded" style={{backgroundColor: lvHex + '22', color: lvHex}}>
                                    {lvInfo.level}{!lvInfo.confirmed && <span className="ml-0.5 opacity-60">*</span>}
                                  </span>
                                ) : (
                                  <span className={'text-[10px] px-1.5 py-0.5 rounded ' + (dark?'bg-gray-600 text-gray-400':'bg-gray-200 text-gray-500')}>L?</span>
                                )}
                                {/* Zone count — highlighted */}
                                <span className={'ml-auto font-black text-xs ' + (isInZone ? (dark?'text-emerald-300':'text-emerald-700') : (dark?'text-gray-500':'text-gray-400'))}>
                                  {isInZone ? `${zoneN} aqui` : '0 aqui'}
                                </span>
                              </div>
                              {/* Per-zone bars */}
                              <div className="space-y-0.5">
                                {ZONES.map(z => {
                                  const n = p.byZone[z] ?? 0;
                                  if (n === 0 && !isInZone) return null; // hide 0-count zones if product not in selected zone
                                  const totalSitesInZone = sites.filter(s => s.zone === z).length;
                                  const pct = totalSitesInZone > 0 ? n / totalSitesInZone * 100 : 0;
                                  const isSelected = z === selectedZone;
                                  return (
                                    <div key={z} className="flex items-center gap-1.5">
                                      <span className={'text-[9px] font-bold w-9 ' + (isSelected ? (dark?'text-blue-300':'text-blue-700') : sub)}
                                        style={isSelected ? { borderBottom: '1px solid ' + ZONE_COLORS[z]?.dot } : {}}>
                                        {z}
                                      </span>
                                      <div className={'flex-1 h-1 rounded-full overflow-hidden ' + (dark?'bg-gray-700':'bg-gray-200')}>
                                        <div className="h-full rounded-full transition-all"
                                          style={{ width: `${pct}%`, backgroundColor: isSelected ? ZONE_COLORS[z]?.dot : '#10b981' + '80' }} />
                                      </div>
                                      <span className={'text-[9px] tabular-nums w-8 text-right ' + (isSelected ? (dark?'text-blue-300':'text-blue-600') : sub)}>
                                        {n > 0 ? `${n}` : '—'}
                                      </span>
                                    </div>
                                  );
                                }).filter(Boolean)}
                                <div className="flex items-center gap-1.5 pt-0.5 border-t border-gray-500/20">
                                  <span className={'text-[9px] font-black w-9 ' + sub}>Total</span>
                                  <span className={'text-[9px] font-bold tabular-nums ' + (dark?'text-emerald-400':'text-emerald-700')}>{p.nGlobal} sites globais</span>
                                </div>
                              </div>
                              {lvInfo && (
                                <p className={'text-[9px] mt-1 opacity-60 ' + (dark?'text-emerald-400':'text-emerald-700')}>{lvInfo.note}</p>
                              )}
                            </div>
                          );
                        })}
                        {d.aG != null && (
                          <p className={'text-[10px] ' + sub}>
                            {t.portfolioTechLevel} (média implantado): <span className="font-bold" style={{color:LEVEL_HEX['L'+Math.round(d.aG)]??'#6b7280'}}>{fmtScore(d.aG)}</span>
                          </p>
                        )}
                        <p className={'text-[9px] ' + sub}>* nível estimado — validar com product team</p>
                      </div>
                    ) : (
                      <p className={'text-xs italic ' + sub}>{t.portfolioNoGlobalYet}</p>
                    )}
                  </div>

                  {/* ── Legacy / local with named systems ── */}
                  <div>
                    <p className={'text-[10px] font-black uppercase mb-2 ' + (dark?'text-amber-400':'text-amber-700')}>🟡 {t.portfolioLocalLegacy}</p>
                    {(() => {
                      // Find local systems for this zone × domain
                      const zoneSystems = LOCAL_SYSTEMS[selectedZone] ?? [];
                      const domainLocalSystems = zoneSystems.filter(ls => ls.domains.includes(d.dk.key));
                      const hasGap = (LOCAL_SYSTEMS[selectedZone] ?? []).length === 0;
                      return (
                        <div className="space-y-1.5">
                          {d.nL > 0 ? (
                            <>
                              {domainLocalSystems.length > 0 ? (
                                domainLocalSystems.map(ls => (
                                  <div key={ls.name} className={'flex items-center gap-2 px-2.5 py-1.5 rounded ' + (dark?'bg-amber-900/20':'bg-amber-50')}>
                                    <span className={'font-bold text-xs ' + (dark?'text-amber-300':'text-amber-800')}>{ls.name}</span>
                                    {ls.note && <span className={'text-[9px] opacity-70 ' + (dark?'text-amber-400':'text-amber-700')}>{ls.note}</span>}
                                    <span className={'ml-auto tabular-nums text-[10px] ' + sub}>{d.nL} sites</span>
                                  </div>
                                ))
                              ) : (
                                <div className={'flex items-center gap-2 px-2.5 py-1.5 rounded border border-dashed ' + (dark?'border-amber-700/50 bg-amber-900/10':'border-amber-300 bg-amber-50/50')}>
                                  <span className="text-[10px]">⚠️</span>
                                  <span className={'text-[10px] italic ' + (dark?'text-amber-400':'text-amber-700')}>
                                    {hasGap
                                      ? `${d.nL} sites em Legacy — sistema não identificado. Fornecer dados para ${selectedZone}.`
                                      : `${d.nL} sites em Legacy — sistema não mapeado para este domínio em ${selectedZone}.`}
                                  </span>
                                </div>
                              )}
                              {d.aL != null && (
                                <p className={'text-[10px] mt-1 ' + sub}>
                                  {t.portfolioTechLevel}: <span className="font-bold" style={{color:LEVEL_HEX['L'+Math.round(d.aL)]??'#6b7280'}}>{fmtScore(d.aL)}</span>
                                </p>
                              )}
                            </>
                          ) : (
                            <p className={'text-xs italic ' + sub}>{t.portfolioNNone}</p>
                          )}
                          {d.nNone > 0 && (
                            <p className={'text-[10px] ' + sub}>{d.nNone} sites sem produto ativo</p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Coverage bar */}
                    <div className="mt-2">
                      <div className="flex justify-between mb-0.5">
                        <span className={'text-[9px] font-bold ' + (dark?'text-emerald-400':'text-emerald-700')}>Global {fmtPct(d.covPct)}</span>
                        <span className={'text-[9px] font-bold ' + (dark?'text-amber-400':'text-amber-700')}>Legacy {fmtPct(1 - d.covPct)}</span>
                      </div>
                      <div className={'h-2 rounded-full overflow-hidden ' + (dark?'bg-gray-700':'bg-gray-200')}>
                        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{width: fmtPct(d.covPct)}} />
                      </div>
                    </div>

                    {/* Decomm action */}
                    {d.nL > 0 && (
                      <div className={'mt-2 px-2 py-1.5 rounded text-[10px] leading-relaxed ' + (d.parityStatus==='global_leading'?(dark?'bg-emerald-900/20 text-emerald-300':'bg-emerald-50 text-emerald-800'):(dark?'bg-gray-700/30 text-gray-300':'bg-gray-100 text-gray-600'))}>
                        {d.parityStatus==='global_leading'
                          ? '✅ ' + t.portfolioDecommReady + ' — ' + t.portfolioDecommGap(d.nL)
                          : '🔒 ' + t.portfolioDecommGap(d.nL) + ' para conversa de descomissionamento'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ CROSS-ZONE COMPARISON MATRIX ══ */}
      <div className={'rounded-xl border p-5 ' + card}>
        <p className={h2}>{t.portfolioSummaryTitle}</p>
        <p className={'text-[10px] mb-3 ' + sub}>{t.portfolioZoneCompareSub}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className={'text-left py-2 px-3 font-bold ' + sub}>Domínio</th>
                {ZONES.map(z => (
                  <th key={z} className={'text-center py-2 px-2 font-bold cursor-pointer hover:opacity-80 ' + (selectedZone===z?(dark?'text-blue-300':'text-blue-600'):sub)}
                    onClick={()=>setSelectedZone(z)}
                    style={{borderBottom: selectedZone===z?'2px solid '+ZONE_COLORS[z]?.dot:'none'}}>
                    {z}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {crossZone.map(row => (
                <tr key={row.dk.key} className={dark?'hover:bg-gray-700/20':'hover:bg-gray-50'}>
                  <td className={'py-2 px-3 border-b font-medium ' + td}>
                    <span className="font-black mr-1">{row.dk.short}</span>
                    <span className={'text-[10px] ' + sub}>{row.dk.key}</span>
                  </td>
                  {row.zones.map(zd => {
                    const c = statusColors[zd.parity];
                    const isSelected = selectedZone === zd.z;
                    return (
                      <td key={zd.z} className={'py-2 px-2 text-center border-b ' + td + (isSelected?' ring-1 ring-blue-500/30':'')}
                        style={{backgroundColor: isSelected?(dark?'rgba(59,130,246,0.08)':'rgba(219,234,254,0.5)'):undefined}}>
                        <div className="flex flex-col items-center gap-0.5">
                          <span style={{fontSize:'11px', color:c.dot}}>●</span>
                          {zd.nG>0&&<span className={'text-[9px] font-bold ' + (dark?'text-emerald-400':'text-emerald-700')}>{zd.nG}G</span>}
                          {zd.nL>0&&<span className={'text-[9px] ' + (dark?'text-amber-400':'text-amber-600')}>{zd.nL}L</span>}
                          {zd.aG!=null&&<span className={'text-[8px] tabular-nums ' + sub}>{fmtScore(zd.aG)}</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-4 mt-2">
          {Object.entries({global_leading:t.portfolioGlobalLeading,approaching:t.portfolioApproaching,legacy_dominant:t.portfolioLegacyDominant}).map(([k,label])=>(
            <span key={k} className={'text-[10px] flex items-center gap-1 ' + sub}>
              <span style={{color: statusColors[k as keyof typeof statusColors].dot}}>●</span>{label}
            </span>
          ))}
          <span className={'text-[10px] ' + sub}>nG = sites Global · nL = Legacy · avg = score médio</span>
        </div>
      </div>

    </div>
  );
};

interface MaturityVsResultsViewProps {
  t: T;
  dark: boolean;
  lang: Lang;
  sites: Site[];
  anaplanData: AnaplanData | null;
  vpoData: VpoData | null;
}
type QuadrantFilter = 'all' | 'tech_high_vpo_high' | 'tech_high_vpo_low' | 'tech_low_vpo_high' | 'tech_low_vpo_low';
const QUADRANT_KEYS: QuadrantFilter[] = ['tech_high_vpo_high', 'tech_high_vpo_low', 'tech_low_vpo_high', 'tech_low_vpo_low'];

// ── Level Migration Guide Component ──────────────────────────────────────────
const LevelMigrationGuide: React.FC<{
  sites: Site[];
  siteOseTtp: Record<string, { ose: number | null; ttp: number | null }>;
  vpoData: VpoData | null;
  t: T; dark: boolean; lang: Lang;
}> = ({ sites, siteOseTtp, vpoData, t, dark, lang }) => {
  const domainRationale = getDomainRationale(lang);
  const [tab, setTab] = useState<'levels' | 'sites'>('levels');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterNextLevel, setFilterNextLevel] = useState<string>('all');
  const [tooltip, setTooltip] = useState<{ x: number; y: number; blocking: string; action: string; label: string } | null>(null);

  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const sub = dark ? 'text-gray-400' : 'text-gray-500';
  const h2Cls = 'text-[10px] font-black uppercase tracking-widest mb-1 ' + sub;
  const td = dark ? 'text-gray-200 border-gray-700/40' : 'text-gray-800 border-gray-100';
  const pill = dark ? 'bg-gray-700/60' : 'bg-gray-50 border border-gray-200';
  const LEVEL_HEX: Record<string, string> = { L0: '#6b7280', L1: '#f59e0b', L2: '#f97316', L3: '#10b981', L4: '#059669' };

  const migKeys = Object.keys(LEVEL_MIGRATION_DEFS) as (keyof typeof LEVEL_MIGRATION_DEFS)[];

  // Site migration statuses
  const siteStatuses = useMemo(
    () => computeSiteMigrationStatuses(sites, siteOseTtp, vpoData),
    [sites, siteOseTtp, vpoData]
  );

  // Bases para contagens cruzadas: cada grupo aplica apenas o filtro do outro grupo
  const statusBase = filterNextLevel === 'all'
    ? siteStatuses
    : siteStatuses.filter(s => s.currentLevel === parseInt(filterNextLevel) - 1);
  const levelBase = filterStatus === 'all'
    ? siteStatuses
    : siteStatuses.filter(s => s.readinessClass === filterStatus);

  const fmtPct = (v: number | null) => v != null ? (v * 100).toFixed(1) + '%' : '—';

  const readinessColors = {
    ready: { bg: dark ? 'bg-emerald-900/40' : 'bg-emerald-50', text: dark ? 'text-emerald-300' : 'text-emerald-700', dot: '#10b981' },
    close: { bg: dark ? 'bg-amber-900/40' : 'bg-amber-50', text: dark ? 'text-amber-300' : 'text-amber-700', dot: '#f59e0b' },
    far: { bg: dark ? 'bg-gray-700/40' : 'bg-gray-100', text: sub, dot: '#6b7280' },
    nodata: { bg: dark ? 'bg-gray-700/20' : 'bg-gray-50', text: sub, dot: '#6b7280' },
  };

  return (
    <div className={'rounded-xl border p-5 ' + card}>
      <p className={h2Cls}>{t.migrationTitle}</p>
      <p className={'text-xs mb-4 ' + sub}>{t.migrationSub}</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(['levels', 'sites'] as const).map(tb => (
          <button key={tb} onClick={() => setTab(tb)}
            className={'px-3 py-1.5 rounded text-xs font-bold transition-all ' + (tab === tb ? 'bg-blue-600 text-white' : (dark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'))}>
            {tb === 'levels' ? t.migrationTabLevels : t.migrationTabSites}
          </button>
        ))}
      </div>

      {/* ── TAB: POR NÍVEL ── */}
      {tab === 'levels' && (
        <div>
          {/* Level selector */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {migKeys.map((mk, i) => {
              const def = LEVEL_MIGRATION_DEFS[mk];
              const active = selectedLevel === i;
              const fromHex = LEVEL_HEX[`L${i}`] ?? '#6b7280';
              const toHex = LEVEL_HEX[`L${i + 1}`] ?? '#6b7280';
              return (
                <button key={mk} onClick={() => setSelectedLevel(i)}
                  className={'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all ' + (active ? 'border-blue-500 bg-blue-500/10' : (dark ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'))}>
                  <span style={{ color: fromHex }}>{def.fromLabel}</span>
                  <span className={sub}>→</span>
                  <span style={{ color: toHex }}>{def.toLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Detail for selected level */}
          {(() => {
            const mk = migKeys[selectedLevel];
            const def = LEVEL_MIGRATION_DEFS[mk];
            if (!def) return null;
            const fromHex = LEVEL_HEX[`L${selectedLevel}`] ?? '#6b7280';
            const toHex = LEVEL_HEX[`L${selectedLevel + 1}`] ?? '#6b7280';

            // Compute actual OSE delta from data for these levels
            const fromSites = sites.filter(s => Math.round(s.scores['Total Global'] ?? 0) === selectedLevel);
            const toSites = sites.filter(s => Math.round(s.scores['Total Global'] ?? 0) === selectedLevel + 1);
            const fromOses = fromSites.map(s => siteOseTtp[s.name]?.ose).filter((v): v is number => v != null);
            const toOses = toSites.map(s => siteOseTtp[s.name]?.ose).filter((v): v is number => v != null);
            const fromAvgOse = fromOses.length ? fromOses.reduce((a, b) => a + b, 0) / fromOses.length : null;
            const toAvgOse = toOses.length ? toOses.reduce((a, b) => a + b, 0) / toOses.length : null;
            const delta = fromAvgOse != null && toAvgOse != null ? (toAvgOse - fromAvgOse) * 100 : null;

            return (
              <div className="space-y-4">
                {/* Header stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className={'rounded-lg p-3 ' + pill}>
                    <p className={'text-[10px] font-bold uppercase mb-1 ' + sub}>{t.migrationValueOse}</p>
                    <p className={'text-xl font-black ' + (delta != null ? (delta > 0 ? (dark ? 'text-emerald-400' : 'text-emerald-600') : (dark ? 'text-red-400' : 'text-red-600')) : sub)}>
                      {delta != null ? (delta > 0 ? '+' : '') + delta.toFixed(1) + ' pp' : '—'}
                    </p>
                    <p className={'text-[10px] mt-0.5 ' + sub}>{fmtPct(fromAvgOse)} → {fmtPct(toAvgOse)}</p>
                  </div>
                  <div className={'rounded-lg p-3 ' + pill}>
                    <p className={'text-[10px] font-bold uppercase mb-1 ' + sub}>{t.migrationVpoReq}</p>
                    <p className={'text-xl font-black ' + (dark ? 'text-white' : 'text-gray-900')}>{def.vpoMinPct}%</p>
                    <p className={'text-[10px] mt-0.5 ' + sub}>VPO mínimo</p>
                  </div>
                  <div className={'rounded-lg p-3 ' + pill}>
                    <p className={'text-[10px] font-bold uppercase mb-1 ' + sub}>Sites {def.fromLabel}</p>
                    <p className={'text-xl font-black ' + (dark ? 'text-white' : 'text-gray-900')}>{fromSites.length}</p>
                    <p className={'text-[10px] mt-0.5 ' + sub}>com KPI: {fromOses.length}</p>
                  </div>
                  <div className={'rounded-lg p-3 ' + pill}>
                    <p className={'text-[10px] font-bold uppercase mb-1 ' + sub}>Sites {def.toLabel}</p>
                    <p className={'text-xl font-black ' + (dark ? 'text-white' : 'text-gray-900')}>{toSites.length}</p>
                    <p className={'text-[10px] mt-0.5 ' + sub}>com KPI: {toOses.length}</p>
                  </div>
                </div>

                {/* Value range & caveat */}
                {(def.avgOseDeltaLow != null || def.avgOseDeltaHigh != null) && (
                  <div className={'rounded-lg px-4 py-3 text-xs ' + (dark ? 'bg-emerald-900/20 border border-emerald-800 text-emerald-300' : 'bg-emerald-50 border border-emerald-200 text-emerald-800')}>
                    <strong>{t.migrationValueTitle}:</strong>{' '}
                    {def.avgOseDeltaLow != null && def.avgOseDeltaHigh != null
                      ? `+${def.avgOseDeltaLow} a +${def.avgOseDeltaHigh} p.p. em OSE`
                      : def.avgOseDeltaHigh != null ? `até +${def.avgOseDeltaHigh} p.p. em OSE` : 'Ver nota'}
                    {' — '}{t.migrationValueNote(def.vpoMinPct.toString())}
                  </div>
                )}

                <div className={'rounded-lg px-4 py-2.5 text-xs ' + (dark ? 'bg-gray-700/40 text-gray-300' : 'bg-gray-50 text-gray-600 border border-gray-200')}>
                  {def.caveats}
                </div>

                {/* Domain requirements + VPO pillars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Key domains */}
                  <div>
                    <p className={'text-[10px] font-black uppercase mb-2 ' + sub}>{t.migrationDomains}</p>
                    <div className="space-y-1.5">
                      {def.keyDomains.map(short => {
                        const dk = DOMAIN_KEYS.find(d => d.short === short);
                        if (!dk) return null;
                        const stats = GLOBAL_STATS[dk.key]?.['Global'];
                        const ghqPct = (GHQ_TOTALS[dk.key] ?? {})[Object.keys(GHQ_TOTALS[dk.key] ?? {})[0]] !== undefined
                          ? Math.round((GHQ_TOTALS[dk.key]?.Global ?? 0))
                          : 0;
                        // Pct of sites currently at target level+ for this domain
                        const atTarget = stats ? (stats.dist.slice(selectedLevel + 1).reduce((a, b) => a + b, 0)) : 0;
                        const ghqGlobal = GHQ_TOTALS[dk.key]?.Global ?? 0;
                        const cls = ghqGlobal >= 60 ? '🟢' : ghqGlobal >= 20 ? '🟡' : '🔴';
                        return (
                          <div key={short} className="flex items-center gap-2">
                            <span className={'font-bold text-xs w-10 ' + (dark ? 'text-gray-300' : 'text-gray-700')}>{short}</span>
                            <span className="text-[10px]">{cls}</span>
                            <div className="flex-1">
                              <div className={'h-1.5 rounded-full overflow-hidden ' + (dark ? 'bg-gray-700' : 'bg-gray-200')}>
                                <div className="h-full rounded-full bg-blue-500" style={{ width: `${atTarget}%` }} />
                              </div>
                            </div>
                            <span className={'text-[10px] tabular-nums w-8 text-right ' + sub}>{atTarget}%</span>
                          </div>
                        );
                      })}
                    </div>
                    <p className={'text-[10px] mt-1.5 ' + sub}>Barra = % dos sites globais já no nível alvo+ neste domínio</p>
                  </div>

                  {/* VPO pillars to strengthen */}
                  <div>
                    <p className={'text-[10px] font-black uppercase mb-2 ' + sub}>Pilares VPO prioritários</p>
                    <div className="space-y-1.5">
                      {def.topVpoPillars.map((pil, i) => (
                        <div key={pil} className="flex items-center gap-2">
                          <span className={'text-[10px] font-bold w-4 ' + sub}>{i + 1}</span>
                          <span className={'text-xs font-medium ' + td}>{pil}</span>
                          {i === 0 && (
                            <span className={'ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ' + (dark ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-800')}>
                              prioritário
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── TAB: POR SITE ── */}
      {tab === 'sites' && (
        <div>
          {/* Summary counts — clickable as filters, counts respect filterNextLevel */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {(['ready', 'close', 'far', 'nodata'] as const).map(cls => {
              const count = statusBase.filter(s => s.readinessClass === cls).length;
              const total = siteStatuses.filter(s => s.readinessClass === cls).length;
              const colors = readinessColors[cls];
              const label = cls === 'ready' ? t.migrationReady : cls === 'close' ? t.migrationClose : cls === 'far' ? t.migrationFar : t.migrationNoData;
              const active = filterStatus === cls;
              return (
                <button key={cls} onClick={() => setFilterStatus(filterStatus === cls ? 'all' : cls)}
                  className={'rounded-lg p-3 text-center transition-all ' + colors.bg + (active ? ' ring-2 ring-blue-500' : '')}>
                  <p className={'text-xl font-black ' + colors.text}>{count}</p>
                  {filterNextLevel !== 'all' && count !== total && (
                    <p className={'text-[10px] opacity-60 ' + colors.text}>/ {total} total</p>
                  )}
                  <p className={'text-[10px] font-bold mt-0.5 ' + colors.text}>{label}</p>
                </button>
              );
            })}
          </div>

          {/* Level filter — "próximo nível" */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={'text-[10px] font-bold uppercase ' + sub}>Próximo nível:</span>
            {['all', '1', '2', '3', '4'].map(lv => {
              const active = filterNextLevel === lv;
              const hex = lv === 'all' ? undefined : ({ '1': '#f59e0b', '2': '#f97316', '3': '#10b981', '4': '#059669' } as Record<string,string>)[lv];
              const count = lv === 'all'
                ? levelBase.length
                : levelBase.filter(s => s.currentLevel === parseInt(lv) - 1).length;
              return (
                <button key={lv} onClick={() => setFilterNextLevel(filterNextLevel === lv ? 'all' : lv)}
                  className={'px-2.5 py-1 rounded text-[10px] font-bold transition-all border ' +
                    (active
                      ? 'border-blue-500 bg-blue-500/10 ' + (dark ? 'text-blue-300' : 'text-blue-700')
                      : (dark ? 'border-gray-700 bg-gray-700/30 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'))}>
                  {lv === 'all' ? 'Todos' : <span style={{ color: active ? undefined : hex }}>→L{lv}</span>}
                  <span className={'ml-1 ' + (dark ? 'text-gray-500' : 'text-gray-400')}>({count})</span>
                </button>
              );
            })}
            {(filterStatus !== 'all' || filterNextLevel !== 'all') && (
              <button onClick={() => { setFilterStatus('all'); setFilterNextLevel('all'); }}
                className={'ml-auto px-2 py-1 rounded text-[10px] font-bold ' + (dark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')}>
                ✕ limpar filtros
              </button>
            )}
          </div>

          {/* Sites table */}
          <div className="overflow-auto max-h-80">
            <table className="w-full text-xs">
              <thead className="sticky top-0">
                <tr className={dark ? 'bg-gray-800' : 'bg-white'}>
                  <th className={'text-left py-2 px-2 font-bold ' + sub}>Site</th>
                  <th className={'text-center py-2 px-2 font-bold ' + sub}>L atual → próx.</th>
                  <th className={'text-center py-2 px-2 font-bold ' + sub}>VPO</th>
                  <th className={'text-center py-2 px-2 font-bold ' + sub}>OSE</th>
                  <th className={'text-left py-2 px-2 font-bold ' + sub}>{t.migrationBlocking}</th>
                  <th className={'text-center py-2 px-2 font-bold ' + sub}>Status</th>
                </tr>
              </thead>
              <tbody>
                {siteStatuses
                  .filter(s => {
                    if (filterStatus !== 'all' && s.readinessClass !== filterStatus) return false;
                    if (filterNextLevel !== 'all' && s.currentLevel !== parseInt(filterNextLevel) - 1) return false;
                    return true;
                  })
                  .sort((a, b) => {
                    // Primary: status class (ready first)
                    const order = { ready: 0, close: 1, far: 2, nodata: 3 };
                    const classDiff = order[a.readinessClass] - order[b.readinessClass];
                    if (classDiff !== 0) return classDiff;
                    // Secondary within same class: easiest first
                    // — more domains ready → easier (desc)
                    const progressDiff = b.domainProgress - a.domainProgress;
                    if (Math.abs(progressDiff) > 0.01) return progressDiff;
                    // — fewer blocking domains → easier (asc)
                    const blockDiff = a.blockingDomains.length - b.blockingDomains.length;
                    if (blockDiff !== 0) return blockDiff;
                    // — higher VPO → easier (desc)
                    return (b.vpoScore ?? 0) - (a.vpoScore ?? 0);
                  })
                  .map(s => {
                    const colors = readinessColors[s.readinessClass];
                    const mk = migKeys[s.currentLevel];
                    const def = mk ? LEVEL_MIGRATION_DEFS[mk] : null;
                    const rationaleMap = domainRationale[mk ?? ''] ?? {};
                    const vpoColor = s.vpoScore == null ? sub : s.vpoScore >= (def?.vpoMinPct ?? 80) / 100 ? (dark ? 'text-emerald-400' : 'text-emerald-600') : (dark ? 'text-red-400' : 'text-red-600');

                    // "Far" graduation: progress bar showing domains already ready
                    const showProgress = s.readinessClass === 'far' && s.totalActiveCount > 0;
                    const pct = Math.round(s.domainProgress * 100);
                    const progressColor = pct >= 66 ? '#10b981' : pct >= 33 ? '#f59e0b' : '#ef4444';

                    const statusCell = s.readinessClass === 'ready' ? (
                      <span className={dark ? 'text-emerald-400' : 'text-emerald-600'}>✅</span>
                    ) : s.readinessClass === 'close' ? (
                      <span className={dark ? 'text-amber-400' : 'text-amber-600'}>⚠️</span>
                    ) : s.readinessClass === 'far' ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={'text-[10px] font-bold tabular-nums ' + (dark ? 'text-gray-300' : 'text-gray-600')}>
                          {s.domainsReadyCount}/{s.totalActiveCount}
                        </span>
                        <div className={'w-10 h-1.5 rounded-full overflow-hidden ' + (dark ? 'bg-gray-700' : 'bg-gray-200')}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: progressColor }} />
                        </div>
                      </div>
                    ) : (
                      <span className={sub}>—</span>
                    );

                    return (
                      <tr key={s.name} className={dark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'}>
                        <td className={'py-2 px-2 font-medium border-b ' + td}>
                          <div>{s.name}</div>
                          <div className={'text-[10px] ' + sub}>{s.zone} · {s.volGroup}</div>
                        </td>
                        <td className={'py-2 px-2 text-center border-b font-black ' + td}>
                          <span style={{ color: LEVEL_HEX[`L${s.currentLevel}`] }}>L{s.currentLevel}</span>
                          {s.currentLevel < 4 && <span className={'text-[10px] ' + sub}> →L{s.currentLevel + 1}</span>}
                        </td>
                        <td className={'py-2 px-2 text-center tabular-nums border-b font-semibold ' + vpoColor}>
                          {s.vpoScore != null ? (s.vpoScore * 100).toFixed(0) + '%' : '—'}
                          {!s.vpoReady && def && (
                            <div className={'text-[9px] ' + (dark ? 'text-red-400' : 'text-red-500')}>min {def.vpoMinPct}%</div>
                          )}
                        </td>
                        <td className={'py-2 px-2 text-center tabular-nums border-b ' + td}>
                          {s.ose != null ? (s.ose * 100).toFixed(1) + '%' : '—'}
                        </td>
                        <td className={'py-2 px-2 border-b ' + td}>
                          {s.blockingDomains.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {s.blockingDomains.slice(0, 5).map(d => {
                                const rationale = rationaleMap[d.short];
                                return (
                                  <span key={d.short}
                                    className={'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ' + (rationale ? 'cursor-help' : '') + ' ' + (dark ? 'bg-red-900/40 text-red-300' : 'bg-red-50 text-red-700')}
                                    onMouseEnter={rationale ? (e) => {
                                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                      setTooltip({ x: rect.right + 8, y: rect.top, blocking: rationale.blocking, action: rationale.action, label: t.tooltipBlocking(d.short, d.score, d.target) });
                                    } : undefined}
                                    onMouseLeave={() => setTooltip(null)}
                                  >
                                    {d.short}
                                    <span className={dark ? 'text-red-400/80' : 'text-red-500/80'}>{d.score}→{d.target}</span>
                                    <span className="text-[9px]">{d.productType === 'G' ? '🟢' : d.productType === 'L' ? '🟡' : ''}</span>
                                  </span>
                                );
                              })}
                              {/* Domains already ready: shown in green as context */}
                              {s.domainsReadyCount > 0 && s.readinessClass === 'far' && (
                                <span className={'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ' + (dark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-700')}>
                                  {s.domainsReadyCount} ✓
                                </span>
                              )}
                            </div>
                          ) : s.currentLevel < 4 ? (
                            <span className={dark ? 'text-emerald-400' : 'text-emerald-600'}>✓ todos os domínios prontos</span>
                          ) : (
                            <span className={sub}>L4 máximo</span>
                          )}
                        </td>
                        <td className={'py-2 px-2 text-center border-b align-middle ' + td}>{statusCell}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Fixed-position tooltip — renders outside overflow container ── */}
      {tooltip && (
        <div
          className={'fixed z-[9999] w-72 rounded-lg p-3 shadow-2xl text-[11px] leading-relaxed pointer-events-none ' + (dark ? 'bg-gray-900 border border-gray-600 text-gray-200' : 'bg-white border border-gray-300 text-gray-800 shadow-xl')}
          style={{
            left: Math.min(tooltip.x, window.innerWidth - 300),
            top: Math.max(8, Math.min(tooltip.y, window.innerHeight - 180)),
          }}
        >
          <p className={'font-bold mb-1.5 ' + (dark ? 'text-red-300' : 'text-red-700')}>{tooltip.label}</p>
          <p className={'mb-2 ' + (dark ? 'text-gray-300' : 'text-gray-500')}>{tooltip.blocking}</p>
          <p className={'font-semibold mb-1 ' + (dark ? 'text-emerald-300' : 'text-emerald-700')}>{t.tooltipAction}</p>
          <p className={dark ? 'text-gray-300' : 'text-gray-600'}>{tooltip.action}</p>
        </div>
      )}
    </div>
  );
};

const MaturityVsResultsView: React.FC<MaturityVsResultsViewProps> = ({ t, dark, lang, sites, anaplanData, vpoData }) => {
  const [quadrantFilter, setQuadrantFilter] = useState<QuadrantFilter>('all');
  const [readinessDomain, setReadinessDomain] = useState(DOMAIN_KEYS[0]?.key ?? '');
  const siteOseTtp = useMemo(() => anaplanData?.rows ? getSiteOseTtp(sites, anaplanData.rows) : {}, [sites, anaplanData]);

  const vpoMedian = useMemo(() => {
    if (!vpoData) return 0.5;
    const scores = sites.map(s => vpoData[s.name]?.overall_score).filter((v): v is number => v != null).sort((a, b) => a - b);
    return scores.length > 0 ? scores[Math.floor(scores.length / 2)] : 0.5;
  }, [sites, vpoData]);

  // ── Computações para todas as seções ──
  const withKpiCount = useMemo(() => sites.filter(s => siteOseTtp[s.name]?.ose != null || siteOseTtp[s.name]?.ttp != null).length, [sites, siteOseTtp]);

  // Correlações globais: VPO→OSE e Tech→OSE (média contínua)
  const globalCorr = useMemo(() => {
    const rows = sites.map(s => {
      const kpi = siteOseTtp[s.name]; const vpo = vpoData?.[s.name]?.overall_score ?? null;
      const active = Object.entries(s.scores).filter(([k, v]) => k !== 'Total Global' && v > 0);
      const techAvg = active.length > 0 ? active.reduce((a, [, v]) => a + v, 0) / active.length : 0;
      return { ose: kpi?.ose ?? null, vpo, techAvg };
    }).filter(r => r.vpo != null && r.ose != null);
    const vpos = rows.map(r => r.vpo!); const oses = rows.map(r => r.ose!); const techs = rows.map(r => r.techAvg);
    const rVpo = pearson(vpos, oses); const rTech = pearson(techs, oses);
    return { rVpo, rTech, r2Vpo: rVpo ? rVpo * rVpo : null, r2Tech: rTech ? rTech * rTech : null, n: rows.length };
  }, [sites, siteOseTtp, vpoData]);

  // Quadrantes 2×2
  const quadrants = useMemo(() => {
    const q = [
      { key: 'tech_high_vpo_high' as QuadrantFilter, label: '', sites: [] as typeof sites, avgOse: 0, avgVpo: 0, n: 0 },
      { key: 'tech_high_vpo_low' as QuadrantFilter, label: '', sites: [] as typeof sites, avgOse: 0, avgVpo: 0, n: 0 },
      { key: 'tech_low_vpo_high' as QuadrantFilter, label: '', sites: [] as typeof sites, avgOse: 0, avgVpo: 0, n: 0 },
      { key: 'tech_low_vpo_low' as QuadrantFilter, label: '', sites: [] as typeof sites, avgOse: 0, avgVpo: 0, n: 0 },
    ];
    sites.forEach(s => {
      const kpi = siteOseTtp[s.name]; const vpo = vpoData?.[s.name]?.overall_score;
      if (kpi?.ose == null || vpo == null) return;
      const techHigh = (s.scores['Total Global'] ?? 0) >= 2;
      const vpoHigh = vpo >= vpoMedian;
      const idx = techHigh ? (vpoHigh ? 0 : 1) : (vpoHigh ? 2 : 3);
      q[idx].sites.push(s);
    });
    q.forEach(qi => {
      qi.n = qi.sites.length;
      const oses = qi.sites.map(s => siteOseTtp[s.name]?.ose).filter((v): v is number => v != null);
      const vpos = qi.sites.map(s => vpoData?.[s.name]?.overall_score).filter((v): v is number => v != null);
      qi.avgOse = oses.length ? oses.reduce((a, b) => a + b, 0) / oses.length : 0;
      qi.avgVpo = vpos.length ? vpos.reduce((a, b) => a + b, 0) / vpos.length : 0;
    });
    return q;
  }, [sites, siteOseTtp, vpoData, vpoMedian]);

  // Pillar partials
  const pillarPartials = useMemo(() => computePillarPartials(sites, siteOseTtp, vpoData), [sites, siteOseTtp, vpoData]);
  // Domain portfolio
  const domainPortfolio = useMemo(() => computeDomainOseCorrelation(sites, siteOseTtp), [sites, siteOseTtp]);
  // Zone analysis
  const zoneRows = useMemo(() => computeZoneAnalysis(sites, siteOseTtp, vpoData), [sites, siteOseTtp, vpoData]);
  // Threshold sweep
  const thresholdRows = useMemo(() => computeThresholdSweep(sites, siteOseTtp, vpoData, [0.65, 0.70, 0.75, 0.80, 0.85]), [sites, siteOseTtp, vpoData]);
  // Domain readiness
  const domainReadiness = useMemo(() => computeDomainReadiness(sites, siteOseTtp, vpoData, readinessDomain), [sites, siteOseTtp, vpoData, readinessDomain]);

  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const pill = dark ? 'bg-gray-700/60' : 'bg-gray-50 border border-gray-200';
  const h2Cls = 'text-[10px] font-black uppercase tracking-widest mb-1.5 ' + (dark ? 'text-gray-500' : 'text-gray-400');
  const h1Cls = 'text-lg font-black leading-snug mb-4 ' + (dark ? 'text-white' : 'text-gray-900');
  const sub = dark ? 'text-gray-400' : 'text-gray-500';
  const th = 'text-[10px] font-bold uppercase ' + (dark ? 'text-gray-400' : 'text-gray-500');
  const td = dark ? 'text-gray-200 border-gray-700/40' : 'text-gray-800 border-gray-100';
  const insightBox = dark ? 'bg-gray-700/40 text-gray-300' : 'bg-amber-50 text-amber-900 border border-amber-200';

  if (!anaplanData?.rows?.length) {
    return <div className={'rounded-xl border p-6 ' + card}><p className={'text-sm ' + sub}>{t.noAnaplanData}</p></div>;
  }

  const fmtR = (r: number | null) => r != null ? r.toFixed(2) : '—';
  const fmtPct = (v: number | null) => v != null ? (v * 100).toFixed(1) + '%' : '—';
  const rColor = (r: number | null) => r == null ? sub : r >= 0.3 ? (dark ? 'text-emerald-400' : 'text-emerald-600') : r <= -0.3 ? (dark ? 'text-red-400' : 'text-red-600') : (dark ? 'text-amber-400' : 'text-amber-600');

  // Quadrant deltas
  const vpoDelta = Math.abs(((quadrants[0].avgOse + quadrants[2].avgOse) / 2 - (quadrants[1].avgOse + quadrants[3].avgOse) / 2) * 100).toFixed(0);
  const techDelta = Math.abs(((quadrants[0].avgOse + quadrants[1].avgOse) / 2 - (quadrants[2].avgOse + quadrants[3].avgOse) / 2) * 100).toFixed(0);

  return (
    <div className="space-y-5">

      {/* ══ SEÇÃO 1: O VEREDICTO ══ */}
      <div className={'rounded-xl border p-5 ' + card}>
        <p className={h2Cls}>{t.correlationStudy}</p>
        <p className={h1Cls}>{t.heroQuestion}</p>

        {/* Barras de variância explicada */}
        <div className="space-y-3 mb-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className={'text-xs font-semibold ' + (dark ? 'text-emerald-400' : 'text-emerald-700')}>{t.heroVpoExplains}</span>
              <span className={'text-sm font-black ' + (dark ? 'text-emerald-400' : 'text-emerald-700')}>{globalCorr.r2Vpo != null ? (globalCorr.r2Vpo * 100).toFixed(0) + '%' : '—'} {t.heroOfVariance}</span>
            </div>
            <div className={'h-3 rounded-full overflow-hidden ' + (dark ? 'bg-gray-700' : 'bg-gray-200')}>
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${(globalCorr.r2Vpo ?? 0) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className={'text-xs font-semibold ' + (dark ? 'text-blue-400' : 'text-blue-700')}>{t.heroTechExplains}</span>
              <span className={'text-sm font-black ' + (dark ? 'text-blue-400' : 'text-blue-700')}>{globalCorr.r2Tech != null ? (globalCorr.r2Tech * 100).toFixed(1) + '%' : '—'} {t.heroOfVariance}</span>
            </div>
            <div className={'h-3 rounded-full overflow-hidden ' + (dark ? 'bg-gray-700' : 'bg-gray-200')}>
              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.max((globalCorr.r2Tech ?? 0) * 100, 1)}%` }} />
            </div>
          </div>
        </div>

        {/* Veredicto */}
        <div className={'px-4 py-3 rounded-lg text-xs leading-relaxed font-medium ' + (dark ? 'bg-red-900/30 text-red-300 border border-red-800' : 'bg-red-50 text-red-800 border border-red-200')}>
          {t.heroVerdict}
        </div>

        {/* 4 stat pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className={'rounded-lg px-4 py-3 ' + pill}>
            <p className={th}>r VPO→OSE</p>
            <p className={'text-2xl font-black mt-0.5 ' + rColor(globalCorr.rVpo)}>{fmtR(globalCorr.rVpo)}</p>
          </div>
          <div className={'rounded-lg px-4 py-3 ' + pill}>
            <p className={th}>r Tech→OSE</p>
            <p className={'text-2xl font-black mt-0.5 ' + rColor(globalCorr.rTech)}>{fmtR(globalCorr.rTech)}</p>
          </div>
          <div className={'rounded-lg px-4 py-3 ' + pill}>
            <p className={th}>{t.sites}</p>
            <p className={'text-2xl font-black mt-0.5 ' + (dark ? 'text-white' : 'text-gray-900')}>{sites.length}</p>
          </div>
          <div className={'rounded-lg px-4 py-3 ' + pill}>
            <p className={th}>{t.withKpi}</p>
            <p className={'text-2xl font-black mt-0.5 ' + (dark ? 'text-white' : 'text-gray-900')}>{withKpiCount}</p>
            <p className={'text-[11px] mt-0.5 ' + sub}>{sites.length > 0 ? Math.round(withKpiCount / sites.length * 100) : 0}%</p>
          </div>
        </div>
      </div>

      {/* ══ SEÇÃO 2: QUADRANTES ══ */}
      <div className={'rounded-xl border p-5 ' + card}>
        <p className={h2Cls}>{t.quadrantTitle}</p>
        <p className={'text-xs mb-4 ' + sub}>{t.quadrantSub}</p>

        <div className="grid grid-cols-[auto_1fr_1fr] gap-0">
          {/* Header row */}
          <div />
          <div className={'text-center text-[10px] font-black uppercase pb-2 ' + sub}>{t.quadrantTechHigh}</div>
          <div className={'text-center text-[10px] font-black uppercase pb-2 ' + sub}>{t.quadrantTechLow}</div>

          {/* VPO HIGH row */}
          <div className={'flex items-center pr-3 text-[10px] font-black uppercase writing-vertical ' + sub} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{t.quadrantVpoHigh}</div>
          {[quadrants[0], quadrants[2]].map((q, i) => {
            const active = quadrantFilter === q.key;
            const colors = [['border-emerald-500', 'bg-emerald-500/10'], ['border-blue-500', 'bg-blue-500/10']][i];
            return (
              <button key={q.key} onClick={() => setQuadrantFilter(quadrantFilter === q.key ? 'all' : q.key)}
                className={'rounded-lg border-l-4 p-3 m-0.5 text-left transition-all ' + colors[0] + ' ' + (active ? colors[1] + ' ring-2 ring-offset-1' : (dark ? 'bg-gray-700/30' : 'bg-gray-50')) + (quadrantFilter !== 'all' && !active ? ' opacity-40' : '')}>
                <span className={'text-[11px] font-bold block ' + sub}>{q.n} {t.sites}</span>
                <span className={'text-xl font-black block ' + (dark ? 'text-white' : 'text-gray-900')}>OSE {(q.avgOse * 100).toFixed(0)}%</span>
                <SparkBar value={q.avgOse} max={1} color={i === 0 ? '#10b981' : '#3b82f6'} label={''} dark={dark} />
              </button>
            );
          })}

          {/* VPO LOW row */}
          <div className={'flex items-center pr-3 text-[10px] font-black uppercase ' + sub} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{t.quadrantVpoLow}</div>
          {[quadrants[1], quadrants[3]].map((q, i) => {
            const active = quadrantFilter === q.key;
            const colors = [['border-amber-500', 'bg-amber-500/10'], ['border-red-500', 'bg-red-500/10']][i];
            return (
              <button key={q.key} onClick={() => setQuadrantFilter(quadrantFilter === q.key ? 'all' : q.key)}
                className={'rounded-lg border-l-4 p-3 m-0.5 text-left transition-all ' + colors[0] + ' ' + (active ? colors[1] + ' ring-2 ring-offset-1' : (dark ? 'bg-gray-700/30' : 'bg-gray-50')) + (quadrantFilter !== 'all' && !active ? ' opacity-40' : '')}>
                <span className={'text-[11px] font-bold block ' + sub}>{q.n} {t.sites}</span>
                <span className={'text-xl font-black block ' + (dark ? 'text-white' : 'text-gray-900')}>OSE {(q.avgOse * 100).toFixed(0)}%</span>
                <SparkBar value={q.avgOse} max={1} color={i === 0 ? '#f59e0b' : '#ef4444'} label={''} dark={dark} />
              </button>
            );
          })}
        </div>

        {/* Insight */}
        <div className={'mt-3 px-4 py-2.5 rounded-lg text-xs font-semibold leading-relaxed ' + insightBox}>
          {t.quadrantInsight(vpoDelta, techDelta)}
        </div>
      </div>

      {/* ══ SEÇÃO 3: ONDE INVESTIR ══ */}
      <div className={'rounded-xl border p-5 ' + card}>
        <p className={h2Cls}>{t.investTitle}</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Pilares VPO */}
          <div>
            <p className={'text-xs font-bold mb-2 ' + sub}>{t.investPillars}</p>
            <table className="w-full text-xs">
              <thead><tr>
                <th className={'text-left py-1.5 ' + th}>{t.pillarCol}</th>
                <th className={'text-right py-1.5 ' + th}>r(OSE)</th>
                <th className={'text-center py-1.5 ' + th}>{t.partialCol}</th>
                <th className={'text-center py-1.5 ' + th}>{t.statusCol}</th>
              </tr></thead>
              <tbody>{pillarPartials.map(p => (
                <tr key={p.pillar}>
                  <td className={'py-1.5 font-medium border-b ' + td}>{p.pillar}</td>
                  <td className={'py-1.5 text-right tabular-nums border-b ' + td}>{fmtR(p.rSimple)}</td>
                  <td className={'py-1.5 text-center tabular-nums border-b ' + td}>{fmtR(p.rPartial)}</td>
                  <td className={'py-1.5 text-center border-b ' + td}>
                    <span className={'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ' + (
                      p.cls === 'own' ? (dark ? 'bg-emerald-900/50 text-emerald-300' : 'bg-emerald-100 text-emerald-800') :
                      p.cls === 'spurious' ? (dark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-800') :
                      (dark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')
                    )}>
                      {p.cls === 'own' ? t.investOwnEffect : p.cls === 'spurious' ? t.investSpurious : t.investMarginal}
                    </span>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {/* Portfólio Tech */}
          <div>
            <p className={'text-xs font-bold mb-2 ' + sub}>{t.investPortfolio}</p>
            {(['global', 'mixed', 'legacy'] as const).map(cls => {
              const items = domainPortfolio.filter(d => d.cls === cls);
              if (!items.length) return null;
              const icon = cls === 'global' ? '🟢' : cls === 'mixed' ? '🟡' : '🔴';
              const label = cls === 'global' ? t.investGlobal : cls === 'mixed' ? t.investMixed : t.investLegacy;
              return (
                <div key={cls} className="mb-3">
                  <p className={'text-[10px] font-black uppercase mb-1 ' + sub}>{icon} {label}</p>
                  {items.map(d => (
                    <div key={d.short} className="flex items-center gap-2 py-1">
                      <span className={'text-xs font-medium w-6 ' + (dark ? 'text-gray-300' : 'text-gray-700')}>{d.short}</span>
                      <span className={'text-[10px] tabular-nums w-8 ' + sub}>{d.ghqPct}%</span>
                      <div className="flex-1"><SparkBar value={d.rOse != null && d.rOse > 0 ? d.rOse : 0} max={0.6} color={cls === 'global' ? '#10b981' : cls === 'mixed' ? '#f59e0b' : '#ef4444'} label={fmtR(d.rOse)} dark={dark} /></div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══ SEÇÃO 4: MAPA DE ZONAS ══ */}
      <div className={'rounded-xl border p-5 ' + card}>
        <p className={h2Cls}>{t.zoneTitle}</p>
        <p className={'text-xs mb-3 ' + sub}>{t.zoneSub}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr>
              <th className={'text-left py-2 px-3 ' + th}>{t.zoneCol}</th>
              <th className={'text-right py-2 px-3 ' + th}>n</th>
              <th className={'text-right py-2 px-3 ' + th}>VPO</th>
              <th className={'text-right py-2 px-3 ' + th}>OSE</th>
              <th className={'text-right py-2 px-3 ' + th}>TTP</th>
              <th className={'py-2 px-3 ' + th}>r(VPO→OSE)</th>
              <th className={'py-2 px-3 ' + th}>r(Tech→OSE)</th>
              <th className={'text-center py-2 px-3 ' + th}></th>
            </tr></thead>
            <tbody>{zoneRows.map(z => {
              const flag = z.rTechOse != null && z.rTechOse > 0.3 ? '⚡' : z.n < 15 ? '⚠️' : '';
              return (
                <tr key={z.zone}>
                  <td className={'py-2 px-3 font-bold border-b ' + td} style={{ borderLeft: `3px solid ${ZONE_COLORS[z.zone]?.dot ?? '#6b7280'}` }}>{z.zone}</td>
                  <td className={'py-2 px-3 text-right tabular-nums border-b ' + td}>{z.n}</td>
                  <td className={'py-2 px-3 text-right tabular-nums border-b ' + td}>{fmtPct(z.avgVpo)}</td>
                  <td className={'py-2 px-3 text-right tabular-nums border-b ' + td}>{fmtPct(z.avgOse)}</td>
                  <td className={'py-2 px-3 text-right tabular-nums border-b ' + td}>{z.avgTtp != null ? z.avgTtp.toFixed(0) : '—'}</td>
                  <td className={'py-2 px-3 border-b ' + td}><SparkBar value={z.rVpoOse != null && z.rVpoOse > 0 ? z.rVpoOse : 0} max={1} color="#10b981" label={fmtR(z.rVpoOse)} dark={dark} /></td>
                  <td className={'py-2 px-3 border-b ' + td}><SparkBar value={z.rTechOse != null && z.rTechOse > 0 ? z.rTechOse : 0} max={1} color="#3b82f6" label={fmtR(z.rTechOse)} dark={dark} /></td>
                  <td className={'py-2 px-3 text-center border-b ' + td}>{flag}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>

      {/* ══ SEÇÃO 5: READINESS GATE ══ */}
      <div className={'rounded-xl border p-5 ' + card}>
        <p className={h2Cls}>{t.readinessTitle}</p>
        <p className={'text-xs mb-3 ' + sub}>{t.readinessSub}</p>

        {/* Threshold sweep */}
        <div className="mb-5">
          <table className="w-full text-xs">
            <thead><tr>
              <th className={'text-left py-1.5 px-2 ' + th}>{t.readinessThreshold}</th>
              <th className={'text-right py-1.5 px-2 ' + th}>n {t.readinessAbove}</th>
              <th className={'py-1.5 px-2 ' + th}>Tech→OSE {t.readinessAbove}</th>
              <th className={'text-right py-1.5 px-2 ' + th}>n {t.readinessBelow}</th>
              <th className={'py-1.5 px-2 ' + th}>Tech→OSE {t.readinessBelow}</th>
            </tr></thead>
            <tbody>{thresholdRows.map(row => {
              const isInflection = row.rAbove != null && row.rAbove > 0.1 && row.rBelow != null && row.rBelow < -0.1;
              const rowBg = isInflection ? (dark ? 'bg-amber-900/20' : 'bg-amber-50') : '';
              return (
                <tr key={row.threshold} className={rowBg}>
                  <td className={'py-1.5 px-2 font-bold border-b ' + td}>≥ {(row.threshold * 100).toFixed(0)}%{isInflection ? ' ◄' : ''}</td>
                  <td className={'py-1.5 px-2 text-right tabular-nums border-b ' + td}>{row.nAbove}</td>
                  <td className={'py-1.5 px-2 border-b ' + rColor(row.rAbove) + ' font-semibold'}>{fmtR(row.rAbove)}</td>
                  <td className={'py-1.5 px-2 text-right tabular-nums border-b ' + td}>{row.nBelow}</td>
                  <td className={'py-1.5 px-2 border-b ' + rColor(row.rBelow) + ' font-semibold'}>{fmtR(row.rBelow)}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>

        {/* Domain readiness tabs */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {DOMAIN_KEYS.filter(d => d.key !== 'Total Global').map(d => (
            <button key={d.key} onClick={() => setReadinessDomain(d.key)}
              className={'px-2.5 py-1 rounded text-[10px] font-bold transition-all ' + (readinessDomain === d.key ? (dark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white') : (dark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'))}>
              {d.short}
            </button>
          ))}
        </div>
        {domainReadiness.length > 0 ? (
          <div className="space-y-2">
            {domainReadiness.map(tr => (
              <div key={`${tr.from}-${tr.to}`} className={'rounded-lg px-4 py-3 ' + (dark ? 'bg-gray-700/40' : 'bg-gray-50')}>
                <div className="flex items-center gap-3">
                  <span className={'text-sm font-black ' + (dark ? 'text-white' : 'text-gray-900')}>L{tr.from} → L{tr.to}</span>
                  <span className={'text-xs font-bold ' + (tr.viable ? (dark ? 'text-emerald-400' : 'text-emerald-700') : (dark ? 'text-red-400' : 'text-red-700'))}>
                    {tr.delta != null ? (tr.delta > 0 ? '+' : '') + (tr.delta * 100).toFixed(1) + 'pp OSE' : '—'}
                    {' '}{tr.viable ? '✅' : '❌'}
                  </span>
                  <span className={'text-[10px] ' + sub}>n: {tr.fromN}→{tr.toN}</span>
                </div>
                {tr.topVpo != null && tr.botVpo != null && (
                  <p className={'text-[11px] mt-1 ' + sub}>
                    {t.topPerformersVpo((tr.topVpo * 100).toFixed(0), (tr.botVpo * 100).toFixed(0), ((tr.topVpo - tr.botVpo) * 100).toFixed(0))}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className={'text-xs ' + sub}>{t.noDomainData}</p>
        )}
      </div>

      {/* ══ SEÇÃO 6: CONDICIONANTES DE MIGRAÇÃO DE NÍVEL ══ */}
      <LevelMigrationGuide sites={sites} siteOseTtp={siteOseTtp} vpoData={vpoData} t={t} dark={dark} lang={lang} />

      {/* ══ SEÇÃO 7: SITE EXPLORER ══ */}
      <SiteExplorer sites={sites} siteOseTtp={siteOseTtp} dark={dark} vpoData={vpoData} quadrantFilter={quadrantFilter} vpoMedian={vpoMedian} />

    </div>
  );
};





// ============================================================================
// CAPABILITY GAP VIEW — N3/N4 capability-based maturity analysis
// ============================================================================

const DOMAIN_SHORTS_ORDER = ['BP','DA','UT','MT','MG','MDM','PP','QL','SF'] as const;
const DOMAIN_FULL_NAMES: Record<string, string> = {
  BP: 'Brewing Performance', DA: 'Data Acquisition', UT: 'Utilities',
  MT: 'Maintenance', MG: 'Management', MDM: 'MasterData Mgmt',
  PP: 'Packaging Perf.', QL: 'Quality', SF: 'Safety',
};

// Level gates (fraction thresholds)
const LEVEL_GATES: Record<string, number> = { L1: 0.60, L2: 0.75, L3: 0.85, L4: 0.90 };

// Score → color (using existing LEVEL_COLORS palette)
function scoreToColor(score: number): string {
  if (score <= 0) return '#D1D5DB';   // L0 gray
  if (score <= 1) return '#FFE066';   // L1 yellow
  if (score <= 2) return '#FFC000';   // L2 amber
  if (score <= 3) return '#F59E0B';   // L3 orange amber
  return '#10B981';                    // L4 green
}

function scoreToTextClass(score: number, dark: boolean): string {
  if (score <= 0) return dark ? 'text-gray-500' : 'text-gray-400';
  if (score <= 1) return 'text-yellow-700';
  if (score <= 2) return 'text-amber-700';
  if (score <= 3) return 'text-orange-700';
  return 'text-emerald-700';
}

// Compute zone×domain summary from MATURITY_DETAIL
interface ZoneDomainSummary {
  avgScore: number;
  siteCount: number;
  avgFracL2: number | null;
  avgFracL3: number | null;
}

function computeZoneDomainSummary(): Record<string, Record<string, ZoneDomainSummary>> {
  const acc: Record<string, Record<string, {scores: number[]; fracsL2: number[]; fracsL3: number[]; count: number}>> = {};
  for (const [, site] of Object.entries(MATURITY_DETAIL)) {
    const z = site.zone;
    if (!acc[z]) acc[z] = {};
    for (const dom of DOMAIN_SHORTS_ORDER) {
      const d = site.domains[dom];
      if (!d) continue;
      if (!acc[z][dom]) acc[z][dom] = {scores: [], fracsL2: [], fracsL3: [], count: 0};
      acc[z][dom].scores.push(d.score);
      acc[z][dom].count++;
      if (d.levels.L2.frac !== null && !d.levels.L2.vacuous) acc[z][dom].fracsL2.push(d.levels.L2.frac);
      if (d.levels.L3.frac !== null && !d.levels.L3.vacuous) acc[z][dom].fracsL3.push(d.levels.L3.frac);
    }
  }
  const result: Record<string, Record<string, ZoneDomainSummary>> = {};
  for (const [z, doms] of Object.entries(acc)) {
    result[z] = {};
    for (const [dom, v] of Object.entries(doms)) {
      const avg = v.scores.reduce((a,b) => a+b, 0) / v.scores.length;
      result[z][dom] = {
        avgScore: avg,
        siteCount: v.count,
        avgFracL2: v.fracsL2.length > 0 ? v.fracsL2.reduce((a,b) => a+b, 0) / v.fracsL2.length : null,
        avgFracL3: v.fracsL3.length > 0 ? v.fracsL3.reduce((a,b) => a+b, 0) / v.fracsL3.length : null,
      };
    }
  }
  return result;
}

const ZONE_DOMAIN_SUMMARY = computeZoneDomainSummary();

// ── CapabilitySiteDetail ────────────────────────────────────────────────────
interface CapabilitySiteDetailProps {
  siteName: string;
  site: MaturityDetailSite;
  dark: boolean;
  t: {cgVacuous: string; cgNoActiveProduct: string; cgL1Gate: string; cgL2Gate: string; cgL3Gate: string; cgL4Gate: string; [k: string]: unknown};
  onClose: () => void;
}

const LEVEL_GATE_LABELS: Record<string, string> = { L1: '60%', L2: '75%', L3: '85%', L4: '90%' };

const CapabilitySiteDetail: React.FC<CapabilitySiteDetailProps> = ({ siteName, site, dark, t, onClose }) => {
  const card = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const sub  = dark ? 'text-gray-400' : 'text-gray-500';
  const lvls = ['L1','L2','L3','L4'] as const;

  return (
    <div className={'rounded-xl border p-5 shadow-lg ' + card}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={'font-black text-base ' + (dark?'text-white':'text-gray-900')}>{siteName}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={'text-xs font-bold px-2 py-0.5 rounded-full text-white'} style={{backgroundColor: ZONE_COLORS[site.zone]?.dot ?? '#888'}}>
              {site.zone}
            </span>
            <span className={'text-xs font-bold px-2 py-0.5 rounded-full text-white'} style={{backgroundColor: scoreToColor(site.score)}}>
              L{site.score}
            </span>
            <span className={'text-xs ' + sub}>capability score</span>
          </div>
        </div>
        <button onClick={onClose} className={'p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ' + (dark?'text-gray-400':'text-gray-500')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Domain breakdown */}
      <div className="space-y-3">
        {DOMAIN_SHORTS_ORDER.map(dom => {
          const d = site.domains[dom];
          if (!d) return (
            <div key={dom} className={'flex items-center gap-2 py-1.5 border-b opacity-30 ' + (dark?'border-gray-700':'border-gray-100')}>
              <span className={'text-xs font-mono font-bold w-10 flex-shrink-0 ' + sub}>{dom}</span>
              <span className={'text-xs ' + sub}>{t.cgNoActiveProduct as string}</span>
            </div>
          );
          return (
            <div key={dom} className={'border-b pb-3 ' + (dark?'border-gray-700':'border-gray-100')}>
              <div className="flex items-center gap-2 mb-2">
                <span className={'text-xs font-mono font-bold w-10 flex-shrink-0 ' + (dark?'text-gray-200':'text-gray-700')}>{dom}</span>
                <span className={'text-xs ' + sub}>{DOMAIN_FULL_NAMES[dom]}</span>
                <span className={'ml-auto text-xs font-bold px-1.5 py-0.5 rounded'} style={{backgroundColor: scoreToColor(d.score), color: d.score <= 1 ? '#78350f':'white'}}>
                  L{d.score}
                </span>
                <span className={'text-xs font-bold px-1.5 py-0.5 rounded border ' + (d.type==='G'?'border-blue-300 text-blue-600 bg-blue-50':'border-gray-300 text-gray-500 bg-gray-50')}>
                  {d.type}
                </span>
              </div>
              {/* Level bars */}
              <div className="space-y-1">
                {lvls.map(lvl => {
                  const ldata = d.levels[lvl];
                  const gate = LEVEL_GATES[lvl];
                  const isPassed = ldata.pass;
                  const isVac = ldata.vacuous;
                  const frac = ldata.frac;
                  
                  let barBg: string;
                  let barFill: string;
                  if (isVac) {
                    barBg = dark ? '#374151' : '#F3F4F6';
                    barFill = dark ? '#4B5563' : '#D1D5DB';
                  } else if (isPassed) {
                    barBg = dark ? '#064E3B' : '#D1FAE5';
                    barFill = '#10B981';
                  } else {
                    barBg = dark ? '#450A0A' : '#FEE2E2';
                    barFill = '#EF4444';
                  }

                  return (
                    <div key={lvl} className="flex items-center gap-2">
                      <span className={'text-[10px] font-bold w-5 flex-shrink-0 ' + (dark?'text-gray-400':'text-gray-500')}>{lvl}</span>
                      <div className="flex-1 relative h-4 rounded overflow-hidden" style={{backgroundColor: barBg}}>
                        {!isVac && frac !== null && (
                          <div className="h-full rounded transition-all" style={{width: `${Math.round(frac * 100)}%`, backgroundColor: barFill}}/>
                        )}
                        {isVac && (
                          <div className="h-full rounded" style={{width:'100%', backgroundColor: barFill}}/>
                        )}
                        {/* Gate line */}
                        {!isVac && (
                          <div className="absolute top-0 h-full w-0.5 bg-gray-700 opacity-40" style={{left: `${gate * 100}%`}}/>
                        )}
                      </div>
                      {isVac ? (
                        <span className={'text-[10px] w-14 text-right font-medium ' + (dark?'text-gray-500':'text-gray-400')}>{t.cgVacuous as string}</span>
                      ) : (
                        <span className={'text-[10px] w-14 text-right font-mono font-bold ' + (isPassed?(dark?'text-emerald-400':'text-emerald-600'):(dark?'text-red-400':'text-red-600'))}>
                          {frac !== null ? `${Math.round(frac * 100)}%` : '—'}
                          <span className={'ml-1 font-normal text-[9px] ' + (dark?'text-gray-500':'text-gray-400')}>/ {LEVEL_GATE_LABELS[lvl]}</span>
                        </span>
                      )}
                      {isPassed
                        ? <span className="text-emerald-500 text-[10px] flex-shrink-0">✓</span>
                        : <span className="text-red-400 text-[10px] flex-shrink-0">✗</span>
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── CapabilityGapView ───────────────────────────────────────────────────────
type CgSubView = 'summary' | 'sites';

interface CapabilityGapViewProps {
  dark: boolean;
  t: Record<string, unknown>;
  lang: string;
}

const CapabilityGapView: React.FC<CapabilityGapViewProps> = ({ dark, t, lang: _lang }) => {
  const [subView, setSubView] = React.useState<CgSubView>('summary');
  const [selectedZone, setSelectedZone] = React.useState<string>('');
  const [selectedDomain, setSelectedDomain] = React.useState<string>('');
  const [scoreFilter, setScoreFilter] = React.useState<string>('');
  const [selectedSite, setSelectedSite] = React.useState<string>('');

  const card  = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const th    = dark ? 'bg-gray-900 text-gray-400' : 'bg-gray-50 text-gray-500';
  const td    = dark ? 'border-gray-700' : 'border-gray-100';
  const sub   = dark ? 'text-gray-400' : 'text-gray-500';

  const ZONES_LIST = ['AFR','APAC','EUR','MAZ','NAZ','SAZ'];

  // Site list filtered by zone + score
  const sitesForMatrix = React.useMemo(() => {
    return Object.entries(MATURITY_DETAIL)
      .filter(([, s]) => {
        if (selectedZone && s.zone !== selectedZone) return false;
        if (scoreFilter !== '') {
          const sc = parseInt(scoreFilter);
          if (s.score !== sc) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by zone then score desc then name
        if (a[1].zone !== b[1].zone) return a[1].zone.localeCompare(b[1].zone);
        if (b[1].score !== a[1].score) return b[1].score - a[1].score;
        return a[0].localeCompare(b[0]);
      });
  }, [selectedZone, scoreFilter]);

  const handleCellClick = (zone: string, domain: string) => {
    setSelectedZone(zone);
    setSelectedDomain(domain);
    setSubView('sites');
    setSelectedSite('');
  };

  const sitesCount = Object.keys(MATURITY_DETAIL).length;

  // Summary statistics
  const scoreDistribution = React.useMemo(() => {
    const dist: Record<number, number> = {0:0,1:0,2:0,3:0,4:0};
    Object.values(MATURITY_DETAIL).forEach(s => { dist[s.score] = (dist[s.score] ?? 0) + 1; });
    return dist;
  }, []);

  return (
    <div className="space-y-4">
      {/* Sub-view switcher */}
      <div className={'flex items-center gap-2 flex-wrap'}>
        {(['summary','sites'] as CgSubView[]).map(sv => (
          <button key={sv}
            onClick={() => { setSubView(sv); if (sv === 'summary') { setSelectedSite(''); } }}
            className={'px-4 py-2 rounded-lg text-sm font-bold transition-all ' +
              (subView === sv
                ? 'bg-yellow-400 text-gray-900'
                : (dark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'))
            }>
            {sv === 'summary' ? t.cgZoneSummary as string : t.cgSiteMatrix as string}
          </button>
        ))}
        {/* Methodology note badge */}
        <span className={'ml-auto text-xs px-3 py-1.5 rounded-full font-medium border ' +
          (dark ? 'border-amber-700 text-amber-400 bg-amber-900/20' : 'border-amber-200 text-amber-700 bg-amber-50')}>
          {t.cgCapBased as string}
        </span>
      </div>

      {/* ── SUMMARY VIEW ─────────────────────────────────────────────────── */}
      {subView === 'summary' && (
        <div className="space-y-4">
          {/* KPI cards row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Sites', value: sitesCount, accent: false },
              { label: 'L0 (failing L1)', value: scoreDistribution[0], accent: true },
              { label: 'L1 (failing L2)', value: scoreDistribution[1], accent: false },
              { label: 'L2 (failing L3)', value: scoreDistribution[2], accent: false },
              { label: 'L3+ target', value: (scoreDistribution[3] ?? 0) + (scoreDistribution[4] ?? 0), accent: false },
            ].map(item => (
              <div key={item.label} className={'rounded-xl border p-4 ' + card + (item.accent ? ' border-red-300' : '')}>
                <div className={'text-2xl font-black ' + (item.accent ? 'text-red-500' : (dark ? 'text-white' : 'text-gray-900'))}>{item.value}</div>
                <div className={'text-xs mt-1 ' + sub}>{item.label}</div>
              </div>
            ))}
          </div>

          {/* Zone × Domain heatmap */}
          <div className={'rounded-xl border overflow-hidden ' + card}>
            <div className={'px-5 py-3 border-b ' + (dark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50')}>
              <h3 className={'font-black text-sm ' + (dark?'text-white':'text-gray-900')}>{t.cgZoneSummary as string}</h3>
              <p className={'text-xs mt-0.5 ' + sub}>{t.cgClickCell as string}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className={th}>
                    <th className={'px-4 py-2.5 text-left font-semibold border-b ' + td}>Zona</th>
                    {DOMAIN_SHORTS_ORDER.map(dom => (
                      <th key={dom} className={'px-3 py-2.5 text-center font-semibold border-b ' + td} title={DOMAIN_FULL_NAMES[dom]}>
                        {dom}
                      </th>
                    ))}
                    <th className={'px-3 py-2.5 text-center font-semibold border-b ' + td}>Sites</th>
                  </tr>
                </thead>
                <tbody>
                  {ZONES_LIST.map(zone => {
                    const zoneColor = ZONE_COLORS[zone];
                    const zoneSites = Object.values(MATURITY_DETAIL).filter(s => s.zone === zone);
                    return (
                      <tr key={zone} className={'border-b ' + (dark?'border-gray-700 hover:bg-gray-750':'border-gray-100 hover:bg-gray-50')}>
                        <td className={'px-4 py-3 font-bold'}>
                          <span className={'inline-flex items-center gap-1.5 text-xs font-black px-2 py-1 rounded-full text-white'} style={{backgroundColor: zoneColor?.dot ?? '#888'}}>
                            {zone}
                          </span>
                        </td>
                        {DOMAIN_SHORTS_ORDER.map(dom => {
                          const summary = ZONE_DOMAIN_SUMMARY[zone]?.[dom];
                          if (!summary) {
                            return (
                              <td key={dom} className={'px-3 py-3 text-center border-l ' + td + ' ' + (dark?'border-gray-700':'border-gray-100')}>
                                <span className={'text-[10px] ' + sub}>—</span>
                              </td>
                            );
                          }
                          const bgColor = scoreToColor(summary.avgScore);
                          const textDark = summary.avgScore >= 2;
                          return (
                            <td key={dom}
                              className={'px-3 py-3 text-center cursor-pointer border-l ' + td + ' ' + (dark?'border-gray-700':'border-gray-100')}
                              onClick={() => handleCellClick(zone, dom)}
                              title={`${zone} × ${dom}: avg score ${summary.avgScore.toFixed(1)}, ${summary.siteCount} sites`}>
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow-sm transition-transform hover:scale-110"
                                  style={{backgroundColor: bgColor, color: textDark ? 'white' : '#78350f'}}>
                                  {summary.avgScore.toFixed(1)}
                                </div>
                                <span className={'text-[9px] ' + sub}>{summary.siteCount}s</span>
                              </div>
                            </td>
                          );
                        })}
                        <td className={'px-3 py-3 text-center font-bold ' + (dark?'text-gray-300':'text-gray-600')}>
                          {zoneSites.length}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Legend */}
            <div className={'px-5 py-3 border-t flex items-center gap-4 flex-wrap ' + (dark?'border-gray-700 bg-gray-900':'border-gray-200 bg-gray-50')}>
              <span className={'text-xs font-semibold ' + sub}>Score médio por domínio:</span>
              {[{label:'L0 (0)', color:'#D1D5DB'},{label:'L1 (1)', color:'#FFE066'},{label:'L2 (2)', color:'#FFC000'},{label:'L3 (3)', color:'#F59E0B'},{label:'L4 (4)', color:'#10B981'}].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded" style={{backgroundColor: item.color}}/>
                  <span className={'text-[10px] ' + sub}>{item.label}</span>
                </div>
              ))}
              <span className={'text-[10px] ' + sub + ' ml-auto italic'}>{t.cgDiffNote as string}</span>
            </div>
          </div>

          {/* Zone distribution bars */}
          <div className={'rounded-xl border ' + card}>
            <div className={'px-5 py-3 border-b ' + (dark?'border-gray-700 bg-gray-900':'border-gray-200 bg-gray-50')}>
              <h3 className={'font-black text-sm ' + (dark?'text-white':'text-gray-900')}>Distribuição de Score por Zona</h3>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-3 gap-4">
              {ZONES_LIST.map(zone => {
                const zoneSites = Object.entries(MATURITY_DETAIL).filter(([,s]) => s.zone === zone);
                const total = zoneSites.length;
                const byScore: Record<number,number> = {0:0,1:0,2:0,3:0,4:0};
                zoneSites.forEach(([,s]) => { byScore[s.score] = (byScore[s.score]??0)+1; });
                const zoneColor = ZONE_COLORS[zone];
                return (
                  <div key={zone} className={'p-3 rounded-lg border ' + (dark?'border-gray-700 bg-gray-900/50':'border-gray-100 bg-gray-50')}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor: zoneColor?.dot??'#888'}}/>
                      <span className={'text-xs font-black ' + (dark?'text-white':'text-gray-900')}>{zone}</span>
                      <span className={'text-[10px] ml-auto ' + sub}>{total} sites</span>
                    </div>
                    <div className="space-y-1.5">
                      {([0,1,2] as const).map(sc => {
                        const count = byScore[sc] ?? 0;
                        const pct = total > 0 ? count / total : 0;
                        const lvlColor = scoreToColor(sc);
                        return (
                          <div key={sc} className="flex items-center gap-2">
                            <span className={'text-[10px] font-bold w-4 flex-shrink-0 ' + sub}>L{sc}</span>
                            <div className={'flex-1 h-3 rounded overflow-hidden ' + (dark?'bg-gray-700':'bg-gray-200')}>
                              <div className="h-full rounded transition-all" style={{width: `${Math.round(pct*100)}%`, backgroundColor: lvlColor}}/>
                            </div>
                            <span className={'text-[10px] font-bold w-6 text-right ' + (dark?'text-gray-300':'text-gray-600')}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── SITES VIEW ───────────────────────────────────────────────────── */}
      {subView === 'sites' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className={'flex items-center gap-3 flex-wrap p-4 rounded-xl border ' + card}>
            {/* Zone filter */}
            <div className="flex items-center gap-2">
              <span className={'text-xs font-semibold ' + sub}>Zona:</span>
              <div className="flex gap-1 flex-wrap">
                <button onClick={() => setSelectedZone('')}
                  className={'px-2.5 py-1 rounded text-xs font-bold transition-all ' +
                    (!selectedZone ? 'bg-yellow-400 text-gray-900' : (dark?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-500'))}>
                  {t.cgAllDomains as string}
                </button>
                {ZONES_LIST.map(z => {
                  const zc = ZONE_COLORS[z];
                  const active = selectedZone === z;
                  return (
                    <button key={z} onClick={() => { setSelectedZone(active ? '' : z); setSelectedSite(''); }}
                      className={'px-2.5 py-1 rounded text-xs font-bold transition-all text-white'}
                      style={{backgroundColor: active ? (zc?.dot ?? '#888') : (dark ? '#374151' : '#E5E7EB'), color: active ? 'white' : (dark?'#9CA3AF':'#6B7280')}}>
                      {z}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Score filter */}
            <div className="flex items-center gap-2">
              <span className={'text-xs font-semibold ' + sub}>{t.cgScoreFilter as string}:</span>
              <div className="flex gap-1">
                <button onClick={() => setScoreFilter('')}
                  className={'px-2.5 py-1 rounded text-xs font-bold transition-all ' +
                    (!scoreFilter ? 'bg-yellow-400 text-gray-900' : (dark?'bg-gray-700 text-gray-400':'bg-gray-100 text-gray-500'))}>
                  {t.cgAllLevels as string}
                </button>
                {[0,1,2].map(sc => (
                  <button key={sc} onClick={() => setScoreFilter(scoreFilter === String(sc) ? '' : String(sc))}
                    className={'px-2.5 py-1 rounded text-xs font-bold transition-all'}
                    style={{
                      backgroundColor: scoreFilter === String(sc) ? scoreToColor(sc) : (dark?'#374151':'#E5E7EB'),
                      color: scoreFilter === String(sc) ? (sc<=1?'#78350f':'white') : (dark?'#9CA3AF':'#6B7280'),
                    }}>
                    L{sc}
                  </button>
                ))}
              </div>
            </div>
            {/* Domain filter */}
            <div className="flex items-center gap-2">
              <span className={'text-xs font-semibold ' + sub}>{t.cgSelectDomain as string}:</span>
              <select value={selectedDomain} onChange={e => { setSelectedDomain(e.target.value); setSelectedSite(''); }}
                className={'text-xs rounded-lg px-2 py-1.5 border font-medium ' + (dark?'bg-gray-700 border-gray-600 text-gray-200':'bg-white border-gray-200 text-gray-700')}>
                <option value="">{t.cgAllDomains as string}</option>
                {DOMAIN_SHORTS_ORDER.map(d => (
                  <option key={d} value={d}>{d} — {DOMAIN_FULL_NAMES[d]}</option>
                ))}
              </select>
            </div>
            <span className={'ml-auto text-xs font-bold ' + sub}>{sitesForMatrix.length} {t.cgSites as string}</span>
          </div>

          {/* Selected site detail panel (shown above the matrix if a site is selected) */}
          {selectedSite && MATURITY_DETAIL[selectedSite] && (
            <CapabilitySiteDetail
              siteName={selectedSite}
              site={MATURITY_DETAIL[selectedSite]}
              dark={dark}
              t={t as Parameters<typeof CapabilitySiteDetail>[0]['t']}
              onClose={() => setSelectedSite('')}
            />
          )}

          {/* Site matrix table */}
          <div className={'rounded-xl border overflow-hidden ' + card}>
            <div className={'px-5 py-3 border-b ' + (dark?'border-gray-700 bg-gray-900':'border-gray-200 bg-gray-50')}>
              <p className={'text-xs ' + sub}>{t.cgClickRow as string}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className={th}>
                    <th className={'px-4 py-2.5 text-left font-semibold border-b ' + td}>Site</th>
                    <th className={'px-3 py-2.5 text-center font-semibold border-b ' + td}>Zona</th>
                    <th className={'px-3 py-2.5 text-center font-semibold border-b ' + td}>Score</th>
                    {(selectedDomain ? [selectedDomain] : DOMAIN_SHORTS_ORDER).map(dom => (
                      <th key={dom} className={'px-2 py-2.5 text-center font-semibold border-b border-l ' + td} title={DOMAIN_FULL_NAMES[dom]}>
                        {dom}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sitesForMatrix.map(([siteName, site]) => {
                    const isSelected = selectedSite === siteName;
                    const domsToShow = selectedDomain ? [selectedDomain] : DOMAIN_SHORTS_ORDER;
                    return (
                      <tr key={siteName}
                        onClick={() => setSelectedSite(isSelected ? '' : siteName)}
                        className={'cursor-pointer border-b transition-colors ' +
                          (isSelected
                            ? (dark?'bg-yellow-900/30 border-yellow-700':'bg-yellow-50 border-yellow-200')
                            : (dark?'border-gray-700 hover:bg-gray-700/50':'border-gray-100 hover:bg-gray-50'))
                        }>
                        <td className={'px-4 py-2.5 font-semibold ' + (dark?'text-gray-200':'text-gray-800')}>
                          {siteName}
                        </td>
                        <td className={'px-3 py-2.5 text-center'}>
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{backgroundColor: ZONE_COLORS[site.zone]?.dot ?? '#888'}}/>
                          <span className={'ml-1 font-mono text-[10px] ' + (dark?'text-gray-400':'text-gray-500')}>{site.zone}</span>
                        </td>
                        <td className={'px-3 py-2.5 text-center'}>
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black shadow-sm"
                            style={{backgroundColor: scoreToColor(site.score), color: site.score <= 1 ? '#78350f':'white'}}>
                            {site.score}
                          </span>
                        </td>
                        {domsToShow.map(dom => {
                          const d = site.domains[dom];
                          if (!d) return (
                            <td key={dom} className={'px-2 py-2.5 text-center border-l ' + td + ' ' + (dark?'border-gray-700':'border-gray-100')}>
                              <span className={'text-[10px] ' + sub}>—</span>
                            </td>
                          );
                          // Next failing level
                          const nextFail = (['L1','L2','L3','L4'] as const).find(l => !d.levels[l].pass);
                          const showFrac = nextFail ? d.levels[nextFail].frac : null;
                          const isVacNext = nextFail ? d.levels[nextFail].vacuous : false;
                          return (
                            <td key={dom} className={'px-2 py-2.5 text-center border-l ' + td + ' ' + (dark?'border-gray-700':'border-gray-100')}>
                              <div className="flex flex-col items-center gap-0.5">
                                <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black"
                                  style={{backgroundColor: scoreToColor(d.score), color: d.score <= 1 ? '#78350f':'white'}}>
                                  {d.score}
                                </div>
                                {nextFail && !isVacNext && showFrac !== null && (
                                  <span className={'text-[9px] text-red-500 font-bold'}>{Math.round(showFrac*100)}%</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {sitesForMatrix.length === 0 && (
                    <tr>
                      <td colSpan={3 + (selectedDomain ? 1 : DOMAIN_SHORTS_ORDER.length)}
                        className={'px-4 py-8 text-center text-sm ' + sub}>
                        Nenhum site encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// APP
// ============================================================================
type ViewMode = 'domain'|'zone'|'sites'|'maturityVsResults'|'portfolioIntelligence'|'capabilityGap';

export default function App() {
  const [view,setView]       = useState<ViewMode>('zone');
  const [tabIdx,setTabIdx]   = useState(0);
  const [volFilter,setVol]        = useState('All');
  const [complexityFilter,setCplx] = useState('All');
  const [dark,setDark]             = useState(false);
  const [lang,setLang]       = useState<Lang>('pt');
  const [exporting,setExp]   = useState(false);
  const [exportingXlsx,setExpXlsx] = useState(false);
  const [anaplanData, setAnaplanData] = useState<AnaplanData | null>(null);
  const [vpoData, setVpoData] = useState<VpoData | null>(null);
  const [productCoverage, setProductCoverage] = useState<ProductCoverageData | null>(null);

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (view !== 'portfolioIntelligence' || productCoverage) return;
    fetch('/product-coverage-2026.json').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setProductCoverage(d as ProductCoverageData);
    }).catch(() => {});
  }, [view, productCoverage]);

  useEffect(() => {
    if (view !== 'maturityVsResults') return;
    let cancelled = false;
    const load = (url: string) => fetch(url).then(r => r.ok ? r.json() : null);
    Promise.all([
      load('/anaplan-kpis-2025.json').then(d => d?.rows?.length ? d : load('/anaplan-kpis.json')),
      load('/anaplan-ose-ttp-2025.json'),
      load('/vpo-site-scores-2026.json'),
    ]).then(([base, oseTtp, vpo]) => {
      if (cancelled) return;
      const year = (base as AnaplanData | null)?.year ?? (oseTtp as AnaplanData | null)?.year ?? 2025;
      const baseRows = (base as AnaplanData | null)?.rows ?? [];
      const oseTtpRows = (oseTtp as AnaplanData | null)?.rows ?? [];
      const rows = oseTtpRows.length ? [...baseRows, ...oseTtpRows] : baseRows;
      if (rows.length) setAnaplanData({ year, rows });
      else setAnaplanData(null);
      if (vpo && typeof vpo === 'object') setVpoData(vpo as VpoData);
    }).catch(() => { if (!cancelled) { setAnaplanData(null); setVpoData(null); } });
    return () => { cancelled = true; };
  }, [view]);


  // apply dark class on root
  useEffect(()=>{
    document.documentElement.classList.toggle('dark',dark);
  },[dark]);

  const volumeMix = useMemo(
    () => anaplanData?.rows ? buildVolumeMixFromRows(ALL_SITES, anaplanData.rows) : new Map<string, SiteVolumeMix>(),
    [anaplanData]
  );
  const complexityBands = useMemo(
    () => getSiteComplexityBands(ALL_SITES, volumeMix),
    [volumeMix]
  );
  const filtered = useMemo(() => {
    let sites = volFilter === 'All' ? ALL_SITES : ALL_SITES.filter(s => s.group === volFilter);
    if (complexityFilter !== 'All') sites = sites.filter(s => complexityBands[s.name] === complexityFilter);
    return sites;
  }, [volFilter, complexityFilter, complexityBands]);
  const tabs = useMemo(()=>view==='domain'?DOMAINS:view==='zone'?["Total Global",...ZONES]:[]   ,[view]);
  const activeTab = tabs[tabIdx]??tabs[0]??'';

  // ── Comprehensive PDF Report Generator (view-aware, opens in new window) ────
  const buildPdfHTML = (targetView: ViewMode): string => {
    const now = new Date().toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', { year:'numeric', month:'long', day:'numeric' });
    const isEN = lang === 'en';
    const P  = (v: number | null, dec = 1) => v != null ? (v * 100).toFixed(dec) + '%' : '—';
    const R  = (v: number | null) => v != null ? v.toFixed(2) : '—';
    const T  = (v: number | null) => v != null ? v.toFixed(0) : '—';
    const A  = (v: number | null, d = 2) => v != null ? v.toFixed(d) : '—';
    const rColor = (r: number | null) => r == null ? '#64748b' : r >= 0.3 ? '#065f46' : r >= 0.1 ? '#92400e' : r <= -0.1 ? '#991b1b' : '#64748b';
    const rBg    = (r: number | null) => r == null ? '#f8fafc' : r >= 0.3 ? '#d1fae5' : r >= 0.1 ? '#fef3c7' : r <= -0.1 ? '#fee2e2' : '#f8fafc';
    const levelColor = (l: number) => (['#6b7280','#f59e0b','#f97316','#10b981','#059669'] as const)[Math.min(4, l)] ?? '#6b7280';
    const pctBar = (pct: number, color = '#3b82f6') =>
      `<div style="background:#e5e7eb;border-radius:3px;height:5px;min-width:80px"><div style="height:5px;border-radius:3px;background:${color};width:${Math.min(100, Math.round(pct))}%"></div></div>`;

    // ── Data ──────────────────────────────────────────────────────────────────
    const siteOseTtp   = anaplanData?.rows ? getSiteOseTtp(filtered, anaplanData.rows) : {};
    const zoneRows     = computeZoneAnalysis(filtered, siteOseTtp, vpoData);
    const pillarRows   = computePillarPartials(filtered, siteOseTtp, vpoData);
    const domainCorr   = computeDomainOseCorrelation(filtered, siteOseTtp);
    const portfolioMat = computePortfolioMatrix(filtered);
    const thresholds   = computeThresholdSweep(filtered, siteOseTtp, vpoData, [0.65, 0.70, 0.75, 0.80, 0.85]);

    const allRows = filtered.map(s => {
      const kpi = siteOseTtp[s.name]; const vpo = vpoData?.[s.name]?.overall_score ?? null;
      const active = Object.entries(s.scores).filter(([k]) => k !== 'Total Global');
      const activeNonZero = active.filter(([, v]) => v > 0);
      const techAvg = activeNonZero.length ? activeNonZero.reduce((a,[,v])=>a+v, 0)/activeNonZero.length : 0;
      return { name: s.name, zone: s.zone, group: s.group, volume: s.volume, techAvg, vpo, ose: kpi?.ose ?? null, ttp: kpi?.ttp ?? null, lv: Math.round(s.scores['Total Global'] ?? 0) };
    });
    const withKpi = allRows.filter(r => r.vpo != null && r.ose != null);
    const rVpoOse  = withKpi.length >= 5 ? pearson(withKpi.map(r=>r.vpo!), withKpi.map(r=>r.ose!)) : null;
    const rTechOse = withKpi.length >= 5 ? pearson(withKpi.map(r=>r.techAvg), withKpi.map(r=>r.ose!)) : null;

    const filterLabel = [
      volFilter !== 'All' ? `Volume: ${volFilter}` : null,
      complexityFilter !== 'All' ? `${isEN ? 'Complexity' : 'Complexidade'}: ${complexityFilter}` : null,
    ].filter(Boolean).join(' · ') || (isEN ? 'Full universe' : 'Universo completo');

    // ── CSS ───────────────────────────────────────────────────────────────────
    const CSS = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:-apple-system,'Segoe UI',Roboto,sans-serif;font-size:10.5px;color:#1a1a1a;background:#fff;line-height:1.55}
@page{size:A4;margin:12mm 10mm}
@media print{.pb{page-break-after:always;}.avoid{page-break-inside:avoid}}
h1{font-size:22px;font-weight:900;color:#0f172a;margin-bottom:4px}
h2{font-size:14px;font-weight:800;color:#1e3a5f;border-bottom:2px solid #dbeafe;padding-bottom:4px;margin:18px 0 8px}
h3{font-size:11.5px;font-weight:700;color:#1e40af;margin:12px 0 6px}
p.sub{font-size:11px;color:#475569;margin-bottom:12px}
table{border-collapse:collapse;width:100%;font-size:10px;margin:6px 0}
th{background:#1e3a5f;color:#fff;padding:6px 8px;text-align:left;font-weight:700;font-size:9.5px;white-space:nowrap}
td{padding:5px 8px;border-bottom:1px solid #e5e7eb;vertical-align:middle}
tr:nth-child(even) td{background:#f8fafc}
.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:9.5px;font-weight:700;white-space:nowrap}
.b-ok{background:#d1fae5;color:#065f46}.b-warn{background:#fef3c7;color:#92400e}.b-bad{background:#fee2e2;color:#991b1b}.b-info{background:#dbeafe;color:#1e40af}.b-grey{background:#f1f5f9;color:#475569}
.kpi-grid{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
.kpi{flex:1;min-width:100px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;text-align:center}
.kpi .n{font-size:20px;font-weight:900;color:#0f172a;display:block}
.kpi .l{font-size:9px;color:#64748b;display:block;margin-top:2px}
.callout{background:#fffbeb;border-left:4px solid #f59e0b;padding:8px 12px;border-radius:0 6px 6px 0;font-size:10.5px;color:#78350f;margin:10px 0}
.callout.blue{background:#eff6ff;border-color:#3b82f6;color:#1e40af}
.callout.green{background:#f0fdf4;border-color:#10b981;color:#065f46}
.callout.red{background:#fef2f2;border-color:#ef4444;color:#991b1b}
.cover{background:#0f172a;color:#fff;padding:20mm 16mm;min-height:250mm;display:flex;flex-direction:column;justify-content:space-between}
.cover h1{color:#fbbf24;font-size:28px;border-bottom:2px solid #334155;padding-bottom:10px}
.cover .sub{color:#94a3b8;font-size:13px;margin-top:6px}
.cover .kpi .n{color:#fbbf24}.cover .kpi .l{color:#94a3b8}
.cover .kpi{background:#1e293b;border-color:#334155}
.section-label{font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin-bottom:6px}
.zone-header{background:#1e3a5f;color:#fff;padding:6px 10px;font-weight:800;font-size:11px;border-radius:4px;margin-bottom:8px}
.tier-A{background:#d1fae5}.tier-B{background:#fef3c7}.tier-C{background:#fee2e2}
`;

    // ── Shared helpers ────────────────────────────────────────────────────────
    const badge = (text: string, cls: string) => `<span class="badge ${cls}">${text}</span>`;
    const lvBadge = (lv: number) => `<span class="badge" style="background:${levelColor(lv)}22;color:${levelColor(lv)};font-weight:900">L${lv}</span>`;
    const rBadge = (r: number | null, n: number) => {
      if (r == null || n < 5) return badge('—', 'b-grey');
      const s = n < 10 ? '*' : '';
      if (r >= 0.5) return badge(`${R(r)}${s}`, 'b-ok');
      if (r >= 0.2) return badge(`${R(r)}${s}`, 'b-warn');
      if (r <= -0.1) return badge(`${R(r)}${s}`, 'b-bad');
      return badge(`${R(r)}${s}`, 'b-grey');
    };

    // ── Cover page ────────────────────────────────────────────────────────────
    const viewLabels: Record<ViewMode, string> = {
      zone:     isEN ? 'Zone Performance Report' : 'Relatório de Performance por Zona',
      domain:   isEN ? 'Domain Maturity Report' : 'Relatório de Maturidade por Domínio',
      sites:    isEN ? 'Operations Summary' : 'Resumo das Operações',
      maturityVsResults: isEN ? 'Maturity vs Results Analysis' : 'Análise Maturidade vs Resultados',
      portfolioIntelligence: isEN ? 'Portfolio Intelligence: Global vs Legacy' : 'Portfolio Global vs Legacy',
      capabilityGap: isEN ? 'Capability Gap Analysis' : 'Análise de Gap de Capacidade',
    };
    const coverKpis = [
      { n: String(filtered.length), l: isEN ? 'Operations' : 'Operações' },
      { n: P(withKpi.length ? withKpi.filter(r=>r.ose!=null).length/filtered.length : null), l: isEN ? 'KPI Coverage' : 'Cobertura KPI' },
      { n: R(rVpoOse), l: 'r(VPO→OSE)' },
      { n: P(withKpi.length ? withKpi.reduce((a,r)=>a+r.ose!,0)/withKpi.length : null), l: isEN ? 'Avg OSE' : 'OSE Médio' },
    ].map(k => `<div class="kpi"><span class="n">${k.n}</span><span class="l">${k.l}</span></div>`).join('');

    const coverHtml = '<div class="cover pb">'
      + '<div>'
      + `<div class="section-label">Supply Chain Capability · ${now}</div>`
      + `<h1>${viewLabels[targetView]}</h1>`
      + `<p class="sub">${filterLabel}</p>`
      + '</div>'
      + `<div><div class="kpi-grid">${coverKpis}</div>`
      + `<div style="margin-top:14px;padding:10px 14px;background:#1e293b;border-left:3px solid #fbbf24;font-size:11px;color:#cbd5e1">`
      + (rVpoOse != null && rVpoOse >= 0.3
          ? (isEN ? `VPO explains <strong style="color:#fbbf24">${Math.round(rVpoOse*rVpoOse*100)}%</strong> of OSE variance. Recommendation: VPO ≥ 80% before tech investment.`
                  : `VPO explica <strong style="color:#fbbf24">${Math.round(rVpoOse*rVpoOse*100)}%</strong> da variância de OSE. Recomendação: VPO ≥ 80% antes de investir em tech.`)
          : (isEN ? 'VPO is the primary driver of operational efficiency. Tech alone has minimal effect on OSE.'
                  : 'VPO é o principal driver de eficiência operacional. Tech isolada tem efeito mínimo em OSE.'))
      + '</div></div></div>';

    // ── Zone section ─────────────────────────────────────────────────────────
    const buildZoneSection = (): string => {
      const t = isEN;

      // Tier classification
      const zoneTiers = new Map<string, string>();
      const sorted = [...zoneRows].filter(z=>z.n>=5).sort((a,b)=>(b.avgOse??0)-(a.avgOse??0));
      sorted.forEach((z, i) => {
        if (i < sorted.length * 0.33) zoneTiers.set(z.zone, 'tier-A');
        else if (i < sorted.length * 0.66) zoneTiers.set(z.zone, 'tier-B');
        else zoneTiers.set(z.zone, 'tier-C');
      });

      // Zone summary table
      const zoneSummaryRows = zoneRows.filter(z=>z.n>=3).map(z => {
        const tier = zoneTiers.get(z.zone) ?? '';
        return `<tr class="${tier}">
          <td><strong>${z.zone}</strong></td>
          <td style="text-align:center">${z.n}</td>
          <td style="text-align:center">${P(z.avgVpo)}</td>
          <td style="text-align:center;font-weight:700">${P(z.avgOse)}</td>
          <td style="text-align:center">${T(z.avgTtp)} hl/h</td>
          <td style="text-align:center">${A(z.avgTech)}</td>
          <td style="text-align:center">${rBadge(z.rVpoOse, z.n)}</td>
          <td style="text-align:center">${rBadge(z.rTechOse, z.n)}</td>
        </tr>`;
      }).join('');

      // Domain coverage per zone (from GLOBAL_STATS)
      const domainCovRows = DOMAIN_KEYS.filter(d=>d.key!=='Total Global').map(dk => {
        const zoneCells = ['APAC','MAZ','SAZ','NAZ','AFR','EUR'].map(z => {
          const zoneSites = filtered.filter(s=>s.zone===z);
          if (!zoneSites.length) return '<td style="text-align:center;color:#9ca3af">—</td>';
          const withScore = zoneSites.filter(s=>(s.scores[dk.key]??0)>0).length;
          const atL2 = zoneSites.filter(s=>(s.scores[dk.key]??0)>=2).length;
          const pct = withScore/zoneSites.length;
          const l2pct = atL2/zoneSites.length;
          const bg = l2pct >= 0.7 ? '#d1fae522' : l2pct >= 0.4 ? '#fef3c722' : '#fee2e222';
          return `<td style="text-align:center;background:${bg}">`
            + `<span style="font-weight:700;color:${l2pct>=0.7?'#065f46':l2pct>=0.4?'#92400e':'#991b1b'}">${Math.round(pct*100)}%</span>`
            + `<div style="font-size:8.5px;color:#64748b">${Math.round(l2pct*100)}% L2+</div>`
            + `</td>`;
        }).join('');
        const globalPct = GHQ_TOTALS[dk.key]?.Global ?? 0;
        const cls = globalPct >= 60 ? 'b-ok' : globalPct >= 20 ? 'b-warn' : 'b-bad';
        return `<tr>
          <td><strong>${dk.short}</strong></td>
          <td>${dk.key}</td>
          <td style="text-align:center">${badge(Math.round(globalPct)+'%', cls)}</td>
          ${zoneCells}
        </tr>`;
      }).join('');

      // Zone-specific site breakdown (top 5 per zone sorted by OSE)
      const zoneBreakdown = ['APAC','MAZ','SAZ','NAZ','AFR','EUR'].map(z => {
        const sites = allRows.filter(r=>r.zone===z && r.ose!=null).sort((a,b)=>(b.ose??0)-(a.ose??0));
        if (!sites.length) return '';
        const avgOse = sites.reduce((a,r)=>a+(r.ose??0),0)/sites.length;
        const rows = sites.slice(0,8).map(r => `<tr>
          <td><strong>${r.name}</strong></td>
          <td style="text-align:center">${lvBadge(r.lv)}</td>
          <td style="text-align:center">${A(r.techAvg)}</td>
          <td style="text-align:center">${P(r.vpo)}</td>
          <td style="text-align:center;font-weight:700;color:${(r.ose??0)>=0.75?'#065f46':(r.ose??0)>=0.55?'#92400e':'#991b1b'}">${P(r.ose)}</td>
          <td style="text-align:center">${T(r.ttp)} hl/h</td>
          <td style="text-align:center">${r.group}</td>
        </tr>`).join('');
        return `<div style="margin-bottom:16px" class="avoid">
          <div class="zone-header">${z} — ${sites.length} ${t?'sites':'sites'} · OSE ${P(avgOse)}</div>
          <table>
            <thead><tr>
              <th>Site</th><th>${t?'Level':'Nível'}</th><th>Tech Avg</th><th>VPO</th><th>OSE</th><th>TTP</th><th>${t?'Size':'Porte'}</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
          ${sites.length > 8 ? `<p style="font-size:9px;color:#64748b;font-style:italic">+ ${sites.length-8} ${t?'more sites':'sites adicionais'}</p>` : ''}
        </div>`;
      }).join('');

      return `<div class="pb">
        <h2>1. ${t?'Zone Performance Summary':'Resumo de Performance por Zona'}</h2>
        <p class="sub">${t?'VPO and OSE are the primary metrics for operational maturity. r(VPO→OSE) shows how strongly process maturity drives efficiency in each zone.':'VPO e OSE são as métricas primárias de maturidade operacional. r(VPO→OSE) indica a força com que a maturidade de processo impacta eficiência em cada zona.'}</p>
        <div style="font-size:9px;color:#64748b;margin-bottom:6px">🟢 ${t?'High OSE (≥75%)':'OSE alto (≥75%)'} &nbsp; 🟡 ${t?'Medium':'Médio'} &nbsp; 🔴 ${t?'Low (<55%)':'Baixo (<55%)'}</div>
        <table class="avoid">
          <thead><tr>
            <th>${t?'Zone':'Zona'}</th><th>n</th><th>VPO</th><th>OSE</th><th>TTP</th><th>${t?'Tech Avg':'Tech Média'}</th><th>r(VPO→OSE)</th><th>r(Tech→OSE)</th>
          </tr></thead>
          <tbody>${zoneSummaryRows}</tbody>
        </table>
        <div class="callout">
          <strong>${t?'Key finding:':'Achado central:'}</strong> ${t
            ? `VPO→OSE correlation is ${R(rVpoOse)} globally (${rVpoOse!=null?Math.round(rVpoOse*rVpoOse*100):0}% variance explained). In every zone where n≥5, VPO is the dominant predictor. Tech score has no significant direct effect on OSE (r=${R(rTechOse)}).`
            : `A correlação VPO→OSE é ${R(rVpoOse)} globalmente (${rVpoOse!=null?Math.round(rVpoOse*rVpoOse*100):0}% da variância explicada). Em todas as zonas com n≥5, VPO é o preditor dominante. Tech não tem efeito direto significativo em OSE (r=${R(rTechOse)}).`}
        </div>
      </div>
      <div class="pb">
        <h2>2. ${t?'Technology Domain Coverage by Zone':'Cobertura de Domínio por Zona'}</h2>
        <p class="sub">${t?'% of sites with any coverage (top) and % at L2+ (bottom). Global product % indicates standardization level.':'% de sites com qualquer cobertura (cima) e % em L2+ (baixo). % produto global indica nível de padronização.'}</p>
        <table class="avoid">
          <thead><tr>
            <th>${t?'Domain':'Domínio'}</th><th>${t?'Full Name':'Nome Completo'}</th><th>% Global</th>
            <th>APAC</th><th>MAZ</th><th>SAZ</th><th>NAZ</th><th>AFR</th><th>EUR</th>
          </tr></thead>
          <tbody>${domainCovRows}</tbody>
        </table>
        <div class="callout blue">
          ${t?'🟢 Global domains (DA=79%, MDM=93%, MG=63%) positively correlate with OSE. 🔴 Legacy domains (PP=1%, QL=1%, UT=4%) show null/negative correlation. Target: ≥70% L2+ coverage per zone before tech investment.'
            :'🟢 Domínios Globais (DA=79%, MDM=93%, MG=63%) correlacionam positivamente com OSE. 🔴 Domínios Legacy (PP=1%, QL=1%, UT=4%) têm correlação nula/negativa. Meta: ≥70% cobertura L2+ por zona antes de investir em tech.'}
        </div>
      </div>
      <div>
        <h2>3. ${t?'Site Breakdown by Zone':'Detalhamento de Sites por Zona'}</h2>
        <p class="sub">${t?'Top 8 sites per zone ranked by OSE. Full data in XLSX export.':'Top 8 sites por zona ordenados por OSE. Dados completos no export XLSX.'}</p>
        ${zoneBreakdown}
      </div>`;
    };

    // ── Domain section ────────────────────────────────────────────────────────
    const buildDomainSection = (): string => {
      const t = isEN;

      // Domain overview table
      const domainRows = domainCorr.map(d => {
        const readiness = computeDomainReadiness(filtered, siteOseTtp, vpoData, d.domain);
        const l2t = readiness.find(r => r.from === 1 && r.to === 2);
        const l3t = readiness.find(r => r.from === 2 && r.to === 3);
        const clsBadge = d.cls === 'global' ? badge('🟢 Global', 'b-ok') : d.cls === 'mixed' ? badge('🟡 Misto', 'b-warn') : badge('🔴 Legacy', 'b-bad');
        const rBg2 = (r: number | null) => r != null && r >= 0.3 ? '#d1fae5' : r != null && r <= -0.1 ? '#fee2e2' : 'transparent';
        return `<tr>
          <td><strong>${d.short}</strong></td>
          <td style="font-size:9.5px">${d.domain}</td>
          <td style="text-align:center">${clsBadge}</td>
          <td style="text-align:center">${d.ghqPct}%</td>
          <td style="text-align:center">${d.n}</td>
          <td style="text-align:center;background:${rBg2(d.rOse)};font-weight:${(d.rOse??0)>0.2?'700':'400'}">${R(d.rOse)}</td>
          <td style="text-align:center">${l2t ? (l2t.viable ? badge(`+${(l2t.delta!*100).toFixed(1)}pp`, 'b-ok') : badge(`${(l2t.delta!*100).toFixed(1)}pp`, 'b-bad')) : badge('—', 'b-grey')}</td>
          <td style="text-align:center">${l3t ? (l3t.viable ? badge(`+${(l3t.delta!*100).toFixed(1)}pp`, 'b-ok') : badge(`${(l3t.delta!*100).toFixed(1)}pp`, 'b-bad')) : badge('—', 'b-grey')}</td>
        </tr>`;
      }).join('');

      // Per-domain readiness + zone coverage
      const domainDetails = DOMAIN_KEYS.filter(d=>d.key!=='Total Global').map(dk => {
        const readiness = computeDomainReadiness(filtered, siteOseTtp, vpoData, dk.key);
        const sitesInDomain = allRows.filter(r=>(filtered.find(s=>s.name===r.name)?.scores[dk.key]??0)>0);
        const byLevel: Record<number, typeof sitesInDomain> = {};
        sitesInDomain.forEach(r => {
          const lv = filtered.find(s=>s.name===r.name)?.scores[dk.key]??0;
          if (!byLevel[lv]) byLevel[lv]=[];
          byLevel[lv].push(r);
        });
        const levelDist = [1,2,3,4].map(lv => {
          const count = byLevel[lv]?.length ?? 0;
          const pct = sitesInDomain.length ? count/sitesInDomain.length : 0;
          return count > 0 ? `<span style="color:${levelColor(lv)};font-weight:700">L${lv}:${count}</span>` : '';
        }).filter(Boolean).join('  ');
        const ghqPct = GHQ_TOTALS[dk.key]?.Global ?? 0;
        const transitions = readiness.map(tr => {
          const statusBadge = tr.viable ? badge(`L${tr.from}→L${tr.to}: +${(tr.delta!*100).toFixed(1)}pp OSE`, 'b-ok') : badge(`L${tr.from}→L${tr.to}: ${(tr.delta!*100).toFixed(1)}pp`, 'b-bad');
          const vpoReq = tr.topVpo != null ? `VPO mín ≥ ${P(tr.topVpo)}` : '';
          return `<div style="margin:3px 0">${statusBadge} ${vpoReq ? `<span style="font-size:9px;color:#64748b">${vpoReq}</span>` : ''}</div>`;
        }).join('');
        return `<div class="avoid" style="margin-bottom:14px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
          <div style="background:#1e3a5f;color:#fff;padding:6px 10px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:800;font-size:11.5px">${dk.short} — ${dk.key}</span>
            <span style="font-size:9.5px">${badge(ghqPct+'% Global', ghqPct>=60?'b-ok':ghqPct>=20?'b-warn':'b-bad')} &nbsp; ${sitesInDomain.length} sites</span>
          </div>
          <div style="padding:8px 10px">
            <div style="margin-bottom:6px">${levelDist}</div>
            ${transitions || `<span class="badge b-grey">${t?'Insufficient data for transition analysis':'Dados insuficientes para análise de transição'}</span>`}
          </div>
        </div>`;
      }).join('');

      // Zone × Domain matrix (avg score)
      const matrixRows = DOMAIN_KEYS.filter(d=>d.key!=='Total Global').map(dk => {
        const zoneCells = ['APAC','MAZ','SAZ','NAZ','AFR','EUR'].map(z => {
          const zoneSites = filtered.filter(s=>s.zone===z&&(s.scores[dk.key]??0)>0);
          if (!zoneSites.length) return '<td style="text-align:center;color:#d1d5db">—</td>';
          const avg = zoneSites.reduce((a,s)=>a+(s.scores[dk.key]??0),0)/zoneSites.length;
          const bg = avg>=2.5?'#d1fae5':avg>=1.5?'#fef3c7':'#fee2e2';
          return `<td style="text-align:center;background:${bg};font-weight:700">${avg.toFixed(1)}</td>`;
        }).join('');
        return `<tr><td><strong>${dk.short}</strong></td><td style="font-size:9px;color:#64748b">${dk.key}</td>${zoneCells}</tr>`;
      }).join('');

      return `<div class="pb">
        <h2>1. ${t?'Domain Technology Overview':'Visão Geral de Domínios Tecnológicos'}</h2>
        <p class="sub">${t?'r(OSE) = Pearson correlation with OSE. L1→L2 and L2→L3 deltas show expected OSE improvement when sites transition. * = n<10.':'r(OSE) = correlação de Pearson com OSE. Deltas L1→L2 e L2→L3 mostram o ganho esperado em OSE nas transições. * = n<10.'}</p>
        <table class="avoid">
          <thead><tr>
            <th>${t?'Dom':'Dom'}</th><th>${t?'Domain':'Domínio'}</th><th>${t?'Type':'Tipo'}</th><th>% Global</th>
            <th>n</th><th>r(OSE)</th><th>L1→L2</th><th>L2→L3</th>
          </tr></thead>
          <tbody>${domainRows}</tbody>
        </table>
        <div class="callout">
          ${t?'Domains with Global products (DA, MDM, MG) show positive OSE correlation. Legacy domains (PP, QL, UT) are null/negative — local systems don\'t differentiate efficiency. Priority: strengthen VPO Maintenance (r=0.76) before tech transitions.'
            :'Domínios com produto Global (DA, MDM, MG) têm correlação positiva com OSE. Domínios Legacy (PP, QL, UT) são nulos/negativos — sistemas locais não diferenciam eficiência. Prioridade: fortalecer VPO Maintenance (r=0.76) antes de transições tech.'}
        </div>
      </div>
      <div class="pb">
        <h2>2. ${t?'Domain Readiness & Transition Analysis':'Prontidão e Análise de Transição por Domínio'}</h2>
        <p class="sub">${t?'Green = transition delivers positive OSE. Red = negative or neutral impact. Minimum VPO threshold for the transition to be viable.':'Verde = transição gera OSE positivo. Vermelho = impacto negativo ou neutro. Limiar mínimo de VPO para a transição ser viável.'}</p>
        ${domainDetails}
      </div>
      <div>
        <h2>3. ${t?'Zone × Domain Matrix (avg score)':'Matriz Zona × Domínio (score médio)'}</h2>
        <p class="sub">${t?'Average domain score per zone. 🟢 ≥2.5 · 🟡 1.5–2.5 · 🔴 <1.5':'Score médio de domínio por zona. 🟢 ≥2.5 · 🟡 1.5–2.5 · 🔴 <1.5'}</p>
        <table class="avoid">
          <thead><tr><th>Dom</th><th>${t?'Domain':'Domínio'}</th><th>APAC</th><th>MAZ</th><th>SAZ</th><th>NAZ</th><th>AFR</th><th>EUR</th></tr></thead>
          <tbody>${matrixRows}</tbody>
        </table>
      </div>`;
    };

    // ── Sites section ─────────────────────────────────────────────────────────
    const buildSitesSection = (): string => {
      const t = isEN;
      const sortedSites = [...allRows].sort((a,b) => (b.ose??-1)-(a.ose??-1));
      const rows = sortedSites.map(r => `<tr>
        <td><strong>${r.name}</strong><div style="font-size:8.5px;color:#64748b">${r.zone} · ${r.group}</div></td>
        <td style="text-align:center">${lvBadge(r.lv)}</td>
        <td style="text-align:center">${A(r.techAvg)}</td>
        <td style="text-align:center">${P(r.vpo)}</td>
        <td style="text-align:center;font-weight:700;color:${(r.ose??0)>=0.75?'#065f46':(r.ose??0)>=0.55?'#92400e':'#991b1b'}">${P(r.ose)}</td>
        <td style="text-align:center">${T(r.ttp)} hl/h</td>
      </tr>`).join('');
      return `<div>
        <h2>${t?'Operations Ranked by OSE':'Operações Ordenadas por OSE'} (${sortedSites.length})</h2>
        <table>
          <thead><tr>
            <th>Site</th><th>${t?'Level':'Nível'}</th><th>Tech Avg</th><th>VPO</th><th>OSE</th><th>TTP</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    };

    // ── Maturity section ──────────────────────────────────────────────────────
    const buildMaturitySection = (): string => {
      const t = isEN;
      const quadrantHtmlLocal = [
        { k: t?'Tech High + VPO High':'Tech Alta + VPO Alto', fn: (r:{techAvg:number;vpo:number|null;ose:number|null}) => r.techAvg>=2&&(r.vpo??0)>=0.778 },
        { k: t?'Tech High + VPO Low':'Tech Alta + VPO Baixo',  fn: (r:{techAvg:number;vpo:number|null;ose:number|null}) => r.techAvg>=2&&(r.vpo??0)<0.778 },
        { k: t?'Tech Low + VPO High':'Tech Baixa + VPO Alto', fn: (r:{techAvg:number;vpo:number|null;ose:number|null}) => r.techAvg<2&&(r.vpo??0)>=0.778 },
        { k: t?'Tech Low + VPO Low':'Tech Baixa + VPO Baixo', fn: (r:{techAvg:number;vpo:number|null;ose:number|null}) => r.techAvg<2&&(r.vpo??0)<0.778 },
      ].map(q => {
        const sub = withKpi.filter(q.fn);
        const oseAvg = sub.length ? sub.reduce((a,r)=>a+r.ose!,0)/sub.length : null;
        const vpoAvg = sub.length ? sub.reduce((a,r)=>a+r.vpo!,0)/sub.length : null;
        const highlight = (sub.length > 20 && (oseAvg??0) >= 0.75) ? 'background:#d1fae544' : '';
        return `<tr style="${highlight}"><td>${q.k}</td><td style="text-align:center">${sub.length}</td><td style="text-align:center">${P(vpoAvg)}</td><td style="text-align:center;font-weight:700">${P(oseAvg)}</td></tr>`;
      }).join('');

      const levelRows2 = [0,1,2,3,4].map(lv => {
        const lvSites = withKpi.filter(r=>r.lv===lv);
        const oseAvg = lvSites.length ? lvSites.reduce((a,r)=>a+r.ose!,0)/lvSites.length : null;
        const ttpAvg = lvSites.filter(r=>r.ttp!=null).length ? lvSites.filter(r=>r.ttp!=null).reduce((a,r)=>a+r.ttp!,0)/lvSites.filter(r=>r.ttp!=null).length : null;
        const vpoAvg = lvSites.filter(r=>r.vpo!=null).length ? lvSites.filter(r=>r.vpo!=null).reduce((a,r)=>a+r.vpo!,0)/lvSites.filter(r=>r.vpo!=null).length : null;
        if (!lvSites.length) return '';
        return `<tr>
          <td>${lvBadge(lv)} <span style="font-size:9px;color:#64748b;margin-left:4px">${['Baseline','Digital Foundation','Connected Ops','Intelligent Ops','Touchless Ops'][lv]}</span></td>
          <td style="text-align:center">${lvSites.length}</td>
          <td style="text-align:center">${P(vpoAvg)}</td>
          <td style="text-align:center;font-weight:700">${P(oseAvg)}</td>
          <td style="text-align:center">${T(ttpAvg)} hl/h</td>
        </tr>`;
      }).join('');

      const threshRows = thresholds.map(row => {
        const isInflect = (row.rAbove??0)>0.1 && (row.rBelow??0)<-0.1;
        return `<tr style="${isInflect?'background:#fef3c7':''}">
          <td><strong>≥ ${Math.round(row.threshold*100)}%</strong>${isInflect?' ◄ inflection':''}</td>
          <td style="text-align:center">${row.nAbove}</td>
          <td style="text-align:center;color:${rColor(row.rAbove)};font-weight:700">${R(row.rAbove)}</td>
          <td style="text-align:center">${row.nBelow}</td>
          <td style="text-align:center;color:${rColor(row.rBelow)};font-weight:700">${R(row.rBelow)}</td>
        </tr>`;
      }).join('');

      const pillarRows2 = pillarRows.map(p => {
        const cls = p.cls==='own' ? 'b-ok' : p.cls==='spurious' ? 'b-bad' : 'b-warn';
        const interp = p.cls==='own' ? (t?'Own causal effect':'Efeito causal próprio') : p.cls==='spurious' ? (t?'Spurious (vanishes)':'Espúrio (desaparece)') : (t?'Marginal':'Marginal');
        return `<tr>
          <td>${p.pillar}</td>
          <td style="text-align:center;color:${rColor(p.rSimple)};font-weight:700">${R(p.rSimple)}</td>
          <td style="text-align:center;color:${rColor(p.rPartial)};font-weight:700">${R(p.rPartial)}</td>
          <td style="text-align:center">${badge(interp, cls)}</td>
        </tr>`;
      }).join('');

      return `<div class="pb">
        <h2>1. ${t?'Global Correlations':'Correlações Globais'}</h2>
        <div class="kpi-grid">
          <div class="kpi"><span class="n" style="color:${rColor(rVpoOse)}">${R(rVpoOse)}</span><span class="l">r(VPO→OSE)</span></div>
          <div class="kpi"><span class="n" style="color:${rColor(rTechOse)}">${R(rTechOse)}</span><span class="l">r(Tech→OSE)</span></div>
          <div class="kpi"><span class="n">${rVpoOse!=null?Math.round(rVpoOse*rVpoOse*100):0}%</span><span class="l">${t?'Variance explained by VPO':'Variância explicada por VPO'}</span></div>
          <div class="kpi"><span class="n">${withKpi.length}</span><span class="l">${t?'Sites analyzed':'Sites analisados'}</span></div>
        </div>
        <div class="callout">${t
          ? `VPO explains <strong>${rVpoOse!=null?Math.round(rVpoOse*rVpoOse*100):0}%</strong> of OSE variance vs <strong>${rTechOse!=null?Math.round(rTechOse*rTechOse*100):0}%</strong> for Tech. Below VPO 80%, tech investment shows negative correlation with OSE. The recommendation is to achieve VPO ≥ 80% before any tech investment.`
          : `VPO explica <strong>${rVpoOse!=null?Math.round(rVpoOse*rVpoOse*100):0}%</strong> da variância de OSE vs <strong>${rTechOse!=null?Math.round(rTechOse*rTechOse*100):0}%</strong> da Tech. Abaixo de 80% VPO, investimento em tech apresenta correlação negativa com OSE. A recomendação é atingir VPO ≥ 80% antes de qualquer investimento em tech.`}
        </div>
        <h2>2. ${t?'By Technology Level':'Por Nível Tecnológico'}</h2>
        <table class="avoid"><thead><tr>
          <th>${t?'Level':'Nível'}</th><th>n</th><th>VPO</th><th>OSE</th><th>TTP</th>
        </tr></thead><tbody>${levelRows2}</tbody></table>
        <h2>3. ${t?'Tech × VPO Quadrants':'Quadrantes Tech × VPO'}</h2>
        <p class="sub">${t?'High VPO drives OSE regardless of tech level (~21 p.p. gap). Tech level alone: ~1-2 p.p.':'VPO alto determina OSE independente do nível tech (~21 p.p. diferença). Nível tech isolado: ~1-2 p.p.'}</p>
        <table class="avoid"><thead><tr>
          <th>${t?'Quadrant':'Quadrante'}</th><th>n</th><th>VPO</th><th>OSE</th>
        </tr></thead><tbody>${quadrantHtmlLocal}</tbody></table>
      </div>
      <div>
        <h2>4. ${t?'VPO Threshold for Tech ROI':'Limiar VPO para ROI de Tech'}</h2>
        <p class="sub">${t?'Tech→OSE correlation above and below each VPO threshold. Inflection point at VPO ≥ 80%.':'Correlação Tech→OSE acima e abaixo de cada limiar. Ponto de inflexão em VPO ≥ 80%.'}</p>
        <table class="avoid"><thead><tr>
          <th>VPO Threshold</th>
          <th>n ${t?'above':'acima'}</th><th>Tech→OSE ${t?'above':'acima'}</th>
          <th>n ${t?'below':'abaixo'}</th><th>Tech→OSE ${t?'below':'abaixo'}</th>
        </tr></thead><tbody>${threshRows}</tbody></table>
        <h2>5. ${t?'VPO Pillars — Causality vs Spurious Correlation':'Pilares VPO — Causalidade vs Correlação Espúria'}</h2>
        <p class="sub">${t?'Partial correlation controls for overall VPO. Only Maintenance and Logistics have own causal effect on OSE.':'Correlação parcial controla pelo VPO geral. Apenas Maintenance e Logistics têm efeito causal próprio em OSE.'}</p>
        <table class="avoid"><thead><tr>
          <th>${t?'Pillar':'Pilar'}</th><th>r(OSE)</th><th>${t?'Partial r':'r Parcial'}</th><th>${t?'Interpretation':'Interpretação'}</th>
        </tr></thead><tbody>${pillarRows2}</tbody></table>
        <h2>6. ${t?'Zone Analysis':'Análise por Zona'}</h2>
        <table class="avoid"><thead><tr>
          <th>Zona</th><th>n</th><th>VPO</th><th>OSE</th><th>TTP</th><th>r(VPO→OSE)</th><th>r(Tech→OSE)</th>
        </tr></thead><tbody>${zoneRows.filter(z=>z.n>=3).map(z=>`<tr>
          <td><strong>${z.zone}</strong></td><td style="text-align:center">${z.n}</td>
          <td style="text-align:center">${P(z.avgVpo)}</td>
          <td style="text-align:center;font-weight:700">${P(z.avgOse)}</td>
          <td style="text-align:center">${T(z.avgTtp)} hl/h</td>
          <td style="text-align:center">${rBadge(z.rVpoOse, z.n)}</td>
          <td style="text-align:center">${rBadge(z.rTechOse, z.n)}</td>
        </tr>`).join('')}</tbody></table>
        <div class="callout green">
          <strong>${t?'Strategic recommendation:':'Recomendação estratégica:'}</strong>
          ${t?'1) Achieve VPO ≥ 80% before tech investment. 2) Prioritize VPO Maintenance (only pillar with causal effect, r=0.76). 3) Invest in Global domains first (DA/MDM/MG). 4) APAC is the exception where tech has direct effect.'
            :'1) Atingir VPO ≥ 80% antes de investir em tech. 2) Priorizar VPO Maintenance (único pilar com efeito causal, r=0.76). 3) Investir em domínios Globais primeiro (DA/MDM/MG). 4) APAC é a exceção onde tech tem efeito direto.'}
        </div>
      </div>`;
    };

    // ── Portfolio section ─────────────────────────────────────────────────────
    const buildPortfolioSection = (): string => {
      const t = isEN;
      const globalRows = portfolioMat.filter(r=>r.zone==='Global');
      const portRows = globalRows.map(r => {
        const dot = {global_leading:'🟢',approaching:'🟡',legacy_dominant:'🔴',absent:'⬜'}[r.parityStatus]??'—';
        const statusLabel = {global_leading:t?'Global Leading':'Global Líder',approaching:t?'Approaching':'Aproximando',legacy_dominant:t?'Legacy Dominant':'Legacy Dom.',absent:t?'No Global Product':'Sem Produto Global'}[r.parityStatus]??'—';
        const cls = r.parityStatus==='global_leading'?'b-ok':r.parityStatus==='approaching'?'b-warn':r.parityStatus==='legacy_dominant'?'b-bad':'b-grey';
        return `<tr>
          <td><strong>${r.short}</strong></td>
          <td style="font-size:9px;color:#64748b">${r.domain}</td>
          <td style="text-align:center">${r.nGlobal}</td>
          <td style="text-align:center">${r.nLegacy}</td>
          <td style="text-align:center">${r.nNeither}</td>
          <td style="text-align:center">${pctBar(r.globalCoveragePct*100)}<span style="font-size:9px">${Math.round(r.globalCoveragePct*100)}%</span></td>
          <td style="text-align:center">${A(r.avgScoreGlobal)}</td>
          <td style="text-align:center">${A(r.avgScoreLegacy)}</td>
          <td style="text-align:center">${badge(dot+' '+statusLabel, cls)}</td>
        </tr>`;
      }).join('');
      const domRows = domainCorr.map(d => {
        const cls = d.cls==='global'?'b-ok':d.cls==='mixed'?'b-warn':'b-bad';
        const icon = d.cls==='global'?'🟢':d.cls==='mixed'?'🟡':'🔴';
        return `<tr>
          <td><strong>${d.short}</strong> ${d.domain}</td>
          <td style="text-align:center">${d.ghqPct}%</td>
          <td style="text-align:center">${badge(icon+' '+(d.cls==='global'?'Global':d.cls==='mixed'?(t?'Mixed':'Misto'):'Legacy'), cls)}</td>
          <td style="text-align:center;color:${rColor(d.rOse)};font-weight:700">${R(d.rOse)}</td>
          <td style="text-align:center">${d.n}</td>
        </tr>`;
      }).join('');
      return `<div class="pb">
        <h2>1. ${t?'Global Portfolio Coverage by Domain':'Cobertura do Portfólio Global por Domínio'}</h2>
        <p class="sub">${t?'Avg score: average tech level among sites with that product type. Coverage: % of sites with a Global product deployed.':'Score médio: nível tech médio entre sites com esse tipo de produto. Cobertura: % de sites com produto Global implantado.'}</p>
        <table class="avoid"><thead><tr>
          <th>${t?'Dom':'Dom'}</th><th>${t?'Domain':'Domínio'}</th>
          <th>${t?'Global Sites':'Sites Global'}</th><th>${t?'Legacy Sites':'Sites Legacy'}</th><th>${t?'Neither':'Nenhum'}</th>
          <th>${t?'Global Coverage':'Cobertura Global'}</th><th>${t?'Avg Global Score':'Score Médio Global'}</th><th>${t?'Avg Legacy Score':'Score Médio Legacy'}</th><th>Status</th>
        </tr></thead><tbody>${portRows}</tbody></table>
        <div class="callout">
          ${t?'Decommissioning Legacy is viable when: (1) Global coverage ≥ 70%, (2) Global avg score ≥ Legacy avg score, (3) VPO transition plan is in place. Priority: DA, MDM, MG are already Global-leading and show positive OSE correlation.'
            :'Descomissionamento Legacy é viável quando: (1) cobertura Global ≥ 70%, (2) score médio Global ≥ Legacy, (3) plano de transição VPO em vigor. Prioridade: DA, MDM, MG já lideram e têm correlação positiva com OSE.'}
        </div>
      </div>
      <div>
        <h2>2. ${t?'Tech Portfolio: OSE Correlation by Product Type':'Portfólio Tech: Correlação OSE por Tipo de Produto'}</h2>
        <table class="avoid"><thead><tr>
          <th>${t?'Domain':'Domínio'}</th><th>% Global</th><th>${t?'Type':'Tipo'}</th><th>r(OSE)</th><th>n</th>
        </tr></thead><tbody>${domRows}</tbody></table>
        <div class="callout blue">
          ${t?'🟢 Global domains (DA=79%, MDM=93%, MG=63%) show positive OSE correlation. 🔴 Legacy domains (PP=1%, QL=1%, UT=4%) show null/negative correlation. Investing in Legacy domains without a Global alternative does not improve operational efficiency.'
            :'🟢 Domínios Globais (DA=79%, MDM=93%, MG=63%) têm correlação positiva com OSE. 🔴 Domínios Legacy (PP=1%, QL=1%, UT=4%) correlação nula/negativa. Investir em domínios Legacy sem alternativa Global não melhora eficiência operacional.'}
        </div>
      </div>`;
    };

    // ── Methodology ───────────────────────────────────────────────────────────
    const methodologySection = `<div class="avoid">
      <h2>${isEN?'Methodology & Data Sources':'Metodologia e Fontes de Dados'}</h2>
      <ul style="font-size:10.5px;line-height:1.9;padding-left:16px;columns:2">
        <li><strong>OSE</strong>: ΣEPT/ΣOST · PG-R0060/PG-K4039 · Databricks YTD 2025</li>
        <li><strong>TTP</strong>: PG-K0412 (hl/h) · Databricks YTD 2025</li>
        <li><strong>VPO</strong>: Y/(Y+N) · Self-Assessment Jan/2026 · All levels 0–4</li>
        <li><strong>${isEN?'Tech Level':'Nível Tech'}</strong>: Avg active domain scores · Coverage.xlsx</li>
        <li><strong>Pearson r</strong>: ${isEN?'p-values: ***<0.001, **<0.01, *<0.05':'p-valores: ***<0.001, **<0.01, *<0.05'}</li>
        <li><strong>${isEN?'Warning':'Aviso'}</strong>: ${isEN?'Cross-section data. Correlation ≠ causation.':'Dados cross-section. Correlação ≠ causalidade.'}</li>
      </ul>
      <div style="margin-top:16px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:9.5px;color:#94a3b8;text-align:center">
        Supply Capability Assessment · ${now} · ${filtered.length} ${isEN?'operations':'operações'} · ${filterLabel}
      </div>
    </div>`;

    // ── Assemble ──────────────────────────────────────────────────────────────
    const sectionContent = targetView === 'zone'     ? buildZoneSection()
      : targetView === 'domain'    ? buildDomainSection()
      : targetView === 'sites'     ? buildSitesSection()
      : targetView === 'maturityVsResults' ? buildMaturitySection()
      : buildPortfolioSection();

    return '<!DOCTYPE html><html lang="' + lang + '"><head>'
      + '<meta charset="UTF-8"><meta name="viewport" content="width=device-width">'
      + '<title>Supply Capability Assessment</title>'
      + '<style>' + CSS + '</style></head><body>'
      + coverHtml
      + '<div style="padding:14mm 12mm">'
      + sectionContent
      + methodologySection
      + '</div>'
      + '<script>window.onload=function(){setTimeout(function(){window.print();},600);};<\/script>'
      + '</body></html>';
  };



  const handleExport = () => {
    setExp(true);
    try {
      const html = buildPdfHTML(view);
      const win = window.open('', '_blank');
      if (!win) { alert('Pop-up bloqueado. Permita pop-ups para este site.'); return; }
      win.document.write(html);
      win.document.close();
      // print() is triggered by window.onload inside the generated HTML
    } catch(e) { console.error(e); }
    finally { setExp(false); }
  };

  const handleExportXlsx = async () => {
    setExpXlsx(true);
    try {
      await exportXLSX(t);
    } catch(e) { console.error(e); }
    finally { setExpXlsx(false); }
  };

  const {featured, grid} = useMemo(()=>{
    if(view==='domain'){
      const dn=activeTab;
      return {
        featured:{title:t.consolidated,subtitle:t.consolidatedSub,domain:dn,zone:'Global',sites:filtered,accent:undefined},
        grid:ZONES.map(z=>({title:z,domain:dn,zone:z,sites:filtered.filter(s=>s.zone===z),accent:ZONE_COLORS[z].dot}))
      };
    }
    const zn=activeTab==="Total Global"?"Global":activeTab;
    const zs=zn==="Global"?filtered:filtered.filter(s=>s.zone===zn);
    return {
      featured:{title:zn==="Global"?t.globalPerf:(t.overallView + ': ' + zn),subtitle:t.consolidatedSub,domain:"Total Global",zone:zn,sites:zs,accent:undefined},
      grid:DOMAINS.filter(d=>d!=="Total Global").map(d=>({title:d,domain:d,zone:zn,sites:zs,accent:undefined}))
    };
  },[view,activeTab,filtered,t]);

  const bg  = dark?'bg-gray-900 text-white':'bg-gray-50 text-gray-900';
  const nav = dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100';
  const switcher = dark?'bg-gray-800':'bg-gray-100';
  const switcherActive = dark?'bg-gray-700 text-white':'bg-white text-gray-900';
  const switcherIdle   = dark?'text-gray-400 hover:text-gray-200':'text-gray-500 hover:text-gray-700';
  const tabsBar = dark?'bg-gray-900 border-gray-800':'bg-white border-gray-100';
  const tabActive = 'bg-yellow-400 text-gray-900';
  const tabIdle   = dark?'text-gray-400 hover:text-white hover:bg-gray-800':'text-gray-500 hover:text-gray-900 hover:bg-gray-100';

  const NAV=[
    {k:'zone' as ViewMode,label:t.byZone,icon:<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>},
    {k:'domain' as ViewMode,label:t.byDomain,icon:<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>},
    {k:'sites' as ViewMode,label:t.bySite,icon:<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>},
    {k:'maturityVsResults' as ViewMode,label:t.maturityVsResults,icon:<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>},
    {k:'portfolioIntelligence' as ViewMode,label:t.portfolioNavLabel,icon:<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>},
    {k:'capabilityGap' as ViewMode,label:t.capabilityGapNavLabel,icon:<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/><circle cx="17" cy="5" r="3" fill="currentColor" opacity=".4"/></svg>},
  ];

  return (
    <div className={'min-h-screen font-sans ' + (bg)}>
      {/* ── TOP NAV ── */}
      <header className={'border-b sticky top-0 z-40 shadow-sm ' + (nav)}>
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className={'text-[10px] font-black uppercase tracking-widest ' + (dark?'text-gray-500':'text-gray-400')}>{t.appSub}</p>
            <h1 className={'text-xl font-black leading-tight ' + (dark?'text-white':'text-gray-900')}>
              {t.appTitle} <span className="text-yellow-400">{t.appAccent}</span>
            </h1>
          </div>
          {/* View switcher */}
          <nav className={'flex items-center gap-1 p-1 rounded-xl ' + (switcher)}>
            {NAV.map(item=>(
              <button key={item.k} onClick={()=>{setView(item.k);setTabIdx(0);}}
                className={'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ' + (view===item.k?switcherActive+' shadow-sm':switcherIdle)}>
                {item.icon}{item.label}
              </button>
            ))}
          </nav>
          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Lang toggle */}
            <button onClick={()=>setLang(l=>l==='pt'?'en':'pt')}
              className={'px-3 py-2 rounded-lg text-xs font-black border transition-all ' + (dark?'border-gray-700 text-gray-300 hover:border-yellow-400 hover:text-yellow-400':'border-gray-200 text-gray-600 hover:border-yellow-400 hover:text-yellow-500')}>
              {t.langToggle}
            </button>
            {/* Dark toggle */}
            <button onClick={()=>setDark(d=>!d)}
              title={dark?t.lightMode:t.darkMode}
              className={'p-2 rounded-lg transition-all ' + (dark?'bg-gray-700 text-yellow-400 hover:bg-gray-600':'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
              {dark
                ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/></svg>
                : <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
              }
            </button>
            {/* Export XLSX */}
            <button onClick={handleExportXlsx} disabled={exportingXlsx}
              className={'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow disabled:opacity-60 ' + (dark?'bg-emerald-600 text-white hover:bg-emerald-500':'bg-emerald-600 text-white hover:bg-emerald-500')}>
              {exportingXlsx
                ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              }
              {exportingXlsx?t.generating:t.exportXlsx}
            </button>
            {/* Export PDF */}
            <button onClick={handleExport} disabled={exporting}
              className={'flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow disabled:opacity-60 ' + (dark?'bg-yellow-400 text-gray-900 hover:bg-yellow-300':'bg-gray-900 text-white hover:bg-gray-800')}>
              {exporting
                ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              }
              {exporting?t.generating:t.exportPdf}
            </button>
          </div>
        </div>
      </header>

      {/* ── TABS ── */}
      {view!=='sites'&&(
        <div className={'border-b ' + (tabsBar)}>
          <div className="max-w-screen-2xl mx-auto px-6">
            <div className="flex gap-1 overflow-x-auto custom-scrollbar py-2">
              {tabs.map((tab,idx)=>(
                <button key={tab} onClick={()=>setTabIdx(idx)}
                  className={'px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ' + (tabIdx===idx?tabActive:tabIdle)}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      <div id="dashboard-content" className="max-w-screen-2xl mx-auto px-4 md:px-6 py-5">
        <div className="flex gap-5 items-start">

          {/* ── SIDEBAR (fixed width, never shrinks) ── */}
          <div className="w-52 flex-none hidden lg:block sticky top-[65px] max-h-[calc(100vh-75px)] overflow-y-auto custom-scrollbar pb-4">
            <Sidebar volFilter={volFilter} onFilter={setVol} complexityFilter={complexityFilter} onComplexity={setCplx} t={t} dark={dark}/>
          </div>

          {/* ── MAIN CONTENT (takes remaining space) ── */}
          <div className="flex-1 min-w-0">

            {/* Sites view */}
            {view==='sites'&&(
              <>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-yellow-400 w-1.5 h-6 rounded-sm block flex-shrink-0"/>
                  <h2 className={'text-lg font-black ' + (dark?'text-white':'text-gray-900')}>{t.sitesTitle}</h2>
                  <span className={'text-sm font-medium ' + (dark?'text-gray-400':'text-gray-400')}>· {t.sitesCount(filtered.length)}</span>
                </div>
                <SitesView sites={filtered} t={t} dark={dark} lang={lang}/>
              </>
            )}

            {/* Portfolio Intelligence view */}
            {view==='portfolioIntelligence'&&(
              <>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="bg-yellow-400 w-1.5 h-6 rounded-sm block flex-shrink-0"/>
                  <h2 className={'text-lg font-black ' + (dark?'text-white':'text-gray-900')}>{t.portfolioNavLabel}</h2>
                  <span className={'text-sm ' + (dark?'text-gray-400':'text-gray-500')}>{t.portfolioSub}</span>
                </div>
                <PortfolioIntelligenceView sites={filtered} dark={dark} t={t} lang={lang} productCoverage={productCoverage} />
              </>
            )}

            {/* Maturity vs Results view */}
            {view==='maturityVsResults'&&(
              <>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="bg-yellow-400 w-1.5 h-6 rounded-sm block flex-shrink-0"/>
                  <h2 className={'text-lg font-black ' + (dark?'text-white':'text-gray-900')}>{t.maturityVsResults}</h2>
                  <span className={'text-sm ' + (dark?'text-gray-400':'text-gray-500')}>{t.maturityVsResultsSub}</span>
                </div>
                <MaturityVsResultsView t={t} dark={dark} lang={lang} sites={filtered} anaplanData={anaplanData} vpoData={vpoData}/>
              </>
            )}


            {/* Capability Gap view */}
            {view==='capabilityGap'&&(
              <>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="bg-yellow-400 w-1.5 h-6 rounded-sm block flex-shrink-0"/>
                  <h2 className={'text-lg font-black ' + (dark?'text-white':'text-gray-900')}>{t.capabilityGapTitle}</h2>
                  <span className={'text-sm ' + (dark?'text-gray-400':'text-gray-500')}>{t.capabilityGapSub}</span>
                </div>
                <CapabilityGapView dark={dark} t={t as Record<string, unknown>} lang={lang}/>
              </>
            )}

                        {/* Zone/Domain views — Monitoramento (não exibir na view Maturidade vs Resultados) */}
            {(view==='zone'||view==='domain')&&(
              <>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="bg-yellow-400 w-1.5 h-6 rounded-sm block flex-shrink-0"/>
                  <h2 className={'text-lg font-black ' + (dark?'text-white':'text-gray-900')}>{t.monitoring}: {activeTab}</h2>
                  {volFilter!=='All'&&(
                    <span className="ml-auto text-xs bg-yellow-400/20 border border-yellow-400/40 text-yellow-600 px-3 py-1 rounded-full font-bold">
                      {volFilter} · {filtered.length} sites
                    </span>
                  )}
                </div>
                <div className="mb-5">
                  <FunnelCard title={featured.title} subtitle={featured.subtitle} domain={featured.domain} zone={featured.zone} volFilter={volFilter} sites={featured.sites} isFeatured accent={featured.accent} t={t} dark={dark}/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {grid.map((c,i)=>(
                    <FunnelCard key={`${c.title}-${i}`} title={c.title} domain={c.domain} zone={c.zone} volFilter={volFilter} sites={c.sites} accent={c.accent} t={t} dark={dark}/>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
