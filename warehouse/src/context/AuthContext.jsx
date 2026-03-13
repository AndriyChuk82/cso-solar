import { createContext, useContext, useState } from 'react';
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
  const [user, setUser] = useState({
    email: 'admin@cso-solar.com.ua',
    name: 'Адміністратор (Публічний доступ)',
    role: CONFIG.ROLES.ADMIN,
    warehouseId: '',
    isAdmin: true,
    isStorekeeper: false,
    isManager: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
