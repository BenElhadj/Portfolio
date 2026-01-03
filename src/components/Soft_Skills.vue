<template>
  <div class="wrapper soft-skills-page">
    <h2 class="title">{{ $t("softSkills.title") }}</h2>

    <PageLayout :columns="2" :rows="2">
      <template
        v-for="(group, gIndex) in groups"
        :key="gIndex"
        v-slot:[`slot${gIndex+1}`]
      >
        <div class="category">
          <h3 class="group-title">{{ $t(group.title) }}</h3>
            <div class="grid">
              <div
                v-for="(item, i) in group.items"
                :key="item.key"
                class="skill-item reveal"
                v-observe-visibility="(isVisible) => onVisible(isVisible, item.key)"
                :class="{ 'is-visible': visibleSkills.includes(item.key) }"
              >
                <div
                  class="card line-card"
                  role="button"
                  tabindex="0"
                  @click="openPopup(item.key)"
                  @keydown.enter.prevent="openPopup(item.key)"
                  @keydown.space.prevent="openPopup(item.key)"
                >
                  <div class="info">
                    <div class="name">{{ $t(`softSkills.items.${item.key}.name`) }}</div>
                    <small>{{ $t(`softSkills.items.${item.key}.short`) }}</small>
                  </div>
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
