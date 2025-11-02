import { authFetch  } from "./auth.js";
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    const selectedUsers = new Map();
    const inviteButton = document.getElementById('add-member-btn');
    const inviteModal = document.getElementById('invite-modal');
    const inviteBackdrop = document.getElementById('invite-backdrop');
    const searchInput = document.getElementById('member-search');
    const suggestions = document.getElementById('member-suggestions');
    const selectedWrap = document.getElementById('selected-members');
    const cancelBtn = document.getElementById('cancel-invite-btn');
    const outer = document.getElementById('invite-modal-outer');
    const inviteForm = document.getElementById('invite-member-form');
    if (!projectId) return;

    async function open() {
        if(!inviteModal || !inviteBackdrop) return;
        inviteModal.classList.remove('hidden');
        inviteModal.classList.add('flex');
        inviteBackdrop.classList.remove('hidden');
        searchInput?.focus();
        try {
            const res = await authFetch(`/projects/${projectId}/readProject`);
            if(!res.ok) {
                throw new Error('Không thể tải thông tin project hoặc bạn không có quyền truy cập.');
            }
            const data = await res.json();
            const currMemberList = document.getElementById('current-members-list'); // Sử dụng ID mới bên trong modal
            if (!currMemberList) return; // Dừng lại nếu không tìm thấy element

            currMemberList.innerHTML = `<h2 class="text-lg font-medium text-gray-700">Project Members</h2>`;

        if (data.members && data.members.length > 0) {
            data.members.forEach(member => {
                const memberEl = document.createElement('div'); 
                memberEl.className = `
                    flex flex-row items-center justify-between p-2 rounded-xl
                    hover:bg-gray-50 transition cursor-pointer
                `;

                const avatarInitial = member.name ? member.name.charAt(0).toUpperCase() : '?';
                const avatarHtml = member.avatarUrl
                    ? `<img src="${member.avatarUrl}" alt="${member.name}" class="w-10 h-10 rounded-full object-cover border border-gray-200">`
                    : `<div class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold">${avatarInitial}</div>`;

                const roleText = member.isOwner
                    ? 'Owner'
                    : (member.role === 0 ? 'Admin' : 'Member');


                // --- Nút hành động (chỉ hiện khi current user là Owner và target không phải Owner) ---
                const canManage = data.isCurrentUserOwner && !member.isOwner;
                const actionsHtml = canManage ? `
                    <div class="flex gap-2">
                        <button class="text-xs bg-cyan-100 text-cyan-700 border border-cyan-300 hover:bg-cyan-200 px-2 py-1 rounded transition make-owner-btn" data-id="${member.userId}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-star-icon lucide-user-star"><path d="M16.051 12.616a1 1 0 0 1 1.909.024l.737 1.452a1 1 0 0 0 .737.535l1.634.256a1 1 0 0 1 .588 1.806l-1.172 1.168a1 1 0 0 0-.282.866l.259 1.613a1 1 0 0 1-1.541 1.134l-1.465-.75a1 1 0 0 0-.912 0l-1.465.75a1 1 0 0 1-1.539-1.133l.258-1.613a1 1 0 0 0-.282-.866l-1.156-1.153a1 1 0 0 1 .572-1.822l1.633-.256a1 1 0 0 0 .737-.535z"/><path d="M8 15H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/></svg>
                        </button>
                        <button class="text-xs bg-red-100 text-red-700 border border-red-300  px-2 py-1 rounded hover:bg-red-200 transition remove-member-btn" data-id="${member.userId}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-icon lucide-trash"><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                ` : '';

                memberEl.innerHTML = `
                    <div class="flex items-center gap-3">
                        ${avatarHtml}
                        <div>
                            <p class="font-medium text-gray-800">${member.name || 'Người dùng'}</p>
                            <p class="text-sm text-gray-500">@${member.email || 'Không có email'}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                    ${actionsHtml}
                        <span class="text-xs px-2 py-1 rounded-full ${
                            member.isOwner
                                ? 'bg-yellow-200 text-yellow-600'
                                : member.role === 0
                                ? 'bg-blue-200 text-blue-600'
                                : 'bg-gray-200 text-gray-600'
                            }">${roleText}
                        </span>
                    </div>
                `;

                currMemberList.appendChild(memberEl);
            });

                    // Gắn sự kiện cho 2 nút hành động
            currMemberList.querySelectorAll('.make-owner-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const memberId = btn.getAttribute('data-id');
                    if (confirm("Xác nhận chuyển quyền Owner cho thành viên này?")) {
                        await handleAction('make-owner', projectId, memberId);
                    }
                });
            });

            currMemberList.querySelectorAll('.remove-member-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const memberId = btn.getAttribute('data-id');
                    if (confirm("Xác nhận xóa thành viên này khỏi project?")) {
                        await handleAction('remove-member', projectId, memberId);
                    }
                });
            });
        } else {
            currMemberList.innerHTML += `
                <p class="text-center text-gray-500 mt-3">Chưa có thành viên nào.</p>
            `;
        }

        }catch (error){
            console.error('Lỗi khi tải chi tiết project:', error);

        }
    }

    function close() {
        if(!inviteModal || !inviteBackdrop) return;
        inviteModal.classList.add('hidden');
        inviteModal.classList.remove('flex');
        inviteBackdrop.classList.add('hidden');

        // Reset state
        selectedUsers.clear();
        if (selectedWrap) selectedWrap.innerHTML = "";
        if (suggestions) {
            suggestions.classList.add("hidden");
            suggestions.innerHTML = "";
        }
        if (searchInput) searchInput.value = "";
    }

    // Event Listeners
    inviteButton?.addEventListener('click', open);
    cancelBtn?.addEventListener('click', close);
    inviteBackdrop?.addEventListener('click', close);
    outer?.addEventListener('click', (e) => { if (e.target === outer) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !inviteModal.classList.contains('hidden')) close(); });

    function renderSelected() {
        selectedWrap.innerHTML = "";
        for (const [, u] of selectedUsers) {
        const chip = document.createElement("span");
        chip.className = "inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-sm border border-blue-200";
        chip.innerHTML = `<span>${u.email}</span>`;
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "rounded-full p-1 hover:bg-blue-100";
        removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
        removeBtn.addEventListener("click", () => {
            selectedUsers.delete(u.id);
            renderSelected();
        });
        chip.appendChild(removeBtn);
        selectedWrap.appendChild(chip);
        }
    }
    
    async function searchUsers(term) {
        if (!term || term.trim().length < 2) {
            suggestions.classList.add("hidden");
            suggestions.innerHTML = "";
            return;
        }
        try {
            // Sử dụng authFetch từ global scope hoặc import nếu là module
            const res = await authFetch(`/user/search?q=${encodeURIComponent(term)}&limit=5`);
            if (!res.ok) throw new Error("Search failed");
            const data = await res.json();
            suggestions.innerHTML = "";
            if (!Array.isArray(data) || data.length === 0) {
                suggestions.classList.add("hidden");
                return;
            }
            for (const u of data) {
                const item = document.createElement("button");
                item.type = "button";
                item.className = "flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50";
                item.innerHTML = `<div><div class="text-sm text-gray-900">${u.email ?? "(no email)"}</div></div>`;
                item.addEventListener("click", () => {
                    if (u.id && !selectedUsers.has(u.id)) {
                        selectedUsers.set(u.id, { id: u.id, email: u.email, name: u.name });
                        renderSelected();
                    }
                    suggestions.classList.add("hidden");
                    suggestions.innerHTML = "";
                    searchInput.value = "";
                    searchInput.focus();
                });
                suggestions.appendChild(item);
            }
            suggestions.classList.remove("hidden");
        } catch (e) {
            console.error(e);
            suggestions.classList.add("hidden");
        }
    }

    async function addMembers(users) {
        if (!projectId || users.length === 0) return;

        for (const user of users) {
            try {
                // Role: 1 = ProjectMember (thành viên thường)
                const res = await authFetch(`/projects/${projectId}/add/members`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: user.id, role: 1 })
                });
                if (!res.ok) {
                    const errData = await res.json();
                    console.error(`Failed to add member ${user.email}:`, errData.message || 'Unknown error');
                    // Có thể hiển thị thông báo lỗi cho từng user ở đây
                }
            } catch (err) {
                console.error(`Error adding member ${user.email}:`, err);
            }
        }
    }

    // Debounce search input
    let searchTimer;
    searchInput?.addEventListener("input", () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => searchUsers(searchInput.value), 250);
    });

    // Form submission
    inviteForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const membersToAdd = Array.from(selectedUsers.values());
        if (membersToAdd.length > 0) {
            await addMembers(membersToAdd);
            close();
            // Tải lại nội dung trang project-detail để cập nhật danh sách thành viên
            // mà không cần reload toàn bộ trang.
            // Điều này giả định rằng hàm loadProjectDetails có thể được gọi lại.
            document.dispatchEvent(new CustomEvent('project-members-updated'));
        }
    });

    async function handleAction(action, projectId, memberId) {
        try {
            let response;
            if (action === 'make-owner') {
                response = await authFetch(`/projects/${projectId}/update/owner`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ newOwnerId: memberId })
                });
            } else if (action === 'remove-member') {
                response = await authFetch(`/projects/${projectId}/delete/members/${memberId}`, {
                    method: 'DELETE'
                });
            }

            if (response.ok) {
                alert('Thao tác thành công!');
                await open(); // tải lại danh sách mà không reload toàn trang
            } else {
                const err = await response.json();
                throw new Error(err.message || 'Thao tác thất bại.');
            }
        } catch (error) {
            console.error(error);
            alert(`Lỗi: ${error.message}`);
        }
    }
})