import { createContext, useContext, useState, useEffect } from 'react';
import CONFIG from '../config';
import { verifySession, getUser } from '../api/gasApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Миттєва ініціалізація з кешу
  const getInitialUser = () => {
    try {
      const cached = localStorage.getItem('cso_user');
      return cached ? JSON.parse(cached) : null;
    } catch (e) { return null; }
  };

  const [user, setUser] = useState(getInitialUser);
  const [loading, setLoading] = useState(!getInitialUser());
  const [error, setError] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        // 1. ПЕРЕВІРЯЄМО КЕШ (LocalStorage) - для миттєвого входу при перемиканні модулів
        const cachedUser = localStorage.getItem('cso_user');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
            setLoading(false); // ПРИБИРАЄМО ЕКРАН ЗАВАНТАЖЕННЯ МИТТЄВО
          } catch (e) {
            console.error('Error parsing cached user:', e);
          }
        }

        // DEV MODE: Тимчасово пропускаємо авторизацію для тестування UI
        if (import.meta.env.DEV) {
          const devUser = {
            email: 'dev@test.com',
            name: 'Dev User',
            role: 'admin',
            warehouseId: null,
            module_access: 'warehouse,projects,gt,proposals',
            isAdmin: true,
            isStorekeeper: false,
            isManager: false,
          };
          setUser(devUser);
          localStorage.setItem('cso_user', JSON.stringify(devUser));
          setLoading(false);
          return;
        }

        // 2. ФОНОВА ПЕРЕВІРКА JWT (не блокує UI якщо є кеш)
        const response = await fetch(CONFIG.VERIFY_URL, { credentials: 'include' });
        if (!response.ok) {
          if (!cachedUser) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
        const verifyData = await response.json();
        if (!verifyData.authenticated) {
          localStorage.removeItem('cso_user');
          setUser(null);
          setLoading(false);
          return;
        }

        const { user: email, name, role: tokenRole, module_access: tokenModuleAccess } = verifyData;

        // 3. Отримуємо розширені дані з Google Sheets (також у фоні)
        const gasResult = await getUser(email);

        let warehouseId = null;
        let finalRole = (tokenRole || 'user').trim().toLowerCase();
        let finalModuleAccess = (tokenModuleAccess || '').trim().toLowerCase();

        if (gasResult?.success && gasResult.user) {
          const u = gasResult.user;
          warehouseId = u.warehouse_id || null;
          
          // Тільки якщо в токені 'user', ми беремо роль з таблиці (щоб не понизити Адміна)
          if (u.role && (finalRole === 'user' || finalRole === '')) {
            finalRole = u.role.trim().toLowerCase();
          }
          
          if (!finalModuleAccess && u.module_access) {
            finalModuleAccess = u.module_access.trim().toLowerCase();
          }
        }

        // Розширений список адмінських ролей
        const adminRoles = ['admin', 'адмін', 'адміністратор', 'administrator'];
        const isAdmin = adminRoles.includes(finalRole);

        // Якщо Адмін — даємо повний доступ автоматично
        if (isAdmin && !finalModuleAccess) {
          finalModuleAccess = 'warehouse,gt,projects,proposals';
        }

        const updatedUser = {
          email,
          name: name || email,
          role: finalRole,
          warehouseId,
          module_access: finalModuleAccess,
          isAdmin,
          isStorekeeper: finalRole === 'storekeeper' || finalRole === 'комірник',
          isManager: finalRole === 'manager' || finalRole === 'менеджер',
        };

        setUser(updatedUser);
        localStorage.setItem('cso_user', JSON.stringify(updatedUser));
      } catch (err) {
        console.error('Auth error:', err);
        if (!localStorage.getItem('cso_user')) {
          setError('Помилка авторизації.');
        }
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
