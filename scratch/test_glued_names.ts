import * as fs from 'fs';
import * as path from 'path';
import { extractModelCode, cleanAndFormatProductName } from '../proposals-v2/src/services/api';

const CONFIG = {
  BIZ_SOLAR_SPREADSHEET_ID: '1Xajw9ZJj-fCdlxbbsj1OqZPvFeyolMKD',
  BIZ_SOLAR_GID: 461092007,
  HELIUS_SPREADSHEET_ID: '1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy',
  HELIUS_GID: 314286327
};

function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(cell);
        cell = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') {
          i++;
        }
        row.push(cell);
        lines.push(row);
        row = [];
        cell = '';
      } else {
        cell += c;
      }
    }
  }
  if (row.length > 0 || cell) {
    row.push(cell);
    lines.push(row);
  }
  return lines;
}

async function fetchBizSolarProducts() {
  const url = `https://docs.google.com/spreadsheets/d/${CONFIG.BIZ_SOLAR_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${CONFIG.BIZ_SOLAR_GID}`;
  const response = await fetch(url);
  const text = await response.text();
  const rows = parseCSV(text);
  const products: any[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 18) continue;
    const name = (row[2] || '').trim();
    if (!name || name.length < 5) continue;
    products.push({ name, supplier: 'БІЗ Солар' });
  }
  return products;
}

async function fetchHeliusProducts() {
  const url = `https://docs.google.com/spreadsheets/d/${CONFIG.HELIUS_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&gid=${CONFIG.HELIUS_GID}`;
  const response = await fetch(url);
  const text = await response.text();
  const rows = parseCSV(text);
  const products: any[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 5) continue;
    const colA = (row[0] || '').trim();
    if (!colA || colA.length < 5 || colA === 'Модель') continue;
    products.push({ name: colA, supplier: 'Хеліус' });
  }
  return products;
}

async function main() {
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec';
  const [res, biz, helius] = await Promise.all([
    fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'getAllData' })
    }).then(r => r.json()),
    fetchBizSolarProducts(),
    fetchHeliusProducts()
  ]);

  const peProducts = ((res as any).products || []).map((p: any) => {
    const nameStr = typeof p.name === 'object' && p.name ? (p.name.formattedValue || p.name.stringValue || '') : String(p.name || '');
    return { name: nameStr, supplier: 'Правильне електроживлення' };
  });

  const allProducts = [...peProducts, ...biz, ...helius];
  
  console.log('--- ANALYSIS OF GLUED PRODUCTS ---');
  
  const results: any[] = [];
  for (const p of allProducts) {
    const model = extractModelCode(p.name);
    const formatted = cleanAndFormatProductName(p.name);
    
    const lowercaseThenUppercase = /[a-z][A-Z]/.test(formatted);
    const hasGluedWord = 
      formatted.includes('LIFEPO4') || 
      formatted.includes('BIFICIAL') || 
      formatted.includes('BIFACIAL') ||
      formatted.includes('51.2V') ||
      /SE-F\d{2}[A-Z]/.test(formatted) ||
      /LR\d-[A-Z0-9]+[A-Z]/.test(formatted) ||
      /\d+V[A-Z]/.test(formatted) ||
      /\d+Ah[A-Z]/.test(formatted) ||
      lowercaseThenUppercase;

    if (hasGluedWord || p.name.toLowerCase().includes('bms') || p.name.toLowerCase().includes('se-f12')) {
      results.push({
        supplier: p.supplier,
        original: p.name,
        modelCode: model,
        formatted: formatted
      });
    }
  }
  
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
