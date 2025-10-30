import { authFetch } from './auth.js';

async function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await authFetch('/user/upload-avatar', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Lỗi khi upload ảnh');
        }

        return await res.json();
    } catch (error) {
        console.error('Không thể upload ảnh.', error);
        alert('Không thể upload ảnh.');
        return null;
    }
}

function updateAvatarUI(avatarUrl) {
    const elements = { // Query globally for these as they are in different containers
        preview: document.querySelector('#settings-content-container #us-avatar-preview'),
        initial: document.querySelector('#settings-content-container #us-avatar-initial'),
        sidebarAvatar: document.querySelector('#us-avatar'), // Main sidebar avatar
        sidebarIcon: document.querySelector('#us-user-icon') // Main sidebar icon
    };

    if (avatarUrl) {
        elements.preview.src = avatarUrl;
        elements.preview.classList.remove('hidden');
        elements.initial.classList.add('hidden');

        elements.sidebarAvatar.src = avatarUrl;
        elements.sidebarAvatar.classList.remove('hidden');
        elements.sidebarIcon.classList.add('hidden');
    }
}

export async function initializeUserProfile(contentContainer) {
    // Helper to query within the modal's content container
    const get = (selector) => contentContainer.querySelector(selector);

    try {
        const res = await authFetch('/user/read');
        if (!res.ok) throw new Error('Failed to load user data');

        const data = await res.json();

        // Populate user data inside the modal
        get('#us-name').value = data.name ?? data.Name ?? '';
        get('#us-email').textContent = data.email ?? data.Email ?? '';
        get('#us-phone').value = data.phoneNumber ?? data.PhoneNumber ?? '';
        get('#us-user-id').textContent = data.id ?? data.UserId ?? '';
        get('#current-email').placeholder = data.email ?? data.Email ?? '';

        // Populate user name in the main sidebar as well
        document.querySelector('#us-name-sidebar').value = data.name ?? data.Name ?? 'User';
        document.querySelector('#us-name').textContent = data.name ?? data.Name ?? 'User';

        updateAvatarUI(data.avatarUrl);

        // Bind avatar upload events
        const trigger = get('#avatar-upload-trigger');
        const fileInput = get('#avatar-upload-file');

        trigger?.addEventListener('click', () => fileInput.click());
        fileInput?.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) return;

            // Preview image locally first
            const reader = new FileReader();
            reader.onload = e => updateAvatarUI(e.target.result);
            reader.readAsDataURL(file);

            // Trigger auto-save for avatar
            if (window.userSettingsAutoSave && typeof window.userSettingsAutoSave.autoSaveAvatar === 'function') {
                window.userSettingsAutoSave.autoSaveAvatar(file);
            } else {
                // Fallback to direct upload if auto-save is not available
                const uploadData = await uploadAvatar(file);
                if (uploadData) {
                    updateAvatarUI(uploadData.avatarUrl);
                }
            }
        });

    } catch (err) {
        console.error('Load user failed:', err);
    }
}

export async function handleProfileSave() {
    // We need to query the document here because this function might be called
    // from a context where `contentContainer` is not available.
    const get = (selector) => document.querySelector(selector);
    const payload = {
        name: get('#us-name')?.value?.trim(),
        phoneNumber: get('#us-phone')?.value?.trim(),
    };
    await authFetch('/user/update', { method: 'PUT', body: JSON.stringify(payload) });
}