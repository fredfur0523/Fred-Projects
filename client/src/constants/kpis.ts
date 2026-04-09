// KPI code constants and helper maps

export const VOLUME_KPI_CODES = [
  'PB-R0030', 'PB-R0010', 'PB-R0050', // Bottling: Soft Drink, Beer, Water
  'PC-R0050', 'PC-R0010', 'PC-R0030', // Canning: Water, Beer, Soft Drink
  'PP-R0050', 'PP-R0010', 'PP-R0030', // PET: Water, Beer, Soft Drink
] as const;

export const ANAPLAN_KPI_GROUPS = ['OSE', 'VIC', 'Lifecycle', 'TTP'] as const;
export type KpiGroup = typeof ANAPLAN_KPI_GROUPS[number];

// Map kpi_code prefix (first 2 chars) to indicator group
export const KPI_GROUP_BY_PREFIX: Record<string, KpiGroup> = {
  PG: 'Lifecycle', SL: 'OSE', LP: 'VIC', CA: 'TTP', AL: 'OSE', DC: 'TTP', LE: 'Lifecycle',
};

// Study KPI codes (OSE = ΣEPT/ΣOST, never simple average)
export const KPI_EPT = 'PG-R0060';  // Effective Production Time
export const KPI_OST = 'PG-K4039';  // Overall Supply Time
export const STUDY_KPI_OSE_PRECALC = 'PG-K4038';  // fallback when EPT/OST not available
export const STUDY_KPI_TTP = 'PG-K0412';

export const getKpiGroup = (kpiCode: string): KpiGroup | null => {
  if (kpiCode === STUDY_KPI_OSE_PRECALC) return 'OSE';
  if (kpiCode === STUDY_KPI_TTP) return 'TTP';
  const prefix = kpiCode.slice(0, 2);
  return KPI_GROUP_BY_PREFIX[prefix] ?? null;
};

// Explicit plant-name → site-name overrides (handles case, suffixes, abbreviation differences)
export const PLANT_TO_SITE_OVERRIDE: Record<string, string> = {
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
