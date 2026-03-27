import { createContext, useContext, useState, useEffect } from 'react';
import CONFIG from '../config';
import { verifySession, getUser } from '../api/gasApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        setLoading(true);

        // 1. Перевіряємо JWT токен через /api/verify — отримуємо email, role та module_access
        const response = await fetch(CONFIG.VERIFY_URL, { credentials: 'include' });
        if (!response.ok) {
          setUser(null);
          setLoading(false);
          return;
        }
        const verifyData = await response.json();
        if (!verifyData.authenticated) {
          setUser(null);
          setLoading(false);
          return;
        }

        const { user: email, name, role, module_access } = verifyData;

        // 2. Отримуємо розширені дані (warehouse_id тощо) з Google Sheets
        const gasResult = await getUser(email);

        let warehouseId = null;
        let finalRole = (role || 'user').toLowerCase();
        let finalModuleAccess = module_access || '';

        if (gasResult?.success && gasResult.user) {
          const u = gasResult.user;
          warehouseId = u.warehouse_id || null;
          // GAS може мати свіжішу роль — але довіряємо тій що в токені (JWT)
          // Якщо роль "manager" — блокуємо доступ до складу
          if (u.role) finalRole = u.role.toLowerCase();
          // module_access з токена актуальніший (встановлюється під час логіну)
          if (!finalModuleAccess && u.module_access) {
            finalModuleAccess = u.module_access;
          }
        }

        const isAdmin = finalRole === 'admin' || finalRole === 'адмін' || finalRole === 'адміністратор';

        setUser({
          email,
          name: name || email,
          role: finalRole,
          warehouseId,
          module_access: finalModuleAccess,
          isAdmin,
          isStorekeeper: finalRole === 'storekeeper',
          isManager: finalRole === 'manager',
        });
      } catch (err) {
        console.error('Auth error:', err);
        setError('Помилка авторизації.');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth має використовуватись всередині AuthProvider');
  }
  return context;
}

export default AuthContext;
