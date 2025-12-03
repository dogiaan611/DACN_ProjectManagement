import { authFetch } from "./auth.js";
import { createColumnHtml, initColumnEventListeners } from "./column.js";
import { initTaskEventListeners } from "./task.js";
import { createTaskCardHtml, createTaskDetailModalHtml } from "./taskUI.js";
export async function initProjectBoard() {
    const urlParams = new URLSearchParams(window.location.search);
    const container = document.getElementById('project-content');
    const projectId = urlParams.get('id');

    if (!projectId) return;

    container.innerHTML = await createBoard(projectId);

    // Lấy boardId từ board đầu tiên và truyền vào event listeners
    const firstBoardId = document.querySelector('[data-board-id]')?.dataset.boardId;
    addEventListeners([], projectId, container, firstBoardId);
}

export async function createBoard(projectId) {
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

    const addColumnButtonHtml = `
        <div role="button" id="add-column-btn" class="min-w-[250px] max-w-[280px] rounded-lg p-3 flex justify-center mb-3 bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors h-fit">
            <div class="flex items-center gap-2 text-gray-700 font-normal">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                <span>Add column</span>
            </div>
        </div>
    `;

    // Trả về HTML của toàn bộ bảng Kanban
    return `
        <div class="board-container flex gap-6 h-full overflow-x-auto">
            ${columnsHtml}${addColumnButtonHtml}
        </div>
    `;
}

function addEventListeners(tasks, projectId, container, boardId) {
    initTaskEventListeners(tasks, projectId, container, boardId);
    initColumnEventListeners(projectId);
}