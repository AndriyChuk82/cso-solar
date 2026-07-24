// ===== CSO Solar — Green Tariff v2 Field Mapper =====

import type { SemanticProject, RawGASProject } from '../types';

// FIELD MAPPINGS (Identical to what Google Sheet and legacy store uses)
export const FIELD_MAPPING: Record<keyof SemanticProject, string[]> = {
  id: ['id', 'ID'],
  status: ['Стан проєкту', 'Статус', 'Стан', 'field1'],
  paymentStatus: ['Розрахунок', 'Оплата', 'field2'],
  projectNumber: ['№ проекту', 'field3'],
  fullName: ['ПІБ фізичної особи', 'ПІБ', 'Прізвище', 'field4'],
  taxId: ['ІПН', 'ІПН/ЄДРПОУ', 'РНОКПП', 'field5'],
  propertyRegNumber: [
    'реєстраційний номер об’єкта нерухомого майна',
    'Реєстраційний номер об\'єкта',
    'реєстраційний номер об’єкта',
    'реєстраційний номер об\'єкта',
    'Реєстр. номер',
    'Реєстраційний номер об’єкта майна',
    'field6'
  ],
  titleDeedNumber: [
    'Номер запису про право власності',
    'Номер запису на право власності',
    'Запис про право власності',
    'Номер запису про право',
    'field7'
  ],
  unzr: [
    'Унікальний номер запису в Єдиному державному демографічному реєстрі (за наявності)', 
    'Унікальний номер запису в Єдиному державному демографічному реєстрі',
    'Унікальний номер', 
    'УНЗР',
    'field8'
  ],
  contractNumber: ['№ Договору', 'Номер договору', '№ договору', 'Договір №', 'field9'],
  contractDate: ['Дата договору', 'field10'],
  testingTime: ['Час тестування', 'field11'],
  eicCode: ['EIC-код точки розподілу', 'EIC-код', 'field12'],
  permittedPower: ['Дозволена потужність', 'Дозволена потужність, кВт', 'field13'],
  substation: ['Підстанція', 'field14'],
  line: ['Лінія', 'field15'],
  utilityPole: ['Опора', 'field16'],
  meterModel: ['Лічильник', 'field17'],
  voltage: ['Напруга', 'field18'],
  inputBreaker: ['Вхідний автомат', 'Автомат', 'field19'],
  voltageProtector: ['Відсікач', 'field20'],
  installationLocation: ['Місце розташування генеруючої установки', 'Адреса об\'єкта', 'Місце', 'field21'],
  totalPanelPower: ['Потужність генеруючих установок споживача, кВт', 'Сумарна потужність, кВт', 'Сумарна потужність', 'field22'],
  panelCount: ['К-сть панелей', 'Кількість панелей', 'field23'],
  panelInstallationLocation: ['Місце встановлення панелей', 'Встановлення панелей', 'field24'],
  email: ['електронною поштою', 'Email', 'Електронна пошта', 'field25'],
  phone: ['конт телефон', 'Телефон', 'Контактний телефон', 'field26'],
  inverterModel: ['Інвертор', 'Модель інвертора', 'field27'],
  inverterPower: ['Потужність інвертора, кВт', 'Потужність інвертора', 'field28'],
  inverterSerialNumber: ['с/н інвертора', 'Серійний номер інвертора', 'field29'],
  inverterManufacturer: ['Виробник Інвертора', 'field30'],
  inverterFirmware: ['Прошивка інвертора', 'Прошивка', 'field31'],
  inverterWarranty: ['Гарантія на інвертор, р.', 'Гарантія на інвертор', 'field32'],
  panelManufacturer: ['Виробник сонячних панелей', 'field33'],
  panelModel: ['Сонячна панель', 'Модель панелі', 'Панель (Модель)', 'Панель', 'field34'],
  panelWarranty: ['Гарантія на панелі, років', 'Гарантія на панелі', 'field35'],
  batteryModel: ['Акумуляторна батарея', 'Модель АКБ', 'АКБ', 'Батарея', 'field36'],
  batteryPower: ['Номінальна потужність, кВт*год', 'Номінальна потужність АКБ', 'Номінальна потужність батарей', 'field37'],
  workCost: ['Вартість робіт', 'field38'],
  workCostInWords: ['Сума прописом', 'field39'],
  passportData: ['Паспортні дані', 'Паспорт', 'field40'],
  advanceUsd: ['Аванс, USD', 'field41'],
  balanceUsd: ['Залишок, USD', 'field42'],
  stationType: ['Тип станції', 'Модель станції', 'field43'],
  internalComment: ['Коментар', 'Внутрішній коментар', 'Нотатки', 'Field 44', 'field44'],
  reserve: ['Резерв', 'Field 45', 'field45'],
  serviceContractDate: ['Дата договору підряду', 'field45'],
  colorTag: ['Кольорова мітка', 'colorTag', 'colortag'],
  folderUrl: ['folderurl', 'Folder URL'],
  createdAt: ['createdat', 'Created At'],
};

// Generic property getter with search fallbacks
export function getProp(obj: Record<string, any>, keys: string[]): string {
  if (!obj) return '';

  const normalize = (s: string) =>
    (s || '')
      .toString()
      .toLowerCase()
      .replace(/[\n\r"]/g, '')
      .replace(/[’'‘`]/g, "'") // Unify all apostrophe variants
      .replace(/\s+/g, '')
      .trim();

  const objKeys = Object.keys(obj);

  // 1. Direct match or normalized exact match
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== '') return String(obj[k]);
    const normalizedK = normalize(k);
    const exactKey = objKeys.find((ak) => normalize(ak) === normalizedK);
    if (exactKey && obj[exactKey] !== undefined && obj[exactKey] !== '') return String(obj[exactKey]);
  }

  // 2. Soft matching (substring checks) for long headers
  for (const k of keys) {
    const normalizedK = normalize(k);
    if (normalizedK.length < 8) continue; // Skip short keys to prevent false positives

    const foundKey = objKeys.find((ak) => {
      if (!ak) return false;
      const normActual = normalize(ak);
      return normActual.includes(normalizedK);
    });
    if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== '') return String(obj[foundKey]);
  }

  return '';
}

// Convert from Raw GAS Sheet row to Clean Semantic Project
export function toSemanticProject(raw: Record<string, any>): SemanticProject {
  const project: SemanticProject = {
    status: 'В процесі',
    paymentStatus: '',
    projectNumber: '',
    fullName: '',
    taxId: '',
    propertyRegNumber: '',
    titleDeedNumber: '',
    unzr: '',
    contractNumber: '',
    contractDate: '',
    testingTime: '',
    eicCode: '',
    permittedPower: '',
    substation: '',
    line: '',
    utilityPole: '',
    meterModel: '',
    voltage: '',
    inputBreaker: '',
    voltageProtector: '',
    installationLocation: '',
    totalPanelPower: '',
    panelCount: '',
    panelInstallationLocation: '',
    email: '',
    phone: '',
    inverterModel: '',
    inverterPower: '',
    inverterSerialNumber: '',
    inverterManufacturer: '',
    inverterFirmware: '',
    inverterWarranty: '',
    panelManufacturer: '',
    panelModel: '',
    panelWarranty: '',
    batteryModel: '',
    batteryPower: '',
    workCost: '',
    workCostInWords: '',
    passportData: '',
    advanceUsd: '',
    balanceUsd: '',
    stationType: '',
    internalComment: '',
    reserve: '',
    folderUrl: '',
    createdAt: '',
  };

  // Populate using our FIELD_MAPPING aliases
  for (const key in FIELD_MAPPING) {
    const sKey = key as keyof SemanticProject;
    let val = raw[sKey]; // Try matching exact key first (like if it's already semantic)
    
    if (val === undefined || val === '') {
      // Try lowercase matching (Postgres/Supabase style)
      val = raw[sKey.toLowerCase()];
    }
    
    if (val === undefined || val === '') {
      // Direct field fallback (like raw['field1'])
      const fieldIndex = getFieldIndexFromSemanticName(sKey);
      if (fieldIndex > 0) {
        val = raw[`field${fieldIndex}`];
      }
    }
    
    if (val === undefined || val === '') {
      // Alias search
      val = getProp(raw, FIELD_MAPPING[sKey]);
    }

    // Date formatting (convert DD.MM.YYYY to YYYY-MM-DD for standard date input controls)
    if (val && (sKey === 'contractDate' || sKey === 'testingTime')) {
      const valStr = String(val);
      const dmyMatch = valStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      if (dmyMatch) {
        val = `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
      } else if (valStr.includes('T')) {
        val = valStr.split('T')[0];
      }
    }

    // Number formatting (standardize separators)
    if (val && ['permittedPower', 'totalPanelPower', 'panelCount', 'inverterPower', 'inverterWarranty', 'panelWarranty', 'batteryPower', 'workCost', 'advanceUsd', 'balanceUsd'].includes(sKey)) {
      val = String(val).replace(',', '.').replace(/[^\d.]/g, '');
    }

    project[sKey] = String(val || '');
  }

  // Parse colorTag embedded in internalComment if colorTag wasn't found directly
  if (!project.colorTag || project.colorTag === 'none' || project.colorTag === '') {
    const comment = project.internalComment || '';
    const tagMatch = comment.match(/^\[tag:([a-z]+)\]\s*/i);
    if (tagMatch) {
      project.colorTag = tagMatch[1];
      project.internalComment = comment.replace(/^\[tag:[a-z]+\]\s*/i, '');
    } else {
      project.colorTag = 'none';
    }
  }

  // Map serviceContractDate fallback to reserve / field45 if empty
  if (!project.serviceContractDate) {
    project.serviceContractDate = project.reserve || '';
  }

  // Ensure ID is set
  project.id = raw.id || getProp(raw, ['id', 'ID']);

  return project;
}

// Convert Semantic Project to the format expected by the GAS backend save API
export function toRawGASProject(semantic: SemanticProject): RawGASProject {
  let comment = semantic.internalComment || '';
  if (semantic.colorTag && semantic.colorTag !== 'none') {
    if (!comment.match(/^\[tag:[a-z]+\]/i)) {
      comment = `[tag:${semantic.colorTag}] ${comment}`.trim();
    }
  }

  const raw: RawGASProject = {
    field1: semantic.status || 'В процесі',
    field2: semantic.paymentStatus || '',
    field3: semantic.projectNumber || '',
    field4: semantic.fullName || '',
    field5: semantic.taxId || '',
    field6: semantic.propertyRegNumber || '',
    field7: semantic.titleDeedNumber || '',
    field8: semantic.unzr || '',
    field9: semantic.contractNumber || '',
    field10: semantic.contractDate || '',
    field11: semantic.testingTime || '',
    field12: semantic.eicCode || '',
    field13: semantic.permittedPower || '',
    field14: semantic.substation || '',
    field15: semantic.line || '',
    field16: semantic.utilityPole || '',
    field17: semantic.meterModel || '',
    field18: semantic.voltage || '',
    field19: semantic.inputBreaker || '',
    field20: semantic.voltageProtector || '',
    field21: semantic.installationLocation || '',
    field22: semantic.totalPanelPower || '',
    field23: semantic.panelCount || '',
    field24: semantic.panelInstallationLocation || '',
    field25: semantic.email || '',
    field26: semantic.phone || '',
    field27: semantic.inverterModel || '',
    field28: semantic.inverterPower || '',
    field29: semantic.inverterSerialNumber || '',
    field30: semantic.inverterManufacturer || '',
    field31: semantic.inverterFirmware || '',
    field32: semantic.inverterWarranty || '',
    field33: semantic.panelManufacturer || '',
    field34: semantic.panelModel || '',
    field35: semantic.panelWarranty || '',
    field36: semantic.batteryModel || '',
    field37: semantic.batteryPower || '',
    field38: semantic.workCost || '',
    field39: semantic.workCostInWords || '',
    field40: semantic.passportData || '',
    field41: semantic.advanceUsd || '',
    field42: semantic.balanceUsd || '',
    field43: semantic.stationType || '',
    field44: comment,
    field45: semantic.serviceContractDate || semantic.reserve || '',
  };

  if (semantic.id) raw.id = semantic.id;
  if (semantic.folderUrl) raw.folderurl = semantic.folderUrl;
  if (semantic.createdAt) raw.createdat = semantic.createdAt;

  return raw;
}

// Helper to determine field index number from its semantic property name
export function getFieldIndexFromSemanticName(name: keyof SemanticProject): number {
  const mapping: Record<string, number> = {
    status: 1,
    paymentStatus: 2,
    projectNumber: 3,
    fullName: 4,
    taxId: 5,
    propertyRegNumber: 6,
    titleDeedNumber: 7,
    unzr: 8,
    contractNumber: 9,
    contractDate: 10,
    testingTime: 11,
    eicCode: 12,
    permittedPower: 13,
    substation: 14,
    line: 15,
    utilityPole: 16,
    meterModel: 17,
    voltage: 18,
    inputBreaker: 19,
    voltageProtector: 20,
    installationLocation: 21,
    totalPanelPower: 22,
    panelCount: 23,
    panelInstallationLocation: 24,
    email: 25,
    phone: 26,
    inverterModel: 27,
    inverterPower: 28,
    inverterSerialNumber: 29,
    inverterManufacturer: 30,
    inverterFirmware: 31,
    inverterWarranty: 32,
    panelManufacturer: 33,
    panelModel: 34,
    panelWarranty: 35,
    batteryModel: 36,
    batteryPower: 37,
    workCost: 38,
    workCostInWords: 39,
    passportData: 40,
    advanceUsd: 41,
    balanceUsd: 42,
    stationType: 43,
    internalComment: 44,
    reserve: 45,
  };
  return mapping[name] || 0;
}
