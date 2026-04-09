// Anaplan KPI data: loaded from JSON generated via MCP user-anaplan-supply-chain-kpi
export type AnaplanRow = { plant: string; year: string; kpi_code: string; aggregated_value: number; periodtype?: string; month?: string };
export type AnaplanData = { year: number; rows: AnaplanRow[] };

// Waterfall OSE data (Sprint 8)
export type WaterfallZoneData = { TT: number; NST: number; ST: number; DPA: number; LT: number; EC: number; LET: number; IC: number; EPT: number; OST: number; volume_hl: number; OSE: number; GLY: number; OAE: number; OEE: number; LEF: number };
export type WaterfallData = { period: string; generated_at: string; zones: string[]; data: Record<string, WaterfallZoneData> };

// KPI History (kpi-history.json)
export interface KpiHistoryMonth { period: string; zone: string; OSE: number; GLY?: number; OAE?: number; }
export interface KpiHistoryData { generated_at: string; periods: string[]; months: KpiHistoryMonth[]; }
