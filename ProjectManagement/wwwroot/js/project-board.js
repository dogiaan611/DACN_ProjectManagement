import { authFetch } from "./auth.js";
export async function initProjectBoard() {
    const urlParams = new URLSearchParams(window.location.search);
    const container = document.getElementById('project-content');
    const projectId = urlParams.get('id');

    if (!projectId) return;

    // Dữ liệu mẫu cho các công việc (tasks)
    // Sau này bạn có thể thay thế bằng cách gọi API từ backend
    const tasks = [
        { id: 1, title: 'Thiết kế giao diện người dùng', description: 'Tạo wireframe và mockup cho trang chủ.', status: 'ToDo', priority: 'Low' },
        { id: 2, title: 'Phát triển API đăng nhập', description: 'Xây dựng endpoint cho việc xác thực người dùng.', status: 'InProgress', priority: 'Medium' },
        { id: 3, title: 'Viết tài liệu kỹ thuật', description: 'Tài liệu hóa các API đã hoàn thành.', status: 'InReview', priority: 'High' },
        { id: 4, title: 'Kiểm thử tính năng thanh toán', description: 'Kiểm tra luồng thanh toán với các trường hợp khác nhau.', status: 'Done', priority: 'Low' },
        { id: 5, title: 'Cấu hình server', description: 'Cài đặt và cấu hình môi trường production.', status: 'InProgress', priority: 'Medium' },
        { id: 6, title: 'Sửa lỗi hiển thị trên mobile', description: 'Lỗi vỡ giao diện trên màn hình nhỏ.', status: 'Done', priority: 'Medium' },
    ];

    container.innerHTML = await createBoard(tasks, projectId);

    // Thêm modal vào body và ẩn nó đi
    document.body.insertAdjacentHTML('beforeend', createTaskModalHtml());

    addDragAndDropHandlers(tasks);
    addEventListeners(tasks, projectId, container);
}

async function createBoard(tasks, projectId) {
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
    
    const columnsHtml = columns.map(column => {
        // Lọc các task thuộc về cột hiện tại
        const tasksInColumn = tasks.filter(task => task.status === column.columnId);

        const titleColour = (title) => {
            switch (title) { // The title property from the column object
                case 'To Do':
                    return 'border-l-4 rounded-l px-3 py-1';
                case 'In Progress':
                    return 'border-l-4 rounded-l border-l-blue-500 px-3 py-1';
                case 'Review':
                    return 'rounded-l px-3 py-1 border-orange-500 border-l-4';
                case 'Done':
                    return 'rounded-l px-3 py-1 border-l-4 border-l-green-200';
                default:
                    return 'rounded-2xl px-3 py-1 bg-gray-200';
            }
        }

        const getPriorityChip = (priority) => {
            switch (priority) {
                case 'High':
                    return `<div class="flex gap-1 items-center justify-start">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-700 lucide lucide-chevrons-up-icon lucide-chevrons-up"><path d="m17 11-5-5-5 5"/><path d="m17 18-5-5-5 5"/></svg>
                                <span class="text-sm font-semibold leading-none text-red-700">High Priority</span>
                            </div>`;
                case 'Medium':
                    return `<div class="flex gap-1 items-center justify-start">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-600 lucide lucide-chevron-up-icon lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg>
                                <span class="text-sm font-semibold leading-none text-yellow-600">Medium Priority</span>
                            </div>`;
                case 'Low':
                    return `<div class="flex gap-1 items-center justify-start">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
                                <span class="text-sm font-semibold leading-none text-blue-600">Low Priority</span>
                            </div>`;
                default:
                    return '';
            }
        };

        

        // Tạo HTML cho từng card công việc
        const tasksHtml = tasksInColumn.map(task => `
            <div class="bg-white p-4 rounded-md shadow-sm cursor-pointer" draggable="true" data-task-id="${task.id}">
                <div class="mb-2">
                    ${getPriorityChip(task.priority)}
                </div>
                <div class="flex justify-between items-start mb-2">
                    <span class="font-semibold text-gray-800">${task.title}</span>
                </div>
                <div class="text-sm text-gray-600 mt-1">${task.description}</div>
            </div>
        `).join('');

        // Tạo HTML cho toàn bộ cột
        return `
            <div class="flex-1 min-w-[250px] max-w-[280px] rounded-lg p-3 flex flex-col mb-3 border" id="column-${column.columnId}">
                <div class="flex flex-row justify-between mb-4 items-center transition-colors duration-100">
                    <h3 class="px-1 tracking-wide ${titleColour(column.name)}">${column.name}</h3>
                    <div role="button" class="add-task-btn flex hover:bg-gray-200 border-none rounded cursor-pointer p-1" data-column-id="${column.columnId}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    </div>
                </div>
                <div class="tasks-container flex-grow min-h-[100px] flex flex-col gap-4" data-column-id="${column.columnId}">
                    ${tasksHtml}
                </div>
            </div>
        `;
    }).join('');

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
        <div class="flex gap-6 h-full overflow-x-auto">
            ${columnsHtml}${addColumnButtonHtml}
        </div>
    `;
}

function addDragAndDropHandlers(tasks) {
    const draggables = document.querySelectorAll('[draggable="true"]');
    const columns = document.querySelectorAll('.tasks-container');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging', 'opacity-100');
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging', 'opacity-100');
        });
    });

    columns.forEach(column => {
        column.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(column, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                column.appendChild(draggable);
            } else {
                column.insertBefore(draggable, afterElement);
            }
        });

        // column.addEventListener('dragleave', () => {
        //     column.classList.remove('bg-gray-50');
        // });

        // column.addEventListener('drop', (e) => {
        //     e.preventDefault();
        //     column.classList.remove('bg-gray-50');
        // });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('[draggable="true"]:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function createTaskModalHtml() {
    return `
        <div id="task-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50">
            <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 class="text-2xl font-bold mb-4">Add New Task</h2>
                <form id="task-form">
                    <div class="mb-4">
                        <label for="task-title" class="block text-gray-700 font-semibold mb-2">Title</label>
                        <input type="text" id="task-title" name="title" class="w-full p-2 border rounded-md" required>
                    </div>
                    <div class="mb-4">
                        <label for="task-description" class="block text-gray-700 font-semibold mb-2">Description</label>
                        <textarea id="task-description" name="description" rows="3" class="w-full p-2 border rounded-md"></textarea>
                    </div>
                    <div class="mb-4">
                        <label for="task-priority" class="block text-gray-700 font-semibold mb-2">Priority</label>
                        <select id="task-priority" name="priority" class="w-full p-2 border rounded-md">
                            <option value="Low">Low</option>
                            <option value="Medium" selected>Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                    <div class="flex justify-end gap-4">
                        <button type="button" id="modal-cancel" class="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Add Task</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function addEventListeners(tasks, projectId, container) {
    const modal = document.getElementById('task-modal');
    const taskForm = document.getElementById('task-form');
    const cancelBtn = document.getElementById('modal-cancel');
    const addTaskBtns = document.querySelectorAll('.add-task-btn');

    const openModal = (columnId) => {
        taskForm.reset();
        modal.classList.remove('hidden');
        modal.dataset.columnId = columnId; // Lưu lại ID của cột
    };

    const closeModal = () => {
        modal.classList.add('hidden');
    };

    addTaskBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const columnId = btn.dataset.columnId;
            openModal(columnId);
        });
    });

    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(taskForm);
        const newTask = {
            // TODO: ID nên được tạo từ backend
            id: Date.now(), 
            title: formData.get('title'),
            description: formData.get('description'),
            priority: formData.get('priority'),
            status: modal.dataset.columnId
        };

        // TODO: Gửi API request để tạo task mới ở backend
        // authFetch(`/api/projects/${projectId}/tasks`, {
        //     method: 'POST',
        //     body: JSON.stringify(newTask)
        // }).then(res => {
        //     if (res.ok) {
        //         return res.json();
        //     }
        //     throw new Error('Failed to create task');
        // }).then(createdTask => {
        //     // Cập nhật giao diện với task đã được tạo
        // });
        
        // Tạm thời cập nhật giao diện với dữ liệu mẫu
        tasks.push(newTask);
        container.innerHTML = await createBoard(tasks, projectId);
        addDragAndDropHandlers(tasks);
        addEventListeners(tasks, projectId, container); // Gắn lại event listeners cho các nút mới
        closeModal();
    });
}