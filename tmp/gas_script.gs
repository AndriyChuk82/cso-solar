/**
 * Google Apps Script для модуля "Зелений тариф" (CSO Solar)
 * 
 * ФУНКЦІЇ:
 * 1. Збереження даних проекту у Google Таблицю.
 * 2. Отримання списку проектів.
 * 3. Створення папок на Google Диску (Прізвище І.М. Місто).
 * 4. Завантаження файлів у папку проекту.
 */

// КОНФІГУРАЦІЯ (заповнюється автоматично з налаштувань користувача)
var CONFIG = {
  SPREADSHEET_ID: '1FbzOPKEroa6QyghgqMFGJMRCdYx_yS0RDXoHzuI_GmY',
  SHEET_NAME: 'Зелений тариф',
  ROOT_FOLDER_ID: '1Bhkaot09fCC4rx5udWjHxExqre7LcCrF'
};

function doGet(e) {
  return ContentService.createTextOutput("CSO Solar Green Tariff Service is running! Please use POST requests for data sync.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: "Invalid JSON"})).setMimeType(ContentService.MimeType.JSON);
  }

  var action = data.action;

  try {
    if (action === 'saveProject') {
      return ContentService.createTextOutput(JSON.stringify(saveProject(data))).setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'getProjects') {
      return ContentService.createTextOutput(JSON.stringify(getProjects())).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({success: false, error: "Unknown action: " + action})).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function saveProject(params) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    // Створюємо заголовки
    var headers = ['ID', 'Дата створення', 'Номер проекту', 'ПІБ', 'Статус', 'Оплата'];
    for (var i = 1; i <= 37; i++) headers.push('field' + i);
    headers.push('Folder_URL');
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  }

  var project = params.project;
  var files = params.files || [];
  var existingId = params.id;
  
  var now = new Date();
  var id = existingId || Utilities.getUuid();
  
  // 1. Створюємо папку на Диску, якщо її немає
  var folderUrl = "";
  try {
    var folderName = project.field4 + " " + (project.field21 || ""); // ПІБ + Адреса
    var parentFolder = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
    var targetFolder;
    
    // Шукаємо існуючу папку (якщо редагуємо) або створюємо нову
    var folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
      targetFolder = folders.next();
    } else {
      targetFolder = parentFolder.createFolder(folderName);
    }
    folderUrl = targetFolder.getUrl();
    
    // 2. Зберігаємо файли
    files.forEach(function(f) {
      try {
        var contentType = f.type || "application/octet-stream";
        var decoded = Utilities.base64Decode(f.base64);
        var blob = Utilities.newBlob(decoded, contentType, f.name);
        targetFolder.createFile(blob);
      } catch (e) {
        console.error("File upload error: " + e.message);
      }
    });
  } catch (e) {
    console.error("Folder/File error: " + e.message);
  }

  // 3. Збираємо рядок даних
  var rowData = [
    id,
    now,
    project.field3, // Номер
    project.field4, // ПІБ
    project.field1, // Статус
    project.field2  // Оплата
  ];
  for (var j = 1; j <= 37; j++) {
    rowData.push(project['field' + j] || "");
  }
  rowData.push(folderUrl);

  // 4. Записуємо в таблицю
  var dataRows = sheet.getDataRange().getValues();
  var rowIndex = -1;
  
  if (existingId) {
    for (var k = 1; k < dataRows.length; k++) {
      if (dataRows[k][0] === existingId) {
        rowIndex = k + 1;
        break;
      }
    }
  }

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return {success: true, id: id, folderUrl: folderUrl};
}

function getProjects() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) return {success: true, projects: []};
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return {success: true, projects: []};
  
  var headers = data[0];
  var projects = [];
  
  for (var i = 1; i < data.length; i++) {
    var p = {};
    for (var j = 0; j < headers.length; j++) {
      var val = data[i][j];
      if (val instanceof Date) val = Utilities.formatDate(val, "GMT+2", "dd.MM.yyyy HH:mm");
      p[headers[j]] = val;
    }
    projects.push(p);
  }
  
  return {success: true, projects: projects.reverse()}; // Свіжі зверху
}
