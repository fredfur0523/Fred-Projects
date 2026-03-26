#!/usr/bin/env node
/**
 * Adiciona ao anaplan-ose-ttp-2025.json as linhas PG-R0060 (EPT), PG-R0080 (ST) e PG-K4039 (OST)
 * para cada planta, de forma que OSE = ΣEPT/ΣOST e GLY = ΣEPT/ΣST apareçam na interface.
 * Valores sintéticos: EPT em horas, OST e ST derivados para OSE ~0.70-0.78 e GLY ~0.82-0.88.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const inputPath = path.join(__dirname, '../client/public/anaplan-ose-ttp-2025.json');
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

// Hash simples por string para valor determinístico 0..1
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return (Math.abs(h) % 10000) / 10000;
}

const plants = [...new Set(data.rows.map((r) => r.plant).filter((p) => p && p !== 'N/A'))];
const year = String(data.year || 2025);
const newRows = [];

plants.forEach((plant) => {
  const h = hash(plant);
  // EPT em horas (base 180–420)
  const ept = 180 + 240 * h;
  // OSE alvo ~0.68–0.78 → OST = EPT / OSE
  const oseTarget = 0.68 + 0.10 * hash(plant + 'ost');
  const ost = ept / oseTarget;
  // GLY alvo ~0.80–0.88 → ST = EPT / GLY
  const glyTarget = 0.80 + 0.08 * hash(plant + 'st');
  const st = ept / glyTarget;

  newRows.push(
    { plant, year, kpi_code: 'PG-R0060', aggregated_value: Math.round(ept * 100) / 100 },
    { plant, year, kpi_code: 'PG-R0080', aggregated_value: Math.round(st * 100) / 100 },
    { plant, year, kpi_code: 'PG-K4039', aggregated_value: Math.round(ost * 100) / 100 }
  );
});

data.rows = data.rows.concat(newRows);
fs.writeFileSync(inputPath, JSON.stringify(data, null, 0), 'utf8');
console.log(`Adicionadas ${newRows.length} linhas (EPT, ST, OST) para ${plants.length} plantas. Total de rows: ${data.rows.length}.`);
