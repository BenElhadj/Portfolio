<template>
  <div class="wrapper">
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
            <a :href="`mailto:${$t('links.items.email.address')}`" class="corner-qr"><img :src="$t('links.items.email.qr') || qrFor(`mailto:${$t('links.items.email.address')}`)" alt="email-qr" /></a>
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
            <a :href="$t('links.items.contact.url')" target="_blank" rel="noopener noreferrer" class="corner-qr"><img :src="$t('links.items.contact.qr') || qrFor($t('links.items.contact.url'))" alt="contact-qr" /></a>
          </div>
        </div>
      </div>
    </template>
    </PageLayout>
  </div>
</template>

<script setup>
import PageLayout from "../assets/PageLayout.vue";

// qrFor: generate a QR image URL for any value (used as fallback when a locale
// does not provide a static image path).
function qrFor(value) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(value)}`;
}
</script>
