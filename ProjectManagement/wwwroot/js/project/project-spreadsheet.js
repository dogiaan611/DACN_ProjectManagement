import { authFetch } from "../auth/auth.js";
import { openTaskDetailModal } from "../task/taskDetail.js";
import { getPriorityChip } from "../task/taskUI.js";

/**
 * Initialize the spreadsheet view for the project
 * Called when user clicks on "Spreadsheet" view button
 */
export async function initProjectSpreadsheet() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    if (!projectId) {
        console.error('No project ID found');
        return;
    }

    const container = document.getElementById('project-content');
    container.innerHTML = '<div class="flex items-center justify-center p-10"><div class="animate-pulse">Đang tải...</div></div>';

    try {
        const spreadsheetHtml = await createSpreadsheet(projectId);
        container.innerHTML = spreadsheetHtml;
        initSpreadsheetEventListeners(projectId);
    } catch (error) {
        console.error('Error initializing spreadsheet:', error);
        container.innerHTML = `<p class="text-red-500">Lỗi khi tải spreadsheet: ${error.message}</p>`;
    }
}

/**
 * Create the spreadsheet HTML with all tasks from all columns
 */
async function createSpreadsheet(projectId) {
    // 1. Fetch Boards
    const boardsResponse = await authFetch(`/projects/${projectId}/boards`);
    if (!boardsResponse.ok) {
        throw new Error('Failed to fetch boards');
    }
    const boards = await boardsResponse.json();
    if (!boards || boards.length === 0) {
        return '<p class="text-gray-500 p-4">Không có board nào trong project này.</p>';
    }

    const boardId = boards[0].boardId;

    // 2. Fetch Columns
    const columnsResponse = await authFetch(`/boards/${boardId}/columns`);
    if (!columnsResponse.ok) {
        throw new Error('Failed to fetch columns');
    }
    const columns = await columnsResponse.json();

    // 3. Fetch all tasks from all columns
    const allTasks = [];
    for (const column of columns) {
        const tasksResponse = await authFetch(`/boards/${boardId}/columns/${column.columnId}/tasks`);
        if (tasksResponse.ok) {
            const tasks = await tasksResponse.json();
            // Add column info to each task
            tasks.forEach(task => {
                task.columnName = column.name || column.title || 'Untitled';
                task.columnId = column.columnId;
                task.boardId = boardId;
            });
            allTasks.push(...tasks);
        }
    }

    // Sort tasks by creation date (newest first)
    allTasks.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return createSpreadsheetTable(allTasks, projectId, boardId);
}

/**
 * Create the spreadsheet table HTML
 */
function createSpreadsheetTable(tasks, projectId, boardId) {
    const rowsHtml = tasks.map(task => createSpreadsheetRow(task)).join('');

    return `
        <div class="spreadsheet-container w-full overflow-x-auto bg-white rounded-lg shadow-sm border" data-project-id="${projectId}" data-board-id="${boardId}">
            <table class="w-full min-w-[1200px] text-sm">
                <thead class="bg-gray-50 border-b sticky top-0 z-10">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-[40%] min-w-[300px]">
                            <div class="flex items-center gap-2">
                                Task Name
                                <button class="sort-btn hover:text-blue-500" data-sort="title">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="m7 15 5 5 5-5"/>
                                        <path d="m7 9 5-5 5 5"/>
                                    </svg>
                                </button>
                            </div>
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                            <div class="flex items-center gap-2">
                                Status
                                <button class="sort-btn hover:text-blue-500" data-sort="status">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="m7 15 5 5 5-5"/>
                                        <path d="m7 9 5-5 5 5"/>
                                    </svg>
                                </button>
                            </div>
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">
                            <div class="flex items-center gap-2">
                                Priority
                                <button class="sort-btn hover:text-blue-500" data-sort="priority">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="m7 15 5 5 5-5"/>
                                        <path d="m7 9 5-5 5 5"/>
                                    </svg>
                                </button>
                            </div>
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">
                            Assignee
                        </th>
                        <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                            <div class="flex items-center gap-2">
                                Due Date
                                <button class="sort-btn hover:text-blue-500" data-sort="dueDate">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="m7 15 5 5 5-5"/>
                                        <path d="m7 9 5-5 5 5"/>
                                    </svg>
                                </button>
                            </div>
                        </th>
                        <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                            </svg>
                        </th>
                        <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
                            </svg>
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    ${rowsHtml || '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">Không có task nào</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Create a single spreadsheet row for a task
 */
function createSpreadsheetRow(task) {
    const priorityBadge = getPriorityBadge(task.priority);
    const statusBadge = getStatusBadge(task.columnName);
    const assigneeHtml = getAssigneeHtml(task.assignee, task.assigneeName, task.assigneeAvatarUrl);
    const dueDateHtml = getDueDateHtml(task.dueDate);
    const attachmentCount = task.attachmentCount || 0;
    const commentCount = task.commentCount || 0;

    return `
        <tr class="hover:bg-gray-50 transition-colors cursor-pointer spreadsheet-row" 
            data-task-id="${task.taskId}" 
            data-column-id="${task.columnId}"
            data-board-id="${task.boardId}">
            <td class="px-4 py-3">
                <div class="flex flex-col gap-1">
                    <div class="font-medium text-gray-800">${escapeHtml(task.title)}</div>
                    ${task.description ? `<div class="text-xs text-gray-500 line-clamp-1">${escapeHtml(task.description)}</div>` : ''}
                </div>
            </td>
            <td class="px-4 py-3">
                ${statusBadge}
            </td>
            <td class="px-4 py-3">
                ${priorityBadge}
            </td>
            <td class="px-4 py-3">
                ${assigneeHtml}
            </td>
            <td class="px-4 py-3">
                ${dueDateHtml}
            </td>
            <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1 text-gray-500">
                    ${attachmentCount > 0 ? `
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                        </svg>
                        <span class="text-xs">${attachmentCount}</span>
                    ` : '-'}
                </div>
            </td>
            <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1 text-gray-500">
                    ${commentCount > 0 ? `
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
                        </svg>
                        <span class="text-xs">${commentCount}</span>
                    ` : '-'}
                </div>
            </td>
        </tr>
    `;
}

/**
 * Get priority badge HTML - uses same style as list view
 */
function getPriorityBadge(priority) {
    return getPriorityChip(priority) || '';
}

/**
 * Get status badge HTML based on column name
 */
function getStatusBadge(columnName) {
    const statusColors = {
        'To Do': 'bg-gray-100 text-gray-700',
        'In Progress': 'bg-blue-100 text-blue-700',
        'Review': 'bg-yellow-100 text-yellow-700',
        'Done': 'bg-green-100 text-green-700',
        'Blocked': 'bg-red-100 text-red-700'
    };

    // Default color if not matched
    let colorClass = 'bg-gray-100 text-gray-700';

    // Match column name with status colors (case insensitive)
    for (const [status, color] of Object.entries(statusColors)) {
        if (columnName.toLowerCase().includes(status.toLowerCase())) {
            colorClass = color;
            break;
        }
    }

    return `
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}">
            ${escapeHtml(columnName)}
        </span>
    `;
}

/**
 * Get assignee HTML - uses same style as list view
 */
function getAssigneeHtml(assignee, assigneeName, assigneeAvatarUrl) {
    // Support both assignee object and separate name/avatar properties
    const name = assignee?.name || assigneeName;
    const avatarUrl = assignee?.avatarUrl || assigneeAvatarUrl;

    if (!name) {
        return '<span class="text-gray-400 text-xs">Unassigned</span>';
    }

    const initial = name.charAt(0).toUpperCase();
    const avatarHtml = avatarUrl
        ? `<img src="${avatarUrl}" alt="${escapeHtml(name)}" class="w-6 h-6 rounded-full border object-cover">`
        : `<div class="w-6 h-6 border flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">${initial}</div>`;

    return `
        <div class="flex items-center gap-2 text-sm text-gray-600">
            ${avatarHtml}
            <span class="truncate max-w-[100px]">${escapeHtml(name)}</span>
        </div>
    `;
}

/**
 * Get due date HTML with color coding
 */
function getDueDateHtml(dueDate) {
    if (!dueDate) {
        return '<span class="text-gray-400 text-xs">-</span>';
    }

    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    let colorClass = 'text-gray-700';
    let icon = '';

    if (diffDays < 0) {
        colorClass = 'text-red-600 font-medium';
        icon = '⚠️';
    } else if (diffDays === 0) {
        colorClass = 'text-orange-600 font-medium';
        icon = '📅';
    } else if (diffDays <= 3) {
        colorClass = 'text-yellow-600';
    }

    const formattedDate = due.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return `
        <div class="flex items-center gap-1 text-xs ${colorClass}">
            ${icon ? `<span>${icon}</span>` : ''}
            ${formattedDate}
        </div>
    `;
}

/**
 * Initialize event listeners for spreadsheet
 */
function initSpreadsheetEventListeners(projectId) {
    const container = document.querySelector('.spreadsheet-container');
    if (!container) return;

    // Click on row to open task detail
    container.addEventListener('click', (e) => {
        const row = e.target.closest('.spreadsheet-row');
        if (row) {
            const taskId = row.dataset.taskId;
            const columnId = row.dataset.columnId;
            const boardId = row.dataset.boardId;

            if (taskId && columnId && boardId) {
                openTaskDetailModal(taskId, projectId, boardId, columnId);
            }
        }
    });

    // Sort buttons
    const sortButtons = container.querySelectorAll('.sort-btn');
    sortButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent row click
            const sortBy = btn.dataset.sort;
            sortSpreadsheet(sortBy);
        });
    });

    // Listen for task updates
    document.addEventListener('task-updated', () => {
        initProjectSpreadsheet(); // Refresh spreadsheet
    });

    document.addEventListener('task-created', () => {
        initProjectSpreadsheet(); // Refresh spreadsheet
    });

    document.addEventListener('task-deleted', () => {
        initProjectSpreadsheet(); // Refresh spreadsheet
    });
}

/**
 * Sort spreadsheet by column
 */
function sortSpreadsheet(sortBy) {
    const tbody = document.querySelector('.spreadsheet-container tbody');
    if (!tbody) return;

    const rows = Array.from(tbody.querySelectorAll('tr.spreadsheet-row'));

    rows.sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
            case 'title':
                aValue = a.querySelector('td:nth-child(1) .font-medium')?.textContent || '';
                bValue = b.querySelector('td:nth-child(1) .font-medium')?.textContent || '';
                return aValue.localeCompare(bValue);

            case 'status':
                aValue = a.querySelector('td:nth-child(2) span')?.textContent || '';
                bValue = b.querySelector('td:nth-child(2) span')?.textContent || '';
                return aValue.localeCompare(bValue);

            case 'priority':
                const priorityOrder = ['Low Priority', 'Medium Priority', 'High Priority'];
                aValue = a.querySelector('td:nth-child(3) span')?.textContent.trim() || 'Low Priority';
                bValue = b.querySelector('td:nth-child(3) span')?.textContent.trim() || 'Low Priority';
                return priorityOrder.indexOf(aValue) - priorityOrder.indexOf(bValue);

            case 'dueDate':
                aValue = a.querySelector('td:nth-child(5)')?.textContent.trim() || '';
                bValue = b.querySelector('td:nth-child(5)')?.textContent.trim() || '';
                if (aValue === '-') return 1;
                if (bValue === '-') return -1;
                return new Date(aValue) - new Date(bValue);

            default:
                return 0;
        }
    });

    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
