<template>
  <div class="wrapper">
    <h2 class="title">{{ $t("projects.title") }}</h2>

    <PageLayout :columns="1" :rows="1">
      <template v-slot:slot1>
        <div class="category">
          <div class="category-header">
            <h3>{{ $t("projects.webApps") }}</h3>
            <span class="years">{{ projects.length }} {{ $t("projects.countLabel") }}</span>
          </div>

          <!-- Grille des projets -->
          <div class="grid projects-grid">
            <div
              v-for="(project, index) in projects"
              :key="index"
              class="card line-card"
            >
              <!-- Nom du projet -->
              <div class="company">{{ project.name }}</div>

              <!-- Miniature (cliquable) -->
              <a
                :href="project.link"
                target="_blank"
                rel="noopener noreferrer nofollow"
                class="preview-link"
                :aria-label="$t('projects.labels.visit') + ' - ' + project.name"
              >
                <div class="iframe-container">
                  <iframe
                    :src="project.link"
                    :title="$t('projects.labels.visit') + ' - ' + project.name"
                    :name="'project-iframe-' + index"
                    :id="'project-frame-' + index"
                    sandbox="allow-scripts allow-same-origin"
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                    autocomplete="off"
                    class="project-iframe"
                  ></iframe>
                </div>
              </a>

              <!-- Détails -->
              <ul class="details">
                <li>{{ project.description }}</li>
                <li><strong>{{ $t("projects.labels.stack") }} :</strong> {{ project.stack }}</li>
                <li><strong>{{ $t("projects.labels.year") }} :</strong> {{ project.year }}</li>
              </ul>
            </div>
          </div>
        </div>
      </template>
    </PageLayout>
  </div>
</template>

<script setup>
import PageLayout from "../assets/PageLayout.vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { tm } = useI18n();

// Récupère les projets depuis les fichiers de traduction
const projects = computed(() => {
  const list = tm("projects.list");
  return Array.isArray(list) ? list : [];
});
</script>