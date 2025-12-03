import { authFetch, clearToken } from './auth.js';
import { ProjectSidebar } from './project-sidebar.js';
import { open as openCreateProjectModal } from './project-modal.js';
import { open as openSettingsModal } from './settings-modal.js';
import { open as openDropdownModal } from './sidebar-dropdown.js';
import { initHome } from './home.js';
import { initProjectDetail } from './project-detail.js';
import { loadUserList } from './admin-user-list.js';
import { initNotification, updateNotificationBadge } from './notification.js';

document.addEventListener("DOMContentLoaded", async () => {

  try {


    // --- BÂY GIỜ: Sidebar đã có trong trang, chúng ta có thể lấy và cập nhật các phần tử của nó ---
    // 1. Tải sidebar
    const container = document.getElementById("sidebar-container");
    if (container) {
      const cacheBuster = `v=${Date.now()}`;
      const sidebarResponse = await fetch(`/components/sidebar.html?${cacheBuster}`, { cache: "no-store" });
      container.innerHTML = await sidebarResponse.text();
      updateNotificationBadge();
    }


    // 2. Tải thông tin người dùng và điền vào sidebar
    try {
      const res = await authFetch('/user/read'); // Dùng hàm authFetch từ auth.js
      if (res.ok) {
        const data = await res.json();
        const nameEl = document.querySelector('#us-name-sidebar');
        const avataEl = document.getElementById('us-avatar-sidebar');

        if (nameEl && data) nameEl.textContent = data.name ?? data.Name ?? 'User';
        if (avataEl && data) {
          avataEl.src = data.avatarUrl;
          avataEl.alt = data.name ?? data.Name ?? 'User';
        }

        // Hiển thị link admin nếu người dùng có vai trò là SystemAdmin (SystemRole === 0)
        const adminLink = document.getElementById('admin-user-link');
        if (adminLink && data.systemRole === 0) {
          adminLink.classList.remove('hidden');
        }

      }
    } catch (err) {
      console.error('Load user for sidebar failed:', err);
    }

    // --- 3. Khởi tạo ProjectSidebar ---
    window.projectSidebar = new ProjectSidebar();
    window.projectSidebar.init();
    // --- 4. Gắn event chuyển trang bằng pushState ---
    const createProjectBtn = document.getElementById('open-create-project');
    if (createProjectBtn) {
      createProjectBtn.addEventListener('click', () => {
        // Hàm open từ project-modal.js đã được đổi tên thành openCreateProjectModal để tránh trùng lặp
        openCreateProjectModal();
      });
    }

    const settingsBtn = document.getElementById('settings-button');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => openSettingsModal());
    }

    const dropdownOpen = document.getElementById("dropdown-btn");
    if (dropdownOpen) {
      dropdownOpen.addEventListener('click', () => openDropdownModal());
    }
    setupNavigation();

    // --- 5. Load nội dung trang hiện tại ---
    await loadPage(location.pathname);
  } catch (error) {
    console.error("Không thể tải sidebar:", error);
  }

  function setupNavigation() {
    // Xử lý các link có attribute data-spa-link
    document.body.addEventListener("click", async (e) => {
      const link = e.target.closest("a[data-spa-link]");
      if (!link) return;

      e.preventDefault(); // Ngăn reload trang
      const url = link.getAttribute("href");
      if (!url) return;
      history.pushState(null, "", url); // Cập nhật URL
      await loadPage(url); // Chỉ tải lại phần main-content
    });

    // Xử lý các link sidebar (Home, Tasks, Activity, Inbox)
    document.body.addEventListener("click", async (e) => {
      // Tìm link trong sidebar container
      const sidebarContainer = document.getElementById('sidebar-container');
      if (!sidebarContainer) return;

      const link = e.target.closest("a[id='sidebar-link'], a[id='admin-user-link']");
      if (!link || !sidebarContainer.contains(link)) return;

      const href = link.getAttribute("href");
      // Chỉ xử lý nếu có href và không rỗng
      if (!href || href === '') return;

      // Bỏ qua các link external hoặc anchor
      if (href.startsWith('http') || href.startsWith('#')) return;

      e.preventDefault(); // Ngăn reload trang
      history.pushState(null, "", href); // Cập nhật URL
      await loadPage(href); // Chỉ tải lại phần main-content
    });

    window.addEventListener("popstate", async () => {
      await loadPage(location.pathname + location.search);
    });
  }

});

export async function loadPage(url) {
  try {
    // Tách path và query string
    const urlObj = new URL(url, window.location.origin);
    let pagePath = urlObj.pathname;

    // Xử lý trường hợp trang chủ
    if (pagePath === '/' || pagePath === '/index.html') {
      pagePath = '/index.html';
    } else if (!pagePath.endsWith('.html')) {
      pagePath = `${pagePath}.html`;
    }

    // Update active state in sidebar
    updateSidebarActiveState(pagePath);

    // Load HTML từ đúng vị trí (root, không phải /pages/)
    // Query string vẫn được giữ trong window.location nhờ history.pushState
    const fetchUrl = `${pagePath}?v=${Date.now()}`;
    const res = await fetch(fetchUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`Page not found: ${pagePath}`);
    const html = await res.text();

    // Parse HTML để lấy phần main content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Tìm main element hiện tại trong DOM
    let targetContainer = document.querySelector('main');

    // Nếu không có main, tìm project-detail-container (cho trang project)
    if (!targetContainer) {
      targetContainer = document.getElementById('project-detail-container');
    }

    // Nếu vẫn không có, tạo main mới sau sidebar
    if (!targetContainer) {
      const sidebarContainer = document.getElementById('sidebar-container');
      if (sidebarContainer && sidebarContainer.parentElement) {
        const newMain = doc.querySelector('main') || doc.querySelector('#project-detail-container');
        if (newMain) {
          const cloned = newMain.cloneNode(true);
          // Giữ nguyên id nếu có
          if (newMain.id) {
            cloned.id = newMain.id;
          }
          sidebarContainer.parentElement.insertBefore(cloned, sidebarContainer.nextSibling);
          targetContainer = document.querySelector('main') || document.getElementById('project-detail-container');
        }
      }
    } else {
      // Thay thế nội dung của container hiện tại
      const newContent = doc.querySelector('main') || doc.querySelector('#project-detail-container');
      if (newContent) {
        // Cập nhật id nếu cần
        if (newContent.id && targetContainer.id !== newContent.id) {
          targetContainer.id = newContent.id;
        }
        // Cập nhật class nếu cần
        if (newContent.className) {
          targetContainer.className = newContent.className;
        }
        // Thay thế nội dung
        targetContainer.innerHTML = newContent.innerHTML;
      }
    }

    if (!targetContainer) {
      throw new Error('Không tìm thấy container để load nội dung');
    }

    // Nếu là trang project, đảm bảo các modals được append vào body
    if (pagePath.includes('project.html')) {
      // Tìm các modals trong HTML đã parse
      const modals = doc.querySelectorAll('#invite-modal, #invite-backdrop, #edit-modal, #edit-backdrop, #del-conf-modal, #del-conf-backdrop');
      modals.forEach(modal => {
        // Kiểm tra xem modal đã tồn tại chưa
        const existingModal = document.getElementById(modal.id);
        if (!existingModal) {
          // Nếu chưa tồn tại, append vào body
          document.body.appendChild(modal.cloneNode(true));
        } else {
          // Nếu đã tồn tại, cập nhật nội dung nếu cần (giữ lại để tránh mất state)
          // Chỉ cập nhật nếu có thay đổi về structure
        }
      });
    }

    // Gọi hàm init tương ứng dựa trên route
    // Sử dụng requestAnimationFrame để đảm bảo DOM đã được render
    requestAnimationFrame(() => {
      if (pagePath === '/index.html' || pagePath === '/') {
        // Gọi initHome
        initHome().catch(err => console.error('Lỗi khi khởi tạo trang home:', err));
      } else if (pagePath.includes('project.html')) {
        // Đợi thêm một chút để đảm bảo DOM đã được render hoàn toàn
        setTimeout(() => {
          initProjectDetail().catch(err => console.error('Lỗi khi khởi tạo trang project:', err));
        }, 50);
      } else if (pagePath.includes('adminUser.html')) {
        loadUserList().catch(err => console.error('Lỗi khi khởi tạo trang admin user:', err));
      } else if (pagePath.includes('notification.html')) {
        initNotification().catch(err => console.error('Lỗi khi khởi tạo trang notification:', err));
      }
    });

  } catch (err) {
    console.error('Lỗi khi load trang:', err);
    const main = document.querySelector('main') || document.getElementById('project-detail-container');
    if (main) {
      main.innerHTML = `<div class="text-red-500 p-4">Không thể tải trang: ${url}</div>`;
    }
  }
}

function updateSidebarActiveState(path) {
  const sidebarLinks = document.querySelectorAll("a[id='sidebar-link'], a[id='admin-user-link']");
  const currentPath = new URL(path, window.location.origin).pathname;

  sidebarLinks.forEach(link => {
    const href = link.getAttribute("href");
    if (!href) return;

    const linkPath = new URL(href, window.location.origin).pathname;

    // Handle root path normalization
    const isRootCurrent = currentPath === '/' || currentPath === '/index.html';
    const isRootLink = linkPath === '/' || linkPath === '/index.html';

    if (isRootCurrent && isRootLink) {
      link.classList.add("bg-gray-100");
    } else if (!isRootCurrent && currentPath === linkPath) {
      link.classList.add("bg-gray-100");
    } else {
      link.classList.remove("bg-gray-100");
    }
  });
}