import { createClient } from '@supabase/supabase-js';
import CONFIG from '../config';

const supabaseUrl = CONFIG.SUPABASE_URL;
const supabaseAnonKey = CONFIG.SUPABASE_ANON_KEY;

// Додаємо перевірку, щоб не ламати додаток при порожніх ключах
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn('⚠️ Supabase не ініціалізовано. Статус ключів:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length || 0
  });
}
