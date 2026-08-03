const CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  VERIFY_URL: '/api/verify',
  MODULE_KEY: 'land-lease',
  MODULE_ACCESS_KEYS: ['land-lease', 'оренда', 'оренда землі', 'земля'],
  ROLE_LABELS: {
    admin: 'Адміністратор',
    manager: 'Менеджер',
    viewer: 'Переглядач',
  } as Record<string, string>,
} as const

export default CONFIG
