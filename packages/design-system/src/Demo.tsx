import { Button, Card } from './index';
import './styles/index.css';

/**
 * Demo компонент для демонстрації дизайн-системи
 */
export function DesignSystemDemo() {
  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            CSO Solar Design System
          </h1>
          <p className="text-neutral-600">
            Єдина дизайн-система з glassmorphism та smooth animations
          </p>
        </div>

        {/* Buttons Section */}
        <Card padding="lg" className="fade-in">
          <h2 className="text-2xl font-bold mb-6">Buttons</h2>

          <div className="space-y-6">
            {/* Variants */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-600 mb-3">Variants</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-600 mb-3">Sizes</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            {/* Glass */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-600 mb-3">Glassmorphism</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" glass>Primary Glass</Button>
                <Button variant="success" glass>Success Glass</Button>
                <Button variant="danger" glass>Danger Glass</Button>
              </div>
            </div>

            {/* States */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-600 mb-3">States</h3>
              <div className="flex flex-wrap gap-3">
                <Button loading>Loading...</Button>
                <Button disabled>Disabled</Button>
                <Button fullWidth>Full Width</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Regular Card */}
          <Card padding="lg" className="fade-in">
            <h3 className="text-lg font-bold mb-2">Regular Card</h3>
            <p className="text-neutral-600 text-sm mb-4">
              Звичайна картка з білим фоном та тінню
            </p>
            <Button size="sm" fullWidth>Action</Button>
          </Card>

          {/* Glass Card */}
          <Card glass padding="lg" className="fade-in" style={{ animationDelay: '100ms' }}>
            <h3 className="text-lg font-bold mb-2">Glass Card</h3>
            <p className="text-neutral-600 text-sm mb-4">
              Картка з glassmorphism ефектом
            </p>
            <Button size="sm" glass fullWidth>Action</Button>
          </Card>

          {/* Hover Card */}
          <Card hover padding="lg" className="fade-in" style={{ animationDelay: '200ms' }}>
            <h3 className="text-lg font-bold mb-2">Hover Card</h3>
            <p className="text-neutral-600 text-sm mb-4">
              Картка з hover анімацією
            </p>
            <Button size="sm" variant="secondary" fullWidth>Action</Button>
          </Card>
        </div>

        {/* Colored Borders */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card border="primary" padding="md" className="fade-in">
            <div className="text-center">
              <div className="text-3xl mb-2">🔵</div>
              <h4 className="font-semibold text-sm">Primary</h4>
            </div>
          </Card>
          <Card border="success" padding="md" className="fade-in" style={{ animationDelay: '50ms' }}>
            <div className="text-center">
              <div className="text-3xl mb-2">✅</div>
              <h4 className="font-semibold text-sm">Success</h4>
            </div>
          </Card>
          <Card border="danger" padding="md" className="fade-in" style={{ animationDelay: '100ms' }}>
            <div className="text-center">
              <div className="text-3xl mb-2">❌</div>
              <h4 className="font-semibold text-sm">Danger</h4>
            </div>
          </Card>
          <Card border="warning" padding="md" className="fade-in" style={{ animationDelay: '150ms' }}>
            <div className="text-center">
              <div className="text-3xl mb-2">⚠️</div>
              <h4 className="font-semibold text-sm">Warning</h4>
            </div>
          </Card>
        </div>

        {/* Colors Palette */}
        <Card padding="lg">
          <h2 className="text-2xl font-bold mb-6">Color Palette</h2>

          <div className="space-y-4">
            {/* Primary */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Primary (Brand Orange)</h3>
              <div className="flex gap-2">
                <div className="flex-1 h-16 bg-primary rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  Primary
                </div>
                <div className="flex-1 h-16 bg-primary-light rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  Light
                </div>
                <div className="flex-1 h-16 bg-primary-dark rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  Dark
                </div>
              </div>
            </div>

            {/* Semantic */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Semantic Colors</h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="h-16 bg-success rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  Success
                </div>
                <div className="h-16 bg-danger rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  Danger
                </div>
                <div className="h-16 bg-warning rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  Warning
                </div>
                <div className="h-16 bg-info rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                  Info
                </div>
              </div>
            </div>

            {/* Neutral */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Neutral Grays</h3>
              <div className="flex gap-1">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div
                    key={shade}
                    className={`flex-1 h-16 bg-neutral-${shade} rounded-lg flex items-center justify-center text-xs font-semibold ${
                      shade >= 500 ? 'text-white' : 'text-neutral-900'
                    }`}
                  >
                    {shade}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
