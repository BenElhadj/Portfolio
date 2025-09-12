<template>
  <div class="skills-wrap">
    <h2 class="title">Compétences Techniques</h2>

    <!-- Découpe générale 2 colonnes x 2 lignes -->
    <PageLayout :columns="2" :rows="2">
      <!-- Groupe 1 -->
      <template #slot1>
        <div class="group">
          <h3 class="group-title">{{ skillGroups[0].title }}</h3>
          <div class="skills-scroll">
            <div
              v-for="(skill, i) in skillGroups[0].skills"
              :key="i"
              class="card"
              v-observe-visibility="(isVisible) => onVisible(isVisible, skill.name)"
              :class="{ visible: visibleSkills.includes(skill.name) }"
            >
              <img :src="`/logos/${skill.logo}`" :alt="skill.name" class="logo" />
              <div class="info">
                <div class="name">{{ skill.name }}</div>
                <div class="bar">
                  <div class="fill" :style="{ width: levels[skill.level] + '%' }"></div>
                </div>
                <div class="level">{{ skill.level }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Répétez pour les autres groupes -->
      <!-- Groupe 2 -->
      <template #slot2>
        <div class="group">
          <h3 class="group-title">{{ skillGroups[1].title }}</h3>
          <div class="skills-scroll">
            <div
              v-for="(skill, i) in skillGroups[1].skills"
              :key="i"
              class="card"
              v-observe-visibility="(isVisible) => onVisible(isVisible, skill.name)"
              :class="{ visible: visibleSkills.includes(skill.name) }"
            >
              <img :src="`/logos/${skill.logo}`" :alt="skill.name" class="logo" />
              <div class="info">
                <div class="name">{{ skill.name }}</div>
                <div class="bar">
                  <div class="fill" :style="{ width: levels[skill.level] + '%' }"></div>
                </div>
                <div class="level">{{ skill.level }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Groupe 3 -->
      <template #slot3>
        <div class="group">
          <h3 class="group-title">{{ skillGroups[2].title }}</h3>
          <div class="skills-scroll">
            <div
              v-for="(skill, i) in skillGroups[2].skills"
              :key="i"
              class="card"
              v-observe-visibility="(isVisible) => onVisible(isVisible, skill.name)"
              :class="{ visible: visibleSkills.includes(skill.name) }"
            >
              <img :src="`/logos/${skill.logo}`" :alt="skill.name" class="logo" />
              <div class="info">
                <div class="name">{{ skill.name }}</div>
                <div class="bar">
                  <div class="fill" :style="{ width: levels[skill.level] + '%' }"></div>
                </div>
                <div class="level">{{ skill.level }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Groupe 4 -->
      <template #slot4>
        <div class="group">
          <h3 class="group-title">{{ skillGroups[3].title }}</h3>
          <div class="skills-scroll">
            <div
              v-for="(skill, i) in skillGroups[3].skills"
              :key="i"
              class="card"
              v-observe-visibility="(isVisible) => onVisible(isVisible, skill.name)"
              :class="{ visible: visibleSkills.includes(skill.name) }"
            >
              <img :src="`/logos/${skill.logo}`" :alt="skill.name" class="logo" />
              <div class="info">
                <div class="name">{{ skill.name }}</div>
                <div class="bar">
                  <div class="fill" :style="{ width: levels[skill.level] + '%' }"></div>
                </div>
                <div class="level">{{ skill.level }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </PageLayout>
  </div>
</template>

<script setup>
import { ref } from "vue";
import PageLayout from "../assets/PageLayout.vue";

const visibleSkills = ref([]);
function onVisible(isVisible, skillName) {
  if (isVisible && !visibleSkills.value.includes(skillName)) {
    visibleSkills.value.push(skillName);
  }
}

const levels = {
  "Maîtrise": 100,
  "Avancé": 75,
  "Intermédiaire": 50
};

const skillGroups = [
  {
    title: "Front-End",
    skills: [
      { name: "Vue.js", logo: "vue.svg", level: "Maîtrise" },
      { name: "HTML5", logo: "html5.svg", level: "Maîtrise" },
      { name: "Svelte", logo: "svelte.svg", level: "Intermédiaire" },
      { name: "CSS3", logo: "css3.svg", level: "Maîtrise" },
      { name: "JavaScript", logo: "javascript.svg", level: "Maîtrise" },
      { name: "React Native", logo: "react.svg", level: "Avancé" }
    ]
  },
  {
    title: "Back-End",
    skills: [
      { name: "PHP", logo: "php.svg", level: "Maîtrise" },
      { name: "Node.js", logo: "nodejs.svg", level: "Avancé" },
      { name: "Python", logo: "python.svg", level: "Avancé" },
      { name: "Java", logo: "java.svg", level: "Intermédiaire" },
      { name: "ArangoDB", logo: "arangodb.svg", level: "Maîtrise" },
      { name: "MySQL", logo: "mysql.svg", level: "Avancé" },
      { name: "MongoDB", logo: "mongodb.svg", level: "Avancé" }
    ]
  },
  {
    title: "DevOps",
    skills: [
      { name: "Git", logo: "git.svg", level: "Maîtrise" },
      { name: "Docker", logo: "docker.svg", level: "Avancé" },
      { name: "CI/CD", logo: "cicd.svg", level: "Avancé" },
      { name: "Jenkins", logo: "jenkins.svg", level: "Intermédiaire" },
      { name: "Active Directory", logo: "active-directory.svg", level: "Maîtrise" },
      { name: "PowerShell", logo: "powershell.svg", level: "Avancé" },
      { name: "VOIP / Cisco", logo: "cisco.svg", level: "Avancé" },
      { name: "Cisco Packet Tracer", logo: "packettracer.svg", level: "Intermédiaire" },
      { name: "Bash", logo: "bash.svg", level: "Avancé" }
    ]
  },
  {
    title: "Autres Outils",
    skills: [
      { name: "C", logo: "c.svg", level: "Maîtrise" },
      { name: "C++", logo: "cplusplus.svg", level: "Maîtrise" },
      { name: "C#", logo: "sarp.svg", level: "Maîtrise" },
      { name: "VS Code", logo: "vscode.svg", level: "Maîtrise" },
      { name: "IntelliJ", logo: "intellij.svg", level: "Avancé" },
      { name: "Photoshop", logo: "photoshop.svg", level: "Intermédiaire" },
      { name: "Qt Creator", logo: "qt.svg", level: "Intermédiaire" },
      { name: "Blender", logo: "blender.svg", level: "Intermédiaire" },
      { name: "Unreal Engine", logo: "unreal.svg", level: "Intermédiaire" },
      { name: "iOS", logo: "ios.svg", level: "Avancé" },
      { name: "Android", logo: "android.svg", level: "Avancé" },
      { name: "Windows", logo: "windows.svg", level: "Maîtrise" },
      { name: "Linux", logo: "linux.svg", level: "Avancé" },
      { name: "Jupyter Notebook", logo: "jupyter.svg", level: "Avancé" }
    ]
  }
];
</script>

<style scoped>
.skills-wrap {
  width: 100%;
  height: 100%;
  padding: 40px 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 2.2rem;
  margin-bottom: 24px;
  text-align: center;
  color: #0b6fb8;
}

.group {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.group-title {
  font-size: 1.4rem;
  margin-bottom: 12px;
  color: #1f2937;
  text-align: center;
}

.skills-scroll {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  padding-right: 8px;
}

.card {
  display: flex;
  flex-direction: column; /* Changer l'orientation pour empiler les éléments */
  align-items: center; /* Centrer les éléments horizontalement */
  gap: 8px; /* Espacement entre les éléments */
  padding: 10px;
  border-radius: 8px;
  /* background: #f9fafb; */
  /* transform: translateY(20px); */
  /* transition: all 0.4s ease; */
}
.card.visible {
  transform: translateY(0);
}

.logo {
  width: 100px;
  height: 100px;
  /* object-fit: contain; */
  flex-shrink: 0;
}

.info {
  flex: 1;
  text-align: center; /* Centrer le texte */
}

.name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #111;
}

.bar {
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  height: 6px;
  margin: 4px 0;
}

.fill {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #60a5fa);
  border-radius: 6px;
}

.level {
  font-size: 0.75rem;
  color: #444;
}

/* Scrollbar */
.skills-scroll::-webkit-scrollbar {
  width: 6px;
}
.skills-scroll::-webkit-scrollbar-thumb {
  background: #0b6fb8;
  border-radius: 3px;
}
.skills-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
}
</style>
