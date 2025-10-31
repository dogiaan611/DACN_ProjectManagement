import { authFetch } from './auth.js';

let currentProjectData = null;
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
        currentProjectData = projectData; // Lưu dữ liệu project vào biến toàn cục

        // Cập nhật UI với dữ liệu nhận được
        renderProjectDetails(projectData);
        setupMemberModal();
    } catch (error) {
        console.error('Lỗi khi tải chi tiết project:', error);
        document.getElementById('project-detail-container').innerHTML = `
            <div class="text-center p-10">
                <h1 class="text-2xl font-bold text-red-600">${error.message}</h1>
            </div>
        `;
    }
}

async function renderProjectDetails(data) {
    // Điền thông tin cơ bản
    document.getElementById('project-name').textContent = data.name;


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

async function setupMemberModal() {
    const backdrop = document.getElementById('member-modal-backdrop');
    const modal = document.getElementById('member-modal');
    const outer = document.getElementById('member-modal-outer');
    const cancelBtn = document.getElementById('cancel-member-modal-btn');

    const close = () => {
        modal.classList.add('hidden');
        backdrop.classList.add('hidden');
    };

    backdrop.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    outer.addEventListener('click', (e) => { if (e.target === outer) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.classList.contains('hidden')) close(); });
}

function openMemberModal(memberId) {
    if (!currentProjectData) return;

    const member = currentProjectData.members.find(m => m.userId === memberId);
    if (!member) return;

    const modal = document.getElementById('member-modal');
    const backdrop = document.getElementById('member-modal-backdrop');

    // Điền thông tin thành viên vào modalq
    const avatarEl = document.getElementById('member-modal-avatar');
    if (member.avatarUrl) {
        avatarEl.innerHTML = `<img src="${member.avatarUrl}" alt="${member.name}" class="w-16 h-16 rounded-full object-cover">`;
    } else {
        avatarEl.textContent = member.name ? member.name.charAt(0).toUpperCase() : '?';
        avatarEl.innerHTML = `<span>${member.name ? member.name.charAt(0).toUpperCase() : '?'}</span>`;
    }
    document.getElementById('member-modal-name').textContent = member.name || 'Unnamed User';
    document.getElementById('member-modal-email').textContent = member.email || 'No email';
    document.getElementById('member-modal-role').textContent = member.isOwner ? 'Owner' : (member.role === 0 ? 'Admin' : 'Member');

    // Lấy các nút hành động
    const makeOwnerBtn = document.getElementById('make-owner-btn');
    const removeMemberBtn = document.getElementById('remove-member-btn');

    // Logic hiển thị nút: chỉ hiện khi người dùng hiện tại là owner VÀ thành viên được chọn không phải là owner
    const canManage = currentProjectData.isCurrentUserOwner && !member.isOwner;

    makeOwnerBtn.classList.toggle('hidden', !canManage);
    removeMemberBtn.classList.toggle('hidden', !canManage);

    // Gán lại sự kiện để tránh bị lặp
    makeOwnerBtn.onclick = () => handleAction('make-owner', member.userId);
    removeMemberBtn.onclick = () => handleAction('remove-member', member.userId);

    // Hiển thị modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    backdrop.classList.remove('hidden');
}

async function handleAction(action, memberId) {
    const projectId = currentProjectData.projectId;
    if (!confirm(`Bạn có chắc chắn muốn thực hiện hành động này?`)) return;

    try {
        let response;
        if (action === 'make-owner') {
            response = await authFetch(`/projects/${projectId}/update/owner`, {
                method: 'POST',
                body: JSON.stringify({ newOwnerId: memberId })
            });
        } else if (action === 'remove-member') {
            response = await authFetch(`/projects/${projectId}/delete/members/${memberId}`, { method: 'DELETE' });
        }

        if (response && response.ok) {
            alert('Thao tác thành công!');
            window.location.reload();
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Thao tác thất bại.');
        }
    } catch (error) {
        console.error(`Lỗi khi ${action}:`, error);
        alert(`Lỗi: ${error.message}`);
    }
}