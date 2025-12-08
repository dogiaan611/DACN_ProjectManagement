import { authFetch } from '../auth/auth.js';
import { loadPage } from '../layout/sidebar.js';

// Quản lý hiển thị projects trong sidebar
export class ProjectSidebar {
  constructor() {
    this.projectsContainer = null;
  }

  init() {
    // Container sẽ được đảm bảo tồn tại khi phương thức này được gọi từ bên ngoài
    this.projectsContainer = document.getElementById('recent-project')?.querySelector('.flex.flex-col.gap-\\[1px\\]');
    if (!this.projectsContainer) {
      console.error("Project sidebar container not found. Make sure sidebar.html is loaded and contains the correct element.");
      return;
    }
    this.loadProjects();
  }

  async loadProjects() {
    try {
      const response = await authFetch('/projects/read');
      if (!response.ok) throw new Error('Failed to load projects');

      const projects = await response.json();
      this.renderProjects(projects);
    } catch (error) {
      console.error('Lỗi khi tải danh sách projects:', error);
    }
  }

  renderProjects(projects) {
    if (!this.projectsContainer) return;

    this.projectsContainer.innerHTML = '';

    if (!projects || projects.length === 0) {
      this.projectsContainer.innerHTML = `
        <div class="px-3 text-sm text-gray-500 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-plus-corner-icon lucide-file-plus-corner"><path d="M11.35 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5.35"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M14 19h6"/><path d="M17 16v6"/></svg>
          Tạo project
        </div>
      `;
      return;
    }

    projects.forEach(project => {
      const projectElement = this.createProjectElement(project);
      this.projectsContainer.appendChild(projectElement);
    });
  }

  createProjectElement(project) {
    const div = document.createElement('div');
    div.role = 'button';
    div.className = 'flex items-center justify-between px-1 py-2 hover:bg-gray-100 rounded transition-colors duration-200 cursor-pointer group';
    const typeIcon = project.type === 1 // 1 là Scrum, 0 là Kanban
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-pie-icon lucide-chart-pie"><path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clipboard-list-icon lucide-clipboard-list"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>';

    div.innerHTML = `
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <div class="w-5 h-5 flex items-center justify-center text-gray-500">
          ${typeIcon}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-[14px] text-gray-500 font-medium truncate" title="${project.name}">
            ${project.name}
          </div>
        </div>
      </div>
      <div class="opacity-0 group-hover:opacity-100 transition-opacity">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </div>
    `;

    // Thêm event listener để xử lý click
    div.addEventListener('click', () => {
      this.openProject(project);
    });

    return div;
  }

  async openProject(project) {
    // API có thể trả về 'id' hoặc 'projectId'. Cần xử lý cả hai trường hợp.
    const projectId = project.id ?? project.projectId;
    console.log('Opening project:', project, 'with ID:', projectId);
    const url = `/project.html?id=${projectId}`;
    // Sử dụng SPA navigation để không reload sidebar
    history.pushState(null, "", url);
    await loadPage(url);
  }

  // Method để refresh sidebar sau khi tạo project mới
  refresh() {
    this.loadProjects();
  }
}

// Khởi tạo một instance toàn cục để các module khác có thể truy cập (ví dụ: project-modal)
window.projectSidebar = new ProjectSidebar();
