import { authFetch } from "../auth/auth.js";
import { initProjectBoard } from "./project-board.js";
import { initializeDragAndDrop } from "../project/drag-drop.js";

export function getColumnTitleColour(title) {
    switch (title.toLowerCase()) {
        case 'to do':
            return 'w-3 h-3 rounded-full bg-blue-500';
        case 'in progress':
            return 'w-3 h-3 rounded-full bg-orange-500';
        case 'review':
            return 'w-3 h-3 rounded-full bg-purple-500';
        case 'done':
            return 'w-3 h-3 rounded-full bg-green-500';
        default:
            return 'w-3 h-3 rounded-full bg-pink-500';
    }
}

export function createColumnHtml(column, tasksHtml, boardId, taskCount, showAddTask = true) {
    return `
        <div class="group flex-1 min-w-[250px] max-w-[280px] rounded-lg p-3 flex flex-col mb-3 overflow-visible bg-gray-50" id="column-${column.columnId}" draggable="true">
            <div class="flex flex-row justify-between mb-4 py-2 px-1 rounded-md bg-white items-center transition-colors duration-100">
                <div class="px-2 flex gap-1 items-center justify-start">
                    <div class="${getColumnTitleColour(column.name)}"></div>
                    <div class="flex items-center justify-center gap-1">
                        <h3 class="px-1 tracking-wide text-gray-700">${column.name}</h3>
                        <span class="text-xs font-bold flex border rounded-xl px-2 py-1 text-gray-500">${taskCount}</span>
                    </div>
                </div>
                <div class="group-hover:opacity-100 opacity-0 flex items-center transition-opacity duration-200">
                    <div role="button" class="column-option-btn flex hover:bg-gray-100 border-none rounded cursor-pointer p-1" data-column-id="${column.columnId}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ellipsis-vertical-icon lucide-ellipsis-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                    </div>
                    ${showAddTask ? `
                    <div role="button" class="add-task-btn flex hover:bg-gray-100 border-none rounded cursor-pointer p-1" data-column-id="${column.columnId}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    </div>
                    ` : ''}
                </div>
            </div>
            <div class="tasks-container flex-grow min-h-[100px] flex flex-col gap-4" data-column-id="${column.columnId}" data-board-id="${boardId}">
                ${tasksHtml}
            </div>
        </div>
    `;
}

async function addColumnApi(boardId, payload) {
    try {
        const res = await authFetch(`/boards/${boardId}/columns`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            throw new Error('Failed to add new column');
        }
        return res.json();
    } catch (err) {
        console.error('Error adding column:', err);
        throw err;
    }
}

async function renameColumn(boardId, columnId, payload) {
    try {
        const res = await authFetch(`/boards/${boardId}/columns/${columnId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to rename column');
        }
        return true;
    } catch (err) {
        console.error('Error renaming column:', err);
        throw err;
    }
}

async function moveColumnApi(boardId, columnId, newPosition) {
    try {
        const res = await authFetch(`/boards/${boardId}/columns/${columnId}`, {
            method: 'PUT',
            body: JSON.stringify({ position: newPosition }),
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({})); // Bắt lỗi nếu response không có JSON
            throw new Error(errorData.message || res.statusText || 'Failed to move column');
        }
        return true;
    } catch (err) {
        console.error('Error moving column:', err);
        throw err;
    }
}

async function deleteColumn(boardId, columnId) {
    try {
        const res = await authFetch(`/boards/${boardId}/columns/${columnId}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to delete column');
            } else {
                throw new Error(res.statusText || 'Failed to delete column');
            }
        }
        return true;
    } catch (err) {
        console.error('Error deleting column:', err);
        throw err;
    }
}

export function initColumnEventListeners(projectId) {
    const addColumnBtn = document.getElementById('add-column-btn');
    if (!addColumnBtn) return;

    // Tao columnn
    addColumnBtn.addEventListener('click', async () => {
        addColumnBtn.classList.add('hidden');

        const formHtml = `
            <div id="new-column-form-container" class="min-w-[280px] max-w-[280px] rounded-lg border-blue-400 border p-1 flex flex-col mb-3 h-fit">
                <form id="new-column-form" class="flex gap-1 items-center justify-between">
                    <input type="text" id="new-column-name" placeholder="Enter column name..." class="transition-colors duration-200 w-full px-2 py-1 border-none rounded-md outline-none" required autocomplete="off">
                    <button type="submit" class="flex items-center justify-center rounded-md bg-blue-400 text-white px-2 py-1">
                        Done
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-corner-down-left-icon lucide-corner-down-left"><path d="M20 4v7a4 4 0 0 1-4 4H4"/><path d="m9 10-5 5 5 5"/></svg>
                    </button>
                </form>
            </div>
        `;

        addColumnBtn.insertAdjacentHTML('afterend', formHtml);

        const formContainer = document.getElementById('new-column-form-container');
        const form = document.getElementById('new-column-form');
        const input = document.getElementById('new-column-name');
        input.focus();

        const cleanup = () => {
            formContainer.remove();
            addColumnBtn.classList.remove('hidden');
        };

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const columnName = input.value.trim();
            if (columnName) {
                try {
                    const boardsResponse = await authFetch(`/projects/${projectId}/boards`);
                    const boards = await boardsResponse.json();
                    const boardId = boards[0]?.boardId;
                    if (boardId) {
                        await addColumnApi(boardId, { name: columnName });
                        initProjectBoard(); // Tải lại toàn bộ board
                    } else {
                        throw new Error("Board ID not found.");
                    }
                } catch (error) {
                    console.error('Error adding column:', error);
                    alert('Error: Could not add the new column.');
                    cleanup();
                }
            }
        });

        input.addEventListener('blur', () => {
            setTimeout(() => {
                if (document.getElementById('new-column-name')) {
                    cleanup();
                }
            }, 100);
        });
    });

    // Modal column option
    const columnModalHtml = `
        <div class="py-2 px-1 border rounded-sm max-w-[200px] min-w-[170px] flex flex-col justify-start gap-1">
            <div role="button" id="rename-col-btn" class="w-full hover:bg-gray-100 rounded-md flex items-center justify-start px-2 py-1 gap-2 text-gray-600 font-normal text-sm cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder-pen-icon lucide-folder-pen"><path d="M2 11.5V5a2 2 0 0 1 2-2h3.9c.7 0 1.3.3 1.7.9l.8 1.2c.4.6 1 .9 1.7.9H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-9.5"/><path d="M11.378 13.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/></svg>
                Rename
            </div>

            <div role="button" id="delete-col-btn" class="w-full hover:bg-gray-100 rounded-md flex items-center justify-start px-2 py-1 gap-2 text-gray-600 font-normal text-sm cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-icon lucide-trash"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                Delete
            </div>

            <div role="button" id="set-limit-btn" class="w-full hover:bg-gray-100 rounded-md flex items-center justify-start px-2 py-1 gap-2 text-gray-600 font-normal text-sm cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chart-column-stacked-icon lucide-chart-column-stacked"><path d="M11 13H7"/><path d="M19 9h-4"/><path d="M3 3v16a2 2 0 0 0 2 2h16"/><rect x="15" y="5" width="4" height="12" rx="1"/><rect x="7" y="8" width="4" height="9" rx="1"/></svg>
                Set WIP limit
            </div>

            <div role="button" id="move-col-btn" class="w-full hover:bg-gray-100 rounded-md flex items-center justify-start px-2 py-1 gap-2 text-gray-600 font-normal text-sm cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-vertical-icon lucide-grip-vertical"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                Move Column
            </div>
        </div>`;

    const columnOption = document.querySelectorAll('.column-option-btn');
    columnOption.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();

            // Đóng popup cũ nếu có
            const existingPopup = document.getElementById('column-options-popup');
            if (existingPopup) {
                existingPopup.remove();
            }

            const columnId = btn.dataset.columnId;
            const rect = btn.getBoundingClientRect(); // Lấy vị trí của nút option

            //tao modal
            const popupContainer = document.createElement('div');
            popupContainer.id = 'column-options-popup';

            // Thêm class Tailwind cho style và hiệu ứng
            popupContainer.classList.add(
                'fixed', 'z-50', 'bg-white', 'shadow-lg', 'rounded',
                'transition-all', 'duration-200', 'ease-out', // Class cho animation
                'opacity-0', 'scale-95' // Trạng thái ban đầu
            );

            // Định vị popup
            popupContainer.style.top = `${rect.bottom + 4}px`; // Vị trí dưới nút + 4px khoảng đệm
            popupContainer.style.left = `${rect.left}px`; // Căn lề trái với nút

            popupContainer.innerHTML = columnModalHtml;
            document.body.appendChild(popupContainer); // Thêm popup vào body

            // Kích hoạt animation mở
            requestAnimationFrame(() => {
                popupContainer.classList.remove('opacity-0', 'scale-95');
                popupContainer.classList.add('opacity-100', 'scale-100');
                btn.classList.add('hidden');
            });
            const closePopup = (event) => {
                if (!popupContainer.contains(event.target)) {
                    // Kích hoạt animation đóng
                    popupContainer.classList.remove('opacity-100', 'scale-100');
                    popupContainer.classList.add('opacity-0', 'scale-95');
                    btn.classList.remove('hidden');
                    // Xóa element sau khi animation kết thúc
                    setTimeout(() => popupContainer.remove(), 200); // 200ms khớp với duration-200
                    document.removeEventListener('click', closePopup);
                }
            };

            document.addEventListener('click', closePopup);
            const renameBtn = popupContainer.querySelector('#rename-col-btn');
            renameBtn.addEventListener('click', () => {
                // Đóng popup
                popupContainer.remove();
                document.removeEventListener('click', closePopup);

                const columnElement = document.getElementById(`column-${columnId}`);
                const h3 = columnElement.querySelector('h3');
                const currentName = h3.textContent;

                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentName;
                input.className = 'ml-1 w-full border border-blue-400 rounded-md px-2 py-1 text-xs outline-none';

                h3.replaceWith(input);
                input.focus();
                input.select();

                const handleRename = async () => {
                    const newName = input.value.trim();
                    if (newName && newName !== currentName) {
                        try {
                            const boardsResponse = await authFetch(`/projects/${projectId}/boards`);
                            const boards = await boardsResponse.json();
                            const boardId = boards[0]?.boardId;
                            await renameColumn(boardId, columnId, { name: newName });
                            initProjectBoard();
                        } catch (error) {
                            alert(`Error renaming column: ${error.message}`);
                            input.replaceWith(h3);
                        }
                    } else {
                        input.replaceWith(h3);
                    }
                };

                input.addEventListener('blur', handleRename);

                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        handleRename();
                    } else if (e.key === 'Escape') {
                        input.replaceWith(h3);
                    }
                });
            });


            //modal delete
            const delColBtn = popupContainer.querySelector('#delete-col-btn');
            delColBtn.addEventListener('click', async () => {
                popupContainer.remove(); // Đóng popup options
                document.removeEventListener('click', closePopup); // Gỡ bỏ listener của popup options

                // Tạo và chèn HTML modal nếu chưa có
                if (!document.getElementById('del-col-modal')) {
                    const delConfirmHtml = `
                    <div id="del-col-backdrop" class="fixed inset-0 z-50 hidden bg-black/40 opacity-0 transition-opacity duration-300"></div>
                    <div id="del-col-modal" class="fixed inset-0 z-50 hidden items-center justify-center overflow-y-auto">
                        <div id="del-col-outer" class="min-h-full w-full p-4 flex items-center justify-center">
                            <div class="mx-auto w-full max-w-md rounded-2xl bg-white shadow-2xl transform scale-95 opacity-0 transition-all duration-300 ease-out" role="dialog" aria-modal="true">
                                <div class="px-6 py-8">
                                     <div class="flex flex-col items-center justify-center px-4 gap-3">
                                        <div class="flex rounded-full p-4 bg-red-100">
                                            <div class="flex items-center justify-center bg-red-500 rounded-full p-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert-icon lucide-circle-alert text-white text-xl"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                            </div>
                                        </div>
                                        <div class="text-2xl font-bold text-center">Delete this column?</div>
                                        <div class="text-sm text-gray-500 text-center">Are you sure you want to delete this column? All tasks within it will also be removed. This action cannot be undone.</div>
                                        <div class="flex flex-row w-full items-center justify-center gap-2 mt-4">
                                            <button id="confirm-delete-col-btn" class="flex items-center justify-center w-full px-5 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-700 transition-colors duration-150 ease-in">Delete</button>
                                            <button id="cancel-delete-col-btn" class="flex items-center justify-center w-full px-5 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-150 ease-in border-2 font-medium">Cancel</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    document.body.insertAdjacentHTML('beforeend', delConfirmHtml);
                }

                const backdrop = document.getElementById('del-col-backdrop');
                const modal = document.getElementById('del-col-modal');
                const modalContent = modal.querySelector('[role="dialog"]');
                const cancelBtn = document.getElementById('cancel-delete-col-btn');
                const confirmBtn = document.getElementById('confirm-delete-col-btn');

                const openModal = () => {
                    modal.classList.remove('hidden');
                    modal.classList.add('flex');
                    setTimeout(() => {
                        backdrop.classList.add('opacity-100');
                        modalContent.classList.remove('scale-95', 'opacity-0');
                        modalContent.classList.add('scale-100', 'opacity-100');
                    }, 10);
                };

                const closeModal = () => {
                    modalContent.classList.add('scale-95', 'opacity-0');
                    backdrop.classList.remove('opacity-100');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        modal.classList.remove('flex');
                        btn.classList.remove('hidden');
                    }, 200);
                };

                openModal();

                backdrop.onclick = closeModal;
                cancelBtn.onclick = closeModal;
                modal.onclick = (e) => { if (e.target.id === 'del-col-outer') closeModal(); };

                confirmBtn.onclick = async () => {
                    try {
                        // Lấy boardId để thực hiện request
                        const boardsResponse = await authFetch(`/projects/${projectId}/boards`);
                        const boards = await boardsResponse.json();
                        const boardId = boards[0]?.boardId;
                        await deleteColumn(boardId, columnId);
                        closeModal();
                        initProjectBoard();
                    } catch (err) {
                        console.log('cannot delete this column', err);
                    }
                };
            });
        })
    })

    // Khởi tạo kéo-thả cho cột
    initializeDragAndDrop({
        containerSelector: '.board-container, .list-view-container', // Selector cho board hoặc list container
        draggableSelector: '[draggable="true"][id^="column-"]', // Selector cho các cột (có id bắt đầu bằng column-)
        onDrop: async (e) => {
            const draggingColumn = e.currentTarget.querySelector('.dragging');
            if (!draggingColumn) return;

            const columnId = draggingColumn.id.replace('column-', '');
            const boardContainer = e.currentTarget;
            const allColumns = [...boardContainer.querySelectorAll('[draggable="true"][id^="column-"]')];
            const newPosition = allColumns.findIndex(c => c.id === draggingColumn.id);

            try {
                const boardsResponse = await authFetch(`/projects/${projectId}/boards`);
                const boards = await boardsResponse.json();
                const boardId = boards[0]?.boardId;

                if (boardId) {
                    await moveColumnApi(boardId, columnId, newPosition);
                    // Tải lại board để đảm bảo thứ tự là chính xác từ server
                    initProjectBoard();
                } else {
                    throw new Error("Board ID not found for moving column.");
                }
            } catch (error) {
                alert(`Error moving column: ${error.message}`);
                // Nếu lỗi, tải lại board để khôi phục vị trí cũ
                initProjectBoard();
            }
        }
    });
}