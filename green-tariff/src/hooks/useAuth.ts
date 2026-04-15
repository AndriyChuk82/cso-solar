// ===== CSO Solar — useAuth Hook =====

import { useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
  role: string;
  module_access: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
}

export function useAuth(): AuthState {
  const getInitialUser = () => {
    try {
      const cached = localStorage.getItem('cso_user');
      if (cached) {
        const userData = JSON.parse(cached);
        return { user: userData, loading: false, authenticated: true };
      }
    } catch (e) {}
    return { user: null, loading: true, authenticated: false };
  };

  const [state, setState] = useState<AuthState>(getInitialUser());

  useEffect(() => {
    async function checkAuth() {
      try {
        // 1. ПЕРЕВІРЯЄМО КЕШ ДЛЯ МИТТЄВОГО ВХОДУ
        const cached = localStorage.getItem('cso_user');
        if (cached) {
          try {
            const userData = JSON.parse(cached);
            setState({
              user: userData,
              loading: false,
              authenticated: true,
            });
          } catch (e) {
            console.error('Cache parse error', e);
          }
        }

        // 2. ФОНОВА ПЕРЕВІРКА
        const res = await fetch('/api/verify');
        if (!res.ok) {
           if (!cached) setState({ user: null, loading: false, authenticated: false });
           return;
        }
        const data = await res.json();

        if (data.authenticated) {
          const newUser = {
            name: data.name || data.user,
            email: data.user,
            role: data.role || '',
            module_access: data.module_access || '',
          };
          setState({
            user: newUser,
            loading: false,
            authenticated: true,
          });
          localStorage.setItem('cso_user', JSON.stringify(newUser));
        } else {
          localStorage.removeItem('cso_user');
          setState({ user: null, loading: false, authenticated: false });
        }
      } catch (e) {
        console.error('Auth check failed', e);
        if (!localStorage.getItem('cso_user')) {
          setState({ user: null, loading: false, authenticated: false });
        }
      }
    }

    checkAuth();
  }, []);

  return state;
}
