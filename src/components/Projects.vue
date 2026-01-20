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
                  <!-- only embed preview in iframe for safe/frontend URLs; avoid embedding backends (onrender.com) -->
                  <iframe
                    v-if="allowEmbed(project.link)"
                    :src="project.link"
                    :title="$t('projects.labels.visit') + ' - ' + project.name"
                    loading="lazy"
                    class="project-iframe"
                    allow="autoplay; encrypted-media"
                    referrerpolicy="no-referrer"
                  ></iframe>
                  <div v-else class="iframe-fallback">
                    <!-- simple fallback preview when embedding is disabled -->
                    <div class="no-embed">{{ $t('projects.labels.visit') }}</div>
                  </div>
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

// decide whether a project link should be embedded in an iframe
function allowEmbed(link) {
  try {
    const u = new URL(link);
    // avoid embedding known backend hosts (Render backends, etc.)
    if (u.hostname.includes('onrender.com') || u.hostname.includes('render.com')) return false;
    // embed common static hosts (github pages) and same-origin
    if (u.hostname.includes('github.io') || u.hostname === window.location.hostname) return true;
    // default: allow embedding (many hosts can be embedded) — adjust if needed
    return true;
  } catch (e) {
    return false;
  }
}
</script>
