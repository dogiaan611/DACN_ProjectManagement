import { authFetch } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
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
                <div class="text-center p-4 text-gray-500">
                    Chưa có dự án nào. Hãy tạo một dự án mới!
                </div>
            `;
            return;
        }

        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = 'bg-white rounded-lg shadow-md p-4 w-full hover:shadow-lg transition-shadow duration-200 cursor-pointer';
            projectCard.addEventListener('click', () => {
                window.location.href = `/project.html?id=${project.projectId}`;
            });

            const typeIcon = project.type === 1 // 1 là Scrum, 0 là Kanban
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-pie-icon text-blue-500"><path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/></svg>'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dashed-kanban-icon lucide-square-dashed-kanban text-green-500"><path d="M8 7v7"/><path d="M12 7v4"/><path d="M16 7v9"/><path d="M5 3a2 2 0 0 0-2 2"/><path d="M9 3h1"/><path d="M14 3h1"/><path d="M19 3a2 2 0 0 1 2 2"/><path d="M21 9v1"/><path d="M21 14v1"/><path d="M21 19a2 2 0 0 1-2 2"/><path d="M14 21h1"/><path d="M9 21h1"/><path d="M5 21a2 2 0 0 1-2-2"/><path d="M3 14v1"/><path d="M3 9v1"/></svg>';

            projectCard.innerHTML = `
                <div class="flex items-center gap-3 w-full">
                    <div class="flex flex-col gap-2 w-full flex-1">
                        <h1 class="text-2xl text-black font-medium w-full">${project.name}</h1>
                        <p class="text-gray-600 text-sm mb-4 line-clamp-1 w-full">
                            ${project.description || 'No description'}
                        </p>
                        <div class="flex items-center justify-between gap-2 w-full mb-2">
                            <div class="flex items-center gap-2">
                                <img 
                                    src="${project.createdBy?.avatarUrl || '/images/default-avatar.png'}" 
                                    alt="${project.createdBy?.name || 'Unknown'}" 
                                    class="w-6 h-6 rounded-full object-cover"
                                />
                                <div class="flex flex-col">
                                    <span class="text-gray-900 text-sm">${project.createdBy?.name}</span>                                
                                </div>
                            </div>
                            <div class="font-medium text-sm flex items-center justify-center rounded-lg text-white bg-black pl-2 py-1 hover:shadow-sm transition-shadow duration-200">
                                Details
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="font-medium lucide lucide-chevron-right-icon lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                            </div>
                        </div>
                        <div class="flex justify-end items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock-fading-icon lucide-clock-fading"><path d="M12 2a10 10 0 0 1 7.38 16.75"/><path d="M12 6v6l4 2"/><path d="M2.5 8.875a10 10 0 0 0-.5 3"/><path d="M2.83 16a10 10 0 0 0 2.43 3.4"/><path d="M4.636 5.235a10 10 0 0 1 .891-.857"/><path d="M8.644 21.42a10 10 0 0 0 7.631-.38"/></svg>
                            <span class="text-gray-600 text-lg">${new Date(project.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                    </div>
                </div>
            `;
            projectsListContainer.appendChild(projectCard);
        });
    }

    // Load projects when the page loads
    loadProject();
})
// ${typeIcon}
//                     <h3 class="text-xl font-semibold text-gray-800 truncate" title="${project.name}">
//                         ${project.name}
//                     </h3>