<template>
  <div class="navbar">

    <div class="nav-left">
      <!-- Toggle Dark/Light -->
      <button class="theme-toggle" @click="toggleTheme">
        <span v-if="theme === 'light'">🌙</span>
        <span v-else>☀️</span>
      </button>
      <!-- Burger (mobile) -->
      <button class="burger" @click="isNavOpen = !isNavOpen" :aria-expanded="isNavOpen ? 'true' : 'false'" aria-label="Menu">
        <span class="burger-box">
          <span class="burger-inner" :class="{ open: isNavOpen }"></span>
        </span>
      </button>
    </div>
    <!-- Navigation Pages avec flèches -->
    <div class="nav-arrows-container">
      <button v-if="showArrows" class="nav-arrow left" @click="scrollNav(-1);handleArrowClick($event)" :disabled="isAtStart" aria-label="Pages précédentes">&#60;</button>
  <ul :class="['nav-links', { open: isNavOpen }]" role="menubar" ref="navLinksRef">
        <li
          v-for="(key, i) in navKeys"
          :key="key"
          role="menuitem"
          tabindex="0"
          :class="{ active: currentIndex === i }"
          @click="(e) => { goToIndex(i); isNavOpen = false }"
          @keydown.enter="goToIndex(i)"
          :aria-current="currentIndex === i ? 'true' : 'false'"
        >
          {{ getLabel(key) }}
        </li>
      </ul>
      <button v-if="showArrows" class="nav-arrow right" @click="scrollNav(1);handleArrowClick($event)" :disabled="isAtEnd" aria-label="Pages suivantes">&#62;</button>
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
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
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

/* État */
const currentIndex = ref(0);
const theme = ref("dark");
const isNavOpen = ref(false);
const showArrows = ref(false);
const isAtStart = ref(true);
const isAtEnd = ref(false);

/* Références DOM */
const navLinksRef = ref(null);
let pagesContainer = null;
let pageEls = [];
let observer = null;
let resizeObserver = null;

/* Optimisation : memoïfication des libellés */
const getLabel = (key) => {
  try {
    const translated = tFn(key);
    if (translated && !translated.startsWith("navbar.")) return translated;
  } catch (e) {}
  return fallback[key.split(".").pop()] ?? key;
};

/* Scroll vers une section - optimisé */
const goToIndex = (i) => {
  const el = pageEls[i];
  if (!el) return;
  
  currentIndex.value = i;
  localStorage.setItem("lastPageIndex", String(i));
  
  const scrollToElement = () => {
    if (pagesContainer?.scrollTo) {
      const top = el.offsetTop - (pagesContainer.offsetTop || 0);
      pagesContainer.scrollTo({ top, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };
  
  scrollToElement();
  
  // Centrer l'élément actif dans la navbar
  nextTick(() => centerActiveNav(i));
};

/* Langue - optimisée */
const changeLang = (lang) => {
  if (locale) locale.value = lang;
  localStorage.setItem("lang", lang);
  
  try {
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang } }));
  } catch {}
};

/* Thème - optimisé */
const applySavedTheme = () => {
  const saved = localStorage.getItem("theme") || "dark";
  theme.value = saved;
  document.documentElement.classList.toggle("dark", saved === "dark");
  
  try {
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: theme.value } }));
  } catch {}
};

const toggleTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
  localStorage.setItem("theme", theme.value);
  document.documentElement.classList.toggle("dark", theme.value === "dark");
  
  try {
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: theme.value } }));
  } catch {}
};

/* Effet temporaire de clic - optimisé */
const handleArrowClick = (event) => {
  const btn = event.currentTarget;
  btn.blur?.();
  btn.classList.remove('clicked');
  void btn.offsetWidth;
  btn.classList.add('clicked');
  
  setTimeout(() => {
    btn.classList.remove('clicked');
    void btn.offsetWidth;
    btn.blur?.();
  }, 180);
};


/* Fonctions utilitaires optimisées */
const checkNavOverflow = () => {
  const nav = navLinksRef.value;
  if (!nav) return;
  showArrows.value = nav.scrollWidth > nav.offsetWidth + 2;
  updateArrowState();
};

const updateArrowState = () => {
  const nav = navLinksRef.value;
  if (!nav) return;
  isAtStart.value = nav.scrollLeft <= 2;
  isAtEnd.value = nav.scrollLeft + nav.offsetWidth >= nav.scrollWidth - 2;
};

const onNavScroll = () => updateArrowState();

const scrollNav = (direction) => {
  const nav = navLinksRef.value;
  if (!nav) return;
  const scrollAmount = nav.offsetWidth * 0.6;
  nav.scrollBy({
    left: direction * scrollAmount,
    behavior: 'smooth'
  });
};

const centerActiveNav = (index = currentIndex.value) => {
  const nav = navLinksRef.value;
  if (!nav?.children[index]) return;
  
  const activeEl = nav.children[index];
  const navRect = nav.getBoundingClientRect();
  const elRect = activeEl.getBoundingClientRect();
  const offset = elRect.left - navRect.left - (navRect.width / 2) + (elRect.width / 2);
  
  nav.scrollTo({ left: nav.scrollLeft + offset, behavior: 'auto' });
};
/* Initialisation optimisée */
onMounted(() => {
  nextTick(() => {
    checkNavOverflow();
    const nav = navLinksRef.value;
    
    if (window.ResizeObserver && nav) {
      resizeObserver = new ResizeObserver(checkNavOverflow);
      resizeObserver.observe(nav);
    } else {
      window.addEventListener('resize', checkNavOverflow, { passive: true });
    }
    
    nav?.addEventListener('scroll', onNavScroll, { passive: true });
  });

  watch(locale, () => nextTick(checkNavOverflow));
  watch(currentIndex, () => nextTick(() => centerActiveNav()));
  
  const centerActiveNavResize = () => centerActiveNav();
  window.addEventListener('resize', centerActiveNavResize, { passive: true });
  
  pagesContainer = document.querySelector(".pages");
  pageEls = Array.from(document.querySelectorAll(".pages .page")) || 
             Array.from(document.querySelectorAll(".page"));

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

onUnmounted(() => { 
  observer?.disconnect();
  resizeObserver?.disconnect();
  window.removeEventListener('resize', checkNavOverflow);
});
</script>
