import { createClient } from '@supabase/supabase-js';
import CONFIG from '../config';

const supabaseUrl = CONFIG.SUPABASE_URL;
const supabaseAnonKey = CONFIG.SUPABASE_ANON_KEY;

// Додаємо перевірку, щоб не ламати додаток при порожніх ключах
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn('⚠️ Supabase не ініціалізовано: перевірте VITE_SUPABASE_URL та VITE_SUPABASE_ANON_KEY у .env.local');
}
