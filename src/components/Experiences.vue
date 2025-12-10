<template>
  <div class="wrapper">
    <h2 class="title">{{ $t("experiences.title") }}</h2>

    <PageLayout :columns="1" :rows="categories.length" :gap="24">
      <template
        v-for="(cat, gIndex) in categories"
        :key="gIndex" 
        v-slot:[`slot${gIndex+1}`]
      >
        <div class="category">
          <div class="category-header">
            <h3>{{ cat.title }}</h3>
            <span class="years">{{ cat.years }} {{ $t("experiences.yearsLabel") }}</span>
          </div>

          <div class="grid">
            <div
              v-for="(exp, i) in cat.experiences"
              :key="i"
              class="card line-card"
            >
              <div class="dates">{{ exp.dates }}</div>
              <!-- logo placé entre la date et le nom de la société -->
              <a
                v-if="logoPath(exp)"
                :href="linkedinUrl(exp)"
                target="_blank"
                rel="noopener noreferrer"
                class="company-logo-link"
                :title="`Voir ${exp.company} sur LinkedIn`"
              >
                <img
                  :src="logoPath(exp)"
                  class="company-logo"
                  :alt="exp.company + ' logo'"
                  @error="(e) => e.target.style.display = 'none'"
                  aria-hidden="true"
                />
              </a>

              <!-- Nom de société cliquable -->
              <div class="company">
                <!-- Company name linking to website when available -->
                <a
                  v-if="exp.website"
                  :href="exp.website"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="company-link"
                >
                  {{ exp.company }}
                </a>
                <span v-else>{{ exp.company }}</span>

                <!-- LinkedIn link: use provided exp.linkedin or fallback to a LinkedIn search for the company -->
                <a
                  class="linkedin-link"
                  :href="linkedinUrl(exp)"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Voir sur LinkedIn"
                >
                  <!-- simple inline LinkedIn SVG icon -->
                  <!-- <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6C1.1 6 0 4.88 0 3.5C0 2.12 1.12 1 2.5 1C3.88 1 4.98 2.12 4.98 3.5ZM0.5 8.99H4.5V24H0.5V8.99ZM8.5 8.99H12.17V10.56H12.23C12.84 9.51 14.22 8.4 16.32 8.4C20.5 8.4 22 10.64 22 14.62V24H18V15.56C18 13.52 17.54 11.9 15.34 11.9C13.14 11.9 12.69 13.4 12.69 15.36V24H8.5V8.99Z" fill="#0A66C2"/>
                  </svg> -->
                </a>
              </div>
              <div class="role">{{ exp.role }}</div>
              <ul class="details">
                <li v-for="(d, j) in exp.details" :key="j">{{ d }}</li>
              </ul>
            </div>
          </div>
        </div>
      </template>
    </PageLayout>
  </div>
</template>

<script setup>
import PageLayout from "../assets/PageLayout.vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
// Import experiences from all locales to build the set of known logo filenames
import enExperiences from "../locales/en/experiences";
import frExperiences from "../locales/fr/experiences";
import arExperiences from "../locales/ar/experiences";

const { t, tm } = useI18n();

// Récupère les catégories traduites
// helper: normalize a company name to a filename-friendly slug
const slugify = (s) => {
  if (!s) return "";
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

// Build the set of known logos from the locale experiences files so we don't hard-code filenames.
const collectLogos = (localeExpModule) => {
  const out = [];
  if (!localeExpModule || !Array.isArray(localeExpModule.list)) return out;
  for (const cat of localeExpModule.list) {
    if (!cat || !Array.isArray(cat.experiences)) continue;
    for (const e of cat.experiences) if (e && e.logo) out.push(e.logo);
  }
  return out;
};

const AVAILABLE_LOGOS = Array.from(new Set([
  ...collectLogos(enExperiences),
  ...collectLogos(frExperiences),
  ...collectLogos(arExperiences),
]));

// Map normalized company slug -> actual filename (from AVAILABLE_LOGOS)
const LOGO_MAP = {};
for (const fn of AVAILABLE_LOGOS) {
  const name = fn.replace(/\.[^.]+$/, "");
  const s = slugify(name);
  if (s) LOGO_MAP[s] = fn;
}

// Construct a probable logo path. Prioritize exp.logo if provided, else try a normalized png under /experiences/
const logoPath = (exp) => {
  // Use Vite base so paths work both locally and when deployed under a subpath (GitHub Pages)
  const base = import.meta.env.BASE_URL || './';
  if (!exp) return null;
  // explicit logo field wins only if it's declared in the locale files (AVAILABLE_LOGOS)
  if (exp.logo) {
    if (AVAILABLE_LOGOS.includes(exp.logo)) return `${base}experiences/${exp.logo}`;
    // If the current exp.logo is not present in the locale-derived list, ignore it to avoid 404
    return null;
  }
  // fallback: try to map normalized company name to an available image
  const slug = slugify(exp.company || "");
  if (!slug) return null;
  // lookup by normalized slug in LOGO_MAP (derived from locales)
  if (LOGO_MAP[slug]) return `${base}experiences/${LOGO_MAP[slug]}`;
  // nothing matched: don't render an <img> (return null) to avoid a 404
  return null;
};

// Known logo filenames found in public/experiences. This handles case/underscore/hyphen variants
// Key = normalized slug (lowercase, underscores), value = actual filename in experiences
// const LOGO_INDEX = {
//   "ap_hp": "AP-HP.png",
//   "chanel": "chanel.png",
//   "dim": "Dim.png",
//   "dior": "Dior.png",
//   "european_trade": "EUROPEAN_TRADE.png",
//   // "european_trade_la_force_de_vente": "EUROPEAN_TRADE.png",
//   // "institut_du_cerveau_et_de_la_moelle_epiniere_icm": "ICM.png",
//   "icm": "ICM.png",
//   "keakr": "KEAKR.png",
//   "kiatoo": "kiatoo.png",
//   "lvmh_fragrance_brands": "LVMH.png",
//   "microlux_dimatec": "Microlux.png",
//   "mss_fnac": "MSS_Fnac.png",
//   "parkeon": "Parkeon.png",
//   "retronix_tunisia": "Retronix.png",
//   "sagemcom": "Sagem.png",
//   "solutions30_france": "solutions-30.png",
//   "stie": "STIE.png",
//   "tekne_tunisia": "Tekne.png",
//   "transtu_tgm": "Transtu.png",
//   "multiserv_plus": "MULTISERV_PLUS.png",
//   "greta": "GRETA.png",
//   "greta_metehor_paris": "GRETA.png",
// };

// LinkedIn URL: use exp.linkedin if present, else fallback to a LinkedIn search for the company
const linkedinUrl = (exp) => {
  if (!exp) return "#";
  if (exp.linkedin) return exp.linkedin;
  // Search query on LinkedIn
  return `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(exp.company || "")}`;
};

const categories = computed(() => {
  const list = tm("experiences.list");
  return Array.isArray(list) ? list : [];
});
</script>

<style scoped>
.company-logo {
  width: 200px;
  height: 64px;
  object-fit: contain;
  margin: 12px auto;
  display: block;
  transition: transform 160ms ease, filter 160ms ease;
  transform-origin: center center;
  cursor: pointer;
}
.company-logo-link {
  display: inline-block;
  line-height: 0;
}
.company-logo-link:hover .company-logo {
  transform: scale(1.25);
  filter: drop-shadow(0 6px 12px rgba(0,0,0,0.18));
}
.company-link {
  font-weight: 600;
  margin-right: 8px;
}
.linkedin-link {
  margin-left: 8px;
  vertical-align: middle;
}
.card .dates {
  display: inline-block;
  vertical-align: middle;
  margin-right: 6px;
}
</style>