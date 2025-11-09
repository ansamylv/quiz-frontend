import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // =======================================================
  // НАСТРОЙКА ПРОКСИ ДЛЯ СВЯЗИ СО SPRING BOOT
  // =======================================================
  server: {
    proxy: {
      // Когда фронтенд запрашивает что-то по пути /api (например, /api/auth/login)
      '/api': {
        // Он перенаправляется на бэкенд (http://localhost:8080/auth/login)
        target: 'http://localhost:8080',
        changeOrigin: true, // Для корректной работы заголовков
        rewrite: (path) => path.replace(/^\/api/, '') // Удаляем /api из пути перед отправкой на бэкенд
      }
    }
  }
  // =======================================================
});
