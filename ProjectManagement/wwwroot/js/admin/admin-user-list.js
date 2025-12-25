import { authFetch } from '../auth/auth.js';

// State management
const state = {
    page: 1,
    pageSize: 10,
    search: '',
    role: '',
    sortBy: 'email',
    sortOrder: 'asc',
    total: 0,
    totalPages: 0
};

// Debounce helper for search
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Global modal elements
let modal, closeBtn, cancelBtn, form;
let deleteModal, cancelDeleteBtn, confirmDeleteBtn;
let createModal, closeCreateBtn, cancelCreateBtn, createForm;
let userToDeleteId = null;

export async function loadUserList() {
    console.log("loadUserList called with state:", state);

    // Ensure controls are initialized (fix for SPA navigation/DOM replacement)
    setupControls();
    initEditModal();
    initDeleteModal();
    initCreateModal();

    const userList = document.getElementById('user-list');
    if (!userList) {
        console.error("User list container not found.");
        return;
    }

    try {
        const params = new URLSearchParams({
            page: state.page,
            pageSize: state.pageSize,
            sortBy: state.sortBy,
            sortOrder: state.sortOrder
        });

        if (state.search) params.append('search', state.search);
        if (state.role) params.append('role', state.role);

        const res = await authFetch(`/api/Admin/users?${params.toString()}`);
        if (!res.ok) throw new Error('Không thể tải danh sách người dùng');

        const data = await res.json();

        state.total = data.total;
        state.totalPages = data.totalPages;

        if (state.page > state.totalPages && state.totalPages > 0) {
            state.page = state.totalPages;
            return loadUserList();
        }

        renderUserList(data.users);
        renderPagination();
        updateFilterUI();
        updateSortUI();
        loadUserInfor();
    } catch (error) {
        console.error('Lỗi khi tải danh sách người dùng:', error);
        userList.innerHTML = `<div class="text-center text-red-500 py-4">Error loading users: ${error.message}</div>`;
    }
}

async function loadUserInfor() {
    const userAvatar = document.getElementById('admin-user-avatar');
    const userName = document.getElementById('admin-name');
    const userEmail = document.getElementById('admin-email');
    const userPhone = document.getElementById('admin-phone');

    try {
        const res = await authFetch('/user/read');
        if (!res.ok) throw new Error('Cannot load user data');
        const user = await res.json();

        if (userAvatar) userAvatar.src = user.avatarUrl || '/images/default-avatar.png';
        if (userName) userName.textContent = user.name;
        if (userEmail) userEmail.textContent = user.email;
        if (userPhone) userPhone.textContent = user.phoneNumber || 'N/A';

        const roleEl = document.getElementById('admin-role');
        if (roleEl) {
            roleEl.textContent = user.systemRole === 0 ? 'System Admin' : 'Member';
        }
    } catch (err) {
        console.log("Cannot load user data", err);
    }
}

async function renderUserList(users) {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';

    if (!users || users.length === 0) {
        userList.innerHTML = `
            <div class="text-center py-10">
                <p class="text-gray-500">Không tìm thấy người dùng nào.</p>
            </div>
        `;
        return;
    }

    const tableHtml = `
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
            <table class="w-full text-sm text-left text-gray-500">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" class="px-6 py-3 cursor-pointer hover:bg-gray-100" data-sort="name">
                            User <span class="sort-icon ml-1"></span>
                        </th>
                        <th scope="col" class="px-6 py-3 cursor-pointer hover:bg-gray-100" data-sort="createdat">
                            Joined <span class="sort-icon ml-1"></span>
                        </th>
                        <th scope="col" class="px-6 py-3">Phone</th>
                        <th scope="col" class="px-6 py-3 cursor-pointer hover:bg-gray-100" data-sort="role">
                            Role <span class="sort-icon ml-1"></span>
                        </th>
                        <th scope="col" class="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => createUserRow(user)).join('')}
                </tbody>
            </table>
        </div>
        <div id="pagination-container" class="mt-4 flex justify-between items-center px-2"></div>
    `;

    userList.innerHTML = tableHtml;

    // Attach event listeners for table headers (sorting)
    const headers = userList.querySelectorAll('th[data-sort]');
    headers.forEach(th => {
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            if (state.sortBy === field) {
                state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                state.sortBy = field;
                state.sortOrder = 'asc'; // Default to asc for new field
            }
            loadUserList();
        });

        // Add visual indicator
        if (state.sortBy === th.dataset.sort) {
            const icon = th.querySelector('.sort-icon');
            if (icon) {
                icon.innerHTML = state.sortOrder === 'asc' ? '↑' : '↓';
                th.classList.add('bg-gray-100');
            }
        }
    });

    // Attach event listeners for buttons
    users.forEach(user => {
        const editBtn = document.getElementById(`edit-user-${user.id}`);
        const deleteBtn = document.getElementById(`delete-user-${user.id}`);
        const viewBtn = document.getElementById(`view-user-${user.id}`);

        if (editBtn) editBtn.addEventListener('click', () => openEditUserModal(user));
        if (deleteBtn) deleteBtn.addEventListener('click', () => confirmDeleteUser(user.id, user.name));
        if (viewBtn) viewBtn.addEventListener('click', () => alert(`View details feature for ${user.name} is coming soon!`));
    });
}

function createUserRow(user) {
    const isAdmin = user.systemRole === 0 || user.systemRole === 'SystemAdmin';
    const roleText = isAdmin ? 'System Admin' : 'Member';
    const roleClasses = isAdmin ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
    const dateStr = new Date(user.createdAt).toLocaleDateString();

    return `
        <tr class="bg-white border-b hover:bg-gray-50 transition-colors">
            <th scope="row" class="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap">
                ${user.avatarUrl
            ? `<img class="w-10 h-10 rounded-full object-cover border border-gray-200" src="${user.avatarUrl}" alt="${user.name}">`
            : `<div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold border border-gray-200 text-lg uppercase">${user.name.charAt(0)}</div>`
        }
                <div class="pl-3">
                    <div class="text-base font-semibold">${user.name}</div>
                    <div class="font-normal text-gray-500">${user.email}</div>
                </div>
            </th>
            <td class="px-6 py-4">${dateStr}</td>
            <td class="px-6 py-4">${user.phoneNumber || '<span class="text-gray-300">N/A</span>'}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${roleClasses}">${roleText}</span>
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button type="button" id="edit-user-${user.id}" class="p-1.5 rounded-md text-white bg-black hover:bg-gray-800 transition-colors" title="Edit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                    <button type="button" id="delete-user-${user.id}" class="p-1.5 rounded-md text-white bg-red-500 hover:bg-red-600 transition-colors" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function renderPagination() {
    const container = document.getElementById('pagination-container');
    if (!container) return;

    if (state.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const prevDisabled = state.page === 1 ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 border rounded"' : 'class="px-3 py-1 border rounded hover:bg-gray-100"';
    const nextDisabled = state.page === state.totalPages ? 'disabled class="opacity-50 cursor-not-allowed px-3 py-1 border rounded"' : 'class="px-3 py-1 border rounded hover:bg-gray-100"';

    container.innerHTML = `
        <div class="text-sm text-gray-700">
            Page <span class="font-semibold">${state.page}</span> of <span class="font-semibold">${state.totalPages}</span> 
            (Total: ${state.total})
        </div>
        <div class="flex gap-2">
            <button id="prev-page" ${prevDisabled}>Previous</button>
            <button id="next-page" ${nextDisabled}>Next</button>
        </div>
    `;

    document.getElementById('prev-page')?.addEventListener('click', () => {
        if (state.page > 1) {
            state.page--;
            loadingState(true);
            loadUserList().finally(() => loadingState(false));
        }
    });

    document.getElementById('next-page')?.addEventListener('click', () => {
        if (state.page < state.totalPages) {
            state.page++;
            loadingState(true);
            loadUserList().finally(() => loadingState(false));
        }
    });
}

function loadingState(isLoading) {
    const list = document.getElementById('user-list');
    if (isLoading && list) {
        list.classList.add('opacity-50', 'pointer-events-none');
    } else if (list) {
        list.classList.remove('opacity-50', 'pointer-events-none');
    }
}

function initApp() {
    console.log("Initializing Admin User List App...");
    initEditModal();
    initDeleteModal();
    setupControls();
    loadUserList();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function setupControls() {
    const searchInput = document.getElementById('search-user');
    if (searchInput) {
        if (searchInput.dataset.initialized) return; // Prevent duplicate listeners
        searchInput.dataset.initialized = "true";

        console.log("Search input found, attaching listener.");
        const handleSearch = debounce((searchValue) => {
            console.log("Debounced search execution:", searchValue);
            state.search = searchValue.trim();
            state.page = 1;
            loadUserList();
        }, 300);

        searchInput.addEventListener('input', (e) => {
            const val = e.target.value;
            console.log("Raw input event:", val);
            handleSearch(val);
        });
    } else {
        console.error("Search input element 'search-user' not found!");
    }

    // Sort Button (Toggle logic via button)
    const sortBtn = document.getElementById('sort-user');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            // Cycle: Name ASC -> Name DESC -> CreatedAt DESC -> CreatedAt ASC
            if (state.sortBy === 'name') {
                if (state.sortOrder === 'asc') state.sortOrder = 'desc';
                else {
                    state.sortBy = 'createdat';
                    state.sortOrder = 'desc'; // Newest first by default
                }
            } else if (state.sortBy === 'createdat') {
                if (state.sortOrder === 'desc') state.sortOrder = 'asc';
                else {
                    state.sortBy = 'name';
                    state.sortOrder = 'asc';
                }
            } else {
                state.sortBy = 'name';
                state.sortOrder = 'asc';
            }
            loadUserList();
        });
    }

    // Filter Button (Cycle roles)
    const filterBtn = document.getElementById('filter-user');
    if (filterBtn) {
        console.log("Filter button found, attaching listener.");
        filterBtn.addEventListener('click', () => {
            if (state.role === '') state.role = 'SystemAdmin';
            else if (state.role === 'SystemAdmin') state.role = 'Member';
            else state.role = '';

            console.log("Filter changed to:", state.role);
            state.page = 1;
            loadUserList();
        });
    } else {
        console.error("Filter button element 'filter-user' not found!");
    }
}

function updateFilterUI() {
    const filterBtn = document.getElementById('filter-user');
    if (!filterBtn) return;

    // Update button text/style based on current state
    if (state.role) {
        filterBtn.classList.add('bg-blue-50', 'text-blue-600', 'border-blue-200');
        filterBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-filter"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            ${state.role === 'SystemAdmin' ? 'Admins' : 'Members'}
        `;
    } else {
        filterBtn.classList.remove('bg-blue-50', 'text-blue-600', 'border-blue-200');
        filterBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list-filter"><path d="M2 5h20"/><path d="M6 12h12"/><path d="M9 19h6"/></svg>
            Filter
        `;
    }
}

function updateSortUI() {
    const sortBtn = document.getElementById('sort-user');
    if (!sortBtn) return;

    let label = 'Sort';
    if (state.sortBy === 'name') label = `Name ${state.sortOrder === 'asc' ? 'A-Z' : 'Z-A'}`;
    else if (state.sortBy === 'createdat') label = `Date ${state.sortOrder === 'desc' ? 'Newest' : 'Oldest'}`;

    sortBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-down"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
        ${label}
    `;
}

function initEditModal() {
    modal = document.getElementById('edit-user-modal');
    closeBtn = document.getElementById('close-edit-user-modal');
    cancelBtn = document.getElementById('cancel-edit-user');
    form = document.getElementById('edit-user-form');

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeEditUserModal();
        }
    });

    if (closeBtn) closeBtn.addEventListener('click', closeEditUserModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeEditUserModal);
    if (form) form.addEventListener('submit', handleEditUserSubmit);
}

function openEditUserModal(user) {
    if (!modal) initEditModal();

    const idInput = document.getElementById('edit-user-id');
    const nameInput = document.getElementById('edit-user-name');
    const emailInput = document.getElementById('edit-user-email');
    const passInput = document.getElementById('edit-user-password');
    const roleSelect = document.getElementById('edit-user-role');

    if (idInput) idInput.value = user.id;
    if (nameInput) nameInput.value = user.name;
    if (emailInput) emailInput.value = user.email;
    if (passInput) passInput.value = '';

    // user.systemRole: 0 or "SystemAdmin" -> SystemAdmin
    const isAdmin = user.systemRole === 0 || user.systemRole === 'SystemAdmin';
    if (roleSelect) roleSelect.value = isAdmin ? 'SystemAdmin' : 'Member';

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeEditUserModal() {
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function handleEditUserSubmit(e) {
    e.preventDefault();

    const userId = document.getElementById('edit-user-id').value;
    const password = document.getElementById('edit-user-password').value;
    const role = document.getElementById('edit-user-role').value;

    const updateData = { role: role };
    if (password) updateData.password = password;

    try {
        const res = await authFetch(`/api/Admin/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (res.ok) {
            closeEditUserModal();
            loadUserList();
        } else {
            const errData = await res.json();
            console.log('Failed to update: ' + (errData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating user:', error);
        alert('An error occurred while updating user.');
    }
}

function initCreateModal() {
    createModal = document.getElementById('create-user-modal');
    closeCreateBtn = document.getElementById('close-create-user-modal');
    cancelCreateBtn = document.getElementById('cancel-create-user');
    createForm = document.getElementById('create-user-form');
    const openBtn = document.getElementById('btn-add-user');

    if (openBtn) {
        openBtn.onclick = openCreateUserModal;
    }

    if (closeCreateBtn) closeCreateBtn.onclick = closeCreateUserModal;
    if (cancelCreateBtn) cancelCreateBtn.onclick = closeCreateUserModal;
    if (createForm) createForm.onsubmit = handleCreateUserSubmit;
}

function openCreateUserModal() {
    // Always re-fetch elements
    if (!createModal) {
        initCreateModal();
    } else {
        createForm = document.getElementById('create-user-form');
    }

    if (createModal) {
        createModal.classList.remove('hidden');
        createModal.classList.add('flex');

        // Form reset
        if (createForm) {
            createForm.reset();
        }

        // Animation Entrance
        const content = createModal.querySelector('div'); // The inner modal card
        // Force reflow
        void createModal.offsetWidth;

        createModal.classList.remove('opacity-0');
        if (content) {
            content.classList.remove('opacity-0', 'scale-95');
            content.classList.add('opacity-100', 'scale-100');
        }
    }
}

function closeCreateUserModal() {
    if (createModal) {
        // Animation Exit
        createModal.classList.add('opacity-0');
        const content = createModal.querySelector('div');
        if (content) {
            content.classList.remove('opacity-100', 'scale-100');
            content.classList.add('opacity-0', 'scale-95');
        }

        // Wait for animation to finish before hiding
        setTimeout(() => {
            createModal.classList.add('hidden');
            createModal.classList.remove('flex');
        }, 300);
    }
}

async function handleCreateUserSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('create-user-name').value;
    const email = document.getElementById('create-user-email').value;
    const password = document.getElementById('create-user-password').value;
    const phone = document.getElementById('create-user-phone').value;
    const role = document.getElementById('create-user-role').value;

    const newUser = {
        name,
        email,
        password,
        phoneNumber: phone,
        role
    };

    try {
        const res = await authFetch('/api/Admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });

        if (res.ok) {
            closeCreateUserModal();
            loadUserList();
        } else {
            const errData = await res.json();
            alert('Failed to create user: ' + (errData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error creating user:', error);
        alert('An error occurred while creating user.');
    }
}


function initDeleteModal() {
    deleteModal = document.getElementById('delete-user-modal');
    cancelDeleteBtn = document.getElementById('cancel-delete-user');
    confirmDeleteBtn = document.getElementById('confirm-delete-user');

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && deleteModal && !deleteModal.classList.contains('hidden')) {
            closeDeleteModal();
        }
    });

    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (userToDeleteId) {
                await executeDeleteUser(userToDeleteId);
            }
        });
    }
}

function openDeleteModal(userId, userName) {
    if (!deleteModal) initDeleteModal();

    userToDeleteId = userId;
    const nameSpan = document.getElementById('delete-user-name');
    if (nameSpan) nameSpan.textContent = userName;

    if (deleteModal) {
        deleteModal.classList.remove('hidden');
        deleteModal.classList.add('flex');
    }
}

function closeDeleteModal() {
    if (deleteModal) {
        deleteModal.classList.add('hidden');
        deleteModal.classList.remove('flex');
    }
    userToDeleteId = null;
}

function confirmDeleteUser(userId, userName) {
    openDeleteModal(userId, userName);
}

async function executeDeleteUser(userId) {
    try {
        const res = await authFetch(`/api/Admin/users/${userId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            // Close modal first
            closeDeleteModal();

            // Handle pagination adjustment
            if (state.total > 0 && state.total % state.pageSize === 1 && state.page > 1) {
                state.page--;
            }
            loadUserList();
        } else {
            const errData = await res.json();
            closeDeleteModal(); // Close modal to show alert
            alert('Cannot delete user: ' + (errData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Delete error:', error);
        closeDeleteModal();
        alert('Error deleting user.');
    }
}
