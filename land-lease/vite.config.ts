import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(__dirname, '../')
  const env = loadEnv(mode, rootDir, '')
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || ''
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ''

  return {
    plugins: [react()],
    base: '/land-lease/',
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
    },
    server: {
      port: 5178,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: '../public/land-lease',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-router-dom')) return 'router'
              if (id.includes('lucide-react')) return 'ui'
              if (id.includes('zustand')) return 'store'
              if (id.includes('leaflet') || id.includes('react-leaflet')) return 'map'
              if (id.includes('react') || id.includes('react-dom')) return 'vendor'
            }
          }
        }
      }
    }
  }
})
