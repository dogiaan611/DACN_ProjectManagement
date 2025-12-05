import { createBoard, initProjectBoard } from "./project-board.js";
import { initProjectList } from "./project-list.js";
import { initializeDragAndDrop } from "./drag-drop.js";
import { authFetch } from './auth.js';
import { createTaskCardHtml, createTaskFormHtml, createTaskRowFormHtml, toggleDropdown, createTaskScrumHtml } from "./taskUI.js";
import { openTaskDetailModal } from "./taskDetail.js";

export function initTaskEventListeners(tasks, projectId, container, projectType) {
    const addTaskBtns = document.querySelectorAll('.add-task-btn');

    // Task dropdowns (3 dots)
    const taskDropdownBtns = document.querySelectorAll('.task-dropdown-btn');

    taskDropdownBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskCard = btn.closest('[data-task-id]');
            if (!taskCard) return;

            const taskId = taskCard.dataset.taskId;
            const dropdownMenu = taskCard.querySelector('.task-dropdown-menu');

            toggleDropdown(btn, dropdownMenu, `task-dropdown-portal-${taskId}`, (portal, closePortal) => {
                const deleteBtn = portal.querySelector('.delete-task-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', () => {
                        closePortal(); // Đóng dropdown menu trước

                        // Tạo HTML cho modal xác nhận xóa task nếu chưa tồn tại
                        if (!document.getElementById('del-task-modal')) {
                            const delConfirmHtml = `
                                <div id="del-task-backdrop" class="fixed inset-0 z-50 hidden bg-black/40 opacity-0 transition-opacity duration-300"></div>
                                <div id="del-task-modal" class="fixed inset-0 z-50 hidden items-center justify-center overflow-y-auto">
                                    <div id="del-task-outer" class="min-h-full w-full p-4 flex items-center justify-center">
                                        <div class="mx-auto w-full max-w-md rounded-2xl bg-white shadow-2xl transform scale-95 opacity-0 transition-all duration-300 ease-out" role="dialog" aria-modal="true">
                                            <div class="px-6 py-8">
                                                <div class="flex flex-col items-center justify-center px-4 gap-3">
                                                    <div class="flex rounded-full p-4 bg-red-100">
                                                        <div class="flex items-center justify-center bg-red-500 rounded-full p-3">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert-icon lucide-circle-alert text-white text-xl"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                                        </div>
                                                    </div>
                                                    <div class="text-2xl font-bold text-center">Delete this task?</div>
                                                    <div class="text-sm text-gray-500 text-center">Are you sure you want to delete this task? This action cannot be undone.</div>
                                                    <div class="flex flex-row w-full items-center justify-center gap-2 mt-4">
                                                        <button id="confirm-delete-task-btn" class="flex items-center justify-center w-full px-5 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-700 transition-colors duration-150 ease-in">Delete</button>
                                                        <button id="cancel-delete-task-btn" class="flex items-center justify-center w-full px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 ease-in border-2 font-medium">Cancel</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>`;
                            document.body.insertAdjacentHTML('beforeend', delConfirmHtml);
                        }

                        const backdrop = document.getElementById('del-task-backdrop');
                        const modal = document.getElementById('del-task-modal');
                        const modalContent = modal.querySelector('[role="dialog"]');
                        const cancelBtn = document.getElementById('cancel-delete-task-btn');
                        const confirmBtn = document.getElementById('confirm-delete-task-btn');

                        const openModal = () => {
                            modal.classList.remove('hidden');
                            modal.classList.add('flex');
                            setTimeout(() => {
                                backdrop.classList.add('opacity-100');
                                modalContent.classList.remove('scale-95', 'opacity-0');
                                modalContent.classList.add('scale-100', 'opacity-100');
                            }, 10);
                        };

                        const closeModal = () => {
                            modalContent.classList.add('scale-95', 'opacity-0');
                            backdrop.classList.remove('opacity-100');
                            setTimeout(() => {
                                modal.classList.add('hidden');
                                modal.classList.remove('flex');
                            }, 200);
                        };

                        openModal();

                        backdrop.onclick = closeModal;
                        cancelBtn.onclick = closeModal;
                        modal.onclick = (e) => { if (e.target.id === 'del-task-outer') closeModal(); };

                        confirmBtn.onclick = async () => {
                            const tasksContainer = taskCard.closest('.tasks-container');
                            const columnId = tasksContainer.dataset.columnId;
                            const boardId = tasksContainer.dataset.boardId;
                            const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}`, { method: 'DELETE' });
                            if (res.ok) {
                                taskCard.remove();
                                // Cập nhật lại số lượng task trong cột
                                const columnElement = document.getElementById(`column-${columnId}`);
                                if (columnElement) {
                                    const taskCountSpan = columnElement.querySelector('h3 + span');
                                    if (taskCountSpan) {
                                        const currentCount = parseInt(taskCountSpan.textContent, 10);
                                        if (!isNaN(currentCount)) {
                                            taskCountSpan.textContent = currentCount - 1;
                                        }
                                    }
                                }
                            } else {
                                alert('Failed to delete task');
                            }
                            closeModal();
                        }
                    });
                }
            });
        });
    });

    addTaskBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const columnId = btn.dataset.columnId;
            const tasksContainer = document.querySelector(`.tasks-container[data-column-id="${columnId}"]`);

            // Prevent adding multiple forms
            if (tasksContainer.querySelector('.new-task-form-container')) {
                return;
            }

            btn.classList.add('hidden');
            const isListView = tasksContainer.closest('.list-view-container');
            const formHtml = isListView ? createTaskRowFormHtml() : (projectType === 1 ? createTaskScrumHtml() : createTaskFormHtml());
            tasksContainer.insertAdjacentHTML('afterbegin', formHtml);

            const formContainer = tasksContainer.querySelector('.new-task-form-container');
            const form = formContainer.querySelector('form');
            const assigneeInput = form.querySelector('input[name="assigneeId"]');

            // Hàm dọn dẹp: xóa form, hiển thị lại nút và gỡ bỏ event listener
            const cleanup = () => {
                formContainer.remove();
                btn.classList.remove('hidden');
                document.removeEventListener('click', handleClickOutside);
            };

            // Hàm xử lý khi click ra ngoài
            const handleClickOutside = (event) => {
                // Nếu click bên trong form hoặc các popup (portal) thì không làm gì cả
                if (formContainer.contains(event.target) || event.target.closest('[id*="-portal"]')) {
                    return;
                }
                cleanup();
            };

            setTimeout(() => document.addEventListener('click', handleClickOutside), 0);


            // Add assignee dropdown
            const assigneeBtn = formContainer.querySelector('#assignee-btn');
            const assigneeDropdown = formContainer.querySelector('#assignee-dropdown');

            assigneeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleDropdown(assigneeBtn, assigneeDropdown, 'assignee-dropdown-portal', async (portal, closePortal) => {
                    const assigneeList = portal.querySelector('#assignee-list');
                    const assigneeSearch = portal.querySelector('#assignee-search');
                    // const assigneeBtnText = assigneeBtn.querySelector('#assignee-btn-text');

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
                                closePortal();
                            });
                            assigneeList.appendChild(memberEl);
                        });
                    };

                    assigneeSearch.addEventListener('input', () => {
                        const searchTerm = assigneeSearch.value.toLowerCase();
                        const filtered = projectMembers.filter(m => m.name.toLowerCase().includes(searchTerm));
                        renderMembers(filtered);
                    });

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
            });


            // calendar dropdown (load vanilla-calendar-pro on demand and mount into a body portal)
            const calendarBtn = formContainer.querySelector('#duedate-btn');
            const calendarDropdown = formContainer.querySelector('#calendar-dropdown');

            // Dynamically import Calendar to avoid loading it if not needed
            calendarBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleDropdown(calendarBtn, calendarDropdown, 'calendar-dropdown-portal', (portal, closePortal) => {
                    const calendarHost = portal.querySelector('#calendar');
                    if (!calendarHost) return;

                    const hiddenDue = form.querySelector('input[name="dueDate"]');

                    import('./components/calendar.js').then(({ default: Calendar }) => {
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

                                closePortal();
                            }
                        });

                        portal._picker = calendar;
                    });
                });
            });
            // Handle priority dropdown using a portal appended to `body` so it won't be clipped
            const priorityBtn = formContainer.querySelector('#priority-btn');
            const priorityDropdown = formContainer.querySelector('#priority-dropdown');
            const priorityInput = form.querySelector('input[name="priority"]');

            priorityBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleDropdown(priorityBtn, priorityDropdown, 'priority-dropdown-portal', (portal, closePortal) => {
                    const priorityBtnText = priorityBtn.querySelector('#priority-btn-text');
                    const portalOptions = portal.querySelectorAll('.priority-option');
                    portalOptions.forEach(option => {
                        option.addEventListener('click', () => {
                            const selectedPriority = option.dataset.priority;
                            priorityInput.value = selectedPriority;
                            priorityBtnText.textContent = `${selectedPriority} Priority`;
                            closePortal();
                        });
                    });
                });
            });

            form.addEventListener('submit', async (e) => {
                document.removeEventListener('click', handleClickOutside); // Gỡ listener trước khi submit
                e.preventDefault();
                const formData = new FormData(form);
                const title = formData.get('title').trim();
                if (!title) return;

                const payload = {
                    title: title,
                    description: '', // Description can be added later
                    priority: (() => {
                        const priorityValue = formData.get('priority');
                        switch (priorityValue) {
                            case 'High': return 1;
                            case 'Medium': return 2;
                            case 'Low': return 3;
                            default: return 2; // Mặc định là Medium
                        }
                    })(),
                    assigneeId: formData.get('assigneeId') || null,
                    dueDate: formData.get('dueDate') || null
                };

                try {
                    const res = await authFetch(`/boards/${tasksContainer.dataset.boardId}/columns/${columnId}/tasks`, {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        if (tasksContainer.closest('.list-view-container')) {
                            initProjectList();
                        } else {
                            initProjectBoard();
                        }
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

    // Thêm sự kiện click cho nút "chi tiết" trên mỗi task card để mở modal
    const detailButtons = document.querySelectorAll('.task-detail-btn');
    detailButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Ngăn sự kiện nổi bọt lên các phần tử cha

            const taskCard = btn.closest('[data-task-id]');
            if (!taskCard) return;

            const taskId = taskCard.dataset.taskId;
            const tasksContainer = taskCard.closest('.tasks-container');
            const boardId = tasksContainer.dataset.boardId;
            const columnId = tasksContainer.dataset.columnId;
            openTaskDetailModal(taskId, projectId, boardId, columnId);
        });
    });

    // Initialize drag and drop for tasks
    initializeDragAndDrop({
        containerSelector: '.tasks-container',
        draggableSelector: '[data-task-id]',
        onDrop: async (e) => {
            e.stopPropagation();
            const draggingTask = document.querySelector('.dragging');
            if (!draggingTask) return;

            const taskId = draggingTask.dataset.taskId;
            const originalColumnId = draggingTask.dataset.originalColumnId;
            const targetContainer = e.currentTarget;
            const targetColumnId = targetContainer.dataset.columnId;
            const boardId = targetContainer.dataset.boardId;

            if (!originalColumnId || !boardId) return;

            // Calculate new position
            const tasksInColumn = [...targetContainer.querySelectorAll('[data-task-id]')];
            const newPosition = tasksInColumn.indexOf(draggingTask);

            try {
                const res = await authFetch(`/boards/${boardId}/columns/${originalColumnId}/tasks/${taskId}/move`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        toColumnId: parseInt(targetColumnId),
                        toPosition: newPosition
                    })
                });

                if (!res.ok) {
                    throw new Error('Failed to move task');
                }

                // Update column counts if moved to a different column
                if (originalColumnId !== targetColumnId) {
                    const oldColumn = document.getElementById(`column-${originalColumnId}`);
                    const newColumn = document.getElementById(`column-${targetColumnId}`);

                    if (oldColumn) {
                        const countSpan = oldColumn.querySelector('h3 + span');
                        if (countSpan) countSpan.textContent = Math.max(0, parseInt(countSpan.textContent) - 1);
                    }
                    if (newColumn) {
                        const countSpan = newColumn.querySelector('h3 + span');
                        if (countSpan) countSpan.textContent = parseInt(countSpan.textContent) + 1;
                    }
                }

            } catch (error) {
                console.error('Error moving task:', error);
                alert('Failed to move task. Reloading board.');
                initProjectBoard();
            }
        }
    });

    // Add dragstart listener to capture original column
    const taskCards = document.querySelectorAll('[data-task-id]');
    taskCards.forEach(card => {
        card.addEventListener('dragstart', () => {
            const col = card.closest('.tasks-container');
            if (col) {
                card.dataset.originalColumnId = col.dataset.columnId;
            }
        });
    });
}