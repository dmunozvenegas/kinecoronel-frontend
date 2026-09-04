import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  base: '/', 
  
  // === CONFIGURACIÓN PARA DOCKER ===
  server: {
    host: '0.0.0.0', // Permite que Docker exponga la app hacia tu Mac
    port: 5173,      // Asegura que siempre use el puerto correcto
    proxy: {
      '/api': {
        target: 'http://backend:3000', // Conecta directamente con tu contenedor backend
        changeOrigin: true,
        secure: false, 
      }
    }
  }
})