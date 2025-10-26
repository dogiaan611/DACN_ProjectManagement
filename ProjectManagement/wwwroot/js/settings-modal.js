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
    modal.className = "fixed inset-0 flex items-center justify-center bg-black/40 z-50 overflow-y-auto";
    modal.innerHTML = `<div id="settings-outer" style="width: 100%; display: flex; justify-content:center; padding: 14px;">
      <div style="width:100%; max-width: 1150px; border-radius:10px; background-color: white;" class="shadow-2xl overflow-hidden" role="dialog" aria-modal="true">
        <div style="height:600px; display:flex;">
          <div id="settings-sidebar-container" class="h-full shrink-0 w-64"></div>
          <div id="settings-content-container" class="flex-1 overflow-y-auto min-w-0"></div>
          </div>
        </div>
      </div>`;

    document.body.appendChild(backdrop); 
    document.body.appendChild(modal); 
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
    function close(){ 
      modal.classList.add('hidden'); 
      modal.classList.remove('flex'); 
      backdrop.classList.add('hidden'); 
    }

    backdrop.onclick = close;
    outer.addEventListener('click', e => { if (e.target === outer) close(); });
    content.querySelector('[data-close-settings]')?.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.classList.contains('hidden')) close(); });

    // Sidebar active state
    sidebar.querySelectorAll('[data-settings-section]').forEach(btn => {
      btn.addEventListener('click', () => {
        sidebar.querySelectorAll('[data-settings-section]').forEach(b => b.dataset.active = 'false');
        btn.setAttribute('data-active','true');
      });
    });

    // Password modal wiring (migrated from setting-password.js)
    (function PasswordModal(){
      const pwOpenBtn = content.querySelector('#us-password-btn');
      const pwBackdrop = content.querySelector('#modal-backdrop');
      const pwModal = content.querySelector('#password-modal');
      const pwFormOuter = content.querySelector('#modal-outer');
      const pwCloseBtn = content.querySelector('#close-btn');

      if (!pwModal || !pwBackdrop) return; // nothing to wire if markup absent

      const openPw = () => {
        pwModal.classList.remove('hidden');
        pwModal.classList.add('flex');
        pwBackdrop.classList.remove('hidden');
      };
      const closePw = () => {
        pwModal.classList.add('hidden');
        pwModal.classList.remove('flex');
        pwBackdrop.classList.add('hidden');
      };

      // avoid duplicate listeners by rebinding nodes within content scope
      function rebind(el){
        if(!el) return el;
        const clone = el.cloneNode(true);
        el.parentNode && el.parentNode.replaceChild(clone, el);
        return clone;
      }

      const safeOpenBtn = rebind(pwOpenBtn);
      const safeCloseBtn = rebind(pwCloseBtn);
      const safeBackdrop = rebind(pwBackdrop);

      safeOpenBtn?.addEventListener('click', openPw);
      safeCloseBtn?.addEventListener('click', closePw);
      safeBackdrop?.addEventListener('click', closePw);

      // close when clicking outside the inner form
      pwModal?.addEventListener('click', (e)=>{ if(e.target === pwModal) closePw(); });

      // Escape key handling for password modal only when visible
      const escHandler = (e) => {
        if(e.key === 'Escape' && !pwModal.classList.contains('hidden')) closePw();
      };
      // attach once per open() call; remove on close to avoid leaks
      document.addEventListener('keydown', escHandler);
      // ensure removal when settings modal closes
      const cleanup = () => document.removeEventListener('keydown', escHandler);
      // tie cleanup to both closers
      safeCloseBtn?.addEventListener('click', cleanup);
      safeBackdrop?.addEventListener('click', cleanup);
      pwModal?.addEventListener('click', (e)=>{ if(e.target === pwModal) cleanup(); });
    })();

    //delete account modal
      (function DeleteAccountModal() {
          const dlOpenBtn = content.querySelector('#us-delete-btn');
          const dlBackdrop = content.querySelector('#modal-account-backdrop');
          const dlModal = content.querySelector('#delete-account-modal');
          const dlCloseBtn = content.querySelector('#cancel-btn');
          const currentEmailInput = content.querySelector('#current-email');
          const confirmDeleteBtn = content.querySelector('#confirm-btn');
          if (!dlModal || !dlBackdrop) return;
          const openDM = () => {
              dlModal.classList.remove('hidden');
              dlModal.classList.add('flex');
              dlBackdrop.classList.remove('hidden');
          };
          const closeDM = () => {
              dlModal.classList.add('hidden');
              dlModal.classList.remove('flex');
              dlBackdrop.classList.add('hidden');
          };

          // avoid duplicate listeners by rebinding nodes within content scope
          function rebind(el) {
              if (!el) return el;
              const clone = el.cloneNode(true);
              el.parentNode && el.parentNode.replaceChild(clone, el);
              return clone;
          }

          const safeOpenBtn = rebind(dlOpenBtn);
          const safeCloseBtn = rebind(dlCloseBtn);
          const safeBackdrop = rebind(dlBackdrop);

          safeOpenBtn?.addEventListener('click', openDM);
          safeCloseBtn?.addEventListener('click', closeDM);
          safeBackdrop?.addEventListener('click', closeDM);

          dlModal?.addEventListener('click', (e) => { if (e.target === dlModal) closeDM(); });
          const escHandler = (e) => {
              if (e.key === 'Escape' && !dlModal.classList.contains('hidden')) closeDM();
          };
          document.addEventListener('keydown', escHandler);
          // ensure removal when settings modal closes
          const cleanup = () => document.removeEventListener('keydown', escHandler);
          // tie cleanup to both closers
          safeCloseBtn?.addEventListener('click', cleanup);
          safeBackdrop?.addEventListener('click', cleanup);
          dlModal?.addEventListener('click', (e) => { if (e.target === dlModal) cleanup(); });

          const errorMsg = content.querySelector('#error-content');
          // Delete account action
          confirmDeleteBtn?.addEventListener('click', async (e) => {
              e.preventDefault();

              const emailValue = currentEmailInput.value.trim();
              if (!emailValue) {
                  errorMsg.textContent = 'Vui lòng nhập email hiện tại của bạn.';
                  return;
              }
              try {
                  const headers = getAuthHeaders();
                  headers.set('Content-Type', 'application/json');
                  const res = await fetch('/user/delete', {
                      method: 'DELETE',
                      headers,
                      body: JSON.stringify({ email: emailValue })
                  });
                  const data = await res.json();

                  if (res.ok) {
                      // Account deleted successfully, log out the user
                      localStorage.removeItem('pm_jwt');
                      window.location.href = '/goodbye.html'; // Redirect to a goodbye page
                  } else {
                      let errorMessage = 'Email không đúng.';
                      if (data.errors && Array.isArray(data.errors)) {
                          errorMessage = data.errors.map(err => err.description).join('\n');
                      } else if (data.message) {
                          errorMessage = data.message;
                      }
                      errorMsg.textContent = errorMessage;
                  }
              } catch (error) {
                  console.log('Lỗi khi gửi yêu cầu', error);
                  errorMsg.textContent = 'Đã xảy ra lỗi mạng. vui lòng thử lại sau.';
              }
          })
      })();

    // Load user info
    try {
      const res = await fetch('/user/read', { headers: getAuthHeaders() });
      if(res.ok){ 
        const data = await res.json(); 
        const nameUser = content.querySelector('#us-name'); 
        const nameSidebar = document.querySelector('#us-name'); 
        const email = content.querySelector('#us-email'); 
        const phone = content.querySelector('#us-phone'); 
        const userId = document.querySelector('#us-user-id'); 
        const avatarPreview = content.querySelector('#us-avatar-preview'); 
        const avatarInitial = content.querySelector('#us-avatar-initial');

        if (nameUser) nameUser.value = data.name ?? data.Name ?? ''; 
        if (nameSidebar) nameSidebar.textContent = data.name ?? data.Name ?? 'User'; 
        if (email) email.textContent = data.email ?? data.Email ?? ''; 
        if(phone) phone.value = data.phoneNumber ?? data.PhoneNumber ?? ''; 
        if(userId) userId.textContent = data.id ?? data.UserId ?? '';

        // Avatar handling
        if (data.avatarUrl) {
          avatarPreview.src = data.avatarUrl;
          avatarPreview.classList.remove('hidden');
          avatarInitial.classList.add('hidden');
        } else {
          avatarPreview.classList.add('hidden');
          avatarInitial.classList.remove('hidden');
        }

        // Set placeholder for delete confirmation email input
        const deleteEmailInput = content.querySelector('#current-email');
        if (deleteEmailInput) {
          const userEmail = data.email ?? data.Email ?? '';
          if (userEmail) deleteEmailInput.placeholder = userEmail;
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
      }
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
