# Design System Guidelines - CSO Solar

## ✅ Що РОБИТИ

### 1. Solid Backgrounds
- **Cards**: `background: var(--bg-card)` - без прозорості
- **Header/Sidebar**: `backdrop-filter: blur()` - для глибини при прокрутці
- **Чому**: Чіткість та читабельність у робочому інтерфейсі

### 2. Швидкі анімації
- **Hover**: `150ms` (--transition-fast)
- **Dropdown**: `200ms` (--transition-base)
- **Max**: `300ms` (--transition-slow)
- **Чому**: Інтерфейс не повинен змушувати чекати

### 3. Обмежена кольорова палітра кнопок
**Основні (щоденне використання):**
- Primary (Orange) - головна дія
- Secondary (Outline) - альтернативна дія
- Ghost (Text-only) - третинна дія

**Семантичні (критичні дії):**
- Success - Зберегти/Створити
- Danger - Видалити/Відмінити

**Чому**: Зменшує когнітивне навантаження, користувач швидше розуміє ієрархію

### 4. Компактний spacing (8px grid)
```css
--space-xs: 8px;      /* Між елементами в групі */
--space-sm: 12px;     /* Між полями форми */
--space-tight: 12px;  /* Компактний режим */
--space-normal: 16px; /* Стандартний відступ */
--space-md: 24px;     /* Між секціями */
--space-lg: 32px;     /* Між великими блоками */
--space-xl: 40px;     /* Максимальний відступ */
```

**Чому**: Більше інформації на екрані без прокрутки

### 5. Адаптивні розміри кнопок
- **Desktop**: `40px` (оптимально для мишки)
- **Mobile**: `44px` (touch-friendly)
- **Min для Desktop**: `36px` (btn-sm, btn-ghost)

**Чому**: Баланс між компактністю та зручністю

---

## ❌ Що НЕ робити

### 1. Glassmorphism на картках
```css
/* ❌ НЕ робити */
.card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}

/* ✅ Робити */
.card {
  background: var(--bg-card);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

**Чому**: Напівпрозорість створює "брудний" ефект у темній темі, погіршує читабельність

### 2. Повільні анімації
```css
/* ❌ НЕ робити */
transition: all 400ms ease;

/* ✅ Робити */
transition: all 200ms ease;
```

**Чому**: Анімації довше 300ms сповільнюють роботу, створюють відчуття "киселю"

### 3. Багато кольорів кнопок
```jsx
/* ❌ НЕ робити */
<button className="btn btn-info">Інфо</button>
<button className="btn btn-warning">Попередження</button>
<button className="btn btn-purple">Спеціальна</button>

/* ✅ Робити */
<button className="btn btn-primary">Головна дія</button>
<button className="btn btn-secondary">Альтернатива</button>
<button className="btn btn-ghost">Деталі</button>
```

**Чому**: Більше 3 різних кольорів створює хаос, користувач не розуміє ієрархію

### 4. Великі порожні простори
```css
/* ❌ НЕ робити */
.form-group {
  margin-bottom: 32px; /* Занадто багато */
}

.card-body {
  padding: 40px; /* Втрата щільності */
}

/* ✅ Робити */
.form-group {
  margin-bottom: 16px; /* Компактно */
}

.card-body {
  padding: 24px; /* Оптимально */
}
```

**Чому**: Втрата інформаційної щільності, зайва прокрутка

### 5. Маленькі таргети кнопок
```css
/* ❌ НЕ робити */
.btn {
  min-height: 32px; /* Занадто мало */
  padding: 4px 8px;
}

/* ✅ Робити */
.btn {
  min-height: 40px; /* Desktop */
  padding: 10px 20px;
}

@media (max-width: 768px) {
  .btn {
    min-height: 44px; /* Mobile */
  }
}
```

**Чому**: Мінімум 36px для Desktop, 44px для Mobile - інакше важко натиснути

---

## Практичні приклади

### Компактна форма
```jsx
<div className="card">
  <div className="card-header">
    <h3>Новий проєкт</h3>
  </div>
  <div className="card-body">
    <div className="form-group">
      <label className="form-label required">Назва</label>
      <input className="form-input" placeholder="Введіть назву" />
    </div>
    
    <div className="form-group">
      <label className="form-label">Клієнт</label>
      <input className="form-input" placeholder="Оберіть клієнта" />
    </div>
  </div>
  <div className="card-footer">
    <button className="btn btn-secondary">Скасувати</button>
    <button className="btn btn-primary">Створити</button>
  </div>
</div>
```

### Таблиця з діями
```jsx
<div className="card">
  <div className="table-container">
    <table className="table">
      <thead>
        <tr>
          <th>Проєкт</th>
          <th>Статус</th>
          <th>Дії</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Проєкт 1</td>
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

## Чеклист перед релізом

- [ ] Всі анімації ≤ 300ms
- [ ] Картки без glassmorphism (solid background)
- [ ] Кнопки: тільки Primary, Secondary, Ghost + Success/Danger
- [ ] Spacing: 8px grid (12px-16px між полями)
- [ ] Кнопки: 40px Desktop, 44px Mobile
- [ ] Таблиці: zebra striping + sticky header
- [ ] Форми: label зверху, placeholder як підказка
- [ ] Dark mode: `#0f172a` background, `#1e293b` cards

---

## Інтеграція

Всі зміни застосовані у:
- `packages/design-system/src/styles/variables.css`
- `packages/design-system/src/styles/globals.css`
- `packages/design-system/src/styles/components.css`

Автоматично доступні у всіх модулях через design system.
