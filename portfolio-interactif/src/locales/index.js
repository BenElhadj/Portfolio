import { createI18n } from "vue-i18n";
import fr from "./fr";
import en from "./en";
import ar from "./ar";

// récupérer la langue sauvegardée ou fallback sur "fr"
const savedLocale = localStorage.getItem("lang") || "fr";

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,   // langue actuelle
  fallbackLocale: "fr",  // par défaut FR
  messages: {
    fr,
    en,
    ar
  }
});
