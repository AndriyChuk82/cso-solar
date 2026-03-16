import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CONFIG from '../config';

/**
 * Бічна навігація.
 * Показує пункти меню відповідно до ролі користувача.
 */
export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      section: 'Операції',
      items: [
        { path: '/', label: 'Журнал операцій', icon: '📋' },
        { path: '/income', label: 'Новий прихід', icon: '📥' },
        { path: '/expense', label: 'Новий розхід', icon: '📤' },
        { path: '/transfer', label: 'Переміщення', icon: '🔄' },
        { path: '/daily-balance', label: 'Підсумок дня', icon: '📊' },
      ]
    },
    {
      section: 'Звіти',
      items: [
        { path: '/reports', label: 'Звіти', icon: '📈' },
      ]
    },

    {
      section: 'Адміністрування',
      adminOnly: true,
      items: [
        { path: '/catalog', label: 'Каталог товарів', icon: '📦' },
        { path: '/categories', label: 'Категорії', icon: '🏷️' },
        { path: '/warehouses', label: 'Склади', icon: '🏭' },
        { path: '/users', label: 'Користувачі', icon: '👥' },
      ]
    }
  ];

  return (
    <>
      <aside className={`app-sidebar${isOpen ? ' open' : ''}`}>
        <nav className="sidebar-nav">
          {navItems.map((section) => {
            if (section.adminOnly && !user?.isAdmin) return null;
            return (
              <div key={section.section} className="nav-section">
                <div className="nav-section-label">{section.section}</div>
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `nav-item${isActive ? ' active' : ''}`
                    }
                    onClick={onClose}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
      </aside>
      <div
        className={`sidebar-backdrop${isOpen ? ' visible' : ''}`}
        onClick={onClose}
      />
    </>
  );
}
