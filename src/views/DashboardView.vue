<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
        <h2>👋 Добро пожаловать, {{ authStore.fullName }}!</h2>
        <button @click="handleLogout" class="logout-button">Выход</button>
    </header>

    <div v-if="loading" class="loading-message">Загрузка данных дашборда...</div>
    <div v-else-if="error" class="error-message">Ошибка загрузки: {{ error }}</div>

    <div v-else>
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Всего тестов</h3>
                <p>{{ dashboardData.totalTests }}</p>
            </div>
            <div class="stat-card">
                <h3>Средний балл</h3>
                <p>{{ dashboardData.averageScore }}%</p>
            </div>
            <div class="stat-card">
                <h3>Учеников</h3>
                <p>{{ dashboardData.totalStudents }}</p>
            </div>
        </div>

        <section class="test-management">
            <div class="test-header">
                <h3>Ваши тесты</h3>
                <button @click="openCreateModal" class="create-button">
                    + Создать тест
                </button>
            </div>

            <div class="test-list">
                <p v-if="dashboardData.recentTests.length === 0" class="no-tests">
                    У вас пока нет ни одного созданного теста. Нажмите "Создать тест"
                </p>
                <div v-for="test in dashboardData.recentTests" :key="test.id" class="test-item">
                    <h4>{{ test.title }}</h4>
                    <span :class="['test-status', { 'status-active': test.status === 'ACTIVE' }]">
                        {{ test.status === 'ACTIVE' ? 'Активен' : 'Завершен' }}
                    </span>
                    <p class="test-meta">
                        {{ test.studentCount }} учеников | Средний балл: {{ test.averageScore }}%
                    </p>
                    <div class="actions">
                        </div>
                </div>
            </div>
        </section>
    </div>
  </div>

  <teleport to="body">
    <div v-if="isCreateModalOpen" class="modal-overlay" @click="isCreateModalOpen = false">
        <div class="modal-content" @click.stop>
            <form @submit.prevent="handleCreateTest">
                <h3>Создание нового теста</h3>
                <input type="text" v-model="newTest.title" placeholder="Название теста" required>
                <textarea v-model="newTest.description" placeholder="Краткое описание"></textarea>
                <button type="submit" class="submit-button" :disabled="isSaving">
                    {{ isSaving ? 'Сохранение...' : 'Создать' }}
                </button>
                <button type="button" class="cancel-button" @click="isCreateModalOpen = false">Отмена</button>
            </form>
        </div>
    </div>
  </teleport>

</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const error = ref(null);
const isSaving = ref(false); // Для отслеживания состояния сохранения теста

const isCreateModalOpen = ref(false);
const newTest = reactive({
    title: '',
    description: ''
});

// Структура данных для дашборда, соответствует DashboardDTO с бэкенда
const dashboardData = reactive({
    teacherName: '',
    totalTests: 0,
    totalStudents: 0,
    averageScore: 0.0,
    recentTests: []
});

// =================================================================
// 1. ЛОГИКА ЗАГРУЗКИ ДАННЫХ ДАШБОРДА
// =================================================================
const fetchDashboardData = async () => {
    // В userCode хранится код преподавателя, который нужен бэкенду
    const userCode = authStore.userCode;

    if (!userCode) {
        error.value = "Ошибка: Код преподавателя не найден.";
        loading.value = false;
        return;
    }

    loading.value = true;
    error.value = null;

    try {
        // Запрос к бэкенду для получения DashboardDTO
        const response = await axios.get(`/api/dashboard/data`, {
             params: {
                 teacherCode: userCode
             }
        });

        // Обновляем реактивные данные
        Object.assign(dashboardData, response.data);

    } catch (err) {
        console.error('Ошибка загрузки дашборда:', err);
        error.value = 'Не удалось загрузить данные дашборда.';
    } finally {
        loading.value = false;
    }
};

// =================================================================
// 2. ЛОГИКА СОЗДАНИЯ НОВОГО ТЕСТА
// =================================================================
const openCreateModal = () => {
    newTest.title = '';
    newTest.description = '';
    isCreateModalOpen.value = true;
};

const handleCreateTest = async () => {
    isSaving.value = true;
    error.value = null;

    // Объект запроса соответствует CreateTestRequest с бэкенда
    const createRequest = {
        title: newTest.title,
        description: newTest.description
    };

    try {
        // Запрос на создание теста
        const response = await axios.post(`/api/tests`, createRequest, {
             params: {
                 teacherCode: authStore.userCode // Передаем код преподавателя
             }
        });

        // 1. Обновляем список тестов, чтобы увидеть новый
        await fetchDashboardData();

        // 2. Закрываем модальное окно
        isCreateModalOpen.value = false;

        // 3. (Опционально) Перенаправляем на страницу редактирования нового теста
        router.push(`/tests/${response.data.id}/edit`);

    } catch (err) {
        console.error('Ошибка создания теста:', err);
        error.value = err.response?.data?.message || 'Ошибка при создании теста.';
    } finally {
        isSaving.value = false;
    }
};

// =================================================================
// 3. ЛОГИКА ВЫХОДА
// =================================================================
const handleLogout = () => {
    authStore.logout();
    router.push('/auth');
};

// =================================================================
// 4. ЖИЗНЕННЫЙ ЦИКЛ
// =================================================================
onMounted(fetchDashboardData);
</script>

<style scoped>
/* Стили для DashboardView */
.dashboard-container {
    padding: 20px;
    max-width: 1200px;
    margin: 40px auto;
    font-family: Arial, sans-serif;
}
.dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    border-bottom: 2px solid #ddd;
    padding-bottom: 15px;
}
h2 { color: #333; margin: 0; font-size: 1.8em; }
.logout-button {
    background-color: #f44336;
    color: white;
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
    transition: background-color 0.2s;
}
.logout-button:hover { background-color: #d32f2f; }

/* ----------------- СТАТИСТИКА ----------------- */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}
.stat-card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    border-left: 5px solid #007bff;
}
.stat-card h3 {
    margin-top: 0;
    font-size: 1.1em;
    color: #555;
}
.stat-card p {
    font-size: 2em;
    font-weight: bold;
    color: #333;
    margin: 5px 0 0;
}

/* ----------------- УПРАВЛЕНИЕ ТЕСТАМИ ----------------- */
.test-management {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.test-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
.create-button {
    background-color: #28a745;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
}
.create-button:hover { background-color: #1e7e34; }

.test-item {
    padding: 15px;
    border: 1px solid #eee;
    border-radius: 4px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.test-item h4 {
    flex-grow: 1;
    margin: 0;
    font-size: 1.1em;
}
.test-meta {
    font-size: 0.9em;
    color: #777;
    margin: 0 20px;
}
.test-status {
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 0.75em;
    font-weight: bold;
    color: white;
    background-color: #6c757d; /* Completed */
}
.status-active {
    background-color: #28a745; /* Active */
}

.no-tests {
    text-align: center;
    padding: 30px;
    color: #777;
    font-style: italic;
}
.error-message { color: #d32f2f; padding: 20px; text-align: center; }

/* ----------------- МОДАЛЬНОЕ ОКНО ----------------- */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}
.modal-content {
    background: white;
    padding: 30px;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}
.modal-content h3 { margin-top: 0; margin-bottom: 20px; }
.modal-content input, .modal-content textarea {
    width: 100%;
    padding: 10px;
    margin-bottom: 15px;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
    resize: vertical;
}
.submit-button {
    background-color: #007bff;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-right: 10px;
}
.cancel-button {
    background: #6c757d;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
</style>
