/**
 * Google Apps Script для модуля "Зелений тариф" (CSO Solar) — ВЕРСІЯ 2.0 (Виправлено)
 */

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
    if (action === 'saveProject') return ContentService.createTextOutput(JSON.stringify(saveProject(data))).setMimeType(ContentService.MimeType.JSON);
    if (action === 'getProjects') return ContentService.createTextOutput(JSON.stringify(getProjects())).setMimeType(ContentService.MimeType.JSON);
    return ContentService.createTextOutput(JSON.stringify({success: false, error: "Unknown action"})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function saveProject(params) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  var headers = ['ID', 'Дата створення', 'Номер проекту', 'ПІБ', 'Статус', 'Оплата'];
  for (var i = 1; i <= 37; i++) headers.push('field' + i);
  headers.push('Тип станції');
  headers.push('Folder_URL');

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  } else {
    var actualHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (actualHeaders.indexOf('Тип станції') === -1) {
       var urlIdx = actualHeaders.indexOf('Folder_URL');
       if (urlIdx !== -1) { sheet.insertColumnBefore(urlIdx + 1); sheet.getRange(1, urlIdx + 1).setValue('Тип станції').setFontWeight('bold'); }
       else { sheet.getRange(1, sheet.getLastColumn() + 1).setValue('Тип станції').setFontWeight('bold'); }
       actualHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }
    headers = actualHeaders;
  }

  var project = params.project;
  var files = params.files || [];
  var existingId = params.id;
  var now = new Date();
  var id = existingId || Utilities.getUuid();
  
  var folderUrl = "";
  try {
    var folderName = project.field4 + " " + (project.field21 || "");
    var parentFolder = DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
    var targetFolder;
    var folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) targetFolder = folders.next();
    else targetFolder = parentFolder.createFolder(folderName);
    folderUrl = targetFolder.getUrl();
    
    files.forEach(function(f) {
      try {
        var decoded = Utilities.base64Decode(f.base64);
        var blob = Utilities.newBlob(decoded, f.type || "application/octet-stream", f.name);
        targetFolder.createFile(blob);
      } catch (e) {}
    });
  } catch (e) {}

  var rowData = new Array(headers.length).fill("");
  for (var k = 0; k < headers.length; k++) {
    var h = headers[k];
    if (h === 'ID') rowData[k] = id;
    else if (h === 'Дата створення') rowData[k] = now;
    else if (h === 'Номер проекту') rowData[k] = project.field3 || "";
    else if (h === 'ПІБ') rowData[k] = project.field4 || "";
    else if (h === 'Статус') rowData[k] = project.field1 || "";
    else if (h === 'Оплата') rowData[k] = project.field2 || "";
    else if (h === 'Тип станції') rowData[k] = project.stationType || "";
    else if (h === 'Folder_URL') rowData[k] = folderUrl;
    else if (h.startsWith('field')) rowData[k] = project[h] || "";
  }

  var dataRows = sheet.getDataRange().getValues();
  var rowIndex = -1;
  if (existingId) {
    for (var m = 1; m < dataRows.length; m++) {
      if (dataRows[m][0] === existingId) { rowIndex = m + 1; break; }
    }
  }
  if (rowIndex > 0) sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  else sheet.appendRow(rowData);

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
      var key = headers[j];
      p[key] = val;
      if (key === 'ПІБ') p.field4 = val;
      if (key === 'Номер проекту') p.field3 = val;
      if (key === 'Статус') p.field1 = val;
      if (key === 'Тип станції') p.stationType = val;
    }
    projects.push(p);
  }
  return {success: true, projects: projects.reverse()};
}
