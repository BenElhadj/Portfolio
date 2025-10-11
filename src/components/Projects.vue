```vue
<template>
  <div class="wrapper">
    <h2 class="title">{{ $t("projects.title") }}</h2>

    <PageLayout :itemCount="projects.length">
      <template
        v-for="(project, index) in projects"
        :key="index"
        v-slot:[`slot${index+1}`]
      >
        <div class="card experience-card">
          <!-- Nom du projet -->
          <h3 class="h3" style="text-align: center;">{{ project.name }}</h3>

          <!-- Miniature du site (cliquable) -->
          <a
            :href="project.link"
            target="_blank"
            rel="noopener noreferrer"
            class="preview"
          >
            <iframe
              :src="project.link"
              class="iframe"
              loading="lazy"
              title="aperçu du projet"
            ></iframe>
          </a>

          <!-- Description & infos -->
          <div class="info">
            <p class="details">{{ project.description }}</p>
            <p class="details">
              <strong>{{ $t("projects.labels.stack") }} :</strong>
              {{ project.stack }}
            </p>
            <p class="details">
              <strong>{{ $t("projects.labels.year") }} :</strong>
              {{ project.year }}
            </p>
          </div>
        </div>
      </template>
    </PageLayout>
  </div>
</template>

<script setup>
import PageLayout from "../assets/PageLayout.vue"; // Ajuste le chemin si nécessaire

/* Liste de projets */
const projects = [
  {
    name: "Conception AI",
    year: "2025",
    description:
      "Application d’intelligence artificielle permettant la conception d’interfaces et d’agents interactifs via des modèles d’IA générative.",
    stack: "Vue.js, Python, FastAPI, Docker",
    link: "https://conception-ai.vercel.app/"
  },
  {
    name: "Portfolio personnel",
    year: "2025",
    description:
      "Portfolio professionnel présentant mes projets, mes compétences et mon parcours, déployé avec Render.",
    stack: "Vue.js, Node.js, Docker, Render",
    link: "https://ben-elhadj-hamdi-portfolio.onrender.com/"
  }
];
</script>