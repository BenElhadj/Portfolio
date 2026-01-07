<template>
  <div class="yearstream" ref="container">
    <!-- Particles (stars) -->
    <canvas ref="particleCanvas" class="ys-particles"></canvas>
  <!-- Light scanner canvas -->
  <canvas ref="scannerCanvas" class="ys-scanner"></canvas>

    <!-- Card stream -->
    <div class="ys-card-stream" ref="cardStream">
      <div class="ys-card-line" ref="cardLine">
        <div
          v-for="(it, i) in items"
          :key="i"
          class="ys-card-wrapper"
          :style="{ left: (80 + i * EVENT_SPACING - CARD_W / 2) + 'px' }"
        >
          <div class="ys-card ys-card-normal">
            <div class="ys-card-gradient"></div>
            <!-- Label matches Timeline's m.label -->
            <div class="ys-card-year">
              <span
                class="ys-year-text"
                :class="{ 'rtl-text': (locale?.value === 'ar') }"
                :lang="locale?.value === 'ar' ? 'ar' : null"
              >{{ it.label }}</span>
            </div>
          </div>
          <div class="ys-card ys-card-ascii">
            <div class="ys-ascii-content" ref="asciiContents[i]"></div>
          </div>
          <!-- Pas d'image à afficher pour chaque événement, balise <picture> supprimée -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import gsap from 'gsap';
import * as THREE from 'three';
import { timelineEvents } from '../timelineEvents.js';
// Toggle to disable the light scanner entirely (active by default)
const SHOW_SCANNER = true;
// Toggle to disable the sweeping overlay across cards (flashlight-like)
const SHOW_SWEEP = false;

// i18n (inclure locale pour reactivité sur changement de langue)
const i18n = (() => { try { return useI18n(); } catch { return { t: (k) => k, locale: { value: 'fr' } }; } })();
const { t, locale } = i18n;

// Items derived from timelineEvents (match Timeline's labels order)
const items = computed(() => {
  const _lang = locale?.value;
  return timelineEvents.map((ev) => ({
    label: `${ev.year} ${t(`timeline.months.${ev.Month}`) ?? ev.Month}`.trim(),
  }));
});

// Refs
const container = ref(null);
const particleCanvas = ref(null);
const scannerCanvas = ref(null);
const cardStream = ref(null);
const cardLine = ref(null);
const asciiContents = ref([]);

// Motion state
let position = 0; // translateX
let velocity = 120; // px/s
let direction = -1; // left
let isAnimating = true;
let isDragging = false;
let lastMouseX = 0;
let mouseVelocity = 0;
const friction = 0.95;
const minVelocity = 30;
let lastTime = 0;
// External motion control (from Timeline)
let externalControl = true;

// Dimensions (réduites)
let containerWidth = 0;
let cardLineWidth = 0;
const CARD_W = 160;   // largeur carte
const CARD_H = 100;   // hauteur carte
let EVENT_SPACING = 380; // align spacing with Timeline labels (runtime-adjustable)
const PARTICLE_H = 80; // hauteur canvas étoiles
const SCANNER_H = 60;  // hauteur canvas scanner / barre lumineuse (réduit de moitié)
// Particle size (px) for blue points
const PARTICLE_SIZE = 8;
// ASCII sizing constants (very small glyphs)
const ASCII_FONT_SIZE = 6;
const ASCII_LINE_HEIGHT = 8; // smaller line height for compact 3-line block
const ASCII_CHAR_WIDTH_RATIO = 0.55; // monospace approx
// Drag speed multiplier to advance timeline faster
const DRAG_SPEED_MULT = 1.8;

// Particles (Three.js)
let three = { scene: null, camera: null, renderer: null, points: null, velocities: null, alphas: null, count: 400 };
// Scanner (2D Canvas)
let scan = { w: 0, h: 300, ctx: null, lightBarX: 0, lightBarWidth: 1, fadeZone: 60, gradientCanvas: null, gradientCtx: null, particles: [], count: 0, baseIntensity: 0.8, intensity: 0.8, maxParticles: 800, transitionSpeed: 0.05, scanningActive: false };

function calculateDimensions() {
  if (!container.value || !cardLine.value) return;
  containerWidth = container.value.offsetWidth;
  const count = items.value.length;
  // Largeur totale de la ligne: du premier marqueur (x=80) au dernier + largeur d'une carte
  cardLineWidth = (80 + Math.max(0, count - 1) * EVENT_SPACING) + CARD_W;
  try { cardLine.value.style.width = cardLineWidth + 'px'; } catch {}
}

function setTransform(x) {
  if (cardLine.value) cardLine.value.style.transform = `translateX(${x}px)`;
}

function updateCardPosition() {
  if (position < -cardLineWidth) position = containerWidth;
  else if (position > containerWidth) position = -cardLineWidth;
  setTransform(position);
  updateCardClipping();
}

function updateSpeedFromMouse(deltaX) {
  mouseVelocity = deltaX * 60;
  if (Math.abs(mouseVelocity) > minVelocity) {
    velocity = Math.abs(mouseVelocity);
    direction = mouseVelocity > 0 ? 1 : -1;
  } else {
    velocity = 120;
  }
}

function startDrag(e) {
  e.preventDefault();
  isDragging = true; isAnimating = false; mouseVelocity = 0;
  lastMouseX = e.clientX ?? 0;
  const transform = window.getComputedStyle(cardLine.value).transform;
  if (transform && transform !== 'none') {
    const m = new DOMMatrix(transform); position = m.m41;
  }
  cardLine.value.classList.add('dragging');
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'grabbing';
}
function onDrag(e) {
  if (!isDragging) return; e.preventDefault();
  const dx = e.clientX - lastMouseX; lastMouseX = e.clientX;
  position += dx; updateSpeedFromMouse(dx); setTransform(position); updateCardClipping();
  // Emit motion to advance Timeline based on drag delta
  emitTimelineControl(dx);
}
function endDrag() {
  if (!isDragging) return; isDragging = false; cardLine.value.classList.remove('dragging');
  isAnimating = true; document.body.style.userSelect = ''; document.body.style.cursor = '';
}

function onWheel(e) {
  e.preventDefault(); const scrollSpeed = 20; const delta = e.deltaY > 0 ? scrollSpeed : -scrollSpeed;
  position += delta; updateCardPosition(); updateCardClipping();
  // Emit motion to advance Timeline based on wheel
  emitTimelineControl(delta);
}

function animateCards() {
  const now = performance.now(); const dt = (now - lastTime) / 1000; lastTime = now;
  if (!externalControl && isAnimating && !isDragging) {
    velocity = velocity > minVelocity ? velocity * friction : Math.max(minVelocity, velocity);
    position += velocity * direction * dt;
    updateCardPosition();
  }
  requestAnimationFrame(animateCards);
}

// Follow Timeline motion (avatar direction/speed)
function handleTimelineMotion(e) {
  const detail = e?.detail || {};
  const worldPos = detail.worldPos ?? null;
  const facing = detail.facing ?? 0;
  const speed = detail.speed ?? 0;
  const evSpacing = detail.eventSpacing ?? null;
  // Update spacing from Timeline if provided
  if (evSpacing !== null && cardLine.value) {
    EVENT_SPACING = evSpacing;
    calculateDimensions();
    layoutWrappers();
  }
  // Disable internal animation when external control is active
  externalControl = true; isAnimating = false;
  // Translate the card line so the current worldPos is centered, mirroring Timeline
  if (worldPos !== null) {
    const centerX = window.innerWidth / 2;
    const translateX = centerX - worldPos;
    position = translateX;
    // Harmoniser avec Timeline: même easing/durée pour éviter tout décalage visuel
    if (cardLine.value) {
      gsap.to(cardLine.value, { x: translateX, duration: 0.22, ease: 'power1.out', overwrite: true });
    } else {
      setTransform(position);
    }
    updateCardClipping();
  }
  // Keep direction for any manual interactions
  direction = facing >= 0 ? 1 : -1;
}

// Emit control event so Timeline advances according to user drag/wheel
function emitTimelineControl(deltaPx) {
  const deltaWorld = -deltaPx * DRAG_SPEED_MULT; // map drag px to world movement
  const facing = deltaWorld > 0 ? 1 : (deltaWorld < 0 ? -1 : 0);
  // speedBoost based on mouseVelocity magnitude
  const speedBoost = Math.min(1.5, Math.abs(mouseVelocity) / 600);
  try {
    window.dispatchEvent(new CustomEvent('yearstream-motion', {
      detail: { deltaWorld, facing, speedBoost }
    }));
  } catch {}
}

function generateCode(width, height) {
  // Génère un "code binaire" pour servir de squelette à gauche
  const chars = ['0','1'];
  let out = '';
  for (let row = 0; row < height; row++) {
    let line = '';
    for (let col = 0; col < width; col++) {
      line += chars[Math.random() < 0.5 ? 0 : 1];
    }
    out += line + (row < height - 1 ? '\n' : '');
  }
  return out;
}

// Measure the year text footprint and size the ASCII block to match (on the left)
function measureAndLayoutAscii() {
  if (!container.value) return;
  const wrappers = container.value.querySelectorAll('.ys-card-wrapper');
  wrappers.forEach((w) => {
    const yearSpan = w.querySelector('.ys-year-text');
    const asciiNode = w.querySelector('.ys-ascii-content');
    if (!yearSpan || !asciiNode) return;
    // Measure text box
    const rect = yearSpan.getBoundingClientRect();
    // Clamp and position ASCII block
    const measuredW = Math.min(rect.width, CARD_W); // match label width, clamp to card
    const pxW = Math.max(8, Math.floor(measuredW));
    // Fixed height for exactly three small lines
    const pxH = ASCII_LINE_HEIGHT * 3;
    const top = Math.floor((CARD_H - pxH) / 2);
    // Anchor ASCII so its right edge sits at card center: skeleton extends to the left
    const left = Math.floor((CARD_W / 2) - pxW);
    asciiNode.style.width = pxW + 'px';
    asciiNode.style.height = pxH + 'px';
    asciiNode.style.top = top + 'px';
    asciiNode.style.left = left + 'px';
    // Set tiny font metrics for ASCII content
    asciiNode.style.fontSize = ASCII_FONT_SIZE + 'px';
    asciiNode.style.lineHeight = ASCII_LINE_HEIGHT + 'px';
    // Store px dims to compute char grid later
    asciiNode.dataset.pxw = String(pxW);
    asciiNode.dataset.pxh = String(pxH);
  });
}

function computeCodeDimsForNode(node) {
  const pxW = parseFloat(node.dataset.pxw || '0');
  const pxH = parseFloat(node.dataset.pxh || '0');
  const charWidth = Math.max(1, Math.floor(ASCII_FONT_SIZE * ASCII_CHAR_WIDTH_RATIO));
  const width = Math.max(1, Math.floor(pxW / charWidth));
  const height = 3; // exactly three lines
  return { width, height };
}

function updateAsciiContent() {
  const nodes = container.value?.querySelectorAll('.ys-ascii-content') ?? [];
  nodes.forEach((node) => {
    if (Math.random() < 0.15) {
      const { width, height } = computeCodeDimsForNode(node);
      node.textContent = generateCode(width, height);
    }
  });
}

function updateCardClipping() {
  const rect = container.value.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2; // strict boundary at center line
  let anyActive = false;
  const wrappers = container.value.querySelectorAll('.ys-card-wrapper');
  wrappers.forEach((w) => {
    const r = w.getBoundingClientRect();
    const cardLeft = r.left; const cardRight = r.right; const cw = r.width;
    const normal = w.querySelector('.ys-card-normal');
    const ascii = w.querySelector('.ys-card-ascii');
    // If card straddles the center line, apply proportional clipping at that boundary
    if (cardLeft < centerX && cardRight > centerX) {
      anyActive = true;
      const centerOffsetPx = Math.max(0, Math.min(cw, centerX - cardLeft));
      const clipPercent = Math.max(0, Math.min(100, (centerOffsetPx / cw) * 100));
      normal.style.setProperty('--clip-right', `${clipPercent}%`);   // normal visible to the right of center
      ascii.style.setProperty('--clip-left', `${clipPercent}%`);     // ascii visible to the left of center
      // Optional sweep effect across card when crossing center (disabled)
      if (SHOW_SWEEP && !w.hasAttribute('data-scanned')) {
        w.setAttribute('data-scanned', 'true');
        const eff = document.createElement('div'); eff.className = 'ys-scan-effect'; w.appendChild(eff);
        setTimeout(()=>{ if(eff.parentNode) eff.parentNode.removeChild(eff); }, 600);
      }
    } else {
      // Fully on the left of center: show only ASCII
      if (cardRight <= centerX) {
        normal.style.setProperty('--clip-right', '100%');
        ascii.style.setProperty('--clip-left', '100%');
      }
      // Fully on the right of center: show only normal text
      else if (cardLeft >= centerX) {
        normal.style.setProperty('--clip-right', '0%');
        ascii.style.setProperty('--clip-left', '0%');
      }
      w.removeAttribute('data-scanned');
    }
  });
  // Activate scanner visuals when crossing center
  scan.scanningActive = anyActive;
}

function periodicUpdates() {
  const tick = () => { updateAsciiContent(); updateCardClipping(); requestAnimationFrame(tick); };
  tick();
}

// Three.js particles
function initParticles() {
  three.scene = new THREE.Scene();
  three.camera = new THREE.OrthographicCamera(-window.innerWidth/2, window.innerWidth/2, 90, -90, 1, 1000);
  three.camera.position.z = 100;
  three.renderer = new THREE.WebGLRenderer({ canvas: particleCanvas.value, alpha: true, antialias: true });
  three.renderer.setSize(window.innerWidth, PARTICLE_H);
  three.renderer.setClearColor(0x000000, 0);

  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(three.count * 3);
  const colors = new Float32Array(three.count * 3);
  const sizes = new Float32Array(three.count);
  const velocities = new Float32Array(three.count);

  const c = document.createElement('canvas'); c.width = 100; c.height = 100; const ctx = c.getContext('2d');
  const half = c.width/2;
  // Blue glow without dark ring: white core fading to transparent blue
  const grad = ctx.createRadialGradient(half,half,0,half,half,half);
  grad.addColorStop(0.0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(96,165,250,0.85)');
  grad.addColorStop(0.6, 'rgba(96,165,250,0.35)');
  grad.addColorStop(1.0, 'rgba(96,165,250,0)');
  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(half,half,half,0,Math.PI*2); ctx.fill();
  const texture = new THREE.CanvasTexture(c);

  for (let i=0;i<three.count;i++) {
    positions[i*3] = (Math.random()-0.5)*window.innerWidth*2;
    positions[i*3+1] = (Math.random()-0.5)*PARTICLE_H;
    positions[i*3+2] = 0;
    colors[i*3] = 1; colors[i*3+1] = 1; colors[i*3+2] = 1;
    const orbit = Math.random()*200+100; sizes[i] = (Math.random()*(orbit-60)+60)/8;
    velocities[i] = Math.random()*60+30;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions,3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors,3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes,1));
  const alphas = new Float32Array(three.count); for(let i=0;i<three.count;i++) alphas[i] = (Math.random()*8+2)/10; geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas,1));
  three.velocities = velocities; three.alphas = alphas;

  const material = new THREE.ShaderMaterial({
    uniforms: { pointTexture: { value: texture }, size: { value: PARTICLE_SIZE } },
    vertexShader: `attribute float alpha; varying float vAlpha; varying vec3 vColor; uniform float size; void main(){ vAlpha=alpha; vColor=color; vec4 mvPosition=modelViewMatrix*vec4(position,1.0); gl_PointSize=size; gl_Position=projectionMatrix*mvPosition; }`,
    fragmentShader: `uniform sampler2D pointTexture; varying float vAlpha; varying vec3 vColor; void main(){ gl_FragColor=vec4(vColor, vAlpha)*texture2D(pointTexture, gl_PointCoord); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, vertexColors: true,
  });
  three.points = new THREE.Points(geometry, material); three.scene.add(three.points);

  const animate = () => {
    requestAnimationFrame(animate);
    if (three.points) {
      const positions = three.points.geometry.attributes.position.array;
      const alphas = three.points.geometry.attributes.alpha.array;
      const time = Date.now()*0.001;
      for(let i=0;i<three.count;i++) {
        positions[i*3] += three.velocities[i]*0.016;
        if (positions[i*3] > window.innerWidth/2 + 100) { positions[i*3] = -window.innerWidth/2 - 100; positions[i*3+1] = (Math.random()-0.5)*PARTICLE_H; }
        positions[i*3+1] += Math.sin(time + i*0.1)*0.5;
        const tw = Math.floor(Math.random()*10);
        if (tw===1 && alphas[i]>0) alphas[i]-=0.05; else if (tw===2 && alphas[i]<1) alphas[i]+=0.05;
        alphas[i] = Math.max(0, Math.min(1, alphas[i]));
      }
      three.points.geometry.attributes.position.needsUpdate = true;
      three.points.geometry.attributes.alpha.needsUpdate = true;
    }
    three.renderer.render(three.scene, three.camera);
  };
  animate();
}

// Scanner (2D canvas)
function setupScanner() {
  scan.w = container.value.offsetWidth; scan.h = SCANNER_H; scan.lightBarX = scan.w/2;
  const canvas = scannerCanvas.value; canvas.width = scan.w; canvas.height = scan.h; canvas.style.width = scan.w+'px'; canvas.style.height = scan.h+'px';
  scan.ctx = canvas.getContext('2d');

  // Adapter les couleurs au thème (var(--blue))
  const getCssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const baseColor = getCssVar('--blue') || '#60a5fa';
  function hexToRGBA(hex, alpha) {
    const h = hex.replace('#','');
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  function colorWithAlpha(color, alpha) {
    const c = color.trim();
    if (c.startsWith('#')) return hexToRGBA(c, alpha);
    if (c.startsWith('rgb(')) {
      const vals = c.substring(4, c.length-1);
      return `rgba(${vals}, ${alpha})`;
    }
    return `rgba(96, 165, 250, ${alpha})`;
  }

  // gradient cache
  scan.gradientCanvas = document.createElement('canvas'); scan.gradientCanvas.width=16; scan.gradientCanvas.height=16; scan.gradientCtx = scan.gradientCanvas.getContext('2d');
  const half = 8; const g = scan.gradientCtx.createRadialGradient(half,half,0,half,half,half);
  g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.3, colorWithAlpha(baseColor, 0.8)); g.addColorStop(0.7, colorWithAlpha(baseColor, 0.4)); g.addColorStop(1,'transparent');
  scan.gradientCtx.fillStyle = g; scan.gradientCtx.beginPath(); scan.gradientCtx.arc(half,half,half,0,Math.PI*2); scan.gradientCtx.fill();

  // init particles
  scan.particles = []; scan.count = 0;
  const createParticle = () => {
    const intensityRatio = scan.intensity / scan.baseIntensity; const speedMul = 1 + (intensityRatio - 1)*1.2; const sizeMul = 1 + (intensityRatio - 1)*0.7;
    return {
      x: scan.lightBarX + (Math.random()*scan.lightBarWidth - scan.lightBarWidth/2),
      y: Math.random()*scan.h,
      vx: (Math.random()*0.8+0.2)*speedMul,
      vy: (Math.random()*0.3-0.15)*speedMul,
      radius: (Math.random()*0.6+0.4)*sizeMul,
      alpha: Math.random()*0.4 + 0.6,
      decay: (Math.random()*0.02+0.005) * (2 - intensityRatio*0.5),
      originalAlpha: 0, life: 1.0, time: 0, startX: 0,
      twSpeed: (Math.random()*0.06+0.02)*speedMul,
      twAmount: Math.random()*0.15+0.1,
    };
  };
  for(let i=0;i<scan.maxParticles;i++){ const p = createParticle(); p.originalAlpha=p.alpha; p.startX=p.x; scan.count++; scan.particles[scan.count]=p; }

  function resetParticle(p) {
    p.x = scan.lightBarX + (Math.random()*scan.lightBarWidth - scan.lightBarWidth/2);
    p.y = Math.random()*scan.h; p.vx = Math.random()*0.8+0.2; p.vy = Math.random()*0.3-0.15; p.alpha = Math.random()*0.4+0.6; p.originalAlpha=p.alpha; p.life=1.0; p.time=0; p.startX=p.x;
  }
  function updateParticle(p) {
    p.x += p.vx; p.y += p.vy; p.time++;
    p.alpha = p.originalAlpha * p.life + Math.sin(p.time * p.twSpeed) * p.twAmount; p.life -= p.decay;
    if (p.x > scan.w + 10 || p.life <= 0) resetParticle(p);
  }
  function drawParticle(p) {
    const ctx = scan.ctx; if (p.life<=0) return; let fadeAlpha = 1;
    if (p.y < scan.fadeZone) fadeAlpha = p.y / scan.fadeZone; else if (p.y > scan.h - scan.fadeZone) fadeAlpha = (scan.h - p.y)/scan.fadeZone;
    fadeAlpha = Math.max(0, Math.min(1, fadeAlpha));
    ctx.globalAlpha = p.alpha * fadeAlpha; ctx.drawImage(scan.gradientCanvas, p.x - p.radius, p.y - p.radius, p.radius*2, p.radius*2);
  }
  function drawLightBar() {
    const ctx = scan.ctx; const verticalGrad = ctx.createLinearGradient(0,0,0,scan.h);
    verticalGrad.addColorStop(0,'rgba(255,255,255,0)'); verticalGrad.addColorStop(scan.fadeZone/scan.h,'rgba(255,255,255,1)'); verticalGrad.addColorStop(1 - scan.fadeZone/scan.h,'rgba(255,255,255,1)'); verticalGrad.addColorStop(1,'rgba(255,255,255,0)');
    ctx.globalCompositeOperation = 'lighter';
    const targetGlow = scan.scanningActive ? 3.5 : 1; scan.currentGlow ||= 1; scan.currentGlow += (targetGlow - scan.currentGlow) * scan.transitionSpeed;
    const glow = scan.currentGlow; const lw = scan.lightBarWidth;
    const coreGrad = ctx.createLinearGradient(scan.lightBarX - lw/2, 0, scan.lightBarX + lw/2, 0);
    coreGrad.addColorStop(0,'rgba(255,255,255,0)'); coreGrad.addColorStop(0.3,`rgba(255,255,255,${0.9*glow})`); coreGrad.addColorStop(0.5,`rgba(255,255,255,${1*glow})`); coreGrad.addColorStop(0.7,`rgba(255,255,255,${0.9*glow})`); coreGrad.addColorStop(1,'rgba(255,255,255,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = coreGrad; const radius = 15; ctx.beginPath(); ctx.roundRect(scan.lightBarX - lw/2, 0, lw, scan.h, radius); ctx.fill();
    const glow1Grad = ctx.createLinearGradient(scan.lightBarX - lw*2, 0, scan.lightBarX + lw*2, 0);
    glow1Grad.addColorStop(0, colorWithAlpha(baseColor, 0)); glow1Grad.addColorStop(0.5, colorWithAlpha(baseColor, 0.8*glow)); glow1Grad.addColorStop(1, colorWithAlpha(baseColor, 0));
    ctx.globalAlpha = scan.scanningActive ? 1.0 : 0.8; ctx.fillStyle = glow1Grad; const r1=25; ctx.beginPath(); ctx.roundRect(scan.lightBarX - lw*2,0,lw*4,scan.h,r1); ctx.fill();
    const glow2Grad = ctx.createLinearGradient(scan.lightBarX - lw*4, 0, scan.lightBarX + lw*4, 0);
    glow2Grad.addColorStop(0, colorWithAlpha(baseColor, 0)); glow2Grad.addColorStop(0.5, colorWithAlpha(baseColor, 0.4*glow)); glow2Grad.addColorStop(1, colorWithAlpha(baseColor, 0));
    ctx.globalAlpha = scan.scanningActive ? 0.8 : 0.6; ctx.fillStyle = glow2Grad; const r2=35; ctx.beginPath(); ctx.roundRect(scan.lightBarX - lw*4,0,lw*8,scan.h,r2); ctx.fill();
    if (scan.scanningActive) {
      const glow3Grad = ctx.createLinearGradient(scan.lightBarX - lw*8, 0, scan.lightBarX + lw*8, 0);
      glow3Grad.addColorStop(0, colorWithAlpha(baseColor, 0)); glow3Grad.addColorStop(0.5, colorWithAlpha(baseColor, 0.2)); glow3Grad.addColorStop(1, colorWithAlpha(baseColor, 0));
      ctx.globalAlpha = 0.6; ctx.fillStyle = glow3Grad; const r3=45; ctx.beginPath(); ctx.roundRect(scan.lightBarX - lw*8,0,lw*16,scan.h,r3); ctx.fill();
    }
    ctx.globalCompositeOperation = 'destination-in'; ctx.globalAlpha = 1; ctx.fillStyle = verticalGrad; ctx.fillRect(0,0,scan.w,scan.h);
  }
  function render() {
    const targetIntensity = scan.scanningActive ? 1.8 : scan.baseIntensity;
    const targetMaxParticles = scan.scanningActive ? 2500 : scan.maxParticles;
    const targetFadeZone = scan.scanningActive ? 35 : scan.fadeZone;
    scan.intensity += (targetIntensity - scan.intensity) * scan.transitionSpeed;
    scan.maxParticles += (targetMaxParticles - scan.maxParticles) * scan.transitionSpeed;
    scan.fadeZone += (targetFadeZone - scan.fadeZone) * scan.transitionSpeed;
    const ctx = scan.ctx; ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0,0,scan.w,scan.h);
    drawLightBar(); ctx.globalCompositeOperation = 'lighter';
    for(let i=1;i<=scan.count;i++){ const p = scan.particles[i]; if(!p) continue; updateParticle(p); drawParticle(p); }
    if (Math.random() < scan.intensity && scan.count < scan.maxParticles) { const p = createParticle(); p.originalAlpha=p.alpha; p.startX=p.x; scan.count++; scan.particles[scan.count]=p; }
    requestAnimationFrame(render);
  }
  render();
}

function onResize() {
  calculateDimensions();
  // Reposition cards according to current spacing
  layoutWrappers();
  // Re-measure year text and adjust ASCII blocks
  measureAndLayoutAscii();
  // update scanner dims
  if (container.value) { scan.w = container.value.offsetWidth; scan.lightBarX = scan.w/2; const canvas = scannerCanvas.value; if (canvas) { canvas.width = scan.w; canvas.height = SCANNER_H; canvas.style.width = scan.w+'px'; canvas.style.height = SCANNER_H+'px'; } }
  // update particles renderer
  if (three.renderer) { three.camera.left = -window.innerWidth/2; three.camera.right = window.innerWidth/2; three.camera.updateProjectionMatrix(); three.renderer.setSize(window.innerWidth, PARTICLE_H); }
}

// Positionner explicitement chaque carte pour aligner son centre sur les marqueurs de Timeline
function layoutWrappers() {
  if (!cardLine.value) return;
  const wrappers = cardLine.value.querySelectorAll('.ys-card-wrapper');
  wrappers.forEach((w, i) => {
    const leftPx = 80 + i * EVENT_SPACING - CARD_W / 2;
    w.style.left = leftPx + 'px';
  });
}

onMounted(() => {
  // Prepare ASCII contents
  asciiContents.value = items.value.map(() => null);
  // Populate initial ASCII code
  setTimeout(()=>{
    measureAndLayoutAscii();
    const nodes = container.value.querySelectorAll('.ys-ascii-content');
    nodes.forEach((node)=>{
      const { width, height } = computeCodeDimsForNode(node);
      node.textContent = generateCode(width, height);
    });
  }, 0);

  calculateDimensions();
  // Position initial des cartes
  layoutWrappers();
  // Interaction events
  const line = cardLine.value;
  line.addEventListener('mousedown', (e)=>startDrag(e));
  document.addEventListener('mousemove', (e)=>onDrag(e));
  document.addEventListener('mouseup', ()=>endDrag());
  line.addEventListener('touchstart', (e)=>startDrag(e.touches[0]), { passive: false });
  document.addEventListener('touchmove', (e)=>onDrag(e.touches[0]), { passive: false });
  document.addEventListener('touchend', ()=>endDrag());
  line.addEventListener('wheel', (e)=>onWheel(e));
  line.addEventListener('selectstart', (e)=>e.preventDefault());
  line.addEventListener('dragstart', (e)=>e.preventDefault());
  window.addEventListener('resize', onResize);
  // Listen for Timeline motion events
  window.addEventListener('timeline-motion', handleTimelineMotion);

  // Systems
  initParticles();
  setupScanner();
  animateCards();
  periodicUpdates();
});

// Re-measure and reinitialize when items change (e.g., RTL or language changes)
watch(items, () => {
  asciiContents.value = items.value.map(() => null);
  // Allow DOM to update before measuring
  setTimeout(() => {
    measureAndLayoutAscii();
    layoutWrappers();
    const nodes = container.value?.querySelectorAll('.ys-ascii-content') ?? [];
    nodes.forEach((node) => {
      const { width, height } = computeCodeDimsForNode(node);
      node.textContent = generateCode(width, height);
    });
  }, 0);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  window.removeEventListener('timeline-motion', handleTimelineMotion);
});
</script>

<style scoped>
/* Styles déplacés dans src/styles/styles.css pour respecter la source unique des styles */
</style>
