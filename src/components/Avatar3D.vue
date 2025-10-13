<template>
  <canvas ref="canvas" class="avatar-canvas"></canvas>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

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
let mouseNDC = new THREE.Vector2();

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

    // === Correction fixe : rotation -180° des hanches pour remettre les pieds sous le corps ===
    const LeftUpLeg = bones["LeftUpLeg"];
    const RightUpLeg = bones["RightUpLeg"];
    if (LeftUpLeg) LeftUpLeg.rotation.y = -Math.PI; // -180° sur Y pour flip vers l'avant
    if (RightUpLeg) RightUpLeg.rotation.y = -Math.PI; // Idem pour droite

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



// === Animation de marche procédurale CORRIGÉE ===
function updateWalkAnimation(dt, speed, direction) {
  walkTime += dt * speed * 6;
  
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
  const hipSway = Math.sin(walkTime) * 0.15 * speed;
  const hipTwist = Math.sin(walkTime * 0.5) * 0.1 * speed;
  
  // Appliquer le balancement des hanches
  Hips.rotation.y = hipSway;
  Hips.rotation.z = hipTwist * 0.3;

  const hipBobY = Math.sin(walkTime) * 0.03 * speed;
  Hips.position.y = hipBobY;

  // === CORRECTION : Rotation de 180° des hanches pour repositionner les jambes ===
  const hipCorrection = Math.PI; // 180 degrés
  
  // === Jambes - mouvement de marche naturel ===
  const leftLegSwing = Math.sin(walkTime) * 0.4 * speed;
  const rightLegSwing = Math.sin(walkTime + Math.PI) * 0.4 * speed;
  
  // Flexion des genoux
  const leftKneeBend = Math.max(0, Math.sin(walkTime)) * 0.7 * speed;
  const rightKneeBend = Math.max(0, Math.sin(walkTime + Math.PI)) * 0.7 * speed;

  if (LeftUpLeg) {
    // CORRECTION : Appliquer la rotation de 180° + mouvement
    LeftUpLeg.rotation.y = hipCorrection;
    LeftUpLeg.rotation.x = leftLegSwing;
  }
  if (RightUpLeg) {
    // CORRECTION : Appliquer la rotation de 180° + mouvement
    RightUpLeg.rotation.y = hipCorrection;
    RightUpLeg.rotation.x = rightLegSwing;
  }
  if (LeftLeg) {
    LeftLeg.rotation.x = -leftKneeBend;
  }
  if (RightLeg) {
    RightLeg.rotation.x = -rightKneeBend;
  }

  // === Bras - balancement naturel opposé aux jambes ===
  const leftArmSwing = (Math.sin(walkTime + Math.PI) * 0.5 * speed);
  const rightArmSwing = Math.sin(walkTime) * 0.5 * speed;
  
  // Flexion des coudes
  const leftElbowBend = Math.max(0, Math.sin(walkTime + Math.PI)) * 0.4 * speed;
  const rightElbowBend = Math.max(0, Math.sin(walkTime)) * 0.4 * speed;

  if (LeftArm) {
    LeftArm.rotation.x = leftArmSwing;
    LeftArm.rotation.z = Math.sin(walkTime + Math.PI) * 0.1 * speed;
  }
  if (RightArm) {
    RightArm.rotation.x = rightArmSwing;
    RightArm.rotation.z = Math.sin(walkTime) * 0.1 * speed;
  }
  if (LeftForeArm) {
    LeftForeArm.rotation.x = -leftElbowBend;
  }
  if (RightForeArm) {
    RightForeArm.rotation.x = -rightElbowBend;
  }

  // === Rotation du torse ===
  if (Spine) {
    Spine.rotation.y = direction * 0.2 * speed;
    Spine.rotation.z = Math.sin(walkTime * 0.5) * 0.05 * speed;
  }
}

// === Reset de l'animation de marche - AVEC CORRECTION ===
function resetWalkAnimation() {
  const bonesToReset = [
    "Hips", "Spine", "LeftUpLeg", "RightUpLeg", "LeftLeg", "RightLeg",
    "LeftArm", "RightArm", "LeftForeArm", "RightForeArm"
  ];

  bonesToReset.forEach(boneName => {
    const bone = bones[boneName];
    if (bone) {
      // Interpolation douce vers la position de repos
      bone.rotation.x = lerp(bone.rotation.x, 0, 0.15);
      bone.rotation.z = lerp(bone.rotation.z, 0, 0.15);
      
      // CORRECTION : Pour les cuisses, garder la rotation de 180° au repos
      if (boneName === "LeftUpLeg" || boneName === "RightUpLeg") {
        bone.rotation.y = Math.PI; // Maintenir 180°
      } else {
        bone.rotation.y = lerp(bone.rotation.y, 0, 0.15);
      }
    }
  });
}

function animate() {
  rafId = requestAnimationFrame(animate);
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  if (!avatar) {
    renderer.render(scene, camera);
    return;
  }

  // === Détection de la marche basée sur la position horizontale de la souris ===
  const mouseHorizontal = mouseNDC.x;
  const deadZone = 0.15; // Zone morte un peu plus large
  
  // Déterminer si on marche et dans quelle direction
  if (Math.abs(mouseHorizontal) > deadZone) {
    isWalking = true;
    walkDirection = Math.sign(mouseHorizontal);
    
    // Vitesse proportionnelle à la distance du centre
    walkSpeed = clamp((Math.abs(mouseHorizontal) - deadZone) / (1 - deadZone), 0, 1);
    
    // Rotation du corps entier pour la direction
    avatar.rotation.y = lerp(avatar.rotation.y, walkDirection * 0.4 * walkSpeed, 0.1);
  } else {
    isWalking = false;
    walkSpeed = 0;
    // Retour doux à la position neutre
    avatar.rotation.y = lerp(avatar.rotation.y, 0, 0.1);
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
    const maxEyeYaw = 0.5;
    const maxEyePitch = 0.5;
    if (EyeL) {
      EyeL.rotation.y = lerp(EyeL.rotation.y, clamp(yaw, -maxEyeYaw, maxEyeYaw), 0.35);
      EyeL.rotation.x = lerp(EyeL.rotation.x, clamp(pitch, -maxEyePitch, maxEyePitch), 0.35);
    }
    if (EyeR) {
      EyeR.rotation.y = lerp(EyeR.rotation.y, clamp(yaw, -maxEyeYaw, maxEyeYaw), 0.35);
      EyeR.rotation.x = lerp(EyeR.rotation.x, clamp(pitch, -maxEyePitch, maxEyePitch), 0.35);
    }

    // ---- Appliquer à la tête + cou ----
    // Réduire l'amplitude quand on marche pour un effet plus naturel
    const headReduction = isWalking ? 0.6 : 1.0;
    const maxHeadYaw = 0.9 * headReduction;
    const maxHeadPitch = 0.9 * headReduction;

    if (Neck) {
      Neck.rotation.y = lerp(Neck.rotation.y, clamp(yaw, -maxHeadYaw, maxHeadYaw) * 0.7, 0.25);
      Neck.rotation.x = lerp(Neck.rotation.x, clamp(pitch, -maxHeadPitch, maxHeadPitch) * 0.7, 0.25);
    }
    Head.rotation.y = lerp(Head.rotation.y, clamp(yaw, -maxHeadYaw, maxHeadYaw), 0.2);
    Head.rotation.x = lerp(Head.rotation.x, clamp(pitch, -maxHeadPitch, maxHeadPitch), 0.2);
  }

  // === Gestion de l'animation de marche ===
  if (isWalking && walkSpeed > 0.1) {
    updateWalkAnimation(dt, walkSpeed, walkDirection);
  } else {
    resetWalkAnimation();
  }

  // update animations
  if (mixer && clock) mixer.update(dt);
  renderer.render(scene, camera);
}
</script>