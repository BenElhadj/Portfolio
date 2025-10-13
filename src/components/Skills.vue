<template>
  <div class="wrapper">
    <h2 class="title">{{ $t("skills.title") }}</h2>

    <PageLayout :columns="2" :rows="2" >
      <template
        v-for="(group, gIndex) in skillGroups"
        :key="gIndex"
        v-slot:[`slot${gIndex+1}`]
      >
        <div class="category">
          <h3 class="group-title">{{ $t(group.title) }}</h3>
          <div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));">
            <div
              v-for="(skill, i) in group.skills"
              :key="i"
              class="card small-card"
              v-observe-visibility="(isVisible) => onVisible(isVisible, skill.key)"
              :class="{ visible: visibleSkills.includes(skill.key) }"
              @click="openPopup(skill)"
            >
              <img :src="`/logos/skills/${skill.logo}`" :alt="$t(`skills.items.${skill.key}.name`)" class="logo" />
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
      { key: "vue", logo: "vue.svg", years: 3 },
      { key: "quasar", logo: "quasar.svg", years: 1 },
      { key: "vuetify", logo: "veutify.svg", years: 1 },
      { key: "vite", logo: "vite.svg", years: 2 },
      { key: "html", logo: "html5.svg", years: 5 },
      { key: "svelte", logo: "svelte.svg", years: 1 },
      { key: "css", logo: "css3.svg", years: 5 },
      { key: "javascript", logo: "javascript.svg", years: 6 },
      { key: "reactnative", logo: "react.svg", years: 3 },
      { key: "flutter", logo: "flutter.svg", years: 1 },
    ]
  },
  {
    title: "skills.groups.backend",
    skills: [
      { key: "php", logo: "php.svg" },
      { key: "node", logo: "nodejs.svg", years: 2 },
      { key: "python", logo: "python.svg", years: 3 },
      { key: "java", logo: "java.svg", years: 2 },
      { key: "dart", logo: "dart.svg", years: 1 },
      { key: "firebase", logo: "firebase.svg", years: 1 },
      { key: "arangodb", logo: "arangodb.svg", years: 1 },
      { key: "mysql", logo: "mysql.svg", years: 4 },
      { key: "mongodb", logo: "mongodb.svg", years: 2 }
    ]
  },
  {
    title: "skills.groups.devops",
    skills: [
      { key: "git", logo: "git.svg", years: 6 },
      { key: "github", logo: "git-hub.svg", years: 6 },
      { key: "gitlab", logo: "git-lab.svg", years: 3 },
      { key: "docker", logo: "docker.svg", years: 2 },
      { key: "postman", logo: "postman.svg", years: 3 },
      { key: "ad", logo: "ad.svg", years: 2 },
      { key: "powershell", logo: "powershell.svg", years: 3 },
      { key: "cisco", logo: "cisco.svg", years: 2 },
      { key: "bash", logo: "bash.svg", years: 2 },
      { key: "argocd", logo: "argo-cd.svg", years: 1 },
      { key: "jenkins", logo: "jenkins.svg", years: 1 },
    ]
  },
  {
    title: "skills.groups.tools",
    skills: [
      { key: "androidstudio", logo: "android-studio.svg", years: 2 },
      { key: "c", logo: "c.svg", years: 2 },
      { key: "cpp", logo: "cpp.svg", years: 2 },
      { key: "csharp", logo: "sharp.svg", years: 2 },
      { key: "vscode", logo: "visual-studio.svg", years: 6 },
      { key: "visualstudio", logo: "vscode.svg", years: 6 },
      { key: "intellij", logo: "intellij.svg", years: 2 },
      { key: "photoshop", logo: "photoshop.svg", years: 3 },
      { key: "illustrator", logo: "illustrator.svg", years: 2 },
      { key: "qt", logo: "qt.svg", years: 1 },
      { key: "blender", logo: "blender.svg", years: 1 },
      { key: "unreal", logo: "unreal.svg", years: 1 },
      { key: "ios", logo: "ios.svg", years: 2 },
      { key: "android", logo: "android.svg", years: 3 },
      { key: "macos", logo: "macos.svg", years: 2 },
      { key: "windows", logo: "windows.svg", years: 6 },
      { key: "linux", logo: "linux.svg", years: 3 },
      { key: "virtualbox", logo: "virtualbox.svg", years: 2 }
    ]
  }
];
</script>
