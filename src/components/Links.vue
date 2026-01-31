<template>
  <div class="wrapper links-wrapper">
    <h2 class="title">{{ $t('links.title') }}</h2>

    <PageLayout :columns="2" :rows="2">
      <template
        v-for="(item, index) in slots"
        :key="item.key"
        v-slot:["slot"+(index+1)]
      >
        <div class="slot-content" :class="item.cls">
          <div class="card line-card corner">
            <div class="corner-qr-block">
              <a
                :href="getHref(item.key)"
                target="_blank"
                rel="noopener noreferrer"
                class="corner-qr"
                :title="item.key === 'contact' ? $t('links.items.contact.name') : null"
                @click="handleClick(item.key, $event)"
              >
                <picture>
                  <source
                    :srcset="( (t(`links.items.${item.key}.qr`) && getAssetPath(t(`links.items.${item.key}.qr`))) || qrFor(dataForKey(item.key)) )"
                    type="image/webp"
                  />
                  <!-- special lazy image handling for GitHub -->
                  <img
                    v-if="item.key === 'github'"
                    ref="githubQrLazy.imageRef"
                    :src="githubQrLazy.isVisible ? ( (t('links.items.github.qr') && getAssetPath(t('links.items.github.qr'))) || qrFor(dataForKey('github')) ) : githubQrLazy.placeholder"
                    alt="github-qr"
                    loading="lazy"
                    :class="{ 'fade-in': githubQrLazy.loaded }"
                    @load="githubQrLazy.onLoad"
                  />
                  <img
                    v-else
                    :src="getImgSrc(item.key)"
                    :alt="`${item.key}-qr`"
                    loading="lazy"
                  />
                </picture>
              </a>

              <div class="qr-caption">
                <div class="qr-name">{{ $t(`links.items.${item.key}.name`) }}</div>
                <div class="qr-short">{{ $t(`links.items.${item.key}.short`) }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </PageLayout>

    <!-- Popup ContactForm rendered globally as modal -->
    <teleport to="body">
      <Popup :visible="showContact" :title="$t('links.items.contact.name')" @close="closeContact">
        <ContactForm />
      </Popup>
    </teleport>

    <div class="favicon-center">
      <picture>
        <source :srcset="faviconSrc.replace(/\.[a-zA-Z]+$/, '.webp')" type="image/webp" />
        <img
          :src="faviconSrc"
          alt="favicon"
          loading="lazy"
          role="button"
          tabindex="0"
          class="clickable-favicon"
          :aria-label="$t('links.cvLabel')"
          @click="downloadCV"
          @keydown.enter="downloadCV"
          @mouseenter="onCvMouseEnter"
          @mouseleave="onCvMouseLeave"
          @mousemove="onCvMouseMove"
        />
      </picture>

      <teleport to="body">
        <div
          v-if="showCvTooltip"
          class="cv-tooltip"
          :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
          role="tooltip"
          aria-hidden="false"
        >
          {{ $t('links.cvLabel') }}
        </div>
      </teleport>
    </div>
  </div>
</template>

<script setup>
import PageLayout from "../assets/PageLayout.vue";
import ContactForm from './ContactForm.vue';
import Popup from './Popup.vue';

import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useLazyImage } from '../composables/useLazyImage.js';
import { getAssetPath } from '../utils/assets.js';
// Lazy loading avancé pour le QR GitHub (webp)
const githubQrLazy = useLazyImage('/public/qr/qr_GitHub.webp');
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

// decode placeholders in locale email address
const emailAddress = computed(() => {
  const raw = t('links.items.email.address');
  return String(raw).replace(/\[at\]/g, '@').replace(/\\@/g, '@');
});

const showContact = ref(false);

// CV tooltip
const showCvTooltip = ref(false);
const tooltipX = ref(0);
const tooltipY = ref(0);

function onCvMouseEnter() {
  showCvTooltip.value = true;
}
function onCvMouseLeave() {
  showCvTooltip.value = false;
}
function onCvMouseMove(e) {
  tooltipX.value = Math.round(e.clientX + 8);
  tooltipY.value = Math.round(e.clientY + 8);
}

// decode contact url placeholder
const contactUrl = computed(() => {
  const raw = t('links.items.contact.url');
  return String(raw).replace(/\[at\]/g, '@').replace(/\\@/g, '@');
});

function openContact() {
  showContact.value = true;
  try {
    history.replaceState(null, '', '#contact');
  } catch (e) {
    // ignore
  }
}
function closeContact() {
  showContact.value = false;
  try {
    const url = new URL(window.location.href);
    url.hash = '';
    history.replaceState(null, '', url.toString());
  } catch (e) {
    // ignore
  }
}
function handleHashChange() {
  if (window.location.hash === '#contact') openContact();
}

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  if (window.location.hash === '#contact' || params.get('contact') === '1' || params.get('contact') === 'true') {
    showContact.value = true;
  }
  window.addEventListener('hashchange', handleHashChange);
});

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', handleHashChange);
});

// qrFor fallback
function qrFor(value) {
  return 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(value);
}

// Detect GitHub Pages base
function getBasePath() {
  try {
    const path = window.location.pathname || '/';
    const parts = path.split('/').filter(Boolean);
    return parts.length > 0 ? '/' + parts[0] + '/' : '/';
  } catch (e) {
    return '/';
  }
}

// CV and favicon paths
const cvUrl = computed(() => {
  const file = String(locale.value).startsWith('fr') ? 'cv/CV_FR.pdf' : 'cv/CV_EN.pdf';
  return getBasePath() + file;
});
const faviconSrc = computed(() => getBasePath() + 'favicon.webp');

function downloadCV() {
  const url = cvUrl.value;
  const isTouchDevice = (typeof window !== 'undefined') && (
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')
  );
  if (isTouchDevice) {
    try {
      const w = window.open(url, '_blank');
      if (w && 'opener' in w) w.opener = null;
      return;
    } catch (e) {
      window.location.href = url;
      return;
    }
  }
  try {
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', url.split('/').pop() || '');
    a.setAttribute('rel', 'noopener');
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {
    const w = window.open(url, '_blank');
    if (w && 'opener' in w) w.opener = null;
  }
}

/* ---------- Nouvelle structure de slots pour PageLayout ---------- */
const slots = [
  { key: 'github', cls: 'tl' },
  { key: 'linkedin', cls: 'tr' },
  { key: 'email', cls: 'bl' },
  { key: 'contact', cls: 'br' },
];

function getHref(key) {
  if (key === 'email') return 'mailto:' + emailAddress.value;
  if (key === 'contact') return '#contact';
  return t(`links.items.${key}.url`);
}
function dataForKey(key) {
  if (key === 'email') return 'mailto:' + emailAddress.value;
  if (key === 'contact') return contactUrl.value;
  return String(t(`links.items.${key}.url`));
}
function getImgSrc(key) {
  const qr = t(`links.items.${key}.qr`);
  if (qr) return getAssetPath(qr);
  return qrFor(dataForKey(key));
}
function handleClick(key, event) {
  if (key === 'contact') {
    event.preventDefault();
    openContact();
  }
}
</script>
