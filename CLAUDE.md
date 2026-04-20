# CSO Solar - Claude Code Guide

Система управління сонячними проєктами (Monorepo): Warehouse, Projects, Proposals, Green Tariff — всі на React + Vite.

## 📊 Модулі та команди

| Модуль | Шлях | Команда збірки | Команда запуску |
|--------|------|-----------------|-----------------|
| **Warehouse** | `/warehouse` | `npm run build` | `npm run dev` (5175) |
| **Projects** | `/projects` | `npm run build` | `npm run dev` (5174) |
| **Proposals** | `/proposals` | `npm run build` | `npm run dev` (5173) |
| **Green Tariff** | `/green-tariff` | `npm run build` | `npm run dev` (5176) |
| **Backend** | `/api` | - | `npx vercel dev` |
| **Monorepo** | `/` | `npm run build` | - |

## Environment & Commands
- **OS**: Windows (PowerShell/CMD)
- **Terminal Rule**: ALWAYS use `cmd /c` for running commands (e.g., `cmd /c npm run dev`) to ensure proper exit and prevent hanging.
- **Node**: Use `npm` for package management.

## 🛠️ Технології
- **Frontend**: React, TypeScript, Zustand (у `/projects`), Vanilla JS (у `/proposals`), Tailwind CSS
- **Backend**: Vercel Serverless Functions (Node.js) у `/api`, Middleware на Edge
- **Data**: Google Sheets API, Local Proxy (KR)

## 📋 Стандарти кодування
- **Naming**:
  - `PascalCase` для React компонентів, Класів та Моделей.
  - `camelCase` для функцій та змінних.
  - `_camelCase` для приватних полів (якщо використовуються класи).
- **React**:
  - Функціональні компоненти з TypeScript типами.
  - Обов’язкове використання `Error Boundaries` та `Loading States`.
  - Типізація пропсів через інтерфейси `InterfaceProps`.
- **Styling**:
  - Tailwind CSS (фіксовані палітри, без ad-hoc стилів).
  - Гнучкість та преміальний вигляд (glassmorphism, плавність).
- **Structure**:
  - Розділення бізнес-логіки та UI (модульність).
  - Спільні утиліти в проекті зберігати окремо (наприклад, `utils/messaging.ts`).

## 🔐 Безпека та Конфігурація
- **Environment**: Завжди перевіряй наявність `.env` у корені та підпапках.
- **API Keys**: Тільки в `.env`. Ніколи не хардкодь ключі.
- **Scripts**: Користуйся готовими скриптами у `/scripts` (наприклад, `hash-password.js`).

## 🚀 Настанови для Claude Code CLI
- **Завжди** перевіряй працездатність коду після змін через `npm run build` у відповідному модулі.
- При редагуванні UI, використовуй сучасні практики (vibrant colors, smooth transitions).
- Уникай `magic numbers` та `hardcoded strings` — виноси все в конфіг або константи.
- Коментуй код (англійською мовою "Explain Why, not What").
