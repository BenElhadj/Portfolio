<template>
  <div class="navbar">

    <!-- Toggle Dark/Light -->
    <button class="theme-toggle" @click="toggleTheme">
      <span v-if="theme === 'light'">🌙</span>
      <span v-else>☀️</span>
    </button>
    <!-- Sélecteur de langues -->
    <div class="lang-switcher">
      <img src="/flags/fr.svg" alt="FR" :class="{ active: locale === 'fr' }" @click="changeLang('fr')" />
      <img src="/flags/en.svg" alt="EN" :class="{ active: locale === 'en' }" @click="changeLang('en')" />
      <img src="/flags/ar.svg" alt="AR" :class="{ active: locale === 'ar' }" @click="changeLang('ar')" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";

const { locale } = useI18n();

function changeLang(lang) {
  locale.value = lang;
  localStorage.setItem("lang", lang);
}

// === THEME ===
const theme = ref("light");

onMounted(() => {
  const saved = localStorage.getItem("theme") || "light";
  theme.value = saved;
  document.documentElement.classList.toggle("dark", saved === "dark");
});

function toggleTheme() {
  theme.value = theme.value === "light" ? "dark" : "light";
  localStorage.setItem("theme", theme.value);
  document.documentElement.classList.toggle("dark", theme.value === "dark");
}
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 10px;
  right: 20px;
  display: flex;
  gap: 12px;
  align-items: center;
  z-index: 3000;
}

.lang-switcher {
  display: flex;
  gap: 8px;
}

.lang-switcher img {
  width: 28px;
  height: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.5;
  transition: transform 0.2s, opacity 0.2s;
}
.lang-switcher img.active {
  opacity: 1;
  transform: scale(1.1);
  border: 2px solid #0b6fb8;
}

/* Bouton toggle */
.theme-toggle {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
}
</style>
