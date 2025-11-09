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
          v-model="authData.middleName"
          placeholder="Отчество (необязательно)"
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

      <p v-if="error" class="error-message">{{ error }}</p>
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

const isLoginMode = ref(false);
const isLoading = ref(false);
const error = ref('');
const successMessage = ref('');

const authData = reactive({
    code: '',
    firstName: '',
    lastName: '',
    middleName: ''
});

const toggleMode = () => {
    isLoginMode.value = !isLoginMode.value;
    error.value = '';
    successMessage.value = '';
};

// =================================================================
// ЛОГИКА ВХОДА (ИСПРАВЛЕНО: передаем все 4 параметра в authStore.login)
// =================================================================
const handleLogin = async () => {
    error.value = '';
    successMessage.value = '';
    isLoading.value = true;

    try {
        const response = await axios.post('/api/auth/login', {
            code: authData.code
        });

        // Получаем все 4 параметра, включая middleName
        const { code, firstName, lastName, middleName } = response.data;

        // Передаем все 4 параметра в Pinia Store
        authStore.login(code, firstName, lastName, middleName);

        router.push('/dashboard');

    } catch (err) {
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
        const response = await axios.post('/api/auth/register/teacher', authData);

        if (response.data.success) {
            successMessage.value = 'Регистрация успешна! Теперь Вы можете войти.';
            Object.assign(authData, { code: '', firstName: '', lastName: '', middleName: '' });
            isLoginMode.value = true; // Переключаем на вход
        } else {
             error.value = response.data.message || 'Ошибка регистрации.';
        }

    } catch (err) {
        const message = err.response?.data?.message || 'Неизвестная ошибка регистрации.';
        error.value = message;
    } finally {
        isLoading.value = false;
    }
};
</script>

<style scoped>
/* Стили из предыдущего ответа */
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f4f4f9;
}
.auth-box {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 350px;
  text-align: center;
}
h1 {
  font-size: 1.5em;
  margin-bottom: 20px;
  color: #333;
}
input {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
button[type="submit"] {
  width: 100%;
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  margin-bottom: 15px;
}
button[type="submit"]:hover:not(:disabled) {
  background-color: #0056b3;
}
.toggle-button {
  width: 100%;
  background: none;
  color: #555;
  border: none;
  padding: 10px 0;
  cursor: pointer;
  font-size: 0.9em;
  text-decoration: underline;
}
.error-message {
  color: #e53935;
  margin-top: 15px;
  font-size: 0.9em;
}
.success-message {
  color: #4CAF50;
  margin-top: 15px;
  font-size: 0.9em;
}
</style>
