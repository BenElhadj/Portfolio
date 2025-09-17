<template>
  <div class="experiences-wrap">
    <h2 class="title">{{ $t("experiences") }}</h2>

    <PageLayout :columns="1" :rows="2">
      <template #slot1>
        <!-- Développement -->
        <div class="category">
          <div class="category-header">
            <h3>Développement</h3>
            <span class="years">{{ devYears }} ans d'expérience</span>
          </div>
          <div class="grid">
            <div v-for="(exp, i) in devExperiences" :key="i" class="card experience-card">
              <div class="dates">{{ exp.dates }}</div>
              <div class="company">{{ exp.company }}</div>
              <div class="role">{{ exp.role }}</div>
              <ul class="details">
                <li v-for="(d, j) in exp.details" :key="j">{{ d }}</li>
              </ul>
            </div>
          </div>
        </div>
      </template>

      <template #slot2>
        <!-- Technicien -->
        <div class="category">
          <div class="category-header">
            <h3>Technicien & Maintenance Informatique</h3>
            <span class="years">{{ techYears }} ans d'expérience</span>
          </div>
          <div class="grid">
            <div v-for="(exp, i) in techExperiences" :key="i" class="card experience-card">
              <div class="dates">{{ exp.dates }}</div>
              <div class="company">{{ exp.company }}</div>
              <div class="role">{{ exp.role }}</div>
              <ul class="details">
                <li v-for="(d, j) in exp.details" :key="j">{{ d }}</li>
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

const devYears = 4;
const techYears = 8;
</script>
