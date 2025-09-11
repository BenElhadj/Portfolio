<template>
    <div class="diplomas-wrap">
      <div class="diplomas-inner">
        <h2 class="title">Diplômes</h2>
  
        <div class="timeline" aria-label="Timeline des diplômes">
          <div
            v-for="(d, i) in diplomas"
            :key="i"
            class="timeline-item"
            :class="{ 'is-visible': visible[i] }"
            :ref="el => items[i] = el"
          >
            <div class="dot" aria-hidden="true">
              <!-- Mortarboard (chapeau de diplômé) SVG -->
              <svg viewBox="0 0 24 24" class="icon">
                <path d="M12 2 1 7l11 5 9-4.09V17h2V7L12 2z" />
                <path d="M11 13.5V21h2v-7.5l-1 0.45-1-0.45z"/>
              </svg>
            </div>
  
            <div class="card">
              <div class="meta">
                <span class="year">{{ d.period }}</span>
                <span class="institution">{{ d.institution }}</span>
              </div>
              <div class="degree">{{ d.title }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  
  const diplomas = [
    { period: '2016 - 2023', institution: 'Ecole 42 — Paris', title: 'Ingénieur Expert en architecture des BDD et data' },
    { period: '2017 - 2019', institution: 'GRETA — Paris', title: 'BTS Systèmes Numériques, informatique et réseau' },
    { period: '2011 - 2013', institution: 'CSFIEE — Tunis', title: 'BTS en Production électronique' },
    { period: '2006 - 2008', institution: 'CSFIEE — Tunis', title: 'BAC Pro en fabrication électronique' },
    { period: '2003 - 2005', institution: 'IPH — Tunis', title: 'BAC Pro en maintenance informatique' }
  ];
  
  const items = ref([]);
  const visible = ref(diplomas.map(() => false));
  let observer = null;
  
  onMounted(() => {
    // IntersectionObserver pour révéler les éléments quand la section est visible
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = items.value.indexOf(entry.target);
          if (idx !== -1) {
            visible.value[idx] = true;
            observer.unobserve(entry.target); // une fois visible on n'observe plus
          }
        }
      });
    }, {
      root: null,
      threshold: 0.45
    });
  
    // lancer l'observation
    items.value.forEach(el => {
      if (el) observer.observe(el);
    });
  });
  
  onBeforeUnmount(() => {
    if (observer) observer.disconnect();
  });
  </script>
  
  <style scoped>
  /* MODIF : Wrap remplit la hauteur du .page */
  .diplomas-wrap {
    width: 100%;
    height: 100%; /* Nouvelle : Remplit le parent */
    display: flex;
    flex-direction: column; /* Colonne pour timeline */
    justify-content: center; /* Centre verticalement le contenu */
    padding: 40px 24px;
    box-sizing: border-box;
  }
  
  .diplomas-inner {
    width: 100%;
    max-width: 1100px;
    flex: 1; /* Étire pour remplir */
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  /* Titre */
  .title {
    font-size: 2.1rem;
    margin: 0 0 28px;
    color: #0b6fb8;
    font-weight: 700;
    letter-spacing: -0.2px;
    flex-shrink: 0; /* Ne rétrécit pas */
  }
  
  /* Timeline */
  .timeline {
    position: relative;
    padding-left: 68px;
    padding-right: 12px;
    flex: 1; /* Prend le reste de l'espace */
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  /* ligne verticale */
  .timeline::before {
    content: "";
    position: absolute;
    left: 34px;
    top: 8px;
    bottom: 8px;
    width: 4px;
    background: linear-gradient(180deg, rgba(11,111,184,0.95), rgba(96,165,250,0.55));
    border-radius: 4px;
  }
  
  /* item */
  .timeline-item {
    position: relative;
    margin-bottom: 28px;
    display: flex;
    align-items: flex-start;
    gap: 18px;
  
    opacity: 0;
    transform: translateY(18px) scale(0.99);
    transition: all 520ms cubic-bezier(.2,.9,.2,1);
  }
  
  /* visible */
  .timeline-item.is-visible {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  
  /* dot (icon) */
  .dot {
    position: absolute;
    left: 0;
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 18px rgba(10,10,20,0.12);
    border: 2px solid rgba(11,111,184,0.12);
    flex-shrink: 0;
  }
  
  .dot .icon {
    width: 36px;
    height: 36px;
    fill: #0b6fb8;
    opacity: 0.95;
  }
  
  /* card */
  .card {
    margin-left: 80px;
    background: #fff;
    padding: 14px 18px;
    border-radius: 12px;
    box-shadow: 0 8px 22px rgba(12, 20, 40, 0.06);
    min-width: 260px;
    max-width: calc(100% - 120px);
    border-left: 4px solid rgba(11,111,184,0.06);
    flex-shrink: 0;
  }
  
  /* meta */
  .meta {
    display: flex;
    gap: 12px;
    align-items: baseline;
    flex-wrap: wrap;
  }
  
  .year {
    font-weight: 700;
    color: #0b6fb8;
    font-size: 0.98rem;
  }
  
  .institution {
    font-size: 0.95rem;
    color: #333;
    opacity: 0.9;
  }
  
  /* degree */
  .degree {
    margin-top: 8px;
    font-size: 0.95rem;
    color: #1f2937;
    line-height: 1.25;
  }
  
  /* responsive */
  @media (max-width: 720px) {
    .timeline {
      padding-left: 14px;
    }
    .timeline::before {
      left: 18px;
    }
    .dot {
      left: 0;
      width: 52px;
      height: 52px;
    }
    .card {
      margin-left: 66px;
      padding: 12px 14px;
    }
    .title { text-align: center; }
    .diplomas-wrap { padding: 20px 12px; } /* Réduit padding mobile */
  }
  </style>