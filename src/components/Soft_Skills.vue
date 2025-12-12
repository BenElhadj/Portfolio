<template>
  <div class="wrapper">
    <h2 class="title">{{ $t("softSkills.title") }}</h2>

    <PageLayout :columns="2" :rows="2">
      <template
        v-for="(group, gIndex) in groups"
        :key="gIndex"
        v-slot:[`slot${gIndex+1}`]
      >
        <div class="category">
          <h3 class="group-title">{{ $t(group.title) }}</h3>
            <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));">
              <div
                v-for="(item, i) in group.items"
                :key="item.key"
                class="card line-card soft-card"
                role="button"
                tabindex="0"
                v-observe-visibility="(isVisible) => onVisible(isVisible, item.key)"
                :class="{ visible: visibleSkills.includes(item.key) }"
                @click="openPopup(item.key)"
                @keydown.enter.prevent="openPopup(item.key)"
                @keydown.space.prevent="openPopup(item.key)"
              >
                <div class="info">
                  <div class="name">{{ $t(`softSkills.items.${item.key}.name`) }}</div>
                  <div class="desc">{{ $t(`softSkills.items.${item.key}.short`) }}</div>
                </div>
              </div>
            </div>
        </div>
      </template>
    </PageLayout>

    <Popup
      :visible="popupVisible"
      :title="popupKey ? $t(`softSkills.items.${popupKey}.name`) : ''"
      @close="closePopup"
    >
      <p v-if="popupKey">{{ $t(`softSkills.items.${popupKey}.info`) }}</p>
    </Popup>
  </div>
</template>

<script setup>
import { ref } from "vue";
import PageLayout from "../assets/PageLayout.vue";
import Popup from "./Popup.vue";

const visibleSkills = ref([]);
function onVisible(isVisible, key) {
  if (isVisible && !visibleSkills.value.includes(key)) visibleSkills.value.push(key);
}

const groups = [
  {
    title: "softSkills.groups.part1",
    items: [
      { key: "empathicCommunication" },
      { key: "teamSpirit" },
      { key: "supportiveMindset" },
      { key: "respectIntegrity" },
    ]
  },
  {
    title: "softSkills.groups.part2",
    items: [
      { key: "adaptability" },
      { key: "multitasking" },
      { key: "calmUnderPressure" },
      { key: "agileFlexible" },
    ]
  },
  {
    title: "softSkills.groups.part3",
    items: [
      { key: "perfectionism" },
      { key: "attentionToDetail" },
      { key: "criticalThinking" },
      { key: "perseverance" },
    ]
  },
  {
    title: "softSkills.groups.part4",
    items: [
      { key: "strategicThinking" },
      { key: "creativityInnovation" },
      { key: "inspiringLeadership" },
      { key: "fastLearning" },
    ]
  }
];

const popupVisible = ref(false);
const popupKey = ref(null);
function openPopup(key) { popupKey.value = key; popupVisible.value = true; }
function closePopup() { popupVisible.value = false; popupKey.value = null; }
</script>

<style scoped>
.soft-card .desc { font-size: 0.95rem; color: var(--text-secondary); margin-top: 6px; }

/* Reuse animation & visual cues from diplomas timeline */
.soft-card {
  opacity: 1;
  transform: translateY(18px) scale(0.99);
  transition: all 520ms cubic-bezier(0.2, 0.9, 0.2, 1);
}
.soft-card.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.group-title {
  color: var(--title);
  font-size: var(--fs-h3);
  margin-bottom: 12px;
}

/* Make the card header/left border use the same accent as diplomas */
.soft-card .info { display: flex; flex-direction: column; }
.soft-card .name { font-weight: 600; color: var(--text); }
.card.line-card { border-left: 4px solid var(--blue); }

</style>
