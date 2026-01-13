import { authFetch } from "../auth/auth.js";
import { getProjectTags, createProjectTag } from "./tag.js";

export async function initTaskTags(boardId, columnId, projectId, taskId) {
    const tagsContainer = document.getElementById('task-tags-container');
    const addTagBtn = document.getElementById('add-tag-btn');
    const tagDropdown = document.getElementById('tag-dropdown');
    const tagDropdownList = document.getElementById('tag-dropdown-list');
    const tagSearchInput = document.getElementById('tag-search-input');

    let currentTaskTags = [];
    let allProjectTags = [];

    // 1. Lấy danh sách tag của task
    async function fetchTaskTags() {
        try {
            const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/tags`);
            if (res.ok) {
                currentTaskTags = await res.json();
                renderTaskTags();
            }
        } catch (err) {
            console.error('Error fetching task tags:', err);
        }
    }

    // 2. Lấy danh sách tag của project (để hiển thị trong dropdown)
    async function fetchProjectTagsData() {
        allProjectTags = await getProjectTags(projectId);
    }

    // 3. Render Tags lên giao diện Task Detail
    function renderTaskTags() {
        tagsContainer.innerHTML = '';
        currentTaskTags.forEach(tag => {
            const tagEl = document.createElement('div');
            tagEl.className = `flex items-center justify-center px-2 py-1 rounded text-xs font-medium group relative`;
            tagEl.style.borderColor = tag.color || '#3B82F6';
            tagEl.style.borderWidth = '1px';
            tagEl.style.color = tag.color || '#3B82F6';
            tagEl.innerHTML = `
                <span class="remove-tag-btn cursor-pointer" data-tag-id="${tag.tagId}">${tag.name}</span>
            `;

            // Event listener xóa tag
            tagEl.querySelector('.remove-tag-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                removeTagFromTask(tag.tagId);
            });

            tagsContainer.appendChild(tagEl);
        });
    }

    // 4. Render Dropdown chọn Tag
    function renderTagDropdown(filterText = '') {
        tagDropdownList.innerHTML = '';

        // Lọc tag chưa được gán vào task
        const assignedTagIds = new Set(currentTaskTags.map(t => t.tagId));
        const availableTags = allProjectTags.filter(tag => !assignedTagIds.has(tag.tagId));

        // Lọc theo search text
        const filteredTags = availableTags.filter(tag =>
            tag.name.toLowerCase().includes(filterText.toLowerCase())
        );

        if (filteredTags.length === 0) {
            if (filterText) {
                tagDropdownList.innerHTML = `
                    <div class="text-xs text-gray-500 p-2 text-center">
                        Press Enter to create "<b>${filterText}</b>"
                    </div>`;
            } else {
                tagDropdownList.innerHTML = '<div class="text-xs text-gray-500 p-2 text-center">No tags found</div>';
            }
            return;
        }

        filteredTags.forEach(tag => {
            const item = document.createElement('div');
            item.className = 'flex items-center justify-between gap-1 px-1.5 py-0.5 hover:bg-gray-100 cursor-pointer rounded text-sm group';
            item.innerHTML = `
                <span class="px-1.5 py-0.5 text-xs font-medium rounded-md" style="border-color: ${tag.color || '#3B82F6'}; border: 1px solid; color: ${tag.color || '#3B82F6'}">${tag.name}</span>
                <button id="tag-delete-btn" class="remove-tag-btn cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-300 hover:text-red-500" data-tag-id="${tag.tagId}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            `;
            item.addEventListener('click', () => {
                assignTagToTask(tag.tagId);
                tagDropdown.classList.add('hidden');
            });
            const deleteTagBtn = item.querySelector('.remove-tag-btn');
            deleteTagBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await deleteTag(tag.tagId);
                renderTagDropdown();
            });
            tagDropdownList.appendChild(item);
        });
    }

    // 5. API: Gán Tag vào Task
    async function assignTagToTask(tagId) {
        try {
            const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagId: tagId })
            });

            if (res.ok) {
                await fetchTaskTags(); // Reload tags
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to assign tag');
            }
        } catch (err) {
            console.error('Error assigning tag:', err);
        }
    }

    async function deleteTag(tagId) {
        try {
            const res = await authFetch(`/projects/${projectId}/tags/${tagId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                await fetchProjectTagsData();
            } else {
                alert('Failed to delete tag');
            }
        } catch (err) {
            console.error('Error deleting tag:', err);
        }
    }

    // 6. API: Gỡ Tag khỏi Task
    async function removeTagFromTask(tagId) {
        try {
            const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/tags/${tagId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                await fetchTaskTags(); // Reload tags
            } else {
                alert('Failed to remove tag');
            }
        } catch (err) {
            console.error('Error removing tag:', err);
        }
    }

    // Event Listeners
    addTagBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (tagDropdown.classList.contains('hidden')) {
            // Load project tags if empty
            if (allProjectTags.length === 0) {
                await fetchProjectTagsData();
            }
            renderTagDropdown();
            tagDropdown.classList.remove('hidden');
            tagSearchInput.focus();
        } else {
            tagDropdown.classList.add('hidden');
        }
    });

    tagSearchInput.addEventListener('input', (e) => {
        renderTagDropdown(e.target.value);
    });

    // Handle Enter key to create/assign tag
    tagSearchInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tagName = tagSearchInput.value.trim();
            if (!tagName) return;

            // Check if tag already exists (case-insensitive)
            const existingTag = allProjectTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());

            if (existingTag) {
                // If exists, assign it
                await assignTagToTask(existingTag.tagId);
            } else {
                // Create new tag
                try {
                    // Random color from a predefined list or just default
                    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];
                    const randomColor = colors[Math.floor(Math.random() * colors.length)];

                    const newTag = await createProjectTag(projectId, tagName, randomColor);

                    // Refresh project tags list
                    await fetchProjectTagsData();

                    // Assign the new tag to task
                    await assignTagToTask(newTag.tagId);
                } catch (err) {
                    console.error('Failed to create tag:', err);
                    alert('Failed to create new tag');
                }
            }

            // Clear input and close dropdown
            tagSearchInput.value = '';
            tagDropdown.classList.add('hidden');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!addTagBtn.contains(e.target) && !tagDropdown.contains(e.target)) {
            tagDropdown.classList.add('hidden');
        }
    });

    // Initial load
    fetchTaskTags();
}