#!/usr/bin/env node
/**
 * Gera client/public/anaplan-ose-ttp-2025.json para o estudo OSE & TTP por nível tecnológico.
 * Uso: após obter dados do MCP (aggregate_kpis com plant, year, kpi_code, filters year=2025, month=Dec, periodtype=YTD):
 *   1. Salve a resposta de PG-K4038 em scripts/ose-2025.json (objeto com "data": [...])
 *   2. Salve a resposta de PG-K0412 em scripts/ttp-2025.json
 *   3. node scripts/merge_ose_ttp_2025.js
 * Saída: client/public/anaplan-ose-ttp-2025.json com { year: 2025, rows: [...ose, ...ttp] }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const baseDir = path.resolve(__dirname, '..');
const osePath = path.join(baseDir, 'scripts', 'ose-2025.json');
const ttpPath = path.join(baseDir, 'scripts', 'ttp-2025.json');
const outPath = path.join(baseDir, 'client', 'public', 'anaplan-ose-ttp-2025.json');

function load(name, filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`Arquivo não encontrado: ${filePath}`);
    return [];
  }
  try {
    const j = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const rows = j.data || j.rows || [];
    console.log(`${name}: ${rows.length} linhas`);
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    console.warn(`Erro ao ler ${filePath}:`, e.message);
    return [];
  }
}

const oseRows = load('OSE (PG-K4038)', osePath);
const ttpRows = load('TTP (PG-K0412)', ttpPath);
const rows = [...oseRows, ...ttpRows];

if (rows.length === 0) {
  console.warn('Nenhum dado carregado. Crie scripts/ose-2025.json e scripts/ttp-2025.json a partir do MCP aggregate_kpis.');
  process.exit(1);
}

const out = { year: 2025, rows };
fs.writeFileSync(outPath, JSON.stringify(out));
console.log(`Escrito ${outPath} com ${rows.length} linhas.`);
