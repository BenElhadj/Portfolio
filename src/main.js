import { createApp, watch } from "vue";
import "./style.css";
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
