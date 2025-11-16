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

async function loadUserInfor(){
    const userAvatar = document.getElementById('admin-user-avatar');
    const userName = document.getElementById('admin-name');
    const userEmail = document.getElementById('admin-email');
    const userPhone = document.getElementById('admin-phone');

    try {
        const res = await authFetch('user/read');
        if(!res.ok) throw new Error('Cannot load user data');
        const user = await res.json();
        userAvatar.src = user.avatarUrl || '/images/default-avatar.png';
        userName.textContent = user.name;
        userEmail.textContent = user.email;
        userPhone.textContent = user.phoneNumber;
    } catch(err) {
        console.log("Cannot load user data",err);
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
                <div role="button" id="edit-user-${user.id}" class="px-2 py-1 rounded-md inline-flex items-center justify-center gap-1 text-white bg-blue-500 hover:bg-blue-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round-pen-icon lucide-user-round-pen"><path d="M2 21a8 8 0 0 1 10.821-7.487"/><path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z"/><circle cx="10" cy="8" r="5"/></svg>
                    Edit
                </div>
            </td>
        </tr>
    `;
}