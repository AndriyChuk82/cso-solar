import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/verify');
        const data = await res.json();
        if (data.authenticated) {
          setUser({
            name: data.name || data.user,
            role: (data.role || 'manager').toLowerCase(),
            module_access: data.module_access || ''
          });
        }
      } catch (e) {
        console.error('Auth check failed', e);
      } finally {
        setLoading(false);
      }
    }
    check();
  }, []);

  return { user, loading };
}
