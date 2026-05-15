import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config';

const supabaseUrl = CONFIG.SUPABASE_URL;
const supabaseAnonKey = CONFIG.SUPABASE_ANON_KEY;

// Ініціалізація клієнта Supabase
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn('⚠️ Supabase не ініціалізовано в модулі Proposals. Перевірте змінні оточення.');
}
