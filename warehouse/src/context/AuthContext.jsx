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
      // Авторизація вимкнена - створюємо фіктивного адміна
      setUser({
        email: 'admin@cso-solar.com',
        name: 'Адміністратор (Без авторизації)',
        role: 'admin',
        warehouseId: null, // Можна буде вибрати будь-який склад
        isAdmin: true,
        isStorekeeper: false,
        isManager: false
      });
      setLoading(false);
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
