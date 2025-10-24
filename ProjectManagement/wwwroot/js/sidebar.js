document.addEventListener("DOMContentLoaded", async () => {
  try {
    const container = document.getElementById("sidebar-container");
    if (!container) return;

    // Bypass browser cache so edits in /components/sidebar.html show up immediately
    const cacheBuster = `v=${Date.now()}`;
    const response = await fetch(`/components/sidebar.html?${cacheBuster}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    container.innerHTML = html;

    // After injecting the sidebar, bind interactions
    const link = document.getElementById("link");
    const r2 = document.getElementById("r2");
    const r1 = document.getElementById("r1");

    function toggleOpacity(showEl, hideEl) {
      if (!showEl || !hideEl) return;
      showEl.classList.replace("opacity-0", "opacity-[1]");
      hideEl.classList.replace("opacity-[1]", "opacity-0");
    }

    if (link && r1 && r2) {
      // hover icon
      link.addEventListener("mouseenter", () => toggleOpacity(r1, r2));
      link.addEventListener("mouseleave", () => toggleOpacity(r2, r1));
    }

    const favouriteBookmarkButton = document.getElementById("favourite-bookmark");
    const favouriteBookmarkItems = document.getElementById("favourite-bookmark-items");

    if (favouriteBookmarkButton && favouriteBookmarkItems) {
      favouriteBookmarkButton.addEventListener("click", () => {
        const isExpanded = favouriteBookmarkButton.getAttribute("aria-expanded") === "true";
        favouriteBookmarkButton.setAttribute("aria-expanded", String(!isExpanded));
        favouriteBookmarkItems.classList.toggle("hidden");
      });
    }

    // Khởi tạo project sidebar sau khi sidebar được inject
    setTimeout(() => {
      if (typeof window.projectSidebar !== 'undefined') {
        window.projectSidebar.reinit();
      }
    }, 100);
  } catch (error) {
    console.error("Không thể tải sidebar:", error);
  }
});
