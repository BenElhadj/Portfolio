<template>
  <div class="contact-form card line-card" :dir="isRtl ? 'rtl' : 'ltr'">
    <h3>{{ title }}</h3>
    <small>{{ subtitle }}</small>

    <form @submit.prevent="onSubmit">
      <label>
        {{ nameLabel }}
        <input v-model="form.name" type="text" required />
      </label>

      <label>
        {{ messageLabel }}
        <textarea v-model="form.message" rows="5" required></textarea>
      </label>

      <label>
        {{ emailLabel }}
        <input v-model="form.email" type="email" :placeholder="emailLabel" />
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
const messageLabel = computed(() => t('links.items.contact.form.messageLabel'));
const emailLabel = computed(() => t('links.items.contact.form.emailLabel'));
const submitLabel = computed(() => t('links.items.contact.form.submitLabel'));
const successMessage = computed(() => t('links.items.contact.form.success'));
const errorMessage = computed(() => t('links.items.contact.form.error'));
const isRtl = computed(() => String(locale.value).startsWith('ar'));

const form = ref({ name: '', message: '', email: '' });
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

    const templateParams = {
      from_name: form.value.name || 'Anonyme',
      message: form.value.message || '(aucun message)',
      reply_to: form.value.email || 'noreply@example.com',
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
