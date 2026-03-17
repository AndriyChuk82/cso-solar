/**
 * Google Apps Script для модуля "Зелений тариф" (CSO Solar) — ВЕРСІЯ 2.3 (Фікс завантаження списку)
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

function doGet(e) {
  return ContentService.createTextOutput("CSO Solar Green Tariff Service v2.3 is running!").setMimeType(ContentService.MimeType.TEXT);
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
  var headers = ['ID', 'Дата створення'];
  Object.values(FIELD_MAP).forEach(function(v) { headers.push(v); });

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  } else {
    var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    headers.forEach(function(h) {
      if (currentHeaders.indexOf(h) === -1) {
        sheet.getRange(1, sheet.getLastColumn() + 1).setValue(h).setFontWeight('bold');
      }
    });
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }

  var project = params.project;
  var files = params.files || [];
  var id = params.id || Utilities.getUuid();
  var now = new Date();
  
  var folderUrl = "";
  try {
    var folderName = (project.field4 || "Unknown") + " " + (project.field21 || "");
    var parentFolder = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
    var targetFolder, folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) targetFolder = folders.next();
    else targetFolder = parentFolder.createFolder(folderName);
    folderUrl = targetFolder.getUrl();
    files.forEach(function(f) {
      var blob = Utilities.newBlob(Utilities.base64Decode(f.base64), f.type || "application/octet-stream", f.name);
      targetFolder.createFile(blob);
    });
  } catch (e) {}

  var rowData = headers.map(function(h) {
    if (h === 'ID') return id;
    if (h === 'Дата створення') return now;
    if (h === 'Folder_URL') return folderUrl;
    for (var key in FIELD_MAP) { if (FIELD_MAP[key] === h) return project[key] || ""; }
    return "";
  });

  var dataRows = sheet.getDataRange().getValues();
  var rowIndex = -1;
  for (var j = 1; j < dataRows.length; j++) { if (dataRows[j][0] === id) { rowIndex = j + 1; break; } }
  if (rowIndex > 0) sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  else sheet.appendRow(rowData);

  return {success: true, id: id, folderUrl: folderUrl};
}

function getProjects() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return {success: true, projects: []};
  var data = sheet.getDataRange().getValues(), headers = data[0], projects = [];
  
  for (var i = 1; i < data.length; i++) {
    var p = {}, hasVal = false;
    for (var j = 0; j < headers.length; j++) {
      var val = data[i][j];
      if (val instanceof Date) val = Utilities.formatDate(val, "GMT+2", "dd.MM.yyyy HH:mm");
      if (val !== "") hasVal = true;
      p[headers[j]] = val;
    }
    // ГЕНЕРУЄМО ID ЯКЩО ЙОГО НЕМАЄ (для існуючих рядків)
    if (hasVal) {
      if (!p['ID'] && !p['id']) p['ID'] = "row-" + (i + 1);
      projects.push(p);
    }
  }
  return {success: true, projects: projects.reverse()};
}
