<template>
  <canvas ref="canvas"></canvas>
</template>

<script setup>
import { onMounted, ref } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let action = null;
let headBone = null;
let neckBone = null;
let mouse = new THREE.Vector2(0, 0);


const canvas = ref(null);
const props = defineProps({
  speed: { type: Number, default: 0 } // vitesse normalisée (0 = arrêt, 1 = vitesse max)
});

onMounted(() => {
  // === Scene & Camera ===
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.5, 3);

  // === Renderer ===
  const renderer = new THREE.WebGLRenderer({ canvas: canvas.value, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // === Lights ===
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
  scene.add(hemiLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(3, 5, 2);
  scene.add(dirLight);

  // === Load Avatar ===
  const loader = new GLTFLoader();
  loader.load("/models/avatar.glb", (gltf) => {
    const avatar = gltf.scene;
    avatar.scale.set(1.2, 1.2, 1.2);
    scene.add(avatar);

    // Animation mixer
    const mixer = new THREE.AnimationMixer(avatar);
    if (gltf.animations.length > 0) {
      action = mixer.clipAction(gltf.animations[0]);
      action.play();
    }

    // --- Récupérer le bone de la tête ---
    avatar.traverse((obj) => {
      console.log(obj.name);
      if (obj.isBone && (obj.name.toLowerCase().includes("head") || obj.name.toLowerCase().includes("neck"))) {
        headBone = obj;
      }
      if (obj.name === "Head") headBone = obj;
      if (obj.name === "neck") neckBone = obj;
    });

    // === Mouse interaction ===
    window.addEventListener("mousemove", (event) => {
      // Normaliser coordonnées entre -1 et 1
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // === Animation Loop ===
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);

      const delta = clock.getDelta();

      // ⏩ adapter la vitesse d’animation selon props.speed
      if (action) {
        action.timeScale = props.speed; // 0 = stop, 1 = normal, >1 = accéléré
      }

      mixer.update(delta);

      // Faire tourner le corps légèrement
      avatar.rotation.y = mouse.x * 1.5; // corps tourne gauche/droite
      avatar.rotation.x = mouse.y * 0.1; // corps penche haut/bas

      // Faire tourner la tête indépendamment
      if (headBone) {
      // mouvement subtil de la tête
        headBone.rotation.y = mouse.x * 0.3 * -1;  // gauche/droite
        headBone.rotation.x = mouse.y * 0.5 * -1;  // haut/bas
      }

      if (neckBone) {
        // cou accompagne un peu le mouvement pour un effet naturel
        neckBone.rotation.y = mouse.x * 0.3 * -1;
        neckBone.rotation.x = mouse.y * 0.6 * -1;
      }

      renderer.render(scene, camera);
    };
    animate();
  });
});
</script>

<style>
canvas {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
