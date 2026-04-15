/**
 * Конфігурація модуля складського обліку.
 * GAS_URL потрібно замінити після деплою Google Apps Script.
 */
const CONFIG = {
  GAS_URL: import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbxqQEMJ4vKBExxmh5-ft-UGVpU9rms4vPd9z0XgZv3b33sJDvXyZoIntOj61TVg9fLK/exec',
  VERIFY_URL: '/api/verify',
  UNITS: ['шт', 'компл', 'м'],
  OPERATION_TYPES: {
    INCOME: 'income',
    EXPENSE: 'expense',
    TRANSFER: 'transfer',
    BALANCE: 'balance'
  },
  OPERATION_LABELS: {
    income: 'Прихід',
    expense: 'Розхід',
    transfer: 'Переміщення',
    balance: 'Підсумок дня'
  },
  OPERATION_COLORS: {
    income: '#22c55e',
    expense: '#ef4444',
    transfer: '#3b82f6',
    balance: '#eab308'
  },
  // Ролі
  ROLES: {
    ADMIN: 'admin',
    USER: 'user'
  },

  ROLE_LABELS: {
    'admin': 'Адміністратор',
    'user': 'Користувач'
  },

  // Supabase
  SUPABASE_URL: (import.meta.env.VITE_SUPABASE_URL || '').trim(),
  SUPABASE_ANON_KEY: (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim(),
  
  // Доступні модулі
  APP_MODULES: [
    { id: 'warehouse', label: 'Склад' },
    { id: 'gt',        label: 'Зелений тариф' },
    { id: 'projects',  label: 'Проєкти' },
    { id: 'proposals', label: 'Комерційні пропозиції' },
  ],
  // Конфігурація Комерційних пропозицій
  CP_SPREADSHEETS: {
    MAIN: import.meta.env.VITE_CP_SPREADSHEET_MAIN || '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g',
    MATERIALS: import.meta.env.VITE_CP_SPREADSHEET_MATERIALS || '1FeQGoFst-DWfLemnXI_0T5xQzMsYdSMC2Xj9Cjs5C1U'
  },
  CP_SHEETS: [
    { name: 'Сонячні батареї', mainCat: 'Сонячні батареї', gid: 1271219295, sId: 'MAIN' },
    { name: 'Гібридні інвертори', mainCat: 'Інвертори', gid: 2087142679, sId: 'MAIN' },
    { name: 'Мережеві інвертори', mainCat: 'Інвертори', gid: 1047165471, sId: 'MAIN' },
    { name: 'АКБ', mainCat: 'АКБ та BMS', gid: 1248903265, sId: 'MAIN' },
    { name: 'ДОВІДНИК_ТОВАРІВ', mainCat: 'Власний матеріал', gid: 0, sId: 'MATERIALS' }
  ]
};

export default CONFIG;
