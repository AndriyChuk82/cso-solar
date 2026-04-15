# Google Apps Script для Proposals

Цей скрипт потрібно розгорнути в Google Apps Script для обходу CORS обмежень.

## Інструкція з розгортання:

1. Відкрийте https://script.google.com/
2. Створіть новий проєкт "CSO Solar - Proposals API"
3. Скопіюйте вміст файлу `Code.gs` в редактор
4. Натисніть "Deploy" → "New deployment"
5. Виберіть тип: "Web app"
6. Налаштування:
   - Execute as: Me
   - Who has access: Anyone
7. Скопіюйте URL деплою
8. Оновіть `VITE_GAS_URL` в `.env` файлі

## Використання:

Скрипт надає API для:
- `getAllProducts` - завантаження всіх товарів
- `getSheet` - завантаження конкретного аркуша

## Приклад запиту:

```javascript
fetch(GAS_URL, {
  method: 'POST',
  body: JSON.stringify({ action: 'getAllProducts' })
})
```
