import { authFetch } from "./auth.js";
import { initColumnEventListeners } from "./column.js";
import { initTaskEventListeners } from "./task.js";
import { createTaskRowHtml } from "./taskUI.js";
import { getColumnTitleColour } from "./column.js";
export async function initProjectList() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    if (!projectId) return;

    const container = document.getElementById('project-content');
    container.innerHTML = await createList(projectId);

    // Get boardId from the first rendered group (if any)
    const firstGroup = container.querySelector('[data-board-id]');
    const boardId = firstGroup ? firstGroup.dataset.boardId : null;

    addEventListeners(projectId, container, boardId);
}

export async function createList(projectId) {
    // 1. Fetch Boards
    const boardsResponse = await authFetch(`/projects/${projectId}/boards`);
    if (!boardsResponse.ok) {
        console.error("Failed to fetch boards");
        return `<p class="text-red-500">Error loading project lists.</p>`;
    }
    const boards = await boardsResponse.json();
    if (!boards || boards.length === 0) {
        return `<p>No boards found for this project.</p>`;
    }

    // Use the first board
    const boardId = boards[0].boardId;

    // 2. Fetch Columns
    const columnsResponse = await authFetch(`/boards/${boardId}/columns`);
    if (!columnsResponse.ok) {
        return `<p class="text-red-500">Error loading list rows.</p>`;
    }
    const columns = await columnsResponse.json();

    // 3. Fetch Tasks for each Column and Render
    const rowsHtmlPromises = columns.map(async column => {
        const tasksResponse = await authFetch(`/boards/${boardId}/columns/${column.columnId}/tasks`);
        let tasksInColumn = [];
        if (tasksResponse.ok) {
            tasksInColumn = await tasksResponse.json();
        }

        const tasksHtml = tasksInColumn.map(task =>
            createTaskRowHtml(task)
        ).join('');

        return createListGroupHtml(column, tasksHtml, boardId, tasksInColumn.length);
    });

    const rowsHtml = (await Promise.all(rowsHtmlPromises)).join('');

    // 4. Render Final HTML
    return `
        <div class="list-view-container flex flex-col w-full mx-auto pb-10">
            ${rowsHtml}
        </div>
    `;
}

function createListGroupHtml(column, tasksHtml, boardId, taskCount) {
    const headerHtml = `
        <div class="flex items-center px-3 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <div class="w-[40%] min-w-[300px] pl-2">Task Name</div>
            <div class="flex items-center gap-6">
                <div class="w-32">Priority</div>
                <div class="w-32">Assignee</div>
                <div class="w-32 text-right">Due Date</div>
                <div class="w-5"></div>
                <div class="w-5"></div>
                <div class="w-4"></div>
            </div>
        </div>
    `;

    return `
        <div class="flex flex-col gap-2 w-full mb-6" id="column-${column.columnId}" draggable="true">
            <div class="flex items-center justify-between px-2">
                <div class="flex items-center gap-2">
                    <div class="${getColumnTitleColour(column.name || column.title || '')}"></div>
                    <h3 class="font-semibold text-gray-700">${column.name || column.title || 'Untitled'}</h3>
                    <span class="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">${taskCount}</span>
                </div>
            </div>
            <div class="tasks-container flex flex-col border rounded-lg overflow-hidden bg-white shadow-sm" data-column-id="${column.columnId}" data-board-id="${boardId}">
                ${headerHtml}
                ${tasksHtml}
                <!-- Add Task Button for this group -->
                <div class="list-group-footer p-1 border-t bg-gray-50">
                    <button class="add-task-btn w-full py-1.5 px-3 flex items-center justify-start gap-2 text-gray-500 hover:bg-gray-200 rounded-md transition-colors text-sm font-medium" data-column-id="${column.columnId}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                        Add Task
                    </button>
                </div>
            </div>
        </div>
    `;
}

function addEventListeners(projectId, container, boardId) {
    // Pass empty array for tasks as initTaskEventListeners doesn't use it
    initTaskEventListeners([], projectId, container);
    initColumnEventListeners(projectId);
}