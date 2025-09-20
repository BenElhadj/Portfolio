// en.js
export default {
  navbar: {
    timeline: "Timeline",
    diplomas: "Diplomas",
    experiences: "Experiences",
    skills: "Hard Skills",
    softSkills: "Soft Skills",
    projects: "Projects",
    links: "Useful Links",
  },
  diplomas: {
    title: "Diplomas",
    list: [
      {
        period: "2016 - 2023",
        institution: "42 School — Paris",
        degree: "Expert Engineer in Database Architecture and Data"
      },
      {
        period: "2017 - 2019",
        institution: "GRETA — Paris",
        degree: "BTS Digital Systems, Computer Science & Networking"
      },
      {
        period: "2011 - 2013",
        institution: "CSFIEE — Tunis",
        degree: "BTS in Electronic Production"
      },
      {
        period: "2006 - 2008",
        institution: "CSFIEE — Tunis",
        degree: "Professional Baccalaureate in Electronic Manufacturing"
      },
      {
        period: "2003 - 2005",
        institution: "IPH — Tunis",
        degree: "Professional Baccalaureate in IT Maintenance"
      }
    ]
  },
  experiences: {
    title: "Experiences",
    yearsLabel: "years of experience",
    list: [
      {
        title: "Development",
        years: 4,
        experiences: [
          {
            dates: "2024 – Present",
            company: "Freelance",
            role: "AI/ML Developer",
            details: [
              "AI projects: image/data classification, anomaly detection",
              "Neural networks, NLP, supervised & unsupervised learning",
              "Techs: Python, NumPy, Pandas, Scikit-learn, TensorFlow, OpenCV"
            ]
          },
          {
            dates: "2022 – 2023",
            company: "KEAKR",
            role: "Full Stack Developer",
            details: [
              "Maintenance and improvement of app & website (Vue.js, C#)",
              "Set up CI/CD with Jenkins",
              "Contributed to a Web3 platform (NFTs)"
            ]
          },
          {
            dates: "2019 – 2020",
            company: "Brain & Spine Institute (ICM)",
            role: "Mobile Developer",
            details: [
              "Designed and developed CONNECT app (stroke patients)",
              "Collaboration with CHU Brest, Pitié-Salpêtrière and 42 school"
            ]
          },
          {
            dates: "2019",
            company: "Multiserv Plus",
            role: "Intern Web Developer",
            details: [
              "Created an e-commerce website for movies",
              "Worked on database and UI"
            ]
          }
        ]
      },
      {
        title: "Technician & IT Maintenance",
        years: 8,
        experiences: [
          {
            dates: "2020 – 2021",
            company: "AP-HP (Charles-Foix Hospital)",
            role: "On-site Technician",
            details: ["IT asset management", "System & network maintenance"]
          },
          {
            dates: "2018 – 2020",
            company: "DIM, LVMH, CHANEL",
            role: "VIP Technician / Logistician (HELPLINE missions)",
            details: [
              "VIP support",
              "Computer & smartphone imaging",
              "IT asset management"
            ]
          },
          {
            dates: "2017 – 2018",
            company: "Parkeon",
            role: "Field Technician",
            details: [
              "Ticketing machine maintenance",
              "Networks, electronics, mechanics"
            ]
          },
          {
            dates: "2016",
            company: "Solutions30, Fnac",
            role: "Maintenance Technician",
            details: [
              "Hardware & software maintenance",
              "On-site customer support"
            ]
          },
          {
            dates: "2010 – 2014",
            company: "Global Info (Tunis)",
            role: "Manager & Technician",
            details: [
              "PC assembly and repair",
              "Sales & after-sales service",
              "Printer, scanner, photocopier setup"
            ]
          },
          {
            dates: "2007 – 2013",
            company: "Various internships (STIE, TRANSTU, Retronix, Sagemcom, Microlux, Tekne)",
            role: "Electronics Technician",
            details: [
              "PC assembly & repair",
              "Industrial & electronic maintenance",
              "Electronic production & wiring"
            ]
          }
        ]
      }
    ]
  },
  skills: {
    title: "Hard Skills",
    labels: {
      level: "Level",
      details: "Details",
      years: "Experience",
      yearsUnit: "years",
      link: "View the project",
    },
    groups: {
      frontend: "Front-End",
      backend: "Back-End",
      devops: "DevOps",
      tools: "Other Tools",
    },
    items: {
      vue: { name: "Vue.js", level: "Mastery", info: "Used in my interactive portfolio and multiple web projects." },
      html: { name: "HTML5", level: "Mastery", info: "Foundation of all my web projects." },
      svelte: { name: "Svelte", level: "Intermediate", info: "Used in experimental projects." },
      css: { name: "CSS3", level: "Mastery", info: "Responsive design and animations." },
      javascript: { name: "JavaScript", level: "Mastery", info: "Core language of my career." },
      reactnative: { name: "React Native", level: "Advanced", info: "Mobile development for medical and music apps." },
      php: { name: "PHP", level: "Mastery", info: "Used for an e-commerce website." },
      node: { name: "Node.js", level: "Advanced", info: "Used in Full-Stack projects and REST APIs." },
      python: { name: "Python", level: "Advanced", info: "Used for AI and data science." },
      java: { name: "Java", level: "Intermediate", info: "Academic experience and Android projects." },
      arangodb: { name: "ArangoDB", level: "Mastery", info: "NoSQL database for complex projects." },
      mysql: { name: "MySQL", level: "Advanced", info: "Used in multiple web and school projects." },
      mongodb: { name: "MongoDB", level: "Advanced", info: "Used in several Full-Stack projects." },
      git: { name: "Git", level: "Mastery", info: "Used daily (GitHub, GitLab)." },
      docker: { name: "Docker", level: "Advanced", info: "Set up development environments." },
      jenkins: { name: "Jenkins", level: "Intermediate", info: "Used in CI/CD." },
      ad: { name: "Active Directory", level: "Mastery", info: "User and server management." },
      powershell: { name: "PowerShell", level: "Advanced", info: "IT automation scripts." },
      cisco: { name: "VOIP / Cisco", level: "Advanced", info: "Network and telephony administration." },
      bash: { name: "Bash", level: "Advanced", info: "Used in Linux projects." },
      c: { name: "C", level: "Mastery", info: "Learned at 42 for low-level programming." },
      cpp: { name: "C++", level: "Mastery", info: "Academic and personal projects." },
      csharp: { name: "C#", level: "Mastery", info: "Desktop projects and testing." },
      vscode: { name: "VS Code", level: "Mastery", info: "Primary IDE." },
      visualstudio: { name: "Visual Studio", level: "Mastery", info: "IDE for desktop projects." },
      intellij: { name: "IntelliJ", level: "Advanced", info: "Used for Java projects." },
      photoshop: { name: "Photoshop", level: "Intermediate", info: "Graphic editing." },
      illustrator: { name: "Illustrator", level: "Intermediate", info: "Visual creation." },
      qt: { name: "Qt Creator", level: "Intermediate", info: "Academic projects." },
      blender: { name: "Blender", level: "Intermediate", info: "Personal 3D projects." },
      unreal: { name: "Unreal Engine", level: "Intermediate", info: "Explored for prototyping." },
      ios: { name: "iOS", level: "Advanced", info: "Mobile development." },
      android: { name: "Android", level: "Advanced", info: "Mobile development." },
      macos: { name: "MacOS", level: "Advanced", info: "Daily use." },
      windows: { name: "Windows", level: "Mastery", info: "Primary OS for IT maintenance." },
      linux: { name: "Linux", level: "Advanced", info: "Used for servers and development." },
      virtualbox: { name: "VirtualBox", level: "Advanced", info: "System testing and virtual environments." },
    },
  },
  softSkills: {
    title: "Soft Skills",
  },
  projects: {
    title: "Projects",
  },
  links: {
    title: "Useful Links",
  },
};
