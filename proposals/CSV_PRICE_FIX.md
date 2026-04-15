# Виправлення завантаження цін через CSV-експорт

**Дата:** 2026-04-07  
**Проблема:** Ціни для АКБ показували 0 або 100 замість реальних значень (800)  
**Рішення:** Перехід з JSONP API на CSV-експорт через проксі

---

## Корінь проблеми

### Старий метод (JSONP API)
```typescript
// Використовував Google Sheets JSONP API
const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?...`;

// Проблеми:
const getVal = (idx: number) => {
  const cell = row.c[idx];
  return (cell.v || cell.f || '').toString(); // ❌ cell.v часто порожній для формул
};
```

**Чому не працювало:**
- `cell.v` (value) - порожній для комірок з формулами
- `cell.f` (formula) - показує формулу `=IF(...)`, а не результат "800 гот / 960 з ПДВ"
- Google Sheets API не завжди повертає фінальний текст комірки
- Складна структура даних `response.table.rows[i].c[idx]`

### Приклад проблеми
```
Google Sheets комірка B2: "800 гот / 960 з ПДВ" (може бути формулою)
JSONP API повертає:
  cell.v = ""           // ❌ Порожній
  cell.f = "=IF(...)"   // ❌ Формула, не текст
Результат: ціна = 0
```

---

## Нове рішення: CSV-експорт

### 1. Додано CSV Parser (рядки 136-165)
```typescript
function parseCSV(csv: string): string[][] {
  // Правильно обробляє:
  // - Лапки: "текст з "лапками" всередині"
  // - Коми: поле1,поле2,поле3
  // - Переноси: \n, \r\n, \r
  // Повертає масив рядків: [["col0", "col1", "col2", ...], ...]
}
```

### 2. Завантаження через проксі (рядки 172-183)
```typescript
async function fetchSheetProductsViaCSV(sheetConfig: any): Promise<Product[]> {
  const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${sheetConfig.gid}`;
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(exportUrl)}`;
  
  const resp = await fetch(proxyUrl);
  const csv = await resp.text(); // ✅ Отримуємо чистий CSV текст
  
  return parseSheetProductsFromCSV(csv, sheetConfig);
}
```

**Чому через проксі:**
- Google Sheets CSV-експорт має CORS обмеження
- Наш backend `/api/proxy` робить запит від імені сервера
- Браузер отримує CSV без CORS помилок

### 3. Парсинг CSV у продукти (рядки 188-340)
```typescript
function parseSheetProductsFromCSV(csv: string, sheetConfig: any): Product[] {
  const rows = parseCSV(csv); // [["A1", "B1", "C1"], ["A2", "B2", "C2"], ...]
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // ✅ Прямий доступ до колонок як текст
    const col0 = (row[0] || '').trim(); // Колонка A
    const col1 = (row[1] || '').trim(); // Колонка B - ціна для АКБ
    const col2 = (row[2] || '').trim(); // Колонка C
    // ...
    
    if (sheetConfig.name === 'АКБ') {
      model = col0;                    // A: "DEYE BOS-G PRO 100AH"
      priceStr = col1;                 // B: "800 гот / 960 з ПДВ" ✅
      desc = col2 ? `Технологія: ${col2}, ...` : ''; // C: "LiFePO4"
    }
  }
}
```

### 4. parsePrice залишився без змін (рядки 205-222)
```typescript
const parsePrice = (str: string) => {
  // Обробка "800 гот / 960 з ПДВ"
  if (s.toLowerCase().includes('гот') || s.includes('/')) {
    const match = s.match(/[\d\s,.]+/); // Витягує "800"
    if (match) s = match[0];
  }
  // Чистить від символів валюти, пробілів
  // Повертає { value: 800, currency: 'USD' }
};
```

---

## Структура даних

### CSV-експорт (що приходить з Google Sheets)
```csv
Модель,Ціна,Технологія,Ємність,Напруга,...
DEYE BOS-G PRO 100AH,800 гот / 960 з ПДВ,LiFePO4,100,12,...
DEYE SE-G5.1-B,850,LiFePO4,100,51.2,...
```

### Після parseCSV()
```javascript
[
  ["Модель", "Ціна", "Технологія", "Ємність", "Напруга", ...],
  ["DEYE BOS-G PRO 100AH", "800 гот / 960 з ПДВ", "LiFePO4", "100", "12", ...],
  ["DEYE SE-G5.1-B", "850", "LiFePO4", "100", "51.2", ...]
]
```

### Маппінг колонок для АКБ
| CSV колонка | Індекс | Змінна | Приклад | Використання |
|-------------|--------|--------|---------|--------------|
| A | 0 | col0 | "DEYE BOS-G PRO 100AH" | model (назва товару) |
| B | 1 | col1 | "800 гот / 960 з ПДВ" | **priceStr** ✅ |
| C | 2 | col2 | "LiFePO4" | desc (технологія) |
| D | 3 | col3 | "100" | desc (ємність Ah) |
| E | 4 | col4 | "12" | desc (напруга V) |

---

## Переваги CSV-методу

| Аспект | JSONP API | CSV-експорт |
|--------|-----------|-------------|
| **Текст з формул** | ❌ Часто порожній | ✅ Завжди фінальний текст |
| **Формат "800 гот / 960"** | ❌ Втрачається | ✅ Зберігається |
| **CORS** | ✅ Не потрібен проксі | ⚠️ Потрібен проксі |
| **Складність парсингу** | ❌ Складна структура | ✅ Простий масив |
| **Надійність** | ⚠️ Залежить від API | ✅ Стабільний експорт |
| **Швидкість** | ✅ JSONP callback | ⚠️ Fetch через проксі |

---

## Тестування

### Тестові кейси для parsePrice
| Вхід (col1) | Очікується | Результат |
|-------------|------------|-----------|
| "800 гот / 960 з ПДВ" | 800 USD | ✅ 800 USD |
| "850" | 850 USD | ✅ 850 USD |
| "1 200,50 грн" | 1200.50 UAH | ✅ 1200.50 UAH |
| "$120" | 120 USD | ✅ 120 USD |
| "€95" | 95 EUR | ✅ 95 EUR |

### Реальний приклад АКБ
```
Товар: DEYE BOS-G PRO 100AH
CSV рядок: ["DEYE BOS-G PRO 100AH", "800 гот / 960 з ПДВ", "LiFePO4", "100", "12", ...]

Парсинг:
  col0 = "DEYE BOS-G PRO 100AH" → model
  col1 = "800 гот / 960 з ПДВ" → priceStr
  col2 = "LiFePO4" → desc (технологія)
  col3 = "100" → desc (ємність)
  col4 = "12" → desc (напруга)

parsePrice("800 гот / 960 з ПДВ"):
  1. Знаходить "гот" → витягує /[\d\s,.]+/ → "800"
  2. Чистить → "800"
  3. parseFloat("800") → 800
  4. Повертає { value: 800, currency: 'USD' }

Результат: ✅ Ціна = 800 USD
```

---

## Важливі файли

### `/api/proxy.js` (або `/api/proxy.ts`)
```javascript
// Vercel Serverless Function для обходу CORS
export default async function handler(req, res) {
  const { url } = req.query;
  const response = await fetch(url);
  const data = await response.text();
  res.status(200).send(data);
}
```

### `proposals/src/services/api.ts`
- **Рядки 136-165**: `parseCSV()` - парсер CSV
- **Рядки 172-183**: `fetchSheetProductsViaCSV()` - завантаження через проксі
- **Рядки 188-340**: `parseSheetProductsFromCSV()` - парсинг у продукти
- **Рядки 205-222**: `parsePrice()` - витягування ціни з тексту
- **Рядок 265**: `priceStr = col1` - ціна для АКБ з колонки B

### `proposals/src/services/api.ts` - точка входу
```typescript
export async function fetchAllProducts(): Promise<{
  products: Product[];
  categories: Category[];
}> {
  // Завантажує всі листи через CSV
  const promises = CONFIG.SHEETS
    .filter(s => s.name !== 'ДОВІДНИК_ТОВАРІВ')
    .map(sheet => fetchSheetProductsViaCSV(sheet)); // ✅ CSV метод
  
  const results = await Promise.all(promises);
  // ...
}
```

---

## Що було видалено

### Стара функція fetchSheetProducts (JSONP)
```typescript
// ❌ ВИДАЛЕНО - не використовується
async function fetchSheetProducts(sheetConfig: any): Promise<Product[]> {
  return new Promise((resolve) => {
    const callbackName = '_gsheetCb_' + ...;
    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?...`;
    
    (window as any)[callbackName] = function(response: any) {
      const rows = response.table.rows;
      const getVal = (idx: number) => {
        const cell = row.c[idx];
        return (cell.v || cell.f || '').toString(); // ❌ Проблема тут
      };
      // ...
    };
    
    const script = document.createElement('script');
    script.src = url;
    document.head.appendChild(script);
  });
}
```

---

## Команди для білду

```bash
# Білд proposals модуля
cd proposals
npm run build

# Запуск dev сервера
npm run dev

# Білд всього проєкту
cd ..
npm run build
```

---

## Висновок

**CSV-експорт вирішив проблему втрати цін**, бо:
1. ✅ Експортує фінальний текст комірок (не формули)
2. ✅ Зберігає формат "800 гот / 960 з ПДВ" без втрат
3. ✅ Простіший парсинг (масив рядків замість складної структури)
4. ✅ Надійніший (не залежить від особливостей JSONP API)

**Ціни тепер підтягуються правильно для всіх категорій:**
- АКБ: col1 (колонка B) → "800 гот / 960 з ПДВ" → 800 USD
- Сонячні батареї: col6 || col5 || col4 → "120" → 120 USD
- Інвертори: col3 || col4 || col10 → "850" → 850 USD
