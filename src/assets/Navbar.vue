<template>
  <div class="navbar">

    <!-- Toggle Dark/Light -->
    <button class="theme-toggle" @click="toggleTheme">
      <span v-if="theme === 'light'">🌙</span>
      <span v-else>☀️</span>
    </button>
    <!-- Navigation Pages avec flèches -->
    <div class="nav-arrows-container">
      <button v-if="showArrows" class="nav-arrow left" @click="scrollNav(-1)" aria-label="Pages précédentes">&#60;</button>
      <ul class="nav-links" role="menubar" ref="navLinksRef">
        <li
          v-for="(key, i) in navKeys"
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
      <button v-if="showArrows" class="nav-arrow right" @click="scrollNav(1)" aria-label="Pages suivantes">&#62;</button>
    </div>

    <!-- Sélecteur de langues -->
    <div class="lang-switcher">
  <picture>
    <source srcset="/logos/flags/fr.webp" type="image/webp" />
  <img src="/logos/flags/fr.webp" alt="FR" :class="{ active: locale === 'fr' }" @click="changeLang('fr')" loading="lazy" />
  </picture>
  <picture>
    <source srcset="/logos/flags/en.webp" type="image/webp" />
  <img src="/logos/flags/en.webp" alt="EN" :class="{ active: locale === 'en' }" @click="changeLang('en')" loading="lazy" />
  </picture>
  <picture>
    <source srcset="/logos/flags/ar.webp" type="image/webp" />
  <img src="/logos/flags/ar.webp" alt="AR" :class="{ active: locale === 'ar' }" @click="changeLang('ar')" loading="lazy" />
  </picture>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount } from "vue";
// Affichage conditionnel des flèches
const showArrows = ref(false);

function checkNavOverflow() {
  const nav = navLinksRef.value;
  if (!nav) return;
  // On compare le scrollWidth (contenu total) à la largeur visible
  showArrows.value = nav.scrollWidth > nav.offsetWidth + 2; // +2 pour tolérance
}

let resizeObserver = null;
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from "vue";
// Référence vers la liste des liens de navigation
const navLinksRef = ref(null);

// Scroll horizontal via flèches
function scrollNav(direction) {
  const nav = navLinksRef.value;
  if (!nav) return;
  const scrollAmount = nav.offsetWidth * 0.6; // scroll de 60% de la largeur visible
  nav.scrollBy({
    left: direction * scrollAmount,
    behavior: 'smooth'
  });
}
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
  "navbar.projects",
  "navbar.softSkills",
  "navbar.links"
];


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
const theme = ref("dark");

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
  // S'assurer que l'onglet sélectionné est visible
  nextTick(() => {
    const nav = navLinksRef.value;
    if (nav && nav.children[i]) {
      nav.children[i].scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    }
  });
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
  try {
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang } }))
  } catch {}
}

/* Thème */
function applySavedTheme() {
  const saved = localStorage.getItem("theme") || "dark";
  theme.value = saved;
  document.documentElement.classList.toggle("dark", saved === "dark");
  try {
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: theme.value } }))
  } catch {}
}
function toggleTheme() {
  theme.value = theme.value === "light" ? "dark" : "light";
  localStorage.setItem("theme", theme.value);
  document.documentElement.classList.toggle("dark", theme.value === "dark");
  try {
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: theme.value } }))
  } catch {}
}

/* Init */
onMounted(() => {
  // Observer le redimensionnement pour afficher/masquer les flèches
  nextTick(() => {
    checkNavOverflow();
    const nav = navLinksRef.value;
    if (window.ResizeObserver && nav) {
      resizeObserver = new ResizeObserver(checkNavOverflow);
      resizeObserver.observe(nav);
    } else {
      window.addEventListener('resize', checkNavOverflow);
    }
  });

  // Watch for language change to re-check overflow
  watch(locale, () => {
    nextTick(checkNavOverflow);
  });
onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  window.removeEventListener('resize', checkNavOverflow);
});
  // S'assurer que la sélection active est visible au chargement
  nextTick(() => {
    const nav = navLinksRef.value;
    if (nav && nav.children[currentIndex.value]) {
      nav.children[currentIndex.value].scrollIntoView({ inline: 'center', behavior: 'auto', block: 'nearest' });
    }
  });
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