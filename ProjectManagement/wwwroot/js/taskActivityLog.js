import { authFetch } from "./auth.js";

export async function initTaskActivityLog(boardId, columnId, taskId, modal) {
    const container = modal.querySelector('#task-activity-list');
    if (!container) return;

    fetchActivityLog(boardId, columnId, taskId, container);
}

async function fetchActivityLog(boardId, columnId, taskId, container) {
    try {
        container.innerHTML = '<div class="text-sm text-gray-500">Loading activities...</div>';
        const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/activity`);
        if (!res.ok) throw new Error('Failed to fetch activity');
        const logs = await res.json();
        renderActivityLogs(container, logs);
    } catch (err) {
        console.error("Error fetching activity log: ", err);
    }
}

function renderActivityLogs(container, logs) {
    container.innerHTML = '';
    if (logs.length === 0) {
        container.innerHTML = '<div class="text-sm text-red-500">No activity yet.</div>'
        return;
    }

    logs.forEach(log => {
        const date = new Date(log.createdAt).toLocaleString('vi-VN');
        const userInitial = log.userName ? log.userName.charAt(0).toUpperCase() : 'U';
        const avatarHtml = `<div class="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 text-xs font-medium">${userInitial}</div>`;
        const itemHtml = `
            <div class="flex gap-3 items-start">
                ${avatarHtml}
                <div class="flex flex-col">
                    <div class="text-sm text-gray-800">
                        <span class="font-semibold">${log.userName || 'Unknown'}</span>
                        <span class="text-gray-600">${log.action}</span>
                    </div>
                    <span class="text-xs text-gray-400">${date}</span>
                    <div class="text-xs text-gray-500 mt-1">${formatLogMessage(log)}</div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHtml);
    });
}

function formatLogMessage(log) {
    const action = log.action;

    if (action === 'Create Task') {
        return 'Created this task';
    }

    if (action === 'Add Watcher') {
        return 'Added watcher';
    }

    if (action === 'Remove Watcher') {
        return 'Removed watcher';
    }

    if (action.startsWith('Update Task')) {
        try {
            const oldObj = log.oldValue ? JSON.parse(log.oldValue) : {};
            const newObj = log.newValue ? JSON.parse(log.newValue) : {};

            // Extract changed fields from Action string: "Update Task - Title, Description"
            const changedFields = action.replace('Update Task - ', '').split(', ');

            const changes = changedFields.map(field => {
                const key = field.trim();

                // Helper to get value safely
                const getVal = (obj, k) => {
                    if (obj[k] !== undefined) return obj[k];
                    return obj[k] || '';
                };

                let valOld = getVal(oldObj, key);
                let valNew = getVal(newObj, key);

                // Formatting for specific types
                if (key === 'DueDate') {
                    if (valOld) valOld = new Date(valOld).toLocaleString('vi-VN');
                    if (valNew) valNew = new Date(valNew).toLocaleString('vi-VN');
                }

                if (valOld === null || valOld === undefined || valOld === '') valOld = 'empty';
                if (valNew === null || valNew === undefined || valNew === '') valNew = 'empty';

                return `Changed <b>${key}</b> from "<b>${valOld}</b>" to "<b>${valNew}</b>"`;
            });

            return changes.join('<br>');

        } catch (e) {
            console.warn('Failed to parse activity log JSON', e);
            // Fallback to raw display if parsing fails
        }
    }

    // Default / Fallback
    if (log.oldValue || log.newValue) {
        return `Changed from "<b>${log.oldValue}</b>" to "<b>${log.newValue}</b>"`;
    }

    return '';
}