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
            <a :href="githubUrl" target="_blank" rel="noopener noreferrer" class="corner-qr"><img :src="qrFor(githubUrl)" alt="github-qr" /></a>
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
            <a :href="linkedinUrl" target="_blank" rel="noopener noreferrer" class="corner-qr"><img :src="qrFor(linkedinUrl)" alt="linkedin-qr" /></a>
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
            <a :href="mailtoLink" class="corner-qr"><img :src="qrFor(mailtoLink)" alt="email-qr" /></a>
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
            <a :href="contactUrl" target="_blank" rel="noopener noreferrer" class="corner-qr"><img :src="qrFor(contactUrl)" alt="contact-qr" /></a>
          </div>
        </div>
      </div>
    </template>
    </PageLayout>
  </div>
</template>

<script setup>
import PageLayout from "../assets/PageLayout.vue";

// TODO: replace placeholders with your real addresses/usernames.
const githubUrl = "https://github.com/USERNAME";
const linkedinUrl = "https://www.linkedin.com/in/USERNAME";
const emailAddress = "you@example.com";
const contactUrl = "mailto:you@example.com"; // can be replaced by a contact form URL

const mailtoLink = `mailto:${emailAddress}`;

function qrFor(value) {
  // using public qrservice; it's fetched at runtime by the browser
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(value)}`;
}
</script>
