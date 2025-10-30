document.addEventListener("DOMContentLoaded", async () => {
  const openBtn = document.getElementById("open-create-project");
  const modal = document.getElementById("create-project-modal");
  const backdrop = document.getElementById("create-project-backdrop");
  const cancelBtn = document.getElementById("cancel-create-project");
  const outer = document.getElementById("modal-outer");
  const form = document.getElementById("create-project-form");
  const nameInput = document.getElementById("project-name");
  const descInput = document.getElementById("project-description");
  const searchInput = document.getElementById("member-search");
  const suggestions = document.getElementById("member-suggestions");
  const selectedWrap = document.getElementById("selected-members");

  const selectedUsers = new Map(); // userId -> { id, email, name }

  function openModal() {
    if (!modal || !backdrop) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    backdrop.classList.remove("hidden");
    nameInput?.focus();
  }

  function closeModal() {
    if (!modal || !backdrop) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    backdrop.classList.add("hidden");
    form?.reset();
    selectedUsers.clear();
    selectedWrap.innerHTML = "";
    suggestions.classList.add("hidden");
    suggestions.innerHTML = "";
  }

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
      const token = (function(){ try { return localStorage.getItem('pm_jwt') || ''; } catch { return ''; } })();
      const headers = new Headers({ "Accept": "application/json" });
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const res = await fetch(`/user/search?q=${encodeURIComponent(term)}&limit=5`, { headers });
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
        item.innerHTML = `<div><div class=\"text-sm text-gray-900\">${u.email ?? "(no email)"}</div><div class=\"text-xs text-gray-500\">${u.name ?? "Unnamed"}</div></div>`;
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
    }
  }

  async function createProject(payload) {
    const token = (function(){ try { return localStorage.getItem('pm_jwt') || ''; } catch { return ''; } })();
    const headers = new Headers({ "Content-Type": "application/json", "Accept": "application/json" });
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch("/projects/create", {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Create project failed");
    return res.json();
  }

  async function addMember(projectId, userId) {
    const token = (function(){ try { return localStorage.getItem('pm_jwt') || ''; } catch { return ''; } })();
    const headers = new Headers({ "Content-Type": "application/json", "Accept": "application/json" });
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(`/projects/${projectId}/add/members`, {
      method: "POST",
      headers,
      body: JSON.stringify({ userId, role: 1 }) // ProjectMember as default
    });
    if (!res.ok) throw new Error("Add member failed");
    return res.json();
  }

  // Events
  openBtn?.addEventListener("click", openModal);
  cancelBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);
  // click outside content closes
  outer?.addEventListener("click", (e) => {
    if (e.target === outer) closeModal();
  });

  // ESC to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
  });

  let searchTimer;
  searchInput?.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => searchUsers(searchInput.value), 250);
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const description = (descInput.value || "").trim();
    const projectTypeValue = document.querySelector('input[name="project-type"]:checked')?.value || 'Kanban';

    // Convert string to enum value (Kanban = 0, Scrum = 1)
    const projectType = projectTypeValue === 'Scrum' ? 1 : 0;

    if (!name) {
      nameInput.focus();
      return;
    }
    try {
      const created = await createProject({ name, description, type: projectType });
      const projectId = created?.projectId ?? created?.ProjectId;
      const members = Array.from(selectedUsers.values());
      for (const m of members) {
        await addMember(projectId, m.id);
      }
      closeModal();
      // Refresh sidebar to show the new project
      if (window.projectSidebar && typeof window.projectSidebar.refresh === 'function') {
        window.projectSidebar.refresh();
      }
      // Optionally reload or show toast
    } catch (err) {
      console.error(err);
      alert("Có lỗi khi tạo project hoặc thêm thành viên");
    }
  });
});
