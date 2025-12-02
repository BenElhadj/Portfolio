<template>
  <div v-if="visible" class="popup-overlay" @click.self="close">
  <div class="popup-content" :class="{ 'popup-large': !title }">
    <button class="close-btn" @click="close" aria-label="Fermer">✖</button>
    <!-- centered controls slot (e.g. zoom range) -->
    <div class="popup-controls">
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

<style scoped>
.close-btn{
  float: right;
  background: var(--card-bg);
  color: var(--text);
  border: 1px solid var(--border);
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0,0,0,0.06);
  transition: transform 120ms ease;
}
.close-btn:hover{ transform: scale(1.08); }
.popup-content.popup-large{
  width: 900px;
  max-width: 95%;
}
.popup-image{
  max-width: 100%;
  max-height: 80vh;
  height: auto;
}
</style>

.popup-controls{
  position:absolute;
  left:50%;
  top:10px;
  transform:translateX(-50%);
  display:flex;
  align-items:center;
  gap:8px;
  z-index:10;
}
