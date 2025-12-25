<template>
  <!-- Bandeau du nom, écrit de manière manuscrite en SVG, enchaîne plusieurs textes -->
  <div
    class="name-banner"
    aria-hidden="true"
    ref="container"
  >
    <div class="svg-holder" ref="svgHolder"></div>
  </div>
  
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// Langue courante via i18n
const { locale } = useI18n()

// Séquence d'affichage souhaitée
const sequence = ['hamdi', 'full_stack', 'web', 'mobile', 'ia', 'ml']

// Base path pour GitHub Pages
const base = (import.meta.env?.BASE_URL ?? '/')
const normalizedBase = base.endsWith('/') ? base : base + '/'

// Réfs DOM
const svgHolder = ref(null)
const container = ref(null)

// État d'animation
const currentIndex = ref(0)
let stopLoop = false

const langCode = computed(() => {
  const l = (locale?.value || 'fr').toLowerCase()
  return ['fr','en','ar'].includes(l) ? l : 'fr'
})

// Détection du mode basée uniquement sur la classe 'dark' (mapping: dark → w, light → b)
function getModeCode() {
  const isDark = document.documentElement.classList?.contains('dark')
  return isDark ? 'w' : 'b'
}

const buildUrl = (key) => `${normalizedBase}logos/texts/${langCode.value}-${getModeCode()}-${key}.svg`

async function animateSvgText(url) {
  try {
    const res = await fetch(url)
    const txt = await res.text()
    if (!svgHolder.value) return

    // Injecte l'SVG dans le holder
    svgHolder.value.innerHTML = txt
    const svg = svgHolder.value.querySelector('svg')
    if (!svg) return

    // Assure un dimensionnement et centrage cohérents avec la bannière
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', '100%')
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    svg.style.display = 'block'

    // Couleur pilotée par variable CSS globale (héritée via styles.css)
    // La couleur effective est définie par `.name-banner svg { color: var(--text); }` dans le CSS global

    // ==== Colorise directement les formes avec currentColor (var(--text)) ====
    const drawableSelectors = 'path, line, polyline, polygon, rect, circle, ellipse, text'
    const elems = Array.from(svg.querySelectorAll(drawableSelectors))
    elems.forEach(el => {
      el.setAttribute('stroke', 'currentColor')
      el.setAttribute('fill', 'currentColor')
      if (!el.getAttribute('stroke-width')) el.setAttribute('stroke-width', '2')
      el.style.opacity = '1'
    })

    // ==== Animation d'écriture: n'anime que les paths ====
    const paths = Array.from(svg.querySelectorAll('path'))
    const durationPerPath = 600 // ms
    for (const p of paths) {
      if (stopLoop) return
      let len = 0
      try {
        len = p.getTotalLength()
      } catch (e) {
        // Si getTotalLength n'est pas dispo, on ne tente pas l'écriture
        p.style.opacity = '1'
        continue
      }
      p.style.transition = 'none'
      p.style.strokeDasharray = `${len}`
      p.style.strokeDashoffset = `${len}`
      void p.getBoundingClientRect()
      p.style.transition = `stroke-dashoffset ${durationPerPath}ms ease`
      p.style.strokeDashoffset = '0'
      await new Promise(r => setTimeout(r, durationPerPath + 60))
    }

    // Pause d'affichage de 5 secondes
    await new Promise(r => setTimeout(r, 5000))

    // Efface en fondu
    if (svgHolder.value) {
      svgHolder.value.classList.add('fade-out')
      await new Promise(r => setTimeout(r, 600))
      svgHolder.value.classList.remove('fade-out')
      svgHolder.value.innerHTML = ''
    }
  } catch (err) {
    // En cas d'échec de chargement, ignorer et continuer
    console.warn('NameBanner: échec chargement SVG', url, err)
  }
}

async function runLoop() {
  stopLoop = false
  while (!stopLoop) {
    const key = sequence[currentIndex.value]
    await animateSvgText(buildUrl(key))
    currentIndex.value = (currentIndex.value + 1) % sequence.length
  }
}

onMounted(() => {
  runLoop()
})

onUnmounted(() => {
  stopLoop = true
})

// Si la langue change, on repart du début de la séquence
watch(() => locale.value, () => {
  currentIndex.value = 0
})
</script>

<style scoped>
/* Styles déplacés dans src/styles/styles.css pour respecter la source unique des styles */
</style>
