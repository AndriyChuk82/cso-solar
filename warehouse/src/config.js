/**
 * Конфігурація модуля складського обліку.
 * GAS_URL потрібно замінити після деплою Google Apps Script.
 */
const CONFIG = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycby89SJv13F71IQgR1QaGWiinozpgjNTCmEk0SlN6aakL4T1ha_OXbZ3Zm8qK2-SU0KaUw/exec',
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
  ROLES: {
    ADMIN: 'admin',
    STOREKEEPER: 'storekeeper',
    MANAGER: 'manager'
  },
  ROLE_LABELS: {
    admin: 'Адміністратор',
    storekeeper: 'Комірник',
    manager: 'Менеджер'
  }
};

export default CONFIG;
