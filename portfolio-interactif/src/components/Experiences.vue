<template>
    <div class="experiences-wrap">
      <h2 class="title">Expériences Professionnelles</h2>
  
      <!-- Développement -->
      <div class="category">
        <div class="category-header">
          <h3>Développement</h3>
          <span class="years">{{ devYears }} ans d'expérience</span>
        </div>
        <div class="grid">
          <div v-for="(exp, i) in devExperiences" :key="i" class="card">
            <div class="dates">{{ exp.dates }}</div>
            <div class="company">{{ exp.company }}</div>
            <div class="role">{{ exp.role }}</div>
            <ul class="details">
              <li v-for="(d, j) in exp.details" :key="j">{{ d }}</li>
            </ul>
          </div>
        </div>
      </div>
  
      <!-- Technicien -->
      <div class="category">
        <div class="category-header">
          <h3>Technicien & Maintenance Informatique</h3>
          <span class="years">{{ techYears }} ans d'expérience</span>
        </div>
        <div class="grid">
          <div v-for="(exp, i) in techExperiences" :key="i" class="card">
            <div class="dates">{{ exp.dates }}</div>
            <div class="company">{{ exp.company }}</div>
            <div class="role">{{ exp.role }}</div>
            <ul class="details">
              <li v-for="(d, j) in exp.details" :key="j">{{ d }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  const devExperiences = [
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
  ];
  
  const techExperiences = [
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
      details: ["Support VIP", "Masterisation postes, smartphones", "Gestion parc IT"]
    },
    {
      dates: "2017 – 2018",
      company: "Parkeon",
      role: "Technicien itinérant",
      details: ["Maintenance bornes billettiques", "Réseaux, électronique, mécanique"]
    },
    {
      dates: "2016",
      company: "Solutions30, Fnac",
      role: "Technicien de maintenance",
      details: ["Maintenance hardware & software", "Support SAV itinérant"]
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
  ];
  
  // Approx total durations (arrondies)
  const devYears = 4;  // Dév (2019–2024+)
  const techYears = 8; // Technicien (2007–2014 + missions ponctuelles)
  </script>
  
  <style scoped>
  .experiences-wrap {
    width: 100%;
    padding: 40px 24px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .title {
    font-size: 2.2rem;
    margin-bottom: 32px;
    text-align: center;
    color: #0b6fb8;
  }
  
  .category {
    margin-bottom: 56px;
  }
  
  .category-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 20px;
  }
  
  .category-header h3 {
    font-size: 1.5rem;
    color: #1f2937;
  }
  
  .category-header .years {
    font-size: 1rem;
    color: #555;
  }
  
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 18px;
  }
  
  .card {
    background: #fff;
    border-radius: 12px;
    padding: 16px 18px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    border-left: 4px solid #0b6fb8;
    display: flex;
    flex-direction: column;
  }
  
  .dates {
    font-size: 0.9rem;
    font-weight: 600;
    color: #0b6fb8;
    margin-bottom: 4px;
  }
  
  .company {
    font-weight: 600;
    font-size: 1.05rem;
    margin-bottom: 2px;
    color: #111;
  }
  
  .role {
    font-size: 0.95rem;
    font-weight: 500;
    margin-bottom: 6px;
    color: #333;
  }
  
  .details {
    font-size: 0.85rem;
    color: #444;
    margin: 0;
    padding-left: 18px;
  }
  </style>
  