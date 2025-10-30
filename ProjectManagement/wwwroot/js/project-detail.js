import { authFetch } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Lấy projectId từ URL
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
});

async function loadProjectDetails(projectId) {
    try {
        const res = await authFetch(`/projects/${projectId}/readProject`);
        if (!res.ok) {
            throw new Error('Không thể tải thông tin project hoặc bạn không có quyền truy cập.');
        }
        const projectData = await res.json();

        // Cập nhật UI với dữ liệu nhận được
        renderProjectDetails(projectData);

    } catch (error) {
        console.error('Lỗi khi tải chi tiết project:', error);
        document.getElementById('project-detail-container').innerHTML = `
            <div class="text-center p-10">
                <h1 class="text-2xl font-bold text-red-600">${error.message}</h1>
            </div>
        `;
    }
}

function renderProjectDetails(data) {
    // Điền thông tin cơ bản
    document.getElementById('project-name').textContent = data.name;


    // Hiển thị danh sách thành viên
    const memberListEl = document.getElementById('member-list');
    memberListEl.innerHTML = ''; // Xóa nội dung cũ

    if (data.members && data.members.length > 0) {
        data.members.forEach(member => {
            const memberEl = document.createElement('div');
            memberEl.className = 'flex items-center justify-center gap-3';

            const avatarInitial = member.name ? member.name.charAt(0).toUpperCase() : '?';
            const roleText = member.isOwner ? 'Owner' : (member.role === 0 ? 'Admin' : 'Member'); // Giả sử 0=Admin, 1=Member

            // Hiển thị avatar hoặc chữ cái đầu của tên
            const avatarHtml = member.avatarUrl
                ? `<img src="${member.avatarUrl}" alt="${member.name}" class="w-10 h-10 rounded-xl object-cover">`
                : `<span class="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold">${avatarInitial}</span>`;

            memberEl.innerHTML = `
                ${avatarHtml}  
            `;
            memberListEl.appendChild(memberEl);
        });
    } else {
        memberListEl.innerHTML = '<p class="text-gray-500">Chưa có thành viên nào.</p>';
    }
}

//<div class="flex-1">
//    <div class="font-medium text-gray-800">${member.name || 'Unnamed User'}</div>
//    <div class="text-sm text-gray-500">${roleText}</div>
//</div>