import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/green-tariff/',
  server: {
    port: 5176,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../public/green-tariff',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router-dom')) return 'router';
            if (id.includes('lucide-react')) return 'ui';
            if (id.includes('zustand')) return 'store';
            if (id.includes('react') || id.includes('react-dom')) return 'vendor';
          }
        }
      }
    }
  }
})
