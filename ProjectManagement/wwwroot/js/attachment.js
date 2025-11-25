import { authFetch } from "./auth.js";

async function _getAttachments(url) {
    try {
        const res = await authFetch(url);
        if (!res.ok) {
            const errorData = await res.text();
            console.error('Failed to get attachments. Server response:', errorData);
            throw new Error('Failed to get attachments');
        }
        return await res.json();
    } catch (err) {
        console.error('Failed to get attachments:', err);
        return [];
    }
}

async function _addAttachment(url, file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await authFetch(url, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Server error response:', errorText);
            throw new Error(`Failed to add attachment: ${errorText}`);
        }
        return await res.json();
    } catch (err) {
        console.error('Failed to add attachment:', err);
        throw err;
    }
}

async function _deleteAttachment(url) {
    try {
        const res = await authFetch(url, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete attachment');
        return await res.json();
    } catch (err) {
        console.error('Failed to delete attachment:', err);
        throw err;
    }
}

// Task Attachments
export function getTaskAttachments(taskId, boardId, columnId) {
    const url = `/boards/${boardId}/columns/${columnId}/tasks/${taskId}/attachments`;
    return _getAttachments(url);
}
export function addTaskAttachments(boardId, columnId, taskId, file) {
    const url = `/boards/${boardId}/columns/${columnId}/tasks/${taskId}/attachments`;
    return _addAttachment(url, file);
}
export function deleteAttachment(boardId, columnId, taskId, attachmentId) {
    const url = `/boards/${boardId}/columns/${columnId}/tasks/${taskId}/attachments/${attachmentId}`;
    return _deleteAttachment(url);
}

// Subtask Attachments
export function getSubtaskAttachments(taskId, subtaskId, boardId, columnId) {
    const url = `/boards/${boardId}/columns/${columnId}/tasks/${taskId}/subtasks/${subtaskId}/attachments`;
    return _getAttachments(url);
}
export function addSubtaskAttachments(boardId, columnId, taskId, subtaskId, file) {
    const url = `/boards/${boardId}/columns/${columnId}/tasks/${taskId}/subtasks/${subtaskId}/attachments`;
    return _addAttachment(url, file);
}
export async function deleteSubtaskAttachment(boardId, columnId, taskId, subtaskId, attachmentId) {
    const url = `/boards/${boardId}/columns/${columnId}/tasks/${taskId}/subtasks/${subtaskId}/attachments/${attachmentId}`;
    return _deleteAttachment(url);
}

// Comment Attachments
export function getCommentAttachments(commentId, taskId, boardId, columnId) {
    const url = `/boards/${boardId}/columns/${columnId}/tasks/${taskId}/comments/${commentId}/attachments`;
    return _getAttachments(url);
}
export function addCommentAttachments(boardId, columnId, taskId, commentId, file) {
    const url = `/boards/${boardId}/columns/${columnId}/tasks/${taskId}/comments/${commentId}/attachments`;
    return _addAttachment(url, file);
}
export async function deleteCommentAttachment(boardId, columnId, taskId, commentId, attachmentId) {
    const url = `/boards/${boardId}/columns/${columnId}/tasks/${taskId}/comments/${commentId}/attachments/${attachmentId}`;
    return _deleteAttachment(url);
}

function formatFileName(fileName) {
    // Remove the 32-character UUID prefix and underscore if present
    return fileName.replace(/^[a-f0-9]{32}_/i, '');
}

function createAttachmentHtml(attachment, boardId, columnId, taskId) {
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment.fileName);
    const isPptx = /\.(ppt|pptx)$/i.test(attachment.fileName);
    const isDocx = /\.(doc|docx)$/i.test(attachment.fileName);
    const isPdf = /\.(pdf)$/i.test(attachment.fileName);
    const icon = isImage
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-image-icon lucide-file-image text-blue-500"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><circle cx="10" cy="12" r="2"/><path d="m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22"/></svg>`
        : isPptx
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-chart-pie-icon lucide-file-chart-pie text-orange-500"><path d="M15.941 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.704l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v3.512"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M4.017 11.512a6 6 0 1 0 8.466 8.475"/><path d="M9 16a1 1 0 0 1-1-1v-4c0-.552.45-1.008.995-.917a6 6 0 0 1 4.922 4.922c.091.544-.365.995-.917.995z"/></svg>`
            : isDocx
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-type-corner-icon lucide-file-type-corner text-blue-500"><path d="M12 22h6a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v6"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M3 16v-1.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5V16"/><path d="M6 22h2"/><path d="M7 14v8"/></svg>`
                : isPdf
                    ? `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text-icon lucide-file-text text-red-500"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`
                    : `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file text-gray-500"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`;

    return `
        <div class="group flex items-center justify-between p-2 border rounded-md bg-white hover:bg-gray-50 text-sm text-gray-700 relative" id="attachment-${attachment.attachmentId}">
            <div class="flex items-center gap-2">
                <a href="/boards/${boardId}/columns/${columnId}/tasks/${taskId}/attachments/${attachment.attachmentId}/download" target="_blank" class="flex items-center gap-2 hover:underline" title="${attachment.fileName}">
                    ${icon}
                    <span class="truncate max-w-[150px]">${formatFileName(attachment.fileName)}</span>
                </a>
            </div>
            <button type="button" class="delete-attachment-btn p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" data-attachment-id="${attachment.attachmentId}">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
        </div>
    `;
}

export async function initAttachments(taskId, boardId, columnId, projectId, containerElement) {
    const attachmentsContainer = containerElement.querySelector('#task-attachments-list');
    const uploadFileInput = containerElement.querySelector('#task-upload-file');

    const renderAttachments = async () => {
        const taskAttachments = await getTaskAttachments(taskId, boardId, columnId);
        attachmentsContainer.innerHTML = taskAttachments.map(attachment => createAttachmentHtml(attachment, boardId, columnId, taskId)).join('');

        // Add event listeners for delete buttons
        attachmentsContainer.querySelectorAll('.delete-attachment-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this attachment?')) {
                    const attachmentId = btn.dataset.attachmentId;
                    try {
                        await deleteAttachment(boardId, columnId, taskId, attachmentId);
                        // Remove the element from DOM
                        const el = document.getElementById(`attachment-${attachmentId}`);
                        if (el) el.remove();
                    } catch (err) {
                        alert('Failed to delete attachment');
                    }
                }
            });
        });
    };

    // Initial render
    await renderAttachments();

    // Handle file upload
    // Remove existing event listener if any (to avoid duplicates if init is called multiple times)
    const newUploadInput = uploadFileInput.cloneNode(true);
    uploadFileInput.parentNode.replaceChild(newUploadInput, uploadFileInput);

    newUploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                await addTaskAttachments(boardId, columnId, taskId, file);
                await renderAttachments(); // Refresh list
                newUploadInput.value = ''; // Reset input
            } catch (err) {
                alert('Failed to upload attachment: ' + err.message);
            }
        }
    });
}