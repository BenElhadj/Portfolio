<template>
  <div class="wrapper">
    <h2 class="title">{{ $t("diplomas.title") }}</h2>
    <div class="timeline" aria-label="Timeline des diplômes">
      <PageLayout :columns="1" :rows="diplomas.length">
        <template
          v-for="(cat, catIndex) in diplomas"
          :key="catIndex"
          v-slot:[`slot${catIndex+1}`]
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
                  <!-- Remplacement du dot par l'image du diplôme -->
                  <div
                    class="degree-thumb"
                    role="button"
                    tabindex="0"
                    @click.stop.prevent="openLogo(d)"
                    @keydown.enter.prevent="openLogo(d)"
                    @keydown.space.prevent="openLogo(d)"
                    :title="`Voir logo ${d.institution}`"
                  >
                    <img v-if="d.image" :src="getAssetPath(`/degrees/${d.image}`)" :alt="d.degree" />
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

    <!-- Popup -->
    <Popup
        :visible="popupVisible"
        :title="popupTitle"
        @close="handleClose"
      >
    <template #controls v-if="isDiplomaPopup">
      <div class="zoom-control">
        <span class="zoom-icon" aria-hidden="true" title="Zoom">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">
            <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="11" cy="11" r="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </span>
        <!-- Diplôme name centered next to controls -->
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
        <div class="diploma-name" v-if="popupDegree" style="flex:1; text-align:center;">{{ popupDegree }}</div>
      </div>
    </template>
        <div v-if="popupLoading" class="popup-spinner">{{ $t('diplomas.loading') || 'Chargement...' }}</div>
        <div v-else-if="popupImage" class="zoom-wrapper" ref="zoomWrapper">
          <!-- If this is a diploma popup we enable zoom/pan and watermark -->
          <div
            v-if="isDiplomaPopup"
            class="pan-wrapper"
            :class="{ dragging: dragging }"
            :style="{ transform: `translate(${panX}px, ${panY}px)` }"
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
              ref="popupImg"
              :src="popupImage"
              class="popup-image"
              :style="{ transform: `scale(${zoomScale})` }"
              alt="diploma"
              draggable="false"
              @dragstart.prevent
            />
            <!-- repeating SVG watermark (data-URL) -->
            <div
              class="diploma-watermark"
              v-if="watermarkDataUrl"
              :style="watermarkStyle"
            ></div>
          </div>
          <!-- For logos we show a simple image without zoom/pan/watermark -->
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

const { tm } = useI18n();

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
// Map original URL -> dataURL (string) for immediate reuse
const preloadedCache = new Map();
const zoomWrapper = ref(null);
const popupImg = ref(null);
const isDiplomaPopup = ref(false);
// continuous zoom scale (1.0 .. 10.0)
const zoomScale = ref(1);
// Panning state (px)
const panX = ref(0);
const panY = ref(0);
const dragging = ref(false);
let pointerId = null;
let startClientX = 0;
let startClientY = 0;
let startPanX = 0;
let startPanY = 0;
// Prevent common save/copy shortcuts and PrintScreen detection best-effort
function keyDownHandler(e) {
  // Only act when a diploma popup is active
  if (!isDiplomaPopup.value) return;

  // Block Ctrl+S, Ctrl+P, Ctrl+Shift+S
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || (e.shiftKey && e.key === 'S'))) {
    e.preventDefault();
    e.stopPropagation();
  }
  // Best-effort: detect PrintScreen key and briefly flash watermark (can't block OS screenshot)
  if (e.key === 'PrintScreen') {
    // briefly toggle watermark opacity to make screenshot include it consistently
    const el = zoomWrapper.value?.querySelector('.diploma-watermark');
    if (el) {
      el.style.transition = 'opacity 120ms';
      el.style.opacity = '0.16';
      setTimeout(() => (el.style.opacity = '0.12'), 300);
    }
  }
}

function openPopup(d) {
  // For diplomas we show only the image (no title text) in the popup
  isDiplomaPopup.value = true;
  popupTitle.value = "";
  popupDegree.value = d.degree || "";
  const image = d.diplomaImage || d.image;
  const url = image ? getAssetPath(`/degrees/${image}`) : "";
  if (!url) return;
  // If already preloaded, show immediately
  if (preloadedCache.has(url)) {
    popupImage.value = preloadedCache.get(url) || url;
    popupLoading.value = false;
    popupVisible.value = true;
    return;
  }
  // otherwise show spinner while fetching and caching the resource
  popupLoading.value = true;
  popupImage.value = "";
  popupVisible.value = true;
  fetch(url, { cache: 'force-cache' })
    .then((res) => {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('svg') || url.toLowerCase().endsWith('.svg')) {
        return res.text().then((text) => {
          const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(text)}`;
          preloadedCache.set(url, dataUrl);
          popupImage.value = dataUrl;
        });
      }
      return res.blob().then((blob) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          preloadedCache.set(url, reader.result);
          popupImage.value = reader.result;
          resolve();
        };
        reader.onerror = () => {
          preloadedCache.set(url, url);
          popupImage.value = url;
          resolve();
        };
        reader.readAsDataURL(blob);
      }));
    })
    .catch(() => {
      preloadedCache.set(url, url);
      popupImage.value = url;
    })
    .finally(() => {
      popupLoading.value = false;
    });
}

// Open an enlarged school logo with the institution name as title
function openLogo(d) {
  // logos open in a simple popup without zoom/pan/watermark
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
  fetch(url, { cache: 'force-cache' })
    .then((res) => {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('svg') || url.toLowerCase().endsWith('.svg')) {
        return res.text().then((text) => {
          const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(text)}`;
          preloadedCache.set(url, dataUrl);
          popupImage.value = dataUrl;
        });
      }
      return res.blob().then((blob) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          preloadedCache.set(url, reader.result);
          popupImage.value = reader.result;
          resolve();
        };
        reader.onerror = () => {
          preloadedCache.set(url, url);
          popupImage.value = url;
          resolve();
        };
        reader.readAsDataURL(blob);
      }));
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
  // Reset popup state
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

// Build a repeating diagonal SVG watermark including the email and diploma name
const watermarkDataUrl = computed(() => {
  if (!isDiplomaPopup.value || !popupDegree.value) return "";
  const email = 'BEN_ELHADJ_Hamdi_42bhamdi@gmail.com';
  const diplomaName = popupDegree.value;
  // Estimate required pixel width from longest string and desired font sizes
  const emailFont = 16; // px
  const dnameFont = 20; // px
  const approxCharWidth = (fs) => fs * 0.6; // rough estimate
  const maxLen = Math.max(email.length, diplomaName.length);
  const estWidth = Math.ceil(maxLen * Math.max(approxCharWidth(emailFont), approxCharWidth(dnameFont)));
  // Ensure tile is wide enough and repeat density is good
  const tileWidth = Math.max(4800, estWidth + 1200);
  const tileHeight = 420;
  const step = Math.max(500, Math.floor((estWidth + 400) / 2));
  let texts = '';
  for (let x = 0; x < tileWidth; x += step) {
    const ox = x + 60;
    texts += `  <g transform='translate(${ox},0)'>\n` +
             `    <text x='0' y='150' transform='rotate(-26 0 130)' class='email'>${email}</text>\n` +
             `    <text x='0' y='210' transform='rotate(-26 0 190)' class='dname'>${diplomaName}</text>\n` +
             `  </g>\n`;
  }
  const svg = `<?xml version='1.0' encoding='UTF-8'?>\n` +
    `<svg xmlns='http://www.w3.org/2000/svg' width='${tileWidth}' height='${tileHeight}' viewBox='0 0 ${tileWidth} ${tileHeight}' preserveAspectRatio='xMinYMin meet'>\n` +
    `  <style> .email{fill:rgba(0,0,0,0.18);font-family:Arial,Helvetica,sans-serif;font-weight:800;font-size:${emailFont}px;} .dname{fill:rgba(0,0,0,0.20);font-family:Arial,Helvetica,sans-serif;font-weight:800;font-size:${dnameFont}px;} </style>\n` +
    texts +
    `</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
});

const watermarkStyle = computed(() => {
  if (!watermarkDataUrl.value) return {};
  return {
    backgroundImage: watermarkDataUrl.value,
    backgroundRepeat: 'repeat',
    backgroundPosition: '0 0',
    backgroundSize: `${3600}px ${300}px`,
    opacity: 1,
    pointerEvents: 'none',
    transformOrigin: 'center center',
    // scale watermark with image so it stays aligned
    transform: `scale(${zoomScale.value})`
  };
});

function cycleZoom(e) {
  // Multiply zoom by 2 up to 10x, then reset to 1
  const sOld = zoomScale.value;
  let sNew = Math.min(sOld * 2, 10);
  if (sOld >= 10) sNew = 1;

  if (sNew === 1) {
    zoomScale.value = 1;
    panX.value = 0;
    panY.value = 0;
    return;
  }

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
    // fallback
  }

  zoomScale.value = sNew;
  clampPan();
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
  // start dragging only when zoomed (>1)
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
  // Zoom around cursor position. Use an exponential scale factor for smoothness.
  const sOld = zoomScale.value;
  // scale factor from wheel delta; tuned for comfortable speed
  const factor = Math.exp(-e.deltaY * 0.002);
  let sNew = Math.max(1, Math.min(10, sOld * factor));

  // If nearly equal, do nothing
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
    // deltaPan = (1 - r) * (C - pan)
    const deltaX = (1 - r) * (Cx - panX.value);
    const deltaY = (1 - r) * (Cy - panY.value);
    panX.value = panX.value + deltaX;
    panY.value = panY.value + deltaY;
  } catch (err) {
    // ignore
  }

  zoomScale.value = sNew;
  clampPan();
}
// Keep pan/clamping in sync when zoomStep is changed via the range input
watch(zoomScale, (newVal, oldVal) => {
  if (newVal === 1) {
    panX.value = 0;
    panY.value = 0;
  }
  // ensure pan within bounds for the new zoom
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

  // Preload diploma images and institution icons and cache their data-URIs
  const toPreload = new Set();
  diplomas.value.forEach((cat) => {
    cat.diplomes.forEach((d) => {
      if (d.diplomaImage) toPreload.add(getAssetPath(`/degrees/${d.diplomaImage}`));
      if (d.image) toPreload.add(getAssetPath(`/degrees/${d.image}`));
    });
  });
  toPreload.forEach((url) => {
    // attempt to fetch SVG text and convert to data-uri for instant reuse
    fetch(url, { cache: 'force-cache' })
      .then((res) => {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('svg') || url.toLowerCase().endsWith('.svg')) {
          return res.text().then((text) => {
            const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(text)}`;
            preloadedCache.set(url, dataUrl);
          });
        }
        // for raster images, fallback to blob -> dataURL
        return res.blob().then((blob) => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            preloadedCache.set(url, reader.result);
            resolve();
          };
          reader.onerror = () => {
            preloadedCache.set(url, url);
            resolve();
          };
          reader.readAsDataURL(blob);
        }));
      })
      .catch(() => {
        // if fetch fails, still mark the original url so we attempt to use it
        preloadedCache.set(url, url);
      });
  });
  // register keydown handler to block common save/print shortcuts
  window.addEventListener('keydown', keyDownHandler, { passive: false });
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
  window.removeEventListener('keydown', keyDownHandler);
});
</script>

<style scoped>
.card[role="button"]{cursor:pointer}
/* Popup image sizing and loading spinner */
.popup-image{max-width:900px;max-height:80vh;width:100%;height:auto;display:block;margin:0 auto}
.popup-spinner{display:flex;align-items:center;justify-content:center;padding:40px;font-weight:600;color:var(--text);}

/* Zoom wrapper and lens */
.zoom-wrapper{position:relative;display:inline-block;max-width:100%}
.zoom-lens{position:absolute;border-radius:50%;overflow:hidden;border:2px solid rgba(0,0,0,0.12);box-shadow:0 6px 20px rgba(0,0,0,0.25);pointer-events:none}
.zoom-lens::after{content:'';position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(255,255,255,0.02)}

/* Keep zoomed image inside the popup frame */
.zoom-wrapper{position:relative;display:inline-block;max-width:100%;overflow:hidden}
.pan-wrapper{display:block}
.pan-wrapper{touch-action:none}
.pan-wrapper{cursor:grab}
.pan-wrapper.dragging{cursor:grabbing}
.zoom-wrapper .popup-image{transition:transform 320ms cubic-bezier(.2,.8,.2,1);transform-origin:center center;display:block;margin:0 auto;max-width:100%;max-height:80vh}
.diploma-watermark{position:absolute;inset:0;pointer-events:none;}
.zoom-control{display:flex;align-items:center;gap:8px}
.zoom-control input[type="range"]{width:220px}
.zoom-value{font-weight:600;padding-left:6px}
.zoom-icon{display:inline-flex;align-items:center;justify-content:center;color:var(--text);opacity:0.9;margin-right:6px}
.zoom-icon svg{display:block}

.diploma-name{font-weight:700;max-width:360px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}

</style>
