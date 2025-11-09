import { initUserSettingsAutoSave } from './user-settings-autosave.js';
import { initializeUserProfile, handleProfileSave } from './settings-profile.js';
import { initializePasswordModal } from './settings-password.js';
import { initializeDeleteAccountModal } from './settings-delete-account.js';

async function fetchHtml(path) {
    const res = await fetch(`${path}?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return res.text();
}

function ensureContainers() {
    let backdrop = document.getElementById("settings-backdrop");
    let modal = document.getElementById("settings-modal");
    if (backdrop && modal) return { backdrop, modal };

    const modalHtml = `<div id="settings-outer" style="width: 100%; display: flex; justify-content:center; padding: 14px;">
      <div style="width:100%; max-width: 1150px; border-radius:10px; background-color: white;" class="shadow-2xl overflow-hidden" role="dialog" aria-modal="true">
        <div style="height:600px; display:flex;">
          <div id="settings-sidebar-container" class="h-full shrink-0 w-64"></div>
          <div id="settings-content-container" class="flex-1 overflow-y-auto min-w-0"></div>
          </div>
        </div>
      </div>`;

    backdrop = document.createElement("div");
    backdrop.id = "settings-backdrop";
    backdrop.className = "fixed inset-0 z-40 hidden bg-black/50 opacity-0 transition-opacity duration-300";

    modal = document.createElement("div");
    modal.id = "settings-modal";
    modal.className = "fixed inset-0 hidden items-center justify-center z-50 overflow-y-auto transition-all duration-300 ease-out opacity-0 scale-95";
    modal.innerHTML = modalHtml;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
    return { backdrop, modal };
}

export async function open() {
    const { backdrop, modal } = ensureContainers();

    // Load main components
    const [sidebarHtml, contentHtml] = await Promise.all([
      fetchHtml('/components/settings_sidebar.html'),
      fetchHtml('/components/user_settings.html')
    ]);

    const sidebar = modal.querySelector('#settings-sidebar-container');
    const content = modal.querySelector('#settings-content-container');
    sidebar.innerHTML = sidebarHtml;
    content.innerHTML = contentHtml;

    // Close modal handler
    const close = () => {
        // Bắt đầu animation
        backdrop.classList.remove('opacity-100');
        modal.classList.remove('opacity-100', 'scale-100');
        modal.classList.add('opacity-0', 'scale-95');

        // Ẩn hẳn sau 300ms (hết animation)
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            backdrop.classList.add('hidden');
        }, 300);
    };

    const outer = modal.querySelector('#settings-outer');
    backdrop.onclick = close;
    outer.addEventListener('click', e => { if (e.target === outer) close(); });
    content.querySelector('[data-close-settings]')?.addEventListener('click', close);
    const escHandler = e => { if (e.key === 'Escape' && !modal.classList.contains('hidden')) close(); };
    document.addEventListener('keydown', escHandler);

    // Sidebar active state
    sidebar.querySelectorAll('[data-settings-section]').forEach(btn => {
        btn.addEventListener('click', () => {
            sidebar.querySelectorAll('[data-settings-section]').forEach(b => b.dataset.active = 'false');
            btn.setAttribute('data-active', 'true');
        });
    });

    // Initialize sub-modules
    await initializeUserProfile(content);
    initializePasswordModal(content);
    initializeDeleteAccountModal(content);

    // Initialize auto-save after a short delay to ensure all elements are ready
    setTimeout(() => initUserSettingsAutoSave(), 300);

    // Save button
    const saveBtn = content.querySelector('#us-save');
    saveBtn?.addEventListener('click', async () => {
        try {
            if (window.userSettingsAutoSave) {
                await window.userSettingsAutoSave.forceSave();
            } else {
                await handleProfileSave();
            }
            close();
        } catch (err) {
            console.error(err);
            alert('Không thể lưu thay đổi hồ sơ');
        }
    });

    // Hiện modal + hiệu ứng fade/scale
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    backdrop.classList.remove('hidden');

    // Trigger animation sau một tick
    setTimeout(() => {
    backdrop.classList.add('opacity-100');
    modal.classList.remove('opacity-0', 'scale-95');
    modal.classList.add('opacity-100', 'scale-100');
    }, 10);
}
