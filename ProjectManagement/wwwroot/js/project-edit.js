import { authFetch } from "./auth.js";

// Lưu trữ các event listeners để có thể cleanup
let editEventHandlers = {
    editButton: null,
    closeBtn: null,
    backdrop: null,
    outer: null,
    saveBtn: null,
    delBtn: null
};

// Hàm cleanup event listeners cũ
function cleanupEditListeners() {
    const editButton = document.getElementById('edit-button');
    const closeBtn = document.getElementById('close-modal');
    const backdrop = document.getElementById('edit-backdrop');
    const outer = document.getElementById('edit-modal-outer');
    const saveBtn = document.getElementById('save-btn');
    const delBtn = document.getElementById('del-btn');

    if (editButton && editEventHandlers.editButton) {
        editButton.removeEventListener('click', editEventHandlers.editButton);
    }
    if (closeBtn && editEventHandlers.closeBtn) {
        closeBtn.removeEventListener('click', editEventHandlers.closeBtn);
    }
    if (backdrop && editEventHandlers.backdrop) {
        backdrop.removeEventListener('click', editEventHandlers.backdrop);
    }
    if (outer && editEventHandlers.outer) {
        outer.removeEventListener('click', editEventHandlers.outer);
    }
    if (saveBtn && editEventHandlers.saveBtn) {
        saveBtn.removeEventListener('click', editEventHandlers.saveBtn);
    }
    if (delBtn && editEventHandlers.delBtn) {
        delBtn.removeEventListener('click', editEventHandlers.delBtn);
    }

    // Reset handlers
    editEventHandlers = {
        editButton: null,
        closeBtn: null,
        backdrop: null,
        outer: null,
        saveBtn: null,
        delBtn: null
    };
}

// Hàm khởi tạo, sẽ được gọi bởi SPA router
export function initProjectEdit() {
    console.log("initProjectEdit called");

    // Cleanup listeners cũ trước
    cleanupEditListeners();

    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    const editButton = document.getElementById('edit-button');
    const backdrop = document.getElementById('edit-backdrop');
    const modal = document.getElementById('edit-modal');
    const outer = document.getElementById('edit-modal-outer');
    const closeBtn = document.getElementById('close-modal');
    const projNameInput = document.getElementById('proj-name');
    const projDescTextarea = document.getElementById('proj-desc');
    const projTypeSpan = document.getElementById('proj-type');
    const creatorAvtImg = document.getElementById('creator-avatar');
    const creatorNameP = document.getElementById('creator-name');
    const creatorEmailP = document.getElementById('creator-email');
    const saveBtn = document.getElementById('save-btn');
    const delBtn = document.getElementById('del-btn');
    const memberListContainer = document.getElementById('proj-member-list');

    if (!projectId) return;

    async function open() {
        if (!modal || !backdrop) return;

        // 1. Hiển thị modal và backdrop nhưng giữ chúng "vô hình" hoặc ngoài màn hình
        modal.classList.remove('hidden'); // Quan trọng: Xóa class 'hidden' để modal có thể hiển thị
        backdrop.classList.remove('hidden');

        try {
            const res = await authFetch(`/projects/${projectId}/readProject`);
            if (!res.ok) {
                throw new Error('Không thể tải thông tin project hoặc bạn không có quyền truy cập.');
            }
            const data = await res.json();

            // Populate basic project info
            projNameInput.value = data.name;
            projDescTextarea.value = data.description;
            projTypeSpan.textContent = data.type === 1 ? 'Scrum' : 'Kanban';

            // Fetch and populate creator info
            if (data.createdById) {
                const userRes = await authFetch(`/user/read?id=${data.createdById}`);
                if (userRes.ok) {
                    const creatorData = await userRes.json();
                    creatorAvtImg.src = creatorData.avatarUrl || '/images/default-avatar.png';
                    creatorNameP.textContent = creatorData.name || 'Unknown User';
                    creatorEmailP.textContent = creatorData.email || 'No email';
                }
            }

            // Populate members list
            memberListContainer.innerHTML = '';
            if (data.members && data.members.length > 0) {
                data.members.forEach(member => {
                    const memberEl = document.createElement('div');
                    memberEl.className = 'flex items-center justify-center border border-white rounded-full';
                    memberEl.title = `${member.name} (${member.isOwner ? 'Owner' : (member.role === 0 ? 'Admin' : 'Member')})`;

                    const avatarHtml = member.avatarUrl
                        ? `<img src="${member.avatarUrl}" alt="${member.name}" class="w-10 h-10 rounded-full object-cover border-2 border-white">`
                        : `<span class="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold border-2 border-white">${member.name ? member.name.charAt(0).toUpperCase() : '?'}</span>`;

                    memberEl.innerHTML = avatarHtml;
                    memberListContainer.appendChild(memberEl);
                });
            } else {
                memberListContainer.innerHTML = '<p class="text-gray-500 text-sm">Chưa có thành viên nào.</p>';
            }

            // 2. Sau khi tải xong dữ liệu, bắt đầu hiệu ứng trượt vào
            // Thuộc tính transform được định nghĩa trong CSS, ta chỉ cần thay đổi class
            // Thêm class để trượt vào
        requestAnimationFrame(() => modal.classList.replace('translate-x-full', 'translate-x-0'));

        } catch (error) {
            console.error('Failed to load project details for editing: ', error);
            alert('Không thể tải chi tiết dự án. Vui lòng thử lại.');
        }
    }

    function close() {
        if (!modal || !backdrop) return;
        // Trượt modal ra khỏi màn hình
        // Thêm class để trượt ra
        modal.classList.replace('translate-x-0', 'translate-x-full');

        // Ẩn sau khi trượt xong
        setTimeout(() => {
            modal.classList.add('hidden');
            backdrop.classList.add('hidden');
        }, 300); // khớp với duration-300
    }

    async function saveChanges() {
        const payload = {
            name: projNameInput.value.trim(),
            description: projDescTextarea.value.trim()
        };

        if (!payload.name) {
            alert('Tên project không được để trống.');
            return;
        }

        try {
            const res = await authFetch(`/projects/${projectId}/update`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Cập nhật thất bại.');

            close();
            // Dispatch event to notify other parts of the app (like project-detail.js)
            document.dispatchEvent(new CustomEvent('project-updated', { detail: payload }));

        } catch (error) {
            console.error('Failed to save project:', error);
            alert('Lỗi khi lưu project. Vui lòng thử lại.');
        }
    }

    // Tạo handlers và lưu lại để có thể cleanup sau
    const handleDelete = async (e) => {
        e.preventDefault();
        if (confirm('Bạn có chắc chắn muốn xóa dự án này?')) {
            try {
                const res = await authFetch(`/projects/${projectId}/delete`, {
                    method: 'DELETE'
                });
                if (res.ok) {
                    window.location.href = '/index.html'
                } else {
                    console.log('Xoa that bai');
                    alert('Lỗi khi xóa project. Vui lòng thử lại.');
                }
            } catch (error) {
                console.error('Failed to delete project:', error);
                alert('Lỗi khi xóa project. Vui lòng thử lại.');
            }
        }
    };

    const handleOuterClick = (e) => {
        // Đóng modal khi click vào vùng nền mờ bên ngoài
        if (e.target === outer) close();
    };

    // Lưu handlers
    editEventHandlers.editButton = open;
    editEventHandlers.closeBtn = close;
    editEventHandlers.backdrop = close;
    editEventHandlers.outer = handleOuterClick;
    editEventHandlers.saveBtn = saveChanges;
    editEventHandlers.delBtn = handleDelete;

    // Gắn event listeners
    if (editButton) editButton.addEventListener('click', editEventHandlers.editButton);
    if (closeBtn) closeBtn.addEventListener('click', editEventHandlers.closeBtn);
    if (backdrop) backdrop.addEventListener('click', editEventHandlers.backdrop);
    if (outer) outer.addEventListener('click', editEventHandlers.outer);
    if (saveBtn) saveBtn.addEventListener('click', editEventHandlers.saveBtn);
    if (delBtn) delBtn.addEventListener('click', editEventHandlers.delBtn);
}