<template>
  <div class="skills-wrap">
    <h2 class="title">{{ $t("skills") }}</h2>


    <!-- Layout -->
    <PageLayout :columns="2" :rows="2">
      <!-- Groupe -->
      <template v-for="(group, gIndex) in skillGroups" :key="gIndex" v-slot:[`slot${gIndex+1}`]>
        <div class="group">
          <h3 class="group-title">{{ group.title }}</h3>
          <div class="skills-scroll">
            <div
              v-for="(skill, i) in group.skills"
              :key="i"
              class="card"
              v-observe-visibility="(isVisible) => onVisible(isVisible, skill.name)"
              :class="{ visible: visibleSkills.includes(skill.name) }"
              @click="openPopup(skill)"
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

    <!-- Popup placé hors du layout -->
    <Popup
      v-if="selectedSkill"
      :visible="true"
      :title="selectedSkill.name"
      @close="closePopup"
    >
      <p><strong>Niveau :</strong> {{ selectedSkill.level }}</p>
      <p><strong>Détails :</strong> {{ selectedSkill.info }}</p>
      <p v-if="selectedSkill.years"><strong>Expérience :</strong> {{ selectedSkill.years }} ans</p>
      <a
        v-if="selectedSkill.link"
        :href="selectedSkill.link"
        target="_blank"
        class="popup-link"
      >🔗 Voir le projet</a>
    </Popup>
  </div>
</template>

<script setup>
import { ref } from "vue";
import PageLayout from "../assets/PageLayout.vue";
import Popup from "./Popup.vue";

const visibleSkills = ref([]);
function onVisible(isVisible, skillName) {
  if (isVisible && !visibleSkills.value.includes(skillName)) {
    visibleSkills.value.push(skillName);
  }
}

const selectedSkill = ref(null);
function openPopup(skill) {
  selectedSkill.value = skill;
}
function closePopup() {
  selectedSkill.value = null;
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
      { name: "Vue.js", logo: "vue.svg", level: "Maîtrise", info: "Utilisé dans mon portfolio interactif et plusieurs projets web.", years: 3, link: "https://github.com/BenElhadj" },
      { name: "HTML5", logo: "html5.svg", level: "Maîtrise", info: "Fondement de tous mes projets web (Multiserv Plus, Global Info).", years: 5 },
      { name: "Svelte", logo: "svelte.svg", level: "Intermédiaire", info: "Utilisé dans des projets expérimentaux (simulateur de code).", years: 1 },
      { name: "CSS3", logo: "css3.svg", level: "Maîtrise", info: "Responsive design et animations.", years: 5 },
      { name: "JavaScript", logo: "javascript.svg", level: "Maîtrise", info: "Langage central de mon parcours (Full-Stack, ICM, KEAKR).", years: 6, link: "https://keakr.com" },
      { name: "React Native", logo: "react.svg", level: "Avancé", info: "Développement mobile (ICM – app médicale, KEAKR – app musicale).", years: 3 }
    ]
  },
  {
    title: "Back-End",
    skills: [
      { name: "PHP", logo: "php.svg", level: "Maîtrise", info: "Utilisé pour le site e-commerce Multiserv Plus. 4 ans d’expérience." },
      { name: "Node.js", logo: "nodejs.svg", level: "Avancé", info: "Employé dans des projets Full-Stack et API REST (ICM, 42). 2 ans d’expérience." },
      { name: "Python", logo: "python.svg", level: "Avancé", info: "Utilisé pour IA et data science (42, ICM). 3 ans d’expérience." },
      { name: "Java", logo: "java.svg", level: "Intermédiaire", info: "Expérience académique et projets Android. 2 ans." },
      { name: "ArangoDB", logo: "arangodb.svg", level: "Maîtrise", info: "Utilisé comme base NoSQL pour projets complexes. 1 an." },
      { name: "MySQL", logo: "mysql.svg", level: "Avancé", info: "Utilisé sur Multiserv Plus, Global Info et projets d’école. 4 ans d’expérience." },
      { name: "MongoDB", logo: "mongodb.svg", level: "Avancé", info: "Employé dans plusieurs projets Full-Stack (42, ICM). 2 ans." }
    ]
  },
  {
    title: "DevOps",
    skills: [
      { name: "Git", logo: "git.svg", level: "Maîtrise", info: "Utilisé quotidiennement (GitHub, GitLab). 6 ans d’expérience." },
      { name: "Docker", logo: "docker.svg", level: "Avancé", info: "Mise en place d’environnements de dev (42, projets multi-services). 2 ans." },
      { name: "Jenkins", logo: "jenkins.svg", level: "Intermédiaire", info: "Découvert en CI/CD, utilisé sur des projets de formation. 1 an." },
      { name: "Active Directory", logo: "ad.svg", level: "Maîtrise", info: "Gestion utilisateurs/serveurs (DIM, Dior, Chanel). 2 ans en maintenance IT." },
      { name: "PowerShell", logo: "powershell.svg", level: "Avancé", info: "Scripts d’automatisation pour la maintenance IT. 3 ans." },
      { name: "VOIP / Cisco", logo: "cisco.svg", level: "Avancé", info: "Administration réseaux et téléphonie. Expérience chez Dior et DIM. 2 ans." },
      { name: "Bash", logo: "bash.svg", level: "Avancé", info: "Utilisé dans projets Linux (42, devops). 2 ans." }
    ]
  },
  {
    title: "Autres Outils",
    skills: [
      { name: "C", logo: "c.svg", level: "Maîtrise", info: "Langage appris à 42 (42cursus, projets systèmes bas niveau). 2 ans." },
      { name: "C++", logo: "cpp.svg", level: "Maîtrise", info: "Expérience académique et projets persos. 2 ans." },
      { name: "C#", logo: "sharp.svg", level: "Maîtrise", info: "Utilisé dans projets desktop et tests. 2 ans." },
      { name: "VS Code", logo: "vscode.svg", level: "Maîtrise", info: "IDE principal pour tous mes projets. 6 ans d’expérience." },
      { name: "IntelliJ", logo: "intellij.svg", level: "Avancé", info: "Employé pour projets Java. 2 ans." },
      { name: "Photoshop", logo: "photoshop.svg", level: "Intermédiaire", info: "Montages graphiques pour Global Info. 3 ans." },
      { name: "Adobe Illustrator", logo: "illustrator.svg", level: "Intermédiaire", info: "Création de visuels. 2 ans." },
      { name: "Qt Creator", logo: "qt.svg", level: "Intermédiaire", info: "Projets académiques. 1 an." },
      { name: "Blender", logo: "blender.svg", level: "Intermédiaire", info: "Projets 3D personnels. 1 an." },
      { name: "Unreal Engine", logo: "unreal.svg", level: "Intermédiaire", info: "Exploré pour prototypage. 1 an." },
      { name: "iOS", logo: "ios.svg", level: "Avancé", info: "Développement mobile (ICM, KEAKR). 2 ans." },
      { name: "Android", logo: "android.svg", level: "Avancé", info: "Développement mobile (ICM, KEAKR). 3 ans." },
      { name: "MacOS", logo: "macos.svg", level: "Avancé", info: "Utilisation quotidienne à 42. 2 ans." },
      { name: "Windows", logo: "windows.svg", level: "Maîtrise", info: "OS principal pour maintenance IT (DIM, Dior). 6 ans." },
      { name: "Linux", logo: "linux.svg", level: "Avancé", info: "Utilisé pour serveurs et développement (42). 3 ans." },
      { name: "VirtualBox", logo: "virtualbox.svg", level: "Avancé", info: "Utilisé pour tests systèmes et environnements virtuels. 2 ans." }
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
  padding: 25px;
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
  transition: all 0.4s ease;
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
