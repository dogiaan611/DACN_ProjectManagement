import { authFetch } from './auth.js';
import { ProjectSidebar } from './project-sidebar.js';

document.addEventListener("DOMContentLoaded", async () => {
  
  try {
    

    // --- BÂY GIỜ: Sidebar đã có trong trang, chúng ta có thể lấy và cập nhật các phần tử của nó ---
    // 1. Tải sidebar
    const container = document.getElementById("sidebar-container");
    if (container) {
      const cacheBuster = `v=${Date.now()}`;
      const sidebarResponse = await fetch(`/components/sidebar.html?${cacheBuster}`, { cache: "no-store" });
      container.innerHTML = await sidebarResponse.text();
    }

    // 2. Tải thông tin người dùng và điền vào sidebar
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
    
     // --- 3. Khởi tạo ProjectSidebar ---
    window.projectSidebar = new ProjectSidebar();
    window.projectSidebar.init();
    // --- 4. Gắn event chuyển trang bằng pushState ---
    setupNavigation();

    // --- 5. Load nội dung trang hiện tại ---
    await loadPage(location.pathname);
  } catch (error) {
    console.error("Không thể tải sidebar:", error);
  }

  function setupNavigation() {
  document.body.addEventListener("click", async (e) => {
    const link = e.target.closest("a[data-spa-link]");
    if (!link) return;

    e.preventDefault(); // Ngăn reload trang
    const url = link.getAttribute("href");
    history.pushState(null, "", url); // Cập nhật URL
    await loadPage(url); // Chỉ tải lại phần main-content
  });

  window.addEventListener("popstate", async () => {
    await loadPage(location.pathname);
  });
}

async function loadPage(path) {
  const main = document.getElementById("main-content");
  if (!main) return;

  try {
    // Xử lý trường hợp trang chủ. Nếu path là '/' thì tải 'home.html'.
    const pagePath = path === '/' ? '/index' : path;

    const res = await fetch(`/pages${pagePath}.html?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Page not found: ${path}`);
    const html = await res.text();
    main.innerHTML = html;
  } catch (err) {
    main.innerHTML = `<div class="text-red-500 p-4">Không thể tải trang: ${path}</div>`;
    console.error(err);
  }
}
});
