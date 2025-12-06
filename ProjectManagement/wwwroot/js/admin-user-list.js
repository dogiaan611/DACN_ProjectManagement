import { authFetch } from './auth.js';

export async function loadUserList() {
    const userList = document.getElementById('user-list');
    if (!userList) {
        console.error("User list container not found. Make sure an element with id 'user-list' exists.");
        return;
    }
    try {
        const res = await authFetch('/user/read-all');
        if (!res.ok) throw new Error('Không thể tải danh sách người dùng');
        const users = await res.json();
        loadUserInfor();
        renderUserList(users);
    } catch (error) {
        console.error('Lỗi khi tải danh sách người dùng:', error);
    }
}

async function loadUserInfor() {
    const userAvatar = document.getElementById('admin-user-avatar');
    const userName = document.getElementById('admin-name');
    const userEmail = document.getElementById('admin-email');
    const userPhone = document.getElementById('admin-phone');

    try {
        const res = await authFetch('user/read');
        if (!res.ok) throw new Error('Cannot load user data');
        const user = await res.json();
        userAvatar.src = user.avatarUrl || '/images/default-avatar.png';
        userName.textContent = user.name;
        userEmail.textContent = user.email;
        userPhone.textContent = user.phoneNumber;
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
                        <th scope="col" class="px-6 py-3">Người dùng</th>
                        <th scope="col" class="px-6 py-3">Số điện thoại</th>
                        <th scope="col" class="px-6 py-3">Vai trò</th>
                        <th scope="col" class="px-6 py-3"><span class="sr-only">Hành động</span></th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => createUserRow(user)).join('')}
                </tbody>
            </table>
        </div>
    `;

    userList.innerHTML = tableHtml;

    // Attach event listeners for edit buttons
    users.forEach(user => {
        const editBtn = document.getElementById(`edit-user-${user.id}`);
        if (editBtn) {
            editBtn.addEventListener('click', () => openEditUserModal(user));
        }
    });
}

function createUserRow(user) {
    const roleText = user.systemRole === 0 ? 'System Admin' : 'Member';
    const roleClasses = user.systemRole === 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';

    return `
        <tr class="bg-white border-b hover:bg-gray-50">
            <th scope="row" class="flex items-center px-6 py-4 text-gray-900 whitespace-nowrap">
                <img class="w-10 h-10 rounded-full object-cover" src="${user.avatarUrl || '/images/default-avatar.png'}" alt="${user.name}">
                <div class="pl-3">
                    <div class="text-base font-semibold">${user.name}</div>
                    <div class="font-normal text-gray-500">${user.email}</div>
                </div>
            </th>
            <td class="px-6 py-4">${user.phoneNumber || 'N/A'}</td>
            <td class="px-6 py-4">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleClasses}">${roleText}</span>
            </td>
            <td class="px-6 py-4 text-right">
                <button type="button" id="edit-user-${user.id}" class="px-2 py-1 rounded-md inline-flex items-center justify-center gap-1 text-white bg-black">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-pen-icon lucide-user-round-pen"><path d="M2 21a8 8 0 0 1 10.821-7.487"/><path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/><circle cx="10" cy="8" r="5"/></svg>
                    Edit
                </button>
            </td>
        </tr>
    `;
}

// Global modal elements
let modal, closeBtn, cancelBtn, form;

function initEditModal() {
    modal = document.getElementById('edit-user-modal');
    closeBtn = document.getElementById('close-edit-user-modal');
    cancelBtn = document.getElementById('cancel-edit-user');
    form = document.getElementById('edit-user-form');
    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeEditUserModal();
        }
    });

    if (closeBtn) closeBtn.addEventListener('click', closeEditUserModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeEditUserModal);
    if (form) form.addEventListener('submit', handleEditUserSubmit);
}

// Call init when script loads (or check if DOMContentLoaded is needed, but this is module context)
document.addEventListener('DOMContentLoaded', initEditModal);

function openEditUserModal(user) {
    if (!modal) initEditModal();

    const idInput = document.getElementById('edit-user-id');
    const nameInput = document.getElementById('edit-user-name');
    const emailInput = document.getElementById('edit-user-email');
    const passInput = document.getElementById('edit-user-password');
    const roleSelect = document.getElementById('edit-user-role');

    if (!idInput || !nameInput || !emailInput || !passInput || !roleSelect) {
        console.error("Edit User Modal elements not found in DOM.");
        return;
    }

    idInput.value = user.id;
    nameInput.value = user.name;
    emailInput.value = user.email;
    passInput.value = '';

    // Set role
    // user.systemRole: 0 = SystemAdmin, 1 = Member
    roleSelect.value = user.systemRole === 0 ? 'SystemAdmin' : 'Member';

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

    const updateData = {
        role: role
    };

    if (password) {
        updateData.password = password;
    }

    try {
        const res = await authFetch(`/user/admin/update/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        if (res.ok) {
            alert('User updated successfully!');
            closeEditUserModal();
            loadUserList(); // Refresh list to see proper role
        } else {
            const errData = await res.json();
            alert('Failed to update user: ' + (errData.message || JSON.stringify(errData.errors)));
        }
    } catch (error) {
        console.error('Error updating user:', error);
        alert('An error occurred while updating user.');
    }
}