<template>
  <div class="not-found-container">
    <h1>404</h1>
    <h2>Страница не найдена</h2>
    <p>
      Извините, мы не смогли найти страницу, которую вы искали.
    </p>
    <router-link to="/dashboard" class="home-link">
      Перейти на главную страницу (Дашборд)
    </router-link>
  </div>
</template>

<script setup>
</script>

<style scoped>
.not-found-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  background-color: #f8f8f8;
  color: #333;
}
h1 {
  font-size: 6em;
  margin: 0;
  color: #e53935;
}
h2 {
  font-size: 2em;
  margin-top: 10px;
  margin-bottom: 20px;
}
p {
  font-size: 1.1em;
  margin-bottom: 30px;
}
.home-link {
  color: #007bff;
  text-decoration: none;
  font-weight: bold;
}
.home-link:hover {
  text-decoration: underline;
}
</style>
