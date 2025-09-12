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
    columns: { type: Number, default: 2 }, // 1, 2 ou 4
    rows: { type: Number, default: 1 }
  });
  
  const slotsList = computed(() => {
    const count = props.columns * props.rows;
    return Array.from({ length: count }, (_, i) => `slot${i+1}`);
  });
  
  const layout = computed(() => {
    if (props.columns === 2 && props.rows === 1) return "two-cols";
    if (props.columns === 1 && props.rows === 2) return "two-rows";
    if (props.columns === 2 && props.rows === 2) return "grid-2x2";
    return "one-col"; // fallback
  });
  </script>
  
  <style scoped>
  .page-layout {
    width: 100%;
    height: 100%;
    display: grid;
    overflow: hidden; /* évite débordement externe */
  }
  
  /* 2 colonnes */
  .two-cols {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr;
  }
  
  /* 2 lignes */
  .two-rows {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
  
  /* 2x2 */
  .grid-2x2 {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }
  
  /* Responsive : bascule tout en lignes */
  @media (max-width: 900px) {
    .two-cols,
    .grid-2x2 {
      grid-template-columns: 1fr;
      grid-template-rows: auto;
    }
  }
  </style>
  