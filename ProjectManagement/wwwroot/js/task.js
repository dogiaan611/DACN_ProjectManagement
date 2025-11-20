import { createBoard, initProjectBoard } from "./project-board.js";
import { initializeDragAndDrop } from "./drag-drop.js";
import { authFetch } from './auth.js';
import Calendar from './components/calendar.js';

function getPriorityChip(priority) {
    switch (priority) {
        case 1:
            return `<div class="flex gap-1 items-center justify-start">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-700 lucide lucide-chevrons-up-icon lucide-chevrons-up"><path d="m17 11-5-5-5 5"/><path d="m17 18-5-5-5 5"/></svg>
                        <span class="text-sm font-semibold leading-none text-red-700">High Priority</span>
                    </div>`;
        case 2:
            return `<div class="flex gap-1 items-center justify-start">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-600 lucide lucide-chevron-up-icon lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg>
                        <span class="text-sm font-semibold leading-none text-yellow-600">Medium Priority</span>
                    </div>`;
        case 3:
            return `<div class="flex gap-1 items-center justify-start">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
                        <span class="text-sm font-semibold leading-none text-blue-600">Low Priority</span>
                    </div>`;
        default:
            return '';
    }
}

export function createTaskCardHtml(task) {
    const dueDate = new Date(task.dueDate).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit'
    });
    const assigneeInitial = task.assigneeName ? task.assigneeName.charAt(0).toUpperCase() : '?';

    return `
        <div class="bg-white p-4 rounded-md border cursor-pointer" draggable="true" data-task-id="${task.taskId}">
            <div class="mb-2">
                ${getPriorityChip(task.priority)}
            </div>
            <div class="flex justify-between items-start mb-2">
                <span class="font-semibold text-gray-800">${task.title}</span>
            </div>
            <div class="text-sm text-gray-600 mt-1">${task.description}</div>
        </div>
    `;
}

function createTaskFormHtml() {
    return `
        <div class="bg-white border p-2 rounded-md shadow-sm new-task-form-container">
            <form class="new-task-form">
                <div class="flex flex-col items-center gap-2 justify-start">
                    <div class="flex items-center justify-center w-full">
                        <input name="title" type="text" class="w-full p-2 outline-none rounded-md mb-2" placeholder="Enter task title..." required></input>
                        <button type="submit" class="flex text-sm items-center justify-start gap-1 px-1 py-0.5 bg-blue-500 text-white rounded-md">
                            Tạo
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-corner-down-left-icon lucide-corner-down-left"><path d="M20 4v7a4 4 0 0 1-4 4H4"/><path d="m9 10-5 5 5 5"/></svg>
                        </button>
                    </div>
                    <input type="hidden" name="assigneeId" value="">
                    <input type="hidden" name="priority" value="Medium">
                    <input type="hidden" name="dueDate" value="">
                    <div class="relative w-full">
                        <div type="button" id="assignee-btn" class="w-full flex items-center justify-start px-2 py-1 gap-2 text-sm cursor-pointer text-gray-600 hover:bg-gray-100 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-icon lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>
                            <span id="assignee-btn-text">Add assigned team members</span>
                        </div>
                        <div id="assignee-dropdown" class="absolute z-10 w-fit border rounded-sm mt-1 hidden">
                            <div class="border-b py-1 px-2 flex items-center justify-start bg-white sticky top-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-search-icon lucide-user-search"><circle cx="10" cy="7" r="4"/><path d="M10.3 15H7a4 4 0 0 0-4 4v2"/><circle cx="17" cy="17" r="3"/><path d="m21 21-1.9-1.9"/></svg>
                                <input type="text" id="assignee-search" class="outline-none p-2 w-full text-base text-gray-500" placeholder="Search assignee..." autocomplete="off">
                            </div>
                            <div id="assignee-list" class="flex flex-col bg-white items-start justify-start p-1 max-h-48 overflow-y-auto">
                                <!-- Assignee list will be inserted here -->
                            </div>
                        </div>
                    </div>
                    <div class="relative w-full">
                        <div type="button" id="duedate-btn" class="w-full flex items-center justify-start px-2 py-1 gap-2 text-sm cursor-pointer text-gray-600 hover:bg-gray-100 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days-icon lucide-calendar-days"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                            Due date
                        </div>
                        <div id="calendar-dropdown" class="absolute z-10 w-fit mt-1 hidden" >
                            <div id="calendar" class="p-2 bg-white"></div>
                        </div>
                    </div>
                    <div class="relative w-full">
                        <button type="button" id="priority-btn" class="w-full flex items-center justify-start px-2 py-1 gap-2 text-sm cursor-pointer text-gray-600 hover:bg-gray-100 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-goal-icon lucide-goal"><path d="M12 13V2l8 4-8 4"/><path d="M20.561 10.222a9 9 0 1 1-12.55-5.29"/><path d="M8.002 9.997a5 5 0 1 0 8.9 2.02"/></svg>
                            <span id="priority-btn-text">Medium Priority</span>
                        </button>
                        <div id="priority-dropdown" class="absolute z-10 p-2 w-fit bg-white border rounded-md shadow-lg mt-1 hidden">
                            <span class="p-1 mb-1 text-sm font-medium text-gray-700">Task Priority</span>
                            <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="High">
                                ${getPriorityChip('High')}
                            </div>
                            <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="Medium">
                                ${getPriorityChip('Medium')}
                            </div>
                            <div class="p-1 priority-option cursor-pointer hover:bg-gray-100" data-priority="Low">
                                ${getPriorityChip('Low')}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    `;
}

export default function createTaskModalHtml() {
    // This function is now empty as the modal is no longer used.
    // It's kept to avoid breaking imports if it's referenced elsewhere, but it can be removed if not.
    return '';
}

export function addDragAndDropHandlers() {
    initializeDragAndDrop({
        containerSelector: '.tasks-container',
        draggableSelector: '.bg-white.p-4.rounded-md', // Selector for task card
        onDrop: async (e) => {
            const droppedOnColumn = e.currentTarget;
            const draggedTask = droppedOnColumn.querySelector('.dragging');

            if (!draggedTask) return;

            const taskId = draggedTask.dataset.taskId;
            const newColumnId = droppedOnColumn.dataset.columnId;
            const boardId = droppedOnColumn.dataset.boardId;

            // Calculate new position (index in the list of tasks)
            const tasksInColumn = [...droppedOnColumn.querySelectorAll('[draggable="true"]')];
            const newPosition = tasksInColumn.indexOf(draggedTask);

            console.log(`Moving task ${taskId} to column ${newColumnId} at position ${newPosition}`);

            try {
                const res = await authFetch(`/boards/${boardId}/columns/${newColumnId}/tasks/${taskId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        columnId: newColumnId,
                        position: newPosition
                    })
                });

                if (!res.ok) {
                    throw new Error('Failed to update task position');
                }
            } catch (error) {
                console.error('Error moving task:', error);
                initProjectBoard();
            }
        }
    });
}

export function initTaskEventListeners(tasks, projectId, container) {
    const addTaskBtns = document.querySelectorAll('.add-task-btn');

    addTaskBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const columnId = btn.dataset.columnId;
            const tasksContainer = document.querySelector(`.tasks-container[data-column-id="${columnId}"]`);

            // Prevent adding multiple forms
            if (tasksContainer.querySelector('.new-task-form-container')) {
                return;
            }

            btn.classList.add('hidden');
            tasksContainer.insertAdjacentHTML('beforeend', createTaskFormHtml());

            const formContainer = tasksContainer.querySelector('.new-task-form-container');
            const form = formContainer.querySelector('form');
            const assigneeInput = form.querySelector('input[name="assigneeId"]');

            // Add assignee dropdown
            const assigneeBtn = formContainer.querySelector('#assignee-btn');
            const assigneeDropdown = formContainer.querySelector('#assignee-dropdown');

            assigneeBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const existing = document.getElementById('assignee-dropdown-portal');
                if (existing) {
                    existing.remove();
                    return;
                }

                const portal = assigneeDropdown.cloneNode(true);
                portal.id = 'assignee-dropdown-portal';
                portal.classList.remove('hidden');
                portal.classList.add('z-50');
                portal.style.position = 'fixed';

                const rect = assigneeBtn.getBoundingClientRect();
                portal.style.top = `${rect.bottom + window.scrollY}px`;
                portal.style.left = `${rect.left + window.scrollX}px`;
                portal.style.minWidth = `${rect.width}px`;

                document.body.appendChild(portal);

                const assigneeList = portal.querySelector('#assignee-list');
                const assigneeSearch = portal.querySelector('#assignee-search');
                const assigneeBtnText = assigneeBtn.querySelector('#assignee-btn-text');

                let projectMembers = [];

                const renderMembers = (filteredMembers) => {
                    assigneeList.innerHTML = '';
                    if (filteredMembers.length === 0) {
                        assigneeList.innerHTML = '<div class="p-2 text-sm text-gray-500">No members found.</div>';
                        return;
                    }
                    filteredMembers.forEach(member => {
                        const memberEl = document.createElement('div');
                        memberEl.className = 'flex items-center gap-2 w-full p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer';
                        memberEl.dataset.memberId = member.userId;

                        const avatarInitial = member.name ? member.name.charAt(0).toUpperCase() : '?';
                        const avatarHtml = member.avatarUrl
                            ? `<img src="${member.avatarUrl}" alt="${member.name}" class="w-5 h-5 rounded-full object-cover">`
                            : `<div class="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">${avatarInitial}</div>`;

                        memberEl.innerHTML = `${avatarHtml}<span>${member.name || 'Unnamed'}</span>`;

                        memberEl.addEventListener('click', () => {
                            assigneeInput.value = member.userId;
                            assigneeBtn.innerHTML = `
                                ${avatarHtml}
                                <span id="assignee-btn-text" class="text-sm text-gray-800">${member.name}</span>
                            `;
                            portal.remove();
                            // Gỡ bỏ event listener để tránh memory leak
                            document.removeEventListener('click', closePortal);
                        });
                        assigneeList.appendChild(memberEl);
                    });
                };

                assigneeSearch.addEventListener('input', () => {
                    const searchTerm = assigneeSearch.value.toLowerCase();
                    const filtered = projectMembers.filter(m => m.name.toLowerCase().includes(searchTerm));
                    renderMembers(filtered);
                });

                // Close portal when clicking outside
                const closePortal = (ev) => {
                    if (!portal.contains(ev.target) && ev.target !== assigneeBtn && !assigneeBtn.contains(ev.target)) {
                        portal.remove();
                        document.removeEventListener('click', closePortal);
                    }
                };
                document.addEventListener('click', closePortal);

                // Fetch and render members
                try {
                    const res = await authFetch(`/projects/${projectId}/readProject`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data && data.members) {
                            projectMembers = data.members;
                            renderMembers(projectMembers);
                        } else {
                            assigneeList.innerHTML = '<div class="p-2 text-sm text-gray-500">No members in this project.</div>';
                        }
                    } else {
                        throw new Error('Failed to load project members');
                    }
                } catch (error) {
                    console.error('Error fetching project members:', error);
                    assigneeList.innerHTML = '<div class="p-2 text-sm text-red-500">Error loading members.</div>';
                }
            });


            // calendar dropdown (load vanilla-calendar-pro on demand and mount into a body portal)
            const calendarBtn = formContainer.querySelector('#duedate-btn');
            const calendarDropdown = formContainer.querySelector('#calendar-dropdown');

            calendarBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const existing = document.getElementById('calendar-dropdown-portal');
                if (existing) {
                    // if a portal exists, remove it (toggle)
                    if (existing._picker && typeof existing._picker.destroy === 'function') existing._picker.destroy();
                    existing.remove();
                    return;
                }

                const portal = calendarDropdown.cloneNode(true);
                portal.id = 'calendar-dropdown-portal';
                portal.classList.remove('hidden');
                portal.classList.add('z-50');
                portal.style.position = 'fixed';

                // Position the portal under the button
                const rect = calendarBtn.getBoundingClientRect();
                portal.style.top = `${rect.bottom + window.scrollY}px`;
                portal.style.left = `${rect.left + window.scrollX}px`;
                portal.style.minWidth = `${rect.width}px`;

                document.body.appendChild(portal);

                // Close portal when clicking outside
                const closePortal = (ev) => {
                    if (!portal.contains(ev.target) && ev.target !== calendarBtn && !calendarBtn.contains(ev.target)) {
                        // destroy picker if present
                        if (portal._picker && typeof portal._picker.destroy === 'function') portal._picker.destroy();
                        portal.remove();
                        document.removeEventListener('click', closePortal);
                    }
                };
                document.addEventListener('click', closePortal);

                // mount date picker inside the portal
                (function mountDatePicker() {
                    const calendarHost = portal.querySelector('#calendar');
                    if (!calendarHost) return;

                    const hiddenDue = form.querySelector('input[name="dueDate"]');

                    const calendar = new Calendar(calendarHost, {
                        selectedDate: hiddenDue.value ? hiddenDue.value : null,
                        onChange: (date) => {
                            const d = new Date(date);
                            d.setHours(12, 0, 0, 0);
                            hiddenDue.value = d.toISOString();

                            const dateString = d.toLocaleDateString('vi-VN');
                            calendarBtn.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-days-icon lucide-calendar-days"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                                ${dateString}
                            `;

                            if (portal._picker && typeof portal._picker.destroy === 'function') portal._picker.destroy();
                            portal.remove();
                            document.removeEventListener('click', closePortal);
                        }
                    });

                    portal._picker = calendar;
                })();
            });
            // Handle priority dropdown using a portal appended to `body` so it won't be clipped
            const priorityBtn = formContainer.querySelector('#priority-btn');
            const priorityDropdown = formContainer.querySelector('#priority-dropdown');
            const priorityInput = form.querySelector('input[name="priority"]');

            priorityBtn.addEventListener('click', (e) => {
                e.stopPropagation();

                // If a portal already exists, remove it (toggle behavior)
                const existing = document.getElementById('priority-dropdown-portal');
                if (existing) {
                    existing.remove();
                    return;
                }

                // Clone the dropdown and append to body to avoid ancestor clipping
                const portal = priorityDropdown.cloneNode(true);
                portal.id = 'priority-dropdown-portal';
                portal.classList.remove('hidden');
                portal.classList.add('z-50');
                portal.style.position = 'fixed';

                // Position the portal under the button
                const rect = priorityBtn.getBoundingClientRect();
                portal.style.top = `${rect.bottom + window.scrollY}px`;
                portal.style.left = `${rect.left + window.scrollX}px`;
                portal.style.minWidth = `${rect.width}px`;

                document.body.appendChild(portal);

                // Wire up option clicks inside the portal
                const priorityBtnText = priorityBtn.querySelector('#priority-btn-text');
                const portalOptions = portal.querySelectorAll('.priority-option');
                portalOptions.forEach(option => {
                    option.addEventListener('click', () => {
                        const selectedPriority = option.dataset.priority;
                        priorityInput.value = selectedPriority;
                        priorityBtnText.textContent = `${selectedPriority} Priority`;
                        portal.remove();
                    });
                });

                // Close portal when clicking outside
                const closePortal = (ev) => {
                    if (!portal.contains(ev.target) && ev.target !== priorityBtn && !priorityBtn.contains(ev.target)) {
                        portal.remove();
                        document.removeEventListener('click', closePortal);
                    }
                };
                document.addEventListener('click', closePortal);
            });

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const title = formData.get('title').trim();
                if (!title) return;

                const payload = {
                    title: title,
                    description: '', // Description can be added later
                    priority: parseInt(formData.get('priority')),
                    assigneeId: formData.get('assigneeId') || null,
                    dueDate: formData.get('dueDate') || null
                };

                try {
                    const res = await authFetch(`/boards/${tasksContainer.dataset.boardId}/columns/${columnId}/tasks`, {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        initProjectBoard(); // Reload the whole board to show the new task
                    } else {
                        throw new Error('Failed to create task');
                    }
                } catch (error) {
                    console.error('Error creating task:', error);
                    alert('Could not create the task. Please try again.');
                }
            });
        });
    });
}