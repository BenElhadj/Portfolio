<template>
  <div class="diplomas-wrap">
    <h2 class="title">{{ $t("diplomas.title") }}</h2>
    <div class="timeline" aria-label="Timeline des diplômes">
      <PageLayout :columns="1" :rows="diplomas.length">
        <template
          v-for="(cat, catIndex) in diplomas"
          :key="catIndex"
          v-slot:[`slot${catIndex+1}`]
        >
          <div class="category">
            <div class="category-header">
              <h3>{{ cat.title }}</h3>
            </div>

            <div class="timeline-container">
              <div>
                <div
                  v-for="(d, i) in cat.diplomes"
                  :key="i"
                  class="timeline-item"
                  :class="{ 'is-visible': visible[catIndex]?.[i] }"
                  :ref="(el) => {
                    if (!items[catIndex]) items[catIndex] = [];
                    items[catIndex][i] = el;
                  }"
                >
                  <!-- Remplacement du dot par l'image du diplôme -->
                  <div
                    class="degree-thumb"
                    @click="openPopup(d)"
                    title="Cliquez pour agrandir"
                  >
                    <img
                      v-if="d.image"
                      :src="`/degrees/${d.image}`"
                      :alt="d.degree"
                    />
                  </div>

                  <div class="card diploma-card experience-card">
                    <div class="meta">
                      <span class="year">{{ d.period }}</span>
                      <span class="institution">{{ d.institution }}</span>
                    </div>
                    <div class="degree">{{ d.degree }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </PageLayout>
    </div>

    <!-- Popup -->
    <Popup
      :visible="popupVisible"
      :title="popupTitle"
      @close="popupVisible = false"
    >
      <img v-if="popupImage" :src="popupImage" class="popup-image" />
    </Popup>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useI18n } from "vue-i18n";
import PageLayout from "../assets/PageLayout.vue";
import Popup from "./Popup.vue";

const { tm } = useI18n();

const diplomas = computed(() => {
  const list = tm("diplomas.list");
  return Array.isArray(list) ? list : [];
});

const items = ref([]);
const visible = ref([]);
let observer = null;

// --- Gestion du popup ---
const popupVisible = ref(false);
const popupTitle = ref("");
const popupImage = ref("");

function openPopup(d) {
  popupTitle.value = d.degree;
  popupImage.value = d.image ? `/degrees/${d.image}` : "";
  popupVisible.value = true;
}

// --- Intersection Observer (animations au scroll) ---
onMounted(() => {
  items.value = diplomas.value.map(() => []);
  visible.value = diplomas.value.map((cat) =>
    cat.diplomes.map(() => false)
  );

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        diplomas.value.forEach((cat, catIndex) => {
          const idx = items.value[catIndex]?.indexOf(entry.target);
          if (idx !== -1) {
            visible.value[catIndex][idx] = true;
            observer.unobserve(entry.target);
          }
        });
      });
    },
    { root: null, threshold: 0.3 }
  );

  setTimeout(() => {
    items.value.flat().forEach((el) => {
      if (el) observer.observe(el);
    });
  }, 100);
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
});
</script>

<style scoped>
.degree-thumb {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-bg, #222);
}
.degree-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.popup-image {
  max-width: 100%;
  height: auto;
  display: block;
  margin: auto;
}
</style>
