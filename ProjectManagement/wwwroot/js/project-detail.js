import { authFetch } from './auth.js';
import { initProjectEdit } from './project-edit.js';
import { initProjectAddMembers } from './project-add-members.js';
import { initProjectBoard } from './project-board.js';
import { initProjectList } from './project-list.js';
import { initProjectSpreadsheet } from './project-spreadsheet.js';
// Lưu trữ dữ liệu project hiện tại
let currentProjectData = null;

// Hàm khởi tạo, sẽ được gọi bởi SPA router
export async function initProjectDetail() {
    console.log("initProjectDetail called");
    initProjectEdit();
    initProjectAddMembers();
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (!projectId) {
        document.getElementById('project-detail-container').innerHTML = `
            <div class="text-center p-10">
                <h1 class="text-2xl font-bold text-red-600">Lỗi: Không tìm thấy ID của project.</h1>
                <a href="/" class="mt-4 inline-block text-blue-500 hover:underline">Quay về trang chủ</a>
            </div>
        `;
        return;
    }

    // Gọi API để lấy thông tin chi tiết project
    await loadProjectDetails(projectId);
    viewSwitcher();
    // Lắng nghe sự kiện khi project được cập nhật từ modal edit
    document.addEventListener('project-updated', () => {
        loadProjectDetails(projectId);
    });

    // Lắng nghe sự kiện khi thành viên được thêm/xóa/thay đổi từ modal add-members
    document.addEventListener('project-members-updated', () => {
        loadProjectDetails(projectId);
    });
}

// document.addEventListener('DOMContentLoaded', initProjectDetail); // Dòng này không cần thiết trong SPA

async function loadProjectDetails(projectId) {
    try {
        const res = await authFetch(`/projects/${projectId}/readProject`);
        if (!res.ok) {
            throw new Error('Không thể tải thông tin project hoặc bạn không có quyền truy cập.');
        }
        const projectData = await res.json();
        currentProjectData = projectData; // Lưu dữ liệu project vào biến toàn cục

        // Cập nhật UI với dữ liệu nhận được
        renderProjectDetails(projectData);
        initProjectEdit();
        initProjectAddMembers();
    } catch (error) {
        console.error('Lỗi khi tải chi tiết project:', error);
        document.getElementById('project-detail-container').innerHTML = `
            <div class="text-center p-10">
                <h1 class="text-2xl font-bold text-red-600">${error.message}</h1>
            </div>
        `;
    }
}

async function viewSwitcher() {
    const kanbanBtn = document.getElementById('kanban-view-btn');
    const listBtn = document.getElementById('list-view-btn');
    const spreadsheetBtn = document.getElementById('spreadsheet-view-btn');
    if (!kanbanBtn || !listBtn || !spreadsheetBtn) {
        console.log('View btn not found');
        initProjectBoard();
        return;
    }
    if (kanbanBtn.dataset.listenerAdded === 'true') {
        return;
    }
    kanbanBtn.dataset.listenerAdded = 'true';
    listBtn.dataset.listenerAdded = 'true';
    spreadsheetBtn.dataset.listenerAdded = 'true';

    kanbanBtn.addEventListener('click', () => {
        kanbanBtn.classList.add('active', 'text-blue-400');
        listBtn.classList.remove('active', 'text-blue-400');
        spreadsheetBtn.classList.remove('active', 'text-blue-400');
        initProjectBoard();
    });
    listBtn.addEventListener('click', () => {
        kanbanBtn.classList.remove('active', 'text-blue-400');
        listBtn.classList.add('active', 'text-blue-400');
        spreadsheetBtn.classList.remove('active', 'text-blue-400');
        initProjectList();
    });
    spreadsheetBtn.addEventListener('click', () => {
        kanbanBtn.classList.remove('active', 'text-blue-400');
        listBtn.classList.remove('active', 'text-blue-400');
        spreadsheetBtn.classList.add('active', 'text-blue-400');
        initProjectSpreadsheet();
    });
    kanbanBtn.click();
}

async function renderProjectDetails(data) {
    // Điền thông tin cơ bản
    document.getElementById('project-name').textContent = data.name;
    document.getElementById('project-description').textContent = data.description;

    // Hiển thị danh sách thành viên
    const memberListEl = document.getElementById('member-list');
    memberListEl.innerHTML = ''; // Xóa nội dung cũ

    if (data.members && data.members.length > 0) {
        data.members.forEach(member => {
            const memberEl = document.createElement('div');
            // Thêm -ml-2 để các avatar chồng lên nhau một chút
            memberEl.className = 'flex items-center justify-center border border-white rounded-full';
            memberEl.role = 'button';
            memberEl.tabIndex = 0;
            memberEl.title = `${member.name} (${member.isOwner ? 'Owner' : (member.role === 0 ? 'Admin' : 'Member')})`;
            memberEl.setAttribute('data-member-id', member.userId);

            const avatarInitial = member.name ? member.name.charAt(0).toUpperCase() : '?';

            // Hiển thị avatar hoặc chữ cái đầu của tên
            const avatarHtml = member.avatarUrl
                ? `<img src="${member.avatarUrl}" alt="${member.name}" class="w-10 h-10 rounded-full object-cover border-2 border-white">`
                : `<span class="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold border-2 border-white">${avatarInitial}</span>`;

            memberEl.innerHTML = `
                ${avatarHtml}
            `;

            // Thêm sự kiện click để mở modal
            memberEl.addEventListener('click', () => openMemberModal(member.userId));

            memberListEl.appendChild(memberEl);
        });
    } else {
        memberListEl.innerHTML = '<p class="text-gray-500">Chưa có thành viên nào.</p>';
    }
}
