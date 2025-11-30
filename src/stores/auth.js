import { defineStore } from 'pinia'
import { ref } from 'vue'

const buildFullName = (firstName, lastName, middleName) => {
  return [firstName, lastName, middleName]
    .filter(Boolean)
    .join(' ')
    .trim()
}

export const useAuthStore = defineStore('auth', () => {
  // 1. Состояние (State) - читаем из LocalStorage при запуске
  const userCode = ref(localStorage.getItem('userCode') || null)
  const firstName = ref(localStorage.getItem('firstName') || null)
  const lastName = ref(localStorage.getItem('lastName') || null)
  const middleName = ref(localStorage.getItem('middleName') || null)

  // 2. Геттеры (Getters) - вычисляемые значения
  const isAuthenticated = ref(!!userCode.value)

  const fullName = ref(buildFullName(firstName.value, lastName.value, middleName.value))

  // 3. Действия (Actions)

  // Вход/Регистрация
  const login = (code, fName, lName, mName) => {
    userCode.value = code
    firstName.value = fName
    lastName.value = lName
    middleName.value = mName
    isAuthenticated.value = true
    fullName.value = buildFullName(fName, lName, mName);

    // Сохраняем в localStorage для сохранения сессии при перезагрузке
    localStorage.setItem('userCode', code)
    localStorage.setItem('firstName', fName)
    localStorage.setItem('lastName', lName)
    localStorage.setItem('middleName', mName || '')
  }

  // Выход
  const logout = () => {
    userCode.value = null
    firstName.value = null
    lastName.value = null
    middleName.value = null
    isAuthenticated.value = false
    fullName.value = ''

    localStorage.removeItem('userCode')
    localStorage.removeItem('firstName')
    localStorage.removeItem('lastName')
    localStorage.removeItem('middleName')
  }

  return { userCode, firstName, lastName, middleName, fullName, isAuthenticated, login, logout }
})
