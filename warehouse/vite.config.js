import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

export default defineConfig(({ mode }) => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(__dirname, '../');
  const env = loadEnv(mode, rootDir, '');
  
  // Беремо ключі з усіх можливих джерел
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '';

  console.log('--- DETAILED BUILD LOG ---');
  console.log('Project Root:', rootDir);
  console.log('VITE_ variables in process.env:', Object.keys(process.env).filter(k => k.startsWith('VITE_')));
  console.log('VITE_ variables in loadEnv:', Object.keys(env).filter(k => k.startsWith('VITE_')));
  console.log('Supabase URL status:', !!supabaseUrl, supabaseUrl ? '(length: ' + supabaseUrl.length + ')' : '(EMPTY)');
  console.log('--------------------------');

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
