import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import CONFIG from '../config';

/**
 * Основний макет додатку: хедер + сайдбар + контент.
 */
export default function Layout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header className="app-header">
        <div className="header-brand">
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title="Меню"
          >
            ☰
          </button>
          <img
            src="https://i.ibb.co/32JD4dc/logo.png"
            alt="CSO Solar"
            className="logo"
          />
          <div className="brand-text">
            <span className="brand-name">CSO Solar</span>
            <span className="brand-sub">Складський облік</span>
          </div>
        </div>
        <div className="header-right">
          {user && (
            <div className="header-user">
              <span className="user-name">{user.name}</span>
              <span className="user-role">
                {CONFIG.ROLE_LABELS[user.role] || user.role}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="app-layout">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </>
  );
}
