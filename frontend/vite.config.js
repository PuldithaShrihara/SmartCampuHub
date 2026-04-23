import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Main integration point in development:
      // Frontend requests like "/api/..." are forwarded to Spring Boot backend.
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      // Static uploaded files are also served from backend in development.
      '/uploads': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
