// Quản lý hiển thị projects trong sidebar
class ProjectSidebar {
  constructor() {
    this.projectsContainer = null;
    this.init();
  }

  init() {
    // Đợi sidebar được load xong
    const checkSidebar = () => {
      this.projectsContainer = document.getElementById('recent-project')?.querySelector('.flex.flex-col.gap-\\[1px\\]');
      if (this.projectsContainer) {
        this.loadProjects();
      } else {
        setTimeout(checkSidebar, 100);
      }
    };
    checkSidebar();
  }

  // Method để khởi tạo lại nếu cần
  reinit() {
    this.projectsContainer = null;
    this.init();
  }

  async loadProjects() {
    try {
      const token = localStorage.getItem('pm_jwt') || '';
      const headers = new Headers({ "Accept": "application/json" });
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const response = await fetch('/projects/read', { headers });
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
        <div class="px-3 text-sm text-center text-gray-500">
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
    div.className = 'flex items-center justify-between px-5 py-2 hover:bg-gray-100 rounded transition-colors duration-200 cursor-pointer group';
    const typeIcon = project.type === 'Scrum'
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

  openProject(project) {
    // TODO: Implement navigation to project detail page
    console.log('Opening project:', project);
    // Có thể redirect đến trang chi tiết project
    // window.location.href = `/project/${project.projectId}`;
  }

  // Method để refresh sidebar sau khi tạo project mới
  refresh() {
    this.loadProjects();
  }
}

// Khởi tạo global instance
window.projectSidebar = new ProjectSidebar();

// Export để sử dụng trong các file khác
window.refreshProjectSidebar = () => {
  if (window.projectSidebar) {
    window.projectSidebar.refresh();
  }
};
