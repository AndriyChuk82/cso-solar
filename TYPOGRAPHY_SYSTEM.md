# Typography System - CSO Solar

## Font Family
**Inter** - оптимальний для бізнес-додатків, відмінна читабельність на екранах.

```css
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

## Font Sizes

| Назва | Розмір | Використання | CSS Variable |
|-------|--------|--------------|--------------|
| **2XL** | 24px | H1, Page titles | `var(--font-size-2xl)` |
| **XL** | 20px | H2, Section headers | `var(--font-size-xl)` |
| **LG** | 18px | H3, Card titles | `var(--font-size-lg)` |
| **Base** | 16px | Body text, paragraphs | `var(--font-size-base)` |
| **SM** | 14px | Secondary text, labels | `var(--font-size-sm)` |
| **XS** | 12px | Captions, badges, hints | `var(--font-size-xs)` |

## Line Heights

| Назва | Значення | Використання |
|-------|----------|--------------|
| **Tight** | 1.25 | Headings (H1, H2) |
| **Normal** | 1.5 | H3, small text |
| **Relaxed** | 1.6 | Body text, paragraphs |

## Font Weights

| Вага | Значення | Використання |
|------|----------|--------------|
| **Bold** | 700 | H1, важливі заголовки |
| **Semibold** | 600 | H2, H3, кнопки |
| **Medium** | 500 | Labels, navigation |
| **Regular** | 400 | Body text |

## Приклади використання

### Headings
```jsx
<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
  Головний заголовок
</h1>

<h2 className="text-xl font-semibold text-gray-900 dark:text-white">
  Секція
</h2>

<h3 className="text-lg font-semibold text-gray-800 dark:text-neutral-200">
  Підзаголовок
</h3>
```

### Body Text
```jsx
<p className="text-base text-gray-700 dark:text-neutral-300">
  Основний текст з оптимальною читабельністю
</p>

<span className="text-sm text-gray-600 dark:text-neutral-400">
  Вторинний текст, підписи
</span>

<small className="text-xs text-gray-500 dark:text-neutral-500">
  Дрібний текст, підказки
</small>
```

### З CSS Variables
```css
.custom-heading {
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-tight);
  font-weight: 700;
}

.body-text {
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
}
```

## Tailwind Classes

### Font Sizes
- `text-2xl` - 24px (H1)
- `text-xl` - 20px (H2)
- `text-lg` - 18px (H3)
- `text-base` - 16px (Body)
- `text-sm` - 14px (Secondary)
- `text-xs` - 12px (Caption)

### Font Weights
- `font-bold` - 700
- `font-semibold` - 600
- `font-medium` - 500
- `font-normal` - 400

### Line Heights
- `leading-tight` - 1.25
- `leading-normal` - 1.5
- `leading-relaxed` - 1.6

## Рекомендації

### ✅ Do
- Використовуй `text-base` (16px) для основного тексту
- Дотримуйся міжрядкового інтервалу 1.5-1.6 для body
- Використовуй `font-semibold` (600) для заголовків
- Забезпечуй достатній контраст у dark mode

### ❌ Don't
- Не використовуй розміри менше 12px
- Не робі міжрядковий інтервал менше 1.25
- Не змішуй різні font-family в одному інтерфейсі
- Не використовуй `font-light` (300) для дрібного тексту

## Accessibility

### Мінімальні розміри
- **Touch targets**: мінімум 44x44px для кнопок
- **Body text**: не менше 16px для комфортного читання
- **Small text**: не менше 12px

### Контрастність
- **Normal text**: мінімум 4.5:1
- **Large text** (18px+): мінімум 3:1
- **UI elements**: мінімум 3:1

## Інтеграція

Всі змінні доступні у:
- `packages/design-system/src/styles/variables.css`
- `packages/design-system/src/styles/globals.css`

Автоматично застосовуються до всіх модулів через design system.
