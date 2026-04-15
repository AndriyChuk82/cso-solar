import { useState, useEffect } from 'react';

export function useAuth() {
  const getInitialUser = () => {
    try {
      const stored = localStorage.getItem('cso_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) { return null; }
  };

  const [user, setUser] = useState(getInitialUser());
  const [loading, setLoading] = useState(!getInitialUser());

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cso_user');
      if (stored) {
        setUser(JSON.parse(stored));
        setLoading(false); // МИТТЄВИЙ ВХІД
      } else {
        // Якщо в localStorage нічого немає — відправляємо на логін
        // (Або можна залишити Гість для базового перегляду, але краще на логін)
        setUser(null);
        setLoading(false);
      }
    } catch (e) {
      console.error('Помилка авторизації', e);
      setLoading(false);
    }
  }, []);

  // Додамо метод logout про всяк випадок
  const logout = () => {
    localStorage.removeItem('cso_user');
    window.location.href = '/'; 
  };

  return { user, loading, logout };
}
