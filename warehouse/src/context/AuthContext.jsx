import { createContext, useContext, useState, useEffect } from 'react';
import CONFIG from '../config';
import { verifySession, getUser } from '../api/gasApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Миттєва ініціалізація з кешу (тільки якщо є збережений токен)
  const getInitialUser = () => {
    try {
      const token = localStorage.getItem('cso_auth_token');
      const cached = localStorage.getItem('cso_user');
      if (token && cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (e) { return null; }
  };

  const [user, setUser] = useState(getInitialUser);
  const [loading, setLoading] = useState(!getInitialUser());
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        // 1. ПЕРЕВІРЯЄМО КЕШ (тільки якщо є токен)
        const cachedToken = localStorage.getItem('cso_auth_token');
        const cachedUser = localStorage.getItem('cso_user');
        if (cachedToken && cachedUser) {
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
          localStorage.removeItem('cso_auth_token');
          setUser(null);
          setLoading(false);
          return;
        }

        if (verifyData.token) {
          localStorage.setItem('cso_auth_token', verifyData.token);
        }

        const { user: email, name, role: tokenRole, module_access: tokenModuleAccess } = verifyData;

        let finalRole = (tokenRole || 'user').trim().toLowerCase();
        let finalModuleAccess = (tokenModuleAccess || '').trim().toLowerCase();

        // Розширений список адмінських ролей
        const adminRoles = ['admin', 'адмін', 'адміністратор', 'administrator'];
        const isAdmin = adminRoles.includes(finalRole);

        // Якщо Адмін — даємо повний доступ автоматично
        if (isAdmin && !finalModuleAccess) {
          finalModuleAccess = 'warehouse,gt,projects,proposals,land-lease';
        }

        const isInstaller = finalRole === 'installer' || finalRole === 'монтажник';

        const updatedUser = {
          email,
          name: name || email,
          role: finalRole,
          warehouseId: verifyData.warehouse_id || null,
          warehouse_id: verifyData.warehouse_id || null,
          module_access: finalModuleAccess,
          warehouse_access: verifyData.warehouse_access || null,
          isAdmin,
          isInstaller,
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
        setIsVerifying(false);
      }
    }

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, isVerifying }}>
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
