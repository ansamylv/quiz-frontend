<template>
  <div class="dashboard-page">
    <section class="hero-card">
      <div>
        <p class="hero-eyebrow">👋 Добро пожаловать</p>
        <h1>{{ greetingName }}</h1>
      </div>
      <div class="hero-actions">
        <button class="btn primary" @click="openCreateModal">+ Создать тест</button>
        <button class="btn subtle" @click="handleLogout">Выход</button>
      </div>
    </section>

    <div v-if="toastMessage" :class="['toast', toastType]">
      {{ toastMessage }}
    </div>

    <div v-if="loading" class="info-banner">Загрузка данных дашборда...</div>
    <div v-else-if="error" class="info-banner error">Ошибка загрузки: {{ error }}</div>

    <template v-else>
      <section class="stats-grid">
        <article class="stat-card">
          <span class="stat-label">Всего тестов</span>
          <strong class="stat-value">{{ dashboardData.totalTests }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">Студентов</span>
          <strong class="stat-value">{{ dashboardData.totalStudents }}</strong>
        </article>
        <article class="stat-card">
          <span class="stat-label">Средний балл</span>
          <strong class="stat-value">{{ formatScore(dashboardData.averageScore) }}%</strong>
        </article>
      </section>

      <section class="tests-panel">
        <div class="panel-header">
          <div>
            <h3>📝 Мои тесты</h3>
            <p>Управляйте тестами и отслеживайте статус публикаций.</p>
            <div class="status-breakdown inline">
              <button
                v-for="filter in filters"
                :key="filter.value"
                class="status-pill-button"
                :class="{ active: selectedFilter === filter.value }"
                @click="selectFilter(filter.value)"
              >
                <span v-if="filter.value === 'ALL'">Все · {{ dashboardData.totalTests }}</span>
                <span v-else-if="filter.value === 'ACTIVE'">Активные · {{ dashboardData.activeTests }}</span>
                <span v-else-if="filter.value === 'COMPLETED'">Завершенные · {{ dashboardData.completedTests }}</span>
                <span v-else>Черновики · {{ dashboardData.draftTests }}</span>
              </button>
            </div>
            </div>
          <div class="filter-buttons" v-if="false">
            <button
              v-for="filter in filters"
              :key="filter.value"
              class="btn filter"
              :class="{ active: selectedFilter === filter.value }"
              @click="selectFilter(filter.value)"
            >
              {{ filter.label }}
            </button>
            </div>
        </div>

        <p v-if="filteredTests.length === 0" class="no-tests">
          Для выбранного статуса пока нет тестов.
        </p>

        <div v-else class="test-cards">
          <article v-for="test in filteredTests" :key="test.id" class="test-card">
            <div class="test-card-head">
                        <h4>{{ test.title }}</h4>
              <span :class="['status-pill', test.status.toLowerCase()]">
                {{ statusLabel(test.status) }}
                        </span>
                    </div>
            <p class="test-card-meta">
              {{ statusEmoji(test.status) }}
              {{ test.studentCount }} студентов ·
              {{ formatScore(test.averageScore) }}% ·
              📅 {{ test.date }}
            </p>
            <div class="test-actions">
              <button @click="handleEditTest(test)" class="icon-btn" title="Редактировать">✏️</button>
              <button
                @click="handleTryTest(test)"
                class="icon-btn"
                :disabled="test.status !== 'ACTIVE' || !test.publicLink"
                title="Опробовать как ученик"
              >
                🔍
              </button>
              <button
                @click="handleFinishTest(test)"
                class="icon-btn finish"
                :disabled="test.status !== 'ACTIVE'"
                title="Завершить тест"
              >
                ✅
              </button>
              <button
                @click="handleCopyLink(test)"
                class="icon-btn"
                :disabled="!test.publicLink"
                title="Скопировать ссылку"
              >
                🔗
              </button>
              <button @click="handleDeleteTest(test)" class="icon-btn danger" title="Удалить">🗑️</button>
            </div>
          </article>
        </div>
        <p class="action-legend">
          ✏️ — редактировать тест · 🔍 — опробовать тест как ученик · ✅ — завершить тест (делает его неактивным) · 🔗 — скопировать ссылку · 🗑️ — удалить тест полностью
        </p>
        </section>

    </template>

    <div v-if="isCreateModalOpen" class="modal-overlay" @click.self="isCreateModalOpen = false">
        <div class="modal-content">
            <h3>Создать новый тест</h3>
            <p v-if="createError" class="error-message">{{ createError }}</p>

            <form @submit.prevent="handleCreateTest">
                <input
                    type="text"
                    v-model="newTest.title"
                    placeholder="Название теста"
                    required
                >
                <textarea
                    v-model="newTest.description"
                    placeholder="Описание теста (необязательно)"
                ></textarea>

                <div class="modal-actions">
                    <button type="button" @click="isCreateModalOpen = false" class="cancel-button">
                        Отмена
                    </button>
                    <button type="submit" :disabled="isLoading">
                        {{ isLoading ? 'Создание...' : 'Создать' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, onBeforeUnmount } from 'vue';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const loading = ref(false);
const error = ref(null);
const isLoading = ref(false);
const createError = ref(null);

const dashboardData = ref({
    teacherName: '',
    totalTests: 0,
    totalStudents: 0,
  averageScore: 0,
  activeTests: 0,
  completedTests: 0,
  draftTests: 0,
  recentTests: [],
  allTests: []
});

const isCreateModalOpen = ref(false);
const newTest = reactive({
    title: '',
    description: ''
});

const selectedFilter = ref('ALL');
const toastMessage = ref('');
const toastType = ref('success');
let toastTimer = null;

const filters = [
  { value: 'ALL', label: 'Все' },
  { value: 'ACTIVE', label: 'Активные' },
  { value: 'COMPLETED', label: 'Завершенные' },
  { value: 'DRAFT', label: 'Черновики' }
];

const greetingName = computed(() => dashboardData.value.teacherName || authStore.fullName || 'Преподаватель');

const filteredTests = computed(() => {
  const tests = dashboardData.value.allTests ?? [];
  if (selectedFilter.value === 'ALL') {
    return tests;
  }
  return tests.filter((test) => test.status === selectedFilter.value);
});

const formatScore = (value) => Math.round(value ?? 0);

const statusLabel = (status, includeState = false) => {
  switch (status) {
    case 'ACTIVE':
      return includeState ? 'Активен' : 'Активен';
    case 'COMPLETED':
      return includeState ? 'Завершен' : 'Завершен';
    case 'DRAFT':
    default:
      return includeState ? 'Черновик' : 'Черновик';
  }
};

const statusEmoji = (status) => {
  switch (status) {
    case 'ACTIVE':
      return '✅';
    case 'COMPLETED':
      return '📗';
    case 'DRAFT':
    default:
      return '⏳';
  }
};

const selectFilter = (value) => {
  selectedFilter.value = value;
};

const showToast = (message, type = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 3500);
};

onBeforeUnmount(() => {
  clearTimeout(toastTimer);
});

const fetchDashboardData = async () => {
    loading.value = true;
    error.value = null;
    const teacherCode = authStore.userCode;

    if (!teacherCode) {
        error.value = 'Сессия истекла. Пожалуйста, авторизуйтесь.';
        router.push({ name: 'auth' });
        loading.value = false;
        return;
    }

    try {
    const response = await axios.get('/api/dashboard/data', {
                params: {
        teacherCode
                }
            });
            dashboardData.value = response.data;
    } catch (err) {
        console.error('Ошибка загрузки дашборда:', err);
        if (err.response) {
            const status = err.response.status;
            const msg = err.response.data?.message || 'Неизвестная ошибка сервера.';
            error.value = `Ошибка сервера (${status}): ${msg}`;
        } else {
      error.value = 'Сервер недоступен. Убедитесь, что Spring Boot запущен.';
        }
    } finally {
        loading.value = false;
    }
};

const openCreateModal = () => {
    newTest.title = '';
    newTest.description = '';
    createError.value = null;
    isCreateModalOpen.value = true;
};

const handleCreateTest = async () => {
    isLoading.value = true;
    createError.value = null;

    try {
    const response = await axios.post('/api/tests', {
            title: newTest.title,
            description: newTest.description,
            questions: []
        }, {
            params: {
                teacherCode: authStore.userCode
            }
        });

        isCreateModalOpen.value = false;
    showToast('Тест создан. Перенаправляю на редактирование.');
    router.push({ name: 'test-edit', params: { id: response.data.id } });
    } catch (err) {
        console.error('Ошибка создания теста:', err);
    if (err.response?.data?.message) {
             createError.value = err.response.data.message;
        } else {
      createError.value = 'Ошибка создания теста. Проверьте соединение.';
        }
    } finally {
        isLoading.value = false;
    }
};

const handleEditTest = (test) => {
  router.push({ name: 'test-edit', params: { id: test.id } });
};

const handleViewStats = (test) => {
  router.push({ name: 'test-edit', params: { id: test.id }, query: { view: 'stats' } });
};

const handleCopyLink = async (test) => {
  if (!test.publicLink) {
    showToast('Ссылка появится после публикации теста.', 'error');
    return;
  }

  const link = `${window.location.origin}/test/${test.publicLink}`;
  try {
    await navigator.clipboard.writeText(link);
    showToast('Ссылка скопирована');
  } catch {
    showToast('Не удалось скопировать ссылку', 'error');
  }
};

const handleDeleteTest = async (test) => {
  if (!confirm(`Удалить тест «${test.title}»?`)) {
    return;
  }

  try {
    await axios.delete(`/api/tests/${test.id}`, {
      params: {
        teacherCode: authStore.userCode
      }
    });
    showToast('Тест удалён');
    await fetchDashboardData();
  } catch (err) {
    console.error('Ошибка удаления теста:', err);
    showToast('Не удалось удалить тест', 'error');
  }
};

const handleFinishTest = async (test) => {
  if (test.status === 'COMPLETED' || test.status === 'DRAFT') {
    return;
  }
  if (!confirm(`Завершить тест «${test.title}»? Студенты больше не смогут его проходить.`)) {
    return;
  }

  try {
    await axios.post(`/api/tests/${test.id}/finish`, null, {
      params: {
        teacherCode: authStore.userCode
      }
    });
    showToast('Тест завершен');
    await fetchDashboardData();
  } catch (err) {
    console.error('Ошибка завершения теста:', err);
    showToast('Не удалось завершить тест', 'error');
  }
};

const handleTryTest = (test) => {
  if (!test.publicLink || test.status !== 'ACTIVE') {
    return;
  }
  router.push({
    name: 'test-try',
    params: { link: test.publicLink },
    query: { testId: test.id }
  });
};

const handleLogout = () => {
    authStore.logout();
    router.push({ name: 'auth' });
};

onMounted(fetchDashboardData);
</script>

<style scoped>
.dashboard-page {
    max-width: 1200px;
    margin: 0 auto;
  padding: 32px 24px 48px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100vh;
  position: relative;
  background: radial-gradient(circle at top left, rgba(255, 251, 235, 0.6), transparent 55%),
    radial-gradient(circle at 25% 35%, rgba(254, 243, 199, 0.4), transparent 45%),
    linear-gradient(135deg, #fef9f3 0%, #fef3c7 100%);
}

.dashboard-page::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background: radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.08), transparent 45%);
  pointer-events: none;
}

.hero-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 251, 235, 0.9));
  border-radius: 28px;
  padding: 32px;
    display: flex;
    justify-content: space-between;
  flex-wrap: wrap;
  box-shadow: 0 20px 60px rgba(194, 65, 12, 0.12);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.7);
}

.hero-eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.85rem;
  color: #000;
  margin-bottom: 8px;
}

.hero-card h1 {
  font-size: 2.25rem;
  margin: 0;
  color: #000;
}

.hero-meta {
  margin-top: 12px;
  color: #000;
  font-size: 1rem;
}

.hero-actions {
  display: flex;
  gap: 12px;
    align-items: center;
  flex-wrap: wrap;
}

.btn {
    border: none;
  border-radius: 999px;
  padding: 12px 22px;
    cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
}

.btn.primary {
  background: linear-gradient(135deg, #fb923c, #fbbf24);
  color: #fff;
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.2);
  padding: 14px 32px;
  font-size: 1rem;
}

.btn.secondary {
  background: #fb923c;
  color: #fff;
}

.btn.ghost {
  background: transparent;
  color: #000;
  border: 1px solid rgba(251, 146, 60, 0.4);
}

.btn.subtle {
  background: #fff;
  color: #000;
  border: 1px solid rgba(251, 191, 36, 0.4);
}

.btn.filter {
  border-radius: 10px;
  border: 1px solid rgba(251, 191, 36, 0.3);
  padding: 8px 14px;
  background: rgba(255, 251, 235, 0.9);
  color: #000;
}

.btn.filter.active {
  border-color: #fbbf24;
  color: #000;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.2);
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.info-banner {
  padding: 16px;
  border-radius: 12px;
  background: #fff7ed;
  color: #000;
  border: 1px solid rgba(251, 191, 36, 0.3);
  text-align: center;
}

.info-banner.error {
  background: #fef2f2;
  color: #b91c1c;
  border-color: rgba(248, 113, 113, 0.4);
}

.toast {
  padding: 12px 18px;
  border-radius: 12px;
  font-weight: 600;
    text-align: center;
  background: #ecfccb;
  color: #3f6212;
}

.toast.error {
  background: #fee2e2;
  color: #b91c1c;
}

.stats-grid {
    display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.92);
  padding: 24px;
  border-radius: 22px;
  box-shadow: 0 25px 55px rgba(194, 65, 12, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.35);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 0.9rem;
  color: #b45309;
}

.stat-value {
  font-size: 2rem;
  color: #7c2d12;
}

.stat-card.compact {
  gap: 4px;
}

.status-breakdown span {
  display: block;
  color: #000;
  font-size: 0.9rem;
}

.status-breakdown.inline {
  margin-top: 12px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.status-pill-button {
  border: 1px solid rgba(251, 191, 36, 0.3);
  background: rgba(255, 251, 235, 0.9);
  color: #000;
  font-weight: 600;
  border-radius: 999px;
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s, border-color 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-pill-button.active {
  background: linear-gradient(135deg, #fbbf24, #fcd34d);
  color: #000;
  border-color: transparent;
  box-shadow: 0 3px 12px rgba(251, 191, 36, 0.25);
}

.status-pill-button:hover:not(.active) {
  background: rgba(255, 251, 235, 1);
  border-color: rgba(251, 191, 36, 0.5);
  transform: translateY(-1px);
}

.tests-panel,
.all-tests {
  background: rgba(255, 255, 255, 0.96);
  border-radius: 28px;
  padding: 32px;
  box-shadow: 0 35px 80px rgba(194, 65, 12, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.35);
  backdrop-filter: blur(12px);
}

.panel-header {
    display: flex;
    justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #7c2d12;
}

.panel-header p {
  margin: 6px 0 0;
  color: #b45309;
}

.panel-buttons {
  display: flex;
  gap: 10px;
}

.test-cards {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
}

.test-card {
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 20px;
  padding: 20px;
    display: flex;
    flex-direction: column;
  gap: 12px;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9));
}

.test-card:hover {
  border-color: rgba(251, 191, 36, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(251, 191, 36, 0.12);
}

.test-card-head {
    display: flex;
    justify-content: space-between;
  gap: 12px;
}

.test-card-head h4 {
  margin: 0;
  font-size: 1rem;
  color: #000;
}

.status-pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
  text-transform: uppercase;
}

.status-pill.active {
  background: #22c55e;
}

.status-pill.completed {
  background: #64748b;
}

.status-pill.draft {
  background: #f97316;
}

.test-card-meta {
  margin: 0;
  color: #000;
  font-size: 0.9rem;
}

.test-actions {
    display: flex;
  gap: 8px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #fff;
  cursor: pointer;
  font-size: 1rem;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.icon-btn.finish {
  color: #000;
  border-color: rgba(248, 196, 113, 0.8);
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(251, 191, 36, 0.25));
}

.icon-btn.finish:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.icon-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(251, 191, 36, 0.4);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.12);
  background: rgba(255, 251, 235, 0.9);
}

.icon-btn.finish:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(254, 243, 199, 0.4), rgba(253, 230, 138, 0.5));
  border-color: rgba(251, 191, 36, 0.5);
}

.icon-btn.danger {
  color: #ef4444;
}

.icon-btn:disabled {
  opacity: 0.5;
}

.no-tests {
  margin-top: 18px;
    text-align: center;
  color: #000;
}

.action-legend {
  margin-top: 18px;
  font-size: 0.9rem;
  color: #000;
  background: rgba(251, 191, 36, 0.1);
  padding: 12px 16px;
  border-radius: 16px;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.action-legend.subtle {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.3);
  color: #000;
}

.filter-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tests-list {
  margin-top: 16px;
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tests-list-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(226, 232, 240, 0.85);
  background: rgba(255, 255, 255, 0.9);
  flex-wrap: wrap;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.tests-list-item:hover {
  border-color: #a5b4fc;
  transform: translateY(-3px);
  box-shadow: 0 15px 35px rgba(15, 23, 42, 0.1);
}

.tests-list-meta {
  margin: 6px 0 0;
  color: #475569;
}

.tests-list-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 251, 235, 0.95));
  padding: 40px;
  border-radius: 28px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 30px 80px rgba(194, 65, 12, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.3);
  backdrop-filter: blur(16px);
}

.modal-content h3 {
  font-size: 1.5rem;
  color: #000;
  margin: 0 0 24px 0;
  font-weight: 700;
}

.modal-content input,
.modal-content textarea {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(251, 191, 36, 0.3);
  margin-bottom: 16px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.9);
  color: #000;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.modal-content input:focus,
.modal-content textarea:focus {
  outline: none;
  border-color: rgba(251, 191, 36, 0.6);
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
}

.modal-content input::placeholder,
.modal-content textarea::placeholder {
  color: #9ca3af;
}

.modal-content textarea {
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.modal-actions button {
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.modal-actions button[type='submit'] {
  background: linear-gradient(135deg, #fb923c, #fbbf24);
  color: #fff;
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.2);
}

.modal-actions button[type='submit']:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.25);
}

.modal-actions button[type='submit']:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.modal-actions .cancel-button {
  background: rgba(255, 255, 255, 0.9);
  color: #000;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.modal-actions .cancel-button:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
}

.error-message {
  background: rgba(254, 226, 226, 0.9);
  color: #000;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.9rem;
  margin-bottom: 20px;
  border: 1px solid rgba(248, 113, 113, 0.3);
}

@media (max-width: 768px) {
  .hero-card {
    padding: 20px;
  }

  .panel-buttons {
    width: 100%;
    justify-content: flex-start;
  }

  .tests-list-item {
    flex-direction: column;
  }
}
</style>


