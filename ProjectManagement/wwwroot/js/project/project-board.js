import { authFetch } from "../auth/auth.js";
import { createColumnHtml, initColumnEventListeners } from "./column.js";
import { initTaskEventListeners } from "../task/task.js";
import { createTaskCardHtml, createTaskDetailModalHtml } from "../task/taskUI.js";

export async function initProjectBoard(projectType) {
    const urlParams = new URLSearchParams(window.location.search);
    const container = document.getElementById('project-content');
    const projectId = urlParams.get('id');

    if (!projectId) return;

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

    // Default to Kanban if type is still not determined or 0.
    // Scrum = 1, Kanban = 0.
    if (type === 1) {
        container.innerHTML = await renderScrumBoard(projectId);
    } else {
        container.innerHTML = await renderKanbanBoard(projectId);
    }

    // Lấy boardId từ board đầu tiên và truyền vào event listeners
    const firstBoardId = document.querySelector('[data-board-id]')?.dataset.boardId;
    addEventListeners([], projectId, container, firstBoardId, type);
}

async function renderKanbanBoard(projectId) {
    // Fetch boards for the project
    const boardsResponse = await authFetch(`/projects/${projectId}/boards`);
    if (!boardsResponse.ok) {
        console.error("Failed to fetch boards");
        return `<p class="text-red-500">Error loading project boards.</p>`;
    }
    const boards = await boardsResponse.json();

    if (!boards || boards.length === 0) {
        return `<p>No boards found for this project.</p>`;
    }

    // Assume we are working with the first board
    const boardId = boards[0].boardId;

    // Fetch columns for the board
    const columnsResponse = await authFetch(`/boards/${boardId}/columns`);
    if (!columnsResponse.ok) {
        return `<p class="text-red-500">Error loading board columns.</p>`;
    }
    const columns = await columnsResponse.json();

    const columnsHtmlPromises = columns.map(async column => {
        // Fetch tasks for this column
        const tasksResponse = await authFetch(`/boards/${boardId}/columns/${column.columnId}/tasks`);
        let tasksInColumn = [];
        if (tasksResponse.ok) {
            tasksInColumn = await tasksResponse.json();
        }

        // Tạo HTML cho từng card công việc
        const tasksHtml = tasksInColumn.map(task =>
            createTaskCardHtml(task, task.commentCount, task.attachmentCount)
        ).join('');

        // Tạo HTML cho toàn bộ cột
        return createColumnHtml(column, tasksHtml, boardId, tasksInColumn.length);
    });

    const columnsHtml = (await Promise.all(columnsHtmlPromises)).join('');

    return renderBoardContainer(columnsHtml);
}

async function renderScrumBoard(projectId) {
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
    // We use the sprint backlog API which returns tasks with column info
    const sprintTasksRes = await authFetch(`/projects/${projectId}/sprints/${activeSprint.sprintId}/backlog`);
    if (!sprintTasksRes.ok) return `<p class="text-red-500">Error loading sprint tasks.</p>`;
    const sprintData = await sprintTasksRes.json();
    const tasks = sprintData.tasks || [];

    // 4. Map tasks to columns
    const columnsHtmlPromises = columns.map(async column => {
        // Filter tasks for this column
        const tasksInColumn = tasks.filter(t => t.column.columnId === column.columnId);

        // Render tasks
        const tasksHtml = tasksInColumn.map(task =>
            createTaskCardHtml(task, task.commentCount || 0, task.attachmentCount || 0)
        ).join('');

        return createColumnHtml(column, tasksHtml, boardId, tasksInColumn.length);
    });

    const columnsHtml = (await Promise.all(columnsHtmlPromises)).join('');

    return renderBoardContainer(columnsHtml);
}

function renderBoardContainer(columnsHtml) {
    const addColumnButtonHtml = `
        <div role="button" id="add-column-btn" class="min-w-[250px] max-w-[280px] rounded-lg p-3 flex justify-center mb-3 bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors h-fit">
            <div class="flex items-center gap-2 text-gray-700 font-normal">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                <span>Add column</span>
            </div>
        </div>
    `;

    return `
        <div class="board-container flex gap-6 h-full overflow-x-auto">
            ${columnsHtml}${addColumnButtonHtml}
        </div>
    `;
}

// Deprecated: createBoard is now split, but kept for compatibility if needed
export async function createBoard(projectId) {
    return await renderKanbanBoard(projectId);
}

function addEventListeners(tasks, projectId, container, boardId, projectType) {
    initTaskEventListeners(tasks, projectId, container, projectType);
    initColumnEventListeners(projectId);
}