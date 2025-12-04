<template>
  <div class="test-edit-page">
    <div class="test-edit-container">
      <router-link to="/dashboard" class="back-link">
        &larr; Назад к дашборду
      </router-link>

      <div class="page-header">
        <h1>Редактирование теста «{{ testTitle }}»</h1>
      </div>

      <div v-if="testDetailsLoading" class="info-banner">Загрузка данных теста...</div>
      <div v-else-if="testDetailsError" class="info-banner error">{{ testDetailsError }}</div>

      <div v-else class="test-info-card">
        <div class="test-info-header">
          <span :class="['status-badge', getStatusClass()]">
            {{ getStatusText() }}
          </span>
        </div>

        <form @submit.prevent="handleUpdateTest" class="edit-form">
          <div class="form-group">
            <label for="test-title">Название теста:</label>
            <input
              id="test-title"
              type="text"
              v-model="editTitle"
              required
              class="form-input"
              placeholder="Введите название теста"
            />
          </div>

          <div class="form-group">
            <label for="test-description">Описание:</label>
            <textarea
              id="test-description"
              v-model="editDescription"
              class="form-textarea"
              placeholder="Введите описание теста (необязательно)"
              rows="4"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" :disabled="isUpdating" class="btn save-btn">
              {{ isUpdating ? 'Сохранение...' : '💾 Сохранить изменения' }}
            </button>
            <button type="button" @click="cancelEdit" class="btn cancel-btn">
              Отмена
            </button>
          </div>
        </form>

        <div class="questions-section">
          <div class="section-header">
            <h3>Вопросы теста ({{ questions.length }})</h3>
            <button @click="showAddQuestionForm = !showAddQuestionForm" class="btn add-question-btn">
              {{ showAddQuestionForm ? '✖️ Отмена' : '➕ Добавить вопрос' }}
            </button>
          </div>

          <div v-if="showAddQuestionForm" class="add-question-form">
            <div class="form-group">
              <label>Текст вопроса:</label>
              <input
                v-model="newQuestion.text"
                type="text"
                class="form-input"
                placeholder="Введите текст вопроса"
                required
              />
            </div>

            <div class="form-group">
              <label>Тип вопроса:</label>
              <select v-model="newQuestion.type" class="form-input" required>
                <option value="SINGLE">Один правильный ответ</option>
                <option value="MULTIPLE">Несколько правильных ответов</option>
                <option value="TEXT">Текстовый ответ</option>
              </select>
            </div>

            <div v-if="newQuestion.type !== 'TEXT'" class="answers-section">
              <label>Варианты ответов:</label>
              <div
                v-for="(answer, index) in newQuestion.answers"
                :key="index"
                class="answer-item"
              >
                <input
                  v-model="answer.text"
                  type="text"
                  class="form-input"
                  :placeholder="`Вариант ${index + 1}`"
                  required
                />
                <label class="checkbox-label">
                  <input
                    v-model="answer.correct"
                    type="checkbox"
                    :disabled="newQuestion.type === 'SINGLE' && getCorrectAnswersCount() > 0 && !answer.correct"
                  />
                  Правильный
                </label>
                <button
                  type="button"
                  @click="removeAnswer(index)"
                  class="btn remove-btn"
                  v-if="newQuestion.answers.length > 1"
                >
                  ✖️
                </button>
              </div>
              <button
                type="button"
                @click="addAnswer"
                class="btn add-answer-btn"
                v-if="newQuestion.type !== 'TEXT'"
              >
                ➕ Добавить вариант
              </button>
            </div>

            <div class="form-actions">
              <button
                type="button"
                @click="handleAddQuestion"
                :disabled="isAddingQuestion"
                class="btn save-btn"
              >
                {{ isAddingQuestion ? 'Добавление...' : '💾 Добавить вопрос' }}
              </button>
              <button
                type="button"
                @click="cancelAddQuestion"
                class="btn cancel-btn"
              >
                Отмена
              </button>
            </div>
          </div>

          <div v-if="questions.length === 0" class="no-questions">
            <p>Вопросов пока нет. Добавьте первый вопрос!</p>
          </div>

          <div v-else class="questions-list">
            <div
              v-for="(question, index) in questions"
              :key="question.id"
              class="question-item"
            >
              <div class="question-header">
                <span class="question-number">Вопрос {{ index + 1 }}:</span>
                <button
                  @click="deleteQuestion(question.id)"
                  class="btn delete-question-btn"
                  title="Удалить вопрос"
                >
                  🗑️
                </button>
              </div>
              <p class="question-text">{{ question.text }}</p>
              <p class="question-type">Тип: {{ getQuestionTypeText(question.type) }}</p>
              <div v-if="question.answers && question.answers.length > 0" class="question-answers">
                <p class="answers-label">Варианты ответов:</p>
                <ul>
                  <li
                    v-for="answer in question.answers"
                    :key="answer.id"
                    :class="['answer-option', answer.isCorrect ? 'correct' : '']"
                  >
                    {{ answer.text }}
                    <span v-if="answer.isCorrect" class="correct-mark">✓ Правильный</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="test-info-details">
          <div v-if="publicLink" class="info-row">
            <span class="info-label">Публичная ссылка:</span>
            <span class="info-value link-value" @click="copyPublicLink">{{ publicLink }}</span>
          </div>
        </div>

        <div class="test-actions-section">
          <button
            v-if="!isPublished && questions.length > 0"
            @click="handlePublishTest"
            :disabled="isPublishing"
            class="btn publish-btn"
          >
            {{ isPublishing ? 'Публикация...' : '📢 Опубликовать тест' }}
          </button>

          <button
            v-if="isPublished && publicLink"
            @click="handleTryTest"
            class="btn try-btn"
          >
            🔍 Опробовать как ученик
          </button>

          <button
            v-if="isPublished && isActive"
            @click="handleCompleteTest"
            :disabled="isCompleting"
            class="btn complete-btn"
          >
            {{ isCompleting ? 'Завершение...' : '✅ Завершить тест' }}
          </button>

          <p v-if="isPublished && !isActive" class="status-message completed">
            ⏹️ Тест завершен. Ученики больше не могут его проходить.
          </p>
        </div>

        <div class="test-stats-section" v-if="statsLoaded">
          <h2>Результаты по тесту</h2>
          <div class="stats-summary">
            <p><strong>Всего прохождений:</strong> {{ testStats.completedSessions }}</p>
            <p><strong>Активных сессий:</strong> {{ testStats.activeSessions }}</p>
            <p><strong>Средний результат:</strong> {{ Math.round(testStats.averageScore) }}%</p>
          </div>

          <div v-if="testStats.studentResults && testStats.studentResults.length" class="stats-table-wrapper">
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Студент</th>
                  <th>Группа</th>
                  <th>Результат, %</th>
                  <th>Дата прохождения</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="res in testStats.studentResults" :key="res.studentName + res.completedAt">
                  <td>{{ res.studentName }}</td>
                  <td>{{ res.group }}</td>
                  <td>{{ Math.round(res.score) }}</td>
                  <td>{{ formatDateTime(res.completedAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p v-else class="no-questions">Пока нет завершённых прохождений этого теста.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const testId = route.params.id;

const testTitle = ref('Загрузка...');
const testDescription = ref('');
const publicLink = ref(null);
const isActive = ref(false);
const isPublished = ref(false);
const isCompleting = ref(false);
const isUpdating = ref(false);
const isPublishing = ref(false);
const isAddingQuestion = ref(false);

const editTitle = ref('');
const editDescription = ref('');
const questions = ref([]);
const showAddQuestionForm = ref(false);

const newQuestion = ref({
  text: '',
  type: 'SINGLE',
  answers: [{ text: '', correct: false }, { text: '', correct: false }]
});

const testDetailsLoading = ref(false);
const testDetailsError = ref(null);

const testStatsLoading = ref(false);
const testStatsError = ref(null);
const testStats = ref({
  completedSessions: 0,
  activeSessions: 0,
  averageScore: 0,
  studentResults: []
});
const statsLoaded = ref(false);

const getStatusText = () => {
  if (!isPublished.value) return 'Черновик';
  if (isActive.value) return 'Активен';
  return 'Завершен';
};

const getStatusClass = () => {
  if (!isPublished.value) return 'draft';
  if (isActive.value) return 'active';
  return 'completed';
};

const getQuestionTypeText = (type) => {
  const types = {
    SINGLE: 'Один правильный ответ',
    MULTIPLE: 'Несколько правильных ответов',
    TEXT: 'Текстовый ответ'
  };
  return types[type] || type;
};

const getCorrectAnswersCount = () => {
  return newQuestion.value.answers.filter(a => a.correct).length;
};

const addAnswer = () => {
  newQuestion.value.answers.push({ text: '', correct: false });
};

const removeAnswer = (index) => {
  newQuestion.value.answers.splice(index, 1);
};

const cancelAddQuestion = () => {
  newQuestion.value = {
    text: '',
    type: 'SINGLE',
    answers: [{ text: '', correct: false }, { text: '', correct: false }]
  };
  showAddQuestionForm.value = false;
};

const fetchTestDetails = async () => {
  testDetailsLoading.value = true;
  testDetailsError.value = null;

  try {
    const response = await axios.get(`/api/tests/${testId}`, {
      params: {
        teacherCode: authStore.userCode
      }
    });

    testTitle.value = response.data.title;
    testDescription.value = response.data.description || '';
    publicLink.value = response.data.publicLink;
    isActive.value = response.data.isActive;
    isPublished.value = response.data.isPublished;
    questions.value = response.data.questions || [];

    editTitle.value = response.data.title;
    editDescription.value = response.data.description || '';

  } catch (err) {
    console.error('Ошибка загрузки данных теста:', err);
    console.error('Response:', err.response);
    console.error('Status:', err.response?.status);
    console.error('Data:', err.response?.data);
    
    if (err.response?.status === 404) {
      testDetailsError.value = 'Тест не найден. Проверьте, что тест существует и у вас есть к нему доступ.';
    } else if (err.response?.status === 403) {
      testDetailsError.value = 'У вас нет прав для доступа к этому тесту.';
    } else {
      testDetailsError.value = err.response?.data?.message || `Не удалось загрузить данные теста. ${err.response?.status ? `Статус: ${err.response.status}` : 'Проверьте соединение с сервером.'}`;
    }
    testTitle.value = "Ошибка загрузки";
  } finally {
    testDetailsLoading.value = false;
  }
  fetchTestStats();
};

const fetchTestStats = async () => {
  testStatsLoading.value = true;
  testStatsError.value = null;
  statsLoaded.value = false;

  try {
    const response = await axios.get(`/api/tests/${testId}/stats`, {
      params: {
        teacherCode: authStore.userCode
      }
    });
    testStats.value = response.data;
    statsLoaded.value = true;
  } catch (err) {
    console.error('Ошибка загрузки статистики теста:', err);
    testStatsError.value = err.response?.data?.message || 'Не удалось загрузить статистику.';
  } finally {
    testStatsLoading.value = false;
  }
};

const handleUpdateTest = async () => {
  isUpdating.value = true;
  testDetailsError.value = null;

  try {
    const response = await axios.put(`/api/tests/${testId}`, {
      title: editTitle.value,
      description: editDescription.value
    }, {
      params: {
        teacherCode: authStore.userCode
      }
    });

    testTitle.value = response.data.title;
    testDescription.value = response.data.description || '';
    isActive.value = response.data.isActive;
    isPublished.value = response.data.isPublished;

    alert('Тест успешно обновлен!');
  } catch (err) {
    console.error('Ошибка обновления теста:', err);
    testDetailsError.value = err.response?.data?.message || 'Не удалось обновить тест.';
  } finally {
    isUpdating.value = false;
  }
};

const handleAddQuestion = async () => {
  if (!newQuestion.value.text.trim()) {
    alert('Введите текст вопроса');
    return;
  }

  if (newQuestion.value.type !== 'TEXT') {
    const validAnswers = newQuestion.value.answers.filter(a => a.text.trim());
    if (validAnswers.length < 2) {
      alert('Добавьте хотя бы 2 варианта ответа');
      return;
    }
    const correctCount = validAnswers.filter(a => a.correct).length;
    if (correctCount === 0) {
      alert('Выберите хотя бы один правильный ответ');
      return;
    }
    if (newQuestion.value.type === 'SINGLE' && correctCount > 1) {
      alert('Для типа "Один правильный ответ" выберите только один правильный вариант');
      return;
    }
  }

  isAddingQuestion.value = true;
  testDetailsError.value = null;

  try {
    const questionData = {
      text: newQuestion.value.text,
      type: newQuestion.value.type,
      answers: newQuestion.value.type === 'TEXT' ? [] : newQuestion.value.answers.filter(a => a.text.trim())
    };

    const response = await axios.post(`/api/tests/${testId}/questions`, [questionData], {
      params: {
        teacherCode: authStore.userCode
      }
    });

    questions.value = response.data.questions || [];
    cancelAddQuestion();
    alert('Вопрос успешно добавлен!');
  } catch (err) {
    console.error('Ошибка добавления вопроса:', err);
    testDetailsError.value = err.response?.data?.message || 'Не удалось добавить вопрос.';
  } finally {
    isAddingQuestion.value = false;
  }
};

const deleteQuestion = async (questionId) => {
  if (!confirm('Вы уверены, что хотите удалить этот вопрос?')) {
    return;
  }

  try {
    await axios.delete(`/api/tests/${testId}/questions/${questionId}`, {
      params: {
        teacherCode: authStore.userCode
      }
    });
    await fetchTestDetails();
    alert('Вопрос удален');
  } catch (err) {
    console.error('Ошибка удаления вопроса:', err);
    alert('Не удалось удалить вопрос');
  }
};

const handlePublishTest = async () => {
  if (!confirm('Опубликовать тест? После публикации студенты смогут его проходить.')) {
    return;
  }

  isPublishing.value = true;
  testDetailsError.value = null;

  try {
    const response = await axios.post(`/api/tests/${testId}/publish`, null, {
      params: {
        teacherCode: authStore.userCode,
        publish: true
      }
    });

    isPublished.value = response.data.isPublished;
    isActive.value = response.data.isActive;
    alert('Тест успешно опубликован!');
  } catch (err) {
    console.error('Ошибка публикации теста:', err);
    testDetailsError.value = err.response?.data?.message || 'Не удалось опубликовать тест.';
  } finally {
    isPublishing.value = false;
  }
};

const handleCompleteTest = async () => {
  if (!confirm(`Вы уверены, что хотите завершить тест "${testTitle.value}"? Это действие необратимо для прохождения.`)) {
    return;
  }

  isCompleting.value = true;
  testDetailsError.value = null;

  try {
    await axios.post(`/api/tests/${testId}/finish`, null, {
      params: {
        teacherCode: authStore.userCode
      }
    });

    isActive.value = false;
    await fetchTestDetails();
  } catch (err) {
    console.error('Ошибка завершения теста:', err);
    testDetailsError.value = err.response?.data?.message || 'Не удалось завершить тест.';
  } finally {
    isCompleting.value = false;
  }
};

const handleTryTest = () => {
  if (!publicLink.value) {
    return;
  }
  router.push({ name: 'test-try', params: { link: publicLink.value } });
};

const cancelEdit = () => {
  editTitle.value = testTitle.value;
  editDescription.value = testDescription.value;
};

const copyPublicLink = async () => {
  if (!publicLink.value) return;
  
  const link = `${window.location.origin}/test/${publicLink.value}`;
  try {
    await navigator.clipboard.writeText(link);
    alert('Ссылка скопирована в буфер обмена');
  } catch {
    alert('Не удалось скопировать ссылку');
  }
};

const formatDateTime = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const dd = d.toLocaleDateString();
  const tt = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${dd} ${tt}`;
};

onMounted(fetchTestDetails);
</script>

<style scoped>
.test-edit-page {
  min-height: 100vh;
  position: relative;
  background: radial-gradient(circle at top left, rgba(255, 251, 235, 0.6), transparent 55%),
    radial-gradient(circle at 25% 35%, rgba(254, 243, 199, 0.4), transparent 45%),
    linear-gradient(135deg, #fef9f3 0%, #fef3c7 100%);
  padding: 32px 24px 48px;
}

.test-edit-page::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  background: radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.08), transparent 45%);
  pointer-events: none;
}

.test-edit-container {
  max-width: 900px;
  margin: 0 auto;
}

.back-link {
  display: inline-flex;
  align-items: center;
  margin-bottom: 24px;
  color: #000;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: opacity 0.2s;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
}

.back-link:hover {
  opacity: 0.7;
  background: rgba(255, 255, 255, 0.9);
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 2rem;
  color: #000;
  margin: 0;
  font-weight: 700;
}

.info-banner {
  padding: 16px;
  border-radius: 12px;
  background: #fff7ed;
  color: #000;
  border: 1px solid rgba(251, 191, 36, 0.3);
  text-align: center;
  margin-bottom: 24px;
}

.info-banner.error {
  background: #fee2e2;
  color: #000;
  border-color: rgba(248, 113, 113, 0.4);
}

.test-info-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 251, 235, 0.9));
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(194, 65, 12, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.3);
  backdrop-filter: blur(12px);
  margin-bottom: 24px;
}

.test-info-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(251, 191, 36, 0.3);
}

.status-badge {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #000;
}

.status-badge.active {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 1px solid rgba(251, 191, 36, 0.4);
}

.status-badge.completed {
  background: rgba(226, 232, 240, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.4);
}

.status-badge.draft {
  background: rgba(254, 243, 199, 0.6);
  border: 1px solid rgba(251, 191, 36, 0.4);
}

.edit-form {
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #000;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(251, 191, 36, 0.3);
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.9);
  color: #000;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: rgba(251, 191, 36, 0.6);
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #9ca3af;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.save-btn {
  background: linear-gradient(135deg, #fb923c, #fbbf24);
  color: #fff;
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.2);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.25);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #000;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
}

.questions-section {
  margin-top: 32px;
  padding-top: 32px;
  border-top: 1px solid rgba(251, 191, 36, 0.3);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h3 {
  font-size: 1.25rem;
  color: #000;
  margin: 0;
  font-weight: 700;
}

.add-question-btn {
  background: linear-gradient(135deg, #fb923c, #fbbf24);
  color: #fff;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);
}

.add-question-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.25);
}

.add-question-form {
  background: rgba(255, 251, 235, 0.6);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(251, 191, 36, 0.3);
  margin-bottom: 24px;
}

.answers-section {
  margin-top: 16px;
}

.answer-item {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.answer-item .form-input {
  flex: 1;
  margin-bottom: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #000;
  white-space: nowrap;
}

.add-answer-btn {
  background: rgba(255, 255, 255, 0.9);
  color: #000;
  border: 1px solid rgba(251, 191, 36, 0.3);
  padding: 8px 16px;
  font-size: 0.9rem;
}

.remove-btn {
  background: #fee2e2;
  color: #000;
  padding: 8px 12px;
  font-size: 0.9rem;
}

.no-questions {
  text-align: center;
  padding: 40px;
  color: #000;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-item {
  background: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.question-number {
  font-weight: 600;
  color: #000;
}

.delete-question-btn {
  background: #fee2e2;
  color: #000;
  padding: 6px 12px;
  font-size: 0.9rem;
}

.question-text {
  color: #000;
  font-size: 1rem;
  margin: 8px 0;
}

.question-type {
  color: #000;
  font-size: 0.9rem;
  margin: 8px 0;
  opacity: 0.7;
}

.question-answers {
  margin-top: 12px;
}

.answers-label {
  font-weight: 600;
  color: #000;
  margin-bottom: 8px;
}

.question-answers ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.answer-option {
  padding: 8px 12px;
  margin-bottom: 6px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  color: #000;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.answer-option.correct {
  background: rgba(220, 252, 231, 0.6);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.correct-mark {
  color: #16a34a;
  font-weight: 600;
  font-size: 0.85rem;
}

.test-info-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(251, 191, 36, 0.3);
}

.info-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.info-label {
  font-weight: 600;
  color: #000;
  min-width: 140px;
}

.info-value {
  color: #000;
  flex: 1;
}

.link-value {
  color: #000;
  cursor: pointer;
  text-decoration: underline;
  transition: opacity 0.2s;
}

.link-value:hover {
  opacity: 0.7;
}

.test-actions-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid rgba(251, 191, 36, 0.3);
}

.publish-btn {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: #fff;
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.2);
}

.publish-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.25);
}

.complete-btn {
  background: linear-gradient(135deg, #fb923c, #fbbf24);
  color: #fff;
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.2);
}

.complete-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(249, 115, 22, 0.25);
}

.complete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.status-message {
  padding: 16px;
  border-radius: 12px;
  color: #000;
  font-weight: 500;
  margin: 0;
}

.status-message.completed {
  background: rgba(226, 232, 240, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.4);
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .answer-item {
    flex-direction: column;
    align-items: stretch;
  }

  .info-row {
    flex-direction: column;
    gap: 4px;
  }

  .info-label {
    min-width: auto;
  }
}
</style>
