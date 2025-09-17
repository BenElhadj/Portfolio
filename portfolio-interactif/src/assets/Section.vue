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
