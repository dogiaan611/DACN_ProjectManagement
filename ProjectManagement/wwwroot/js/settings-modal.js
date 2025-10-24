// Reusable settings modal loader (refactored)
(function(){
  // Fetch HTML component (with cache busting)
  async function fetchHtml(path){
    const res = await fetch(`${path}?v=${Date.now()}`, { cache: "no-store" });
    if(!res.ok) throw new Error(`Failed to load ${path}`);
    return res.text();
  }

  // Create or return existing modal containers
  function ensureContainers(){
    let backdrop = document.getElementById("settings-backdrop");
    let modal = document.getElementById("settings-modal");
    if(backdrop && modal) return { backdrop, modal };

    backdrop = document.createElement("div");
    backdrop.id = "settings-backdrop";
    backdrop.className = "fixed inset-0 z-40 hidden bg-black/50";

    modal = document.createElement("div");
    modal.id = "settings-modal";
    modal.className = "fixed inset-0 flex items-center justify-center bg-black/50 z-50 overflow-y-auto hidden";
    modal.innerHTML = `
      <div id="settings-outer" class="w-full flex justify-center p-[14px]">
        <div class="w-full max-w-[1150px] rounded-[10px] bg-white shadow-2xl overflow-hidden" role="dialog" aria-modal="true">
          <div class="h-[600px] flex">
            <div id="settings-sidebar-container" class="h-full shrink-0 w-64"></div>
            <div id="settings-content-container" class="flex-1 overflow-y-auto min-w-0"></div>
          </div>
        </div>
      </div>`;

    document.body.append(backdrop, modal);
    return { backdrop, modal };
  }

  // Helper: Get JWT headers
  function getAuthHeaders(){
    const token = localStorage.getItem('pm_jwt') || '';
    const headers = new Headers({ "Accept": "application/json" });
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  }

  // Main open modal
  async function open(){
    const { backdrop, modal } = ensureContainers();

    // Load components
    const [sidebarHtml, contentHtml] = await Promise.all([
      fetchHtml('/components/settings_sidebar.html'),
      fetchHtml('/components/user_settings.html')
    ]);

    const sidebar = modal.querySelector('#settings-sidebar-container');
    const content = modal.querySelector('#settings-content-container');
    sidebar.innerHTML = sidebarHtml;
    content.innerHTML = contentHtml;

    // Close modal handler
    const outer = modal.querySelector('#settings-outer');
    const close = () => {
      modal.classList.add('hidden');
      backdrop.classList.add('hidden');
    };

    backdrop.onclick = close;
    outer.addEventListener('click', e => { if (e.target === outer) close(); });
    content.querySelector('[data-close-settings]')?.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.classList.contains('hidden')) close(); });

    // Sidebar active state
    sidebar.querySelectorAll('[data-settings-section]').forEach(btn => {
      btn.addEventListener('click', () => {
        sidebar.querySelectorAll('[data-settings-section]').forEach(b => b.dataset.active = 'false');
        btn.dataset.active = 'true';
      });
    });

    // Load user info
    try {
      const res = await fetch('/user/read', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to read user");
      const data = await res.json();

      const get = sel => content.querySelector(sel);
      const nameInput = get('#us-name');
      const emailText = get('#us-email');
      const phoneInput = get('#us-phone');
      const avatarPreview = get('#us-avatar-preview');
      const avatarInitial = get('#us-avatar-initial');

      nameInput.value = data.name ?? data.Name ?? '';
      emailText.textContent = data.email ?? data.Email ?? '';
      phoneInput.value = data.phoneNumber ?? data.PhoneNumber ?? '';

      // Sidebar name
      const sidebarName = document.querySelector('#us-name');
      if (sidebarName) sidebarName.textContent = data.name ?? data.Name ?? 'User';

      // Avatar handling
      if (data.avatarUrl) {
        avatarPreview.src = data.avatarUrl;
        avatarPreview.classList.remove('hidden');
        avatarInitial.classList.add('hidden');
      } else {
        avatarPreview.classList.add('hidden');
        avatarInitial.classList.remove('hidden');
      }

      // Upload avatar
      const trigger = get('#avatar-upload-trigger');
      const fileInput = get('#avatar-upload-file');
      trigger?.addEventListener('click', () => fileInput.click());
      fileInput?.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;

        // Preview image
        const reader = new FileReader();
        reader.onload = e => {
          avatarPreview.src = e.target.result;
          avatarPreview.classList.remove('hidden');
          avatarInitial.classList.add('hidden');
        };
        reader.readAsDataURL(file);

        try {
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await fetch('/upload-avatar', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData
          });
          const uploadData = await uploadRes.json();

          if (uploadRes.ok) {
            avatarPreview.src = uploadData.avatarUrl;
            avatarInput.value = uploadData.avatarUrl;
            console.log('Avatar uploaded:', uploadData.avatarUrl);
          } else alert(uploadData.message || 'Lỗi khi upload ảnh');
        } catch {
          alert('Không thể upload ảnh.');
        }
      });
    } catch (err) {
      console.error('Load user failed:', err);
    }

    // Auto save (if exists)
    if (window.initUserSettingsAutoSave) {
      setTimeout(() => window.initUserSettingsAutoSave(), 300);
    }

    // Save button
    const saveBtn = content.querySelector('#us-save');
    saveBtn?.addEventListener('click', async ()=>{
      if (window.userSettingsAutoSave) {
        await window.userSettingsAutoSave.forceSave();
        close();
        return;
      }

      const payload = {
        name: content.querySelector('#us-name')?.value?.trim(),
        phoneNumber: content.querySelector('#us-phone')?.value?.trim(),
        avatarUrl: content.querySelector('#us-avatar')?.value?.trim()
      };
      try {
        const headers = getAuthHeaders();
        headers.set('Content-Type', 'application/json');
        const res = await fetch('/user/update', { method: 'PUT', headers, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Update failed');
        close();
      } catch (err) {
        console.error(err);
        alert('Không thể lưu thay đổi hồ sơ');
      }
    });

    // Show modal
    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');
  }

  window.settingsModal = { open };
})();
