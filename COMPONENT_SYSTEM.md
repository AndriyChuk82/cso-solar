# Component System - CSO Solar

## Картки (Cards)

### Базова картка
```jsx
<div className="card">
  <div className="card-header">
    <h3>Заголовок картки</h3>
  </div>
  <div className="card-body">
    <p>Контент картки</p>
  </div>
  <div className="card-footer">
    <button className="btn btn-secondary">Скасувати</button>
    <button className="btn btn-primary">Зберегти</button>
  </div>
</div>
```

### Стилі
- **Shadow**: `0 1px 3px rgba(0, 0, 0, 0.1)` - м'яка тінь без надмірних ефектів
- **Hover**: `0 4px 6px rgba(0, 0, 0, 0.1)` - легке підняття
- **Border radius**: `var(--radius-md)` (10px)
- **Border**: `1px solid var(--border-color)`

---

## Таблиці (Tables)

### Базова таблиця
```jsx
<div className="table-container">
  <table className="table">
    <thead>
      <tr>
        <th>Назва</th>
        <th>Статус</th>
        <th>Дата</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Проєкт 1</td>
        <td>Активний</td>
        <td>11.04.2026</td>
      </tr>
      <tr>
        <td>Проєкт 2</td>
        <td>Завершений</td>
        <td>10.04.2026</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Особливості
- **Zebra striping**: автоматичне чергування кольорів рядків (odd/even)
- **Sticky header**: `position: sticky; top: 0` - фіксований хедер при прокрутці
- **Hover effect**: підсвічування рядка при наведенні
- **Responsive**: горизонтальна прокрутка через `.table-container`

### Стилі
- **Header**: uppercase, 12px, semibold, sticky
- **Rows**: 14px, padding 12px 16px
- **Odd rows**: `var(--bg-main)`
- **Even rows**: `var(--bg-card)`
- **Hover**: `hsl(var(--neutral-100))`

---

## Форми (Forms)

### Правильна структура
```jsx
<div className="form-group">
  <label className="form-label required" htmlFor="name">
    Ім'я клієнта
  </label>
  <input
    id="name"
    type="text"
    className="form-input"
    placeholder="Введіть ім'я"
  />
  <span className="form-hint">
    Повне ім'я або назва компанії
  </span>
</div>
```

### ✅ Правильно
- **Label зверху поля** - завжди видимий
- **Placeholder як підказка** - зникає при введенні
- **Required indicator** - червона зірочка `*`
- **Hint text** - додаткова інформація під полем

### ❌ Неправильно
- Label всередині поля (зникає при введенні)
- Відсутність label (погана accessibility)
- Placeholder замість label

### Стани
```jsx
// Normal
<input className="form-input" />

// Error
<input className="form-input error" />
<span className="form-error">Це поле обов'язкове</span>

// Disabled
<input className="form-input" disabled />
```

### Стилі
- **Padding**: 10px 12px
- **Font size**: 16px (base) - запобігає zoom на iOS
- **Border**: 1.5px solid
- **Focus**: border-color + box-shadow (3px glow)
- **Min height**: 44px (touch-friendly)

---

## Кнопки (Buttons)

### Ієрархія кнопок

#### 1. Primary (Orange) - Основна дія
```jsx
<button className="btn btn-primary">
  Зберегти
</button>
```
- **Колір**: CSO Orange (#F59E0B / #fbbf24 dark)
- **Використання**: головна дія на сторінці (submit, save, create)
- **Правило**: максимум 1 primary кнопка на екрані

#### 2. Secondary (Outline) - Вторинна дія
```jsx
<button className="btn btn-secondary">
  Скасувати
</button>
```
- **Колір**: border + transparent background
- **Використання**: альтернативна дія (cancel, back, close)
- **Hover**: легкий фон

#### 3. Ghost (Text-only) - Третинна дія
```jsx
<button className="btn btn-ghost">
  Детальніше
</button>
```
- **Колір**: text color, без border
- **Використання**: менш важливі дії (view, details, more)
- **Hover**: легкий фон

### Розміри
```jsx
<button className="btn btn-sm">Малий</button>
<button className="btn">Стандарт</button>
<button className="btn btn-lg">Великий</button>
```

### Варіанти
```jsx
<button className="btn btn-success">Підтвердити</button>
<button className="btn btn-danger">Видалити</button>
```

### Icon Button
```jsx
<button className="btn btn-icon btn-ghost">
  <TrashIcon />
</button>
```

### Стани
```jsx
// Disabled
<button className="btn btn-primary" disabled>
  Завантаження...
</button>

// Loading
<button className="btn btn-primary" disabled>
  <Spinner /> Завантаження...
</button>
```

### Стилі
- **Min height**: 44px (touch-friendly)
- **Padding**: 10px 20px
- **Font weight**: 600 (semibold)
- **Border**: 2px solid
- **Transition**: all 200ms
- **Focus**: outline 2px offset

---

## Приклади використання

### Форма з кнопками
```jsx
<form>
  <div className="form-group">
    <label className="form-label required">Email</label>
    <input type="email" className="form-input" placeholder="example@cso.solar" />
  </div>

  <div className="form-group">
    <label className="form-label">Коментар</label>
    <textarea className="form-textarea" rows="4" placeholder="Додаткова інформація"></textarea>
    <span className="form-hint">Необов'язкове поле</span>
  </div>

  <div className="card-footer">
    <button type="button" className="btn btn-secondary">Скасувати</button>
    <button type="submit" className="btn btn-primary">Відправити</button>
  </div>
</form>
```

### Таблиця з діями
```jsx
<div className="card">
  <div className="card-header">
    <h3>Проєкти</h3>
  </div>
  <div className="table-container">
    <table className="table">
      <thead>
        <tr>
          <th>Назва</th>
          <th>Клієнт</th>
          <th>Статус</th>
          <th>Дії</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Проєкт 1</td>
          <td>ТОВ "Сонце"</td>
          <td><span className="badge badge-success">Активний</span></td>
          <td>
            <button className="btn btn-icon btn-ghost btn-sm">
              <EditIcon />
            </button>
            <button className="btn btn-icon btn-ghost btn-sm">
              <TrashIcon />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

---

## Accessibility

### Кнопки
- ✅ Мінімум 44x44px для touch targets
- ✅ Focus visible outline
- ✅ Disabled state з `aria-disabled`
- ✅ Loading state з `aria-busy`

### Форми
- ✅ Label пов'язаний з input через `htmlFor`/`id`
- ✅ Required fields з `required` attribute
- ✅ Error messages з `aria-describedby`
- ✅ Placeholder не замінює label

### Таблиці
- ✅ Semantic HTML (`<table>`, `<thead>`, `<tbody>`)
- ✅ `<th>` для headers
- ✅ `scope` attribute для headers
- ✅ Caption для опису таблиці

---

## Інтеграція

Всі стилі доступні у:
- `packages/design-system/src/styles/components.css`

Імпортуються автоматично через:
- `packages/design-system/src/styles/index.css`
