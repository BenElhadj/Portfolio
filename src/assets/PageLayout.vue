<template>
  <div class="page-layout" :class="layout">
    <div v-for="(slotName, index) in slotsList" :key="index" class="sub-section">
      <slot :name="slotName"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  columns: { type: Number, default: 2 },
  rows: { type: Number, default: 1 }
});

const slotsList = computed(() => {
  const count = props.columns * props.rows;
  return Array.from({ length: count }, (_, i) => `slot${i + 1}`);
});

const layout = computed(() => {
  if (props.columns === 2 && props.rows === 1) return "two-cols";
  if (props.columns === 1 && props.rows === 2) return "two-rows";
  if (props.columns === 2 && props.rows === 2) return "grid-2x2";
  return "one-col";
});
</script>
