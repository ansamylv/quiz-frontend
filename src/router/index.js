import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Импорт компонентов
import AuthView from '../views/AuthView.vue'
import DashboardView from '../views/DashboardView.vue'
import TestEditView from '../views/TestEditView.vue' // <-- НОВЫЙ КОМПОНЕНТ

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: AuthView,
      meta: { guestOnly: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    // МАРШРУТ ДЛЯ РЕДАКТИРОВАНИЯ ТЕСТА (CRUD: Read/Update)
    {
      path: '/tests/:id/edit',
      name: 'test-edit',
      component: TestEditView,
      meta: { requiresAuth: true }
    },
    // Перенаправление с корня на /dashboard, если авторизован
    {
        path: '/',
        redirect: '/dashboard'
    },
    // Catch all 404
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: { template: '<h1>404 Not Found</h1>' }
    }
  ]
})

// Глобальный навигационный гвард для проверки авторизации
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const isAuthenticated = !!authStore.userCode; // Проверяем наличие кода пользователя

    // 1. Требуется авторизация
    if (to.meta.requiresAuth && !isAuthenticated) {
        // Если не авторизован, но пытается попасть на защищенную страницу, перенаправляем на логин
        next('/auth');
    // 2. Только для гостей (авторизация не нужна)
    } else if (to.meta.guestOnly && isAuthenticated) {
        // Если авторизован, но пытается попасть на страницу логина/регистрации, перенаправляем на дашборд
        next('/dashboard');
    } else {
        // Во всех остальных случаях разрешаем переход
        next();
    }
});

export default router
