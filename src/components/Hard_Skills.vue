<template>
  <div class="wrapper skills-page">
    <h2 class="title">{{ $t("skills.title") }}</h2>

    <PageLayout :columns="2" :rows="2" >
      <template
        v-for="(group, gIndex) in skillGroups"
        :key="gIndex"
        v-slot:[`slot${gIndex+1}`]
      >
        <div class="category">
          <h3 class="group-title">{{ $t(group.title) }}</h3>
          <div class="grid skills-grid" style="grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));">
            <div
              v-for="(skill, i) in group.skills"
              :key="i"
              class="card small-card"
              v-observe-visibility="(isVisible) => onVisible(isVisible, skill.key)"
              :class="{ visible: visibleSkills.includes(skill.key) }"
              @click="openPopup(skill)"
            >
              <picture>
                <source :srcset="getAssetPath(`/logos/skills/${skill.logo.replace(/\.[a-zA-Z]+$/, '.webp')}`)" type="image/webp" />
                <img :src="getAssetPath(`/logos/skills/${skill.logo}`)" :alt="$t(`skills.items.${skill.key}.name`)" class="logo" loading="lazy" />
              </picture>
              <div class="info">
                <div class="name">{{ $t(`skills.items.${skill.key}.name`) }}</div>
                <div class="bar">
                  <div class="fill" :style="{ width: levels[$t(`skills.items.${skill.key}.level`)] + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </PageLayout>

    <!-- Popup -->
    <Popup
      v-if="selectedSkill"
      :visible="true"
      :title="$t(`skills.items.${selectedSkill.key}.name`)"
      @close="closePopup"
    >
      <p><strong>{{ $t("skills.labels.level") }} :</strong> {{ $t(`skills.items.${selectedSkill.key}.level`) }}</p>
      <p><strong>{{ $t("skills.labels.details") }} :</strong> {{ $t(`skills.items.${selectedSkill.key}.info`) }}</p>
      <p v-if="selectedSkill.years">
        <strong>{{ $t("skills.labels.years") }} :</strong>
        {{ selectedSkill.years }} {{ $t("skills.labels.yearsUnit") }}
      </p>
      <a
        v-if="selectedSkill.link"
        :href="selectedSkill.link"
        target="_blank"
        class="popup-link"
      >🔗 {{ $t("skills.labels.link") }}</a>
    </Popup>
  </div>
</template>

<script setup>
import { ref } from "vue";
import PageLayout from "../assets/PageLayout.vue";
import Popup from "./Popup.vue";
import { getAssetPath } from "../utils/assets.js";

/* Animation visibilité */
const visibleSkills = ref([]);
function onVisible(isVisible, skillKey) {
  if (isVisible && !visibleSkills.value.includes(skillKey)) {
    visibleSkills.value.push(skillKey);
  }
}

/* Popup */
const selectedSkill = ref(null);
function openPopup(skill) { selectedSkill.value = skill; }
function closePopup() { selectedSkill.value = null; }

/* Barres de progression */
const levels = {
  "Maîtrise": 100, "Avancé": 75, "Intermédiaire": 50,
  "Mastery": 100, "Advanced": 75, "Intermediate": 50,
  "إتقان": 100, "متقدم": 75, "متوسط": 50
};

/* Données brutes (logos, liens, années seulement) */
const skillGroups = [
  {
    title: "skills.groups.frontend",
      skills: [
      { key: "vue", logo: "vue.webp", years: 3 },
      { key: "quasar", logo: "quasar.webp", years: 1 },
      { key: "vuetify", logo: "veutify.webp", years: 1 },
      { key: "vite", logo: "vite.webp", years: 2 },
      { key: "html", logo: "html5.webp", years: 5 },
      { key: "svelte", logo: "svelte.webp", years: 1 },
      { key: "css", logo: "css3.webp", years: 5 },
      { key: "javascript", logo: "javascript.webp", years: 6 },
      { key: "react", logo: "react.webp", years: 3 },
      { key: "flutter", logo: "flutter.webp", years: 1 },
    ]
  },
  {
    title: "skills.groups.backend",
    skills: [
      { key: "php", logo: "php.webp" },
      { key: "node", logo: "nodejs.webp", years: 2 },
      { key: "python", logo: "python.webp", years: 3 },
      { key: "java", logo: "java.webp", years: 2 },
      { key: "dart", logo: "dart.webp", years: 1 },
      { key: "firebase", logo: "firebase.webp", years: 1 },
      { key: "arangodb", logo: "arangodb.webp", years: 1 },
      { key: "mysql", logo: "mysql.webp", years: 4 },
      { key: "mongodb", logo: "mongodb.webp", years: 2 }
    ]
  },
  {
    title: "skills.groups.devops",
    skills: [
      { key: "git", logo: "git.webp", years: 6 },
      { key: "github", logo: "git-hub.webp", years: 6 },
      { key: "gitlab", logo: "git-lab.webp", years: 3 },
      { key: "docker", logo: "docker.webp", years: 2 },
      { key: "postman", logo: "postman.webp", years: 3 },
      { key: "ad", logo: "ad.webp", years: 2 },
      { key: "powershell", logo: "powershell.webp", years: 3 },
      { key: "cisco", logo: "cisco.webp", years: 2 },
      { key: "bash", logo: "bash.webp", years: 2 },
      { key: "argocd", logo: "argo-cd.webp", years: 1 },
      { key: "jenkins", logo: "jenkins.webp", years: 1 },
    ]
  },
  {
    title: "skills.groups.tools",
    skills: [
      { key: "androidstudio", logo: "android-studio.webp", years: 2 },
      { key: "c", logo: "c.webp", years: 2 },
      { key: "cpp", logo: "cpp.webp", years: 2 },
      { key: "csharp", logo: "sharp.webp", years: 2 },
      { key: "vscode", logo: "visual-studio.webp", years: 6 },
      { key: "visualstudio", logo: "vscode.webp", years: 6 },
      { key: "intellij", logo: "intellij.webp", years: 2 },
      { key: "photoshop", logo: "photoshop.webp", years: 3 },
      { key: "illustrator", logo: "illustrator.webp", years: 2 },
      { key: "qt", logo: "qt.webp", years: 1 },
      { key: "blender", logo: "blender.webp", years: 1 },
      { key: "unreal", logo: "unreal.webp", years: 1 },
      { key: "ios", logo: "ios.webp", years: 2 },
      { key: "android", logo: "android.webp", years: 3 },
      { key: "macos", logo: "macos.webp", years: 2 },
      { key: "windows", logo: "windows.webp", years: 6 },
      { key: "linux", logo: "linux.webp", years: 3 },
      { key: "virtualbox", logo: "virtualbox.webp", years: 2 }
    ]
  }
];
</script>
