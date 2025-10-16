<template>
  <canvas ref="canvas" class="avatar-canvas"></canvas>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { getAssetPath } from "../utils/assets.js";

const canvas = ref(null);

// helpers
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

let renderer, scene, camera, avatar;
let bones = {};
let mixer = null;
let clock;
let rafId;
let lastTime = 0;

// === Variables pour l'animation de marche ===
let walkTime = 0;
let isWalking = false;
let walkSpeed = 0;
let walkDirection = 0; // -1: gauche, 1: droite

// === Raycaster + souris en NDC ===
let raycaster = new THREE.Raycaster();
let mouseNDC = new THREE.Vector2(0, 0);

function onMouseMove(e) {
  mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
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
  camera.position.set(0, 1.6, 7.2);

  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(3, 5, 2);
  scene.add(dir);

  // loader
  const loader = new GLTFLoader();
  loader.load(getAssetPath("/models/avatar.glb"), (gltf) => {
    avatar = gltf.scene;
    
    // Réinitialiser toutes les rotations des os avant de les stocker
    avatar.traverse((obj) => {
      if (obj.isBone) {
        // Sauvegarder la rotation initiale
        obj.userData.initialRotation = obj.rotation.clone();
        bones[obj.name] = obj;
      }
    });

    // CORRECTION : Rotation correcte des hanches - testez différentes valeurs
    const LeftUpLeg = bones["LeftUpLeg"];
    const RightUpLeg = bones["RightUpLeg"];
    
    if (LeftUpLeg) {
      // Essayer différentes combinaisons pour corriger la direction
      LeftUpLeg.rotation.x = 0;
      LeftUpLeg.rotation.y = 0; // Pas de rotation Y
      LeftUpLeg.rotation.z = 0;
    }
    if (RightUpLeg) {
      RightUpLeg.rotation.x = 0;
      RightUpLeg.rotation.y = 0; // Pas de rotation Y
      RightUpLeg.rotation.z = 0;
    }

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
  }
});

// === Animation de marche procédurale CORRIGÉE ===
function updateWalkAnimation(dt, speed, direction) {
  walkTime += dt * speed * 8;
  
  // Bones pour l'animation de marche
  const Hips = bones["Hips"];
  const Spine = bones["Spine"];
  const LeftUpLeg = bones["LeftUpLeg"];
  const RightUpLeg = bones["RightUpLeg"];
  const LeftLeg = bones["LeftLeg"];
  const RightLeg = bones["RightLeg"];
  const LeftArm = bones["LeftArm"];
  const RightArm = bones["RightArm"];
  const LeftForeArm = bones["LeftForeArm"];
  const RightForeArm = bones["RightForeArm"];

  if (!Hips) return;

  // === Hanches - balancement latéral naturel ===
  const hipSway = Math.sin(walkTime) * 0.1 * speed;
  const hipTwist = Math.sin(walkTime * 0.5) * 0.08 * speed;
  
  // Appliquer le balancement des hanches
  Hips.rotation.y = hipSway;
  Hips.rotation.z = hipTwist;

  const hipBobY = Math.abs(Math.sin(walkTime)) * 0.02 * speed;
  Hips.position.y = hipBobY;

  // === Jambes - mouvement de marche naturel ===
  // CORRECTION : Utiliser des rotations X uniquement pour un mouvement naturel
  const leftLegSwing = Math.sin(walkTime) * 0.5 * speed;
  const rightLegSwing = Math.sin(walkTime + Math.PI) * 0.5 * speed;
  
  // Flexion des genoux
  const leftKneeBend = Math.max(0, Math.sin(walkTime)) * 0.8 * speed;
  const rightKneeBend = Math.max(0, Math.sin(walkTime + Math.PI)) * 0.8 * speed;

  if (LeftUpLeg) {
    // CORRECTION : Rotation X uniquement pour un mouvement vers l'avant/arrière
    LeftUpLeg.rotation.x = leftLegSwing;
    // S'assurer que Y et Z sont à 0
    LeftUpLeg.rotation.y = 0;
    LeftUpLeg.rotation.z = 0;
  }
  if (RightUpLeg) {
    RightUpLeg.rotation.x = rightLegSwing;
    RightUpLeg.rotation.y = 0;
    RightUpLeg.rotation.z = 0;
  }
  if (LeftLeg) {
    LeftLeg.rotation.x = -leftKneeBend;
  }
  if (RightLeg) {
    RightLeg.rotation.x = -rightKneeBend;
  }

  // === Bras - balancement naturel opposé aux jambes ===
  const leftArmSwing = Math.sin(walkTime + Math.PI) * 0.6 * speed;
  const rightArmSwing = Math.sin(walkTime) * 0.6 * speed;
  
  // Flexion des coudes
  const leftElbowBend = Math.max(0, Math.sin(walkTime + Math.PI)) * 0.5 * speed;
  const rightElbowBend = Math.max(0, Math.sin(walkTime)) * 0.5 * speed;

  if (LeftArm) {
    LeftArm.rotation.x = leftArmSwing;
    LeftArm.rotation.z = Math.sin(walkTime + Math.PI) * 0.05 * speed;
  }
  if (RightArm) {
    RightArm.rotation.x = rightArmSwing;
    RightArm.rotation.z = Math.sin(walkTime) * 0.05 * speed;
  }
  if (LeftForeArm) {
    LeftForeArm.rotation.x = -leftElbowBend;
  }
  if (RightForeArm) {
    RightForeArm.rotation.x = -rightElbowBend;
  }

  // === Rotation du torse ===
  if (Spine) {
    Spine.rotation.y = direction * 0.15 * speed;
    Spine.rotation.z = Math.sin(walkTime * 0.5) * 0.03 * speed;
  }
}

// === Reset de l'animation de marche - CORRIGÉ ===
function resetWalkAnimation() {
  const bonesToReset = [
    "Hips", "Spine", "LeftUpLeg", "RightUpLeg", "LeftLeg", "RightLeg",
    "LeftArm", "RightArm", "LeftForeArm", "RightForeArm"
  ];

  bonesToReset.forEach(boneName => {
    const bone = bones[boneName];
    if (bone) {
      // Interpolation douce vers la position de repos
      bone.rotation.x = lerp(bone.rotation.x, 0, 0.1);
      bone.rotation.y = lerp(bone.rotation.y, 0, 0.1);
      bone.rotation.z = lerp(bone.rotation.z, 0, 0.1);
    }
  });
  
  // Réinitialiser la position des hanches
  const Hips = bones["Hips"];
  if (Hips) {
    Hips.position.y = lerp(Hips.position.y, 0, 0.1);
  }
}

function animate() {
  rafId = requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min((now - lastTime) / 1000, 0.1); // Limiter dt pour éviter les sauts
  lastTime = now;

  if (!avatar) {
    renderer.render(scene, camera);
    return;
  }

  // === Détection de la marche basée sur la position horizontale de la souris ===
  const mouseHorizontal = mouseNDC.x;
  const deadZone = 0.1; // Zone morte réduite
  
  // Déterminer si on marche et dans quelle direction
  if (Math.abs(mouseHorizontal) > deadZone) {
    isWalking = true;
    walkDirection = Math.sign(mouseHorizontal);
    
    // Vitesse proportionnelle à la distance du centre
    const rawSpeed = (Math.abs(mouseHorizontal) - deadZone) / (1 - deadZone);
    walkSpeed = clamp(rawSpeed, 0, 1);
    
    // Rotation du corps entier pour la direction - plus douce
    const targetRotation = walkDirection * 0.3 * walkSpeed;
    avatar.rotation.y = lerp(avatar.rotation.y, targetRotation, 0.05);
  } else {
    isWalking = false;
    // Réduire progressivement la vitesse
    walkSpeed = lerp(walkSpeed, 0, 0.2);
    if (walkSpeed < 0.01) walkSpeed = 0;
    
    // Retour doux à la position neutre
    avatar.rotation.y = lerp(avatar.rotation.y, 0, 0.05);
  }

  // Bones pour le suivi de la tête
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
    const maxEyeYaw = 0.3;
    const maxEyePitch = 0.3;
    if (EyeL) {
      EyeL.rotation.y = lerp(EyeL.rotation.y, clamp(yaw, -maxEyeYaw, maxEyeYaw), 0.3);
      EyeL.rotation.x = lerp(EyeL.rotation.x, clamp(pitch, -maxEyePitch, maxEyePitch), 0.3);
    }
    if (EyeR) {
      EyeR.rotation.y = lerp(EyeR.rotation.y, clamp(yaw, -maxEyeYaw, maxEyeYaw), 0.3);
      EyeR.rotation.x = lerp(EyeR.rotation.x, clamp(pitch, -maxEyePitch, maxEyePitch), 0.3);
    }

    // ---- Appliquer à la tête + cou ----
    // Réduire l'amplitude quand on marche pour un effet plus naturel
    const headReduction = isWalking ? 0.7 : 1.0;
    const maxHeadYaw = 0.6 * headReduction;
    const maxHeadPitch = 0.6 * headReduction;

    if (Neck) {
      Neck.rotation.y = lerp(Neck.rotation.y, clamp(yaw, -maxHeadYaw, maxHeadYaw) * 0.5, 0.2);
      Neck.rotation.x = lerp(Neck.rotation.x, clamp(pitch, -maxHeadPitch, maxHeadPitch) * 0.5, 0.2);
    }
    Head.rotation.y = lerp(Head.rotation.y, clamp(yaw, -maxHeadYaw, maxHeadYaw), 0.15);
    Head.rotation.x = lerp(Head.rotation.x, clamp(pitch, -maxHeadPitch, maxHeadPitch), 0.15);
  }

  // === Gestion de l'animation de marche ===
  if (isWalking && walkSpeed > 0.05) {
    updateWalkAnimation(dt, walkSpeed, walkDirection);
  } else {
    resetWalkAnimation();
  }

  // update animations
  if (mixer && clock) mixer.update(dt);
  renderer.render(scene, camera);
}
</script>

<style scoped>
.avatar-canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>