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
import { onBeforeUnmount } from "vue";
// Affichage conditionnel des flèches
const showArrows = ref(false);
const isAtStart = ref(true);
const isAtEnd = ref(false);

function checkNavOverflow() {
  const nav = navLinksRef.value;
  if (!nav) return;
  // On compare le scrollWidth (contenu total) à la largeur visible
  showArrows.value = nav.scrollWidth > nav.offsetWidth + 2; // +2 pour tolérance
  updateArrowState();
}

function updateArrowState() {
  const nav = navLinksRef.value;
  if (!nav) return;
  isAtStart.value = nav.scrollLeft <= 2;
  isAtEnd.value = nav.scrollLeft + nav.offsetWidth >= nav.scrollWidth - 2;
}

function onNavScroll() {
  updateArrowState();
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
// Mobile nav open state (pour le burger)
const isNavOpen = ref(false);

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
  // Centrer l'élément actif dans la navbar
  nextTick(() => {
    const nav = navLinksRef.value;
    if (nav && nav.children[i]) {
      const activeEl = nav.children[i];
      const navRect = nav.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      const scrollLeft = nav.scrollLeft;
      const offset = elRect.left - navRect.left - (navRect.width / 2) + (elRect.width / 2);
      nav.scrollTo({ left: scrollLeft + offset, behavior: 'smooth' });
    }
  });
}

/* Langue */
function changeLang(lang) {
  if (locale) locale.value = lang;
  
  // Save language preference
  localStorage.setItem("lang", lang);
  
  // Apply RTL/LTR layout changes
  const html = document.documentElement;
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

/* Effet temporaire de clic sur les flèches de navigation */
function handleArrowClick(event) {
  const btn = event.currentTarget;
  // Supprimer le focus et l'état actif immédiatement (empêche l'effet bleu sur mobile)
  btn.blur && btn.blur();
  btn.classList.remove('clicked');
  // Forcer le repaint
  void btn.offsetWidth;
  // Appliquer l'effet temporaire
  btn.classList.add('clicked');
  setTimeout(() => {
    btn.classList.remove('clicked');
    // Forcer le repaint à nouveau
    void btn.offsetWidth;
    // Supprimer le focus une seconde fois au cas où
    btn.blur && btn.blur();
  }, 180);
}

// Ajout logique Vue pour sélecteur de langue mobile
const langSwitcherRef = ref(null);
const isLangOpen = ref(false);

function toggleLangSwitcher() {
  isLangOpen.value = !isLangOpen.value;
  // Ajoute ou retire la classe .open sur le conteneur
  const el = langSwitcherRef.value;
  if (el) {
    if (isLangOpen.value) {
      el.classList.add('open');
    } else {
      el.classList.remove('open');
    }
  }
}

// function selectLang(lang) {
//   changeLang(lang);
//   isLangOpen.value = false;
//   const el = langSwitcherRef.value;
//   if (el) el.classList.remove('open');
// }

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
  nextTick(() => {
    const nav = navLinksRef.value;
    if (nav) nav.addEventListener('scroll', onNavScroll, { passive: true });
  });
onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
  window.removeEventListener('resize', checkNavOverflow);
});
  // Centrer l'élément actif dans la navbar au chargement et lors du resize
  function centerActiveNav() {
    const nav = navLinksRef.value;
    if (nav && nav.children[currentIndex.value]) {
      const activeEl = nav.children[currentIndex.value];
      const navRect = nav.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      const scrollLeft = nav.scrollLeft;
      const offset = elRect.left - navRect.left - (navRect.width / 2) + (elRect.width / 2);
      nav.scrollTo({ left: scrollLeft + offset, behavior: 'auto' });
    }
  }
  nextTick(centerActiveNav);
  window.addEventListener('resize', centerActiveNav);
  // Centrage aussi lors du changement d'index
  watch(currentIndex, () => nextTick(centerActiveNav));
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
