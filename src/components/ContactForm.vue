<template>
  <div class="contact-form card line-card" :dir="isRtl ? 'rtl' : 'ltr'">
    <h3>{{ title }}</h3>
    <small>{{ subtitle }}</small>

    <form @submit.prevent="onSubmit">
      <label>
        {{ nameLabel }}
        <input v-model="form.name" type="text" :placeholder="namePlaceholder" />
      </label>

      <label>
        {{ emailLabelPure }}
        <input v-model="form.email" type="email" :placeholder="emailPlaceholder" />
      </label>

      <label>
        {{ subjectLabelPure }}
        <input v-model="form.subject" type="text" :placeholder="subjectPlaceholder" />
      </label>

      <label>
        {{ messageLabel }} *
        <textarea v-model="form.message" rows="5" required :placeholder="messagePlaceholder"></textarea>
      </label>

      <div class="actions">
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
const submitLabel = computed(() => t('links.items.contact.form.submitLabel'));
const successMessage = computed(() => t('links.items.contact.form.success'));
const errorMessage = computed(() => t('links.items.contact.form.error'));
const isRtl = computed(() => String(locale.value).startsWith('ar'));

// Placeholders localisés pour champs manquants
const missingSubject = computed(() => t('links.items.contact.form.missingSubject'));
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

    // Construire un message formaté avec une forme identique, en gardant
    // le texte tel qu'il est saisi par l'utilisateur.
    const subj = form.value.subject ? form.value.subject : (missingSubject.value || '');
    const nm = form.value.name ? form.value.name : (missingName.value || '');
    const em = form.value.email ? form.value.email : (missingEmail.value || '');

    const formattedMessage =
      `subject: ${subj}\n` +
      `name: ${nm}\n` +
      `email: ${em}\n\n` +
      `--- message ---\n` +
      (form.value.message ?? '');

    const templateParams = {
      from_name: form.value.name || '',
      message: formattedMessage,
      reply_to: form.value.email || '',
      subject: form.value.subject || '',
      to_email: '42bhamdi@gmail.com'
    };

    const payload = {
      service_id: EMAILJS_SERVICE,
      template_id: EMAILJS_TEMPLATE,
      user_id: EMAILJS_USER,
      template_params: templateParams
    };

    const resp = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
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
</script>
