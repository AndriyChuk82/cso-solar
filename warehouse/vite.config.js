import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Визначаємо шлях до кореня монорепозиторію
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(__dirname, '../');
  
  // Завантажуємо змінні з кореня
  const env = loadEnv(mode, rootDir, '');
  
  // ДЕБАГ: Якщо ключів немає навіть у системних змінних, ми хочемо знати про це під час білду
  const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  console.log('--- Build Environment Check ---');
  console.log('Mode:', mode);
  console.log('Looking for env in:', rootDir);
  console.log('Supabase URL found:', !!supabaseUrl);
  console.log('Supabase Key found:', !!supabaseKey);
  console.log('-------------------------------');

  return {
    plugins: [react()],
    base: '/warehouse/',
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
    },
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: '../public/warehouse',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom']
          }
        }
      }
    }
  };
});
