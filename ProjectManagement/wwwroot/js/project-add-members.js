import { authFetch  } from "./auth.js";
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    console.log("Project ID:", projectId);
    const selectedUsers = new Map();
    const inviteButton = document.getElementById('add-member-btn');
    const inviteModal = document.getElementById('invite-modal');
    const inviteBackdrop = document.getElementById('invite-backdrop');
    const searchInput = document.getElementById('member-search');
    const suggestions = document.getElementById('member-suggestions');
    const selectedWrap = document.getElementById('selected-members');
    // Sửa lại ID cho đúng với file HTML đã cập nhật
    const cancelBtn = document.getElementById('cancel-invite-btn');
    const outer = document.getElementById('invite-modal-outer');
    const inviteForm = document.getElementById('invite-member-form');

    // Nếu không có projectId, không cần chạy script này
    if (!projectId) return;

    function open() {
        if(!inviteModal || !inviteBackdrop) return;
        inviteModal.classList.remove('hidden');
        inviteModal.classList.add('flex');
        inviteBackdrop.classList.remove('hidden');
        searchInput?.focus();
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
                item.innerHTML = `<div><div class="text-sm text-gray-900">${u.email ?? "(no email)"}</div><div class="text-xs text-gray-500">${u.name ?? "Unnamed"}</div></div>`;
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
            window.location.reload(); // Tải lại trang để cập nhật danh sách thành viên
        }
    });
})