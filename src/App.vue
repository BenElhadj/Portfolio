<template>
  <div class="pages">
    <div>
      <Navbar />
      <NameBanner />
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
      <Hard_Skills />
    </section>

    <!-- Page 5 : Projets -->
    <section class="page">
      <Projects />
    </section>
    
    <!-- Page 6 : Soft skills -->
    <section class="page">
      <Soft_Skills />
    </section>

    <!-- Page 7 : Liens utiles -->
    <section class="page">
      <Links />
    </section>
  </div>
</template>

<script setup>
import Navbar from "./assets/Navbar.vue";
import NameBanner from "./assets/NameBanner.vue";
import Timeline from "./components/Timeline.vue";
import Diplomas from "./components/Diplomas.vue";
import Experiences from "./components/Experiences.vue";
import Hard_Skills from "./components/Hard_Skills.vue";
import Projects from "./components/Projects.vue";
import Soft_Skills from "./components/Soft_Skills.vue";
import Links from "./components/Links.vue";

import { usePageNavigation } from "./composables/usePageNavigation.js";
usePageNavigation(".pages");
</script>
