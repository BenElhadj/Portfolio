<template>
  <div class="timeline-viewport" ref="viewport">
    <!-- Avatar 3D -->
    <Avatar3D :speed="Math.abs(state.speed) / maxSpeed" />

    <!-- piste -->
    <div class="timeline-track" ref="track" :style="{ width: trackWidth + 'px' }">
      <div
        v-for="(m, i) in milestones"
        :key="i"
        class="milestone"
        :style="{ left: m.x + 'px' }"
      >
        <div class="dot"></div>
        <div class="label">{{ m.label }}</div>
      </div>
    </div>

    <!-- Soleil/Lune -->
    <div class="sky-icon"></div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from "vue";
import gsap from "gsap";
import Avatar3D from "./Avatar3D.vue";

const viewport = ref(null);
const track = ref(null);
const avatarComp = ref(null);

let trackWidth = window.innerWidth * 3;
const maxSpeed = 1200;
const startAvatarX = 24;
let centerThreshold = window.innerWidth * 0.5;
let worldMax = trackWidth - window.innerWidth + centerThreshold;

const state = reactive({
  worldPos: 0,
  desiredSpeed: 0,
  speed: 0,
  facing: 1,
  avatarState: "student"
});

const milestones = [
  { x: 80, label: "Naissance" },
  { x: 600, label: "École" },
  { x: 1300, label: "BTS / 42" },
  { x: 2100, label: "1er job" },
  { x: 2600, label: "Pro" }
];

const avatarState = ref(state.avatarState);
const facing = ref(state.facing);

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function handleMouseMove(e) {
  const centerX = window.innerWidth / 2;
  const distanceFromCenter = (e.clientX - centerX) / centerX;
  state.desiredSpeed = clamp(distanceFromCenter * maxSpeed, -maxSpeed, maxSpeed);
}

function handleResize() {
  trackWidth = window.innerWidth * 3;
  centerThreshold = window.innerWidth * 0.5;
  worldMax = trackWidth - window.innerWidth + centerThreshold;
}

let rafId;
let lastTime = performance.now();

function update(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  state.speed += (state.desiredSpeed - state.speed) * 0.18;
  if (Math.abs(state.desiredSpeed) < 2 && Math.abs(state.speed) < 0.5) state.speed = 0;

  state.worldPos += state.speed * dt;
  state.worldPos = clamp(state.worldPos, 0, worldMax);

  if (state.speed > 6) state.facing = 1;
  else if (state.speed < -6) state.facing = -1;

  facing.value = state.facing;

  const centerX = window.innerWidth / 2;
  let avatarScreenX;
  let trackTranslateX;

  if (state.worldPos < centerThreshold) {
    avatarScreenX = startAvatarX + state.worldPos;
    trackTranslateX = 0;
  } else {
    avatarScreenX = centerX;
    trackTranslateX = -(state.worldPos - centerThreshold);
  }

  avatarScreenX = Math.max(avatarScreenX, startAvatarX);

  if (avatarComp.value && avatarComp.value.root) {
    gsap.to(avatarComp.value.root, {
      x: avatarScreenX - avatarComp.value.root.clientWidth / 2,
      duration: 0.14,
      ease: "power1.out",
      overwrite: true
    });
  }
  if (track.value) {
    gsap.to(track.value, {
      x: trackTranslateX,
      duration: 0.22,
      ease: "power1.out",
      overwrite: true
    });
  }

  const progress = state.worldPos / worldMax;
  let newState = "student";
  if (progress < 0.22) newState = "baby";
  else if (progress < 0.62) newState = "student";
  else newState = "pro";

  if (newState !== avatarState.value) avatarState.value = newState;

  state.avatarState = avatarState.value;
  rafId = requestAnimationFrame(update);
}

onMounted(() => {
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("resize", handleResize);
  lastTime = performance.now();
  rafId = requestAnimationFrame(update);
});

onUnmounted(() => {
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("resize", handleResize);
  cancelAnimationFrame(rafId);
});
</script>
