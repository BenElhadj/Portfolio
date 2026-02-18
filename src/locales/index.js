import { createI18n } from "vue-i18n";
import fr from "./fr/fr";
import en from "./en/en";
import ar from "./ar/ar";

// récupérer la langue sauvegardée ou fallback sur "fr"
const savedLocale = typeof window !== 'undefined' ? localStorage.getItem("lang") || "fr" : "fr";

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
