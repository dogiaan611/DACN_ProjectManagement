import { authFetch } from "./auth.js";
import { toggleDropdown, getPriorityChip } from "./taskUI.js";

export function initSubtasks(taskId, boardId, columnId, projectId, container) {
    const subtaskListContainer = container.querySelector('#task-subtasks-list');
    const addSubtaskBtn = container.querySelector('#add-subtask-btn');
    const addSubtaskBtnContainer = addSubtaskBtn.parentElement;

    // Progress elements
    const progressContainer = container.querySelector('#subtask-progress-container');
    const progressBar = container.querySelector('#subtask-progress-bar');
    const progressText = container.querySelector('#subtask-progress-text');

    let subtasks = [];

    async function fetchSubtasks() {
        try {
            const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/subtasks`);
            if (!res.ok) throw new Error('Failed to get subtasks');
            subtasks = await res.json();
            renderSubtasks();
        } catch (err) {
            console.error('Failed to get subtasks:', err);
            subtaskListContainer.innerHTML = '<div class="text-red-500 text-sm p-2">Failed to load subtasks.</div>';
        }
    }

    function updateProgress() {
        if (!subtasks || subtasks.length === 0) {
            progressContainer.classList.add('hidden');
            return;
        }

        progressContainer.classList.remove('hidden');
        const total = subtasks.length;
        const completed = subtasks.filter(s => s.isDone).length;
        const percentage = Math.round((completed / total) * 100);

        progressBar.style.width = `${percentage}%`;
        progressText.textContent = `${percentage}%`;

        if (percentage === 100) {
            progressBar.classList.remove('bg-blue-600');
            progressBar.classList.add('bg-green-500');
        } else {
            progressBar.classList.add('bg-blue-600');
            progressBar.classList.remove('bg-green-500');
        }
    }

    function renderSubtasks() {
        subtaskListContainer.innerHTML = '';
        updateProgress();

        if (!subtasks || subtasks.length === 0) {
            subtaskListContainer.innerHTML = `<div class="text-gray-400 text-sm p-2 flex items-center justify-center gap-2 text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-todo-icon lucide-list-todo"><path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="m3 17 2 2 4-4"/><rect x="3" y="4" width="6" height="6" rx="1"/></svg>
                                    No subtasks yet.
                                    </div>`;
            return;
        }

        subtasks.forEach(subtask => {
            const subtaskItem = document.createElement('div');
            subtaskItem.className = 'flex items-center justify-between p-2 gap-1 hover:bg-gray-50 border rounded-md group';

            const isChecked = subtask.isDone ? 'checked' : '';
            const textClass = subtask.isDone ? 'text-gray-400 line-through' : 'text-gray-700';
            const avatarInitial = subtask.assignee ? subtask.assignee.name.charAt(0).toUpperCase() : '?';
            const avatarHtml = subtask.assignee?.avatarUrl
                ? `<img src="${subtask.assignee.avatarUrl}" alt="${subtask.assignee.name}" class="w-6 h-6 rounded-full border object-cover">`
                : `<div class="w-6 h-6 border flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">${avatarInitial}</div>`;

            subtaskItem.innerHTML = `
                <div class="flex items-center gap-3 w-full">
                    <input type="checkbox" class="subtask-checkbox w-4 h-4 accent-black rounded focus:ring-0 cursor-pointer" data-id="${subtask.subtaskId}" ${isChecked}>
                    <div class="subtask-title text-sm ${textClass} flex-grow focus:outline-none" data-id="${subtask.subtaskId}">${subtask.title}</div>
                </div>
                <div class="flex items-center w-6 h-6 rounded-full object-cover">
                    ${avatarHtml}
                </div>
                <div class="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" class="delete-subtask-btn text-gray-400 hover:text-red-500 p-1 rounded" data-id="${subtask.subtaskId}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                </div>
            `;
            subtaskListContainer.appendChild(subtaskItem);

            // Event listeners for this item
            const checkbox = subtaskItem.querySelector('.subtask-checkbox');
            checkbox.addEventListener('change', () => handleToggleSubtask(subtask.subtaskId));

            const deleteBtn = subtaskItem.querySelector('.delete-subtask-btn');
            deleteBtn.addEventListener('click', () => handleDeleteSubtask(subtask.subtaskId));
        });
    }

    async function handleToggleSubtask(subtaskId) {
        try {
            const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
                method: 'PATCH'
            });
            if (!res.ok) throw new Error('Failed to toggle subtask');

            const updated = await res.json();
            const index = subtasks.findIndex(s => s.subtaskId === subtaskId);
            if (index !== -1) {
                subtasks[index].isDone = updated.isDone;
                renderSubtasks();
            }
        } catch (err) {
            console.error('Error toggling subtask:', err);
        }
    }

    async function handleDeleteSubtask(subtaskId) {
        if (!confirm('Are you sure you want to delete this subtask?')) return;
        try {
            const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/subtasks/${subtaskId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete subtask');

            subtasks = subtasks.filter(s => s.subtaskId !== subtaskId);
            renderSubtasks();
        } catch (err) {
            console.error('Error deleting subtask:', err);
        }
    }

    // Add Subtask Logic
    addSubtaskBtn.addEventListener('click', () => {
        // Hide the add button container
        addSubtaskBtnContainer.classList.add('hidden');

        let selectedAssigneeId = null;
        let selectedPriority = 2; // Medium
        let selectedDueDate = null;

        // Create form HTML
        const addSubtaskFormHtml = `
            <div id="subtask-form-container" class="mt-2 p-2 flex items-center gap-2 border rounded-md bg-white shadow-sm">
                <input type="text" id="new-subtask-title" class="w-full p-2 text-sm rounded outline-none" placeholder="What needs to be done?" autocomplete="off">
                <div class="flex items-center gap-1">
                    <div class="relative">
                        <button id="add-subtask-assignee" class=" w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-500" title="Assignee">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-icon lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>
                        </button>
                        <div id="subtask-assignee-dropdown-template" class="hidden w-64 bg-white border rounded-md shadow-lg">
                            <div class="p-2 border-b sticky top-0 bg-white z-10">
                                <input type="text" id="subtask-assignee-search" class="w-full p-1 text-sm border rounded outline-none" placeholder="Search member...">
                            </div>
                            <div id="subtask-assignee-list" class="max-h-48 overflow-y-auto p-1 flex flex-col gap-1"></div>
                        </div>
                    </div>

                    <button id="confirm-add-subtask" class="px-3 py-1.5 bg-black text-white text-xs font-medium rounded flex items-center gap-2">
                        Save
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-corner-down-left-icon lucide-corner-down-left"><path d="M20 4v7a4 4 0 0 1-4 4H4"/><path d="m9 10-5 5 5 5"/></svg>
                    </button>
                    <button id="cancel-add-subtask" class="px-3 py-1.5 text-gray-600 text-xs font-medium border hover:bg-gray-100 rounded">Cancel</button>
                </div>
            </div>
        `;

        // Insert form after the button container
        addSubtaskBtnContainer.insertAdjacentHTML('afterend', addSubtaskFormHtml);

        const addSubtaskFormContainer = container.querySelector('#subtask-form-container');
        const input = addSubtaskFormContainer.querySelector('#new-subtask-title');
        const confirmBtn = addSubtaskFormContainer.querySelector('#confirm-add-subtask');
        const cancelBtn = addSubtaskFormContainer.querySelector('#cancel-add-subtask');

        input.focus();

        const closeForm = () => {
            addSubtaskFormContainer.remove();
            addSubtaskBtnContainer.classList.remove('hidden');
        };

        // --- Dropdown Logic ---

        // 1. Assignee
        const assigneeBtn = addSubtaskFormContainer.querySelector('#add-subtask-assignee');
        const assigneeDropdownTemplate = addSubtaskFormContainer.querySelector('#subtask-assignee-dropdown-template');

        assigneeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(assigneeBtn, assigneeDropdownTemplate, 'subtask-assignee-portal', async (portal, closePortal) => {
                const listContainer = portal.querySelector('#subtask-assignee-list');
                const searchInput = portal.querySelector('#subtask-assignee-search');
                let members = [];

                const renderMembers = (list) => {
                    listContainer.innerHTML = '';
                    if (list.length === 0) {
                        listContainer.innerHTML = '<div class="p-2 text-sm text-gray-500">No members found.</div>';
                        return;
                    }
                    list.forEach(m => {
                        const el = document.createElement('div');
                        el.className = 'flex items-center gap-2 w-full p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer';
                        const avatarInitial = m.name ? m.name.charAt(0).toUpperCase() : '?';
                        const avatarHtml = (m.avatarUrl && m.avatarUrl !== "null")
                            ? `<img src="${m.avatarUrl}" alt="${m.name}" class="w-6 h-6 rounded-full border object-cover">`
                            : `<div class="w-6 h-6 border flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">${avatarInitial}</div>`;
                        el.innerHTML = `${avatarHtml}<span>${m.name}</span>`;
                        el.onclick = () => {
                            selectedAssigneeId = m.userId;
                            assigneeBtn.innerHTML = avatarHtml; // Show selected avatar
                            closePortal();
                        };
                        listContainer.appendChild(el);
                    });
                };

                try {
                    const res = await authFetch(`/projects/${projectId}/readProject`);
                    if (res.ok) {
                        const data = await res.json();
                        members = data.members || [];
                        renderMembers(members);
                    }
                } catch (err) {
                    console.error("Error loading members", err);
                    listContainer.innerHTML = '<div class="p-2 text-sm text-red-500">Error.</div>';
                }

                searchInput.addEventListener('input', () => {
                    const term = searchInput.value.toLowerCase();
                    renderMembers(members.filter(m => m.name.toLowerCase().includes(term)));
                });
            }, 'top');
        });

        const submitSubtask = async () => {
            const title = input.value.trim();
            if (!title) {
                input.focus();
                return;
            }

            try {
                const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/subtasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        assigneeId: selectedAssigneeId,
                        priority: selectedPriority,
                        dueDate: selectedDueDate
                    })
                });

                if (!res.ok) throw new Error('Failed to add subtask');

                const newSubtask = await res.json();
                subtasks.push(newSubtask);
                renderSubtasks();
                closeForm();
            } catch (err) {
                console.error('Error adding subtask:', err);
                alert('Failed to add subtask');
            }
        };

        confirmBtn.addEventListener('click', submitSubtask);
        cancelBtn.addEventListener('click', closeForm);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitSubtask();
            }
            if (e.key === 'Escape') {
                closeForm();
            }
        });
    });

    // Initial load
    fetchSubtasks();
}