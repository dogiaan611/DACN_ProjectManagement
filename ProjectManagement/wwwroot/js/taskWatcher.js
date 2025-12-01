import { authFetch } from "./auth.js";
import { toggleDropdown } from "./taskUI.js";

export async function initTaskWatcher(boardId, columnId, taskId, projectId, container) {
    const watcherToggleBtn = container.querySelector('#task-detail-watcher-btn');
    const watcherAvt = container.querySelector('#task-detail-watcher-avt');
    const watcherEditBtn = container.querySelector('#edit-watcher');
    const watcherModal = container.querySelector('#watcher-detail-dropdown');
    // const watcherSearch = container.querySelector('#watcher-search'); // This is inside the dropdown, so select it after opening or use generic selector if it's static
    // const watcherList = container.querySelector('#watcher-detail-list'); // Same here

    let currentUser;

    async function getCurrentUser() {
        try {
            const res = await authFetch(`/user/read`);
            if (!res.ok) throw new Error("Failed to get current user");
            currentUser = await res.json();
            updateWatcherButtonState();
        } catch (error) {
            console.log(error);
        }
    }
    getCurrentUser();

    let currentWatcher = [];
    async function getTaskWatchers() {
        try {
            const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/watchers`);
            if (!res.ok) throw new Error("Failed to get task watchers");
            currentWatcher = (await res.json()) || [];
            renderWatcher();
            updateWatcherButtonState();
        } catch (error) {
            console.log(error);
        }
    }
    getTaskWatchers();

    async function renderWatcher() {
        watcherAvt.innerHTML = '';

        if (!currentWatcher || currentWatcher.length === 0) {
            watcherAvt.innerHTML = '<span class="text-sm text-gray-500">No watcher</span>';
            return;
        }

        const watchersToShow = currentWatcher.slice(0, 4);

        watchersToShow.forEach(watcher => {
            const avatarInitial = watcher.name ? watcher.name.charAt(0).toUpperCase() : '?';
            const avatarHtml = watcher.avatarUrl
                ? `<img src="${watcher.avatarUrl}" alt="${watcher.name}" class="w-6 h-6 rounded-full border object-cover" title="${watcher.name}">`
                : `<div class="w-6 h-6 flex items-center justify-center border rounded-full bg-gray-200 text-gray-600 text-xs font-semibold" title="${watcher.name}">${avatarInitial}</div>`;
            watcherAvt.innerHTML += avatarHtml;
        });

        const remainingCount = currentWatcher.length - watchersToShow.length;
        if (remainingCount > 0) {
            const countHtml = `<div class="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold" title="${remainingCount} more watcher(s)">+${remainingCount}</div>`;
            watcherAvt.innerHTML += countHtml;
        }
    }

    function updateWatcherButtonState() {
        if (!currentUser || !currentWatcher) return;

        // Check if current user is in watchers list
        const isWatching = currentWatcher.some(w => (w.userId || w.id) === currentUser.id);

        if (isWatching) {
            watcherToggleBtn.classList.remove('text-gray-400');
            watcherToggleBtn.classList.add('text-green-500');
        } else {
            watcherToggleBtn.classList.add('text-gray-400');
            watcherToggleBtn.classList.remove('text-green-500');
        }
    }

    async function addWatcher(userId) {
        try {
            const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/watchers`, {
                method: 'POST',
                body: JSON.stringify({ userId: userId || currentUser.id })
            });
            if (!res.ok) throw new Error('Failed to add watcher');
            await getTaskWatchers();
        } catch (err) {
            console.log('Failed to add watcher', err);
        }
    }

    async function removeWatcher(userId) {
        try {
            const targetId = userId || currentUser.id;
            const res = await authFetch(`/boards/${boardId}/columns/${columnId}/tasks/${taskId}/watchers/${targetId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to remove watcher');
            await getTaskWatchers();
        } catch (err) {
            console.log('Failed to remove watcher', err);
        }
    }

    watcherToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentUser && currentWatcher) {
            if (currentWatcher.some(w => (w.userId || w.id) === currentUser.id)) {
                removeWatcher();
            } else {
                addWatcher();
            }
        }
    });

    watcherEditBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(watcherEditBtn, watcherModal, 'task-detail-watcher-portal', async (portal, closePortal) => {
            const watcherDropdownList = portal.querySelector('#watcher-detail-list');
            const watcherSearch = portal.querySelector('#watcher-search');
            let projectMembers = [];

            const handleWatcherUpdate = async (memberId) => {
                // Check if member is already a watcher
                const isWatching = currentWatcher.some(w => (w.userId || w.id) === memberId);
                if (isWatching) {
                    await removeWatcher(memberId);
                } else {
                    await addWatcher(memberId);
                }
                // Re-render list to update checkmarks or status
                renderMemberOptions(projectMembers);
            }

            const renderMemberOptions = (members) => {
                watcherDropdownList.innerHTML = '';
                if (members.length === 0) {
                    watcherDropdownList.innerHTML = '<div class="p-2 text-sm text-gray-500">No members found.</div>';
                    return;
                }

                members.forEach(member => {
                    const isWatching = currentWatcher.some(w => (w.userId || w.id) === member.userId);
                    const memberEl = document.createElement('div');
                    memberEl.className = 'flex items-center justify-between gap-2 w-full p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer';

                    const avatarInitial = member.name ? member.name.charAt(0).toUpperCase() : '?';
                    const avatarHtml = member.avatarUrl
                        ? `<img src="${member.avatarUrl}" alt="${member.name}" class="w-7 h-7 rounded-full object-cover">`
                        : `<div class="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-semibold">${avatarInitial}</div>`;

                    const checkIcon = isWatching
                        ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-500 lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>`
                        : '';

                    memberEl.innerHTML = `
                        <div class="flex items-center gap-2">
                            ${avatarHtml}
                            <span>${member.name || 'Unnamed'}</span>
                        </div>
                        ${checkIcon}
                    `;

                    memberEl.addEventListener('click', () => handleWatcherUpdate(member.userId));
                    watcherDropdownList.appendChild(memberEl);
                });
            }

            watcherSearch.addEventListener('input', () => {
                const searchTerm = watcherSearch.value.toLowerCase();
                const filtered = projectMembers.filter(m => m.name.toLowerCase().includes(searchTerm));
                renderMemberOptions(filtered);
            });

            try {
                const res = await authFetch(`/projects/${projectId}/readProject`);
                if (!res.ok) throw new Error('Failed to load project members');
                const data = await res.json();
                projectMembers = data?.members || [];
                renderMemberOptions(projectMembers);
            } catch (error) {
                console.error('Error fetching project members:', error);
                watcherDropdownList.innerHTML = '<div class="p-2 text-sm text-red-500">Error loading members.</div>';
            }
        })
    });
}