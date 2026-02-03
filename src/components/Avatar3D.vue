<template>
  <canvas ref="canvas" class="avatar-canvas"></canvas>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { getAssetPath } from "../utils/assets.js";

const canvas = ref(null);

// helpers
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const wrapPi = (a) => {
  // wrap angle to [-PI, PI]
  a = (a + Math.PI) % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a - Math.PI;
};
const lerpAngle = (a, b, t) => {
  const da = wrapPi(b - a);
  return a + da * t;
};

let renderer, scene, camera, avatar;
let bones = {};
let mixer = null;
let walkAction = null;
let clock;
let rafId;
let lastTime = 0;
let baseAvatarYaw = 0; // stored after avatar load to keep rotations relative to initial facing

// State for smoother body/head turning
let prevMouseNDC = new THREE.Vector2(0, 0);
let mouseVelocity = new THREE.Vector2(0, 0);
// Tunables
const TORSO_FOLLOW = 0.6; // portion of yaw applied to body (rest goes to spine/head)
const MAX_BODY_ALPHA = 0.18; // responsiveness for body rotation (lerp alpha)
const MIN_BODY_ALPHA = 0.02;
const HEAD_RESPONSIVENESS = 0.28; // slerp factor for head/neck
const EYE_RESPONSIVENESS = 0.32;
const MAX_HEAD_YAW = 0.7;
const MAX_HEAD_PITCH = 0.6;
const TURN_EXPONENT = 2.0; // exponent for turn falloff near center: higher -> more centered dead-zone effect
// Head smoothing state
let prevHeadYaw = 0;
let prevHeadPitch = 0;
const HEAD_LEAD_GAIN = 0.18; // anticipation factor from mouse velocity
const HEAD_WALK_REDUCTION = 0.6; // reduce head responsiveness while walking

// Hand tuning: rapprocher les mains du torse et forcer symétrie
const HAND_ADDUCTION_EXTRA = 0.035; // adduction additionnelle pour rapprocher les mains
const HAND_YAW_GAIN = 0.35; // gain appliqué du swing au yaw de la main
const HAND_PITCH_GAIN = 0.18; // gain appliqué du swing au pitch de la main
const MAX_HAND_YAW = 0.6;
const MAX_HAND_PITCH = 0.5;

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
    legSwingAmp: 0.52,
    kneeBendAmp: 0.7,
    armSwingAmp: 0.6,
    armZSwingAmp: 0.003,
    elbowBase: 0.28,
    elbowBendAmp: 0.35,
    spineCounterYaw: 0.55,
    spineRollAmp: 0.015,
    footLiftAmp: 0.18,
    footPlantarAmp: 0.14,
    shoulderRollAmp: 0.012,
    maxArmSwing: 0.8,
    maxArmForwardSwing: 0.8,
    maxArmBackwardSwing: 0.35,
    maxElbowBend: 0.9,
    maxKneeBend: 1.1,
    legAdductionRoll: 0.08,
    armAdductionRoll: 0.10,
    basePelvisPitch: -0.07,
    baseShoulderPitch: 0.07,
    baseSpinePitch: 0.20,
    handSwingGain: 1.3,
    forearmSwingGain: 0.5,
    forearmElbowGain: 0.85,
    kneeLiftAmp: 0.22,
    cycleFreqBase: 3.0,   // rad/s de base (augmenté)
    cycleFreqGain: 7.0    // gain selon la vitesse (augmenté)
  },
  normal: {
    hipYawAmp: 0.04,
    hipRollAmp: 0.02,
    hipBobAmp: 0.03,
    pelvisPitchAmp: 0.03,
    legSwingAmp: 0.63,
    kneeBendAmp: 0.9,
    armSwingAmp: 0.8,
    armZSwingAmp: 0.005,
    elbowBase: 0.25,
    elbowBendAmp: 0.45,
    spineCounterYaw: 0.6,
    spineRollAmp: 0.02,
    footLiftAmp: 0.22,
    footPlantarAmp: 0.18,
    shoulderRollAmp: 0.015,
    maxArmSwing: 1.0,
    maxArmForwardSwing: 1.0,
    maxArmBackwardSwing: 0.45,
    maxElbowBend: 1.0,
    maxKneeBend: 1.2,
    legAdductionRoll: 0.06,
    armAdductionRoll: 0.08,
    basePelvisPitch: -0.08,
    baseShoulderPitch: 0.08,
    baseSpinePitch: 0.28,
    handSwingGain: 1.35,
    forearmSwingGain: 0.5,
    forearmElbowGain: 0.80,
    kneeLiftAmp: 0.26,
    cycleFreqBase: 3.5,
    cycleFreqGain: 8.0
  },
  dynamic: {
    hipYawAmp: 0.05,
    hipRollAmp: 0.025,
    hipBobAmp: 0.04,
    pelvisPitchAmp: 0.04,
    legSwingAmp: 0.78,
    kneeBendAmp: 1.05,
    armSwingAmp: 0.95,
    armZSwingAmp: 0.007,
    elbowBase: 0.22,
    elbowBendAmp: 0.55,
    spineCounterYaw: 0.65,
    spineRollAmp: 0.025,
    footLiftAmp: 0.26,
    footPlantarAmp: 0.22,
    shoulderRollAmp: 0.018,
    maxArmSwing: 1.15,
    maxArmForwardSwing: 1.15,
    maxArmBackwardSwing: 0.55,
    maxElbowBend: 1.1,
    maxKneeBend: 1.3,
    legAdductionRoll: 0.05,
    armAdductionRoll: 0.07,
    basePelvisPitch: -0.09,
    baseShoulderPitch: 0.09,
    baseSpinePitch: 0.36,
    handSwingGain: 1.45,
    forearmSwingGain: 0.5,
    forearmElbowGain: 0.75,
    kneeLiftAmp: 0.30,
    cycleFreqBase: 4.0,
    cycleFreqGain: 10.0
  }
};

// Props: preset + contrôle externe de la marche
const props = defineProps({
  gaitPreset: {
    type: String,
    default: "normal",
    validator: (v) => ["casual", "normal", "dynamic"].includes(v)
  },
  // Si défini (0..1), on pilote la marche par l'extérieur et on ignore la souris pour la MARCHE
  walkSpeed: {
    type: Number,
    default: null
  },
  // Direction de marche quand walkSpeed est piloté (1: droite, -1: gauche)
  walkDirection: {
    type: Number,
    default: 1
  },
  // True: la souris contrôle la MARCHE (hérité) — False: marche contrôlée par props
  useMouseForWalk: {
    type: Boolean,
    default: true
  },
  // Force avatar to face the screen and stop walking (used at timeline boundaries)
  faceCamera: {
    type: Boolean,
    default: false
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
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // y = 0

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
  // Ajuster la caméra pour que l'avatar agrandi tienne entièrement dans le cadre
  // Inclure les pieds/chaussures: reculer légèrement et relever un peu la caméra,
  // avec un léger lookAt vers le bas pour garder le haut du corps centré.
  camera.position.set(0, 1.85, 14.5);
  camera.lookAt(new THREE.Vector3(0, 1.1, 0));

  renderer = new THREE.WebGLRenderer({
    canvas: canvas.value,
    alpha: true,
    antialias: true
  });
  // limiter le pixel ratio pour alléger la charge GPU sur écrans très haute-dpi
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  // compat: three.js renamed outputEncoding -> outputColorSpace in newer versions
  if ("outputColorSpace" in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  } else if ("outputEncoding" in renderer) {
    renderer.outputEncoding = THREE.sRGBEncoding;
  }

  // lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(3, 5, 2);
  scene.add(dir);

  // loader
  const loader = new GLTFLoader();
  loader.load(getAssetPath("/models/avatar-bleu.glb"), (gltf) => {
    avatar = gltf.scene;
  // remember base yaw so we rotate relative to initial facing (avoid turning back to camera)
  baseAvatarYaw = avatar.rotation.y || 0;
    
    // Enregistrer la pose de référence (bind) de chaque os
    avatar.traverse((obj) => {
      if (obj.isBone) {
        // Sauvegarder la pose de base pour y revenir proprement
        obj.userData.bindQuaternion = obj.quaternion.clone();
        obj.userData.bindRotation = obj.rotation.clone();
        bones[obj.name] = obj;
      }
    });

    // Calibration robuste de l'axe et du signe: on teste une petite rotation
    // et on choisit l'axe+signe qui font avancer la main vers l'avant de l'avatar.
    const calibratePitchAxisAndSign = (bone, distalBone) => {
      if (!bone || !distalBone || !bone.userData?.bindQuaternion) {
        return { axis: 'X', sign: 1 };
      }
      const origQ = bone.quaternion.clone();
      const bindQ = bone.userData.bindQuaternion.clone();
      const avatarWorldQ = new THREE.Quaternion();
      avatar.getWorldQuaternion(avatarWorldQ);
      const avatarFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(avatarWorldQ).normalize();
      const testAngle = 0.15;

      avatar.updateMatrixWorld(true);
      const basePos = new THREE.Vector3();
      distalBone.getWorldPosition(basePos);

      const axes = [
        { key: 'X', vec: new THREE.Vector3(1,0,0) },
        { key: 'Y', vec: new THREE.Vector3(0,1,0) },
        { key: 'Z', vec: new THREE.Vector3(0,0,1) }
      ];
      let best = { axis: 'X', sign: 1, score: -Infinity };
      for (const ax of axes) {
        for (const s of [1, -1]) {
          const q = bindQ.clone().multiply(new THREE.Quaternion().setFromAxisAngle(ax.vec, testAngle * s));
          bone.quaternion.copy(q);
          avatar.updateMatrixWorld(true);
          const p = new THREE.Vector3();
          distalBone.getWorldPosition(p);
          const delta = p.sub(basePos);
          const score = delta.dot(avatarFwd); // vers l'avant = meilleur
          if (score > best.score) best = { axis: ax.key, sign: s, score };
        }
      }
      // revert
      bone.quaternion.copy(origQ);
      avatar.updateMatrixWorld(true);
      return { axis: best.axis, sign: best.sign };
    };

  const leftArmBone = bones["LeftArm"];
  const rightArmBone = bones["RightArm"];
  const leftForeArmBone = bones["LeftForeArm"];
  const rightForeArmBone = bones["RightForeArm"];
  const leftHandBone = bones["LeftHand"];
  const rightHandBone = bones["RightHand"];

    if (leftArmBone && leftForeArmBone) {
      const c = calibratePitchAxisAndSign(leftArmBone, leftForeArmBone);
      leftArmBone.userData.pitchAxis = c.axis; leftArmBone.userData.pitchSign = c.sign;
    }
    if (rightArmBone && rightForeArmBone) {
      const c = calibratePitchAxisAndSign(rightArmBone, rightForeArmBone);
      rightArmBone.userData.pitchAxis = c.axis; rightArmBone.userData.pitchSign = c.sign;
    }
    if (leftForeArmBone && leftHandBone) {
      const c = calibratePitchAxisAndSign(leftForeArmBone, leftHandBone);
      leftForeArmBone.userData.pitchAxis = c.axis; leftForeArmBone.userData.pitchSign = c.sign;
    }
    if (rightForeArmBone && rightHandBone) {
      const c = calibratePitchAxisAndSign(rightForeArmBone, rightHandBone);
      rightForeArmBone.userData.pitchAxis = c.axis; rightForeArmBone.userData.pitchSign = c.sign;
    }
  // Pas de calibration spécifique pour les mains: elles héritent de l'axe du coude si nécessaire

  // Increase avatar size slightly more (keep camera position unchanged)
  avatar.scale.set(3.2, 3.2, 3.2);
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

// === Helpers d'animation basés sur la pose de référence ===
const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

// temporaries reused every frame to reduce GC churn
const _TMP_V1 = new THREE.Vector3();
const _TMP_V2 = new THREE.Vector3();
const _TMP_V3 = new THREE.Vector3();
const _TMP_Q = new THREE.Quaternion();
const _TMP_Q2 = new THREE.Quaternion();
const _TMP_P = new THREE.Plane();

function applyBoneOffset(bone, ox = 0, oy = 0, oz = 0, slerpAlpha = 0.3) {
  if (!bone || !bone.userData?.bindQuaternion) return;
  // build target quaternion in temporaries to avoid per-frame allocations
  _TMP_Q.copy(bone.userData.bindQuaternion);
  if (ox) _TMP_Q.multiply(_TMP_Q2.setFromAxisAngle(X_AXIS, ox));
  if (oy) _TMP_Q.multiply(_TMP_Q2.setFromAxisAngle(Y_AXIS, oy));
  if (oz) _TMP_Q.multiply(_TMP_Q2.setFromAxisAngle(Z_AXIS, oz));
  bone.quaternion.slerp(_TMP_Q, slerpAlpha);
}

function applyBoneOffsetAxis(bone, axis /* 'X'|'Y'|'Z' */, angle = 0, slerpAlpha = 0.3) {
  if (!bone || !bone.userData?.bindQuaternion || !angle) return;
  _TMP_Q.copy(bone.userData.bindQuaternion);
  const ax = axis === 'Y' ? Y_AXIS : axis === 'Z' ? Z_AXIS : X_AXIS;
  _TMP_Q.multiply(_TMP_Q2.setFromAxisAngle(ax, angle));
  bone.quaternion.slerp(_TMP_Q, slerpAlpha);
}

// === Animation de marche procédurale CORRIGÉE ===
function updateWalkAnimation(dt, speed, direction) {
   // cadence dépendante de la vitesse, avec base > 0 pour lisser
   const phaseRate = (GAIT.cycleFreqBase + GAIT.cycleFreqGain * speed) * speed;
   walkTime += dt * phaseRate;
   
   // Bones pour l'animation de marche
  const hipsBone = bones["Hips"];
  const spineBone = bones["Spine"];
  const leftShoulderBone = bones["LeftShoulder"]; // peut ne pas exister selon le rig
  const rightShoulderBone = bones["RightShoulder"];
  const leftUpLegBone = bones["LeftUpLeg"];
  const rightUpLegBone = bones["RightUpLeg"];
  const leftLegBone = bones["LeftLeg"];
  const rightLegBone = bones["RightLeg"];
  const leftArmBone = bones["LeftArm"];
  const rightArmBone = bones["RightArm"];
  const leftForeArmBone = bones["LeftForeArm"];
  const rightForeArmBone = bones["RightForeArm"];

  if (!hipsBone) return;

  // === Phases ===
  const speedPow = Math.pow(speed, 0.7); // plus naturel que linéaire
  const lPhase = walkTime;
  const rPhase = walkTime + Math.PI;

  // === Hanches - balancement naturel ===
  const hipYaw = Math.sin(walkTime) * GAIT.hipYawAmp * speedPow; // gauche-droite
  const hipRoll = Math.sin(walkTime * 2.0 + Math.PI * 0.5) * GAIT.hipRollAmp * speedPow; // appuis
  const pelvisPitch = GAIT.basePelvisPitch + Math.cos(walkTime) * GAIT.pelvisPitchAmp * speedPow; // légère bascule + tilt arrière
  
  // Appliquer le balancement des hanches (offsets sur la pose bind)
  applyBoneOffset(hipsBone, pelvisPitch, hipYaw, hipRoll, 0.2);

  // bob vertical symétrique (0..1) via (1-cos(2t))/2
  const hipBobY = ((1 - Math.cos(walkTime * 2)) * 0.5) * GAIT.hipBobAmp * speedPow;
  hipsBone.position.y = hipBobY;

  // === Jambes - mouvement de marche naturel ===
  // CORRECTION : Utiliser des rotations X uniquement pour un mouvement naturel
  let leftLegSwing = Math.sin(lPhase) * GAIT.legSwingAmp * speedPow;
  let rightLegSwing = Math.sin(rPhase) * GAIT.legSwingAmp * speedPow;
  // Accentuer le "genou qui avance et remonte" en phase d'avancée (sin > 0)
  leftLegSwing += Math.max(0, Math.sin(lPhase)) * GAIT.kneeLiftAmp * speedPow;
  rightLegSwing += Math.max(0, Math.sin(rPhase)) * GAIT.kneeLiftAmp * speedPow;
  
  // Flexion des genoux: plus fléchis en phase arrière, plus étendus au passage avant
  // Utilise (1 - cos)/2 pour une courbe 0..1 centrée sur la phase
  let leftKneeBend = ((1 - Math.cos(lPhase + Math.PI)) * 0.5) * GAIT.kneeBendAmp * speedPow;
  let rightKneeBend = ((1 - Math.cos(rPhase + Math.PI)) * 0.5) * GAIT.kneeBendAmp * speedPow;
  leftKneeBend = clamp(leftKneeBend, 0, GAIT.maxKneeBend);
  rightKneeBend = clamp(rightKneeBend, 0, GAIT.maxKneeBend);

  applyBoneOffset(leftUpLegBone, leftLegSwing, 0, 0, 0.25);
  applyBoneOffset(rightUpLegBone, rightLegSwing, 0, 0, 0.25);
  applyBoneOffset(leftLegBone, -leftKneeBend, 0, 0, 0.25);
  applyBoneOffset(rightLegBone, -rightKneeBend, 0, 0, 0.25);

  // Rapprocher les pieds vers le centre (légère adduction au niveau de la hanche)
  if (leftUpLegBone) applyBoneOffset(leftUpLegBone, 0, 0, -GAIT.legAdductionRoll, 0.2);
  if (rightUpLegBone) applyBoneOffset(rightUpLegBone, 0, 0, GAIT.legAdductionRoll, 0.2);

  // === Bras - coordination contralatérale: bras gauche suit le pied droit, bras droit suit le pied gauche
  // Si le pied droit avance (sin(rPhase) > 0), le bras gauche avance (même sens). Idem à l'inverse.
  const leftArmPhase = rPhase;
  const rightArmPhase = lPhase;
  // Amplitudes brutes
  let leftArmSwing = Math.sin(leftArmPhase) * GAIT.armSwingAmp * speedPow;
  let rightArmSwing = Math.sin(rightArmPhase) * GAIT.armSwingAmp * speedPow;
  // Appliquer le signe par côté pour obtenir un angle où >0 = vers l'avant
  let rightApplied = (rightArmBone ? (rightArmBone.userData.pitchSign ?? 1) : 1) * rightArmSwing;
  // Asymétrie: limiter plus fortement le mouvement vers l'arrière pour éviter la sensation de "démembrement"
  const maxFwd = GAIT.maxArmForwardSwing ?? GAIT.maxArmSwing;
  const maxBack = GAIT.maxArmBackwardSwing ?? GAIT.maxArmSwing;
  rightApplied = clamp(rightApplied, -maxBack, maxFwd);
  // Côté gauche indépendant: utiliser sa propre calibration signe/axe
  let leftApplied = (leftArmBone ? (leftArmBone.userData.pitchSign ?? 1) : 1) * leftArmSwing;
  leftApplied = clamp(leftApplied, -maxBack, maxFwd);
  
  // Flexion des coudes: extension quand le bras passe devant, flexion quand il passe derrière
  let leftElbowBend = GAIT.elbowBase + ((1 - Math.cos(leftArmPhase + Math.PI)) * 0.5) * GAIT.elbowBendAmp * GAIT.forearmElbowGain * speedPow;
  let rightElbowBend = GAIT.elbowBase + ((1 - Math.cos(rightArmPhase + Math.PI)) * 0.5) * GAIT.elbowBendAmp * GAIT.forearmElbowGain * speedPow;
  leftElbowBend = clamp(leftElbowBend, 0, GAIT.maxElbowBend);
  rightElbowBend = clamp(rightElbowBend, 0, GAIT.maxElbowBend);

  const lAxis = leftArmBone?.userData?.pitchAxis || 'X';
  const rAxis = rightArmBone?.userData?.pitchAxis || 'X';
  const lSign = leftArmBone?.userData?.pitchSign ?? 1;
  const rSign = rightArmBone?.userData?.pitchSign ?? 1;
  const lElbAxis = leftForeArmBone?.userData?.pitchAxis || lAxis;
  const rElbAxis = rightForeArmBone?.userData?.pitchAxis || rAxis;
  const lElbSign = leftForeArmBone?.userData?.pitchSign ?? lSign;
  const rElbSign = rightForeArmBone?.userData?.pitchSign ?? rSign;
  const lHandAxis = (bones["LeftHand"]?.userData?.pitchAxis) || lElbAxis;
  const rHandAxis = (bones["RightHand"]?.userData?.pitchAxis) || rElbAxis;

  // Swing bras essentiellement avant/arrière le long de l'axe latéral détecté
  applyBoneOffsetAxis(leftArmBone, lAxis, leftApplied, 0.25);
  applyBoneOffsetAxis(rightArmBone, rAxis, rightApplied, 0.25);

  // Très légère composante latérale (presque nulle) pour la vie
  const tinyZL = Math.sin(lPhase + Math.PI) * GAIT.armZSwingAmp * speedPow;
  const tinyZR = Math.sin(rPhase + Math.PI) * GAIT.armZSwingAmp * speedPow;
  if (Math.abs(tinyZL) > 1e-4) applyBoneOffset(leftArmBone, 0, 0, tinyZL, 0.25);
  if (Math.abs(tinyZR) > 1e-4) applyBoneOffset(rightArmBone, 0, 0, tinyZR, 0.25);

  // Avant-bras: petite composante de swing + flexion de coude
  if (leftForeArmBone) {
    // calculer l'angle dans l'espace calibré du coude (tenir compte du pitchSign)
    let leftForeArmAngle = (leftApplied * GAIT.forearmSwingGain) - (lElbSign * leftElbowBend);
    // éviter l'hyper-extension : clamp strict
    leftForeArmAngle = clamp(leftForeArmAngle, -GAIT.maxElbowBend, GAIT.maxElbowBend);
    applyBoneOffsetAxis(leftForeArmBone, lElbAxis, leftForeArmAngle, 0.25);
  }
  if (rightForeArmBone) {
    let rightForeArmAngle = (rightApplied * GAIT.forearmSwingGain) - (rElbSign * rightElbowBend);
    rightForeArmAngle = clamp(rightForeArmAngle, -GAIT.maxElbowBend, GAIT.maxElbowBend);
    applyBoneOffsetAxis(rightForeArmBone, rElbAxis, rightForeArmAngle, 0.25);
  }

  // ---- Mains : appliquer une rotation symétrique et une adduction pour les rapprocher du torse
  const leftHandBone = bones["LeftHand"];
  const rightHandBone = bones["RightHand"];

  // main yaw/pitch basés sur l'angle appliqué au bras (leftApplied/rightApplied)
  // on inverse légèrement le yaw pour que la paume tende vers le bas/avant
  const handYawL = clamp(-leftApplied * HAND_YAW_GAIN, -MAX_HAND_YAW, MAX_HAND_YAW);
  const handYawR = clamp(-rightApplied * HAND_YAW_GAIN, -MAX_HAND_YAW, MAX_HAND_YAW);
  const handPitchL = clamp(leftApplied * HAND_PITCH_GAIN, -MAX_HAND_PITCH, MAX_HAND_PITCH);
  const handPitchR = clamp(rightApplied * HAND_PITCH_GAIN, -MAX_HAND_PITCH, MAX_HAND_PITCH);

  // Appliquer rotations lissées sur les mains (axes calibrés hérités si présents)
  if (leftHandBone) {
    // pitch
    applyBoneOffsetAxis(leftHandBone, lHandAxis, handPitchL, 0.25);
    // yaw (Y axis)
    applyBoneOffsetAxis(leftHandBone, 'Y', handYawL, 0.25);
    // rapprocher du torse (adduction supplémentaire)
    applyBoneOffset(leftHandBone, 0, 0, -(GAIT.armAdductionRoll + HAND_ADDUCTION_EXTRA), 0.22);
  }
  if (rightHandBone) {
    applyBoneOffsetAxis(rightHandBone, rHandAxis, handPitchR, 0.25);
    applyBoneOffsetAxis(rightHandBone, 'Y', handYawR, 0.25);
    applyBoneOffset(rightHandBone, 0, 0, (GAIT.armAdductionRoll + HAND_ADDUCTION_EXTRA), 0.22);
  }

  // Rapprocher les bras du torse (légère adduction/roulis) en complément
  if (leftArmBone) applyBoneOffset(leftArmBone, 0, 0, -(GAIT.armAdductionRoll + HAND_ADDUCTION_EXTRA * 0.6), 0.22);
  if (rightArmBone) applyBoneOffset(rightArmBone, 0, 0, (GAIT.armAdductionRoll + HAND_ADDUCTION_EXTRA * 0.6), 0.22);

  // === Rotation du torse ===
  if (spineBone) {
    const spineYaw = -hipYaw * GAIT.spineCounterYaw + direction * 0.08 * speedPow;
    const spineRoll = Math.sin(walkTime * 0.5) * GAIT.spineRollAmp * speedPow;
    const spinePitch = GAIT.baseSpinePitch || 0;
    applyBoneOffset(spineBone, spinePitch, spineYaw, spineRoll, 0.2);
   }
   // Épaules: contre-roulis subtil opposé au bassin
  if (leftShoulderBone) {
    applyBoneOffset(leftShoulderBone, 0, 0, -hipRoll * (GAIT.shoulderRollAmp / Math.max(GAIT.hipRollAmp, 1e-6)), 0.25);
    // Avancer légèrement les épaules (lean avant subtil)
    applyBoneOffset(leftShoulderBone, GAIT.baseShoulderPitch, 0, 0, 0.25);
  }
  if (rightShoulderBone) {
    applyBoneOffset(rightShoulderBone, 0, 0, -hipRoll * (GAIT.shoulderRollAmp / Math.max(GAIT.hipRollAmp, 1e-6)), 0.25);
    applyBoneOffset(rightShoulderBone, GAIT.baseShoulderPitch, 0, 0, 0.25);
  }

  // === Pieds - légère dorsiflexion en phase de swing ===
  const leftFootBone = bones["LeftFoot"];
  const rightFootBone = bones["RightFoot"];
  if (leftFootBone) {
     const dorsiflex = Math.max(0, Math.sin(lPhase)) * GAIT.footLiftAmp * speedPow;
     const plantar = Math.max(0, -Math.sin(lPhase)) * GAIT.footPlantarAmp * speedPow;
     const footPitch = dorsiflex - plantar; // lever devant, pousser derrière
    applyBoneOffset(leftFootBone, footPitch, 0, 0, 0.25);
   }
  if (rightFootBone) {
     const dorsiflex = Math.max(0, Math.sin(rPhase)) * GAIT.footLiftAmp * speedPow;
     const plantar = Math.max(0, -Math.sin(rPhase)) * GAIT.footPlantarAmp * speedPow;
     const footPitch = dorsiflex - plantar;
    applyBoneOffset(rightFootBone, footPitch, 0, 0, 0.25);
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
  const hipsBone = bones["Hips"];
  if (hipsBone) {
    hipsBone.position.y = lerp(hipsBone.position.y, 0, 0.1);
  }

  // Conserver l'inclinaison en avant du torse même à l'arrêt
  const spineBone = bones["Spine"];
  if (spineBone) {
    applyBoneOffset(spineBone, (GAIT.baseSpinePitch || 0), 0, 0, 0.2);
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

  // === Contrôle MARCHE: soit par props (externe), soit par souris (hérité) ===
  // Si faceCamera est actif, on force l'arrêt
  if (props.faceCamera) {
    isWalking = false;
    walkSpeed = lerp(walkSpeed, 0, 0.4);
    if (walkSpeed < 0.01) walkSpeed = 0;
  } else if (!props.useMouseForWalk && typeof props.walkSpeed === 'number') {
    // Contrôle externe
    const target = clamp(props.walkSpeed, 0, 1);
    // lissage léger pour éviter les à-coups
    walkSpeed = lerp(walkSpeed, target, 0.3);
    walkDirection = props.walkDirection >= 0 ? 1 : -1;
    isWalking = walkSpeed > 0.03;
  } else {
    // Contrôle par la position horizontale de la souris (hérité)
    const mouseHorizontal = mouseNDC.x;
    const deadZone = 0.1; // Zone morte réduite
    if (Math.abs(mouseHorizontal) > deadZone) {
      isWalking = true;
      walkDirection = Math.sign(mouseHorizontal);
      const rawSpeed = (Math.abs(mouseHorizontal) - deadZone) / (1 - deadZone);
      walkSpeed = clamp(rawSpeed, 0, 1);
    } else {
      isWalking = false;
      walkSpeed = lerp(walkSpeed, 0, 0.2);
      if (walkSpeed < 0.01) walkSpeed = 0;
    }
  }

  // === Orientation du corps vers le pointeur (plus naturel) ===
  raycaster.setFromCamera(mouseNDC, camera);
  // réutiliser des vecteurs temporaires pour éviter des allocations par frame
  avatar.getWorldPosition(_TMP_V1); // aPos
  camera.getWorldDirection(_TMP_V2); // camDir
   // compute mouse velocity (used to slightly bias responsiveness)
  const invDt = dt > 0 ? 1 / dt : 0;
  mouseVelocity.x = (mouseNDC.x - prevMouseNDC.x) * invDt;
  mouseVelocity.y = (mouseNDC.y - prevMouseNDC.y) * invDt;
  prevMouseNDC.copy(mouseNDC);

  // Map horizontal mouse position to a desired body yaw with asymmetric thresholds:
  // mouseNormalized in [0,1] where 0 = far left, 0.5 = center, 1 = far right.
  // We want: <=0.25 => full left (-1), 0.25..0.5 => interpolate -1..0, 0.5..0.75 => interpolate 0..+1, >=0.75 => full right (+1).
  // This is achieved by factor = clamp(4*mouseNorm - 2, -1, 1)
  const mouseNorm = (clamp(mouseNDC.x, -1, 1) + 1) * 0.5;
  let factor = clamp(4 * mouseNorm - 2, -1, 1);
  // Si on doit faire face à la caméra (aux bornes), pas de rotation latérale
  if (props.faceCamera) factor = 0;

  // Keep a small responsiveness adaptation similar to before
  const currentYaw = avatar.rotation.y;
  const angNorm = clamp(Math.abs(factor), 0, 1);
  const baseAlpha = lerp(MAX_BODY_ALPHA, MIN_BODY_ALPHA, angNorm);
  const bodyAlpha = baseAlpha * (isWalking ? 0.6 : 1.0);
  const speedBias = clamp(Math.abs(mouseVelocity.x) * 0.5, 0, 0.5);
  const alphaFinal = clamp(bodyAlpha + speedBias * dt * 10, MIN_BODY_ALPHA, MAX_BODY_ALPHA + 0.15);

  // maximum yaw delta (how far the body can turn from forward)
  const MAX_TURN_DELTA = Math.PI / 1.5; // 90° profile

  // target yaw relative to avatar's initial forward (avoid turning the back to the camera)
  const baseYaw = typeof baseAvatarYaw === 'number' ? baseAvatarYaw : 0;
  const bodyYawTarget = baseYaw + factor * MAX_TURN_DELTA * TORSO_FOLLOW;
  avatar.rotation.y = lerpAngle(currentYaw, bodyYawTarget, alphaFinal);

  // apply remaining twist to the spine for natural counter-rotation
  const Spine = bones["Spine"];
  if (Spine) {
    const spineYaw = factor * MAX_TURN_DELTA * (1 - TORSO_FOLLOW) * 0.9;
    applyBoneOffsetAxis(Spine, 'Y', clamp(spineYaw, -0.6, 0.6), 0.12);
  }

  // Bones pour le suivi de la tête
  const neckBone = bones["Neck"];
  const headBone = bones["Head"] || bones["Wolf3D_Head"];
  const eyeLeftBone = bones["EyeLeft"] || bones["LeftEye"];
  const eyeRightBone = bones["EyeRight"] || bones["RightEye"];

  if (headBone) {
    // Position monde de la tête
    headBone.getWorldPosition(_TMP_V1);
    const headPos = _TMP_V1;
    
    // Vecteur tête → point visé sur le plan "écran" (réutilise _TMP_V3)
    const lookPoint = _TMP_V3;
    _TMP_P.setFromNormalAndCoplanarPoint(_TMP_V2, headPos);
    if (!raycaster.ray.intersectPlane(_TMP_P, lookPoint)) {
      lookPoint.copy(raycaster.ray.direction).multiplyScalar(5).add(raycaster.ray.origin);
    }
    _TMP_V2.subVectors(lookPoint, headPos).normalize();
    const dir = _TMP_V2;

    // Angles yaw/pitch (inverser le pitch pour que bas écran = tête vers le bas)
    let yaw = Math.atan2(dir.x, dir.z);
    let pitch = -Math.asin(clamp(dir.y, -1, 1));
    // Aux bornes: tête centrée (face écran)
    if (props.faceCamera) {
      yaw = lerp(yaw, 0, 0.6);
      pitch = lerp(pitch, 0, 0.6);
    }

    // ---- Appliquer aux yeux ----
    const maxEyeYaw = 0.32;
    const maxEyePitch = 0.32;
    if (eyeLeftBone) {
      eyeLeftBone.rotation.y = lerp(eyeLeftBone.rotation.y, clamp(yaw, -maxEyeYaw, maxEyeYaw), EYE_RESPONSIVENESS);
      eyeLeftBone.rotation.x = lerp(eyeLeftBone.rotation.x, clamp(pitch, -maxEyePitch, maxEyePitch), EYE_RESPONSIVENESS);
    }
    if (eyeRightBone) {
      eyeRightBone.rotation.y = lerp(eyeRightBone.rotation.y, clamp(yaw, -maxEyeYaw, maxEyeYaw), EYE_RESPONSIVENESS);
      eyeRightBone.rotation.x = lerp(eyeRightBone.rotation.x, clamp(pitch, -maxEyePitch, maxEyePitch), EYE_RESPONSIVENESS);
    }

  // ---- Appliquer à la tête + cou (lissage + anticipation) ----
  // Réduire l'amplitude quand on marche pour un effet plus naturel
  const headReduction = (isWalking && !props.faceCamera) ? 0.5 : 1.0;
  const maxHeadYaw = Math.min(MAX_HEAD_YAW, 0.9 * headReduction);
  const maxHeadPitch = Math.min(MAX_HEAD_PITCH, 0.9 * headReduction);

  if (neckBone || headBone) {
    // desired angles clamped
    const desiredYaw = clamp(yaw, -maxHeadYaw, maxHeadYaw);
    const desiredPitch = clamp(pitch, -maxHeadPitch, maxHeadPitch);

    // anticipation from horizontal mouse velocity
    const lead = clamp(mouseVelocity.x * HEAD_LEAD_GAIN, -0.25, 0.25);

    // reduce responsiveness a bit while walking to avoid jitter
    const respFactor = HEAD_RESPONSIVENESS * (isWalking ? HEAD_WALK_REDUCTION : 1.0);

    // smoothed targets (exponential smoothing via lerp)
    const smoothedYaw = lerp(prevHeadYaw, desiredYaw + lead, respFactor);
    const smoothedPitch = lerp(prevHeadPitch, desiredPitch, respFactor);

    // neck gets a fraction of the head rotation for natural motion
    const neckYaw = smoothedYaw * 0.45;
    const neckPitch = smoothedPitch * 0.6;

    if (neckBone) applyBoneOffsetAxis(neckBone, 'Y', neckYaw, respFactor);
    if (neckBone) applyBoneOffsetAxis(neckBone, 'X', neckPitch, respFactor);

    if (headBone) applyBoneOffsetAxis(headBone, 'Y', smoothedYaw, respFactor);
    if (headBone) applyBoneOffsetAxis(headBone, 'X', smoothedPitch, respFactor);

    // store for next frame
    prevHeadYaw = smoothedYaw;
    prevHeadPitch = smoothedPitch;
  }
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
