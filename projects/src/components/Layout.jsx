import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, LogOut, User } from 'lucide-react';
import { cn } from '../lib/utils';

export function Layout({ children }) {
  const location = useLocation();

  const navigation = [
    { name: 'Проекти', href: '/', icon: LayoutDashboard },
    { name: 'Комерційні пропозиції', href: '/proposals', icon: ClipboardList },
  ];

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

        <div className="header-right hidden md:flex">
          <div className="header-user">
            <span className="user-name">Адміністратор</span>
            <span className="user-role">Admin</span>
          </div>
          <button className="btn btn-ghost p-2" title="Вихід">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="app-layout">
        {/* Sidebar */}
        <aside className="app-sidebar">
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn("nav-item", isActive && "active")}
                >
                  <item.icon className="nav-icon" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Версія модуля</p>
              <p className="text-sm font-mono text-slate-600">v1.2.0-beta</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="app-main">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
