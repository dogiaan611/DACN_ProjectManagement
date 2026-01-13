import { authFetch } from '../auth/auth.js';

export function initializePasswordModal(contentContainer) {
    const pwOpenBtn = contentContainer.querySelector('#us-password-btn');
    const pwBackdrop = contentContainer.querySelector('#modal-backdrop');
    const pwModal = contentContainer.querySelector('#password-modal');
    const pwCloseBtn = contentContainer.querySelector('#close-btn');
    const pwSubmit = contentContainer.querySelector('#submit-change');

    if (!pwModal || !pwBackdrop) return;

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

    pwOpenBtn?.addEventListener('click', openPw);
    pwCloseBtn?.addEventListener('click', closePw);
    pwBackdrop?.addEventListener('click', closePw);
    pwModal?.addEventListener('click', (e) => { if (e.target === pwModal) closePw(); });

    const escHandler = (e) => {
        if (e.key === 'Escape' && !pwModal.classList.contains('hidden')) closePw();
    };
    document.addEventListener('keydown', escHandler);

    // Cleanup listener when the main settings modal closes
    const mainModal = document.getElementById('settings-modal');
    const observer = new MutationObserver(() => {
        if (mainModal.classList.contains('hidden')) {
            document.removeEventListener('keydown', escHandler);
            observer.disconnect();
        }
    });
    observer.observe(mainModal, { attributes: true, attributeFilter: ['class'] });


    pwSubmit?.addEventListener('click', async (e) => {
        e.preventDefault();

        const pwCurrentInput = contentContainer.querySelector('#current-password');
        const pwNewInput = contentContainer.querySelector('#new-password');
        const pwConfirmInput = contentContainer.querySelector('#confirm-password');
        const pwErrorMsg = contentContainer.querySelector('#error-content');

        const currentPassword = pwCurrentInput.value.trim();
        const newPassword = pwNewInput.value.trim();
        const confirmPassword = pwConfirmInput.value.trim();
        pwErrorMsg.textContent = '';

        if (!currentPassword || !newPassword || !confirmPassword) {
            pwErrorMsg.textContent = 'Vui lòng nhập đầy đủ thông tin.';
            return;
        }
        if (newPassword !== confirmPassword) {
            pwErrorMsg.textContent = 'Mật khẩu mới không khớp.';
            return;
        }

        try {
            const res = await authFetch('/user/update-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();

            if (res.ok) {
                pwErrorMsg.classList.replace('text-red-500', 'text-green-500');
                pwErrorMsg.textContent = 'Đổi mật khẩu thành công.';
                setTimeout(closePw, 800);
            } else {
                pwErrorMsg.classList.replace('text-green-500', 'text-red-500');
                pwErrorMsg.textContent = data.message || 'Mật khẩu hiện tại không đúng.';
            }
        } catch (error) {
            pwErrorMsg.textContent = 'Đã xảy ra lỗi mạng. Vui lòng thử lại.';
        }
    });
}