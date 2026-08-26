import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      accessToken: async () => {
        if (typeof window !== 'undefined') {
          return localStorage.getItem('cso_auth_token') || sessionStorage.getItem('cso_auth_token') || '';
        }
        return '';
      }
    })
  : null;

if (!supabase) {
  console.warn('⚠️ Supabase не ініціалізовано в модулі Projects. Додайте VITE_SUPABASE_URL та VITE_SUPABASE_ANON_KEY в .env.local');
}

