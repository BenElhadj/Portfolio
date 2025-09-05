<template>
  <div class="timeline-viewport" ref="viewport">
    <!-- avatar (positionnée au-dessus de la piste) -->
    <!-- <Avatar ref="avatarComp" :state="avatarState" :facing="facing" /> -->

    <Avatar3D :speed="Math.abs(state.speed) / maxSpeed" />
    <!-- piste / frise qui défile -->
    <div class="timeline-track" ref="track" :style="{ width: trackWidth + 'px' }">
      <!-- exemples de milestones (remplace par tes vraies données) -->
      <div
        v-for="(m, i) in milestones"
        :key="i"
        class="milestone"
        :style="{ left: m.x + 'px' }"
      >
        <!-- Ici plus tard : les post-its avec GSAP -->
        <div class="dot"></div>
        <div class="label">{{ m.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import gsap from 'gsap';
// import Avatar from './Avatar.vue';
import Avatar3D from './Avatar3D.vue';

const viewport = ref(null);
const track = ref(null);
const avatarComp = ref(null);

// configuration (ajuste ces valeurs selon ton design)
let trackWidth = window.innerWidth * 3; // largeur totale de la frise (300% de la fenêtre)
const maxSpeed = 1200; // px / s (vitesse max)
const startAvatarX = 24; // marge de départ (px) => avatar commence visible à gauche
let centerThreshold = window.innerWidth * 0.5; // quand l'avatar arrive au centre
let worldMax = trackWidth - window.innerWidth + centerThreshold; // position max du monde

// état réactif
const state = reactive({
  worldPos: 0,
  desiredSpeed: 0,
  speed: 0,
  facing: 1,
  avatarState: 'student'
});

const milestones = [
  { x: 80, label: 'Naissance' },
  { x: 600, label: 'École' },
  { x: 1300, label: 'BTS / 42' },
  { x: 2100, label: '1er job' },
  { x: 2600, label: 'Pro' }
];

// expose pour template/composants
const avatarState = ref(state.avatarState);
const facing = ref(state.facing);

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function handleMouseMove(e) {
  const centerX = window.innerWidth / 2;
  const distanceFromCenter = (e.clientX - centerX) / centerX; // -1 .. 1
  state.desiredSpeed = clamp(distanceFromCenter * maxSpeed, -maxSpeed, maxSpeed);
}

function handleResize(){
  trackWidth = window.innerWidth * 3;
  centerThreshold = window.innerWidth * 0.5;
  worldMax = trackWidth - window.innerWidth + centerThreshold;
  // reposition immediate for éviter sauts visibles
  // (on laisse la logique d'update corriger les transforms)
}

let rafId;
let lastTime = performance.now();

function update(now) {
  const dt = (now - lastTime) / 1000; // seconds
  lastTime = now;

  // lissage de la vitesse (pour fluidité)
  state.speed += (state.desiredSpeed - state.speed) * 0.18;

  // mettre un petit "friction" quand proche de 0
  if (Math.abs(state.desiredSpeed) < 2 && Math.abs(state.speed) < 0.5) state.speed = 0;

  // mise à jour de la position du "monde"
  state.worldPos += state.speed * dt;
  state.worldPos = clamp(state.worldPos, 0, worldMax);

  // déterminer direction/flip
  if (state.speed > 6) state.facing = 1;
  else if (state.speed < -6) state.facing = -1;
  // else garder dernier facing

  facing.value = state.facing;

  // calcul avatar vs track
  const centerX = window.innerWidth / 2;
  let avatarScreenX;
  let trackTranslateX;

  if (state.worldPos < centerThreshold) {
    // on déplace l'avatar depuis la gauche jusque au centerThreshold
    avatarScreenX = startAvatarX + state.worldPos;
    trackTranslateX = 0;
  } else {
    // avatar bloqué au centre, on translate la piste
    avatarScreenX = centerX;
    trackTranslateX = -(state.worldPos - centerThreshold);
  }

  // garder avatar visible (éviter disparition gauche) - safeguard
  avatarScreenX = Math.max(avatarScreenX, startAvatarX);

  // appliquer transforms via GSAP (smooth)
  if (avatarComp.value && avatarComp.value.root) {
    gsap.to(avatarComp.value.root, {
      x: avatarScreenX - (avatarComp.value.root.clientWidth / 2),
      duration: 0.14,
      ease: 'power1.out',
      overwrite: true
    });
  }
  if (track.value) {
    gsap.to(track.value, {
      x: trackTranslateX,
      duration: 0.22,
      ease: 'power1.out',
      overwrite: true
    });
  }

  // état avatar selon progression (ajuste seuils selon ton scénario)
  const progress = state.worldPos / worldMax;
  let newState = 'student';
  if (progress < 0.22) newState = 'baby';
  else if (progress < 0.62) newState = 'student';
  else newState = 'pro';

  if (newState !== avatarState.value) {
    avatarState.value = newState;
  }

  // publier la valeur reactives exposées
  state.avatarState = avatarState.value;

  rafId = requestAnimationFrame(update);
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('resize', handleResize);
  lastTime = performance.now();
  rafId = requestAnimationFrame(update);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('resize', handleResize);
  cancelAnimationFrame(rafId);
});
</script>

<style scoped>
.timeline-viewport {
  position: relative;
  width: 100%;
  height: 100vh; /* au lieu de 260px */
  overflow: hidden;
  background: linear-gradient(90deg, #0ea5e9 0%, #60a5fa 100%);
  border-bottom: none; /* plus besoin de bordure */
}


/* la piste large qui va se translater */
.timeline-track {
  position: absolute;
  height: 100%;
  left: 0;
  top: 0;
  display: block;
  /* background simple pour debug (enlève si tu veux) */
  background-image: linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 60px 100%;
}

/* milestone (exemples) */
.milestone {
  position: absolute;
  bottom: 28px;
  transform: translateX(-50%);
  text-align: center;
  pointer-events: none;
}
.milestone .dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #222;
  margin: 0 auto;
}
.milestone .label {
  margin-top: 6px;
  font-size: 12px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0,0,0,0.35);
}
</style>
