import { createApp, watch } from "vue";
import "./styles/styles.css";
import "./styles/rtl.css";
import "./styles/responsive.css";
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

    // on sauvegarde le choix
    localStorage.setItem("lang", newLocale);
  },
  { immediate: true } // applique dès le chargement initial
);

// ✅ langue par défaut = français
if (!localStorage.getItem("lang")) {
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
  }, 0);
})();
