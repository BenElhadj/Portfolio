<template>
  <div class="pages">
    <!-- Page 1 : Timeline + Avatar -->
    <section class="page">
      <Timeline />
    </section>

    <!-- Page 2 : Diplômes -->
    <section class="page">
      <!-- <h1>Diplômes</h1> -->
      <Diplomas />
      <!-- contenu -->
    </section>

    <!-- Page 3 : Expériences -->
    <section class="page">
      <!-- <h1>Expériences</h1> -->
      <Experiences />
    </section>

    <!-- Page 4 : Compétences techniques -->
    <section class="page">
      <!-- <h1>Compétences techniques</h1> -->
      <Skills />
    </section>

    <!-- Page 5 : Soft skills -->
    <section class="page">
      <h1>Soft Skills</h1>
    </section>

    <!-- Page 6 : Projets -->
    <section class="page">
      <h1>Projets</h1>
    </section>

    <!-- Page 7 : Liens utiles -->
    <section class="page">
      <h1>Liens utiles</h1>
    </section>
  </div>
</template>

<script setup>
import Timeline from "./components/Timeline.vue";
import Diplomas from "./components/Diplomas.vue";
import Experiences from "./components/Experiences.vue";
import Skills from "./components/Skills.vue";

import { usePageNavigation } from "./composables/usePageNavigation.js";
usePageNavigation(".pages");
</script>

<style>
/* MODIF : .pages utilise height relative à #app */
.pages {
  height: 100%; /* Au lieu de 100vh */
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;

  /* Masquer totalement la barre de scroll */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
.pages::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

/* MODIF : .page force min-height et stretch pour enfants */
.page {
  min-height: 100vh; /* Au lieu de height: 100vh pour flexibilité */
  height: 100%; /* Remplit le parent */
  scroll-snap-align: start;
  display: flex;
  justify-content: center;
  align-items: stretch; /* Au lieu de center : étire les enfants verticalement */
  font-size: 3rem;
}
.page::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

/* AJOUT : Responsive pour mobile (hauteurs auto si overflow) */
@media (max-width: 768px) {
  .page {
    align-items: flex-start; /* Pas de stretch sur mobile pour éviter overflows */
    padding-top: 20px;
  }
}
</style>