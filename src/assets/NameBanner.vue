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
let themeChangedHandler = null
let languageChangedHandler = null

const langCode = computed(() => {
  const l = (locale?.value || 'fr').toLowerCase()
  return ['fr','en','ar'].includes(l) ? l : 'fr'
})

// Détection du mode basée uniquement sur la classe 'dark' (mapping: dark → w, light → b)
function getModeCode() {
  const isDark = document.documentElement.classList?.contains('dark')
  return isDark ? 'w' : 'b'
}

const buildBase = (key) => `${normalizedBase}logos/texts/${langCode.value}-${getModeCode()}-${key}`

let currentRenderToken = 0

async function fetchSvgText(url) {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const txt = await res.text()
    if (txt && txt.includes('<svg')) return txt
    return null
  } catch (e) {
    return null
  }
}

// Charge strictement le SVG et l'anime. Si absent, on logge un avertissement.
async function animateSvgOnly(key, expectedToken) {
  const token = expectedToken ?? ++currentRenderToken
  const base = buildBase(key)

  if (!svgHolder.value) return
  svgHolder.value.innerHTML = ''

  const svgUrl = `${base}.svg`
  const svgText = await fetchSvgText(svgUrl)
  if (token !== currentRenderToken) return
  if (!svgText) {
    console.warn('NameBanner: SVG manquant pour', key, svgUrl)
    // Ne pas fallback sur une image — le composant exige un SVG pour l'animation
    return
  }

  svgHolder.value.innerHTML = svgText
  const svg = svgHolder.value.querySelector('svg')
  if (!svg) return
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  svg.style.display = 'block'

  const drawableSelectors = 'path, line, polyline, polygon, rect, circle, ellipse, text'
  const elems = Array.from(svg.querySelectorAll(drawableSelectors))
  elems.forEach(el => {
    el.setAttribute('stroke', 'currentColor')
    el.setAttribute('fill', 'currentColor')
    if (!el.getAttribute('stroke-width')) el.setAttribute('stroke-width', '2')
    el.style.opacity = '1'
  })

  const paths = Array.from(svg.querySelectorAll('path'))
  const durationPerPath = 600 // ms
  for (const p of paths) {
    if (stopLoop || token !== currentRenderToken) return
    let len = 0
    try {
      len = p.getTotalLength()
    } catch (e) {
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
    if (token !== currentRenderToken) return
  }

  // Pause d'affichage
  await new Promise(r => setTimeout(r, 5000))
  if (token !== currentRenderToken) return

  // Efface en fondu
  if (svgHolder.value && token === currentRenderToken) {
    svgHolder.value.classList.add('fade-out')
    await new Promise(r => setTimeout(r, 600))
    svgHolder.value.classList.remove('fade-out')
    svgHolder.value.innerHTML = ''
  }
}

async function runLoop() {
  stopLoop = false
  while (!stopLoop) {
    const key = sequence[currentIndex.value]
    await animateSvgOnly(key)
    currentIndex.value = (currentIndex.value + 1) % sequence.length
  }
}

onMounted(() => {
  themeChangedHandler = async () => {
    currentRenderToken++
    if (svgHolder.value) svgHolder.value.innerHTML = ''
  const key = sequence[currentIndex.value]
  await animateSvgOnly(key, currentRenderToken)
  }
  window.addEventListener('theme-changed', themeChangedHandler)
  languageChangedHandler = async (e) => {
    currentRenderToken++
    if (svgHolder.value) svgHolder.value.innerHTML = ''
  const key = sequence[currentIndex.value]
  await animateSvgOnly(key, currentRenderToken)
  }
  window.addEventListener('language-changed', languageChangedHandler)
  // Démarre la boucle
  runLoop()
})

onUnmounted(() => {
  stopLoop = true
  if (themeChangedHandler) {
    window.removeEventListener('theme-changed', themeChangedHandler)
    themeChangedHandler = null
  }
  if (languageChangedHandler) {
    window.removeEventListener('language-changed', languageChangedHandler)
    languageChangedHandler = null
  }
})

// Si la langue change, on repart du début de la séquence
watch(() => locale.value, () => {})
</script>
