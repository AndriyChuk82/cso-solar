import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lqsyweounwbbhcyzkrdj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxc3l3ZW91bndiYmhjeXprcmRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc3MDcsImV4cCI6MjA5MTgzMzcwN30.w_xlhKZkcd5QcNfp2xMmfyg2BcotMF5osF4MGF4T3_I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cso_auth_token') || sessionStorage.getItem('cso_auth_token') || '';
    }
    return '';
  }
});

