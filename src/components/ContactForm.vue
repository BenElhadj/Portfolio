<template>
  <div class="contact-form card line-card" :dir="isRtl ? 'rtl' : 'ltr'">
    <h3>{{ title }}</h3>
    <small>{{ subtitle }}</small>

    <form @submit.prevent="onSubmit" ref="formEl" enctype="multipart/form-data">
      <label>
        {{ nameLabel }}
        <input v-model="form.name" name="name" type="text" :placeholder="namePlaceholder" />
      </label>

      <label>
        {{ emailLabelPure }}
        <input v-model="form.email" name="email" type="email" :placeholder="emailPlaceholder" />
      </label>

      <label>
        {{ subjectLabelPure }}
        <input v-model="form.subject" name="subject" type="text" :placeholder="subjectPlaceholder" />
      </label>

      <label>
        {{ messageLabel }} *
        <textarea v-model="form.message" name="message" rows="5" required :placeholder="messagePlaceholder"></textarea>
      </label>

      <!-- Input fichier caché déclenché par le bouton trombone -->
      <input ref="fileInputRef" type="file" name="attachments" multiple style="display:none" />

      <div class="actions">
        <!-- Bouton trombone pour joindre des fichiers -->
        <button
          type="button"
          class="clip-btn"
          :aria-label="attachLabel"
          :title="attachLabel"
          @click="onAttachClick"
        >
          <svg class="clip-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M7 13l5.5-5.5a3.536 3.536 0 014.999 5l-7.5 7.5a5 5 0 11-7.071-7.071L11 5a2.5 2.5 0 113.536 3.536L8 15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
        <!-- Triangular messenger-style send button -->
        <button
          type="submit"
          class="tg-send"
          :disabled="sending"
          :aria-label="submitLabel"
          :title="submitLabel"
        >
          <!-- SVG arrow icon (keeps small and centered in the triangle) -->
          <svg class="tg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor" />
          </svg>
        </button>
      </div>

      <p v-if="status" :class="{ ok: statusOk, error: !statusOk }">{{ status }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const title = computed(() => t('links.items.contact.name'));
const subtitle = computed(() => t('links.items.contact.short'));
const nameLabel = computed(() => t('links.items.contact.form.nameLabel'));
const subjectLabel = computed(() => t('links.items.contact.form.subjectLabel'));
const messageLabel = computed(() => t('links.items.contact.form.messageLabel'));
const emailLabel = computed(() => t('links.items.contact.form.emailLabel'));
const attachLabel = computed(() => t('links.items.contact.form.attachLabel'));
const submitLabel = computed(() => t('links.items.contact.form.submitLabel'));
const successMessage = computed(() => t('links.items.contact.form.success'));
const errorMessage = computed(() => t('links.items.contact.form.error'));
const isRtl = computed(() => String(locale.value).startsWith('ar'));

// Placeholders localisés pour champs manquants
const missingName = computed(() => t('links.items.contact.form.missingName'));
const missingEmail = computed(() => t('links.items.contact.form.missingEmail'));

// Hints localisés pour placeholders
const optionalHint = computed(() => t('links.items.contact.form.optionalHint'));
const requiredHint = computed(() => t('links.items.contact.form.requiredHint'));

// Labels "purs" sans suffixe (optionnel) pour affichage
const emailLabelPure = computed(() => String(emailLabel.value).replace(/\s*\(.*\)\s*$/, ''));
const subjectLabelPure = computed(() => String(subjectLabel.value).replace(/\s*\(.*\)\s*$/, ''));

// Placeholders simples (localisés)
const namePlaceholder = computed(() => optionalHint.value);
const emailPlaceholder = computed(() => optionalHint.value);
const subjectPlaceholder = computed(() => optionalHint.value);
const messagePlaceholder = computed(() => requiredHint.value);

const form = ref({ name: '', subject: '', message: '', email: '' });
const formEl = ref(null);
const fileInputRef = ref(null);
const sending = ref(false);
const status = ref('');
const statusOk = ref(false);

// EmailJS client-only configuration (required)
// Put these values in your local .env (see .env.example):
// VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_USER
const EMAILJS_SERVICE = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_USER = import.meta.env.VITE_EMAILJS_USER; // public key

async function onSubmit() {
  status.value = '';
  statusOk.value = false;
  sending.value = true;

  try {
    // Validate EmailJS config presence
    if (!EMAILJS_SERVICE || !EMAILJS_TEMPLATE || !EMAILJS_USER) {
      throw new Error('EmailJS variables manquantes. Remplissez VITE_EMAILJS_* dans votre .env (voir .env.example)');
    }

    // Construire FormData à partir du formulaire pour permettre les pièces jointes
    const nm = form.value.name ? form.value.name : (missingName.value || '');
    const em = form.value.email ? form.value.email : (missingEmail.value || '');
    const timeStr = new Date().toLocaleString(String(locale.value) || undefined, { hour12: false });

    const fd = new FormData(formEl.value);
    // Surcharger avec placeholders/localisations si vides
    fd.set('name', nm);
    fd.set('email', em);
    fd.set('message', form.value.message ?? '');
    fd.set('time', timeStr);

    // Paramètres EmailJS requis
    fd.append('service_id', EMAILJS_SERVICE);
    fd.append('template_id', EMAILJS_TEMPLATE);
    fd.append('user_id', EMAILJS_USER);

    const resp = await fetch('https://api.emailjs.com/api/v1.0/email/send-form', {
      method: 'POST',
      body: fd
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(txt || 'Envoi EmailJS échoué');
    }

    status.value = successMessage.value || 'Message envoyé — merci !';
    statusOk.value = true;

    // clear form on success
    form.value.name = '';
    form.value.subject = '';
    form.value.message = '';
    form.value.email = '';

  } catch (err) {
    console.error(err);
    const base = errorMessage.value || "Erreur lors de l'envoi";
    status.value = base + (err && err.message ? (" : " + err.message) : '');
    statusOk.value = false;
  } finally {
    sending.value = false;
  }
}

function onAttachClick() {
  try {
    if (fileInputRef.value) fileInputRef.value.click();
  } catch (e) {
    // ignore
  }
}
</script>

<style scoped>
.actions {
  display: flex;
  gap: 18px;
  align-items: center;
  justify-content: flex-end;
}

.clip-btn {
  background: transparent;
  border: none !important;
  padding: 6px;
  cursor: pointer;
  color: var(--blue);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
  transition: transform .16s cubic-bezier(.2,.9,.2,1), filter .12s ease, opacity .12s ease;
  transform-origin: center center;
}

.clip-btn:focus { outline: none; }
.clip-btn:hover { transform: scale(1.12); filter: brightness(0.98); }
.clip-btn:active { transform: scale(1.06); }
.clip-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; filter: grayscale(0.2); }

.clip-icon {
  width: 24px;
  height: 24px;
  display: block;
  color: var(--blue);
}
</style>
