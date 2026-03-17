/**
 * CSO Solar — Green Tariff Module Backend
 * Розгорніть цей скрипт як веб-додаток (Web App) з доступом "Anyone"
 */

const CONFIG = {
  SPREADSHEET_ID: '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g', // Перевірте ID вашої таблиці
  SHEET_NAME: 'Зелений тариф',
  PARENT_FOLDER_ID: 'ВСТАВТЕ_ID_ПАПКИ_ТУТ' // ID папки на Google Drive, де будуть папки проектів
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'getProjects') {
      return jsonResponse({ success: true, projects: getProjectsList() });
    }
    
    if (action === 'saveProject') {
      return jsonResponse(saveProjectWithFiles(data));
    }
    
    return jsonResponse({ success: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function getProjectsList() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    const headers = [];
    for(let i=1; i<=37; i++) headers.push("Field " + i);
    headers.push("ID", "Folder URL", "Created At");
    sheet.appendRow(headers);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const projects = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const project = {};
    headers.forEach((h, idx) => {
      // Map Field X to fieldX
      const key = h.toLowerCase().replace(" ", "");
      project[key] = row[idx];
    });
    // For easier access in JS
    project.id = row[headers.indexOf("ID")];
    project.number = row[headers.indexOf("Field 3")]; // № проекту
    project.pib = row[headers.indexOf("Field 4")];    // ПІБ
    project.status = row[headers.indexOf("Field 1")]; // Стан
    projects.push(project);
  }
  return projects;
}

function saveProjectWithFiles(data) {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  const projectData = data.project;
  const files = data.files || [];
  const id = data.id || Utilities.getUuid();
  
  // 1. Створення папки на Google Drive (якщо нова)
  let folderUrl = "";
  if (CONFIG.PARENT_FOLDER_ID && CONFIG.PARENT_FOLDER_ID !== 'ВСТАВТЕ_ID_ПАПКИ_ТУТ') {
    // Назва: ПІБ + Місце (Field 4 + Field 21)
    const folderName = `${projectData.field4} - ${projectData.field21 || ""}`.trim();
    const parentFolder = DriveApp.getFolderById(CONFIG.PARENT_FOLDER_ID);
    
    // Пошук існуючої папки за назвою або створення нової
    const folders = parentFolder.getFoldersByName(folderName);
    let folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = parentFolder.createFolder(folderName);
    }
    folderUrl = folder.getUrl();
    
    // 2. Збереження файлів
    files.forEach(f => {
      const blob = Utilities.newBlob(Utilities.base64Decode(f.base64), f.type, f.name);
      folder.createFile(blob);
    });
  }
  
  // 3. Запис у таблицю
  const rowData = [];
  for(let i=1; i<=37; i++) rowData.push(projectData[`field${i}`] || "");
  rowData.push(id, folderUrl, new Date());
  
  const allData = sheet.getDataRange().getValues();
  let foundRow = -1;
  const idCol = allData[0].indexOf("ID");
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][idCol] === id) {
      foundRow = i + 1;
      break;
    }
  }
  
  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  
  return { success: true, id: id, folderUrl: folderUrl };
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
