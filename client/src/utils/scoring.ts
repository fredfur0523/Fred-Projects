// Score-to-color/class mapping and maturity level helpers
import type { Site } from '../types';

export function scoreToColor(score: number): string {
  if (score <= 0) return '#D1D5DB';   // L0 gray
  if (score <= 1) return '#FFE066';   // L1 yellow
  if (score <= 2) return '#FFC000';   // L2 amber
  if (score <= 3) return '#F59E0B';   // L3 orange amber
  return '#10B981';                    // L4 green
}

export function scoreToTextClass(score: number, dark: boolean): string {
  if (score <= 0) return dark ? 'text-gray-500' : 'text-gray-400';
  if (score <= 1) return 'text-yellow-700';
  if (score <= 2) return 'text-amber-700';
  if (score <= 3) return 'text-orange-700';
  return 'text-emerald-700';
}

export const getMaturityLevel = (site: Site): string => {
  const s = site.scores['Total Global'] ?? 0;
  return 'L' + Math.min(4, Math.max(0, Math.round(s)));
};
