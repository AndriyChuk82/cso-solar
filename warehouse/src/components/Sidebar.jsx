import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CONFIG from '../config';
import { canAccess } from '../utils/permissions';

/**
 * Бічна навігація.
 * Показує пункти меню відповідно до дозволів користувача.
 */
export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      section: 'Операції',
      items: [
        { path: '/construction-objects', label: 'Об\'єкти будівництва', icon: '🏗️', permission: 'objects' },
        { path: '/price-list', label: 'Прайс-лист', icon: '🏷️', permission: 'price_list' },
        { path: '/', label: 'Журнал операцій', icon: '📋', permission: 'journal' },
        { path: '/income', label: 'Новий прихід', icon: '📥', permission: 'operations' },
        { path: '/expense', label: 'Новий розхід', icon: '📤', permission: 'operations' },
        { path: '/transfer', label: 'Переміщення', icon: '🔄', permission: 'operations' },
        { path: '/daily-balance', label: 'Підсумок дня', icon: '📊', permission: 'operations' },
        { path: '/buyers', label: 'Баланси клієнтів', icon: '⚖️', permission: 'buyers' },
        { path: '/shipments', label: 'Відправлення', icon: '🚚', permission: 'shipments' },
      ]
    },
    {
      section: 'Звіти',
      items: [
        { path: '/reports', label: 'Звіти', icon: '📈', permission: 'reports' },
        { path: '/buyers/report', label: 'Звіти по клієнтах', icon: '👥', permission: 'reports' },
        { path: '/audit-log', label: 'Журнал дій (Аудит)', icon: '📜', permission: 'reports' },
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
        { path: '/backups', label: 'Резервні копії', icon: '💾' },
      ]
    }
  ];

  return (
    <>
      <aside className={`app-sidebar${isOpen ? ' open' : ''}`}>
        <nav className="sidebar-nav">
          {navItems.map((section) => {
            if (section.adminOnly && !user?.isAdmin) return null;
            
            // Фільтрація доступних пунктів меню
            const visibleItems = section.items.filter(item => {
              if (item.permission) {
                return canAccess(user, item.permission);
              }
              return true;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.section} className="nav-section">
                <div className="nav-section-label">{section.section}</div>
                {visibleItems.map((item) => (
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
