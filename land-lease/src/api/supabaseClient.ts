import { createClient } from '@supabase/supabase-js'
import CONFIG from '../config'

const supabaseUrl = CONFIG.SUPABASE_URL
const supabaseAnonKey = CONFIG.SUPABASE_ANON_KEY

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

if (!supabase) {
  console.warn('⚠️ Supabase не ініціалізовано. Перевірте VITE_SUPABASE_URL та VITE_SUPABASE_ANON_KEY')
}
