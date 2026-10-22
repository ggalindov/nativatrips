/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Las librerías cambian poco: en archivos aparte quedan en la caché del navegador entre versiones del sitio.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['motion'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    // En desarrollo la API va por el mismo origen, como detrás de Nginx: sin CORS.
    proxy: {
      '/api': { target: process.env.API_PROXY ?? 'http://localhost:8080', changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Los flujos completos de reserva rozan los 5 s por defecto cuando corren en paralelo.
    testTimeout: 15000,
  },
})
