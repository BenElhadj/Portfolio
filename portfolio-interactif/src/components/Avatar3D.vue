<template>
  <canvas ref="canvas" class="avatar-canvas"></canvas>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const canvas = ref(null);

// Props : speedNormalized in [0,1] and direction -1/0/1
const props = defineProps({
  speedNormalized: { type: Number, default: 0 },
  direction: { type: Number, default: 0 } // -1 left, 0 stop, 1 right
});

// helpers
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

let renderer, scene, camera, avatar;
let bones = {};
let mixer = null;
let clock;
let rafId;
let mouse = { x: 0, y: 0 };
let lastTime = 0;

// === Handlers définis en haut (accessibles à onMounted ET onUnmounted) ===
function onMouseMove(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1; // -1..1
  mouse.y = (e.clientY / window.innerHeight) * 2 - 1; // -1..1 (1 bas, -1 haut)
}

function onResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

onMounted(() => {
  // === Scene & Camera ===
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 3.2);

  renderer = new THREE.WebGLRenderer({ canvas: canvas.value, alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;

  // lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(3, 5, 2);
  scene.add(dir);

  // loader
  const loader = new GLTFLoader();
  loader.load("/models/avatar.glb", (gltf) => {
    avatar = gltf.scene;
    avatar.traverse((obj) => {
      if (obj.isBone) bones[obj.name] = obj;
    });

    avatar.scale.set(1.2, 1.2, 1.2);
    scene.add(avatar);

    if (gltf.animations?.length) {
      mixer = new THREE.AnimationMixer(avatar);
    }

    clock = new THREE.Clock();
    lastTime = performance.now();
    animate();
  });

  // events
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("resize", onResize);
});

onUnmounted(() => {
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("resize", onResize);
  cancelAnimationFrame(rafId);
  if (renderer) {
    renderer.dispose();
    renderer.forceContextLoss();
  }
});

// === Flip direction ===
let currentScaleX = 1;
watch(() => props.direction, (dir) => {
  const target = dir < 0 ? -1 : 1;
  const dur = 0.12;
  const t0 = performance.now();
  const s0 = currentScaleX;
  function flipStep() {
    const now = performance.now();
    const t = clamp((now - t0) / (dur * 1000), 0, 1);
    currentScaleX = lerp(s0, target, t);
    if (avatar) avatar.scale.x = currentScaleX;
    if (t < 1) requestAnimationFrame(flipStep);
  }
  flipStep();
});

function animate() {
  rafId = requestAnimationFrame(animate);
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  if (!avatar) {
    renderer.render(scene, camera);
    return;
  }

  // ---- procedural walk animation ----
  // speedNormalized drives amplitude and frequency
  const speed = clamp(props.speedNormalized, 0, 1); // 0..1
  const direction = Math.sign(props.direction || 0);

  // walk tempo: base frequency, increased with speed
  const baseFreq = 1.6; // steps per second at speed=1
  const freq = baseFreq * (0.6 + 1.4 * speed); // 0.6..2.0-ish

  // accumulate time
  const t = (clock ? clock.getElapsedTime() : now / 1000);
  const phase = t * Math.PI * 2 * freq; // radians

  // amplitude (radians) for hips/upper leg / arms
  const legAmp = 0.45 * speed; // 0..0.45 rad (~25°)
  const armAmp = 0.35 * speed; // arms smaller
  const spineAmp = 0.05 * speed; // small body bob

  // Correction des noms des os basés sur ta liste
  const LUp = bones["LeftUpLeg"];
  const RUp = bones["RightUpLeg"];
  const LLeg = bones["LeftLeg"];
  const RLeg = bones["RightLeg"];
  const LFoot = bones["LeftFoot"];
  const RFoot = bones["RightFoot"];
  const LShoulder = bones["LeftShoulder"];
  const RShoulder = bones["RightShoulder"];
  const Hips = bones["Hips"];
  const Spine = bones["Spine"] || bones["Spine1"] || bones["Spine2"]; // J'ai inversé l'ordre pour une meilleure compatibilité
  const Neck = bones["Neck"];
  const Head = bones["Head"] || bones["Wolf3D_Head"];

  // Eyes: EyeLeft / EyeRight or LeftEye/RightEye
  const EyeL = bones["EyeLeft"] || bones["LeftEye"];
  const EyeR = bones["EyeRight"] || bones["RightEye"];
  

  // Animation des jambes - Mouvement principal
  // La jambe gauche avance pendant que la jambe droite recule
  if (LUp) LUp.rotation.x = lerp(LUp.rotation.x, Math.sin(phase) * legAmp, 0.3 + 0.4 * speed);
  if (RUp) RUp.rotation.x = lerp(RUp.rotation.x, Math.sin(phase + Math.PI) * legAmp, 0.3 + 0.4 * speed);

  // Animation des bras - Mouvement opposé aux jambes
  // Le bras gauche recule pendant que la jambe gauche avance
  if (LShoulder) LShoulder.rotation.x = lerp(LShoulder.rotation.x, -Math.sin(phase) * armAmp, 0.28 + 0.5 * speed);
  if (RShoulder) RShoulder.rotation.x = lerp(RShoulder.rotation.x, -Math.sin(phase + Math.PI) * armAmp, 0.28 + 0.5 * speed);

  // Animation des pieds et du torse pour le balancement naturel
  if (LFoot) LFoot.rotation.x = lerp(LFoot.rotation.x, Math.cos(phase) * legAmp * 0.3, 0.25 + 0.4 * speed);
  if (RFoot) RFoot.rotation.x = lerp(RFoot.rotation.x, Math.cos(phase + Math.PI) * legAmp * 0.3, 0.25 + 0.4 * speed);

  // Mouvement vertical du corps pour simuler le poids
  if (avatar) {
    const bob = Math.sin(phase * 2) * 0.02 * speed;
    avatar.position.y = lerp(avatar.position.y, bob, 0.25);
  }

  // Balancement latéral du torse
  if (Hips) {
    Hips.rotation.z = lerp(Hips.rotation.z, Math.cos(phase + Math.PI/2) * spineAmp, 0.2 + 0.6 * speed);
  }

  // ---- Eyes + head follow mouse ----
  // mouse.x/y in -1..1 -> map to small angle range
  const maxEyeYaw = 0.35; // radians (~20°) - eyes can move more
  const maxEyePitch = 0.22; // radians (~12°)

  // desired eye rotation from mouse
  const desiredEyeYaw = clamp(mouse.x * 1, -1, 1) * maxEyeYaw * (0.9 + 0.1 * speed);
  // CORRECTION : Inverser le signe pour le pitch (supprimer le signe négatif)
  const desiredEyePitch = clamp(mouse.y * 1, -1, 1) * maxEyePitch * (0.9 + 0.1 * speed);

  // Apply to eye bones if present (some rigs use rotation.y for yaw)
  if (EyeL) {
    EyeL.rotation.y = lerp(EyeL.rotation.y || 0, desiredEyeYaw, 0.65);
    EyeL.rotation.x = lerp(EyeL.rotation.x || 0, desiredEyePitch, 0.65);
  }
  if (EyeR) {
    EyeR.rotation.y = lerp(EyeR.rotation.y || 0, desiredEyeYaw, 0.65);
    EyeR.rotation.x = lerp(EyeR.rotation.x || 0, desiredEyePitch, 0.65);
  }

  // Head follows after eyes — smaller range and slower (gives natural look: eyes lead)
  const maxHeadYaw = 0.35; // smaller than eyes
  const maxHeadPitch = 0.25;
  // compute how close eyes are to their limit -> if near limit, head moves more
  const eyesLimitFactor = Math.min(1, Math.abs(desiredEyeYaw) / maxEyeYaw + Math.abs(desiredEyePitch) / maxEyePitch);

  const desiredHeadYaw = clamp(mouse.x * 1, -1, 1) * maxHeadYaw * eyesLimitFactor;
  // CORRECTION : Inverser le signe pour le pitch de la tête aussi
  const desiredHeadPitch = clamp(mouse.y * 1, -1, 1) * maxHeadPitch * eyesLimitFactor;

  if (Neck) {
    // neck follows a bit faster than head bone (neck bends)
    Neck.rotation.y = lerp(Neck.rotation.y || 0, desiredHeadYaw * 0.7, 0.25 + 0.3 * speed);
    Neck.rotation.x = lerp(Neck.rotation.x || 0, desiredHeadPitch * 0.8, 0.25 + 0.3 * speed);
  }
  if (Head) {
    // head limited: don't rotate too much (avoid 'craneback' unnatural)
    const clampYaw = clamp(desiredHeadYaw, -maxHeadYaw, maxHeadYaw);
    const clampPitch = clamp(desiredHeadPitch, -maxHeadPitch, maxHeadPitch);
    Head.rotation.y = lerp(Head.rotation.y || 0, clampYaw, 0.14 + 0.36 * speed);
    Head.rotation.x = lerp(Head.rotation.x || 0, clampPitch, 0.14 + 0.36 * speed);
  }

  // small pelvis/vertical bob to simulate step
  if (avatar) {
    const bob = Math.sin(phase * 2) * 0.02 * speed;
    avatar.position.y = lerp(avatar.position.y || 0, bob, 0.25);
  }

  // ensure no extreme rotation on head top/back by clamping Head.rotation.z and x
  if (Head) {
    Head.rotation.z = clamp(Head.rotation.z || 0, -0.12, 0.92);
    Head.rotation.x = clamp(Head.rotation.x || 0, -0.28, 0.98);
  }
  if (Neck) {
    Neck.rotation.z = clamp(Neck.rotation.z || 0, -0.12, 0.12);
    Neck.rotation.x = clamp(Neck.rotation.x || 0, -0.28, 0.28);
  }

  // update mixer if present
  if (mixer && clock) mixer.update(dt);

  renderer.render(scene, camera);
}
</script>

<style>
.avatar-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

</style>