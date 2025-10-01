<template>
  <canvas ref="canvas" class="avatar-canvas"></canvas>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const canvas = ref(null);

// Props : vitesse + direction
const props = defineProps({
  speedNormalized: { type: Number, default: 0 },
  direction: { type: Number, default: 0 } // -1 gauche, 0 stop, 1 droite
});

// helpers
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

let renderer, scene, camera, avatar;
let bones = {};
let mixer = null;
let clock;
let rafId;
let lastTime = 0;

// === Raycaster + souris en NDC ===
let raycaster = new THREE.Raycaster();
let mouseNDC = new THREE.Vector2();

function onMouseMove(e) {
  mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouseNDC.y = (e.clientY / window.innerHeight) * 2 + 1; // Correction : inversé pour y négatif en bas
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
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 1.6, 3.2);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    alpha: true,
    antialias: true
  });
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

  const speed = clamp(props.speedNormalized, 0, 1);

  // Bones
  const Neck = bones["Neck"];
  const Head = bones["Head"] || bones["Wolf3D_Head"];
  const EyeL = bones["EyeLeft"] || bones["LeftEye"];
  const EyeR = bones["EyeRight"] || bones["RightEye"];

  if (Head) {
    // === Ray depuis la souris ===
    raycaster.setFromCamera(mouseNDC, camera);

    // Position monde de la tête
    let headPos = new THREE.Vector3();
    Head.getWorldPosition(headPos);

    // Direction souris depuis la caméra
    let target = new THREE.Vector3();
    target.copy(raycaster.ray.direction).add(raycaster.ray.origin);

    // Vecteur tête → souris
    let dir = new THREE.Vector3().subVectors(target, headPos).normalize();

    // Angles yaw/pitch
    const yaw = Math.atan2(dir.x, dir.z);
    const pitch = Math.asin(clamp(dir.y, -1, 1));

    // ---- Appliquer aux yeux ----
    const maxEyeYaw = 0.5;   // Augmenté pour plus d'amplitude gauche/droite
    const maxEyePitch = 0.5; // Augmenté pour plus d'amplitude haut/bas
    if (EyeL) {
      EyeL.rotation.y = lerp(EyeL.rotation.y, clamp(yaw, -maxEyeYaw, maxEyeYaw), 0.35);
      EyeL.rotation.x = lerp(EyeL.rotation.x, clamp(pitch, -maxEyePitch, maxEyePitch), 0.35);
    }
    if (EyeR) {
      EyeR.rotation.y = lerp(EyeR.rotation.y, clamp(yaw, -maxEyeYaw, maxEyeYaw), 0.35);
      EyeR.rotation.x = lerp(EyeR.rotation.x, clamp(pitch, -maxEyePitch, maxEyePitch), 0.35);
    }

    // ---- Appliquer à la tête + cou ----
    const maxHeadYaw = 0.9;   // Augmenté pour plus d'amplitude gauche/droite
    const maxHeadPitch = 0.9; // Augmenté pour plus d'amplitude haut/bas

    if (Neck) {
      Neck.rotation.y = lerp(Neck.rotation.y, clamp(yaw, -maxHeadYaw, maxHeadYaw) * 0.7, 0.25);
      Neck.rotation.x = lerp(Neck.rotation.x, clamp(pitch, -maxHeadPitch, maxHeadPitch) * 0.7, 0.25);
    }
    Head.rotation.y = lerp(Head.rotation.y, clamp(yaw, -maxHeadYaw, maxHeadYaw), 0.2);
    Head.rotation.x = lerp(Head.rotation.x, clamp(pitch, -maxHeadPitch, maxHeadPitch), 0.2);
  }

  // update animations
  if (mixer && clock) mixer.update(dt);
  renderer.render(scene, camera);
}
</script>