import type { SheetConfig, SellerInfo, SellerId } from './types';

// ===== CONFIGURATION =====

export const CONFIG = {
  SPREADSHEET_ID: import.meta.env.VITE_SPREADSHEET_ID || '1JzZFwvw6-m5JqP2Nra2azUvoWfuoY6Bsh-3qWtLPZ_k',
  MATERIALS_SPREADSHEET_ID: import.meta.env.VITE_MATERIALS_SPREADSHEET_ID || '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g',
  BIZ_SOLAR_SPREADSHEET_ID: '1Xajw9ZJj-fCdlxbbsj1OqZPvFeyolMKD',
  BIZ_SOLAR_GID: 461092007,
  HELIUS_SPREADSHEET_ID: '1ddbl4d574RN5Q4WDMg4WW13heV_hOyYy',
  HELIUS_GID: 314286327,

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
  DEFAULT_USD_UAH: 45.00,
  DEFAULT_EUR_UAH: 51.50,

  CACHE_VERSION: 'v126',

  GAS_URL: import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec',

  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',

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
    office: 'Україна, 80700, Львівська обл., Золочівський р-н, с. Вороняки, вул. Шкільна, б. 38',
    iban: 'UA183257960000026004500152186',
    bank: 'Філія Львiвське обласне управління АТ "ОЩАДБАНК"',
    mfo: '325796',
    phone: '(067) 374-08-12',
    logo: 'https://i.ibb.co/32JD4dc/logo.png',
    stamp: '/proposals/doc/fop_past.jpg'
  },
  tov_cso: {
    id: 'tov_cso',
    shortName: 'ТОВ "ЦСО"',
    fullName: 'ТОВ «Центр сервісного обслуговування»',
    taxId: '31758743',
    taxIdType: 'ЄДРПОУ',
    address: 'Україна, 80700, Львівська обл., м. Золочів, вул. І. Труша 1Б',
    office: 'Львівська обл., м. Золочів, вул. І. Труша 1Б',
    iban: 'UA333003350000000002600846582',
    bank: 'АТ «РАЙФФАЙЗЕН БАНК»',
    mfo: '300335',
    phone: '067-370-32-36, 073-370-32-36',
    logo: 'https://i.ibb.co/32JD4dc/logo.png',
    stamp: '/proposals/doc/sign_cso.png'
  }
};

// ===== HELPER FUNCTIONS =====

export const IS_DEPLOYED = window.location.protocol === 'https:';

export function getGoogleSheetsUrl(gid: number, spreadsheetId?: string): string {
  const id = spreadsheetId || CONFIG.SPREADSHEET_ID;
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&gid=${gid}`;
}
