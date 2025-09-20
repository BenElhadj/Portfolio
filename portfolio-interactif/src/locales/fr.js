// fr.js
export default {
  navbar: {
    timeline: "Frise Chronologique",
    diplomas: "Diplômes",
    experiences: "Expériences",
    skills: "Compétences Techniques",
    softSkills: "Compétences Comportementales",
    projects: "Projets",
    links: "Liens Utiles",
  },
  diplomas: {
    title: "Diplômes",
    list: [
      {
        period: "2016 - 2023",
        institution: "Ecole 42 — Paris",
        degree: "Ingénieur Expert en architecture des BDD et data"
      },
      {
        period: "2017 - 2019",
        institution: "GRETA — Paris",
        degree: "BTS Systèmes Numériques, informatique et réseau"
      },
      {
        period: "2011 - 2013",
        institution: "CSFIEE — Tunis",
        degree: "BTS en Production électronique"
      },
      {
        period: "2006 - 2008",
        institution: "CSFIEE — Tunis",
        degree: "BAC Pro en fabrication électronique"
      },
      {
        period: "2003 - 2005",
        institution: "IPH — Tunis",
        degree: "BAC Pro en maintenance informatique"
      }
    ]
  },
  experiences: {
    title: "Expériences",
    yearsLabel: "ans d'expérience",
    list: [
      {
        title: "Développement",
        years: 4,
        experiences: [
          {
            dates: "2024 – Aujourd'hui",
            company: "Indépendant",
            role: "Développeur IA/LM",
            details: [
              "Projets IA : classification d'images/données, détection d'anomalies",
              "Réseaux de neurones, NLP, apprentissage supervisé et non supervisé",
              "Techs : Python, NumPy, Pandas, Scikit-learn, TensorFlow, OpenCV"
            ]
          },
          {
            dates: "2022 – 2023",
            company: "KEAKR",
            role: "Développeur Full Stack",
            details: [
              "Maintenance et amélioration d'une app & site web (Vue.js, C#)",
              "Mise en place CI/CD avec Jenkins",
              "Participation à une plateforme Web3 (NFTs)"
            ]
          },
          {
            dates: "2019 – 2020",
            company: "Institut du Cerveau et de la Moelle Épinière (ICM)",
            role: "Développeur mobile",
            details: [
              "Conception et développement de l'application CONNECT (patients AVC)",
              "Collaboration avec CHU Brest, Pitié-Salpêtrière et école 42"
            ]
          },
          {
            dates: "2019",
            company: "Multiserv Plus",
            role: "Stagiaire Développeur Web",
            details: [
              "Création d'un site e-commerce de films",
              "Travail sur la base de données et l'interface utilisateur"
            ]
          }
        ]
      },
      {
        title: "Technicien & Maintenance Informatique",
        years: 8,
        experiences: [
          {
            dates: "2020 – 2021",
            company: "AP-HP (Hôpital Charles-Foix)",
            role: "Technicien de proximité",
            details: ["Gestion de parc informatique", "Maintenance système et réseau"]
          },
          {
            dates: "2018 – 2020",
            company: "DIM, LVMH, CHANEL",
            role: "Technicien VIP / Logisticien (missions HELPLINE)",
            details: [
              "Support VIP",
              "Masterisation postes, smartphones",
              "Gestion parc IT"
            ]
          },
          {
            dates: "2017 – 2018",
            company: "Parkeon",
            role: "Technicien itinérant",
            details: [
              "Maintenance bornes billettiques",
              "Réseaux, électronique, mécanique"
            ]
          },
          {
            dates: "2016",
            company: "Solutions30, Fnac",
            role: "Technicien de maintenance",
            details: [
              "Maintenance hardware & software",
              "Support SAV itinérant"
            ]
          },
          {
            dates: "2010 – 2014",
            company: "Global Info (Tunis)",
            role: "Gérant & technicien",
            details: [
              "Montage et réparation ordinateurs",
              "Vente & SAV informatique",
              "Installation imprimantes, scanners, photocopieurs"
            ]
          },
          {
            dates: "2007 – 2013",
            company: "Stages divers (STIE, TRANSTU, Retronix, Sagemcom, Microlux, Tekne)",
            role: "Technicien / Maintenance électronique",
            details: [
              "Assemblage & réparation ordinateurs",
              "Maintenance industrielle & électronique",
              "Production électronique et câblage"
            ]
          }
        ]
      }
    ]
  },
  skills: {
    title: "Compétences Techniques",
    labels: {
      level: "Niveau",
      details: "Détails",
      years: "Expérience",
      yearsUnit: "ans",
      link: "Voir le projet",
    },
    groups: {
      frontend: "Front-End",
      backend: "Back-End",
      devops: "DevOps",
      tools: "Autres Outils",
    },
    items: {
      vue: { name: "Vue.js", level: "Maîtrise", info: "Utilisé dans mon portfolio interactif et plusieurs projets web." },
      html: { name: "HTML5", level: "Maîtrise", info: "Fondement de tous mes projets web." },
      svelte: { name: "Svelte", level: "Intermédiaire", info: "Utilisé dans des projets expérimentaux." },
      css: { name: "CSS3", level: "Maîtrise", info: "Responsive design et animations." },
      javascript: { name: "JavaScript", level: "Maîtrise", info: "Langage central de mon parcours." },
      reactnative: { name: "React Native", level: "Avancé", info: "Développement mobile pour apps médicales et musicales." },
      php: { name: "PHP", level: "Maîtrise", info: "Utilisé pour un site e-commerce." },
      node: { name: "Node.js", level: "Avancé", info: "Employé dans des projets Full-Stack et API REST." },
      python: { name: "Python", level: "Avancé", info: "Utilisé pour IA et data science." },
      java: { name: "Java", level: "Intermédiaire", info: "Expérience académique et projets Android." },
      arangodb: { name: "ArangoDB", level: "Maîtrise", info: "Base NoSQL pour projets complexes." },
      mysql: { name: "MySQL", level: "Avancé", info: "Utilisé dans plusieurs projets web et école." },
      mongodb: { name: "MongoDB", level: "Avancé", info: "Employé dans plusieurs projets Full-Stack." },
      git: { name: "Git", level: "Maîtrise", info: "Utilisé quotidiennement (GitHub, GitLab)." },
      docker: { name: "Docker", level: "Avancé", info: "Mise en place d’environnements de dev." },
      jenkins: { name: "Jenkins", level: "Intermédiaire", info: "Utilisé en CI/CD." },
      ad: { name: "Active Directory", level: "Maîtrise", info: "Gestion utilisateurs et serveurs." },
      powershell: { name: "PowerShell", level: "Avancé", info: "Scripts d’automatisation IT." },
      cisco: { name: "VOIP / Cisco", level: "Avancé", info: "Administration réseaux et téléphonie." },
      bash: { name: "Bash", level: "Avancé", info: "Utilisé dans projets Linux." },
      c: { name: "C", level: "Maîtrise", info: "Langage appris à 42 pour bas niveau." },
      cpp: { name: "C++", level: "Maîtrise", info: "Expérience académique et projets persos." },
      csharp: { name: "C#", level: "Maîtrise", info: "Projets desktop et tests." },
      vscode: { name: "VS Code", level: "Maîtrise", info: "IDE principal." },
      visualstudio: { name: "Visual Studio", level: "Maîtrise", info: "IDE pour projets desktop." },
      intellij: { name: "IntelliJ", level: "Avancé", info: "Employé pour projets Java." },
      photoshop: { name: "Photoshop", level: "Intermédiaire", info: "Montages graphiques." },
      illustrator: { name: "Illustrator", level: "Intermédiaire", info: "Création de visuels." },
      qt: { name: "Qt Creator", level: "Intermédiaire", info: "Projets académiques." },
      blender: { name: "Blender", level: "Intermédiaire", info: "Projets 3D personnels." },
      unreal: { name: "Unreal Engine", level: "Intermédiaire", info: "Exploré pour prototypage." },
      ios: { name: "iOS", level: "Avancé", info: "Développement mobile." },
      android: { name: "Android", level: "Avancé", info: "Développement mobile." },
      macos: { name: "MacOS", level: "Avancé", info: "Utilisation quotidienne." },
      windows: { name: "Windows", level: "Maîtrise", info: "OS principal pour maintenance IT." },
      linux: { name: "Linux", level: "Avancé", info: "Utilisé pour serveurs et dev." },
      virtualbox: { name: "VirtualBox", level: "Avancé", info: "Tests systèmes et environnements virtuels." },
    },
  },
  softSkills: {
    title: "Competences Comportementales",
  },
  projects: {
    title: "projets",
  },
  links: {
    title: "Liens Utiles",
  },
};

