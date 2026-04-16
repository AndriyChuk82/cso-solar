import type { SheetConfig, SellerInfo, SellerId } from './types';

// ===== CONFIGURATION =====

export const CONFIG = {
  SPREADSHEET_ID: import.meta.env.VITE_SPREADSHEET_ID || '1JzZFwvw6-m5JqP2Nra2azUvoWfuoY6Bsh-3qWtLPZ_k',
  MATERIALS_SPREADSHEET_ID: import.meta.env.VITE_MATERIALS_SPREADSHEET_ID || '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g',

  SHEETS: [
    { name: 'Сонячні батареї', mainCat: 'Сонячні батареї', gid: 1271219295 },
    { name: 'Гібридні інвертори', mainCat: 'Інвертори', gid: 2087142679 },
    { name: 'Мережеві інвертори', mainCat: 'Інвертори', gid: 1047165471 },
    { name: 'АКБ', mainCat: 'АКБ та BMS', gid: 1248903265 }
  ] as SheetConfig[],

  CORS_PROXIES: [
    '/api/proxy?url=',
    '',
    'https://corsproxy.io/?url=',
    'https://api.allorigins.win/raw?url='
  ],

  DEFAULT_MARKUP: 15,
  DEFAULT_USD_UAH: 41.50,
  DEFAULT_EUR_UAH: 51.00,

  CACHE_VERSION: 'v50',

  GAS_URL: import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec',

  UNITS: ['шт', 'компл', 'м', 'кг', 'л'],

  CURRENCIES: ['USD', 'EUR', 'UAH'] as const,
};

// ===== SELLERS =====

export const SELLERS: Record<SellerId, SellerInfo> = {
  fop_pastushok: {
    id: 'fop_pastushok',
    shortName: 'ФОП Пастушок М. В.',
    fullName: 'ФОП Пастушок Марія Володимирівна',
    taxId: '3090406261',
    taxIdType: 'РНОКПП',
    address: 'Україна, 80700, Львівська обл., Золочівський р-н, с. Вороняки, вул. Шкільна, б. 38',
    office: 'Львівська обл., м. Золочів, вул. І. Труша 1Б',
    iban: 'UA563003350000000260092475237',
    bank: 'АТ "РАЙФФАЙЗЕН БАНК"',
    mfo: '300335',
    phone: '(067) 374-08-12',
    logo: 'https://i.ibb.co/32JD4dc/logo.png'
  },
  tov_cso: {
    id: 'tov_cso',
    shortName: 'ТОВ "ЦСО"',
    fullName: 'ТОВ "Центр сервісного обслуговування"',
    taxId: '31758743',
    taxIdType: 'ЄДРПОУ',
    address: 'Україна, 80700, Львівська обл., м. Золочів, вул. І. Труша 1Б',
    office: 'Львівська обл., м. Золочів, вул. І. Труша 1Б',
    iban: 'UA333003350000000002600846582',
    bank: 'АТ «РАЙФФАЙЗЕН БАНК»',
    mfo: '300335',
    phone: '067-370-32-36, 073-370-32-36',
    logo: 'https://i.ibb.co/32JD4dc/logo.png'
  }
};

// ===== HELPER FUNCTIONS =====

export const IS_DEPLOYED = window.location.protocol === 'https:';

export function getGoogleSheetsUrl(gid: number, spreadsheetId?: string): string {
  const id = spreadsheetId || CONFIG.SPREADSHEET_ID;
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&gid=${gid}`;
}
