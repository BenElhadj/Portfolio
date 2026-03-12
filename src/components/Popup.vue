<template>
  <div v-if="visible" class="popup-overlay" @click.self="close">
  <div class="popup-content" :class="{ 'popup-large': !title }">
    <button class="close-btn" @click="close" aria-label="Fermer">✖</button>
    <div>
      <slot name="controls" />
    </div>
        <h3 v-if="title" class="group-title">{{ title }}</h3>
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
