import { NavLink } from 'react-router-dom'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navItems = [
    {
      section: 'Головне',
      items: [
        { path: '/', label: 'Дашборд', icon: '📊' },
        { path: '/landlords', label: 'Орендодавці', icon: '👤' },
        { path: '/map', label: 'Карта ділянок', icon: '🗺️' },
      ],
    },
    {
      section: 'Фінанси',
      items: [
        { path: '/finances', label: 'Облік оплат', icon: '💰' },
      ],
    },
  ]

  return (
    <>
      <aside className={`app-sidebar${isOpen ? ' open' : ''}`}>
        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div key={section.section} className="nav-section">
              <div className="nav-section-label">{section.section}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  onClick={onClose}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <div
        className={`sidebar-backdrop${isOpen ? ' visible' : ''}`}
        onClick={onClose}
      />
    </>
  )
}
