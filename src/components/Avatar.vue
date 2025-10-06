<template>
    <div ref="root" class="avatar-root">
      <!-- SVG placeholder : remplace par une image si tu veux -->
      <svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid meet" class="avatar-svg">
        <!-- corps (cercle) -->
        <circle cx="60" cy="60" r="48" :fill="bgColor" stroke="#222" stroke-width="2"/>
        <!-- yeux -->
        <g :transform="eyeTransform">
          <circle cx="42" cy="52" r="5" fill="#111"/>
          <circle cx="78" cy="52" r="5" fill="#111"/>
        </g>
        <!-- bouche simple -->
        <path v-if="state !== 'baby'" d="M42 78 Q60 90 78 78" stroke="#111" stroke-width="3" fill="none" stroke-linecap="round" />
        <!-- sucette pour bébé -->
        <g v-else>
          <circle cx="80" cy="70" r="6" fill="#f08"/>
          <rect x="76" y="70" width="2" height="18" fill="#d3d3d3"/>
        </g>
      </svg>
    </div>
  </template>
  
  <script setup>
  import { ref, watch, onMounted } from 'vue';
  import gsap from 'gsap';
  
  const props = defineProps({
    state: { type: String, default: 'student' }, // 'baby' | 'student' | 'pro'
    facing: { type: Number, default: 1 } // 1 ou -1
  });
  
  const root = ref(null);
  
  const scaleMap = {
    baby: 0.65,
    student: 0.95,
    pro: 1.2
  };
  
  const bgColorMap = {
    baby: '#ffd9c2',
    student: '#cfe8ff',
    pro: '#d6f5d6'
  };
  
  onMounted(() => {
    // initialisation visuelle
    gsap.set(root.value, {
      scale: scaleMap[props.state] || 1,
      scaleX: props.facing || 1
    });
  });
  
  watch(() => props.state, (newS) => {
    // animation de "grandir" à chaque changement d'état
    gsap.to(root.value, { scale: scaleMap[newS] || 1, duration: 0.6, ease: 'power2.out' });
  });
  
  watch(() => props.facing, (f) => {
    // flip horizontal rapide selon direction
    gsap.to(root.value, { scaleX: f || 1, duration: 0.18, ease: 'power1.out' });
  });
  
  // expose le root pour que le parent puisse animer la translation x directement si besoin
  defineExpose({ root });
  
  const state = props.state;
  const bgColor = bgColorMap[props.state] || '#ddd';
  const eyeTransform = props.state === 'baby' ? 'scale(0.9) translate(0,2)' : 'none';
  </script>
  
  <style scoped>
  .avatar-root{
    position: absolute;
    bottom: 10%;
    transform-origin: center center;
    translate: 0 -50%;
    width: 120px;
    height: 120px;
    pointer-events:all; /* avatar n'intercepte pas la souris */
  }
  .avatar-svg{
    width:100%;
    height:100%;
    display:block;
  }
  </style>
  