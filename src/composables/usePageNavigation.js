import { onMounted, onUnmounted } from "vue";

export function usePageNavigation(containerSelector = ".pages") {
  let container = null;
  let pages = [];
  let currentPage = 0;
  let isScrolling = false;

  const goToPage = (index) => {
    if (!container) return;
    if (index < 0 || index >= pages.length) return;

    currentPage = index;
    isScrolling = true;

    pages[index].scrollIntoView({ behavior: "smooth" });

    // Attendre que le scroll termine avant de réaccepter une touche
    setTimeout(() => {
      isScrolling = false;
    }, 700);
  };

  const handleKeyDown = (e) => {
    if (isScrolling) return; // ignore si déjà en mouvement
    if (e.key === "ArrowDown") {
      goToPage(currentPage + 1);
    } else if (e.key === "ArrowUp") {
      goToPage(currentPage - 1);
    }
  };

  onMounted(() => {
    container = document.querySelector(containerSelector);
    pages = container.querySelectorAll(".page");
    window.addEventListener("keydown", handleKeyDown);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyDown);
  });

  return { goToPage };
}
