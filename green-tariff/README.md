# Green Tariff Module — React Migration

Міграція модуля "Зелений тариф" з legacy HTML/JS на React + TypeScript + Zustand.

## ✅ Що зроблено

### 1. Архітектура
- **TypeScript типи** (`src/types/index.ts`) — всі 45 полів проєкту
- **Zustand Store** (`src/store/useGreenTariffStore.ts`) — управління станом
- **API Service** (`src/services/api.ts`) — інтеграція з Google Apps Script

### 2. Компоненти
- **Layout** — header з навігацією та авторизацією
- **ProjectList** — sidebar зі списком проєктів, пошуком та фільтрами
- **ProjectForm** — головна форма з усіма 45 полями
- **FileUpload** — drag-and-drop завантаження файлів

### 3. Функціональність
- ✅ Завантаження проєктів з Google Sheets
- ✅ Збереження проєктів (з файлами)
- ✅ Фільтрація за статусами (В процесі, Готовий, Відкладено)
- ✅ Пошук проєктів
- ✅ Автоматична генерація номера проєкту
- ✅ Автоматичне перетворення суми в слова (field38 → field39)
- ✅ Завантаження обладнання з localStorage (інвертори, панелі, батареї)
- ✅ Drag-and-drop файлів + інтеграція з Google Drive

## 🚧 Що залишилось

### DocumentGenerator компонент
Потрібно реалізувати генерацію документів:
- Вибір типів документів (5 шаблонів)
- Завантаження фото для протоколу (3 фото)
- Інтеграція з `GT_TEMPLATES` (з legacy `green-tariff-templates.js`)
- Стиснення фото перед збереженням у localStorage
- Відкриття print-сторінки з підготовленими даними

## 📦 Команди

```bash
# Development
cd green-tariff
npm run dev          # Запуск на порту 5176

# Production
npm run build        # Білд у ../public/green-tariff/
```

## 🔗 Роутинг

- `/green-tariff/` — React SPA
- Legacy файли залишені для порівняння:
  - `/public/green-tariff.html`
  - `/public/green-tariff.js`

## 🎨 Дизайн-система

Використовує спільну палітру з Projects/Warehouse:
- Primary: `#E8890A` (CSO Solar Orange)
- Accent: `#1a3a6b` (синій)
- Tailwind CSS + CSS Variables

## 🔐 Безпека

- Авторизація через `/api/verify`
- Всі API ключі в `.env`
- GAS_URL захардкоджений (як у legacy)

## 📝 Примітки

- Всі 45 полів збережені
- Mapping для пошуку полів ідентичний legacy
- Логіка `getProp()` перенесена без змін
- Функція `numberToWordsUA()` перенесена повністю

