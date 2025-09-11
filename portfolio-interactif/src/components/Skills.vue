<template>
  <div class="skills-wrap">
    <h2 class="title">Compétences Techniques</h2>

    <div class="skills-grid">
      <div v-for="(group, gIndex) in skillGroups" :key="gIndex" class="group">
        <h3 class="group-title">{{ group.title }}</h3>
        <div class="skills-scroll">
          <div v-for="(skill, i) in group.skills" :key="i" class="card">
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
    </div>
  </div>
</template>

<script setup>
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
      { name: "C / C++ / C#", logo: "cplusplus.svg", level: "Maîtrise" },
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
  justify-content: flex-start; /* Changé : flex-start pour permettre overflow et scroll */
}

.title {
  font-size: 2.2rem;
  margin-bottom: 32px;
  text-align: center;
  color: #0b6fb8;
  flex-shrink: 0;
}

.skills-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 20px;
  width: 100%;
  flex: 1; /* Prend tout l'espace restant */
  min-height: 0; /* Permet au grid de shrink si besoin */
}

.group {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.group-title {
  font-size: 1.5rem;
  margin-bottom: 12px;
  color: #1f2937;
  text-align: center;
  flex-shrink: 0;
}

.skills-scroll {
  flex: 1;
  overflow-y: auto; /* Scroll restauré */
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
  padding-right: 10px;
}

.card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  background: #f9fafb;
}

.logo {
  width: 42px;
  height: 42px;
  object-fit: contain;
  flex-shrink: 0;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #111;
}

.bar {
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  height: 8px;
  margin: 6px 0;
}

.fill {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #60a5fa);
  border-radius: 6px;
}

.level {
  font-size: 0.8rem;
  color: #444;
}

/* Scrollbar stylisée */
.skills-scroll::-webkit-scrollbar {
  width: 8px;
}
.skills-scroll::-webkit-scrollbar-thumb {
  background: #0b6fb8;
  border-radius: 4px;
}
.skills-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
}

/* Responsive renforcé */
@media (max-width: 768px) {
  .skills-wrap {
    padding: 20px 12px;
    justify-content: flex-start;
  }

  .title {
    font-size: 1.8rem;
    margin-bottom: 24px;
  }

  .skills-grid {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 1fr);
    gap: 12px;
  }

  .group {
    padding: 16px;
  }

  .group-title {
    font-size: 1.3rem;
  }

  .skills-scroll {
    grid-template-columns: 1fr; /* Une colonne sur mobile */
    gap: 8px;
  }

  .card {
    padding: 10px 12px;
  }

  .logo {
    width: 36px;
    height: 36px;
  }

  .name {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .skills-wrap {
    padding: 16px 8px;
  }

  .title {
    font-size: 1.6rem;
  }

  .skills-scroll {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>