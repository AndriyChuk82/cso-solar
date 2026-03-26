import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, LogOut, User, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

export function Layout({ children }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  const navigation = [
    { name: 'Проекти', href: '/', icon: LayoutDashboard },
    { name: 'Комерційні пропозиції', href: '/proposals', icon: ClipboardList },
  ];

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <img 
            src="https://i.ibb.co/32JD4dc/logo.png" 
            alt="CSO Solar" 
            className="logo" 
          />
          <div className="brand-text">
            <span className="brand-name">CSO Solar</span>
            <span className="brand-sub">Проєктний менеджмент</span>
          </div>
        </div>

        <div className="header-actions">
          <div className="nav-links">
            {(user.role === 'admin' || user.role === 'адмін' || user.role === 'адміністратор' || (user.module_access || '').includes('warehouse')) && (
              <a href="/warehouse/" className="nav-btn"><i>📦</i> <span>Склад</span></a>
            )}
            {(user.role === 'admin' || user.role === 'адмін' || user.role === 'адміністратор' || (user.module_access || '').includes('proposals')) && (
              <a href="/" className="nav-btn"><i>📄</i> <span>КП</span></a>
            )}
            {(user.role === 'admin' || user.role === 'адмін' || user.role === 'адміністратор' || (user.module_access || '').includes('projects')) && (
              <a href="/projects/" className="nav-btn active"><i>📊</i> <span>Проєкти</span></a>
            )}
            {(user.role === 'admin' || user.role === 'адмін' || user.role === 'адміністратор' || (user.module_access || '').includes('gt')) && (
              <a href="/green-tariff.html" className="nav-btn"><i>🌱</i> <span>Зелений тариф</span></a>
            )}
          </div>

          <div className="action-btns">
            {user && (
              <div className="header-user">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
            )}
            <a href="/api/logout" className="btn btn-icon" title="Вихід">
              <span className="btn-icon-svg">🚪</span>
            </a>
          </div>
        </div>
      </header>

      <div className="app-layout">
        {/* Main Content */}
        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
