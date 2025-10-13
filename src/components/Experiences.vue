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
              <!-- Nom de société cliquable -->
              <div class="company">
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
const categories = computed(() => {
  const list = tm("experiences.list");
  return Array.isArray(list) ? list : [];
});
</script>