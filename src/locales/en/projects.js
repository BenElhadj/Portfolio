export default {
  title: "Projects",
  webApps: "Deployed Web Apps",
  countLabel: "projects",
  labels: {
    description: "Description",
    stack: "Tech Stack",
    visit: "Visit Website",
    year: "Year",
  },
  list: [
    {
      name: "Conception AI",
      year: "2025",
      description: "AI agent that uses OpenAI API to generate clean Svelte code from human language requests, featuring code editor, live preview, download functionality, and history management.",
      stack: "Svelte, CSS, JavaScript, OpenAI API",
      link: "https://benelhadj.github.io/Conception-AI/"
    },
    {
      name: "QR Code Creator",
      year: "2025",
      description: "A fully static, customizable QR code generator (logo, colors, sizes, margin), exports PNG/JPEG/SVG, automatically deployed via GitHub Pages.",
      stack: "HTML, CSS, JavaScript, GitHub Pages",
      link: "https://benelhadj.github.io/QR-code_creator/"
    },
    {
      name: "Learn2Slither",
      year: "2025",
      description: "Reinforcement learning game where an AI agent learns to navigate an environment using tabular Q-Learning algorithm. The agent discovers its environment cell by cell with a bonus/malus system, receives positive/negative feedback, and can save training parameters to JSON for reuse in game mode.",
      stack: "Python, Q-Learning, Temporal Difference, JSON, Heuristics",
      link: "https://benelhadj.github.io/Learn2Slither/",
    },
    {
      name: "Matcha (Frontend)",
      year: "2025",
      description: "A social and dating web app inspired by Tinder, featuring profiles, matching and real-time chat.",
      stack: "Vue.js, Vite, Docker, GitHub Pages",
      link: "https://benelhadj.github.io/Matcha"
    },
    {
      name: "Matcha (Backend)",
      year: "2025",
      description: "Backend API of the Matcha project, handling authentication, database, business logic and communication with the frontend.",
      stack: "Node.js, Express, PostgreSQL, Docker, Render",
      link: "https://matcha-backend-t6dr.onrender.com/"
    },
  ]
};