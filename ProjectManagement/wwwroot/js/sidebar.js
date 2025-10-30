import { authFetch } from './auth.js';
import { ProjectSidebar } from './project-sidebar.js';

document.addEventListener("DOMContentLoaded", async () => {
  
  try {
    const container = document.getElementById("sidebar-container");
    if (!container) return;

    const cacheBuster = `v=${Date.now()}`;
    const sidebarResponse = await fetch(`/components/sidebar.html?${cacheBuster}`, { cache: "no-store" });
    if (!sidebarResponse.ok) throw new Error(`HTTP error! status: ${sidebarResponse.status}`);
    
    const html = await sidebarResponse.text();
    container.innerHTML = html;

    // --- BÂY GIỜ: Sidebar đã có trong trang, chúng ta có thể lấy và cập nhật các phần tử của nó ---
    
    // 1. Tải thông tin người dùng và điền vào sidebar
    try {
      const res = await authFetch('/user/read'); // Dùng hàm authFetch từ auth.js
      if (res.ok) {
        const data = await res.json();
        const nameEl = document.querySelector('#us-name-sidebar');
        const emailEl = document.querySelector('#us-email-sidebar');
        
        if (nameEl && data) nameEl.textContent = data.name ?? data.Name ?? 'User';
        if (emailEl && data) emailEl.textContent = data.email ?? data.Email ?? '';
      }
    } catch (err) {
      console.error('Load user for sidebar failed:', err);
    }
    
    // 2. Gắn các sự kiện tương tác cho sidebar
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

    // Khởi tạo project sidebar sau khi sidebar HTML đã được chèn vào DOM
    window.projectSidebar.init();
  } catch (error) {
    console.error("Không thể tải sidebar:", error);
  }
});
