# Діагностика проблеми з Projects

## Можливі причини

1. **Аркуш `projects` не існує в Google Sheets**
2. **Неправильний SPREADSHEET_ID**
3. **Помилка в функції `sheetToObjects`**
4. **Проблема з доступом користувача**

## Кроки для діагностики

### 1. Перевірте Google Sheets

Відкрийте таблицю за ID: `1JzZFwvw6-m5JqP2Nra2azUvoWfuoY6Bsh-3qWtLPZ_k`

Переконайтеся, що існують аркуші:
- ✅ `projects` - з колонками: ID, Назва, Клієнт, Телефон, Адреса, Статус, Примітки, ID КП, Погоджена сума, Номер, Дата закриття, Створено, Оновлено
- ✅ `project_payments` - з колонками: ID, ID Проекту, Дата, Сума, Статус, Примітка, Тип платежу, Автор, Створено
- ✅ `project_items` - з колонками: ID, ID Проекту, Назва, Кількість, Ціна, Сума, Примітка

### 2. Тестовий запит в Google Apps Script

Додайте тестову функцію в Code.gs:

```javascript
function testGetProjects() {
  try {
    const result = handleGetProjects('test@example.com');
    Logger.log('Result: ' + JSON.stringify(result));
    return result;
  } catch (err) {
    Logger.log('Error: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}
```

Запустіть функцію `testGetProjects` в редакторі та перегляньте логи.

### 3. Перевірте консоль браузера

У модулі Projects відкрийте DevTools (F12) та перегляньте:

**Console:**
```
[Projects API] getProjects completed in XXms
```

**Network:**
- Перевірте запит до GAS_URL
- Подивіться на відповідь сервера

### 4. Перевірте GAS_URL

У файлі `projects/src/services/api.js` перевірте:

```javascript
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxqQEMJ4vKBExxmh5-ft-UGVpU9rms4vPd9z0XgZv3b33sJDvXyZoIntOj61TVg9fLK/exec';
```

Цей URL має вказувати на **новий деплой** оновленого скрипту!

## Найімовірніша причина

🔴 **Скрипт не задеплоєно!**

Після об'єднання скриптів потрібно:

1. Відкрити Google Apps Script Editor
2. Замінити код на новий з `proposals/gas/Code.gs`
3. **Зберегти** (Ctrl+S)
4. **Створити новий деплой:**
   - Deploy → New deployment
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
   - Deploy
5. **Скопіювати новий URL** та оновити в `projects/src/services/api.js`

## Швидке рішення

Якщо не хочете створювати новий деплой, можна **оновити існуючий**:

1. Deploy → Manage deployments
2. Знайти активний деплой
3. Натиснути "Edit" (іконка олівця)
4. Version: New version
5. Deploy

URL залишиться той самий, але код оновиться.

## Перевірка після деплою

Відкрийте в браузері:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=ping
```

Має повернути:
```json
{
  "success": true,
  "spreadsheetName": "...",
  "sheets": ["projects", "project_payments", "project_items", ...],
  "version": "1.3"
}
```

Якщо бачите старі дані або помилку - деплой не оновився.
