<template>
  <div class="wrapper links-wrapper">
    <h2 class="title">{{ $t('links.title') }}</h2>

    <PageLayout :columns="2" :rows="2">
    <template #slot1>
      <div class="slot-content tl">
        <div class="card line-card corner">
          <h3>{{ $t('links.items.github.name') }}</h3>
          <small>{{ $t('links.items.github.short') }}</small>
          <div class="actions">
            <a :href="$t('links.items.github.url')" target="_blank" rel="noopener noreferrer" class="corner-qr"><img :src="$t('links.items.github.qr') || qrFor($t('links.items.github.url'))" alt="github-qr" /></a>
          </div>
        </div>
      </div>
    </template>

    <template #slot2>
      <div class="slot-content tr">
        <div class="card line-card corner">
          <h3>{{ $t('links.items.linkedin.name') }}</h3>
          <small>{{ $t('links.items.linkedin.short') }}</small>
          <div class="actions">
            <a :href="$t('links.items.linkedin.url')" target="_blank" rel="noopener noreferrer" class="corner-qr"><img :src="$t('links.items.linkedin.qr') || qrFor($t('links.items.linkedin.url'))" alt="linkedin-qr" /></a>
          </div>
        </div>
      </div>
    </template>

    <template #slot3>
      <div class="slot-content bl">
        <div class="card line-card corner">
          <h3>{{ $t('links.items.email.name') }}</h3>
          <small>{{ $t('links.items.email.short') }}</small>
          <div class="actions">
            <a :href="`mailto:${emailAddress}`" class="corner-qr"><img :src="$t('links.items.email.qr') || qrFor(`mailto:${emailAddress}`)" alt="email-qr" /></a>
          </div>
        </div>
      </div>
    </template>

    <template #slot4>
      <div class="slot-content br">
        <div class="card line-card corner">
          <h3>{{ $t('links.items.contact.name') }}</h3>
          <small>{{ $t('links.items.contact.short') }}</small>
          <div class="actions">
            <!-- Use i18n-provided QR for contact; clicking opens the popup and updates the hash -->
            <a :href="'#contact'" class="corner-qr" @click.prevent="openContact" :title="$t('links.items.contact.name')">
              <img :src="$t('links.items.contact.qr') || qrFor($t('links.items.contact.url'))" :alt="$t('links.items.contact.name')" />
            </a>
          </div>
        </div>
        <Popup :visible="showContact" :title="$t('links.items.contact.name')" @close="closeContact">
          <ContactForm />
        </Popup>
      </div>
    </template>
    </PageLayout>
    
    <div class="favicon-center">
      <img
        src="/favicon.png"
        alt="favicon"
        role="button"
        tabindex="0"
        class="clickable-favicon"
        :title="cvLabel"
        @click="downloadCV"
        @keydown.enter="downloadCV"
      />
    </div>
  </div>
</template>

<script setup>
import PageLayout from "../assets/PageLayout.vue";
import ContactForm from './ContactForm.vue';
import Popup from './Popup.vue';

import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

// decode escaped @ in locale email address (we store as "42bhamdi\@gmail.com" to avoid i18n parsing)
const emailAddress = computed(() => {
  const raw = t('links.items.email.address');
  return String(raw).replace(/\\@/g, '@');
});

const showContact = ref(false);

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
    // remove hash without reloading
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
  // open on initial load if URL contains #contact or ?contact=1
  const params = new URLSearchParams(window.location.search);
  if (window.location.hash === '#contact' || params.get('contact') === '1' || params.get('contact') === 'true') {
    showContact.value = true;
  }
  window.addEventListener('hashchange', handleHashChange);
});

onBeforeUnmount(() => {
  window.removeEventListener('hashchange', handleHashChange);
});

// qrFor: generate a QR image URL for any value (used as fallback when a locale
// does not provide a static image path).
function qrFor(value) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(value)}`;
}

// CV download URL depending on current locale (fr => FR, otherwise EN including ar)
const cvUrl = computed(() => (String(locale.value).startsWith('fr') ? '/cv/CV_FR.pdf' : '/cv/CV_EN.pdf'));
const cvLabel = computed(() => (String(locale.value).startsWith('fr') ? 'Télécharger le CV (FR)' : 'Download CV (EN)'));

function downloadCV() {
  try {
    const url = cvUrl.value;
    // Create temporary link to trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = url.split('/').pop() || '';
    // Ensure it's added to DOM for Firefox
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {
    // fallback: open in new tab
    window.open(cvUrl.value, '_blank');
  }
}
</script>
