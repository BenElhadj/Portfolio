<template>
  <div class="pages">
    <div>
      <Navbar />
    </div>
    <!-- Page 1 : Timeline + Avatar -->
    <section class="page">
      <Timeline />
    </section>

    <!-- Page 2 : Diplômes -->
    <section class="page">
      <Diplomas />
    </section>

    <!-- Page 3 : Expériences -->
    <section class="page">
      <Experiences />
    </section>

    <!-- Page 4 : Compétences techniques -->
    <section class="page">
      <Skills />
    </section>

    <!-- Page 5 : Soft skills -->
    <section class="page">
      <h1>Soft Skills</h1>
    </section>

    <!-- Page 6 : Projets -->
    <section class="page">
      {{ $t("projects") }}
    </section>

    <!-- Page 7 : Liens utiles -->
    <section class="page">
      <h1>Liens utiles</h1>
    </section>
  </div>
</template>

<script setup>
import Navbar from "./assets/Navbar.vue";
import Timeline from "./components/Timeline.vue";
import Diplomas from "./components/Diplomas.vue";
import Experiences from "./components/Experiences.vue";
import Skills from "./components/Skills.vue";

import { usePageNavigation } from "./composables/usePageNavigation.js";
usePageNavigation(".pages");
</script>
