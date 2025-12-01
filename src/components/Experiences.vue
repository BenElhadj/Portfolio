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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M4.98 3.5C4.98 4.88 3.86 6 2.48 6C1.1 6 0 4.88 0 3.5C0 2.12 1.12 1 2.5 1C3.88 1 4.98 2.12 4.98 3.5ZM0.5 8.99H4.5V24H0.5V8.99ZM8.5 8.99H12.17V10.56H12.23C12.84 9.51 14.22 8.4 16.32 8.4C20.5 8.4 22 10.64 22 14.62V24H18V15.56C18 13.52 17.54 11.9 15.34 11.9C13.14 11.9 12.69 13.4 12.69 15.36V24H8.5V8.99Z" fill="#0A66C2"/>
                  </svg>
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

// Construct a probable logo path. Prioritize exp.logo if provided, else try a normalized png under /Logos_png/
const logoPath = (exp) => {
  // Use Vite base so paths work both locally and when deployed under a subpath (GitHub Pages)
  const base = import.meta.env.BASE_URL || './';
  if (!exp) return null;
  if (exp.logo) return `${base}Logos_png/${exp.logo}`;
  const slug = slugify(exp.company || "");
  if (!slug) return null;
  // Try to resolve using a known index to handle case/format differences (built from public/Logos_png)
  if (LOGO_INDEX[slug]) return `${base}Logos_png/${LOGO_INDEX[slug]}`;
  // fallback to a generic lowercase png name
  return `${base}Logos_png/${slug}.png`;
};

// Known logo filenames found in public/Logos_png. This handles case/underscore/hyphen variants
// Key = normalized slug (lowercase, underscores), value = actual filename in Logos_png
const LOGO_INDEX = {
  "ap_hp": "AP-HP.png",
  "chanel": "chanel.png",
  "dim": "Dim.png",
  "dior": "Dior.png",
  "european_trade": "European_trade.png",
  "institut_du_cerveau_et_de_la_moelle_epiniere_icm": "Institut_du_Cerveau_et_de_la_Moelle_Epinière_ICM.png",
  "keakr": "KEAKR.png",
  "kiatoo": "kiatoo.png",
  "lvmh_fragrance_brands": "LVMH.png",
  "microlux_dimatec": "Microlux.png",
  "mss_fnac": "MSS_Fnac.png",
  "parkeon": "Parkeon.png",
  "retronix_tunisia": "Retronix.png",
  "sagemcom": "Sagem.png",
  "solutions30_france": "solutions-30.png",
  "stie": "STIE.png",
  "tekne_tunisia": "Tekne.png",
  "transtu_tgm": "Transtu.png"
};

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