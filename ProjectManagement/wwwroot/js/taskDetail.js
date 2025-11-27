import { authFetch } from './auth.js';
import { createTaskDetailModalHtml, toggleDropdown, getPriorityChip } from "./taskUI.js";
import { initComments } from "./comment.js";
import { initTaskTags } from "./taskTag.js";
import { initAttachments } from "./attachment.js";
import { initSubtasks } from './subtask.js';

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
        initComments(taskId, boardId, projectId, columnId, modal);
        initTaskTags(boardId, columnId, projectId, taskId);
        initAttachments(taskId, boardId, columnId, projectId, modal);
        initSubtasks(taskId, boardId, columnId, projectId, modal);

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

        // --- TAB SWITCHING LOGIC ---
        const tabCommentBtn = modal.querySelector('#tab-comment-btn');
        const tabSubtaskBtn = modal.querySelector('#tab-subtask-btn');
        const tabContentComment = modal.querySelector('#tab-content-comment');
        const tabContentSubtask = modal.querySelector('#tab-content-subtask');

        const setActiveTab = (tab) => {
            if (tab === 'comment') {
                tabContentComment.classList.remove('hidden');
                tabContentComment.classList.add('block');
                tabContentSubtask.classList.remove('block');
                tabContentSubtask.classList.add('hidden');

                tabCommentBtn.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
                tabCommentBtn.classList.remove('text-gray-500', 'hover:text-gray-700');

                tabSubtaskBtn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
                tabSubtaskBtn.classList.add('text-gray-500', 'hover:text-gray-700');
            } else {
                tabContentComment.classList.remove('block');
                tabContentComment.classList.add('hidden');
                tabContentSubtask.classList.remove('hidden');
                tabContentSubtask.classList.add('block');

                tabSubtaskBtn.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
                tabSubtaskBtn.classList.remove('text-gray-500', 'hover:text-gray-700');

                tabCommentBtn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
                tabCommentBtn.classList.add('text-gray-500', 'hover:text-gray-700');
            }
        };

        tabCommentBtn.addEventListener('click', () => setActiveTab('comment'));
        tabSubtaskBtn.addEventListener('click', () => setActiveTab('subtask'));
        // --- END TAB SWITCHING LOGIC ---

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
                            ? `<img src="${task.assignee.avatarUrl}" alt="${task.assignee.name}" class="w-6 h-6 rounded-full object-cover">` // Avatar with image
                            : `<div class="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">${avatarInitial}</div>`; // Fallback avatar
                        const assigneeName = task.assignee?.name || 'Unassigned';
                        assigneeAvtar.innerHTML = `${avatarHtml}<span class="text-sm font-medium text-gray-600">${assigneeName}</span>`;

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
