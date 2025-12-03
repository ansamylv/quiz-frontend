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
      // Проксируем /api без переписывания пути, чтобы Spring видел /api/...
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Проксируем публичные ссылки /test/... для пробного прохождения
      '/test': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
  // =======================================================
});
