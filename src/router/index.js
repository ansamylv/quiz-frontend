import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import AuthView from '../views/AuthView.vue'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/auth'
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthView
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true } // Защита
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue')
    }
  ]
})

// ГЛОБАЛЬНЫЙ ПЕРЕХВАТЧИК: ЗАЩИТА МАРШРУТОВ
router.beforeEach((to, from) => {
  const authStore = useAuthStore()

  // 1. ЗАЩИТА СЕКРЕТНЫХ СТРАНИЦ
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return {
      name: 'auth',
      query: { redirect: to.fullPath }
    }
  }

  // 2. ЗАПРЕТ ДОСТУПА НА СТРАНИЦУ АВТОРИЗАЦИИ
  if (to.name === 'auth' && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }

  // Продолжаем навигацию
  return true
})

export default router