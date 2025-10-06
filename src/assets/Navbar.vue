<template>
  <div class="navbar">

    <!-- Toggle Dark/Light -->
    <button class="theme-toggle" @click="toggleTheme">
      <span v-if="theme === 'light'">🌙</span>
      <span v-else>☀️</span>
    </button>
    <!-- Navigation Pages -->
    <ul class="nav-links" role="menubar">
      <li
        v-for="(key, i) in navKeysOrdered"
        :key="key"
        role="menuitem"
        tabindex="0"
        :class="{ active: currentIndex === i }"
        @click="goToIndex(i)"
        @keydown.enter="goToIndex(i)"
        :aria-current="currentIndex === i ? 'true' : 'false'"
      >
        {{ getLabel(key) }}
      </li>
    </ul>

    <!-- Sélecteur de langues -->
    <div class="lang-switcher">
      <img src="/flags/fr.svg" alt="FR" :class="{ active: locale === 'fr' }" @click="changeLang('fr')" />
      <img src="/flags/en.svg" alt="EN" :class="{ active: locale === 'en' }" @click="changeLang('en')" />
      <img src="/flags/ar.svg" alt="AR" :class="{ active: locale === 'ar' }" @click="changeLang('ar')" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useI18n } from "vue-i18n";

/* i18n */
let tFn = (k) => k;
let locale = ref(null);
try {
  const i18n = useI18n();
  tFn = i18n.t;
  locale = i18n.locale;
} catch (e) {}

/* Clés de navigation (ordre de base = gauche → droite) */
const navKeys = [
  "navbar.timeline",
  "navbar.diplomas",
  "navbar.experiences",
  "navbar.skills",
  "navbar.softSkills",
  "navbar.projects",
  "navbar.links"
];

/* 🟢 Liste des liens selon la langue */
const navKeysOrdered = computed(() => {
  if (locale.value === "ar") {
    return [...navKeys].reverse(); // copie inversée
  }
  return navKeys; // normal pour fr/en
});

/* libellés fallback */
const fallback = {
  timeline: "Timeline",
  diplomas: "Diplômes",
  experiences: "Expériences",
  skills: "Compétences",
  softSkills: "Soft Skills",
  projects: "Projets",
  links: "Liens utiles"
};

/* état */
const currentIndex = ref(0);
const theme = ref("light");

/* Dom refs / observer */
let pagesContainer = null;
let pageEls = [];
let observer = null;

/* Traduction */
function getLabel(key) {
  try {
    const translated = tFn(key);
    if (translated && !translated.startsWith("navbar.")) return translated;
  } catch (e) {}
  return fallback[key.split(".").pop()] ?? key;
}

/* Scroll vers une section */
function goToIndex(i) {
  const el = pageEls[i];
  if (!el) return;
  if (pagesContainer && pagesContainer.scrollTo) {
    const top = el.offsetTop - (pagesContainer.offsetTop || 0);
    pagesContainer.scrollTo({ top, behavior: "smooth" });
  } else {
    el.scrollIntoView({ behavior: "smooth" });
  }
  currentIndex.value = i;
  localStorage.setItem("lastPageIndex", String(i));
}

/* Langue */
function changeLang(lang) {
  if (locale) locale.value = lang;
  localStorage.setItem("lang", lang);

  const html = document.documentElement;
  html.setAttribute("lang", lang);

  if (lang === "ar") {
    html.classList.add("rtl");
    html.setAttribute("dir", "rtl");
  } else {
    html.classList.remove("rtl");
    html.setAttribute("dir", "ltr");
  }
}

/* Thème */
function applySavedTheme() {
  const saved = localStorage.getItem("theme") || "light";
  theme.value = saved;
  document.documentElement.classList.toggle("dark", saved === "dark");
}
function toggleTheme() {
  theme.value = theme.value === "light" ? "dark" : "light";
  localStorage.setItem("theme", theme.value);
  document.documentElement.classList.toggle("dark", theme.value === "dark");
}

/* Init */
onMounted(() => {
  pagesContainer = document.querySelector(".pages");
  pageEls = Array.from(document.querySelectorAll(".pages .page"));
  if (!pageEls.length) pageEls = Array.from(document.querySelectorAll(".page"));

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = pageEls.indexOf(entry.target);
          if (idx !== -1) {
            currentIndex.value = idx;
            localStorage.setItem("lastPageIndex", String(idx));
          }
        }
      });
    },
    { root: pagesContainer || null, threshold: 0.6 }
  );

  pageEls.forEach((el) => observer.observe(el));

  const saved = parseInt(localStorage.getItem("lastPageIndex"));
  if (!Number.isNaN(saved) && pageEls[saved]) {
    setTimeout(() => goToIndex(saved), 80);
  }

  applySavedTheme();
});

onUnmounted(() => { if (observer) observer.disconnect(); });
</script>
