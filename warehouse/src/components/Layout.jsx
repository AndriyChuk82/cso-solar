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
            <>
              {(user.role === 'admin' || user.role === 'адмін' || user.role === 'адміністратор' || (user.module_access || '').includes('warehouse')) && (
                <a href="/warehouse/" className="nav-btn active"><i>📦</i> <span>Склад</span></a>
              )}
              {(user.role === 'admin' || user.role === 'адмін' || user.role === 'адміністратор' || (user.module_access || '').includes('proposals')) && (
                <a href="/" className="nav-btn"><i>📄</i> <span>КП</span></a>
              )}
              {(user.role === 'admin' || user.role === 'адмін' || user.role === 'адміністратор' || (user.module_access || '').includes('projects')) && (
                <a href="/projects/" className="nav-btn"><i>📊</i> <span>Проєкти</span></a>
              )}
              {(user.role === 'admin' || user.role === 'адмін' || user.role === 'адміністратор' || (user.module_access || '').includes('gt')) && (
                <a href="/green-tariff.html" className="nav-btn"><i>🌱</i> <span>Зелений тариф</span></a>
              )}
            </>
          )}

          {user && (
            <div className="header-user">
              <span className="user-name">{user.name}</span>
              <span className="user-role">
                {CONFIG.ROLE_LABELS[user.role] || user.role}
              </span>
            </div>
          )}
          <a href="/api/logout" className="btn btn-ghost btn-sm" title="Вийти">🚪</a>
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
