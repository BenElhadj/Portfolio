<template>
    <section class="section">
      <h1>{{ title }}</h1>
      <slot />
    </section>
  </template>
  
  <script setup>
  defineProps({
    title: String
  });
  </script>
  
  <style scoped>
  .section {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 2rem;
    background: #fff;
    border-bottom: 1px solid #ddd;
    scroll-snap-align: start;
  }
  </style>
  