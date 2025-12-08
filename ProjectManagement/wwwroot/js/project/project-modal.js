import { authFetch } from "../auth/auth.js";

// --- State ---
const selectedUsers = new Map(); // userId -> { id, email, name }
let isInitialized = false;

// --- Elements (will be queried later) ---
let modal, backdrop, cancelBtn, outer, form, nameInput, descInput, searchInput, suggestions, selectedWrap;

export function open() {
  // Query for elements only when opening for the first time
  if (!isInitialized) {
    initialize();
  }

  if (!modal || !backdrop) return;

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  // hiện backdrop
  backdrop.classList.remove("hidden");
  setTimeout(() => backdrop.classList.add("opacity-100"), 10);

  // hiện modal content
  const content = document.getElementById("create-project-content");
  setTimeout(() => {
    content.classList.remove("scale-95", "opacity-0");
    content.classList.add("scale-100", "opacity-100");
  }, 10);

  nameInput?.focus();
}

function closeModal() {
  // No need to do anything if elements aren't there
  if (!modal || !backdrop) return;

  const content = document.getElementById("create-project-content");
  content.classList.remove("scale-100", "opacity-100");
  content.classList.add("scale-95", "opacity-0");

  backdrop.classList.remove("opacity-100");
  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    backdrop.classList.add("hidden");

    // reset form sau khi đóng
    form?.reset();
    selectedUsers.clear();
    if (selectedWrap) selectedWrap.innerHTML = "";
    if (suggestions) {
      suggestions.classList.add("hidden");
      suggestions.innerHTML = "";
    }
  }, 300);
}

function renderSelected() {
  if (!selectedWrap) return;
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
  if (!suggestions) return;
  if (!term || term.trim().length < 2) {
    suggestions.classList.add("hidden");
    suggestions.innerHTML = "";
    return;
  }
  try {
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
  const res = await authFetch("/projects/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Create project failed");
  return res.json();
}

async function addMember(projectId, userId) {
  const res = await authFetch(`/projects/${projectId}/add/members`, {
    method: "POST",
    body: JSON.stringify({ userId, role: 1 }),
  });
  if (!res.ok) throw new Error("Add member failed");
  return res.json();
}

function initialize() {
  // Query for elements inside the initializer
  modal = document.getElementById("create-project-modal");
  backdrop = document.getElementById("create-project-backdrop");
  cancelBtn = document.getElementById("cancel-create-project");
  outer = document.getElementById("modal-outer");
  form = document.getElementById("create-project-form");
  nameInput = document.getElementById("project-create-name");
  descInput = document.getElementById("project-create-description");
  searchInput = document.getElementById("member-search");
  suggestions = document.getElementById("member-suggestions");
  selectedWrap = document.getElementById("selected-members");

  if (!modal) {
    console.error("Create project modal not found in DOM.");
    return;
  }

  // Events
  cancelBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);
  outer?.addEventListener("click", (e) => {
    if (e.target === outer) closeModal();
  });

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
      if (window.projectSidebar && typeof window.projectSidebar.refresh === 'function') {
        window.projectSidebar.refresh();
      }
    } catch (err) {
      console.error(err);
      alert("Có lỗi khi tạo project hoặc thêm thành viên");
    }
  });

  isInitialized = true;
}
