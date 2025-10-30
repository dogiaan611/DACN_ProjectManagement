import { authFetch, clearToken } from './auth.js';

export function initializeDeleteAccountModal(contentContainer) {
    const dlOpenBtn = contentContainer.querySelector('#us-delete-btn');
    const dlBackdrop = contentContainer.querySelector('#modal-account-backdrop');
    const dlModal = contentContainer.querySelector('#delete-account-modal');
    const dlCloseBtn = contentContainer.querySelector('#cancel-btn');
    const confirmDeleteBtn = contentContainer.querySelector('#confirm-btn');

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

    dlOpenBtn?.addEventListener('click', openDM);
    dlCloseBtn?.addEventListener('click', closeDM);
    dlBackdrop?.addEventListener('click', closeDM);
    dlModal?.addEventListener('click', (e) => { if (e.target === dlModal) closeDM(); });

    const escHandler = (e) => {
        if (e.key === 'Escape' && !dlModal.classList.contains('hidden')) closeDM();
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

    const errorMsg = contentContainer.querySelector('#error-content-delete');
    confirmDeleteBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        const currentEmailInput = contentContainer.querySelector('#current-email');
        const emailValue = currentEmailInput.value.trim();
        if (!emailValue) {
            errorMsg.textContent = 'Vui lòng nhập email hiện tại của bạn.';
            return;
        }
        try {
            const res = await authFetch('/user/delete', {
                method: 'DELETE',
                body: JSON.stringify({ email: emailValue })
            });
            if (res.ok) {
                clearToken();
                window.location.href = '/goodbye.html';
            } else {
                const data = await res.json();
                errorMsg.textContent = data.message || 'Email không đúng.';
            }
        } catch (error) {
            errorMsg.textContent = 'Đã xảy ra lỗi mạng. Vui lòng thử lại.';
        }
    });
}