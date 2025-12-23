<template>
  <!-- Bandeau du nom, se colore via CSS var et masque le SVG choisi selon la langue -->
  <div
    class="name-banner"
    :style="maskStyle"
    aria-hidden="true"
  />
  
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Langue courante via i18n
const { locale } = useI18n()

// Sélection du fichier selon la langue
const svgPath = computed(() => {
  const l = (locale?.value || 'fr').toLowerCase()
  // normalise vers fr/en/ar uniquement
  const code = ['fr','en','ar'].includes(l) ? l : 'fr'
  return `/logos/texts/${code}-hamdi.svg`
})

// Style de masque pour recolorer le SVG en pur noir/blanc selon le thème
const maskStyle = computed(() => ({
  WebkitMaskImage: `url(${svgPath.value})`,
  maskImage: `url(${svgPath.value})`,
}))
</script>

<style scoped>
/* Bannière fixe juste sous la navbar */
.name-banner {
  position: fixed;
  top: calc(var(--navbar-height) + var(--page-padding-y) + var(--name-banner-offset));
  left: 0;
  right: 0;
  height: var(--name-banner-height, var(--fs-h2));
  /* Couleur pilotée par variables (noir en clair, blanc en sombre) */
  background-color: var(--name-banner-color, #000);

  /* Masquage par le SVG pour coloriser */
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  /* Centré horizontalement, même hauteur que le titre de page */
  -webkit-mask-position: center center;
  mask-position: center center;
  -webkit-mask-size: contain;
  mask-size: contain;

  /* Laisse le scroll et clics passer */
  pointer-events: none;
  z-index: 2500; /* sous la navbar (3000) mais au dessus du contenu */
}

/* Ajuste la taille sur petits écrans */
@media (max-width: 640px) {
  .name-banner {
    height: calc((var(--name-banner-height, var(--fs-h2))) * 0.8);
  }
}
</style>
