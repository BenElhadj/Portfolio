import { createApp, watch } from "vue";
import "./styles/styles.css";
import App from "./App.vue";
import { ObserveVisibility } from "vue-observe-visibility";
import { i18n } from "./locales";

const app = createApp(App);

app.use(i18n);
app.directive("observe-visibility", ObserveVisibility);

// 🔥 Gestion auto de la direction + attributs <html>
watch(
  () => i18n.global.locale.value,
  (newLocale) => {
    const html = document.documentElement;
    html.setAttribute("lang", newLocale);

    if (newLocale === "ar") {
      html.classList.add("rtl");
      html.setAttribute("dir", "rtl");
    } else {
      html.classList.remove("rtl");
      html.setAttribute("dir", "ltr");
    }
  },
  { immediate: true } // applique dès le chargement initial
);

// ✅ langue par défaut = français
if (typeof window !== 'undefined' && !localStorage.getItem("lang")) {
  i18n.global.locale.value = "fr";
}

app.mount("#app");

// === Parallax léger sur la page et lumière sous le curseur dans les compartiments ===
(function enableParallaxAndSpotlight() {
  let rafId = null;
  let lastX = 0,
    lastY = 0;
  let pages = [];
  let sections = [];
  let hasScrolled = false;
  const htmlEl = document.documentElement;
  const scrollFlags = new WeakMap();

  function refreshNodes() {
    pages = Array.from(document.querySelectorAll(".pages .page"));
    if (!pages.length) pages = Array.from(document.querySelectorAll(".page"));
    sections = Array.from(document.querySelectorAll(".sub-section"));
  }

  function applyParallax() {
    rafId = null;
    // Déplacement très léger des pages
    pages.forEach((page, idx) => {
      const speed = (idx + 1) * 0.6;
      const xOffset = (lastX - 0.5) * speed;
      const yOffset = (lastY - 0.5) * speed;
      page.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
    });
    // Déplacement léger des compartiments
    sections.forEach((el, idx) => {
      const speed = (idx % 5 + 1) * 1.2;
      const xOffset = (lastX - 0.5) * speed;
      const yOffset = (lastY - 0.5) * speed;
      el.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
    });
  }

  // Marquer le document après le premier scroll pour activer le glow
  function onAnyScroll() {
    if (hasScrolled) return;
    try {
      const scroller = document.querySelector('.pages');
  // Enregistrement du Service Worker pour le cache
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`)
        // .then(reg => console.log('Service Worker enregistré', reg))
        .catch(err => console.error('Erreur Service Worker', err));
    });
  }
      const scrolledAmt = scroller ? scroller.scrollTop : window.pageYOffset || document.documentElement.scrollTop || 0;
      if (scrolledAmt > 10) {
        hasScrolled = true;
        htmlEl.classList.add('has-scrolled');
      }
    } catch (e) { /* ignore errors during scroll detection/worker registration */ }
  }

  // Supprimer le glow pendant le scroll interne d'un compartiment
  function attachInnerScrollListeners() {
    sections.forEach((sectionEl) => {
      const inner = sectionEl.querySelector('.sub-inner');
      const target = inner || sectionEl;
      if (scrollFlags.get(target)) return; // éviter doublons
      const onScroll = () => {
        const parent = target.closest('.sub-section') || sectionEl;
        parent.classList.add('is-scrolling');
        // retirer après une courte pause
        clearTimeout(onScroll._t);
        onScroll._t = setTimeout(() => {
          parent.classList.remove('is-scrolling');
        }, 220);
      };
      target.addEventListener('scroll', onScroll, { passive: true });
      scrollFlags.set(target, true);
    });
  }

  function onMouseMove(e) {
    lastX = e.clientX / window.innerWidth;
    lastY = e.clientY / window.innerHeight;
    if (!rafId) rafId = requestAnimationFrame(applyParallax);
  }

  function clearTransforms() {
    pages.forEach((p) => (p.style.transform = ""));
    sections.forEach((s) => (s.style.transform = ""));
  }

  function onMouseLeave() {
    clearTransforms();
  }


  // Initialisation après le mount
  setTimeout(() => {
    refreshNodes();
    window.addEventListener("resize", refreshNodes);
    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave, { passive: true });
    // écouter le scroll global (container .pages si présent, sinon window)
    const scroller = document.querySelector('.pages');
    if (scroller) scroller.addEventListener('scroll', onAnyScroll, { passive: true });
    else window.addEventListener('scroll', onAnyScroll, { passive: true });
    // écouteurs de scroll interne pour compartiments
    attachInnerScrollListeners();
  }, 0);
})();
