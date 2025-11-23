import { authFetch } from './auth.js';

export async function initComments(taskId, boardId, projectId, columnId, container) {
    const listContainer = container.querySelector('#task-comments-list');
    const input = container.querySelector('#new-comment-content');
    const addBtn = container.querySelector('#add-comment-btn');

    // Setup mention dropdown
    const inputWrapper = input.parentElement;
    let currentUser = null;
    let members = [];

    function setupInputWithMentions(inputEl, containerEl, onSubmit, onCancel) {
        containerEl.classList.add('relative');
        const dropdown = document.createElement('div');
        dropdown.className = 'hidden absolute bottom-full left-0 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto z-50 mb-1';
        containerEl.appendChild(dropdown);

        let selectedIndex = 0;
        let currentMentionRange = null;

        const updateHighlight = () => {
            const items = dropdown.querySelectorAll('.mention-item');
            items.forEach((item, index) => {
                if (index === selectedIndex) {
                    item.classList.add('bg-gray-50');
                    item.classList.remove('hover:bg-gray-100');
                    item.scrollIntoView({ block: 'nearest' });
                } else {
                    item.classList.remove('bg-gray-50');
                    item.classList.add('hover:bg-gray-100');
                }
            });
        };

        const handleKeyDown = (e) => {
            const items = dropdown.querySelectorAll('.mention-item');
            const isDropdownVisible = !dropdown.classList.contains('hidden') && items.length > 0;

            if (isDropdownVisible) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    selectedIndex = (selectedIndex + 1) % items.length;
                    updateHighlight();
                    return;
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    selectedIndex = (selectedIndex - 1 + items.length) % items.length;
                    updateHighlight();
                    return;
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedIndex >= 0 && selectedIndex < items.length) {
                        items[selectedIndex].click();
                    }
                    return;
                }
                if (e.key === 'Tab') {
                    e.preventDefault();
                    if (selectedIndex >= 0 && selectedIndex < items.length) {
                        items[selectedIndex].click();
                    }
                    return;
                }
            }

            if (e.key === 'Enter') {
                if (!e.shiftKey) {
                    e.preventDefault();
                    if (onSubmit) onSubmit();
                }
            }
            if (e.key === 'Escape') {
                if (isDropdownVisible) {
                    dropdown.classList.add('hidden');
                    e.stopPropagation();
                } else {
                    if (onCancel) onCancel();
                }
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'ArrowUp' || e.key === 'ArrowDown') return;

            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            const textNode = range.startContainer;

            if (textNode.nodeType !== Node.TEXT_NODE || !inputEl.contains(textNode)) {
                dropdown.classList.add('hidden');
                return;
            }

            const textBeforeCaret = textNode.textContent.slice(0, range.startOffset);
            const lastAtIndex = textBeforeCaret.lastIndexOf('@');

            if (lastAtIndex !== -1) {
                const query = textBeforeCaret.slice(lastAtIndex + 1);
                if (query.length > 30 || query.includes(' ')) {
                    currentMentionRange = null;
                    dropdown.classList.add('hidden');
                } else {
                    currentMentionRange = {
                        textNode: textNode,
                        startOffset: lastAtIndex,
                        endOffset: range.startOffset
                    };

                    const filtered = members.filter(m => m.name && m.name.toLowerCase().includes(query.toLowerCase()));

                    if (filtered.length > 0) {
                        dropdown.innerHTML = '';
                        filtered.forEach(member => {
                            const item = document.createElement('div');
                            item.className = 'mention-item w-full flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700';

                            const initial = member.name ? member.name.charAt(0).toUpperCase() : '?';
                            const avatarHtml = member.avatarUrl
                                ? `<img src="${member.avatarUrl}" class="w-6 h-6 rounded-full object-cover">`
                                : `<div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">${initial}</div>`;

                            item.innerHTML = `${avatarHtml}<span class="text-blue-500 font-medium">${member.name}</span>`;

                            item.addEventListener('mousedown', (ev) => ev.preventDefault());
                            item.addEventListener('click', (ev) => {
                                ev.stopPropagation();
                                if (!currentMentionRange || !currentMentionRange.textNode.parentNode) {
                                    dropdown.classList.add('hidden');
                                    inputEl.focus();
                                    return;
                                }
                                const { textNode, startOffset, endOffset } = currentMentionRange;
                                const range = document.createRange();
                                range.setStart(textNode, startOffset);
                                range.setEnd(textNode, endOffset);
                                range.deleteContents();

                                const span = document.createElement('span');
                                span.className = 'text-blue-500 font-semibold';
                                span.textContent = '@' + member.name;
                                span.contentEditable = false;
                                range.insertNode(span);

                                const space = document.createTextNode('\u00A0');
                                range.setStartAfter(span);
                                range.insertNode(space);

                                const selection = window.getSelection();
                                selection.removeAllRanges();
                                const newRange = document.createRange();
                                newRange.setStartAfter(space);
                                newRange.collapse(true);
                                selection.addRange(newRange);

                                dropdown.classList.add('hidden');
                                inputEl.focus();
                                currentMentionRange = null;
                            });
                            dropdown.appendChild(item);
                        });
                        dropdown.classList.remove('hidden');
                        selectedIndex = 0;
                        updateHighlight();
                    } else {
                        dropdown.classList.add('hidden');
                    }
                }
            } else {
                dropdown.classList.add('hidden');
                currentMentionRange = null;
            }
        };

        inputEl.addEventListener('keydown', handleKeyDown);
        inputEl.addEventListener('keyup', handleKeyUp);

        return () => {
            inputEl.removeEventListener('keydown', handleKeyDown);
            inputEl.removeEventListener('keyup', handleKeyUp);
            dropdown.remove();
        };
    }

    setupInputWithMentions(input, inputWrapper, handleAdd);
    // Fetch current user to check permissions (for delete button)
    try {
        const userRes = await authFetch('/user/read');
        if (userRes.ok) {
            currentUser = await userRes.json();
        }
        const memberRes = await authFetch(`/projects/${projectId}/readProject`);
        if (memberRes.ok) {
            const data = await memberRes.json();
            members = data.members || [];
        }
        console.log(members);
    } catch (err) {
        console.error("Failed to load user info", err);
    }

    async function loadComments() {
        listContainer.innerHTML = '<div class="text-gray-500 text-sm p-2">Loading comments...</div>';
        try {
            const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/comments`);
            if (!res.ok) throw new Error('Failed to load comments');
            const comments = await res.json();
            renderComments(comments);
        } catch (err) {
            console.error(err);
            listContainer.innerHTML = '<div class="text-red-500 text-sm p-2">Error loading comments</div>';
        }
    }

    function formatTimeAgo(dateString) {
        const utcDateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const date = new Date(utcDateString);

        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 10) {
            return 'vừa xong';
        }

        let interval = seconds / 31536000; // 1 year
        if (interval > 1) {
            return Math.floor(interval) + " năm trước";
        }
        interval = seconds / 2592000; // 1 month
        if (interval > 1) {
            return Math.floor(interval) + " tháng trước";
        }
        interval = seconds / 86400; // 1 day
        if (interval > 1) {
            return Math.floor(interval) + " ngày trước";
        }
        interval = seconds / 3600; // 1 hour
        if (interval > 1) {
            return Math.floor(interval) + " tiếng trước";
        }
        interval = seconds / 60; // 1 minute
        if (interval > 1) {
            return Math.floor(interval) + " phút trước";
        }
        return Math.floor(seconds) + " giây trước";
    }

    function renderComments(comments) {
        listContainer.innerHTML = '';
        if (comments.length === 0) {
            listContainer.innerHTML = `<div class="text-gray-400 text-sm p-2 flex items-center justify-center gap-2 text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-dashed-icon lucide-message-square-dashed"><path d="M12 19h.01"/><path d="M12 3h.01"/><path d="M16 19h.01"/><path d="M16 3h.01"/><path d="M2 13h.01"/><path d="M2 17v4.286a.71.71 0 0 0 1.212.502l2.202-2.202A2 2 0 0 1 6.828 19H8"/><path d="M2 5a2 2 0 0 1 2-2"/><path d="M2 9h.01"/><path d="M20 3a2 2 0 0 1 2 2"/><path d="M22 13h.01"/><path d="M22 17a2 2 0 0 1-2 2"/><path d="M22 9h.01"/><path d="M8 3h.01"/></svg>
                                    No comments yet.
                                    </div>`;
            return;
        }

        comments.forEach(comment => {
            // Check if current user is the author
            const isOwner = currentUser && (currentUser.id === comment.userId);

            let contentHtml = escapeHtml(comment.content);
            // Highlight mentions
            if (members && members.length > 0) {
                members.forEach(m => {
                    if (m.name) {
                        // Escape name for regex
                        const escapedName = m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const regex = new RegExp(`@${escapedName}`, 'g');
                        contentHtml = contentHtml.replace(regex, `<span class="text-blue-500 font-semibold">@${m.name}</span>`);
                    }
                });
            }

            const date = formatTimeAgo(comment.createdAt);

            const initial = comment.userName ? comment.userName.charAt(0).toUpperCase() : '?';
            const avatar = comment.userAvatarUrl
                ? `<img src="${comment.userAvatarUrl}" alt="${comment.userName}" class="w-6 h-6 rounded-full object-cover">`
                : `<div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">${initial}</div>`;
            const el = document.createElement('div');
            el.setAttribute('data-comment-id', comment.commentId);
            el.className = 'flex items-start gap-3 group mb-4';
            el.innerHTML = `
                ${avatar}
                <div class="comment-body flex-grow"> 
                    <div class="flex items-center justify-between mb-1">
                        <div class="flex items-center justify-center gap-2">
                            <span class="text-sm font-semibold text-gray-900">${comment.userName || 'Unknown'}</span>
                            <span class="text-xs text-gray-500">${date}</span>
                        </div>
                            ${isOwner ? `
                        <div class="flex items-center justify-center gap-1">
                            <button class="edit-comment-btn opacity-0 group-hover:opacity-100 text-gray-400 hover:text-black transition-opacity" title="Edit" data-comment-id="${comment.commentId}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pen-line-icon lucide-pen-line"><path d="M13 21h8"/><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
                            </button>
                            <button class="delete-comment-btn opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity" title="Delete" data-comment-id="${comment.commentId}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                        </div>
                        ` : ''}
                    </div>
                    <div class="comment-display-content text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">${contentHtml}</div>
                    <div class="comment-edit-form hidden">
                        <div class="edit-comment-input w-full border rounded-md p-2 text-sm bg-white" contenteditable="true"></div>
                        <div class="flex justify-end gap-2 mt-2">
                            <button class="cancel-edit-btn text-sm px-3 py-1 rounded-md hover:bg-gray-200">Hủy</button>
                            <button class="save-edit-btn text-sm px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600">Lưu</button>
                        </div>
                    </div>
                </div>
            `;

            if (isOwner) {
                const deleteBtn = el.querySelector('.delete-comment-btn');
                deleteBtn.addEventListener('click', (e) => handleDelete(e.currentTarget.dataset.commentId));

                const editBtn = el.querySelector('.edit-comment-btn');
                editBtn.addEventListener('click', (e) => handleEdit(e.currentTarget.dataset.commentId));
            }

            listContainer.appendChild(el);
        });

        // Scroll to bottom
        listContainer.scrollTop = listContainer.scrollHeight;
    }

    async function handleAdd() {
        const content = input.innerText.trim();
        if (!content) return;
        addBtn.disabled = true;
        addBtn.textContent = 'Posting...';
        try {
            const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });
            if (!res.ok) throw new Error('Failed to post comment');
            input.innerHTML = '';
            await loadComments();
        } catch (err) {
            console.error(err);
            alert('Failed to post comment');
        } finally {
            addBtn.disabled = false;
            addBtn.textContent = 'Comment';
        }
    }

    async function handleDelete(commentId) {
        try {
            const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/comments/${commentId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete comment');
            await loadComments();
        } catch (err) {
            console.error(err);
            alert('Failed to delete comment');
        }
    }

    async function handleEdit(commentId) {
        const commentEl = listContainer.querySelector(`[data-comment-id="${commentId}"]`);
        if (!commentEl) return;

        // Ẩn các form edit khác nếu có
        listContainer.querySelectorAll('.comment-edit-form').forEach(form => {
            if (form !== commentEl.querySelector('.comment-edit-form')) {
                form.classList.add('hidden');
                form.closest('.comment-body').querySelector('.comment-display-content').classList.remove('hidden');
            }
        });

        const displayContent = commentEl.querySelector('.comment-display-content');
        const editForm = commentEl.querySelector('.comment-edit-form');
        const editInput = commentEl.querySelector('.edit-comment-input');
        editInput.innerHTML = displayContent.innerHTML;
        const currentContentAsText = editInput.innerText;
        displayContent.classList.add('hidden');
        editForm.classList.remove('hidden');
        editInput.focus();

        const saveBtn = editForm.querySelector('.save-edit-btn');
        const cancelBtn = editForm.querySelector('.cancel-edit-btn');

        let cleanupMentions = null;

        const handleSave = async () => {
            const newContent = editInput.innerText.trim();
            if (!newContent || newContent === currentContentAsText.trim()) {
                // Nếu nội dung rỗng hoặc không thay đổi, hủy edit
                handleCancel();
                return;
            }
            if (cleanupMentions) cleanupMentions();
            await performUpdate(commentId, newContent);
        };

        const handleCancel = () => {
            displayContent.classList.remove('hidden');
            editForm.classList.add('hidden');
            saveBtn.removeEventListener('click', handleSave);
            cancelBtn.removeEventListener('click', handleCancel);
            if (cleanupMentions) cleanupMentions();
        };

        saveBtn.addEventListener('click', handleSave);
        cancelBtn.addEventListener('click', handleCancel);

        cleanupMentions = setupInputWithMentions(editInput, editForm, handleSave, handleCancel);
    }

    async function performUpdate(commentId, newContent) {
        try {
            const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/comments/${commentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newContent })
            });
            if (!res.ok) throw new Error('Failed to edit comment');
            await loadComments();
        } catch (err) {
            console.error(err);
            alert('Failed to edit comment');
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    addBtn.addEventListener('click', handleAdd);




    // Load initially
    loadComments();
}
