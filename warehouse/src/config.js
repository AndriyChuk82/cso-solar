/**
 * Конфігурація модуля складського обліку.
 * GAS_URL потрібно замінити після деплою Google Apps Script.
 */
const CONFIG = {
  GAS_URL: import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbyvYNoyGINAtWlbExzONJWoReE8OC3_-FhOase5pHkCZ_PdCLXuMQqXqMYBWLzaNX-s/exec',
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
    USER: 'user',
    INSTALLER: 'installer'
  },

  ROLE_LABELS: {
    'admin': 'Адміністратор',
    'user': 'Користувач',
    'installer': 'Монтажник'
  },

  // Гранулярні дозволи для модуля Склад
  WAREHOUSE_PERMISSIONS: [
    { id: 'objects', label: '🏗️ Об\'єкти будівництва', desc: 'Перегляд та списання матеріалів на об\'єктах' },
    { id: 'price_list', label: '🏷️ Прайс-лист', desc: 'Перегляд прайс-листа товарів та залишків' },
    { id: 'journal', label: '📋 Журнал операцій', desc: 'Історія складських операцій' },
    { id: 'operations', label: '📥/📤 Прихід, Розхід, Переміщення', desc: 'Створення складських документів та підсумок дня' },
    { id: 'buyers', label: '⚖️ Баланси клієнтів', desc: 'Взаєморозрахунки, видача та оплати' },
    { id: 'shipments', label: '🚚 Відправлення', desc: 'Оформлення та трекінг Нової Пошти' },
    { id: 'reports', label: '📈 Звіти та аудит', desc: 'Звіти по залишках, клієнтах та журнал дій' },
    { id: 'hide_finances', label: '🔒 Приховати фінанси в об\'єктах', desc: 'Приховати суми по КП, аванси та заборгованість', isNegative: true }
  ],

  // Готові шаблони прав для швидкого вибору
  PERMISSION_PRESETS: {
    installer: {
      label: '👷 Монтажник',
      role: 'installer',
      permissions: ['objects', 'price_list', 'hide_finances']
    },
    storekeeper: {
      label: '📦 Комірник',
      role: 'user',
      permissions: ['journal', 'operations', 'price_list', 'shipments', 'reports', 'objects', 'buyers']
    },
    full: {
      label: '👑 Повний доступ до складу',
      role: 'user',
      permissions: ['objects', 'price_list', 'journal', 'operations', 'buyers', 'shipments', 'reports']
    }
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
    { id: 'land-lease', label: 'Оренда землі' },
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
  ],
  // Прайс-лист
  PRICE_LIST_SPREADSHEET: import.meta.env.VITE_PRICE_LIST_SPREADSHEET || '1Zt2uqioUsdvh55NV6gvobDzOSWMqJpCr35h0LaQwzlY'
};

export default CONFIG;
