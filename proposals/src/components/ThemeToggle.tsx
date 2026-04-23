import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@cso/design-system';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-neutral-800"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-gray-700 dark:text-neutral-300" />
      ) : (
        <Sun className="w-5 h-5 text-gray-700 dark:text-neutral-300" />
      )}
    </button>
  );
}
