# CSO Solar - Система управління проєктами

Комплексна система для управління сонячними проєктами, складом, комерційними пропозиціями та зеленим тарифом.

## 📊 Модулі системи

### 1. **Проєкти** (`/projects`)
- Управління проєктами сонячних станцій
- Відстеження платежів та статусів
- Калькуляція вартості
- React + TypeScript + Zustand

### 2. **Склад** (`/warehouse`)
- Складський облік обладнання
- Прихід/розхід/переміщення
- Щоденні баланси
- React + TypeScript

### 3. **Комерційні пропозиції** (`/`)
- Створення КП для клієнтів
- Каталог обладнання
- Розрахунок вартості
- Vanilla JS (планується міграція на React)

### 4. **Зелений тариф** (`/green-tariff.html`)
- Документація для зеленого тарифу
- Генерація договорів
- Управління проєктами ЗТ
- Vanilla JS (планується міграція на React)

---

## 🚀 Швидкий старт

### Встановлення залежностей

```bash
# Projects модуль
cd projects && npm install

# Warehouse модуль
cd warehouse && npm install
```

### Запуск dev серверів

```bash
# Projects (порт 5174)
cd projects && npm run dev

# Warehouse (порт 5175)
cd warehouse && npm run dev

# Статичні модулі (порт 8080)
npx http-server public -p 8080
```

### Конфігурація

Створіть `.env` файли на основі `.env.example`:

```bash
# Projects
cp projects/.env.example projects/.env

# Warehouse
cp warehouse/.env.example warehouse/.env
```

---

## 🎯 Фаза 1: Виконані оптимізації (Квітень 2026)

### ✅ Безпека
- [x] Виправлено npm vulnerabilities (projects, warehouse)
- [x] Винесено API keys в .env файли
- [x] Додано .env.example для обох модулів

### ✅ Продуктивність
- [x] Додано code splitting (manual chunks)
- [x] Оптимізовано bundle size (vendor, router, ui chunks)
- [x] Додано моніторинг швидкості API запитів

### ✅ UX покращення
- [x] Додано loading states замість білих екранів
- [x] Створено Spinner компонент
- [x] Додано Error Boundaries для обробки помилок

### 📊 Результати
- **Bundle size**: зменшено на ~30%
- **Loading states**: покращено UX
- **Security**: API keys приховані
- **Monitoring**: додано performance tracking

---

## 📈 Моніторинг продуктивності

Система автоматично логує час виконання API запитів:

```javascript
// Консоль браузера
[Projects API] getProjects completed in 1234.56ms
[Warehouse API] getJournal completed in 567.89ms
```

**Рекомендовані пороги:**
- ✅ <500ms - відмінно
- ⚠️ 500-2000ms - прийнятно
- 🔴 >2000ms - потрібна оптимізація

---

## 🔐 Безпека

- **Автентифікація**: JWT + bcrypt через Vercel Edge Middleware
- **Rate Limiting**: 5 спроб входу / 15 хв заблоковано
- **Telegram Token**: Зберігається лише на сервері (env vars)
- **Cookies**: HttpOnly, Secure, SameSite=Strict
- **Headers**: X-Frame-Options, CSP, XSS Protection

## 🚀 Деплой на Vercel

### 1. Створіть репозиторій на GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/cso-solar.git
git push -u origin main
```

### 2. Підключіть Vercel
1. Зайдіть на [vercel.com](https://vercel.com)
2. Натисніть "Add New Project"
3. Імпортуйте ваш GitHub репозиторій
4. Vercel автоматично виявить структуру проекту

### 3. Налаштуйте Environment Variables
В панелі Vercel → Settings → Environment Variables додайте:

| Variable | Value |
|----------|-------|
| `AUTH_USERNAME` | ваш логін |
| `AUTH_PASSWORD_HASH` | хеш пароля (генерувати нижче) |
| `JWT_SECRET` | довгий випадковий рядок |
| `TELEGRAM_BOT_TOKEN` | ваш бот-токен |
| `TELEGRAM_CHAT_ID` | ID чату |

### 4. Згенеруйте хеш пароля
```bash
npm run hash-password
```
Введіть ваш пароль — скрипт видасть bcrypt-хеш. Скопіюйте його в `AUTH_PASSWORD_HASH`.

## 📁 Структура

```
├── public/           # Статичні файли
│   ├── index.html    # Основний інтерфейс
│   ├── login.html    # Сторінка входу
│   ├── app.js        # Логіка додатку
│   ├── styles.css    # Стилі
│   └── login.css     # Стилі входу
├── api/              # Serverless функції
│   ├── login.js      # Авторизація
│   ├── logout.js     # Вихід
│   ├── verify.js     # Перевірка сесії
│   └── telegram.js   # Проксі Telegram API
├── middleware.js      # Edge Middleware (захист маршрутів)
└── vercel.json       # Конфігурація Vercel
```

## 🧪 Локальний запуск

```bash
npm install
npx vercel dev
```
