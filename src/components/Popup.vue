<template>
  <div v-if="visible" class="popup-overlay" @click.self="close">
    <div class="popup-content">
      <button class="close-btn" @click="close">✖</button>
      <h3 class="popup-title">{{ title }}</h3>
      <div class="popup-body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  visible: Boolean,
  title: String
});
const emit = defineEmits(["close"]);
function close() {
  emit("close");
}
</script>
