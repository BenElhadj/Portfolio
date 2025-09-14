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
  
  <style scoped>
  .popup-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }
  .popup-content {
    background: white;
    border-radius: 10px;
    padding: 20px;
    width: 400px;
    max-width: 90%;
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
    animation: fadeIn 0.3s ease;
  }
  .close-btn {
    float: right;
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
  }
  .popup-title {
    margin: 0 0 10px;
    text-align: center;
  }
  .popup-body {
    font-size: 0.95rem;
    color: #333;
  }
  .popup-link {
    display: inline-block;
    margin-top: 10px;
    color: #0b6fb8;
    font-weight: 600;
    text-decoration: none;
  }
  .popup-link:hover {
    text-decoration: underline;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }
  </style>
  