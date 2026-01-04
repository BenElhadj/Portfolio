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
        <!-- Label removed: YearStream now provides aligned labels -->
      </div>
    </div>

    <!-- Flux d'années avec scanner + étoiles -->
    <YearStream />

    <!-- Overlay d'infos actives: du Début à la Fin -->
    <div class="timeline-overlay" aria-hidden="true">

      <div v-for="entry in activeInfoList" :key="entry.key" class="overlay-item">
  <div class="overlay-type">{{ t(`timeline.types.${sanitizeKey(entry.type)}`) ?? entry.type }}</div>
  <div class="overlay-info">{{ t(`timeline.infos.${sanitizeKey(entry.info)}`) ?? entry.info }}</div>
  <div v-if="entry.Niveau" class="overlay-level">{{ t(`timeline.levels.${sanitizeKey(entry.Niveau)}`) ?? entry.Niveau }}</div>
      </div>
    </div>

    <div class="sky-icon"></div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import gsap from "gsap";
import Avatar3D from "./Avatar3D.vue";
import { timelineEvents } from "../timelineEvents.js";
import YearStream from "./YearStream.vue";

const viewport = ref(null);
const track = ref(null);
// Garder le même sens pour toutes les langues (pas d'inversion RTL)

let trackWidth = 0;
const maxSpeed = 1200;
let worldMax = 0; // coordonnée max (dernier événement)

const state = reactive({
  worldPos: 0,
  facing: 1
});

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Espacement et marqueurs (légèrement rapproché)
const eventSpacing = 380 // px
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

const { t } = (() => { try { return useI18n(); } catch { return { t: (k) => k }; } })();

// Sanitize a label into a stable i18n key: remove accents, non-alphanumerics to '_', collapse and trim
function sanitizeKey(str = "") {
  const s = String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  return s || "_";
}

const eventMarkers = computed(() => {
  // Toujours LTR: ne pas inverser l'ordre pour l'arabe
  return timelineEvents.map((ev, i) => ({
    x: 80 + i * eventSpacing,
    label: `${ev.year} ${t(`timeline.months.${ev.Month}`) ?? ev.Month}`.trim(),
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
const indexFromWorldPos = (wp) => clamp(Math.floor((wp - 80 + eventSpacing * 0.5) / eventSpacing), 0, timelineEvents.length - 1);
const prevVisIndex = ref(0);
const prevChronIndex = ref(0);

// Avatar walk speed (0..1) + cible pour lissage
const avatarWalkSpeed = ref(0);
const targetWalkSpeed = ref(0);
// Phase de marche (pour synchroniser distance et pas)
const CYCLE_BASE = 2.6;   // correspond au preset 'normal' d'Avatar3D
const CYCLE_GAIN = 6.0;   // idem
let walkPhase = 0;        // cumul en radians

// Helper: peut-on se déplacer dans une direction donnée ?
const canMoveDir = (dir) => {
  if (dir === 0) return false;
  // côté vide = pousser hors de la timeline
  if (state.worldPos <= 0 && dir < 0) return false;      // au début, gauche interdit
  if (state.worldPos >= worldMax && dir > 0) return false; // à la fin, droite interdite
  return true;
};

function handleMouseMove(e) {
  const centerX = window.innerWidth / 2;
  const distanceFromCenter = (e.clientX - centerX) / centerX; // [-1..1]
  const dir = Math.sign(distanceFromCenter) || 0;
  const speed = clamp(Math.abs(distanceFromCenter), 0, 1);
  // Bloquer toute marche vers le côté vide aux bornes
  if (dir === 0) {
    targetWalkSpeed.value = 0;
    return;
  }
  if (canMoveDir(dir)) {
    state.facing = dir > 0 ? 1 : -1;
    targetWalkSpeed.value = speed;
  } else {
    // côté vide: ne pas changer la direction, arrêter la marche
    targetWalkSpeed.value = 0;
  }
}

function handleResize() {
  const totalWidth = 80 + Math.max(0, timelineEvents.length - 1) * eventSpacing; // x du dernier événement
  // largeur de piste suffisante: contenu + un écran pour le centrage aux bornes
  trackWidth = Math.max(totalWidth + window.innerWidth, window.innerWidth * 2);
  // worldMax devient la coordonnée du dernier événement
  worldMax = totalWidth;
}

let rafId;
let lastTime = performance.now();

// Handle motion emitted from YearStream (drag/wheel control)
function handleYearStreamMotion(e) {
  const detail = e?.detail || {};
  const deltaWorld = detail.deltaWorld ?? 0;
  const facing = detail.facing ?? state.facing;
  const speedBoost = detail.speedBoost ?? 0;
  // Apply world position change directly, clamped to bounds
  state.worldPos = clamp(state.worldPos + deltaWorld, 0, worldMax);
  state.facing = facing;
  // Animate track immediately to reflect new position
  const centerX = window.innerWidth / 2;
  const trackTranslateX = centerX - state.worldPos;
  if (track.value) {
    gsap.to(track.value, { x: trackTranslateX, duration: 0.12, ease: "power1.out", overwrite: true });
  }
  // Briefly boost avatar leg animation without inducing extra drift
  avatarWalkSpeed.value = Math.min(1, speedBoost);
  targetWalkSpeed.value = 0; // avoid double movement accumulation
}

function update(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  // Lisser la vitesse de marche (0..1)
  avatarWalkSpeed.value += (targetWalkSpeed.value - avatarWalkSpeed.value) * 0.25;

  // Bloquer la marche si on pousse vers l'extérieur aux bornes
  const outwardBlocked = (state.worldPos <= 0 && state.facing < 0) || (state.worldPos >= worldMax && state.facing > 0);
  if (outwardBlocked) {
    // arrêt immédiat de l'animation de marche côté vide
    targetWalkSpeed.value = 0;
    avatarWalkSpeed.value += (0 - avatarWalkSpeed.value) * 0.6; // amortissement agressif
  }

  // Avancer la phase de marche (synchro avec Avatar3D)
  const phaseRate = (CYCLE_BASE + CYCLE_GAIN * avatarWalkSpeed.value) * avatarWalkSpeed.value; // rad/s
  const dPhase = outwardBlocked ? 0 : phaseRate * dt;
  walkPhase += dPhase;

  // Distance par cycle: dépend fortement de la vitesse et de l'espacement voulu
  // Objectif: à vitesse max, ~0.6 * eventSpacing par cycle (≈1.2s par événement)
  // Augmenter la distance parcourue par cycle pour accélérer le déplacement sur la timeline
  const stridePx = eventSpacing * (0.35 + 0.65 * avatarWalkSpeed.value);
  const dWorld = state.facing * (dPhase / (2 * Math.PI)) * stridePx;
  state.worldPos = clamp(state.worldPos + dWorld, 0, worldMax);

  // translation de la piste pour centrer worldPos au milieu de l'écran
  const centerX = window.innerWidth / 2;
  const trackTranslateX = centerX - state.worldPos;
  if (track.value) {
    gsap.to(track.value, { x: trackTranslateX, duration: 0.22, ease: "power1.out", overwrite: true });
  }

  // Broadcast motion state so YearStream can mirror the avatar's direction and speed
  try {
    window.dispatchEvent(new CustomEvent('timeline-motion', {
      detail: {
        worldPos: state.worldPos,
        facing: state.facing,
        speed: avatarWalkSpeed.value,
        eventSpacing
      }
    }));
  } catch {}

  // avatarWalkSpeed déjà lissé plus haut; rien à recalculer ici

  // détection de franchissement d'index (visible → chronologique selon RTL/LTR)
  const curVis = indexFromWorldPos(state.worldPos);
  // Conserver l'ordre LTR pour toutes les langues
  const curChron = curVis;
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
  handleResize();
  lastTime = performance.now();
  prevVisIndex.value = indexFromWorldPos(state.worldPos);
  // Conserver l'ordre LTR pour toutes les langues
  prevChronIndex.value = prevVisIndex.value;
  rafId = requestAnimationFrame(update);
  // Listen to YearStream control events
  window.addEventListener('yearstream-motion', handleYearStreamMotion);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener('yearstream-motion', handleYearStreamMotion);
  cancelAnimationFrame(rafId);
});
</script>
