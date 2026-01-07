// useLazyImage.js
// Composable Vue pour lazy loading avancé avec Intersection Observer, fade-in et placeholder
import { ref, onMounted, onUnmounted } from 'vue';

export function useLazyImage(placeholder = '') {
  const isVisible = ref(false);
  const loaded = ref(false);
  const imageRef = ref(null);

  let observer = null;

  const onLoad = () => {
    loaded.value = true;
  };

  onMounted(() => {
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            isVisible.value = true;
            observer.disconnect();
          }
        });
      });
      if (imageRef.value) {
        observer.observe(imageRef.value);
      }
    } else {
      // Fallback si IntersectionObserver non supporté
      isVisible.value = true;
    }
  });

  onUnmounted(() => {
    if (observer) observer.disconnect();
  });

  return {
    imageRef,
    isVisible,
    loaded,
    onLoad,
    placeholder
  };
}
