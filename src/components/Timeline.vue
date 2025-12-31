<template>
  <div class="timeline-viewport" ref="viewport">
    <!-- Avatar: marche pilotée par la timeline (vitesse/direction depuis la souris) -->
    <Avatar3D :useMouseForWalk="false" :walkSpeed="avatarWalkSpeed" :walkDirection="state.facing" />

    <!-- Piste: largeur dynamique selon nombre d'événements -->
    <div class="timeline-track" ref="track" :style="{ width: trackWidth + 'px' }">
      <div
        v-for="(m, i) in eventMarkers"
        :key="i"
        :class="['milestone', 'cat-' + m.category]"
        :style="{ left: m.x + 'px' }"
      >
        <div class="dot"></div>
        <div class="label">{{ m.label }}</div>
      </div>
    </div>

    <!-- Overlay d'infos actives: du Début à la Fin -->
    <div class="timeline-overlay" aria-hidden="true">
      <div v-for="entry in activeInfoList" :key="entry.key" class="overlay-item">
        <div class="overlay-type">{{ entry.type }}</div>
        <div class="overlay-info">{{ entry.info }}</div>
        <div v-if="entry.Niveau" class="overlay-level">{{ entry.Niveau }}</div>
      </div>
    </div>

    <div class="sky-icon"></div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from "vue";
import gsap from "gsap";
import Avatar3D from "./Avatar3D.vue";
import { timelineEvents } from "../timelineEvents.js";

const viewport = ref(null);
const track = ref(null);
// Direction de langue (RTL/LTR)
const isRTL = ref(false);

let trackWidth = 0;
const maxSpeed = 1200;
let worldMax = 0; // coordonnée max (dernier événement)

const state = reactive({
  worldPos: 0,
  facing: 1
});

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Constantes de positionnement
const TRACK_START_OFFSET = 80; // px - décalage du premier événement
const eventSpacing = 380; // px
function getCategory(typeStr = "") {
  const t = String(typeStr).toLowerCase();
  if (t.includes("formation")) return "formation";
  if (t.includes("stage")) return "stage";
  // mots clés liés au travail
  if (
    t.includes("développeur") || t.includes("technicien") || t.includes("gestionnaire") ||
    t.includes("commercial") || t.includes("associé") || t.includes("propriétaire") ||
    t.includes("web3") || t.includes("ia") || t.includes("machine learning") || t.includes("travail")
  ) return "travail";
  if (t.includes("nouveau départ") || t.includes("immigration")) return "autre";
  return "autre";
}

const eventMarkers = computed(() => {
  const list = isRTL.value ? [...timelineEvents].reverse() : timelineEvents;
  return list.map((ev, i) => ({
    x: TRACK_START_OFFSET + i * eventSpacing,
    label: `${ev.year} ${ev.Month ?? ""}`.trim(),
    category: getCategory(ev.type)
  }));
});

// Overlay d'infos actives
const activeInfoMap = ref(new Map());
const activeInfoList = computed(() => Array.from(activeInfoMap.value.values()));
const makeKey = (ev) => `${ev.type}|${ev.info}`;

function applyForward(ev) {
  const key = makeKey(ev);
  if (ev.action === "Début") {
    activeInfoMap.value.set(key, { key, type: ev.type, info: ev.info, Niveau: ev.Niveau ?? null });
  } else if (ev.action === "Fin") {
    activeInfoMap.value.delete(key);
  } else if (ev.action === "En cours") {
    if (!activeInfoMap.value.has(key)) {
      activeInfoMap.value.set(key, { key, type: ev.type, info: ev.info, Niveau: ev.Niveau ?? null });
    }
  }
}

function applyBackward(ev) {
  const key = makeKey(ev);
  if (ev.action === "Début") {
    // en remontant avant le début: l'info n'est plus active
    activeInfoMap.value.delete(key);
  } else if (ev.action === "Fin") {
    // en remontant avant la fin: l'info redevient active
    activeInfoMap.value.set(key, { key, type: ev.type, info: ev.info, Niveau: ev.Niveau ?? null });
  } else if (ev.action === "En cours") {
    if (!activeInfoMap.value.has(key)) {
      activeInfoMap.value.set(key, { key, type: ev.type, info: ev.info, Niveau: ev.Niveau ?? null });
    }
  }
}

// Index selon worldPos
const indexFromWorldPos = (wp) => clamp(Math.floor((wp - TRACK_START_OFFSET + eventSpacing * 0.5) / eventSpacing), 0, timelineEvents.length - 1);
const prevVisIndex = ref(0);
const prevChronIndex = ref(0);

// Avatar walk speed (0..1) + cible pour lissage
const avatarWalkSpeed = ref(0);
const targetWalkSpeed = ref(0);
// Phase de marche (pour synchroniser distance et pas)
const CYCLE_BASE = 2.6;   // correspond au preset 'normal' d'Avatar3D
const CYCLE_GAIN = 6.0;   // idem
let walkPhase = 0;        // cumul en radians

/**
 * Gère le changement de langue et préserve la position chronologique
 * @param {string} lang - Code de langue (fr, en, ar)
 */
function handleLanguageChange(lang) {
  const newIsRTL = (lang === "ar") || (document.documentElement.getAttribute("dir") === "rtl");
  
  // Si la direction change, conserver le même événement chronologique
  if (newIsRTL !== isRTL.value) {
    // Calculer l'index chronologique actuel
    const currentVisIndex = indexFromWorldPos(state.worldPos);
    const currentChronIndex = isRTL.value ? (timelineEvents.length - 1 - currentVisIndex) : currentVisIndex;
    
    // Basculer la direction
    isRTL.value = newIsRTL;
    
    // Calculer le nouvel index visuel pour le même événement chronologique
    const newVisIndex = newIsRTL ? (timelineEvents.length - 1 - currentChronIndex) : currentChronIndex;
    
    // Mettre à jour worldPos pour pointer vers le même événement
    state.worldPos = TRACK_START_OFFSET + newVisIndex * eventSpacing;
    
    // Mettre à jour les index de suivi
    prevVisIndex.value = newVisIndex;
    prevChronIndex.value = currentChronIndex;
  } else {
    isRTL.value = newIsRTL;
  }
}

function handleMouseMove(e) {
  const centerX = window.innerWidth / 2;
  const distanceFromCenter = (e.clientX - centerX) / centerX; // [-1..1]
  const dir = Math.sign(distanceFromCenter) || 0;
  if (dir !== 0) state.facing = dir > 0 ? 1 : -1;
  targetWalkSpeed.value = clamp(Math.abs(distanceFromCenter), 0, 1);
}

function handleResize() {
  const totalWidth = TRACK_START_OFFSET + Math.max(0, timelineEvents.length - 1) * eventSpacing; // x du dernier événement
  // largeur de piste suffisante: contenu + un écran pour le centrage aux bornes
  trackWidth = Math.max(totalWidth + window.innerWidth, window.innerWidth * 2);
  // worldMax devient la coordonnée du dernier événement
  worldMax = totalWidth;
}

let rafId;
let lastTime = performance.now();

function update(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  // Lisser la vitesse de marche (0..1)
  avatarWalkSpeed.value += (targetWalkSpeed.value - avatarWalkSpeed.value) * 0.25;

  // Bloquer la marche si on pousse vers l'extérieur aux bornes
  const outwardBlocked = (state.worldPos <= 0 && state.facing < 0) || (state.worldPos >= worldMax && state.facing > 0);

  // Avancer la phase de marche (synchro avec Avatar3D)
  const phaseRate = (CYCLE_BASE + CYCLE_GAIN * avatarWalkSpeed.value) * avatarWalkSpeed.value; // rad/s
  const dPhase = outwardBlocked ? 0 : phaseRate * dt;
  walkPhase += dPhase;

  // Distance par cycle: dépend fortement de la vitesse et de l'espacement voulu
  // Objectif: à vitesse max, ~0.6 * eventSpacing par cycle (≈1.2s par événement)
  const stridePx = eventSpacing * (0.25 + 0.35 * avatarWalkSpeed.value);
  const dWorld = state.facing * (dPhase / (2 * Math.PI)) * stridePx;
  state.worldPos = clamp(state.worldPos + dWorld, 0, worldMax);

  // translation de la piste pour centrer worldPos au milieu de l'écran
  const centerX = window.innerWidth / 2;
  const trackTranslateX = centerX - state.worldPos;
  if (track.value) {
    gsap.to(track.value, { x: trackTranslateX, duration: 0.22, ease: "power1.out", overwrite: true });
  }

  // avatarWalkSpeed déjà lissé plus haut; rien à recalculer ici

  // détection de franchissement d'index (visible → chronologique selon RTL/LTR)
  const curVis = indexFromWorldPos(state.worldPos);
  const curChron = isRTL.value ? (timelineEvents.length - 1 - curVis) : curVis;
  if (curChron > prevChronIndex.value) {
    for (let i = prevChronIndex.value + 1; i <= curChron; i++) applyForward(timelineEvents[i]);
    prevChronIndex.value = curChron;
  } else if (curChron < prevChronIndex.value) {
    for (let i = prevChronIndex.value; i > curChron; i--) applyBackward(timelineEvents[i]);
    prevChronIndex.value = curChron;
  }
  prevVisIndex.value = curVis;

  rafId = requestAnimationFrame(update);
}

onMounted(() => {
  window.addEventListener("resize", handleResize);
  window.addEventListener("mousemove", handleMouseMove);
  // initialiser RTL depuis <html dir="...">
  try { isRTL.value = (document.documentElement.getAttribute("dir") === "rtl"); } catch {}
  // mettre à jour quand la langue change (Navbar émet 'language-changed')
  window.addEventListener("language-changed", (e) => {
    const lang = (e?.detail?.lang) || (document.documentElement.getAttribute("lang") || "fr");
    handleLanguageChange(lang);
  });
  handleResize();
  lastTime = performance.now();
  prevVisIndex.value = indexFromWorldPos(state.worldPos);
  prevChronIndex.value = isRTL.value ? (timelineEvents.length - 1 - prevVisIndex.value) : prevVisIndex.value;
  rafId = requestAnimationFrame(update);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("mousemove", handleMouseMove);
  cancelAnimationFrame(rafId);
});
</script>
