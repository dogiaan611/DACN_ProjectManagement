import { authFetch } from "./auth.js";
import { initColumnEventListeners } from "./column.js";
import { initTaskEventListeners } from "./task.js";
import { createTaskRowHtml } from "./taskUI.js";
import { getColumnTitleColour } from "./column.js";

export async function initProjectList(projectType) {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    if (!projectId) return;

    const container = document.getElementById('project-content');

    let type = projectType;
    if (type === undefined) {
        try {
            const res = await authFetch(`/projects/${projectId}/readProject`);
            if (res.ok) {
                const data = await res.json();
                type = data.type;
            }
        } catch (e) {
            console.error("Error fetching project type", e);
        }
    }

    if (type === 1) {
        container.innerHTML = await renderScrumList(projectId);
    } else {
        container.innerHTML = await renderKanbanList(projectId);
    }

    // Get boardId from the first rendered group (if any)
    const firstGroup = container.querySelector('[data-board-id]');
    const boardId = firstGroup ? firstGroup.dataset.boardId : null;

    addEventListeners(projectId, container, boardId);
}

async function renderKanbanList(projectId) {
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

async function renderScrumList(projectId) {
    // 1. Fetch Sprints to find Active Sprint
    const sprintsRes = await authFetch(`/projects/${projectId}/sprints`);
    if (!sprintsRes.ok) return `<p class="text-red-500">Error loading sprints.</p>`;
    const sprints = await sprintsRes.json();

    const activeSprint = sprints.find(s => s.status === 1); // 1 = Active

    if (!activeSprint) {
        return `
            <div class="flex flex-col items-center justify-center h-[60vh] text-center">
                <div class="bg-blue-50 p-6 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rocket text-blue-500"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
                </div>
                <h2 class="text-xl font-bold text-gray-900 mb-2">Get started in the backlog</h2>
                <p class="text-gray-500 mb-6 max-w-md">Plan and start a sprint to see work here.</p>
                <button onclick="document.getElementById('backlog-view-btn').click()" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors">
                    Go to Backlog
                </button>
            </div>
        `;
    }

    // 2. Fetch Board & Columns (Structure)
    const boardsResponse = await authFetch(`/projects/${projectId}/boards`);
    if (!boardsResponse.ok) return `<p class="text-red-500">Error loading boards.</p>`;
    const boards = await boardsResponse.json();
    if (!boards || boards.length === 0) return `<p>No boards found.</p>`;
    const boardId = boards[0].boardId;

    const columnsResponse = await authFetch(`/boards/${boardId}/columns`);
    if (!columnsResponse.ok) return `<p class="text-red-500">Error loading columns.</p>`;
    const columns = await columnsResponse.json();

    // 3. Fetch Tasks for Active Sprint
    const sprintTasksRes = await authFetch(`/projects/${projectId}/sprints/${activeSprint.sprintId}/backlog`);
    if (!sprintTasksRes.ok) return `<p class="text-red-500">Error loading sprint tasks.</p>`;
    const sprintData = await sprintTasksRes.json();
    const tasks = sprintData.tasks || [];

    // 4. Map tasks to columns
    const rowsHtmlPromises = columns.map(async column => {
        // Filter tasks for this column
        const tasksInColumn = tasks.filter(t => t.column.columnId === column.columnId);

        const tasksHtml = tasksInColumn.map(task =>
            createTaskRowHtml(task)
        ).join('');

        return createListGroupHtml(column, tasksHtml, boardId, tasksInColumn.length);
    });

    const rowsHtml = (await Promise.all(rowsHtmlPromises)).join('');

    return `
        <div class="list-view-container flex flex-col w-full mx-auto pb-10">
            <div class="mb-4 px-2">
                <span class="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    Active Sprint: ${activeSprint.name}
                </span>
            </div>
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
    initTaskEventListeners([], projectId, container, 0);
    initColumnEventListeners(projectId);
}