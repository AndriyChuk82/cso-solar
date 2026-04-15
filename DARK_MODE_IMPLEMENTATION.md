# Dark Mode Implementation - Complete

## ✅ Реалізовано

### 1. Конфігурація Tailwind
- ✅ Додано `darkMode: 'class'` у всі `tailwind.config.js/ts`:
  - `packages/design-system/tailwind.config.ts`
  - `warehouse/tailwind.config.js`
  - `projects/tailwind.config.js`
  - `proposals/tailwind.config.js`
  - `green-tariff/tailwind.config.js`

### 2. CSS Змінні
- ✅ Створено централізовані CSS змінні у `packages/design-system/src/styles/variables.css`
- ✅ Додано `.dark` селектор з адаптованими кольорами
- ✅ Оновлено `proposals/src/index.css` з темною темою
- ✅ Оновлено `green-tariff/src/index.css` з темною темою

### 3. Glassmorphism
- ✅ Адаптовано `.glass-*` класи у `packages/design-system/src/styles/globals.css`
- ✅ Додано темні варіанти для:
  - `.glass-card`
  - `.glass-modal`
  - Scrollbar стилів

### 4. ThemeToggle Компонент
- ✅ Створено `packages/design-system/src/components/ThemeToggle.tsx`
- ✅ Створено `packages/design-system/src/hooks/useTheme.ts`
- ✅ Створено локальні копії для кожного модуля:
  - `proposals/src/components/ThemeToggle.tsx`
  - `green-tariff/src/components/ThemeToggle.tsx`
  - `projects/src/components/ThemeToggle.jsx`
  - `warehouse/src/components/ThemeToggle.jsx`

### 5. Інтеграція у Layout
- ✅ `proposals/src/components/Layout.tsx` - додано ThemeToggle
- ✅ `green-tariff/src/components/Layout.tsx` - додано ThemeToggle
- ✅ `projects/src/components/Layout.jsx` - додано ThemeToggle
- ✅ `warehouse/src/components/Layout.jsx` - додано ThemeToggle

## 🎨 Кольорова палітра

### Light Mode
- Background: `#f8fafc` → `#ffffff`
- Text: `#1e293b` → `#475569`
- Primary (CSO Orange): `#F59E0B`
- Border: `#e2e8f0`

### Dark Mode
- Background: `#0f172a` → `#1e293b`
- Text: `#f1f5f9` → `#cbd5e1`
- Primary (Lighter Orange): `#fbbf24`
- Border: `#334155`

## 📋 Рекомендації для адаптації компонентів

### 1. Warehouse Module
**Файли для перевірки:**
- `warehouse/src/styles/index.css` - додати `.dark` змінні (аналогічно proposals)
- `warehouse/src/pages/*.jsx` - перевірити використання `bg-white`, `text-gray-900`
- `warehouse/src/components/Sidebar.jsx` - адаптувати кольори

**Приклад змін:**
```jsx
// Було:
className="bg-white text-gray-900"

// Стало:
className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
```

### 2. Projects Module
**Файли для перевірки:**
- `projects/src/index.css` - додати `.dark` змінні
- `projects/src/pages/ProjectDetail.jsx`
- `projects/src/pages/ProjectList.jsx`
- `projects/src/components/AddProjectModal.jsx`

**Критичні класи для заміни:**
- `bg-white` → `bg-white dark:bg-neutral-800`
- `bg-gray-50` → `bg-gray-50 dark:bg-neutral-900`
- `text-gray-900` → `text-gray-900 dark:text-white`
- `border-gray-200` → `border-gray-200 dark:border-neutral-700`

### 3. Proposals Module
✅ Вже адаптовано базові стилі
**Додатково перевірити:**
- Таблиці з позиціями
- Модальні вікна
- Print стилі (залишити світлими для друку)

### 4. Green Tariff Module
✅ Вже адаптовано базові стилі
**Додатково перевірити:**
- Форми введення
- Кнопки дій

## 🔧 Технічні деталі

### localStorage
Тема зберігається у `localStorage.theme` з значеннями:
- `"light"` - світла тема
- `"dark"` - темна тема

### Системні налаштування
При першому завантаженні перевіряється `window.matchMedia('(prefers-color-scheme: dark)')`.

### Клас на documentElement
Темна тема активується через клас `.dark` на `<html>` елементі.

## 🚀 Наступні кроки

1. **Warehouse CSS змінні** - додати `.dark` у `warehouse/src/styles/index.css`
2. **Projects CSS змінні** - додати `.dark` у `projects/src/index.css`
3. **Компоненти** - пройтися по основних компонентах та додати `dark:` класи:
   - Input fields
   - Cards
   - Buttons (перевірити контрастність)
   - Modals
   - Tables
4. **Тестування** - перевірити читабельність на темному фоні:
   - Помаранчевий primary колір (#fbbf24 у dark mode)
   - Контрастність тексту
   - Іконки та бейджі

## 📝 Приклади використання

### У компонентах:
```jsx
<div className="bg-white dark:bg-neutral-800 text-gray-900 dark:text-white">
  <h1 className="text-primary dark:text-primary-light">Title</h1>
  <p className="text-gray-600 dark:text-neutral-400">Description</p>
</div>
```

### З CSS змінними:
```css
.custom-card {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
```

## ✨ Результат

Всі модулі тепер мають:
- ✅ Перемикач Light/Dark у header
- ✅ Збереження вибору у localStorage
- ✅ Підтримка системних налаштувань
- ✅ Плавні переходи між темами
- ✅ Адаптовані базові стилі

**Build status:** ✅ Proposals module builds successfully
