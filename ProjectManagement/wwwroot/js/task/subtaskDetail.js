
import { authFetch } from '../auth/auth.js';
import { createSubtaskDetailModalHtml, toggleDropdown, getPriorityChip } from "./taskUI.js";
import { initSubtaskAttachments } from "./attachment.js";
import { initSubtaskComments } from './comment.js';

export async function openSubtaskDetailModal(subtaskId, taskId, boardId, columnId, projectId) {
    await closeSubtaskDetailModal();
    try {
        const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/subtasks/${subtaskId}`);
        if (!res.ok) throw new Error('Failed to fetch subtask details');
        const subtask = await res.json();
        // Ensure subtask has correct parent info if needed, mostly it's there.

        const modalHtml = createSubtaskDetailModalHtml(subtask);
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = document.getElementById('subtask-detail-modal');
        if (!modal) throw new Error("Modal element not found");

        // Init Components
        await initSubtaskAttachments(taskId, subtaskId, boardId, columnId, projectId, modal);
        await initSubtaskComments(subtaskId, taskId, boardId, columnId, projectId, modal);

        // Close logic
        const closeBtn = modal.querySelector('#close-subtask-detail-modal-btn');
        const closeModalHandler = () => closeSubtaskDetailModal();
        closeBtn.addEventListener('click', closeModalHandler);
        const backdrop = document.getElementById('subtask-detail-modal-backdrop');
        if (backdrop) backdrop.addEventListener('click', closeModalHandler);

        requestAnimationFrame(() => {
            if (backdrop) backdrop.classList.remove('opacity-0');
            modal.classList.remove('translate-x-full');
        });

        // Tab Switching
        const tabCommentBtn = modal.querySelector('#tab-subtask-comment-btn');
        const tabActivityBtn = modal.querySelector('#tab-subtask-activity-btn');
        const tabContentComment = modal.querySelector('#tab-content-subtask-comment');
        const tabContentActivity = modal.querySelector('#tab-content-subtask-activity');

        const setActiveTab = (tab) => {
            tabContentComment.classList.add('hidden');
            tabContentActivity.classList.add('hidden');
            tabCommentBtn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
            tabActivityBtn.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
            tabCommentBtn.classList.add('text-gray-500');
            tabActivityBtn.classList.add('text-gray-500');

            if (tab === 'comment') {
                tabContentComment.classList.remove('hidden');
                tabCommentBtn.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
                tabCommentBtn.classList.remove('text-gray-500');
            } else {
                tabContentActivity.classList.remove('hidden');
                tabActivityBtn.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
                tabActivityBtn.classList.remove('text-gray-500');
                loadActivityLog(subtaskId, taskId, boardId, columnId);
            }
        };

        tabCommentBtn.addEventListener('click', () => setActiveTab('comment'));
        tabActivityBtn.addEventListener('click', () => setActiveTab('activity'));

        // Activity Log Loader
        async function loadActivityLog(subtaskId, taskId, boardId, columnId) {
            const activityContainer = modal.querySelector('#subtask-activity-list');
            activityContainer.innerHTML = '<div class="text-sm text-gray-500">Loading activity...</div>';
            try {
                const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/subtasks/${subtaskId}/activity`);
                if (!res.ok) throw new Error('Failed');
                const logs = await res.json();
                if (logs.length === 0) {
                    activityContainer.innerHTML = '<div class="text-sm text-gray-400">No activity yet.</div>';
                    return;
                }
                activityContainer.innerHTML = logs.map(log => `
                     <div class="flex flex-col gap-1 border-b pb-2 last:border-0">
                         <div class="flex items-center gap-2">
                             <span class="font-medium text-sm text-gray-800">${log.user ? log.user.name : 'System'}</span>
                             <span class="text-xs text-gray-500">${new Date(log.createdAt).toLocaleString()}</span>
                         </div>
                         <div class="text-sm text-gray-600">
                             ${log.action}: <span class="line-through text-gray-400">${log.oldValue || ''}</span> <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline lucide lucide-arrow-right"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg> <span>${log.newValue || ''}</span>
                         </div>
                     </div>
                 `).join('');
            } catch (e) {
                activityContainer.innerHTML = '<div class="text-sm text-red-500">Error loading activity.</div>';
            }
        }


        // Update Title
        const titleInput = modal.querySelector('#subtask-detail-title-input');
        const handleTitleUpdate = async () => {
            const newTitle = titleInput.value.trim();
            if (!newTitle || newTitle === subtask.title) return;
            try {
                await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/subtasks/${subtaskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: newTitle })
                });
                subtask.title = newTitle;
            } catch (e) { alert('Update failed'); titleInput.value = subtask.title; }
        };
        titleInput.addEventListener('blur', handleTitleUpdate);
        titleInput.addEventListener('keydown', e => { if (e.key === 'Enter') { titleInput.blur(); } });

        // Update Description
        const descInput = modal.querySelector('#subtask-description');
        const handleDescUpdate = async () => {
            const newDesc = descInput.value.trim();
            if (newDesc === (subtask.description || '')) return;
            try {
                await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/subtasks/${subtaskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ description: newDesc })
                });
                subtask.description = newDesc;
            } catch (e) { alert('Update failed'); descInput.value = subtask.description || ''; }
        };
        descInput.addEventListener('blur', handleDescUpdate);

        // Priority
        const priorityBtn = modal.querySelector('#subtask-detail-priority-btn');
        const priorityDropdown = modal.querySelector('#subtask-detail-priority-dropdown');
        priorityBtn.addEventListener('click', e => {
            e.stopPropagation();
            toggleDropdown(priorityBtn, priorityDropdown, 'subtask-priority-portal', (portal, closePortal) => {
                portal.querySelectorAll('.priority-option').forEach(opt => {
                    opt.addEventListener('click', async () => {
                        const newPriority = parseInt(opt.dataset.priority);
                        try {
                            await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/subtasks/${subtaskId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ priority: newPriority })
                            });
                            subtask.priority = newPriority;
                            priorityBtn.innerHTML = getPriorityChip(newPriority);
                            closePortal();
                        } catch (e) { alert('Update failed'); }
                    });
                });
            });
        });

        // Due Date (Calendar)
        const calendarBtn = modal.querySelector('#subtask-detail-calendar-btn');
        const calendarDropdown = modal.querySelector('#subtask-detail-calendar-dropdown');
        calendarBtn.addEventListener('click', e => {
            e.stopPropagation();
            toggleDropdown(calendarBtn, calendarDropdown, 'subtask-calendar-portal', (portal, closePortal) => {
                const host = portal.querySelector('#subtask-calendar');
                import('../components/calendar.js').then(({ default: Calendar }) => {
                    new Calendar(host, {
                        selectedDate: subtask.dueDate,
                        onChange: async (date) => {
                            const newDate = new Date(date);
                            newDate.setHours(12, 0, 0, 0);
                            try {
                                await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/subtasks/${subtaskId}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ dueDate: newDate.toISOString() })
                                });
                                subtask.dueDate = newDate.toISOString();
                                calendarBtn.textContent = newDate.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
                                closePortal();
                            } catch (e) { alert('Update failed'); }
                        }
                    });
                });
            });
        });

        // Assignee
        const assigneeBtn = modal.querySelector('#change-subtask-assignee');
        const assigneeDropdown = modal.querySelector('#subtask-assignee-detail-dropdown');
        const assigneeAvt = modal.querySelector('#subtask-detail-assignee-avt');
        assigneeBtn.addEventListener('click', e => {
            e.stopPropagation();
            toggleDropdown(assigneeBtn, assigneeDropdown, 'subtask-assignee-portal', async (portal, closePortal) => {
                const list = portal.querySelector('#subtask-assignee-detail-list');
                const search = portal.querySelector('#subtask-assignee-search');
                let members = [];
                try {
                    const mRes = await authFetch(`/projects/${projectId}/readProject`);
                    if (mRes.ok) members = (await mRes.json()).members || [];
                } catch (e) { }

                const render = (items) => {
                    list.innerHTML = items.map(m => `
                          <div class="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer" data-id="${m.userId}">
                              <div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">${m.name ? m.name[0] : '?'}</div>
                              <span class="text-sm">${m.name || 'Unnamed'}</span>
                          </div>
                      `).join('');
                    list.querySelectorAll('[data-id]').forEach(el => {
                        el.addEventListener('click', async () => {
                            const uid = el.dataset.id;
                            try {
                                await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/subtasks/${subtaskId}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ assigneeId: uid })
                                });
                                // update ui
                                const m = members.find(x => x.userId === uid);
                                assigneeAvt.innerHTML = `<div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs">${m.name[0]}</div><span class="text-sm font-medium text-gray-600">${m.name}</span>`;
                                closePortal();
                            } catch (e) { alert('Failed'); }
                        });
                    });
                };
                render(members);
                search.addEventListener('input', e => {
                    const v = e.target.value.toLowerCase();
                    render(members.filter(m => (m.name || '').toLowerCase().includes(v)));
                });
            });
        });

    } catch (err) {
        console.error("Open subtask modal failed", err);
        alert("Failed to open subtask details");
    }
}

export function closeSubtaskDetailModal() {
    return new Promise(resolve => {
        const modal = document.getElementById('subtask-detail-modal');
        const backdrop = document.getElementById('subtask-detail-modal-backdrop');
        if (modal && backdrop) {
            modal.classList.add('translate-x-full');
            backdrop.classList.add('opacity-0');
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
