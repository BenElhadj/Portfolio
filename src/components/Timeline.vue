<template>
  <div class="timeline-viewport" ref="viewport">
    
    <!-- Overlay d'infos actives: du Début à la Fin -->
    <div class="timeline-overlay" aria-hidden="true">

  <div v-for="entry in activeInfoList" :key="entry.key" class="card line-card overlay-item">
        <div v-if="entry.logoPath" class="overlay-logo">
          <picture>
            <source :srcset="entry.logoPath" type="image/webp" />
            <img :src="entry.logoPath" :alt="entry.info" loading="lazy" />
          </picture>
        </div>
        <!-- Toujours afficher le type (ex: Stage, Technicien...) même si un logo est présent -->
        <div class="overlay-type">{{ t(`timeline.types.${sanitizeKey(entry.type)}`) ?? entry.type }}</div>
        <!-- Afficher l'info (nom de l'entité) uniquement quand il n'y a pas de logo (fallback texte) -->
        <div v-if="!entry.logoPath" class="overlay-info">{{ t(`timeline.infos.${sanitizeKey(entry.info)}`) ?? entry.info }}</div>
        <!-- Pour les formations, afficher le niveau si fourni -->
        <div v-if="entry.Niveau" class="overlay-level">{{ t(`timeline.levels.${sanitizeKey(entry.Niveau)}`) ?? entry.Niveau }}</div>
      </div>
    </div>

    <!-- Piste: largeur dynamique selon nombre d'événements -->
    <div class="timeline-track" ref="track" :style="{ width: trackWidth + 'px' }">
      <div
        v-for="(m, i) in eventMarkers"
        :key="i"
        class="milestone"
        :style="{ left: m.x + 'px' }"
      >
        <div class="dot"></div>
      </div>
    </div>

    <!-- Avatar: marche pilotée par la timeline (vitesse/direction depuis la souris) -->
    <Avatar3D :useMouseForWalk="false" :walkSpeed="avatarWalkSpeed" :walkDirection="state.facing" />

    <!-- Flux d'années avec scanner + étoiles -->
    <YearStream />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import gsap from "gsap";
import Avatar3D from "./Avatar3D.vue";
import { timelineEvents } from "../timelineEvents.js";
import YearStream from "./YearStream.vue";
import { getAssetPath } from "../utils/assets.js";

/* Références DOM */
const viewport = ref(null);
const track = ref(null);

/* État réactif */
const trackWidth = ref(0);
const worldMax = ref(0);
const maxSpeed = 1200;
const eventSpacing = 380;

const state = reactive({
  worldPos: 0,
  facing: 1
});

/* Animation */
const avatarWalkSpeed = ref(0);
const targetWalkSpeed = ref(0);
const prevVisIndex = ref(0);
const prevChronIndex = ref(0);
const activeInfoMap = ref(new Map());

/* Constants */
const CYCLE_BASE = 2.6;
const CYCLE_GAIN = 6.0;
let walkPhase = 0;
let rafId = null;
let lastTime = 0;
let isAnimating = false;

/* Utils optimisés */
const { t } = useI18n();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const isFormation = (typeStr = "") => 
  String(typeStr).toLowerCase().includes('formation');

/* Memoïfication des fonctions de calcul */
const sanitizeKey = (() => {
  const cache = new Map();
  return (str = "") => {
    if (cache.has(str)) return cache.get(str);
    const s = String(str)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_");
    const result = s || "_";
    cache.set(str, result);
    return result;
  };
})();

const normalizeForLookup = (() => {
  const cache = new Map();
  return (s = "") => {
    if (cache.has(s)) return cache.get(s);
    const result = String(s)
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\(.+\)/g, '')
      .replace(/[^\w+s+\-]/g, '')
      .trim()
      .toLowerCase();
    cache.set(s, result);
    return result;
  };
})();

/* Logo path avec memoïfication */
const logoPathForEntry = (() => {
  const cache = new Map();
  return (entry) => {
    if (!entry) return null;
    const cacheKey = `${entry.type}|${entry.info}|${entry.logo || ''}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    
    let result = null;
    
    if (entry.logo) {
      const logo = String(entry.logo || '').trim();
      if (!logo) {
        result = null;
      } else if (/^https?:\/\//i.test(logo)) {
        result = logo;
      } else if (/^(experiences|degrees)\//i.test(logo)) {
        // Si le logo commence déjà par experiences/ ou degrees/, ne pas ajouter de préfixe
        result = getAssetPath(logo);
      } else if (/^\/(experiences|degrees)/i.test(logo)) {
        // Si le logo commence par /experiences/ ou /degrees/, enlever le premier slash
        result = getAssetPath(logo.replace(/^\//, ''));
      } else {
        const prefix = isFormation(entry.type) ? 'degrees' : 'experiences';
        result = getAssetPath(`${prefix}/${logo}`);
      }
    } else if (entry.info) {
      const norm = normalizeForLookup(entry.info).replace(/\s+/g, '_');
      const prefix = isFormation(entry.type) ? 'degrees' : 'experiences';
      result = getAssetPath(`${prefix}/${norm}.webp`);
    }
    
    cache.set(cacheKey, result);
    return result;
  };
})();

/* Computed optimisés */
const eventMarkers = computed(() => 
  timelineEvents.map((ev, i) => ({
    x: 80 + i * eventSpacing,
    label: `${ev.year} ${t(`timeline.months.${ev.Month}`) ?? ev.Month}`.trim()
  }))
);

const activeInfoList = computed(() => Array.from(activeInfoMap.value.values()));

const makeKey = (ev) => `${ev.type}|${ev.info}`;
const indexFromWorldPos = (wp) => clamp(Math.floor((wp - 80 + eventSpacing * 0.5) / eventSpacing), 0, timelineEvents.length - 1);

/* Gestion des événements optimisée */
const createEntry = (ev) => ({ 
  key: makeKey(ev), 
  type: ev.type, 
  info: ev.info, 
  Niveau: ev.Niveau ?? null, 
  logo: ev.logo ?? null,
  logoPath: logoPathForEntry(ev)
});

const applyForward = (ev) => {
  const key = makeKey(ev);
  if (ev.action === "Début") {
    activeInfoMap.value.set(key, createEntry(ev));
  } else if (ev.action === "Fin") {
    activeInfoMap.value.delete(key);
  } else if (ev.action === "En cours" && !activeInfoMap.value.has(key)) {
    activeInfoMap.value.set(key, createEntry(ev));
  }
};

const applyBackward = (ev) => {
  const key = makeKey(ev);
  if (ev.action === "Début") {
    activeInfoMap.value.delete(key);
  } else if (ev.action === "Fin") {
    // Pour l'événement "Fin", on doit chercher le logo depuis l'événement "Début" correspondant
    const startEvent = timelineEvents.find(e => 
      e.action === "Début" && 
      e.type === ev.type && 
      e.info === ev.info
    );
    const entryWithLogo = { ...ev, logo: startEvent?.logo || ev.logo };
    activeInfoMap.value.set(key, createEntry(entryWithLogo));
  } else if (ev.action === "En cours" && !activeInfoMap.value.has(key)) {
    activeInfoMap.value.set(key, createEntry(ev));
  }
};

/* Mouvement et contrôles optimisés */
const canMoveDir = (dir) => {
  if (dir === 0) return false;
  return !(state.worldPos <= 0 && dir < 0) && !(state.worldPos >= worldMax.value && dir > 0);
};

const handleMouseMove = (e) => {
  const centerX = window.innerWidth / 2;
  const distanceFromCenter = (e.clientX - centerX) / centerX;
  const dir = Math.sign(distanceFromCenter) || 0;
  const speed = clamp(Math.abs(distanceFromCenter), 0, 1);
  
  if (dir === 0) {
    targetWalkSpeed.value = 0;
    return;
  }
  
  if (canMoveDir(dir)) {
    state.facing = dir > 0 ? 1 : -1;
    targetWalkSpeed.value = speed;
    startAnimation();
  } else {
    targetWalkSpeed.value = 0;
  }
};

const handleResize = () => {
  const totalWidth = 80 + Math.max(0, timelineEvents.length - 1) * eventSpacing;
  trackWidth.value = Math.max(totalWidth + window.innerWidth, window.innerWidth * 2);
  worldMax.value = totalWidth;
};

/* Animation optimisée avec démarrage/arrêt automatique */
const startAnimation = () => {
  if (!isAnimating) {
    isAnimating = true;
    lastTime = performance.now();
    rafId = requestAnimationFrame(update);
  }
};

const stopAnimation = () => {
  isAnimating = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
};

const handleYearStreamMotion = (e) => {
  const detail = e?.detail || {};
  const deltaWorld = detail.deltaWorld ?? 0;
  const facing = detail.facing ?? state.facing;
  const speedBoost = detail.speedBoost ?? 0;
  
  state.worldPos = clamp(state.worldPos + deltaWorld, 0, worldMax.value);
  state.facing = facing;
  
  const centerX = window.innerWidth / 2;
  const trackTranslateX = centerX - state.worldPos;
  if (track.value) {
    gsap.to(track.value, { x: trackTranslateX, duration: 0.12, ease: "power1.out", overwrite: true });
  }
  
  avatarWalkSpeed.value = Math.min(1, speedBoost);
  targetWalkSpeed.value = 0;
  
  if (speedBoost > 0) startAnimation();
};

const update = (now) => {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  avatarWalkSpeed.value += (targetWalkSpeed.value - avatarWalkSpeed.value) * 0.25;

  const outwardBlocked = (state.worldPos <= 0 && state.facing < 0) || (state.worldPos >= worldMax.value && state.facing > 0);
  if (outwardBlocked) {
    targetWalkSpeed.value = 0;
    avatarWalkSpeed.value += (0 - avatarWalkSpeed.value) * 0.6;
  }

  const phaseRate = (CYCLE_BASE + CYCLE_GAIN * avatarWalkSpeed.value) * avatarWalkSpeed.value;
  const dPhase = outwardBlocked ? 0 : phaseRate * dt;
  walkPhase += dPhase;

  const stridePx = eventSpacing * (0.35 + 0.65 * avatarWalkSpeed.value);
  const dWorld = state.facing * (dPhase / (2 * Math.PI)) * stridePx;
  state.worldPos = clamp(state.worldPos + dWorld, 0, worldMax.value);

  const centerX = window.innerWidth / 2;
  const trackTranslateX = centerX - state.worldPos;
  if (track.value) {
    gsap.to(track.value, { x: trackTranslateX, duration: 0.22, ease: "power1.out", overwrite: true });
  }

  try {
    window.dispatchEvent(new CustomEvent('timeline-motion', {
      detail: { worldPos: state.worldPos, facing: state.facing, speed: avatarWalkSpeed.value, eventSpacing }
    }));
  } catch {}

  const curVis = indexFromWorldPos(state.worldPos);
  const curChron = curVis;
  
  if (curChron > prevChronIndex.value) {
    for (let i = prevChronIndex.value + 1; i <= curChron; i++) applyForward(timelineEvents[i]);
    prevChronIndex.value = curChron;
  } else if (curChron < prevChronIndex.value) {
    for (let i = prevChronIndex.value; i > curChron; i--) applyBackward(timelineEvents[i]);
    prevChronIndex.value = curChron;
  }
  prevVisIndex.value = curVis;

  if (Math.abs(avatarWalkSpeed.value) < 0.01 && Math.abs(targetWalkSpeed.value) < 0.01) {
    stopAnimation();
  } else {
    rafId = requestAnimationFrame(update);
  }
};

/* Initialisation optimisée */
onMounted(() => {
  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("mousemove", handleMouseMove, { passive: true });
  window.addEventListener('yearstream-motion', handleYearStreamMotion, { passive: true });
  
  handleResize();
  lastTime = performance.now();
  prevVisIndex.value = indexFromWorldPos(state.worldPos);
  prevChronIndex.value = prevVisIndex.value;
  
  // Initialiser les événements actifs au démarrage
  const startIndex = indexFromWorldPos(state.worldPos);
  for (let i = 0; i <= startIndex; i++) {
    applyForward(timelineEvents[i]);
  }
});

onUnmounted(() => {
  stopAnimation();
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener('yearstream-motion', handleYearStreamMotion);
});
</script>
