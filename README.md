# CSO Solar — Комерційні пропозиції

Внутрішня система формування комерційних пропозицій для CSO Solar.

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
