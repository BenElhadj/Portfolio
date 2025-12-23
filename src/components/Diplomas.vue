<template>
  <div class="wrapper diplomas-page">
    <h2 class="title">{{ $t("diplomas.title") }}</h2>
    <div class="timeline" aria-label="Timeline des diplômes">
      <PageLayout :columns="1" :rows="diplomas.length">
        <template
          v-for="(cat, catIndex) in diplomas"
          :key="catIndex"
          v-slot:[('slot'+(catIndex+1))]
        >
          <div class="category">
            <div class="category-header">
              <h3>{{ cat.title }}</h3>
            </div>

            <div class="timeline-container">
              <div>
                <div
                  v-for="(d, i) in cat.diplomes"
                  :key="i"
                  class="timeline-item"
                  :class="{ 'is-visible': visible[catIndex]?.[i] }"
                  :ref="(el) => {
                    if (!items[catIndex]) items[catIndex] = [];
                    items[catIndex][i] = el;
                  }"
                >
                  <div
                    class="degree-thumb"
                    role="button"
                    tabindex="0"
                    @click.stop.prevent="openLogo(d)"
                    @keydown.enter.prevent="openLogo(d)"
                    @keydown.space.prevent="openLogo(d)"
                    :title="'Voir logo ' + d.institution"
                  >
                    <img v-if="d.image" :src="getAssetPath('/degrees/' + d.image)" :alt="d.degree" />
                  </div>

                  <div
                    class="card line-card"
                    role="button"
                    tabindex="0"
                    @click="openPopup(d)"
                    @keydown.enter.prevent="openPopup(d)"
                    @keydown.space.prevent="openPopup(d)"
                  >
                    <div class="meta">
                      <span class="year">{{ d.period }}</span>
                      <span class="institution">{{ d.institution }}</span>
                    </div>
                    <div class="degree">{{ d.degree }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </PageLayout>
    </div>

    <Popup :visible="popupVisible" :title="popupTitle" @close="handleClose">
      <template #controls v-if="isDiplomaPopup">
        <div class="zoom-control">
          <span class="zoom-icon" aria-hidden="true" title="Zoom">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
              <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </span>
          <input
          type="range"
          min="1"
          max="10"
          step="0.1"
          v-model.number="zoomScale"
          aria-label="Niveau de zoom"
          />
          <div class="zoom-value">{{ zoomScale.toFixed(1) }}×</div>
          <br>
          <div class="diploma-name" v-if="popupDegree" :dir="String(locale.value).startsWith('ar') ? 'rtl' : 'ltr'" style="flex:1; text-align:center;">{{ popupDegree }}</div>
        </div>
      </template>
      <div v-if="popupImage" class="zoom-wrapper" ref="zoomWrapper">
        <div v-if="popupLoading" class="popup-spinner-overlay">{{ $t('diplomas.loading') || 'Chargement...' }}</div>
        <div
          v-if="isDiplomaPopup"
          class="pan-wrapper"
          :class="{ dragging: dragging }"
          :style="{ transform: 'translate(' + panX + 'px, ' + panY + 'px)' }"
          @pointerdown.prevent="onPointerDown"
          @pointermove.prevent="onPointerMove"
          @pointerup.prevent="onPointerUp"
          @pointercancel.prevent="onPointerUp"
          @mouseleave.prevent="onPointerUp"
          @wheel.prevent="onWheel"
          @contextmenu.prevent
          @copy.prevent
        >
          <img
            :src="popupImage"
            class="popup-image"
            :style="{ transform: 'scale(' + zoomScale + ')' }"
            alt="diploma"
            draggable="false"
            @dragstart.prevent
          />
        </div>
        <div v-else class="logo-wrapper">
          <img
            :src="popupImage"
            class="popup-image"
            alt="logo"
          />
        </div>
      </div>
    </Popup>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import PageLayout from "../assets/PageLayout.vue";
import Popup from "./Popup.vue";
import { getAssetPath } from "../utils/assets.js";

const { tm, locale } = useI18n();

const diplomas = computed(() => {
  const list = tm("diplomas.list");
  return Array.isArray(list) ? list : [];
});

const items = ref([]);
const visible = ref([]);
let observer = null;

// --- Gestion du popup ---
const popupVisible = ref(false);
const popupTitle = ref("");
const popupImage = ref("");
const popupLoading = ref(false);
const popupDegree = ref("");
const preloadedCache = new Map();
const zoomWrapper = ref(null);
const isDiplomaPopup = ref(false);

async function fetchAssetAsDataUrl(url) {
  try {
    const m = url.match(/(.+)\.(svg|png|jpg|jpeg|gif)$/i);
  const basePath = m ? m[1] : url;
    const baseNameRaw = basePath.split('/').pop() || '';
    const baseName = baseNameRaw.replace(/\.[^/.]+$/, '') || baseNameRaw;

    const isBac = /^bac/i.test(baseName);

    if (m && m[2] && m[2].toLowerCase() === 'svg' && !isBac) {
      return url;
    }

    const norm = baseName.replace(/\+/g, '').replace(/-/g, '_').toUpperCase();
  const envStartKey = 'VITE_START_' + norm;
  const envEndKey = 'VITE_END_' + norm;

    if (isBac) {
      const envStart = import.meta.env[envStartKey] || '';
      const envEnd = import.meta.env[envEndKey] || '';

      if (envStart && typeof envStart === 'string' && envStart.startsWith('data:')) {
        const candidates = [];
        candidates.push(basePath);

        for (const candidate of candidates) {
          try {
            const res = await fetch(candidate, { cache: 'force-cache' });
            if (!res.ok) continue;
            const text = (await res.text()).trim();
            if (!text) continue;
            if (text.startsWith('data:')) return text;
            return envStart + text + (envEnd || '');
          } catch (err) {
          }
        }

        if (!envEnd) return envStart;
      }
    }

    try {
      const tryCandidates = [];
    if (m) tryCandidates.push(basePath);

      for (const candidate of tryCandidates) {
        try {
          const resBase = await fetch(candidate, { cache: 'force-cache' });
          if (!resBase.ok) continue;
          const text = (await resBase.text()).trim();
          if (!text) continue;
          if (text.startsWith('data:')) return text;
          let mime = 'image/svg+xml';
          if (m) {
            const ext = m[2].toLowerCase();
            if (ext === 'png') mime = 'image/png';
            else if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
            else if (ext === 'gif') mime = 'image/gif';
            else if (ext === 'svg') mime = 'image/svg+xml';
          }
          return `data:${mime};base64,${text}`;
        } catch (err) {
        }
      }
    } catch (err) {
    }
  } catch (err) {
  }

  try {
    const res = await fetch(url, { cache: 'force-cache' });
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('svg') || url.toLowerCase().endsWith('.svg')) {
      const text = await res.text();
      return `data:image/svg+xml;utf8,${encodeURIComponent(text)}`;
    }
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read blob'));
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    return url;
  }
}
// continuous zoom scale (1.0 .. 10.0)
const zoomScale = ref(1);
const panX = ref(0);
const panY = ref(0);
const dragging = ref(false);
let pointerId = null;
let startClientX = 0;
let startClientY = 0;
let startPanX = 0;
let startPanY = 0;
function keyDownHandler(e) {
if (!isDiplomaPopup.value) return;

if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || (e.shiftKey && e.key === 'S'))) {
  e.preventDefault();
  e.stopPropagation();
}
if (e.key === 'PrintScreen') {
}
}

function openPopup(d) {
  isDiplomaPopup.value = true;
  popupTitle.value = "";
  popupDegree.value = d.degree || "";
  const image = d.diplomaImage || d.image;
  const url = image ? getAssetPath(`/degrees/${image}`) : "";
  if (!url) return;
  const wmKey = url + '::wm::' + encodeURIComponent(popupDegree.value || '');
  const emailToUse = String(locale.value).startsWith('ar')
    ? 'بن_الحاج_حمدي_42bhamdi@gmail.com'
    : 'BEN_ELHADJ_Hamdi_42bhamdi@gmail.com';
  if (preloadedCache.has(wmKey)) {
    popupImage.value = preloadedCache.get(wmKey) || url;
    popupLoading.value = false;
    popupVisible.value = true;
    return;
  }

  if (preloadedCache.has(url)) {
    const orig = preloadedCache.get(url) || url;
    popupImage.value = orig;
    popupVisible.value = true;
    if (isDiplomaPopup.value) {
      popupLoading.value = true;
      const emailToUse = String(locale.value).startsWith('ar')
        ? 'بن_الحاج_حمدي_42bhamdi@gmail.com'
        : 'BEN_ELHADJ_Hamdi_42bhamdi@gmail.com';
      applyWatermarkToImage(orig, popupDegree.value, emailToUse).then((wmData) => {
        preloadedCache.set(wmKey, wmData);
        popupImage.value = wmData;
      }).catch(() => {
        popupImage.value = orig;
      }).finally(() => {
        popupLoading.value = false;
      });
    } else {
      popupLoading.value = false;
    }
    return;
  }

  popupLoading.value = true;
  popupImage.value = "";
  popupVisible.value = true;
  fetchAssetAsDataUrl(url)
    .then((dataUrl) => {
      preloadedCache.set(url, dataUrl);
      // show original (or base64) immediately
      popupImage.value = dataUrl;
      if (isDiplomaPopup.value) {
        popupLoading.value = true;
        applyWatermarkToImage(dataUrl, popupDegree.value, emailToUse)
          .then((wm) => {
            preloadedCache.set(wmKey, wm);
            popupImage.value = wm;
          })
          .catch(() => {
          })
          .finally(() => {
            popupLoading.value = false;
          });
      } else {
        popupLoading.value = false;
      }
    })
    .catch(() => {
      preloadedCache.set(url, url);
      popupImage.value = url;
      popupLoading.value = false;
    });
}

function openLogo(d) {
  isDiplomaPopup.value = false;
  popupTitle.value = d.institution || "";
  popupDegree.value = "";
  const image = d.image || d.diplomaImage;
  const url = image ? getAssetPath(`/degrees/${image}`) : "";
  if (!url) return;
  if (preloadedCache.has(url)) {
    popupImage.value = preloadedCache.get(url) || url;
    popupLoading.value = false;
    popupVisible.value = true;
    return;
  }
  popupLoading.value = true;
  popupImage.value = "";
  popupVisible.value = true;
  fetchAssetAsDataUrl(url)
    .then((dataUrl) => {
      preloadedCache.set(url, dataUrl);
      popupImage.value = dataUrl;
    })
    .catch(() => {
      preloadedCache.set(url, url);
      popupImage.value = url;
    })
    .finally(() => {
      popupLoading.value = false;
    });
}

function handleClose() {
  popupVisible.value = false;
  popupTitle.value = "";
  popupImage.value = "";
  popupLoading.value = false;
  popupDegree.value = "";
  isDiplomaPopup.value = false;
  zoomScale.value = 1;
  panX.value = 0;
  panY.value = 0;
  dragging.value = false;
}

function applyWatermarkToImage(srcDataUrl, diplomaName, email = 'BEN_ELHADJ_Hamdi_42bhamdi@gmail.com') {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const origW = img.naturalWidth || img.width || 1200;
        const origH = img.naturalHeight || img.height || 900;
        const MAX_DIM = 2000;
        let w = origW;
        let h = origH;
        let scale = 1;
        if (Math.max(origW, origH) > MAX_DIM) {
          scale = MAX_DIM / Math.max(origW, origH);
          w = Math.round(origW * scale);
          h = Math.round(origH * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(srcDataUrl);

  if (scale === 1) ctx.drawImage(img, 0, 0, w, h);
  else ctx.drawImage(img, 0, 0, origW, origH, 0, 0, w, h);

  let dnameFont = Math.max(12, Math.floor(w * 0.022));
  let emailFont = Math.max(10, Math.floor(w * 0.016));

  ctx.font = `bold ${dnameFont}px Arial`;
  let dWidth = ctx.measureText(diplomaName).width;
  if (dWidth > w * 0.92 && dWidth > 0) {
    const scale = (w * 0.92) / dWidth;
    dnameFont = Math.max(10, Math.floor(dnameFont * scale));
  }
  ctx.font = `bold ${emailFont}px Arial`;
  let eWidth = ctx.measureText(email).width;
  if (eWidth > w * 0.92 && eWidth > 0) {
    const scale = (w * 0.92) / eWidth;
    emailFont = Math.max(8, Math.floor(emailFont * scale));
  }

  ctx.save();
  const angle = -26 * Math.PI / 180;
  ctx.translate(w / 2, h / 2);
  ctx.rotate(angle);

  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.textBaseline = 'middle';
  const isRtl = /[\u0600-\u06FF]/.test(String(email)) || /[\u0600-\u06FF]/.test(String(diplomaName));
  const fontFamily = isRtl ? '"Noto Naskh Arabic", Tahoma, Arial, sans-serif' : 'Arial, Helvetica, sans-serif';
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';

  ctx.font = `bold ${emailFont}px ${fontFamily}`;
  eWidth = ctx.measureText(email).width;
  ctx.font = `bold ${dnameFont}px ${fontFamily}`;
  dWidth = ctx.measureText(diplomaName).width;
        const maxTextWidth = Math.max(eWidth, dWidth);
  const spacingX = Math.max(maxTextWidth + 160, Math.floor(w * 0.42));
  const spacingY = Math.max((dnameFont + emailFont) * 2.6, Math.floor(h * 0.14));

        const diag = Math.sqrt(w * w + h * h);
        for (let y = -diag; y < diag; y += spacingY) {
          for (let x = -diag; x < diag; x += spacingX) {
            ctx.font = `bold ${emailFont}px ${fontFamily}`;
            ctx.fillText(email, x, y);
            ctx.font = `bold ${dnameFont}px ${fontFamily}`;
            ctx.fillText(diplomaName, x, y + emailFont * 1.8);
          }
        }
        ctx.restore();

        try {
          resolve(canvas.toDataURL('image/png'));
        } catch (err) {
          resolve(srcDataUrl);
        }
      };
      img.onerror = () => resolve(srcDataUrl);
      img.src = srcDataUrl;
    } catch (err) {
      resolve(srcDataUrl);
    }
  });
}

function clampPan() {
  if (!zoomWrapper.value) return;
  const rect = zoomWrapper.value.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  const s = zoomScale.value;
  const maxX = (s - 1) * w / 2;
  const maxY = (s - 1) * h / 2;
  panX.value = Math.max(-maxX, Math.min(maxX, panX.value));
  panY.value = Math.max(-maxY, Math.min(maxY, panY.value));
}

function onPointerDown(e) {
  if (zoomScale.value <= 1) return;
  dragging.value = true;
  pointerId = e.pointerId;
  e.target.setPointerCapture && e.target.setPointerCapture(pointerId);
  startClientX = e.clientX;
  startClientY = e.clientY;
  startPanX = panX.value;
  startPanY = panY.value;
}

function onPointerMove(e) {
  if (!dragging.value || e.pointerId !== pointerId) return;
  const dx = e.clientX - startClientX;
  const dy = e.clientY - startClientY;
  panX.value = startPanX + dx;
  panY.value = startPanY + dy;
  clampPan();
}

function onPointerUp(e) {
  if (dragging.value && e.pointerId === pointerId) {
    dragging.value = false;
    try { e.target.releasePointerCapture && e.target.releasePointerCapture(pointerId); } catch (err) {}
    pointerId = null;
  }
}
function onWheel(e) {
  const sOld = zoomScale.value;
  const factor = Math.exp(-e.deltaY * 0.002);
  let sNew = Math.max(1, Math.min(10, sOld * factor));

  if (Math.abs(sNew - sOld) < 0.0001) return;

  try {
    const rect = zoomWrapper.value.getBoundingClientRect();
    const containerCenterX = rect.left + rect.width / 2;
    const containerCenterY = rect.top + rect.height / 2;
    const clickX = e.clientX;
    const clickY = e.clientY;
    const Cx = clickX - containerCenterX;
    const Cy = clickY - containerCenterY;
    const r = sNew / sOld;
    const deltaX = (1 - r) * (Cx - panX.value);
    const deltaY = (1 - r) * (Cy - panY.value);
    panX.value = panX.value + deltaX;
    panY.value = panY.value + deltaY;
  } catch (err) {
  }

  zoomScale.value = sNew;
  clampPan();
}
watch(zoomScale, (newVal, oldVal) => {
  if (newVal === 1) {
    panX.value = 0;
    panY.value = 0;
  }
  clampPan();
});
onMounted(() => {
  items.value = diplomas.value.map(() => []);
  visible.value = diplomas.value.map((cat) =>
    cat.diplomes.map(() => false)
  );

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        diplomas.value.forEach((cat, catIndex) => {
          const idx = items.value[catIndex]?.indexOf(entry.target);
          if (idx !== -1) {
            visible.value[catIndex][idx] = true;
            observer.unobserve(entry.target);
          }
        });
      });
    },
    { root: null, threshold: 0.3 }
  );

  setTimeout(() => {
    items.value.flat().forEach((el) => {
      if (el) observer.observe(el);
    });
  }, 100);

  const toPreload = new Set();
  diplomas.value.forEach((cat) => {
    cat.diplomes.forEach((d) => {
      if (d.diplomaImage) toPreload.add(getAssetPath(`/degrees/${d.diplomaImage}`));
      if (d.image) toPreload.add(getAssetPath(`/degrees/${d.image}`));
    });
  });
  toPreload.forEach((url) => {
    fetchAssetAsDataUrl(url)
      .then((dataUrl) => {
        preloadedCache.set(url, dataUrl);
      })
      .catch(() => {
        preloadedCache.set(url, url);
      });
  });
  window.addEventListener('keydown', keyDownHandler, { passive: false });
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
  window.removeEventListener('keydown', keyDownHandler);
});
</script>
