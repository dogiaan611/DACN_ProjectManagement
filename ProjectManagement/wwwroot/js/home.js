import { authFetch } from './auth.js';
import { loadPage } from './sidebar.js';

// Hàm khởi tạo, sẽ được gọi bởi SPA router
export async function initHome() {
    const projectsListContainer = document.getElementById('projects-list-container');

    if (!projectsListContainer) {
        console.error("Projects list container not found. Make sure an element with id 'projects-list-container' exists.");
        return;
    }

    async function loadProject() {
        try {
            const response = await authFetch('/projects/read');
            if (!response.ok) throw new Error('Failed to load projects');
            const projects = await response.json();
            renderProject(projects);
        } catch (error) {
            console.error('Failed to load projects:', error);
            projectsListContainer.innerHTML = `
                <div class="text-center p-4 text-red-500">
                    Không thể tải danh sách dự án. Vui lòng thử lại sau.
                </div>
            `;
        }
    }

    function renderProject(projects) {
        projectsListContainer.innerHTML = ``;


        if (!projects || projects.length === 0) {
            projectsListContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center border rounded-md bg-gray-100 mx-auto p-10 w-full">
                    <div class="relative flex items-center justify-center w-48 h-32 mb-2">
                      <!-- Icon 1 -->
                      <div class="absolute flex items-center justify-center w-10 h-10 p-2 bg-white rounded-md shadow-sm"
                           style="transform: translate(-70px, 30px) rotate(-20deg);">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>
                        </svg>
                      </div>

                      <!-- Icon 2 -->
                      <div class="absolute flex items-center justify-center w-10 h-10 p-2 bg-white rounded-md shadow-sm"
                           style="transform: translate(0, -20px);">
                        <svg xmlns="http://www.w3.org/2000/svg"
                             class="w-5 h-5 text-gray-700"
                             fill="none"
                             viewBox="0 0 24 24"
                             stroke="currentColor"
                             stroke-width="1.5"
                             stroke-linecap="round"
                             stroke-linejoin="round">
                          <path d="m16 18 6-6-6-6"/>
                          <path d="m8 6-6 6 6 6"/>
                        </svg>
                      </div>

                      <!-- Icon 3 -->
                      <div class="absolute flex items-center justify-center w-10 h-10 p-2 bg-white rounded-md shadow-sm"
                           style="transform: translate(70px, 30px) rotate(20deg);">
                        <svg xmlns="http://www.w3.org/2000/svg"
                             class="w-5 h-5 text-gray-700"
                             fill="none"
                             viewBox="0 0 24 24"
                             stroke="currentColor"
                             stroke-width="1.5"
                             stroke-linecap="round"
                             stroke-linejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                        </svg>
                      </div>
                    </div>

                    <div class="text-center text-xl text-gray-700 font-medium">
                        Chưa có dự án nào
                    </div>
                    <div class="text-center text-gray-500">
                        Hãy tạo một dự án mới!
                    </div>
                </div>
            `;
            return;
        }

        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'bg-white relative select-none overflow-hidden w-[144px] h-[144px] rounded-lg border p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer justify-stretch flex flex-col';
            projectCard.addEventListener('click', async () => {
                const url = `/project.html?id=${project.projectId}`;
                history.pushState(null, "", url);
                // Gọi hàm loadPage đã được toàn cục hóa từ sidebar.js
                await loadPage(url);
            });

            const typeIcon = project.type === 1 // 1 là Scrum, 0 là Kanban
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-pie-icon text-blue-500"><path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dashed-kanban-icon lucide-square-dashed-kanban text-green-500"><path d="M8 7v7"/><path d="M12 7v4"/><path d="M16 7v9"/><path d="M5 3a2 2 0 0 0-2 2"/><path d="M9 3h1"/><path d="M14 3h1"/><path d="M19 3a2 2 0 0 1 2 2"/><path d="M21 9v1"/><path d="M21 14v1"/><path d="M21 19a2 2 0 0 1-2 2"/><path d="M14 21h1"/><path d="M9 21h1"/><path d="M5 21a2 2 0 0 1-2-2"/><path d="M3 14v1"/><path d="M3 9v1"/></svg>';

            projectCard.innerHTML = `
                <div class="flex items-center w-full flex-grow">
                    <div class="flex flex-col justify-between relative gap-2 w-full flex-grow min-h-20">
                        <div class="overflow-hidden text-ellipsis font-medium text-sm w-auto">
                            ${project.name}
                        </div>
                        <div class="absolute bottom-0 left-1 flex items-center justify-start gap-2">
                            <div class="flex items-center gap-2">
                                <img
                                    src="${project.createdBy?.avatarUrl || '/images/default-avatar.png'}"
                                    alt="${project.created5y?.name || 'Unknown'}"
                                    class="w-5 h-5 rounded-full object-cover"
                                />
                            </div>
                            <div class="flex justify-end items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock-fading-icon lucide-clock-fading"><path d="M12 2a10 10 0 0 1 7.38 16.75"/><path d="M12 6v6l4 2"/><path d="M2.5 8.875a10 10 0 0 0-.5 3"/><path d="M2.83 16a10 10 0 0 0 2.43 3.4"/><path d="M4.636 5.235a10 10 0 0 1 .891-.857"/><path d="M8.644 21.42a10 10 0 0 0 7.631-.38"/></svg>
                                <span class="text-gray-600 text-xs ">${new Date(project.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            projectsListContainer.appendChild(projectCard);
        });
    }

    // Load projects when the page loads
    await loadProject();
}

document.addEventListener('DOMContentLoaded', initHome);
// ${typeIcon}
//                     <h3 class="text-xl font-semibold text-gray-800 truncate" title="${project.name}">
//                         ${project.name}
//                     </h3>