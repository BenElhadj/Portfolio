<template>
  <div class="experiences-wrap">
    <h2 class="title">{{ $t("experiences.title") }}</h2>

    <PageLayout :columns="1" :rows="categories.length">
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
              class="card experience-card"
            >
              <div class="dates">{{ exp.dates }}</div>
              <div class="company">{{ exp.company }}</div>
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
