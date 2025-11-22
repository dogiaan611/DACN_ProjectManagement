import { createBoard, initProjectBoard } from "./project-board.js";
import { initializeDragAndDrop } from "./drag-drop.js";
import { authFetch } from './auth.js';
import { createTaskDetailModalHtml, createTaskCardHtml, createTaskFormHtml, toggleDropdown, getPriorityChip } from "./taskUI.js";

// export function addDragAndDropHandlers() {
//     initializeDragAndDrop({
//         containerSelector: '.tasks-container',
//         draggableSelector: '.bg-white.p-4.rounded-md', // Selector for task card
//         onDrop: async (e) => {
//             const droppedOnColumn = e.currentTarget;
//             const draggedTask = droppedOnColumn.querySelector('.dragging');
// 
//             if (!draggedTask) return;
// 
//             const taskId = draggedTask.dataset.taskId;
//             const newColumnId = droppedOnColumn.dataset.columnId;
//             const boardId = droppedOnColumn.dataset.boardId;
// 
//             // Calculate new position (index in the list of tasks)
//             const tasksInColumn = [...droppedOnColumn.querySelectorAll('[draggable="true"]')];
//             const newPosition = tasksInColumn.indexOf(draggedTask);
// 
//             console.log(`Moving task ${taskId} to column ${newColumnId} at position ${newPosition}`);
// 
//             try {
//                 const res = await authFetch(`/boards/${boardId}/columns/${newColumnId}/tasks/${taskId}`, {
//                     method: 'PUT',
//                     body: JSON.stringify({
//                         columnId: newColumnId,
//                         position: newPosition
//                     })
//                 });
// 
//                 if (!res.ok) {
//                     throw new Error('Failed to update task position');
//                 }
//             } catch (error) {
//                 console.error('Error moving task:', error);
// 
export async function openTaskDetailModal(taskId, projectId, boardId, columnId) {
    await closeTaskDetailModal();
    try {
        const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}`);
        if (!res.ok) {
            throw new Error('Failed to fetch task details');
        }
        const task = await res.json();

        // Tạo HTML cho modal và chèn vào body
        const modalHtml = createTaskDetailModalHtml(task);
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = document.getElementById('task-detail-modal');
        const backdrop = document.getElementById('task-detail-modal-backdrop');
        const closeBtn = document.getElementById('close-task-detail-modal-btn');

        // Hàm đóng modal
        const closeModalHandler = () => closeTaskDetailModal();

        // Gán sự kiện click để đóng modal
        closeBtn.addEventListener('click', closeModalHandler);
        backdrop.addEventListener('click', closeModalHandler);

        // Kích hoạt hiệu ứng trượt vào
        requestAnimationFrame(() => {
            backdrop.classList.remove('opacity-0');
            modal.classList.remove('translate-x-full');
        });

        // --- BẮT ĐẦU: LOGIC CẬP NHẬT TIÊU ĐỀ ---
        const titleInput = modal.querySelector('#task-detail-title-input');
        const originalTitle = task.title;

        const handleTitleUpdate = async () => {
            const newTitle = titleInput.value.trim();
            titleInput.blur();
            if (!newTitle || newTitle === originalTitle) {
                titleInput.value = originalTitle; // Hoàn lại giá trị cũ nếu người dùng xóa hết
                return;
            }
            try {
                const updateRes = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        title: newTitle,
                        description: task.description,
                        priority: task.priority,
                        dueDate: task.dueDate
                    })
                });
                if (!updateRes.ok) throw new Error('Failed to update title.');
                const taskCardTitle = document.querySelector(`.group[data-task-id="${taskId}"] .font-semibold.text-gray-800`);
                if (taskCardTitle) taskCardTitle.textContent = newTitle;
                task.title = newTitle;

            } catch (err) {
                console.error("Error updating title: ", err);
                alert("Could not update title.");
                titleInput.value = originalTitle;
            }
        };

        titleInput.addEventListener('blur', handleTitleUpdate);
        titleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleTitleUpdate();
            if (e.key === 'Escape') {
                titleInput.value = originalTitle;
                titleInput.blur();
            }
        });

        //description
        const descriptionInput = modal.querySelector('#task-description');
        const currentDes = task.description;
        const handleDesUpd = async () => {
            const newDes = descriptionInput.value.trim();
            descriptionInput.blur();
            if (!newDes || newDes === currentDes) {
                descriptionInput.value = currentDes;
                return;
            }
            try {
                const updateRes = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        title: task.title,
                        description: newDes,
                        priority: task.priority,
                        dueDate: task.dueDate
                    })
                });
                if (!updateRes.ok) throw new Error('Failed to updating description');
                // Sửa lỗi selector: thêm " và bỏ dấu cách giữa các class
                const taskCardDes = document.querySelector(`.group[data-task-id="${taskId}"] .text-sm.text-gray-600`);
                if (taskCardDes) taskCardDes.textContent = newDes;
                task.description = newDes;
            } catch (err) {
                console.log("Error updating description: ", err);
                alert("Could not update description");
                descriptionInput.value = currentDes;
            }
        };
        descriptionInput.addEventListener('blur', handleDesUpd);
        descriptionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleDesUpd();
            if (e.key === 'Escape') {
                descriptionInput.value = currentDes;
                descriptionInput.blur();
            }
        })
        //assginee dropdown
        const assigneeBtn = modal.querySelector('#change-assignee');
        const assigneeDropdown = modal.querySelector('#assignee-detail-dropdown');
        const assigneeAvtar = modal.querySelector('#task-detail-assignee-avt')

        assigneeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(assigneeBtn, assigneeDropdown, 'task-detail-assignee-portal', async (portal, closePortal) => {
                const assigneeList = portal.querySelector('#assignee-detail-list');
                const assigneeSearch = portal.querySelector('#assignee-search');
                let projectMembers = [];

                const handleAssigneeUpdate = async (newAssigneeId) => {
                    try {
                        const updateRes = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}`, {
                            method: 'PUT',
                            body: JSON.stringify({
                                title: task.title,
                                description: task.description,
                                priority: task.priority,
                                dueDate: task.dueDate,
                                assigneeId: newAssigneeId
                            })
                        });
                        if (!updateRes.ok) throw new Error('Failed to update assignee.');

                        const updatedTask = await updateRes.json();
                        task.assigneeId = updatedTask.assigneeId;

                        // Find member details from the loaded list
                        const selectedMember = projectMembers.find(m => m.userId === newAssigneeId);
                        if (selectedMember) {
                            task.assignee = {
                                userId: selectedMember.userId,
                                name: selectedMember.name,
                                avatarUrl: selectedMember.avatarUrl
                            };
                        } else {
                            task.assignee = updatedTask.assignee;
                        }

                        // Update UI in modal
                        const avatarInitial = task.assignee?.name ? task.assignee.name.charAt(0).toUpperCase() : '?';
                        const avatarHtml = task.assignee?.avatarUrl
                            ? `<img src="${task.assignee.avatarUrl}" alt="${task.assignee.name}" class="w-7 h-7 rounded-full object-cover">`
                            : `<div class="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">${avatarInitial}</div>`;
                        assigneeAvtar.innerHTML = avatarHtml;

                        // Update task card on the board
                        const taskCardAvatarContainer = document.querySelector(`.group[data-task-id="${taskId}"] > div:last-child > :first-child`);
                        if (taskCardAvatarContainer) {
                            taskCardAvatarContainer.outerHTML = task.assignee?.avatarUrl
                                ? `<img src="${task.assignee.avatarUrl}" alt="${task.assignee.name}" class="w-5 h-5 rounded-full border object-cover">`
                                : `<div class="w-5 h-5 border flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">${avatarInitial}</div>`;
                        }

                    } catch (err) {
                        console.error("Error updating assignee: ", err);
                        alert("Could not update assignee.");
                    } finally {
                        closePortal();
                    }
                };

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
                            ? `<img src="${member.avatarUrl}" alt="${member.name}" class="w-7 h-7 rounded-full object-cover">`
                            : `<div class="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">${avatarInitial}</div>`;

                        memberEl.innerHTML = `${avatarHtml}<span>${member.name || 'Unnamed'}</span>`;
                        memberEl.addEventListener('click', () => handleAssigneeUpdate(member.userId));
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
                    if (!res.ok) throw new Error('Failed to load project members');
                    const data = await res.json();
                    projectMembers = data?.members || [];
                    renderMembers(projectMembers);
                } catch (error) {
                    console.error('Error fetching project members:', error);
                    assigneeList.innerHTML = '<div class="p-2 text-sm text-red-500">Error loading members.</div>';
                }
            });
        });
        //priority dropdown
        const priorityBtn = modal.querySelector('#task-detail-priority-btn');
        const priorityDropdown = modal.querySelector('#task-detail-priority-dropdown');

        priorityBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(priorityBtn, priorityDropdown, 'task-detail-priority-portal', (portal, closePortal) => {
                const options = portal.querySelectorAll('.priority-option');
                options.forEach(option => {
                    option.addEventListener('click', async () => {
                        const newPriority = parseInt(option.dataset.priority, 10);

                        try {
                            const updateRes = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}`, {
                                method: 'PUT',
                                body: JSON.stringify({
                                    title: task.title,
                                    description: task.description,
                                    priority: newPriority,
                                    dueDate: task.dueDate
                                })
                            });

                            if (!updateRes.ok) throw new Error('Failed to update priority');
                            priorityBtn.innerHTML = getPriorityChip(newPriority);
                            task.priority = newPriority;
                            const taskCard = document.querySelector(`.group[data-task-id="${taskId}"] .mb-2`);
                            if (taskCard) taskCard.innerHTML = getPriorityChip(newPriority) + taskCard.querySelector('.flex.items-center.justify-center').outerHTML;
                        } catch (error) {
                            console.error("Error updating priority:", error);
                            alert("Could not update priority.");
                        } finally {
                            closePortal();
                        }
                    });
                });
            });
        });
        // --- KẾT THÚC: LOGIC CHO PRIORITY DROPDOWN ---
        // calendar dropdown
        const calendarBtn = modal.querySelector('#task-detail-calendar-btn');
        const calendarDropdown = modal.querySelector('#task-detail-calendar-dropdown');
        calendarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(calendarBtn, calendarDropdown, 'task-detail-calendar-portal', (portal, closePortal) => {
                const calendarHost = portal.querySelector('#calendar');
                if (!calendarHost) return;

                import('./components/calendar.js').then(({ default: Calendar }) => {
                    const calendar = new Calendar(calendarHost, {
                        selectedDate: task.dueDate ? task.dueDate : null,
                        onChange: async (date) => {
                            const newDueDate = new Date(date);
                            newDueDate.setHours(12, 0, 0, 0); // Chuẩn hóa giờ
                            const newDueDateISO = newDueDate.toISOString();

                            try {
                                // Gọi API để cập nhật due date
                                const updateRes = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}`, {
                                    method: 'PUT',
                                    body: JSON.stringify({ dueDate: newDueDateISO })
                                });

                                if (!updateRes.ok) throw new Error('Failed to update due date');

                                // Cập nhật UI trong modal
                                const dateString = newDueDate.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
                                calendarBtn.textContent = dateString;

                                // Cập nhật UI trên card ở ngoài board
                                const taskCardDueDate = document.querySelector(`.group[data-task-id="${taskId}"] .text-xs.text-gray-500`);
                                if (taskCardDueDate) taskCardDueDate.textContent = dateString;

                            } catch (error) {
                                console.error("Error updating due date:", error);
                                alert("Could not update due date.");
                            } finally {
                                closePortal(); // Đóng calendar sau khi xử lý
                            }
                        }
                    });

                    portal._picker = calendar;
                });
            })
        })
    } catch (error) {
        console.error('Error opening task detail modal:', error);
        alert('Could not load task details.');
    }
}

export function closeTaskDetailModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('task-detail-modal');
        const backdrop = document.getElementById('task-detail-modal-backdrop');

        if (modal && backdrop) {
            // Kích hoạt hiệu ứng trượt ra
            backdrop.classList.add('opacity-0');
            modal.classList.add('translate-x-full');

            // Xóa modal khỏi DOM sau khi hiệu ứng kết thúc
            modal.addEventListener('transitionend', () => {
                modal.remove();
                backdrop.remove();
                resolve();
            }, { once: true });
        } else {
            resolve();
        }
    });
}

export function initTaskEventListeners(tasks, projectId, container) {
    const addTaskBtns = document.querySelectorAll('.add-task-btn');

    // Task dropdowns (3 dots)
    const taskDropdownBtns = document.querySelectorAll('#task-dropdown-btn');

    taskDropdownBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const taskCard = btn.closest('[data-task-id]');
            if (!taskCard) return;

            const taskId = taskCard.dataset.taskId;
            const dropdownMenu = taskCard.querySelector('#task-dropdown-menu');

            toggleDropdown(btn, dropdownMenu, `task-dropdown-portal-${taskId}`, (portal, closePortal) => {
                const deleteBtn = portal.querySelector('#delete-task-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', async () => {
                        if (confirm('Are you sure you want to delete this task?')) {
                            try {
                                const tasksContainer = taskCard.closest('.tasks-container');
                                const columnId = tasksContainer.dataset.columnId;
                                const boardId = tasksContainer.dataset.boardId;

                                const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}`, {
                                    method: 'DELETE'
                                });

                                if (res.ok) {
                                    taskCard.remove();
                                } else {
                                    alert('Failed to delete task');
                                }
                            } catch (error) {
                                console.error('Error deleting task:', error);
                                alert('Error deleting task');
                            }
                        }
                        closePortal();
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
            tasksContainer.insertAdjacentHTML('afterbegin', createTaskFormHtml());

            const formContainer = tasksContainer.querySelector('.new-task-form-container');
            const form = formContainer.querySelector('form');
            const assigneeInput = form.querySelector('input[name="assigneeId"]');


            // Add assignee dropdown
            const assigneeBtn = formContainer.querySelector('#assignee-btn');
            const assigneeDropdown = formContainer.querySelector('#assignee-dropdown');

            assigneeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleDropdown(assigneeBtn, assigneeDropdown, 'assignee-dropdown-portal', async (portal, closePortal) => {
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



    // Thêm sự kiện click cho nút "chi tiết" trên mỗi task card để mở modal
    const detailButtons = document.querySelectorAll('#task-detail-btn');
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
}