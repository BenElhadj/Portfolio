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
                v-if="logoSrc(exp.logo)"
                :href="linkedinUrl(exp)"
                target="_blank"
                rel="noopener noreferrer"
                class="company-logo-link"
                :title="`Voir ${exp.company} sur LinkedIn`"
              >
                <img
                  :src="logoSrc(exp.logo)"
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

const { tm } = useI18n();

// Construct a probable logo path. Prioritize exp.logo if provided, else try a normalized png under /experiences/

const logoSrc = (logo) => {
  if (!logo) return null;
  const base = import.meta.env.BASE_URL || './';
  // If it's already an absolute URL, use it
  if (/^https?:\/\//i.test(logo)) return logo;
  // If it starts with a slash, treat it as root-relative and strip leading slashes then prefix base
  if (/^\//.test(logo)) return `${base}${String(logo).replace(/^\/+/, '')}`;
  // Otherwise assume it's a filename located under public/experiences
  return `${base}experiences/${logo}`;
};

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