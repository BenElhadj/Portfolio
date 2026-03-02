export default {
  title: "Projets",
  webApps: "Applications web déployées",
  countLabel: "projets",
  labels: {
    description: "Description",
    stack: "Technologies",
    visit: "Visiter le site",
    year: "Année",
  },
  list: [
    {
      name: "Conception AI",
      year: "2025",
  description: "Agent IA qui utilise l'API OpenAI pour générer du code Svelte propre à partir de demandes en langage humain, avec éditeur de code, aperçu en direct, fonctionnalité de téléchargement et gestion de l'historique.",
  stack: "Svelte, CSS, JavaScript, API OpenAI",
      link: "https://benelhadj.github.io/Conception-AI/"
    },
    {
      name: "QR Code Creator",
      year: "2025",
      description: "Générateur de QR codes 100% statique et personnalisable (logo, couleurs, tailles, marge), export PNG/JPEG/SVG, déployé automatiquement via GitHub Pages.",
      stack: "HTML, CSS, JavaScript, GitHub Pages",
      link: "https://benelhadj.github.io/QR-code_creator/"
    },
    {
      name: "Learn2Slither",
      year: "2025",
      description: "Jeu d'apprentissage par renforcement où un agent IA apprend à naviguer dans un environnement en utilisant l'algorithme Q-Learning tabulaire. L'agent découvre son environnement case par case avec un système de bonus/malus, reçoit des réponses positives/négatives, et peut sauvegarder ses paramètres d'entraînement en JSON pour les réutiliser en mode jeu.",
      stack: "Python, Q-Learning, Temporal Difference, JSON, Heuristics",
      link: "https://benelhadj.github.io/Learn2Slither/",
    },
    {
      name: "Matcha (Frontend)",
      year: "2025",
      description: "Application web de réseau social et de rencontre inspirée de Tinder, avec gestion des profils, matching et chat en temps réel.",
      stack: "Vue.js, Vite, Docker, GitHub Pages",
      link: "https://benelhadj.github.io/Matcha"
    },
    {
      name: "Matcha (Backend)",
      year: "2025",
      description: "API backend du projet Matcha, gérant l'authentification, la base de données, la logique métier et la communication avec le front-end.",
      stack: "Node.js, Express, PostgreSQL, Docker, Render",
      link: "https://matcha-backend-t6dr.onrender.com/"
    },
  ]
};