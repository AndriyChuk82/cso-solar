import { createClient } from '@supabase/supabase-js';
import CONFIG from '../config';

const supabaseUrl = CONFIG.SUPABASE_URL;
const supabaseAnonKey = CONFIG.SUPABASE_ANON_KEY;

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
  console.warn('⚠️ Supabase не ініціалізовано. Статус ключів:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length || 0
  });
}
