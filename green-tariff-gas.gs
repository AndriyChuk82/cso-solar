const CONFIG = {
  SPREADSHEET_ID: '1FbzOPKEroa6QyghgqMFGJMRCdYx_yS0RDXoHzuI_GmY', 
  SHEET_NAME: 'Зелений тариф',
  PARENT_FOLDER_ID: '1Bhkaot09fCC4rx5udWjHxExqre7LcCrF' 
};

function doPost(e) {
  try {
    const contents = e.postData.contents;
    if (!contents) throw new Error("No data received");
    const data = JSON.parse(contents);
    const action = data.action;
    
    if (action === 'getProjects') {
      return jsonResponse({ success: true, projects: getProjectsList() });
    }
    
    if (action === 'saveProject') {
      return jsonResponse(saveProjectWithFiles(data));
    }

    if (action === 'getEquipment') {
      return jsonResponse({ success: true, equipment: getEquipmentFromProjects() });
    }
    
    return jsonResponse({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString(), stack: err.stack, details: "Failed in doPost" });
  }
}

// Повний мапінг (синхронізовано з green-tariff.js) — ТУТ МАЮТЬ БУТИ ВСІ ПОЛЯ
const FIELD_MAPPING = {
    'field1': ['Стан проєкту', 'Статус', 'Стан'],
    'field2': ['Розрахунок', 'Оплата'],
    'field3': ['№ проекту', 'Номер'],
    'field4': ['ПІБ фізичної особи', 'ПІБ', 'Прізвище'],
    'field5': ['ІПН', 'ІПН/ЄДРПОУ', 'РНОКПП'],
    'field6': ['реєстраційний номер об’єкта нерухомого майна', 'Реєстраційний номер об’єкта', 'Реєстр. номер'],
    'field7': ['Номер запису про право власності', 'Запис про право власності'],
    'field8': ['Унікальний номер запису в Єдиному державному демографічному реєстрі', 'УНЗР'],
    'field9': ['№ Договору', 'Номер договору'],
    'field10': ['Дата договору'],
    'field11': ['Час тестування'],
    'field12': ['EIC-код точки розподілу', 'EIC-код'],
    'field13': ['Дозволена потужність', 'Дозволена потужність, кВт'],
    'field14': ['Підстанція'],
    'field15': ['Лінія'],
    'field16': ['Опора'],
    'field17': ['Лічильник'],
    'field18': ['Напруга'],
    'field19': ['Вхідний автомат', 'Автомат'],
    'field20': ['Відсікач'],
    'field21': ['Місце розташування генеруючої установки', 'Адреса об\'єкта', 'Місце'],
    'field22': ['Потужність генеруючих установок споживача, кВт', 'Сумарна потужність'],
    'field23': ['К-сть панелей', 'Кількість панелей'],
    'field24': ['Місце встановлення панелей', 'Встановлення панелей'],
    'field25': ['Електронною поштою', 'Email', 'Електронна пошта'],
    'field26': ['Контактний телефон', 'Телефон', 'конт телефон'],
    'field27': ['Інвертор', 'Модель інвертора'],
    'field28': ['Потужність інвертора, кВт', 'Потужність інвертора'],
    'field29': ['Серійний номер інвертора', 'с/н інвертора'],
    'field30': ['Виробник Інвертора'],
    'field31': ['Прошивка інвертора', 'Прошивка'],
    'field32': ['Гарантія на інвертор, р.', 'Гарантія на інвертор'],
    'field33': ['Виробник сонячних панелей'],
    'field34': ['Сонячна панель', 'Модель панелі', 'Панель (Модель)', 'Панель'],
    'field35': ['Гарантія на панелі, років', 'Гарантія на панелі'],
    'field36': ['Акумуляторна батарея', 'Модель АКБ', 'АКБ', 'Батарея'],
    'field37': ['Номінальна потужність, кВт*год', 'Номінальна потужність АКБ', 'Номінальна потужність батарей'],
    'field38': ['Вартість робіт'],
    'field39': ['Сума прописом'],
    'field40': ['Паспортні дані', 'Паспорт'],
    'field41': ['Аванс, USD'],
    'field42': ['Залишок, USD'],
    'stationType': ['Тип станції', 'Модель станції']
};

function normalizeHeader(s) {
  return (s || "").toString().toLowerCase().replace(/[\n\r"]/g, '').replace(/\s+/g, '').trim();
}

// Додає відсутні колонки в кінець таблиці, тільки якщо їх взагалі немає
function syncHeaders(sheet, currentHeaders) {
  const normHeaders = currentHeaders.map(normalizeHeader);
  const toAdd = [];
  
  for (let i = 1; i <= 45; i++) {
    const fId = "field" + i;
    const name = "Field " + i;
    const nName = normalizeHeader(name);
    
    // Перевірка 1: Чи є вже колонка з назвою "Field X"
    let exists = normHeaders.includes(nName);
    
    // Перевірка 2: Якщо "Field X" немає, можливо є колонка-аліас (напр. "ПІБ")
    if (!exists && FIELD_MAPPING[fId]) {
      exists = FIELD_MAPPING[fId].some(alias => normHeaders.includes(normalizeHeader(alias)));
    }
    
    if (!exists) {
      toAdd.push(name);
    }
  }
  
  if (toAdd.length > 0) {
    const maxCols = sheet.getMaxColumns();
    if (maxCols < currentHeaders.length + toAdd.length) {
      sheet.insertColumnsAfter(maxCols, toAdd.length);
    }
    const range = sheet.getRange(1, currentHeaders.length + 1, 1, toAdd.length);
    range.setValues([toAdd]);
    SpreadsheetApp.flush();
    return sheet.getDataRange().getValues()[0];
  }
  return currentHeaders;
}

function getProjectsList() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    const h = [];
    for(let i=1; i<=45; i++) h.push("Field " + i);
    h.push("ID", "Folder URL", "Created At");
    sheet.appendRow(h);
    SpreadsheetApp.flush();
  }
  
  let d = sheet.getDataRange().getValues();
  let headers = d[0];
  headers = syncHeaders(sheet, headers);
  
  d = sheet.getDataRange().getValues();
  const projects = [];
  const normHs = headers.map(normalizeHeader);
  const idIdx = normHs.indexOf("id");

  for (let i = 1; i < d.length; i++) {
    const row = d[i];
    const project = {};
    headers.forEach((h, idx) => {
      const key = normalizeHeader(h);
      project[key] = row[idx];
      if (h.toLowerCase().startsWith("field ")) {
        project[h.toLowerCase().replace(" ", "")] = row[idx];
      }
    });
    project.id = (idIdx !== -1 && row[idIdx]) ? row[idIdx] : "";
    projects.push(project);
  }
  return projects;
}

function saveProjectWithFiles(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  const pData = data.project || {};
  const files = data.files || [];
  const id = data.id || Utilities.getUuid();
  
  let headers = [];
  try {
    headers = sheet.getDataRange().getValues()[0];
    headers = syncHeaders(sheet, headers);
  } catch(e) { throw new Error("Step 0 (Sync Headers) Failed: " + e.toString()); }
  
  const normHeaders = headers.map(normalizeHeader);

  // ГАРАНТІЙНЕ РОЗШИРЕННЯ (щоб точно не було Step 3 Error)
  if (sheet.getMaxColumns() < headers.length) {
    try {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
      SpreadsheetApp.flush();
    } catch(e) { throw new Error("Step 1 (Expand Sheet) Failed: " + e.toString()); }
  }

  // 1. Створення папки
  let folderUrl = "";
  if (CONFIG.PARENT_FOLDER_ID && CONFIG.PARENT_FOLDER_ID !== "ВСТАВТЕ_ID_ПАПКИ_ТУТ") {
    try {
      const pib = pData.field4 || "Без імені";
      const place = pData.field21 || "";
      const folderName = `${pib} - ${place}`.trim();
      const parentFolder = DriveApp.getFolderById(CONFIG.PARENT_FOLDER_ID);
      const folders = parentFolder.getFoldersByName(folderName);
      let folder = folders.hasNext() ? folders.next() : parentFolder.createFolder(folderName);
      folderUrl = folder.getUrl();
      files.forEach(f => {
        if (f.base64 && f.name) {
          folder.createFile(Utilities.newBlob(Utilities.base64Decode(f.base64), f.type, f.name));
        }
      });
    } catch(e) { console.warn("Step 2 (Drive/Files) Warning: " + e.toString()); }
  }
  
  // 2. Підготовка стрічки (Розумний пошук індексів через FIELD_MAPPING)
  const rowData = new Array(headers.length).fill("");
  for (let i = 1; i <= 45; i++) {
    const fId = "field" + i;
    const val = pData[fId] || "";
    const nName = normalizeHeader("Field " + i);
    
    // Шукаємо індекс за прямим ім'ям (Field X) або за аліасами
    let idx = normHeaders.indexOf(nName);
    if (idx === -1 && FIELD_MAPPING[fId]) { 
        // Якщо прямого Field X немає, шукаємо по черзі кожен аліас
        for (let alias of FIELD_MAPPING[fId]) {
            let aIdx = normHeaders.indexOf(normalizeHeader(alias));
            if (aIdx !== -1) {
                idx = aIdx;
                break;
            }
        }
    }
    
    if (idx !== -1 && idx < rowData.length) rowData[idx] = val;
  }
  
  const idIdx = normHeaders.indexOf("id");
  const urlIdx = normHeaders.indexOf("folderurl");
  const dateIdx = normHeaders.indexOf("createdat");
  if (idIdx !== -1) rowData[idIdx] = id;
  if (urlIdx !== -1) rowData[urlIdx] = folderUrl;
  if (dateIdx !== -1) rowData[dateIdx] = new Date();

  // 3. Запис
  try {
    const dValues = sheet.getDataRange().getValues();
    let fRow = -1;
    if (idIdx !== -1) {
      for (let i = 1; i < dValues.length; i++) {
          if (dValues[i].length > idIdx && dValues[i][idIdx] === id) {
              fRow = i + 1;
              break;
          }
      }
    }
    
    // Перевірка що Range в межах MaxColumns (на всяк випадок)
    const range = sheet.getRange(fRow > 0 ? fRow : dValues.length + 1, 1, 1, rowData.length);
    range.setValues([rowData]);
    SpreadsheetApp.flush();
  } catch(e) { throw new Error("Step 3 (Sheet Write) Failed: " + e.toString()); }
  
  return { success: true, id: id, folderUrl: folderUrl };
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Normalizes a header string for case-insensitive comparison.
 * Removes extra spaces, quotes, newlines and lowercases.
 */
function normalizeHeader(s) {
  return String(s || '').toLowerCase().replace(/[\s\n\r"']+/g, ' ').trim();
}

/**
 * Extracts unique equipment (inverters, panels, batteries) from existing projects.
 * This avoids the need for a separate equipment catalog sheet.
 */
function getEquipmentFromProjects() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return { inverters: [], panels: [], batteries: [] };

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(normalizeHeader);

  // Column index helpers
  const col = (names) => {
    for (const n of names) {
      const idx = headers.indexOf(normalizeHeader(n));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const iModel    = col(['Інвертор', 'Модель інвертора', 'field27']);
  const iMfr      = col(['Виробник Інвертора', 'field30']);
  const iPwr      = col(['Потужність інвертора, кВт', 'field28']);
  const iWarranty = col(['Гарантія на інвертор, р.', 'field32']);
  const pModel    = col(['Сонячна панель', 'Модель панелі', 'field34']);
  const pMfr      = col(['Виробник сонячних панелей', 'field33']);
  const pWarranty = col(['Гарантія на панелі, років', 'field35']);
  const bModel    = col(['Акумуляторна батарея', 'Модель АКБ', 'field36']);
  const bPwr      = col(['Номінальна потужність батарей', 'Номінальна потужність, кВт*год', 'field37']);

  const invertersMap = {};
  const panelsMap = {};
  const batteriesMap = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const get = (idx) => idx !== -1 ? String(row[idx] || '').trim() : '';
    const cleanMfr = (s) => {
      if (!s) return '';
      let name = String(s).split('\n')[0].split('\r')[0].trim();
      const suffixes = ['Co., Ltd.', 'Ltd.', 'GmbH', 'Inc.', 'Corp.', 'Corporation', 'S.p.A.', 'LLC'];
      for (const f of suffixes) {
        const idx = name.toLowerCase().indexOf(f.toLowerCase());
        if (idx !== -1) return name.substring(0, idx + f.length).trim();
      }
      return name;
    };

    const inv   = get(iModel);
    const iMf   = cleanMfr(get(iMfr));
    const iPw   = get(iPwr);
    const iWar  = get(iWarranty);
    if (inv && !invertersMap[inv]) {
      invertersMap[inv] = { model: inv, manufacturer: iMf, power: iPw, warranty: iWar };
    }

    const pan   = get(pModel);
    const pMf   = cleanMfr(get(pMfr));
    const pWar  = get(pWarranty);
    if (pan && !panelsMap[pan]) {
      panelsMap[pan] = { model: pan, manufacturer: pMf, warranty: pWar };
    }

    const bat   = get(bModel);
    const bPw   = get(bPwr);
    if (bat && !batteriesMap[bat]) {
      batteriesMap[bat] = { model: bat, power: bPw };
    }
  }

  return {
    inverters: Object.values(invertersMap),
    panels: Object.values(panelsMap),
    batteries: Object.values(batteriesMap)
  };
}
