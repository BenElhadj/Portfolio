<template>
  <canvas ref="canvas" class="avatar-canvas"></canvas>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { getAssetPath } from "../utils/assets.js";

const canvas = ref(null);

// helpers
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

let renderer, scene, camera, avatar;
let bones = {};
let mixer = null;
let walkAction = null;
let walkClip = null;
let clock;
let rafId;
let lastTime = 0;

// === Variables pour l'animation de marche ===
let walkTime = 0;
let isWalking = false;
let walkSpeed = 0;
let walkDirection = 0; // -1: gauche, 1: droite

// Presets de marche
const GAIT_PRESETS = {
  casual: {
    hipYawAmp: 0.03,
    hipRollAmp: 0.015,
    hipBobAmp: 0.025,
    pelvisPitchAmp: 0.02,
    legSwingAmp: 0.45,
    kneeBendAmp: 0.7,
    armSwingAmp: 0.4,
    armZSwingAmp: 0.003,
    elbowBase: 0.28,
    elbowBendAmp: 0.35,
    spineCounterYaw: 0.55,
    spineRollAmp: 0.015,
    footLiftAmp: 0.18,
    footPlantarAmp: 0.14,
    shoulderRollAmp: 0.012,
    maxArmSwing: 0.55,
    maxElbowBend: 0.9,
    maxKneeBend: 1.1,
    legAdductionRoll: 0.08,
    armAdductionRoll: 0.10,
    cycleFreqBase: 2.2,   // rad/s de base
    cycleFreqGain: 5.0    // gain selon la vitesse
  },
  normal: {
    hipYawAmp: 0.04,
    hipRollAmp: 0.02,
    hipBobAmp: 0.03,
    pelvisPitchAmp: 0.03,
    legSwingAmp: 0.55,
    kneeBendAmp: 0.9,
    armSwingAmp: 0.5,
    armZSwingAmp: 0.005,
    elbowBase: 0.25,
    elbowBendAmp: 0.45,
    spineCounterYaw: 0.6,
    spineRollAmp: 0.02,
    footLiftAmp: 0.22,
    footPlantarAmp: 0.18,
    shoulderRollAmp: 0.015,
    maxArmSwing: 0.65,
    maxElbowBend: 1.0,
    maxKneeBend: 1.2,
    legAdductionRoll: 0.06,
    armAdductionRoll: 0.08,
    cycleFreqBase: 2.6,
    cycleFreqGain: 6.0
  },
  dynamic: {
    hipYawAmp: 0.05,
    hipRollAmp: 0.025,
    hipBobAmp: 0.04,
    pelvisPitchAmp: 0.04,
    legSwingAmp: 0.70,
    kneeBendAmp: 1.05,
    armSwingAmp: 0.6,
    armZSwingAmp: 0.007,
    elbowBase: 0.22,
    elbowBendAmp: 0.55,
    spineCounterYaw: 0.65,
    spineRollAmp: 0.025,
    footLiftAmp: 0.26,
    footPlantarAmp: 0.22,
    shoulderRollAmp: 0.018,
    maxArmSwing: 0.8,
    maxElbowBend: 1.1,
    maxKneeBend: 1.3,
    legAdductionRoll: 0.05,
    armAdductionRoll: 0.07,
    cycleFreqBase: 3.0,
    cycleFreqGain: 7.5
  }
};

// Prop pour sélectionner le preset
const props = defineProps({
  gaitPreset: {
    type: String,
    default: "normal",
    validator: (v) => ["casual", "normal", "dynamic"].includes(v)
  }
});

// GAIT courant (muté selon le preset)
let GAIT = GAIT_PRESETS[props.gaitPreset] || GAIT_PRESETS.normal;
watch(
  () => props.gaitPreset,
  (v) => {
    GAIT = GAIT_PRESETS[v] || GAIT_PRESETS.normal;
  }
);

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
    
    // Enregistrer la pose de référence (bind) de chaque os
    avatar.traverse((obj) => {
      if (obj.isBone) {
        // Sauvegarder la pose de base pour y revenir proprement
        obj.userData.bindQuaternion = obj.quaternion.clone();
        obj.userData.bindRotation = obj.rotation.clone();
        bones[obj.name] = obj;
      }
    });

    // Détection de l'axe latéral (pitch) pour les bras/coudes selon la pose actuelle
    const detectLateralAxis = (bone) => {
      if (!bone) return 'X';
      const boneWorldQ = new THREE.Quaternion();
      bone.getWorldQuaternion(boneWorldQ);
      const axX = new THREE.Vector3(1,0,0).applyQuaternion(boneWorldQ).normalize();
      const axY = new THREE.Vector3(0,1,0).applyQuaternion(boneWorldQ).normalize();
      const axZ = new THREE.Vector3(0,0,1).applyQuaternion(boneWorldQ).normalize();
      const avatarWorldQ = new THREE.Quaternion();
      avatar.getWorldQuaternion(avatarWorldQ);
      const avatarRight = new THREE.Vector3(1,0,0).applyQuaternion(avatarWorldQ).normalize();
      const d = {
        X: Math.abs(axX.dot(avatarRight)),
        Y: Math.abs(axY.dot(avatarRight)),
        Z: Math.abs(axZ.dot(avatarRight))
      };
      let axis = 'X';
      if (d.Y > d.X && d.Y >= d.Z) axis = 'Y';
      else if (d.Z > d.X && d.Z >= d.Y) axis = 'Z';
      return axis;
    };

    const LeftArm = bones["LeftArm"];
    const RightArm = bones["RightArm"];
    const LeftForeArm = bones["LeftForeArm"];
    const RightForeArm = bones["RightForeArm"];

    if (LeftArm) LeftArm.userData.pitchAxis = detectLateralAxis(LeftArm);
    if (RightArm) RightArm.userData.pitchAxis = detectLateralAxis(RightArm);
    if (LeftForeArm) LeftForeArm.userData.pitchAxis = detectLateralAxis(LeftForeArm);
    if (RightForeArm) RightForeArm.userData.pitchAxis = detectLateralAxis(RightForeArm);

    avatar.scale.set(1.2, 1.2, 1.2);
    scene.add(avatar);

    if (gltf.animations?.length) {
      mixer = new THREE.AnimationMixer(avatar);
    }

    // Tenter de charger un clip de marche externe et le retarget sur l'avatar
    const animLoader = new GLTFLoader();
    animLoader.load(
      getAssetPath("/models/walk.glb"),
      (wgltf) => {
        try {
          if (!mixer) mixer = new THREE.AnimationMixer(avatar);
          // choisir un clip "Walk" si dispo, sinon le premier
          const clip = (wgltf.animations || []).find(c => /walk/i.test(c.name)) || wgltf.animations?.[0];
          if (clip) {
            let retargeted = null;
            try {
              retargeted = SkeletonUtils.retargetClip(wgltf.scene, avatar, clip);
            } catch (e) {
              // si retarget indisponible, tenter de jouer le clip tel quel (si mêmes noms d'os)
              retargeted = clip;
            }
            walkClip = retargeted;
            walkAction = mixer.clipAction(walkClip);
            walkAction.setLoop(THREE.LoopRepeat, Infinity);
            walkAction.enabled = true;
            walkAction.clampWhenFinished = false;
            walkAction.play();
            // démarrer à poids nul; on pilotera weight/timeScale dans animate()
            walkAction.weight = 0;
          }
        } catch (e) {
          // silencieux: on restera en procédural
        }
      },
      undefined,
      () => {
        // pas de walk.glb -> rester en procédural
      }
    );

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

// === Helpers d'animation basés sur la pose de référence ===
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

function applyBoneOffset(bone, ox = 0, oy = 0, oz = 0, slerpAlpha = 0.3) {
  if (!bone || !bone.userData?.bindQuaternion) return;
  const targetQ = bone.userData.bindQuaternion.clone();
  if (ox) targetQ.multiply(new THREE.Quaternion().setFromAxisAngle(X_AXIS, ox));
  if (oy) targetQ.multiply(new THREE.Quaternion().setFromAxisAngle(Y_AXIS, oy));
  if (oz) targetQ.multiply(new THREE.Quaternion().setFromAxisAngle(Z_AXIS, oz));
  bone.quaternion.slerp(targetQ, slerpAlpha);
}

function applyBoneOffsetAxis(bone, axis /* 'X'|'Y'|'Z' */, angle = 0, slerpAlpha = 0.3) {
  if (!bone || !bone.userData?.bindQuaternion || !angle) return;
  const targetQ = bone.userData.bindQuaternion.clone();
  const ax = axis === 'Y' ? Y_AXIS : axis === 'Z' ? Z_AXIS : X_AXIS;
  targetQ.multiply(new THREE.Quaternion().setFromAxisAngle(ax, angle));
  bone.quaternion.slerp(targetQ, slerpAlpha);
}

// === Animation de marche procédurale CORRIGÉE ===
function updateWalkAnimation(dt, speed, direction) {
  // cadence dépendante de la vitesse, avec base > 0 pour lisser
  const phaseRate = (GAIT.cycleFreqBase + GAIT.cycleFreqGain * speed) * speed;
  walkTime += dt * phaseRate;
  
  // Bones pour l'animation de marche
  const Hips = bones["Hips"];
  const Spine = bones["Spine"];
  const LeftShoulder = bones["LeftShoulder"]; // peut ne pas exister selon le rig
  const RightShoulder = bones["RightShoulder"];
  const LeftUpLeg = bones["LeftUpLeg"];
  const RightUpLeg = bones["RightUpLeg"];
  const LeftLeg = bones["LeftLeg"];
  const RightLeg = bones["RightLeg"];
  const LeftArm = bones["LeftArm"];
  const RightArm = bones["RightArm"];
  const LeftForeArm = bones["LeftForeArm"];
  const RightForeArm = bones["RightForeArm"];

  if (!Hips) return;

  // === Phases ===
  const speedPow = Math.pow(speed, 0.7); // plus naturel que linéaire
  const lPhase = walkTime;
  const rPhase = walkTime + Math.PI;

  // === Hanches - balancement naturel ===
  const hipYaw = Math.sin(walkTime) * GAIT.hipYawAmp * speedPow; // gauche-droite
  const hipRoll = Math.sin(walkTime * 2.0 + Math.PI * 0.5) * GAIT.hipRollAmp * speedPow; // appuis
  const pelvisPitch = Math.cos(walkTime) * GAIT.pelvisPitchAmp * speedPow; // légère bascule avant/arrière
  
  // Appliquer le balancement des hanches (offsets sur la pose bind)
  applyBoneOffset(Hips, pelvisPitch, hipYaw, hipRoll, 0.2);

  // bob vertical symétrique (0..1) via (1-cos(2t))/2
  const hipBobY = ((1 - Math.cos(walkTime * 2)) * 0.5) * GAIT.hipBobAmp * speedPow;
  Hips.position.y = hipBobY;

  // === Jambes - mouvement de marche naturel ===
  // CORRECTION : Utiliser des rotations X uniquement pour un mouvement naturel
  const leftLegSwing = Math.sin(lPhase) * GAIT.legSwingAmp * speedPow;
  const rightLegSwing = Math.sin(rPhase) * GAIT.legSwingAmp * speedPow;
  
  // Flexion des genoux
  let leftKneeBend = Math.max(0, Math.sin(lPhase)) * GAIT.kneeBendAmp * speedPow;
  let rightKneeBend = Math.max(0, Math.sin(rPhase)) * GAIT.kneeBendAmp * speedPow;
  leftKneeBend = clamp(leftKneeBend, 0, GAIT.maxKneeBend);
  rightKneeBend = clamp(rightKneeBend, 0, GAIT.maxKneeBend);

  applyBoneOffset(LeftUpLeg, leftLegSwing, 0, 0, 0.25);
  applyBoneOffset(RightUpLeg, rightLegSwing, 0, 0, 0.25);
  applyBoneOffset(LeftLeg, -leftKneeBend, 0, 0, 0.25);
  applyBoneOffset(RightLeg, -rightKneeBend, 0, 0, 0.25);

  // Rapprocher les pieds vers le centre (légère adduction au niveau de la hanche)
  if (LeftUpLeg) applyBoneOffset(LeftUpLeg, 0, 0, -GAIT.legAdductionRoll, 0.2);
  if (RightUpLeg) applyBoneOffset(RightUpLeg, 0, 0, GAIT.legAdductionRoll, 0.2);

  // === Bras - balancement naturel opposé aux jambes ===
  let leftArmSwing = Math.sin(lPhase + Math.PI) * GAIT.armSwingAmp * speedPow;
  let rightArmSwing = Math.sin(rPhase + Math.PI) * GAIT.armSwingAmp * speedPow;
  leftArmSwing = clamp(leftArmSwing, -GAIT.maxArmSwing, GAIT.maxArmSwing);
  rightArmSwing = clamp(rightArmSwing, -GAIT.maxArmSwing, GAIT.maxArmSwing);
  
  // Flexion des coudes
  let leftElbowBend = GAIT.elbowBase + Math.max(0, Math.sin(lPhase + Math.PI)) * GAIT.elbowBendAmp * speedPow;
  let rightElbowBend = GAIT.elbowBase + Math.max(0, Math.sin(rPhase + Math.PI)) * GAIT.elbowBendAmp * speedPow;
  leftElbowBend = clamp(leftElbowBend, 0, GAIT.maxElbowBend);
  rightElbowBend = clamp(rightElbowBend, 0, GAIT.maxElbowBend);

  const lAxis = LeftArm?.userData?.pitchAxis || 'X';
  const rAxis = RightArm?.userData?.pitchAxis || 'X';
  const lElbAxis = LeftForeArm?.userData?.pitchAxis || lAxis;
  const rElbAxis = RightForeArm?.userData?.pitchAxis || rAxis;

  // Swing bras essentiellement avant/arrière le long de l'axe latéral détecté
  applyBoneOffsetAxis(LeftArm, lAxis, leftArmSwing, 0.25);
  applyBoneOffsetAxis(RightArm, rAxis, rightArmSwing, 0.25);

  // Très légère composante latérale (presque nulle) pour la vie
  const tinyZL = Math.sin(lPhase + Math.PI) * GAIT.armZSwingAmp * speedPow;
  const tinyZR = Math.sin(rPhase + Math.PI) * GAIT.armZSwingAmp * speedPow;
  if (Math.abs(tinyZL) > 1e-4) applyBoneOffset(LeftArm, 0, 0, tinyZL, 0.25);
  if (Math.abs(tinyZR) > 1e-4) applyBoneOffset(RightArm, 0, 0, tinyZR, 0.25);

  // Flexion des coudes le long du même axe latéral
  applyBoneOffsetAxis(LeftForeArm, lElbAxis, -leftElbowBend, 0.25);
  applyBoneOffsetAxis(RightForeArm, rElbAxis, -rightElbowBend, 0.25);

  // Rapprocher les bras du torse (légère adduction/roulis)
  if (LeftArm) applyBoneOffset(LeftArm, 0, 0, -GAIT.armAdductionRoll, 0.2);
  if (RightArm) applyBoneOffset(RightArm, 0, 0, GAIT.armAdductionRoll, 0.2);

  // === Rotation du torse ===
  if (Spine) {
    const spineYaw = -hipYaw * GAIT.spineCounterYaw + direction * 0.08 * speedPow;
    const spineRoll = Math.sin(walkTime * 0.5) * GAIT.spineRollAmp * speedPow;
    applyBoneOffset(Spine, 0, spineYaw, spineRoll, 0.2);
  }
  // Épaules: contre-roulis subtil opposé au bassin
  if (LeftShoulder) {
    applyBoneOffset(LeftShoulder, 0, 0, -hipRoll * (GAIT.shoulderRollAmp / Math.max(GAIT.hipRollAmp, 1e-6)), 0.25);
  }
  if (RightShoulder) {
    applyBoneOffset(RightShoulder, 0, 0, -hipRoll * (GAIT.shoulderRollAmp / Math.max(GAIT.hipRollAmp, 1e-6)), 0.25);
  }

  // === Pieds - légère dorsiflexion en phase de swing ===
  const LeftFoot = bones["LeftFoot"];
  const RightFoot = bones["RightFoot"];
  if (LeftFoot) {
    const dorsiflex = Math.max(0, Math.sin(lPhase)) * GAIT.footLiftAmp * speedPow;
    const plantar = Math.max(0, -Math.sin(lPhase)) * GAIT.footPlantarAmp * speedPow;
    const footPitch = dorsiflex - plantar; // lever devant, pousser derrière
    applyBoneOffset(LeftFoot, footPitch, 0, 0, 0.25);
  }
  if (RightFoot) {
    const dorsiflex = Math.max(0, Math.sin(rPhase)) * GAIT.footLiftAmp * speedPow;
    const plantar = Math.max(0, -Math.sin(rPhase)) * GAIT.footPlantarAmp * speedPow;
    const footPitch = dorsiflex - plantar;
    applyBoneOffset(RightFoot, footPitch, 0, 0, 0.25);
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
      // Interpolation douce vers la pose bind (pas vers 0)
      if (bone.userData?.bindQuaternion) {
        bone.quaternion.slerp(bone.userData.bindQuaternion, 0.15);
      }
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
  const headReduction = isWalking ? 0.5 : 1.0;
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
    if (walkAction) {
      // Blend animation clip selon la vitesse; piloter timeScale pour la cadence
      const targetWeight = clamp(walkSpeed, 0, 1);
      walkAction.weight = lerp(walkAction.weight, targetWeight, 0.15);
      // timeScale min 0.6, max 1.8 environ
      const ts = 0.6 + walkSpeed * 1.2;
      walkAction.timeScale = lerp(walkAction.timeScale || 1, ts, 0.2);
    } else {
      updateWalkAnimation(dt, walkSpeed, walkDirection);
    }
  } else {
    if (walkAction) {
      // éteindre l'action en douceur
      walkAction.weight = lerp(walkAction.weight, 0, 0.2);
      if (walkAction.weight < 0.02) walkAction.weight = 0;
    } else {
      resetWalkAnimation();
    }
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