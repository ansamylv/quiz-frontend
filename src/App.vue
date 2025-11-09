<script setup>
import { RouterView } from 'vue-router'
// Не нужно импортировать AppHeader или AppFooter, пока они не созданы.
// Достаточно импортировать RouterView из vue-router.
</script>

<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<style>
/* Глобальные стили для сброса и базовой типографики.
  Сюда можно добавить стили для всего приложения.
*/
:root {
  --color-primary: #3b82f6; /* Синий */
  --color-secondary: #10b981; /* Зеленый */
  --color-text: #1f2937; /* Темный текст */
  --color-background: #f3f4f6; /* Светлый фон */
  --color-error: #ef4444; /* Красный */
}

/* Сброс стилей браузера */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--color-background);
  color: var(--color-text);
  line-height: 1.6;
}

#app {
  /* Занимает всю доступную область */
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Общие стили для кнопок (для удобства) */
button {
  transition: background-color 0.2s;
}
</style>
