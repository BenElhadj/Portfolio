<template>
    <div class="lang-switcher">
      <img
        src="/flags/fr.svg"
        alt="FR"
        :class="{ active: locale === 'fr' }"
        @click="changeLang('fr')"
      />
      <img
        src="/flags/en.svg"
        alt="EN"
        :class="{ active: locale === 'en' }"
        @click="changeLang('en')"
      />
      <img
        src="/flags/ar.svg"
        alt="AR"
        :class="{ active: locale === 'ar' }"
        @click="changeLang('ar')"
      />
    </div>
  </template>
  
  <script setup>
  import { useI18n } from "vue-i18n";
  const { locale } = useI18n();
  
  function changeLang(lang) {
    locale.value = lang;
    localStorage.setItem("lang", lang);
  }
  </script>
  
  <style scoped>
  .lang-switcher {
    position: fixed;
    top: 10px;
    right: 20px;
    display: flex;
    gap: 10px;
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
  </style>
  