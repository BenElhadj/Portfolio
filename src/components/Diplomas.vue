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
              :src="popupImage"
              class="popup-image"
              :style="{ transform: `scale(${zoomScale})` }"
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
// Map original URL -> dataURL (string) for immediate reuse
const preloadedCache = new Map();
const zoomWrapper = ref(null);
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
  // Best-effort: detect PrintScreen key but we can't reliably block OS screenshot.
  // No overlay toggling is done because the watermark will be baked into the image.
  if (e.key === 'PrintScreen') {
    // noop
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
  // If a base64 variant of the image exists (named like `name_64.txt`), prefer it.
  // This file should contain either a full data URL or raw base64 of the image bytes.
  try {
    const maybeBase64Name = image.replace(/\.svg$/i, "_64.txt");
    const base64Url = getAssetPath(`/degrees/${maybeBase64Name}`);
    // attempt to fetch the base64 file synchronously in the flow; if present use it
    // Note: we don't await here to keep the same promise flow; we perform a fetch
    // and if it resolves we short-circuit the rest by returning early.
    fetch(base64Url, { cache: 'force-cache' })
      .then((res) => {
        if (!res.ok) return null;
        return res.text();
      })
      .then((txt) => {
        if (!txt) return;
        const content = String(txt).trim();
        let dataUrl;
        if (content.startsWith('data:')) {
          dataUrl = content;
        } else {
          // assume SVG base64 unless content indicates otherwise
          dataUrl = `data:image/svg+xml;base64,${content}`;
        }
        // cache original URL -> dataURL so existing cache logic can reuse it
        preloadedCache.set(url, dataUrl);
        // if a watermarked version already exists, use it
        const wmKeyExisting = url + '::wm::' + encodeURIComponent(popupDegree.value || '');
        if (preloadedCache.has(wmKeyExisting)) {
          popupImage.value = preloadedCache.get(wmKeyExisting) || dataUrl;
          popupLoading.value = false;
          popupVisible.value = true;
          return;
        }
        // show original immediately
        popupImage.value = dataUrl;
        popupVisible.value = true;
        if (isDiplomaPopup.value) {
          popupLoading.value = true;
          // pick email based on locale (Arabic support)
          const emailToUse = String(locale.value).startsWith('ar')
            ? 'بن_الحاج_حمدي_42bhamdi@gmail.com'
            : 'BEN_ELHADJ_Hamdi_42bhamdi@gmail.com';
          applyWatermarkToImage(dataUrl, popupDegree.value, emailToUse).then((wmData) => {
            preloadedCache.set(wmKeyExisting, wmData);
            popupImage.value = wmData;
          }).catch(() => {
            popupImage.value = dataUrl;
          }).finally(() => {
            popupLoading.value = false;
          });
        }
      })
      .catch(() => {
        // ignore and continue with normal logic
      });
  } catch (err) {
    // ignore and continue
  }
  // We support a cached "watermarked" version to avoid re-drawing repeatedly.
  const wmKey = url + '::wm::' + encodeURIComponent(popupDegree.value || '');
  const emailToUse = String(locale.value).startsWith('ar')
    ? 'بن_الحاج_حمدي_42bhamdi@gmail.com'
    : 'BEN_ELHADJ_Hamdi_42bhamdi@gmail.com';
  // If a watermarked version already exists in cache, reuse it
  if (preloadedCache.has(wmKey)) {
    popupImage.value = preloadedCache.get(wmKey) || url;
    popupLoading.value = false;
    popupVisible.value = true;
    return;
  }

  // If original resource is cached but not watermarked, show it immediately
  // and generate the watermarked version in background (so the UI is fast).
  if (preloadedCache.has(url)) {
    const orig = preloadedCache.get(url) || url;
    popupImage.value = orig;
    popupVisible.value = true;
    // If this is a diploma, start watermark generation in background
    if (isDiplomaPopup.value) {
      popupLoading.value = true; // show overlay spinner but keep image visible
      // choose email based on locale (Arabic locale uses Arabic name/email)
      const emailToUse = String(locale.value).startsWith('ar')
        ? 'بن_الحاج_حمدي_42bhamdi@gmail.com'
        : 'BEN_ELHADJ_Hamdi_42bhamdi@gmail.com';
      applyWatermarkToImage(orig, popupDegree.value, emailToUse).then((wmData) => {
        preloadedCache.set(wmKey, wmData);
        popupImage.value = wmData;
      }).catch(() => {
        // keep original if watermark fails
        popupImage.value = orig;
      }).finally(() => {
        popupLoading.value = false;
      });
    } else {
      popupLoading.value = false;
    }
    return;
  }

  // otherwise fetch and (if diploma) bake watermark into the fetched data
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
          // show original immediately
          popupImage.value = dataUrl;
          if (isDiplomaPopup.value) {
            popupLoading.value = true;
            return applyWatermarkToImage(dataUrl, popupDegree.value, emailToUse).then((wm) => {
              preloadedCache.set(wmKey, wm);
              popupImage.value = wm;
            }).catch(() => {
              // keep SVG as-is
            }).finally(() => {
              popupLoading.value = false;
            });
          }
          return;
        });
      }
      return res.blob().then((blob) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result;
          preloadedCache.set(url, dataUrl);
          // show original immediately
          popupImage.value = dataUrl;
          if (isDiplomaPopup.value) {
            popupLoading.value = true;
            applyWatermarkToImage(dataUrl, popupDegree.value, emailToUse).then((wm) => {
              preloadedCache.set(wmKey, wm);
              popupImage.value = wm;
              resolve();
            }).catch(() => {
              // keep original
              resolve();
            }).finally(() => {
              popupLoading.value = false;
            });
            return;
          }
          popupLoading.value = false;
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

// Draw watermark text directly onto the image using a canvas so the text becomes
// part of the image (not an overlay). Returns a PNG data URL or the original
// source if something fails.
function applyWatermarkToImage(srcDataUrl, diplomaName, email = 'BEN_ELHADJ_Hamdi_42bhamdi@gmail.com') {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // If image is very large, downscale for watermarking to improve speed and
        // keep the resulting data-URL reasonably sized. We'll use a max dimension.
        const origW = img.naturalWidth || img.width || 1200;
        const origH = img.naturalHeight || img.height || 900;
        const MAX_DIM = 2000; // max width or height to process
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

  // Draw original image (scale down if necessary)
  if (scale === 1) ctx.drawImage(img, 0, 0, w, h);
  else ctx.drawImage(img, 0, 0, origW, origH, 0, 0, w, h);

  // Font sizes relative to processed width to keep watermark subtle and fast
  let dnameFont = Math.max(12, Math.floor(w * 0.022));
  let emailFont = Math.max(10, Math.floor(w * 0.016));

        // Ensure text fits horizontally; reduce size if needed
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

        // Draw repeated diagonal watermark
        ctx.save();
        const angle = -26 * Math.PI / 180;
        ctx.translate(w / 2, h / 2);
        ctx.rotate(angle);
  // Slightly lower opacity so watermark is less dominant
  // Reduced to 0.08 for a more subtle watermark (can tweak to taste)
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  ctx.textBaseline = 'middle';
  // detect RTL (Arabic) by presence of Arabic unicode range in email or diploma name
  const isRtl = /[\u0600-\u06FF]/.test(String(email)) || /[\u0600-\u06FF]/.test(String(diplomaName));
  // choose font family suitable for Arabic when needed
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
          // If we scaled down for processing, we return the scaled watermarked image.
          // This keeps the data URL size smaller and speeds up rendering.
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

// cycleZoom removed — not used. Zoom controlled by wheel and range input.

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
/* Spinner overlay shown on top of the image while watermark is generated */
.popup-spinner-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.0);pointer-events:none;font-weight:700;color:var(--text)}

/* Zoom wrapper */
/* .zoom-lens removed as it's unused */

/* Keep zoomed image inside the popup frame */
.zoom-wrapper{position:relative;display:inline-block;max-width:100%;overflow:hidden}
.pan-wrapper{display:block}
.pan-wrapper{touch-action:none}
.pan-wrapper{cursor:grab}
.pan-wrapper.dragging{cursor:grabbing}
.zoom-wrapper .popup-image{transition:transform 320ms cubic-bezier(.2,.8,.2,1);transform-origin:center center;display:block;margin:0 auto;max-width:100%;max-height:80vh}
.zoom-control{display:flex;align-items:center;gap:8px}
.zoom-control input[type="range"]{width:220px}
.zoom-value{font-weight:600;padding-left:6px}
.zoom-icon{display:inline-flex;align-items:center;justify-content:center;color:var(--text);opacity:0.7;margin-right:6px}
.zoom-icon svg{display:block}

.diploma-name{font-weight:700;max-width:360px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}

</style>
