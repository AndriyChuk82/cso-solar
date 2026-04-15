# @cso/design-system

Єдина дизайн-система для всіх модулів CSO Solar з підтримкою glassmorphism та smooth animations.

## 🎨 Особливості

- ✅ **HSL палітра** — гнучкі кольори з підтримкою відтінків
- ✅ **Glassmorphism** — напівпрозорі елементи з blur ефектом
- ✅ **Smooth animations** — плавні переходи та анімації
- ✅ **TypeScript** — повна типізація
- ✅ **Tailwind CSS** — utility-first підхід
- ✅ **Accessibility** — WCAG 2.1 AA сумісність

## 📦 Встановлення

```bash
npm install @cso/design-system
```

## 🚀 Використання

### Імпорт стилів

```tsx
// У вашому main.tsx або App.tsx
import '@cso/design-system/styles';
```

### Компоненти

#### Button

```tsx
import { Button } from '@cso/design-system';

// Базове використання
<Button variant="primary">Click me</Button>

// З glassmorphism
<Button variant="success" glass>Save</Button>

// Різні розміри
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// Loading стан
<Button loading>Loading...</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost'`
- `size`: `'sm' | 'md' | 'lg'`
- `glass`: `boolean` — glassmorphism ефект
- `fullWidth`: `boolean` — на всю ширину
- `loading`: `boolean` — показати spinner

---

#### Card

```tsx
import { Card } from '@cso/design-system';

// Базове використання
<Card>
  <h2>Title</h2>
  <p>Content</p>
</Card>

// З glassmorphism
<Card glass padding="lg">
  Glassmorphism card
</Card>

// З hover ефектом
<Card hover onClick={() => console.log('clicked')}>
  Clickable card
</Card>

// З кольоровим border
<Card border="primary">
  Primary border
</Card>
```

**Props:**
- `glass`: `boolean` — glassmorphism ефект
- `hover`: `boolean` — hover анімація
- `padding`: `'none' | 'sm' | 'md' | 'lg'`
- `border`: `'none' | 'default' | 'primary' | 'success' | 'danger' | 'warning'`

---

### Утиліти

#### cn (className merger)

```tsx
import { cn } from '@cso/design-system';

// Об'єднання класів
cn('px-2 py-1', 'bg-primary') // => 'px-2 py-1 bg-primary'

// Умовні класи
cn('base-class', condition && 'conditional-class')

// Tailwind merge (видаляє дублікати)
cn('px-2', 'px-4') // => 'px-4'
```

---

## 🎨 Колірна палітра

### Primary (Помаранчевий — brand CSO Solar)
```css
bg-primary          /* hsl(25, 95%, 60%) */
bg-primary-light    /* hsl(25, 95%, 70%) */
bg-primary-dark     /* hsl(25, 95%, 50%) */
bg-primary-bg       /* hsl(25, 90%, 97%) */
```

### Secondary (Синій)
```css
bg-secondary        /* hsl(220, 70%, 50%) */
bg-secondary-light  /* hsl(220, 70%, 60%) */
bg-secondary-dark   /* hsl(220, 70%, 40%) */
```

### Semantic
```css
bg-success          /* hsl(142, 76%, 45%) */
bg-danger           /* hsl(0, 84%, 60%) */
bg-warning          /* hsl(38, 92%, 50%) */
bg-info             /* hsl(199, 89%, 48%) */
```

### Neutral (Сірі відтінки)
```css
bg-neutral-50       /* Найсвітліший */
bg-neutral-100
...
bg-neutral-900      /* Найтемніший */
```

---

## 🪄 Glassmorphism класи

```css
.glass-card         /* Для карток */
.glass-sidebar      /* Для sidebar */
.glass-modal        /* Для модальних вікон */
.glass-header       /* Для header */
```

**Приклад:**
```tsx
<div className="glass-card p-6 rounded-xl">
  Glassmorphism content
</div>
```

---

## ✨ Animation класи

```css
.smooth-transition       /* Базовий transition */
.smooth-hover           /* Hover з підняттям */
.smooth-press           /* Press ефект */
.fade-in                /* Fade in анімація */
.slide-in-right         /* Slide з права */
.slide-in-left          /* Slide з ліва */
.scale-in               /* Scale анімація */
.pulse                  /* Pulse ефект */
.spin                   /* Обертання */
.bounce                 /* Bounce ефект */
```

**Приклад:**
```tsx
<div className="fade-in smooth-hover">
  Animated content
</div>
```

---

## 🎯 CSS змінні

Всі кольори доступні як CSS змінні:

```css
:root {
  --primary: 25 95% 60%;
  --secondary: 220 70% 50%;
  --success: 142 76% 45%;
  --danger: 0 84% 60%;
  --warning: 38 92% 50%;
  --info: 199 89% 48%;
  
  /* Transitions */
  --transition-fast: 150ms;
  --transition-base: 200ms;
  --transition-slow: 300ms;
  --transition-smooth: 400ms;
  
  /* Border radius */
  --radius-sm: 6px;
  --radius: 8px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
}
```

**Використання:**
```css
.my-element {
  background: hsl(var(--primary));
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
}
```

---

## 📚 Приклади

### Glassmorphism Card з Button

```tsx
<Card glass padding="lg" className="max-w-md">
  <h2 className="text-2xl font-bold mb-4">Welcome</h2>
  <p className="text-neutral-600 mb-6">
    This is a glassmorphism card with smooth animations
  </p>
  <div className="flex gap-3">
    <Button variant="primary">Primary</Button>
    <Button variant="ghost">Cancel</Button>
  </div>
</Card>
```

### Hover Card з анімацією

```tsx
<Card hover className="fade-in">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 bg-primary rounded-full" />
    <div>
      <h3 className="font-semibold">Card Title</h3>
      <p className="text-sm text-neutral-500">Description</p>
    </div>
  </div>
</Card>
```

---

## 🛠️ Розробка

```bash
# Встановити залежності
npm install

# Type checking
npm run type-check

# Lint
npm run lint
```

---

## 📝 Ліцензія

Private — CSO Solar

---

**Версія:** 0.1.0  
**Автор:** CSO Solar Team
