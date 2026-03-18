/**
 * Google Apps Script для модуля "Зелений тариф" (CSO Solar) — ВЕРСІЯ 3.0 (Фікс оновлення існуючих рядків)
 */

var CONFIG = {
  SPREADSHEET_ID: '1FbzOPKEroa6QyghgqMFGJMRCdYx_yS0RDXoHzuI_GmY',
  SHEET_NAME: 'Зелений тариф',
  ROOT_FOLDER_ID: '1Bhkaot09fCC4rx5udWjHxExqre7LcCrF'
};

var FIELD_MAP = {
  'field1': 'Стан проєкту', 'field2': 'Розрахунок', 'field3': '№ проекту', 'field4': 'ПІБ фізичної особи',
  'field5': 'ІПН', 'field6': 'реєстраційний номер об’єкта нерухомого майна', 'field7': 'Номер запису про право власності',
  'field8': 'Унікальний номер запису в Єдиному державному демографічному реєстрі (за наявності)',
  'field9': '№ Договору', 'field10': 'Дата договору', 'field11': 'Час тестування', 'field12': 'EIC-код точки розподілу',
  'field13': 'Дозволена потужність', 'field14': 'Підстанція', 'field15': 'Лінія', 'field16': 'Опора',
  'field17': 'Лічильник', 'field18': 'Напруга', 'field19': 'Вхідний автомат', 'field20': 'Відсікач',
  'field21': 'Місце розташування генеруючої установки', 'field22': 'Потужність генеруючих установок споживача, кВт',
  'field23': 'К-сть панелей', 'field24': 'Місце встановлення панелей', 'field25': 'електронною поштою',
  'field26': 'конт телефон', 'field27': 'Інвертор', 'field28': 'Потужність інвертора, кВт',
  'field29': 'с/н інвертора', 'field30': 'Виробник Інвертора', 'field31': 'Прошивка інвертора',
  'field32': 'Гарантія на інвертор, р.', 'field33': 'Виробник сонячних панелей', 'field34': 'Сонячна панель',
  'field35': 'Гарантія на панелі, років', 'field36': 'Акумуляторна батарея', 'field37': 'Номінальна потужність батарей',
  'stationType': 'Тип станції', 'Folder_URL': 'Folder_URL'
};

function normalizeHeader(s) {
  return (s || "").toString().toLowerCase().replace(/[\n\r"]/g, ' ').replace(/\s+/g, ' ').trim();
}

function doGet(e) {
  return ContentService.createTextOutput("CSO Solar Green Tariff Service v3.0 is running!").setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === 'saveProject') return sendJson(saveProject(data));
    if (data.action === 'getProjects') return sendJson(getProjects());
    return sendJson({success: false, error: "Unknown action"});
  } catch (err) {
    return sendJson({success: false, error: err.toString()});
  }
}

function sendJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function saveProject(params) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    var initHeaders = ['ID', 'Дата створення'];
    Object.values(FIELD_MAP).forEach(function(v) { initHeaders.push(v); });
    sheet.getRange(1, 1, 1, initHeaders.length).setValues([initHeaders]).setFontWeight('bold');
  }

  var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var normalizedSheetHeaders = currentHeaders.map(normalizeHeader);

  // Переконуємось що всі поля з FIELD_MAP є в таблиці
  Object.values(FIELD_MAP).forEach(function(h) {
    var normH = normalizeHeader(h);
    if (normalizedSheetHeaders.indexOf(normH) === -1) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h).setFontWeight('bold');
      normalizedSheetHeaders.push(normH);
      currentHeaders.push(h);
    }
  });

  var project = params.project;
  var files = params.files || [];
  var id = params.id;
  var now = new Date();
  
  // Визначаємо індекс колонки ID
  var idColumnIdx = normalizedSheetHeaders.indexOf('id');
  if (idColumnIdx === -1) idColumnIdx = 0; // По дефолту перша

  var rowIndex = -1;
  var dataRows = sheet.getDataRange().getValues();

  if (id) {
    // 1. Пошук по реальному ID в колонці
    for (var j = 1; j < dataRows.length; j++) { 
      if (dataRows[j][idColumnIdx] && dataRows[j][idColumnIdx].toString().toLowerCase() === id.toString().toLowerCase()) { 
        rowIndex = j + 1; 
        break; 
      } 
    }
    // 2. Fallback для "row-N" (для існуючих проектів без прописаного ID)
    if (rowIndex === -1 && id.toString().indexOf('row-') === 0) {
      var potentialIdx = parseInt(id.toString().split('-')[1]);
      if (!isNaN(potentialIdx) && potentialIdx <= dataRows.length) {
        rowIndex = potentialIdx;
      }
    }
  }

  // Якщо це новий проект або ID не знайдено - генеруємо новий ID
  if (rowIndex === -1) id = Utilities.getUuid();

  var folderUrl = "";
  var filesUploaded = 0;
  var errors = [];
  try {
    var clientName = project.field4 || "Unknown_Client";
    var address = project.field21 || "";
    var folderName = clientName + (address ? " - " + address : "");
    var parentFolder = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
    var targetFolder, folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) targetFolder = folders.next();
    else targetFolder = parentFolder.createFolder(folderName);
    folderUrl = targetFolder.getUrl();
    files.forEach(function(f) {
      try {
        if (!f.base64) return;
        var bytes = Utilities.base64Decode(f.base64);
        var blob = Utilities.newBlob(bytes, f.type || "application/octet-stream", f.name);
        targetFolder.createFile(blob);
        filesUploaded++;
      } catch (fileErr) { errors.push("Файл " + f.name + ": " + fileErr.toString()); }
    });
  } catch (err) { errors.push("Помилка Drive: " + err.toString()); }

  var rowData = currentHeaders.map(function(h) {
    var normH = normalizeHeader(h);
    if (normH === 'id') return id;
    if (normH === 'дата створення') {
      // Якщо оновлюємо існуючий рядок - зберігаємо стару дату
      if (rowIndex > 0) {
        var oldDate = dataRows[rowIndex-1][normalizedSheetHeaders.indexOf('дата створення')];
        return oldDate || now;
      }
      return now;
    }
    if (normH === 'folder_url') return folderUrl;
    for (var fieldId in FIELD_MAP) {
      if (normalizeHeader(FIELD_MAP[fieldId]) === normH) return project[fieldId] || "";
    }
    return "";
  });

  if (rowIndex > 0) sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  else sheet.appendRow(rowData);

  return { success: true, id: id, filesUploaded: filesUploaded, errors: errors.length > 0 ? errors : null };
}

function getProjects() {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) return {success: true, projects: []};
    var data = sheet.getDataRange().getValues(), headers = data[0], projects = [];
    var normHeaders = headers.map(normalizeHeader);
    var idIdx = normHeaders.indexOf('id');
    
    for (var i = 1; i < data.length; i++) {
      var p = {}, hasVal = false;
      for (var j = 0; j < headers.length; j++) {
        var val = data[i][j];
        if (val instanceof Date) {
          var h = normHeaders[j];
          if (h === 'дата створення' || h.indexOf('created') !== -1) val = Utilities.formatDate(val, "GMT+2", "dd.MM.yyyy HH:mm");
          else val = Utilities.formatDate(val, "GMT+2", "dd.MM.yyyy");
        }
        if (val !== "") hasVal = true;
        p[headers[j]] = val;
      }
      if (hasVal) {
        // Якщо в колонці ID порожньо - даємо тимчасовий ID за номером рядка
        if (idIdx !== -1 && !data[i][idIdx]) {
          p[headers[idIdx]] = "row-" + (i + 1);
        } else if (idIdx === -1) {
          p['ID'] = "row-" + (i + 1);
        }
        projects.push(p);
      }
    }
    return {success: true, projects: projects.reverse()};
  } catch (err) { return {success: false, error: err.toString()}; }
}
