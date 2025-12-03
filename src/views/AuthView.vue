<template>
  <div class="auth-container">
    <div class="auth-box">
      <h1>
        {{ isLoginMode ? 'Вход для преподавателя' : 'Регистрация преподавателя' }}
      </h1>

      <form v-if="isLoginMode" @submit.prevent="handleLogin">
        <input
          type="text"
          v-model="authData.code"
          placeholder="Введите код преподавателя"
          required
        >
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Вход...' : 'Войти в систему' }}
        </button>
      </form>

      <form v-else @submit.prevent="handleRegister">
        <input
          type="text"
          v-model="authData.lastName"
          placeholder="Фамилия"
          required
        >
        <input
          type="text"
          v-model="authData.firstName"
          placeholder="Имя"
          required
        >
        <input
          type="text"
          v-model="authData.code"
          placeholder="Придумайте код (логин)"
          required
        >
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Регистрация...' : 'Зарегистрироваться' }}
        </button>
      </form>

      <p v-if="error" class="error-message">Ошибка: {{ error }}</p>
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

      <button @click="toggleMode" class="toggle-button">
        {{ isLoginMode ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти' }}
      </button>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const isLoginMode = ref(true);
const isLoading = ref(false);
const error = ref('');
const successMessage = ref('');

const authData = reactive({
    code: '',
    firstName: '',
    lastName: ''
});

const toggleMode = () => {
    isLoginMode.value = !isLoginMode.value;
    error.value = '';
    successMessage.value = '';
    Object.assign(authData, { code: '', firstName: '', lastName: '' });
};

// =================================================================
// ЛОГИКА ВХОДА
// =================================================================
const handleLogin = async () => {
    error.value = '';
    successMessage.value = '';
    isLoading.value = true;

    try {
        // 🛑 КОРРЕКЦИЯ: URL изменен на /auth/login, чтобы соответствовать
        // @RequestMapping("/auth") и @PostMapping("/login") в AuthorizationController
        const response = await axios.post('/api/auth/login', {
            code: authData.code
        });

        // ✅ Ожидаем AuthorizationResponse (UserResponse) в теле ответа
        const { code, firstName, lastName, middleName } = response.data;

        authStore.login(
            code, // Используем код, который вернул бэкенд
            firstName,
            lastName,
            middleName
        );

        router.push('/dashboard');

    } catch (err) {
        console.error('Ошибка входа:', err);
        // Получаем сообщение об ошибке из тела ответа бэкенда (err.response.data.message)
        const message = err.response?.data?.message || 'Ошибка входа. Проверьте код.';
        error.value = message;
    } finally {
        isLoading.value = false;
    }
};

// =================================================================
// ЛОГИКА РЕГИСТРАЦИИ
// =================================================================
const handleRegister = async () => {
    error.value = '';
    successMessage.value = '';
    isLoading.value = true;

    if (!authData.code || !authData.firstName || !authData.lastName) {
        error.value = 'Пожалуйста, заполните обязательные поля.';
        isLoading.value = false;
        return;
    }

    try {
        // 🛑 КОРРЕКЦИЯ: URL изменен на /auth/register/teacher
        const response = await axios.post('/api/auth/register/teacher', {
            code: authData.code,
            firstName: authData.firstName,
            lastName: authData.lastName
        });

        // Бэкенд должен вернуть ответ, сигнализирующий об успехе
        // В AuthorizationController мы возвращали AuthorizationResponse

        // Временная логика (если бэкенд возвращает только 200 OK):
        successMessage.value = 'Регистрация успешна! Теперь Вы можете войти.';

        // Сохраняем введенный код и переключаемся на вход
        const registeredCode = authData.code;
        Object.assign(authData, { code: registeredCode, firstName: '', lastName: '' });
        isLoginMode.value = true;

    } catch (err) {
        console.error('Ошибка регистрации:', err);
        const message = err.response?.data?.message || 'Неизвестная ошибка регистрации.';
        error.value = message;
    } finally {
        isLoading.value = false;
    }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  position: relative;
  background: radial-gradient(circle at top left, rgba(255, 237, 213, 0.6), transparent 55%),
    radial-gradient(circle at 25% 35%, rgba(255, 247, 237, 0.5), transparent 45%),
    radial-gradient(circle at 80% 20%, rgba(254, 243, 199, 0.4), transparent 45%),
    linear-gradient(135deg, #fef9f3 0%, #fef3c7 100%);
  overflow: hidden;
}

.auth-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.08), transparent 45%);
  pointer-events: none;
}

.auth-box {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 251, 235, 0.9));
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 30px 70px rgba(194, 65, 12, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  backdrop-filter: blur(12px);
  width: 100%;
  max-width: 400px;
  text-align: center;
  position: relative;
  z-index: 1;
}

h1 {
  font-size: 1.75rem;
  margin-bottom: 28px;
  color: #000;
  font-weight: 700;
}

input {
  width: 100%;
  padding: 14px 16px;
  margin-bottom: 16px;
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 12px;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  color: #000;
}

input:focus {
  outline: none;
  border-color: rgba(251, 191, 36, 0.6);
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
}

input::placeholder {
  color: #9ca3af;
}

button[type="submit"] {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #fb923c, #fbbf24);
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.2);
}

button[type="submit"]:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.25);
}

button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.toggle-button {
  width: 100%;
  background: none;
  color: #000;
  border: none;
  padding: 12px 0;
  cursor: pointer;
  font-size: 0.9em;
  text-decoration: none;
  transition: color 0.2s;
  border-radius: 8px;
}

.toggle-button:hover {
  color: #000;
  text-decoration: underline;
  opacity: 0.8;
}

.error-message {
  color: #dc2626;
  margin-top: 16px;
  font-size: 0.9em;
  padding: 12px;
  background: rgba(254, 226, 226, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(248, 113, 113, 0.3);
}

.success-message {
  color: #059669;
  margin-top: 16px;
  font-size: 0.9em;
  padding: 12px;
  background: rgba(209, 250, 229, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
</style>