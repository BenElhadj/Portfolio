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
    cycleFreqBase: 2.2,   // rad/s de base
    cycleFreqGain: 5.0    // gain selon la vitesse
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
    cycleFreqBase: 2.6,
    cycleFreqGain: 6.0
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

  const LeftArm = bones["LeftArm"];
  const RightArm = bones["RightArm"];
  const LeftForeArm = bones["LeftForeArm"];
  const RightForeArm = bones["RightForeArm"];
  const LeftHand = bones["LeftHand"];
  const RightHand = bones["RightHand"];

    if (LeftArm && LeftForeArm) {
      const c = calibratePitchAxisAndSign(LeftArm, LeftForeArm);
      LeftArm.userData.pitchAxis = c.axis; LeftArm.userData.pitchSign = c.sign;
    }
    if (RightArm && RightForeArm) {
      const c = calibratePitchAxisAndSign(RightArm, RightForeArm);
      RightArm.userData.pitchAxis = c.axis; RightArm.userData.pitchSign = c.sign;
    }
    if (LeftForeArm && LeftHand) {
      const c = calibratePitchAxisAndSign(LeftForeArm, LeftHand);
      LeftForeArm.userData.pitchAxis = c.axis; LeftForeArm.userData.pitchSign = c.sign;
    }
    if (RightForeArm && RightHand) {
      const c = calibratePitchAxisAndSign(RightForeArm, RightHand);
      RightForeArm.userData.pitchAxis = c.axis; RightForeArm.userData.pitchSign = c.sign;
    }
  // Pas de calibration spécifique pour les mains: elles héritent de l'axe du coude si nécessaire

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
  const pelvisPitch = GAIT.basePelvisPitch + Math.cos(walkTime) * GAIT.pelvisPitchAmp * speedPow; // légère bascule + tilt arrière
  
  // Appliquer le balancement des hanches (offsets sur la pose bind)
  applyBoneOffset(Hips, pelvisPitch, hipYaw, hipRoll, 0.2);

  // bob vertical symétrique (0..1) via (1-cos(2t))/2
  const hipBobY = ((1 - Math.cos(walkTime * 2)) * 0.5) * GAIT.hipBobAmp * speedPow;
  Hips.position.y = hipBobY;

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

  applyBoneOffset(LeftUpLeg, leftLegSwing, 0, 0, 0.25);
  applyBoneOffset(RightUpLeg, rightLegSwing, 0, 0, 0.25);
  applyBoneOffset(LeftLeg, -leftKneeBend, 0, 0, 0.25);
  applyBoneOffset(RightLeg, -rightKneeBend, 0, 0, 0.25);

  // Rapprocher les pieds vers le centre (légère adduction au niveau de la hanche)
  if (LeftUpLeg) applyBoneOffset(LeftUpLeg, 0, 0, -GAIT.legAdductionRoll, 0.2);
  if (RightUpLeg) applyBoneOffset(RightUpLeg, 0, 0, GAIT.legAdductionRoll, 0.2);

  // === Bras - coordination contralatérale: bras gauche suit le pied droit, bras droit suit le pied gauche
  // Si le pied droit avance (sin(rPhase) > 0), le bras gauche avance (même sens). Idem à l'inverse.
  const leftArmPhase = rPhase;
  const rightArmPhase = lPhase;
  // Amplitudes brutes
  let leftArmSwing = Math.sin(leftArmPhase) * GAIT.armSwingAmp * speedPow;
  let rightArmSwing = Math.sin(rightArmPhase) * GAIT.armSwingAmp * speedPow;
  // Appliquer le signe par côté pour obtenir un angle où >0 = vers l'avant
  let rightApplied = (RightArm ? (RightArm.userData.pitchSign ?? 1) : 1) * rightArmSwing;
  // Asymétrie: limiter plus fortement le mouvement vers l'arrière pour éviter la sensation de "démembrement"
  const maxFwd = GAIT.maxArmForwardSwing ?? GAIT.maxArmSwing;
  const maxBack = GAIT.maxArmBackwardSwing ?? GAIT.maxArmSwing;
  rightApplied = clamp(rightApplied, -maxBack, maxFwd);
  // Côté gauche indépendant: utiliser sa propre calibration signe/axe
  let leftApplied = (LeftArm ? (LeftArm.userData.pitchSign ?? 1) : 1) * leftArmSwing;
  leftApplied = clamp(leftApplied, -maxBack, maxFwd);
  
  // Flexion des coudes: extension quand le bras passe devant, flexion quand il passe derrière
  let leftElbowBend = GAIT.elbowBase + ((1 - Math.cos(leftArmPhase + Math.PI)) * 0.5) * GAIT.elbowBendAmp * GAIT.forearmElbowGain * speedPow;
  let rightElbowBend = GAIT.elbowBase + ((1 - Math.cos(rightArmPhase + Math.PI)) * 0.5) * GAIT.elbowBendAmp * GAIT.forearmElbowGain * speedPow;
  leftElbowBend = clamp(leftElbowBend, 0, GAIT.maxElbowBend);
  rightElbowBend = clamp(rightElbowBend, 0, GAIT.maxElbowBend);

  const lAxis = LeftArm?.userData?.pitchAxis || 'X';
  const rAxis = RightArm?.userData?.pitchAxis || 'X';
  const lSign = LeftArm?.userData?.pitchSign ?? 1;
  const rSign = RightArm?.userData?.pitchSign ?? 1;
  const lElbAxis = LeftForeArm?.userData?.pitchAxis || lAxis;
  const rElbAxis = RightForeArm?.userData?.pitchAxis || rAxis;
  const lElbSign = LeftForeArm?.userData?.pitchSign ?? lSign;
  const rElbSign = RightForeArm?.userData?.pitchSign ?? rSign;
  const lHandAxis = (bones["LeftHand"]?.userData?.pitchAxis) || lElbAxis;
  const rHandAxis = (bones["RightHand"]?.userData?.pitchAxis) || rElbAxis;

  // Swing bras essentiellement avant/arrière le long de l'axe latéral détecté
  applyBoneOffsetAxis(LeftArm, lAxis, leftApplied, 0.25);
  applyBoneOffsetAxis(RightArm, rAxis, rightApplied, 0.25);

  // Très légère composante latérale (presque nulle) pour la vie
  const tinyZL = Math.sin(lPhase + Math.PI) * GAIT.armZSwingAmp * speedPow;
  const tinyZR = Math.sin(rPhase + Math.PI) * GAIT.armZSwingAmp * speedPow;
  if (Math.abs(tinyZL) > 1e-4) applyBoneOffset(LeftArm, 0, 0, tinyZL, 0.25);
  if (Math.abs(tinyZR) > 1e-4) applyBoneOffset(RightArm, 0, 0, tinyZR, 0.25);

  // Avant-bras: petite composante de swing + flexion de coude
  applyBoneOffsetAxis(LeftForeArm, lElbAxis, (leftApplied * GAIT.forearmSwingGain) - leftElbowBend, 0.25);
  applyBoneOffsetAxis(RightForeArm, rElbAxis, (rightApplied * GAIT.forearmSwingGain) - rightElbowBend, 0.25);

  // Mains: pas de mouvement demandé -> ne pas appliquer de swing aux mains

  // Rapprocher les bras du torse (légère adduction/roulis)
  if (LeftArm) applyBoneOffset(LeftArm, 0, 0, -GAIT.armAdductionRoll, 0.2);
  if (RightArm) applyBoneOffset(RightArm, 0, 0, GAIT.armAdductionRoll, 0.2);

  // === Rotation du torse ===
  if (Spine) {
    const spineYaw = -hipYaw * GAIT.spineCounterYaw + direction * 0.08 * speedPow;
    const spineRoll = Math.sin(walkTime * 0.5) * GAIT.spineRollAmp * speedPow;
    const spinePitch = GAIT.baseSpinePitch || 0;
    applyBoneOffset(Spine, spinePitch, spineYaw, spineRoll, 0.2);
  }
  // Épaules: contre-roulis subtil opposé au bassin
  if (LeftShoulder) {
    applyBoneOffset(LeftShoulder, 0, 0, -hipRoll * (GAIT.shoulderRollAmp / Math.max(GAIT.hipRollAmp, 1e-6)), 0.25);
    // Avancer légèrement les épaules (lean avant subtil)
    applyBoneOffset(LeftShoulder, GAIT.baseShoulderPitch, 0, 0, 0.25);
  }
  if (RightShoulder) {
    applyBoneOffset(RightShoulder, 0, 0, -hipRoll * (GAIT.shoulderRollAmp / Math.max(GAIT.hipRollAmp, 1e-6)), 0.25);
    applyBoneOffset(RightShoulder, GAIT.baseShoulderPitch, 0, 0, 0.25);
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

  // Conserver l'inclinaison en avant du torse même à l'arrêt
  const Spine = bones["Spine"];
  if (Spine) {
    applyBoneOffset(Spine, (GAIT.baseSpinePitch || 0), 0, 0, 0.2);
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
  } else {
    isWalking = false;
    // Réduire progressivement la vitesse
    walkSpeed = lerp(walkSpeed, 0, 0.2);
    if (walkSpeed < 0.01) walkSpeed = 0;
  }

  // === Orientation du corps vers le pointeur (plan 2D perpendiculaire caméra, clamp à 180°) ===
  raycaster.setFromCamera(mouseNDC, camera);
  const aPos = new THREE.Vector3();
  avatar.getWorldPosition(aPos);
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);
  const screenPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(camDir, aPos);
  const hit = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(screenPlane, hit)) {
    const to = new THREE.Vector3(hit.x - aPos.x, 0, hit.z - aPos.z);
    if (to.lengthSq() > 1e-6) {
      const desiredYaw = Math.atan2(to.x, to.z);
      const camYaw = Math.atan2(camDir.x, camDir.z);
      const delta = clamp(wrapPi(desiredYaw - camYaw), -Math.PI / 2, Math.PI / 2);
      const clampedYaw = camYaw + delta;
      avatar.rotation.y = lerpAngle(avatar.rotation.y, clampedYaw, 0.08);
    }
  }

  // Bones pour le suivi de la tête
  const Neck = bones["Neck"];
  const Head = bones["Head"] || bones["Wolf3D_Head"];
  const EyeL = bones["EyeLeft"] || bones["LeftEye"];
  const EyeR = bones["EyeRight"] || bones["RightEye"];

  if (Head) {
    // Position monde de la tête
    let headPos = new THREE.Vector3();
    Head.getWorldPosition(headPos);

    // Vecteur tête → point visé sur le plan "écran"
    let lookPoint = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(new THREE.Plane().setFromNormalAndCoplanarPoint(camDir, headPos), lookPoint)) {
      lookPoint.copy(raycaster.ray.direction).multiplyScalar(5).add(raycaster.ray.origin);
    }
    let dir = new THREE.Vector3().subVectors(lookPoint, headPos).normalize();

    // Angles yaw/pitch (inverser le pitch pour que bas écran = tête vers le bas)
    const yaw = Math.atan2(dir.x, dir.z);
    const pitch = -Math.asin(clamp(dir.y, -1, 1));

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