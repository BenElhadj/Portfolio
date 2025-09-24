<template>
  <div class="diplomas-wrap">
    <h2 class="title">{{ $t("diplomas.title") }}</h2>
    <div class="diplomas-inner">
      <div class="timeline" aria-label="Timeline des diplômes">
        <PageLayout :columns="1" :rows="1">
          <template #slot1>
            <div
              v-for="(d, i) in diplomas"
              :key="i"
              class="timeline-item"
              :class="{ 'is-visible': visible[i] }"
              :ref="(el) => (items[i] = el)"
            >
              <div class="dot" aria-hidden="true">
                <!-- Mortarboard (chapeau de diplômé) SVG -->
                <svg viewBox="0 0 24 24" class="icon">
                  <path d="M12 2 1 7l11 5 9-4.09V17h2V7L12 2z" />
                  <path d="M11 13.5V21h2v-7.5l-1 0.45-1-0.45z" />
                </svg>
              </div>
              
              <div class="card diploma-card">
                <div class="meta">
                  <span class="year">{{ d.period }}</span>
                  <span class="institution">{{ d.institution }}</span>
                </div>
                <div class="degree">{{ d.degree }}</div>
              </div>
            </div>
          </template>
        </PageLayout>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useI18n } from "vue-i18n";
import PageLayout from "../assets/PageLayout.vue";

const { t, tm } = useI18n();

// diplomas = liste traduite selon la langue courante
const diplomas = computed(() => {
  const list = tm("diplomas.list");
  return Array.isArray(list) ? list : [];
});

// état visibilité (animations au scroll)
const items = ref([]);
const visible = ref([]);
let observer = null;

onMounted(() => {
  visible.value = diplomas.value.map(() => false);

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = items.value.indexOf(entry.target);
          if (idx !== -1) {
            visible.value[idx] = true;
            observer.unobserve(entry.target);
          }
        }
      });
    },
    { root: null, threshold: 0.45 }
  );

  items.value.forEach((el) => {
    if (el) observer.observe(el);
  });
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
});
</script>

