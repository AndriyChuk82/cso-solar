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
        const email = await verifySession();
        
        if (!email) {
          setUser(null);
          setLoading(false);
          return;
        }

        const res = await getUser(email);
        if (res.success && res.user) {
          const u = res.user;

          // Block Manager from Warehouse
          if (u.role === 'manager') {
            setError('Менеджерам доступний лише розділ Комерційних пропозицій.');
            setUser(null);
          } else {
            const roleLower = (u.role || '').toLowerCase();
            setUser({
              email: u.email,
              name: u.name,
              role: roleLower,
              warehouseId: u.warehouse_id,
              isAdmin: roleLower === CONFIG.ROLES.ADMIN,
              isStorekeeper: roleLower === CONFIG.ROLES.STOREKEEPER,
              isManager: roleLower === CONFIG.ROLES.MANAGER
            });
          }
        } else {
          setError('Користувача не знайдено в системі.');
        }
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
