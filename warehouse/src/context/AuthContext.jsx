import { createContext, useContext, useState, useEffect } from 'react';
import { verifySession, getUser } from '../api/gasApi';
import CONFIG from '../config';

const AuthContext = createContext(null);

/**
 * Провайдер авторизації.
 * При завантаженні додатку:
 * 1. Перевіряє JWT сесію основного сайту через /api/verify
 * 2. Шукає користувача в Google Sheets таблиці users
 * 3. Встановлює роль та доступний склад
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function authenticate() {
      try {
        // Крок 1: Перевірка JWT сесії основного сайту
        const username = await verifySession();
        if (!username) {
          setError('Ви не авторизовані. Увійдіть через основний сайт.');
          setLoading(false);
          return;
        }

        // Крок 2: Пошук користувача в таблиці users
        const userData = await getUser(username);
        if (!userData || !userData.success) {
          setError('Доступ заборонено. Ваш акаунт не знайдено в системі складського обліку.');
          setLoading(false);
          return;
        }

        if (!userData.user.active) {
          setError('Ваш акаунт деактивовано. Зверніться до адміністратора.');
          setLoading(false);
          return;
        }

        setUser({
          email: userData.user.email,
          name: userData.user.name,
          role: userData.user.role,
          warehouseId: userData.user.warehouse_id,
          isAdmin: userData.user.role === CONFIG.ROLES.ADMIN,
          isStorekeeper: userData.user.role === CONFIG.ROLES.STOREKEEPER,
          isManager: userData.user.role === CONFIG.ROLES.MANAGER
        });
      } catch (err) {
        console.error('Помилка авторизації:', err);
        setError('Помилка підключення до сервера. Спробуйте пізніше.');
      } finally {
        setLoading(false);
      }
    }

    authenticate();
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
